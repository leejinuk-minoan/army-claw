import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel

from openclaw.agent_plan_store import AgentPlanStore
from openclaw.agent_planner import ActionType
from openclaw.hwpx_tools import HwpxService
from openclaw.presentation_tools import PresentationService
from openclaw.workspace import WorkspaceError, WorkspaceService
from openclaw.xlsx_tools import XlsxService


ExecutionItemStatus = Literal["queued", "running", "succeeded", "failed", "skipped"]


class AgentExecutionQueueError(Exception):
    pass


class AgentExecutionSpec(BaseModel):
    kind: Literal["hwpx_create", "pptx_create", "xlsx_create"]
    workspace_root: str
    path: str
    title: str
    paragraphs: list[str]


class AgentExecutionQueueItem(BaseModel):
    step_id: str
    title: str
    detail: str
    action_type: ActionType
    status: ExecutionItemStatus = "queued"
    message: str = ""
    execution: AgentExecutionSpec | None = None


class AgentExecutionQueueResult(BaseModel):
    queue_id: str
    plan_id: str
    queued_count: int
    created_at: str
    items: list[AgentExecutionQueueItem]
    message: str


class AgentExecutionQueueService:
    def __init__(self, plan_store: AgentPlanStore | None = None, queue_root: Path | None = None) -> None:
        self.plan_store = plan_store or AgentPlanStore()
        self.queue_root = queue_root or self._default_queue_root()

    def queue_approved_steps(self, plan_id: str, workspace_root: str = "") -> AgentExecutionQueueResult:
        plan = self.plan_store.get_plan(plan_id)
        items = [
            AgentExecutionQueueItem(
                step_id=step.step_id,
                title=step.title,
                detail=step.detail,
                action_type=step.action_type,
                execution=self._build_execution_spec(
                    step.step_id,
                    step.title,
                    step.detail,
                    step.action_type,
                    workspace_root,
                ),
            )
            for step in plan.steps
            if step.status == "approved"
        ]
        result = AgentExecutionQueueResult(
            queue_id=uuid4().hex,
            plan_id=plan_id,
            queued_count=len(items),
            created_at=datetime.now(timezone.utc).isoformat(),
            items=items,
            message=f"{len(items)} approved step(s) queued.",
        )
        self._write_queue(result)
        return result

    def get_queue(self, queue_id: str) -> AgentExecutionQueueResult:
        path = self._queue_path(queue_id)
        if not path.is_file():
            raise AgentExecutionQueueError(f"execution queue was not found: {queue_id}")
        return AgentExecutionQueueResult.model_validate_json(path.read_text(encoding="utf-8"))

    def run_queue(self, queue_id: str) -> AgentExecutionQueueResult:
        queue = self.get_queue(queue_id)
        for item in queue.items:
            if item.status != "queued":
                continue
            if item.action_type == "manual":
                item.status = "succeeded"
                item.message = "수동 확인 단계로 기록했습니다. PC 조작은 수행하지 않았습니다."
            elif item.execution and item.execution.kind == "hwpx_create":
                self._run_hwpx_create(item.execution)
                item.status = "succeeded"
                item.message = f"HWPX 문서를 생성했습니다: {item.execution.path}"
            elif item.execution and item.execution.kind == "pptx_create":
                self._run_pptx_create(item.execution)
                item.status = "succeeded"
                item.message = f"PPTX 문서를 생성했습니다: {item.execution.path}"
            elif item.execution and item.execution.kind == "xlsx_create":
                self._run_xlsx_create(item.execution)
                item.status = "succeeded"
                item.message = f"XLSX 문서를 생성했습니다: {item.execution.path}"
            else:
                item.status = "skipped"
                item.message = f"아직 지원하지 않는 실행 유형입니다: {item.action_type}"
            if item.status == "succeeded":
                self.plan_store.update_step_status(queue.plan_id, item.step_id, "executed")
        self._write_queue(queue)
        return queue

    def _build_execution_spec(
        self,
        step_id: str,
        title: str,
        detail: str,
        action_type: ActionType,
        workspace_root: str,
    ) -> AgentExecutionSpec | None:
        text = f"{title} {detail}".upper()
        if action_type != "document":
            return None
        if not workspace_root:
            return None
        if "HWPX" in text:
            return AgentExecutionSpec(
                kind="hwpx_create",
                workspace_root=workspace_root,
                path=f"army-claw-output/{step_id}.hwpx",
                title=title,
                paragraphs=[detail],
            )
        if "PPTX" in text or "PPT" in text:
            return AgentExecutionSpec(
                kind="pptx_create",
                workspace_root=workspace_root,
                path=f"army-claw-output/{step_id}.pptx",
                title=title,
                paragraphs=[detail],
            )
        if "XLSX" in text or "한셀" in f"{title} {detail}" or "엑셀" in f"{title} {detail}":
            return AgentExecutionSpec(
                kind="xlsx_create",
                workspace_root=workspace_root,
                path=f"army-claw-output/{step_id}.xlsx",
                title=title,
                paragraphs=[detail],
            )
        return AgentExecutionSpec(
            kind="hwpx_create",
            workspace_root=workspace_root,
            path=f"army-claw-output/{step_id}.hwpx",
            title=title,
            paragraphs=[detail],
        )

    def _run_hwpx_create(self, spec: AgentExecutionSpec) -> None:
        try:
            service = HwpxService(WorkspaceService(Path(spec.workspace_root)))
            service.create_document(spec.path, spec.title, spec.paragraphs)
        except WorkspaceError as exc:
            raise AgentExecutionQueueError(str(exc)) from exc

    def _run_pptx_create(self, spec: AgentExecutionSpec) -> None:
        try:
            service = PresentationService(WorkspaceService(Path(spec.workspace_root)))
            subtitle = "\n".join(spec.paragraphs)
            service.create_presentation(spec.path, spec.title, subtitle)
        except WorkspaceError as exc:
            raise AgentExecutionQueueError(str(exc)) from exc

    def _run_xlsx_create(self, spec: AgentExecutionSpec) -> None:
        try:
            service = XlsxService(WorkspaceService(Path(spec.workspace_root)))
            rows = [["항목", "내용"], [spec.title, "\n".join(spec.paragraphs)]]
            service.create_workbook(spec.path, rows=rows)
        except WorkspaceError as exc:
            raise AgentExecutionQueueError(str(exc)) from exc

    def _write_queue(self, result: AgentExecutionQueueResult) -> None:
        self.queue_root.mkdir(parents=True, exist_ok=True)
        self._queue_path(result.queue_id).write_text(
            json.dumps(result.model_dump(), indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

    def _queue_path(self, queue_id: str) -> Path:
        return self.queue_root / f"{self._sanitize_id(queue_id)}.json"

    def _sanitize_id(self, value: str) -> str:
        sanitized = re.sub(r"[^A-Za-z0-9_.-]+", "-", value).strip(".-").lower()
        if not sanitized:
            raise AgentExecutionQueueError("execution queue id is empty")
        return sanitized

    def _default_queue_root(self) -> Path:
        configured = os.environ.get("ARMY_CLAW_EXECUTION_QUEUE_STORE")
        if configured:
            return Path(configured)
        return Path(os.environ.get("LOCALAPPDATA", str(Path.home()))) / "ArmyClaw" / "execution-queues"

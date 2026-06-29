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


ExecutionItemStatus = Literal["queued", "running", "succeeded", "failed", "skipped"]


class AgentExecutionQueueError(Exception):
    pass


class AgentExecutionQueueItem(BaseModel):
    step_id: str
    title: str
    detail: str
    action_type: ActionType
    status: ExecutionItemStatus = "queued"
    message: str = ""


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

    def queue_approved_steps(self, plan_id: str) -> AgentExecutionQueueResult:
        plan = self.plan_store.get_plan(plan_id)
        items = [
            AgentExecutionQueueItem(
                step_id=step.step_id,
                title=step.title,
                detail=step.detail,
                action_type=step.action_type,
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

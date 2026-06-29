import json
import os
import re
from pathlib import Path
from uuid import uuid4

from pydantic import BaseModel

from openclaw.agent_planner import AgentPlanResult, StepStatus


class AgentPlanStoreError(Exception):
    pass


class StoredAgentPlan(AgentPlanResult):
    plan_id: str


class StepStatusRequest(BaseModel):
    status: StepStatus


class AgentPlanStore:
    def __init__(self, store_root: Path | None = None) -> None:
        self.store_root = store_root or self._default_store_root()

    def save_plan(self, plan: AgentPlanResult) -> StoredAgentPlan:
        stored = StoredAgentPlan(plan_id=uuid4().hex, **plan.model_dump())
        self._write_plan(stored)
        return stored

    def get_plan(self, plan_id: str) -> StoredAgentPlan:
        path = self._plan_path(plan_id)
        if not path.is_file():
            raise AgentPlanStoreError(f"agent plan was not found: {plan_id}")
        return StoredAgentPlan.model_validate_json(path.read_text(encoding="utf-8-sig"))

    def update_step_status(self, plan_id: str, step_id: str, status: StepStatus) -> StoredAgentPlan:
        stored = self.get_plan(plan_id)
        for step in stored.steps:
            if step.step_id == step_id:
                step.status = status
                self._write_plan(stored)
                return stored
        raise AgentPlanStoreError(f"agent plan step was not found: {step_id}")

    def _write_plan(self, plan: StoredAgentPlan) -> None:
        self.store_root.mkdir(parents=True, exist_ok=True)
        self._plan_path(plan.plan_id).write_text(
            json.dumps(plan.model_dump(), indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

    def _plan_path(self, plan_id: str) -> Path:
        return self.store_root / f"{self._sanitize_id(plan_id)}.json"

    def _sanitize_id(self, value: str) -> str:
        sanitized = re.sub(r"[^A-Za-z0-9_.-]+", "-", value).strip(".-").lower()
        if not sanitized:
            raise AgentPlanStoreError("agent plan id is empty")
        return sanitized

    def _default_store_root(self) -> Path:
        configured = os.environ.get("ARMY_CLAW_PLAN_STORE")
        if configured:
            return Path(configured)
        return Path(os.environ.get("LOCALAPPDATA", str(Path.home()))) / "ArmyClaw" / "agent-plans"

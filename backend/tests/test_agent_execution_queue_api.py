from fastapi.testclient import TestClient

from openclaw.agent_plan_store import AgentPlanStore
from openclaw.agent_planner import AgentPlanResult, AgentPlanStep
from openclaw.main import create_app


def test_execution_queue_api_queues_only_approved_steps(tmp_path, monkeypatch):
    plan_root = tmp_path / "plans"
    queue_root = tmp_path / "queues"
    monkeypatch.setenv("ARMY_CLAW_PLAN_STORE", str(plan_root))
    monkeypatch.setenv("ARMY_CLAW_EXECUTION_QUEUE_STORE", str(queue_root))
    plan_store = AgentPlanStore(store_root=plan_root)
    saved = plan_store.save_plan(
        AgentPlanResult(
            task="월간 보고서",
            executed=True,
            prompt="prompt",
            plan="1. 확인\n2. 작성",
            steps=[
                AgentPlanStep(
                    step_id="step-1",
                    title="확인",
                    detail="확인",
                    action_type="manual",
                ),
                AgentPlanStep(
                    step_id="step-2",
                    title="작성",
                    detail="작성",
                    action_type="document",
                    requires_approval=True,
                ),
            ],
            used_skills=[],
            message="created",
        )
    )
    plan_store.update_step_status(saved.plan_id, "step-2", "approved")
    client = TestClient(create_app())

    response = client.post(f"/api/agent/plans/{saved.plan_id}/execution-queue")

    assert response.status_code == 200
    payload = response.json()
    assert payload["plan_id"] == saved.plan_id
    assert payload["queued_count"] == 1
    assert payload["items"][0]["step_id"] == "step-2"
    assert payload["items"][0]["status"] == "queued"


def test_execution_queue_run_api_marks_manual_step_succeeded(tmp_path, monkeypatch):
    plan_root = tmp_path / "plans"
    queue_root = tmp_path / "queues"
    monkeypatch.setenv("ARMY_CLAW_PLAN_STORE", str(plan_root))
    monkeypatch.setenv("ARMY_CLAW_EXECUTION_QUEUE_STORE", str(queue_root))
    plan_store = AgentPlanStore(store_root=plan_root)
    saved = plan_store.save_plan(
        AgentPlanResult(
            task="월간 보고서",
            executed=True,
            prompt="prompt",
            plan="1. 확인",
            steps=[
                AgentPlanStep(
                    step_id="step-1",
                    title="확인",
                    detail="확인",
                    action_type="manual",
                ),
            ],
            used_skills=[],
            message="created",
        )
    )
    plan_store.update_step_status(saved.plan_id, "step-1", "approved")
    client = TestClient(create_app())
    queued = client.post(f"/api/agent/plans/{saved.plan_id}/execution-queue").json()

    response = client.post(f"/api/agent/execution-queues/{queued['queue_id']}/run")

    assert response.status_code == 200
    payload = response.json()
    assert payload["items"][0]["status"] == "succeeded"
    assert "수동 확인" in payload["items"][0]["message"]

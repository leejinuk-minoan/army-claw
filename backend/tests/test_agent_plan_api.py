from fastapi.testclient import TestClient

from openclaw.agent_plan_store import AgentPlanStore
from openclaw.agent_planner import AgentPlanResult, AgentPlanStep
from openclaw.main import create_app


def test_agent_plan_status_api_updates_saved_step(tmp_path, monkeypatch):
    store_root = tmp_path / "plans"
    monkeypatch.setenv("ARMY_CLAW_PLAN_STORE", str(store_root))
    store = AgentPlanStore(store_root=store_root)
    saved = store.save_plan(
        AgentPlanResult(
            task="월간 보고서",
            executed=True,
            prompt="prompt",
            plan="1. HWPX 초안을 작성한다.",
            steps=[
                AgentPlanStep(
                    step_id="step-1",
                    title="HWPX 초안을 작성한다.",
                    detail="HWPX 초안을 작성한다.",
                    action_type="document",
                    requires_approval=True,
                )
            ],
            used_skills=[],
            message="created",
        )
    )
    client = TestClient(create_app())

    response = client.post(
        f"/api/agent/plans/{saved.plan_id}/steps/step-1/status",
        json={"status": "approved"},
    )

    assert response.status_code == 200
    assert response.json()["steps"][0]["status"] == "approved"
    assert store.get_plan(saved.plan_id).steps[0].status == "approved"

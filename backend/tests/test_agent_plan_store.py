from openclaw.agent_plan_store import AgentPlanStore, AgentPlanStoreError
from openclaw.agent_planner import AgentPlanResult, AgentPlanStep


def make_plan() -> AgentPlanResult:
    return AgentPlanResult(
        task="월간 보고서를 만들어줘",
        executed=True,
        prompt="prompt",
        plan="1. 보고서를 작성한다.",
        steps=[
            AgentPlanStep(
                step_id="step-1",
                title="보고서를 작성한다.",
                detail="보고서를 작성한다.",
                action_type="document",
                requires_approval=True,
            )
        ],
        used_skills=[],
        message="created",
    )


def test_save_plan_assigns_plan_id_and_persists_steps(tmp_path):
    store = AgentPlanStore(store_root=tmp_path / "plans")

    saved = store.save_plan(make_plan())

    assert saved.plan_id
    assert saved.steps[0].status == "pending"
    assert store.get_plan(saved.plan_id).steps[0].title == "보고서를 작성한다."


def test_update_step_status_persists_approval(tmp_path):
    store = AgentPlanStore(store_root=tmp_path / "plans")
    saved = store.save_plan(make_plan())

    updated = store.update_step_status(saved.plan_id, "step-1", "approved")

    assert updated.steps[0].status == "approved"
    assert store.get_plan(saved.plan_id).steps[0].status == "approved"


def test_update_step_status_rejects_unknown_step(tmp_path):
    store = AgentPlanStore(store_root=tmp_path / "plans")
    saved = store.save_plan(make_plan())

    try:
        store.update_step_status(saved.plan_id, "step-404", "approved")
    except AgentPlanStoreError as exc:
        assert "step-404" in str(exc)
    else:
        raise AssertionError("unknown step should fail")


def test_get_plan_accepts_utf8_bom_json(tmp_path):
    store = AgentPlanStore(store_root=tmp_path / "plans")
    saved = store.save_plan(make_plan())
    plan_path = store._plan_path(saved.plan_id)
    plan_path.write_text(plan_path.read_text(encoding="utf-8"), encoding="utf-8-sig")

    loaded = store.get_plan(saved.plan_id)

    assert loaded.plan_id == saved.plan_id
    assert loaded.steps[0].step_id == "step-1"

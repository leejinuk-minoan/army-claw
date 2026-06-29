from openclaw.agent_execution_queue import AgentExecutionQueueService
from openclaw.agent_plan_store import AgentPlanStore
from openclaw.agent_planner import AgentPlanResult, AgentPlanStep


def make_plan() -> AgentPlanResult:
    return AgentPlanResult(
        task="월간 보고서를 만들어줘",
        executed=True,
        prompt="prompt",
        plan="1. 자료를 확인한다.\n2. HWPX 초안을 작성한다.\n3. 삭제 작업은 보류한다.",
        steps=[
            AgentPlanStep(
                step_id="step-1",
                title="자료를 확인한다.",
                detail="자료를 확인한다.",
                action_type="manual",
                requires_approval=False,
            ),
            AgentPlanStep(
                step_id="step-2",
                title="HWPX 초안을 작성한다.",
                detail="HWPX 초안을 작성한다.",
                action_type="document",
                requires_approval=True,
            ),
            AgentPlanStep(
                step_id="step-3",
                title="삭제 작업은 보류한다.",
                detail="삭제 작업은 보류한다.",
                action_type="file",
                requires_approval=True,
            ),
        ],
        used_skills=[],
        message="created",
    )


def test_queue_approved_steps_includes_only_approved_steps(tmp_path):
    plan_store = AgentPlanStore(store_root=tmp_path / "plans")
    saved = plan_store.save_plan(make_plan())
    plan_store.update_step_status(saved.plan_id, "step-2", "approved")
    plan_store.update_step_status(saved.plan_id, "step-3", "blocked")
    service = AgentExecutionQueueService(plan_store=plan_store, queue_root=tmp_path / "queues")

    result = service.queue_approved_steps(saved.plan_id)

    assert result.plan_id == saved.plan_id
    assert result.queued_count == 1
    assert result.items[0].step_id == "step-2"
    assert result.items[0].status == "queued"
    assert result.items[0].action_type == "document"


def test_queue_approved_steps_persists_queue_file(tmp_path):
    plan_store = AgentPlanStore(store_root=tmp_path / "plans")
    saved = plan_store.save_plan(make_plan())
    plan_store.update_step_status(saved.plan_id, "step-2", "approved")
    service = AgentExecutionQueueService(plan_store=plan_store, queue_root=tmp_path / "queues")

    result = service.queue_approved_steps(saved.plan_id)

    assert result.queue_id
    assert service.get_queue(result.queue_id).items[0].title == "HWPX 초안을 작성한다."


def test_run_queue_marks_manual_steps_succeeded_and_unsupported_steps_skipped(tmp_path):
    plan_store = AgentPlanStore(store_root=tmp_path / "plans")
    saved = plan_store.save_plan(make_plan())
    plan_store.update_step_status(saved.plan_id, "step-1", "approved")
    plan_store.update_step_status(saved.plan_id, "step-2", "approved")
    service = AgentExecutionQueueService(plan_store=plan_store, queue_root=tmp_path / "queues")
    queued = service.queue_approved_steps(saved.plan_id)

    result = service.run_queue(queued.queue_id)

    assert [item.status for item in result.items] == ["succeeded", "skipped"]
    assert "수동 확인" in result.items[0].message
    assert "아직 지원하지 않는 실행 유형" in result.items[1].message
    assert service.get_queue(queued.queue_id).items[0].status == "succeeded"

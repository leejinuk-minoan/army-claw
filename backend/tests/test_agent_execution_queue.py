from openclaw.agent_execution_queue import AgentExecutionQueueService
from openclaw.agent_plan_store import AgentPlanStore
from openclaw.agent_planner import AgentPlanResult, AgentPlanStep
from openclaw.hwpx_tools import HwpxService
from openclaw.presentation_tools import PresentationService
from openclaw.workspace import WorkspaceService
from openclaw.xlsx_tools import XlsxService


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


def test_run_queue_creates_hwpx_document_for_document_execution_schema(tmp_path):
    workspace = tmp_path / "workspace"
    workspace.mkdir()
    plan_store = AgentPlanStore(store_root=tmp_path / "plans")
    saved = plan_store.save_plan(make_plan())
    plan_store.update_step_status(saved.plan_id, "step-2", "approved")
    service = AgentExecutionQueueService(plan_store=plan_store, queue_root=tmp_path / "queues")
    queued = service.queue_approved_steps(saved.plan_id, workspace_root=str(workspace))

    result = service.run_queue(queued.queue_id)

    assert result.items[0].status == "succeeded"
    assert result.items[0].execution is not None
    assert result.items[0].execution.kind == "hwpx_create"
    summary = HwpxService(WorkspaceService(workspace)).summarize_document("army-claw-output/step-2.hwpx")
    assert summary.paragraphs == ["HWPX 초안을 작성한다."]


def test_run_queue_marks_plan_step_executed_after_success(tmp_path):
    workspace = tmp_path / "workspace"
    workspace.mkdir()
    plan_store = AgentPlanStore(store_root=tmp_path / "plans")
    saved = plan_store.save_plan(make_plan())
    plan_store.update_step_status(saved.plan_id, "step-2", "approved")
    service = AgentExecutionQueueService(plan_store=plan_store, queue_root=tmp_path / "queues")
    queued = service.queue_approved_steps(saved.plan_id, workspace_root=str(workspace))

    service.run_queue(queued.queue_id)

    assert plan_store.get_plan(saved.plan_id).steps[1].status == "executed"


def test_run_queue_creates_pptx_for_presentation_execution_schema(tmp_path):
    workspace = tmp_path / "workspace"
    workspace.mkdir()
    plan_store = AgentPlanStore(store_root=tmp_path / "plans")
    saved = plan_store.save_plan(
        AgentPlanResult(
            task="발표자료를 만들어줘",
            executed=True,
            prompt="prompt",
            plan="1. PPTX 초안을 작성한다.",
            steps=[
                AgentPlanStep(
                    step_id="step-1",
                    title="PPTX 초안 작성",
                    detail="PPTX 초안을 작성한다.",
                    action_type="document",
                    requires_approval=True,
                )
            ],
            used_skills=[],
            message="created",
        )
    )
    plan_store.update_step_status(saved.plan_id, "step-1", "approved")
    service = AgentExecutionQueueService(plan_store=plan_store, queue_root=tmp_path / "queues")
    queued = service.queue_approved_steps(saved.plan_id, workspace_root=str(workspace))

    result = service.run_queue(queued.queue_id)

    assert result.items[0].status == "succeeded"
    assert result.items[0].execution is not None
    assert result.items[0].execution.kind == "pptx_create"
    summary = PresentationService(WorkspaceService(workspace)).summarize_presentation("army-claw-output/step-1.pptx")
    assert summary.slide_count == 1


def test_run_queue_creates_xlsx_for_spreadsheet_execution_schema(tmp_path):
    workspace = tmp_path / "workspace"
    workspace.mkdir()
    plan_store = AgentPlanStore(store_root=tmp_path / "plans")
    saved = plan_store.save_plan(
        AgentPlanResult(
            task="한셀 표를 만들어줘",
            executed=True,
            prompt="prompt",
            plan="1. XLSX 초안을 작성한다.",
            steps=[
                AgentPlanStep(
                    step_id="step-1",
                    title="XLSX 초안 작성",
                    detail="XLSX 초안을 작성한다.",
                    action_type="document",
                    requires_approval=True,
                )
            ],
            used_skills=[],
            message="created",
        )
    )
    plan_store.update_step_status(saved.plan_id, "step-1", "approved")
    service = AgentExecutionQueueService(plan_store=plan_store, queue_root=tmp_path / "queues")
    queued = service.queue_approved_steps(saved.plan_id, workspace_root=str(workspace))

    result = service.run_queue(queued.queue_id)

    assert result.items[0].status == "succeeded"
    assert result.items[0].execution is not None
    assert result.items[0].execution.kind == "xlsx_create"
    summary = XlsxService(WorkspaceService(workspace)).summarize_workbook("army-claw-output/step-1.xlsx")
    assert summary.sheets[0].name == "Sheet1"

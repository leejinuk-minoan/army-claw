import os
import sys
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from openclaw.agent_execution_queue import AgentExecutionQueueError, AgentExecutionQueueService
from openclaw.agent_plan_store import AgentPlanStore, AgentPlanStoreError, StepStatusRequest
from openclaw.agent_planner import AgentPlannerService, AgentPlanRequest
from openclaw.config import AppConfig
from openclaw.hancom_environment import HancomEnvironmentService
from openclaw.health import run_health_check
from openclaw.hwpx_tools import HwpxService
from openclaw.local_llm_bundle import LocalLlmBundleError, LocalLlmBundleRequest, LocalLlmBundleService
from openclaw.presentation_tools import PresentationService
from openclaw.skill_registry import SkillEnabledRequest, SkillRegistryError, SkillRegistryService
from openclaw.workspace import WorkspaceError, WorkspaceService
from openclaw.xlsx_tools import XlsxService


class WorkspaceRequest(BaseModel):
    workspace_root: str
    path: str = "."


class FileWriteRequest(BaseModel):
    workspace_root: str
    path: str
    content: str
    approved: bool = False


class CommandRequest(BaseModel):
    workspace_root: str
    command: str
    approved: bool = False


class LocalLlmDiagnoseRequest(BaseModel):
    model: str = "gemma3:12b"
    ollama_base_url: str = "http://127.0.0.1:11434"


class XlsxRequest(BaseModel):
    workspace_root: str
    path: str
    sheet: str = ""


class XlsxCellWriteRequest(BaseModel):
    workspace_root: str
    path: str
    sheet: str
    cell: str
    value: str | int | float | bool | None


class FormulaRequest(BaseModel):
    function_name: str
    cell_range: str


class PivotRequest(BaseModel):
    workspace_root: str
    path: str
    sheet: str
    group_by_column: str
    value_column: str


class ChartRequest(BaseModel):
    workspace_root: str
    path: str
    sheet: str
    data_range: str
    chart_cell: str = "H2"
    title: str = "Army Claw Chart"


class PresentationRequest(BaseModel):
    workspace_root: str
    path: str


class CreatePresentationRequest(BaseModel):
    workspace_root: str
    path: str
    title: str
    subtitle: str = ""


class BulletSlideRequest(BaseModel):
    workspace_root: str
    path: str
    title: str
    bullets: list[str]


class HwpxRequest(BaseModel):
    workspace_root: str
    path: str


class CreateHwpxRequest(BaseModel):
    workspace_root: str
    path: str
    title: str
    paragraphs: list[str]


class HwpxParagraphRequest(BaseModel):
    workspace_root: str
    path: str
    paragraph: str


def _frontend_static_dir() -> Path | None:
    configured = os.environ.get("ARMY_CLAW_WEB_DIR")
    candidates: list[Path] = []
    if configured:
        candidates.append(Path(configured))
    if hasattr(sys, "_MEIPASS"):
        candidates.append(Path(sys._MEIPASS) / "openclaw" / "web")
    candidates.extend(
        [
            Path(__file__).resolve().parent / "web",
            Path(__file__).resolve().parents[2] / "frontend" / "dist",
        ]
    )
    for candidate in candidates:
        if (candidate / "index.html").is_file():
            return candidate
    return None


def create_app() -> FastAPI:
    app = FastAPI(title="Army Claw", version="0.1.0")
    config = AppConfig()

    @app.get("/api/status")
    def status() -> dict[str, str]:
        return {"status": "ok", "app": "Army Claw"}

    @app.get("/api/health")
    async def health() -> dict:
        result = await run_health_check(config)
        return result.model_dump()

    @app.post("/api/workspace/list")
    def list_workspace_files(request: WorkspaceRequest) -> dict:
        try:
            service = WorkspaceService(root=Path(request.workspace_root))
            return {"entries": [entry.model_dump() for entry in service.list_files(request.path)]}
        except WorkspaceError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.post("/api/workspace/read")
    def read_workspace_file(request: WorkspaceRequest) -> dict:
        try:
            service = WorkspaceService(root=Path(request.workspace_root))
            return service.read_file(request.path).model_dump()
        except WorkspaceError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.post("/api/workspace/write")
    def write_workspace_file(request: FileWriteRequest) -> dict:
        try:
            service = WorkspaceService(root=Path(request.workspace_root))
            return service.write_file(request.path, request.content, request.approved).model_dump()
        except WorkspaceError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.post("/api/workspace/command")
    def run_workspace_command(request: CommandRequest) -> dict:
        try:
            service = WorkspaceService(root=Path(request.workspace_root))
            return service.run_powershell(request.command, request.approved).model_dump()
        except WorkspaceError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.post("/api/local-llm/run")
    def run_local_llm_bundle(request: LocalLlmBundleRequest) -> dict:
        try:
            return LocalLlmBundleService().run(request).model_dump()
        except LocalLlmBundleError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.post("/api/local-llm/diagnose")
    def diagnose_local_llm_bundle(request: LocalLlmDiagnoseRequest) -> dict:
        return LocalLlmBundleService().diagnose(request.model, request.ollama_base_url).model_dump()

    @app.get("/api/hancom/status")
    def hancom_status() -> dict:
        return HancomEnvironmentService().detect().model_dump()

    @app.get("/api/skills")
    def list_skills() -> dict:
        return {"skills": [skill.model_dump() for skill in SkillRegistryService().list_skills()]}

    @app.post("/api/skills/import")
    async def import_skill(filename: str, request: Request) -> dict:
        try:
            payload = await request.body()
            return SkillRegistryService().import_zip(filename, payload).model_dump()
        except SkillRegistryError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.post("/api/skills/{skill_id}/enabled")
    def set_skill_enabled(skill_id: str, request: SkillEnabledRequest) -> dict:
        try:
            return SkillRegistryService().set_enabled(skill_id, request.enabled).model_dump()
        except SkillRegistryError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc

    @app.delete("/api/skills/{skill_id}")
    def delete_skill(skill_id: str) -> dict:
        try:
            return SkillRegistryService().delete_skill(skill_id)
        except SkillRegistryError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc

    @app.post("/api/agent/plan")
    async def preview_agent_plan(request: AgentPlanRequest) -> dict:
        result = await AgentPlannerService(config=config).create_plan(request)
        if request.execute:
            return AgentPlanStore().save_plan(result).model_dump()
        return result.model_dump()

    @app.post("/api/agent/plans/{plan_id}/steps/{step_id}/status")
    def set_agent_plan_step_status(plan_id: str, step_id: str, request: StepStatusRequest) -> dict:
        try:
            return AgentPlanStore().update_step_status(plan_id, step_id, request.status).model_dump()
        except AgentPlanStoreError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc

    @app.post("/api/agent/plans/{plan_id}/execution-queue")
    def queue_agent_plan_approved_steps(plan_id: str) -> dict:
        try:
            return AgentExecutionQueueService().queue_approved_steps(plan_id).model_dump()
        except (AgentPlanStoreError, AgentExecutionQueueError) as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc

    @app.post("/api/xlsx/summary")
    def summarize_xlsx(request: XlsxRequest) -> dict:
        try:
            service = XlsxService(WorkspaceService(root=Path(request.workspace_root)))
            return service.summarize_workbook(request.path).model_dump()
        except (WorkspaceError, KeyError) as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.post("/api/xlsx/preview")
    def preview_xlsx(request: XlsxRequest) -> dict:
        try:
            service = XlsxService(WorkspaceService(root=Path(request.workspace_root)))
            return service.preview_sheet(request.path, request.sheet).model_dump()
        except (WorkspaceError, KeyError) as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.post("/api/xlsx/write-cell")
    def write_xlsx_cell(request: XlsxCellWriteRequest) -> dict:
        try:
            service = XlsxService(WorkspaceService(root=Path(request.workspace_root)))
            return service.write_cell(request.path, request.sheet, request.cell, request.value).model_dump()
        except (WorkspaceError, KeyError) as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.post("/api/xlsx/formula")
    def suggest_xlsx_formula(request: FormulaRequest) -> dict:
        try:
            service = XlsxService(WorkspaceService(root=Path.cwd()))
            return service.suggest_formula(request.function_name, request.cell_range).model_dump()
        except WorkspaceError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.post("/api/xlsx/pivot-summary")
    def summarize_xlsx_pivot(request: PivotRequest) -> dict:
        try:
            service = XlsxService(WorkspaceService(root=Path(request.workspace_root)))
            return service.pivot_summary(
                request.path,
                request.sheet,
                request.group_by_column,
                request.value_column,
            ).model_dump()
        except (WorkspaceError, KeyError) as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.post("/api/xlsx/add-chart")
    def add_xlsx_chart(request: ChartRequest) -> dict:
        try:
            service = XlsxService(WorkspaceService(root=Path(request.workspace_root)))
            return service.add_bar_chart(
                request.path,
                request.sheet,
                request.data_range,
                request.chart_cell,
                request.title,
            ).model_dump()
        except (WorkspaceError, KeyError) as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.post("/api/presentation/create")
    def create_presentation(request: CreatePresentationRequest) -> dict:
        try:
            service = PresentationService(WorkspaceService(root=Path(request.workspace_root)))
            return service.create_presentation(request.path, request.title, request.subtitle).model_dump()
        except WorkspaceError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.post("/api/presentation/summary")
    def summarize_presentation(request: PresentationRequest) -> dict:
        try:
            service = PresentationService(WorkspaceService(root=Path(request.workspace_root)))
            return service.summarize_presentation(request.path).model_dump()
        except WorkspaceError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.post("/api/presentation/add-title-slide")
    def add_title_slide(request: CreatePresentationRequest) -> dict:
        try:
            service = PresentationService(WorkspaceService(root=Path(request.workspace_root)))
            return service.add_title_slide(request.path, request.title, request.subtitle).model_dump()
        except WorkspaceError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.post("/api/presentation/add-bullet-slide")
    def add_bullet_slide(request: BulletSlideRequest) -> dict:
        try:
            service = PresentationService(WorkspaceService(root=Path(request.workspace_root)))
            return service.add_bullet_slide(request.path, request.title, request.bullets).model_dump()
        except WorkspaceError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.post("/api/presentation/show-compatibility")
    def show_compatibility(request: PresentationRequest) -> dict:
        try:
            service = PresentationService(WorkspaceService(root=Path(request.workspace_root)))
            return service.show_compatibility_note(request.path).model_dump()
        except WorkspaceError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.post("/api/hwpx/create")
    def create_hwpx(request: CreateHwpxRequest) -> dict:
        try:
            service = HwpxService(WorkspaceService(root=Path(request.workspace_root)))
            return service.create_document(request.path, request.title, request.paragraphs).model_dump()
        except WorkspaceError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.post("/api/hwpx/summary")
    def summarize_hwpx(request: HwpxRequest) -> dict:
        try:
            service = HwpxService(WorkspaceService(root=Path(request.workspace_root)))
            return service.summarize_document(request.path).model_dump()
        except WorkspaceError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.post("/api/hwpx/add-paragraph")
    def add_hwpx_paragraph(request: HwpxParagraphRequest) -> dict:
        try:
            service = HwpxService(WorkspaceService(root=Path(request.workspace_root)))
            return service.add_paragraph(request.path, request.paragraph).model_dump()
        except WorkspaceError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.post("/api/hwpx/compatibility")
    def hwpx_compatibility(request: HwpxRequest) -> dict:
        try:
            service = HwpxService(WorkspaceService(root=Path(request.workspace_root)))
            return service.compatibility_note(request.path).model_dump()
        except WorkspaceError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    static_dir = _frontend_static_dir()
    if static_dir is not None:
        app.mount("/", StaticFiles(directory=static_dir, html=True), name="frontend")

    return app


app = create_app()

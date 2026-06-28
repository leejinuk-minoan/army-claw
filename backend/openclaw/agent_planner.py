import re
from typing import Literal

from pydantic import BaseModel

from openclaw.config import AppConfig
from openclaw.providers.base import LLMProvider
from openclaw.providers.ollama import OllamaProvider
from openclaw.providers.openai_compatible import OpenAICompatibleProvider
from openclaw.skill_registry import SkillContextItem, SkillRegistryService


ActionType = Literal["manual", "file", "command", "document"]
StepStatus = Literal["pending", "approved", "executed", "blocked"]


class AgentPlanRequest(BaseModel):
    task: str
    execute: bool = False


class AgentPlanStep(BaseModel):
    step_id: str
    title: str
    detail: str
    action_type: ActionType = "manual"
    requires_approval: bool = False
    status: StepStatus = "pending"


class AgentPlanResult(BaseModel):
    task: str
    executed: bool
    prompt: str
    plan: str = ""
    steps: list[AgentPlanStep] = []
    used_skills: list[SkillContextItem]
    message: str


class AgentPlannerService:
    def __init__(
        self,
        skill_registry: SkillRegistryService | None = None,
        provider: LLMProvider | None = None,
        config: AppConfig | None = None,
    ) -> None:
        self.skill_registry = skill_registry or SkillRegistryService()
        self.config = config or AppConfig()
        self.provider = provider or self._provider_from_config(self.config)

    def preview_plan(self, request: AgentPlanRequest) -> AgentPlanResult:
        skill_context = self.skill_registry.build_active_context()
        prompt = self._build_prompt(request.task, skill_context.context)
        return AgentPlanResult(
            task=request.task,
            executed=False,
            prompt=prompt,
            used_skills=skill_context.skills,
            message="작업 계획 미리보기입니다. 실제 LLM 호출이나 도구 실행은 아직 수행하지 않았습니다.",
        )

    async def create_plan(self, request: AgentPlanRequest) -> AgentPlanResult:
        preview = self.preview_plan(request)
        if not request.execute:
            return preview
        plan = await self.provider.generate(preview.prompt)
        return AgentPlanResult(
            task=preview.task,
            executed=True,
            prompt=preview.prompt,
            plan=plan,
            steps=self.structure_steps(plan),
            used_skills=preview.used_skills,
            message="LLM Provider가 활성 skill 컨텍스트를 반영해 작업 계획을 생성했습니다.",
        )

    def structure_steps(self, plan: str) -> list[AgentPlanStep]:
        raw_steps = self._split_numbered_steps(plan)
        return [
            AgentPlanStep(
                step_id=f"step-{index}",
                title=step,
                detail=step,
                action_type=self._classify_action_type(step),
                requires_approval=self._requires_approval(step),
            )
            for index, step in enumerate(raw_steps, start=1)
        ]

    def _split_numbered_steps(self, plan: str) -> list[str]:
        steps: list[str] = []
        for line in plan.splitlines():
            stripped = line.strip()
            match = re.match(r"^(?:\d+[\.\)]|[-*])\s*(.+)$", stripped)
            if match:
                steps.append(match.group(1).strip())
            elif steps and stripped:
                steps[-1] = f"{steps[-1]} {stripped}"
        return steps

    def _requires_approval(self, text: str) -> bool:
        markers = ["승인", "허용", "파일 변경", "명령 실행", "삭제", "실행"]
        return any(marker in text for marker in markers)

    def _classify_action_type(self, text: str) -> ActionType:
        if any(marker in text for marker in ["PowerShell", "명령", "실행"]):
            return "command"
        if any(marker in text for marker in ["HWPX", "문서", "보고서", "한글", "PPT", "XLSX"]):
            return "document"
        if any(marker in text for marker in ["파일", "저장", "쓰기", "수정"]):
            return "file"
        return "manual"

    def _build_prompt(self, task: str, skill_context: str) -> str:
        skill_block = skill_context or "활성화된 skill이 없습니다."
        return (
            "당신은 Army Claw 로컬 PC 작업 에이전트입니다.\n"
            "아래 활성 skill을 우선 참고해 작업 계획을 세우세요.\n\n"
            "[활성 Skill]\n"
            f"{skill_block}\n\n"
            "[사용자 작업]\n"
            f"{task}\n\n"
            "[응답 지침]\n"
            "1. 적용한 skill을 명시하세요.\n"
            "2. 안전한 작업 순서를 단계별로 작성하세요.\n"
            "3. 파일 변경이나 명령 실행이 필요하면 사용자 승인이 필요한 지점을 표시하세요."
        )

    def _provider_from_config(self, config: AppConfig) -> LLMProvider:
        provider_config = config.provider
        if provider_config.mode == "openai_compatible":
            return OpenAICompatibleProvider(
                api_base_url=provider_config.api_base_url,
                model=provider_config.model,
                api_key=provider_config.api_key,
                timeout_seconds=provider_config.timeout_seconds,
            )
        return OllamaProvider(
            base_url=provider_config.ollama_base_url,
            model=provider_config.model,
            timeout_seconds=provider_config.timeout_seconds,
        )

from pydantic import BaseModel

from openclaw.config import AppConfig
from openclaw.providers.base import LLMProvider
from openclaw.providers.ollama import OllamaProvider
from openclaw.providers.openai_compatible import OpenAICompatibleProvider
from openclaw.skill_registry import SkillContextItem, SkillRegistryService


class AgentPlanRequest(BaseModel):
    task: str
    execute: bool = False


class AgentPlanResult(BaseModel):
    task: str
    executed: bool
    prompt: str
    plan: str = ""
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
            used_skills=preview.used_skills,
            message="LLM Provider가 활성 skill 컨텍스트를 반영해 작업 계획을 생성했습니다.",
        )

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

import pytest

from openclaw.agent_planner import AgentPlannerService, AgentPlanRequest
from openclaw.skill_registry import SkillRegistryService


class FakeProvider:
    def __init__(self) -> None:
        self.prompt = ""

    async def generate(self, prompt: str) -> str:
        self.prompt = prompt
        return (
            "1. 보고서 skill을 적용한다.\n"
            "2. 월간 데이터를 수집한다. 사용자 승인이 필요합니다.\n"
            "3. HWPX 초안을 작성한다. 파일 변경 승인이 필요합니다."
        )


def test_agent_plan_preview_does_not_call_provider(tmp_path):
    service = AgentPlannerService(skill_registry=SkillRegistryService(store_root=tmp_path / "skills"))

    result = service.preview_plan(AgentPlanRequest(task="월간 보고서를 만들어줘", execute=False))

    assert result.executed is False
    assert result.plan == ""
    assert result.steps == []
    assert "월간 보고서를 만들어줘" in result.prompt


@pytest.mark.asyncio
async def test_agent_plan_execute_calls_provider_with_skill_prompt(tmp_path):
    registry = SkillRegistryService(store_root=tmp_path / "skills")
    skill_zip = tmp_path / "report-skill.zip"
    import zipfile

    with zipfile.ZipFile(skill_zip, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("report-skill/SKILL.md", "# 보고서 작성\n\n보고서는 결론부터 작성합니다.")
    registry.import_zip("report-skill.zip", skill_zip.read_bytes())
    provider = FakeProvider()
    service = AgentPlannerService(skill_registry=registry, provider=provider)

    result = await service.create_plan(AgentPlanRequest(task="월간 보고서를 만들어줘", execute=True))

    assert result.executed is True
    assert "HWPX 초안" in result.plan
    assert "보고서는 결론부터 작성합니다" in provider.prompt
    assert "월간 보고서를 만들어줘" in provider.prompt


@pytest.mark.asyncio
async def test_agent_plan_execute_structures_steps_for_approval(tmp_path):
    provider = FakeProvider()
    service = AgentPlannerService(
        skill_registry=SkillRegistryService(store_root=tmp_path / "skills"),
        provider=provider,
    )

    result = await service.create_plan(AgentPlanRequest(task="월간 보고서를 만들어줘", execute=True))

    assert [step.step_id for step in result.steps] == ["step-1", "step-2", "step-3"]
    assert result.steps[0].title == "보고서 skill을 적용한다."
    assert result.steps[0].status == "pending"
    assert result.steps[0].requires_approval is False
    assert result.steps[1].requires_approval is True
    assert result.steps[2].action_type == "document"

from openclaw.config import AppConfig
from openclaw.providers.base import HealthCheckResult
from openclaw.providers.ollama import OllamaProvider
from openclaw.providers.openai_compatible import OpenAICompatibleProvider


async def run_health_check(config: AppConfig) -> HealthCheckResult:
    provider_config = config.provider
    if provider_config.mode == "openai_compatible":
        provider = OpenAICompatibleProvider(
            api_base_url=provider_config.api_base_url,
            model=provider_config.model,
            api_key=provider_config.api_key,
            timeout_seconds=provider_config.timeout_seconds,
        )
        return await provider.health_check()

    provider = OllamaProvider(
        base_url=provider_config.ollama_base_url,
        model=provider_config.model,
        timeout_seconds=provider_config.timeout_seconds,
    )
    return await provider.health_check()

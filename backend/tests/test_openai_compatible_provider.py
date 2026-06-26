import httpx
import pytest

from openclaw.providers.openai_compatible import OpenAICompatibleProvider


@pytest.mark.asyncio
async def test_openai_compatible_provider_reports_available():
    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["Authorization"] == "Bearer secret"
        return httpx.Response(
            200,
            json={"choices": [{"message": {"content": "pong"}}]},
        )

    provider = OpenAICompatibleProvider(
        api_base_url="http://llm.internal.test/v1",
        model="internal-model",
        api_key="secret",
        client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    result = await provider.health_check()

    assert result.available is True
    assert result.provider == "openai_compatible"
    assert result.model == "internal-model"
    assert result.message == "pong"

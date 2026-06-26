import httpx
import pytest

from openclaw.providers.ollama import OllamaProvider


@pytest.mark.asyncio
async def test_ollama_provider_reports_available_model():
    async def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/tags":
            return httpx.Response(200, json={"models": [{"name": "gemma3:12b"}]})
        if request.url.path == "/api/generate":
            return httpx.Response(
                200,
                json={
                    "response": "pong",
                    "eval_count": 4,
                    "eval_duration": 1_000_000_000,
                },
            )
        return httpx.Response(404)

    provider = OllamaProvider(
        base_url="http://ollama.test",
        model="gemma3:12b",
        client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    result = await provider.health_check()

    assert result.available is True
    assert result.provider == "ollama"
    assert result.model == "gemma3:12b"
    assert result.tokens_per_second == 4.0


@pytest.mark.asyncio
async def test_ollama_provider_reports_missing_model():
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"models": [{"name": "llama3.1:8b"}]})

    provider = OllamaProvider(
        base_url="http://ollama.test",
        model="gemma3:12b",
        client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    result = await provider.health_check()

    assert result.available is False
    assert "not found" in result.message

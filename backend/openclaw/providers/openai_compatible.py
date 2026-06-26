import time

import httpx

from openclaw.providers.base import HealthCheckResult, LLMProvider


class OpenAICompatibleProvider(LLMProvider):
    def __init__(
        self,
        api_base_url: str,
        model: str,
        api_key: str = "",
        client: httpx.AsyncClient | None = None,
        timeout_seconds: float = 60.0,
    ) -> None:
        self.api_base_url = api_base_url.rstrip("/")
        self.model = model
        self.api_key = api_key
        self._client = client
        self.timeout_seconds = timeout_seconds

    def _client_or_new(self) -> httpx.AsyncClient:
        return self._client or httpx.AsyncClient(timeout=self.timeout_seconds)

    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}

    async def health_check(self) -> HealthCheckResult:
        start = time.perf_counter()
        try:
            message = await self.generate("Reply with pong.")
            return HealthCheckResult(
                provider="openai_compatible",
                available=True,
                model=self.model,
                message=message,
                latency_ms=(time.perf_counter() - start) * 1000,
            )
        except Exception as exc:
            return HealthCheckResult(
                provider="openai_compatible",
                model=self.model,
                message=str(exc),
            )

    async def generate(self, prompt: str) -> str:
        client = self._client_or_new()
        response = await client.post(
            f"{self.api_base_url}/chat/completions",
            headers=self._headers(),
            json={
                "model": self.model,
                "messages": [{"role": "user", "content": prompt}],
                "stream": False,
            },
        )
        response.raise_for_status()
        choices = response.json().get("choices", [])
        return "" if not choices else choices[0].get("message", {}).get("content", "")

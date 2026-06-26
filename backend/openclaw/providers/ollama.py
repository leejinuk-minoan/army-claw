import time

import httpx

from openclaw.providers.base import HealthCheckResult, LLMProvider


class OllamaProvider(LLMProvider):
    def __init__(
        self,
        base_url: str,
        model: str,
        client: httpx.AsyncClient | None = None,
        timeout_seconds: float = 60.0,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.model = model
        self._client = client
        self.timeout_seconds = timeout_seconds

    def _client_or_new(self) -> httpx.AsyncClient:
        return self._client or httpx.AsyncClient(timeout=self.timeout_seconds)

    async def health_check(self) -> HealthCheckResult:
        start = time.perf_counter()
        try:
            client = self._client_or_new()
            tags = await client.get(f"{self.base_url}/api/tags")
            tags.raise_for_status()
            names = {item.get("name", "") for item in tags.json().get("models", [])}
            if self.model not in names:
                return HealthCheckResult(
                    provider="ollama",
                    model=self.model,
                    message=f"model not found: {self.model}",
                )

            generated = await client.post(
                f"{self.base_url}/api/generate",
                json={"model": self.model, "prompt": "Reply with pong.", "stream": False},
            )
            generated.raise_for_status()
            payload = generated.json()
            return HealthCheckResult(
                provider="ollama",
                available=True,
                model=self.model,
                message=payload.get("response", ""),
                latency_ms=(time.perf_counter() - start) * 1000,
                tokens_per_second=self._tokens_per_second(payload),
            )
        except Exception as exc:
            return HealthCheckResult(provider="ollama", model=self.model, message=str(exc))

    async def generate(self, prompt: str) -> str:
        client = self._client_or_new()
        response = await client.post(
            f"{self.base_url}/api/generate",
            json={"model": self.model, "prompt": prompt, "stream": False},
        )
        response.raise_for_status()
        return response.json().get("response", "")

    def _tokens_per_second(self, payload: dict) -> float | None:
        eval_count = payload.get("eval_count")
        eval_duration = payload.get("eval_duration")
        if not eval_count or not eval_duration:
            return None
        seconds = eval_duration / 1_000_000_000
        return None if seconds <= 0 else round(eval_count / seconds, 2)

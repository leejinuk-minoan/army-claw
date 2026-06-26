from abc import ABC, abstractmethod

from pydantic import BaseModel


class HealthCheckResult(BaseModel):
    provider: str
    available: bool = False
    model: str = ""
    message: str = ""
    latency_ms: float | None = None
    tokens_per_second: float | None = None


class LLMProvider(ABC):
    @abstractmethod
    async def health_check(self) -> HealthCheckResult:
        raise NotImplementedError

    @abstractmethod
    async def generate(self, prompt: str) -> str:
        raise NotImplementedError

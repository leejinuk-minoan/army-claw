import json
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field

ProviderMode = Literal["local_llm_bundle", "openai_compatible"]


class ProviderConfig(BaseModel):
    mode: ProviderMode = "local_llm_bundle"
    model: str = "gemma3:12b"
    ollama_base_url: str = "http://127.0.0.1:11434"
    api_base_url: str = ""
    api_key: str = ""
    timeout_seconds: float = Field(default=60.0, gt=0)
    retries: int = Field(default=1, ge=0, le=5)


class AppConfig(BaseModel):
    provider: ProviderConfig = Field(default_factory=ProviderConfig)


def load_config(path: Path) -> AppConfig:
    if not path.exists():
        return AppConfig()
    data = json.loads(path.read_text(encoding="utf-8"))
    return AppConfig.model_validate(data)


def save_config(path: Path, config: AppConfig) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(config.model_dump(), indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

from pathlib import Path

from openclaw.config import AppConfig, load_config, save_config


def test_default_config_uses_local_llm_bundle_mode():
    config = AppConfig()

    assert config.provider.mode == "local_llm_bundle"
    assert config.provider.model == "gemma3:12b"
    assert config.provider.ollama_base_url == "http://127.0.0.1:11434"


def test_config_round_trip(tmp_path: Path):
    path = tmp_path / "openclaw.config.json"
    config = AppConfig()
    config.provider.mode = "openai_compatible"
    config.provider.api_base_url = "http://llm.internal.local:8000/v1"
    config.provider.model = "internal-model"

    save_config(path, config)
    loaded = load_config(path)

    assert loaded.provider.mode == "openai_compatible"
    assert loaded.provider.api_base_url == "http://llm.internal.local:8000/v1"
    assert loaded.provider.model == "internal-model"

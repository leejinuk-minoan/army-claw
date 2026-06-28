from pathlib import Path

import pytest

from openclaw.local_llm_bundle import LocalLlmBundleError, LocalLlmBundleRequest, LocalLlmBundleService


class Completed:
    returncode = 0
    stdout = "ok"
    stderr = ""


def test_local_llm_requires_approval(tmp_path: Path):
    service = LocalLlmBundleService(scripts_dir=tmp_path)

    result = service.run(LocalLlmBundleRequest(action="verify", approved=False))

    assert result.executed is False
    assert result.approved is False
    assert "승인" in result.message


def test_local_llm_verify_builds_allowed_script_command(tmp_path: Path):
    script = tmp_path / "verify-local-llm-bundle.ps1"
    script.write_text("", encoding="utf-8")
    calls = []
    service = LocalLlmBundleService(
        scripts_dir=tmp_path,
        runner=lambda args, **kwargs: calls.append(args) or Completed(),
    )

    result = service.run(LocalLlmBundleRequest(action="verify", approved=True, skip_generate=True))

    assert result.executed is True
    assert str(script) in calls[0]
    assert "-SkipGenerate" in calls[0]


def test_local_llm_install_passes_bundle_root_and_install_switch(tmp_path: Path):
    script = tmp_path / "install-local-llm-bundle.ps1"
    script.write_text("", encoding="utf-8")
    calls = []
    service = LocalLlmBundleService(
        scripts_dir=tmp_path,
        runner=lambda args, **kwargs: calls.append(args) or Completed(),
    )

    service.run(
        LocalLlmBundleRequest(
            action="install",
            approved=True,
            bundle_root=str(tmp_path / "bundle"),
            install_ollama=True,
        )
    )

    assert "-BundleRoot" in calls[0]
    assert str(tmp_path / "bundle") in calls[0]
    assert "-InstallOllama" in calls[0]


def test_local_llm_blocks_unknown_action(tmp_path: Path):
    service = LocalLlmBundleService(scripts_dir=tmp_path)

    with pytest.raises(LocalLlmBundleError):
        service.run(LocalLlmBundleRequest(action="other", approved=True))


def test_local_llm_diagnose_reports_missing_ollama_command(tmp_path: Path):
    (tmp_path / "verify-local-llm-bundle.ps1").write_text("", encoding="utf-8")
    (tmp_path / "install-local-llm-bundle.ps1").write_text("", encoding="utf-8")
    service = LocalLlmBundleService(scripts_dir=tmp_path, command_resolver=lambda name: None)

    result = service.diagnose(model="gemma3:12b")

    assert result.status == "ollama_missing"
    assert result.scripts_available is True
    assert result.ollama_command_available is False
    assert result.next_step == "Ollama를 설치하거나 PATH에 추가하세요."


def test_local_llm_diagnose_reports_model_ready(tmp_path: Path):
    (tmp_path / "verify-local-llm-bundle.ps1").write_text("", encoding="utf-8")
    (tmp_path / "install-local-llm-bundle.ps1").write_text("", encoding="utf-8")
    service = LocalLlmBundleService(
        scripts_dir=tmp_path,
        command_resolver=lambda name: "C:\\Program Files\\Ollama\\ollama.exe",
        model_lister=lambda base_url: ["gemma3:12b"],
    )

    result = service.diagnose(model="gemma3:12b")

    assert result.status == "ready"
    assert result.ollama_api_available is True
    assert result.model_available is True

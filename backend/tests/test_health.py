from fastapi.testclient import TestClient

from openclaw.main import create_app
from openclaw.providers.base import HealthCheckResult


def test_app_status_endpoint_returns_ok():
    client = TestClient(create_app())

    response = client.get("/api/status")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "app": "Army Claw"}


def test_health_check_result_defaults_to_unavailable():
    result = HealthCheckResult(provider="test")

    assert result.provider == "test"
    assert result.available is False
    assert result.latency_ms is None
    assert result.tokens_per_second is None
    assert result.message == ""


def test_health_endpoint_returns_provider_result():
    client = TestClient(create_app())

    response = client.get("/api/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["provider"] == "ollama"
    assert payload["model"] == "gemma3:12b"
    assert "available" in payload


def test_workspace_list_endpoint(tmp_path):
    (tmp_path / "main.py").write_text("print('hi')", encoding="utf-8")
    client = TestClient(create_app())

    response = client.post(
        "/api/workspace/list",
        json={"workspace_root": str(tmp_path), "path": "."},
    )

    assert response.status_code == 200
    assert response.json()["entries"][0]["path"] == "main.py"


def test_workspace_command_endpoint_requires_approval(tmp_path):
    client = TestClient(create_app())

    response = client.post(
        "/api/workspace/command",
        json={"workspace_root": str(tmp_path), "command": "Get-ChildItem"},
    )

    assert response.status_code == 200
    assert response.json()["executed"] is False


def test_local_llm_run_endpoint_requires_approval():
    client = TestClient(create_app())

    response = client.post(
        "/api/local-llm/run",
        json={"action": "verify", "approved": False},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["executed"] is False
    assert payload["approved"] is False


def test_local_llm_diagnose_endpoint_returns_status():
    client = TestClient(create_app())

    response = client.post(
        "/api/local-llm/diagnose",
        json={"model": "gemma3:12b"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["model"] == "gemma3:12b"
    assert "status" in payload
    assert "next_step" in payload


def test_hancom_status_endpoint_returns_environment_status():
    client = TestClient(create_app())

    response = client.get("/api/hancom/status")

    assert response.status_code == 200
    payload = response.json()
    assert "validation_level" in payload
    assert "hwp" in payload
    assert "hcell" in payload
    assert "hshow" in payload


def test_skill_api_import_list_disable_and_delete(tmp_path, monkeypatch):
    from zipfile import ZIP_DEFLATED, ZipFile

    monkeypatch.setenv("ARMY_CLAW_SKILL_STORE", str(tmp_path / "skills"))
    zip_path = tmp_path / "report-skill.zip"
    with ZipFile(zip_path, "w", ZIP_DEFLATED) as archive:
        archive.writestr("report-skill/SKILL.md", "# 보고서 작성\n\n보고서 작성 절차입니다.")
    client = TestClient(create_app())

    upload = client.post(
        "/api/skills/import",
        params={"filename": "report-skill.zip"},
        content=zip_path.read_bytes(),
    )
    listed = client.get("/api/skills")
    disabled = client.post("/api/skills/report-skill/enabled", json={"enabled": False})
    deleted = client.delete("/api/skills/report-skill")

    assert upload.status_code == 200
    assert upload.json()["skill_id"] == "report-skill"
    assert listed.status_code == 200
    assert listed.json()["skills"][0]["name"] == "보고서 작성"
    assert disabled.status_code == 200
    assert disabled.json()["enabled"] is False
    assert deleted.status_code == 200
    assert deleted.json()["deleted"] is True


def test_packaged_app_serves_frontend_static_files(tmp_path, monkeypatch):
    web_dir = tmp_path / "web"
    web_dir.mkdir()
    (web_dir / "index.html").write_text("<h1>Army Claw UI</h1>", encoding="utf-8")
    monkeypatch.setenv("ARMY_CLAW_WEB_DIR", str(web_dir))
    client = TestClient(create_app())

    response = client.get("/")

    assert response.status_code == 200
    assert "Army Claw UI" in response.text

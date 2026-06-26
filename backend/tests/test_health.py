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

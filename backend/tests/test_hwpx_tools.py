from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from openclaw.hwpx_tools import HwpxService
from openclaw.main import create_app
from openclaw.workspace import WorkspaceError, WorkspaceService


def test_create_and_summarize_hwpx(tmp_path: Path):
    service = HwpxService(WorkspaceService(tmp_path))

    created = service.create_document("docs/report.hwpx", "보고서", ["첫 문단", "둘째 문단"])
    summary = service.summarize_document("docs/report.hwpx")

    assert created.saved is True
    assert summary.path == "docs/report.hwpx"
    assert summary.paragraph_count == 2
    assert summary.paragraphs == ["첫 문단", "둘째 문단"]
    assert summary.text == "첫 문단\n둘째 문단"


def test_add_paragraph_to_hwpx(tmp_path: Path):
    service = HwpxService(WorkspaceService(tmp_path))
    service.create_document("report.hwpx", "초안", ["기존 문단"])

    result = service.add_paragraph("report.hwpx", "추가 문단")
    summary = service.summarize_document("report.hwpx")

    assert result.saved is True
    assert summary.paragraphs == ["기존 문단", "추가 문단"]


def test_rejects_non_hwpx_path(tmp_path: Path):
    service = HwpxService(WorkspaceService(tmp_path))

    with pytest.raises(WorkspaceError):
        service.create_document("report.hwp", "제목", ["본문"])


def test_rejects_path_escape(tmp_path: Path):
    service = HwpxService(WorkspaceService(tmp_path))

    with pytest.raises(WorkspaceError):
        service.create_document("../report.hwpx", "제목", ["본문"])


def test_hwpx_api_create_summary_and_add_paragraph(tmp_path: Path):
    client = TestClient(create_app())

    create_response = client.post(
        "/api/hwpx/create",
        json={
            "workspace_root": str(tmp_path),
            "path": "report.hwpx",
            "title": "보고서",
            "paragraphs": ["첫 문단"],
        },
    )
    add_response = client.post(
        "/api/hwpx/add-paragraph",
        json={"workspace_root": str(tmp_path), "path": "report.hwpx", "paragraph": "추가 문단"},
    )
    summary_response = client.post(
        "/api/hwpx/summary",
        json={"workspace_root": str(tmp_path), "path": "report.hwpx"},
    )

    assert create_response.status_code == 200
    assert add_response.status_code == 200
    assert summary_response.status_code == 200
    assert summary_response.json()["paragraphs"] == ["첫 문단", "추가 문단"]

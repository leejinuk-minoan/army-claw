from pathlib import Path

import pytest

from openclaw.workspace import WorkspaceError, WorkspaceService


def test_workspace_lists_files_inside_root(tmp_path: Path):
    (tmp_path / "src").mkdir()
    (tmp_path / "src" / "app.py").write_text("print('hi')", encoding="utf-8")
    service = WorkspaceService(tmp_path)

    entries = service.list_files("src")

    assert entries[0].path == "src/app.py"
    assert entries[0].type == "file"


def test_workspace_blocks_path_escape(tmp_path: Path):
    service = WorkspaceService(tmp_path)

    with pytest.raises(WorkspaceError):
        service.read_file("../secret.txt")


def test_write_requires_approval(tmp_path: Path):
    service = WorkspaceService(tmp_path)

    result = service.write_file("note.txt", "hello", approved=False)

    assert result.written is False
    assert not (tmp_path / "note.txt").exists()
    assert "note.txt" in result.diff


def test_write_with_approval_writes_file(tmp_path: Path):
    service = WorkspaceService(tmp_path)

    result = service.write_file("note.txt", "hello", approved=True)

    assert result.written is True
    assert (tmp_path / "note.txt").read_text(encoding="utf-8") == "hello"


def test_powershell_requires_approval(tmp_path: Path):
    service = WorkspaceService(tmp_path)

    result = service.run_powershell("Get-ChildItem", approved=False)

    assert result.executed is False
    assert result.approved is False
    assert "approval" in result.message

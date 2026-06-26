from pathlib import Path

import pytest

from openclaw.presentation_tools import PresentationService
from openclaw.workspace import WorkspaceError, WorkspaceService


def test_create_and_summarize_presentation(tmp_path: Path):
    service = PresentationService(WorkspaceService(tmp_path))

    created = service.create_presentation("deck.pptx", "보고 제목", "부제")
    summary = service.summarize_presentation("deck.pptx")

    assert created.saved is True
    assert summary.slide_count == 1
    assert summary.slides[0].title == "보고 제목"


def test_add_title_slide(tmp_path: Path):
    service = PresentationService(WorkspaceService(tmp_path))
    service.create_presentation("deck.pptx", "첫 장")

    result = service.add_title_slide("deck.pptx", "둘째 장", "요약")
    summary = service.summarize_presentation("deck.pptx")

    assert result.saved is True
    assert summary.slide_count == 2
    assert summary.slides[1].title == "둘째 장"


def test_add_bullet_slide(tmp_path: Path):
    service = PresentationService(WorkspaceService(tmp_path))
    service.create_presentation("deck.pptx", "첫 장")

    result = service.add_bullet_slide("deck.pptx", "핵심", ["하나", "둘"])
    summary = service.summarize_presentation("deck.pptx")

    assert result.saved is True
    assert summary.slide_count == 2
    assert summary.slides[1].title == "핵심"


def test_show_file_reports_compatibility_note(tmp_path: Path):
    (tmp_path / "deck.show").write_text("placeholder", encoding="utf-8")
    service = PresentationService(WorkspaceService(tmp_path))

    note = service.show_compatibility_note("deck.show")

    assert "PPTX" in note.compatibility_note


def test_show_file_is_not_editable(tmp_path: Path):
    (tmp_path / "deck.show").write_text("placeholder", encoding="utf-8")
    service = PresentationService(WorkspaceService(tmp_path))

    with pytest.raises(WorkspaceError):
        service.summarize_presentation("deck.show")

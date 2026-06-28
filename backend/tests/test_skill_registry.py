from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

import pytest

from openclaw.skill_registry import SkillRegistryError, SkillRegistryService


def make_skill_zip(path: Path, skill_md: str = "# 보고서 작성\n\n반복 보고서 작성 절차입니다.") -> bytes:
    with ZipFile(path, "w", ZIP_DEFLATED) as archive:
        archive.writestr("report-skill/SKILL.md", skill_md)
        archive.writestr("report-skill/templates/example.md", "template")
    return path.read_bytes()


def test_import_skill_zip_registers_metadata(tmp_path: Path):
    payload = make_skill_zip(tmp_path / "report-skill.zip")
    service = SkillRegistryService(store_root=tmp_path / "store")

    result = service.import_zip(filename="report-skill.zip", payload=payload)

    assert result.skill_id == "report-skill"
    assert result.name == "보고서 작성"
    assert result.enabled is True
    assert result.sha256
    assert (tmp_path / "store" / "report-skill" / "SKILL.md").is_file()


def test_list_skills_returns_imported_skill(tmp_path: Path):
    payload = make_skill_zip(tmp_path / "report-skill.zip")
    service = SkillRegistryService(store_root=tmp_path / "store")
    service.import_zip(filename="report-skill.zip", payload=payload)

    skills = service.list_skills()

    assert len(skills) == 1
    assert skills[0].skill_id == "report-skill"


def test_set_enabled_updates_skill_state(tmp_path: Path):
    payload = make_skill_zip(tmp_path / "report-skill.zip")
    service = SkillRegistryService(store_root=tmp_path / "store")
    service.import_zip(filename="report-skill.zip", payload=payload)

    result = service.set_enabled("report-skill", enabled=False)

    assert result.enabled is False
    assert service.list_skills()[0].enabled is False


def test_delete_skill_removes_skill_directory(tmp_path: Path):
    payload = make_skill_zip(tmp_path / "report-skill.zip")
    service = SkillRegistryService(store_root=tmp_path / "store")
    service.import_zip(filename="report-skill.zip", payload=payload)

    result = service.delete_skill("report-skill")

    assert result["deleted"] is True
    assert not (tmp_path / "store" / "report-skill").exists()


def test_import_rejects_zip_without_skill_md(tmp_path: Path):
    zip_path = tmp_path / "bad.zip"
    with ZipFile(zip_path, "w", ZIP_DEFLATED) as archive:
        archive.writestr("README.md", "no skill")
    service = SkillRegistryService(store_root=tmp_path / "store")

    with pytest.raises(SkillRegistryError):
        service.import_zip(filename="bad.zip", payload=zip_path.read_bytes())

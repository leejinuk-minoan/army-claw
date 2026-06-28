import hashlib
import json
import os
import re
import shutil
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from zipfile import BadZipFile, ZipFile

from pydantic import BaseModel


class SkillRegistryError(ValueError):
    pass


class SkillMetadata(BaseModel):
    skill_id: str
    name: str
    description: str = ""
    enabled: bool = True
    imported_at: str
    sha256: str
    source_filename: str
    path: str


class SkillEnabledRequest(BaseModel):
    enabled: bool


class SkillRegistryService:
    METADATA_FILENAME = "army-claw-skill.json"

    def __init__(self, store_root: Path | None = None) -> None:
        self.store_root = store_root or self._default_store_root()

    def import_zip(self, filename: str, payload: bytes) -> SkillMetadata:
        if not filename.lower().endswith(".zip"):
            raise SkillRegistryError("skill package must be a .zip file")

        sha256 = hashlib.sha256(payload).hexdigest()
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            zip_path = temp_path / "skill.zip"
            zip_path.write_bytes(payload)
            try:
                with ZipFile(zip_path) as archive:
                    self._validate_zip_members(archive)
                    skill_member = self._find_skill_md(archive)
                    if skill_member is None:
                        raise SkillRegistryError("SKILL.md was not found in skill package")
                    archive.extractall(temp_path / "extracted")
            except BadZipFile as exc:
                raise SkillRegistryError("invalid zip skill package") from exc

            extracted_root = self._resolve_extracted_root(temp_path / "extracted", skill_member)
            skill_md = extracted_root / "SKILL.md"
            text = skill_md.read_text(encoding="utf-8")
            skill_id = self._skill_id_from_filename(filename)
            target = self.store_root / skill_id
            if target.exists():
                shutil.rmtree(target)
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copytree(extracted_root, target)

        metadata = SkillMetadata(
            skill_id=skill_id,
            name=self._extract_name(text, skill_id),
            description=self._extract_description(text),
            enabled=True,
            imported_at=datetime.now(timezone.utc).isoformat(),
            sha256=sha256,
            source_filename=filename,
            path=str(target),
        )
        self._write_metadata(metadata)
        return metadata

    def list_skills(self) -> list[SkillMetadata]:
        if not self.store_root.exists():
            return []
        skills: list[SkillMetadata] = []
        for path in sorted(self.store_root.iterdir(), key=lambda item: item.name.lower()):
            metadata_path = path / self.METADATA_FILENAME
            if metadata_path.is_file():
                skills.append(SkillMetadata.model_validate_json(metadata_path.read_text(encoding="utf-8")))
        return skills

    def set_enabled(self, skill_id: str, enabled: bool) -> SkillMetadata:
        metadata = self._read_metadata(skill_id)
        metadata.enabled = enabled
        self._write_metadata(metadata)
        return metadata

    def delete_skill(self, skill_id: str) -> dict[str, bool | str]:
        target = self._skill_path(skill_id)
        if not target.exists():
            raise SkillRegistryError(f"skill was not found: {skill_id}")
        shutil.rmtree(target)
        return {"skill_id": skill_id, "deleted": True}

    def _write_metadata(self, metadata: SkillMetadata) -> None:
        path = self._skill_path(metadata.skill_id)
        path.mkdir(parents=True, exist_ok=True)
        (path / self.METADATA_FILENAME).write_text(
            json.dumps(metadata.model_dump(), indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

    def _read_metadata(self, skill_id: str) -> SkillMetadata:
        metadata_path = self._skill_path(skill_id) / self.METADATA_FILENAME
        if not metadata_path.is_file():
            raise SkillRegistryError(f"skill was not found: {skill_id}")
        return SkillMetadata.model_validate_json(metadata_path.read_text(encoding="utf-8"))

    def _skill_path(self, skill_id: str) -> Path:
        return self.store_root / self._sanitize_id(skill_id)

    def _find_skill_md(self, archive: ZipFile) -> str | None:
        for name in archive.namelist():
            normalized = name.replace("\\", "/").strip("/")
            if normalized == "SKILL.md" or normalized.endswith("/SKILL.md"):
                return normalized
        return None

    def _resolve_extracted_root(self, extracted: Path, skill_member: str) -> Path:
        parts = Path(skill_member).parts
        if len(parts) == 1:
            return extracted
        return extracted / parts[0]

    def _validate_zip_members(self, archive: ZipFile) -> None:
        for member in archive.namelist():
            normalized = member.replace("\\", "/")
            if normalized.startswith("/") or ".." in Path(normalized).parts:
                raise SkillRegistryError("skill package contains an unsafe path")

    def _skill_id_from_filename(self, filename: str) -> str:
        stem = Path(filename).stem
        return self._sanitize_id(stem)

    def _sanitize_id(self, value: str) -> str:
        sanitized = re.sub(r"[^A-Za-z0-9_.-]+", "-", value).strip(".-").lower()
        if not sanitized:
            raise SkillRegistryError("skill id is empty")
        return sanitized

    def _extract_name(self, text: str, fallback: str) -> str:
        for line in text.splitlines():
            stripped = line.strip()
            if stripped.startswith("# "):
                return stripped[2:].strip() or fallback
        return fallback

    def _extract_description(self, text: str) -> str:
        for line in text.splitlines():
            stripped = line.strip()
            if stripped and not stripped.startswith("#"):
                return stripped[:240]
        return ""

    def _default_store_root(self) -> Path:
        configured = os.environ.get("ARMY_CLAW_SKILL_STORE")
        if configured:
            return Path(configured)
        return Path(os.environ.get("LOCALAPPDATA", str(Path.home()))) / "ArmyClaw" / "skills"

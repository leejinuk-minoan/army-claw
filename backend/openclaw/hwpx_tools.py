from __future__ import annotations

from pathlib import Path
from xml.etree import ElementTree
from zipfile import ZIP_DEFLATED, ZipFile

from pydantic import BaseModel

from openclaw.workspace import WorkspaceError, WorkspaceService


HWPX_SECTION_PATH = "Contents/section0.xml"
HWPX_HP_NS = "http://www.hancom.co.kr/hwpml/2011/paragraph"

ElementTree.register_namespace("hp", HWPX_HP_NS)


class HwpxSummary(BaseModel):
    path: str
    paragraph_count: int
    paragraphs: list[str]
    text: str
    compatibility_note: str = ""


class HwpxResult(BaseModel):
    path: str
    saved: bool
    message: str = ""


class HwpxService:
    def __init__(self, workspace: WorkspaceService) -> None:
        self.workspace = workspace

    def _resolve_hwpx(self, relative_path: str, must_exist: bool = True) -> Path:
        path = self.workspace.resolve_inside(relative_path)
        if path.suffix.lower() != ".hwpx":
            raise WorkspaceError("only .hwpx files are supported")
        if must_exist and not path.exists():
            raise WorkspaceError(f"HWPX document does not exist: {relative_path}")
        return path

    def create_document(self, relative_path: str, title: str, paragraphs: list[str]) -> HwpxResult:
        path = self._resolve_hwpx(relative_path, must_exist=False)
        section = self._build_section(paragraphs)
        entries = {
            "mimetype": b"application/hwp+zip",
            "version.xml": b'<?xml version="1.0" encoding="UTF-8"?><version app="Army Claw" />',
            "Contents/content.hpf": self._content_hpf(title).encode("utf-8"),
            HWPX_SECTION_PATH: self._xml_bytes(section),
        }
        path.parent.mkdir(parents=True, exist_ok=True)
        self._write_zip(path, entries)
        return HwpxResult(path=relative_path, saved=True, message="HWPX document created")

    def summarize_document(self, relative_path: str) -> HwpxSummary:
        path = self._resolve_hwpx(relative_path)
        section_path, section = self._read_section(path)
        paragraphs = self._extract_paragraphs(section)
        note = ""
        if section_path != HWPX_SECTION_PATH:
            note = f"read from {section_path}; generated edits use {HWPX_SECTION_PATH}"
        return HwpxSummary(
            path=relative_path,
            paragraph_count=len(paragraphs),
            paragraphs=paragraphs,
            text="\n".join(paragraphs),
            compatibility_note=note,
        )

    def add_paragraph(self, relative_path: str, paragraph: str) -> HwpxResult:
        path = self._resolve_hwpx(relative_path)
        section_path, section = self._read_section(path)
        section.append(self._paragraph_element(paragraph))

        entries = self._read_zip_entries(path)
        entries[section_path] = self._xml_bytes(section)
        self._write_zip(path, entries)
        return HwpxResult(path=relative_path, saved=True, message="paragraph added")

    def compatibility_note(self, relative_path: str) -> HwpxSummary:
        path = self._resolve_hwpx(relative_path, must_exist=False)
        exists = path.exists()
        return HwpxSummary(
            path=relative_path,
            paragraph_count=0,
            paragraphs=[],
            text="",
            compatibility_note=(
                "HWPX is handled as a ZIP/XML document in v0.1. Hancom Hangul native rendering, "
                "legacy HWP conversion, and complex style validation are planned for later slices."
                if exists
                else "HWPX path is valid; create the file before summary or edit operations."
            ),
        )

    def _build_section(self, paragraphs: list[str]) -> ElementTree.Element:
        section = ElementTree.Element(ElementTree.QName(HWPX_HP_NS, "sec"))
        for paragraph in paragraphs:
            section.append(self._paragraph_element(paragraph))
        return section

    def _paragraph_element(self, text: str) -> ElementTree.Element:
        paragraph = ElementTree.Element(ElementTree.QName(HWPX_HP_NS, "p"))
        run = ElementTree.SubElement(paragraph, ElementTree.QName(HWPX_HP_NS, "run"))
        text_node = ElementTree.SubElement(run, ElementTree.QName(HWPX_HP_NS, "t"))
        text_node.text = text
        return paragraph

    def _extract_paragraphs(self, section: ElementTree.Element) -> list[str]:
        paragraphs: list[str] = []
        for paragraph in section.iter():
            if self._local_name(paragraph.tag) != "p":
                continue
            parts: list[str] = []
            for node in paragraph.iter():
                if self._local_name(node.tag) in {"t", "text"} and node.text:
                    parts.append(node.text)
            if parts:
                paragraphs.append("".join(parts))
        return paragraphs

    def _read_section(self, path: Path) -> tuple[str, ElementTree.Element]:
        entries = self._read_zip_entries(path)
        section_path = self._find_section_path(entries)
        try:
            section = ElementTree.fromstring(entries[section_path])
        except ElementTree.ParseError as exc:
            raise WorkspaceError(f"invalid HWPX section XML: {section_path}") from exc
        return section_path, section

    def _find_section_path(self, entries: dict[str, bytes]) -> str:
        if HWPX_SECTION_PATH in entries:
            return HWPX_SECTION_PATH
        candidates = sorted(name for name in entries if name.startswith("Contents/section") and name.endswith(".xml"))
        if not candidates:
            raise WorkspaceError("HWPX section XML was not found")
        return candidates[0]

    def _read_zip_entries(self, path: Path) -> dict[str, bytes]:
        try:
            with ZipFile(path, "r") as archive:
                return {name: archive.read(name) for name in archive.namelist()}
        except OSError as exc:
            raise WorkspaceError("invalid or unreadable HWPX zip file") from exc

    def _write_zip(self, path: Path, entries: dict[str, bytes]) -> None:
        with ZipFile(path, "w", compression=ZIP_DEFLATED) as archive:
            for name, data in entries.items():
                archive.writestr(name, data)

    def _xml_bytes(self, element: ElementTree.Element) -> bytes:
        return ElementTree.tostring(element, encoding="utf-8", xml_declaration=True)

    def _content_hpf(self, title: str) -> str:
        escaped_title = (
            title.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
        )
        return (
            '<?xml version="1.0" encoding="UTF-8"?>'
            f'<package><metadata><title>{escaped_title}</title></metadata>'
            f'<manifest><item href="{HWPX_SECTION_PATH}" media-type="application/xml" /></manifest></package>'
        )

    def _local_name(self, tag: str) -> str:
        if "}" in tag:
            return tag.rsplit("}", 1)[1]
        return tag

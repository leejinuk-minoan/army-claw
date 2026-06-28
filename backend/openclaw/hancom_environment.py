import os
from pathlib import Path

from pydantic import BaseModel


class HancomAppStatus(BaseModel):
    name: str
    executable: str
    available: bool
    path: str = ""


class HancomEnvironmentStatus(BaseModel):
    installed: bool
    validation_level: str
    hwp: HancomAppStatus
    hcell: HancomAppStatus
    hshow: HancomAppStatus
    message: str


class HancomEnvironmentService:
    APP_EXECUTABLES = {
        "hwp": ("한글", "Hwp.exe"),
        "hcell": ("한셀", "HCell.exe"),
        "hshow": ("한쇼", "HShow.exe"),
    }

    def __init__(self, candidate_dirs: list[Path] | None = None) -> None:
        self.candidate_dirs = candidate_dirs or self._default_candidate_dirs()

    def detect(self) -> HancomEnvironmentStatus:
        statuses = {
            key: self._find_app(display_name, executable)
            for key, (display_name, executable) in self.APP_EXECUTABLES.items()
        }
        available_count = sum(1 for status in statuses.values() if status.available)

        if available_count == len(statuses):
            validation_level = "native_available"
            message = "한컴오피스 네이티브 검증이 가능합니다."
        elif available_count > 0:
            validation_level = "partial_native_available"
            message = "일부 한컴오피스 앱만 감지되었습니다."
        else:
            validation_level = "file_structure_only"
            message = "한컴오피스 앱이 감지되지 않아 파일 구조 중심 검증만 가능합니다."

        return HancomEnvironmentStatus(
            installed=available_count > 0,
            validation_level=validation_level,
            hwp=statuses["hwp"],
            hcell=statuses["hcell"],
            hshow=statuses["hshow"],
            message=message,
        )

    def _find_app(self, display_name: str, executable: str) -> HancomAppStatus:
        for directory in self.candidate_dirs:
            path = directory / executable
            if path.is_file():
                return HancomAppStatus(
                    name=display_name,
                    executable=executable,
                    available=True,
                    path=str(path),
                )
        return HancomAppStatus(name=display_name, executable=executable, available=False)

    def _default_candidate_dirs(self) -> list[Path]:
        configured = os.environ.get("ARMY_CLAW_HANCOM_BIN_DIR")
        candidates: list[Path] = []
        if configured:
            candidates.append(Path(configured))

        candidates.extend(
            [
                Path(r"C:\Program Files (x86)\HNC\Office 2024\HOffice130\Bin"),
                Path(r"C:\Program Files\HNC\Office 2024\HOffice130\Bin"),
                Path(r"C:\Program Files (x86)\HNC\Office 2022\HOffice120\Bin"),
                Path(r"C:\Program Files\HNC\Office 2022\HOffice120\Bin"),
            ]
        )
        return candidates

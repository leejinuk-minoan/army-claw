from pathlib import Path

from openclaw.hancom_environment import HancomEnvironmentService


def test_detects_hancom_apps_from_bin_directory(tmp_path: Path):
    bin_dir = tmp_path / "HOffice130" / "Bin"
    bin_dir.mkdir(parents=True)
    for name in ["Hwp.exe", "HCell.exe", "HShow.exe"]:
        (bin_dir / name).write_text("", encoding="utf-8")
    service = HancomEnvironmentService(candidate_dirs=[bin_dir])

    result = service.detect()

    assert result.installed is True
    assert result.hwp.available is True
    assert result.hcell.available is True
    assert result.hshow.available is True
    assert result.validation_level == "native_available"


def test_reports_partial_hancom_installation(tmp_path: Path):
    bin_dir = tmp_path / "Bin"
    bin_dir.mkdir()
    (bin_dir / "Hwp.exe").write_text("", encoding="utf-8")
    service = HancomEnvironmentService(candidate_dirs=[bin_dir])

    result = service.detect()

    assert result.installed is True
    assert result.hwp.available is True
    assert result.hcell.available is False
    assert result.hshow.available is False
    assert result.validation_level == "partial_native_available"

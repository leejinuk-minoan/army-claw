import os
import subprocess
import sys
from collections.abc import Callable, Sequence
from pathlib import Path
from typing import Literal

from pydantic import BaseModel


class LocalLlmBundleError(ValueError):
    pass


LocalLlmAction = Literal["verify", "install"]


class LocalLlmBundleRequest(BaseModel):
    action: str
    approved: bool = False
    model: str = "gemma3:12b"
    bundle_root: str = ""
    install_ollama: bool = False
    skip_generate: bool = False


class LocalLlmBundleResult(BaseModel):
    action: str
    approved: bool
    executed: bool
    returncode: int | None = None
    stdout: str = ""
    stderr: str = ""
    message: str = ""


Runner = Callable[..., subprocess.CompletedProcess[str]]


class LocalLlmBundleService:
    SCRIPT_NAMES: dict[str, str] = {
        "verify": "verify-local-llm-bundle.ps1",
        "install": "install-local-llm-bundle.ps1",
    }

    def __init__(
        self,
        scripts_dir: Path | None = None,
        powershell_exe: str = "powershell",
        runner: Runner = subprocess.run,
    ) -> None:
        self.scripts_dir = scripts_dir or self._default_scripts_dir()
        self.powershell_exe = powershell_exe
        self.runner = runner

    def run(self, request: LocalLlmBundleRequest) -> LocalLlmBundleResult:
        script_name = self.SCRIPT_NAMES.get(request.action)
        if script_name is None:
            raise LocalLlmBundleError(f"unsupported Local LLM action: {request.action}")

        if not request.approved:
            return LocalLlmBundleResult(
                action=request.action,
                approved=False,
                executed=False,
                message="Local LLM 스크립트 실행에는 사용자 승인이 필요합니다.",
            )

        script_path = (self.scripts_dir / script_name).resolve()
        if not script_path.is_file():
            raise LocalLlmBundleError(f"Local LLM script was not found: {script_path}")

        args = self._build_args(script_path, request)
        completed = self.runner(
            args,
            cwd=self.scripts_dir,
            capture_output=True,
            text=True,
            timeout=900 if request.action == "install" else 180,
            check=False,
        )
        return LocalLlmBundleResult(
            action=request.action,
            approved=True,
            executed=True,
            returncode=completed.returncode,
            stdout=completed.stdout,
            stderr=completed.stderr,
            message="Local LLM 스크립트 실행이 끝났습니다.",
        )

    def _build_args(self, script_path: Path, request: LocalLlmBundleRequest) -> list[str]:
        args = [
            self.powershell_exe,
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            str(script_path),
            "-Model",
            request.model,
        ]
        if request.bundle_root:
            args.extend(["-BundleRoot", request.bundle_root])
        if request.action == "install" and request.install_ollama:
            args.append("-InstallOllama")
        if request.action == "verify" and request.skip_generate:
            args.append("-SkipGenerate")
        return args

    def _default_scripts_dir(self) -> Path:
        configured = os.environ.get("ARMY_CLAW_SCRIPTS_DIR")
        if configured:
            return Path(configured).resolve()

        candidates = self._script_dir_candidates()
        for candidate in candidates:
            if (candidate / "verify-local-llm-bundle.ps1").is_file():
                return candidate
        return candidates[0]

    def _script_dir_candidates(self) -> Sequence[Path]:
        if hasattr(sys, "_MEIPASS"):
            meipass = Path(sys._MEIPASS)
            executable_parent = Path(sys.executable).resolve().parent
            return [
                executable_parent / "scripts",
                executable_parent.parent / "scripts",
                meipass / "scripts",
            ]

        project_root = Path(__file__).resolve().parents[2]
        return [project_root / "scripts"]

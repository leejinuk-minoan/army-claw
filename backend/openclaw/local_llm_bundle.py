import os
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
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
CommandResolver = Callable[[str], str | None]
ModelLister = Callable[[str], list[str]]


class LocalLlmDiagnosticResult(BaseModel):
    status: str
    model: str
    scripts_available: bool
    ollama_command_available: bool
    ollama_api_available: bool
    model_available: bool
    next_step: str
    message: str = ""


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
        command_resolver: CommandResolver = shutil.which,
        model_lister: ModelLister | None = None,
    ) -> None:
        self.scripts_dir = scripts_dir or self._default_scripts_dir()
        self.powershell_exe = powershell_exe
        self.runner = runner
        self.command_resolver = command_resolver
        self.model_lister = model_lister or self._list_ollama_models

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

    def diagnose(self, model: str = "gemma3:12b", ollama_base_url: str = "http://127.0.0.1:11434") -> LocalLlmDiagnosticResult:
        scripts_available = all((self.scripts_dir / name).is_file() for name in self.SCRIPT_NAMES.values())
        if not scripts_available:
            return LocalLlmDiagnosticResult(
                status="scripts_missing",
                model=model,
                scripts_available=False,
                ollama_command_available=False,
                ollama_api_available=False,
                model_available=False,
                next_step="Army Claw Core 설치본에 Local LLM 스크립트가 포함되어 있는지 확인하세요.",
            )

        ollama_command_available = self.command_resolver("ollama") is not None
        if not ollama_command_available:
            return LocalLlmDiagnosticResult(
                status="ollama_missing",
                model=model,
                scripts_available=True,
                ollama_command_available=False,
                ollama_api_available=False,
                model_available=False,
                next_step="Ollama를 설치하거나 PATH에 추가하세요.",
            )

        try:
            model_names = self.model_lister(ollama_base_url)
        except Exception as exc:
            return LocalLlmDiagnosticResult(
                status="ollama_api_unavailable",
                model=model,
                scripts_available=True,
                ollama_command_available=True,
                ollama_api_available=False,
                model_available=False,
                next_step="Ollama 서비스를 실행한 뒤 다시 진단하세요.",
                message=str(exc),
            )

        model_available = model in model_names
        if not model_available:
            return LocalLlmDiagnosticResult(
                status="model_missing",
                model=model,
                scripts_available=True,
                ollama_command_available=True,
                ollama_api_available=True,
                model_available=False,
                next_step=f"`ollama pull {model}` 또는 Local LLM 번들 설치를 실행하세요.",
            )

        return LocalLlmDiagnosticResult(
            status="ready",
            model=model,
            scripts_available=True,
            ollama_command_available=True,
            ollama_api_available=True,
            model_available=True,
            next_step="Local LLM 검증 또는 Army Claw Health Check를 실행하세요.",
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

    def _list_ollama_models(self, ollama_base_url: str) -> list[str]:
        url = f"{ollama_base_url.rstrip('/')}/api/tags"
        request = urllib.request.Request(url, method="GET")
        try:
            with urllib.request.urlopen(request, timeout=5) as response:
                import json

                payload = json.loads(response.read().decode("utf-8"))
        except urllib.error.URLError as exc:
            raise LocalLlmBundleError(str(exc)) from exc
        return [item.get("name", "") for item in payload.get("models", [])]

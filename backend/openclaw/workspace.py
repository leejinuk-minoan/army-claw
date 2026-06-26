import difflib
import subprocess
from pathlib import Path

from pydantic import BaseModel


class WorkspaceError(ValueError):
    pass


class FileEntry(BaseModel):
    path: str
    name: str
    type: str
    size: int | None = None


class FileReadResult(BaseModel):
    path: str
    content: str


class DiffResult(BaseModel):
    path: str
    diff: str


class WriteResult(BaseModel):
    path: str
    written: bool
    diff: str


class CommandResult(BaseModel):
    command: str
    approved: bool
    executed: bool
    returncode: int | None = None
    stdout: str = ""
    stderr: str = ""
    message: str = ""


class WorkspaceService:
    def __init__(self, root: Path) -> None:
        self.root = root.resolve()
        if not self.root.exists():
            raise WorkspaceError(f"workspace does not exist: {self.root}")
        if not self.root.is_dir():
            raise WorkspaceError(f"workspace is not a directory: {self.root}")

    def resolve_inside(self, relative_path: str = ".") -> Path:
        candidate = (self.root / relative_path).resolve()
        if candidate != self.root and self.root not in candidate.parents:
            raise WorkspaceError("path is outside the active workspace")
        return candidate

    def list_files(self, relative_path: str = ".") -> list[FileEntry]:
        base = self.resolve_inside(relative_path)
        if not base.exists():
            raise WorkspaceError(f"path does not exist: {relative_path}")
        if not base.is_dir():
            raise WorkspaceError(f"path is not a directory: {relative_path}")

        entries: list[FileEntry] = []
        for item in sorted(base.iterdir(), key=lambda path: (not path.is_dir(), path.name.lower())):
            if item.name in {".git", "node_modules", "__pycache__", ".pytest_cache"}:
                continue
            rel = item.relative_to(self.root).as_posix()
            entries.append(
                FileEntry(
                    path=rel,
                    name=item.name,
                    type="directory" if item.is_dir() else "file",
                    size=None if item.is_dir() else item.stat().st_size,
                )
            )
        return entries

    def read_file(self, relative_path: str) -> FileReadResult:
        path = self.resolve_inside(relative_path)
        if not path.is_file():
            raise WorkspaceError(f"path is not a file: {relative_path}")
        return FileReadResult(path=relative_path, content=path.read_text(encoding="utf-8"))

    def diff_file(self, relative_path: str, new_content: str) -> DiffResult:
        path = self.resolve_inside(relative_path)
        old_content = path.read_text(encoding="utf-8") if path.exists() else ""
        diff = difflib.unified_diff(
            old_content.splitlines(keepends=True),
            new_content.splitlines(keepends=True),
            fromfile=f"a/{relative_path}",
            tofile=f"b/{relative_path}",
        )
        return DiffResult(path=relative_path, diff="".join(diff))

    def write_file(self, relative_path: str, new_content: str, approved: bool) -> WriteResult:
        diff = self.diff_file(relative_path, new_content).diff
        if not approved:
            return WriteResult(path=relative_path, written=False, diff=diff)
        path = self.resolve_inside(relative_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(new_content, encoding="utf-8")
        return WriteResult(path=relative_path, written=True, diff=diff)

    def run_powershell(self, command: str, approved: bool) -> CommandResult:
        if not approved:
            return CommandResult(
                command=command,
                approved=False,
                executed=False,
                message="PowerShell command requires explicit approval.",
            )
        completed = subprocess.run(
            ["powershell", "-NoProfile", "-Command", command],
            cwd=self.root,
            capture_output=True,
            text=True,
            timeout=60,
            check=False,
        )
        return CommandResult(
            command=command,
            approved=True,
            executed=True,
            returncode=completed.returncode,
            stdout=completed.stdout,
            stderr=completed.stderr,
        )

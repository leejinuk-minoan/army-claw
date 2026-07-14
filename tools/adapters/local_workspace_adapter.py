#!/usr/bin/env python3
"""Army Claw local workspace adapter boundary.

Task 028 introduced proof-mode validation. Task 029 added a controlled dry-run
boundary. Task 030 added a read-only manifest boundary. Task 031 adds a staged
output boundary that can write request-provided generated content only into a
controlled temporary staging sandbox during local unit tests.

This module must not mutate a real user workspace. It does not inspect real
user workspace contents, read real user file contents, invoke Hancom COM,
invoke native applications, access public internet, or generate real office
documents. Any staged output write is limited to an explicit test sandbox root
provided by the local unit-test harness and is reported separately from
production/user workspace mutation.
"""

from __future__ import annotations

import errno
import hashlib
import os
import secrets
import stat
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path, PurePosixPath
from typing import Any, Dict, List, Mapping, Optional, Sequence, Set

CONTRACT_VERSION = "army-claw-local-workspace-adapter-staged-output-031.v1"
READ_ONLY_MANIFEST_CONTRACT_VERSION = "army-claw-local-workspace-adapter-read-only-manifest-030.v1"
CONTROLLED_DRY_RUN_CONTRACT_VERSION = "army-claw-local-workspace-adapter-controlled-dry-run-029.v1"
PROOF_MODE_CONTRACT_VERSION = "army-claw-local-workspace-adapter-proof-mode-028.v1"
COMMON_CONTRACT_VERSION = "army-claw-common-office-adapter-interface-023.v1"
CONTROLLED_PROMOTION_CONTRACT_VERSION = "army-claw-local-workspace-controlled-promotion-035.v1"
CONTROLLED_PROMOTION_OPERATION = "promote_staged_output"
CONTROLLED_PROMOTION_EXECUTION_MODE = "controlled_promotion"
TARGET_ID = "local_workspace"
ADAPTER_SLOT_ID = "local_workspace_adapter_slot"
PLAN_TYPE = "local_workspace_action_plan"
FIXED_CREATED_AT = "2026-07-10T00:00:00Z"

ALLOWED_OPERATION_CLASSES = {
    "inspect_workspace_manifest",
    "validate_relative_path",
    "create_output_directory",
    "write_generated_text_artifact",
    "copy_source_to_output",
    "record_evidence_manifest",
}
READ_ONLY_MANIFEST_OPERATION_CLASSES = {"inspect_workspace_manifest", "validate_relative_path"}
STAGED_OUTPUT_OPERATION_CLASSES = {"write_generated_text_artifact", "record_evidence_manifest"}

TEXT_ARTIFACT_TYPES = {"md", "markdown", "json", "txt", "csv", "yaml", "yml"}
FOLDER_ARTIFACT_TYPES = {"folder"}
ALLOWED_ARTIFACT_TYPES = TEXT_ARTIFACT_TYPES | FOLDER_ARTIFACT_TYPES
MUTATING_OPERATION_CLASSES = {
    "create_output_directory",
    "write_generated_text_artifact",
    "copy_source_to_output",
    "record_evidence_manifest",
}
FORBIDDEN_MANIFEST_METADATA_KEYS = {
    "raw_content",
    "content",
    "extracted_text",
    "content_hash",
    "sha256",
    "native_app_state",
    "preview_text",
}

WINDOWS_RESERVED_DEVICE_NAMES = {
    "CON",
    "PRN",
    "AUX",
    "NUL",
    *(f"COM{index}" for index in range(1, 10)),
    *(f"LPT{index}" for index in range(1, 10)),
}

CONTROLLED_PROMOTION_REQUIRED_CONSTRAINTS = {
    "retain_staged_source": True,
    "require_digest_match": True,
    "require_exclusive_create": True,
    "allow_cross_volume_copy": False,
    "allow_symlink": False,
    "allow_hardlink": False,
    "allow_reparse_point": False,
    "allow_public_internet": False,
}


class LocalWorkspaceAdapterError(ValueError):
    """Raised when a local workspace request violates the adapter contract."""

    def __init__(self, error_code: str, message: str, *, recoverable: bool = True) -> None:
        super().__init__(message)
        self.error_code = error_code
        self.message = message
        self.recoverable = recoverable


@dataclass(frozen=True)
class OperationProof:
    operation_id: str
    operation_class: str
    relative_input_path: Optional[str] = None
    relative_output_path: Optional[str] = None
    expected_artifact_type: Optional[str] = None
    proof_status: str = "accepted_in_proof"
    would_mutate_filesystem: bool = False
    warnings: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "operation_id": self.operation_id,
            "operation_class": self.operation_class,
            "relative_input_path": self.relative_input_path,
            "relative_output_path": self.relative_output_path,
            "expected_artifact_type": self.expected_artifact_type,
            "proof_status": self.proof_status,
            "would_mutate_filesystem": self.would_mutate_filesystem,
            "warnings": list(self.warnings),
        }


@dataclass(frozen=True)
class DryRunReceipt:
    operation_id: str
    operation_class: str
    status: str
    canonical_relative_input_path: Optional[str]
    canonical_relative_output_path: Optional[str]
    expected_artifact_type: Optional[str]
    would_mutate_filesystem_in_real_execution: bool
    actual_file_system_mutation_performed: bool = False
    actual_adapter_invoked: bool = False
    requires_public_internet: bool = False
    overwrite_existing: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "operation_id": self.operation_id,
            "operation_class": self.operation_class,
            "status": self.status,
            "canonical_relative_input_path": self.canonical_relative_input_path,
            "canonical_relative_output_path": self.canonical_relative_output_path,
            "expected_artifact_type": self.expected_artifact_type,
            "would_mutate_filesystem_in_real_execution": self.would_mutate_filesystem_in_real_execution,
            "actual_file_system_mutation_performed": self.actual_file_system_mutation_performed,
            "actual_adapter_invoked": self.actual_adapter_invoked,
            "requires_public_internet": self.requires_public_internet,
            "overwrite_existing": self.overwrite_existing,
        }


@dataclass(frozen=True)
class PlannedOutputArtifact:
    operation_id: str
    artifact_type: str
    relative_output_path: str
    status: str = "planned_only"
    actual_file_system_mutation_performed: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "operation_id": self.operation_id,
            "artifact_type": self.artifact_type,
            "relative_output_path": self.relative_output_path,
            "status": self.status,
            "actual_file_system_mutation_performed": self.actual_file_system_mutation_performed,
        }


@dataclass(frozen=True)
class ManifestReceipt:
    operation_id: str
    operation_class: str
    status: str
    manifest_entry_count: int
    file_content_read_performed: bool = False
    actual_file_system_mutation_performed: bool = False
    actual_adapter_invoked: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "operation_id": self.operation_id,
            "operation_class": self.operation_class,
            "status": self.status,
            "manifest_entry_count": self.manifest_entry_count,
            "file_content_read_performed": self.file_content_read_performed,
            "actual_file_system_mutation_performed": self.actual_file_system_mutation_performed,
            "actual_adapter_invoked": self.actual_adapter_invoked,
        }


@dataclass(frozen=True)
class StagedOutputArtifact:
    operation_id: str
    artifact_type: str
    staging_root_reference: str
    relative_staging_path: str
    generated_content_source: str = "request_provided_generated_content"
    status: str = "staged_in_test_sandbox"
    actual_file_system_mutation_performed: bool = False
    user_workspace_file_system_mutation_performed: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "operation_id": self.operation_id,
            "artifact_type": self.artifact_type,
            "staging_root_reference": self.staging_root_reference,
            "relative_staging_path": self.relative_staging_path,
            "generated_content_source": self.generated_content_source,
            "status": self.status,
            "actual_file_system_mutation_performed": self.actual_file_system_mutation_performed,
            "user_workspace_file_system_mutation_performed": self.user_workspace_file_system_mutation_performed,
        }


@dataclass(frozen=True)
class StagedOutputReceipt:
    operation_id: str
    operation_class: str
    status: str
    canonical_relative_staging_path: str
    expected_artifact_type: str
    staged_output_sandbox_write_performed: bool
    actual_file_system_mutation_performed: bool = False
    user_workspace_file_system_mutation_performed: bool = False
    actual_adapter_invoked: bool = False
    file_content_read_performed: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "operation_id": self.operation_id,
            "operation_class": self.operation_class,
            "status": self.status,
            "canonical_relative_staging_path": self.canonical_relative_staging_path,
            "expected_artifact_type": self.expected_artifact_type,
            "staged_output_sandbox_write_performed": self.staged_output_sandbox_write_performed,
            "actual_file_system_mutation_performed": self.actual_file_system_mutation_performed,
            "user_workspace_file_system_mutation_performed": self.user_workspace_file_system_mutation_performed,
            "actual_adapter_invoked": self.actual_adapter_invoked,
            "file_content_read_performed": self.file_content_read_performed,
        }


@dataclass(frozen=True)
class PromotionAuthorization:
    authorization_id: str
    artifact_id: str
    manifest_id: str
    destination_root_id: str
    destination_relative_path: str
    request_id: str
    single_use: bool = True


@dataclass(frozen=True)
class PromotionArtifactReference:
    artifact_id: str
    manifest_id: str
    normalized_relative_path: str
    byte_size: int
    digest_algorithm: str
    digest: str


@dataclass(frozen=True)
class PromotionDestination:
    approved_root_id: str
    normalized_relative_path: str
    overwrite_allowed: bool = False


@dataclass(frozen=True)
class PromotionVerification:
    source_sha256: str
    source_size: int
    destination_sha256: str
    destination_size: int
    source_retained: bool
    destination_inside_approved_root: bool

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source_sha256": self.source_sha256,
            "source_size": self.source_size,
            "destination_sha256": self.destination_sha256,
            "destination_size": self.destination_size,
            "source_retained": self.source_retained,
            "destination_inside_approved_root": self.destination_inside_approved_root,
        }


@dataclass(frozen=True)
class PromotionSafetyAssertions:
    controlled_promotion_boundary_evaluated: bool = True
    controlled_promotion_boundary_invoked: bool = True
    promotion_authorization_verified: bool = True
    approved_root_verified: bool = True
    manifest_link_verified: bool = True
    source_digest_verified: bool = True
    destination_digest_verified: bool = True
    exclusive_create_verified: bool = True
    source_retained: bool = True
    staged_output_sandbox_write_performed: bool = False
    controlled_test_promotion_performed: bool = True
    production_promotion_performed: bool = False
    actual_adapter_invoked: bool = False
    actual_file_system_mutation_performed: bool = True
    user_workspace_file_system_mutation_performed: bool = False
    file_content_read_performed: bool = True
    local_hancom_com_executed: bool = False
    real_hwp_hwpx_hancell_hanshow_artifact_generated: bool = False
    public_internet_access_performed: bool = False
    dependency_install_performed: bool = False
    source_mutated: bool = False
    temporary_path_cleaned: bool = True

    def to_dict(self) -> Dict[str, Any]:
        return dict(self.__dict__)


@dataclass(frozen=True)
class PromotionReceipt:
    request_id: str
    operation: str
    execution_mode: str
    contract_version: str
    status: str
    authorization: PromotionAuthorization
    source: PromotionArtifactReference
    destination: PromotionDestination
    verification: PromotionVerification
    safety_assertions: PromotionSafetyAssertions

    def to_dict(self) -> Dict[str, Any]:
        safety = self.safety_assertions.to_dict()
        return {
            "request_id": self.request_id,
            "operation": self.operation,
            "execution_mode": self.execution_mode,
            "contract_version": self.contract_version,
            "status": self.status,
            "authorization": dict(self.authorization.__dict__),
            "source": dict(self.source.__dict__),
            "destination": dict(self.destination.__dict__),
            "verification": self.verification.to_dict(),
            "safety_assertions": safety,
        }


@dataclass
class FilesystemProbe:
    """Test-controllable filesystem probe for fail-closed promotion checks."""

    device_identity_overrides: Mapping[str, Any] = field(default_factory=dict)
    reparse_paths: Set[str] = field(default_factory=set)
    symlink_paths: Set[str] = field(default_factory=set)
    reparse_inspection_error_paths: Set[str] = field(default_factory=set)
    root_symlink_paths: Set[str] = field(default_factory=set)
    root_reparse_paths: Set[str] = field(default_factory=set)
    root_inspection_failure_paths: Set[str] = field(default_factory=set)
    directory_entries_overrides: Mapping[str, Sequence[str]] = field(default_factory=dict)
    directory_listing_failure_paths: Set[str] = field(default_factory=set)
    read_failure_paths: Set[str] = field(default_factory=set)
    hash_failure_paths: Set[str] = field(default_factory=set)
    fail_exclusive_commit: bool = False
    unsupported_link: bool = False
    cleanup_failure: bool = False
    temp_cleanup_failure_count: int = 0
    final_cleanup_failure: bool = False
    temp_creation_failure: bool = False
    source_changed_after_validation: bool = False

    def _key(self, path: Path) -> str:
        return str(path.absolute()).casefold()

    def _contains_key(self, values: Set[str], path: Path) -> bool:
        return self._key(path) in {item.casefold() for item in values}

    def device_identity(self, path: Path) -> Any:
        key = self._key(path)
        for raw_path, value in self.device_identity_overrides.items():
            if str(raw_path).casefold() == key:
                return value
        try:
            return path.stat().st_dev
        except OSError as exc:
            raise LocalWorkspaceAdapterError("unsupported_safety_check", f"cannot determine device identity for {path}") from exc

    def is_reparse_point(self, path: Path) -> bool:
        key = self._key(path)
        if key in {item.casefold() for item in self.reparse_inspection_error_paths | self.root_inspection_failure_paths}:
            raise LocalWorkspaceAdapterError("unsupported_safety_check", f"cannot inspect reparse point status for {path}")
        if key in {item.casefold() for item in self.reparse_paths | self.root_reparse_paths}:
            return True
        try:
            attrs = getattr(path.lstat(), "st_file_attributes", 0)
        except OSError as exc:
            raise LocalWorkspaceAdapterError("unsupported_safety_check", f"cannot inspect reparse point status for {path}") from exc
        return bool(attrs & getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0))

    def is_symlink(self, path: Path, stat_result: os.stat_result) -> bool:
        if self._key(path) in {item.casefold() for item in self.symlink_paths | self.root_symlink_paths}:
            return True
        return stat.S_ISLNK(stat_result.st_mode)

    def directory_entries(self, path: Path) -> Sequence[str]:
        key = self._key(path)
        if key in {item.casefold() for item in self.directory_listing_failure_paths}:
            raise LocalWorkspaceAdapterError("unsupported_safety_check", f"cannot list directory entries for {path}")
        for raw_path, entries in self.directory_entries_overrides.items():
            if str(raw_path).casefold() == key:
                return list(entries)
        try:
            return [item.name for item in path.iterdir()]
        except OSError as exc:
            raise LocalWorkspaceAdapterError("unsupported_safety_check", f"cannot list directory entries for {path}") from exc

    def read_bytes(self, path: Path) -> bytes:
        if self._contains_key(self.read_failure_paths, path):
            raise LocalWorkspaceAdapterError("final_verification_failed", f"cannot read file: {path}")
        try:
            return path.read_bytes()
        except OSError as exc:
            raise LocalWorkspaceAdapterError("final_verification_failed", f"cannot read file: {path}") from exc

    def stat_file(self, path: Path, error_code: str = "unsupported_safety_check") -> os.stat_result:
        try:
            return path.stat()
        except OSError as exc:
            raise LocalWorkspaceAdapterError(error_code, f"cannot stat file: {path}") from exc

    def sha256_file(self, path: Path, error_code: str = "final_verification_failed") -> str:
        if self._contains_key(self.hash_failure_paths, path):
            raise LocalWorkspaceAdapterError(error_code, f"cannot hash file: {path}")
        try:
            return _sha256_file(path)
        except OSError as exc:
            raise LocalWorkspaceAdapterError(error_code, f"cannot hash file: {path}") from exc

    def link(self, temp_path: Path, final_path: Path) -> None:
        if self.unsupported_link:
            raise LocalWorkspaceAdapterError("unsupported_safety_check", "exclusive link commit is unsupported")
        if self.fail_exclusive_commit:
            raise FileExistsError(errno.EEXIST, "simulated exclusive commit failure", str(final_path))
        os.link(temp_path, final_path, follow_symlinks=False)

    def unlink_temp(self, temp_path: Path) -> None:
        if self.cleanup_failure or self.temp_cleanup_failure_count > 0:
            if self.temp_cleanup_failure_count > 0:
                self.temp_cleanup_failure_count -= 1
            raise LocalWorkspaceAdapterError("temporary_cleanup_failed", f"failed to cleanup temporary file: {temp_path}")
        temp_path.unlink(missing_ok=True)

    def unlink_final(self, final_path: Path) -> None:
        if self.final_cleanup_failure:
            raise LocalWorkspaceAdapterError("temporary_cleanup_failed", f"failed to cleanup final file: {final_path}")
        final_path.unlink(missing_ok=True)


@dataclass
class PromotionExecutionAudit:
    boundary_invoked: bool = True
    source_content_read: bool = False
    temp_created: bool = False
    final_created: bool = False
    cleanup_performed: bool = False
    source_mutated: bool = False
    temp_cleanup_attempted: bool = False
    temp_cleanup_succeeded: bool = True
    final_cleanup_attempted: bool = False
    final_cleanup_succeeded: bool = True
    cleanup_errors: list[str] = field(default_factory=list)
    original_error_code: str = "none"

    @property
    def cleanup_attempted(self) -> bool:
        return self.temp_cleanup_attempted or self.final_cleanup_attempted

    @property
    def cleanup_complete(self) -> bool:
        return not self.cleanup_errors and self.temp_cleanup_succeeded and self.final_cleanup_succeeded


def _created_at(request: Mapping[str, Any]) -> str:
    value = request.get("created_at")
    return value if isinstance(value, str) and value else FIXED_CREATED_AT


def _mapping(value: Any, name: str) -> Mapping[str, Any]:
    if isinstance(value, Mapping):
        return value
    raise LocalWorkspaceAdapterError("schema_validation_error", f"{name} must be an object")


def _string(value: Any, name: str) -> str:
    if isinstance(value, str) and value:
        return value
    raise LocalWorkspaceAdapterError("schema_validation_error", f"{name} must be a non-empty string")


def _bool(value: Any, name: str) -> bool:
    if isinstance(value, bool):
        return value
    raise LocalWorkspaceAdapterError("schema_validation_error", f"{name} must be boolean")


def _operation_batch(value: Any) -> Sequence[Mapping[str, Any]]:
    if not isinstance(value, list) or not value:
        raise LocalWorkspaceAdapterError("schema_validation_error", "operation_batch must be a non-empty list")
    if not all(isinstance(item, Mapping) for item in value):
        raise LocalWorkspaceAdapterError("schema_validation_error", "every operation must be an object")
    return value  # type: ignore[return-value]


def _canonicalize_relative_path(path_value: Optional[str], name: str) -> Optional[str]:
    if path_value is None:
        return None
    if not isinstance(path_value, str) or not path_value:
        raise LocalWorkspaceAdapterError("template_reference_error", f"{name} must be a non-empty relative path when provided")
    if "\\" in path_value:
        raise LocalWorkspaceAdapterError("template_reference_error", f"{name} must use POSIX-style relative path separators")
    if PurePosixPath(path_value).is_absolute():
        raise LocalWorkspaceAdapterError("template_reference_error", f"{name} must not be an absolute path")
    parts = path_value.split("/")
    if any(part in ("", ".", "..") for part in parts):
        raise LocalWorkspaceAdapterError("template_reference_error", f"{name} contains unsafe path segment")
    return "/".join(parts)


def _promotion_error(error_code: str, message: str, audit: Optional[PromotionExecutionAudit] = None) -> Dict[str, Any]:
    audit = audit or PromotionExecutionAudit()
    return {
        "status": "blocked",
        "error_code": error_code,
        "error_category": error_code,
        "blocking": True,
        "message": message,
        "safety_assertions": {
            "controlled_promotion_boundary_evaluated": True,
            "controlled_promotion_boundary_invoked": audit.boundary_invoked,
            "controlled_test_promotion_performed": False,
            "production_promotion_performed": False,
            "actual_adapter_invoked": False,
            "actual_file_system_mutation_performed": audit.temp_created or audit.final_created or audit.cleanup_performed,
            "user_workspace_file_system_mutation_performed": False,
            "file_content_read_performed": audit.source_content_read,
            "source_retained": True,
            "source_mutated": audit.source_mutated,
            "temporary_path_cleaned": audit.temp_cleanup_succeeded,
            "final_path_cleaned": audit.final_cleanup_succeeded,
            "cleanup_attempted": audit.cleanup_attempted,
            "cleanup_complete": audit.cleanup_complete,
            "cleanup_error_codes": list(audit.cleanup_errors),
            "original_error_code": audit.original_error_code,
            "local_hancom_com_executed": False,
            "real_hwp_hwpx_hancell_hanshow_artifact_generated": False,
            "public_internet_access_performed": False,
            "dependency_install_performed": False,
        },
    }


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _validate_controlled_promotion_relative_path(value: Any, *, role: str) -> str:
    if not isinstance(value, str) or not value:
        raise LocalWorkspaceAdapterError(f"{role}_path_traversal", f"{role} path must be a non-empty string")
    if value != unicodedata.normalize("NFC", value):
        raise LocalWorkspaceAdapterError(f"{role}_path_traversal", f"{role} path must be NFC normalized")
    if "\x00" in value or any(ord(ch) < 32 or 127 <= ord(ch) <= 159 for ch in value):
        raise LocalWorkspaceAdapterError(f"{role}_path_traversal", f"{role} path contains control characters")
    if "\\" in value:
        raise LocalWorkspaceAdapterError(f"{role}_path_traversal", f"{role} path must use POSIX separators")
    if value.startswith(("/", "//", "~")) or (len(value) >= 2 and value[1] == ":"):
        raise LocalWorkspaceAdapterError(f"{role}_absolute_path_not_allowed", f"{role} path must be relative")
    parts = value.split("/")
    if any(part in ("", ".", "..") for part in parts):
        raise LocalWorkspaceAdapterError(f"{role}_path_traversal", f"{role} path contains unsafe segment")
    for part in parts:
        if part.rstrip(" .") != part:
            raise LocalWorkspaceAdapterError(f"{role}_reserved_name", f"{role} path segment has trailing dot or space")
        if part.split(".", 1)[0].upper() in WINDOWS_RESERVED_DEVICE_NAMES:
            raise LocalWorkspaceAdapterError(f"{role}_reserved_name", f"{role} path segment uses a reserved device name")
    return str(PurePosixPath(*parts))


def _safe_join(root: Path, relative_path: str, error_code: str) -> Path:
    root_abs = root.resolve(strict=False)
    candidate = root_abs.joinpath(*PurePosixPath(relative_path).parts)
    try:
        candidate.relative_to(root_abs)
    except ValueError as exc:
        raise LocalWorkspaceAdapterError(error_code, f"path escapes root: {relative_path}") from exc
    return candidate


def _assert_no_reparse_or_symlink(path: Path, probe: FilesystemProbe, error_code: str) -> None:
    try:
        stat_result = path.lstat()
    except OSError as exc:
        raise LocalWorkspaceAdapterError("unsupported_safety_check", f"cannot lstat {path}") from exc
    if probe.is_symlink(path, stat_result):
        raise LocalWorkspaceAdapterError("symlink_not_allowed", f"symlink not allowed: {path}")
    if probe.is_reparse_point(path):
        raise LocalWorkspaceAdapterError(error_code, f"reparse point not allowed: {path}")


def _validate_injected_root(raw_root: Path, *, probe: FilesystemProbe, role: str) -> Path:
    try:
        stat_result = raw_root.lstat()
    except OSError as exc:
        if probe._contains_key(probe.root_symlink_paths, raw_root):
            raise LocalWorkspaceAdapterError("symlink_not_allowed", f"{role} root symlink not allowed: {raw_root}") from exc
        if probe._contains_key(probe.root_reparse_paths, raw_root):
            raise LocalWorkspaceAdapterError("reparse_point_not_allowed", f"{role} root reparse point not allowed: {raw_root}") from exc
        if probe._contains_key(probe.root_inspection_failure_paths, raw_root):
            raise LocalWorkspaceAdapterError("unsupported_safety_check", f"cannot inspect {role} root: {raw_root}") from exc
        error_code = "source_outside_staged_root" if role == "staged" else "approved_root_not_allowed"
        raise LocalWorkspaceAdapterError(error_code, f"{role} root is missing: {raw_root}") from exc
    if probe.is_symlink(raw_root, stat_result):
        raise LocalWorkspaceAdapterError("symlink_not_allowed", f"{role} root symlink not allowed: {raw_root}")
    if probe.is_reparse_point(raw_root):
        raise LocalWorkspaceAdapterError("reparse_point_not_allowed", f"{role} root reparse point not allowed: {raw_root}")
    if not stat.S_ISDIR(stat_result.st_mode):
        error_code = "source_outside_staged_root" if role == "staged" else "approved_root_not_allowed"
        raise LocalWorkspaceAdapterError(error_code, f"{role} root is not a directory: {raw_root}")
    return raw_root.resolve(strict=False)


def _assert_path_components_safe(root: Path, path: Path, probe: FilesystemProbe, final_must_exist: bool = True) -> None:
    current = root.resolve(strict=False)
    _assert_no_reparse_or_symlink(current, probe, "reparse_point_not_allowed")
    relative_parts = path.relative_to(current).parts
    last_index = len(relative_parts) - 1
    for index, part in enumerate(relative_parts):
        current = current / part
        if not current.exists():
            if index == last_index and not final_must_exist:
                return
            raise LocalWorkspaceAdapterError("manifest_reference_mismatch", f"path component missing: {current}")
        _assert_no_reparse_or_symlink(current, probe, "reparse_point_not_allowed")


def _assert_destination_casefold_safe(approved_root: Path, destination_relative_path: str, probe: FilesystemProbe) -> None:
    current = approved_root.resolve(strict=False)
    parts = PurePosixPath(destination_relative_path).parts
    for index, part in enumerate(parts):
        if not current.exists():
            raise LocalWorkspaceAdapterError("destination_outside_approved_root", f"destination parent missing: {current}")
        if not current.is_dir():
            raise LocalWorkspaceAdapterError("destination_outside_approved_root", f"destination parent is not a directory: {current}")
        for child_name in probe.directory_entries(current):
            if child_name.casefold() == part.casefold() and child_name != part:
                raise LocalWorkspaceAdapterError("destination_case_collision", f"destination sibling case collision: {part}")
        current = current / part
        if index < len(parts) - 1 and current.exists():
            _assert_no_reparse_or_symlink(current, probe, "reparse_point_not_allowed")


def _validate_promotion_source(value: Any) -> PromotionArtifactReference:
    source = _mapping(value, "source")
    artifact_id = _string(source.get("artifact_id"), "source.artifact_id")
    manifest_id = _string(source.get("manifest_id"), "source.manifest_id")
    relative_path = _validate_controlled_promotion_relative_path(source.get("normalized_relative_path"), role="source")
    byte_size = source.get("byte_size")
    if not isinstance(byte_size, int) or byte_size < 0:
        raise LocalWorkspaceAdapterError("source_size_mismatch", "source.byte_size must be a non-negative integer")
    digest = _mapping(source.get("digest"), "source.digest")
    algorithm = _string(digest.get("algorithm"), "source.digest.algorithm")
    value_digest = _string(digest.get("value"), "source.digest.value")
    if algorithm != "sha256":
        raise LocalWorkspaceAdapterError("digest_algorithm_not_allowed", "only sha256 digest is allowed")
    if len(value_digest) != 64 or value_digest.lower() != value_digest or any(ch not in "0123456789abcdef" for ch in value_digest):
        raise LocalWorkspaceAdapterError("source_digest_mismatch", "source digest must be 64 lowercase hex characters")
    return PromotionArtifactReference(artifact_id, manifest_id, relative_path, byte_size, algorithm, value_digest)


def _validate_promotion_destination(value: Any) -> PromotionDestination:
    destination = _mapping(value, "destination")
    root_id = _string(destination.get("approved_root_id"), "destination.approved_root_id")
    relative_path = _validate_controlled_promotion_relative_path(destination.get("normalized_relative_path"), role="destination")
    if destination.get("overwrite_allowed") is not False:
        raise LocalWorkspaceAdapterError("destination_exists", "controlled promotion requires overwrite_allowed=false")
    return PromotionDestination(root_id, relative_path, False)


def _validate_promotion_authorization(value: Any, request_id: str, source: PromotionArtifactReference, destination: PromotionDestination) -> PromotionAuthorization:
    if not isinstance(value, Mapping):
        raise LocalWorkspaceAdapterError("promotion_authorization_missing", "authorization is required")
    authorization = _mapping(value, "authorization")
    authorization_id = _string(authorization.get("authorization_id"), "authorization.authorization_id")
    if authorization_id in {"*", "all"}:
        raise LocalWorkspaceAdapterError("promotion_authorization_invalid", "wildcard authorization is not allowed")
    bindings = authorization.get("bindings")
    if not isinstance(bindings, list) or len(bindings) != 1 or not isinstance(bindings[0], Mapping):
        raise LocalWorkspaceAdapterError("promotion_authorization_missing", "exactly one authorization binding is required")
    binding = bindings[0]
    expected = {
        "request_id": request_id,
        "artifact_id": source.artifact_id,
        "manifest_id": source.manifest_id,
        "destination_root_id": destination.approved_root_id,
        "destination_relative_path": destination.normalized_relative_path,
    }
    actual = {key: binding.get(key) for key in expected}
    if actual != expected:
        raise LocalWorkspaceAdapterError("authorization_binding_mismatch", "authorization binding does not match source and destination")
    if authorization.get("single_use") is not True:
        raise LocalWorkspaceAdapterError("promotion_authorization_invalid", "authorization must be single-use")
    if authorization.get("used") is True:
        raise LocalWorkspaceAdapterError("authorization_reuse_conflict", "authorization has already been used")
    return PromotionAuthorization(authorization_id, source.artifact_id, source.manifest_id, destination.approved_root_id, destination.normalized_relative_path, request_id)


def _validate_promotion_constraints(value: Any) -> None:
    constraints = _mapping(value, "constraints")
    for key, expected in CONTROLLED_PROMOTION_REQUIRED_CONSTRAINTS.items():
        if constraints.get(key) is not expected:
            raise LocalWorkspaceAdapterError("constraint_violation", f"controlled promotion constraint {key} must be {expected}")


def _manifest_artifacts(manifest: Mapping[str, Any]) -> Sequence[Mapping[str, Any]]:
    artifacts = manifest.get("artifacts")
    if isinstance(artifacts, list):
        return [item for item in artifacts if isinstance(item, Mapping)]
    if isinstance(manifest.get("staged_output_artifacts"), list):
        return [item for item in manifest["staged_output_artifacts"] if isinstance(item, Mapping)]
    return []


def _inner_manifest_document(manifest_document: Mapping[str, Any]) -> Mapping[str, Any]:
    nested = manifest_document.get("manifest")
    if isinstance(nested, Mapping):
        return nested
    return manifest_document


def _validate_manifest_link(manifest: Mapping[str, Any], source: PromotionArtifactReference) -> None:
    manifest = _inner_manifest_document(manifest)
    if manifest.get("manifest_id") != source.manifest_id:
        raise LocalWorkspaceAdapterError("manifest_missing", "manifest_id mismatch")
    if manifest.get("execution_mode") == "staged_output_evidence_manifest":
        if manifest.get("sandbox_scope") is not True:
            raise LocalWorkspaceAdapterError("manifest_reference_mismatch", "Task 033 manifest sandbox_scope must be true")
        validation = manifest.get("validation")
        required_validation_flags = (
            "valid",
            "canonical_serialization_valid",
            "digest_verification_valid",
            "relationship_integrity_valid",
            "path_policy_valid",
        )
        if not isinstance(validation, Mapping) or any(validation.get(key) is not True for key in required_validation_flags):
            raise LocalWorkspaceAdapterError("manifest_reference_mismatch", "Task 033 manifest validation flags must be true")
        artifacts = _manifest_artifacts(manifest)
        artifact_matches = [item for item in artifacts if item.get("artifact_id") == source.artifact_id]
        if len(artifact_matches) != 1:
            raise LocalWorkspaceAdapterError("manifest_artifact_missing", "Task 033 manifest must contain exactly one matching artifact")
        artifact = artifact_matches[0]
        if artifact.get("normalized_relative_path") != source.normalized_relative_path or artifact.get("byte_size") != source.byte_size:
            raise LocalWorkspaceAdapterError("manifest_reference_mismatch", "Task 033 artifact path or byte size mismatch")
        if artifact.get("digest_algorithm") != "sha256":
            raise LocalWorkspaceAdapterError("digest_algorithm_not_allowed", "Task 033 artifact digest_algorithm must be sha256")
        if artifact.get("digest_value") != source.digest:
            raise LocalWorkspaceAdapterError("manifest_reference_mismatch", "Task 033 artifact digest mismatch")
        receipt_id = artifact.get("receipt_id")
        if not isinstance(receipt_id, str) or not receipt_id:
            raise LocalWorkspaceAdapterError("manifest_reference_mismatch", "Task 033 artifact receipt_id missing")
        if artifact.get("sandbox_only") is not True:
            raise LocalWorkspaceAdapterError("manifest_reference_mismatch", "Task 033 artifact sandbox_only must be true")
        if artifact.get("promotion_status") != "not_promoted":
            raise LocalWorkspaceAdapterError("manifest_reference_mismatch", "Task 033 artifact promotion_status must be not_promoted")
        receipts = manifest.get("receipts", [])
        if not isinstance(receipts, list):
            raise LocalWorkspaceAdapterError("manifest_reference_mismatch", "Task 033 receipts must be a list")
        receipt_ids = [item.get("receipt_id") for item in receipts if isinstance(item, Mapping)]
        if len(receipt_ids) != len(set(receipt_ids)):
            raise LocalWorkspaceAdapterError("manifest_reference_mismatch", "Task 033 duplicate receipt_id")
        if receipt_id not in receipt_ids:
            raise LocalWorkspaceAdapterError("manifest_reference_mismatch", "Task 033 artifact receipt missing")
        relationships = manifest.get("relationships", [])
        if not isinstance(relationships, list):
            raise LocalWorkspaceAdapterError("manifest_reference_mismatch", "Task 033 relationships must be a list")
        valid_relationship = any(
            isinstance(item, Mapping)
            and item.get("relationship_type") == "artifact_evidenced_by_receipt"
            and item.get("source_id") == source.artifact_id
            and item.get("target_id") == receipt_id
            for item in relationships
        )
        if not valid_relationship:
            raise LocalWorkspaceAdapterError("manifest_reference_mismatch", "Task 033 artifact receipt relationship missing")
        for item in relationships:
            if not isinstance(item, Mapping):
                raise LocalWorkspaceAdapterError("manifest_reference_mismatch", "Task 033 relationship must be an object")
            if item.get("relationship_type") == "artifact_evidenced_by_receipt":
                if item.get("source_id") not in {artifact.get("artifact_id") for artifact in artifacts} or item.get("target_id") not in set(receipt_ids):
                    raise LocalWorkspaceAdapterError("manifest_reference_mismatch", "Task 033 relationship is orphaned")
        return

    validation = manifest.get("validation")
    if isinstance(validation, Mapping) and any(value is not True for value in validation.values() if isinstance(value, bool)):
        raise LocalWorkspaceAdapterError("manifest_reference_mismatch", "manifest validation flags must be true")
    matches = [item for item in _manifest_artifacts(manifest) if item.get("artifact_id") == source.artifact_id]
    if len(matches) != 1:
        raise LocalWorkspaceAdapterError("manifest_artifact_missing", "manifest must contain exactly one matching artifact")
    artifact = matches[0]
    path = artifact.get("normalized_relative_path") or artifact.get("relative_path")
    digest = artifact.get("sha256") or artifact.get("digest")
    if isinstance(digest, Mapping):
        digest = digest.get("value")
    if path != source.normalized_relative_path or artifact.get("byte_size") != source.byte_size or digest != source.digest:
        raise LocalWorkspaceAdapterError("manifest_reference_mismatch", "manifest artifact reference mismatch")
    if artifact.get("status") not in {"staged", "staged_in_test_sandbox", "staged_output_sandbox_written"}:
        raise LocalWorkspaceAdapterError("manifest_reference_mismatch", "manifest artifact status is not staged")
    if not (artifact.get("sandbox") or artifact.get("sandbox_id")):
        raise LocalWorkspaceAdapterError("manifest_reference_mismatch", "manifest artifact sandbox linkage is missing")
    relationships = manifest.get("relationships", [])
    if isinstance(relationships, list) and relationships and not any(isinstance(item, Mapping) and item.get("artifact_id") == source.artifact_id for item in relationships):
        raise LocalWorkspaceAdapterError("manifest_reference_mismatch", "manifest relationship is missing")
    receipts = manifest.get("receipts", [])
    if isinstance(receipts, list) and receipts and not any(isinstance(item, Mapping) and item.get("artifact_id") == source.artifact_id for item in receipts):
        raise LocalWorkspaceAdapterError("manifest_reference_mismatch", "manifest receipt is missing")


def _same_device_or_block(source_path: Path, destination_parent: Path, probe: FilesystemProbe) -> None:
    if probe.device_identity(source_path) != probe.device_identity(destination_parent):
        raise LocalWorkspaceAdapterError("cross_volume_promotion_not_allowed", "cross-volume controlled promotion is not allowed")


def _trusted_receipt_matches(receipt: Mapping[str, Any], request_id: str, source: PromotionArtifactReference, destination: PromotionDestination, destination_path: Path) -> bool:
    if receipt.get("status") not in {"promoted", "already_promoted"}:
        return False
    if receipt.get("request_id") != request_id or receipt.get("operation") != CONTROLLED_PROMOTION_OPERATION:
        return False
    receipt_source = receipt.get("source") if isinstance(receipt.get("source"), Mapping) else {}
    receipt_destination = receipt.get("destination") if isinstance(receipt.get("destination"), Mapping) else {}
    verification = receipt.get("verification") if isinstance(receipt.get("verification"), Mapping) else {}
    return (
        receipt_source.get("artifact_id") == source.artifact_id
        and receipt_source.get("manifest_id") == source.manifest_id
        and receipt_source.get("normalized_relative_path") == source.normalized_relative_path
        and receipt_source.get("byte_size") == source.byte_size
        and receipt_source.get("digest") == source.digest
        and receipt_destination.get("approved_root_id") == destination.approved_root_id
        and receipt_destination.get("normalized_relative_path") == destination.normalized_relative_path
        and verification.get("destination_sha256") == _sha256_file(destination_path)
        and verification.get("destination_size") == destination_path.stat().st_size
    )


def _write_exclusive_temp(destination_parent: Path, data: bytes, probe: FilesystemProbe) -> Path:
    if probe.temp_creation_failure:
        raise LocalWorkspaceAdapterError("exclusive_create_failed", f"failed to create temporary promotion file in {destination_parent}")
    try:
        destination_parent.mkdir(parents=True, exist_ok=True)
    except OSError as exc:
        raise LocalWorkspaceAdapterError("exclusive_create_failed", f"failed to prepare destination parent: {destination_parent}") from exc
    temp_path = destination_parent / f".army-claw-promotion-{secrets.token_hex(16)}.tmp"
    try:
        fd = os.open(temp_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    except OSError as exc:
        raise LocalWorkspaceAdapterError("exclusive_create_failed", f"failed to create temporary promotion file: {temp_path}") from exc
    try:
        with os.fdopen(fd, "wb") as handle:
            handle.write(data)
            handle.flush()
            os.fsync(handle.fileno())
    except Exception:
        try:
            os.close(fd)
        except OSError:
            pass
        temp_path.unlink(missing_ok=True)
        raise LocalWorkspaceAdapterError("exclusive_create_failed", f"failed to write temporary promotion file: {temp_path}")
    return temp_path


def promote_staged_output(
    request: Mapping[str, Any],
    *,
    staged_root: Path,
    approved_roots: Mapping[str, Path],
    manifest_document: Mapping[str, Any],
    trusted_receipt: Optional[Mapping[str, Any]] = None,
    filesystem_probe: Optional[FilesystemProbe] = None,
) -> Dict[str, Any]:
    """Promote one staged artifact into one approved destination root."""

    probe = filesystem_probe or FilesystemProbe()
    audit = PromotionExecutionAudit()
    temp_path: Optional[Path] = None
    final_created = False
    destination_path: Optional[Path] = None
    try:
        request_id = _string(request.get("request_id"), "request_id")
        if request.get("operation") != CONTROLLED_PROMOTION_OPERATION:
            raise LocalWorkspaceAdapterError("unsupported_operation", "operation must be promote_staged_output")
        if request.get("execution_mode") != CONTROLLED_PROMOTION_EXECUTION_MODE:
            raise LocalWorkspaceAdapterError("constraint_violation", "execution_mode must be controlled_promotion")

        source = _validate_promotion_source(request.get("source"))
        destination = _validate_promotion_destination(request.get("destination"))
        authorization = _validate_promotion_authorization(request.get("authorization"), request_id, source, destination)
        _validate_promotion_constraints(request.get("constraints"))
        _validate_manifest_link(manifest_document, source)

        staged_root = _validate_injected_root(staged_root, probe=probe, role="staged")
        approved_root = approved_roots.get(destination.approved_root_id)
        if approved_root is None:
            raise LocalWorkspaceAdapterError("approved_root_not_allowed", "destination approved root is not allowed")
        approved_root = _validate_injected_root(approved_root, probe=probe, role="approved")
        source_path = _safe_join(staged_root, source.normalized_relative_path, "source_outside_staged_root")
        destination_path = _safe_join(approved_root, destination.normalized_relative_path, "destination_outside_approved_root")
        if source_path == destination_path:
            raise LocalWorkspaceAdapterError("source_destination_collision", "source and destination must differ")
        if not source_path.exists() or not source_path.is_file():
            raise LocalWorkspaceAdapterError("manifest_reference_mismatch", "source artifact file is missing")
        _assert_path_components_safe(staged_root, source_path, probe, final_must_exist=True)
        if getattr(source_path.lstat(), "st_nlink", 1) > 1:
            raise LocalWorkspaceAdapterError("hardlink_not_allowed", "pre-existing hardlinked source is not allowed")

        source_data = probe.read_bytes(source_path)
        audit.source_content_read = True
        actual_source_size = probe.stat_file(source_path, "final_verification_failed").st_size
        actual_source_digest = probe.sha256_file(source_path, "final_verification_failed")
        if actual_source_size != source.byte_size:
            raise LocalWorkspaceAdapterError("source_size_mismatch", "source size does not match request and manifest")
        if actual_source_digest != source.digest:
            raise LocalWorkspaceAdapterError("source_digest_mismatch", "source digest does not match request and manifest")

        destination_parent = destination_path.parent
        _assert_destination_casefold_safe(approved_root, destination.normalized_relative_path, probe)
        if destination_path.exists():
            if trusted_receipt and _trusted_receipt_matches(trusted_receipt, request_id, source, destination, destination_path):
                receipt = dict(trusted_receipt)
                receipt["status"] = "already_promoted"
                return {"status": "already_promoted", "receipt": receipt, "safety_assertions": receipt.get("safety_assertions", {})}
            raise LocalWorkspaceAdapterError("destination_exists", "destination already exists")

        _assert_path_components_safe(approved_root, destination_parent, probe, final_must_exist=True)
        _same_device_or_block(source_path, destination_parent, probe)
        temp_path = _write_exclusive_temp(destination_parent, source_data, probe)
        audit.temp_created = True
        audit.temp_cleanup_succeeded = False
        if probe.stat_file(temp_path, "final_verification_failed").st_size != source.byte_size or probe.sha256_file(temp_path, "final_verification_failed") != source.digest:
            raise LocalWorkspaceAdapterError("destination_digest_mismatch", "temporary promotion digest mismatch")
        try:
            probe.link(temp_path, destination_path)
            final_created = True
            audit.final_created = True
            audit.final_cleanup_succeeded = False
        except FileExistsError as exc:
            raise LocalWorkspaceAdapterError("destination_exists", "destination was created before exclusive commit") from exc
        except OSError as exc:
            raise LocalWorkspaceAdapterError("exclusive_create_failed", f"exclusive commit failed: {exc}") from exc
        probe.unlink_temp(temp_path)
        audit.cleanup_performed = True
        audit.temp_cleanup_attempted = True
        audit.temp_cleanup_succeeded = True
        temp_path = None

        destination_digest = probe.sha256_file(destination_path, "final_verification_failed")
        destination_size = probe.stat_file(destination_path, "final_verification_failed").st_size
        if destination_digest != source.digest or destination_size != source.byte_size:
            raise LocalWorkspaceAdapterError("destination_digest_mismatch", "destination digest/size mismatch")
        if probe.source_changed_after_validation or not source_path.exists() or probe.sha256_file(source_path, "final_verification_failed") != source.digest:
            raise LocalWorkspaceAdapterError("source_changed_after_validation", "source changed after promotion validation")

        safety = PromotionSafetyAssertions()
        verification = PromotionVerification(source.digest, source.byte_size, destination_digest, destination_size, True, True)
        receipt = PromotionReceipt(
            request_id=request_id,
            operation=CONTROLLED_PROMOTION_OPERATION,
            execution_mode=CONTROLLED_PROMOTION_EXECUTION_MODE,
            contract_version=CONTROLLED_PROMOTION_CONTRACT_VERSION,
            status="promoted",
            authorization=authorization,
            source=source,
            destination=destination,
            verification=verification,
            safety_assertions=safety,
        ).to_dict()
        return {
            "request_id": request_id,
            "status": "promoted",
            "execution_allowed": False,
            "receipt": receipt,
            "safety_assertions": safety.to_dict(),
            "verification": verification.to_dict(),
            "output_artifacts": [],
        }
    except LocalWorkspaceAdapterError as exc:
        audit.original_error_code = exc.error_code
        if final_created and destination_path is not None:
            audit.final_cleanup_attempted = True
            try:
                probe.unlink_final(destination_path)
                audit.cleanup_performed = True
                audit.final_cleanup_succeeded = True
            except LocalWorkspaceAdapterError:
                audit.final_cleanup_succeeded = False
                audit.cleanup_errors.append("final_cleanup_failed")
            except OSError:
                audit.final_cleanup_succeeded = False
                audit.cleanup_errors.append("final_cleanup_failed")
        if temp_path is not None:
            audit.temp_cleanup_attempted = True
            try:
                probe.unlink_temp(temp_path)
                audit.cleanup_performed = True
                audit.temp_cleanup_succeeded = True
            except LocalWorkspaceAdapterError as cleanup_exc:
                audit.temp_cleanup_succeeded = False
                audit.cleanup_errors.append("temp_cleanup_failed")
            except OSError:
                audit.temp_cleanup_succeeded = False
                audit.cleanup_errors.append("temp_cleanup_failed")
        if audit.cleanup_errors:
            return _promotion_error("temporary_cleanup_failed", f"cleanup failed after {exc.error_code}", audit)
        return _promotion_error(exc.error_code, exc.message, audit)


def _validate_request_mapping(request: Mapping[str, Any]) -> tuple[Mapping[str, Any], Mapping[str, Any], Mapping[str, Any], Mapping[str, Any]]:
    if request.get("target_id") != TARGET_ID:
        raise LocalWorkspaceAdapterError("target_plan_mismatch", "target_id must be local_workspace")
    if request.get("adapter_slot_id") != ADAPTER_SLOT_ID:
        raise LocalWorkspaceAdapterError("adapter_slot_mismatch", "adapter_slot_id must match local_workspace")
    if request.get("plan_type") != PLAN_TYPE:
        raise LocalWorkspaceAdapterError("target_plan_mismatch", "plan_type must be local_workspace_action_plan")

    context = _mapping(request.get("execution_context"), "execution_context")
    constraints = _mapping(request.get("constraints"), "constraints")
    template_reference = _mapping(request.get("template_reference"), "template_reference")
    validated_plan = _mapping(request.get("validated_plan"), "validated_plan")

    if context.get("actual_adapter_invocation_allowed") is True:
        raise LocalWorkspaceAdapterError("actual_adapter_invocation_forbidden_in_proof", "actual adapter invocation is forbidden in proof, controlled dry-run, read-only manifest, and staged output boundaries", recoverable=False)
    if constraints.get("prevent_source_overwrite") is not True:
        raise LocalWorkspaceAdapterError("source_overwrite_blocked", "prevent_source_overwrite must be true")
    if constraints.get("allow_public_internet") is not False:
        raise LocalWorkspaceAdapterError("public_internet_dependency_blocked", "allow_public_internet must be false")
    if template_reference.get("artifact_type") != "folder":
        raise LocalWorkspaceAdapterError("unsupported_template_artifact_type", "local_workspace template artifact type must be folder")
    if template_reference.get("overwrite_source") is not False:
        raise LocalWorkspaceAdapterError("source_overwrite_blocked", "template_reference.overwrite_source must be false")

    if validated_plan.get("target_id", TARGET_ID) != TARGET_ID:
        raise LocalWorkspaceAdapterError("target_plan_mismatch", "validated_plan.target_id must be local_workspace")
    if validated_plan.get("plan_type", PLAN_TYPE) != PLAN_TYPE:
        raise LocalWorkspaceAdapterError("target_plan_mismatch", "validated_plan.plan_type must be local_workspace_action_plan")
    if validated_plan.get("llm_direct_file_edit_requested") is not False:
        raise LocalWorkspaceAdapterError("llm_direct_file_edit_blocked", "LLM direct file edit is prohibited")
    if validated_plan.get("llm_direct_native_app_state_modification_requested") is not False:
        raise LocalWorkspaceAdapterError("llm_direct_native_app_state_modification_blocked", "LLM native app state modification is prohibited")

    workspace_ref = validated_plan.get("workspace_root_reference")
    if not isinstance(workspace_ref, str) or not workspace_ref:
        raise LocalWorkspaceAdapterError("template_reference_error", "workspace_root_reference must be a non-empty reference")
    if workspace_ref.startswith(("/", "C:", "D:", "~")):
        raise LocalWorkspaceAdapterError("template_reference_error", "workspace_root_reference must be an approved reference, not a free-form absolute path")

    _validate_path_policy(validated_plan)
    _validate_artifact_policy(validated_plan)
    return context, constraints, template_reference, validated_plan


def _validate_path_policy(validated_plan: Mapping[str, Any]) -> None:
    path_policy = _mapping(validated_plan.get("path_policy"), "validated_plan.path_policy")
    if path_policy.get("absolute_paths_allowed") is not False:
        raise LocalWorkspaceAdapterError("constraint_violation", "absolute paths must be blocked")
    if path_policy.get("path_traversal_allowed") is not False:
        raise LocalWorkspaceAdapterError("constraint_violation", "path traversal must be blocked")
    if path_policy.get("backslash_paths_allowed") is not False:
        raise LocalWorkspaceAdapterError("constraint_violation", "backslash paths must be blocked")
    if path_policy.get("empty_path_segments_allowed") is not False:
        raise LocalWorkspaceAdapterError("constraint_violation", "empty path segments must be blocked")
    if path_policy.get("symlink_escape_allowed") is not False:
        raise LocalWorkspaceAdapterError("constraint_violation", "symlink escape must be blocked")
    if path_policy.get("symlink_escape_claimed_safe_without_local_probe") is True:
        raise LocalWorkspaceAdapterError("evidence_missing", "symlink escape safety cannot be claimed without local proof")
    if path_policy.get("follow_symlinks") is True:
        raise LocalWorkspaceAdapterError("constraint_violation", "boundary must not follow symlinks")
    if path_policy.get("content_read_allowed") is True:
        raise LocalWorkspaceAdapterError("llm_direct_file_edit_blocked", "file content read is prohibited")
    if path_policy.get("source_workspace_writable") is True:
        raise LocalWorkspaceAdapterError("source_overwrite_blocked", "source workspace must not be writable")
    if path_policy.get("staging_paths_relative_to_staging_root") is False:
        raise LocalWorkspaceAdapterError("constraint_violation", "staged output paths must be relative to staging root")


def _validate_artifact_policy(validated_plan: Mapping[str, Any]) -> None:
    artifact_policy = _mapping(validated_plan.get("artifact_policy"), "validated_plan.artifact_policy")
    if artifact_policy.get("source_overwrite_allowed") is not False:
        raise LocalWorkspaceAdapterError("source_overwrite_blocked", "source overwrite must be blocked")
    if artifact_policy.get("claim_real_output_artifacts") is True:
        raise LocalWorkspaceAdapterError("evidence_missing", "boundary cannot claim real output artifacts")
    if artifact_policy.get("read_file_contents") is True:
        raise LocalWorkspaceAdapterError("llm_direct_file_edit_blocked", "file content read request is prohibited")
    if artifact_policy.get("promote_to_user_workspace") is True:
        raise LocalWorkspaceAdapterError("source_overwrite_blocked", "staged output must not be promoted to user workspace")
    if artifact_policy.get("staging_path_collision_policy") not in (None, "block_if_exists"):
        raise LocalWorkspaceAdapterError("source_overwrite_blocked", "staging path collision policy must block existing targets")


def _determine_execution_mode(request: Mapping[str, Any], context: Mapping[str, Any]) -> str:
    staged_marker_present = context.get("execution_mode") == "staged_output" or context.get("staged_output") is True
    if staged_marker_present:
        if context.get("execution_mode") != "staged_output":
            raise LocalWorkspaceAdapterError("constraint_violation", "execution_context.execution_mode must be staged_output")
        if context.get("staged_output") is not True:
            raise LocalWorkspaceAdapterError("constraint_violation", "execution_context.staged_output must be true")
        if request.get("staged_output") is not True:
            raise LocalWorkspaceAdapterError("constraint_violation", "staged_output must be true for staged output boundary")
        return "staged_output"

    read_only_marker_present = context.get("execution_mode") == "read_only_manifest" or context.get("read_only_manifest") is True
    if read_only_marker_present:
        if context.get("execution_mode") != "read_only_manifest":
            raise LocalWorkspaceAdapterError("constraint_violation", "execution_context.execution_mode must be read_only_manifest")
        if context.get("read_only_manifest") is not True:
            raise LocalWorkspaceAdapterError("constraint_violation", "execution_context.read_only_manifest must be true")
        if request.get("read_only") is not True:
            raise LocalWorkspaceAdapterError("constraint_violation", "read_only must be true for read-only manifest")
        return "read_only_manifest"

    controlled_marker_present = context.get("execution_mode") == "controlled_dry_run" or context.get("controlled_dry_run") is True
    if controlled_marker_present:
        if context.get("execution_mode") != "controlled_dry_run":
            raise LocalWorkspaceAdapterError("constraint_violation", "execution_context.execution_mode must be controlled_dry_run")
        if context.get("controlled_dry_run") is not True:
            raise LocalWorkspaceAdapterError("constraint_violation", "execution_context.controlled_dry_run must be true")
        if request.get("dry_run") is not True:
            raise LocalWorkspaceAdapterError("constraint_violation", "dry_run must be true for controlled dry-run")
        return "controlled_dry_run"
    if context.get("proof_mode") is True:
        return "proof_mode"
    raise LocalWorkspaceAdapterError("constraint_violation", "proof_mode, controlled dry-run, read-only manifest, or staged output markers must be explicit")


def _validate_operation(operation: Mapping[str, Any]) -> tuple[OperationProof, DryRunReceipt, Optional[PlannedOutputArtifact]]:
    operation_id = _string(operation.get("operation_id"), "operation_id")
    operation_class = _string(operation.get("operation_class"), "operation_class")
    if operation_class not in ALLOWED_OPERATION_CLASSES:
        raise LocalWorkspaceAdapterError("unsupported_operation", f"unsupported operation_class: {operation_class}")

    overwrite_existing = _bool(operation.get("overwrite_existing"), "overwrite_existing")
    requires_public_internet = _bool(operation.get("requires_public_internet"), "requires_public_internet")
    if overwrite_existing:
        raise LocalWorkspaceAdapterError("source_overwrite_blocked", f"operation {operation_id} attempts overwrite")
    if requires_public_internet:
        raise LocalWorkspaceAdapterError("public_internet_dependency_blocked", f"operation {operation_id} requires public internet")
    if operation.get("read_file_contents") is True:
        raise LocalWorkspaceAdapterError("llm_direct_file_edit_blocked", f"operation {operation_id} requests file content read")
    if operation.get("follow_symlinks") is True:
        raise LocalWorkspaceAdapterError("constraint_violation", f"operation {operation_id} requests symlink following")

    relative_input_path = _canonicalize_relative_path(operation.get("relative_input_path"), f"operation {operation_id} relative_input_path")
    relative_output_path = _canonicalize_relative_path(operation.get("relative_output_path"), f"operation {operation_id} relative_output_path")

    expected_artifact_type = _string(operation.get("expected_artifact_type"), "expected_artifact_type")
    if expected_artifact_type not in ALLOWED_ARTIFACT_TYPES:
        raise LocalWorkspaceAdapterError("unsupported_template_artifact_type", f"unsupported expected_artifact_type: {expected_artifact_type}")

    would_mutate = operation_class in MUTATING_OPERATION_CLASSES
    warnings = ["boundary evaluation only: operation accepted but not executed"]
    if would_mutate:
        warnings.append("controlled dry-run returns planned artifacts only; no filesystem mutation occurred")

    proof = OperationProof(
        operation_id=operation_id,
        operation_class=operation_class,
        relative_input_path=relative_input_path,
        relative_output_path=relative_output_path,
        expected_artifact_type=expected_artifact_type,
        would_mutate_filesystem=would_mutate,
        warnings=warnings,
    )
    receipt = DryRunReceipt(
        operation_id=operation_id,
        operation_class=operation_class,
        status="dry_run_validated",
        canonical_relative_input_path=relative_input_path,
        canonical_relative_output_path=relative_output_path,
        expected_artifact_type=expected_artifact_type,
        would_mutate_filesystem_in_real_execution=would_mutate,
    )
    planned_artifact = None
    if relative_output_path is not None and would_mutate:
        planned_artifact = PlannedOutputArtifact(
            operation_id=operation_id,
            artifact_type=expected_artifact_type,
            relative_output_path=relative_output_path,
        )
    return proof, receipt, planned_artifact


def _validate_read_only_manifest_operation(operation: Mapping[str, Any]) -> ManifestReceipt:
    operation_id = _string(operation.get("operation_id"), "operation_id")
    operation_class = _string(operation.get("operation_class"), "operation_class")
    if operation_class not in READ_ONLY_MANIFEST_OPERATION_CLASSES:
        raise LocalWorkspaceAdapterError("unsupported_operation", f"unsupported read-only manifest operation_class: {operation_class}")
    if _bool(operation.get("overwrite_existing"), "overwrite_existing"):
        raise LocalWorkspaceAdapterError("source_overwrite_blocked", f"operation {operation_id} attempts overwrite")
    if _bool(operation.get("requires_public_internet"), "requires_public_internet"):
        raise LocalWorkspaceAdapterError("public_internet_dependency_blocked", f"operation {operation_id} requires public internet")
    if operation.get("read_file_contents") is True:
        raise LocalWorkspaceAdapterError("llm_direct_file_edit_blocked", f"operation {operation_id} requests file content read")
    if operation.get("follow_symlinks") is True:
        raise LocalWorkspaceAdapterError("constraint_violation", f"operation {operation_id} requests symlink following")
    _canonicalize_relative_path(operation.get("relative_input_path"), f"operation {operation_id} relative_input_path")
    _canonicalize_relative_path(operation.get("relative_output_path"), f"operation {operation_id} relative_output_path")
    return ManifestReceipt(
        operation_id=operation_id,
        operation_class=operation_class,
        status="read_only_manifest_validated",
        manifest_entry_count=0,
    )


def _manifest_entries_from_fixture(validated_plan: Mapping[str, Any]) -> List[Dict[str, Any]]:
    fixture = _mapping(validated_plan.get("manifest_fixture"), "validated_plan.manifest_fixture")
    raw_entries = fixture.get("entries")
    if not isinstance(raw_entries, list):
        raise LocalWorkspaceAdapterError("schema_validation_error", "manifest_fixture.entries must be a list")
    entries = [_normalize_manifest_entry(item) for item in raw_entries]
    return sorted(entries, key=lambda item: item["relative_path"])


def _normalize_manifest_entry(raw: Any) -> Dict[str, Any]:
    entry = _mapping(raw, "manifest entry")
    forbidden_keys = sorted(FORBIDDEN_MANIFEST_METADATA_KEYS.intersection(entry.keys()))
    if forbidden_keys:
        raise LocalWorkspaceAdapterError("llm_direct_file_edit_blocked", f"manifest entry contains forbidden content metadata: {', '.join(forbidden_keys)}")

    relative_path = _canonicalize_relative_path(entry.get("relative_path"), "manifest entry relative_path")
    entry_type = entry.get("entry_type")
    if entry_type not in {"file", "directory", "denied"}:
        raise LocalWorkspaceAdapterError("unsupported_template_artifact_type", "manifest entry_type must be file, directory, or denied")

    path_parts = relative_path.split("/") if relative_path else []
    extension = entry.get("extension")
    if extension is None and entry_type == "file":
        name = path_parts[-1] if path_parts else ""
        extension = name.rsplit(".", 1)[1] if "." in name else ""
    if extension is not None and not isinstance(extension, str):
        raise LocalWorkspaceAdapterError("schema_validation_error", "manifest entry extension must be string when provided")

    size_value = entry.get("size_bytes")
    if size_value is not None and (not isinstance(size_value, int) or size_value < 0):
        raise LocalWorkspaceAdapterError("schema_validation_error", "manifest entry size_bytes must be non-negative integer when provided")

    denied_reason = entry.get("denied_reason")
    if denied_reason is not None and not isinstance(denied_reason, str):
        raise LocalWorkspaceAdapterError("schema_validation_error", "manifest entry denied_reason must be string when provided")

    normalized: Dict[str, Any] = {
        "relative_path": relative_path,
        "entry_type": entry_type,
        "extension": extension if extension is not None else "",
        "depth": max(len(path_parts) - 1, 0),
    }
    if size_value is not None:
        normalized["size_bytes"] = size_value
    if denied_reason is not None:
        normalized["denied_reason"] = denied_reason
    return normalized


def _build_manifest(entries: Sequence[Mapping[str, Any]]) -> Dict[str, Any]:
    file_count = sum(1 for item in entries if item.get("entry_type") == "file" and "denied_reason" not in item)
    directory_count = sum(1 for item in entries if item.get("entry_type") == "directory" and "denied_reason" not in item)
    denied_count = sum(1 for item in entries if item.get("entry_type") == "denied" or "denied_reason" in item)
    return {
        "entries": [dict(item) for item in entries],
        "total_entries": len(entries),
        "file_count": file_count,
        "directory_count": directory_count,
        "denied_count": denied_count,
    }


def _validate_staged_output_context(context: Mapping[str, Any], validated_plan: Mapping[str, Any]) -> tuple[str, Optional[Path]]:
    staging_ref = validated_plan.get("staging_root_reference")
    if not isinstance(staging_ref, str) or not staging_ref:
        raise LocalWorkspaceAdapterError("template_reference_error", "staging_root_reference must be a non-empty approved staging reference")
    if not staging_ref.startswith("approved_staging://"):
        raise LocalWorkspaceAdapterError("template_reference_error", "staging_root_reference must use approved_staging:// reference")
    if staging_ref.startswith(("/", "C:", "D:", "~")):
        raise LocalWorkspaceAdapterError("template_reference_error", "staging_root_reference must not be a free-form absolute path")

    sandbox_root_value = context.get("test_sandbox_staging_root_path")
    sandbox_write_enabled = context.get("test_sandbox_write_enabled") is True
    if not sandbox_write_enabled:
        return staging_ref, None
    if not isinstance(sandbox_root_value, str) or not sandbox_root_value:
        raise LocalWorkspaceAdapterError("template_reference_error", "test_sandbox_staging_root_path is required for staged output unit-test writes")
    sandbox_root = Path(sandbox_root_value).resolve()
    sandbox_root.mkdir(parents=True, exist_ok=True)
    return staging_ref, sandbox_root


def _validate_staged_output_operation(operation: Mapping[str, Any], seen_paths: set[str]) -> tuple[str, str, str, str]:
    operation_id = _string(operation.get("operation_id"), "operation_id")
    operation_class = _string(operation.get("operation_class"), "operation_class")
    if operation_class not in STAGED_OUTPUT_OPERATION_CLASSES:
        raise LocalWorkspaceAdapterError("unsupported_operation", f"unsupported staged output operation_class: {operation_class}")
    if _bool(operation.get("overwrite_existing"), "overwrite_existing"):
        raise LocalWorkspaceAdapterError("source_overwrite_blocked", f"operation {operation_id} attempts overwrite")
    if _bool(operation.get("requires_public_internet"), "requires_public_internet"):
        raise LocalWorkspaceAdapterError("public_internet_dependency_blocked", f"operation {operation_id} requires public internet")
    if operation.get("read_file_contents") is True:
        raise LocalWorkspaceAdapterError("llm_direct_file_edit_blocked", f"operation {operation_id} requests file content read")
    if operation.get("follow_symlinks") is True:
        raise LocalWorkspaceAdapterError("constraint_violation", f"operation {operation_id} requests symlink following")
    if operation.get("modify_native_app_state") is True:
        raise LocalWorkspaceAdapterError("llm_direct_native_app_state_modification_blocked", f"operation {operation_id} requests native app state modification")

    relative_input_path = _canonicalize_relative_path(operation.get("relative_input_path"), f"operation {operation_id} relative_input_path")
    relative_staging_path = _canonicalize_relative_path(operation.get("relative_staging_path") or operation.get("relative_output_path"), f"operation {operation_id} relative_staging_path")
    if relative_staging_path is None:
        raise LocalWorkspaceAdapterError("template_reference_error", f"operation {operation_id} requires relative_staging_path")
    if relative_input_path is not None and relative_input_path == relative_staging_path:
        raise LocalWorkspaceAdapterError("source_overwrite_blocked", f"operation {operation_id} attempts to stage over source path")
    if relative_staging_path in seen_paths:
        raise LocalWorkspaceAdapterError("source_overwrite_blocked", f"operation {operation_id} collides with an existing staged output path")
    seen_paths.add(relative_staging_path)

    expected_artifact_type = _string(operation.get("expected_artifact_type"), "expected_artifact_type")
    if expected_artifact_type not in TEXT_ARTIFACT_TYPES:
        raise LocalWorkspaceAdapterError("unsupported_template_artifact_type", f"staged output artifact type must be text-like: {expected_artifact_type}")
    generated_content = operation.get("generated_content")
    if not isinstance(generated_content, str):
        raise LocalWorkspaceAdapterError("schema_validation_error", f"operation {operation_id} requires request-provided generated_content string")
    return operation_id, operation_class, relative_staging_path, expected_artifact_type


def _write_staged_output_to_test_sandbox(sandbox_root: Optional[Path], relative_staging_path: str, generated_content: str) -> bool:
    if sandbox_root is None:
        return False
    target = (sandbox_root / relative_staging_path).resolve()
    try:
        target.relative_to(sandbox_root)
    except ValueError as exc:
        raise LocalWorkspaceAdapterError("template_reference_error", "staged output path escaped the test sandbox") from exc
    if target.exists():
        raise LocalWorkspaceAdapterError("source_overwrite_blocked", "staged output target already exists in test sandbox")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(generated_content, encoding="utf-8")
    return True


def _evaluate_staged_output(validated_plan: Mapping[str, Any], context: Mapping[str, Any], operations: Sequence[Mapping[str, Any]]) -> tuple[List[StagedOutputArtifact], List[StagedOutputReceipt], bool]:
    staging_ref, sandbox_root = _validate_staged_output_context(context, validated_plan)
    artifacts: List[StagedOutputArtifact] = []
    receipts: List[StagedOutputReceipt] = []
    seen_paths: set[str] = set()
    sandbox_write_any = False
    for operation in operations:
        operation_id, operation_class, relative_staging_path, expected_artifact_type = _validate_staged_output_operation(operation, seen_paths)
        generated_content = _string(operation.get("generated_content"), f"operation {operation_id} generated_content")
        sandbox_write = _write_staged_output_to_test_sandbox(sandbox_root, relative_staging_path, generated_content)
        sandbox_write_any = sandbox_write_any or sandbox_write
        artifacts.append(
            StagedOutputArtifact(
                operation_id=operation_id,
                artifact_type=expected_artifact_type,
                staging_root_reference=staging_ref,
                relative_staging_path=relative_staging_path,
            )
        )
        receipts.append(
            StagedOutputReceipt(
                operation_id=operation_id,
                operation_class=operation_class,
                status="staged_output_sandbox_written" if sandbox_write else "staged_output_planned_only",
                canonical_relative_staging_path=relative_staging_path,
                expected_artifact_type=expected_artifact_type,
                staged_output_sandbox_write_performed=sandbox_write,
            )
        )
    return artifacts, receipts, sandbox_write_any


def build_error_response(request: Mapping[str, Any], error: LocalWorkspaceAdapterError) -> Dict[str, Any]:
    request_id = request.get("request_id") if isinstance(request.get("request_id"), str) else "unknown-request"
    return {
        "request_id": request_id,
        "error_id": f"err-{request_id}",
        "target_id": TARGET_ID,
        "adapter_slot_id": ADAPTER_SLOT_ID,
        "error_code": error.error_code,
        "error_category": error.error_code,
        "user_visible_state": "blocked" if error.recoverable else "failed",
        "recoverable": error.recoverable,
        "message": error.message,
        "blocked_reason": error.message,
        "evidence": {
            "proof_mode": True,
            "controlled_dry_run": False,
            "read_only_manifest": False,
            "staged_output": False,
            "dry_run_adapter_boundary_evaluated": False,
            "read_only_manifest_boundary_evaluated": False,
            "staged_output_boundary_evaluated": False,
            "staged_output_sandbox_write_performed": False,
            "actual_adapter_invoked": False,
            "actual_file_system_mutation_performed": False,
            "user_workspace_file_system_mutation_performed": False,
            "file_content_read_performed": False,
            "local_hancom_com_executed": False,
            "real_hwp_hwpx_hancell_hanshow_artifact_generated": False,
            "contract_version": CONTRACT_VERSION,
        },
        "created_at": _created_at(request),
    }


def build_proof_response(request: Mapping[str, Any], operation_proofs: Sequence[OperationProof]) -> Dict[str, Any]:
    request_id = _string(request.get("request_id"), "request_id")
    return {
        "request_id": request_id,
        "response_id": f"res-{request_id}",
        "contract_version": COMMON_CONTRACT_VERSION,
        "target_id": TARGET_ID,
        "adapter_slot_id": ADAPTER_SLOT_ID,
        "status": "blocked_in_proof",
        "execution_allowed": False,
        "actual_adapter_invoked": False,
        "actual_file_system_mutation_performed": False,
        "user_workspace_file_system_mutation_performed": False,
        "dry_run_adapter_boundary_evaluated": False,
        "read_only_manifest_boundary_evaluated": False,
        "staged_output_boundary_evaluated": False,
        "staged_output_sandbox_write_performed": False,
        "file_content_read_performed": False,
        "output_artifacts": [],
        "validation_result": {
            "valid": True,
            "proof_blocked": True,
            "reason": "Task 028 proof-mode skeleton validates the request but does not execute operations",
            "operation_count": len(operation_proofs),
        },
        "evidence": {
            "proof_mode": True,
            "controlled_dry_run": False,
            "read_only_manifest": False,
            "staged_output": False,
            "actual_execution_evidence": False,
            "actual_file_system_mutation_performed": False,
            "user_workspace_file_system_mutation_performed": False,
            "file_content_read_performed": False,
            "adapter_contract_path": "docs/gpt-communication/contracts/local-workspace-adapter-contract.json",
            "adapter_module": "tools/adapters/local_workspace_adapter.py",
            "operation_proofs": [item.to_dict() for item in operation_proofs],
        },
        "warnings": [
            "proof-mode skeleton only; no local workspace automation executed",
            "future implementation requires adapter validator gate and local execution evidence",
        ],
        "created_at": _created_at(request),
    }


def build_controlled_dry_run_response(
    request: Mapping[str, Any],
    operation_proofs: Sequence[OperationProof],
    receipts: Sequence[DryRunReceipt],
    planned_artifacts: Sequence[PlannedOutputArtifact],
) -> Dict[str, Any]:
    request_id = _string(request.get("request_id"), "request_id")
    return {
        "request_id": request_id,
        "response_id": f"res-{request_id}",
        "contract_version": COMMON_CONTRACT_VERSION,
        "target_id": TARGET_ID,
        "adapter_slot_id": ADAPTER_SLOT_ID,
        "status": "controlled_dry_run_completed",
        "execution_allowed": False,
        "actual_adapter_invoked": False,
        "dry_run_adapter_boundary_evaluated": True,
        "read_only_manifest_boundary_evaluated": False,
        "staged_output_boundary_evaluated": False,
        "staged_output_sandbox_write_performed": False,
        "actual_file_system_mutation_performed": False,
        "user_workspace_file_system_mutation_performed": False,
        "file_content_read_performed": False,
        "output_artifacts": [],
        "planned_output_artifacts": [item.to_dict() for item in planned_artifacts],
        "dry_run_operation_receipts": [item.to_dict() for item in receipts],
        "validation_result": {
            "valid": True,
            "controlled_dry_run": True,
            "operation_count": len(operation_proofs),
            "planned_output_artifact_count": len(planned_artifacts),
            "reason": "Controlled dry-run evaluated the adapter boundary in memory only.",
        },
        "evidence": {
            "proof_mode": False,
            "controlled_dry_run": True,
            "read_only_manifest": False,
            "staged_output": False,
            "dry_run_adapter_boundary_evaluated": True,
            "read_only_manifest_boundary_evaluated": False,
            "staged_output_boundary_evaluated": False,
            "staged_output_sandbox_write_performed": False,
            "actual_execution_evidence": False,
            "actual_adapter_invoked": False,
            "actual_file_system_mutation_performed": False,
            "user_workspace_file_system_mutation_performed": False,
            "file_content_read_performed": False,
            "local_hancom_com_executed": False,
            "real_hwp_hwpx_hancell_hanshow_artifact_generated": False,
            "adapter_contract_path": "docs/gpt-communication/contracts/local-workspace-adapter-contract.json",
            "controlled_dry_run_contract_path": "docs/gpt-communication/contracts/local-workspace-controlled-dry-run-boundary.json",
            "adapter_module": "tools/adapters/local_workspace_adapter.py",
            "operation_proofs": [item.to_dict() for item in operation_proofs],
        },
        "warnings": [
            "controlled dry-run only; no local workspace files were inspected or mutated",
            "planned_output_artifacts are descriptors only, not real files",
        ],
        "created_at": _created_at(request),
    }


def build_read_only_manifest_response(
    request: Mapping[str, Any],
    manifest: Mapping[str, Any],
    manifest_receipts: Sequence[ManifestReceipt],
) -> Dict[str, Any]:
    request_id = _string(request.get("request_id"), "request_id")
    return {
        "request_id": request_id,
        "response_id": f"res-{request_id}",
        "contract_version": COMMON_CONTRACT_VERSION,
        "target_id": TARGET_ID,
        "adapter_slot_id": ADAPTER_SLOT_ID,
        "status": "read_only_manifest_completed",
        "execution_allowed": False,
        "actual_adapter_invoked": False,
        "dry_run_adapter_boundary_evaluated": False,
        "read_only_manifest_boundary_evaluated": True,
        "staged_output_boundary_evaluated": False,
        "staged_output_sandbox_write_performed": False,
        "actual_file_system_mutation_performed": False,
        "user_workspace_file_system_mutation_performed": False,
        "file_content_read_performed": False,
        "local_hancom_com_executed": False,
        "real_hwp_hwpx_hancell_hanshow_artifact_generated": False,
        "output_artifacts": [],
        "manifest": dict(manifest),
        "manifest_receipts": [item.to_dict() for item in manifest_receipts],
        "validation_result": {
            "valid": True,
            "read_only_manifest": True,
            "manifest_total_entries": manifest.get("total_entries"),
            "reason": "Read-only manifest boundary evaluated metadata-only fixture entries in memory.",
        },
        "evidence": {
            "proof_mode": False,
            "controlled_dry_run": False,
            "read_only_manifest": True,
            "staged_output": False,
            "read_only_manifest_boundary_evaluated": True,
            "staged_output_boundary_evaluated": False,
            "staged_output_sandbox_write_performed": False,
            "actual_execution_evidence": False,
            "actual_adapter_invoked": False,
            "actual_file_system_mutation_performed": False,
            "user_workspace_file_system_mutation_performed": False,
            "file_content_read_performed": False,
            "local_hancom_com_executed": False,
            "real_hwp_hwpx_hancell_hanshow_artifact_generated": False,
            "adapter_contract_path": "docs/gpt-communication/contracts/local-workspace-adapter-contract.json",
            "read_only_manifest_contract_path": "docs/gpt-communication/contracts/local-workspace-read-only-manifest-boundary.json",
            "adapter_module": "tools/adapters/local_workspace_adapter.py",
        },
        "warnings": [
            "read-only manifest boundary only; no real local workspace files were inspected or mutated",
            "manifest entries are metadata-only deterministic descriptors",
        ],
        "created_at": _created_at(request),
    }


def build_staged_output_response(
    request: Mapping[str, Any],
    staged_artifacts: Sequence[StagedOutputArtifact],
    staged_receipts: Sequence[StagedOutputReceipt],
    sandbox_write_performed: bool,
) -> Dict[str, Any]:
    request_id = _string(request.get("request_id"), "request_id")
    return {
        "request_id": request_id,
        "response_id": f"res-{request_id}",
        "contract_version": COMMON_CONTRACT_VERSION,
        "target_id": TARGET_ID,
        "adapter_slot_id": ADAPTER_SLOT_ID,
        "status": "staged_output_completed",
        "execution_allowed": False,
        "actual_adapter_invoked": False,
        "dry_run_adapter_boundary_evaluated": False,
        "read_only_manifest_boundary_evaluated": False,
        "staged_output_boundary_evaluated": True,
        "staged_output_sandbox_write_performed": sandbox_write_performed,
        "actual_file_system_mutation_performed": False,
        "user_workspace_file_system_mutation_performed": False,
        "file_content_read_performed": False,
        "local_hancom_com_executed": False,
        "real_hwp_hwpx_hancell_hanshow_artifact_generated": False,
        "output_artifacts": [],
        "staged_output_artifacts": [item.to_dict() for item in staged_artifacts],
        "staged_output_receipts": [item.to_dict() for item in staged_receipts],
        "validation_result": {
            "valid": True,
            "staged_output": True,
            "staged_output_artifact_count": len(staged_artifacts),
            "reason": "Staged output boundary wrote request-provided content only to a controlled unit-test sandbox when enabled.",
        },
        "evidence": {
            "proof_mode": False,
            "controlled_dry_run": False,
            "read_only_manifest": False,
            "staged_output": True,
            "staged_output_boundary_evaluated": True,
            "staged_output_sandbox_write_performed": sandbox_write_performed,
            "actual_execution_evidence": False,
            "actual_adapter_invoked": False,
            "actual_file_system_mutation_performed": False,
            "user_workspace_file_system_mutation_performed": False,
            "file_content_read_performed": False,
            "local_hancom_com_executed": False,
            "real_hwp_hwpx_hancell_hanshow_artifact_generated": False,
            "adapter_contract_path": "docs/gpt-communication/contracts/local-workspace-adapter-contract.json",
            "staged_output_contract_path": "docs/gpt-communication/contracts/local-workspace-staged-output-boundary.json",
            "adapter_module": "tools/adapters/local_workspace_adapter.py",
        },
        "warnings": [
            "staged output boundary only; no production/user workspace files were mutated",
            "staged_output_sandbox_write_performed may be true only for controlled local unit-test sandbox writes",
            "output_artifacts remain empty because no final user artifact is claimed",
        ],
        "created_at": _created_at(request),
    }


def handle_request(request: Mapping[str, Any]) -> Dict[str, Any]:
    """Validate a local_workspace request and return proof, dry-run, manifest, or staged response."""

    try:
        context, _constraints, _template_reference, validated_plan = _validate_request_mapping(request)
        execution_mode = _determine_execution_mode(request, context)
        operations = _operation_batch(validated_plan.get("operation_batch"))
        if execution_mode == "staged_output":
            staged_artifacts, staged_receipts, sandbox_write = _evaluate_staged_output(validated_plan, context, operations)
            return build_staged_output_response(request, staged_artifacts, staged_receipts, sandbox_write)

        if execution_mode == "read_only_manifest":
            receipts = [_validate_read_only_manifest_operation(item) for item in operations]
            entries = _manifest_entries_from_fixture(validated_plan)
            manifest = _build_manifest(entries)
            receipts = [
                ManifestReceipt(
                    operation_id=item.operation_id,
                    operation_class=item.operation_class,
                    status=item.status,
                    manifest_entry_count=manifest["total_entries"],
                )
                for item in receipts
            ]
            return build_read_only_manifest_response(request, manifest, receipts)

        operation_items = [_validate_operation(item) for item in operations]
        operation_proofs = [item[0] for item in operation_items]
        receipts = [item[1] for item in operation_items]
        planned_artifacts = [item[2] for item in operation_items if item[2] is not None]
        if execution_mode == "controlled_dry_run":
            return build_controlled_dry_run_response(request, operation_proofs, receipts, planned_artifacts)
        return build_proof_response(request, operation_proofs)
    except LocalWorkspaceAdapterError as exc:
        return build_error_response(request, exc)


def _base_validated_plan(plan_id: str, operation_batch: Sequence[Mapping[str, Any]]) -> Dict[str, Any]:
    return {
        "plan_id": plan_id,
        "target_id": TARGET_ID,
        "plan_type": PLAN_TYPE,
        "workspace_root_reference": "approved_workspace://task031-fixture",
        "operation_batch": [dict(item) for item in operation_batch],
        "path_policy": {
            "absolute_paths_allowed": False,
            "path_traversal_allowed": False,
            "backslash_paths_allowed": False,
            "empty_path_segments_allowed": False,
            "symlink_escape_allowed": False,
            "symlink_escape_claimed_safe_without_local_probe": False,
            "follow_symlinks": False,
            "content_read_allowed": False,
            "source_workspace_writable": False,
            "staging_paths_relative_to_staging_root": True,
        },
        "artifact_policy": {
            "source_overwrite_allowed": False,
            "output_collision_policy": "block_until_future_versioning_policy",
            "staging_path_collision_policy": "block_if_exists",
            "claim_real_output_artifacts": False,
            "read_file_contents": False,
            "promote_to_user_workspace": False,
        },
        "evidence_policy": {
            "record_operation_proofs": True,
            "record_dry_run_receipts": True,
            "record_manifest_receipts": True,
            "record_staged_output_receipts": True,
            "claim_generated_artifacts": False,
        },
        "llm_direct_file_edit_requested": False,
        "llm_direct_native_app_state_modification_requested": False,
    }


def build_sample_request() -> Dict[str, Any]:
    """Return an in-memory Task 028 proof-mode sample for tests and local verification."""

    return {
        "request_id": "req-local-workspace-task028-proof-001",
        "contract_version": COMMON_CONTRACT_VERSION,
        "target_id": TARGET_ID,
        "adapter_slot_id": ADAPTER_SLOT_ID,
        "plan_type": PLAN_TYPE,
        "validated_plan": _base_validated_plan(
            "plan-local-workspace-task028-proof-001",
            [
                {
                    "operation_id": "op-001",
                    "operation_class": "validate_relative_path",
                    "relative_input_path": "inputs/source.md",
                    "overwrite_existing": False,
                    "requires_public_internet": False,
                    "expected_artifact_type": "md",
                },
                {
                    "operation_id": "op-002",
                    "operation_class": "write_generated_text_artifact",
                    "relative_output_path": "outputs/report.md",
                    "overwrite_existing": False,
                    "requires_public_internet": False,
                    "expected_artifact_type": "md",
                },
            ],
        ),
        "source_plan_schema_version": "army-claw-app-target-plan-schema-020.v1",
        "execution_context": {
            "proof_mode": True,
            "actual_adapter_invocation_allowed": False,
        },
        "template_reference": {
            "artifact_type": "folder",
            "path": "approved_workspace://task031-fixture",
            "overwrite_source": False,
        },
        "constraints": {
            "prevent_source_overwrite": True,
            "allow_public_internet": False,
            "preserve_template": True,
        },
        "evidence_request": {
            "level": "proof_mode_skeleton_only",
        },
        "dry_run": True,
        "created_at": FIXED_CREATED_AT,
    }


def build_controlled_dry_run_sample_request() -> Dict[str, Any]:
    """Return an in-memory positive controlled dry-run sample."""

    request = build_sample_request()
    request["request_id"] = "req-local-workspace-task029-controlled-dry-run-001"
    request["validated_plan"] = _base_validated_plan(
        "plan-local-workspace-task029-controlled-dry-run-001",
        [
            {
                "operation_id": "op-001",
                "operation_class": "validate_relative_path",
                "relative_input_path": "inputs/source.md",
                "overwrite_existing": False,
                "requires_public_internet": False,
                "expected_artifact_type": "md",
            },
            {
                "operation_id": "op-002",
                "operation_class": "create_output_directory",
                "relative_output_path": "outputs/task029",
                "overwrite_existing": False,
                "requires_public_internet": False,
                "expected_artifact_type": "folder",
            },
            {
                "operation_id": "op-003",
                "operation_class": "write_generated_text_artifact",
                "relative_output_path": "outputs/task029/report.md",
                "overwrite_existing": False,
                "requires_public_internet": False,
                "expected_artifact_type": "md",
            },
            {
                "operation_id": "op-004",
                "operation_class": "record_evidence_manifest",
                "relative_output_path": "outputs/task029/evidence/dry-run-manifest.json",
                "overwrite_existing": False,
                "requires_public_internet": False,
                "expected_artifact_type": "json",
            },
        ],
    )
    request["execution_context"] = {
        "proof_mode": False,
        "execution_mode": "controlled_dry_run",
        "controlled_dry_run": True,
        "actual_adapter_invocation_allowed": False,
    }
    request["evidence_request"] = {
        "level": "controlled_dry_run_receipts_only",
    }
    request["dry_run"] = True
    request["created_at"] = FIXED_CREATED_AT
    return request


def build_read_only_manifest_sample_request() -> Dict[str, Any]:
    """Return an in-memory positive read-only manifest sample."""

    request = build_sample_request()
    request["request_id"] = "req-local-workspace-task030-read-only-manifest-001"
    request["validated_plan"] = _base_validated_plan(
        "plan-local-workspace-task030-read-only-manifest-001",
        [
            {
                "operation_id": "op-001",
                "operation_class": "inspect_workspace_manifest",
                "relative_input_path": "workspace",
                "overwrite_existing": False,
                "requires_public_internet": False,
                "read_file_contents": False,
                "follow_symlinks": False,
                "expected_artifact_type": "json",
            }
        ],
    )
    request["validated_plan"]["manifest_fixture"] = {
        "fixture_id": "task030-read-only-manifest-fixture-001",
        "entries": [
            {
                "relative_path": "docs",
                "entry_type": "directory",
            },
            {
                "relative_path": "docs/README.md",
                "entry_type": "file",
                "size_bytes": 1200,
            },
            {
                "relative_path": "outputs/private",
                "entry_type": "denied",
                "denied_reason": "outside approved manifest scope",
            },
            {
                "relative_path": "src/app.py",
                "entry_type": "file",
                "size_bytes": 4096,
            },
        ],
    }
    request["execution_context"] = {
        "proof_mode": False,
        "execution_mode": "read_only_manifest",
        "read_only_manifest": True,
        "actual_adapter_invocation_allowed": False,
    }
    request["evidence_request"] = {
        "level": "read_only_manifest_receipts_only",
    }
    request["dry_run"] = False
    request["read_only"] = True
    request["created_at"] = FIXED_CREATED_AT
    return request


def build_staged_output_sample_request(test_sandbox_staging_root_path: Optional[str] = None) -> Dict[str, Any]:
    """Return an in-memory positive staged output sample for local unit tests."""

    request = build_sample_request()
    request["request_id"] = "req-local-workspace-task031-staged-output-001"
    request["validated_plan"] = _base_validated_plan(
        "plan-local-workspace-task031-staged-output-001",
        [
            {
                "operation_id": "op-001",
                "operation_class": "write_generated_text_artifact",
                "relative_input_path": "source/analysis-plan.md",
                "relative_staging_path": "staged/task031/report.md",
                "overwrite_existing": False,
                "requires_public_internet": False,
                "read_file_contents": False,
                "follow_symlinks": False,
                "modify_native_app_state": False,
                "expected_artifact_type": "md",
                "generated_content": "# Task 031 staged output\n\nGenerated from request-provided content only.\n",
            },
            {
                "operation_id": "op-002",
                "operation_class": "record_evidence_manifest",
                "relative_staging_path": "staged/task031/evidence.json",
                "overwrite_existing": False,
                "requires_public_internet": False,
                "read_file_contents": False,
                "follow_symlinks": False,
                "modify_native_app_state": False,
                "expected_artifact_type": "json",
                "generated_content": "{\"task\":\"031\",\"mode\":\"staged_output\"}\n",
            },
        ],
    )
    request["validated_plan"]["staging_root_reference"] = "approved_staging://task031-staging-fixture"
    request["execution_context"] = {
        "proof_mode": False,
        "execution_mode": "staged_output",
        "staged_output": True,
        "test_sandbox_write_enabled": test_sandbox_staging_root_path is not None,
        "actual_adapter_invocation_allowed": False,
    }
    if test_sandbox_staging_root_path is not None:
        request["execution_context"]["test_sandbox_staging_root_path"] = test_sandbox_staging_root_path
    request["evidence_request"] = {
        "level": "staged_output_receipts_only",
    }
    request["dry_run"] = False
    request["staged_output"] = True
    request["created_at"] = FIXED_CREATED_AT
    return request


__all__ = [
    "ADAPTER_SLOT_ID",
    "CONTRACT_VERSION",
    "CONTROLLED_PROMOTION_CONTRACT_VERSION",
    "CONTROLLED_PROMOTION_EXECUTION_MODE",
    "CONTROLLED_PROMOTION_OPERATION",
    "FilesystemProbe",
    "PLAN_TYPE",
    "PromotionArtifactReference",
    "PromotionAuthorization",
    "PromotionDestination",
    "PromotionReceipt",
    "PromotionSafetyAssertions",
    "PromotionVerification",
    "TARGET_ID",
    "LocalWorkspaceAdapterError",
    "build_controlled_dry_run_sample_request",
    "build_read_only_manifest_sample_request",
    "build_sample_request",
    "build_staged_output_sample_request",
    "handle_request",
    "promote_staged_output",
]

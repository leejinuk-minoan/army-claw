#!/usr/bin/env python3
"""Army Claw local workspace adapter boundary.

Task 028 introduced proof-mode validation. Task 029 added a controlled dry-run
boundary. Task 030 adds a read-only manifest boundary that evaluates declared
workspace metadata fixtures in memory and returns deterministic metadata-only
manifest descriptors.

This module is intentionally side-effect free. It does not create, modify,
copy, delete, move, inspect, or mutate real workspace files. It does not read
real file contents. It does not follow symlinks, invoke Hancom COM, invoke
native applications, access public internet, or generate real documents.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import PurePosixPath
from typing import Any, Dict, List, Mapping, Optional, Sequence

CONTRACT_VERSION = "army-claw-local-workspace-adapter-read-only-manifest-030.v1"
CONTROLLED_DRY_RUN_CONTRACT_VERSION = "army-claw-local-workspace-adapter-controlled-dry-run-029.v1"
PROOF_MODE_CONTRACT_VERSION = "army-claw-local-workspace-adapter-proof-mode-028.v1"
COMMON_CONTRACT_VERSION = "army-claw-common-office-adapter-interface-023.v1"
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
        raise LocalWorkspaceAdapterError("actual_adapter_invocation_forbidden_in_proof", "actual adapter invocation is forbidden in proof, controlled dry-run, and read-only manifest boundaries", recoverable=False)
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
        raise LocalWorkspaceAdapterError("constraint_violation", "read-only manifest must not follow symlinks")
    if path_policy.get("content_read_allowed") is True:
        raise LocalWorkspaceAdapterError("llm_direct_file_edit_blocked", "file content read is prohibited in read-only manifest boundary")


def _validate_artifact_policy(validated_plan: Mapping[str, Any]) -> None:
    artifact_policy = _mapping(validated_plan.get("artifact_policy"), "validated_plan.artifact_policy")
    if artifact_policy.get("source_overwrite_allowed") is not False:
        raise LocalWorkspaceAdapterError("source_overwrite_blocked", "source overwrite must be blocked")
    if artifact_policy.get("claim_real_output_artifacts") is True:
        raise LocalWorkspaceAdapterError("evidence_missing", "controlled dry-run or read-only manifest cannot claim real output artifacts")
    if artifact_policy.get("read_file_contents") is True:
        raise LocalWorkspaceAdapterError("llm_direct_file_edit_blocked", "file content read request is prohibited")


def _determine_execution_mode(request: Mapping[str, Any], context: Mapping[str, Any]) -> str:
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
    raise LocalWorkspaceAdapterError("constraint_violation", "proof_mode, controlled dry-run, or read-only manifest markers must be explicit")


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
            "dry_run_adapter_boundary_evaluated": False,
            "read_only_manifest_boundary_evaluated": False,
            "actual_adapter_invoked": False,
            "actual_file_system_mutation_performed": False,
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
        "dry_run_adapter_boundary_evaluated": False,
        "read_only_manifest_boundary_evaluated": False,
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
            "actual_execution_evidence": False,
            "actual_file_system_mutation_performed": False,
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
        "actual_file_system_mutation_performed": False,
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
            "dry_run_adapter_boundary_evaluated": True,
            "read_only_manifest_boundary_evaluated": False,
            "actual_execution_evidence": False,
            "actual_adapter_invoked": False,
            "actual_file_system_mutation_performed": False,
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
        "actual_file_system_mutation_performed": False,
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
            "read_only_manifest_boundary_evaluated": True,
            "actual_execution_evidence": False,
            "actual_adapter_invoked": False,
            "actual_file_system_mutation_performed": False,
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


def handle_request(request: Mapping[str, Any]) -> Dict[str, Any]:
    """Validate a local_workspace request and return proof, dry-run, or manifest response.

    This function is deterministic and side-effect free.
    """

    try:
        context, _constraints, _template_reference, validated_plan = _validate_request_mapping(request)
        execution_mode = _determine_execution_mode(request, context)
        operations = _operation_batch(validated_plan.get("operation_batch"))
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
        "workspace_root_reference": "approved_workspace://task030-fixture",
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
        },
        "artifact_policy": {
            "source_overwrite_allowed": False,
            "output_collision_policy": "block_until_future_versioning_policy",
            "claim_real_output_artifacts": False,
            "read_file_contents": False,
        },
        "evidence_policy": {
            "record_operation_proofs": True,
            "record_dry_run_receipts": True,
            "record_manifest_receipts": True,
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
            "path": "approved_workspace://task030-fixture",
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


__all__ = [
    "ADAPTER_SLOT_ID",
    "CONTRACT_VERSION",
    "PLAN_TYPE",
    "TARGET_ID",
    "LocalWorkspaceAdapterError",
    "build_controlled_dry_run_sample_request",
    "build_read_only_manifest_sample_request",
    "build_sample_request",
    "handle_request",
]

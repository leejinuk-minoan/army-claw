#!/usr/bin/env python3
"""Army Claw local workspace adapter boundary.

Task 028 introduced proof-mode validation. Task 029 adds a controlled dry-run
boundary that evaluates a validated local_workspace_action_plan in memory and
returns deterministic dry-run receipts and planned artifact descriptors.

This module is intentionally side-effect free. It does not create, modify,
copy, delete, inspect, or mutate real workspace files. It does not invoke
Hancom COM, native applications, internet access, or real document generation.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import PurePosixPath
from typing import Any, Dict, List, Mapping, Optional, Sequence

CONTRACT_VERSION = "army-claw-local-workspace-adapter-controlled-dry-run-029.v1"
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

TEXT_ARTIFACT_TYPES = {"md", "markdown", "json", "txt", "csv", "yaml", "yml"}
FOLDER_ARTIFACT_TYPES = {"folder"}
ALLOWED_ARTIFACT_TYPES = TEXT_ARTIFACT_TYPES | FOLDER_ARTIFACT_TYPES
MUTATING_OPERATION_CLASSES = {
    "create_output_directory",
    "write_generated_text_artifact",
    "copy_source_to_output",
    "record_evidence_manifest",
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
        raise LocalWorkspaceAdapterError("actual_adapter_invocation_forbidden_in_proof", "actual adapter invocation is forbidden in proof or controlled dry-run boundary", recoverable=False)
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


def _validate_artifact_policy(validated_plan: Mapping[str, Any]) -> None:
    artifact_policy = _mapping(validated_plan.get("artifact_policy"), "validated_plan.artifact_policy")
    if artifact_policy.get("source_overwrite_allowed") is not False:
        raise LocalWorkspaceAdapterError("source_overwrite_blocked", "source overwrite must be blocked")
    if artifact_policy.get("claim_real_output_artifacts") is True:
        raise LocalWorkspaceAdapterError("evidence_missing", "controlled dry-run cannot claim real output artifacts")


def _determine_execution_mode(request: Mapping[str, Any], context: Mapping[str, Any]) -> str:
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
    raise LocalWorkspaceAdapterError("constraint_violation", "proof_mode or controlled dry-run markers must be explicit")


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
            "dry_run_adapter_boundary_evaluated": False,
            "actual_adapter_invoked": False,
            "actual_file_system_mutation_performed": False,
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
            "actual_execution_evidence": False,
            "actual_file_system_mutation_performed": False,
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
        "actual_file_system_mutation_performed": False,
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
            "dry_run_adapter_boundary_evaluated": True,
            "actual_execution_evidence": False,
            "actual_adapter_invoked": False,
            "actual_file_system_mutation_performed": False,
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


def handle_request(request: Mapping[str, Any]) -> Dict[str, Any]:
    """Validate a local_workspace request and return proof or controlled dry-run response.

    This function is deterministic and side-effect free.
    """

    try:
        context, _constraints, _template_reference, validated_plan = _validate_request_mapping(request)
        execution_mode = _determine_execution_mode(request, context)
        operations = _operation_batch(validated_plan.get("operation_batch"))
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
        "workspace_root_reference": "approved_workspace://task029-fixture",
        "operation_batch": [dict(item) for item in operation_batch],
        "path_policy": {
            "absolute_paths_allowed": False,
            "path_traversal_allowed": False,
            "backslash_paths_allowed": False,
            "empty_path_segments_allowed": False,
            "symlink_escape_allowed": False,
            "symlink_escape_claimed_safe_without_local_probe": False,
        },
        "artifact_policy": {
            "source_overwrite_allowed": False,
            "output_collision_policy": "block_until_future_versioning_policy",
            "claim_real_output_artifacts": False,
        },
        "evidence_policy": {
            "record_operation_proofs": True,
            "record_dry_run_receipts": True,
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
            "path": "approved_workspace://task029-fixture",
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


__all__ = [
    "ADAPTER_SLOT_ID",
    "CONTRACT_VERSION",
    "PLAN_TYPE",
    "TARGET_ID",
    "LocalWorkspaceAdapterError",
    "build_controlled_dry_run_sample_request",
    "build_sample_request",
    "handle_request",
]

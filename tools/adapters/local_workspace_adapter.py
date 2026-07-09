#!/usr/bin/env python3
"""Army Claw local workspace adapter proof-mode skeleton.

Task 028 cloud package.

This module intentionally implements only an in-memory proof-mode boundary. It
validates the local_workspace request envelope and returns a proof-mode response.
It does not create, modify, copy, delete, or inspect real workspace files. It
does not invoke Hancom COM, native applications, internet access, or document
generation.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import PurePosixPath
from typing import Any, Dict, Iterable, List, Mapping, MutableMapping, Optional, Sequence

CONTRACT_VERSION = "army-claw-local-workspace-adapter-proof-mode-028.v1"
COMMON_CONTRACT_VERSION = "army-claw-common-office-adapter-interface-023.v1"
TARGET_ID = "local_workspace"
ADAPTER_SLOT_ID = "local_workspace_adapter_slot"
PLAN_TYPE = "local_workspace_action_plan"

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


class LocalWorkspaceAdapterError(ValueError):
    """Raised when a proof-mode request violates the adapter contract."""

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


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


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


def _is_safe_relative_path(path_value: Optional[str]) -> bool:
    if path_value in (None, ""):
        return True
    if not isinstance(path_value, str):
        return False
    if "\\" in path_value:
        return False
    path = PurePosixPath(path_value)
    if path.is_absolute():
        return False
    if any(part in ("..", "") for part in path.parts):
        return False
    return True


def _validate_request_mapping(request: Mapping[str, Any]) -> None:
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

    if context.get("proof_mode") is not True and request.get("dry_run") is not True:
        raise LocalWorkspaceAdapterError("constraint_violation", "proof_mode or dry_run must be explicit")
    if context.get("actual_adapter_invocation_allowed") is True:
        raise LocalWorkspaceAdapterError("actual_adapter_invocation_forbidden_in_proof", "actual adapter invocation is forbidden in Task 028 proof mode", recoverable=False)
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


def _validate_operation(operation: Mapping[str, Any]) -> OperationProof:
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

    relative_input_path = operation.get("relative_input_path")
    relative_output_path = operation.get("relative_output_path")
    if not _is_safe_relative_path(relative_input_path):
        raise LocalWorkspaceAdapterError("template_reference_error", f"operation {operation_id} has unsafe relative_input_path")
    if not _is_safe_relative_path(relative_output_path):
        raise LocalWorkspaceAdapterError("template_reference_error", f"operation {operation_id} has unsafe relative_output_path")

    expected_artifact_type = _string(operation.get("expected_artifact_type"), "expected_artifact_type")
    if expected_artifact_type not in ALLOWED_ARTIFACT_TYPES:
        raise LocalWorkspaceAdapterError("unsupported_template_artifact_type", f"unsupported expected_artifact_type: {expected_artifact_type}")

    would_mutate = operation_class in {
        "create_output_directory",
        "write_generated_text_artifact",
        "copy_source_to_output",
        "record_evidence_manifest",
    }
    warnings = ["proof-mode skeleton: operation accepted but not executed"]
    if would_mutate:
        warnings.append("future implementation must record local execution evidence before claiming artifacts")

    return OperationProof(
        operation_id=operation_id,
        operation_class=operation_class,
        relative_input_path=relative_input_path if isinstance(relative_input_path, str) else None,
        relative_output_path=relative_output_path if isinstance(relative_output_path, str) else None,
        expected_artifact_type=expected_artifact_type,
        would_mutate_filesystem=would_mutate,
        warnings=warnings,
    )


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
            "actual_adapter_invoked": False,
            "actual_file_system_mutation_performed": False,
            "contract_version": CONTRACT_VERSION,
        },
        "created_at": now_iso(),
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
        "output_artifacts": [],
        "validation_result": {
            "valid": True,
            "proof_blocked": True,
            "reason": "Task 028 proof-mode skeleton validates the request but does not execute operations",
            "operation_count": len(operation_proofs),
        },
        "evidence": {
            "proof_mode": True,
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
        "created_at": now_iso(),
    }


def handle_request(request: Mapping[str, Any]) -> Dict[str, Any]:
    """Validate a local_workspace request and return a proof-mode response.

    This function is deterministic and side-effect free.
    """

    try:
        _validate_request_mapping(request)
        validated_plan = _mapping(request.get("validated_plan"), "validated_plan")
        operations = _operation_batch(validated_plan.get("operation_batch"))
        operation_proofs = [_validate_operation(item) for item in operations]
        return build_proof_response(request, operation_proofs)
    except LocalWorkspaceAdapterError as exc:
        return build_error_response(request, exc)


def build_sample_request() -> Dict[str, Any]:
    """Return an in-memory positive sample for tests and local verification."""

    return {
        "request_id": "req-local-workspace-task028-proof-001",
        "contract_version": COMMON_CONTRACT_VERSION,
        "target_id": TARGET_ID,
        "adapter_slot_id": ADAPTER_SLOT_ID,
        "plan_type": PLAN_TYPE,
        "validated_plan": {
            "plan_id": "plan-local-workspace-task028-proof-001",
            "target_id": TARGET_ID,
            "plan_type": PLAN_TYPE,
            "workspace_root_reference": "approved_workspace://task028-fixture",
            "operation_batch": [
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
            "path_policy": {
                "absolute_paths_allowed": False,
                "path_traversal_allowed": False,
                "symlink_escape_allowed": False,
            },
            "artifact_policy": {
                "source_overwrite_allowed": False,
                "output_collision_policy": "block_until_future_versioning_policy"
            },
            "evidence_policy": {
                "record_operation_proofs": True,
                "claim_generated_artifacts": False
            },
            "llm_direct_file_edit_requested": False,
            "llm_direct_native_app_state_modification_requested": False,
        },
        "source_plan_schema_version": "army-claw-app-target-plan-schema-020.v1",
        "execution_context": {
            "proof_mode": True,
            "actual_adapter_invocation_allowed": False,
        },
        "template_reference": {
            "artifact_type": "folder",
            "path": "approved_workspace://task028-fixture",
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
        "created_at": "2026-07-10T00:00:00Z",
    }


__all__ = [
    "ADAPTER_SLOT_ID",
    "CONTRACT_VERSION",
    "PLAN_TYPE",
    "TARGET_ID",
    "LocalWorkspaceAdapterError",
    "build_sample_request",
    "handle_request",
]

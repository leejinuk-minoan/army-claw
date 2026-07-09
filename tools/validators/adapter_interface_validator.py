#!/usr/bin/env python3
"""Army Claw Adapter Interface Validator.

Task 025-A cloud implementation package.

This module validates the Task 023/024 adapter interface contract files and
sample payloads using only Python standard library modules. It does not modify
files, invoke adapters, call Hancom COM, create documents, access the internet,
or install dependencies.
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any, Dict, Iterable, List, Mapping, Optional, Sequence

VALIDATOR_ID = "army-claw-adapter-interface-validator"
VALIDATOR_VERSION = "task025a-cloud-draft"

DEFAULT_CONTRACT_PATH = "docs/gpt-communication/contracts/common-office-adapter-interface-contract.json"
DEFAULT_ERROR_TAXONOMY_PATH = "docs/gpt-communication/contracts/common-office-adapter-error-taxonomy.json"
DEFAULT_VALIDATOR_CONTRACT_PATH = "docs/gpt-communication/contracts/adapter-interface-validator-contract.json"
DEFAULT_MATRIX_PATH = "docs/gpt-communication/contracts/adapter-interface-validation-matrix.json"
DEFAULT_SAMPLES_DIR = "docs/gpt-communication/contracts/samples/common-office-adapter-interface"


class ResultStatus(str, Enum):
    VALID = "valid"
    INVALID = "invalid"
    BLOCKED = "blocked"
    NOT_EVALUATED = "not_evaluated"
    NOT_APPLICABLE = "not_applicable"


@dataclass
class ValidationResult:
    check_id: str
    status: str
    message: str
    path: str = ""
    expected: Any = None
    actual: Any = None


class ValidationInputError(Exception):
    """Raised when an input file is missing or malformed."""


class ValidationInternalError(Exception):
    """Raised for unexpected internal validator failures."""


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def result(check_id: str, status: ResultStatus, message: str, path: str = "", expected: Any = None, actual: Any = None) -> Dict[str, Any]:
    return asdict(ValidationResult(check_id, status.value, message, path, expected, actual))


def load_json_file(path: Path) -> Dict[str, Any]:
    try:
        with path.open("r", encoding="utf-8") as handle:
            document = json.load(handle)
    except FileNotFoundError as exc:
        raise ValidationInputError(f"missing file: {path}") from exc
    except json.JSONDecodeError as exc:
        raise ValidationInputError(f"invalid JSON in {path}: {exc}") from exc
    if not isinstance(document, dict):
        raise ValidationInputError(f"expected JSON object in {path}")
    return document


def validate_required_fields(document: Mapping[str, Any], required_fields: Sequence[str], document_name: str) -> List[Dict[str, Any]]:
    findings: List[Dict[str, Any]] = []
    for field in required_fields:
        if field in document:
            findings.append(result(f"{document_name}.required.{field}", ResultStatus.VALID, f"required field present: {field}"))
        else:
            findings.append(result(f"{document_name}.required.{field}", ResultStatus.INVALID, f"required field missing: {field}", expected=True, actual=False))
    return findings


def validate_supported_target(target_id: Any, contract: Mapping[str, Any]) -> List[Dict[str, Any]]:
    supported = contract.get("supported_targets", [])
    if target_id in supported:
        return [result("target_id_supported", ResultStatus.VALID, "target_id is supported", expected=supported, actual=target_id)]
    return [result("target_id_supported", ResultStatus.INVALID, "target_id is not supported", expected=supported, actual=target_id)]


def validate_adapter_slot(target_id: Any, adapter_slot_id: Any, contract: Mapping[str, Any]) -> List[Dict[str, Any]]:
    expected_slot = contract.get("adapter_slots", {}).get(str(target_id))
    if expected_slot is None:
        return [result("adapter_slot_target_known", ResultStatus.INVALID, "target_id has no adapter slot mapping", actual=target_id)]
    if adapter_slot_id == expected_slot:
        return [result("adapter_slot_matches_target", ResultStatus.VALID, "adapter_slot_id matches target_id", expected=expected_slot, actual=adapter_slot_id)]
    return [result("adapter_slot_matches_target", ResultStatus.INVALID, "adapter_slot_id does not match target_id", expected=expected_slot, actual=adapter_slot_id)]


def validate_plan_type(target_id: Any, plan_type: Any, contract: Mapping[str, Any]) -> List[Dict[str, Any]]:
    supported = contract.get("supported_plan_types", [])
    if plan_type not in supported:
        return [result("plan_type_supported", ResultStatus.INVALID, "plan_type is not supported", expected=supported, actual=plan_type)]
    mapped_target = contract.get("plan_type_to_target", {}).get(str(plan_type))
    if mapped_target == "multi_target":
        return [result("plan_type_multi_target", ResultStatus.NOT_APPLICABLE, "multi_app_execution_plan must be decomposed before adapter invocation", actual=plan_type)]
    if mapped_target == target_id:
        return [result("plan_type_matches_target", ResultStatus.VALID, "plan_type matches target_id", expected=mapped_target, actual=target_id)]
    return [result("plan_type_matches_target", ResultStatus.INVALID, "plan_type does not match target_id", expected=mapped_target, actual=target_id)]


def validate_target_slot_plan_mapping(target_id: Any, adapter_slot_id: Any, plan_type: Any, contract: Mapping[str, Any]) -> List[Dict[str, Any]]:
    findings: List[Dict[str, Any]] = []
    findings.extend(validate_supported_target(target_id, contract))
    findings.extend(validate_adapter_slot(target_id, adapter_slot_id, contract))
    findings.extend(validate_plan_type(target_id, plan_type, contract))
    return findings


def _nested_bool(document: Mapping[str, Any], section: str, key: str) -> Optional[bool]:
    value = document.get(section)
    if isinstance(value, Mapping):
        nested = value.get(key)
        if isinstance(nested, bool):
            return nested
    return None


def _validated_plan_bool(sample: Mapping[str, Any], key: str) -> Optional[bool]:
    plan = sample.get("validated_plan")
    if isinstance(plan, Mapping):
        value = plan.get(key)
        if isinstance(value, bool):
            return value
    return None


def validate_no_public_internet(sample: Mapping[str, Any]) -> List[Dict[str, Any]]:
    allow_public_internet = _nested_bool(sample, "constraints", "allow_public_internet")
    if allow_public_internet is False:
        return [result("allow_public_internet_false", ResultStatus.VALID, "public internet dependency is blocked", expected=False, actual=False)]
    return [result("allow_public_internet_false", ResultStatus.BLOCKED, "public internet dependency is not blocked", expected=False, actual=allow_public_internet)]


def validate_prevent_source_overwrite(sample: Mapping[str, Any]) -> List[Dict[str, Any]]:
    prevent = _nested_bool(sample, "constraints", "prevent_source_overwrite")
    template = sample.get("template_reference") if isinstance(sample.get("template_reference"), Mapping) else {}
    overwrite_source = template.get("overwrite_source") if isinstance(template, Mapping) else None
    if prevent is True and overwrite_source is False:
        return [result("prevent_source_overwrite_true", ResultStatus.VALID, "source overwrite is blocked", expected={"prevent_source_overwrite": True, "overwrite_source": False}, actual={"prevent_source_overwrite": prevent, "overwrite_source": overwrite_source})]
    return [result("prevent_source_overwrite_true", ResultStatus.BLOCKED, "source overwrite prevention is not satisfied", expected={"prevent_source_overwrite": True, "overwrite_source": False}, actual={"prevent_source_overwrite": prevent, "overwrite_source": overwrite_source})]


def validate_no_llm_direct_file_edit(sample: Mapping[str, Any]) -> List[Dict[str, Any]]:
    requested = _validated_plan_bool(sample, "llm_direct_file_edit_requested")
    if requested is False:
        return [result("llm_direct_file_edit_absent", ResultStatus.VALID, "LLM direct file edit request is absent", expected=False, actual=False)]
    return [result("llm_direct_file_edit_absent", ResultStatus.BLOCKED, "LLM direct file edit request is present", expected=False, actual=requested)]


def validate_no_native_app_state_modification(sample: Mapping[str, Any]) -> List[Dict[str, Any]]:
    requested = _validated_plan_bool(sample, "llm_direct_native_app_state_modification_requested")
    if requested is False:
        return [result("llm_direct_native_app_state_modification_absent", ResultStatus.VALID, "LLM direct native app state modification request is absent", expected=False, actual=False)]
    return [result("llm_direct_native_app_state_modification_absent", ResultStatus.BLOCKED, "LLM direct native app state modification request is present", expected=False, actual=requested)]


def validate_no_actual_adapter_invocation(sample: Mapping[str, Any]) -> List[Dict[str, Any]]:
    actual = sample.get("actual_adapter_invoked")
    if actual is False:
        return [result("actual_adapter_invoked_false", ResultStatus.VALID, "actual_adapter_invoked is false", expected=False, actual=False)]
    return [result("actual_adapter_invoked_false", ResultStatus.BLOCKED, "actual_adapter_invoked must be false in proof mode", expected=False, actual=actual)]


def validate_proof_mode_response(sample: Mapping[str, Any]) -> List[Dict[str, Any]]:
    findings: List[Dict[str, Any]] = []
    findings.extend(validate_no_actual_adapter_invocation(sample))
    execution_allowed = sample.get("execution_allowed")
    if execution_allowed is False:
        findings.append(result("execution_allowed_false", ResultStatus.VALID, "execution_allowed is false in proof mode", expected=False, actual=False))
    else:
        findings.append(result("execution_allowed_false", ResultStatus.BLOCKED, "execution_allowed must be false in proof mode", expected=False, actual=execution_allowed))
    output_artifacts = sample.get("output_artifacts")
    if output_artifacts == []:
        findings.append(result("no_real_output_artifact_claim", ResultStatus.VALID, "proof response does not claim generated artifacts", expected=[], actual=output_artifacts))
    else:
        findings.append(result("no_real_output_artifact_claim", ResultStatus.BLOCKED, "proof response must not claim generated artifacts", expected=[], actual=output_artifacts))
    evidence = sample.get("evidence")
    proof_mode = evidence.get("proof_mode") if isinstance(evidence, Mapping) else None
    if proof_mode is True:
        findings.append(result("proof_mode_true", ResultStatus.VALID, "proof_mode evidence is true", expected=True, actual=True))
    else:
        findings.append(result("proof_mode_true", ResultStatus.INVALID, "proof_mode evidence must be true", expected=True, actual=proof_mode))
    return findings


def validate_error_taxonomy_code(error_code: str, error_taxonomy: Mapping[str, Any]) -> List[Dict[str, Any]]:
    entry = get_error_taxonomy_entry(error_code, error_taxonomy)
    if entry is None:
        return [result("error_code_exists_in_taxonomy", ResultStatus.INVALID, "error_code is not in taxonomy", actual=error_code)]
    return [result("error_code_exists_in_taxonomy", ResultStatus.VALID, "error_code exists in taxonomy", actual=error_code)]


def get_error_taxonomy_entry(error_code: str, error_taxonomy: Mapping[str, Any]) -> Optional[Mapping[str, Any]]:
    errors = error_taxonomy.get("errors", [])
    if not isinstance(errors, Iterable):
        return None
    for item in errors:
        if isinstance(item, Mapping) and item.get("error_code") == error_code:
            return item
    return None


def validate_request_sample(sample: Mapping[str, Any], contract: Mapping[str, Any], validator_contract: Mapping[str, Any]) -> List[Dict[str, Any]]:
    required_fields = contract.get("request_envelope", {}).get("required_fields", [])
    findings: List[Dict[str, Any]] = []
    findings.extend(validate_required_fields(sample, required_fields, "request"))
    findings.extend(validate_target_slot_plan_mapping(sample.get("target_id"), sample.get("adapter_slot_id"), sample.get("plan_type"), contract))
    findings.extend(validate_prevent_source_overwrite(sample))
    findings.extend(validate_no_public_internet(sample))
    findings.extend(validate_no_llm_direct_file_edit(sample))
    findings.extend(validate_no_native_app_state_modification(sample))
    execution_context = sample.get("execution_context") if isinstance(sample.get("execution_context"), Mapping) else {}
    dry_run = sample.get("dry_run")
    if execution_context.get("proof_mode") is True or dry_run is True:
        findings.append(result("proof_or_dry_run_context_explicit", ResultStatus.VALID, "proof or dry-run context is explicit"))
    else:
        findings.append(result("proof_or_dry_run_context_explicit", ResultStatus.INVALID, "proof or dry-run context must be explicit", expected=True, actual=False))
    return findings


def validate_response_sample(sample: Mapping[str, Any], contract: Mapping[str, Any], validator_contract: Mapping[str, Any]) -> List[Dict[str, Any]]:
    required_fields = contract.get("response_envelope", {}).get("required_fields", [])
    status_enum = contract.get("response_envelope", {}).get("status_enum", [])
    findings: List[Dict[str, Any]] = []
    findings.extend(validate_required_fields(sample, required_fields, "response"))
    findings.extend(validate_target_slot_plan_mapping(sample.get("target_id"), sample.get("adapter_slot_id"), _response_plan_type_for_target(sample.get("target_id"), contract), contract))
    response_status = sample.get("status")
    if response_status in status_enum:
        findings.append(result("response_status_enum_valid", ResultStatus.VALID, "response status is valid", expected=status_enum, actual=response_status))
    else:
        findings.append(result("response_status_enum_valid", ResultStatus.INVALID, "response status is invalid", expected=status_enum, actual=response_status))
    findings.extend(validate_proof_mode_response(sample))
    return findings


def _response_plan_type_for_target(target_id: Any, contract: Mapping[str, Any]) -> Optional[str]:
    mapping = contract.get("plan_type_to_target", {})
    for plan_type, mapped_target in mapping.items():
        if mapped_target == target_id:
            return str(plan_type)
    return None


def infer_negative_error_code(sample: Mapping[str, Any], contract: Optional[Mapping[str, Any]] = None) -> Optional[str]:
    if _validated_plan_bool(sample, "llm_direct_file_edit_requested") is True:
        return "llm_direct_file_edit_blocked"
    template = sample.get("template_reference") if isinstance(sample.get("template_reference"), Mapping) else {}
    if isinstance(template, Mapping) and template.get("overwrite_source") is True:
        return "source_overwrite_blocked"
    if _nested_bool(sample, "constraints", "prevent_source_overwrite") is False:
        return "source_overwrite_blocked"
    if _nested_bool(sample, "constraints", "allow_public_internet") is True:
        return "public_internet_dependency_blocked"
    if contract is not None:
        mapping_findings = validate_target_slot_plan_mapping(sample.get("target_id"), sample.get("adapter_slot_id"), sample.get("plan_type"), contract)
        if any(item["status"] == ResultStatus.INVALID.value for item in mapping_findings):
            return "target_plan_mismatch"
    return sample.get("expected_error_code") if isinstance(sample.get("expected_error_code"), str) else None


def validate_negative_sample(sample: Mapping[str, Any], matrix_entry: Mapping[str, Any], error_taxonomy: Mapping[str, Any], contract: Optional[Mapping[str, Any]] = None) -> List[Dict[str, Any]]:
    expected_category = matrix_entry.get("expected_error_category")
    expected_status = matrix_entry.get("expected_status")
    inferred_code = infer_negative_error_code(sample, contract)
    findings: List[Dict[str, Any]] = []
    if expected_status == ResultStatus.BLOCKED.value:
        findings.append(result("negative_expected_status_blocked", ResultStatus.VALID, "negative sample expected status is blocked", expected="blocked", actual=expected_status))
    else:
        findings.append(result("negative_expected_status_blocked", ResultStatus.INVALID, "negative sample expected status must be blocked", expected="blocked", actual=expected_status))
    if inferred_code is None:
        findings.append(result("negative_error_code_inferred", ResultStatus.INVALID, "could not infer negative sample error code", expected=expected_category, actual=None))
        return findings
    taxonomy_entry = get_error_taxonomy_entry(inferred_code, error_taxonomy)
    if taxonomy_entry is None:
        findings.append(result("negative_error_code_taxonomy", ResultStatus.INVALID, "negative sample error code missing from taxonomy", actual=inferred_code))
        return findings
    actual_category = taxonomy_entry.get("category")
    if actual_category == expected_category:
        findings.append(result("negative_expected_error_category", ResultStatus.BLOCKED, "negative sample is correctly blocked by expected category", expected=expected_category, actual=actual_category))
    else:
        findings.append(result("negative_expected_error_category", ResultStatus.INVALID, "negative sample category mismatch", expected=expected_category, actual=actual_category))
    return findings


def validate_matrix_entries(matrix: Mapping[str, Any], samples_dir: Path) -> List[Dict[str, Any]]:
    findings: List[Dict[str, Any]] = []
    for section in ("positive_samples", "negative_samples"):
        entries = matrix.get(section, [])
        if not isinstance(entries, list):
            findings.append(result(f"matrix.{section}.list", ResultStatus.INVALID, f"{section} must be a list"))
            continue
        for entry in entries:
            if not isinstance(entry, Mapping):
                findings.append(result(f"matrix.{section}.entry_object", ResultStatus.INVALID, "matrix entry must be an object", actual=entry))
                continue
            sample = entry.get("sample")
            if not isinstance(sample, str):
                findings.append(result(f"matrix.{section}.sample_path", ResultStatus.INVALID, "matrix entry must include sample path"))
                continue
            sample_path = Path(sample)
            if not sample_path.is_absolute():
                if sample_path.parts and sample_path.parts[0] == "docs":
                    candidate = samples_dir.parents[3] / sample_path
                else:
                    candidate = samples_dir / sample_path.name
            else:
                candidate = sample_path
            if candidate.exists():
                findings.append(result(f"matrix.{section}.sample_exists", ResultStatus.VALID, "sample file exists", path=str(candidate)))
            else:
                findings.append(result(f"matrix.{section}.sample_exists", ResultStatus.INVALID, "sample file missing", path=str(candidate)))
    return findings


def overall_status(results: Sequence[Mapping[str, Any]]) -> str:
    statuses = {str(item.get("status")) for item in results}
    if ResultStatus.INVALID.value in statuses:
        return ResultStatus.INVALID.value
    if ResultStatus.BLOCKED.value in statuses:
        return ResultStatus.BLOCKED.value
    if not results:
        return ResultStatus.NOT_EVALUATED.value
    return ResultStatus.VALID.value


def _resolve_path(repo_root: Path, maybe_path: Optional[str], default: str) -> Path:
    raw = maybe_path if maybe_path else default
    path = Path(raw)
    if not path.is_absolute():
        path = repo_root / path
    return path


@dataclass
class RunOptions:
    contract_path: Optional[str] = None
    error_taxonomy_path: Optional[str] = None
    validator_contract_path: Optional[str] = None
    matrix_path: Optional[str] = None
    samples_dir: Optional[str] = None
    strict: bool = False


def run_all_validations(repo_root: Path, options: RunOptions) -> Dict[str, Any]:
    repo_root = repo_root.resolve()
    contract_path = _resolve_path(repo_root, options.contract_path, DEFAULT_CONTRACT_PATH)
    error_taxonomy_path = _resolve_path(repo_root, options.error_taxonomy_path, DEFAULT_ERROR_TAXONOMY_PATH)
    validator_contract_path = _resolve_path(repo_root, options.validator_contract_path, DEFAULT_VALIDATOR_CONTRACT_PATH)
    matrix_path = _resolve_path(repo_root, options.matrix_path, DEFAULT_MATRIX_PATH)
    samples_dir = _resolve_path(repo_root, options.samples_dir, DEFAULT_SAMPLES_DIR)

    contract = load_json_file(contract_path)
    error_taxonomy = load_json_file(error_taxonomy_path)
    validator_contract = load_json_file(validator_contract_path)
    matrix = load_json_file(matrix_path)

    results: List[Dict[str, Any]] = []
    results.extend(validate_matrix_entries(matrix, samples_dir))

    for entry in matrix.get("positive_samples", []):
        if not isinstance(entry, Mapping):
            continue
        sample_path = repo_root / str(entry.get("sample"))
        sample = load_json_file(sample_path)
        sample_type = entry.get("sample_type")
        if sample_type == "request":
            sample_results = validate_request_sample(sample, contract, validator_contract)
        elif sample_type == "response":
            sample_results = validate_response_sample(sample, contract, validator_contract)
        else:
            sample_results = [result("positive_sample_type", ResultStatus.INVALID, "positive sample_type must be request or response", path=str(sample_path), actual=sample_type)]
        expected = entry.get("expected_validation_status")
        actual = overall_status(sample_results)
        if expected == ResultStatus.VALID.value and actual == ResultStatus.VALID.value:
            results.append(result("positive_sample_expected_status", ResultStatus.VALID, "positive sample met expected status", path=str(sample_path), expected=expected, actual=actual))
        else:
            results.append(result("positive_sample_expected_status", ResultStatus.INVALID, "positive sample did not meet expected status", path=str(sample_path), expected=expected, actual=actual))
        results.extend(_prefix_sample_results(sample_path, sample_results))

    for entry in matrix.get("negative_samples", []):
        if not isinstance(entry, Mapping):
            continue
        sample_path = repo_root / str(entry.get("sample"))
        sample = load_json_file(sample_path)
        sample_results = validate_negative_sample(sample, entry, error_taxonomy, contract)
        actual = overall_status(sample_results)
        expected = entry.get("expected_status")
        if expected == ResultStatus.BLOCKED.value and actual == ResultStatus.BLOCKED.value:
            results.append(result("negative_sample_expected_status", ResultStatus.VALID, "negative sample met expected blocked status", path=str(sample_path), expected=expected, actual=actual))
        else:
            results.append(result("negative_sample_expected_status", ResultStatus.INVALID, "negative sample did not meet expected blocked status", path=str(sample_path), expected=expected, actual=actual))
        results.extend(_prefix_sample_results(sample_path, sample_results))

    summary = summarize_results(results)
    return {
        "validator_id": VALIDATOR_ID,
        "validator_version": VALIDATOR_VERSION,
        "repo_root": str(repo_root),
        "generated_at": now_iso(),
        "summary": summary,
        "results": results,
        "limitations": [
            "This validator reads JSON contracts and samples only.",
            "It does not invoke adapters, Hancom COM, GUI, internet, or document generation.",
            "Task 025-A cloud authoring did not execute this validator; local execution is Task 025-B."
        ]
    }


def _prefix_sample_results(sample_path: Path, sample_results: Sequence[Dict[str, Any]]) -> List[Dict[str, Any]]:
    prefixed: List[Dict[str, Any]] = []
    for item in sample_results:
        copied = dict(item)
        copied.setdefault("path", str(sample_path))
        if not copied.get("path"):
            copied["path"] = str(sample_path)
        prefixed.append(copied)
    return prefixed


def summarize_results(results: Sequence[Mapping[str, Any]]) -> Dict[str, Any]:
    total = len(results)
    failed = sum(1 for item in results if item.get("status") == ResultStatus.INVALID.value)
    blocked = sum(1 for item in results if item.get("status") == ResultStatus.BLOCKED.value)
    not_evaluated = sum(1 for item in results if item.get("status") == ResultStatus.NOT_EVALUATED.value)
    passed = sum(1 for item in results if item.get("status") in (ResultStatus.VALID.value, ResultStatus.NOT_APPLICABLE.value))
    if failed:
        status = ResultStatus.INVALID.value
    elif blocked:
        status = ResultStatus.BLOCKED.value
    elif not_evaluated == total and total:
        status = ResultStatus.NOT_EVALUATED.value
    else:
        status = ResultStatus.VALID.value
    return {
        "status": status,
        "total_checks": total,
        "passed_checks": passed,
        "failed_checks": failed,
        "blocked_checks": blocked,
        "not_evaluated_checks": not_evaluated
    }


def build_not_executed_by_cloud_payload(repo_root: Path) -> Dict[str, Any]:
    return {
        "validator_id": VALIDATOR_ID,
        "validator_version": VALIDATOR_VERSION,
        "repo_root": str(repo_root),
        "generated_at": now_iso(),
        "summary": {
            "status": "not_executed_by_cloud",
            "total_checks": 0,
            "passed_checks": 0,
            "failed_checks": 0,
            "blocked_checks": 0
        },
        "results": [],
        "limitations": [
            "Task 025-A cloud package creates this validator source but does not execute it.",
            "Run this validator during Task 025-B local verification."
        ]
    }


def parse_args(argv: Optional[Sequence[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate Army Claw adapter interface contracts and samples.")
    parser.add_argument("--repo-root", default=".", help="Repository root path")
    parser.add_argument("--format", choices=("json", "text"), default="json", help="Output format")
    parser.add_argument("--matrix-path", default=None, help="Validation matrix JSON path")
    parser.add_argument("--contract-path", default=None, help="Common office adapter interface contract JSON path")
    parser.add_argument("--error-taxonomy-path", default=None, help="Error taxonomy JSON path")
    parser.add_argument("--validator-contract-path", default=None, help="Adapter interface validator contract JSON path")
    parser.add_argument("--samples-dir", default=None, help="Sample payload directory")
    parser.add_argument("--strict", action="store_true", help="Reserved for stricter future checks")
    return parser.parse_args(argv)


def print_text(payload: Mapping[str, Any]) -> None:
    summary = payload.get("summary", {})
    print(f"validator_id: {payload.get('validator_id')}")
    print(f"validator_version: {payload.get('validator_version')}")
    print(f"status: {summary.get('status')}")
    print(f"total_checks: {summary.get('total_checks')}")
    print(f"passed_checks: {summary.get('passed_checks')}")
    print(f"failed_checks: {summary.get('failed_checks')}")
    print(f"blocked_checks: {summary.get('blocked_checks')}")
    for item in payload.get("results", []):
        print(f"- [{item.get('status')}] {item.get('check_id')}: {item.get('message')}")


def main(argv: Optional[Sequence[str]] = None) -> int:
    args = parse_args(argv)
    repo_root = Path(args.repo_root)
    options = RunOptions(
        contract_path=args.contract_path,
        error_taxonomy_path=args.error_taxonomy_path,
        validator_contract_path=args.validator_contract_path,
        matrix_path=args.matrix_path,
        samples_dir=args.samples_dir,
        strict=args.strict,
    )
    try:
        payload = run_all_validations(repo_root, options)
        summary = payload.get("summary", {})
        exit_code = 0 if summary.get("failed_checks") == 0 and summary.get("blocked_checks") == 0 else 1
    except ValidationInputError as exc:
        payload = {
            "validator_id": VALIDATOR_ID,
            "validator_version": VALIDATOR_VERSION,
            "repo_root": str(repo_root),
            "generated_at": now_iso(),
            "summary": {"status": ResultStatus.INVALID.value, "total_checks": 0, "passed_checks": 0, "failed_checks": 1, "blocked_checks": 0},
            "results": [result("input_error", ResultStatus.INVALID, str(exc))],
            "limitations": []
        }
        exit_code = 2
    except Exception as exc:  # pragma: no cover - defensive CLI boundary
        payload = {
            "validator_id": VALIDATOR_ID,
            "validator_version": VALIDATOR_VERSION,
            "repo_root": str(repo_root),
            "generated_at": now_iso(),
            "summary": {"status": ResultStatus.INVALID.value, "total_checks": 0, "passed_checks": 0, "failed_checks": 1, "blocked_checks": 0},
            "results": [result("internal_error", ResultStatus.INVALID, f"{type(exc).__name__}: {exc}")],
            "limitations": []
        }
        exit_code = 3

    if args.format == "json":
        print(json.dumps(payload, ensure_ascii=False, indent=2))
    else:
        print_text(payload)
    return exit_code


if __name__ == "__main__":
    sys.exit(main())

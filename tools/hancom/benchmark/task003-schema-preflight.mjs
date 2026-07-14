import { executionRecordValidation, isFilesystemProbe, isObject, isSha256 } from "./task003-common.mjs";
import { prerequisiteProbeValidation } from "./task003-status-decision.mjs";

export function validateSchemaDocumentShape(schema) {
  const errors = [];
  if (!isObject(schema)) errors.push("schema_not_object");
  if (schema?.$schema !== "https://json-schema.org/draft/2020-12/schema") errors.push("draft_marker_missing");
  if (schema?.type !== "object") errors.push("root_type_invalid");
  if (schema?.additionalProperties !== false) errors.push("root_not_strict");
  if (!Array.isArray(schema?.required)) errors.push("required_array_missing");
  if (!isObject(schema?.properties)) errors.push("properties_missing");
  return { valid: errors.length === 0, errors, limitation: "static preflight only" };
}

function sourceInspectionValid(value) {
  return isObject(value) && value.performed === true && value.supported === false
    && typeof value.method === "string" && typeof value.evidence_path === "string"
    && isSha256(value.evidence_sha256);
}
function adapterSourceInspectionValid(value) {
  return isObject(value)
    && typeof value.inspection_target === "string" && value.inspection_target.length > 0
    && typeof value.method === "string" && value.method.length > 0
    && value.result === "unsupported"
    && typeof value.evidence_path === "string" && value.evidence_path.length > 0
    && isSha256(value.evidence_sha256);
}
function importedEvidenceValid(value) {
  return isObject(value) && typeof value.source_path === "string" && isSha256(value.source_sha256)
    && value.hash_verified === true && value.source_probe?.path === value.source_path
    && value.source_probe?.sha256 === value.source_sha256 && value.source_probe?.source === "filesystem";
}
function validatorResultValid(value) {
  return isObject(value) && typeof value.validator_id === "string" && typeof value.valid === "boolean"
    && Array.isArray(value.missing_evidence) && Array.isArray(value.assertions);
}

export function validateBenchmarkResultContract(document) {
  const errors = [];
  if (!Array.isArray(document?.planned_commands)) errors.push("planned_commands_required");
  if (!Array.isArray(document?.attempted_commands)) errors.push("attempted_commands_required");
  if (!Array.isArray(document?.validator_results)) errors.push("validator_results_required");
  if (document?.status === "passed") {
    if (!importedEvidenceValid(document.imported_evidence)) errors.push("passed_imported_evidence_invalid");
    if (!document.attempted_commands?.length || document.attempted_commands.some((record) => !executionRecordValidation(record).valid || record.exit_code !== 0)) errors.push("passed_execution_invalid");
    if (!document.validator_results?.length || document.validator_results.some((result) => result.valid !== true || result.missing_evidence?.length)) errors.push("passed_validator_invalid");
    if (!Array.isArray(document.missing_evidence) || document.missing_evidence.length !== 0) errors.push("passed_missing_evidence_not_empty");
    if (document.evidence_completeness !== "complete") errors.push("passed_evidence_not_complete");
  }
  if (document?.status === "blocked") {
    if (!prerequisiteProbeValidation(document.prerequisite_probe).valid) errors.push("blocked_probe_invalid");
    if (!document.blocked_reason_code) errors.push("blocked_reason_required");
    if (!document.missing_prerequisites?.length) errors.push("blocked_prerequisites_required");
  }
  if (document?.status === "unsupported" && !sourceInspectionValid(document.source_api_inspection)) errors.push("unsupported_inspection_invalid");
  if (document?.status === "not_applicable" && (!document.candidate_role || !document.rationale || !document.governing_role_matrix_reference || document.attempted_commands?.length || document.missing_evidence?.length || document.evidence_completeness !== "not_applicable")) errors.push("not_applicable_context_invalid");
  return { valid: errors.length === 0, errors };
}

export function validateAdapterExecutionContract(document) {
  const errors = [];
  if (!Array.isArray(document?.planned_commands)) errors.push("planned_commands_required");
  if (!Array.isArray(document?.attempted_commands)) errors.push("attempted_commands_required");
  if (!Array.isArray(document?.validator_results) || document.validator_results.some((value) => !validatorResultValid(value))) errors.push("validator_results_invalid");
  if (!Array.isArray(document?.missing_evidence)) errors.push("missing_evidence_required");
  if (!document?.evidence_completeness) errors.push("evidence_completeness_required");

  if (document?.status === "passed") {
    if (document.execution_outcome !== "success") errors.push("passed_execution_outcome_invalid");
    if (!document.attempted_commands?.length || document.attempted_commands.some((record) => !executionRecordValidation(record).valid || record.exit_code !== 0)) errors.push("passed_command_invalid");
    if (!document.validator_results?.length || document.validator_results.some((result) => result.valid !== true || result.missing_evidence.length !== 0)) errors.push("passed_validator_invalid");
    if (document.missing_evidence?.length) errors.push("passed_missing_evidence_present");
    if (document.evidence_completeness !== "complete") errors.push("passed_evidence_not_complete");
  }

  if (document?.status === "failed") {
    if (!document.attempted_commands?.length) errors.push("failed_attempted_command_required");
    if (!document.execution_outcome && !document.status_reason) errors.push("failed_outcome_or_reason_required");
    const commandFailure = document.attempted_commands?.some((record) => executionRecordValidation(record).valid && record.exit_code !== 0) === true;
    const validatorFailure = document.validator_results?.some((result) => result.valid === false) === true;
    if (!commandFailure && !validatorFailure) errors.push("failed_actual_failure_evidence_required");
  }

  if (document?.status === "blocked") {
    const probe = document.prerequisite_probe;
    const checked = Array.isArray(probe?.checked_path_results) && probe.checked_path_results.length > 0
      && probe.checked_path_results.every((entry) => entry.exists === false
        ? entry.size === null && entry.sha256 === null
        : isFilesystemProbe(entry));
    if (!isObject(probe) || probe.performed !== true || probe.available !== false || !probe.method || !probe.probe_evidence_path || !isSha256(probe.probe_evidence_sha256) || !checked) errors.push("blocked_probe_invalid");
    if (!document.blocked_reason_code) errors.push("blocked_reason_required");
    if (!document.missing_prerequisites?.length) errors.push("blocked_missing_prerequisites_required");
  }

  if (document?.status === "unsupported" && !adapterSourceInspectionValid(document.source_api_inspection)) errors.push("unsupported_source_api_inspection_invalid");

  if (document?.status === "not_applicable") {
    if (document.attempted_commands?.length) errors.push("not_applicable_commands_forbidden");
    if (!document.not_applicable_rationale) errors.push("not_applicable_rationale_required");
    if (!document.candidate_role) errors.push("not_applicable_candidate_role_required");
    if (!document.role_matrix_reference) errors.push("not_applicable_role_matrix_reference_required");
  }

  return { valid: errors.length === 0, errors };
}

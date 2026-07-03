import { executionRecordValidation, isObject, isSha256 } from "./task003-common.mjs";
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
function importedEvidenceValid(value) {
  return isObject(value) && typeof value.source_path === "string" && isSha256(value.source_sha256)
    && value.hash_verified === true && value.source_probe?.path === value.source_path
    && value.source_probe?.sha256 === value.source_sha256 && value.source_probe?.source === "filesystem";
}

export function validateBenchmarkResultContract(document) {
  const errors = [];
  if (!Array.isArray(document?.planned_commands)) errors.push("planned_commands_required");
  if (!Array.isArray(document?.attempted_commands)) errors.push("attempted_commands_required");
  if (!Array.isArray(document?.validator_results)) errors.push("validator_results_required");
  if (document?.status === "passed") {
    if (!importedEvidenceValid(document.imported_evidence)) errors.push("passed_imported_evidence_invalid");
    if (!document.attempted_commands?.length || document.attempted_commands.some((record) => !executionRecordValidation(record).valid || record.exit_code !== 0)) errors.push("passed_execution_invalid");
    if (!document.validator_results?.length || document.validator_results.some((result) => result.valid !== true)) errors.push("passed_validator_invalid");
  }
  if (document?.status === "blocked") {
    if (!prerequisiteProbeValidation(document.prerequisite_probe).valid) errors.push("blocked_probe_invalid");
    if (!document.blocked_reason_code) errors.push("blocked_reason_required");
    if (!document.missing_prerequisites?.length) errors.push("blocked_prerequisites_required");
  }
  if (document?.status === "unsupported" && !sourceInspectionValid(document.source_api_inspection)) errors.push("unsupported_inspection_invalid");
  if (document?.status === "not_applicable" && (!document.candidate_role || !document.rationale || !document.governing_role_matrix_reference || document.attempted_commands?.length)) errors.push("not_applicable_context_invalid");
  return { valid: errors.length === 0, errors };
}

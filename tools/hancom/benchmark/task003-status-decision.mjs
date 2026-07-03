import {
  executionRecordValidation,
  isFilesystemProbe,
  isObject,
  isSha256,
  scenarioApplicable,
  unique,
} from "./task003-common.mjs";
import { validateScenarioEvidence } from "./task003-complete-gates.mjs";

function sourceInspectionValid(x) {
  return isObject(x) && x.performed === true && typeof x.supported === "boolean"
    && typeof x.evidence_path === "string" && x.evidence_path.length > 0
    && isSha256(x.evidence_sha256) && typeof x.method === "string" && x.method.length > 0;
}

function checkedPathResultValid(result) {
  if (!isObject(result) || typeof result.path !== "string" || typeof result.exists !== "boolean") return false;
  if (result.exists === false) return result.sha256 == null && result.size == null;
  return Number.isInteger(result.size) && result.size >= 0 && isSha256(result.sha256)
    && result.hash_algorithm === "sha256" && result.source === "filesystem";
}

export function prerequisiteProbeValidation(x) {
  const valid = isObject(x) && x.performed === true && typeof x.available === "boolean"
    && typeof x.method === "string" && x.method.length > 0
    && typeof x.probe_evidence_path === "string" && x.probe_evidence_path.length > 0
    && isSha256(x.probe_evidence_sha256)
    && Array.isArray(x.checked_path_results) && x.checked_path_results.length > 0
    && x.checked_path_results.every(checkedPathResultValid);
  if (!valid) return { valid: false, missing_evidence: ["prerequisite_probe_invalid"] };
  if (x.available === false && (!x.blocked_reason_code || !Array.isArray(x.missing_prerequisites) || x.missing_prerequisites.length === 0)) {
    return { valid: false, missing_evidence: ["blocked_probe_requires_reason_and_missing_prerequisites"] };
  }
  return { valid: true, missing_evidence: [] };
}

function importedValid(x) {
  return isObject(x) && typeof x.source_path === "string" && isSha256(x.source_sha256)
    && x.hash_verified === true && isFilesystemProbe(x.source_probe)
    && x.source_probe.path === x.source_path && x.source_probe.sha256 === x.source_sha256;
}

export function deriveStatusFromEvidence({ role, scenarioId, execution_record = null, source_api_inspection = null, prerequisite_probe = null, imported_evidence = null, scenario_validator_result = null }) {
  if (!scenarioApplicable(role, scenarioId)) return {
    status: "not_applicable",
    candidate_role: role,
    rationale: `${role} role does not own ${scenarioId}`,
    governing_role_matrix_reference: "role-matrix.json",
    evidence_completeness: "not_applicable",
    missing_evidence: [],
    status_reason: `${role} role does not own ${scenarioId}`,
  };

  if (execution_record !== null) {
    const execution = executionRecordValidation(execution_record);
    if (!execution.valid) throw new Error(`execution_record_invalid:${execution.missing_evidence.join(",")}`);
    if (execution_record.exit_code !== 0 || execution_record.exception_result) return {
      status: "failed",
      evidence_completeness: "complete",
      missing_evidence: scenario_validator_result?.missing_evidence ?? [],
      status_reason: "actual execution failed",
      execution_record,
    };
    if (importedValid(imported_evidence) && scenario_validator_result?.valid === true) return {
      status: "passed",
      evidence_completeness: "complete",
      missing_evidence: [],
      status_reason: "actual execution, imported evidence filesystem lineage and semantic validator passed",
      execution_record,
      imported_evidence,
    };
    return {
      status: "failed",
      evidence_completeness: "partial",
      missing_evidence: unique([...(scenario_validator_result?.missing_evidence ?? []), importedValid(imported_evidence) ? null : "imported_evidence_filesystem_lineage_missing"]),
      status_reason: "execution succeeded but complete scenario evidence did not",
      execution_record,
    };
  }

  if (sourceInspectionValid(source_api_inspection) && source_api_inspection.supported === false) return {
    status: "unsupported",
    evidence_completeness: "complete",
    missing_evidence: [],
    status_reason: source_api_inspection.rationale ?? "source/API inspection shows unsupported",
    source_api_inspection,
  };

  const probe = prerequisiteProbeValidation(prerequisite_probe);
  if (probe.valid && prerequisite_probe.available === false) return {
    status: "blocked",
    blocked_reason_code: prerequisite_probe.blocked_reason_code,
    missing_prerequisites: prerequisite_probe.missing_prerequisites,
    prerequisite_probe,
    probe_evidence_path: prerequisite_probe.probe_evidence_path,
    evidence_completeness: "complete",
    missing_evidence: prerequisite_probe.missing_prerequisites,
    status_reason: "verified prerequisite filesystem/runtime probe found unavailable prerequisites",
  };

  throw new Error("status_evidence_insufficient:actual execution, verified unsupported inspection, or verified blocking prerequisite probe required");
}

export function correctedStatusForScenario({ role, scenarioId, execution_record = null, source_api_inspection = null, prerequisite_probe = null, imported_evidence = null, evidence = {} }) {
  return deriveStatusFromEvidence({ role, scenarioId, execution_record, source_api_inspection, prerequisite_probe, imported_evidence, scenario_validator_result: validateScenarioEvidence(scenarioId, evidence) });
}

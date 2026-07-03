import { isObject, isSha256, scenarioApplicable, unique } from "./task003-common.mjs";
import { validateScenarioEvidence } from "./task003-complete-gates.mjs";

function executionValid(x) {
  return isObject(x) && x.executed === true && typeof x.method === "string"
    && typeof x.started_at === "string" && typeof x.ended_at === "string"
    && Number.isInteger(x.exit_code) && (x.exit_code === 0 || typeof x.exception_result === "string");
}
function sourceInspectionValid(x) {
  return isObject(x) && x.performed === true && typeof x.supported === "boolean"
    && typeof x.evidence_path === "string" && isSha256(x.evidence_sha256);
}
function probeValid(x) {
  return isObject(x) && x.performed === true && typeof x.available === "boolean"
    && typeof x.evidence_path === "string" && isSha256(x.evidence_sha256)
    && Array.isArray(x.checked_path_results);
}
function importedValid(x) {
  return isObject(x) && typeof x.source_path === "string" && isSha256(x.source_sha256) && x.hash_verified === true;
}

export function deriveStatusFromEvidence({ role, scenarioId, execution_record = null, source_api_inspection = null, prerequisite_probe = null, imported_evidence = null, scenario_validator_result = null }) {
  if (!scenarioApplicable(role, scenarioId)) return {
    status: "not_applicable", evidence_completeness: "not_applicable", missing_evidence: [],
    status_reason: `${role} role does not own ${scenarioId}`,
  };
  if (executionValid(execution_record)) {
    if (execution_record.exit_code !== 0 || execution_record.exception_result) return {
      status: "failed", evidence_completeness: "partial", missing_evidence: scenario_validator_result?.missing_evidence ?? [],
      status_reason: "actual execution failed",
    };
    if (importedValid(imported_evidence) && scenario_validator_result?.valid === true) return {
      status: "passed", evidence_completeness: "complete", missing_evidence: [],
      status_reason: "actual execution and semantic validator passed",
    };
    return {
      status: "failed", evidence_completeness: "partial",
      missing_evidence: unique([...(scenario_validator_result?.missing_evidence ?? []), importedValid(imported_evidence) ? null : "imported_evidence_path_sha256_missing_or_unverified"]),
      status_reason: "execution succeeded but complete scenario evidence did not",
    };
  }
  if (sourceInspectionValid(source_api_inspection) && source_api_inspection.supported === false) return {
    status: "unsupported", evidence_completeness: "complete", missing_evidence: [],
    status_reason: source_api_inspection.rationale ?? "source/API inspection shows unsupported",
  };
  if (probeValid(prerequisite_probe) && prerequisite_probe.available === false) return {
    status: "blocked", evidence_completeness: "partial",
    missing_evidence: prerequisite_probe.missing_prerequisites?.length ? prerequisite_probe.missing_prerequisites : ["required_prerequisite_unavailable"],
    status_reason: "filesystem/runtime prerequisite probe found an unavailable prerequisite",
  };
  return {
    status: "blocked", evidence_completeness: "missing",
    missing_evidence: unique([
      executionValid(execution_record) ? null : "actual_execution_record_missing",
      sourceInspectionValid(source_api_inspection) ? null : "source_api_inspection_evidence_missing",
      probeValid(prerequisite_probe) ? null : "filesystem_runtime_prerequisite_probe_missing",
      importedValid(imported_evidence) ? null : "imported_evidence_path_sha256_missing_or_unverified",
    ]),
    status_reason: "status cannot be promoted without actual evidence or a verified prerequisite/source finding",
  };
}

export function correctedStatusForScenario({ role, scenarioId, execution_record = null, source_api_inspection = null, prerequisite_probe = null, imported_evidence = null, evidence = {} }) {
  return deriveStatusFromEvidence({ role, scenarioId, execution_record, source_api_inspection, prerequisite_probe, imported_evidence, scenario_validator_result: validateScenarioEvidence(scenarioId, evidence) });
}

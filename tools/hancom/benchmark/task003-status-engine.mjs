import { commandRecordValid, isObject, isSha, roleApplicability, uniq } from "./task003-cloud-common.mjs";
const inspectionValid = (x) => isObject(x) && x.performed === true && typeof x.supported === "boolean" && x.evidence_path && isSha(x.evidence_sha256);
const probeValid = (x) => isObject(x) && x.performed === true && typeof x.available === "boolean" && x.evidence_path && isSha(x.evidence_sha256) && Array.isArray(x.checked_paths);
const importValid = (x) => isObject(x) && x.source_path && isSha(x.source_sha256) && x.hash_verified === true;
export function deriveStatus({ role, scenarioId, execution_record = null, source_api_inspection = null, prerequisite_probe = null, imported_evidence = null, validator_result = null }) {
  const applicability = roleApplicability(role, scenarioId);
  if (!applicability.applicable) return { status: "not_applicable", evidence_completeness: "not_applicable", missing_evidence: [], status_reason: applicability.rationale };
  if (commandRecordValid(execution_record)) {
    if (execution_record.exit_code !== 0) return { status: "failed", evidence_completeness: "partial", missing_evidence: validator_result?.missing_evidence ?? [], status_reason: "actual execution returned non-zero exit code" };
    if (validator_result?.valid === true && importValid(imported_evidence)) return { status: "passed", evidence_completeness: "complete", missing_evidence: [], status_reason: "actual execution, imported evidence lineage and semantic validation passed" };
    if ((validator_result?.missing_evidence ?? []).length > 0 || !importValid(imported_evidence)) return { status: "blocked", evidence_completeness: "partial", missing_evidence: uniq([...(validator_result?.missing_evidence ?? []), importValid(imported_evidence) ? null : "imported_evidence_lineage_missing"]), status_reason: "execution exists but complete evidence is unavailable" };
    return { status: "failed", evidence_completeness: "complete", missing_evidence: [], status_reason: "execution completed but semantic assertions failed" };
  }
  if (inspectionValid(source_api_inspection) && source_api_inspection.supported === false) return { status: "unsupported", evidence_completeness: "complete", missing_evidence: [], status_reason: source_api_inspection.rationale ?? "source/API inspection proves unsupported" };
  if (probeValid(prerequisite_probe) && prerequisite_probe.available === false) return { status: "blocked", evidence_completeness: "partial", missing_evidence: prerequisite_probe.missing_prerequisites?.length ? prerequisite_probe.missing_prerequisites : ["prerequisite_unavailable"], status_reason: "verified prerequisite probe blocks execution" };
  return { status: "blocked", evidence_completeness: "missing", missing_evidence: uniq(["actual_execution_record_missing", inspectionValid(source_api_inspection) ? null : "source_api_inspection_missing", probeValid(prerequisite_probe) ? null : "prerequisite_probe_missing", importValid(imported_evidence) ? null : "imported_evidence_lineage_missing"]), status_reason: "insufficient evidence to derive a stronger status" };
}

import { attemptedCommandValid, completeGate, isObject, isSha256, median, numericArray, p95, validateScenarioAssertions } from "./task003-common.mjs";
import { validateS06Evidence, validateS07Evidence, validateS08Evidence } from "./task003-preservation-validators.mjs";

export function validateS12Evidence(e = {}) {
  const m = [];
  const artifactInventory = e.artifact_inventory ?? e.artifact_inventory_list;
  if (!Number.isInteger(e.warmup_runs) || e.warmup_runs < 1) m.push("warmup_runs_missing_or_invalid");
  if (!Number.isInteger(e.measured_runs) || e.measured_runs < 5) m.push("measured_runs_missing_or_invalid");
  if (!numericArray(e.duration_samples_ms, 5) || e.duration_samples_ms.length !== e.measured_runs) m.push("duration_raw_samples_missing_or_count_mismatch");
  if (!isObject(e.measurement_boundary) || (e.measurement_boundary.separate_process !== true && !e.measurement_boundary.limitation)) m.push("process_boundary_or_limitation_missing");
  if (!e.peak_rss_method || !numericArray(e.peak_rss_samples_bytes, 5)) m.push("peak_rss_method_or_samples_missing");
  if (!Array.isArray(artifactInventory) || !artifactInventory.length || artifactInventory.some((x) => !isSha256(x.sha256) || !Number.isFinite(x.size))) m.push("artifact_inventory_missing_or_invalid");
  if (!Array.isArray(e.runtime_dependency_inventory) || !e.runtime_dependency_inventory.length || e.runtime_dependency_inventory.some((x) => !isSha256(x.sha256) || !Number.isFinite(x.size))) m.push("runtime_dependency_inventory_missing_or_invalid");
  if (!e.measurement_command || !e.raw_logs?.stdout_path || !e.raw_logs?.stderr_path) m.push("measurement_command_or_raw_logs_missing");
  const art = artifactInventory?.reduce((s, x) => s + x.size, 0), runtime = e.runtime_dependency_inventory?.reduce((s, x) => s + x.size, 0);
  return completeGate([
    { assertion_id: "duration_median_recomputed", expected: median(e.duration_samples_ms), actual: e.reported_median_ms, passed: median(e.duration_samples_ms) === e.reported_median_ms },
    { assertion_id: "duration_p95_recomputed", expected: p95(e.duration_samples_ms), actual: e.reported_p95_ms, passed: p95(e.duration_samples_ms) === e.reported_p95_ms },
    { assertion_id: "artifact_total_recomputed", expected: art, actual: e.artifact_total_size, passed: Number.isFinite(art) && art === e.artifact_total_size },
    { assertion_id: "runtime_total_recomputed", expected: runtime, actual: e.runtime_dependency_total_size, passed: Number.isFinite(runtime) && runtime === e.runtime_dependency_total_size },
    { assertion_id: "measurement_limitations_documented", expected: true, actual: e.measurement_limitations, passed: Array.isArray(e.measurement_limitations) && e.measurement_limitations.length > 0 },
    validateScenarioAssertions(e.scenario_assertions),
  ], m);
}

export function validateS13Evidence(e = {}) {
  const m = [];
  if (!e.clean_environment?.type || !e.clean_environment?.path_or_id || e.clean_environment?.isolated !== true) m.push("clean_isolated_environment_missing");
  if (!Array.isArray(e.pinned_offline_artifact_inventory) || !e.pinned_offline_artifact_inventory.length || e.pinned_offline_artifact_inventory.some((x) => !isSha256(x.sha256) || !Number.isFinite(x.size))) m.push("pinned_offline_artifact_inventory_missing_or_invalid");
  if (!attemptedCommandValid(e.install_attempt)) m.push("attempted_install_command_record_missing_or_invalid");
  if (!Array.isArray(e.installed_inventory) || !e.installed_inventory.length) m.push("installed_inventory_missing");
  if (!attemptedCommandValid(e.runtime_invocation)) m.push("runtime_invocation_record_missing_or_invalid");
  if (!e.runtime_network_test?.method || typeof e.runtime_network_test?.network_required !== "boolean" || !Number.isInteger(e.runtime_network_test?.exit_code)) m.push("runtime_network_test_missing_or_invalid");
  if (e.cleanup?.attempted !== true || !e.cleanup?.result) m.push("cleanup_result_missing");
  return completeGate([
    { assertion_id: "offline_install_succeeded", expected: 0, actual: e.install_attempt?.exit_code, passed: e.install_attempt?.exit_code === 0 },
    { assertion_id: "runtime_invocation_succeeded", expected: 0, actual: e.runtime_invocation?.exit_code, passed: e.runtime_invocation?.exit_code === 0 },
    { assertion_id: "runtime_did_not_require_network", expected: false, actual: e.runtime_network_test?.network_required, passed: e.runtime_network_test?.network_required === false && e.runtime_network_test?.exit_code === 0 },
    { assertion_id: "cleanup_succeeded", expected: "success", actual: e.cleanup?.result, passed: e.cleanup?.result === "success" },
    validateScenarioAssertions(e.scenario_assertions),
  ], m);
}

export function validateS14Evidence(e = {}) {
  const m = [];
  if (!e.project_identity || !e.component_scope) m.push("project_identity_or_component_scope_missing");
  const files = e.license_files;
  if (!Array.isArray(files) || !files.length || files.some((x) => !["LICENSE", "COPYING", "NOTICE"].includes(x.kind) || !x.path || !isSha256(x.sha256))) m.push("license_copying_notice_inventory_missing_or_invalid");
  if (!files?.some((x) => x.kind === "LICENSE" || x.kind === "COPYING")) m.push("license_or_copying_file_missing");
  if (!e.spdx_expression && !e.manual_assessment?.text) m.push("spdx_or_documented_manual_assessment_missing");
  if (!e.redistribution?.source_impact || e.redistribution.source_impact === "unknown") m.push("source_redistribution_impact_missing");
  if (!e.redistribution?.binary_impact || e.redistribution.binary_impact === "unknown") m.push("binary_redistribution_impact_missing");
  if (!Array.isArray(e.redistribution?.obligations) || !e.redistribution.obligations.length) m.push("redistribution_obligations_missing");
  if (!e.reviewer || !e.reviewed_at) m.push("reviewer_or_reviewed_at_missing");
  return completeGate([
    { assertion_id: "license_file_hashes_valid", expected: true, actual: files, passed: Array.isArray(files) && files.length > 0 && files.every((x) => isSha256(x.sha256)) },
    { assertion_id: "redistribution_assessment_complete", expected: true, actual: e.redistribution, passed: Boolean(e.redistribution?.source_impact && e.redistribution?.binary_impact && e.redistribution.source_impact !== "unknown" && e.redistribution.binary_impact !== "unknown") },
    validateScenarioAssertions(e.scenario_assertions),
  ], m);
}

export function validateScenarioEvidence(id, e = {}) {
  const map = { S06: validateS06Evidence, S07: validateS07Evidence, S08: validateS08Evidence, S12: validateS12Evidence, S13: validateS13Evidence, S14: validateS14Evidence };
  return map[id] ? { validator_id: `${id.toLowerCase()}-semantic-gate`, ...map[id](e) }
    : { validator_id: `${id.toLowerCase()}-scenario-gate`, valid: false, missing_evidence: ["scenario_specific_validator_not_supplied"], assertions: [] };
}

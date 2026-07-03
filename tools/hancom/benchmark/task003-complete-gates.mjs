import {
  completeGate,
  executionRecordValidation,
  fileReferenceValidation,
  inventoryProbeValidation,
  isObject,
  isValidDateTime,
  median,
  numericArray,
  p95,
  unique,
  validateScenarioAssertions,
} from "./task003-common.mjs";
import { validateS06, validateS07, validateS08 } from "./task003-preservation-validators.mjs";

function mergeValidation(target, validation) {
  target.assertions.push(...validation.assertions);
  target.missing.push(...validation.missing_evidence);
}

export function validateS12Evidence(e = {}) {
  const state = { missing: [], assertions: [] };
  const probes = e.file_probes ?? {};
  const artifacts = e.artifact_inventory ?? [];
  if (!Number.isInteger(e.warmup_runs) || e.warmup_runs < 1) state.missing.push("warmup_runs_missing_or_invalid");
  if (!Number.isInteger(e.measured_runs) || e.measured_runs < 5) state.missing.push("measured_runs_missing_or_invalid");
  if (!numericArray(e.duration_samples_ms, 5) || e.duration_samples_ms.length !== e.measured_runs) state.missing.push("duration_raw_samples_missing_or_count_mismatch");
  if (!numericArray(e.peak_rss_samples_bytes, 5) || e.peak_rss_samples_bytes.length !== e.measured_runs) state.missing.push("peak_rss_samples_missing_or_count_mismatch");
  if (!isObject(e.measurement_boundary) || (e.measurement_boundary.separate_process !== true && !e.measurement_boundary.limitation)) state.missing.push("process_boundary_or_limitation_missing");
  if (!isObject(e.peak_rss_method) || !e.peak_rss_method.method || !Array.isArray(e.peak_rss_method.limitations)) state.missing.push("peak_rss_method_or_limitations_missing");
  mergeValidation(state, inventoryProbeValidation(artifacts, probes, "S12_artifact_inventory"));
  mergeValidation(state, inventoryProbeValidation(e.runtime_dependency_inventory, probes, "S12_runtime_dependency_inventory"));
  mergeValidation(state, executionRecordValidation(e.measurement_command));
  mergeValidation(state, fileReferenceValidation(e.raw_logs?.stdout, probes[e.raw_logs?.stdout?.path], "S12_stdout_log"));
  mergeValidation(state, fileReferenceValidation(e.raw_logs?.stderr, probes[e.raw_logs?.stderr?.path], "S12_stderr_log"));
  const artifactTotal = artifacts.reduce((sum, item) => sum + (item.size ?? 0), 0);
  const runtimeTotal = (e.runtime_dependency_inventory ?? []).reduce((sum, item) => sum + (item.size ?? 0), 0);
  state.assertions.push(
    { assertion_id: "S12_duration_median_recomputed", expected: median(e.duration_samples_ms), actual: e.reported_median_ms, passed: median(e.duration_samples_ms) === e.reported_median_ms },
    { assertion_id: "S12_duration_p95_recomputed", expected: p95(e.duration_samples_ms), actual: e.reported_p95_ms, passed: p95(e.duration_samples_ms) === e.reported_p95_ms },
    { assertion_id: "S12_artifact_total_recomputed", expected: artifactTotal, actual: e.artifact_total_size, passed: artifactTotal > 0 && artifactTotal === e.artifact_total_size },
    { assertion_id: "S12_runtime_total_recomputed", expected: runtimeTotal, actual: e.runtime_dependency_total_size, passed: runtimeTotal > 0 && runtimeTotal === e.runtime_dependency_total_size },
    { assertion_id: "S12_command_stdout_matches_log", expected: e.raw_logs?.stdout?.path, actual: e.measurement_command?.stdout_path, passed: e.measurement_command?.stdout_path === e.raw_logs?.stdout?.path },
    { assertion_id: "S12_command_stderr_matches_log", expected: e.raw_logs?.stderr?.path, actual: e.measurement_command?.stderr_path, passed: e.measurement_command?.stderr_path === e.raw_logs?.stderr?.path },
    validateScenarioAssertions(e.scenario_assertions),
  );
  return completeGate(state.assertions, unique(state.missing));
}

export function validateS13Evidence(e = {}) {
  const state = { missing: [], assertions: [] };
  const probes = e.file_probes ?? {};
  if (!e.clean_environment?.type || !e.clean_environment?.path_or_id || e.clean_environment?.isolated !== true) state.missing.push("clean_isolated_environment_missing");
  mergeValidation(state, inventoryProbeValidation(e.pinned_offline_artifact_inventory, probes, "S13_offline_artifact_inventory"));
  mergeValidation(state, executionRecordValidation(e.install_attempt));
  mergeValidation(state, inventoryProbeValidation(e.installed_inventory, probes, "S13_installed_inventory"));
  mergeValidation(state, executionRecordValidation(e.runtime_invocation));
  mergeValidation(state, fileReferenceValidation(e.runtime_network_test?.evidence, probes[e.runtime_network_test?.evidence?.path], "S13_network_test_evidence"));
  mergeValidation(state, fileReferenceValidation(e.cleanup?.evidence, probes[e.cleanup?.evidence?.path], "S13_cleanup_evidence"));
  if (!e.runtime_network_test?.method || typeof e.runtime_network_test.network_required !== "boolean" || !Number.isInteger(e.runtime_network_test.exit_code)) state.missing.push("runtime_network_test_missing_or_invalid");
  if (e.cleanup?.attempted !== true || !e.cleanup?.result) state.missing.push("cleanup_result_missing");
  state.assertions.push(
    { assertion_id: "S13_offline_install_succeeded", expected: 0, actual: e.install_attempt?.exit_code, passed: e.install_attempt?.exit_code === 0 },
    { assertion_id: "S13_runtime_invocation_succeeded", expected: 0, actual: e.runtime_invocation?.exit_code, passed: e.runtime_invocation?.exit_code === 0 },
    { assertion_id: "S13_runtime_did_not_require_network", expected: false, actual: e.runtime_network_test?.network_required, passed: e.runtime_network_test?.network_required === false && e.runtime_network_test?.exit_code === 0 },
    { assertion_id: "S13_cleanup_succeeded", expected: "success", actual: e.cleanup?.result, passed: e.cleanup?.result === "success" },
    validateScenarioAssertions(e.scenario_assertions),
  );
  return completeGate(state.assertions, unique(state.missing));
}

export function validateS14Evidence(e = {}) {
  const state = { missing: [], assertions: [] };
  const probes = e.file_probes ?? {};
  if (!e.project_identity || !e.component_scope) state.missing.push("project_identity_or_component_scope_missing");
  mergeValidation(state, fileReferenceValidation(e.upstream_artifact, probes[e.upstream_artifact?.path], "S14_upstream_artifact"));
  const files = e.license_files ?? [];
  const kinds = new Set(files.map((file) => file.kind));
  if (!kinds.has("LICENSE")) state.missing.push("S14_LICENSE_missing");
  for (const kind of ["LICENSE", "COPYING", "NOTICE"]) {
    if (!kinds.has(kind) && !e.absent_legal_files?.some((item) => item.kind === kind && item.rationale)) state.missing.push(`S14_${kind}_status_missing`);
  }
  for (const [index, file] of files.entries()) {
    if (!["LICENSE", "COPYING", "NOTICE"].includes(file.kind)) state.missing.push(`S14_legal_kind_invalid:${index}`);
    mergeValidation(state, fileReferenceValidation(file, probes[file.path], `S14_legal_file_${file.kind ?? index}`));
    state.assertions.push({
      assertion_id: `S14_${file.kind ?? index}_upstream_lineage`,
      expected: { path: e.upstream_artifact?.path, sha256: e.upstream_artifact?.sha256 },
      actual: { path: file.upstream_artifact_path, sha256: file.upstream_artifact_sha256 },
      passed: file.upstream_artifact_path === e.upstream_artifact?.path && file.upstream_artifact_sha256 === e.upstream_artifact?.sha256,
    });
  }
  if (!e.spdx_expression && !e.manual_assessment?.text) state.missing.push("spdx_or_documented_manual_assessment_missing");
  if (!e.redistribution?.source_impact || e.redistribution.source_impact === "unknown") state.missing.push("source_redistribution_impact_missing");
  if (!e.redistribution?.binary_impact || e.redistribution.binary_impact === "unknown") state.missing.push("binary_redistribution_impact_missing");
  if (!Array.isArray(e.redistribution?.obligations) || !e.redistribution.obligations.length) state.missing.push("redistribution_obligations_missing");
  if (!e.reviewer || !isValidDateTime(e.reviewed_at)) state.missing.push("reviewer_or_valid_reviewed_at_missing");
  state.assertions.push(
    { assertion_id: "S14_license_files_filesystem_verified", expected: true, actual: files.length, passed: files.length > 0 && files.every((file) => fileReferenceValidation(file, probes[file.path], file.kind).valid) },
    { assertion_id: "S14_redistribution_assessment_complete", expected: true, actual: e.redistribution, passed: Boolean(e.redistribution?.source_impact && e.redistribution?.binary_impact && e.redistribution.source_impact !== "unknown" && e.redistribution.binary_impact !== "unknown" && e.redistribution.obligations?.length) },
    validateScenarioAssertions(e.scenario_assertions),
  );
  return completeGate(state.assertions, unique(state.missing));
}

export function validateScenarioEvidence(id, evidence = {}) {
  const validators = { S06: validateS06, S07: validateS07, S08: validateS08, S12: validateS12Evidence, S13: validateS13Evidence, S14: validateS14Evidence };
  return validators[id] ? { validator_id: `${id.toLowerCase()}-semantic-gate`, ...validators[id](evidence) } : { validator_id: `${id.toLowerCase()}-scenario-gate`, valid: false, missing_evidence: ["scenario_specific_validator_not_supplied"], assertions: [] };
}

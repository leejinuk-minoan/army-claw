import test from "node:test";
import assert from "node:assert/strict";
import { buildRoleMatrix } from "./benchmark/task003-common.mjs";
import { validateS06, validateS07, validateS08 } from "./benchmark/task003-preservation-validators.mjs";
import { validateS12Evidence, validateS13Evidence, validateS14Evidence } from "./benchmark/task003-complete-gates.mjs";
import { deriveStatusFromEvidence } from "./benchmark/task003-status-decision.mjs";

const H1 = "1".repeat(64), H2 = "2".repeat(64), H3 = "3".repeat(64), H4 = "4".repeat(64);
const assertion = { assertion_id: "target_changed", expected: true, actual: true, passed: true, evidence_path: "evidence/assertion.json" };
const command = { command: "run", executed: true, started_at: "2026-07-03T00:00:00Z", ended_at: "2026-07-03T00:00:01Z", exit_code: 0, stdout_path: "logs/out.log", stderr_path: "logs/err.log" };
function base() {
  const before_snapshot = { path: "snapshots/before.json", sha256: H1, size: 10 };
  const after_snapshot = { path: "snapshots/after.json", sha256: H2, size: 12 };
  const mutation_output = { path: "outputs/mutated.hwpx", sha256: H3, size: 20 };
  return { before_snapshot, after_snapshot, mutation_output, artifact_probe: {
    [before_snapshot.path]: { exists: true, sha256: H1, size: 10 }, [after_snapshot.path]: { exists: true, sha256: H2, size: 12 }, [mutation_output.path]: { exists: true, sha256: H3, size: 20 },
  }, allowed_target_diff: ["Contents/section0.xml"], scenario_assertions: [assertion] };
}
function s06() { return { ...base(), before: { merged_cell_map: { A1: "A1:B2" }, row_span_map: { A1: 2 }, col_span_map: { A1: 2 }, entry_hashes: { "Contents/section0.xml": H1, "BinData/a.png": H4 } }, after: { merged_cell_map: { A1: "A1:B2" }, row_span_map: { A1: 2 }, col_span_map: { A1: 2 }, entry_hashes: { "Contents/section0.xml": H2, "BinData/a.png": H4 } } }; }
function s07() { return { ...base(), before: { image_entries: [{ path: "BinData/a.png", size: 5, sha256: H4 }], bindata_entries: [{ path: "BinData/BIN0001.png", size: 5, sha256: H4 }], relationship_targets: ["BinData/BIN0001.png"], entry_hashes: { "Contents/section0.xml": H1, "BinData/BIN0001.png": H4 } }, after: { image_entries: [{ path: "BinData/a.png", size: 5, sha256: H4 }], bindata_entries: [{ path: "BinData/BIN0001.png", size: 5, sha256: H4 }], relationship_targets: ["BinData/BIN0001.png"], entry_hashes: { "Contents/section0.xml": H2, "BinData/BIN0001.png": H4 } } }; }
function s08() { return { ...base(), before: { fwspace_count: 1, fwspace_paths: ["/section/p[1]/fwSpace"], namespace_prefix_uri_map: { hp: "urn:hp" }, entry_hashes: { "Contents/section0.xml": H1, "BinData/a.png": H4 } }, after: { fwspace_count: 1, fwspace_paths: ["/section/p[1]/fwSpace"], namespace_prefix_uri_map: { hp: "urn:hp" }, entry_hashes: { "Contents/section0.xml": H2, "BinData/a.png": H4 } } }; }

test("role matrix is role-derived", () => { const matrix = buildRoleMatrix(); assert.equal(matrix.candidates.current_node_xml.scenarios.S09.applicable, false); assert.equal(matrix.candidates.hancom_com.scenarios.S09.applicable, true); });
test("S06-S08 positive fixtures pass", () => { assert.equal(validateS06(s06()).valid, true); assert.equal(validateS07(s07()).valid, true); assert.equal(validateS08(s08()).valid, true); });
test("S12 complete evidence passes", () => { const e = { warmup_runs: 1, measured_runs: 5, duration_samples_ms: [10,20,30,40,50], reported_median_ms: 30, reported_p95_ms: 50, measurement_boundary: { separate_process: true }, peak_rss_method: "os", peak_rss_samples_bytes: [1,2,3,4,5], artifact_inventory: [{ path: "a", sha256: H1, size: 10 }], artifact_total_size: 10, runtime_dependency_inventory: [{ path: "b", sha256: H2, size: 20 }], runtime_dependency_total_size: 20, measurement_command: command, raw_logs: { stdout_path: "logs/out", stderr_path: "logs/err" }, measurement_limitations: ["scheduler"], scenario_assertions: [assertion] }; assert.equal(validateS12Evidence(e).valid, true); });
test("S13 complete evidence passes", () => { const e = { clean_environment: { type: "temp", path_or_id: "tmp/task003", isolated: true }, pinned_offline_artifact_inventory: [{ path: "pkg", sha256: H1, size: 10 }], install_attempt: command, installed_inventory: [{ path: "installed" }], runtime_invocation: command, runtime_network_test: { method: "deny outbound", network_required: false, exit_code: 0 }, cleanup: { attempted: true, result: "success" }, scenario_assertions: [assertion] }; assert.equal(validateS13Evidence(e).valid, true); });
test("S14 complete evidence passes", () => { const e = { project_identity: "candidate@1", component_scope: "runtime", license_files: [{ kind: "LICENSE", path: "LICENSE", sha256: H1 }, { kind: "NOTICE", path: "NOTICE", sha256: H2 }], spdx_expression: "MIT", redistribution: { source_impact: "retain license", binary_impact: "include notice", obligations: ["include LICENSE"] }, reviewer: "local", reviewed_at: "2026-07-03T00:00:00Z", scenario_assertions: [assertion] }; assert.equal(validateS14Evidence(e).valid, true); });
test("passed status requires execution, lineage and validator", () => { const result = deriveStatusFromEvidence({ role: "editor", scenarioId: "S06", execution_record: { executed: true, method: "node", started_at: "a", ended_at: "b", exit_code: 0 }, imported_evidence: { source_path: "evidence.json", source_sha256: H1, hash_verified: true }, scenario_validator_result: { valid: true, missing_evidence: [] } }); assert.equal(result.status, "passed"); });

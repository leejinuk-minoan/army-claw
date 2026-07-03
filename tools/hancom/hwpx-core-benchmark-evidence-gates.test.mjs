import test from "node:test";
import assert from "node:assert/strict";
import { validateS12Evidence, validateS13Evidence, validateS14Evidence } from "./benchmark/hwpx-core-benchmark-003-evidence-integrity.mjs";
import { H1, H2, passedAssertions } from "./benchmark/task003-test-fixtures.mjs";

test("S12 recomputes median and p95", () => {
  const e = { warmup_runs: 1, measured_runs: 5, duration_samples_ms: [10,20,30,40,50], reported_median_ms: 30, reported_p95_ms: 50, measurement_boundary: { separate_process: true }, peak_rss_method: "rss", peak_rss_samples_bytes: [100,110,120,130,140], measurement_command: "benchmark", artifact_inventory: [{ path: "candidate.bin", size: 25, sha256: H1 }], artifact_total_size: 25, runtime_dependency_inventory: [{ path: "runtime.bin", size: 75, sha256: H2 }], runtime_dependency_total_size: 75, raw_logs: { stdout_path: "stdout.log", stderr_path: "stderr.log" }, measurement_limitations: ["resolution"], scenario_assertions: passedAssertions() };
  assert.equal(validateS12Evidence(e).valid, true);
  e.reported_p95_ms = 40;
  assert.equal(validateS12Evidence(e).valid, false);
});

test("S13 rejects missing attempted install record", () => {
  const e = { clean_environment: { type: "temp", path_or_id: "env", isolated: true }, pinned_offline_artifact_inventory: [{ path: "artifact.bin", sha256: H1, size: 10 }], installed_inventory: [{ path: "installed.bin", sha256: H2, size: 20 }], runtime_invocation: { command: "invoke", executed: true, started_at: "2026-07-03T00:00:00Z", ended_at: "2026-07-03T00:00:01Z", exit_code: 0, stdout_path: "out.log", stderr_path: "err.log" }, runtime_network_test: { method: "probe", network_required: false, exit_code: 0 }, cleanup: { attempted: true, result: "success" }, scenario_assertions: passedAssertions() };
  assert.match(validateS13Evidence(e).missing_evidence.join("\n"), /attempted_install_command/u);
});

test("S14 rejects missing LICENSE or COPYING", () => {
  const e = { project_identity: "candidate@1", component_scope: "benchmark", license_files: [{ kind: "NOTICE", path: "NOTICE", sha256: H1 }], spdx_expression: "MIT", redistribution: { source_impact: "notice", binary_impact: "notice", obligations: ["retain"] }, reviewer: "reviewer", reviewed_at: "2026-07-03T00:00:00Z", scenario_assertions: passedAssertions() };
  assert.match(validateS14Evidence(e).missing_evidence.join("\n"), /license_or_copying_file_missing/u);
});

import test from "node:test";
import assert from "node:assert/strict";
import { validateS12Evidence, validateS13Evidence, validateS14Evidence } from "./benchmark/task003-complete-gates.mjs";
import { createCommand, createFilesystemFixture } from "./benchmark/task003-test-fixtures.mjs";

const assertion = { assertion_id: "fixture", expected: true, actual: true, passed: true, evidence_path: "fixture.json" };
function expectInvalid(result, pattern) { assert.equal(result.valid, false); assert.match(result.missing_evidence.join("\n"), pattern); }

async function validS12() {
  const fs = await createFilesystemFixture();
  const artifact = await fs.file("candidate.bin", "candidate");
  const dependency = await fs.file("runtime.bin", "runtime");
  const command = await createCommand(fs, "measure");
  return { fs, evidence: { warmup_runs: 1, measured_runs: 5, duration_samples_ms: [10, 20, 30, 40, 50], reported_median_ms: 30, reported_p95_ms: 50, measurement_boundary: { separate_process: true }, peak_rss_method: { method: "sampler", limitations: ["interval"] }, peak_rss_samples_bytes: [1, 2, 3, 4, 5], artifact_inventory: [artifact], artifact_total_size: artifact.size, runtime_dependency_inventory: [dependency], runtime_dependency_total_size: dependency.size, measurement_command: command, raw_logs: { stdout: { path: command.stdout_path, size: command.stdout_probe.size, sha256: command.stdout_probe.sha256 }, stderr: { path: command.stderr_path, size: command.stderr_probe.size, sha256: command.stderr_probe.sha256 } }, file_probes: fs.probes, scenario_assertions: [assertion] } };
}
async function validS13() {
  const fs = await createFilesystemFixture();
  const offline = await fs.file("offline.pkg", "offline");
  const installed = await fs.file("installed.bin", "installed");
  const network = await fs.file("network.json", "network");
  const cleanup = await fs.file("cleanup.json", "cleanup");
  const install = await createCommand(fs, "install");
  const runtime = await createCommand(fs, "runtime");
  return { fs, installed, evidence: { clean_environment: { type: "temp", path_or_id: fs.root, isolated: true }, pinned_offline_artifact_inventory: [offline], install_attempt: install, installed_inventory: [installed], runtime_invocation: runtime, runtime_network_test: { method: "deny-outbound", network_required: false, exit_code: 0, evidence: network }, cleanup: { attempted: true, result: "success", evidence: cleanup }, file_probes: fs.probes, scenario_assertions: [assertion] } };
}
async function validS14() {
  const fs = await createFilesystemFixture();
  const upstream = await fs.file("upstream.pkg", "upstream");
  const license = await fs.file("LICENSE", "license");
  const copying = await fs.file("COPYING", "copying");
  const notice = await fs.file("NOTICE", "notice");
  const lineage = { upstream_artifact_path: upstream.path, upstream_artifact_sha256: upstream.sha256 };
  return { fs, evidence: { project_identity: "candidate@1", component_scope: "runtime", upstream_artifact: upstream, license_files: [{ kind: "LICENSE", ...license, ...lineage }, { kind: "COPYING", ...copying, ...lineage }, { kind: "NOTICE", ...notice, ...lineage }], spdx_expression: "MIT", redistribution: { source_impact: "retain text", binary_impact: "include notice", obligations: ["include LICENSE", "include COPYING", "include NOTICE"] }, reviewer: "reviewer", reviewed_at: "2026-07-03T00:00:00Z", file_probes: fs.probes, scenario_assertions: [assertion] } };
}

test("S12 artifact filesystem SHA mismatch is RED", async () => { const { evidence } = await validS12(); evidence.artifact_inventory[0].sha256 = "0".repeat(64); expectInvalid(validateS12Evidence(evidence), /sha256_matches_probe/u); });
test("S12 missing stdout file probe is RED", async () => { const { evidence } = await validS12(); delete evidence.file_probes[evidence.raw_logs.stdout.path]; expectInvalid(validateS12Evidence(evidence), /stdout/u); });
test("S12 missing stderr file probe is RED", async () => { const { evidence } = await validS12(); delete evidence.file_probes[evidence.raw_logs.stderr.path]; expectInvalid(validateS12Evidence(evidence), /stderr/u); });

test("S13 attempted command field omission is RED", async () => { const { evidence } = await validS13(); delete evidence.install_attempt.method; expectInvalid(validateS13Evidence(evidence), /execution_method_present/u); });
test("S13 installed inventory file omission is RED", async () => { const { evidence, installed } = await validS13(); delete evidence.file_probes[installed.path]; expectInvalid(validateS13Evidence(evidence), /installed_inventory/u); });

test("S14 LICENSE absence is RED", async () => { const { evidence } = await validS14(); evidence.license_files = evidence.license_files.filter((file) => file.kind !== "LICENSE"); expectInvalid(validateS14Evidence(evidence), /LICENSE_missing/u); });
test("S14 LICENSE hash mismatch is RED", async () => { const { evidence } = await validS14(); evidence.license_files.find((file) => file.kind === "LICENSE").sha256 = "0".repeat(64); expectInvalid(validateS14Evidence(evidence), /sha256_matches_probe/u); });

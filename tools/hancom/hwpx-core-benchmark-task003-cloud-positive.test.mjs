import test from "node:test";
import assert from "node:assert/strict";
import { buildRoleMatrix } from "./benchmark/task003-common.mjs";
import { validateS06, validateS07, validateS08 } from "./benchmark/task003-preservation-validators.mjs";
import { validateS12Evidence, validateS13Evidence, validateS14Evidence } from "./benchmark/task003-complete-gates.mjs";
import { deriveStatusFromEvidence } from "./benchmark/task003-status-decision.mjs";
import { createCommand, createFilesystemFixture, createPreservationFixture, TEST_HASHES, validRelationship } from "./benchmark/task003-test-fixtures.mjs";

function s06(base) {
  return {
    ...base,
    before: { merged_cell_map: { A1: "A1:B2" }, row_span_map: { A1: 2 }, col_span_map: { A1: 2 }, entry_hashes: { "Contents/section0.xml": TEST_HASHES.sectionBefore, "BinData/a.png": TEST_HASHES.preserved } },
    after: { merged_cell_map: { A1: "A1:B2" }, row_span_map: { A1: 2 }, col_span_map: { A1: 2 }, entry_hashes: { "Contents/section0.xml": TEST_HASHES.sectionAfter, "BinData/a.png": TEST_HASHES.preserved } },
  };
}
function s07(base) {
  const image = { path: "BinData/a.png", size: 5, sha256: TEST_HASHES.preserved };
  const bin = { path: "BinData/BIN0001.png", size: 6, sha256: TEST_HASHES.preserved };
  return {
    ...base,
    before: { image_entries: [image], bindata_entries: [bin], relationships: [validRelationship()], entry_hashes: { "Contents/section0.xml": TEST_HASHES.sectionBefore, "BinData/BIN0001.png": TEST_HASHES.preserved } },
    after: { image_entries: [image], bindata_entries: [bin], relationships: [validRelationship()], entry_hashes: { "Contents/section0.xml": TEST_HASHES.sectionAfter, "BinData/BIN0001.png": TEST_HASHES.preserved } },
  };
}
function s08(base) {
  const root = { hp: "urn:hancom:hp", hs: "urn:hancom:hs" };
  const sections = [{ section_path: "Contents/section0.xml", declarations: root }];
  const paths = ["/section/p[1]/fwSpace", "/section/p[2]/fwSpace"];
  return {
    ...base,
    before: { root_namespace_declarations: root, section_namespace_declarations: sections, namespace_prefix_uri_map: root, fwspace_count: 2, fwspace_paths: paths, fwspace_document_order: paths, entry_hashes: { "Contents/section0.xml": TEST_HASHES.sectionBefore, "BinData/a.png": TEST_HASHES.preserved } },
    after: { root_namespace_declarations: root, section_namespace_declarations: sections, namespace_prefix_uri_map: root, fwspace_count: 2, fwspace_paths: paths, fwspace_document_order: paths, entry_hashes: { "Contents/section0.xml": TEST_HASHES.sectionAfter, "BinData/a.png": TEST_HASHES.preserved } },
  };
}

test("role matrix remains role-derived", () => {
  const matrix = buildRoleMatrix();
  assert.equal(matrix.candidates.current_node_xml.scenarios.S09.applicable, false);
  assert.equal(matrix.candidates.hancom_com.scenarios.S09.applicable, true);
});

test("S06-S08 accept filesystem-backed HWPX and snapshot lineage", async () => {
  const fixture = await createPreservationFixture();
  assert.equal(validateS06(s06(fixture.evidence)).valid, true);
  assert.equal(validateS07(s07(fixture.evidence)).valid, true);
  assert.equal(validateS08(s08(fixture.evidence)).valid, true);
});

test("S12 accepts only probed logs, artifacts and dependencies", async () => {
  const fs = await createFilesystemFixture();
  const artifact = await fs.file("candidate.bin", "candidate");
  const dependency = await fs.file("runtime.bin", "runtime");
  const command = await createCommand(fs, "measure");
  const evidence = {
    warmup_runs: 1,
    measured_runs: 5,
    duration_samples_ms: [10, 20, 30, 40, 50],
    reported_median_ms: 30,
    reported_p95_ms: 50,
    measurement_boundary: { separate_process: true },
    peak_rss_method: { method: "process-sampler", limitations: ["sampling interval"] },
    peak_rss_samples_bytes: [100, 110, 120, 130, 140],
    artifact_inventory: [artifact],
    artifact_total_size: artifact.size,
    runtime_dependency_inventory: [dependency],
    runtime_dependency_total_size: dependency.size,
    measurement_command: command,
    raw_logs: { stdout: { path: command.stdout_path, size: command.stdout_probe.size, sha256: command.stdout_probe.sha256 }, stderr: { path: command.stderr_path, size: command.stderr_probe.size, sha256: command.stderr_probe.sha256 } },
    file_probes: fs.probes,
    scenario_assertions: [{ assertion_id: "measurement_complete", expected: true, actual: true, passed: true, evidence_path: "measurement.json" }],
  };
  assert.equal(validateS12Evidence(evidence).valid, true);
});

test("S13 verifies actual offline, installed, network and cleanup files", async () => {
  const fs = await createFilesystemFixture();
  const offline = await fs.file("offline.pkg", "offline-package");
  const installed = await fs.file("installed.bin", "installed-runtime");
  const network = await fs.file("network.json", "no-network-required");
  const cleanup = await fs.file("cleanup.json", "success");
  const install = await createCommand(fs, "install");
  const runtime = await createCommand(fs, "runtime");
  const evidence = {
    clean_environment: { type: "temporary-directory", path_or_id: fs.root, isolated: true },
    pinned_offline_artifact_inventory: [offline],
    install_attempt: install,
    installed_inventory: [installed],
    runtime_invocation: runtime,
    runtime_network_test: { method: "deny-outbound-and-invoke", network_required: false, exit_code: 0, evidence: network },
    cleanup: { attempted: true, result: "success", evidence: cleanup },
    file_probes: fs.probes,
    scenario_assertions: [{ assertion_id: "offline_replay_complete", expected: true, actual: true, passed: true, evidence_path: "offline.json" }],
  };
  assert.equal(validateS13Evidence(evidence).valid, true);
});

test("S14 verifies actual legal files and upstream lineage", async () => {
  const fs = await createFilesystemFixture();
  const upstream = await fs.file("upstream.pkg", "upstream-artifact");
  const license = await fs.file("LICENSE", "license-text");
  const notice = await fs.file("NOTICE", "notice-text");
  const lineage = { upstream_artifact_path: upstream.path, upstream_artifact_sha256: upstream.sha256 };
  const evidence = {
    project_identity: "candidate@1.0.0",
    component_scope: "runtime",
    upstream_artifact: upstream,
    license_files: [{ kind: "LICENSE", ...license, ...lineage }, { kind: "NOTICE", ...notice, ...lineage }],
    absent_legal_files: [{ kind: "COPYING", rationale: "upstream artifact does not publish a separate COPYING file" }],
    spdx_expression: "MIT",
    redistribution: { source_impact: "retain license text", binary_impact: "include notice", obligations: ["include LICENSE", "include NOTICE"] },
    reviewer: "local-reviewer",
    reviewed_at: "2026-07-03T00:00:00Z",
    file_probes: fs.probes,
    scenario_assertions: [{ assertion_id: "legal_review_complete", expected: true, actual: true, passed: true, evidence_path: "legal-review.json" }],
  };
  assert.equal(validateS14Evidence(evidence).valid, true);
});

test("passed status requires valid execution logs and imported filesystem lineage", async () => {
  const fs = await createFilesystemFixture();
  const imported = await fs.file("evidence.json", "evidence");
  const execution = await createCommand(fs, "scenario");
  const result = deriveStatusFromEvidence({
    role: "editor",
    scenarioId: "S06",
    execution_record: execution,
    imported_evidence: { source_path: imported.path, source_sha256: imported.sha256, hash_verified: true, source_probe: fs.probes[imported.path] },
    scenario_validator_result: { valid: true, missing_evidence: [] },
  });
  assert.equal(result.status, "passed");
});

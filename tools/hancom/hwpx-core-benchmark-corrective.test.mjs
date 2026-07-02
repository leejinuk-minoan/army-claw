import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { HWP_CORE_METHODS, HwpCoreAdapter } from "./adapters/hwp-core-adapter-contract.mjs";
import { CurrentNodeXmlAdapter } from "./adapters/current-node-xml-adapter.mjs";
import * as benchmark from "./benchmark/hwpx-core-benchmark.mjs";

const workspace = process.cwd();

test("corrective benchmark rejects static status lookup and copy-only success paths", async () => {
  const source = await readFile(join(workspace, "tools/hancom/benchmark/hwpx-core-benchmark.mjs"), "utf8");

  assert.doesNotMatch(source, /scenarioStatusForCandidate/u);
  assert.doesNotMatch(source, /copyFile\([^)]*candidate-output\.hwpx/su);
});

test("CurrentNodeXmlAdapter overrides common contract methods instead of advertising metadata only", () => {
  const adapter = new CurrentNodeXmlAdapter();

  for (const method of HWP_CORE_METHODS) {
    assert.notEqual(
      adapter[method],
      HwpCoreAdapter.prototype[method],
      `${method} must be implemented by CurrentNodeXmlAdapter`,
    );
  }
});

test("passed adapter execution requires call trace, assertions, artifacts, and hash evidence", () => {
  assert.throws(
    () => benchmark.validateAdapterExecution({
      candidate_id: "current_node_xml",
      method: "replaceText",
      status: "passed",
      started_at: "2026-07-02T00:00:00.000Z",
      ended_at: "2026-07-02T00:00:01.000Z",
      duration_ms: 1000,
      input: { path: "input.hwpx", sha256: "a".repeat(64) },
      output: { path: "output.hwpx" },
      assertions: [],
      artifacts: [],
      trace: [],
      errors: [],
    }),
    /adapter_trace_required|passed_assertions_required|artifact_sha256_required/u,
  );
});

test("corrective invariants reject S01 copy-only pass and S02 without replacement diff", () => {
  const copiedHash = "b".repeat(64);
  assert.throws(
    () => benchmark.enforceCorrectiveBenchmarkInvariants([
      {
        candidate_id: "current_node_xml",
        scenario_id: "S01",
        status: "passed",
        adapter_execution: { method: "savePackage", trace: [{ type: "fs.copyFile" }] },
        input_sha256: copiedHash,
        output_sha256: copiedHash,
        assertions: [{ id: "noop", passed: true }],
        evidence: { open_save_api: "copyFile" },
      },
    ]),
    /s01_copy_only_success_forbidden/u,
  );

  assert.throws(
    () => benchmark.enforceCorrectiveBenchmarkInvariants([
      {
        candidate_id: "current_node_xml",
        scenario_id: "S02",
        status: "passed",
        adapter_execution: { method: "replaceText", trace: [{ type: "in_process_call" }] },
        input_sha256: "c".repeat(64),
        output_sha256: "d".repeat(64),
        assertions: [{ id: "replacement", passed: true }],
        evidence: {},
      },
    ]),
    /s02_replacement_diff_required/u,
  );
});

test("corrective invariants reject missing S03/S04 discovery, S05 height, and S12 samples", () => {
  assert.throws(
    () => benchmark.enforceCorrectiveBenchmarkInvariants([
      {
        candidate_id: "current_node_xml",
        scenario_id: "S03",
        status: "passed",
        adapter_execution: { method: "findTables", trace: [{ type: "in_process_call" }] },
        assertions: [{ id: "nested", passed: true }],
        evidence: { match_count: 1 },
      },
    ]),
    /discovery_path_and_count_required/u,
  );

  assert.throws(
    () => benchmark.enforceCorrectiveBenchmarkInvariants([
      {
        candidate_id: "current_node_xml",
        scenario_id: "S05",
        status: "passed",
        adapter_execution: { method: "setTableHeight", trace: [{ type: "in_process_call" }] },
        assertions: [{ id: "height", passed: true }],
        evidence: { selector: { board: "support-2", structure: "first 1x1 table" }, before_height: 1000, after_height: 500 },
      },
    ]),
    /s05_second_one_by_one_selector_required/u,
  );

  assert.throws(
    () => benchmark.enforceCorrectiveBenchmarkInvariants([
      {
        candidate_id: "current_node_xml",
        scenario_id: "S12",
        status: "passed",
        adapter_execution: { method: "analyzeDocument", trace: [{ type: "in_process_call" }] },
        assertions: [{ id: "perf", passed: true }],
        evidence: { duration_samples_ms: [1, 2, 3, 4] },
      },
    ]),
    /s12_raw_samples_required/u,
  );
});

test("blocked external candidate execution requires attempted commands and checked evidence", () => {
  assert.throws(
    () => benchmark.validateAdapterExecution({
      candidate_id: "python_hwpx",
      method: "openPackage",
      status: "blocked",
      started_at: "2026-07-02T00:00:00.000Z",
      ended_at: "2026-07-02T00:00:01.000Z",
      duration_ms: 1000,
      input: { path: "input.hwpx", sha256: "a".repeat(64) },
      output: { reason: "missing package" },
      assertions: [{ id: "blocked", expected: "runtime", actual: "missing", passed: false }],
      artifacts: [],
      trace: [{ type: "blocked_prerequisite" }],
      errors: ["missing package"],
    }),
    /blocked_attempted_command_required|blocked_checked_paths_required|blocked_evidence_log_required/u,
  );
});

test("corrective scorecard is category evidence based, not passed-count multiplied by five", () => {
  assert.equal(typeof benchmark.buildEvidenceScorecard, "function");
  const scorecard = benchmark.buildEvidenceScorecard({
    currentNodeXmlResults: [],
    pythonHwpxResults: [],
    hwpxlibResults: [],
    hwpforgeResults: [],
  });

  assert.equal(scorecard.scoring_weights.functional_fit, 30);
  assert.ok(scorecard.editing_core_scorecard.current_node_xml.categories.functional_fit);
  assert.doesNotMatch(JSON.stringify(scorecard), /passed\s*\*\s*5|passedCount\s*\*\s*5/u);
});

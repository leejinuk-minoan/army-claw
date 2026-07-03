import test from "node:test";
import assert from "node:assert/strict";
import { calculateEvidenceRubricScorecard, calculateInvalidPassCount } from "./benchmark/task003-score-integrity.mjs";
import { CANONICAL_SCHEMA_PATHS, classifyJson, evaluateInventoryRecords } from "./benchmark/task003-json-inventory.mjs";
import { compareTaskManifests, validateCrossArtifactConsistency } from "./benchmark/task003-manifest-integrity.mjs";
import { deriveStatusFromEvidence } from "./benchmark/task003-status-decision.mjs";

const H1 = "1".repeat(64);
const H2 = "2".repeat(64);

test("invalid-pass injection is counted and cannot inflate score", () => {
  const results = [
    { status: "passed", validator_results: [{ valid: true }] },
    { status: "passed", validator_results: [{ valid: false }] },
    { status: "passed", validator_results: [] },
  ];
  assert.equal(calculateInvalidPassCount(results), 2);
  const score = calculateEvidenceRubricScorecard([{ candidate_id: "current_node_xml", scenario_id: "S06", status: "passed", validator_results: [{ valid: false }] }]);
  assert.equal(score.invalid_pass_count, 1);
  assert.equal(score.editor_gate.current_node_xml.categories.functional_fit.rubric_items.find((item) => item.rubric_id === "S06").awarded, 0);
});

test("status generation is refused when execution inspection and prerequisite probe are absent", () => {
  assert.throws(() => deriveStatusFromEvidence({ role: "editor", scenarioId: "S01" }), /status_evidence_insufficient/u);
});

test("malformed execution date-time and missing log probes are rejected", () => {
  assert.throws(() => deriveStatusFromEvidence({
    role: "editor",
    scenarioId: "S06",
    execution_record: { command: "run", executed: true, method: "node", started_at: "a", ended_at: "b", exit_code: 0, stdout_path: "out", stderr_path: "err" },
  }), /execution_record_invalid/u);
});

test("blocked requires actual prerequisite probe, reason and missing prerequisites", () => {
  assert.throws(() => deriveStatusFromEvidence({ role: "editor", scenarioId: "S06", prerequisite_probe: { performed: true, available: false } }), /status_evidence_insufficient/u);
  const result = deriveStatusFromEvidence({
    role: "editor",
    scenarioId: "S06",
    prerequisite_probe: {
      performed: true,
      available: false,
      method: "filesystem-stat",
      probe_evidence_path: "probes/prerequisites.json",
      probe_evidence_sha256: H1,
      checked_path_results: [{ path: "runtime", exists: false, size: null, sha256: null }],
      blocked_reason_code: "runtime_missing",
      missing_prerequisites: ["runtime"],
    },
  });
  assert.equal(result.status, "blocked");
  assert.equal(result.blocked_reason_code, "runtime_missing");
});

test("schemas-v2 missing Schema is detected", () => {
  const records = CANONICAL_SCHEMA_PATHS.slice(1).map((path) => ({ path, ...classifyJson(path), document: {}, sha256: H1, size: 1 }));
  const inventory = evaluateInventoryRecords({ records, validationStartedAtMs: 20, lastWriteCompletedAtMs: 10 });
  assert.equal(inventory.valid, false);
  assert.deepEqual(inventory.missing_json, [CANONICAL_SCHEMA_PATHS[0]]);
});

test("unclassified canonical Schema is detected", () => {
  const records = CANONICAL_SCHEMA_PATHS.map((path) => ({ path, ...classifyJson(path), document: {}, sha256: H1, size: 1 }));
  records.push({ path: "schemas-v2/unknown.schema.json", ...classifyJson("schemas-v2/unknown.schema.json"), document: {}, sha256: H1, size: 1 });
  const inventory = evaluateInventoryRecords({ records, validationStartedAtMs: 20, lastWriteCompletedAtMs: 10 });
  assert.equal(inventory.valid, false);
  assert.deepEqual(inventory.unclassified_json, ["schemas-v2/unknown.schema.json"]);
});

test("duplicate JSON and validation-before-write are detected", () => {
  const records = CANONICAL_SCHEMA_PATHS.map((path) => ({ path, ...classifyJson(path), document: {}, sha256: H1, size: 1 }));
  records.push({ ...records[0], path: records[0].path.toUpperCase() });
  const inventory = evaluateInventoryRecords({ records, validationStartedAtMs: 10, lastWriteCompletedAtMs: 20 });
  assert.equal(inventory.valid, false);
  assert.equal(inventory.duplicate_json.length, 2);
  assert.equal(inventory.validation_order_valid, false);
});

test("incorrect Schema mapping is detected", () => {
  const records = CANONICAL_SCHEMA_PATHS.map((path) => ({ path, ...classifyJson(path), document: {}, sha256: H1, size: 1 }));
  records[0].schema_path = "benchmark-result.schema.json";
  const inventory = evaluateInventoryRecords({ records, validationStartedAtMs: 20, lastWriteCompletedAtMs: 10 });
  assert.equal(inventory.valid, false);
  assert.deepEqual(inventory.schema_mapping_errors, [records[0].path]);
});

test("task manifests reject unexpected changes", () => {
  const start = { records: [{ path: "protected.json", exists: true, sha256: H1, size: 1 }] };
  const end = { records: [{ path: "protected.json", exists: true, sha256: H2, size: 1 }] };
  const result = compareTaskManifests(start, end, []);
  assert.equal(result.valid, false);
  assert.equal(result.unexpected_diffs.length, 1);
});

test("report test and handoff SHA mismatches are rejected", () => {
  const result = validateCrossArtifactConsistency({
    report: { tests: { passed: 2, failed: 0 }, tested_implementation_commit_sha: H1, self_sha256: H1, test_summary_sha256: H1, handoff_sha256: H1, completion_gate_passed: false },
    testSummary: { totals: { passed: 1, failed: 1 }, tested_implementation_commit_sha: H2, self_sha256: H2 },
    handoff: { tested_implementation_commit_sha: H2, self_sha256: H2, report_sha256: H2, completion_gate_passed: true },
  });
  assert.equal(result.valid, false);
  assert.ok(result.assertions.filter((assertion) => !assertion.passed).length >= 6);
});

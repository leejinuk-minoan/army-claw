import test from "node:test";
import assert from "node:assert/strict";
import { calculateEvidenceRubricScorecard, calculateInvalidPassCount } from "./benchmark/task003-score-integrity.mjs";
import { evaluateInventoryRecords } from "./benchmark/task003-json-inventory.mjs";
import { compareTaskManifests, validateCrossArtifactConsistency } from "./benchmark/task003-manifest-integrity.mjs";
import { deriveStatusFromEvidence } from "./benchmark/task003-status-decision.mjs";
import { validateS12Evidence, validateS13Evidence, validateS14Evidence } from "./benchmark/task003-complete-gates.mjs";

const H1 = "1".repeat(64), H2 = "2".repeat(64);

test("invalid-pass injection is counted", () => {
  const results = [
    { status: "passed", validator_results: [{ valid: true }] },
    { status: "passed", validator_results: [{ valid: false }] },
    { status: "passed", validator_results: [] },
  ];
  assert.equal(calculateInvalidPassCount(results), 2);
});

test("score cannot inflate without true validator", () => {
  const score = calculateEvidenceRubricScorecard([{ candidate_id: "current_node_xml", scenario_id: "S06", status: "passed", validator_results: [{ valid: false }] }]);
  assert.equal(score.invalid_pass_count, 1);
  assert.equal(score.editor_gate.current_node_xml.categories.functional_fit.rubric_items.find((item) => item.rubric_id === "S06").awarded, 0);
});

test("status does not inherit a prior candidate/scenario value", () => {
  const result = deriveStatusFromEvidence({ role: "editor", scenarioId: "S01" });
  assert.equal(result.status, "blocked");
  assert.match(result.missing_evidence.join("\n"), /actual_execution_record_missing/u);
});

test("S12-S14 incomplete evidence remains invalid", () => {
  assert.equal(validateS12Evidence({}).valid, false);
  assert.equal(validateS13Evidence({}).valid, false);
  assert.equal(validateS14Evidence({}).valid, false);
});

test("filesystem inventory rejects missing, duplicate, unclassified and early validation", () => {
  const inventory = evaluateInventoryRecords({
    records: [{ path: "summary/a.json", schema_path: null }, { path: "SUMMARY/A.JSON", schema_path: "benchmark-summary.schema.json" }],
    expectedPaths: ["summary/required.json"], validationStartedAtMs: 10, lastWriteCompletedAtMs: 20,
  });
  assert.equal(inventory.valid, false);
  assert.equal(inventory.missing_json.length, 1);
  assert.equal(inventory.duplicate_json.length, 2);
  assert.equal(inventory.unclassified_json.length, 1);
  assert.equal(inventory.validation_order_valid, false);
});

test("task manifests reject unexpected changes", () => {
  const start = { records: [{ path: "protected.json", exists: true, sha256: H1, size: 1 }] };
  const end = { records: [{ path: "protected.json", exists: true, sha256: H2, size: 1 }] };
  const result = compareTaskManifests(start, end, []);
  assert.equal(result.valid, false);
  assert.equal(result.unexpected_diffs.length, 1);
});

test("cross-artifact mismatches are rejected", () => {
  const result = validateCrossArtifactConsistency({ report: { tests: { passed: 2, failed: 0 }, tested_implementation_commit_sha: H1, completion_gate_passed: false }, testSummary: { totals: { passed: 1, failed: 1 } }, handoff: { tested_implementation_commit_sha: H2, completion_gate_passed: true } });
  assert.equal(result.valid, false);
  assert.equal(result.assertions.filter((assertion) => !assertion.passed).length, 3);
});

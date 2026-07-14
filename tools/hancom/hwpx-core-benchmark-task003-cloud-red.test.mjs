import test from "node:test";
import assert from "node:assert/strict";
import { calculateEvidenceRubricScorecard, calculateInvalidPassCount, validatePassedResultEligibility } from "./benchmark/task003-score-integrity.mjs";
import { CANONICAL_SCHEMA_PATHS, classifyJson, evaluateInventoryRecords } from "./benchmark/task003-json-inventory.mjs";
import { compareTaskManifests, validateCrossArtifactConsistency } from "./benchmark/task003-manifest-integrity.mjs";
import { deriveStatusFromEvidence } from "./benchmark/task003-status-decision.mjs";
import { createEligiblePassedResult } from "./benchmark/task003-test-fixtures.mjs";

const H1 = "1".repeat(64);
const H2 = "2".repeat(64);
const G1 = "a".repeat(40);
const G2 = "b".repeat(40);
const clone = (value) => structuredClone(value);

function crossArtifacts(commit, overrides = {}) {
  return {
    report: { tests: { passed: 2, failed: 0 }, tested_implementation_commit_sha: commit, self_sha256: H1, test_summary_sha256: H1, handoff_sha256: H1, completion_gate_passed: false },
    testSummary: { totals: { passed: 2, failed: 0 }, tested_implementation_commit_sha: commit, self_sha256: H1 },
    handoff: { tested_implementation_commit_sha: commit, self_sha256: H1, report_sha256: H1, completion_gate_passed: false },
    ...overrides,
  };
}

function assertRejected(result, context, pattern) {
  const eligibility = validatePassedResultEligibility(result, context);
  assert.equal(eligibility.eligible, false);
  assert.match(eligibility.failure_reasons.join("\n"), pattern);
  const contexts = { [`${result.candidate_id}:${result.scenario_id}`]: context };
  assert.equal(calculateInvalidPassCount([result], contexts), 1);
  const score = calculateEvidenceRubricScorecard([result], {}, contexts);
  const rubric = score.editor_gate.current_node_xml.categories.functional_fit.rubric_items.find((entry) => entry.rubric_id === "current_node_xml-S06");
  assert.equal(rubric.awarded, 0);
  assert.equal(rubric.state, "rejected");
  assert.match(rubric.failure_reasons.join("\n"), pattern);
}

test("39-character Git SHA is rejected", () => {
  assert.equal(validateCrossArtifactConsistency(crossArtifacts("a".repeat(39))).valid, false);
});

test("41-character Git SHA is rejected", () => {
  assert.equal(validateCrossArtifactConsistency(crossArtifacts("a".repeat(41))).valid, false);
});

test("non-hex Git SHA is rejected", () => {
  assert.equal(validateCrossArtifactConsistency(crossArtifacts(`${"a".repeat(39)}z`)).valid, false);
});

test("different valid 40-character Git SHAs are rejected", () => {
  const artifacts = crossArtifacts(G1);
  artifacts.testSummary.tested_implementation_commit_sha = G2;
  assert.equal(validateCrossArtifactConsistency(artifacts).valid, false);
});

test("40-character Git SHA in a file SHA256 field is rejected", () => {
  const artifacts = crossArtifacts(G1);
  artifacts.report.self_sha256 = G1;
  artifacts.handoff.report_sha256 = G1;
  const result = validateCrossArtifactConsistency(artifacts);
  assert.equal(result.valid, false);
  assert.equal(result.assertions.find((entry) => entry.assertion_id === "handoff_report_sha_link").passed, false);
});

test("validator true plus missing execution is invalid and scores zero", async () => {
  const fixture = await createEligiblePassedResult();
  fixture.result.attempted_commands = [];
  assertRejected(fixture.result, fixture.context, /execution|attempted_commands/u);
});

test("validator true plus nonzero exit code is invalid and scores zero", async () => {
  const fixture = await createEligiblePassedResult();
  fixture.result.attempted_commands[0].exit_code = 7;
  assertRejected(fixture.result, fixture.context, /exit_code|passed_execution/u);
});

test("validator true plus invalid canonical Schema result is invalid and scores zero", async () => {
  const fixture = await createEligiblePassedResult();
  fixture.context.schema_validation_result = { valid: false, errors: ["schema failure"] };
  assertRejected(fixture.result, fixture.context, /canonical_schema_validation_not_valid/u);
});

test("validator true plus missing imported evidence is invalid and scores zero", async () => {
  const fixture = await createEligiblePassedResult();
  fixture.result.imported_evidence = null;
  fixture.context.required_filesystem_evidence_complete = false;
  assertRejected(fixture.result, fixture.context, /imported|contract/u);
});

test("validator true plus missing stdout stderr probes is invalid and scores zero", async () => {
  const fixture = await createEligiblePassedResult();
  delete fixture.result.attempted_commands[0].stdout_probe;
  delete fixture.result.attempted_commands[0].stderr_probe;
  assertRejected(fixture.result, fixture.context, /stdout|stderr|passed_execution/u);
});

test("validator true plus result missing evidence is invalid and scores zero", async () => {
  const fixture = await createEligiblePassedResult();
  fixture.result.missing_evidence = ["required artifact missing"];
  assertRejected(fixture.result, fixture.context, /missing_evidence/u);
});

test("validator true plus incomplete evidence is invalid and scores zero", async () => {
  const fixture = await createEligiblePassedResult();
  fixture.result.evidence_completeness = "partial";
  assertRejected(fixture.result, fixture.context, /evidence.*complete/u);
});

test("validator true plus failed scenario Gate is invalid and scores zero", async () => {
  const fixture = await createEligiblePassedResult();
  fixture.context.scenario_gate_result = { valid: false, missing_evidence: ["semantic mismatch"] };
  assertRejected(fixture.result, fixture.context, /scenario_gate/u);
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
  const artifacts = crossArtifacts(G1);
  artifacts.report.tests.passed = 2;
  artifacts.testSummary.totals = { passed: 1, failed: 1 };
  artifacts.testSummary.tested_implementation_commit_sha = G2;
  artifacts.handoff.tested_implementation_commit_sha = G2;
  artifacts.testSummary.self_sha256 = H2;
  artifacts.handoff.self_sha256 = H2;
  artifacts.handoff.report_sha256 = H2;
  artifacts.handoff.completion_gate_passed = true;
  const result = validateCrossArtifactConsistency(artifacts);
  assert.equal(result.valid, false);
  assert.ok(result.assertions.filter((assertion) => !assertion.passed).length >= 6);
});

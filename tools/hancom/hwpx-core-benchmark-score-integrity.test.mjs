import test from "node:test";
import assert from "node:assert/strict";
import { buildSchemas, calculateEvidenceRubricScorecard, calculateInvalidPassCount, compareTaskManifests, validateCrossArtifactConsistency } from "./benchmark/hwpx-core-benchmark-003-evidence-integrity.mjs";
import { H1, H2 } from "./benchmark/task003-test-fixtures.mjs";

test("invalid passed result increments count", () => {
  const results = [{ status: "passed", validator_results: [{ valid: true }] }];
  assert.equal(calculateInvalidPassCount(results), 0);
  results.push({ status: "passed", validator_results: [{ valid: false }] });
  assert.equal(calculateInvalidPassCount(results), 1);
});
test("score without validator remains pending", () => {
  const api = calculateEvidenceRubricScorecard([], {}).editor_gate.current_node_xml.categories.api_extensibility;
  assert.equal(api.measured_points, 0); assert.equal(api.pending_points, 15);
});
test("task manifests detect unexpected mismatch", () => {
  const x = compareTaskManifests({ records: [{ path: "a", sha256: H1 }] }, { records: [{ path: "a", sha256: H2 }] }, []);
  assert.equal(x.valid, false);
});
test("report test and handoff mismatch is detected", () => {
  const x = validateCrossArtifactConsistency({ report: { tests: { passed: 10, failed: 0 }, tested_implementation_commit_sha: H1, completion_gate_passed: false }, testSummary: { totals: { passed: 9, failed: 1 } }, handoff: { tested_implementation_commit_sha: H2, completion_gate_passed: true } });
  assert.equal(x.valid, false); assert.equal(x.assertions.filter((a) => !a.passed).length, 3);
});
test("five schemas are strict and conditional", () => {
  const schemas = buildSchemas(); assert.equal(Object.keys(schemas).length, 5);
  for (const schema of Object.values(schemas)) assert.equal(schema.additionalProperties, false);
  assert.ok(schemas["benchmark-result.schema.json"].allOf.length >= 3);
});

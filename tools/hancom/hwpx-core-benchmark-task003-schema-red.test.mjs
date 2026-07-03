import test from "node:test";
import assert from "node:assert/strict";
import { validateBenchmarkResultContract, validateSchemaDocumentShape } from "./benchmark/task003-schema-preflight.mjs";
import { validateTestSummaryCompletionContract } from "./benchmark/task003-completion-preflight.mjs";

const baseResult = (status) => ({
  task_id: "hwpx-core-benchmark-003-evidence-integrity",
  candidate_id: "candidate",
  candidate_role: "editor",
  scenario_id: "S06",
  status,
  status_reason: "fixture",
  evidence_completeness: "partial",
  missing_evidence: [],
  planned_commands: [],
  attempted_commands: [],
  validator_results: [],
});

test("passed condition violation is RED", () => {
  const result = validateBenchmarkResultContract(baseResult("passed"));
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /passed_/u);
});

test("blocked condition violation is RED", () => {
  const result = validateBenchmarkResultContract(baseResult("blocked"));
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /blocked_/u);
});

test("unsupported condition violation is RED", () => {
  const result = validateBenchmarkResultContract(baseResult("unsupported"));
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /unsupported_/u);
});

test("not_applicable condition violation is RED", () => {
  const result = validateBenchmarkResultContract(baseResult("not_applicable"));
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /not_applicable_/u);
});

test("malformed Schema and meta-schema marker fixture is RED", () => {
  const malformed = { $schema: "draft-unknown", type: "array", additionalProperties: true };
  const result = validateSchemaDocumentShape(malformed);
  assert.equal(result.valid, false);
  assert.ok(result.errors.length >= 4);
});

test("independent CI not_performed does not block completion when not required", () => {
  const summary = {
    completion_gate_passed: true,
    invalid_pass_count: 0,
    schema_validation_failures: 0,
    totals: { passed: 1, failed: 0, skipped: 0 },
    required_runs: [{ run_id: "local", required_for_completion: true, executed: true, exit_code: 0, passed: true, failed: 0, stdout_path: "out", stderr_path: "err" }],
    independent_ci_verification: { required_for_completion: false, status: "not_performed", limitation: "independent CI is optional" },
  };
  assert.equal(validateTestSummaryCompletionContract(summary).valid, true);
});

test("required independent CI not executed is RED", () => {
  const summary = {
    completion_gate_passed: true,
    invalid_pass_count: 0,
    schema_validation_failures: 0,
    totals: { passed: 1, failed: 0, skipped: 0 },
    required_runs: [{ run_id: "local", required_for_completion: true, executed: true, exit_code: 0, passed: true, failed: 0, stdout_path: "out", stderr_path: "err" }],
    independent_ci_verification: { required_for_completion: true, status: "not_performed", limitation: "required but missing" },
  };
  const result = validateTestSummaryCompletionContract(summary);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /required_independent_ci/u);
});

import test from "node:test";
import assert from "node:assert/strict";
import { validateAdapterExecutionContract, validateBenchmarkResultContract, validateSchemaDocumentShape } from "./benchmark/task003-schema-preflight.mjs";
import { validateTestSummaryCompletionContract } from "./benchmark/task003-completion-preflight.mjs";
import { buildSchemas, validateGeneratedJsonAgainstSchemas } from "./benchmark/task003-schema-runtime.mjs";
import { buildPreOutputSchemaInventory, CANONICAL_SCHEMA_FILES, classifyJson, evaluateMappedValidationGateOrder } from "./benchmark/task003-json-inventory.mjs";
import { CANONICAL_SCHEMA_ROOT, TASK_003_ID, TASK_003_ROOT } from "./benchmark/task003-common.mjs";

const HASH = "a".repeat(64);
const fileProbe = (path) => ({ path, exists: true, size: 1, sha256: HASH, hash_algorithm: "sha256", source: "filesystem" });
const command = () => ({ command: "node fixture", executed: true, method: "node", started_at: "2026-07-03T00:00:00Z", ended_at: "2026-07-03T00:00:01Z", exit_code: 0, stdout_path: "stdout.log", stderr_path: "stderr.log", stdout_probe: fileProbe("stdout.log"), stderr_probe: fileProbe("stderr.log") });
const validator = () => ({ validator_id: "fixture-validator", valid: true, missing_evidence: [], assertions: [] });
const blockingProbe = () => ({ performed: true, available: false, method: "filesystem-stat", probe_evidence_path: "probe.json", probe_evidence_sha256: HASH, checked_path_results: [{ path: "runtime", exists: false, size: null, sha256: null }], blocked_reason_code: "runtime_missing", missing_prerequisites: ["runtime"] });

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

const adapter = (status) => ({
  task_id: "hwpx-core-benchmark-003-evidence-integrity",
  candidate_id: "candidate",
  candidate_role: "editor",
  scenario_id: "S06",
  status,
  planned_commands: ["node fixture"],
  attempted_commands: [command()],
  execution_outcome: status === "passed" ? "success" : "failure",
  status_reason: "fixture",
  validator_results: [validator()],
  missing_evidence: [],
  evidence_completeness: status === "not_applicable" ? "not_applicable" : "complete",
});

test("all canonical Schema files parse from filesystem and retain strict root shape", () => {
  const schemas = buildSchemas();

  assert.deepEqual(
    Object.keys(schemas).sort(),
    [...CANONICAL_SCHEMA_FILES].sort(),
  );

  for (const schema of Object.values(schemas)) {
    const result = validateSchemaDocumentShape(schema);
    assert.equal(result.valid, true);
    assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
    assert.equal(schema.type, "object");
    assert.equal(schema.additionalProperties, false);
  }
});

test("pre-output mapped validation cannot claim final completion over stale artifacts", async () => {
  const schemaRecords = CANONICAL_SCHEMA_FILES.map((name) => ({ path: `schemas-v2/${name}`, classification: "canonical_schema", schema_path: "draft2020-12-meta-schema", document_type: null, sha256: HASH, size: 1 }));
  const corpus = { path: "corpus-manifest.json", ...classifyJson("corpus-manifest.json", { schema_version: "1.0.0", fixtures: [] }), document_type: null, sha256: HASH, size: 1 };
  const inventory = {
    valid: true,
    root: TASK_003_ROOT,
    canonical_schema_root: CANONICAL_SCHEMA_ROOT,
    records: [...schemaRecords, corpus],
    missing_json: [],
    duplicate_json: [],
    unclassified_json: [],
    schema_mapping_errors: [],
    canonical_schema_set_complete: true,
    validation_order_valid: true,
    validation_failures: 0,
  };

  const preOutput = buildPreOutputSchemaInventory(inventory);
  assert.equal(preOutput.valid, true);
  assert.equal(preOutput.records.some((record) => record.path === "corpus-manifest.json"), false);
  assert.match(preOutput.limitations.join("\n"), /pre_output_schema_only_inventory_not_completion_candidate/u);

  const order = evaluateMappedValidationGateOrder({ inventory, outputGenerationCompleted: false });
  assert.equal(order.valid, false);
  assert.match(order.errors.join("\n"), /output_generation_required_before_final_mapped_validation/u);

  const validatorApi = {
    name: "stub-validator",
    version: "1.0.0",
    async validateMetaSchema() { return { valid: true, errors: [] }; },
    async validate() { return { valid: true, errors: [] }; },
  };
  const summary = await validateGeneratedJsonAgainstSchemas({ inventory, validator: validatorApi, outputGenerationCompleted: false });
  assert.equal(summary.valid, false);
  assert.match(summary.errors.join("\n"), /output_generation_required_before_final_mapped_validation/u);
});

test("old active output artifacts remain mapped and cannot be silently inactive", () => {
  assert.deepEqual(classifyJson("corpus-manifest.json", { schema_version: "1.0.0", fixtures: [] }), { classification: "benchmark_summary", schema_path: "benchmark-summary.schema.json" });
  assert.deepEqual(classifyJson("executions/current_node_xml/S01/adapter-execution.json", {}), { classification: "adapter_execution", schema_path: "adapter-execution.schema.json" });
  assert.deepEqual(classifyJson("results/current_node_xml/S01/result.json", {}), { classification: "benchmark_result", schema_path: "benchmark-result.schema.json" });
});

test("canonical adapter and benchmark-result status fixtures satisfy source contracts", () => {
  const passedAdapter = adapter("passed");
  assert.equal(validateAdapterExecutionContract(passedAdapter).valid, true);

  const failedAdapter = adapter("failed");
  failedAdapter.attempted_commands[0].exit_code = 2;
  failedAdapter.validator_results[0].valid = false;
  assert.equal(validateAdapterExecutionContract(failedAdapter).valid, true);

  const blockedAdapter = { ...adapter("blocked"), attempted_commands: [], execution_outcome: "not_executed", prerequisite_probe: blockingProbe(), blocked_reason_code: "runtime_missing", missing_prerequisites: ["runtime"], missing_evidence: ["runtime"], validator_results: [] };
  assert.equal(validateAdapterExecutionContract(blockedAdapter).valid, true);

  const unsupportedAdapter = { ...adapter("unsupported"), attempted_commands: [], execution_outcome: "not_executed", source_api_inspection: { inspection_target: "candidate api", method: "static-analysis", result: "unsupported", evidence_path: "inspection.json", evidence_sha256: HASH, rationale: "API unavailable" }, validator_results: [] };
  assert.equal(validateAdapterExecutionContract(unsupportedAdapter).valid, true);

  const naAdapter = { ...adapter("not_applicable"), attempted_commands: [], execution_outcome: "not_executed", not_applicable_rationale: "editor role does not own S09", role_matrix_reference: "role-matrix.json", validator_results: [] };
  assert.equal(validateAdapterExecutionContract(naAdapter).valid, true);

  const passedResult = {
    ...baseResult("passed"),
    evidence_completeness: "complete",
    planned_commands: ["node fixture"],
    attempted_commands: [command()],
    validator_results: [validator()],
    imported_evidence: { source_path: "evidence.json", source_sha256: HASH, hash_verified: true, source_probe: fileProbe("evidence.json") },
  };
  assert.equal(validateBenchmarkResultContract(passedResult).valid, true);

  const failedResult = { ...baseResult("failed"), attempted_commands: [command()], validator_results: [{ ...validator(), valid: false, missing_evidence: ["semantic_mismatch"] }] };
  assert.equal(validateBenchmarkResultContract(failedResult).valid, true);

  const blockedResult = { ...baseResult("blocked"), evidence_completeness: "complete", prerequisite_probe: blockingProbe(), blocked_reason_code: "runtime_missing", missing_prerequisites: ["runtime"], missing_evidence: ["runtime"] };
  assert.equal(validateBenchmarkResultContract(blockedResult).valid, true);

  const unsupportedResult = { ...baseResult("unsupported"), source_api_inspection: { performed: true, supported: false, method: "static-analysis", evidence_path: "inspection.json", evidence_sha256: HASH, rationale: "API unavailable" } };
  assert.equal(validateBenchmarkResultContract(unsupportedResult).valid, true);

  const naResult = { ...baseResult("not_applicable"), candidate_role: "editor", rationale: "editor role does not own S09", governing_role_matrix_reference: "role-matrix.json", evidence_completeness: "not_applicable" };
  assert.equal(validateBenchmarkResultContract(naResult).valid, true);
});

test("passed benchmark-result condition violation is RED", () => {
  const result = validateBenchmarkResultContract(baseResult("passed"));
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /passed_/u);
});

test("blocked benchmark-result condition violation is RED", () => {
  const result = validateBenchmarkResultContract(baseResult("blocked"));
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /blocked_/u);
});

test("unsupported benchmark-result condition violation is RED", () => {
  const result = validateBenchmarkResultContract(baseResult("unsupported"));
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /unsupported_/u);
});

test("not_applicable benchmark-result condition violation is RED", () => {
  const result = validateBenchmarkResultContract(baseResult("not_applicable"));
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /not_applicable_/u);
});

test("adapter failed without attempted command is RED", () => {
  const value = adapter("failed");
  value.attempted_commands = [];
  const result = validateAdapterExecutionContract(value);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /failed_attempted_command_required/u);
});

test("adapter blocked without prerequisite probe is RED", () => {
  const value = adapter("blocked");
  value.attempted_commands = [];
  value.blocked_reason_code = "runtime_missing";
  value.missing_prerequisites = ["runtime"];
  const result = validateAdapterExecutionContract(value);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /blocked_probe_invalid/u);
});

test("adapter blocked without missing prerequisites is RED", () => {
  const value = adapter("blocked");
  value.attempted_commands = [];
  value.blocked_reason_code = "runtime_missing";
  value.prerequisite_probe = { performed: true, available: false, method: "filesystem-stat", probe_evidence_path: "probe.json", probe_evidence_sha256: HASH, checked_path_results: [{ path: "runtime", exists: false, size: null, sha256: null }] };
  const result = validateAdapterExecutionContract(value);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /blocked_missing_prerequisites_required/u);
});

test("adapter unsupported without source API inspection is RED", () => {
  const value = adapter("unsupported");
  value.attempted_commands = [];
  const result = validateAdapterExecutionContract(value);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /unsupported_source_api_inspection_invalid/u);
});

test("adapter not_applicable without rationale is RED", () => {
  const value = adapter("not_applicable");
  value.attempted_commands = [];
  value.role_matrix_reference = "role-matrix.json";
  delete value.status_reason;
  const result = validateAdapterExecutionContract(value);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /not_applicable_rationale_required/u);
});

test("adapter not_applicable without role matrix reference is RED", () => {
  const value = adapter("not_applicable");
  value.attempted_commands = [];
  value.not_applicable_rationale = "editor role does not own scenario";
  const result = validateAdapterExecutionContract(value);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /not_applicable_role_matrix_reference_required/u);
});

test("adapter passed with nonzero exit code is RED", () => {
  const value = adapter("passed");
  value.attempted_commands[0].exit_code = 2;
  const result = validateAdapterExecutionContract(value);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /passed_command_invalid/u);
});

test("adapter passed with validator false is RED", () => {
  const value = adapter("passed");
  value.validator_results[0].valid = false;
  const result = validateAdapterExecutionContract(value);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /passed_validator_invalid/u);
});

test("adapter passed with missing evidence is RED", () => {
  const value = adapter("passed");
  value.missing_evidence = ["artifact missing"];
  const result = validateAdapterExecutionContract(value);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /passed_missing_evidence_present/u);
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

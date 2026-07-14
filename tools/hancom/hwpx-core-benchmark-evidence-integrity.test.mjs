import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRoleMatrix,
  correctedStatusForScenario,
  calculateEvidenceRubricScorecard,
  validateGeneratedJsonAgainstSchemas,
  validateS12Evidence,
  validateS13Evidence,
  validateS14Evidence,
  validateAdapterExecutionContract,
  TASK_003_ID,
  TASK_003_ROOT,
  CANONICAL_SCHEMA_ROOT,
} from "./benchmark/hwpx-core-benchmark-003-evidence-integrity.mjs";

const HASH = "a".repeat(64);

test("Task 003 constants isolate output from benchmark-002", () => {
  assert.equal(TASK_003_ID, "hwpx-core-benchmark-003-evidence-integrity");
  assert.equal(TASK_003_ROOT, "release/test-documents/hwpx-core-benchmark-003-evidence-integrity");
});

test("role matrix marks role-inapplicable scenarios as not_applicable instead of blocked", () => {
  const scenarios = buildRoleMatrix().candidates;
  assert.equal(scenarios.current_node_xml.scenarios.S09.applicable, false);
  assert.equal(scenarios.python_hwpx.scenarios.S10.applicable, false);
  assert.equal(scenarios.hwpxlib.scenarios.S02.applicable, false);
  assert.equal(scenarios.hwpforge.scenarios.S05.applicable, false);
  assert.equal(scenarios.hancom_com.scenarios.S09.applicable, true);
  assert.equal(scenarios.hancom_com.scenarios.S01.applicable, false);
  assert.match(scenarios.current_node_xml.scenarios.S09.rationale, /does not own S09/u);
  assert.match(scenarios.python_hwpx.scenarios.S10.rationale, /does not own S10/u);
  assert.match(scenarios.hwpxlib.scenarios.S02.rationale, /does not own S02/u);
  assert.match(scenarios.hwpforge.scenarios.S05.rationale, /does not own S05/u);
  assert.match(scenarios.hancom_com.scenarios.S01.rationale, /does not own S01/u);
});

test("S06-S08 cannot pass without before/after snapshots and mutation output", () => {
  for (const scenarioId of ["S06", "S07", "S08"]) {
    assert.throws(
      () => correctedStatusForScenario({ role: "editor", scenarioId, evidence: { package_valid: true } }),
      /status_evidence_insufficient/u,
    );
  }
});

test("verified unavailable prerequisite probe can produce blocked", () => {
  const result = correctedStatusForScenario({
    role: "editor",
    scenarioId: "S06",
    prerequisite_probe: {
      performed: true,
      available: false,
      method: "filesystem-stat",
      probe_evidence_path: "probes/s06.json",
      probe_evidence_sha256: HASH,
      checked_path_results: [{ path: "fixtures/input.hwpx", exists: false, size: null, sha256: null }],
      blocked_reason_code: "input_hwpx_missing",
      missing_prerequisites: ["fixtures/input.hwpx"],
    },
  });
  assert.equal(result.status, "blocked");
  assert.equal(result.blocked_reason_code, "input_hwpx_missing");
});

test("S12-S14 gates reject partial timing, package-open install, and unknown license evidence", () => {
  const s12 = validateS12Evidence({ warmup_runs: 1, measured_runs: 5, duration_samples_ms: [90, 91, 93, 91, 89] });
  assert.equal(s12.valid, false);
  assert.ok(s12.missing_evidence.length > 0);
  assert.match(s12.missing_evidence.join("\n"), /S12_artifact_inventory|S12_runtime_dependency_inventory|execution_/u);

  const s13 = validateS13Evidence({ package_valid: true });
  assert.equal(s13.valid, false);
  assert.ok(s13.missing_evidence.length > 0);
  assert.match(s13.missing_evidence.join("\n"), /S13_offline_artifact_inventory|S13_installed_inventory|clean_isolated_environment/u);

  const s14 = validateS14Evidence({ license_file_path: null, redistribution_assessment: "unknown" });
  assert.equal(s14.valid, false);
  assert.ok(s14.missing_evidence.length > 0);
  assert.match(s14.missing_evidence.join("\n"), /S14_LICENSE_missing/u);
  assert.match(s14.missing_evidence.join("\n"), /S14_COPYING_missing/u);
  assert.match(s14.missing_evidence.join("\n"), /S14_NOTICE_missing/u);
  assert.match(s14.missing_evidence.join("\n"), /redistribution_obligations_missing|reviewer_or_valid_reviewed_at_missing/u);
});

test("planned commands are separated from actually attempted commands", () => {
  const contract = validateAdapterExecutionContract({
    task_id: TASK_003_ID,
    candidate_id: "python_hwpx",
    candidate_role: "editor",
    scenario_id: "S01",
    status: "passed",
    planned_commands: ["pip install --no-index package.whl"],
    attempted_commands: [{ command: "pip install --no-index package.whl", executed: false }],
    execution_outcome: "success",
    validator_results: [{ validator_id: "adapter-contract", valid: true, missing_evidence: [], assertions: [] }],
    missing_evidence: [],
    evidence_completeness: "complete",
  });
  assert.equal(contract.valid, false);
  assert.ok(contract.errors.includes("passed_command_invalid"));
});

test("rubric scoring ignores invalid passed and status-count formulas", () => {
  const scorecard = calculateEvidenceRubricScorecard([
    { candidate_id: "current_node_xml", candidate_role: "editor", scenario_id: "S06", status: "blocked", validator_results: [{ validator_id: "S06", valid: false }] },
    { candidate_id: "current_node_xml", candidate_role: "editor", scenario_id: "S07", status: "blocked", validator_results: [{ validator_id: "S07", valid: false }] },
  ]);
  assert.equal(scorecard.editor_gate.current_node_xml.categories.functional_fit.measured_points, 0);
  assert.doesNotMatch(JSON.stringify(scorecard), /passedCount|status count|passed\s*\*/iu);
});

test("schema validation reports negative fixture failure", async () => {
  const inventory = {
    valid: true,
    canonical_schema_root: CANONICAL_SCHEMA_ROOT,
    records: [{ path: "negative-fixture.json", classification: "benchmark_result", schema_path: "benchmark-result.schema.json" }],
  };
  const validator = {
    name: "injected-test-validator",
    version: "1.0.0",
    async validateMetaSchema() { return { valid: true, errors: [] }; },
    async validate(schemaPath, documentPath) {
      assert.equal(schemaPath, "benchmark-result.schema.json");
      assert.equal(documentPath, "negative-fixture.json");
      return { valid: false, errors: ["status must match enum"] };
    },
  };
  const summary = await validateGeneratedJsonAgainstSchemas({ inventory, validator });
  assert.equal(summary.valid, false);
  assert.equal(summary.results[0].valid, false);
  assert.match(summary.results[0].errors.join("\n"), /enum/u);
});

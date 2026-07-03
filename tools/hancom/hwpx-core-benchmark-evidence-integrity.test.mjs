import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRoleMatrix,
  correctedStatusForScenario,
  validateEvidenceIntegrityResult,
  calculateEvidenceRubricScorecard,
  validateGeneratedJsonAgainstSchemas,
  TASK_003_ID,
  TASK_003_ROOT,
} from "./benchmark/hwpx-core-benchmark-003-evidence-integrity.mjs";

test("Task 003 constants isolate output from benchmark-002", () => {
  assert.equal(TASK_003_ID, "hwpx-core-benchmark-003-evidence-integrity");
  assert.equal(TASK_003_ROOT, "release/test-documents/hwpx-core-benchmark-003-evidence-integrity");
});

test("role matrix marks role-inapplicable scenarios as not_applicable instead of blocked", () => {
  const matrix = buildRoleMatrix();

  assert.equal(matrix.candidates.current_node_xml.scenarios.S09.applicability, "not_applicable");
  assert.equal(matrix.candidates.python_hwpx.scenarios.S10.applicability, "not_applicable");
  assert.equal(matrix.candidates.hwpxlib.scenarios.S02.applicability, "not_applicable");
  assert.equal(matrix.candidates.hwpforge.scenarios.S05.applicability, "not_applicable");
  assert.equal(matrix.candidates.hancom_com.scenarios.S09.applicability, "applicable");
  assert.equal(matrix.candidates.hancom_com.scenarios.S01.applicability, "not_applicable");
});

test("S06-S08 cannot pass without before/after snapshots and mutation output", () => {
  for (const scenario of ["S06", "S07", "S08"]) {
    assert.equal(
      correctedStatusForScenario({
        candidateId: "current_node_xml",
        role: "editor",
        scenarioId: scenario,
        previousStatus: "passed",
        evidence: { package_valid: true },
      }).status,
      "blocked",
    );
  }
});

test("S12-S14 gates reject partial timing, package-open install, and unknown license evidence", () => {
  assert.equal(
    correctedStatusForScenario({
      candidateId: "current_node_xml",
      role: "editor",
      scenarioId: "S12",
      previousStatus: "passed",
      evidence: { duration_samples_ms: [90, 91, 93, 91, 89], peak_rss_samples: [1, 2, 3, 4, 5] },
    }).status,
    "blocked",
  );

  assert.equal(
    correctedStatusForScenario({
      candidateId: "current_node_xml",
      role: "editor",
      scenarioId: "S13",
      previousStatus: "passed",
      evidence: { package_valid: true },
    }).status,
    "blocked",
  );

  assert.equal(
    correctedStatusForScenario({
      candidateId: "current_node_xml",
      role: "editor",
      scenarioId: "S14",
      previousStatus: "passed",
      evidence: { license_file_path: null, redistribution_assessment: "unknown" },
    }).status,
    "blocked",
  );
});

test("planned commands are separated from actually attempted commands", () => {
  assert.throws(
    () => validateEvidenceIntegrityResult({
      task_id: TASK_003_ID,
      candidate_id: "python_hwpx",
      candidate_role: "editor",
      scenario_id: "S01",
      status: "blocked",
      status_reason: "missing artifact",
      evidence_completeness: "missing",
      missing_evidence: ["pinned_offline_artifact"],
      planned_commands: [],
      attempted_commands: [{ command: "pip install --no-index <future pinned wheel>", executed: false }],
      checked_paths: [],
      validator_results: [],
    }),
    /attempted_command_must_be_executed/u,
  );
});

test("rubric scoring ignores invalid passed and status-count formulas", () => {
  const scorecard = calculateEvidenceRubricScorecard([
    {
      candidate_id: "current_node_xml",
      candidate_role: "editor",
      scenario_id: "S06",
      status: "blocked",
      validator_results: [{ validator_id: "S06", valid: false }],
    },
    {
      candidate_id: "current_node_xml",
      candidate_role: "editor",
      scenario_id: "S07",
      status: "blocked",
      validator_results: [{ validator_id: "S07", valid: false }],
    },
  ]);

  assert.equal(scorecard.editor_gate.current_node_xml.categories.functional_fit.measured_points, 0);
  assert.doesNotMatch(JSON.stringify(scorecard), /passedCount|status count|passed\s*\*/iu);
});

test("schema validation reports negative fixture failure", async () => {
  const summary = await validateGeneratedJsonAgainstSchemas({
    root: TASK_003_ROOT,
    schemas: {
      "benchmark-result.schema.json": {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        required: ["task_id", "status"],
        properties: {
          task_id: { const: TASK_003_ID },
          status: { enum: ["passed", "failed", "unsupported", "blocked", "not_applicable"] },
        },
        additionalProperties: true,
      },
    },
    documents: [{ json_path: "negative-fixture.json", schema_path: "benchmark-result.schema.json", data: { task_id: TASK_003_ID, status: "success" }, expected_valid: false }],
  });

  assert.equal(summary.results[0].valid, false);
  assert.match(summary.results[0].errors.join("\n"), /enum/u);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import {
  comparisonPaths,
  runEditorBackendCandidateComparison,
  readJson,
  ALLOWED_RECOMMENDATIONS,
} from "./EditorBackendCandidateComparison.mjs";

async function resetComparisonRoot() {
  await rm(comparisonPaths.root, { recursive: true, force: true });
}

async function runComparison() {
  await resetComparisonRoot();
  return runEditorBackendCandidateComparison({ workspace: process.cwd() });
}

test("python-hwpx availability probe writes evidence", async () => {
  const result = await runComparison();
  assert.equal(existsSync(comparisonPaths.python.availabilityProbe), true);
  const probe = await readJson(comparisonPaths.python.availabilityProbe);
  assert.equal(probe.candidate_id, "python_hwpx");
  assert.equal(typeof probe.repository_search.performed, "boolean");
  assert.ok(probe.python_runtime.command_checked.length >= 1);
  assert.equal(typeof probe.import_probe.available, "boolean");
  assert.equal(result.python_hwpx.availability.output_unavailable, probe.output_unavailable);
});

test("python-hwpx unavailable path records evidence without failing whole task", async () => {
  const result = await runComparison();
  const unavailable = await readJson(comparisonPaths.python.paragraphUnavailable);
  if (result.python_hwpx.availability.output_unavailable === true) {
    assert.equal(unavailable.output_unavailable, true);
    assert.ok(unavailable.reason);
    assert.equal(unavailable.no_install_attempted, true);
    assert.ok(unavailable.required_next_action);
  } else {
    assert.equal(existsSync(comparisonPaths.python.paragraphOutput), true);
  }
});

test("no online install is attempted", async () => {
  await runComparison();
  const dependency = await readFile(comparisonPaths.python.dependencyProbe, "utf8");
  const availability = await readJson(comparisonPaths.python.availabilityProbe);
  assert.equal(availability.no_online_install_attempted, true);
  assert.match(dependency, /No online install attempted\./u);
  assert.match(dependency, /No pip install attempted\./u);
  assert.match(dependency, /No dependency vendoring attempted\./u);
  assert.doesNotMatch(dependency, /downloaded|install succeeded|install command executed/iu);
});

test("Node XML thin baseline is read from Task 006 summary", async () => {
  await runComparison();
  const baseline = await readJson(comparisonPaths.node.baselineReference);
  assert.equal(baseline.candidate_id, "node_xml_thin");
  assert.equal(baseline.already_verified, true);
  assert.equal(baseline.task006_summary.exists, true);
  assert.equal(baseline.outputs.paragraph.exists, true);
  assert.equal(baseline.outputs.table.exists, true);
  assert.equal(baseline.outputs.style.exists, true);
});

test("comparison matrix is generated", async () => {
  const result = await runComparison();
  const matrix = await readJson(comparisonPaths.comparison.matrix);
  assert.equal(matrix.task_id, "editor-backend-candidate-comparison-007");
  assert.ok(matrix.criteria.length >= 10);
  for (const record of matrix.criteria) {
    assert.ok(["pass", "partial", "fail", "not_verified"].includes(record.python_hwpx));
    assert.ok(["pass", "partial", "fail", "not_verified"].includes(record.node_xml_thin));
  }
  assert.equal(result.comparison.criteria.length, matrix.criteria.length);
});

test("recommendation is one of the allowed values", async () => {
  const result = await runComparison();
  const recommendation = await readJson(comparisonPaths.comparison.recommendation);
  assert.ok(ALLOWED_RECOMMENDATIONS.includes(recommendation.recommendation));
  assert.equal(result.recommendation.recommendation, recommendation.recommendation);
});

test("Task 003 evidence remains read-only", async () => {
  await runComparison();
  const risk = await readJson(comparisonPaths.comparison.riskRegister);
  assert.equal(risk.read_only_checks.task003_evidence_modified, false);
});

test("no final core selection is declared", async () => {
  await runComparison();
  const recommendation = await readJson(comparisonPaths.comparison.recommendation);
  assert.equal(recommendation.final_core_selection_declared, false);
  assert.doesNotMatch(JSON.stringify(recommendation), /final core selected|stage 2 transition approved|python-hwpx selected as final|node xml selected as final/iu);
});



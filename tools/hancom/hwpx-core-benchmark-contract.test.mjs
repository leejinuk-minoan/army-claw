import test from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import {
  assertBenchmarkIsolation,
  buildCorpusManifest,
  createBenchmarkResult,
  validateBenchmarkResult,
  validateCorpusManifest,
} from "./benchmark/hwpx-core-benchmark.mjs";

const workspace = process.cwd();

test("corpus manifest rejects entries without sha256 and read_only_source", async () => {
  const manifest = {
    task_id: "hwpx-core-benchmark-001",
    generated_at: new Date().toISOString(),
    fixtures: [
      {
        fixture_id: "bad-fixture",
        repository_relative_path: "release/test-documents/missing.hwpx",
        artifact_role: "v5",
        version_or_generation: "v5",
        byte_size: 1,
        expected_structural_features: [],
        expected_visual_findings: [],
        availability_status: "available",
      },
    ],
  };

  assert.throws(() => validateCorpusManifest(manifest), /corpus_sha256_required/u);
  manifest.fixtures[0].sha256 = "a".repeat(64);
  assert.throws(() => validateCorpusManifest(manifest), /corpus_read_only_required/u);
});

test("corpus manifest records real v5 fixtures with immutable sha256", async () => {
  const manifest = await buildCorpusManifest({
    workspace,
    fixturePaths: [
      "release/test-documents/army-claw-qualification-review-template-fidelity-v5.hwpx",
      "release/test-documents/army-claw-qualification-template-fidelity-v5-diff.json",
      "release/test-documents/hwp-adaptive-board-fit-v5-diagnostics.json",
    ],
  });

  validateCorpusManifest(manifest);
  assert.equal(manifest.fixtures.length, 3);
  assert.equal(manifest.fixtures.every((fixture) => fixture.read_only_source === true), true);
  assert.equal(manifest.fixtures.every((fixture) => /^[a-f0-9]{64}$/u.test(fixture.sha256)), true);
});

test("benchmark isolation rejects candidate output collisions and cross-candidate input reuse", () => {
  const root = "release/test-documents/hwpx-core-benchmark-001/results";
  const currentOutput = join(root, "current-node-xml", "fixture", "S01", "out.hwpx");
  const pythonOutput = join(root, "python-hwpx", "fixture", "S01", "out.hwpx");

  assert.throws(
    () => assertBenchmarkIsolation([
      { candidate_id: "current-node-xml", input_path: "release/test-documents/source.hwpx", output_path: currentOutput },
      { candidate_id: "python-hwpx", input_path: "release/test-documents/source.hwpx", output_path: currentOutput },
    ]),
    /candidate_output_path_collision/u,
  );

  assert.throws(
    () => assertBenchmarkIsolation([
      { candidate_id: "current-node-xml", input_path: "release/test-documents/source.hwpx", output_path: currentOutput },
      { candidate_id: "python-hwpx", input_path: currentOutput, output_path: pythonOutput },
    ]),
    /cross_candidate_output_used_as_input/u,
  );
});

test("benchmark result schema rejects bad status enums and missing preservation evidence", () => {
  const result = createBenchmarkResult({
    candidate: { id: "current_node_xml", role: "editor", version: "local", source: "repo", immutable_ref: "HEAD", runtime: "node" },
    fixture: {
      fixture_id: "v5",
      source_path: "release/test-documents/army-claw-qualification-review-template-fidelity-v5.hwpx",
      source_sha256: "a".repeat(64),
      working_copy_sha256_before: "a".repeat(64),
    },
    scenario: { scenario_id: "S01", name: "round trip", status: "passed" },
  });

  const invalidStatus = structuredClone(result);
  invalidStatus.scenario.status = "success";
  assert.throws(() => validateBenchmarkResult(invalidStatus), /benchmark_status_invalid/u);

  const missingPreservation = structuredClone(result);
  delete missingPreservation.preservation.bindata_preserved;
  assert.throws(() => validateBenchmarkResult(missingPreservation), /benchmark_required_field_missing/u);
});

import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { probeFile } from "./task003-common.mjs";

export const TEST_HASHES = {
  sectionBefore: "1".repeat(64),
  sectionAfter: "2".repeat(64),
  preserved: "3".repeat(64),
};

export async function createFilesystemFixture() {
  const root = await mkdtemp(join(tmpdir(), "task003-"));
  const probes = {};
  async function file(relativePath, content) {
    const absolutePath = join(root, relativePath);
    await writeFile(absolutePath, content);
    const probe = await probeFile(absolutePath, relativePath);
    probes[relativePath] = probe;
    return { path: relativePath, size: probe.size, sha256: probe.sha256 };
  }
  return { root, probes, file };
}

export async function createPreservationFixture() {
  const fs = await createFilesystemFixture();
  const input_hwpx = await fs.file("input.hwpx", "original-hwpx");
  const output_hwpx = await fs.file("output.hwpx", "mutated-hwpx");
  const beforeBase = await fs.file("before-snapshot.json", "before-snapshot");
  const afterBase = await fs.file("after-snapshot.json", "after-snapshot");
  const before_snapshot = { ...beforeBase, source_hwpx_path: input_hwpx.path, source_hwpx_sha256: input_hwpx.sha256 };
  const after_snapshot = { ...afterBase, source_hwpx_path: output_hwpx.path, source_hwpx_sha256: output_hwpx.sha256 };
  return {
    ...fs,
    evidence: {
      input_hwpx,
      output_hwpx,
      before_snapshot,
      after_snapshot,
      file_probes: fs.probes,
      allowed_target_diff: ["Contents/section0.xml"],
      scenario_assertions: [{ assertion_id: "target_mutation_verified", expected: true, actual: true, passed: true, evidence_path: "assertions/target.json" }],
    },
  };
}

export async function createCommand(fs, prefix = "run", overrides = {}) {
  const stdout = await fs.file(`${prefix}.stdout.log`, `${prefix}-stdout`);
  const stderr = await fs.file(`${prefix}.stderr.log`, `${prefix}-stderr`);
  return {
    command: `${prefix} --execute`,
    executed: true,
    method: "node-child-process",
    started_at: "2026-07-03T00:00:00Z",
    ended_at: "2026-07-03T00:00:01Z",
    exit_code: 0,
    stdout_path: stdout.path,
    stderr_path: stderr.path,
    stdout_probe: fs.probes[stdout.path],
    stderr_probe: fs.probes[stderr.path],
    ...overrides,
  };
}

export async function createEligiblePassedResult({ candidateId = "current_node_xml", scenarioId = "S06" } = {}) {
  const fs = await createFilesystemFixture();
  const imported = await fs.file("imported-evidence.json", "complete-evidence");
  const execution = await createCommand(fs, "eligible");
  const validator = {
    validator_id: `${scenarioId.toLowerCase()}-semantic-gate`,
    valid: true,
    missing_evidence: [],
    assertions: [{ assertion_id: "fixture_gate", expected: true, actual: true, passed: true, evidence_path: "fixture-gate.json" }],
  };
  return {
    fs,
    result: {
      task_id: "hwpx-core-benchmark-003-evidence-integrity",
      candidate_id: candidateId,
      candidate_role: "editor",
      scenario_id: scenarioId,
      status: "passed",
      status_reason: "actual execution and complete evidence validated",
      evidence_completeness: "complete",
      missing_evidence: [],
      planned_commands: [execution.command],
      attempted_commands: [execution],
      validator_results: [validator],
      imported_evidence: {
        source_path: imported.path,
        source_sha256: imported.sha256,
        hash_verified: true,
        source_probe: fs.probes[imported.path],
      },
    },
    context: {
      schema_validation_result: { valid: true, validator_name: "local-draft-2020-12-validator" },
      scenario_gate_result: { valid: true, missing_evidence: [], validator_id: validator.validator_id },
      required_filesystem_evidence_complete: true,
    },
  };
}

export const validRelationship = () => ({
  relationship_source_path: "Contents/section0.xml.rels",
  relationship_id: "rId1",
  relationship_type: "http://www.hancom.co.kr/hwpml/2011/relationships/image",
  relationship_target: "../BinData/BIN0001.png",
  reference_source_path: "Contents/section0.xml",
});

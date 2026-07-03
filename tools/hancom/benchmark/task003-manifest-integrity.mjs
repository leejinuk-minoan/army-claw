import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, readdir, stat } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { nowIso, TASK_003_ID } from "./task003-common.mjs";

async function files(root) {
  const output = [];
  async function walk(directory) {
    if (!existsSync(directory)) return;
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) await walk(path); else output.push(path);
    }
  }
  await walk(root);
  return output;
}
async function sha256File(path) { return createHash("sha256").update(await readFile(path)).digest("hex"); }

export async function captureTaskManifest({ workspace, targets, phase, commitSha }) {
  const records = [];
  for (const target of targets) {
    const absolute = resolve(workspace, target);
    if (!existsSync(absolute)) { records.push({ path: target, exists: false, sha256: null, size: null }); continue; }
    const info = await stat(absolute);
    if (info.isDirectory()) {
      for (const path of await files(absolute)) records.push({ path: relative(workspace, path).replaceAll("\\", "/"), exists: true, sha256: await sha256File(path), size: (await stat(path)).size });
    } else records.push({ path: target, exists: true, sha256: await sha256File(absolute), size: info.size });
  }
  return { schema_version: "2.0.0", document_type: "task_manifest", task_id: TASK_003_ID, phase, commit_sha: commitSha, generated_at: nowIso(), records: records.sort((a, b) => a.path.localeCompare(b.path)) };
}

export function compareTaskManifests(start, end, allowedChanges = []) {
  const allowed = new Set(allowedChanges);
  const before = new Map(start.records.map((record) => [record.path, record]));
  const after = new Map(end.records.map((record) => [record.path, record]));
  const paths = [...new Set([...before.keys(), ...after.keys()])].sort();
  const diffs = paths.filter((path) => JSON.stringify(before.get(path)) !== JSON.stringify(after.get(path))).map((path) => ({ path, before: before.get(path) ?? null, after: after.get(path) ?? null, allowed: allowed.has(path) }));
  return { schema_version: "2.0.0", document_type: "immutability_comparison", task_id: TASK_003_ID, generated_at: nowIso(), diffs, unexpected_diffs: diffs.filter((diff) => !diff.allowed), valid: diffs.every((diff) => diff.allowed) };
}

export function validateCrossArtifactConsistency({ report, testSummary, handoff }) {
  const assertions = [
    { assertion_id: "test_counts_consistent", passed: report?.tests?.passed === testSummary?.totals?.passed && report?.tests?.failed === testSummary?.totals?.failed },
    { assertion_id: "tested_commit_consistent", passed: report?.tested_implementation_commit_sha === handoff?.tested_implementation_commit_sha },
    { assertion_id: "completion_gate_consistent", passed: report?.completion_gate_passed === handoff?.completion_gate_passed },
  ];
  return { valid: assertions.every((assertion) => assertion.passed), assertions };
}

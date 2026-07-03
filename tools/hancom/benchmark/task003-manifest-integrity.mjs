import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, readdir, stat } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { nowIso, TASK_003_ID } from "./task003-common.mjs";

async function files(root) {
  const out = [];
  async function walk(dir) {
    if (!existsSync(dir)) return;
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = resolve(dir, entry.name);
      if (entry.isDirectory()) await walk(path); else out.push(path);
    }
  }
  await walk(root); return out;
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
  const allow = new Set(allowedChanges), a = new Map(start.records.map((r) => [r.path, r])), b = new Map(end.records.map((r) => [r.path, r]));
  const diffs = [...new Set([...a.keys(), ...b.keys()])].sort().filter((p) => JSON.stringify(a.get(p)) !== JSON.stringify(b.get(p))).map((p) => ({ path: p, before: a.get(p) ?? null, after: b.get(p) ?? null, allowed: allow.has(p) }));
  return { schema_version: "2.0.0", document_type: "immutability_comparison", task_id: TASK_003_ID, generated_at: nowIso(), diffs, unexpected_diffs: diffs.filter((d) => !d.allowed), valid: diffs.every((d) => d.allowed) };
}

export function validateCrossArtifactConsistency({ report, testSummary, handoff }) {
  const assertions = [
    { assertion_id: "test_counts_consistent", passed: report?.tests?.passed === testSummary?.totals?.passed && report?.tests?.failed === testSummary?.totals?.failed },
    { assertion_id: "tested_commit_consistent", passed: report?.tested_implementation_commit_sha === handoff?.tested_implementation_commit_sha },
    { assertion_id: "completion_gate_consistent", passed: report?.completion_gate_passed === handoff?.completion_gate_passed },
  ];
  return { valid: assertions.every((a) => a.passed), assertions };
}

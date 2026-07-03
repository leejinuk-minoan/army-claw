import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, readdir, stat } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { deepEqual, isGitCommitSha, isSha256, nowIso, TASK_003_ID } from "./task003-common.mjs";

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
  if (!isGitCommitSha(commitSha)) throw new Error("manifest_commit_sha_invalid");
  const records = [];
  for (const target of targets) {
    const absolute = resolve(workspace, target);
    if (!existsSync(absolute)) { records.push({ path: target, exists: false, sha256: null, size: null }); continue; }
    const info = await stat(absolute);
    if (info.isDirectory()) {
      for (const path of await files(absolute)) records.push({ path: relative(workspace, path).replaceAll("\\", "/"), exists: true, sha256: await sha256File(path), size: (await stat(path)).size });
    } else records.push({ path: target, exists: true, sha256: await sha256File(absolute), size: info.size });
  }
  return { schema_version: "2.1.0", document_type: "task_manifest", task_id: TASK_003_ID, phase, commit_sha: commitSha, generated_at: nowIso(), records: records.sort((a, b) => a.path.localeCompare(b.path)) };
}

export function compareTaskManifests(start, end, allowedChanges = []) {
  const allowed = new Set(allowedChanges);
  const before = new Map(start.records.map((record) => [record.path, record]));
  const after = new Map(end.records.map((record) => [record.path, record]));
  const paths = [...new Set([...before.keys(), ...after.keys()])].sort();
  const diffs = paths.filter((path) => !deepEqual(before.get(path), after.get(path))).map((path) => ({ path, before: before.get(path) ?? null, after: after.get(path) ?? null, allowed: allowed.has(path) }));
  return { schema_version: "2.1.0", document_type: "immutability_comparison", task_id: TASK_003_ID, generated_at: nowIso(), diffs, unexpected_diffs: diffs.filter((diff) => !diff.allowed), valid: diffs.every((diff) => diff.allowed) };
}

export function validateCrossArtifactConsistency({ report, testSummary, handoff }) {
  const reportCommit = report?.tested_implementation_commit_sha;
  const testCommit = testSummary?.tested_implementation_commit_sha;
  const handoffCommit = handoff?.tested_implementation_commit_sha;
  const assertions = [
    { assertion_id: "test_counts_consistent", expected: report?.tests, actual: testSummary?.totals, passed: report?.tests?.passed === testSummary?.totals?.passed && report?.tests?.failed === testSummary?.totals?.failed },
    { assertion_id: "tested_commit_report_valid_git_sha", expected: "40 lowercase hexadecimal characters", actual: reportCommit, passed: isGitCommitSha(reportCommit) },
    { assertion_id: "tested_commit_test_summary_valid_git_sha", expected: "40 lowercase hexadecimal characters", actual: testCommit, passed: isGitCommitSha(testCommit) },
    { assertion_id: "tested_commit_handoff_valid_git_sha", expected: "40 lowercase hexadecimal characters", actual: handoffCommit, passed: isGitCommitSha(handoffCommit) },
    { assertion_id: "tested_commit_report_handoff_consistent", expected: reportCommit, actual: handoffCommit, passed: isGitCommitSha(reportCommit) && isGitCommitSha(handoffCommit) && reportCommit === handoffCommit },
    { assertion_id: "tested_commit_report_test_summary_consistent", expected: reportCommit, actual: testCommit, passed: isGitCommitSha(reportCommit) && isGitCommitSha(testCommit) && reportCommit === testCommit },
    { assertion_id: "report_test_summary_sha_link", expected: testSummary?.self_sha256, actual: report?.test_summary_sha256, passed: isSha256(testSummary?.self_sha256) && isSha256(report?.test_summary_sha256) && report.test_summary_sha256 === testSummary.self_sha256 },
    { assertion_id: "report_handoff_sha_link", expected: handoff?.self_sha256, actual: report?.handoff_sha256, passed: isSha256(handoff?.self_sha256) && isSha256(report?.handoff_sha256) && report.handoff_sha256 === handoff.self_sha256 },
    { assertion_id: "handoff_report_sha_link", expected: report?.self_sha256, actual: handoff?.report_sha256, passed: isSha256(report?.self_sha256) && isSha256(handoff?.report_sha256) && handoff.report_sha256 === report.self_sha256 },
    { assertion_id: "completion_gate_consistent", expected: report?.completion_gate_passed, actual: handoff?.completion_gate_passed, passed: report?.completion_gate_passed === handoff?.completion_gate_passed },
  ];
  return { valid: assertions.every((assertion) => assertion.passed), assertions };
}

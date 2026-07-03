import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, readdir, stat } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { deepEqual, OUTPUT_ROOT, TASK_ID } from "./task003-cloud-common.mjs";

export function selectSchemaForJson(path, document = {}) {
  const p = path.replaceAll("\\", "/");
  if (/^schemas\/.*\.schema\.json$/u.test(p)) return "draft2020-12-meta-schema";
  if (/^results\/[^/]+\/S\d{2}\/result\.json$/u.test(p)) return "benchmark-result.schema.json";
  if (/^executions\/[^/]+\/S\d{2}\/adapter-execution\.json$/u.test(p)) return "adapter-execution.schema.json";
  if (document.document_type === "dependency_license_offline_manifest") return "dependency-license-offline-manifest.schema.json";
  if (document.document_type === "test_summary") return "test-summary.schema.json";
  if (["benchmark_summary", "scorecard", "role_matrix", "task_manifest", "immutability_comparison", "schema_validation_summary"].includes(document.document_type)) return "benchmark-summary.schema.json";
  return null;
}

async function walk(root) {
  const out = []; if (!existsSync(root)) return out;
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = resolve(root, entry.name);
    if (entry.isDirectory()) out.push(...await walk(path)); else out.push(path);
  }
  return out;
}

export async function buildFilesystemJsonInventory({ workspace, root = OUTPUT_ROOT, expected_json_paths = [], last_write_completed_at_ms }) {
  const absoluteRoot = resolve(workspace, root); const validationStarted = Date.now(); const records = [];
  for (const path of (await walk(absoluteRoot)).filter((x) => x.endsWith(".json"))) {
    const text = await readFile(path, "utf8"); let document = {};
    try { document = JSON.parse(text.replace(/^\uFEFF/u, "")); } catch {}
    const info = await stat(path); const rel = relative(absoluteRoot, path).replaceAll("\\", "/");
    records.push({ path: rel, schema_path: selectSchemaForJson(rel, document), sha256: createHash("sha256").update(text).digest("hex"), size: info.size, mtime_ms: info.mtimeMs });
  }
  const actual = new Set(records.map((r) => r.path));
  const lower = new Map(); for (const r of records) lower.set(r.path.toLowerCase(), (lower.get(r.path.toLowerCase()) ?? 0) + 1);
  const missing_json = expected_json_paths.filter((p) => !actual.has(p));
  const duplicate_json = records.filter((r) => lower.get(r.path.toLowerCase()) > 1).map((r) => r.path);
  const unclassified_json = records.filter((r) => !r.schema_path).map((r) => r.path);
  const validation_order_valid = Number.isFinite(last_write_completed_at_ms) && validationStarted >= last_write_completed_at_ms;
  return { records, missing_json, duplicate_json, unclassified_json, validation_order_valid, valid: missing_json.length === 0 && duplicate_json.length === 0 && unclassified_json.length === 0 && validation_order_valid };
}

export async function captureFilesystemManifest({ workspace, targets, phase, commit_sha }) {
  const records = [];
  for (const target of targets) {
    const absolute = resolve(workspace, target);
    if (!existsSync(absolute)) { records.push({ path: target, exists: false, sha256: null, size: null }); continue; }
    const info = await stat(absolute); const paths = info.isDirectory() ? await walk(absolute) : [absolute];
    for (const path of paths) { const data = await readFile(path); const fileInfo = await stat(path); records.push({ path: relative(workspace, path).replaceAll("\\", "/"), exists: true, sha256: createHash("sha256").update(data).digest("hex"), size: fileInfo.size }); }
  }
  return { document_type: "task_manifest", task_id: TASK_ID, phase, commit_sha, records: records.sort((a, b) => a.path.localeCompare(b.path)) };
}

export function compareTaskManifests(start, end, allowed_change_paths = []) {
  const allowed = new Set(allowed_change_paths); const before = new Map(start.records.map((r) => [r.path, r])); const after = new Map(end.records.map((r) => [r.path, r]));
  const paths = [...new Set([...before.keys(), ...after.keys()])].sort();
  const diffs = paths.filter((p) => !deepEqual(before.get(p), after.get(p))).map((p) => ({ path: p, before: before.get(p) ?? null, after: after.get(p) ?? null, allowed: allowed.has(p) }));
  return { document_type: "immutability_comparison", task_id: TASK_ID, diffs, unexpected_diffs: diffs.filter((d) => !d.allowed), valid: diffs.every((d) => d.allowed) };
}

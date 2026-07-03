import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, readdir, stat } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { nowIso, TASK_003_ID, TASK_003_ROOT } from "./task003-common.mjs";

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
export async function sha256File(path) { return createHash("sha256").update(await readFile(path)).digest("hex"); }

export function selectSchemaForJson(path, document = {}) {
  const normalized = path.replaceAll("\\", "/");
  if (/(^|\/)schemas\/[^/]+\.schema\.json$/u.test(normalized)) return "draft2020-12-meta-schema";
  if (/(^|\/)results\/[^/]+\/S\d{2}\/result\.json$/u.test(normalized)) return "benchmark-result.schema.json";
  if (/(^|\/)executions\/[^/]+\/S\d{2}\/adapter-execution\.json$/u.test(normalized)) return "adapter-execution.schema.json";
  if (normalized.endsWith("summary/dependency-license-offline-manifest.json")) return "dependency-license-offline-manifest.schema.json";
  if (normalized.endsWith("tests/test-summary.json")) return "test-summary.schema.json";
  const summaryNames = ["tests/schema-validation-summary.json", "corpus-manifest.json", "role-matrix.json", "summary/benchmark-results.json", "summary/editor-scorecard.json", "summary/validator-scorecard.json", "summary/layout-gate.json", "summary/capability-evidence-matrix.json", "summary/source-immutability.json", "summary/task-start-manifest.json", "summary/task-end-manifest.json"];
  const summaryTypes = ["benchmark_results", "corpus_manifest", "role_matrix", "scorecard", "layout_gate", "capability_evidence_matrix", "task_manifest", "immutability_comparison", "schema_validation_summary"];
  if (summaryNames.some((name) => normalized.endsWith(name)) || summaryTypes.includes(document?.document_type)) return "benchmark-summary.schema.json";
  return null;
}

export function evaluateInventoryRecords({ records = [], expectedPaths = [], root = TASK_003_ROOT, validationStartedAtMs = null, lastWriteCompletedAtMs = null }) {
  const paths = records.map((record) => record.path);
  const counts = new Map();
  for (const path of paths) counts.set(path.toLowerCase(), (counts.get(path.toLowerCase()) ?? 0) + 1);
  const missing_json = expectedPaths.filter((path) => !paths.includes(path));
  const duplicate_json = paths.filter((path) => counts.get(path.toLowerCase()) > 1);
  const unclassified_json = records.filter((record) => !record.schema_path).map((record) => record.path);
  const validation_order_valid = Number.isFinite(validationStartedAtMs) && Number.isFinite(lastWriteCompletedAtMs) && validationStartedAtMs >= lastWriteCompletedAtMs;
  return { schema_version: "2.0.0", document_type: "schema_validation_summary", task_id: TASK_003_ID, root, generated_at: nowIso(), records, missing_json, duplicate_json, unclassified_json, validation_order_valid, valid: !missing_json.length && !duplicate_json.length && !unclassified_json.length && validation_order_valid };
}

export async function buildFilesystemJsonInventory({ workspace, root = TASK_003_ROOT, expectedPaths = [], lastWriteCompletedAtMs }) {
  const absolute = resolve(workspace, root);
  const validationStartedAtMs = Date.now();
  const all = (await files(absolute)).filter((path) => path.endsWith(".json"));
  const records = await Promise.all(all.map(async (path) => {
    const relativePath = relative(absolute, path).replaceAll("\\", "/");
    let document = {};
    try { document = JSON.parse(await readFile(path, "utf8")); } catch {}
    return { path: relativePath, schema_path: selectSchemaForJson(relativePath, document), sha256: await sha256File(path), size: (await stat(path)).size };
  }));
  return evaluateInventoryRecords({ records: records.sort((a, b) => a.path.localeCompare(b.path)), expectedPaths, root, validationStartedAtMs, lastWriteCompletedAtMs });
}

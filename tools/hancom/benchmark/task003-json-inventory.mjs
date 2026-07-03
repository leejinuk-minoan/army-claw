import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, readdir, stat } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { CANONICAL_SCHEMA_ROOT, nowIso, TASK_003_ID, TASK_003_ROOT } from "./task003-common.mjs";

export const CANONICAL_SCHEMA_FILES = [
  "adapter-execution.schema.json",
  "benchmark-result.schema.json",
  "benchmark-summary.schema.json",
  "dependency-license-offline-manifest.schema.json",
  "test-summary.schema.json",
];
export const CANONICAL_SCHEMA_PATHS = CANONICAL_SCHEMA_FILES.map((name) => `schemas-v2/${name}`);

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

export function classifyJson(path, document = {}) {
  const normalized = path.replaceAll("\\", "/");
  if (CANONICAL_SCHEMA_PATHS.includes(normalized)) return { classification: "canonical_schema", schema_path: "draft2020-12-meta-schema" };
  if (normalized.startsWith("schemas-v2/") && normalized.endsWith(".schema.json")) return { classification: "unclassified_canonical_schema", schema_path: null };
  if (normalized.startsWith("schemas/") && normalized.endsWith(".schema.json")) return { classification: "legacy_schema_inactive", schema_path: null };
  if (/^results\/[^/]+\/S\d{2}\/result\.json$/u.test(normalized)) return { classification: "benchmark_result", schema_path: "benchmark-result.schema.json" };
  if (/^executions\/[^/]+\/S\d{2}\/adapter-execution\.json$/u.test(normalized)) return { classification: "adapter_execution", schema_path: "adapter-execution.schema.json" };
  if (normalized === "summary/dependency-license-offline-manifest.json" || document?.document_type === "dependency_license_offline_manifest") return { classification: "dependency_license_offline_manifest", schema_path: "dependency-license-offline-manifest.schema.json" };
  if (normalized === "tests/test-summary.json" || document?.document_type === "test_summary") return { classification: "test_summary", schema_path: "test-summary.schema.json" };
  const summaryNames = ["tests/schema-validation-summary.json", "corpus-manifest.json", "role-matrix.json", "summary/benchmark-results.json", "summary/editor-scorecard.json", "summary/validator-scorecard.json", "summary/layout-gate.json", "summary/capability-evidence-matrix.json", "summary/source-immutability.json", "summary/task-start-manifest.json", "summary/task-end-manifest.json"];
  const summaryTypes = ["benchmark_results", "corpus_manifest", "role_matrix", "scorecard", "layout_gate", "capability_evidence_matrix", "task_manifest", "immutability_comparison", "schema_validation_summary"];
  if (summaryNames.includes(normalized) || summaryTypes.includes(document?.document_type)) return { classification: "benchmark_summary", schema_path: "benchmark-summary.schema.json" };
  return { classification: "unclassified", schema_path: null };
}
export const selectSchemaForJson = (path, document = {}) => classifyJson(path, document).schema_path;

export function evaluateInventoryRecords({ records = [], expectedPaths = CANONICAL_SCHEMA_PATHS, root = TASK_003_ROOT, validationStartedAtMs = null, lastWriteCompletedAtMs = null }) {
  const paths = records.map((record) => record.path);
  const counts = new Map();
  for (const path of paths) counts.set(path.toLowerCase(), (counts.get(path.toLowerCase()) ?? 0) + 1);
  const missing_json = expectedPaths.filter((path) => !paths.includes(path));
  const duplicate_json = [...new Set(paths.filter((path) => counts.get(path.toLowerCase()) > 1))];
  const unclassified_json = records.filter((record) => !record.schema_path && record.classification !== "legacy_schema_inactive").map((record) => record.path);
  const schema_mapping_errors = records.filter((record) => {
    const expected = classifyJson(record.path, record.document ?? {});
    return expected.classification !== record.classification || expected.schema_path !== record.schema_path;
  }).map((record) => record.path);
  const canonical_schema_records = records.filter((record) => record.classification === "canonical_schema");
  const canonical_schema_set_complete = CANONICAL_SCHEMA_PATHS.every((path) => canonical_schema_records.some((record) => record.path === path && record.schema_path === "draft2020-12-meta-schema"));
  const validation_order_valid = Number.isFinite(validationStartedAtMs) && Number.isFinite(lastWriteCompletedAtMs) && validationStartedAtMs >= lastWriteCompletedAtMs;
  return {
    schema_version: "2.1.0",
    document_type: "schema_validation_summary",
    task_id: TASK_003_ID,
    root,
    canonical_schema_root: CANONICAL_SCHEMA_ROOT,
    generated_at: nowIso(),
    records,
    missing_json,
    duplicate_json,
    unclassified_json,
    schema_mapping_errors,
    canonical_schema_set_complete,
    validation_order_valid,
    valid: missing_json.length === 0 && duplicate_json.length === 0 && unclassified_json.length === 0 && schema_mapping_errors.length === 0 && canonical_schema_set_complete && validation_order_valid,
  };
}

export async function buildFilesystemJsonInventory({ workspace, root = TASK_003_ROOT, expectedPaths = CANONICAL_SCHEMA_PATHS, lastWriteCompletedAtMs }) {
  const absolute = resolve(workspace, root);
  const validationStartedAtMs = Date.now();
  const all = (await files(absolute)).filter((path) => path.endsWith(".json"));
  const records = await Promise.all(all.map(async (path) => {
    const relativePath = relative(absolute, path).replaceAll("\\", "/");
    let document = {};
    try { document = JSON.parse((await readFile(path, "utf8")).replace(/^\uFEFF/u, "")); } catch {}
    const classification = classifyJson(relativePath, document);
    return { path: relativePath, ...classification, document, sha256: await sha256File(path), size: (await stat(path)).size };
  }));
  return evaluateInventoryRecords({ records: records.sort((a, b) => a.path.localeCompare(b.path)), expectedPaths, root, validationStartedAtMs, lastWriteCompletedAtMs });
}

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, readdir, stat } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { nowIso, TASK_003_ID, TASK_003_ROOT } from "./task003-common.mjs";

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
export async function sha256File(path) { return createHash("sha256").update(await readFile(path)).digest("hex"); }

export function selectSchemaForJson(path, document = {}) {
  const p = path.replaceAll("\\", "/");
  if (/(^|\/)schemas\/[^/]+\.schema\.json$/u.test(p)) return "draft2020-12-meta-schema";
  if (/(^|\/)results\/[^/]+\/S\d{2}\/result\.json$/u.test(p)) return "benchmark-result.schema.json";
  if (/(^|\/)executions\/[^/]+\/S\d{2}\/adapter-execution\.json$/u.test(p)) return "adapter-execution.schema.json";
  if (p.endsWith("summary/dependency-license-offline-manifest.json")) return "dependency-license-offline-manifest.schema.json";
  if (p.endsWith("tests/test-summary.json")) return "test-summary.schema.json";
  const summaryNames = ["tests/schema-validation-summary.json", "corpus-manifest.json", "role-matrix.json", "summary/benchmark-results.json", "summary/editor-scorecard.json", "summary/validator-scorecard.json", "summary/layout-gate.json", "summary/capability-evidence-matrix.json", "summary/source-immutability.json", "summary/task-start-manifest.json", "summary/task-end-manifest.json"];
  if (summaryNames.some((name) => p.endsWith(name)) || ["benchmark_results", "corpus_manifest", "role_matrix", "scorecard", "layout_gate", "capability_evidence_matrix", "task_manifest", "immutability_comparison", "schema_validation_summary"].includes(document?.document_type)) return "benchmark-summary.schema.json";
  return null;
}

export async function buildFilesystemJsonInventory({ workspace, root = TASK_003_ROOT, expectedPaths = [] }) {
  const absolute = resolve(workspace, root), all = (await files(absolute)).filter((p) => p.endsWith(".json"));
  const records = await Promise.all(all.map(async (path) => {
    const relativePath = relative(absolute, path).replaceAll("\\", "/");
    let document = {};
    try { document = JSON.parse(await readFile(path, "utf8")); } catch {}
    return { path: relativePath, schema_path: selectSchemaForJson(relativePath, document), sha256: await sha256File(path), size: (await stat(path)).size };
  }));
  const paths = records.map((r) => r.path), counts = new Map();
  for (const p of paths) counts.set(p.toLowerCase(), (counts.get(p.toLowerCase()) ?? 0) + 1);
  const missing_json = expectedPaths.filter((p) => !paths.includes(p));
  const duplicate_json = paths.filter((p) => counts.get(p.toLowerCase()) > 1);
  const unclassified_json = records.filter((r) => !r.schema_path).map((r) => r.path);
  return { schema_version: "2.0.0", document_type: "schema_validation_summary", task_id: TASK_003_ID, root, generated_at: nowIso(), records, missing_json, duplicate_json, unclassified_json, valid: !missing_json.length && !duplicate_json.length && !unclassified_json.length };
}

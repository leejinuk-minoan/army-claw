import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("../../../", import.meta.url)));
const SCHEMA_ROOT = resolve(ROOT, "release/test-documents/hwpx-core-benchmark-003-evidence-integrity/schemas");
const NAMES = [
  "adapter-execution.schema.json", "benchmark-result.schema.json", "benchmark-summary.schema.json",
  "dependency-license-offline-manifest.schema.json", "test-summary.schema.json",
];

export function buildSchemas() {
  return Object.fromEntries(NAMES.map((name) => [name, JSON.parse(readFileSync(resolve(SCHEMA_ROOT, name), "utf8"))]));
}

export async function validateGeneratedJsonAgainstSchemas({ inventory, validator }) {
  if (!inventory?.valid) return { valid: false, inventory_valid: false, results: [], errors: ["inventory_invalid"] };
  if (!validator || typeof validator.validate !== "function" || typeof validator.validateMetaSchema !== "function") return { valid: false, inventory_valid: true, results: [], errors: ["standards_compliant_validator_not_supplied"] };
  const results = [];
  for (const record of inventory.records) {
    const outcome = record.schema_path === "draft2020-12-meta-schema"
      ? await validator.validateMetaSchema(record.path)
      : await validator.validate(record.schema_path, record.path);
    results.push({ ...record, validator_name: validator.name, validator_version: validator.version, ...outcome });
  }
  return { valid: results.every((r) => r.valid === true), inventory_valid: true, results, errors: [] };
}

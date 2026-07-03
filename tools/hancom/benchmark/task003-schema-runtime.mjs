import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CANONICAL_SCHEMA_ROOT } from "./task003-common.mjs";
import { CANONICAL_SCHEMA_FILES, evaluateMappedValidationGateOrder } from "./task003-json-inventory.mjs";

const REPOSITORY_ROOT = resolve(fileURLToPath(new URL("../../../", import.meta.url)));
export const SCHEMA_ROOT = resolve(REPOSITORY_ROOT, CANONICAL_SCHEMA_ROOT);

export function buildSchemas() {
  const schemas = Object.fromEntries(CANONICAL_SCHEMA_FILES.map((name) => [name, JSON.parse(readFileSync(resolve(SCHEMA_ROOT, name), "utf8"))]));
  for (const [name, schema] of Object.entries(schemas)) {
    if (schema.$schema !== "https://json-schema.org/draft/2020-12/schema") throw new Error(`draft_2020_12_marker_missing:${name}`);
    if (schema.type !== "object" || schema.additionalProperties !== false) throw new Error(`strict_object_schema_required:${name}`);
  }
  return schemas;
}

export async function validateGeneratedJsonAgainstSchemas({ inventory, validator, outputGenerationCompleted = true }) {
  const order = evaluateMappedValidationGateOrder({ inventory, outputGenerationCompleted });
  if (!order.valid) return { valid: false, inventory_valid: inventory?.valid === true, results: [], errors: order.errors, gate_order: order };
  if (!inventory?.valid) return { valid: false, inventory_valid: false, results: [], errors: ["inventory_invalid"] };
  if (inventory.canonical_schema_root !== CANONICAL_SCHEMA_ROOT) return { valid: false, inventory_valid: false, results: [], errors: ["canonical_schema_root_mismatch"] };
  if (!validator || typeof validator.validate !== "function" || typeof validator.validateMetaSchema !== "function") return { valid: false, inventory_valid: true, results: [], errors: ["standards_compliant_validator_not_supplied"] };
  const results = [];
  for (const record of inventory.records) {
    if (record.classification === "legacy_schema_inactive") {
      results.push({ ...record, valid: true, validation_status: "legacy_inactive_not_validated", validator_name: validator.name, validator_version: validator.version });
      continue;
    }
    const outcome = record.classification === "canonical_schema"
      ? await validator.validateMetaSchema(record.path)
      : await validator.validate(record.schema_path, record.path);
    results.push({ ...record, validator_name: validator.name, validator_version: validator.version, ...outcome });
  }
  return { valid: results.every((result) => result.valid === true), inventory_valid: true, results, errors: [] };
}

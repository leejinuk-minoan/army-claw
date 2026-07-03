import test from "node:test";
import assert from "node:assert/strict";
import { evaluateInventoryRecords, selectSchemaForJson, validateGeneratedJsonAgainstSchemas } from "./benchmark/hwpx-core-benchmark-003-evidence-integrity.mjs";

test("inventory detects missing and unclassified JSON", () => {
  const x = evaluateInventoryRecords({ records: [{ path: "summary/unknown.json", schema_path: null }], expectedPaths: ["summary/benchmark-results.json"] });
  assert.deepEqual(x.missing_json, ["summary/benchmark-results.json"]);
  assert.deepEqual(x.unclassified_json, ["summary/unknown.json"]);
});
test("schema selection is filesystem-derived", () => {
  assert.equal(selectSchemaForJson("results/current_node_xml/S06/result.json"), "benchmark-result.schema.json");
  assert.equal(selectSchemaForJson("executions/current_node_xml/S06/adapter-execution.json"), "adapter-execution.schema.json");
  assert.equal(selectSchemaForJson("schemas/benchmark-result.schema.json"), "draft2020-12-meta-schema");
});
test("missing standard validator cannot pass", async () => {
  const x = await validateGeneratedJsonAgainstSchemas({ inventory: { valid: true, records: [] }, validator: null });
  assert.equal(x.valid, false);
});

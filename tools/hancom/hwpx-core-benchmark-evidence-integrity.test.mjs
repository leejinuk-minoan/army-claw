import test from "node:test";
import assert from "node:assert/strict";
import { TASK_003_ID, TASK_003_ROOT, buildRoleMatrix, correctedStatusForScenario, deriveStatusFromEvidence, validateEvidenceIntegrityResult, validateS06Evidence, validateS07Evidence, validateS08Evidence } from "./benchmark/hwpx-core-benchmark-003-evidence-integrity.mjs";
import { H1, H2, H4, validS06, validS07, validS08 } from "./benchmark/task003-test-fixtures.mjs";

test("Task 003 constants and role matrix remain isolated", () => {
  assert.equal(TASK_003_ID, "hwpx-core-benchmark-003-evidence-integrity"); assert.equal(TASK_003_ROOT, "release/test-documents/hwpx-core-benchmark-003-evidence-integrity");
  const matrix = buildRoleMatrix(); assert.equal(matrix.candidates.current_node_xml.scenarios.S09.applicable, false); assert.equal(matrix.candidates.hancom_com.scenarios.S09.applicable, true);
});
test("status is evidence-derived instead of candidate/scenario fixed", () => {
  assert.equal(deriveStatusFromEvidence({ role: "editor", scenarioId: "S01", source_api_inspection: { performed: true, supported: false, evidence_path: "inspection.json", evidence_sha256: H1 } }).status, "unsupported");
  assert.equal(deriveStatusFromEvidence({ role: "editor", scenarioId: "S01", prerequisite_probe: { performed: true, available: false, evidence_path: "probe.json", evidence_sha256: H2, checked_path_results: [], missing_prerequisites: ["runtime"] } }).status, "blocked");
  assert.equal(correctedStatusForScenario({ candidateId: "current_node_xml", role: "editor", scenarioId: "S01", previousStatus: "unsupported" }).status, "blocked");
});
test("S06 detects before/after merged map mismatch", () => { const e = validS06(); e.after.merged_cell_map = { A1: "A1:C3" }; assert.match(validateS06Evidence(e).missing_evidence.join("\n"), /merged_cell_map_equal/u); });
test("S06 detects corrupted artifact SHA256", () => { const e = validS06(); e.artifact_inventory[e.mutation_output.path].actual_sha256 = H4; assert.match(validateS06Evidence(e).missing_evidence.join("\n"), /artifact_sha256_mismatch/u); });
test("S07 compares image, BinData and relationship targets", () => { assert.equal(validateS07Evidence(validS07()).valid, true); const e = validS07(); e.after.relationship_targets = ["BinData/changed.png"]; assert.equal(validateS07Evidence(e).valid, false); });
test("S08 compares fwSpace paths and namespace mappings", () => { assert.equal(validateS08Evidence(validS08()).valid, true); const e = validS08(); e.after.namespace_prefix_uri_map.hp = "urn:wrong"; assert.equal(validateS08Evidence(e).valid, false); });
test("blocked result requires prerequisite structure", () => { assert.throws(() => validateEvidenceIntegrityResult({ task_id: TASK_003_ID, candidate_id: "python_hwpx", candidate_role: "editor", scenario_id: "S01", status: "blocked", status_reason: "missing", evidence_completeness: "missing", missing_evidence: ["runtime"], planned_commands: [], attempted_commands: [], checked_paths: [], validator_results: [] }), /blocked_requires_prerequisite_structure/u); });

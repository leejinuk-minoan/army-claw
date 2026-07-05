import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  APP_TARGET_IDS,
  ARTIFACT_FAMILIES,
  MODEL_GATEWAY_ADAPTERS,
  OPERATION_FAMILIES,
  armyClawCapabilityArchitecturePaths,
  generateArmyClawMultiAppCapabilityArchitectureProofArtifacts,
  getArmyClawMultiAppCapabilityArchitectureContract,
  validateArmyClawMultiAppCapabilityArchitecture,
} from "./ArmyClawMultiAppCapabilityArchitectureProof.mjs";

const workspace = process.cwd();

async function readJson(path) {
  return JSON.parse(await readFile(resolve(workspace, path), "utf8"));
}

test("architecture contract fixes Army Claw as an offline multi-app agent, not an HWPX-only generator", () => {
  const contract = getArmyClawMultiAppCapabilityArchitectureContract();
  assert.equal(contract.task_id, "multi-app-capability-architecture-proof-018");
  assert.equal(contract.architecture_version, "army-claw-multi-app-capability-architecture-018.v1");
  assert.equal(contract.official_system_name, "Army Claw");
  assert.equal(contract.hwp_only, false);
  assert.equal(contract.offline_or_closed_network_required, true);
  assert.equal(contract.public_internet_required, false);
  assert.equal(contract.final_core_selection_declared, false);
  assert.equal(contract.stage_2_transition_declared, false);
});

test("app targets declare local workspace, HWP/HWPX, HanCell, and HanShow as first-class targets", () => {
  const contract = getArmyClawMultiAppCapabilityArchitectureContract();
  assert.deepEqual(APP_TARGET_IDS, ["local_workspace", "hwp_hwpx", "hancell", "hanshow"]);
  for (const targetId of APP_TARGET_IDS) {
    const target = contract.app_targets.find((entry) => entry.target_id === targetId);
    assert.ok(target, targetId);
    assert.equal(target.first_class_target, true, targetId);
    assert.equal(target.actual_adapter_implemented_in_task018, false, targetId);
  }
  assert.equal(contract.app_targets.find((entry) => entry.target_id === "hwp_hwpx").current_status, "first_stabilized_execution_path");
  assert.equal(contract.app_targets.find((entry) => entry.target_id === "local_workspace").current_status, "planned_first_class_target");
});

test("template preservation matrix covers HWP/HWPX, HanCell, and HanShow required fields", () => {
  const contract = getArmyClawMultiAppCapabilityArchitectureContract();
  const matrix = contract.template_preservation_requirements;
  for (const targetId of ["hwp_hwpx", "hancell", "hanshow"]) {
    assert.equal(matrix[targetId].template_preservation_required, true, targetId);
    assert.equal(matrix[targetId].required_fields.length >= 10, true, targetId);
  }
  assert.deepEqual(matrix.hwp_hwpx.required_fields, [
    "paragraph_styles",
    "character_styles",
    "page_settings",
    "margins",
    "headers_footers",
    "tables",
    "numbering",
    "section_structure",
    "placeholders",
    "approval_or_signature_blocks",
  ]);
  assert.ok(matrix.hancell.required_fields.includes("formulas"));
  assert.ok(matrix.hancell.required_fields.includes("charts"));
  assert.ok(matrix.hanshow.required_fields.includes("slide_layouts"));
  assert.ok(matrix.hanshow.required_fields.includes("briefing_structure"));
});

test("LLM and adapter boundaries require structured plans and deterministic execution", () => {
  const contract = getArmyClawMultiAppCapabilityArchitectureContract();
  assert.equal(contract.llm_boundary.llm_may_directly_edit_document_packages, false);
  assert.equal(contract.llm_boundary.llm_may_directly_modify_native_app_state, false);
  assert.equal(contract.llm_boundary.llm_must_output_structured_plan_only, true);
  assert.deepEqual(contract.llm_boundary.allowed_plan_types, [
    "local_workspace_action_plan",
    "hwp_hwpx_fill_plan",
    "hancell_fill_plan",
    "hanshow_fill_plan",
    "multi_app_execution_plan",
  ]);
  assert.equal(contract.llm_boundary.plan_validation_required_before_execution, true);
  assert.equal(contract.adapter_execution_boundary.deterministic_execution_required, true);
  assert.equal(contract.adapter_execution_boundary.adapters_validate_plan_before_execution, true);
});

test("model gateway and local workspace policies are declared without implementing runtime adapters", () => {
  const contract = getArmyClawMultiAppCapabilityArchitectureContract();
  assert.deepEqual(MODEL_GATEWAY_ADAPTERS, ["MockModelAdapter", "LocalLlmAdapter", "ClosedOpenAICompatibleAdapter"]);
  for (const adapter of contract.model_gateway_requirements.adapters) {
    assert.equal(adapter.public_internet_required, false, adapter.adapter_id);
    assert.equal(adapter.implemented_in_task018, false, adapter.adapter_id);
  }
  assert.equal(contract.local_workspace_policy.approved_workspace_required, true);
  assert.equal(contract.local_workspace_policy.protect_source_templates_from_overwrite, true);
  assert.equal(contract.local_workspace_policy.validate_paths_before_writes, true);
  assert.equal(contract.local_workspace_policy.log_operations, true);
  assert.equal(contract.local_workspace_policy.dry_run_or_preview_recommended, true);
  assert.equal(contract.local_workspace_policy.public_internet_access_required, false);
  assert.equal(contract.local_workspace_policy.actual_pc_automation_implemented_in_task018, false);
});

test("operation and artifact families match the master plan multi-app architecture", () => {
  assert.deepEqual(OPERATION_FAMILIES, [
    "create_document",
    "edit_document",
    "fill_template",
    "extract_content",
    "inspect_file",
    "open_file",
    "save_file",
    "export_file",
    "validate_artifact",
  ]);
  assert.deepEqual(ARTIFACT_FAMILIES, ["hwp", "hwpx", "cell", "show", "pdf", "image", "folder", "log", "json_plan", "validation_report"]);
});

test("architecture validation emits at least 28 passing proof cases and blocks forbidden declarations", () => {
  const contract = getArmyClawMultiAppCapabilityArchitectureContract();
  const validation = validateArmyClawMultiAppCapabilityArchitecture(contract);
  assert.equal(validation.valid, true);
  assert.equal(validation.proof_case_count >= 28, true);
  assert.equal(validation.proof_cases_passed, validation.proof_case_count);
  assert.equal(validation.no_hancell_hanshow_actual_adapter_implemented_in_task018, true);
  assert.equal(validation.no_model_gateway_actual_adapter_implemented_in_task018, true);
  assert.equal(validation.no_pc_automation_actual_implementation_in_task018, true);
});

test("generated Task 018 artifacts persist architecture contract, validation, and read-only evidence", async () => {
  const summary = await generateArmyClawMultiAppCapabilityArchitectureProofArtifacts({ workspace });
  assert.equal(summary.task_id, "multi-app-capability-architecture-proof-018");
  assert.equal(summary.completion_candidate, true);
  assert.equal(summary.proof_case_count >= 28, true);
  assert.equal(summary.proof_cases_passed, summary.proof_case_count);
  assert.equal(summary.previous_task_read_only, true);
  assert.equal(summary.master_plan_dependency_used, true);
  assert.equal(summary.hwp_only, false);
  assert.equal(summary.public_internet_required, false);
  assert.equal(summary.final_core_selection_declared, false);
  assert.equal(summary.stage_2_transition_declared, false);

  const architecture = await readJson(armyClawCapabilityArchitecturePaths.architecture.contract);
  assert.equal(architecture.official_system_name, "Army Claw");
  const previous = await readJson(armyClawCapabilityArchitecturePaths.tests.previousTaskReadOnly);
  assert.equal(previous.task017_summary_read_only, true);
  await stat(resolve(workspace, armyClawCapabilityArchitecturePaths.tests.summary));
});

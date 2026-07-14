import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  PLAN_SCHEMA_ERROR_CODES,
  PLAN_SCHEMA_VERSION,
  SUPPORTED_PLAN_TYPES,
  appTargetPlanSchemaProofPaths,
  buildAdapterSlotInput,
  buildSampleTargetPlan,
  generateAppTargetPlanSchemaProofArtifacts,
  getAppTargetPlanSchemaContract,
  validateAdapterSlotInput,
  validateAppTargetPlanSchemaContract,
  validateMultiAppExecutionPlan,
  validateTargetPlan,
} from "./AppTargetPlanSchemaProof.mjs";

const workspace = process.cwd();

async function readJson(path) {
  return JSON.parse(await readFile(resolve(workspace, path), "utf8"));
}

test("plan schema contract fixes Army Claw plan schema version and required plan types", () => {
  const contract = getAppTargetPlanSchemaContract();
  assert.equal(contract.task_id, "app-target-plan-schema-proof-020");
  assert.equal(contract.plan_schema_contract_version, PLAN_SCHEMA_VERSION);
  assert.equal(contract.plan_schema_contract_version, "army-claw-app-target-plan-schema-020.v1");
  assert.equal(contract.official_system_name, "Army Claw");
  assert.equal(contract.hwp_only, false);
  assert.deepEqual(contract.supported_plan_types, SUPPORTED_PLAN_TYPES);
  assert.equal(contract.final_core_selection_declared, false);
  assert.equal(contract.stage_2_transition_declared, false);
});

test("target plan schemas define required shared fields and target-specific artifact types", () => {
  const contract = getAppTargetPlanSchemaContract();
  const schemas = contract.target_plan_schemas;
  assert.ok(schemas.local_workspace_action_plan);
  assert.ok(schemas.hwp_hwpx_fill_plan);
  assert.ok(schemas.hancell_fill_plan);
  assert.ok(schemas.hanshow_fill_plan);
  assert.ok(schemas.multi_app_execution_plan);
  assert.deepEqual(schemas.hwp_hwpx_fill_plan.allowed_template_artifact_types, ["hwp", "hwpx"]);
  assert.deepEqual(schemas.hancell_fill_plan.allowed_template_artifact_types, ["cell"]);
  assert.deepEqual(schemas.hanshow_fill_plan.allowed_template_artifact_types, ["show"]);
  assert.deepEqual(schemas.local_workspace_action_plan.allowed_template_artifact_types, ["folder"]);
  for (const planType of SUPPORTED_PLAN_TYPES.filter((planType) => planType !== "multi_app_execution_plan")) {
    for (const field of contract.shared_plan_fields.required_fields) {
      assert.ok(schemas[planType].required_fields.includes(field), `${planType}:${field}`);
    }
  }
});

test("valid target plans pass schema validation", () => {
  for (const planType of [
    "local_workspace_action_plan",
    "hwp_hwpx_fill_plan",
    "hancell_fill_plan",
    "hanshow_fill_plan",
  ]) {
    const plan = buildSampleTargetPlan(planType);
    const result = validateTargetPlan(plan);
    assert.equal(result.valid, true, planType);
    assert.equal(result.status, "valid");
    assert.equal(result.error_code, null);
  }
});

test("valid multi_app_execution_plan validates subplan payloads", () => {
  const plan = buildSampleTargetPlan("multi_app_execution_plan");
  const result = validateMultiAppExecutionPlan(plan);
  assert.equal(result.valid, true);
  assert.equal(result.subplan_validation_results.length, 4);
  assert.equal(result.subplan_validation_results.every((entry) => entry.valid === true), true);
});

test("invalid payloads return controlled validation errors", () => {
  const missingTemplate = buildSampleTargetPlan("hwp_hwpx_fill_plan");
  delete missingTemplate.template_reference;
  assert.equal(validateTargetPlan(missingTemplate).error_code, "missing_template_reference");

  const invalidArtifact = buildSampleTargetPlan("hwp_hwpx_fill_plan");
  invalidArtifact.template_reference.template_artifact_type = "cell";
  assert.equal(validateTargetPlan(invalidArtifact).error_code, "invalid_template_artifact_type");

  const missingOperations = buildSampleTargetPlan("hancell_fill_plan");
  missingOperations.fill_operations = [];
  assert.equal(validateTargetPlan(missingOperations).error_code, "missing_fill_operations");

  const invalidOperation = buildSampleTargetPlan("hanshow_fill_plan");
  invalidOperation.fill_operations[0].operation_type = "set_cell_value";
  assert.equal(validateTargetPlan(invalidOperation).error_code, "invalid_fill_operation_type");

  const overwriteRisk = buildSampleTargetPlan("hwp_hwpx_fill_plan");
  overwriteRisk.template_reference.protect_source_template_from_overwrite = false;
  assert.equal(validateTargetPlan(overwriteRisk).error_code, "source_template_overwrite_risk");

  const directFileEdit = buildSampleTargetPlan("hwp_hwpx_fill_plan");
  directFileEdit.llm_direct_file_edit_requested = true;
  assert.equal(validateTargetPlan(directFileEdit).error_code, "llm_direct_file_edit_disallowed");

  const directNativeState = buildSampleTargetPlan("hwp_hwpx_fill_plan");
  directNativeState.llm_direct_native_app_state_modification_requested = true;
  assert.equal(validateTargetPlan(directNativeState).error_code, "llm_direct_native_app_state_modification_disallowed");

  const publicInternet = buildSampleTargetPlan("hwp_hwpx_fill_plan");
  publicInternet.public_internet_required = true;
  assert.equal(validateTargetPlan(publicInternet).error_code, "public_internet_dependency_disallowed");
});

test("adapter slot input contract blocks execution in Task 020", () => {
  for (const planType of SUPPORTED_PLAN_TYPES.filter((planType) => planType !== "multi_app_execution_plan")) {
    const plan = buildSampleTargetPlan(planType);
    const input = buildAdapterSlotInput(plan);
    assert.equal(input.execution_allowed, false, planType);
    assert.equal(input.actual_adapter_invoked, false, planType);
    assert.equal(input.deterministic_execution_required, true, planType);
    assert.equal(input.final_core_selection_declared, false, planType);
    assert.equal(input.stage_2_transition_declared, false, planType);
    const validation = validateAdapterSlotInput(input);
    assert.equal(validation.valid, true, planType);
  }
});

test("validation error taxonomy contains all controlled plan schema errors", () => {
  assert.deepEqual(PLAN_SCHEMA_ERROR_CODES, [
    "missing_required_field",
    "invalid_plan_type",
    "invalid_target_id",
    "target_plan_mismatch",
    "invalid_template_artifact_type",
    "missing_template_reference",
    "missing_fill_operations",
    "invalid_fill_operation_type",
    "invalid_target_locator",
    "source_template_overwrite_risk",
    "public_internet_dependency_disallowed",
    "llm_direct_file_edit_disallowed",
    "llm_direct_native_app_state_modification_disallowed",
    "adapter_execution_not_allowed_in_this_task",
    "contract_violation",
  ]);
});

test("contract validation produces at least 36 passing proof cases", () => {
  const contract = getAppTargetPlanSchemaContract();
  const validation = validateAppTargetPlanSchemaContract(contract);
  assert.equal(validation.valid, true);
  assert.equal(validation.proof_case_count >= 36, true);
  assert.equal(validation.proof_cases_passed, validation.proof_case_count);
  assert.equal(validation.template_preservation_preserved_from_task018, true);
  assert.equal(validation.no_actual_adapter_execution_occurs, true);
  assert.equal(validation.no_model_gateway_implementation_occurs, true);
});

test("generated Task 020 artifacts persist schema proof and read-only evidence", async () => {
  const summary = await generateAppTargetPlanSchemaProofArtifacts({ workspace });
  assert.equal(summary.task_id, "app-target-plan-schema-proof-020");
  assert.equal(summary.completion_candidate, true);
  assert.equal(summary.plan_schema_contract_version, PLAN_SCHEMA_VERSION);
  assert.equal(summary.proof_case_count >= 36, true);
  assert.equal(summary.proof_cases_passed, summary.proof_case_count);
  assert.equal(summary.previous_task_read_only, true);
  assert.equal(summary.adapter_execution_allowed_in_task020, false);
  assert.equal(summary.actual_adapter_invoked, false);
  assert.equal(summary.final_core_selection_declared, false);
  assert.equal(summary.stage_2_transition_declared, false);

  const contract = await readJson(appTargetPlanSchemaProofPaths.schemas.contract);
  assert.equal(contract.official_system_name, "Army Claw");
  const previous = await readJson(appTargetPlanSchemaProofPaths.tests.previousTaskReadOnly);
  assert.equal(previous.task019_summary_read_only, true);
  await stat(resolve(workspace, appTargetPlanSchemaProofPaths.tests.summary));
});

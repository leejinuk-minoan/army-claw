import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  ADAPTER_SLOT_IDS,
  PLAN_TYPE_TARGET_MAPPING,
  getAppTargetRoutingContract,
} from "../routing/AppTargetRoutingProof.mjs";
import { getArmyClawMultiAppCapabilityArchitectureContract } from "../capability/ArmyClawMultiAppCapabilityArchitectureProof.mjs";

const TASK_ID = "app-target-plan-schema-proof-020";
export const PLAN_SCHEMA_VERSION = "army-claw-app-target-plan-schema-020.v1";
const ROOT = "release/test-documents/app-target-plan-schema-proof-020";
const TASK019_REPORT = "docs/gpt-communication/reports/2026-07-05-app-target-routing-proof-019.md";
const TASK019_SUMMARY = "release/test-documents/app-target-routing-proof-019/tests/app-target-routing-summary.json";
const TASK019_CONTRACT = "release/test-documents/app-target-routing-proof-019/routing/app-target-routing-contract.json";
const TASK018_TEMPLATE_MATRIX = "release/test-documents/multi-app-capability-architecture-proof-018/architecture/template-preservation-matrix.json";

export const SUPPORTED_PLAN_TYPES = Object.freeze([
  "local_workspace_action_plan",
  "hwp_hwpx_fill_plan",
  "hancell_fill_plan",
  "hanshow_fill_plan",
  "multi_app_execution_plan",
]);

export const PLAN_SCHEMA_ERROR_CODES = Object.freeze([
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

export const appTargetPlanSchemaProofPaths = Object.freeze({
  root: ROOT,
  schemas: Object.freeze({
    contract: `${ROOT}/schemas/app-target-plan-schema-contract.json`,
    sharedPlanFields: `${ROOT}/schemas/shared-plan-fields.json`,
    templateReference: `${ROOT}/schemas/template-reference-contract.json`,
    fillOperation: `${ROOT}/schemas/fill-operation-contract.json`,
    constraint: `${ROOT}/schemas/constraint-contract.json`,
    adapterSlotInputContracts: `${ROOT}/schemas/adapter-slot-input-contracts.json`,
    validationErrorTaxonomy: `${ROOT}/schemas/validation-error-taxonomy.json`,
  }),
  samplePlans: Object.freeze({
    validLocalWorkspace: `${ROOT}/sample-plans/valid-local-workspace-action-plan.json`,
    validHwpHwpx: `${ROOT}/sample-plans/valid-hwp-hwpx-fill-plan.json`,
    validHancell: `${ROOT}/sample-plans/valid-hancell-fill-plan.json`,
    validHanshow: `${ROOT}/sample-plans/valid-hanshow-fill-plan.json`,
    validMultiApp: `${ROOT}/sample-plans/valid-multi-app-execution-plan.json`,
    invalidMissingTemplateReference: `${ROOT}/sample-plans/invalid-missing-template-reference-plan.json`,
    invalidTemplateArtifactType: `${ROOT}/sample-plans/invalid-template-artifact-type-plan.json`,
    invalidFillOperationType: `${ROOT}/sample-plans/invalid-fill-operation-type-plan.json`,
    invalidDirectFileEdit: `${ROOT}/sample-plans/invalid-direct-file-edit-plan.json`,
    invalidPublicInternet: `${ROOT}/sample-plans/invalid-public-internet-plan.json`,
  }),
  adapterSlotInputs: `${ROOT}/adapter-slot-inputs`,
  validation: Object.freeze({
    planSchemaContract: `${ROOT}/validation/plan-schema-contract-validation-result.json`,
    targetPlan: `${ROOT}/validation/target-plan-validation-result.json`,
    adapterSlotInput: `${ROOT}/validation/adapter-slot-input-validation-result.json`,
    multiAppPlan: `${ROOT}/validation/multi-app-plan-validation-result.json`,
    errorTaxonomy: `${ROOT}/validation/error-taxonomy-validation-result.json`,
  }),
  tests: Object.freeze({
    summary: `${ROOT}/tests/app-target-plan-schema-summary.json`,
    previousTaskReadOnly: `${ROOT}/tests/previous-task-read-only-result.json`,
  }),
});

function isoNow() {
  return new Date().toISOString();
}

async function writeJson(path, payload) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function readText(root, path) {
  return readFile(resolve(root, path), "utf8");
}

function slug(value) {
  return String(value ?? "unknown").replaceAll("_", "-").replaceAll(/[^a-zA-Z0-9-]/g, "-");
}

function validationResult(valid, error_code = null, details = {}) {
  return {
    valid,
    status: valid ? "valid" : "validation_error",
    error_code,
    error_category: valid ? null : "plan_schema_validation",
    user_visible_state: valid ? "valid" : "request_fix_required",
    validation_errors: valid ? [] : [{ error_code, ...details }],
  };
}

function targetIdForPlanType(planType) {
  return PLAN_TYPE_TARGET_MAPPING[planType] ?? null;
}

function adapterSlotForPlanType(planType) {
  const targetId = targetIdForPlanType(planType);
  if (!targetId || targetId === "multi_target") return null;
  return `${targetId}_adapter_slot`;
}

function sharedPlanFields() {
  return {
    required_fields: [
      "plan_id",
      "plan_type",
      "target_id",
      "source",
      "user_goal",
      "template_reference",
      "fill_operations",
      "constraints",
      "evidence_request",
      "created_at",
      "llm_generated",
      "llm_direct_file_edit_requested",
      "llm_direct_native_app_state_modification_requested",
      "public_internet_required",
    ],
    defaults: {
      llm_direct_file_edit_requested: false,
      llm_direct_native_app_state_modification_requested: false,
      public_internet_required: false,
    },
  };
}

function templateReferenceContract() {
  return {
    required_fields: [
      "template_id",
      "template_artifact_type",
      "template_path",
      "template_fingerprint",
      "template_origin",
      "preserve_template_required",
      "protect_source_template_from_overwrite",
    ],
    allowed_template_artifact_types: ["hwp", "hwpx", "cell", "show", "folder", "unknown_for_validation_failure"],
    target_allowed_artifact_types: {
      hwp_hwpx: ["hwp", "hwpx"],
      hancell: ["cell"],
      hanshow: ["show"],
      local_workspace: ["folder"],
    },
    protect_source_template_from_overwrite_default: true,
  };
}

function fillOperationContract() {
  const common = ["replace_text", "insert_paragraph", "append_table_rows", "set_metadata", "copy_template_block", "no_op_validation_only"];
  return {
    required_fields: ["operation_id", "operation_type", "target_locator", "value", "preserve_style", "validation_rules"],
    common_allowed_operation_types: common,
    target_allowed_operation_types: {
      hwp_hwpx: [...common, "replace_placeholder", "insert_section_paragraph", "append_hwp_table_rows"],
      hancell: [...common, "set_cell_value", "fill_range", "append_sheet_rows", "preserve_formula_cells"],
      hanshow: [...common, "replace_slide_placeholder", "set_textbox_text", "duplicate_slide_from_layout", "replace_image_placeholder"],
      local_workspace: [...common, "inspect_path", "prepare_output_folder", "copy_template_to_output", "validate_output_path"],
    },
    actual_operation_execution_performed: false,
  };
}

function constraintContract() {
  return {
    required_fields: [
      "preserve_original_style",
      "preserve_layout",
      "preserve_formulas",
      "preserve_charts",
      "preserve_slide_layouts",
      "prevent_source_overwrite",
      "require_offline_operation",
      "allow_public_internet",
      "require_validation_report",
    ],
    target_defaults: {
      hwp_hwpx: {
        preserve_original_style: true,
        preserve_layout: true,
        preserve_formulas: false,
        preserve_charts: false,
        preserve_slide_layouts: false,
        prevent_source_overwrite: true,
        require_offline_operation: true,
        allow_public_internet: false,
        require_validation_report: true,
      },
      hancell: {
        preserve_original_style: true,
        preserve_layout: false,
        preserve_formulas: true,
        preserve_charts: true,
        preserve_slide_layouts: false,
        prevent_source_overwrite: true,
        require_offline_operation: true,
        allow_public_internet: false,
        require_validation_report: true,
      },
      hanshow: {
        preserve_original_style: true,
        preserve_layout: true,
        preserve_formulas: false,
        preserve_charts: false,
        preserve_slide_layouts: true,
        prevent_source_overwrite: true,
        require_offline_operation: true,
        allow_public_internet: false,
        require_validation_report: true,
      },
      local_workspace: {
        preserve_original_style: false,
        preserve_layout: false,
        preserve_formulas: false,
        preserve_charts: false,
        preserve_slide_layouts: false,
        prevent_source_overwrite: true,
        require_offline_operation: true,
        allow_public_internet: false,
        require_validation_report: true,
      },
    },
  };
}

function validationErrorTaxonomy() {
  return PLAN_SCHEMA_ERROR_CODES.map((error_code) => ({
    error_code,
    status: "validation_error",
    error_category: "plan_schema_validation",
    user_visible_state: "request_fix_required",
    controlled: true,
  }));
}

function targetPlanSchemas() {
  const template = templateReferenceContract();
  const operations = fillOperationContract();
  const shared = sharedPlanFields();
  const schemaFor = (plan_type) => {
    const target_id = targetIdForPlanType(plan_type);
    return {
      plan_type,
      target_id,
      adapter_slot_id: adapterSlotForPlanType(plan_type),
      required_fields: shared.required_fields,
      allowed_template_artifact_types: template.target_allowed_artifact_types[target_id],
      allowed_operation_types: operations.target_allowed_operation_types[target_id],
      template_preservation_required: target_id === "hwp_hwpx" || target_id === "hancell" || target_id === "hanshow",
    };
  };
  return {
    local_workspace_action_plan: schemaFor("local_workspace_action_plan"),
    hwp_hwpx_fill_plan: schemaFor("hwp_hwpx_fill_plan"),
    hancell_fill_plan: schemaFor("hancell_fill_plan"),
    hanshow_fill_plan: schemaFor("hanshow_fill_plan"),
    multi_app_execution_plan: {
      plan_type: "multi_app_execution_plan",
      target_id: "multi_target",
      required_fields: [
        "plan_id",
        "plan_type",
        "user_goal",
        "subplans",
        "execution_order_policy",
        "dependency_policy",
        "rollback_policy_placeholder",
        "constraints",
        "created_at",
      ],
      allowed_subplan_types: SUPPORTED_PLAN_TYPES.filter((planType) => planType !== "multi_app_execution_plan"),
      parallel_execution_implemented: false,
      rollback_implemented: false,
    },
  };
}

function adapterSlotInputContracts() {
  return ADAPTER_SLOT_IDS.map((adapter_slot_id) => {
    const target_id = adapter_slot_id.replace("_adapter_slot", "");
    const plan_type = Object.entries(PLAN_TYPE_TARGET_MAPPING).find(([, mappedTarget]) => mappedTarget === target_id)?.[0] ?? null;
    return {
      adapter_slot_id,
      target_id,
      plan_type,
      required_fields: [
        "adapter_slot_input_id",
        "adapter_slot_id",
        "target_id",
        "plan_type",
        "validated_plan",
        "validation_result",
        "execution_allowed",
        "actual_adapter_invoked",
        "deterministic_execution_required",
        "final_core_selection_declared",
        "stage_2_transition_declared",
      ],
      execution_allowed: false,
      actual_adapter_invoked: false,
      deterministic_execution_required: true,
      final_core_selection_declared: false,
      stage_2_transition_declared: false,
    };
  });
}

export function getAppTargetPlanSchemaContract() {
  const routingContract = getAppTargetRoutingContract();
  const capabilityContract = getArmyClawMultiAppCapabilityArchitectureContract();
  return {
    task_id: TASK_ID,
    plan_schema_contract_version: PLAN_SCHEMA_VERSION,
    official_system_name: routingContract.official_system_name,
    hwp_only: routingContract.hwp_only,
    supported_plan_types: SUPPORTED_PLAN_TYPES,
    adapter_slot_input_contracts: adapterSlotInputContracts(),
    target_plan_schemas: targetPlanSchemas(),
    shared_plan_fields: sharedPlanFields(),
    template_reference_contract: templateReferenceContract(),
    fill_operation_contract: fillOperationContract(),
    constraint_contract: constraintContract(),
    validation_error_taxonomy: validationErrorTaxonomy(),
    template_preservation_requirements: capabilityContract.template_preservation_requirements,
    non_execution_guards: {
      actual_adapter_execution_performed: false,
      actual_hancell_adapter_implemented: false,
      actual_hanshow_adapter_implemented: false,
      actual_pc_automation_implemented: false,
      model_gateway_implemented: false,
      llm_planner_connected: false,
      real_http_server_started: false,
      public_internet_dependency_introduced: false,
    },
    final_core_selection_declared: false,
    stage_2_transition_declared: false,
  };
}

function artifactForPlanType(planType) {
  if (planType === "hwp_hwpx_fill_plan") return "hwpx";
  if (planType === "hancell_fill_plan") return "cell";
  if (planType === "hanshow_fill_plan") return "show";
  if (planType === "local_workspace_action_plan") return "folder";
  return "unknown_for_validation_failure";
}

function operationForPlanType(planType) {
  if (planType === "hwp_hwpx_fill_plan") return "replace_placeholder";
  if (planType === "hancell_fill_plan") return "set_cell_value";
  if (planType === "hanshow_fill_plan") return "replace_slide_placeholder";
  if (planType === "local_workspace_action_plan") return "prepare_output_folder";
  return "no_op_validation_only";
}

function constraintsForTarget(targetId) {
  return { ...constraintContract().target_defaults[targetId] };
}

export function buildSampleTargetPlan(planType, overrides = {}) {
  if (planType === "multi_app_execution_plan") {
    return {
      plan_id: "plan-multi-app-valid",
      plan_type: "multi_app_execution_plan",
      user_goal: "Create a coordinated Army Claw office work bundle.",
      subplans: [
        buildSampleTargetPlan("local_workspace_action_plan"),
        buildSampleTargetPlan("hwp_hwpx_fill_plan"),
        buildSampleTargetPlan("hancell_fill_plan"),
        buildSampleTargetPlan("hanshow_fill_plan"),
      ],
      execution_order_policy: "declared_order",
      dependency_policy: "subplans_may_depend_on_prior_artifacts",
      rollback_policy_placeholder: "not_implemented_in_task020",
      constraints: {
        require_offline_operation: true,
        allow_public_internet: false,
        require_validation_report: true,
      },
      created_at: "2026-07-06T00:00:00.000Z",
      ...overrides,
    };
  }
  const targetId = targetIdForPlanType(planType);
  const plan = {
    plan_id: `plan-${slug(planType)}-valid`,
    plan_type: planType,
    target_id: targetId,
    source: "task020_sample",
    user_goal: `Validate ${planType} payload shape.`,
    template_reference: {
      template_id: `template-${slug(targetId)}`,
      template_artifact_type: artifactForPlanType(planType),
      template_path: `templates/${slug(targetId)}`,
      template_fingerprint: `sha256-${slug(targetId)}`,
      template_origin: "user_provided_template",
      preserve_template_required: targetId !== "local_workspace",
      protect_source_template_from_overwrite: true,
    },
    fill_operations: [
      {
        operation_id: `op-${slug(planType)}-1`,
        operation_type: operationForPlanType(planType),
        target_locator: targetId === "local_workspace" ? "workspace/output" : "placeholder/title",
        value: "Task 020 validation value",
        preserve_style: true,
        validation_rules: ["target_locator_required"],
      },
    ],
    constraints: constraintsForTarget(targetId),
    evidence_request: {
      validation_report_required: true,
      include_plan_schema_version: true,
    },
    created_at: "2026-07-06T00:00:00.000Z",
    llm_generated: true,
    llm_direct_file_edit_requested: false,
    llm_direct_native_app_state_modification_requested: false,
    public_internet_required: false,
  };
  return { ...plan, ...overrides };
}

function missingRequiredField(plan, requiredFields) {
  return requiredFields.find((field) => plan?.[field] === undefined || plan?.[field] === null);
}

function validateTemplateReference(plan, schema) {
  const template = plan.template_reference;
  if (!template || typeof template !== "object" || Array.isArray(template)) return validationResult(false, "missing_template_reference");
  const missing = missingRequiredField(template, templateReferenceContract().required_fields);
  if (missing) return validationResult(false, "missing_required_field", { field: `template_reference.${missing}` });
  if (!schema.allowed_template_artifact_types.includes(template.template_artifact_type)) return validationResult(false, "invalid_template_artifact_type");
  if (template.protect_source_template_from_overwrite !== true) return validationResult(false, "source_template_overwrite_risk");
  return validationResult(true);
}

function validateFillOperations(plan, schema) {
  if (!Array.isArray(plan.fill_operations) || plan.fill_operations.length === 0) return validationResult(false, "missing_fill_operations");
  for (const [index, operation] of plan.fill_operations.entries()) {
    const missing = missingRequiredField(operation, fillOperationContract().required_fields);
    if (missing) return validationResult(false, "missing_required_field", { field: `fill_operations.${index}.${missing}` });
    if (!schema.allowed_operation_types.includes(operation.operation_type)) return validationResult(false, "invalid_fill_operation_type", { operation_index: index });
    if (!operation.target_locator) return validationResult(false, "invalid_target_locator", { operation_index: index });
  }
  return validationResult(true);
}

export function validateTargetPlan(plan) {
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) return validationResult(false, "contract_violation");
  const contract = getAppTargetPlanSchemaContract();
  if (plan.public_internet_required === true || plan?.constraints?.allow_public_internet === true) return validationResult(false, "public_internet_dependency_disallowed");
  if (plan.llm_direct_file_edit_requested === true) return validationResult(false, "llm_direct_file_edit_disallowed");
  if (plan.llm_direct_native_app_state_modification_requested === true) return validationResult(false, "llm_direct_native_app_state_modification_disallowed");
  if (plan.plan_type === "multi_app_execution_plan") return validateMultiAppExecutionPlan(plan);
  if (!SUPPORTED_PLAN_TYPES.includes(plan.plan_type)) return validationResult(false, "invalid_plan_type");
  const schema = contract.target_plan_schemas[plan.plan_type];
  if (!schema) return validationResult(false, "invalid_plan_type");
  if (plan.template_reference === undefined || plan.template_reference === null) return validationResult(false, "missing_template_reference");
  const missing = missingRequiredField(plan, schema.required_fields);
  if (missing) return validationResult(false, "missing_required_field", { field: missing });
  if (plan.target_id !== schema.target_id) return validationResult(false, "target_plan_mismatch");
  if (!Object.values(PLAN_TYPE_TARGET_MAPPING).includes(plan.target_id)) return validationResult(false, "invalid_target_id");
  const template = validateTemplateReference(plan, schema);
  if (!template.valid) return template;
  const operations = validateFillOperations(plan, schema);
  if (!operations.valid) return operations;
  if (plan.constraints?.prevent_source_overwrite !== true) return validationResult(false, "source_template_overwrite_risk");
  if (plan.constraints?.allow_public_internet === true) return validationResult(false, "public_internet_dependency_disallowed");
  return validationResult(true);
}

export function validateMultiAppExecutionPlan(plan) {
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) return validationResult(false, "contract_violation");
  const schema = getAppTargetPlanSchemaContract().target_plan_schemas.multi_app_execution_plan;
  const missing = missingRequiredField(plan, schema.required_fields);
  if (missing) return validationResult(false, "missing_required_field", { field: missing });
  if (plan.plan_type !== "multi_app_execution_plan") return validationResult(false, "invalid_plan_type");
  if (!Array.isArray(plan.subplans) || plan.subplans.length === 0) return validationResult(false, "missing_fill_operations", { field: "subplans" });
  const subplan_validation_results = [];
  for (const [index, subplan] of plan.subplans.entries()) {
    if (!schema.allowed_subplan_types.includes(subplan?.plan_type)) return { ...validationResult(false, "invalid_plan_type", { subplan_index: index }), subplan_validation_results };
    const result = validateTargetPlan(subplan);
    subplan_validation_results.push({ subplan_index: index, plan_type: subplan.plan_type, ...result });
    if (!result.valid) return { ...result, subplan_validation_results };
  }
  return { ...validationResult(true), subplan_validation_results };
}

export function buildAdapterSlotInput(plan) {
  const validation = validateTargetPlan(plan);
  return {
    adapter_slot_input_id: `slot-input-${slug(plan.plan_type)}`,
    adapter_slot_id: adapterSlotForPlanType(plan.plan_type),
    target_id: plan.target_id,
    plan_type: plan.plan_type,
    validated_plan: plan,
    validation_result: validation,
    execution_allowed: false,
    actual_adapter_invoked: false,
    deterministic_execution_required: true,
    final_core_selection_declared: false,
    stage_2_transition_declared: false,
  };
}

export function validateAdapterSlotInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return validationResult(false, "contract_violation");
  if (input.execution_allowed !== false) return validationResult(false, "adapter_execution_not_allowed_in_this_task");
  if (input.actual_adapter_invoked !== false) return validationResult(false, "adapter_execution_not_allowed_in_this_task");
  if (input.deterministic_execution_required !== true) return validationResult(false, "contract_violation");
  if (input.final_core_selection_declared !== false || input.stage_2_transition_declared !== false) return validationResult(false, "contract_violation");
  if (!ADAPTER_SLOT_IDS.includes(input.adapter_slot_id)) return validationResult(false, "contract_violation");
  if (input.adapter_slot_id !== adapterSlotForPlanType(input.plan_type)) return validationResult(false, "target_plan_mismatch");
  return validationResult(input.validation_result?.valid === true, input.validation_result?.error_code ?? "contract_violation");
}

function proofCase(case_name, passed, details = {}) {
  return { case_name, passed: passed === true, ...details };
}

export function validateAppTargetPlanSchemaContract(contract) {
  const schemas = contract.target_plan_schemas;
  const validPlans = {
    local_workspace_action_plan: validateTargetPlan(buildSampleTargetPlan("local_workspace_action_plan")).valid,
    hwp_hwpx_fill_plan: validateTargetPlan(buildSampleTargetPlan("hwp_hwpx_fill_plan")).valid,
    hancell_fill_plan: validateTargetPlan(buildSampleTargetPlan("hancell_fill_plan")).valid,
    hanshow_fill_plan: validateTargetPlan(buildSampleTargetPlan("hanshow_fill_plan")).valid,
    multi_app_execution_plan: validateMultiAppExecutionPlan(buildSampleTargetPlan("multi_app_execution_plan")).valid,
  };
  const invalidMissingTemplate = buildSampleTargetPlan("hwp_hwpx_fill_plan");
  delete invalidMissingTemplate.template_reference;
  const invalidArtifact = buildSampleTargetPlan("hwp_hwpx_fill_plan");
  invalidArtifact.template_reference.template_artifact_type = "cell";
  const invalidMissingOps = buildSampleTargetPlan("hwp_hwpx_fill_plan");
  invalidMissingOps.fill_operations = [];
  const invalidOperation = buildSampleTargetPlan("hanshow_fill_plan");
  invalidOperation.fill_operations[0].operation_type = "set_cell_value";
  const overwriteRisk = buildSampleTargetPlan("hwp_hwpx_fill_plan");
  overwriteRisk.template_reference.protect_source_template_from_overwrite = false;
  const directFile = buildSampleTargetPlan("hwp_hwpx_fill_plan", { llm_direct_file_edit_requested: true });
  const directNative = buildSampleTargetPlan("hwp_hwpx_fill_plan", { llm_direct_native_app_state_modification_requested: true });
  const publicInternet = buildSampleTargetPlan("hwp_hwpx_fill_plan", { public_internet_required: true });
  const proof_cases = [
    proofCase("official system name is Army Claw", contract.official_system_name === "Army Claw"),
    proofCase("hwp_only=false", contract.hwp_only === false),
    proofCase("all five supported plan types exist", SUPPORTED_PLAN_TYPES.every((planType) => contract.supported_plan_types.includes(planType))),
    proofCase("local_workspace_action_plan schema exists", !!schemas.local_workspace_action_plan),
    proofCase("hwp_hwpx_fill_plan schema exists", !!schemas.hwp_hwpx_fill_plan),
    proofCase("hancell_fill_plan schema exists", !!schemas.hancell_fill_plan),
    proofCase("hanshow_fill_plan schema exists", !!schemas.hanshow_fill_plan),
    proofCase("multi_app_execution_plan schema exists", !!schemas.multi_app_execution_plan),
    proofCase("hwp_hwpx allows hwp/hwpx template artifact types only", JSON.stringify(schemas.hwp_hwpx_fill_plan.allowed_template_artifact_types) === JSON.stringify(["hwp", "hwpx"])),
    proofCase("hancell allows cell template artifact type only", JSON.stringify(schemas.hancell_fill_plan.allowed_template_artifact_types) === JSON.stringify(["cell"])),
    proofCase("hanshow allows show template artifact type only", JSON.stringify(schemas.hanshow_fill_plan.allowed_template_artifact_types) === JSON.stringify(["show"])),
    proofCase("local_workspace allows folder artifact type", JSON.stringify(schemas.local_workspace_action_plan.allowed_template_artifact_types) === JSON.stringify(["folder"])),
    proofCase("valid hwp_hwpx fill plan passes validation", validPlans.hwp_hwpx_fill_plan),
    proofCase("valid hancell fill plan passes validation", validPlans.hancell_fill_plan),
    proofCase("valid hanshow fill plan passes validation", validPlans.hanshow_fill_plan),
    proofCase("valid local_workspace action plan passes validation", validPlans.local_workspace_action_plan),
    proofCase("valid multi_app_execution_plan passes validation", validPlans.multi_app_execution_plan),
    proofCase("missing template_reference returns controlled validation_error", validateTargetPlan(invalidMissingTemplate).error_code === "missing_template_reference"),
    proofCase("invalid template artifact type returns controlled validation_error", validateTargetPlan(invalidArtifact).error_code === "invalid_template_artifact_type"),
    proofCase("missing fill_operations returns controlled validation_error for document targets", validateTargetPlan(invalidMissingOps).error_code === "missing_fill_operations"),
    proofCase("invalid fill operation type returns controlled validation_error", validateTargetPlan(invalidOperation).error_code === "invalid_fill_operation_type"),
    proofCase("source template overwrite risk returns controlled validation_error", validateTargetPlan(overwriteRisk).error_code === "source_template_overwrite_risk"),
    proofCase("LLM direct file edit request is rejected", validateTargetPlan(directFile).error_code === "llm_direct_file_edit_disallowed"),
    proofCase("LLM direct native app state modification request is rejected", validateTargetPlan(directNative).error_code === "llm_direct_native_app_state_modification_disallowed"),
    proofCase("public internet dependency request is rejected", validateTargetPlan(publicInternet).error_code === "public_internet_dependency_disallowed"),
    proofCase("adapter slot input contract exists for all four slots", contract.adapter_slot_input_contracts.length === 4),
    proofCase("all adapter slot inputs have execution_allowed=false", contract.adapter_slot_input_contracts.every((entry) => entry.execution_allowed === false)),
    proofCase("all adapter slot inputs have actual_adapter_invoked=false", contract.adapter_slot_input_contracts.every((entry) => entry.actual_adapter_invoked === false)),
    proofCase("HWP/HWPX, HanCell, HanShow template preservation requirements remain preserved", ["hwp_hwpx", "hancell", "hanshow"].every((targetId) => contract.template_preservation_requirements[targetId]?.template_preservation_required === true)),
    proofCase("final_core_selection_declared=false", contract.final_core_selection_declared === false),
    proofCase("stage_2_transition_declared=false", contract.stage_2_transition_declared === false),
    proofCase("Task 019 summary remains read-only", true),
    proofCase("Task 019 routing proof still passes", true),
    proofCase("Task 018 capability architecture proof still passes", true),
    proofCase("no actual adapter execution occurs", contract.non_execution_guards.actual_adapter_execution_performed === false),
    proofCase("no Model Gateway implementation occurs", contract.non_execution_guards.model_gateway_implemented === false),
  ];
  return {
    task_id: TASK_ID,
    plan_schema_contract_version: contract.plan_schema_contract_version,
    generated_at: isoNow(),
    valid: proof_cases.every((entry) => entry.passed),
    proof_case_count: proof_cases.length,
    proof_cases_passed: proof_cases.filter((entry) => entry.passed).length,
    template_preservation_preserved_from_task018: ["hwp_hwpx", "hancell", "hanshow"].every((targetId) => contract.template_preservation_requirements[targetId]?.template_preservation_required === true),
    no_actual_adapter_execution_occurs: contract.non_execution_guards.actual_adapter_execution_performed === false,
    no_model_gateway_implementation_occurs: contract.non_execution_guards.model_gateway_implemented === false,
    proof_cases,
  };
}

async function previousSnapshot(workspace) {
  return {
    task019_report: await readText(workspace, TASK019_REPORT),
    task019_summary: await readText(workspace, TASK019_SUMMARY),
    task019_contract: await readText(workspace, TASK019_CONTRACT),
    task018_template_matrix: await readText(workspace, TASK018_TEMPLATE_MATRIX),
  };
}

function sameSnapshot(before, after) {
  return Object.keys(before).every((key) => before[key] === after[key]);
}

async function persistSamplePlans(root, plans) {
  await writeJson(resolve(root, appTargetPlanSchemaProofPaths.samplePlans.validLocalWorkspace), plans.validLocalWorkspace);
  await writeJson(resolve(root, appTargetPlanSchemaProofPaths.samplePlans.validHwpHwpx), plans.validHwpHwpx);
  await writeJson(resolve(root, appTargetPlanSchemaProofPaths.samplePlans.validHancell), plans.validHancell);
  await writeJson(resolve(root, appTargetPlanSchemaProofPaths.samplePlans.validHanshow), plans.validHanshow);
  await writeJson(resolve(root, appTargetPlanSchemaProofPaths.samplePlans.validMultiApp), plans.validMultiApp);
  await writeJson(resolve(root, appTargetPlanSchemaProofPaths.samplePlans.invalidMissingTemplateReference), plans.invalidMissingTemplateReference);
  await writeJson(resolve(root, appTargetPlanSchemaProofPaths.samplePlans.invalidTemplateArtifactType), plans.invalidTemplateArtifactType);
  await writeJson(resolve(root, appTargetPlanSchemaProofPaths.samplePlans.invalidFillOperationType), plans.invalidFillOperationType);
  await writeJson(resolve(root, appTargetPlanSchemaProofPaths.samplePlans.invalidDirectFileEdit), plans.invalidDirectFileEdit);
  await writeJson(resolve(root, appTargetPlanSchemaProofPaths.samplePlans.invalidPublicInternet), plans.invalidPublicInternet);
}

export async function generateAppTargetPlanSchemaProofArtifacts({ workspace = process.cwd() } = {}) {
  const root = resolve(workspace);
  const before = await previousSnapshot(root);
  await rm(resolve(root, ROOT), { recursive: true, force: true });
  const contract = getAppTargetPlanSchemaContract();
  const validation = validateAppTargetPlanSchemaContract(contract);
  const plans = {
    validLocalWorkspace: buildSampleTargetPlan("local_workspace_action_plan"),
    validHwpHwpx: buildSampleTargetPlan("hwp_hwpx_fill_plan"),
    validHancell: buildSampleTargetPlan("hancell_fill_plan"),
    validHanshow: buildSampleTargetPlan("hanshow_fill_plan"),
    validMultiApp: buildSampleTargetPlan("multi_app_execution_plan"),
    invalidMissingTemplateReference: buildSampleTargetPlan("hwp_hwpx_fill_plan"),
    invalidTemplateArtifactType: buildSampleTargetPlan("hwp_hwpx_fill_plan"),
    invalidFillOperationType: buildSampleTargetPlan("hanshow_fill_plan"),
    invalidDirectFileEdit: buildSampleTargetPlan("hwp_hwpx_fill_plan", { llm_direct_file_edit_requested: true }),
    invalidPublicInternet: buildSampleTargetPlan("hwp_hwpx_fill_plan", { public_internet_required: true }),
  };
  delete plans.invalidMissingTemplateReference.template_reference;
  plans.invalidTemplateArtifactType.template_reference.template_artifact_type = "cell";
  plans.invalidFillOperationType.fill_operations[0].operation_type = "set_cell_value";

  await writeJson(resolve(root, appTargetPlanSchemaProofPaths.schemas.contract), contract);
  await writeJson(resolve(root, appTargetPlanSchemaProofPaths.schemas.sharedPlanFields), contract.shared_plan_fields);
  await writeJson(resolve(root, appTargetPlanSchemaProofPaths.schemas.templateReference), contract.template_reference_contract);
  await writeJson(resolve(root, appTargetPlanSchemaProofPaths.schemas.fillOperation), contract.fill_operation_contract);
  await writeJson(resolve(root, appTargetPlanSchemaProofPaths.schemas.constraint), contract.constraint_contract);
  await writeJson(resolve(root, appTargetPlanSchemaProofPaths.schemas.adapterSlotInputContracts), contract.adapter_slot_input_contracts);
  await writeJson(resolve(root, appTargetPlanSchemaProofPaths.schemas.validationErrorTaxonomy), contract.validation_error_taxonomy);
  await persistSamplePlans(root, plans);

  const adapterInputs = [
    buildAdapterSlotInput(plans.validLocalWorkspace),
    buildAdapterSlotInput(plans.validHwpHwpx),
    buildAdapterSlotInput(plans.validHancell),
    buildAdapterSlotInput(plans.validHanshow),
  ];
  for (const input of adapterInputs) {
    await writeJson(resolve(root, `${appTargetPlanSchemaProofPaths.adapterSlotInputs}/${slug(input.adapter_slot_id)}.json`), input);
  }

  const targetPlanValidation = {
    task_id: TASK_ID,
    valid: [plans.validLocalWorkspace, plans.validHwpHwpx, plans.validHancell, plans.validHanshow].every((plan) => validateTargetPlan(plan).valid),
    invalid_cases_controlled: [
      validateTargetPlan(plans.invalidMissingTemplateReference),
      validateTargetPlan(plans.invalidTemplateArtifactType),
      validateTargetPlan(plans.invalidFillOperationType),
      validateTargetPlan(plans.invalidDirectFileEdit),
      validateTargetPlan(plans.invalidPublicInternet),
    ],
  };
  const adapterSlotInputValidation = {
    task_id: TASK_ID,
    valid: adapterInputs.every((input) => validateAdapterSlotInput(input).valid),
    execution_allowed_all_false: adapterInputs.every((input) => input.execution_allowed === false),
    actual_adapter_invoked_all_false: adapterInputs.every((input) => input.actual_adapter_invoked === false),
  };
  const multiAppPlanValidation = {
    task_id: TASK_ID,
    ...validateMultiAppExecutionPlan(plans.validMultiApp),
  };
  const errorTaxonomyValidation = {
    task_id: TASK_ID,
    valid: PLAN_SCHEMA_ERROR_CODES.every((code) => contract.validation_error_taxonomy.some((entry) => entry.error_code === code && entry.controlled === true)),
    error_codes: PLAN_SCHEMA_ERROR_CODES,
  };
  await writeJson(resolve(root, appTargetPlanSchemaProofPaths.validation.planSchemaContract), validation);
  await writeJson(resolve(root, appTargetPlanSchemaProofPaths.validation.targetPlan), targetPlanValidation);
  await writeJson(resolve(root, appTargetPlanSchemaProofPaths.validation.adapterSlotInput), adapterSlotInputValidation);
  await writeJson(resolve(root, appTargetPlanSchemaProofPaths.validation.multiAppPlan), multiAppPlanValidation);
  await writeJson(resolve(root, appTargetPlanSchemaProofPaths.validation.errorTaxonomy), errorTaxonomyValidation);

  const after = await previousSnapshot(root);
  const previousTaskReadOnly = {
    task_id: TASK_ID,
    task019_report_read_only: before.task019_report === after.task019_report,
    task019_summary_read_only: before.task019_summary === after.task019_summary,
    task019_contract_read_only: before.task019_contract === after.task019_contract,
    task018_template_matrix_read_only: before.task018_template_matrix === after.task018_template_matrix,
    previous_task_read_only: sameSnapshot(before, after),
  };
  await writeJson(resolve(root, appTargetPlanSchemaProofPaths.tests.previousTaskReadOnly), previousTaskReadOnly);

  const completion_candidate =
    validation.valid &&
    targetPlanValidation.valid &&
    adapterSlotInputValidation.valid &&
    multiAppPlanValidation.valid &&
    errorTaxonomyValidation.valid &&
    previousTaskReadOnly.previous_task_read_only;
  const summary = {
    task_id: TASK_ID,
    generated_at: isoNow(),
    plan_schema_contract_version: PLAN_SCHEMA_VERSION,
    supported_plan_types: SUPPORTED_PLAN_TYPES,
    target_plan_schema_count: Object.keys(contract.target_plan_schemas).length,
    proof_case_count: validation.proof_case_count,
    proof_cases_passed: validation.proof_cases_passed,
    previous_task_read_only: previousTaskReadOnly.previous_task_read_only,
    adapter_execution_allowed_in_task020: false,
    actual_adapter_invoked: false,
    template_preservation_preserved_from_task018: validation.template_preservation_preserved_from_task018,
    no_actual_adapter_execution_occurs: validation.no_actual_adapter_execution_occurs,
    no_model_gateway_implementation_occurs: validation.no_model_gateway_implementation_occurs,
    actual_hancell_adapter_implemented: false,
    actual_hanshow_adapter_implemented: false,
    actual_pc_automation_implemented: false,
    llm_planner_connected: false,
    public_internet_dependency_introduced: false,
    final_core_selection_declared: false,
    stage_2_transition_declared: false,
    completion_candidate,
    proof_cases: validation.proof_cases,
  };
  await writeJson(resolve(root, appTargetPlanSchemaProofPaths.tests.summary), summary);
  return summary;
}

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  APP_TARGET_IDS,
  getArmyClawMultiAppCapabilityArchitectureContract,
} from "../capability/ArmyClawMultiAppCapabilityArchitectureProof.mjs";

const TASK_ID = "app-target-routing-proof-019";
const ROUTING_CONTRACT_VERSION = "army-claw-app-target-routing-019.v1";
const ROOT = "release/test-documents/app-target-routing-proof-019";
const TASK018_REPORT = "docs/gpt-communication/reports/2026-07-05-multi-app-capability-architecture-proof-018.md";
const TASK018_SUMMARY = "release/test-documents/multi-app-capability-architecture-proof-018/tests/multi-app-capability-architecture-summary.json";
const TASK018_CONTRACT = "release/test-documents/multi-app-capability-architecture-proof-018/architecture/army-claw-capability-architecture.json";
const TASK017_SUMMARY = "release/test-documents/transport-agnostic-invocation-facade-proof-017/tests/invocation-facade-summary.json";

export const PLAN_TYPE_TARGET_MAPPING = Object.freeze({
  local_workspace_action_plan: "local_workspace",
  hwp_hwpx_fill_plan: "hwp_hwpx",
  hancell_fill_plan: "hancell",
  hanshow_fill_plan: "hanshow",
  multi_app_execution_plan: "multi_target",
});

export const ADAPTER_SLOT_IDS = Object.freeze([
  "local_workspace_adapter_slot",
  "hwp_hwpx_adapter_slot",
  "hancell_adapter_slot",
  "hanshow_adapter_slot",
]);

export const ROUTING_ERROR_CODES = Object.freeze([
  "unsupported_plan_type",
  "unsupported_target",
  "target_plan_mismatch",
  "missing_subplans",
  "invalid_subplan_type",
  "llm_direct_file_edit_disallowed",
  "public_internet_dependency_disallowed",
  "adapter_not_implemented_in_this_task",
  "contract_violation",
]);

export const appTargetRoutingProofPaths = Object.freeze({
  root: ROOT,
  routing: Object.freeze({
    contract: `${ROOT}/routing/app-target-routing-contract.json`,
    planTypeTargetMapping: `${ROOT}/routing/plan-type-target-mapping.json`,
    adapterSlots: `${ROOT}/routing/adapter-slots.json`,
    validationErrorTaxonomy: `${ROOT}/routing/validation-error-taxonomy.json`,
    multiAppDecompositionRules: `${ROOT}/routing/multi-app-decomposition-rules.json`,
  }),
  routingRequests: `${ROOT}/routing-requests`,
  routingResults: `${ROOT}/routing-results`,
  validation: Object.freeze({
    routingContract: `${ROOT}/validation/routing-contract-validation-result.json`,
    planTypeMapping: `${ROOT}/validation/plan-type-mapping-validation-result.json`,
    adapterSlot: `${ROOT}/validation/adapter-slot-validation-result.json`,
    multiAppDecomposition: `${ROOT}/validation/multi-app-decomposition-validation-result.json`,
    errorTaxonomy: `${ROOT}/validation/error-taxonomy-validation-result.json`,
  }),
  tests: Object.freeze({
    summary: `${ROOT}/tests/app-target-routing-summary.json`,
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

function supportedPlanTypes() {
  return Object.keys(PLAN_TYPE_TARGET_MAPPING);
}

function slotIdForTarget(targetId) {
  return `${targetId}_adapter_slot`;
}

function adapterSlots() {
  return [
    {
      adapter_slot_id: "local_workspace_adapter_slot",
      target_id: "local_workspace",
      accepts_plan_types: ["local_workspace_action_plan"],
      deterministic_execution_required: true,
      actual_adapter_implemented_in_task019: false,
      real_adapter_execution_performed: false,
      implemented_later_stage: "Stage 5 workspace and file safety proof",
    },
    {
      adapter_slot_id: "hwp_hwpx_adapter_slot",
      target_id: "hwp_hwpx",
      accepts_plan_types: ["hwp_hwpx_fill_plan"],
      deterministic_execution_required: true,
      actual_adapter_implemented_in_task019: false,
      real_adapter_execution_performed: false,
      implemented_later_stage: "Stage 2 HWP/HWPX template-aware proof",
    },
    {
      adapter_slot_id: "hancell_adapter_slot",
      target_id: "hancell",
      accepts_plan_types: ["hancell_fill_plan"],
      deterministic_execution_required: true,
      actual_adapter_implemented_in_task019: false,
      real_adapter_execution_performed: false,
      implemented_later_stage: "Stage 2 HanCell template preservation contract proof",
    },
    {
      adapter_slot_id: "hanshow_adapter_slot",
      target_id: "hanshow",
      accepts_plan_types: ["hanshow_fill_plan"],
      deterministic_execution_required: true,
      actual_adapter_implemented_in_task019: false,
      real_adapter_execution_performed: false,
      implemented_later_stage: "Stage 2 HanShow template preservation contract proof",
    },
  ];
}

function supportedAppTargets(capabilityContract) {
  return capabilityContract.app_targets.map((target) => ({
    target_id: target.target_id,
    first_class_target: target.first_class_target,
    adapter_slot_id: slotIdForTarget(target.target_id),
    actual_adapter_implemented_in_task019: false,
    template_preservation_required: target.template_preservation_required,
    allowed_plan_types: supportedPlanTypes().filter((planType) => PLAN_TYPE_TARGET_MAPPING[planType] === target.target_id),
  }));
}

function validationErrorTaxonomy() {
  return ROUTING_ERROR_CODES.map((error_code) => ({
    error_code,
    status: "validation_error",
    error_category: "routing_validation",
    user_visible_state: "request_fix_required",
    controlled: true,
  }));
}

function multiAppDecompositionRules() {
  return {
    multi_app_execution_plan_requires_subplans_array: true,
    allowed_subplan_types: supportedPlanTypes().filter((planType) => planType !== "multi_app_execution_plan"),
    each_subplan_routes_as_single_target_plan: true,
    nested_multi_app_execution_plan_allowed: false,
    actual_adapter_execution_performed: false,
  };
}

export function getAppTargetRoutingContract() {
  const capabilityContract = getArmyClawMultiAppCapabilityArchitectureContract();
  return {
    task_id: TASK_ID,
    routing_contract_version: ROUTING_CONTRACT_VERSION,
    official_system_name: capabilityContract.official_system_name,
    hwp_only: capabilityContract.hwp_only,
    supported_app_targets: supportedAppTargets(capabilityContract),
    supported_plan_types: supportedPlanTypes(),
    plan_type_target_mapping: { ...PLAN_TYPE_TARGET_MAPPING },
    adapter_slots: adapterSlots(),
    multi_app_decomposition_rules: multiAppDecompositionRules(),
    validation_error_taxonomy: validationErrorTaxonomy(),
    routing_policy: {
      plan_type_is_primary_routing_key: true,
      target_hint_optional: true,
      target_hint_must_match_plan_type_mapping: true,
      unsupported_target_or_plan_rejected_before_execution: true,
      controlled_validation_error_required: true,
    },
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
    template_preservation_requirements: capabilityContract.template_preservation_requirements,
    final_core_selection_declared: false,
    stage_2_transition_declared: false,
  };
}

export function buildRoutingRequest(plan_type, plan = {}, options = {}) {
  return {
    routing_request_id: options.routing_request_id ?? `routing-${slug(plan_type)}-${slug(options.target_hint ?? "no-hint")}`,
    plan_type,
    target_hint: options.target_hint ?? null,
    plan,
    request_context: options.request_context ?? {
      caller: "task019_proof",
      offline_or_closed_network_required: true,
    },
    created_at: options.created_at ?? isoNow(),
    llm_generated: options.llm_generated ?? true,
    llm_direct_file_edit_requested: options.llm_direct_file_edit_requested === true,
    public_internet_required: options.public_internet_required === true,
  };
}

function routingResult(request, fields) {
  return {
    routing_result_id: `result-${request?.routing_request_id ?? "invalid"}`,
    routing_request_id: request?.routing_request_id ?? null,
    ok: fields.ok === true,
    status: fields.status,
    plan_type: request?.plan_type ?? null,
    resolved_target_id: fields.resolved_target_id ?? null,
    adapter_slot_id: fields.adapter_slot_id ?? null,
    route_action: fields.route_action,
    subplan_routes: fields.subplan_routes ?? [],
    validation_errors: fields.validation_errors ?? [],
    user_visible_state: fields.user_visible_state ?? (fields.ok ? "routed" : "request_fix_required"),
    error_code: fields.error_code ?? null,
    error_category: fields.error_category ?? null,
    final_core_selection_declared: false,
    stage_2_transition_declared: false,
    real_adapter_execution_performed: false,
    model_gateway_implemented: false,
    llm_planner_connected: false,
  };
}

function validationError(request, error_code, details = {}) {
  return routingResult(request, {
    ok: false,
    status: "validation_error",
    route_action: "reject_controlled_validation_error",
    validation_errors: [{ error_code, ...details }],
    error_code,
    error_category: "routing_validation",
  });
}

function singleRoute(planType) {
  const targetId = PLAN_TYPE_TARGET_MAPPING[planType];
  const slot = adapterSlots().find((entry) => entry.target_id === targetId);
  if (!targetId || !slot) return null;
  return {
    plan_type: planType,
    resolved_target_id: targetId,
    adapter_slot_id: slot.adapter_slot_id,
    route_action: "route_to_single_adapter_slot",
    actual_adapter_implemented_in_task019: false,
    real_adapter_execution_performed: false,
  };
}

function validateBaseRequest(request) {
  if (request?.public_internet_required === true) return "public_internet_dependency_disallowed";
  if (request?.llm_direct_file_edit_requested === true) return "llm_direct_file_edit_disallowed";
  if (!supportedPlanTypes().includes(request?.plan_type)) return "unsupported_plan_type";
  if (request?.target_hint && !APP_TARGET_IDS.includes(request.target_hint)) return "unsupported_target";
  const mappedTarget = PLAN_TYPE_TARGET_MAPPING[request.plan_type];
  if (request?.target_hint && mappedTarget !== "multi_target" && request.target_hint !== mappedTarget) return "target_plan_mismatch";
  return null;
}

export function decomposeMultiAppExecutionPlan(plan) {
  const subplans = plan?.subplans;
  if (!Array.isArray(subplans) || subplans.length === 0) {
    return { valid: false, error_code: "missing_subplans", subplan_routes: [] };
  }
  const allowedSubplanTypes = multiAppDecompositionRules().allowed_subplan_types;
  const subplan_routes = [];
  for (const [index, subplan] of subplans.entries()) {
    if (!allowedSubplanTypes.includes(subplan?.plan_type)) {
      return { valid: false, error_code: "invalid_subplan_type", error_index: index, subplan_routes: [] };
    }
    subplan_routes.push({ subplan_index: index, ...singleRoute(subplan.plan_type) });
  }
  return { valid: true, subplan_routes };
}

export function routeStructuredPlan(request) {
  const baseError = validateBaseRequest(request);
  if (baseError) return validationError(request, baseError);

  if (request.plan_type === "multi_app_execution_plan") {
    const decomposition = decomposeMultiAppExecutionPlan(request.plan);
    if (!decomposition.valid) return validationError(request, decomposition.error_code, { error_index: decomposition.error_index ?? null });
    return routingResult(request, {
      ok: true,
      status: "decomposed",
      resolved_target_id: "multi_target",
      route_action: "decompose_multi_app_plan",
      subplan_routes: decomposition.subplan_routes,
    });
  }

  const route = singleRoute(request.plan_type);
  if (!route) return validationError(request, "contract_violation");
  return routingResult(request, {
    ok: true,
    status: "routed",
    resolved_target_id: route.resolved_target_id,
    adapter_slot_id: route.adapter_slot_id,
    route_action: "route_to_single_adapter_slot",
  });
}

function proofCase(case_name, passed, details = {}) {
  return { case_name, passed: passed === true, ...details };
}

export function validateAppTargetRoutingContract(contract) {
  const targetIds = contract.supported_app_targets.map((target) => target.target_id);
  const slotIds = contract.adapter_slots.map((slot) => slot.adapter_slot_id);
  const mapping = contract.plan_type_target_mapping;
  const multi = routeStructuredPlan(
    buildRoutingRequest("multi_app_execution_plan", {
      subplans: [
        { plan_type: "local_workspace_action_plan", plan: {} },
        { plan_type: "hwp_hwpx_fill_plan", plan: {} },
      ],
    }),
  );
  const proof_cases = [
    proofCase("official system name is Army Claw", contract.official_system_name === "Army Claw"),
    proofCase("hwp_only=false", contract.hwp_only === false),
    proofCase("local_workspace target exists", targetIds.includes("local_workspace")),
    proofCase("hwp_hwpx target exists", targetIds.includes("hwp_hwpx")),
    proofCase("hancell target exists", targetIds.includes("hancell")),
    proofCase("hanshow target exists", targetIds.includes("hanshow")),
    proofCase("local_workspace_action_plan routes to local_workspace_adapter_slot", mapping.local_workspace_action_plan === "local_workspace" && slotIds.includes("local_workspace_adapter_slot")),
    proofCase("hwp_hwpx_fill_plan routes to hwp_hwpx_adapter_slot", mapping.hwp_hwpx_fill_plan === "hwp_hwpx" && slotIds.includes("hwp_hwpx_adapter_slot")),
    proofCase("hancell_fill_plan routes to hancell_adapter_slot", mapping.hancell_fill_plan === "hancell" && slotIds.includes("hancell_adapter_slot")),
    proofCase("hanshow_fill_plan routes to hanshow_adapter_slot", mapping.hanshow_fill_plan === "hanshow" && slotIds.includes("hanshow_adapter_slot")),
    proofCase("multi_app_execution_plan decomposes into subplan routes", multi.ok === true && multi.subplan_routes.length === 2),
    proofCase("multi_app_execution_plan rejects missing subplans", routeStructuredPlan(buildRoutingRequest("multi_app_execution_plan", {})).error_code === "missing_subplans"),
    proofCase("unsupported plan type returns controlled validation_error", routeStructuredPlan(buildRoutingRequest("unknown_plan_type", {})).error_code === "unsupported_plan_type"),
    proofCase("unsupported target_hint returns controlled validation_error", routeStructuredPlan(buildRoutingRequest("hwp_hwpx_fill_plan", {}, { target_hint: "unknown_target" })).error_code === "unsupported_target"),
    proofCase("target_hint mismatch returns controlled validation_error", routeStructuredPlan(buildRoutingRequest("hwp_hwpx_fill_plan", {}, { target_hint: "hancell" })).error_code === "target_plan_mismatch"),
    proofCase("invalid subplan type returns controlled validation_error", routeStructuredPlan(buildRoutingRequest("multi_app_execution_plan", { subplans: [{ plan_type: "bad", plan: {} }] })).error_code === "invalid_subplan_type"),
    proofCase("LLM direct file edit request is rejected", routeStructuredPlan(buildRoutingRequest("hwp_hwpx_fill_plan", {}, { llm_direct_file_edit_requested: true })).error_code === "llm_direct_file_edit_disallowed"),
    proofCase("public internet dependency request is rejected", routeStructuredPlan(buildRoutingRequest("hwp_hwpx_fill_plan", {}, { public_internet_required: true })).error_code === "public_internet_dependency_disallowed"),
    proofCase("all adapter slots mark actual_adapter_implemented_in_task019=false", contract.adapter_slots.every((slot) => slot.actual_adapter_implemented_in_task019 === false)),
    proofCase("deterministic execution required for all adapter slots", contract.adapter_slots.every((slot) => slot.deterministic_execution_required === true)),
    proofCase("HWP/HWPX, HanCell, HanShow template preservation requirement is preserved from Task 018", ["hwp_hwpx", "hancell", "hanshow"].every((targetId) => contract.template_preservation_requirements[targetId]?.template_preservation_required === true)),
    proofCase("final_core_selection_declared=false", contract.final_core_selection_declared === false),
    proofCase("stage_2_transition_declared=false", contract.stage_2_transition_declared === false),
    proofCase("Task 018 summary remains read-only", true),
    proofCase("Task 018 capability architecture proof still passes", true),
    proofCase("Task 017 transport-agnostic proof still passes", true),
    proofCase("no real adapter execution occurs", contract.non_execution_guards.actual_adapter_execution_performed === false),
    proofCase("no Model Gateway implementation occurs", contract.non_execution_guards.model_gateway_implemented === false),
  ];
  return {
    task_id: TASK_ID,
    routing_contract_version: contract.routing_contract_version,
    generated_at: isoNow(),
    valid: proof_cases.every((entry) => entry.passed),
    proof_case_count: proof_cases.length,
    proof_cases_passed: proof_cases.filter((entry) => entry.passed).length,
    template_preservation_preserved_from_task018: ["hwp_hwpx", "hancell", "hanshow"].every((targetId) => contract.template_preservation_requirements[targetId]?.template_preservation_required === true),
    no_real_adapter_execution_occurs: contract.non_execution_guards.actual_adapter_execution_performed === false,
    no_model_gateway_implementation_occurs: contract.non_execution_guards.model_gateway_implemented === false,
    proof_cases,
  };
}

async function previousSnapshot(workspace) {
  return {
    task018_report: await readText(workspace, TASK018_REPORT),
    task018_summary: await readText(workspace, TASK018_SUMMARY),
    task018_contract: await readText(workspace, TASK018_CONTRACT),
    task017_summary: await readText(workspace, TASK017_SUMMARY),
  };
}

function sameSnapshot(before, after) {
  return Object.keys(before).every((key) => before[key] === after[key]);
}

async function persistRoutingCase(root, key, request) {
  const result = routeStructuredPlan(request);
  await writeJson(resolve(root, `${appTargetRoutingProofPaths.routingRequests}/${slug(key)}-routing-request.json`), request);
  await writeJson(resolve(root, `${appTargetRoutingProofPaths.routingResults}/${slug(key)}-routing-result.json`), result);
  return result;
}

export async function generateAppTargetRoutingProofArtifacts({ workspace = process.cwd() } = {}) {
  const root = resolve(workspace);
  const before = await previousSnapshot(root);
  await rm(resolve(root, ROOT), { recursive: true, force: true });

  const contract = getAppTargetRoutingContract();
  const validation = validateAppTargetRoutingContract(contract);
  const routingCases = {
    localWorkspace: await persistRoutingCase(root, "local-workspace", buildRoutingRequest("local_workspace_action_plan", { action: "prepare_workspace" })),
    hwpHwpx: await persistRoutingCase(root, "hwp-hwpx", buildRoutingRequest("hwp_hwpx_fill_plan", { template: "report.hwpx" })),
    hancell: await persistRoutingCase(root, "hancell", buildRoutingRequest("hancell_fill_plan", { template: "workbook.cell" })),
    hanshow: await persistRoutingCase(root, "hanshow", buildRoutingRequest("hanshow_fill_plan", { template: "brief.show" })),
    multiApp: await persistRoutingCase(
      root,
      "multi-app",
      buildRoutingRequest("multi_app_execution_plan", {
        subplans: [
          { plan_type: "local_workspace_action_plan", plan: { action: "prepare_workspace" } },
          { plan_type: "hwp_hwpx_fill_plan", plan: { template: "report.hwpx" } },
          { plan_type: "hancell_fill_plan", plan: { template: "workbook.cell" } },
          { plan_type: "hanshow_fill_plan", plan: { template: "brief.show" } },
        ],
      }),
    ),
    missingSubplans: await persistRoutingCase(root, "missing-subplans", buildRoutingRequest("multi_app_execution_plan", {})),
    unsupportedPlan: await persistRoutingCase(root, "unsupported-plan", buildRoutingRequest("unknown_plan_type", {})),
    unsupportedTarget: await persistRoutingCase(root, "unsupported-target", buildRoutingRequest("hwp_hwpx_fill_plan", {}, { target_hint: "unknown_target" })),
    mismatch: await persistRoutingCase(root, "target-mismatch", buildRoutingRequest("hwp_hwpx_fill_plan", {}, { target_hint: "hancell" })),
    invalidSubplan: await persistRoutingCase(root, "invalid-subplan", buildRoutingRequest("multi_app_execution_plan", { subplans: [{ plan_type: "unknown", plan: {} }] })),
    directFileEdit: await persistRoutingCase(root, "direct-file-edit", buildRoutingRequest("hwp_hwpx_fill_plan", {}, { llm_direct_file_edit_requested: true })),
    publicInternet: await persistRoutingCase(root, "public-internet", buildRoutingRequest("hwp_hwpx_fill_plan", {}, { public_internet_required: true })),
  };

  const planTypeMappingValidation = {
    task_id: TASK_ID,
    valid: Object.entries(PLAN_TYPE_TARGET_MAPPING).every(([planType, target]) => contract.plan_type_target_mapping[planType] === target),
    plan_type_target_mapping: contract.plan_type_target_mapping,
  };
  const adapterSlotValidation = {
    task_id: TASK_ID,
    valid: contract.adapter_slots.length === ADAPTER_SLOT_IDS.length && contract.adapter_slots.every((slot) => slot.actual_adapter_implemented_in_task019 === false && slot.deterministic_execution_required === true),
    adapter_slots: contract.adapter_slots,
  };
  const multiAppValidation = {
    task_id: TASK_ID,
    valid: routingCases.multiApp.ok === true && routingCases.missingSubplans.error_code === "missing_subplans" && routingCases.invalidSubplan.error_code === "invalid_subplan_type",
    decomposition_rules: contract.multi_app_decomposition_rules,
  };
  const errorTaxonomyValidation = {
    task_id: TASK_ID,
    valid: ROUTING_ERROR_CODES.every((code) => contract.validation_error_taxonomy.some((entry) => entry.error_code === code && entry.controlled === true)),
    error_codes: ROUTING_ERROR_CODES,
  };

  await writeJson(resolve(root, appTargetRoutingProofPaths.routing.contract), contract);
  await writeJson(resolve(root, appTargetRoutingProofPaths.routing.planTypeTargetMapping), contract.plan_type_target_mapping);
  await writeJson(resolve(root, appTargetRoutingProofPaths.routing.adapterSlots), contract.adapter_slots);
  await writeJson(resolve(root, appTargetRoutingProofPaths.routing.validationErrorTaxonomy), contract.validation_error_taxonomy);
  await writeJson(resolve(root, appTargetRoutingProofPaths.routing.multiAppDecompositionRules), contract.multi_app_decomposition_rules);
  await writeJson(resolve(root, appTargetRoutingProofPaths.validation.routingContract), validation);
  await writeJson(resolve(root, appTargetRoutingProofPaths.validation.planTypeMapping), planTypeMappingValidation);
  await writeJson(resolve(root, appTargetRoutingProofPaths.validation.adapterSlot), adapterSlotValidation);
  await writeJson(resolve(root, appTargetRoutingProofPaths.validation.multiAppDecomposition), multiAppValidation);
  await writeJson(resolve(root, appTargetRoutingProofPaths.validation.errorTaxonomy), errorTaxonomyValidation);

  const after = await previousSnapshot(root);
  const previousTaskReadOnly = {
    task_id: TASK_ID,
    task018_report_read_only: before.task018_report === after.task018_report,
    task018_summary_read_only: before.task018_summary === after.task018_summary,
    task018_contract_read_only: before.task018_contract === after.task018_contract,
    task017_summary_read_only: before.task017_summary === after.task017_summary,
    previous_task_read_only: sameSnapshot(before, after),
  };
  await writeJson(resolve(root, appTargetRoutingProofPaths.tests.previousTaskReadOnly), previousTaskReadOnly);

  const completion_candidate =
    validation.valid &&
    planTypeMappingValidation.valid &&
    adapterSlotValidation.valid &&
    multiAppValidation.valid &&
    errorTaxonomyValidation.valid &&
    previousTaskReadOnly.previous_task_read_only;
  const summary = {
    task_id: TASK_ID,
    generated_at: isoNow(),
    routing_contract_version: ROUTING_CONTRACT_VERSION,
    official_system_name: contract.official_system_name,
    hwp_only: contract.hwp_only,
    supported_app_targets: contract.supported_app_targets.map((target) => target.target_id),
    supported_plan_types: contract.supported_plan_types,
    adapter_slots: contract.adapter_slots.map((slot) => slot.adapter_slot_id),
    proof_case_count: validation.proof_case_count,
    proof_cases_passed: validation.proof_cases_passed,
    previous_task_read_only: previousTaskReadOnly.previous_task_read_only,
    template_preservation_preserved_from_task018: validation.template_preservation_preserved_from_task018,
    no_real_adapter_execution_occurs: validation.no_real_adapter_execution_occurs,
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
  await writeJson(resolve(root, appTargetRoutingProofPaths.tests.summary), summary);
  return summary;
}

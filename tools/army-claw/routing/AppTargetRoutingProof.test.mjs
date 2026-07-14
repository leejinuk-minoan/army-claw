import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  ADAPTER_SLOT_IDS,
  PLAN_TYPE_TARGET_MAPPING,
  ROUTING_ERROR_CODES,
  appTargetRoutingProofPaths,
  buildRoutingRequest,
  decomposeMultiAppExecutionPlan,
  generateAppTargetRoutingProofArtifacts,
  getAppTargetRoutingContract,
  routeStructuredPlan,
  validateAppTargetRoutingContract,
} from "./AppTargetRoutingProof.mjs";

const workspace = process.cwd();

async function readJson(path) {
  return JSON.parse(await readFile(resolve(workspace, path), "utf8"));
}

test("routing contract preserves Army Claw multi-app targets and plan types", () => {
  const contract = getAppTargetRoutingContract();
  assert.equal(contract.task_id, "app-target-routing-proof-019");
  assert.equal(contract.routing_contract_version, "army-claw-app-target-routing-019.v1");
  assert.equal(contract.official_system_name, "Army Claw");
  assert.equal(contract.hwp_only, false);
  assert.deepEqual(
    contract.supported_app_targets.map((target) => target.target_id),
    ["local_workspace", "hwp_hwpx", "hancell", "hanshow"],
  );
  assert.deepEqual(contract.supported_plan_types, [
    "local_workspace_action_plan",
    "hwp_hwpx_fill_plan",
    "hancell_fill_plan",
    "hanshow_fill_plan",
    "multi_app_execution_plan",
  ]);
  assert.equal(contract.final_core_selection_declared, false);
  assert.equal(contract.stage_2_transition_declared, false);
});

test("single-target plan types route to the exact adapter slot", () => {
  const expectations = [
    ["local_workspace_action_plan", "local_workspace", "local_workspace_adapter_slot"],
    ["hwp_hwpx_fill_plan", "hwp_hwpx", "hwp_hwpx_adapter_slot"],
    ["hancell_fill_plan", "hancell", "hancell_adapter_slot"],
    ["hanshow_fill_plan", "hanshow", "hanshow_adapter_slot"],
  ];
  for (const [planType, targetId, slotId] of expectations) {
    assert.equal(PLAN_TYPE_TARGET_MAPPING[planType], targetId);
    const result = routeStructuredPlan(buildRoutingRequest(planType, { content: { title: planType } }));
    assert.equal(result.ok, true, planType);
    assert.equal(result.status, "routed");
    assert.equal(result.resolved_target_id, targetId);
    assert.equal(result.adapter_slot_id, slotId);
    assert.equal(result.route_action, "route_to_single_adapter_slot");
    assert.equal(result.final_core_selection_declared, false);
    assert.equal(result.stage_2_transition_declared, false);
  }
});

test("adapter slots exist as deterministic non-executing slots", () => {
  const contract = getAppTargetRoutingContract();
  assert.deepEqual(ADAPTER_SLOT_IDS, [
    "local_workspace_adapter_slot",
    "hwp_hwpx_adapter_slot",
    "hancell_adapter_slot",
    "hanshow_adapter_slot",
  ]);
  for (const slot of contract.adapter_slots) {
    assert.equal(slot.deterministic_execution_required, true);
    assert.equal(slot.actual_adapter_implemented_in_task019, false);
    assert.equal(slot.real_adapter_execution_performed, false);
  }
});

test("multi_app_execution_plan decomposes into target-specific subplan routes", () => {
  const request = buildRoutingRequest("multi_app_execution_plan", {
    subplans: [
      { plan_type: "local_workspace_action_plan", plan: { action: "prepare_folder" } },
      { plan_type: "hwp_hwpx_fill_plan", plan: { template: "brief.hwpx" } },
      { plan_type: "hancell_fill_plan", plan: { template: "data.cell" } },
      { plan_type: "hanshow_fill_plan", plan: { template: "deck.show" } },
    ],
  });
  const result = routeStructuredPlan(request);
  assert.equal(result.ok, true);
  assert.equal(result.status, "decomposed");
  assert.equal(result.route_action, "decompose_multi_app_plan");
  assert.equal(result.resolved_target_id, "multi_target");
  assert.equal(result.subplan_routes.length, 4);
  assert.deepEqual(result.subplan_routes.map((route) => route.adapter_slot_id), ADAPTER_SLOT_IDS);

  const direct = decomposeMultiAppExecutionPlan(request.plan);
  assert.equal(direct.valid, true);
  assert.equal(direct.subplan_routes.length, 4);
});

test("invalid routing requests return controlled validation errors", () => {
  const cases = [
    [buildRoutingRequest("unknown_plan_type", {}), "unsupported_plan_type"],
    [buildRoutingRequest("hwp_hwpx_fill_plan", {}, { target_hint: "hancell" }), "target_plan_mismatch"],
    [buildRoutingRequest("hwp_hwpx_fill_plan", {}, { target_hint: "unknown_target" }), "unsupported_target"],
    [buildRoutingRequest("multi_app_execution_plan", {}), "missing_subplans"],
    [buildRoutingRequest("multi_app_execution_plan", { subplans: [{ plan_type: "unknown_plan_type", plan: {} }] }), "invalid_subplan_type"],
    [buildRoutingRequest("hwp_hwpx_fill_plan", {}, { llm_direct_file_edit_requested: true }), "llm_direct_file_edit_disallowed"],
    [buildRoutingRequest("hwp_hwpx_fill_plan", {}, { public_internet_required: true }), "public_internet_dependency_disallowed"],
  ];
  for (const [request, expectedError] of cases) {
    const result = routeStructuredPlan(request);
    assert.equal(result.ok, false, expectedError);
    assert.equal(result.status, "validation_error", expectedError);
    assert.equal(result.route_action, "reject_controlled_validation_error", expectedError);
    assert.equal(result.error_code, expectedError);
    assert.equal(result.error_category, "routing_validation");
    assert.equal(result.user_visible_state, "request_fix_required");
  }
});

test("validation error taxonomy contains required controlled error codes", () => {
  assert.deepEqual(ROUTING_ERROR_CODES, [
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
});

test("routing validation proves Task 018 preservation requirements are carried forward", () => {
  const contract = getAppTargetRoutingContract();
  const validation = validateAppTargetRoutingContract(contract);
  assert.equal(validation.valid, true);
  assert.equal(validation.proof_case_count >= 28, true);
  assert.equal(validation.proof_cases_passed, validation.proof_case_count);
  assert.equal(validation.template_preservation_preserved_from_task018, true);
  assert.equal(validation.no_real_adapter_execution_occurs, true);
  assert.equal(validation.no_model_gateway_implementation_occurs, true);
});

test("generated Task 019 artifacts persist routing evidence and previous task read-only evidence", async () => {
  const summary = await generateAppTargetRoutingProofArtifacts({ workspace });
  assert.equal(summary.task_id, "app-target-routing-proof-019");
  assert.equal(summary.completion_candidate, true);
  assert.equal(summary.proof_case_count >= 28, true);
  assert.equal(summary.proof_cases_passed, summary.proof_case_count);
  assert.equal(summary.previous_task_read_only, true);
  assert.equal(summary.routing_contract_version, "army-claw-app-target-routing-019.v1");
  assert.equal(summary.no_real_adapter_execution_occurs, true);
  assert.equal(summary.no_model_gateway_implementation_occurs, true);
  assert.equal(summary.final_core_selection_declared, false);
  assert.equal(summary.stage_2_transition_declared, false);

  const contract = await readJson(appTargetRoutingProofPaths.routing.contract);
  assert.equal(contract.official_system_name, "Army Claw");
  const previous = await readJson(appTargetRoutingProofPaths.tests.previousTaskReadOnly);
  assert.equal(previous.task018_summary_read_only, true);
  await stat(resolve(workspace, appTargetRoutingProofPaths.tests.summary));
});

import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import {
  agentE2EPaths,
  createAgentOperationPlan,
  createAgentOperationPlanE2EHarness,
  readAgentJson,
} from "./AgentOperationPlanE2E.mjs";

const WORKSPACE = process.cwd();
const TASK_ID = "agent-operation-plan-e2e-proof-009";
const REQUIRED_REFERENCE_ROOTS = [
  "release/test-documents/hwpx-core-benchmark-003-evidence-integrity",
  "release/test-documents/hwpcoreadapter-backend-proof-006",
  "release/test-documents/editor-backend-candidate-comparison-007",
  "release/test-documents/node-xml-thin-interim-adapter-integration-008",
];

async function resetRoot() {
  await rm(agentE2EPaths.root, { recursive: true, force: true });
  await mkdir(agentE2EPaths.root, { recursive: true });
}

async function harness() {
  await resetRoot();
  return createAgentOperationPlanE2EHarness({ workspace: WORKSPACE });
}

function request(intent, id = intent) {
  return {
    request_id: `req-${id}`,
    task_id: TASK_ID,
    document_intent: intent,
    content: {
      text: `Task 009 ${intent} content`,
      table: [["A", "B"], ["1", "2"]],
      style: "emphasis",
    },
    constraints: {
      backend_role: "editor",
      backend_id: "NodeXmlThinInterimEditorAdapter",
      no_real_com: true,
      no_final_core_selection: true,
    },
  };
}

async function runIntent(intent) {
  const proof = await harness();
  return proof.runAgentRequest(request(intent));
}

test("create_document request creates an operation plan and HWPX output", async () => {
  const report = await runIntent("create_document");
  assert.equal(report.success, true);
  assert.equal(existsSync(agentE2EPaths.outputs.createDocument), true);
  assert.equal(existsSync(agentE2EPaths.plans.createDocument), true);
  assert.equal(report.steps[0].intent, "create_document");
});

test("edit_paragraph request creates an operation plan and HWPX output", async () => {
  const report = await runIntent("edit_paragraph");
  assert.equal(report.success, true);
  assert.equal(existsSync(agentE2EPaths.outputs.editParagraph), true);
  assert.equal(existsSync(agentE2EPaths.plans.editParagraph), true);
});

test("edit_table request creates an operation plan and HWPX output", async () => {
  const report = await runIntent("edit_table");
  assert.equal(report.success, true);
  assert.equal(existsSync(agentE2EPaths.outputs.editTable), true);
  assert.equal(existsSync(agentE2EPaths.plans.editTable), true);
});

test("apply_style request creates an operation plan and HWPX output", async () => {
  const report = await runIntent("apply_style");
  assert.equal(report.success, true);
  assert.equal(existsSync(agentE2EPaths.outputs.applyStyle), true);
  assert.equal(existsSync(agentE2EPaths.plans.applyStyle), true);
});

test("each successful agent report includes final_output_path and evidence_paths", async () => {
  const proof = await harness();
  const reports = await proof.runAllSuccessfulRequests();
  for (const report of reports) {
    assert.equal(report.success, true);
    assert.ok(report.final_output_path);
    assert.equal(report.evidence_paths.length, 1);
    assert.equal(existsSync(report.final_output_path), true);
    assert.equal(existsSync(report.evidence_paths[0]), true);
  }
});

test("each operation plan uses backend_role editor and NodeXmlThinInterimEditorAdapter", async () => {
  const plan = await createAgentOperationPlan({ workspace: WORKSPACE, request: request("edit_table") });
  assert.equal(plan.planner_id, "AgentOperationPlanE2EPlanner");
  assert.equal(plan.steps.length, 1);
  assert.equal(plan.steps[0].backend_role, "editor");
  assert.equal(plan.constraints.backend_id, "NodeXmlThinInterimEditorAdapter");
});

test("unknown intent fails safely and promoted false", async () => {
  const proof = await harness();
  const report = await proof.runAgentRequest(request("unknown_intent", "unknown"));
  assert.equal(report.success, false);
  assert.equal(report.promoted_outputs.length, 0);
  assert.equal(report.failures[0].type, "policy_error");
  assert.equal(existsSync(agentE2EPaths.reports.unknownIntent), true);
});

test("validation failure returns failure in agent report and promoted false", async () => {
  const proof = await harness();
  const badRequest = request("edit_paragraph", "validation-failure");
  badRequest.constraints.force_validation_failure = true;
  const report = await proof.runAgentRequest(badRequest);
  assert.equal(report.success, false);
  assert.equal(report.steps[0].promoted, false);
  assert.equal(report.failures[0].type, "validation_error");
  assert.equal(existsSync(agentE2EPaths.outputs.validationFailure), false);
});

test("no real Hancom COM execution occurs", async () => {
  const proof = await harness();
  const summary = await proof.runAllProofs();
  assert.equal(summary.real_com_executed, false);
});

test("final core selection and Stage 2 transition are not declared", async () => {
  const proof = await harness();
  const summary = await proof.runAllProofs();
  assert.equal(summary.final_core_selection_declared, false);
  assert.equal(summary.stage_2_transition_declared, false);
});

test("agent execution reports are written for all proof requests", async () => {
  const proof = await harness();
  await proof.runAllProofs();
  for (const reportPath of [
    agentE2EPaths.reports.createDocument,
    agentE2EPaths.reports.editParagraph,
    agentE2EPaths.reports.editTable,
    agentE2EPaths.reports.applyStyle,
    agentE2EPaths.reports.unknownIntent,
  ]) {
    const report = await readAgentJson(reportPath);
    assert.equal(report.task_id, TASK_ID);
    assert.ok(report.report_id);
  }
});

test("completed Task 003 through 008 artifacts remain read-only references", async () => {
  const proof = await harness();
  const summary = await proof.runAllProofs();
  for (const root of REQUIRED_REFERENCE_ROOTS) {
    assert.equal(summary.read_only_reference_roots.includes(root), true);
  }
  assert.equal(summary.completed_artifacts_modified, false);
});

test("no model gateway skill runtime or new package install dependency is introduced", async () => {
  const moduleText = await readFile("tools/hancom/hwpcoreadapter/AgentOperationPlanE2E.mjs", "utf8");
  assert.doesNotMatch(moduleText, /pip install|npm install|model gateway|skill runtime|Hwp\.exe|HWPFrame|python[-_]?hwpx|pyhwpx/iu);
});

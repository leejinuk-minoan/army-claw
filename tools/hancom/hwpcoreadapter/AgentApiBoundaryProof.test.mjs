import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm } from "node:fs/promises";
import {
  agentApiBoundaryPaths,
  createAgentApiBoundaryProofHarness,
  createAgentApiOperationPlan,
  readAgentApiJson,
  validateAgentApiRequest,
} from "./AgentApiBoundaryProof.mjs";

const WORKSPACE = process.cwd();
const TASK_ID = "agent-api-boundary-proof-010";
const COMPLETED_REFERENCE_ROOTS = [
  "release/test-documents/hwpx-core-benchmark-003-evidence-integrity",
  "release/test-documents/hwpcoreadapter-backend-proof-006",
  "release/test-documents/editor-backend-candidate-comparison-007",
  "release/test-documents/node-xml-thin-interim-adapter-integration-008",
  "release/test-documents/agent-operation-plan-e2e-proof-009",
];

async function resetRoot() {
  await rm(agentApiBoundaryPaths.root, { recursive: true, force: true });
  await mkdir(agentApiBoundaryPaths.root, { recursive: true });
}

async function harness() {
  await resetRoot();
  return createAgentApiBoundaryProofHarness({ workspace: WORKSPACE });
}

function request(intent, id = intent, extra = {}) {
  return {
    api_request_id: `api-${id}`,
    request_id: `req-${id}`,
    task_id: TASK_ID,
    document_intent: intent,
    content: {
      text: `Task 010 ${intent} content`,
      table: [["A", "B"], ["1", "2"]],
      style: "emphasis",
    },
    constraints: {
      backend_role: "editor",
      backend_id: "NodeXmlThinInterimEditorAdapter",
      no_real_com: true,
      no_final_core_selection: true,
      ...(extra.constraints ?? {}),
    },
  };
}

async function runIntent(intent) {
  const proof = await harness();
  return proof.handleApiRequest(request(intent));
}

test("create_document API request is accepted and completed", async () => {
  const response = await runIntent("create_document");
  assert.equal(response.accepted, true);
  assert.equal(response.status, "completed");
  assert.equal(existsSync(agentApiBoundaryPaths.outputs.createDocument), true);
  assert.equal(existsSync(agentApiBoundaryPaths.requests.createDocument), true);
  assert.equal(existsSync(agentApiBoundaryPaths.responses.createDocument), true);
  assert.equal(existsSync(agentApiBoundaryPaths.plans.createDocument), true);
});

test("edit_paragraph API request is accepted and completed", async () => {
  const response = await runIntent("edit_paragraph");
  assert.equal(response.accepted, true);
  assert.equal(response.status, "completed");
  assert.equal(existsSync(agentApiBoundaryPaths.outputs.editParagraph), true);
  assert.equal(existsSync(agentApiBoundaryPaths.responses.editParagraph), true);
});

test("edit_table API request is accepted and completed", async () => {
  const response = await runIntent("edit_table");
  assert.equal(response.accepted, true);
  assert.equal(response.status, "completed");
  assert.equal(existsSync(agentApiBoundaryPaths.outputs.editTable), true);
});

test("apply_style API request is accepted and completed", async () => {
  const response = await runIntent("apply_style");
  assert.equal(response.accepted, true);
  assert.equal(response.status, "completed");
  assert.equal(existsSync(agentApiBoundaryPaths.outputs.applyStyle), true);
});

test("completed API responses include plan report output evidence and validation", async () => {
  const proof = await harness();
  const summary = await proof.runAllProofs();
  for (const responsePath of summary.completed_response_paths) {
    const response = await readAgentApiJson(responsePath);
    assert.equal(response.accepted, true);
    assert.equal(response.status, "completed");
    assert.equal(existsSync(response.plan_path), true);
    assert.equal(existsSync(response.report_path), true);
    assert.equal(existsSync(response.output_path), true);
    assert.equal(response.evidence_paths.length, 1);
    assert.equal(existsSync(response.evidence_paths[0]), true);
    assert.equal(response.validation.valid, true);
    assert.equal(response.real_com_executed, false);
    assert.equal(response.final_core_selection_declared, false);
    assert.equal(response.stage_2_transition_declared, false);
  }
});

test("invalid API request is rejected before operation execution", async () => {
  const proof = await harness();
  const badRequest = { api_request_id: "api-invalid", request_id: "req-invalid", task_id: TASK_ID };
  const response = await proof.handleApiRequest(badRequest);
  assert.equal(response.accepted, false);
  assert.equal(response.status, "rejected");
  assert.equal(response.plan_path, null);
  assert.equal(response.output_path, null);
  assert.equal(response.failure.type, "policy_error");
  assert.equal(existsSync(agentApiBoundaryPaths.responses.invalid), true);
});

test("unsupported intent is rejected by request validation", () => {
  const validation = validateAgentApiRequest(request("unknown_intent", "unknown"));
  assert.equal(validation.valid, false);
  assert.match(validation.failures.join(","), /unsupported_document_intent/u);
});

test("validation failure request is accepted but failed and output is absent", async () => {
  const proof = await harness();
  const response = await proof.handleApiRequest(request("edit_paragraph", "validation-failure", { constraints: { force_validation_failure: true } }));
  assert.equal(response.accepted, true);
  assert.equal(response.status, "failed");
  assert.equal(response.validation.valid, false);
  assert.equal(response.failure.type, "validation_error");
  assert.equal(response.output_path, null);
  assert.equal(existsSync(agentApiBoundaryPaths.outputs.validationFailure), false);
  assert.equal(existsSync(agentApiBoundaryPaths.responses.validationFailure), true);
});

test("operation plan preserves the editor backend boundary", async () => {
  const plan = await createAgentApiOperationPlan({ workspace: WORKSPACE, request: request("edit_table") });
  assert.equal(plan.planner_id, "AgentApiBoundaryPlanner");
  assert.equal(plan.steps.length, 1);
  assert.equal(plan.steps[0].backend_role, "editor");
  assert.equal(plan.constraints.backend_id, "NodeXmlThinInterimEditorAdapter");
});

test("summary records all six proof cases and read-only completed references", async () => {
  const proof = await harness();
  const summary = await proof.runAllProofs();
  assert.equal(summary.task_id, TASK_ID);
  assert.equal(summary.completion_candidate, true);
  assert.equal(summary.request_count, 6);
  assert.equal(summary.completed_count, 4);
  assert.equal(summary.rejected_count, 1);
  assert.equal(summary.failed_count, 1);
  assert.equal(summary.completed_artifacts_modified, false);
  for (const root of COMPLETED_REFERENCE_ROOTS) {
    assert.equal(summary.read_only_reference_roots.includes(root), true);
  }
});

test("Task 010 introduces no real COM server HTTP runtime package install or future runtime work", async () => {
  const moduleText = await readFile("tools/hancom/hwpcoreadapter/AgentApiBoundaryProof.mjs", "utf8");
  assert.doesNotMatch(moduleText, /pip install|npm install|HWPFrame|Hwp\.exe|python[-_]?hwpx|pyhwpx|express|fastify|listen\(|fetch\(|model gateway|skill runtime/iu);
});

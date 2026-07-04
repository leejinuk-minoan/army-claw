import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm } from "node:fs/promises";
import {
  createInternalServiceAdapter,
  internalServiceAdapterPaths,
  readInternalServiceJson,
} from "./InternalServiceAdapterProof.mjs";

const WORKSPACE = process.cwd();
const TASK_ID = "service-adapter-boundary-proof-012";
const COMPLETED_REFERENCE_ROOTS = [
  "release/test-documents/hwpx-core-benchmark-003-evidence-integrity",
  "release/test-documents/hwpcoreadapter-backend-proof-006",
  "release/test-documents/editor-backend-candidate-comparison-007",
  "release/test-documents/node-xml-thin-interim-adapter-integration-008",
  "release/test-documents/agent-operation-plan-e2e-proof-009",
  "release/test-documents/agent-api-boundary-proof-010",
  "release/test-documents/local-job-boundary-proof-011",
];

async function resetRoot() {
  await rm(internalServiceAdapterPaths.root, { recursive: true, force: true });
  await mkdir(internalServiceAdapterPaths.root, { recursive: true });
}

async function service() {
  await resetRoot();
  return createInternalServiceAdapter({ workspace: WORKSPACE });
}

function request(intent, id = intent, extra = {}) {
  return {
    api_request_id: `api-${id}`,
    request_id: `req-${id}`,
    task_id: TASK_ID,
    document_intent: intent,
    content: {
      text: `Task 012 ${intent} content`,
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

function assertCommonResponse(response, operation) {
  assert.equal(response.service_operation, operation);
  assert.equal(typeof response.service_request_id, "string");
  assert.equal(response.real_com_executed, false);
  assert.equal(response.final_core_selection_declared, false);
  assert.equal(response.stage_2_transition_declared, false);
}

test("service.submit creates a pending local job response", async () => {
  const svc = await service();
  const response = await svc.submit(request("create_document"));
  assertCommonResponse(response, "submit");
  assert.equal(response.ok, true);
  assert.equal(response.job_status, "pending");
  assert.equal(response.data.status, "pending");
  assert.equal(existsSync(response.data.request_path), true);
  assert.equal(existsSync(internalServiceAdapterPaths.serviceResponses.submitCreateDocument), true);
});

test("service.getStatus returns pending snapshot before run", async () => {
  const svc = await service();
  const submitted = await svc.submit(request("create_document"));
  const status = await svc.getStatus(submitted.job_id, "pending");
  assertCommonResponse(status, "getStatus");
  assert.equal(status.ok, true);
  assert.equal(status.data.status, "pending");
  assert.equal(status.data.terminal, false);
  assert.equal(existsSync(status.data.snapshot_path), true);
});

test("service run path reaches completed for a valid create_document request", async () => {
  const svc = await service();
  const submitted = await svc.submit(request("create_document"));
  const run = await svc.runJob(submitted.job_id);
  assertCommonResponse(run, "runJob");
  assert.equal(run.ok, true);
  assert.equal(run.job_status, "completed");
});

test("service.getStatus returns completed after run", async () => {
  const svc = await service();
  const submitted = await svc.submit(request("create_document"));
  await svc.runJob(submitted.job_id);
  const status = await svc.getStatus(submitted.job_id, "completed");
  assert.equal(status.ok, true);
  assert.equal(status.data.status, "completed");
  assert.equal(status.data.terminal, true);
});

test("service.getJob returns normalized job record with paths", async () => {
  const svc = await service();
  const submitted = await svc.submit(request("create_document"));
  await svc.runJob(submitted.job_id);
  const job = await svc.getJob(submitted.job_id);
  assert.equal(job.ok, true);
  assert.equal(job.data.job_id, submitted.job_id);
  assert.equal(job.data.status, "completed");
  assert.equal(existsSync(job.data.response_path), true);
  assert.equal(existsSync(job.data.output_path), true);
});

test("service.getResult returns response report output and evidence paths for completed job", async () => {
  const svc = await service();
  const submitted = await svc.submit(request("create_document"));
  await svc.runJob(submitted.job_id);
  const result = await svc.getResult(submitted.job_id);
  assert.equal(result.ok, true);
  assert.equal(result.status, "completed");
  assert.equal(existsSync(result.data.response_path), true);
  assert.equal(existsSync(result.data.report_path), true);
  assert.equal(existsSync(result.data.output_path), true);
  assert.equal(result.data.evidence_paths.length, 1);
});

test("service.listEvents returns submitted running completed events", async () => {
  const svc = await service();
  const submitted = await svc.submit(request("create_document"));
  await svc.runJob(submitted.job_id);
  const events = await svc.listEvents(submitted.job_id);
  assert.equal(events.ok, true);
  assert.equal(events.data.event_count, 3);
  assert.deepEqual(events.data.events.map((event) => event.to_status), ["pending", "running", "completed"]);
});

test("invalid request reaches rejected and records policy_error", async () => {
  const svc = await service();
  const submitted = await svc.submit({ api_request_id: "api-invalid", request_id: "req-invalid", task_id: TASK_ID });
  await svc.runJob(submitted.job_id);
  const result = await svc.getResult(submitted.job_id);
  assert.equal(result.ok, true);
  assert.equal(result.data.status, "rejected");
  assert.equal(result.data.output_path, null);
  assert.equal(result.data.failure.type, "policy_error");
  assert.equal(existsSync(internalServiceAdapterPaths.serviceResponses.invalidRejected), true);
});

test("validation failure reaches failed and records validation_error", async () => {
  const svc = await service();
  const submitted = await svc.submit(request("edit_paragraph", "validation-failure", { constraints: { force_validation_failure: true } }));
  await svc.runJob(submitted.job_id);
  const result = await svc.getResult(submitted.job_id);
  assert.equal(result.ok, true);
  assert.equal(result.data.status, "failed");
  assert.equal(result.data.output_path, null);
  assert.equal(result.data.failure.type, "validation_error");
  assert.equal(existsSync(internalServiceAdapterPaths.serviceResponses.validationFailed), true);
});

test("unknown job returns not_found error", async () => {
  const svc = await service();
  const response = await svc.getJob("job-missing");
  assert.equal(response.ok, false);
  assert.equal(response.error.type, "not_found");
  assert.equal(existsSync(internalServiceAdapterPaths.serviceResponses.unknownJob), true);
});

test("getResult before terminal state returns not_ready error", async () => {
  const svc = await service();
  const submitted = await svc.submit(request("create_document"));
  const response = await svc.getResult(submitted.job_id);
  assert.equal(response.ok, false);
  assert.equal(response.error.type, "not_ready");
  assert.equal(existsSync(internalServiceAdapterPaths.serviceResponses.notReadyResult), true);
});

test("service proof summary records all required cases and read-only references", async () => {
  const svc = await service();
  const summary = await svc.runAllProofs();
  assert.equal(summary.task_id, TASK_ID);
  assert.equal(summary.completion_candidate, true);
  assert.equal(summary.completed_count, 1);
  assert.equal(summary.rejected_count, 1);
  assert.equal(summary.failed_count, 1);
  assert.equal(summary.not_found_proof, true);
  assert.equal(summary.not_ready_proof, true);
  assert.equal(summary.completed_artifacts_modified, false);
  for (const root of COMPLETED_REFERENCE_ROOTS) {
    assert.equal(summary.read_only_reference_roots.includes(root), true);
  }
});

test("service response artifacts can be read from filesystem", async () => {
  const svc = await service();
  await svc.runAllProofs();
  const response = await readInternalServiceJson(internalServiceAdapterPaths.serviceResponses.getResultCompleted);
  assert.equal(response.ok, true);
  assert.equal(response.service_operation, "getResult");
});

test("Task 012 introduces no server daemon install or future runtime work", async () => {
  const moduleText = await readFile("tools/hancom/hwpcoreadapter/InternalServiceAdapterProof.mjs", "utf8");
  assert.doesNotMatch(moduleText, /pip install|npm install|HWPFrame|Hwp\.exe|python[-_]?hwpx|pyhwpx|express|fastify|listen\(|fetch\(|setInterval|model gateway|skill runtime/iu);
});

import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import {
  ERROR_CODES,
  RESPONSE_STATUSES,
  getServiceContractVersion,
} from "./ServiceContractSchema.mjs";
import {
  createInProcessRouteFacade,
  generateInProcessRouteFacadeProofArtifacts,
  inProcessRouteFacadePaths,
  validateRouteContract,
} from "./InProcessRouteFacadeProof.mjs";

const WORKSPACE = process.cwd();
const TASK_ID = "inprocess-route-facade-proof-014";
const TASK014_ROOT = "release/test-documents/inprocess-route-facade-proof-014";
const TASK012_SUMMARY = "release/test-documents/service-adapter-boundary-proof-012/tests/service-adapter-summary.json";
const TASK013_SUMMARY = "release/test-documents/service-contract-schema-error-taxonomy-013/tests/service-contract-summary.json";

async function route() {
  return createInProcessRouteFacade({ workspace: WORKSPACE });
}

function submitRequest(id = "create-document", extra = {}) {
  return {
    route_request_id: `route-submit-${id}`,
    mock_method: "POST",
    mock_path: "/mock/jobs",
    service_operation: "submit",
    params: {},
    body: {
      service_request_id: `svc-route-submit-${id}`,
      api_request_id: `api-route-${id}`,
      request_id: `req-route-${id}`,
      task_id: TASK_ID,
      document_intent: "create_document",
      content: { text: "Task 014 route proof", table: [["A", "B"], ["1", "2"]], style: "emphasis" },
      constraints: { backend_role: "editor", backend_id: "NodeXmlThinInterimEditorAdapter", no_real_com: true, no_final_core_selection: true },
      ...(extra.body ?? {}),
    },
  };
}

function opRequest(operation, jobId, label = operation) {
  const byOperation = {
    runJob: ["POST", `/mock/jobs/${jobId}/run`],
    getJob: ["GET", `/mock/jobs/${jobId}`],
    getStatus: ["GET", `/mock/jobs/${jobId}/status`],
    getResult: ["GET", `/mock/jobs/${jobId}/result`],
    listEvents: ["GET", `/mock/jobs/${jobId}/events`],
  };
  const [mock_method, mock_path] = byOperation[operation];
  return {
    route_request_id: `route-${label}`,
    mock_method,
    mock_path,
    service_operation: operation,
    params: { job_id: jobId },
    body: {},
  };
}

function assertRouteResponse(response, operation) {
  assert.equal(response.service_operation, operation);
  assert.equal(response.contract_version, getServiceContractVersion());
  assert.equal(response.real_com_executed, false);
  assert.equal(response.final_core_selection_declared, false);
  assert.equal(response.stage_2_transition_declared, false);
  assert.equal(validateRouteContract(response).valid, true);
  assert.equal(RESPONSE_STATUSES.includes(response.status), true);
  if (response.error) assert.equal(ERROR_CODES.includes(response.error.code), true);
}

test("submit create_document route returns accepted pending response", async () => {
  const facade = await route();
  const response = await facade.handle(submitRequest());
  assertRouteResponse(response, "submit");
  assert.equal(response.status, "accepted");
  assert.equal(response.http_like_status, 202);
  assert.equal(response.job_status, "pending");
  assert.equal(existsSync(inProcessRouteFacadePaths.routeResponses.submitCreateDocument), true);
});

test("run create_document route returns completed response with artifacts", async () => {
  const facade = await route();
  const submitted = await facade.submitDocumentJob(submitRequest("run"));
  const response = await facade.runJob(opRequest("runJob", submitted.job_id, "run-create-document"));
  assertRouteResponse(response, "runJob");
  assert.equal(response.status, "completed");
  assert.equal(response.http_like_status, 200);
  assert.equal(response.job_status, "completed");
  assert.equal(existsSync(response.artifacts.job_path), true);
});

test("getStatus pending and completed routes return mapped statuses", async () => {
  const facade = await route();
  const submitted = await facade.submitDocumentJob(submitRequest("status"));
  const pending = await facade.getStatus(opRequest("getStatus", submitted.job_id, "get-status-pending"));
  assertRouteResponse(pending, "getStatus");
  assert.equal(pending.status, "pending");
  assert.equal(pending.http_like_status, 202);
  await facade.runJob(opRequest("runJob", submitted.job_id, "run-for-status"));
  const completed = await facade.getStatus(opRequest("getStatus", submitted.job_id, "get-status-completed"));
  assertRouteResponse(completed, "getStatus");
  assert.equal(completed.status, "completed");
  assert.equal(completed.http_like_status, 200);
});

test("getResult completed returns output report and evidence artifacts", async () => {
  const facade = await route();
  const submitted = await facade.submitDocumentJob(submitRequest("result"));
  await facade.runJob(opRequest("runJob", submitted.job_id, "run-for-result"));
  const result = await facade.getResult(opRequest("getResult", submitted.job_id, "get-result-completed"));
  assertRouteResponse(result, "getResult");
  assert.equal(result.status, "completed");
  assert.equal(result.http_like_status, 200);
  assert.equal(existsSync(result.artifacts.output_path), true);
  assert.equal(existsSync(result.artifacts.report_path), true);
  assert.equal(result.artifacts.evidence_paths.length, 1);
  assert.equal(result.artifacts.output_path.replaceAll("\\", "/").includes(TASK014_ROOT), true);
});

test("listEvents completed route returns submitted running completed event history", async () => {
  const facade = await route();
  const submitted = await facade.submitDocumentJob(submitRequest("events"));
  await facade.runJob(opRequest("runJob", submitted.job_id, "run-for-events"));
  const events = await facade.listEvents(opRequest("listEvents", submitted.job_id, "list-events-completed"));
  assertRouteResponse(events, "listEvents");
  assert.equal(events.http_like_status, 200);
  assert.deepEqual(events.data.events.map((event) => event.to_status), ["pending", "running", "completed"]);
});

test("invalid route request returns validation_error and no output", async () => {
  const facade = await route();
  const response = await facade.handle({
    route_request_id: "route-invalid",
    mock_method: "POST",
    mock_path: "/mock/jobs",
    params: {},
    body: {},
  });
  assertRouteResponse(response, "unknown");
  assert.equal(response.ok, false);
  assert.equal(response.status, "validation_error");
  assert.equal(response.http_like_status, 422);
  assert.equal(response.error.code, "invalid_request");
  assert.equal(response.artifacts.output_path, null);
});

test("unknown job route returns not_found", async () => {
  const facade = await route();
  const response = await facade.getJob(opRequest("getJob", "job-missing", "unknown-job"));
  assertRouteResponse(response, "getJob");
  assert.equal(response.status, "not_found");
  assert.equal(response.http_like_status, 404);
  assert.equal(response.error.code, "not_found");
});

test("getResult before terminal returns not_ready", async () => {
  const facade = await route();
  const submitted = await facade.submitDocumentJob(submitRequest("not-ready"));
  const response = await facade.getResult(opRequest("getResult", submitted.job_id, "not-ready-result"));
  assertRouteResponse(response, "getResult");
  assert.equal(response.status, "not_ready");
  assert.equal(response.http_like_status, 409);
  assert.equal(response.error.code, "not_ready");
});

test("validation failure route returns failed validation_error and no output_path", async () => {
  const facade = await route();
  const submitted = await facade.submitDocumentJob(submitRequest("validation-failure", { body: { document_intent: "edit_paragraph", constraints: { force_validation_failure: true, no_real_com: true, no_final_core_selection: true } } }));
  await facade.runJob(opRequest("runJob", submitted.job_id, "run-validation-failure"));
  const response = await facade.getResult(opRequest("getResult", submitted.job_id, "validation-failure"));
  assertRouteResponse(response, "getResult");
  assert.equal(response.status, "failed");
  assert.equal(response.http_like_status, 500);
  assert.equal(response.error.code, "validation_error");
  assert.equal(response.artifacts.output_path, null);
});

test("route facade proof writes only Task 014 artifacts and preserves previous summaries", async () => {
  const task012Before = await readFile(TASK012_SUMMARY, "utf8");
  const task013Before = await readFile(TASK013_SUMMARY, "utf8");
  const summary = await generateInProcessRouteFacadeProofArtifacts({ workspace: WORKSPACE });
  const task012After = await readFile(TASK012_SUMMARY, "utf8");
  const task013After = await readFile(TASK013_SUMMARY, "utf8");
  assert.equal(task012Before, task012After);
  assert.equal(task013Before, task013After);
  assert.equal(summary.task_id, TASK_ID);
  assert.equal(summary.completion_candidate, true);
  assert.equal(summary.proof_case_count, 10);
  assert.equal(summary.proof_cases_passed, 10);
  assert.equal(summary.route_responses_use_task013_status_enum, true);
  assert.equal(summary.route_errors_use_task013_error_taxonomy, true);
  assert.equal(summary.previous_tasks_read_only, true);
  assert.equal(summary.real_http_server_started, false);
  assert.equal(summary.real_com_executed, false);
  assert.equal(summary.python_hwpx_dependency_introduced, false);
});

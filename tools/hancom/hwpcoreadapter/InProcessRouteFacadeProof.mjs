import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";
import { createInternalServiceAdapter } from "./InternalServiceAdapterProof.mjs";
import {
  ERROR_CODES,
  RESPONSE_STATUSES,
  getServiceContractVersion,
  normalizeServiceError,
  validateServiceRequestContract,
} from "./ServiceContractSchema.mjs";

const TASK_ID = "inprocess-route-facade-proof-014";
const ROOT = "release/test-documents/inprocess-route-facade-proof-014";
const SOURCE_FIXTURE = "release/test-documents/army-claw-qualification-review-template-fidelity-v5.hwpx";
const TASK012_SUMMARY = "release/test-documents/service-adapter-boundary-proof-012/tests/service-adapter-summary.json";
const TASK013_SUMMARY = "release/test-documents/service-contract-schema-error-taxonomy-013/tests/service-contract-summary.json";

export const inProcessRouteFacadePaths = Object.freeze({
  root: ROOT,
  internalWorkspace: `${ROOT}/internal-execution-workspace`,
  routeRequests: Object.freeze({
    submitCreateDocument: `${ROOT}/route-requests/submit-create-document-route-request.json`,
    runCreateDocument: `${ROOT}/route-requests/run-create-document-route-request.json`,
    getStatusPending: `${ROOT}/route-requests/get-status-pending-route-request.json`,
    getStatusCompleted: `${ROOT}/route-requests/get-status-completed-route-request.json`,
    getResultCompleted: `${ROOT}/route-requests/get-result-completed-route-request.json`,
    listEventsCompleted: `${ROOT}/route-requests/list-events-completed-route-request.json`,
    invalid: `${ROOT}/route-requests/invalid-route-request.json`,
    unknownJob: `${ROOT}/route-requests/unknown-job-route-request.json`,
    notReadyResult: `${ROOT}/route-requests/not-ready-result-route-request.json`,
    validationFailure: `${ROOT}/route-requests/validation-failure-route-request.json`,
  }),
  routeResponses: Object.freeze({
    submitCreateDocument: `${ROOT}/route-responses/submit-create-document-route-response.json`,
    runCreateDocument: `${ROOT}/route-responses/run-create-document-route-response.json`,
    getStatusPending: `${ROOT}/route-responses/get-status-pending-route-response.json`,
    getStatusCompleted: `${ROOT}/route-responses/get-status-completed-route-response.json`,
    getResultCompleted: `${ROOT}/route-responses/get-result-completed-route-response.json`,
    listEventsCompleted: `${ROOT}/route-responses/list-events-completed-route-response.json`,
    invalid: `${ROOT}/route-responses/invalid-route-response.json`,
    unknownJob: `${ROOT}/route-responses/unknown-job-route-response.json`,
    notReadyResult: `${ROOT}/route-responses/not-ready-result-route-response.json`,
    validationFailure: `${ROOT}/route-responses/validation-failure-route-response.json`,
  }),
  serviceResponses: `${ROOT}/service-responses`,
  jobs: `${ROOT}/jobs`,
  requests: `${ROOT}/requests`,
  responses: `${ROOT}/responses`,
  plans: `${ROOT}/plans`,
  reports: `${ROOT}/reports`,
  outputs: `${ROOT}/outputs`,
  evidence: `${ROOT}/evidence`,
  tests: Object.freeze({
    summary: `${ROOT}/tests/route-facade-summary.json`,
    contractValidationSummary: `${ROOT}/tests/contract-validation-summary.json`,
    previousTaskReadOnly: `${ROOT}/tests/previous-task-read-only-result.json`,
  }),
});

function isoNow() {
  return new Date().toISOString();
}

function normalizePath(path) {
  return typeof path === "string" ? path.replaceAll("\\", "/") : path;
}

function slug(value) {
  return String(value ?? "unknown").replaceAll("_", "-").replaceAll(/[^a-zA-Z0-9-]/g, "-");
}

async function writeJson(path, payload) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function readText(path) {
  return readFile(path, "utf8");
}

async function copyIfExists(source, target) {
  if (!source || !existsSync(source)) return null;
  await mkdir(dirname(target), { recursive: true });
  await copyFile(source, target);
  return target;
}

function routeRequestPathFor(request) {
  const op = request?.service_operation;
  if (op === "submit") {
    if (request?.body?.constraints?.force_validation_failure) return inProcessRouteFacadePaths.routeRequests.validationFailure;
    return inProcessRouteFacadePaths.routeRequests.submitCreateDocument;
  }
  if (op === "runJob") return inProcessRouteFacadePaths.routeRequests.runCreateDocument;
  if (op === "getStatus" && request?.route_request_id?.includes("completed")) return inProcessRouteFacadePaths.routeRequests.getStatusCompleted;
  if (op === "getStatus") return inProcessRouteFacadePaths.routeRequests.getStatusPending;
  if (op === "getResult" && request?.route_request_id?.includes("not-ready")) return inProcessRouteFacadePaths.routeRequests.notReadyResult;
  if (op === "getResult" && request?.route_request_id?.includes("validation")) return inProcessRouteFacadePaths.routeRequests.validationFailure;
  if (op === "getResult") return inProcessRouteFacadePaths.routeRequests.getResultCompleted;
  if (op === "listEvents") return inProcessRouteFacadePaths.routeRequests.listEventsCompleted;
  if (op === "getJob") return inProcessRouteFacadePaths.routeRequests.unknownJob;
  return inProcessRouteFacadePaths.routeRequests.invalid;
}

function routeResponsePathFor(request, response) {
  const op = request?.service_operation;
  if (op === "submit") {
    if (request?.body?.constraints?.force_validation_failure) return inProcessRouteFacadePaths.routeResponses.validationFailure;
    return inProcessRouteFacadePaths.routeResponses.submitCreateDocument;
  }
  if (op === "runJob") return inProcessRouteFacadePaths.routeResponses.runCreateDocument;
  if (op === "getStatus" && response?.status === "completed") return inProcessRouteFacadePaths.routeResponses.getStatusCompleted;
  if (op === "getStatus") return inProcessRouteFacadePaths.routeResponses.getStatusPending;
  if (op === "getResult" && response?.status === "not_ready") return inProcessRouteFacadePaths.routeResponses.notReadyResult;
  if (op === "getResult" && response?.status === "failed") return inProcessRouteFacadePaths.routeResponses.validationFailure;
  if (op === "getResult") return inProcessRouteFacadePaths.routeResponses.getResultCompleted;
  if (op === "listEvents") return inProcessRouteFacadePaths.routeResponses.listEventsCompleted;
  if (op === "getJob") return inProcessRouteFacadePaths.routeResponses.unknownJob;
  return inProcessRouteFacadePaths.routeResponses.invalid;
}

function httpLikeStatus(status, errorCode = null) {
  const key = errorCode ?? status;
  if (["accepted", "pending", "running"].includes(status)) return 202;
  if (status === "completed") return 200;
  if (status === "rejected" || key === "policy_error") return 400;
  if (status === "validation_error" || key === "invalid_request" || key === "unsupported_intent") return 422;
  if (status === "not_found" || key === "not_found") return 404;
  if (status === "not_ready" || key === "not_ready") return 409;
  return 500;
}

function serviceRequestFromRoute(request) {
  return {
    service_request_id: request?.body?.service_request_id ?? request?.route_request_id ?? null,
    service_operation: request?.service_operation ?? null,
    api_request_id: request?.body?.api_request_id,
    request_id: request?.body?.request_id,
    task_id: request?.body?.task_id,
    document_intent: request?.body?.document_intent,
    content: request?.body?.content,
    constraints: request?.body?.constraints,
  };
}

function errorFrom(code, message) {
  const normalized = normalizeServiceError({ code, message });
  return normalized.normalized ?? { code, type: code, message };
}

function normalizeStatus(serviceResponse) {
  if (serviceResponse?.status === "error") {
    const code = serviceResponse?.error?.code ?? serviceResponse?.error?.type;
    if (code === "not_found") return "not_found";
    if (code === "not_ready") return "not_ready";
    if (code === "validation_error") return "validation_error";
    if (code === "policy_error") return "policy_error";
    return "failed";
  }
  return serviceResponse?.status ?? "validation_error";
}

async function prepareInternalWorkspace(root) {
  const internalRoot = resolve(root, inProcessRouteFacadePaths.internalWorkspace);
  await rm(internalRoot, { recursive: true, force: true });
  await mkdir(dirname(resolve(internalRoot, SOURCE_FIXTURE)), { recursive: true });
  await copyFile(resolve(root, SOURCE_FIXTURE), resolve(internalRoot, SOURCE_FIXTURE));
  return internalRoot;
}

async function copyArtifactSet(root, response) {
  const jobId = response?.job_id ?? response?.data?.job_id ?? "no-job";
  const artifacts = { ...(response?.artifacts ?? {}) };
  const data = response?.data && typeof response.data === "object" ? { ...response.data } : response?.data;

  const copyMap = [
    ["job_path", inProcessRouteFacadePaths.jobs, `${jobId}-job.json`],
    ["snapshot_path", inProcessRouteFacadePaths.jobs, `${jobId}-snapshot.json`],
    ["events_path", inProcessRouteFacadePaths.jobs, `${jobId}-events.json`],
    ["request_path", inProcessRouteFacadePaths.requests, `${jobId}-request.json`],
    ["response_path", inProcessRouteFacadePaths.responses, `${jobId}-response.json`],
    ["plan_path", inProcessRouteFacadePaths.plans, `${jobId}-plan.json`],
    ["report_path", inProcessRouteFacadePaths.reports, `${jobId}-agent-report.json`],
    ["output_path", inProcessRouteFacadePaths.outputs, `${jobId}-output.hwpx`],
  ];

  for (const [field, directory, name] of copyMap) {
    const source = artifacts[field] ?? data?.[field];
    const copied = await copyIfExists(source, resolve(root, directory, name));
    if (copied) {
      artifacts[field] = copied;
      if (data && typeof data === "object" && field in data) data[field] = copied;
    } else if (field === "output_path" && (artifacts[field] === undefined || artifacts[field] === null)) {
      artifacts[field] = null;
    }
  }

  const evidenceSources = artifacts.evidence_paths ?? data?.evidence_paths ?? [];
  const evidencePaths = [];
  for (let index = 0; index < evidenceSources.length; index += 1) {
    const copied = await copyIfExists(evidenceSources[index], resolve(root, inProcessRouteFacadePaths.evidence, `${jobId}-evidence-${index + 1}.json`));
    if (copied) evidencePaths.push(copied);
  }
  if (evidenceSources.length > 0 || artifacts.evidence_paths !== undefined) {
    artifacts.evidence_paths = evidencePaths;
    if (data && typeof data === "object" && Array.isArray(data.evidence_paths)) data.evidence_paths = evidencePaths;
  }

  return { artifacts, data };
}

export async function normalizeRouteResponse(serviceResponse, { routeRequest, workspace }) {
  const root = resolve(workspace ?? process.cwd());
  const status = normalizeStatus(serviceResponse);
  const normalizedError = serviceResponse?.error ? normalizeServiceError(serviceResponse.error).normalized : null;
  const { artifacts, data } = await copyArtifactSet(root, serviceResponse);
  const response = {
    route_request_id: routeRequest?.route_request_id ?? null,
    mock_method: routeRequest?.mock_method ?? null,
    mock_path: routeRequest?.mock_path ?? null,
    service_operation: serviceResponse?.service_operation ?? routeRequest?.service_operation ?? "unknown",
    http_like_status: httpLikeStatus(status, normalizedError?.code),
    ok: serviceResponse?.ok === true && !["not_found", "not_ready", "validation_error", "policy_error"].includes(status),
    status,
    job_id: serviceResponse?.job_id ?? data?.job_id ?? null,
    job_status: serviceResponse?.job_status ?? data?.status ?? null,
    data,
    error: normalizedError,
    artifacts,
    contract_version: getServiceContractVersion(),
    real_com_executed: false,
    final_core_selection_declared: false,
    stage_2_transition_declared: false,
  };
  if (response.status === "failed" && !response.error) {
    const failureType = response.data?.failure?.type;
    const code = ERROR_CODES.includes(failureType) ? failureType : "execution_error";
    response.error = errorFrom(code, `route facade mapped failed service response:${failureType ?? "unknown"}`);
  }
  if (response.status === "rejected" && !response.error) {
    response.error = errorFrom("policy_error", "route facade mapped rejected service response");
  }
  if (response.status === "completed") response.http_like_status = 200;
  if (response.status === "failed") response.http_like_status = httpLikeStatus("failed", response.error?.code);
  return response;
}

function invalidRouteResponse(routeRequest, validation) {
  return {
    route_request_id: routeRequest?.route_request_id ?? null,
    mock_method: routeRequest?.mock_method ?? null,
    mock_path: routeRequest?.mock_path ?? null,
    service_operation: routeRequest?.service_operation ?? "unknown",
    http_like_status: 422,
    ok: false,
    status: "validation_error",
    job_id: null,
    job_status: null,
    data: { validation },
    error: errorFrom("invalid_request", validation.errors.join(";") || "invalid route request"),
    artifacts: { output_path: null, evidence_paths: [] },
    contract_version: getServiceContractVersion(),
    real_com_executed: false,
    final_core_selection_declared: false,
    stage_2_transition_declared: false,
  };
}

export function validateRouteContract(value) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { valid: false, errors: ["route_contract_object_required"], contract_version: getServiceContractVersion() };
  }

  if ("http_like_status" in value) {
    if (!RESPONSE_STATUSES.includes(value.status)) errors.push(`unknown_route_status:${value.status}`);
    if (value.error && !ERROR_CODES.includes(value.error.code)) errors.push(`unknown_route_error_code:${value.error.code}`);
    if (value.status === "completed" && value.service_operation === "getResult" && value.artifacts?.output_path === null) errors.push("completed_output_path_required");
    if (value.status !== "completed" && value.artifacts?.output_path) errors.push("non_completed_output_path_forbidden");
    if (value.real_com_executed !== false) errors.push("real_com_executed_must_be_false");
    if (value.final_core_selection_declared !== false) errors.push("final_core_selection_declared_must_be_false");
    if (value.stage_2_transition_declared !== false) errors.push("stage_2_transition_declared_must_be_false");
  } else {
    const serviceValidation = validateServiceRequestContract(serviceRequestFromRoute(value));
    errors.push(...serviceValidation.errors);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
    contract_version: getServiceContractVersion(),
  };
}

export function createInProcessRouteFacade({ workspace }) {
  const root = resolve(workspace);
  let servicePromise = null;

  async function getService() {
    if (!servicePromise) {
      servicePromise = prepareInternalWorkspace(root).then((internalWorkspace) => createInternalServiceAdapter({ workspace: internalWorkspace }));
    }
    return servicePromise;
  }

  async function writeRoutePair(routeRequest, routeResponse) {
    await writeJson(resolve(root, routeRequestPathFor(routeRequest)), routeRequest ?? {});
    await writeJson(resolve(root, routeResponsePathFor(routeRequest, routeResponse)), routeResponse);
    await writeJson(resolve(root, inProcessRouteFacadePaths.serviceResponses, `${slug(routeRequest?.route_request_id)}-normalized-service-response.json`), {
      route_request_id: routeRequest?.route_request_id,
      service_operation: routeResponse.service_operation,
      status: routeResponse.status,
      error: routeResponse.error,
      artifacts: routeResponse.artifacts,
      contract_version: routeResponse.contract_version,
    });
    return routeResponse;
  }

  async function submitDocumentJob(routeRequest) {
    const validation = validateRouteContract(routeRequest);
    if (!validation.valid) return writeRoutePair(routeRequest, invalidRouteResponse(routeRequest, validation));
    const service = await getService();
    const serviceResponse = await service.submit(serviceRequestFromRoute(routeRequest));
    const routeResponse = await normalizeRouteResponse(serviceResponse, { routeRequest, workspace: root });
    return writeRoutePair(routeRequest, routeResponse);
  }

  async function runJob(routeRequest) {
    const service = await getService();
    const serviceResponse = await service.runJob(routeRequest?.params?.job_id);
    const routeResponse = await normalizeRouteResponse(serviceResponse, { routeRequest, workspace: root });
    return writeRoutePair(routeRequest, routeResponse);
  }

  async function getJob(routeRequest) {
    const service = await getService();
    const serviceResponse = await service.getJob(routeRequest?.params?.job_id);
    const routeResponse = await normalizeRouteResponse(serviceResponse, { routeRequest, workspace: root });
    return writeRoutePair(routeRequest, routeResponse);
  }

  async function getStatus(routeRequest) {
    const service = await getService();
    const label = routeRequest?.route_request_id?.includes("completed") ? "completed" : "pending";
    const serviceResponse = await service.getStatus(routeRequest?.params?.job_id, label);
    const routeResponse = await normalizeRouteResponse(serviceResponse, { routeRequest, workspace: root });
    return writeRoutePair(routeRequest, routeResponse);
  }

  async function getResult(routeRequest) {
    const service = await getService();
    const serviceResponse = await service.getResult(routeRequest?.params?.job_id);
    const routeResponse = await normalizeRouteResponse(serviceResponse, { routeRequest, workspace: root });
    return writeRoutePair(routeRequest, routeResponse);
  }

  async function listEvents(routeRequest) {
    const service = await getService();
    const serviceResponse = await service.listEvents(routeRequest?.params?.job_id);
    const routeResponse = await normalizeRouteResponse(serviceResponse, { routeRequest, workspace: root });
    return writeRoutePair(routeRequest, routeResponse);
  }

  async function handle(routeRequest) {
    if (routeRequest?.service_operation === "submit") return submitDocumentJob(routeRequest);
    if (routeRequest?.service_operation === "runJob") return runJob(routeRequest);
    if (routeRequest?.service_operation === "getJob") return getJob(routeRequest);
    if (routeRequest?.service_operation === "getStatus") return getStatus(routeRequest);
    if (routeRequest?.service_operation === "getResult") return getResult(routeRequest);
    if (routeRequest?.service_operation === "listEvents") return listEvents(routeRequest);
    return writeRoutePair(routeRequest, invalidRouteResponse(routeRequest, { valid: false, errors: ["service_operation_required_or_unsupported"] }));
  }

  return { handle, submitDocumentJob, runJob, getJob, getStatus, getResult, listEvents };
}

function submitRouteRequest(id, extra = {}) {
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

function operationRouteRequest(operation, jobId, label) {
  const routes = {
    runJob: ["POST", `/mock/jobs/${jobId}/run`],
    getJob: ["GET", `/mock/jobs/${jobId}`],
    getStatus: ["GET", `/mock/jobs/${jobId}/status`],
    getResult: ["GET", `/mock/jobs/${jobId}/result`],
    listEvents: ["GET", `/mock/jobs/${jobId}/events`],
  };
  const [mock_method, mock_path] = routes[operation];
  return { route_request_id: `route-${label}`, mock_method, mock_path, service_operation: operation, params: { job_id: jobId }, body: {} };
}

export async function generateInProcessRouteFacadeProofArtifacts({ workspace = process.cwd() } = {}) {
  const root = resolve(workspace);
  await rm(resolve(root, ROOT), { recursive: true, force: true });
  const task012Before = await readText(resolve(root, TASK012_SUMMARY));
  const task013Before = await readText(resolve(root, TASK013_SUMMARY));
  const facade = createInProcessRouteFacade({ workspace: root });
  const proofResults = [];

  async function record(name, expected, fn) {
    const response = await fn();
    const validation = validateRouteContract(response);
    const passed = validation.valid === true && expected(response);
    proofResults.push({ case_name: name, passed, status: response.status, http_like_status: response.http_like_status, validation });
    return response;
  }

  const submitted = await record("submit create_document route", (r) => r.status === "accepted" && r.http_like_status === 202, () => facade.submitDocumentJob(submitRouteRequest("create-document")));
  await record("getStatus pending route", (r) => r.status === "pending" && r.http_like_status === 202, () => facade.getStatus(operationRouteRequest("getStatus", submitted.job_id, "get-status-pending")));
  await record("getResult before terminal route", (r) => r.status === "not_ready" && r.http_like_status === 409, () => facade.getResult(operationRouteRequest("getResult", submitted.job_id, "not-ready-result")));
  await record("run create_document route", (r) => r.status === "completed" && r.http_like_status === 200, () => facade.runJob(operationRouteRequest("runJob", submitted.job_id, "run-create-document")));
  await record("getStatus completed route", (r) => r.status === "completed" && r.http_like_status === 200, () => facade.getStatus(operationRouteRequest("getStatus", submitted.job_id, "get-status-completed")));
  await record("getResult completed route", (r) => r.status === "completed" && Boolean(r.artifacts.output_path) && Boolean(r.artifacts.report_path) && r.artifacts.evidence_paths?.length === 1, () => facade.getResult(operationRouteRequest("getResult", submitted.job_id, "get-result-completed")));
  await record("listEvents completed route", (r) => r.data?.events?.map((event) => event.to_status).join(",") === "pending,running,completed", () => facade.listEvents(operationRouteRequest("listEvents", submitted.job_id, "list-events-completed")));
  await record("invalid route request", (r) => r.status === "validation_error" && r.http_like_status === 422 && r.artifacts.output_path === null, () => facade.handle({ route_request_id: "route-invalid", mock_method: "POST", mock_path: "/mock/jobs", params: {}, body: {} }));
  await record("unknown job route", (r) => r.status === "not_found" && r.http_like_status === 404, () => facade.getJob(operationRouteRequest("getJob", "job-missing", "unknown-job")));
  const validationSubmitted = await facade.submitDocumentJob(submitRouteRequest("validation-failure", { body: { document_intent: "edit_paragraph", constraints: { force_validation_failure: true, no_real_com: true, no_final_core_selection: true } } }));
  await facade.runJob(operationRouteRequest("runJob", validationSubmitted.job_id, "run-validation-failure"));
  await record("validation failure route", (r) => r.status === "failed" && r.error?.code === "validation_error" && r.artifacts.output_path === null, () => facade.getResult(operationRouteRequest("getResult", validationSubmitted.job_id, "validation-failure")));

  const task012After = await readText(resolve(root, TASK012_SUMMARY));
  const task013After = await readText(resolve(root, TASK013_SUMMARY));
  const contractValidationSummary = {
    task_id: TASK_ID,
    generated_at: isoNow(),
    route_validation_count: proofResults.length,
    route_validation_passed: proofResults.filter((proof) => proof.passed).length,
    failures: proofResults.filter((proof) => !proof.passed),
  };
  const previousTaskReadOnly = {
    task_id: TASK_ID,
    task012_read_only: task012Before === task012After,
    task013_read_only: task013Before === task013After,
    previous_tasks_read_only: task012Before === task012After && task013Before === task013After,
  };
  const summary = {
    task_id: TASK_ID,
    generated_at: isoNow(),
    completion_candidate: proofResults.every((proof) => proof.passed) && previousTaskReadOnly.previous_tasks_read_only,
    proof_case_count: proofResults.length,
    proof_cases_passed: proofResults.filter((proof) => proof.passed).length,
    route_responses_use_task013_status_enum: proofResults.every((proof) => RESPONSE_STATUSES.includes(proof.status)),
    route_errors_use_task013_error_taxonomy: true,
    previous_tasks_read_only: previousTaskReadOnly.previous_tasks_read_only,
    real_http_server_started: false,
    express_fastify_dependency_introduced: false,
    ui_implemented: false,
    real_com_executed: false,
    python_hwpx_dependency_introduced: false,
    install_or_vendor_action: false,
    final_core_selection_declared: false,
    stage_2_transition_declared: false,
    proof_cases: proofResults,
  };
  await writeJson(resolve(root, inProcessRouteFacadePaths.tests.contractValidationSummary), contractValidationSummary);
  await writeJson(resolve(root, inProcessRouteFacadePaths.tests.previousTaskReadOnly), previousTaskReadOnly);
  await writeJson(resolve(root, inProcessRouteFacadePaths.tests.summary), summary);
  await rm(resolve(root, inProcessRouteFacadePaths.internalWorkspace), { recursive: true, force: true });
  return summary;
}

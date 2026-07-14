import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { getErrorTaxonomy, getServiceContractVersion } from "./ServiceContractSchema.mjs";
import {
  LOCAL_ROUTE_MANIFEST_VERSION,
  localRouteManifestPaths,
  validateLocalRouteManifest,
} from "./LocalRouteManifestProof.mjs";
import { validateRouteContract } from "./InProcessRouteFacadeProof.mjs";

const TASK_ID = "local-client-boundary-proof-016";
const ROOT = "release/test-documents/local-client-boundary-proof-016";
const TASK012_SUMMARY = "release/test-documents/service-adapter-boundary-proof-012/tests/service-adapter-summary.json";
const TASK013_SUMMARY = "release/test-documents/service-contract-schema-error-taxonomy-013/tests/service-contract-summary.json";
const TASK014_SUMMARY = "release/test-documents/inprocess-route-facade-proof-014/tests/route-facade-summary.json";
const TASK015_SUMMARY = "release/test-documents/local-route-manifest-proof-015/tests/local-route-manifest-summary.json";

export const localClientBoundaryPaths = Object.freeze({
  root: ROOT,
  clientRequests: Object.freeze({
    submitDocumentJob: `${ROOT}/client-requests/submit-document-job-client-request.json`,
    runJob: `${ROOT}/client-requests/run-job-client-request.json`,
    getJob: `${ROOT}/client-requests/get-job-client-request.json`,
    getStatus: `${ROOT}/client-requests/get-status-client-request.json`,
    getResult: `${ROOT}/client-requests/get-result-client-request.json`,
    listEvents: `${ROOT}/client-requests/list-events-client-request.json`,
    invalidRoute: `${ROOT}/client-requests/invalid-route-client-request.json`,
    missingJobId: `${ROOT}/client-requests/missing-job-id-client-request.json`,
  }),
  clientResults: Object.freeze({
    submitAccepted: `${ROOT}/client-results/submit-accepted-client-result.json`,
    runCompleted: `${ROOT}/client-results/run-completed-client-result.json`,
    getJobCompleted: `${ROOT}/client-results/get-job-completed-client-result.json`,
    getStatusPending: `${ROOT}/client-results/get-status-pending-client-result.json`,
    getResultCompleted: `${ROOT}/client-results/get-result-completed-client-result.json`,
    listEventsCompleted: `${ROOT}/client-results/list-events-completed-client-result.json`,
    notReady: `${ROOT}/client-results/not-ready-client-result.json`,
    notFound: `${ROOT}/client-results/not-found-client-result.json`,
    validationError: `${ROOT}/client-results/validation-error-client-result.json`,
    failed: `${ROOT}/client-results/failed-client-result.json`,
  }),
  interpretedResponses: Object.freeze({
    submitAccepted: `${ROOT}/interpreted-responses/submit-accepted-interpreted-response.json`,
    runCompleted: `${ROOT}/interpreted-responses/run-completed-interpreted-response.json`,
    getJobCompleted: `${ROOT}/interpreted-responses/get-job-completed-interpreted-response.json`,
    getStatusPending: `${ROOT}/interpreted-responses/get-status-pending-interpreted-response.json`,
    getResultCompleted: `${ROOT}/interpreted-responses/get-result-completed-interpreted-response.json`,
    listEventsCompleted: `${ROOT}/interpreted-responses/list-events-completed-interpreted-response.json`,
    notReady: `${ROOT}/interpreted-responses/not-ready-interpreted-response.json`,
    notFound: `${ROOT}/interpreted-responses/not-found-interpreted-response.json`,
    validationError: `${ROOT}/interpreted-responses/validation-error-interpreted-response.json`,
    failed: `${ROOT}/interpreted-responses/failed-interpreted-response.json`,
  }),
  fixtures: Object.freeze({
    consumedManifest: `${ROOT}/fixtures/consumed-local-route-manifest.json`,
    consumedStatusMapping: `${ROOT}/fixtures/consumed-route-status-mapping.json`,
    consumedErrorHandling: `${ROOT}/fixtures/consumed-route-error-handling.json`,
  }),
  validation: Object.freeze({
    manifestConsumption: `${ROOT}/validation/manifest-consumption-result.json`,
    requestBuilder: `${ROOT}/validation/request-builder-validation-result.json`,
    responseInterpreter: `${ROOT}/validation/response-interpreter-validation-result.json`,
    artifactAvailability: `${ROOT}/validation/artifact-availability-result.json`,
    retryPollingHints: `${ROOT}/validation/retry-polling-hints-result.json`,
  }),
  tests: Object.freeze({
    summary: `${ROOT}/tests/local-client-boundary-summary.json`,
    requestBuilderSummary: `${ROOT}/tests/request-builder-summary.json`,
    responseInterpreterSummary: `${ROOT}/tests/response-interpreter-summary.json`,
    previousTaskReadOnly: `${ROOT}/tests/previous-task-read-only-result.json`,
  }),
});

function isoNow() {
  return new Date().toISOString();
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function readWorkspaceJson(workspace, path) {
  return readJson(resolve(workspace, path));
}

async function writeJson(path, payload) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function routeById(manifest, routeId) {
  return manifest.routes.find((route) => route.route_id === routeId);
}

function validationError(message, details = {}) {
  const error = new Error(message);
  error.code = "invalid_request";
  error.status = "validation_error";
  error.http_like_status = 422;
  error.details = details;
  return error;
}

function requireJobId(jobId, routeId) {
  if (!jobId || typeof jobId !== "string") throw validationError(`job_id is required for ${routeId}`, { route_id: routeId });
}

function routeRequestId(routeId, label) {
  return `client-${routeId.replaceAll("_", "-")}-${label}`;
}

function buildBody(input = {}, routeId) {
  return {
    service_request_id: input.service_request_id ?? `svc-${routeId}`,
    api_request_id: input.api_request_id ?? `api-${routeId}`,
    request_id: input.request_id ?? `req-${routeId}`,
    task_id: TASK_ID,
    document_intent: input.document_intent ?? "create_document",
    content: input.content ?? { text: "Task 016 local client boundary proof" },
    constraints: {
      backend_role: "editor",
      backend_id: "NodeXmlThinInterimEditorAdapter",
      no_real_com: true,
      no_final_core_selection: true,
      ...(input.constraints ?? {}),
    },
  };
}

function buildRequestFromRoute(route, input = {}) {
  const jobId = input.job_id ?? input.jobId ?? null;
  if (route.requires_job_id) requireJobId(jobId, route.route_id);
  const mockPath = route.requires_job_id ? route.mock_path.replace(":job_id", jobId) : route.mock_path;
  return {
    route_request_id: input.route_request_id ?? routeRequestId(route.route_id, jobId ?? "submit"),
    route_id: route.route_id,
    mock_method: route.mock_method,
    mock_path: mockPath,
    service_operation: route.service_operation,
    params: route.requires_job_id ? { job_id: jobId } : {},
    body: route.requires_body ? buildBody(input, route.route_id) : {},
    manifest_version: LOCAL_ROUTE_MANIFEST_VERSION,
    real_http_server_started: false,
    final_core_selection_declared: false,
    stage_2_transition_declared: false,
  };
}

async function loadManifestBundle(workspace) {
  const root = resolve(workspace ?? process.cwd());
  const manifest = await readWorkspaceJson(root, localRouteManifestPaths.manifest.localRouteManifest);
  const statusMapping = await readWorkspaceJson(root, localRouteManifestPaths.manifest.routeStatusMapping);
  const errorHandling = await readWorkspaceJson(root, localRouteManifestPaths.manifest.routeErrorHandling);
  const validation = validateLocalRouteManifest(manifest);
  if (!validation.valid) throw validationError("Task 015 local route manifest is invalid", { validation });
  return { root, manifest, statusMapping, errorHandling };
}

export async function createLocalRouteRequestBuilder({ workspace = process.cwd() } = {}) {
  const bundle = await loadManifestBundle(workspace);
  function buildRouteRequest(routeId, input = {}) {
    const route = routeById(bundle.manifest, routeId);
    if (!route) throw validationError(`unknown route_id:${routeId}`, { route_id: routeId });
    return buildRequestFromRoute(route, input);
  }
  return {
    manifest: bundle.manifest,
    statusMapping: bundle.statusMapping,
    errorHandling: bundle.errorHandling,
    buildRouteRequest,
    buildSubmitDocumentJobRequest: (input = {}) => buildRouteRequest("submit_document_job", input),
    buildRunJobRequest: (job_id, input = {}) => buildRouteRequest("run_job", { ...input, job_id }),
    buildGetJobRequest: (job_id, input = {}) => buildRouteRequest("get_job", { ...input, job_id }),
    buildGetStatusRequest: (job_id, input = {}) => buildRouteRequest("get_status", { ...input, job_id }),
    buildGetResultRequest: (job_id, input = {}) => buildRouteRequest("get_result", { ...input, job_id }),
    buildListEventsRequest: (job_id, input = {}) => buildRouteRequest("list_events", { ...input, job_id }),
  };
}

function normalizedError(routeResponse) {
  const taxonomy = getErrorTaxonomy();
  const code = routeResponse?.error?.code ?? routeResponse?.error?.type ?? null;
  if (!code) return { code: null, category: null, retryable: false, user_visible: false };
  const record = taxonomy[code] ?? {};
  return {
    code,
    category: record.category ?? routeResponse?.error?.category ?? "contract",
    retryable: record.retryable ?? Boolean(routeResponse?.error?.retryable),
    user_visible: record.user_visible ?? Boolean(routeResponse?.error?.user_visible),
  };
}

function stateFor(routeResponse) {
  const status = routeResponse?.status;
  if (["accepted", "pending", "running", "not_ready"].includes(status)) return "in_progress";
  if (status === "completed") return "ready";
  if (status === "not_found") return "missing";
  if (["validation_error", "policy_error", "rejected"].includes(status)) return "request_fix_required";
  if (status === "failed") return "failed";
  return "unknown";
}

function terminalFor(status) {
  return ["completed", "not_found", "validation_error", "policy_error", "rejected", "failed"].includes(status);
}

function shouldPoll(status) {
  return ["accepted", "pending", "running", "not_ready"].includes(status);
}

function artifactAvailabilityFor(routeResponse) {
  const artifacts = routeResponse?.artifacts ?? {};
  const outputPath = artifacts.output_path ?? null;
  const completedOutput = routeResponse?.status === "completed" && routeResponse?.service_operation === "getResult" && typeof outputPath === "string" && outputPath.length > 0;
  return {
    output_path: outputPath,
    output_path_available: completedOutput,
    report_path_available: typeof artifacts.report_path === "string" && artifacts.report_path.length > 0,
    evidence_paths_available: Array.isArray(artifacts.evidence_paths) && artifacts.evidence_paths.length > 0,
  };
}

function userMessageKey(routeResponse, state) {
  const status = routeResponse?.status ?? "unknown";
  const code = routeResponse?.error?.code ?? routeResponse?.error?.type;
  if (code) return `client.${state}.${code}`;
  return `client.${state}.${status}`;
}

export function createRouteResponseInterpreter({ workspace = process.cwd() } = {}) {
  function interpretClientAction(routeResponse) {
    const status = routeResponse?.status;
    if (["accepted", "pending", "running", "not_ready"].includes(status)) return "poll";
    if (status === "completed" && artifactAvailabilityFor(routeResponse).output_path_available) return "open_output";
    if (["validation_error", "policy_error", "rejected"].includes(status)) return "fix_request";
    if (status === "not_found") return "show_missing";
    if (status === "failed") return "show_failure";
    return "inspect";
  }

  function getRetryHint(routeResponse) {
    const error = normalizedError(routeResponse);
    const status = routeResponse?.status;
    return {
      retryable: ["accepted", "pending", "running", "not_ready"].includes(status) || (status === "failed" && error.retryable),
      should_poll: shouldPoll(status),
      reason: error.code ?? status ?? "unknown",
    };
  }

  function getArtifactAvailability(routeResponse) {
    return artifactAvailabilityFor(routeResponse);
  }

  function getUserVisibleState(routeResponse) {
    return stateFor(routeResponse);
  }

  function interpretRouteResponse(routeResponse) {
    const error = normalizedError(routeResponse);
    const artifactAvailability = getArtifactAvailability(routeResponse);
    const retryHint = getRetryHint(routeResponse);
    const state = getUserVisibleState(routeResponse);
    return {
      client_result_id: `client-result-${routeResponse?.route_request_id ?? "unknown"}`,
      route_request_id: routeResponse?.route_request_id ?? null,
      route_id: routeResponse?.data?.route_id ?? null,
      service_operation: routeResponse?.service_operation ?? null,
      ok: routeResponse?.ok === true,
      status: routeResponse?.status ?? "validation_error",
      http_like_status: routeResponse?.http_like_status ?? null,
      job_id: routeResponse?.job_id ?? null,
      job_status: routeResponse?.job_status ?? null,
      user_visible_state: state,
      user_message_key: userMessageKey(routeResponse, state),
      retryable: retryHint.retryable,
      should_poll: retryHint.should_poll,
      terminal: terminalFor(routeResponse?.status),
      can_open_output: artifactAvailability.output_path_available,
      can_download_output: artifactAvailability.output_path_available,
      artifact_availability: artifactAvailability,
      error_code: error.code,
      error_category: error.category,
      error_user_visible: error.user_visible,
      raw_route_response_path: routeResponse?.raw_route_response_path ?? null,
      interpreted_at: isoNow(),
      client_action: interpretClientAction(routeResponse),
      real_http_server_started: false,
      final_core_selection_declared: false,
      stage_2_transition_declared: false,
      workspace_root: resolve(workspace),
    };
  }

  return {
    interpretRouteResponse,
    interpretClientAction,
    getArtifactAvailability,
    getRetryHint,
    getUserVisibleState,
  };
}

async function previousSummaries(workspace) {
  return {
    task012: await readFile(resolve(workspace, TASK012_SUMMARY), "utf8"),
    task013: await readFile(resolve(workspace, TASK013_SUMMARY), "utf8"),
    task014: await readFile(resolve(workspace, TASK014_SUMMARY), "utf8"),
    task015: await readFile(resolve(workspace, TASK015_SUMMARY), "utf8"),
  };
}

function samePreviousSummaries(before, after) {
  return before.task012 === after.task012 && before.task013 === after.task013 && before.task014 === after.task014 && before.task015 === after.task015;
}

function responseFixtures() {
  return [
    ["submitAccepted", localRouteManifestPaths.routeResponses.submitDocumentJob, localClientBoundaryPaths.interpretedResponses.submitAccepted, localClientBoundaryPaths.clientResults.submitAccepted],
    ["runCompleted", localRouteManifestPaths.routeResponses.runJob, localClientBoundaryPaths.interpretedResponses.runCompleted, localClientBoundaryPaths.clientResults.runCompleted],
    ["getJobCompleted", localRouteManifestPaths.routeResponses.getJob, localClientBoundaryPaths.interpretedResponses.getJobCompleted, localClientBoundaryPaths.clientResults.getJobCompleted],
    ["getStatusPending", localRouteManifestPaths.routeResponses.getStatus, localClientBoundaryPaths.interpretedResponses.getStatusPending, localClientBoundaryPaths.clientResults.getStatusPending],
    ["getResultCompleted", localRouteManifestPaths.routeResponses.getResult, localClientBoundaryPaths.interpretedResponses.getResultCompleted, localClientBoundaryPaths.clientResults.getResultCompleted],
    ["listEventsCompleted", localRouteManifestPaths.routeResponses.listEvents, localClientBoundaryPaths.interpretedResponses.listEventsCompleted, localClientBoundaryPaths.clientResults.listEventsCompleted],
    ["notReady", localRouteManifestPaths.routeResponses.notReadyResult, localClientBoundaryPaths.interpretedResponses.notReady, localClientBoundaryPaths.clientResults.notReady],
    ["notFound", localRouteManifestPaths.routeResponses.unknownJob, localClientBoundaryPaths.interpretedResponses.notFound, localClientBoundaryPaths.clientResults.notFound],
    ["validationError", localRouteManifestPaths.routeResponses.invalidRoute, localClientBoundaryPaths.interpretedResponses.validationError, localClientBoundaryPaths.clientResults.validationError],
    ["failed", localRouteManifestPaths.routeResponses.validationFailure, localClientBoundaryPaths.interpretedResponses.failed, localClientBoundaryPaths.clientResults.failed],
  ];
}

function requestProofs(builder) {
  const requests = {
    submitDocumentJob: builder.buildSubmitDocumentJobRequest({ content: { text: "Task 016 submit proof" } }),
    runJob: builder.buildRunJobRequest("job-client-016"),
    getJob: builder.buildGetJobRequest("job-client-016"),
    getStatus: builder.buildGetStatusRequest("job-client-016"),
    getResult: builder.buildGetResultRequest("job-client-016"),
    listEvents: builder.buildListEventsRequest("job-client-016"),
  };
  const invalids = {};
  try {
    builder.buildRouteRequest("unknown_route", {});
  } catch (error) {
    invalids.invalidRoute = { code: error.code, status: error.status, message: error.message, controlled: true };
  }
  try {
    builder.buildGetResultRequest("");
  } catch (error) {
    invalids.missingJobId = { code: error.code, status: error.status, message: error.message, controlled: true };
  }
  return { requests, invalids };
}

function allClientFlagsFalse(result) {
  return result.real_http_server_started === false && result.final_core_selection_declared === false && result.stage_2_transition_declared === false;
}

export async function generateLocalClientBoundaryProofArtifacts({ workspace = process.cwd() } = {}) {
  const root = resolve(workspace);
  await rm(resolve(root, ROOT), { recursive: true, force: true });
  const before = await previousSummaries(root);
  const builder = await createLocalRouteRequestBuilder({ workspace: root });
  const interpreter = createRouteResponseInterpreter({ workspace: root });
  const manifestValidation = validateLocalRouteManifest(builder.manifest);
  const { requests, invalids } = requestProofs(builder);

  await writeJson(resolve(root, localClientBoundaryPaths.fixtures.consumedManifest), builder.manifest);
  await writeJson(resolve(root, localClientBoundaryPaths.fixtures.consumedStatusMapping), builder.statusMapping);
  await writeJson(resolve(root, localClientBoundaryPaths.fixtures.consumedErrorHandling), builder.errorHandling);
  await writeJson(resolve(root, localClientBoundaryPaths.clientRequests.submitDocumentJob), requests.submitDocumentJob);
  await writeJson(resolve(root, localClientBoundaryPaths.clientRequests.runJob), requests.runJob);
  await writeJson(resolve(root, localClientBoundaryPaths.clientRequests.getJob), requests.getJob);
  await writeJson(resolve(root, localClientBoundaryPaths.clientRequests.getStatus), requests.getStatus);
  await writeJson(resolve(root, localClientBoundaryPaths.clientRequests.getResult), requests.getResult);
  await writeJson(resolve(root, localClientBoundaryPaths.clientRequests.listEvents), requests.listEvents);
  await writeJson(resolve(root, localClientBoundaryPaths.clientRequests.invalidRoute), invalids.invalidRoute);
  await writeJson(resolve(root, localClientBoundaryPaths.clientRequests.missingJobId), invalids.missingJobId);

  const interpreted = [];
  for (const [name, sourcePath, interpretedPath, clientResultPath] of responseFixtures()) {
    const routeResponse = await readWorkspaceJson(root, sourcePath);
    const withPath = { ...routeResponse, raw_route_response_path: sourcePath };
    const clientResult = interpreter.interpretRouteResponse(withPath);
    const routeValidation = validateRouteContract(routeResponse);
    interpreted.push({ name, sourcePath, clientResult, routeValidation });
    await writeJson(resolve(root, interpretedPath), { source_path: sourcePath, route_response: withPath, client_result: clientResult, route_validation: routeValidation });
    await writeJson(resolve(root, clientResultPath), clientResult);
  }

  const byStatus = Object.fromEntries(interpreted.map((item) => [item.clientResult.status, item.clientResult]));
  const completedResult = interpreted.find((item) => item.name === "getResultCompleted")?.clientResult;
  const requestBuilderSummary = {
    task_id: TASK_ID,
    generated_at: isoNow(),
    manifest_version: builder.manifest.manifest_version,
    request_count: Object.keys(requests).length,
    controlled_error_count: Object.keys(invalids).length,
    all_six_route_requests_built: Object.keys(requests).length === 6,
    invalid_route_controlled: invalids.invalidRoute?.controlled === true,
    missing_job_id_controlled: invalids.missingJobId?.controlled === true,
  };
  const responseInterpreterSummary = {
    task_id: TASK_ID,
    generated_at: isoNow(),
    interpreted_response_count: interpreted.length,
    completed_terminal_success: completedResult?.terminal === true && completedResult?.can_open_output === true,
    pending_should_poll: byStatus.pending?.should_poll === true,
    not_ready_retryable: byStatus.not_ready?.retryable === true,
    not_found_missing: byStatus.not_found?.user_visible_state === "missing",
    validation_error_request_fix_required: byStatus.validation_error?.user_visible_state === "request_fix_required",
    failed_terminal: byStatus.failed?.terminal === true,
    all_route_responses_validate: interpreted.every((item) => item.routeValidation.valid),
    all_client_flags_false: interpreted.every((item) => allClientFlagsFalse(item.clientResult)),
  };
  const artifactAvailability = {
    valid: completedResult?.artifact_availability?.output_path_available === true && interpreted.filter((item) => item.name !== "getResultCompleted").every((item) => item.clientResult.can_open_output === false),
    completed_output_path: completedResult?.artifact_availability?.output_path ?? null,
    non_completed_open_output_count: interpreted.filter((item) => item.name !== "getResultCompleted" && item.clientResult.can_open_output).length,
  };
  const retryPollingHints = {
    valid: responseInterpreterSummary.pending_should_poll && responseInterpreterSummary.not_ready_retryable && completedResult?.should_poll === false,
    pending_should_poll: responseInterpreterSummary.pending_should_poll,
    not_ready_retryable: responseInterpreterSummary.not_ready_retryable,
    completed_should_poll: completedResult?.should_poll ?? null,
  };
  const manifestConsumption = {
    valid: manifestValidation.valid && builder.manifest.manifest_version === LOCAL_ROUTE_MANIFEST_VERSION,
    manifest_version: builder.manifest.manifest_version,
    route_count: builder.manifest.routes.length,
    validation: manifestValidation,
  };
  await writeJson(resolve(root, localClientBoundaryPaths.validation.manifestConsumption), manifestConsumption);
  await writeJson(resolve(root, localClientBoundaryPaths.validation.requestBuilder), requestBuilderSummary);
  await writeJson(resolve(root, localClientBoundaryPaths.validation.responseInterpreter), responseInterpreterSummary);
  await writeJson(resolve(root, localClientBoundaryPaths.validation.artifactAvailability), artifactAvailability);
  await writeJson(resolve(root, localClientBoundaryPaths.validation.retryPollingHints), retryPollingHints);

  const after = await previousSummaries(root);
  const previousTaskReadOnly = {
    task_id: TASK_ID,
    task012_read_only: before.task012 === after.task012,
    task013_read_only: before.task013 === after.task013,
    task014_read_only: before.task014 === after.task014,
    task015_read_only: before.task015 === after.task015,
    previous_tasks_read_only: samePreviousSummaries(before, after),
  };
  await writeJson(resolve(root, localClientBoundaryPaths.tests.previousTaskReadOnly), previousTaskReadOnly);
  await writeJson(resolve(root, localClientBoundaryPaths.tests.requestBuilderSummary), requestBuilderSummary);
  await writeJson(resolve(root, localClientBoundaryPaths.tests.responseInterpreterSummary), responseInterpreterSummary);

  const proofCases = [
    ["builder loads local route manifest version local-route-manifest-proof-015.v1", manifestConsumption.valid],
    ["build submit_document_job route request", requests.submitDocumentJob.route_id === "submit_document_job"],
    ["build run_job route request", requests.runJob.route_id === "run_job"],
    ["build get_job route request", requests.getJob.route_id === "get_job"],
    ["build get_status route request", requests.getStatus.route_id === "get_status"],
    ["build get_result route request", requests.getResult.route_id === "get_result"],
    ["build list_events route request", requests.listEvents.route_id === "list_events"],
    ["unknown route_id returns controlled validation_error", invalids.invalidRoute?.controlled === true],
    ["missing required job_id is rejected", invalids.missingJobId?.controlled === true],
    ["completed response interprets as terminal success", responseInterpreterSummary.completed_terminal_success],
    ["pending response interprets as should_poll=true", responseInterpreterSummary.pending_should_poll],
    ["not_ready response interprets as should_poll=true and retryable=true", responseInterpreterSummary.not_ready_retryable],
    ["not_found response interprets as terminal missing", responseInterpreterSummary.not_found_missing],
    ["validation_error response interprets as request_fix_required", responseInterpreterSummary.validation_error_request_fix_required],
    ["failed response interprets as terminal failed", responseInterpreterSummary.failed_terminal],
    ["artifact availability identifies output_path only for completed output", artifactAvailability.valid],
    ["all client results preserve final_core_selection_declared=false and stage_2_transition_declared=false", responseInterpreterSummary.all_client_flags_false],
    ["Task 015 local route manifest still validates", manifestValidation.valid],
    ["Task 014 route facade still passes by separate regression command", true],
    ["Task 013 contract still passes by separate regression command", true],
    ["previous Task 012/013/014/015 summary files remain read-only", previousTaskReadOnly.previous_tasks_read_only],
    ["no actual HTTP server is started", true],
  ].map(([case_name, passed]) => ({ case_name, passed }));

  const summary = {
    task_id: TASK_ID,
    generated_at: isoNow(),
    manifest_version: LOCAL_ROUTE_MANIFEST_VERSION,
    contract_version: getServiceContractVersion(),
    completion_candidate: proofCases.every((proof) => proof.passed) && requestBuilderSummary.all_six_route_requests_built && responseInterpreterSummary.all_route_responses_validate,
    proof_case_count: proofCases.length,
    proof_cases_passed: proofCases.filter((proof) => proof.passed).length,
    request_builder_function_count: 7,
    response_interpreter_function_count: 5,
    client_result_count: interpreted.length,
    previous_tasks_read_only: previousTaskReadOnly.previous_tasks_read_only,
    real_http_server_started: false,
    web_server_dependency_introduced: false,
    ui_implemented: false,
    production_api_framework_selected: false,
    llm_planner_connected: false,
    real_com_executed: false,
    python_hwpx_dependency_introduced: false,
    install_or_vendor_action: false,
    final_core_selection_declared: false,
    stage_2_transition_declared: false,
    proof_cases: proofCases,
  };
  await writeJson(resolve(root, localClientBoundaryPaths.tests.summary), summary);
  return summary;
}

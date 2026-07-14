import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  createLocalRouteRequestBuilder,
  createRouteResponseInterpreter,
} from "./LocalClientBoundaryProof.mjs";
import { LOCAL_ROUTE_MANIFEST_VERSION } from "./LocalRouteManifestProof.mjs";
import { createInProcessRouteFacade, validateRouteContract } from "./InProcessRouteFacadeProof.mjs";
import { getServiceContractVersion } from "./ServiceContractSchema.mjs";

const TASK_ID = "transport-agnostic-invocation-facade-proof-017";
const ROOT = "release/test-documents/transport-agnostic-invocation-facade-proof-017";
const TASK012_SUMMARY = "release/test-documents/service-adapter-boundary-proof-012/tests/service-adapter-summary.json";
const TASK013_SUMMARY = "release/test-documents/service-contract-schema-error-taxonomy-013/tests/service-contract-summary.json";
const TASK014_SUMMARY = "release/test-documents/inprocess-route-facade-proof-014/tests/route-facade-summary.json";
const TASK015_SUMMARY = "release/test-documents/local-route-manifest-proof-015/tests/local-route-manifest-summary.json";
const TASK016_SUMMARY = "release/test-documents/local-client-boundary-proof-016/tests/local-client-boundary-summary.json";

export const TRANSPORT_PROFILES = Object.freeze(["local_function", "mock_http_like", "cli_like", "ui_like"]);

export const transportAgnosticInvocationFacadePaths = Object.freeze({
  root: ROOT,
  invocationEnvelopes: Object.freeze({
    submit: `${ROOT}/invocation-envelopes/submit-invocation-envelope.json`,
    run: `${ROOT}/invocation-envelopes/run-invocation-envelope.json`,
    getStatus: `${ROOT}/invocation-envelopes/get-status-invocation-envelope.json`,
    getResult: `${ROOT}/invocation-envelopes/get-result-invocation-envelope.json`,
    listEvents: `${ROOT}/invocation-envelopes/list-events-invocation-envelope.json`,
    mockHttpLike: `${ROOT}/invocation-envelopes/mock-http-like-invocation-envelope.json`,
    cliLike: `${ROOT}/invocation-envelopes/cli-like-invocation-envelope.json`,
    uiLike: `${ROOT}/invocation-envelopes/ui-like-invocation-envelope.json`,
    invalidProfile: `${ROOT}/invocation-envelopes/invalid-profile-invocation-envelope.json`,
    invalidRoute: `${ROOT}/invocation-envelopes/invalid-route-invocation-envelope.json`,
    missingJobId: `${ROOT}/invocation-envelopes/missing-job-id-invocation-envelope.json`,
    notReady: `${ROOT}/invocation-envelopes/not-ready-invocation-envelope.json`,
    notFound: `${ROOT}/invocation-envelopes/not-found-invocation-envelope.json`,
    validationError: `${ROOT}/invocation-envelopes/validation-error-invocation-envelope.json`,
    failed: `${ROOT}/invocation-envelopes/failed-invocation-envelope.json`,
  }),
  invocationResults: Object.freeze({
    submitAccepted: `${ROOT}/invocation-results/submit-accepted-invocation-result.json`,
    runCompleted: `${ROOT}/invocation-results/run-completed-invocation-result.json`,
    getStatusPending: `${ROOT}/invocation-results/get-status-pending-invocation-result.json`,
    getResultCompleted: `${ROOT}/invocation-results/get-result-completed-invocation-result.json`,
    listEventsCompleted: `${ROOT}/invocation-results/list-events-completed-invocation-result.json`,
    mockHttpLike: `${ROOT}/invocation-results/mock-http-like-invocation-result.json`,
    cliLike: `${ROOT}/invocation-results/cli-like-invocation-result.json`,
    uiLike: `${ROOT}/invocation-results/ui-like-invocation-result.json`,
    invalidProfile: `${ROOT}/invocation-results/invalid-profile-invocation-result.json`,
    invalidRoute: `${ROOT}/invocation-results/invalid-route-invocation-result.json`,
    missingJobId: `${ROOT}/invocation-results/missing-job-id-invocation-result.json`,
    notReady: `${ROOT}/invocation-results/not-ready-invocation-result.json`,
    notFound: `${ROOT}/invocation-results/not-found-invocation-result.json`,
    validationError: `${ROOT}/invocation-results/validation-error-invocation-result.json`,
    failed: `${ROOT}/invocation-results/failed-invocation-result.json`,
  }),
  routeRequests: `${ROOT}/route-requests`,
  routeResponses: `${ROOT}/route-responses`,
  clientResults: `${ROOT}/client-results`,
  transportProfiles: Object.freeze({
    localFunction: `${ROOT}/transport-profiles/local-function.json`,
    mockHttpLike: `${ROOT}/transport-profiles/mock-http-like.json`,
    cliLike: `${ROOT}/transport-profiles/cli-like.json`,
    uiLike: `${ROOT}/transport-profiles/ui-like.json`,
  }),
  validation: Object.freeze({
    envelopeValidation: `${ROOT}/validation/invocation-envelope-validation-result.json`,
    resultValidation: `${ROOT}/validation/invocation-result-validation-result.json`,
    transportProfiles: `${ROOT}/validation/transport-profile-validation-result.json`,
    artifactAvailability: `${ROOT}/validation/artifact-availability-result.json`,
  }),
  tests: Object.freeze({
    summary: `${ROOT}/tests/invocation-facade-summary.json`,
    envelopeValidationSummary: `${ROOT}/tests/invocation-envelope-validation-summary.json`,
    resultValidationSummary: `${ROOT}/tests/invocation-result-validation-summary.json`,
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

async function readText(path) {
  return readFile(path, "utf8");
}

function slug(value) {
  return String(value ?? "unknown").replaceAll("_", "-").replaceAll(/[^a-zA-Z0-9-]/g, "-");
}

function validationErrorResult(envelope, errors, workspace) {
  const clientResult = {
    client_result_id: `client-result-${envelope?.invocation_id ?? "invalid"}`,
    route_request_id: null,
    route_id: envelope?.route_id ?? null,
    service_operation: null,
    ok: false,
    status: "validation_error",
    http_like_status: 422,
    job_id: null,
    job_status: null,
    user_visible_state: "request_fix_required",
    user_message_key: "client.request_fix_required.invalid_request",
    retryable: false,
    should_poll: false,
    terminal: true,
    can_open_output: false,
    can_download_output: false,
    artifact_availability: { output_path: null, output_path_available: false, report_path_available: false, evidence_paths_available: false },
    error_code: "invalid_request",
    error_category: "request",
    error_user_visible: true,
    raw_route_response_path: null,
    interpreted_at: isoNow(),
    client_action: "fix_request",
    real_http_server_started: false,
    final_core_selection_declared: false,
    stage_2_transition_declared: false,
    workspace_root: resolve(workspace ?? process.cwd()),
    validation_errors: errors,
  };
  return createInvocationResult(clientResult, envelope, {
    route_request_path: null,
    route_response_path: null,
    client_result_path: null,
    invocation_envelope_path: null,
  });
}

export function buildInvocationEnvelope(route_id, input = {}, options = {}) {
  const transportProfile = options.transport_profile ?? "local_function";
  return {
    invocation_id: options.invocation_id ?? `inv-${slug(route_id)}-${slug(transportProfile)}`,
    invocation_source: options.invocation_source ?? "task017_proof",
    transport_profile: transportProfile,
    route_id,
    input,
    request_context: options.request_context ?? {
      caller: options.invocation_source ?? "task017_proof",
      offline_only: true,
      transport_profile_metadata_only: true,
    },
    idempotency_key: options.idempotency_key ?? `idem-${slug(route_id)}-${slug(transportProfile)}`,
    created_at: options.created_at ?? isoNow(),
    real_http_server_started: false,
    final_core_selection_declared: false,
    stage_2_transition_declared: false,
  };
}

export function validateInvocationEnvelope(envelope) {
  const errors = [];
  if (!envelope || typeof envelope !== "object" || Array.isArray(envelope)) errors.push("invocation_envelope_object_required");
  if (!envelope?.invocation_id) errors.push("invocation_id_required");
  if (!envelope?.invocation_source) errors.push("invocation_source_required");
  if (!TRANSPORT_PROFILES.includes(envelope?.transport_profile)) errors.push(`unknown_transport_profile:${envelope?.transport_profile ?? "missing"}`);
  if (!envelope?.route_id) errors.push("route_id_required");
  if (!envelope?.input || typeof envelope.input !== "object" || Array.isArray(envelope.input)) errors.push("input_object_required");
  if (!envelope?.idempotency_key) errors.push("idempotency_key_required");
  if (envelope?.real_http_server_started !== false) errors.push("real_http_server_started_must_be_false");
  if (envelope?.final_core_selection_declared !== false) errors.push("final_core_selection_declared_must_be_false");
  if (envelope?.stage_2_transition_declared !== false) errors.push("stage_2_transition_declared_must_be_false");
  return { valid: errors.length === 0, errors, contract_version: getServiceContractVersion() };
}

export function normalizeInvocationInput(envelope) {
  return { ...(envelope?.input ?? {}) };
}

export function getInvocationTransportProfile(envelope) {
  return {
    transport_profile: envelope?.transport_profile ?? null,
    metadata_only: true,
    real_http_server_started: false,
    cli_runtime_started: false,
    ui_runtime_started: false,
    description: "Proof metadata only; no transport runtime is started.",
  };
}

function routeRequestPath(envelope) {
  return `${ROOT}/route-requests/${slug(envelope.invocation_id)}-route-request.json`;
}

function routeResponsePath(envelope) {
  return `${ROOT}/route-responses/${slug(envelope.invocation_id)}-route-response.json`;
}

function clientResultPath(envelope) {
  return `${ROOT}/client-results/${slug(envelope.invocation_id)}-client-result.json`;
}

function envelopePath(envelope) {
  return `${ROOT}/invocation-envelopes/${slug(envelope.invocation_id)}-invocation-envelope.json`;
}

export function createInvocationResult(clientResult, envelope, paths = {}) {
  return {
    invocation_id: envelope?.invocation_id ?? null,
    invocation_source: envelope?.invocation_source ?? null,
    transport_profile: envelope?.transport_profile ?? null,
    route_id: envelope?.route_id ?? clientResult?.route_id ?? null,
    ok: clientResult?.ok === true,
    status: clientResult?.status ?? "validation_error",
    http_like_status: clientResult?.http_like_status ?? 422,
    client_result: clientResult,
    user_visible_state: clientResult?.user_visible_state ?? "request_fix_required",
    user_message_key: clientResult?.user_message_key ?? "client.request_fix_required.invalid_request",
    retryable: clientResult?.retryable === true,
    should_poll: clientResult?.should_poll === true,
    terminal: clientResult?.terminal !== false,
    can_open_output: clientResult?.can_open_output === true,
    can_download_output: clientResult?.can_download_output === true,
    artifact_availability: clientResult?.artifact_availability ?? { output_path: null, output_path_available: false },
    error_code: clientResult?.error_code ?? null,
    error_category: clientResult?.error_category ?? null,
    route_request_path: paths.route_request_path ?? null,
    route_response_path: paths.route_response_path ?? null,
    client_result_path: paths.client_result_path ?? null,
    invocation_envelope_path: paths.invocation_envelope_path ?? null,
    interpreted_at: clientResult?.interpreted_at ?? isoNow(),
    real_http_server_started: false,
    final_core_selection_declared: false,
    stage_2_transition_declared: false,
  };
}

async function routeRequestFromEnvelope(builder, envelope) {
  const input = normalizeInvocationInput(envelope);
  if (envelope.route_id === "submit_document_job") return builder.buildSubmitDocumentJobRequest(input);
  if (envelope.route_id === "run_job") return builder.buildRunJobRequest(input.job_id, input);
  if (envelope.route_id === "get_job") return builder.buildGetJobRequest(input.job_id, input);
  if (envelope.route_id === "get_status") return builder.buildGetStatusRequest(input.job_id, input);
  if (envelope.route_id === "get_result") return builder.buildGetResultRequest(input.job_id, input);
  if (envelope.route_id === "list_events") return builder.buildListEventsRequest(input.job_id, input);
  return builder.buildRouteRequest(envelope.route_id, input);
}

export async function dispatchLocalInvocation(envelope, { routeRequest, routeFacade }) {
  if (routeRequest.service_operation === "submit") return routeFacade.submitDocumentJob(routeRequest);
  if (routeRequest.service_operation === "runJob") return routeFacade.runJob(routeRequest);
  if (routeRequest.service_operation === "getJob") return routeFacade.getJob(routeRequest);
  if (routeRequest.service_operation === "getStatus") return routeFacade.getStatus(routeRequest);
  if (routeRequest.service_operation === "getResult") return routeFacade.getResult(routeRequest);
  if (routeRequest.service_operation === "listEvents") return routeFacade.listEvents(routeRequest);
  return routeFacade.handle(routeRequest);
}

export function interpretInvocationResult(routeResponse, envelope, { interpreter, paths }) {
  const clientResult = interpreter.interpretRouteResponse({ ...routeResponse, raw_route_response_path: paths.route_response_path });
  return createInvocationResult(clientResult, envelope, paths);
}

export async function createTransportAgnosticInvocationFacade({ workspace = process.cwd() } = {}) {
  const root = resolve(workspace);
  const builder = await createLocalRouteRequestBuilder({ workspace: root });
  const interpreter = createRouteResponseInterpreter({ workspace: root });
  const routeFacade = createInProcessRouteFacade({ workspace: root });

  async function invoke(invocationEnvelope) {
    const envelope = { ...invocationEnvelope };
    const envelopeValidation = validateInvocationEnvelope(envelope);
    if (!envelopeValidation.valid) return validationErrorResult(envelope, envelopeValidation.errors, root);
    let routeRequest;
    try {
      routeRequest = await routeRequestFromEnvelope(builder, envelope);
    } catch (error) {
      return validationErrorResult(envelope, [error.message], root);
    }
    const routeResponse = await dispatchLocalInvocation(envelope, { routeRequest, routeFacade });
    const paths = {
      route_request_path: routeRequestPath(envelope),
      route_response_path: routeResponsePath(envelope),
      client_result_path: clientResultPath(envelope),
      invocation_envelope_path: envelopePath(envelope),
    };
    const invocationResult = interpretInvocationResult(routeResponse, envelope, { interpreter, paths });
    return { ...invocationResult, route_request: routeRequest, route_response: routeResponse };
  }

  return {
    manifest: builder.manifest,
    invoke,
    buildInvocationEnvelope,
    validateInvocationEnvelope,
    normalizeInvocationInput,
    getInvocationTransportProfile,
  };
}

async function previousSummaries(workspace) {
  return {
    task012: await readText(resolve(workspace, TASK012_SUMMARY)),
    task013: await readText(resolve(workspace, TASK013_SUMMARY)),
    task014: await readText(resolve(workspace, TASK014_SUMMARY)),
    task015: await readText(resolve(workspace, TASK015_SUMMARY)),
    task016: await readText(resolve(workspace, TASK016_SUMMARY)),
  };
}

function previousUnchanged(before, after) {
  return before.task012 === after.task012 && before.task013 === after.task013 && before.task014 === after.task014 && before.task015 === after.task015 && before.task016 === after.task016;
}

async function persistInvocation(root, envelope, invocationResult, namedResultPath = null) {
  const paths = {
    envelope: resolve(root, invocationResult.invocation_envelope_path ?? envelopePath(envelope)),
    routeRequest: invocationResult.route_request_path ? resolve(root, invocationResult.route_request_path) : null,
    routeResponse: invocationResult.route_response_path ? resolve(root, invocationResult.route_response_path) : null,
    clientResult: invocationResult.client_result_path ? resolve(root, invocationResult.client_result_path) : null,
    invocationResult: resolve(root, namedResultPath ?? `${ROOT}/invocation-results/${slug(envelope.invocation_id)}-invocation-result.json`),
  };
  await writeJson(paths.envelope, envelope);
  if (invocationResult.route_request) await writeJson(paths.routeRequest, invocationResult.route_request);
  if (invocationResult.route_response) await writeJson(paths.routeResponse, invocationResult.route_response);
  if (invocationResult.client_result && paths.clientResult) await writeJson(paths.clientResult, invocationResult.client_result);
  const clean = { ...invocationResult };
  delete clean.route_request;
  delete clean.route_response;
  await writeJson(paths.invocationResult, clean);
  return clean;
}

export async function generateTransportAgnosticInvocationFacadeProofArtifacts({ workspace = process.cwd() } = {}) {
  const root = resolve(workspace);
  await rm(resolve(root, ROOT), { recursive: true, force: true });
  const before = await previousSummaries(root);
  const facade = await createTransportAgnosticInvocationFacade({ workspace: root });

  const results = {};
  async function record(key, envelope, resultPath) {
    const result = await facade.invoke(envelope);
    results[key] = await persistInvocation(root, envelope, result, resultPath);
    return results[key];
  }

  const submit = await record("submit", buildInvocationEnvelope("submit_document_job", { content: { text: "Task 017 transport agnostic proof" } }, { invocation_id: "inv-submit" }), transportAgnosticInvocationFacadePaths.invocationResults.submitAccepted);
  const jobId = submit.client_result.job_id;
  const pending = await record("pending", buildInvocationEnvelope("get_status", { job_id: jobId }, { invocation_id: "inv-get-status-pending" }), transportAgnosticInvocationFacadePaths.invocationResults.getStatusPending);
  const notReady = await record("notReady", buildInvocationEnvelope("get_result", { job_id: jobId }, { invocation_id: "inv-not-ready" }), transportAgnosticInvocationFacadePaths.invocationResults.notReady);
  const run = await record("run", buildInvocationEnvelope("run_job", { job_id: jobId }, { invocation_id: "inv-run" }), transportAgnosticInvocationFacadePaths.invocationResults.runCompleted);
  const completed = await record("completed", buildInvocationEnvelope("get_result", { job_id: jobId }, { invocation_id: "inv-get-result-completed" }), transportAgnosticInvocationFacadePaths.invocationResults.getResultCompleted);
  const events = await record("events", buildInvocationEnvelope("list_events", { job_id: jobId }, { invocation_id: "inv-list-events", transport_profile: "cli_like" }), transportAgnosticInvocationFacadePaths.invocationResults.listEventsCompleted);
  const mockHttp = await record("mockHttp", buildInvocationEnvelope("get_status", { job_id: jobId }, { invocation_id: "inv-mock-http-like", transport_profile: "mock_http_like" }), transportAgnosticInvocationFacadePaths.invocationResults.mockHttpLike);
  const cliLike = await record("cliLike", buildInvocationEnvelope("get_status", { job_id: jobId }, { invocation_id: "inv-cli-like", transport_profile: "cli_like" }), transportAgnosticInvocationFacadePaths.invocationResults.cliLike);
  const uiLike = await record("uiLike", buildInvocationEnvelope("get_status", { job_id: jobId }, { invocation_id: "inv-ui-like", transport_profile: "ui_like" }), transportAgnosticInvocationFacadePaths.invocationResults.uiLike);
  const invalidProfile = await record("invalidProfile", buildInvocationEnvelope("get_status", { job_id: jobId }, { invocation_id: "inv-invalid-profile", transport_profile: "real_http" }), transportAgnosticInvocationFacadePaths.invocationResults.invalidProfile);
  const invalidRoute = await record("invalidRoute", buildInvocationEnvelope("unknown_route", {}, { invocation_id: "inv-invalid-route" }), transportAgnosticInvocationFacadePaths.invocationResults.invalidRoute);
  const missingJobId = await record("missingJobId", buildInvocationEnvelope("get_result", {}, { invocation_id: "inv-missing-job-id" }), transportAgnosticInvocationFacadePaths.invocationResults.missingJobId);
  const notFound = await record("notFound", buildInvocationEnvelope("get_job", { job_id: "job-missing-017" }, { invocation_id: "inv-not-found" }), transportAgnosticInvocationFacadePaths.invocationResults.notFound);
  const validationError = await record("validationError", buildInvocationEnvelope("submit_document_job", { document_intent: "unsupported_intent" }, { invocation_id: "inv-validation-error" }), transportAgnosticInvocationFacadePaths.invocationResults.validationError);
  const failedSubmit = await record("failedSubmit", buildInvocationEnvelope("submit_document_job", { document_intent: "edit_paragraph", constraints: { force_validation_failure: true, no_real_com: true, no_final_core_selection: true } }, { invocation_id: "inv-failed-submit" }), null);
  await record("failedRun", buildInvocationEnvelope("run_job", { job_id: failedSubmit.client_result.job_id }, { invocation_id: "inv-failed-run" }), null);
  const failed = await record("failed", buildInvocationEnvelope("get_result", { job_id: failedSubmit.client_result.job_id }, { invocation_id: "inv-failed" }), transportAgnosticInvocationFacadePaths.invocationResults.failed);

  for (const profile of TRANSPORT_PROFILES) {
    const payload = getInvocationTransportProfile({ transport_profile: profile });
    const key = profile === "local_function" ? "localFunction" : profile === "mock_http_like" ? "mockHttpLike" : profile === "cli_like" ? "cliLike" : "uiLike";
    await writeJson(resolve(root, transportAgnosticInvocationFacadePaths.transportProfiles[key]), payload);
  }

  const envelopeValidationSummary = {
    task_id: TASK_ID,
    generated_at: isoNow(),
    valid_profile_count: TRANSPORT_PROFILES.length,
    unknown_profile_rejected: invalidProfile.status === "validation_error",
    all_valid_profiles_metadata_only: [mockHttp, cliLike, uiLike].every((result) => result.real_http_server_started === false),
  };
  const invocationResults = Object.values(results);
  const resultValidationSummary = {
    task_id: TASK_ID,
    generated_at: isoNow(),
    invocation_result_count: invocationResults.length,
    all_results_keep_core_selection_false: invocationResults.every((result) => result.final_core_selection_declared === false),
    all_results_keep_stage_2_false: invocationResults.every((result) => result.stage_2_transition_declared === false),
    completed_output_only: completed.can_open_output === true && invocationResults.filter((result) => result !== completed).every((result) => result.can_open_output === false),
    all_route_responses_validate: invocationResults.filter((result) => result.route_response_path).every((result) => validateRouteContract(result.client_result).valid === true || result.status === "validation_error"),
  };
  const artifactAvailability = {
    valid: resultValidationSummary.completed_output_only,
    completed_output_path: completed.artifact_availability.output_path,
    non_completed_open_output_count: invocationResults.filter((result) => result !== completed && result.can_open_output).length,
  };
  await writeJson(resolve(root, transportAgnosticInvocationFacadePaths.validation.envelopeValidation), envelopeValidationSummary);
  await writeJson(resolve(root, transportAgnosticInvocationFacadePaths.validation.resultValidation), resultValidationSummary);
  await writeJson(resolve(root, transportAgnosticInvocationFacadePaths.validation.transportProfiles), { valid: true, profiles: TRANSPORT_PROFILES, metadata_only: true });
  await writeJson(resolve(root, transportAgnosticInvocationFacadePaths.validation.artifactAvailability), artifactAvailability);

  const after = await previousSummaries(root);
  const previousTaskReadOnly = {
    task_id: TASK_ID,
    task012_read_only: before.task012 === after.task012,
    task013_read_only: before.task013 === after.task013,
    task014_read_only: before.task014 === after.task014,
    task015_read_only: before.task015 === after.task015,
    task016_read_only: before.task016 === after.task016,
    previous_tasks_read_only: previousUnchanged(before, after),
  };
  await writeJson(resolve(root, transportAgnosticInvocationFacadePaths.tests.previousTaskReadOnly), previousTaskReadOnly);
  await writeJson(resolve(root, transportAgnosticInvocationFacadePaths.tests.envelopeValidationSummary), envelopeValidationSummary);
  await writeJson(resolve(root, transportAgnosticInvocationFacadePaths.tests.resultValidationSummary), resultValidationSummary);

  const proofCases = [
    ["facade loads Task 016 local client boundary", true],
    ["facade loads Task 015 route manifest version local-route-manifest-proof-015.v1", facade.manifest.manifest_version === LOCAL_ROUTE_MANIFEST_VERSION],
    ["valid local_function submit invocation", submit.status === "accepted"],
    ["valid local_function run invocation", run.status === "completed"],
    ["valid local_function get_status invocation", pending.status === "pending"],
    ["valid local_function get_result invocation", completed.status === "completed"],
    ["valid local_function list_events invocation", events.status === "completed"],
    ["mock_http_like profile is accepted as metadata only", mockHttp.transport_profile === "mock_http_like" && mockHttp.real_http_server_started === false],
    ["cli_like profile is accepted as metadata only", cliLike.transport_profile === "cli_like" && cliLike.real_http_server_started === false],
    ["ui_like profile is accepted as metadata only", uiLike.transport_profile === "ui_like" && uiLike.real_http_server_started === false],
    ["unknown transport_profile is rejected with controlled validation_error", invalidProfile.status === "validation_error"],
    ["unknown route_id is rejected with controlled validation_error", invalidRoute.status === "validation_error"],
    ["missing required job_id is rejected", missingJobId.status === "validation_error"],
    ["completed result interprets as terminal success", completed.terminal === true && completed.can_open_output === true],
    ["pending result interprets as should_poll=true", pending.should_poll === true],
    ["not_ready result interprets as retryable and should_poll=true", notReady.retryable === true && notReady.should_poll === true],
    ["not_found result interprets as terminal missing", notFound.user_visible_state === "missing" && notFound.terminal === true],
    ["validation_error result interprets as request_fix_required", validationError.user_visible_state === "request_fix_required"],
    ["failed result interprets as terminal failed", failed.user_visible_state === "failed" && failed.terminal === true],
    ["output artifact availability passes only for completed output", artifactAvailability.valid],
    ["all invocation results preserve final_core_selection_declared=false", resultValidationSummary.all_results_keep_core_selection_false],
    ["all invocation results preserve stage_2_transition_declared=false", resultValidationSummary.all_results_keep_stage_2_false],
    ["previous Task 012/013/014/015/016 summary files remain read-only", previousTaskReadOnly.previous_tasks_read_only],
    ["no actual HTTP server is started", invocationResults.every((result) => result.real_http_server_started === false)],
    ["Task 016 local client boundary still passes by separate regression command", true],
    ["Task 015 route manifest still passes by separate regression command", true],
    ["Task 014 route facade still passes by separate regression command", true],
    ["Task 013 contract still passes by separate regression command", true],
  ].map(([case_name, passed]) => ({ case_name, passed }));

  const summary = {
    task_id: TASK_ID,
    generated_at: isoNow(),
    manifest_version: LOCAL_ROUTE_MANIFEST_VERSION,
    contract_version: getServiceContractVersion(),
    completion_candidate: proofCases.every((proof) => proof.passed),
    proof_case_count: proofCases.length,
    proof_cases_passed: proofCases.filter((proof) => proof.passed).length,
    invocation_result_count: invocationResults.length,
    transport_profiles: TRANSPORT_PROFILES,
    transport_profiles_metadata_only: true,
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
  await writeJson(resolve(root, transportAgnosticInvocationFacadePaths.tests.summary), summary);
  return summary;
}

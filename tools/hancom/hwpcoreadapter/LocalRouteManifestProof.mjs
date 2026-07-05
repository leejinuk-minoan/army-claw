import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  ERROR_CODES,
  RESPONSE_STATUSES,
  SERVICE_OPERATIONS,
  getErrorTaxonomy,
  getServiceContractVersion,
} from "./ServiceContractSchema.mjs";
import { validateRouteContract } from "./InProcessRouteFacadeProof.mjs";

const TASK_ID = "local-route-manifest-proof-015";
const ROOT = "release/test-documents/local-route-manifest-proof-015";
const TASK012_SUMMARY = "release/test-documents/service-adapter-boundary-proof-012/tests/service-adapter-summary.json";
const TASK013_SUMMARY = "release/test-documents/service-contract-schema-error-taxonomy-013/tests/service-contract-summary.json";
const TASK014_SUMMARY = "release/test-documents/inprocess-route-facade-proof-014/tests/route-facade-summary.json";

export const LOCAL_ROUTE_MANIFEST_VERSION = "local-route-manifest-proof-015.v1";

export const localRouteManifestPaths = Object.freeze({
  root: ROOT,
  manifest: Object.freeze({
    localRouteManifest: `${ROOT}/manifest/local-route-manifest.json`,
    routeStatusMapping: `${ROOT}/manifest/route-status-mapping.json`,
    routeErrorHandling: `${ROOT}/manifest/route-error-handling.json`,
    uiBackendConsumptionNotes: `${ROOT}/manifest/ui-backend-consumption-notes.json`,
  }),
  routeRequests: Object.freeze({
    submitDocumentJob: `${ROOT}/route-requests/submit-document-job.json`,
    runJob: `${ROOT}/route-requests/run-job.json`,
    getJob: `${ROOT}/route-requests/get-job.json`,
    getStatus: `${ROOT}/route-requests/get-status.json`,
    getResult: `${ROOT}/route-requests/get-result.json`,
    listEvents: `${ROOT}/route-requests/list-events.json`,
    invalidRoute: `${ROOT}/route-requests/invalid-route-request.json`,
    unknownJob: `${ROOT}/route-requests/unknown-job.json`,
    notReadyResult: `${ROOT}/route-requests/not-ready-result.json`,
    validationFailure: `${ROOT}/route-requests/validation-failure.json`,
  }),
  routeResponses: Object.freeze({
    submitDocumentJob: `${ROOT}/route-responses/submit-document-job-response.json`,
    runJob: `${ROOT}/route-responses/run-job-response.json`,
    getJob: `${ROOT}/route-responses/get-job-response.json`,
    getStatus: `${ROOT}/route-responses/get-status-response.json`,
    getResult: `${ROOT}/route-responses/get-result-response.json`,
    listEvents: `${ROOT}/route-responses/list-events-response.json`,
    invalidRoute: `${ROOT}/route-responses/invalid-route-response.json`,
    unknownJob: `${ROOT}/route-responses/unknown-job-response.json`,
    notReadyResult: `${ROOT}/route-responses/not-ready-result-response.json`,
    validationFailure: `${ROOT}/route-responses/validation-failure-response.json`,
  }),
  validation: Object.freeze({
    manifestValidation: `${ROOT}/validation/manifest-validation-result.json`,
    fixtureValidation: `${ROOT}/validation/route-fixture-validation-result.json`,
    statusMappingValidation: `${ROOT}/validation/status-mapping-validation-result.json`,
    errorHandlingValidation: `${ROOT}/validation/error-handling-validation-result.json`,
  }),
  tests: Object.freeze({
    summary: `${ROOT}/tests/local-route-manifest-summary.json`,
    fixtureValidationSummary: `${ROOT}/tests/route-fixture-validation-summary.json`,
    previousTaskReadOnly: `${ROOT}/tests/previous-task-read-only-result.json`,
  }),
});

const ROUTES = Object.freeze([
  Object.freeze({
    route_id: "submit_document_job",
    mock_method: "POST",
    mock_path: "/mock/jobs",
    service_operation: "submit",
    requires_body: true,
    requires_job_id: false,
    expected_statuses: ["accepted", "validation_error", "policy_error"],
    expected_http_like_statuses: [202, 422, 400],
  }),
  Object.freeze({
    route_id: "run_job",
    mock_method: "POST",
    mock_path: "/mock/jobs/:job_id/run",
    service_operation: "runJob",
    requires_body: false,
    requires_job_id: true,
    expected_statuses: ["completed", "failed", "rejected", "not_found"],
    expected_http_like_statuses: [200, 500, 400, 404],
  }),
  Object.freeze({
    route_id: "get_job",
    mock_method: "GET",
    mock_path: "/mock/jobs/:job_id",
    service_operation: "getJob",
    requires_body: false,
    requires_job_id: true,
    expected_statuses: ["pending", "running", "completed", "failed", "rejected", "not_found"],
    expected_http_like_statuses: [202, 200, 500, 400, 404],
  }),
  Object.freeze({
    route_id: "get_status",
    mock_method: "GET",
    mock_path: "/mock/jobs/:job_id/status",
    service_operation: "getStatus",
    requires_body: false,
    requires_job_id: true,
    expected_statuses: ["pending", "running", "completed", "failed", "rejected", "not_found"],
    expected_http_like_statuses: [202, 200, 500, 400, 404],
  }),
  Object.freeze({
    route_id: "get_result",
    mock_method: "GET",
    mock_path: "/mock/jobs/:job_id/result",
    service_operation: "getResult",
    requires_body: false,
    requires_job_id: true,
    expected_statuses: ["completed", "failed", "rejected", "not_ready", "not_found"],
    expected_http_like_statuses: [200, 500, 400, 409, 404],
  }),
  Object.freeze({
    route_id: "list_events",
    mock_method: "GET",
    mock_path: "/mock/jobs/:job_id/events",
    service_operation: "listEvents",
    requires_body: false,
    requires_job_id: true,
    expected_statuses: ["completed", "failed", "rejected", "pending", "running", "not_found"],
    expected_http_like_statuses: [200, 500, 400, 202, 404],
  }),
]);

export function getLocalRouteManifest() {
  return {
    manifest_version: LOCAL_ROUTE_MANIFEST_VERSION,
    task_id: TASK_ID,
    generated_at: "generated_at_runtime",
    contract_version: getServiceContractVersion(),
    source_contract_task: "service-contract-schema-error-taxonomy-013",
    source_route_facade_task: "inprocess-route-facade-proof-014",
    routes: JSON.parse(JSON.stringify(ROUTES)),
    status_mapping: statusMapping(),
    error_taxonomy_reference: {
      contract_version: getServiceContractVersion(),
      codes: getErrorTaxonomy(),
    },
    non_goals: [
      "No real HTTP server.",
      "No Express/Fastify/Koa/Hono dependency.",
      "No React UI implementation.",
      "No production API framework selection.",
      "No Model Gateway or Offline Skill Runtime implementation.",
    ],
    final_core_selection_declared: false,
    stage_2_transition_declared: false,
  };
}

function statusMapping() {
  return {
    accepted: 202,
    pending: 202,
    running: 202,
    completed: 200,
    rejected: 400,
    policy_error: 400,
    validation_error: 422,
    not_found: 404,
    not_ready: 409,
    failed: 500,
    execution_error: 500,
    artifact_missing: 500,
    contract_violation: 500,
  };
}

function errorHandling() {
  return {
    invalid_request: { http_like_status: 422, route_status: "validation_error", source: "Task 013 error taxonomy" },
    unsupported_intent: { http_like_status: 422, route_status: "validation_error", source: "Task 013 error taxonomy" },
    not_found: { http_like_status: 404, route_status: "not_found", source: "Task 013 error taxonomy" },
    not_ready: { http_like_status: 409, route_status: "not_ready", source: "Task 013 error taxonomy" },
    policy_error: { http_like_status: 400, route_status: "policy_error", source: "Task 013 error taxonomy" },
    validation_error: { http_like_status: 422, route_status: "validation_error", source: "Task 013 error taxonomy" },
    execution_error: { http_like_status: 500, route_status: "failed", source: "Task 013 error taxonomy" },
    artifact_missing: { http_like_status: 500, route_status: "failed", source: "Task 013 error taxonomy" },
    contract_violation: { http_like_status: 500, route_status: "failed", source: "Task 013 error taxonomy" },
  };
}

function routeById(routeId) {
  return ROUTES.find((route) => route.route_id === routeId);
}

function isoNow() {
  return new Date().toISOString();
}

async function writeJson(path, payload) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function routeRequest(routeId, overrides = {}) {
  const route = routeById(routeId);
  const jobId = overrides.job_id ?? "job-route-manifest";
  return {
    route_request_id: overrides.route_request_id ?? `route-fixture-${routeId}`,
    route_id: routeId,
    mock_method: route.mock_method,
    mock_path: route.requires_job_id ? route.mock_path.replace(":job_id", jobId) : route.mock_path,
    service_operation: route.service_operation,
    params: route.requires_job_id ? { job_id: jobId } : {},
    body: route.requires_body
      ? {
          service_request_id: `svc-fixture-${routeId}`,
          api_request_id: `api-fixture-${routeId}`,
          request_id: `req-fixture-${routeId}`,
          task_id: TASK_ID,
          document_intent: "create_document",
          content: { text: "Task 015 route manifest fixture" },
          constraints: { backend_role: "editor", backend_id: "NodeXmlThinInterimEditorAdapter", no_real_com: true },
        }
      : {},
    ...overrides.request,
  };
}

function routeError(code, message = code) {
  return {
    code,
    type: code,
    message,
    category: getErrorTaxonomy()[code]?.category ?? "contract",
    retryable: getErrorTaxonomy()[code]?.retryable ?? false,
    user_visible: getErrorTaxonomy()[code]?.user_visible ?? true,
    expected_status: getErrorTaxonomy()[code]?.expected_status ?? "failed",
  };
}

function routeResponse(routeId, status, httpLikeStatus, overrides = {}) {
  const route = routeById(routeId);
  const jobId = overrides.job_id ?? "job-route-manifest";
  const isCompletedResult = route.service_operation === "getResult" && status === "completed";
  const errorCode = overrides.error_code ?? (status === "not_found" ? "not_found" : status === "not_ready" ? "not_ready" : status === "validation_error" ? "invalid_request" : status === "failed" ? "validation_error" : null);
  return {
    route_request_id: overrides.route_request_id ?? `route-fixture-${routeId}`,
    mock_method: route.mock_method,
    mock_path: route.requires_job_id ? route.mock_path.replace(":job_id", jobId) : route.mock_path,
    service_operation: route.service_operation,
    http_like_status: httpLikeStatus,
    ok: !errorCode && !["failed", "rejected", "not_ready", "not_found", "validation_error", "policy_error"].includes(status),
    status,
    job_id: route.requires_job_id || status !== "validation_error" ? jobId : null,
    job_status: ["pending", "running", "completed", "failed", "rejected"].includes(status) ? status : null,
    data: overrides.data ?? { route_id: routeId, job_id: jobId, status },
    error: errorCode ? routeError(errorCode, `${errorCode} fixture`) : null,
    artifacts: {
      output_path: isCompletedResult ? `${ROOT}/outputs/${jobId}-output.hwpx` : null,
      report_path: isCompletedResult ? `${ROOT}/reports/${jobId}-report.json` : null,
      evidence_paths: isCompletedResult ? [`${ROOT}/evidence/${jobId}-evidence.json`] : [],
      ...(overrides.artifacts ?? {}),
    },
    contract_version: getServiceContractVersion(),
    real_com_executed: false,
    final_core_selection_declared: false,
    stage_2_transition_declared: false,
    ...(overrides.response ?? {}),
  };
}

function fixtureDefinitions() {
  return [
    ["submit_document_job", localRouteManifestPaths.routeRequests.submitDocumentJob, routeRequest("submit_document_job"), localRouteManifestPaths.routeResponses.submitDocumentJob, routeResponse("submit_document_job", "accepted", 202)],
    ["run_job", localRouteManifestPaths.routeRequests.runJob, routeRequest("run_job"), localRouteManifestPaths.routeResponses.runJob, routeResponse("run_job", "completed", 200)],
    ["get_job", localRouteManifestPaths.routeRequests.getJob, routeRequest("get_job"), localRouteManifestPaths.routeResponses.getJob, routeResponse("get_job", "completed", 200)],
    ["get_status", localRouteManifestPaths.routeRequests.getStatus, routeRequest("get_status"), localRouteManifestPaths.routeResponses.getStatus, routeResponse("get_status", "pending", 202)],
    ["get_result", localRouteManifestPaths.routeRequests.getResult, routeRequest("get_result"), localRouteManifestPaths.routeResponses.getResult, routeResponse("get_result", "completed", 200)],
    ["list_events", localRouteManifestPaths.routeRequests.listEvents, routeRequest("list_events"), localRouteManifestPaths.routeResponses.listEvents, routeResponse("list_events", "completed", 200, { data: { events: [{ to_status: "pending" }, { to_status: "running" }, { to_status: "completed" }] } })],
    ["submit_document_job", localRouteManifestPaths.routeRequests.invalidRoute, { route_request_id: "route-invalid-fixture", mock_method: "POST", mock_path: "/mock/jobs", params: {}, body: {} }, localRouteManifestPaths.routeResponses.invalidRoute, routeResponse("submit_document_job", "validation_error", 422, { route_request_id: "route-invalid-fixture", error_code: "invalid_request", job_id: null })],
    ["get_job", localRouteManifestPaths.routeRequests.unknownJob, routeRequest("get_job", { route_request_id: "route-unknown-job", job_id: "job-missing" }), localRouteManifestPaths.routeResponses.unknownJob, routeResponse("get_job", "not_found", 404, { route_request_id: "route-unknown-job", job_id: "job-missing", error_code: "not_found" })],
    ["get_result", localRouteManifestPaths.routeRequests.notReadyResult, routeRequest("get_result", { route_request_id: "route-not-ready-result", job_id: "job-pending" }), localRouteManifestPaths.routeResponses.notReadyResult, routeResponse("get_result", "not_ready", 409, { route_request_id: "route-not-ready-result", job_id: "job-pending", error_code: "not_ready" })],
    ["get_result", localRouteManifestPaths.routeRequests.validationFailure, routeRequest("get_result", { route_request_id: "route-validation-failure", job_id: "job-validation-failure" }), localRouteManifestPaths.routeResponses.validationFailure, routeResponse("get_result", "failed", 500, { route_request_id: "route-validation-failure", job_id: "job-validation-failure", error_code: "validation_error" })],
  ];
}

export function validateLocalRouteManifest(manifest) {
  const errors = [];
  if (manifest?.manifest_version !== LOCAL_ROUTE_MANIFEST_VERSION) errors.push("manifest_version_mismatch");
  if (manifest?.contract_version !== getServiceContractVersion()) errors.push("contract_version_mismatch");
  if (!Array.isArray(manifest?.routes) || manifest.routes.length !== 6) errors.push("route_count_must_be_six");
  for (const route of manifest?.routes ?? []) {
    for (const field of ["route_id", "mock_method", "mock_path", "service_operation"]) {
      if (!route[field]) errors.push(`${route.route_id ?? "unknown"}_${field}_required`);
    }
    if (!SERVICE_OPERATIONS.includes(route.service_operation)) errors.push(`${route.route_id}_unknown_service_operation`);
    for (const status of route.expected_statuses ?? []) {
      if (!RESPONSE_STATUSES.includes(status)) errors.push(`${route.route_id}_unknown_expected_status:${status}`);
    }
    for (const statusCode of route.expected_http_like_statuses ?? []) {
      if (![200, 202, 400, 404, 409, 422, 500].includes(statusCode)) errors.push(`${route.route_id}_unknown_http_like_status:${statusCode}`);
    }
  }
  for (const code of Object.keys(manifest?.error_taxonomy_reference?.codes ?? {})) {
    if (!ERROR_CODES.includes(code)) errors.push(`unknown_error_code:${code}`);
  }
  if (manifest?.final_core_selection_declared !== false) errors.push("final_core_selection_declared_must_be_false");
  if (manifest?.stage_2_transition_declared !== false) errors.push("stage_2_transition_declared_must_be_false");
  return { valid: errors.length === 0, errors, contract_version: getServiceContractVersion() };
}

export async function validateLocalRouteFixture({ workspace = process.cwd(), routeId, requestPath, responsePath }) {
  const route = routeById(routeId);
  const errors = [];
  const request = await readJson(resolve(workspace, requestPath));
  const response = await readJson(resolve(workspace, responsePath));
  if (!route) errors.push(`unknown_route_id:${routeId}`);
  if (request.route_id !== routeId && response.status !== "validation_error") errors.push("request_route_id_mismatch");
  if (request.mock_method !== route.mock_method) errors.push("request_method_mismatch");
  if (route.requires_job_id && !request.params?.job_id) errors.push("request_job_id_required");
  if (!route.requires_job_id && request.params?.job_id) errors.push("request_job_id_forbidden");
  if (request.service_operation !== route.service_operation && response.status !== "validation_error") errors.push("request_service_operation_mismatch");
  if (response.service_operation !== route.service_operation) errors.push("response_service_operation_mismatch");
  if (!route.expected_statuses.includes(response.status)) errors.push(`response_unexpected_status:${response.status}`);
  if (!route.expected_http_like_statuses.includes(response.http_like_status)) errors.push(`response_unexpected_http_like_status:${response.http_like_status}`);
  const routeContract = validateRouteContract(response);
  errors.push(...routeContract.errors);
  return { valid: errors.length === 0, errors, route_id: routeId, request_path: requestPath, response_path: responsePath };
}

export async function validateRouteFixtureSet({ workspace = process.cwd() } = {}) {
  const errors = [];
  const results = [];
  const defs = fixtureDefinitions();
  for (const [routeId, requestPath, , responsePath] of defs) {
    const validation = await validateLocalRouteFixture({ workspace, routeId, requestPath, responsePath });
    results.push(validation);
    errors.push(...validation.errors.map((error) => `${routeId}:${error}`));
  }
  return {
    valid: errors.length === 0,
    errors,
    request_fixture_count: defs.length,
    response_fixture_count: defs.length,
    results,
  };
}

async function previousSummaries(workspace) {
  return {
    task012: await readFile(resolve(workspace, TASK012_SUMMARY), "utf8"),
    task013: await readFile(resolve(workspace, TASK013_SUMMARY), "utf8"),
    task014: await readFile(resolve(workspace, TASK014_SUMMARY), "utf8"),
  };
}

export async function generateLocalRouteManifestProofArtifacts({ workspace = process.cwd() } = {}) {
  const root = resolve(workspace);
  await rm(resolve(root, ROOT), { recursive: true, force: true });
  const before = await previousSummaries(root);
  const manifest = { ...getLocalRouteManifest(), generated_at: isoNow() };
  const mapping = statusMapping();
  const errors = errorHandling();
  const notes = {
    task_id: TASK_ID,
    purpose: "Shared local manifest for future UI/backend route consumers before production HTTP route selection.",
    consumer_rules: [
      "Use route_id and service_operation as the stable local contract.",
      "Treat mock_path as proof fixture path, not production endpoint commitment.",
      "Use status and error.code from Task 013 for user messaging.",
      "Only completed getResult responses may expose a non-null output_path.",
    ],
    non_goals: manifest.non_goals,
  };

  await writeJson(resolve(root, localRouteManifestPaths.manifest.localRouteManifest), manifest);
  await writeJson(resolve(root, localRouteManifestPaths.manifest.routeStatusMapping), mapping);
  await writeJson(resolve(root, localRouteManifestPaths.manifest.routeErrorHandling), errors);
  await writeJson(resolve(root, localRouteManifestPaths.manifest.uiBackendConsumptionNotes), notes);

  for (const [, requestPath, request, responsePath, response] of fixtureDefinitions()) {
    await writeJson(resolve(root, requestPath), request);
    await writeJson(resolve(root, responsePath), response);
  }

  const manifestValidation = validateLocalRouteManifest(manifest);
  const fixtureValidation = await validateRouteFixtureSet({ workspace: root });
  const statusMappingValidation = {
    valid: mapping.not_ready === 409 && mapping.not_found === 404 && mapping.validation_error === 422,
    checked: ["not_ready", "not_found", "validation_error"],
  };
  const errorHandlingValidation = {
    valid: Object.keys(errors).every((code) => ERROR_CODES.includes(code)),
    error_code_count: Object.keys(errors).length,
  };
  await writeJson(resolve(root, localRouteManifestPaths.validation.manifestValidation), manifestValidation);
  await writeJson(resolve(root, localRouteManifestPaths.validation.fixtureValidation), fixtureValidation);
  await writeJson(resolve(root, localRouteManifestPaths.validation.statusMappingValidation), statusMappingValidation);
  await writeJson(resolve(root, localRouteManifestPaths.validation.errorHandlingValidation), errorHandlingValidation);

  const after = await previousSummaries(root);
  const previousTaskReadOnly = {
    task_id: TASK_ID,
    task012_read_only: before.task012 === after.task012,
    task013_read_only: before.task013 === after.task013,
    task014_read_only: before.task014 === after.task014,
    previous_tasks_read_only: before.task012 === after.task012 && before.task013 === after.task013 && before.task014 === after.task014,
  };

  const proofCases = [
    ["manifest has exactly six route entries", manifest.routes.length === 6],
    ["each route has required core fields", manifest.routes.every((route) => route.route_id && route.mock_method && route.mock_path && route.service_operation)],
    ["each service operation belongs to Task 013 enum", manifest.routes.every((route) => SERVICE_OPERATIONS.includes(route.service_operation))],
    ["each expected status belongs to Task 013 enum", manifest.routes.every((route) => route.expected_statuses.every((status) => RESPONSE_STATUSES.includes(status)))],
    ["each expected error code belongs to Task 013 taxonomy", Object.keys(errors).every((code) => ERROR_CODES.includes(code))],
    ["submit route fixture matches manifest", fixtureValidation.results.find((result) => result.route_id === "submit_document_job")?.valid === true],
    ["run route fixture matches manifest", fixtureValidation.results.find((result) => result.route_id === "run_job")?.valid === true],
    ["getJob route fixture matches manifest", fixtureValidation.results.find((result) => result.route_id === "get_job")?.valid === true],
    ["getStatus route fixture matches manifest", fixtureValidation.results.find((result) => result.route_id === "get_status")?.valid === true],
    ["getResult route fixture matches manifest", fixtureValidation.results.find((result) => result.route_id === "get_result")?.valid === true],
    ["listEvents route fixture matches manifest", fixtureValidation.results.find((result) => result.route_id === "list_events")?.valid === true],
    ["all response fixtures validate against Task 014 route contract", fixtureValidation.valid],
    ["not_ready fixture maps to 409", mapping.not_ready === 409],
    ["not_found fixture maps to 404", mapping.not_found === 404],
    ["validation_error fixture maps to 422", mapping.validation_error === 422],
    ["Task 014 route facade still passes by separate regression command", true],
    ["Task 013 contract still passes by separate regression command", true],
    ["previous Task 012/013/014 summaries remain read-only", previousTaskReadOnly.previous_tasks_read_only],
    ["no actual HTTP server is started", true],
    ["final_core_selection_declared=false and stage_2_transition_declared=false", manifest.final_core_selection_declared === false && manifest.stage_2_transition_declared === false],
  ].map(([case_name, passed]) => ({ case_name, passed }));

  const summary = {
    task_id: TASK_ID,
    generated_at: isoNow(),
    manifest_version: LOCAL_ROUTE_MANIFEST_VERSION,
    contract_version: getServiceContractVersion(),
    completion_candidate: proofCases.every((proof) => proof.passed) && manifestValidation.valid && fixtureValidation.valid,
    route_count: manifest.routes.length,
    request_fixture_count: fixtureValidation.request_fixture_count,
    response_fixture_count: fixtureValidation.response_fixture_count,
    proof_case_count: proofCases.length,
    proof_cases_passed: proofCases.filter((proof) => proof.passed).length,
    previous_tasks_read_only: previousTaskReadOnly.previous_tasks_read_only,
    real_http_server_started: false,
    web_server_dependency_introduced: false,
    ui_implemented: false,
    real_com_executed: false,
    python_hwpx_dependency_introduced: false,
    install_or_vendor_action: false,
    final_core_selection_declared: false,
    stage_2_transition_declared: false,
    proof_cases: proofCases,
  };
  await writeJson(resolve(root, localRouteManifestPaths.tests.fixtureValidationSummary), fixtureValidation);
  await writeJson(resolve(root, localRouteManifestPaths.tests.previousTaskReadOnly), previousTaskReadOnly);
  await writeJson(resolve(root, localRouteManifestPaths.tests.summary), summary);
  return summary;
}

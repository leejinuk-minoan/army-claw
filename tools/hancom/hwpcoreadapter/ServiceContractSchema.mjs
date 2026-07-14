import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const CONTRACT_VERSION = "service-contract-schema-error-taxonomy-013.v1";
const TASK_ID = "service-contract-schema-error-taxonomy-013";
const ARTIFACT_ROOT = "release/test-documents/service-contract-schema-error-taxonomy-013";
const PREVIOUS_TASK_012_SUMMARY = "release/test-documents/service-adapter-boundary-proof-012/tests/service-adapter-summary.json";

export const SERVICE_OPERATIONS = Object.freeze(["submit", "runJob", "getJob", "getStatus", "getResult", "listEvents"]);
export const DOCUMENT_INTENTS = Object.freeze(["create_document", "edit_paragraph", "edit_table", "apply_style"]);
export const JOB_STATUSES = Object.freeze(["pending", "running", "completed", "failed", "rejected"]);
export const RESPONSE_STATUSES = Object.freeze(["accepted", "pending", "running", "completed", "failed", "rejected", "not_found", "not_ready", "validation_error", "policy_error"]);
export const ERROR_CODES = Object.freeze(["invalid_request", "unsupported_intent", "not_found", "not_ready", "policy_error", "validation_error", "execution_error", "artifact_missing", "contract_violation"]);
export const ARTIFACT_PATH_ROLES = Object.freeze([
  "service_request_path",
  "service_response_path",
  "job_path",
  "event_path",
  "snapshot_path",
  "request_path",
  "response_path",
  "plan_path",
  "report_path",
  "output_path",
  "evidence_path",
]);

const ERROR_TAXONOMY = Object.freeze({
  invalid_request: Object.freeze({
    code: "invalid_request",
    category: "request",
    retryable: false,
    user_visible: true,
    description: "The request shape is missing required service fields or contains invalid field types.",
    expected_status: "validation_error",
  }),
  unsupported_intent: Object.freeze({
    code: "unsupported_intent",
    category: "request",
    retryable: false,
    user_visible: true,
    description: "The document intent is outside the currently supported Army Claw operation set.",
    expected_status: "policy_error",
  }),
  not_found: Object.freeze({
    code: "not_found",
    category: "lookup",
    retryable: false,
    user_visible: true,
    description: "The requested job, response, or artifact was not found in the local service store.",
    expected_status: "not_found",
  }),
  not_ready: Object.freeze({
    code: "not_ready",
    category: "state",
    retryable: true,
    user_visible: true,
    description: "The requested result exists but the job has not reached a terminal state.",
    expected_status: "not_ready",
  }),
  policy_error: Object.freeze({
    code: "policy_error",
    category: "policy",
    retryable: false,
    user_visible: true,
    description: "The request violates an offline, path, backend, or safety policy.",
    expected_status: "policy_error",
  }),
  validation_error: Object.freeze({
    code: "validation_error",
    category: "validation",
    retryable: false,
    user_visible: true,
    description: "The request, job, artifact, or generated output failed contract validation.",
    expected_status: "validation_error",
  }),
  execution_error: Object.freeze({
    code: "execution_error",
    category: "execution",
    retryable: true,
    user_visible: true,
    description: "The local execution boundary failed after accepting the request.",
    expected_status: "failed",
  }),
  artifact_missing: Object.freeze({
    code: "artifact_missing",
    category: "artifact",
    retryable: false,
    user_visible: false,
    description: "A required service artifact path was null, outside the task root, or unavailable.",
    expected_status: "failed",
  }),
  contract_violation: Object.freeze({
    code: "contract_violation",
    category: "contract",
    retryable: false,
    user_visible: false,
    description: "The producer returned a shape that does not match the Task 013 service contract.",
    expected_status: "failed",
  }),
});

export const serviceContractPaths = Object.freeze({
  root: ARTIFACT_ROOT,
  contract: Object.freeze({
    version: `${ARTIFACT_ROOT}/contract/service-contract-version.json`,
    serviceOperationEnum: `${ARTIFACT_ROOT}/contract/service-operation-enum.json`,
    documentIntentEnum: `${ARTIFACT_ROOT}/contract/document-intent-enum.json`,
    jobStatusEnum: `${ARTIFACT_ROOT}/contract/job-status-enum.json`,
    responseStatusEnum: `${ARTIFACT_ROOT}/contract/response-status-enum.json`,
    errorTaxonomy: `${ARTIFACT_ROOT}/contract/error-taxonomy.json`,
    artifactPathContract: `${ARTIFACT_ROOT}/contract/artifact-path-contract.json`,
  }),
  fixtures: Object.freeze({
    valid: Object.freeze({
      submitRequest: `${ARTIFACT_ROOT}/fixtures/valid/submit-request.json`,
      completedResponse: `${ARTIFACT_ROOT}/fixtures/valid/completed-response.json`,
      rejectedResponse: `${ARTIFACT_ROOT}/fixtures/valid/rejected-response.json`,
      failedResponse: `${ARTIFACT_ROOT}/fixtures/valid/failed-response.json`,
      notFoundResponse: `${ARTIFACT_ROOT}/fixtures/valid/not-found-response.json`,
      notReadyResponse: `${ARTIFACT_ROOT}/fixtures/valid/not-ready-response.json`,
      jobRecord: `${ARTIFACT_ROOT}/fixtures/valid/job-record.json`,
      eventRecord: `${ARTIFACT_ROOT}/fixtures/valid/event-record.json`,
    }),
    invalid: Object.freeze({
      missingServiceRequestId: `${ARTIFACT_ROOT}/fixtures/invalid/missing-service-request-id.json`,
      unknownResponseStatus: `${ARTIFACT_ROOT}/fixtures/invalid/unknown-response-status.json`,
      unknownJobStatus: `${ARTIFACT_ROOT}/fixtures/invalid/unknown-job-status.json`,
      unknownErrorCode: `${ARTIFACT_ROOT}/fixtures/invalid/unknown-error-code.json`,
    }),
  }),
  validation: Object.freeze({
    validSubmitRequest: `${ARTIFACT_ROOT}/validation/valid-submit-request-result.json`,
    validCompletedResponse: `${ARTIFACT_ROOT}/validation/valid-completed-response-result.json`,
    validRejectedResponse: `${ARTIFACT_ROOT}/validation/valid-rejected-response-result.json`,
    validFailedResponse: `${ARTIFACT_ROOT}/validation/valid-failed-response-result.json`,
    validNotFoundResponse: `${ARTIFACT_ROOT}/validation/valid-not-found-response-result.json`,
    validNotReadyResponse: `${ARTIFACT_ROOT}/validation/valid-not-ready-response-result.json`,
    validJobRecord: `${ARTIFACT_ROOT}/validation/valid-job-record-result.json`,
    validEventRecord: `${ARTIFACT_ROOT}/validation/valid-event-record-result.json`,
    invalidMissingServiceRequestId: `${ARTIFACT_ROOT}/validation/invalid-missing-service-request-id-result.json`,
    invalidUnknownResponseStatus: `${ARTIFACT_ROOT}/validation/invalid-unknown-response-status-result.json`,
    invalidUnknownJobStatus: `${ARTIFACT_ROOT}/validation/invalid-unknown-job-status-result.json`,
    invalidUnknownErrorCode: `${ARTIFACT_ROOT}/validation/invalid-unknown-error-code-result.json`,
  }),
  tests: Object.freeze({
    artifactPathProof: `${ARTIFACT_ROOT}/tests/artifact-path-contract-result.json`,
    task012ReadOnlyProof: `${ARTIFACT_ROOT}/tests/task012-read-only-result.json`,
    summary: `${ARTIFACT_ROOT}/tests/service-contract-summary.json`,
  }),
});

function result({ valid, errors = [], warnings = [], normalized = null }) {
  return { valid, errors, warnings, normalized, contract_version: CONTRACT_VERSION };
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizePath(value) {
  return typeof value === "string" ? value.replaceAll("\\", "/") : value;
}

function isTaskArtifactPath(value) {
  if (value === null) return true;
  return typeof value === "string" && value.replaceAll("\\", "/").startsWith(ARTIFACT_ROOT);
}

function isTerminalSuccess(value) {
  return value?.status === "completed" && value?.ok === true;
}

function pushRequired(errors, value, field) {
  if (value === undefined || value === null || value === "") errors.push(`${field}_required`);
}

export function getServiceContractVersion() {
  return CONTRACT_VERSION;
}

export function getErrorTaxonomy() {
  return JSON.parse(JSON.stringify(ERROR_TAXONOMY));
}

export function normalizeServiceError(error) {
  if (error === null || error === undefined) return null;
  const code = error.code ?? error.type;
  if (!ERROR_CODES.includes(code)) {
    return result({ valid: false, errors: [`unknown_error_code:${code ?? "missing"}`], normalized: null });
  }
  return result({
    valid: true,
    normalized: {
      code,
      type: code,
      message: String(error.message ?? code),
      category: ERROR_TAXONOMY[code].category,
      retryable: ERROR_TAXONOMY[code].retryable,
      user_visible: ERROR_TAXONOMY[code].user_visible,
      expected_status: ERROR_TAXONOMY[code].expected_status,
    },
  });
}

export function validateServiceRequestContract(value) {
  const errors = [];
  if (!isObject(value)) return result({ valid: false, errors: ["request_object_required"] });
  pushRequired(errors, value.service_request_id, "service_request_id");
  pushRequired(errors, value.service_operation, "service_operation");
  if (value.service_operation && !SERVICE_OPERATIONS.includes(value.service_operation)) errors.push(`unknown_service_operation:${value.service_operation}`);
  if (value.service_operation === "submit") {
    pushRequired(errors, value.api_request_id, "api_request_id");
    pushRequired(errors, value.request_id, "request_id");
    pushRequired(errors, value.task_id, "task_id");
    pushRequired(errors, value.document_intent, "document_intent");
    if (value.document_intent && !DOCUMENT_INTENTS.includes(value.document_intent)) errors.push(`unsupported_document_intent:${value.document_intent}`);
  }
  return result({ valid: errors.length === 0, errors, normalized: errors.length === 0 ? { ...value } : null });
}

export function validateArtifactPathContract(value, { terminal = false } = {}) {
  const errors = [];
  if (!isObject(value)) return result({ valid: false, errors: ["artifact_object_required"] });

  for (const role of ARTIFACT_PATH_ROLES) {
    const path = normalizePath(value[role] ?? null);
    if (!isTaskArtifactPath(path)) errors.push(`${role}_outside_task_root`);
    if (role === "output_path" && path !== null && !terminal) errors.push("output_path_requires_terminal_success");
  }

  if (value.evidence_paths !== undefined) {
    if (!Array.isArray(value.evidence_paths)) {
      errors.push("evidence_paths_array_required");
    } else {
      for (const evidencePath of value.evidence_paths) {
        if (!isTaskArtifactPath(normalizePath(evidencePath))) errors.push("evidence_paths_outside_task_root");
      }
    }
  }

  return result({ valid: errors.length === 0, errors, normalized: errors.length === 0 ? { ...value } : null });
}

export function validateServiceResponseContract(value) {
  const errors = [];
  if (!isObject(value)) return result({ valid: false, errors: ["response_object_required"] });
  pushRequired(errors, value.service_request_id, "service_request_id");
  pushRequired(errors, value.service_operation, "service_operation");
  pushRequired(errors, value.status, "status");
  if (value.service_operation && !SERVICE_OPERATIONS.includes(value.service_operation)) errors.push(`unknown_service_operation:${value.service_operation}`);
  if (value.status && !RESPONSE_STATUSES.includes(value.status)) errors.push(`unknown_response_status:${value.status}`);
  if (value.job_status !== null && value.job_status !== undefined && !JOB_STATUSES.includes(value.job_status)) errors.push(`unknown_job_status:${value.job_status}`);

  const normalizedError = normalizeServiceError(value.error);
  if (normalizedError && normalizedError.valid === false) errors.push(...normalizedError.errors);
  if (value.ok === false && !normalizedError) errors.push("error_required_for_failed_response");

  const artifacts = validateArtifactPathContract(value.artifacts ?? {}, { terminal: isTerminalSuccess(value) });
  errors.push(...artifacts.errors);

  return result({
    valid: errors.length === 0,
    errors,
    normalized: errors.length === 0 ? { ...value, error: normalizedError?.normalized ?? null } : null,
  });
}

export function validateJobRecordContract(value) {
  const errors = [];
  if (!isObject(value)) return result({ valid: false, errors: ["job_object_required"] });
  pushRequired(errors, value.job_id, "job_id");
  pushRequired(errors, value.status, "status");
  if (value.status && !JOB_STATUSES.includes(value.status)) errors.push(`unknown_job_status:${value.status}`);
  const artifactResult = validateArtifactPathContract({
    request_path: value.request_path ?? null,
    response_path: value.response_path ?? null,
    plan_path: value.plan_path ?? null,
    report_path: value.report_path ?? null,
    output_path: value.output_path ?? null,
    evidence_paths: value.evidence_paths ?? [],
  }, { terminal: value.status === "completed" });
  errors.push(...artifactResult.errors);
  if (!Array.isArray(value.evidence_paths)) errors.push("evidence_paths_array_required");
  return result({ valid: errors.length === 0, errors, normalized: errors.length === 0 ? { ...value } : null });
}

export function validateEventRecordContract(value) {
  const errors = [];
  if (!isObject(value)) return result({ valid: false, errors: ["event_object_required"] });
  pushRequired(errors, value.event_id, "event_id");
  pushRequired(errors, value.job_id, "job_id");
  if (value.from_status !== null && value.from_status !== undefined && !JOB_STATUSES.includes(value.from_status)) errors.push(`unknown_from_status:${value.from_status}`);
  if (!JOB_STATUSES.includes(value.to_status)) errors.push(`unknown_to_status:${value.to_status}`);
  if (!isTaskArtifactPath(normalizePath(value.artifact_path ?? null))) errors.push("artifact_path_outside_task_root");
  return result({ valid: errors.length === 0, errors, normalized: errors.length === 0 ? { ...value } : null });
}

async function writeJson(path, payload) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function fixtures() {
  const request = {
    service_request_id: "svc-submit-create-001",
    service_operation: "submit",
    api_request_id: "api-create",
    request_id: "req-create",
    task_id: TASK_ID,
    document_intent: "create_document",
    content: { text: "Task 013 service contract proof" },
    constraints: { backend_role: "editor", backend_id: "NodeXmlThinInterimEditorAdapter", no_real_com: true },
  };
  const completedResponse = {
    service_request_id: "svc-result-completed-001",
    service_operation: "getResult",
    ok: true,
    status: "completed",
    job_id: "job-create",
    job_status: "completed",
    data: { job_id: "job-create", status: "completed" },
    error: null,
    artifacts: {
      response_path: `${ARTIFACT_ROOT}/fixtures/valid/completed-response.json`,
      report_path: `${ARTIFACT_ROOT}/fixtures/valid/report.json`,
      output_path: `${ARTIFACT_ROOT}/fixtures/valid/output.hwpx`,
      evidence_paths: [`${ARTIFACT_ROOT}/fixtures/valid/evidence.json`],
    },
    real_com_executed: false,
    final_core_selection_declared: false,
    stage_2_transition_declared: false,
  };
  const response = (status, code, ok = false) => ({
    service_request_id: `svc-${status}-001`,
    service_operation: status === "not_found" ? "getJob" : "getResult",
    ok,
    status,
    job_id: status === "not_found" ? null : `job-${status}`,
    job_status: JOB_STATUSES.includes(status) ? status : null,
    data: ok ? { status } : null,
    error: code ? { code, message: `${code} proof` } : null,
    artifacts: { output_path: null, evidence_paths: [] },
    real_com_executed: false,
    final_core_selection_declared: false,
    stage_2_transition_declared: false,
  });
  const jobRecord = {
    job_id: "job-create",
    status: "completed",
    request_path: `${ARTIFACT_ROOT}/fixtures/valid/submit-request.json`,
    response_path: `${ARTIFACT_ROOT}/fixtures/valid/completed-response.json`,
    plan_path: `${ARTIFACT_ROOT}/fixtures/valid/plan.json`,
    report_path: `${ARTIFACT_ROOT}/fixtures/valid/report.json`,
    output_path: `${ARTIFACT_ROOT}/fixtures/valid/output.hwpx`,
    evidence_paths: [`${ARTIFACT_ROOT}/fixtures/valid/evidence.json`],
    failure: null,
  };
  const eventRecord = {
    event_id: "event-001",
    job_id: "job-create",
    from_status: "running",
    to_status: "completed",
    timestamp: "2026-07-05T00:00:00.000Z",
    reason: "api_response_completed",
    artifact_path: `${ARTIFACT_ROOT}/fixtures/valid/completed-response.json`,
  };
  return {
    valid: {
      submitRequest: request,
      completedResponse,
      rejectedResponse: response("rejected", "policy_error", true),
      failedResponse: response("failed", "validation_error", true),
      notFoundResponse: response("not_found", "not_found", false),
      notReadyResponse: response("not_ready", "not_ready", false),
      jobRecord,
      eventRecord,
    },
    invalid: {
      missingServiceRequestId: { ...request, service_request_id: undefined },
      unknownResponseStatus: { ...completedResponse, status: "mystery" },
      unknownJobStatus: { ...jobRecord, status: "mystery" },
      unknownErrorCode: { ...response("not_found", "not_found", false), error: { code: "mystery", message: "unknown" } },
    },
  };
}

export async function generateServiceContractProofArtifacts({ workspace = process.cwd() } = {}) {
  const root = resolve(workspace);
  await rm(resolve(root, ARTIFACT_ROOT), { recursive: true, force: true });

  const previousSummaryBefore = await readFile(resolve(root, PREVIOUS_TASK_012_SUMMARY), "utf8");
  const fixtureSet = fixtures();
  const validationCases = [
    ["validSubmitRequest", serviceContractPaths.validation.validSubmitRequest, validateServiceRequestContract, fixtureSet.valid.submitRequest, true],
    ["validCompletedResponse", serviceContractPaths.validation.validCompletedResponse, validateServiceResponseContract, fixtureSet.valid.completedResponse, true],
    ["validRejectedResponse", serviceContractPaths.validation.validRejectedResponse, validateServiceResponseContract, fixtureSet.valid.rejectedResponse, true],
    ["validFailedResponse", serviceContractPaths.validation.validFailedResponse, validateServiceResponseContract, fixtureSet.valid.failedResponse, true],
    ["validNotFoundResponse", serviceContractPaths.validation.validNotFoundResponse, validateServiceResponseContract, fixtureSet.valid.notFoundResponse, true],
    ["validNotReadyResponse", serviceContractPaths.validation.validNotReadyResponse, validateServiceResponseContract, fixtureSet.valid.notReadyResponse, true],
    ["validJobRecord", serviceContractPaths.validation.validJobRecord, validateJobRecordContract, fixtureSet.valid.jobRecord, true],
    ["validEventRecord", serviceContractPaths.validation.validEventRecord, validateEventRecordContract, fixtureSet.valid.eventRecord, true],
    ["invalidMissingServiceRequestId", serviceContractPaths.validation.invalidMissingServiceRequestId, validateServiceRequestContract, fixtureSet.invalid.missingServiceRequestId, false],
    ["invalidUnknownResponseStatus", serviceContractPaths.validation.invalidUnknownResponseStatus, validateServiceResponseContract, fixtureSet.invalid.unknownResponseStatus, false],
    ["invalidUnknownJobStatus", serviceContractPaths.validation.invalidUnknownJobStatus, validateJobRecordContract, fixtureSet.invalid.unknownJobStatus, false],
    ["invalidUnknownErrorCode", serviceContractPaths.validation.invalidUnknownErrorCode, validateServiceResponseContract, fixtureSet.invalid.unknownErrorCode, false],
  ];

  await writeJson(resolve(root, serviceContractPaths.contract.version), { task_id: TASK_ID, contract_version: CONTRACT_VERSION });
  await writeJson(resolve(root, serviceContractPaths.contract.serviceOperationEnum), { values: SERVICE_OPERATIONS });
  await writeJson(resolve(root, serviceContractPaths.contract.documentIntentEnum), { values: DOCUMENT_INTENTS });
  await writeJson(resolve(root, serviceContractPaths.contract.jobStatusEnum), { values: JOB_STATUSES });
  await writeJson(resolve(root, serviceContractPaths.contract.responseStatusEnum), { values: RESPONSE_STATUSES });
  await writeJson(resolve(root, serviceContractPaths.contract.errorTaxonomy), getErrorTaxonomy());
  await writeJson(resolve(root, serviceContractPaths.contract.artifactPathContract), {
    roles: ARTIFACT_PATH_ROLES,
    nullable: true,
    task_artifact_root: ARTIFACT_ROOT,
    output_path_rule: "output_path is non-null only for terminal successful completed responses or completed job records.",
    evidence_paths_rule: "evidence_paths is always an array when present.",
  });

  for (const [name, payload] of Object.entries(fixtureSet.valid)) {
    await writeJson(resolve(root, serviceContractPaths.fixtures.valid[name]), payload);
  }
  for (const [name, payload] of Object.entries(fixtureSet.invalid)) {
    await writeJson(resolve(root, serviceContractPaths.fixtures.invalid[name]), payload);
  }

  const proofResults = [];
  for (const [caseName, path, validator, payload, expectedValid] of validationCases) {
    const validation = validator(payload);
    const proof = {
      case_name: caseName,
      expected_valid: expectedValid,
      actual_valid: validation.valid,
      passed: validation.valid === expectedValid,
      validation,
    };
    proofResults.push(proof);
    await writeJson(resolve(root, path), proof);
  }

  const previousSummaryAfter = await readFile(resolve(root, PREVIOUS_TASK_012_SUMMARY), "utf8");
  const artifactPathProof = {
    case_name: "artifactPathContract",
    expected_valid: true,
    actual_valid: validateArtifactPathContract({
      service_request_path: `${ARTIFACT_ROOT}/service-requests/submit.json`,
      service_response_path: `${ARTIFACT_ROOT}/service-responses/submit.json`,
      job_path: `${ARTIFACT_ROOT}/jobs/job-create/job.json`,
      event_path: `${ARTIFACT_ROOT}/jobs/job-create/events.json`,
      snapshot_path: `${ARTIFACT_ROOT}/jobs/job-create/snapshots/completed.json`,
      request_path: `${ARTIFACT_ROOT}/requests/request.json`,
      response_path: `${ARTIFACT_ROOT}/responses/response.json`,
      plan_path: `${ARTIFACT_ROOT}/plans/plan.json`,
      report_path: `${ARTIFACT_ROOT}/reports/report.json`,
      output_path: `${ARTIFACT_ROOT}/outputs/output.hwpx`,
      evidence_path: `${ARTIFACT_ROOT}/evidence/evidence.json`,
      evidence_paths: [`${ARTIFACT_ROOT}/evidence/evidence.json`],
    }, { terminal: true }).valid,
  };
  artifactPathProof.passed = artifactPathProof.actual_valid === artifactPathProof.expected_valid;
  const task012ReadOnlyProof = {
    case_name: "previousTask012ServiceSummaryReadOnly",
    expected_read_only: true,
    actual_read_only: previousSummaryBefore === previousSummaryAfter,
  };
  task012ReadOnlyProof.passed = task012ReadOnlyProof.actual_read_only === task012ReadOnlyProof.expected_read_only;
  await writeJson(resolve(root, serviceContractPaths.tests.artifactPathProof), artifactPathProof);
  await writeJson(resolve(root, serviceContractPaths.tests.task012ReadOnlyProof), task012ReadOnlyProof);
  const allProofs = [...proofResults, artifactPathProof, task012ReadOnlyProof];
  const summary = {
    task_id: TASK_ID,
    generated_at: new Date().toISOString(),
    contract_version: CONTRACT_VERSION,
    service_operations: SERVICE_OPERATIONS,
    document_intents: DOCUMENT_INTENTS,
    job_statuses: JOB_STATUSES,
    response_statuses: RESPONSE_STATUSES,
    error_codes: ERROR_CODES,
    proof_case_count: allProofs.length,
    proof_cases_passed: allProofs.filter((proof) => proof.passed).length,
    previous_task_012_read_only: previousSummaryBefore === previousSummaryAfter,
    real_com_executed: false,
    python_hwpx_dependency_introduced: false,
    install_or_vendor_action: false,
    final_core_selection_declared: false,
    stage_2_transition_declared: false,
    completion_candidate: allProofs.every((proof) => proof.passed),
    read_only_reference_roots: [
      "release/test-documents/hwpx-core-benchmark-003-evidence-integrity",
      "release/test-documents/hwpcoreadapter-backend-proof-006",
      "release/test-documents/editor-backend-candidate-comparison-007",
      "release/test-documents/node-xml-thin-interim-adapter-integration-008",
      "release/test-documents/agent-operation-plan-e2e-proof-009",
      "release/test-documents/agent-api-boundary-proof-010",
      "release/test-documents/local-job-boundary-proof-011",
      "release/test-documents/service-adapter-boundary-proof-012",
    ],
  };
  await writeJson(resolve(root, serviceContractPaths.tests.summary), summary);
  return summary;
}

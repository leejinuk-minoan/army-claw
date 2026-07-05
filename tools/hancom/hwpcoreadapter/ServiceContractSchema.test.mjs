import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  ARTIFACT_PATH_ROLES,
  DOCUMENT_INTENTS,
  ERROR_CODES,
  JOB_STATUSES,
  RESPONSE_STATUSES,
  SERVICE_OPERATIONS,
  generateServiceContractProofArtifacts,
  getErrorTaxonomy,
  getServiceContractVersion,
  validateArtifactPathContract,
  validateEventRecordContract,
  validateJobRecordContract,
  validateServiceRequestContract,
  validateServiceResponseContract,
} from "./ServiceContractSchema.mjs";

const WORKSPACE = process.cwd();
const TASK_ID = "service-contract-schema-error-taxonomy-013";
const ARTIFACT_ROOT = "release/test-documents/service-contract-schema-error-taxonomy-013";

test("service operation enum is stable", () => {
  assert.deepEqual(SERVICE_OPERATIONS, ["submit", "runJob", "getJob", "getStatus", "getResult", "listEvents"]);
});

test("document intent enum is stable", () => {
  assert.deepEqual(DOCUMENT_INTENTS, ["create_document", "edit_paragraph", "edit_table", "apply_style"]);
});

test("job status enum is stable", () => {
  assert.deepEqual(JOB_STATUSES, ["pending", "running", "completed", "failed", "rejected"]);
});

test("response status enum is stable", () => {
  assert.deepEqual(RESPONSE_STATUSES, ["accepted", "pending", "running", "completed", "failed", "rejected", "not_found", "not_ready", "validation_error", "policy_error"]);
});

test("error taxonomy includes required codes", () => {
  assert.deepEqual(ERROR_CODES, ["invalid_request", "unsupported_intent", "not_found", "not_ready", "policy_error", "validation_error", "execution_error", "artifact_missing", "contract_violation"]);
  const taxonomy = getErrorTaxonomy();
  for (const code of ERROR_CODES) {
    assert.equal(taxonomy[code].code, code);
    assert.equal(typeof taxonomy[code].retryable, "boolean");
    assert.equal(typeof taxonomy[code].user_visible, "boolean");
    assert.equal(RESPONSE_STATUSES.includes(taxonomy[code].expected_status), true);
  }
});

test("valid submit request passes", () => {
  const result = validateServiceRequestContract({
    service_request_id: "svc-submit-create-001",
    service_operation: "submit",
    api_request_id: "api-create",
    request_id: "req-create",
    task_id: TASK_ID,
    document_intent: "create_document",
    content: { text: "Task 013" },
    constraints: { no_real_com: true },
  });
  assert.equal(result.valid, true);
  assert.equal(result.contract_version, getServiceContractVersion());
});

test("valid completed response passes", () => {
  const result = validateServiceResponseContract({
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
  });
  assert.equal(result.valid, true);
});

test("valid rejected response passes", () => {
  const result = validateServiceResponseContract({
    service_request_id: "svc-result-rejected-001",
    service_operation: "getResult",
    ok: true,
    status: "rejected",
    job_id: "job-invalid",
    job_status: "rejected",
    data: { job_id: "job-invalid", status: "rejected" },
    error: { code: "policy_error", message: "missing document_intent" },
    artifacts: { output_path: null, evidence_paths: [] },
    real_com_executed: false,
    final_core_selection_declared: false,
    stage_2_transition_declared: false,
  });
  assert.equal(result.valid, true);
});

test("valid failed response passes", () => {
  const result = validateServiceResponseContract({
    service_request_id: "svc-result-failed-001",
    service_operation: "getResult",
    ok: true,
    status: "failed",
    job_id: "job-failed",
    job_status: "failed",
    data: { job_id: "job-failed", status: "failed" },
    error: { code: "validation_error", message: "validation failed" },
    artifacts: { output_path: null, evidence_paths: [] },
    real_com_executed: false,
    final_core_selection_declared: false,
    stage_2_transition_declared: false,
  });
  assert.equal(result.valid, true);
});

test("valid not_found response passes", () => {
  const result = validateServiceResponseContract({
    service_request_id: "svc-job-missing-001",
    service_operation: "getJob",
    ok: false,
    status: "not_found",
    job_id: null,
    job_status: null,
    data: null,
    error: { code: "not_found", message: "job missing" },
    artifacts: {},
    real_com_executed: false,
    final_core_selection_declared: false,
    stage_2_transition_declared: false,
  });
  assert.equal(result.valid, true);
});

test("valid not_ready response passes", () => {
  const result = validateServiceResponseContract({
    service_request_id: "svc-result-not-ready-001",
    service_operation: "getResult",
    ok: false,
    status: "not_ready",
    job_id: "job-pending",
    job_status: "pending",
    data: null,
    error: { code: "not_ready", message: "job is pending" },
    artifacts: {},
    real_com_executed: false,
    final_core_selection_declared: false,
    stage_2_transition_declared: false,
  });
  assert.equal(result.valid, true);
});

test("valid job record and event record pass", () => {
  assert.equal(validateJobRecordContract({
    job_id: "job-create",
    status: "completed",
    request_path: `${ARTIFACT_ROOT}/fixtures/valid/submit-request.json`,
    response_path: `${ARTIFACT_ROOT}/fixtures/valid/completed-response.json`,
    plan_path: `${ARTIFACT_ROOT}/fixtures/valid/plan.json`,
    report_path: `${ARTIFACT_ROOT}/fixtures/valid/report.json`,
    output_path: `${ARTIFACT_ROOT}/fixtures/valid/output.hwpx`,
    evidence_paths: [`${ARTIFACT_ROOT}/fixtures/valid/evidence.json`],
    failure: null,
  }).valid, true);
  assert.equal(validateEventRecordContract({
    event_id: "event-001",
    job_id: "job-create",
    from_status: "running",
    to_status: "completed",
    timestamp: "2026-07-05T00:00:00.000Z",
    reason: "api_response_completed",
    artifact_path: `${ARTIFACT_ROOT}/fixtures/valid/completed-response.json`,
  }).valid, true);
});

test("invalid contracts fail for required proof cases", () => {
  assert.equal(validateServiceRequestContract({ service_operation: "submit", document_intent: "create_document" }).valid, false);
  assert.equal(validateServiceResponseContract({ service_request_id: "svc", service_operation: "getJob", status: "mystery", error: null, artifacts: {} }).valid, false);
  assert.equal(validateJobRecordContract({ job_id: "job", status: "mystery", evidence_paths: [] }).valid, false);
  assert.equal(validateServiceResponseContract({ service_request_id: "svc", service_operation: "getJob", status: "not_found", error: { code: "mystery" }, artifacts: {} }).valid, false);
});

test("artifact path contract is enforced", () => {
  const result = validateArtifactPathContract({
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
  }, { terminal: true });
  assert.equal(result.valid, true);
  assert.deepEqual(ARTIFACT_PATH_ROLES, ["service_request_path", "service_response_path", "job_path", "event_path", "snapshot_path", "request_path", "response_path", "plan_path", "report_path", "output_path", "evidence_path"]);
});

test("Task 012 service summary remains read-only reference", async () => {
  const before = await readFile("release/test-documents/service-adapter-boundary-proof-012/tests/service-adapter-summary.json", "utf8");
  const summary = await generateServiceContractProofArtifacts({ workspace: WORKSPACE });
  const after = await readFile("release/test-documents/service-adapter-boundary-proof-012/tests/service-adapter-summary.json", "utf8");
  assert.equal(before, after);
  assert.equal(summary.task_id, TASK_ID);
  assert.equal(summary.proof_case_count, 14);
  assert.equal(summary.proof_cases_passed, 14);
  assert.equal(summary.completion_candidate, true);
  assert.equal(summary.previous_task_012_read_only, true);
});

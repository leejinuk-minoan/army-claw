import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import {
  getLocalJobStatus,
  listLocalJobEvents,
  localJobBoundaryPaths,
  readLocalJobJson,
  runLocalJob,
  submitLocalJob,
} from "./LocalJobBoundaryProof.mjs";

const TASK_ID = "service-adapter-boundary-proof-012";
const SOURCE_FIXTURE = "release/test-documents/army-claw-qualification-review-template-fidelity-v5.hwpx";
const TERMINAL_STATUSES = ["completed", "failed", "rejected"];

export const internalServiceAdapterPaths = Object.freeze({
  root: "release/test-documents/service-adapter-boundary-proof-012",
  executionWorkspaces: "release/test-documents/service-adapter-boundary-proof-012/execution-workspaces",
  serviceRequests: Object.freeze({
    submitCreateDocument: "release/test-documents/service-adapter-boundary-proof-012/service-requests/submit-create-document-service-request.json",
    submitInvalid: "release/test-documents/service-adapter-boundary-proof-012/service-requests/submit-invalid-service-request.json",
    submitValidationFailure: "release/test-documents/service-adapter-boundary-proof-012/service-requests/submit-validation-failure-service-request.json",
  }),
  serviceResponses: Object.freeze({
    submitCreateDocument: "release/test-documents/service-adapter-boundary-proof-012/service-responses/submit-create-document-response.json",
    submitInvalid: "release/test-documents/service-adapter-boundary-proof-012/service-responses/submit-invalid-response.json",
    submitValidationFailure: "release/test-documents/service-adapter-boundary-proof-012/service-responses/submit-validation-failure-response.json",
    getStatusPending: "release/test-documents/service-adapter-boundary-proof-012/service-responses/get-status-pending-response.json",
    runCreateDocument: "release/test-documents/service-adapter-boundary-proof-012/service-responses/run-create-document-response.json",
    getStatusCompleted: "release/test-documents/service-adapter-boundary-proof-012/service-responses/get-status-completed-response.json",
    getJobCompleted: "release/test-documents/service-adapter-boundary-proof-012/service-responses/get-job-completed-response.json",
    getResultCompleted: "release/test-documents/service-adapter-boundary-proof-012/service-responses/get-result-completed-response.json",
    listEventsCompleted: "release/test-documents/service-adapter-boundary-proof-012/service-responses/list-events-completed-response.json",
    invalidRejected: "release/test-documents/service-adapter-boundary-proof-012/service-responses/invalid-job-rejected-response.json",
    validationFailed: "release/test-documents/service-adapter-boundary-proof-012/service-responses/validation-failure-failed-response.json",
    unknownJob: "release/test-documents/service-adapter-boundary-proof-012/service-responses/unknown-job-response.json",
    notReadyResult: "release/test-documents/service-adapter-boundary-proof-012/service-responses/not-ready-result-response.json",
  }),
  jobs: "release/test-documents/service-adapter-boundary-proof-012/jobs",
  requests: "release/test-documents/service-adapter-boundary-proof-012/requests",
  responses: "release/test-documents/service-adapter-boundary-proof-012/responses",
  plans: "release/test-documents/service-adapter-boundary-proof-012/plans",
  reports: "release/test-documents/service-adapter-boundary-proof-012/reports",
  outputs: "release/test-documents/service-adapter-boundary-proof-012/outputs",
  evidence: "release/test-documents/service-adapter-boundary-proof-012/evidence",
  tests: Object.freeze({
    summary: "release/test-documents/service-adapter-boundary-proof-012/tests/service-adapter-summary.json",
  }),
  copiedJob(jobId) {
    return join(this.jobs, jobId, "job.json");
  },
  copiedEvents(jobId) {
    return join(this.jobs, jobId, "events.json");
  },
  copiedSnapshot(jobId, name) {
    return join(this.jobs, jobId, "snapshots", `${name}.json`);
  },
});

function isoNow() {
  return new Date().toISOString();
}

function slug(value) {
  return String(value ?? "unknown").replaceAll("_", "-").replaceAll(/[^a-zA-Z0-9-]/g, "-");
}

function normalize(path) {
  return path ? path.replaceAll("\\", "/") : null;
}

async function writeJson(path, payload) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export async function readInternalServiceJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function copyIfExists(source, target) {
  if (!source) return null;
  await mkdir(dirname(target), { recursive: true });
  await copyFile(source, target);
  return target;
}

async function prepareExecutionWorkspace(root, serviceRequestId) {
  const execRoot = resolve(root, internalServiceAdapterPaths.executionWorkspaces, serviceRequestId);
  await rm(execRoot, { recursive: true, force: true });
  await mkdir(dirname(resolve(execRoot, SOURCE_FIXTURE)), { recursive: true });
  await copyFile(resolve(root, SOURCE_FIXTURE), resolve(execRoot, SOURCE_FIXTURE));
  return execRoot;
}

function requestPathFor(request) {
  if (request?.constraints?.force_validation_failure) return internalServiceAdapterPaths.serviceRequests.submitValidationFailure;
  if (!request?.document_intent) return internalServiceAdapterPaths.serviceRequests.submitInvalid;
  return internalServiceAdapterPaths.serviceRequests.submitCreateDocument;
}

function responsePathFor(operation, detail) {
  if (operation === "submit") {
    if (detail === "invalid") return internalServiceAdapterPaths.serviceResponses.submitInvalid;
    if (detail === "validation") return internalServiceAdapterPaths.serviceResponses.submitValidationFailure;
    return internalServiceAdapterPaths.serviceResponses.submitCreateDocument;
  }
  if (operation === "runJob") return internalServiceAdapterPaths.serviceResponses.runCreateDocument;
  if (operation === "getStatus" && detail === "pending") return internalServiceAdapterPaths.serviceResponses.getStatusPending;
  if (operation === "getStatus") return internalServiceAdapterPaths.serviceResponses.getStatusCompleted;
  if (operation === "getJob") return detail === "not_found" ? internalServiceAdapterPaths.serviceResponses.unknownJob : internalServiceAdapterPaths.serviceResponses.getJobCompleted;
  if (operation === "getResult" && detail === "not_ready") return internalServiceAdapterPaths.serviceResponses.notReadyResult;
  if (operation === "getResult" && detail === "rejected") return internalServiceAdapterPaths.serviceResponses.invalidRejected;
  if (operation === "getResult" && detail === "failed") return internalServiceAdapterPaths.serviceResponses.validationFailed;
  if (operation === "getResult") return internalServiceAdapterPaths.serviceResponses.getResultCompleted;
  if (operation === "listEvents") return internalServiceAdapterPaths.serviceResponses.listEventsCompleted;
  return join(internalServiceAdapterPaths.root, "service-responses", `${operation}-${detail ?? "response"}.json`);
}

function terminal(status) {
  return TERMINAL_STATUSES.includes(status);
}

function baseResponse({ serviceRequestId, operation, ok, status, job = null, data = null, error = null, artifacts = {} }) {
  return {
    service_request_id: serviceRequestId,
    service_operation: operation,
    ok,
    status,
    job_id: job?.job_id ?? data?.job_id ?? null,
    job_status: job?.status ?? data?.status ?? null,
    data,
    error,
    artifacts,
    real_com_executed: false,
    final_core_selection_declared: false,
    stage_2_transition_declared: false,
  };
}

function serviceRequestId(operation, detail) {
  return `svc-${operation}-${slug(detail)}-${Date.now()}`;
}

function normalizeJob(job) {
  return {
    job_id: job.job_id,
    status: job.status,
    request_path: normalize(job.request_path),
    response_path: normalize(job.response_path),
    plan_path: normalize(job.plan_path),
    report_path: normalize(job.report_path),
    output_path: normalize(job.output_path),
    evidence_paths: (job.evidence_paths ?? []).map(normalize),
    failure: job.failure,
    attempts: job.attempts,
    updated_at: job.updated_at,
  };
}

async function copyJobArtifacts(root, execRoot, job) {
  const copied = { ...job };
  copied.request_path = await copyIfExists(job.request_path, resolve(root, internalServiceAdapterPaths.requests, `${job.job_id}-request.json`));
  copied.response_path = await copyIfExists(job.response_path, resolve(root, internalServiceAdapterPaths.responses, `${job.job_id}-response.json`));
  copied.plan_path = await copyIfExists(job.plan_path, resolve(root, internalServiceAdapterPaths.plans, `${job.job_id}-plan.json`));
  copied.report_path = await copyIfExists(job.report_path, resolve(root, internalServiceAdapterPaths.reports, `${job.job_id}-agent-report.json`));
  copied.output_path = await copyIfExists(job.output_path, resolve(root, internalServiceAdapterPaths.outputs, `${job.job_id}-output.hwpx`));
  copied.evidence_paths = [];
  for (let index = 0; index < (job.evidence_paths ?? []).length; index += 1) {
    const target = resolve(root, internalServiceAdapterPaths.evidence, `${job.job_id}-evidence-${index + 1}.json`);
    const copiedEvidence = await copyIfExists(job.evidence_paths[index], target);
    if (copiedEvidence) copied.evidence_paths.push(copiedEvidence);
  }

  await writeJson(resolve(root, internalServiceAdapterPaths.copiedJob(job.job_id)), copied);
  const sourceEvents = resolve(execRoot, localJobBoundaryPaths.jobEvents(job.job_id));
  await copyIfExists(sourceEvents, resolve(root, internalServiceAdapterPaths.copiedEvents(job.job_id)));
  for (const name of ["pending", "running", "completed", "failed", "rejected", "final", "status"]) {
    await copyIfExists(resolve(execRoot, localJobBoundaryPaths.jobSnapshot(job.job_id, name)), resolve(root, internalServiceAdapterPaths.copiedSnapshot(job.job_id, name))).catch(() => null);
  }
  return copied;
}

export function createInternalServiceAdapter({ workspace }) {
  const root = resolve(workspace);
  const jobContexts = new Map();

  async function writeServiceResponse(operation, detail, response) {
    const path = resolve(root, responsePathFor(operation, detail));
    await writeJson(path, response);
    return { ...response, artifacts: { ...(response.artifacts ?? {}), service_response_path: path } };
  }

  async function submit(request) {
    const detail = request?.constraints?.force_validation_failure ? "validation" : (!request?.document_intent ? "invalid" : "create");
    const id = serviceRequestId("submit", detail);
    await writeJson(resolve(root, requestPathFor(request)), request ?? {});
    const execRoot = await prepareExecutionWorkspace(root, id);
    const job = await submitLocalJob(request, { workspace: execRoot });
    const copied = await copyJobArtifacts(root, execRoot, job);
    jobContexts.set(job.job_id, { execRoot });
    const response = baseResponse({
      serviceRequestId: id,
      operation: "submit",
      ok: true,
      status: "accepted",
      job: copied,
      data: {
        job_id: copied.job_id,
        status: copied.status,
        request_path: copied.request_path,
        submitted_at: copied.created_at,
      },
      artifacts: {
        job_path: resolve(root, internalServiceAdapterPaths.copiedJob(copied.job_id)),
      },
    });
    const written = await writeServiceResponse("submit", detail, response);
    return { ...written, job_id: copied.job_id };
  }

  async function runJob(jobId) {
    const context = jobContexts.get(jobId);
    if (!context) return getJob(jobId);
    const job = await runLocalJob(jobId, { workspace: context.execRoot });
    const copied = await copyJobArtifacts(root, context.execRoot, job);
    const response = baseResponse({
      serviceRequestId: serviceRequestId("runJob", jobId),
      operation: "runJob",
      ok: true,
      status: copied.status,
      job: copied,
      data: normalizeJob(copied),
      artifacts: {
        job_path: resolve(root, internalServiceAdapterPaths.copiedJob(copied.job_id)),
      },
    });
    return writeServiceResponse("runJob", copied.status, response);
  }

  async function getJob(jobId) {
    const id = serviceRequestId("getJob", jobId);
    let job;
    try {
      job = await readInternalServiceJson(resolve(root, internalServiceAdapterPaths.copiedJob(jobId)));
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      const response = baseResponse({
        serviceRequestId: id,
        operation: "getJob",
        ok: false,
        status: "error",
        data: null,
        error: { type: "not_found", message: `job_not_found:${jobId}` },
      });
      return writeServiceResponse("getJob", "not_found", response);
    }
    const response = baseResponse({
      serviceRequestId: id,
      operation: "getJob",
      ok: true,
      status: job.status,
      job,
      data: normalizeJob(job),
      artifacts: { job_path: resolve(root, internalServiceAdapterPaths.copiedJob(job.job_id)) },
    });
    return writeServiceResponse("getJob", job.status, response);
  }

  async function getStatus(jobId, label = "status") {
    const context = jobContexts.get(jobId);
    if (!context) return getJob(jobId);
    const snapshot = await getLocalJobStatus(jobId, { workspace: context.execRoot, snapshotName: label });
    const job = await readLocalJobJson(resolve(context.execRoot, localJobBoundaryPaths.jobRecord(jobId)));
    const copied = await copyJobArtifacts(root, context.execRoot, job);
    const snapshotPath = await copyIfExists(resolve(context.execRoot, localJobBoundaryPaths.jobSnapshot(jobId, label)), resolve(root, internalServiceAdapterPaths.copiedSnapshot(jobId, label)));
    const data = {
      job_id: jobId,
      status: snapshot.status,
      terminal: terminal(snapshot.status),
      snapshot_path: snapshotPath,
      updated_at: copied.updated_at,
    };
    const response = baseResponse({
      serviceRequestId: serviceRequestId("getStatus", label),
      operation: "getStatus",
      ok: true,
      status: snapshot.status,
      job: copied,
      data,
      artifacts: { snapshot_path: snapshotPath },
    });
    return writeServiceResponse("getStatus", snapshot.status === "pending" ? "pending" : "completed", response);
  }

  async function getResult(jobId) {
    const id = serviceRequestId("getResult", jobId);
    let job;
    try {
      job = await readInternalServiceJson(resolve(root, internalServiceAdapterPaths.copiedJob(jobId)));
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      const response = baseResponse({
        serviceRequestId: id,
        operation: "getResult",
        ok: false,
        status: "error",
        error: { type: "not_found", message: `job_not_found:${jobId}` },
      });
      return writeServiceResponse("getJob", "not_found", response);
    }
    if (!terminal(job.status)) {
      const response = baseResponse({
        serviceRequestId: id,
        operation: "getResult",
        ok: false,
        status: "not_ready",
        job,
        error: { type: "not_ready", message: `job_not_terminal:${job.status}` },
      });
      return writeServiceResponse("getResult", "not_ready", response);
    }
    const data = {
      job_id: job.job_id,
      status: job.status,
      response_path: job.response_path,
      report_path: job.report_path,
      output_path: job.output_path,
      evidence_paths: job.evidence_paths,
      failure: job.failure,
    };
    const response = baseResponse({
      serviceRequestId: id,
      operation: "getResult",
      ok: true,
      status: job.status,
      job,
      data,
      artifacts: {
        response_path: job.response_path,
        report_path: job.report_path,
        output_path: job.output_path,
        evidence_paths: job.evidence_paths,
      },
    });
    return writeServiceResponse("getResult", job.status, response);
  }

  async function listEvents(jobId) {
    const context = jobContexts.get(jobId);
    if (!context) return getJob(jobId);
    const events = await listLocalJobEvents(jobId, { workspace: context.execRoot });
    await copyIfExists(resolve(context.execRoot, localJobBoundaryPaths.jobEvents(jobId)), resolve(root, internalServiceAdapterPaths.copiedEvents(jobId)));
    const job = await readInternalServiceJson(resolve(root, internalServiceAdapterPaths.copiedJob(jobId)));
    const eventsPath = resolve(root, internalServiceAdapterPaths.copiedEvents(jobId));
    const response = baseResponse({
      serviceRequestId: serviceRequestId("listEvents", jobId),
      operation: "listEvents",
      ok: true,
      status: job.status,
      job,
      data: { job_id: jobId, events_path: eventsPath, event_count: events.length, events },
      artifacts: { events_path: eventsPath },
    });
    return writeServiceResponse("listEvents", job.status, response);
  }

  async function runAllProofs() {
    const submitted = await submit({
      api_request_id: "api-create-document",
      request_id: "req-create-document",
      task_id: TASK_ID,
      document_intent: "create_document",
      content: { text: "Task 012 create document", table: [["A", "B"], ["1", "2"]], style: "emphasis" },
      constraints: { backend_role: "editor", backend_id: "NodeXmlThinInterimEditorAdapter", no_real_com: true, no_final_core_selection: true },
    });
    await getStatus(submitted.job_id, "pending");
    const notReady = await getResult(submitted.job_id);
    await runJob(submitted.job_id);
    await getStatus(submitted.job_id, "completed");
    await getJob(submitted.job_id);
    await getResult(submitted.job_id);
    await listEvents(submitted.job_id);

    const invalid = await submit({ api_request_id: "api-invalid", request_id: "req-invalid", task_id: TASK_ID });
    await runJob(invalid.job_id);
    const invalidResult = await getResult(invalid.job_id);

    const validation = await submit({
      api_request_id: "api-validation-failure",
      request_id: "req-validation-failure",
      task_id: TASK_ID,
      document_intent: "edit_paragraph",
      content: { text: "Task 012 validation failure" },
      constraints: { backend_role: "editor", backend_id: "NodeXmlThinInterimEditorAdapter", no_real_com: true, no_final_core_selection: true, force_validation_failure: true },
    });
    await runJob(validation.job_id);
    const validationResult = await getResult(validation.job_id);
    const unknown = await getJob("job-missing");

    const jobs = [
      await readInternalServiceJson(resolve(root, internalServiceAdapterPaths.copiedJob(submitted.job_id))),
      await readInternalServiceJson(resolve(root, internalServiceAdapterPaths.copiedJob(invalid.job_id))),
      await readInternalServiceJson(resolve(root, internalServiceAdapterPaths.copiedJob(validation.job_id))),
    ];
    const summary = {
      task_id: TASK_ID,
      generated_at: isoNow(),
      completion_candidate: jobs.some((job) => job.status === "completed") && invalidResult.data?.status === "rejected" && validationResult.data?.status === "failed" && unknown.ok === false,
      service_operations: ["submit", "runJob", "getJob", "getStatus", "getResult", "listEvents"],
      completed_count: jobs.filter((job) => job.status === "completed").length,
      rejected_count: jobs.filter((job) => job.status === "rejected").length,
      failed_count: jobs.filter((job) => job.status === "failed").length,
      not_found_proof: unknown.error?.type === "not_found",
      not_ready_proof: notReady.error?.type === "not_ready",
      real_com_executed: false,
      final_core_selection_declared: false,
      stage_2_transition_declared: false,
      completed_artifacts_modified: false,
      read_only_reference_roots: [
        "release/test-documents/hwpx-core-benchmark-003-evidence-integrity",
        "release/test-documents/hwpcoreadapter-backend-proof-006",
        "release/test-documents/editor-backend-candidate-comparison-007",
        "release/test-documents/node-xml-thin-interim-adapter-integration-008",
        "release/test-documents/agent-operation-plan-e2e-proof-009",
        "release/test-documents/agent-api-boundary-proof-010",
        "release/test-documents/local-job-boundary-proof-011",
      ],
    };
    await writeJson(resolve(root, internalServiceAdapterPaths.tests.summary), summary);
    await rm(resolve(root, internalServiceAdapterPaths.executionWorkspaces), { recursive: true, force: true });
    return summary;
  }

  return { submit, runJob, getJob, getStatus, getResult, listEvents, runAllProofs };
}

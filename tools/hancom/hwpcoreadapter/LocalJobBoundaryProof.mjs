import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { handleAgentApiRequest } from "./AgentApiBoundaryProof.mjs";

const TASK_ID = "local-job-boundary-proof-011";
const SOURCE_FIXTURE = "release/test-documents/army-claw-qualification-review-template-fidelity-v5.hwpx";

export const localJobBoundaryPaths = Object.freeze({
  root: "release/test-documents/local-job-boundary-proof-011",
  requests: Object.freeze({
    createDocument: "release/test-documents/local-job-boundary-proof-011/requests/create-document-request.json",
    editParagraph: "release/test-documents/local-job-boundary-proof-011/requests/edit-paragraph-request.json",
    editTable: "release/test-documents/local-job-boundary-proof-011/requests/edit-table-request.json",
    applyStyle: "release/test-documents/local-job-boundary-proof-011/requests/apply-style-request.json",
    invalid: "release/test-documents/local-job-boundary-proof-011/requests/invalid-request.json",
    validationFailure: "release/test-documents/local-job-boundary-proof-011/requests/validation-failure-request.json",
  }),
  responses: "release/test-documents/local-job-boundary-proof-011/responses",
  plans: "release/test-documents/local-job-boundary-proof-011/plans",
  reports: "release/test-documents/local-job-boundary-proof-011/reports",
  outputs: "release/test-documents/local-job-boundary-proof-011/outputs",
  evidence: "release/test-documents/local-job-boundary-proof-011/evidence",
  jobs: "release/test-documents/local-job-boundary-proof-011/jobs",
  apiWorkspaces: "release/test-documents/local-job-boundary-proof-011/api-workspaces",
  tests: Object.freeze({
    summary: "release/test-documents/local-job-boundary-proof-011/tests/local-job-boundary-summary.json",
  }),
  jobRecord(jobId) {
    return join(this.jobs, jobId, "job.json");
  },
  jobEvents(jobId) {
    return join(this.jobs, jobId, "events.json");
  },
  jobSnapshot(jobId, name) {
    return join(this.jobs, jobId, "snapshots", `${name}.json`);
  },
});

function isoNow() {
  return new Date().toISOString();
}

function slug(value) {
  return String(value ?? "invalid").replaceAll("_", "-").replaceAll(/[^a-zA-Z0-9-]/g, "-");
}

function normalize(path) {
  return path.replaceAll("\\", "/");
}

async function writeJson(path, payload) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export async function readLocalJobJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function pathKeyFor(request) {
  if (request?.constraints?.force_validation_failure) return "validationFailure";
  if (request?.document_intent === "create_document") return "createDocument";
  if (request?.document_intent === "edit_paragraph") return "editParagraph";
  if (request?.document_intent === "edit_table") return "editTable";
  if (request?.document_intent === "apply_style") return "applyStyle";
  return "invalid";
}

function jobIdFor(request) {
  return `job-${slug(request?.api_request_id ?? request?.request_id ?? pathKeyFor(request))}`;
}

function terminalStatusFor(response) {
  if (response.status === "completed") return "completed";
  if (response.status === "failed") return "failed";
  return "rejected";
}

function artifactName(jobId, suffix) {
  return `${jobId}-${suffix}`;
}

function jobDir(jobId) {
  return join(localJobBoundaryPaths.jobs, jobId);
}

async function appendEvent(root, job, fromStatus, toStatus, reason, artifactPath = null) {
  const eventsPath = resolve(root, localJobBoundaryPaths.jobEvents(job.job_id));
  let events = [];
  try {
    events = await readLocalJobJson(eventsPath);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const event = {
    event_id: `event-${String(events.length + 1).padStart(3, "0")}`,
    job_id: job.job_id,
    from_status: fromStatus,
    to_status: toStatus,
    timestamp: isoNow(),
    reason,
    artifact_path: artifactPath,
  };
  events.push(event);
  await writeJson(eventsPath, events);
  return event;
}

async function saveJob(root, job) {
  await writeJson(resolve(root, localJobBoundaryPaths.jobRecord(job.job_id)), job);
  return job;
}

async function snapshot(root, job, name) {
  const payload = {
    snapshot_id: `${job.job_id}-${name}`,
    job_id: job.job_id,
    status: job.status,
    timestamp: isoNow(),
    request_path: job.request_path,
    response_path: job.response_path,
    plan_path: job.plan_path,
    report_path: job.report_path,
    output_path: job.output_path,
    evidence_paths: job.evidence_paths,
    failure: job.failure,
    attempts: job.attempts,
    real_com_executed: false,
    final_core_selection_declared: false,
    stage_2_transition_declared: false,
  };
  const path = resolve(root, localJobBoundaryPaths.jobSnapshot(job.job_id, name));
  await writeJson(path, payload);
  return payload;
}

async function copyIfExists(source, target) {
  if (!source) return null;
  await mkdir(dirname(target), { recursive: true });
  await copyFile(source, target);
  return target;
}

async function prepareApiWorkspace(root, jobId) {
  const apiRoot = resolve(root, localJobBoundaryPaths.apiWorkspaces, jobId);
  await rm(apiRoot, { recursive: true, force: true });
  await mkdir(dirname(resolve(apiRoot, SOURCE_FIXTURE)), { recursive: true });
  await copyFile(resolve(root, SOURCE_FIXTURE), resolve(apiRoot, SOURCE_FIXTURE));
  return apiRoot;
}

function localizeRequestForApiWorkspace(request) {
  return {
    ...request,
    task_id: TASK_ID,
    input_path: undefined,
  };
}

async function collectResponseArtifacts(root, job, response) {
  const responsePath = resolve(root, localJobBoundaryPaths.responses, artifactName(job.job_id, "response.json"));
  await writeJson(responsePath, response);

  const planPath = await copyIfExists(response.plan_path, resolve(root, localJobBoundaryPaths.plans, artifactName(job.job_id, "plan.json")));
  const reportPath = await copyIfExists(response.report_path, resolve(root, localJobBoundaryPaths.reports, artifactName(job.job_id, "agent-report.json")));
  const outputPath = await copyIfExists(response.output_path, resolve(root, localJobBoundaryPaths.outputs, artifactName(job.job_id, "output.hwpx")));
  const evidencePaths = [];
  for (let index = 0; index < response.evidence_paths.length; index += 1) {
    const copied = await copyIfExists(response.evidence_paths[index], resolve(root, localJobBoundaryPaths.evidence, artifactName(job.job_id, `evidence-${index + 1}.json`)));
    if (copied) evidencePaths.push(copied);
  }
  return { responsePath, planPath, reportPath, outputPath, evidencePaths };
}

export async function submitLocalJob(request, { workspace }) {
  const root = resolve(workspace);
  const now = isoNow();
  const jobId = jobIdFor(request);
  const requestPath = resolve(root, localJobBoundaryPaths.requests[pathKeyFor(request)]);
  await writeJson(requestPath, request ?? {});
  const job = {
    job_id: jobId,
    api_request_id: request?.api_request_id ?? null,
    request_id: request?.request_id ?? null,
    task_id: request?.task_id ?? TASK_ID,
    status: "pending",
    created_at: now,
    updated_at: now,
    started_at: null,
    ended_at: null,
    request_path: requestPath,
    response_path: null,
    plan_path: null,
    report_path: null,
    output_path: null,
    evidence_paths: [],
    failure: null,
    attempts: 0,
    real_com_executed: false,
    final_core_selection_declared: false,
    stage_2_transition_declared: false,
  };
  await mkdir(resolve(root, jobDir(jobId), "snapshots"), { recursive: true });
  await saveJob(root, job);
  await appendEvent(root, job, null, "pending", "submitted", requestPath);
  await snapshot(root, job, "pending");
  return job;
}

export async function runLocalJob(jobId, { workspace }) {
  const root = resolve(workspace);
  let job = await readLocalJobJson(resolve(root, localJobBoundaryPaths.jobRecord(jobId)));
  const request = await readLocalJobJson(job.request_path);
  const runningAt = isoNow();
  job = {
    ...job,
    status: "running",
    started_at: runningAt,
    updated_at: runningAt,
    attempts: job.attempts + 1,
  };
  await saveJob(root, job);
  await appendEvent(root, job, "pending", "running", "execution_started");
  await snapshot(root, job, "running");

  const apiWorkspace = await prepareApiWorkspace(root, jobId);
  const response = await handleAgentApiRequest({ workspace: apiWorkspace, request: localizeRequestForApiWorkspace(request) });
  const artifacts = await collectResponseArtifacts(root, job, response);
  await rm(apiWorkspace, { recursive: true, force: true });
  const terminal = terminalStatusFor(response);
  const endedAt = isoNow();
  job = {
    ...job,
    status: terminal,
    updated_at: endedAt,
    ended_at: endedAt,
    response_path: artifacts.responsePath,
    plan_path: artifacts.planPath,
    report_path: artifacts.reportPath,
    output_path: artifacts.outputPath,
    evidence_paths: artifacts.evidencePaths,
    failure: response.failure,
    real_com_executed: false,
    final_core_selection_declared: false,
    stage_2_transition_declared: false,
  };
  await saveJob(root, job);
  await appendEvent(root, job, "running", terminal, `api_response_${response.status}`, artifacts.responsePath);
  await snapshot(root, job, terminal);
  await snapshot(root, job, "final");
  return job;
}

export async function getLocalJobStatus(jobId, { workspace, snapshotName = "status" } = {}) {
  const root = resolve(workspace);
  const job = await readLocalJobJson(resolve(root, localJobBoundaryPaths.jobRecord(jobId)));
  return snapshot(root, job, snapshotName);
}

export async function listLocalJobEvents(jobId, { workspace }) {
  return readLocalJobJson(resolve(workspace, localJobBoundaryPaths.jobEvents(jobId)));
}

export async function createLocalJobSnapshot(jobId, { workspace, name = "manual" }) {
  return getLocalJobStatus(jobId, { workspace, snapshotName: name });
}

export function createLocalJobBoundaryProofHarness({ workspace }) {
  const root = resolve(workspace);

  function requestFor(intent, id = intent, extra = {}) {
    return {
      api_request_id: `api-${id}`,
      request_id: `req-${id}`,
      task_id: TASK_ID,
      document_intent: intent,
      content: {
        text: `Task 011 ${intent} content`,
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

  async function submit(request) {
    return submitLocalJob(request, { workspace: root });
  }

  async function run(jobId) {
    return runLocalJob(jobId, { workspace: root });
  }

  async function status(jobId, name = "status") {
    return getLocalJobStatus(jobId, { workspace: root, snapshotName: name });
  }

  async function submitAndRun(request) {
    const job = await submit(request);
    return run(job.job_id);
  }

  async function runAllProofs() {
    const jobs = [];
    for (const intent of ["create_document", "edit_paragraph", "edit_table", "apply_style"]) {
      jobs.push(await submitAndRun(requestFor(intent)));
    }
    jobs.push(await submitAndRun({ api_request_id: "api-invalid", request_id: "req-invalid", task_id: TASK_ID }));
    jobs.push(await submitAndRun(requestFor("edit_paragraph", "validation-failure", { constraints: { force_validation_failure: true } })));
    const summary = {
      task_id: TASK_ID,
      generated_at: isoNow(),
      completion_candidate: jobs.filter((job) => job.status === "completed").length === 4 && jobs.filter((job) => job.status === "rejected").length === 1 && jobs.filter((job) => job.status === "failed").length === 1,
      job_count: jobs.length,
      completed_count: jobs.filter((job) => job.status === "completed").length,
      rejected_count: jobs.filter((job) => job.status === "rejected").length,
      failed_count: jobs.filter((job) => job.status === "failed").length,
      jobs: jobs.map((job) => ({
        job_id: job.job_id,
        status: job.status,
        request_path: normalize(job.request_path),
        response_path: job.response_path ? normalize(job.response_path) : null,
        plan_path: job.plan_path ? normalize(job.plan_path) : null,
        report_path: job.report_path ? normalize(job.report_path) : null,
        output_path: job.output_path ? normalize(job.output_path) : null,
        evidence_paths: job.evidence_paths.map(normalize),
        failure_type: job.failure?.type ?? null,
      })),
      real_com_executed: false,
      final_core_selection_declared: false,
      stage_2_transition_declared: false,
      completed_artifacts_modified: false,
      retry_implemented: false,
      read_only_reference_roots: [
        "release/test-documents/hwpx-core-benchmark-003-evidence-integrity",
        "release/test-documents/hwpcoreadapter-backend-proof-006",
        "release/test-documents/editor-backend-candidate-comparison-007",
        "release/test-documents/node-xml-thin-interim-adapter-integration-008",
        "release/test-documents/agent-operation-plan-e2e-proof-009",
        "release/test-documents/agent-api-boundary-proof-010",
      ],
    };
    await writeJson(resolve(root, localJobBoundaryPaths.tests.summary), summary);
    return summary;
  }

  return { submit, run, status, submitAndRun, runAllProofs };
}

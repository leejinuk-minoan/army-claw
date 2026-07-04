import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { HwpCoreAdapter, createFileProbe } from "./HwpCoreAdapter.mjs";
import { createNodeXmlThinInterimEditorAdapter } from "./NodeXmlThinInterimEditorAdapter.mjs";

const TASK_ID = "agent-api-boundary-proof-010";
const PLANNER_ID = "AgentApiBoundaryPlanner";
const BACKEND_ID = "NodeXmlThinInterimEditorAdapter";
const SOURCE_FIXTURE = "release/test-documents/army-claw-qualification-review-template-fidelity-v5.hwpx";
const ALLOWED_INTENTS = ["create_document", "edit_paragraph", "edit_table", "apply_style"];

export const agentApiBoundaryPaths = Object.freeze({
  root: "release/test-documents/agent-api-boundary-proof-010",
  fixtures: "release/test-documents/agent-api-boundary-proof-010/fixtures",
  fixturesSource: "release/test-documents/agent-api-boundary-proof-010/fixtures/source.hwpx",
  requests: Object.freeze({
    createDocument: "release/test-documents/agent-api-boundary-proof-010/requests/create-document-request.json",
    editParagraph: "release/test-documents/agent-api-boundary-proof-010/requests/edit-paragraph-request.json",
    editTable: "release/test-documents/agent-api-boundary-proof-010/requests/edit-table-request.json",
    applyStyle: "release/test-documents/agent-api-boundary-proof-010/requests/apply-style-request.json",
    invalid: "release/test-documents/agent-api-boundary-proof-010/requests/invalid-request.json",
    validationFailure: "release/test-documents/agent-api-boundary-proof-010/requests/validation-failure-request.json",
  }),
  responses: Object.freeze({
    createDocument: "release/test-documents/agent-api-boundary-proof-010/responses/create-document-response.json",
    editParagraph: "release/test-documents/agent-api-boundary-proof-010/responses/edit-paragraph-response.json",
    editTable: "release/test-documents/agent-api-boundary-proof-010/responses/edit-table-response.json",
    applyStyle: "release/test-documents/agent-api-boundary-proof-010/responses/apply-style-response.json",
    invalid: "release/test-documents/agent-api-boundary-proof-010/responses/invalid-response.json",
    validationFailure: "release/test-documents/agent-api-boundary-proof-010/responses/validation-failure-response.json",
  }),
  plans: Object.freeze({
    createDocument: "release/test-documents/agent-api-boundary-proof-010/plans/create-document-plan.json",
    editParagraph: "release/test-documents/agent-api-boundary-proof-010/plans/edit-paragraph-plan.json",
    editTable: "release/test-documents/agent-api-boundary-proof-010/plans/edit-table-plan.json",
    applyStyle: "release/test-documents/agent-api-boundary-proof-010/plans/apply-style-plan.json",
    validationFailure: "release/test-documents/agent-api-boundary-proof-010/plans/validation-failure-plan.json",
  }),
  reports: Object.freeze({
    createDocument: "release/test-documents/agent-api-boundary-proof-010/reports/create-document-agent-report.json",
    editParagraph: "release/test-documents/agent-api-boundary-proof-010/reports/edit-paragraph-agent-report.json",
    editTable: "release/test-documents/agent-api-boundary-proof-010/reports/edit-table-agent-report.json",
    applyStyle: "release/test-documents/agent-api-boundary-proof-010/reports/apply-style-agent-report.json",
    validationFailure: "release/test-documents/agent-api-boundary-proof-010/reports/validation-failure-agent-report.json",
  }),
  outputs: Object.freeze({
    createDocument: "release/test-documents/agent-api-boundary-proof-010/outputs/create-document-output.hwpx",
    editParagraph: "release/test-documents/agent-api-boundary-proof-010/outputs/edit-paragraph-output.hwpx",
    editTable: "release/test-documents/agent-api-boundary-proof-010/outputs/edit-table-output.hwpx",
    applyStyle: "release/test-documents/agent-api-boundary-proof-010/outputs/apply-style-output.hwpx",
    validationFailure: "release/test-documents/agent-api-boundary-proof-010/outputs/validation-failure-output.hwpx",
  }),
  evidence: "release/test-documents/agent-api-boundary-proof-010/evidence",
  tests: Object.freeze({
    summary: "release/test-documents/agent-api-boundary-proof-010/tests/api-boundary-summary.json",
  }),
});

const pathByIntent = Object.freeze({
  create_document: {
    request: agentApiBoundaryPaths.requests.createDocument,
    response: agentApiBoundaryPaths.responses.createDocument,
    plan: agentApiBoundaryPaths.plans.createDocument,
    report: agentApiBoundaryPaths.reports.createDocument,
    output: agentApiBoundaryPaths.outputs.createDocument,
    operationId: "create-document",
  },
  edit_paragraph: {
    request: agentApiBoundaryPaths.requests.editParagraph,
    response: agentApiBoundaryPaths.responses.editParagraph,
    plan: agentApiBoundaryPaths.plans.editParagraph,
    report: agentApiBoundaryPaths.reports.editParagraph,
    output: agentApiBoundaryPaths.outputs.editParagraph,
    operationId: "edit-paragraph",
  },
  edit_table: {
    request: agentApiBoundaryPaths.requests.editTable,
    response: agentApiBoundaryPaths.responses.editTable,
    plan: agentApiBoundaryPaths.plans.editTable,
    report: agentApiBoundaryPaths.reports.editTable,
    output: agentApiBoundaryPaths.outputs.editTable,
    operationId: "edit-table",
  },
  apply_style: {
    request: agentApiBoundaryPaths.requests.applyStyle,
    response: agentApiBoundaryPaths.responses.applyStyle,
    plan: agentApiBoundaryPaths.plans.applyStyle,
    report: agentApiBoundaryPaths.reports.applyStyle,
    output: agentApiBoundaryPaths.outputs.applyStyle,
    operationId: "apply-style",
  },
});

function isoNow() {
  return new Date().toISOString();
}

function normalize(path) {
  return path.replaceAll("\\", "/");
}

function slugForIntent(intent) {
  return String(intent ?? "invalid").replaceAll("_", "-");
}

async function writeJson(path, payload) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export async function readAgentApiJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function requestPathFor(request) {
  if (request.constraints?.force_validation_failure) return agentApiBoundaryPaths.requests.validationFailure;
  return pathByIntent[request.document_intent]?.request ?? agentApiBoundaryPaths.requests.invalid;
}

function responsePathFor(request) {
  if (request.constraints?.force_validation_failure) return agentApiBoundaryPaths.responses.validationFailure;
  return pathByIntent[request.document_intent]?.response ?? agentApiBoundaryPaths.responses.invalid;
}

function reportPathFor(request) {
  if (request.constraints?.force_validation_failure) return agentApiBoundaryPaths.reports.validationFailure;
  return pathByIntent[request.document_intent]?.report ?? null;
}

function planPathFor(request) {
  if (request.constraints?.force_validation_failure) return agentApiBoundaryPaths.plans.validationFailure;
  return pathByIntent[request.document_intent]?.plan ?? null;
}

function outputPathFor(request) {
  if (request.constraints?.force_validation_failure) return agentApiBoundaryPaths.outputs.validationFailure;
  return pathByIntent[request.document_intent]?.output ?? join(agentApiBoundaryPaths.root, "outputs", `${slugForIntent(request.document_intent)}-output.hwpx`);
}

function optionsForRequest(request) {
  const content = request.content ?? {};
  if (request.document_intent === "create_document") {
    return { title: content.text ?? "Task 010 created document" };
  }
  if (request.document_intent === "edit_paragraph") {
    return { text: content.text ?? "Task 010 paragraph edit" };
  }
  if (request.document_intent === "edit_table") {
    return { rows: content.table ?? [["Task", "010"], ["API", "Boundary"]] };
  }
  if (request.document_intent === "apply_style") {
    return { text: content.text ?? "Task 010 style application", style: content.style ?? "emphasis" };
  }
  return {};
}

export function validateAgentApiRequest(request) {
  const failures = [];
  if (!request || typeof request !== "object") failures.push("request_object_required");
  if (!request?.api_request_id) failures.push("api_request_id_required");
  if (!request?.request_id) failures.push("request_id_required");
  if (!request?.document_intent) failures.push("document_intent_required");
  if (request?.document_intent && !ALLOWED_INTENTS.includes(request.document_intent)) failures.push(`unsupported_document_intent:${request.document_intent}`);
  return { valid: failures.length === 0, failures };
}

async function ensureFixture(root) {
  await mkdir(resolve(root, agentApiBoundaryPaths.fixtures), { recursive: true });
  await copyFile(resolve(root, SOURCE_FIXTURE), resolve(root, agentApiBoundaryPaths.fixturesSource));
  return resolve(root, agentApiBoundaryPaths.fixturesSource);
}

export async function createAgentApiOperationPlan({ workspace, request }) {
  const root = resolve(workspace);
  const mapping = pathByIntent[request.document_intent];
  const plan = {
    plan_id: `plan-${request.request_id}`,
    request_id: request.request_id,
    api_request_id: request.api_request_id,
    task_id: request.task_id ?? TASK_ID,
    created_at: isoNow(),
    planner_id: PLANNER_ID,
    steps: [],
    constraints: {
      backend_role: request.constraints?.backend_role ?? "editor",
      backend_id: request.constraints?.backend_id ?? BACKEND_ID,
      no_real_com: request.constraints?.no_real_com ?? true,
      no_final_core_selection: request.constraints?.no_final_core_selection ?? true,
      force_validation_failure: request.constraints?.force_validation_failure ?? false,
    },
    source_request: request,
  };

  if (mapping) {
    plan.steps.push({
      step_id: `step-${slugForIntent(request.document_intent)}`,
      operation_id: mapping.operationId,
      intent: request.document_intent,
      backend_role: "editor",
      input_path: resolve(root, request.input_path ?? agentApiBoundaryPaths.fixturesSource),
      output_path: resolve(root, outputPathFor(request)),
      options: optionsForRequest(request),
      evidence_tag: `${mapping.operationId}-editor`,
      expected_evidence_path: resolve(root, agentApiBoundaryPaths.evidence, `${mapping.operationId}-editor.json`),
    });
  }
  return plan;
}

function stepReport(step, result) {
  return {
    step_id: step.step_id,
    operation_id: step.operation_id,
    intent: step.intent,
    backend_role: step.backend_role,
    success: result.success,
    promoted: result.promoted,
    output_path: step.output_path,
    evidence_path: result.evidence_path,
    validation: result.validation,
    failure: result.failure,
  };
}

async function removeFailedTempOutput(result) {
  if (result?.promoted === false && result.output_probe?.path) {
    await rm(result.output_probe.path, { force: true }).catch(() => {});
  }
}

function apiResponseFromReport({ request, report, validation }) {
  const success = report.success === true;
  return {
    api_request_id: request.api_request_id,
    request_id: request.request_id,
    accepted: true,
    status: success ? "completed" : "failed",
    plan_path: report.plan_path,
    report_path: report.report_path,
    output_path: success ? report.final_output_path : null,
    evidence_paths: report.evidence_paths,
    failure: report.failures[0] ?? null,
    validation,
    real_com_executed: false,
    final_core_selection_declared: false,
    stage_2_transition_declared: false,
  };
}

function rejectedResponse({ request, validation }) {
  return {
    api_request_id: request?.api_request_id ?? null,
    request_id: request?.request_id ?? null,
    accepted: false,
    status: "rejected",
    plan_path: null,
    report_path: null,
    output_path: null,
    evidence_paths: [],
    failure: { type: "policy_error", message: validation.failures.join(";"), last_successful_step: "validate_api_request", quarantine_path: null },
    validation: { valid: false, failure_count: validation.failures.length, failures: validation.failures },
    real_com_executed: false,
    final_core_selection_declared: false,
    stage_2_transition_declared: false,
  };
}

export async function handleAgentApiRequest({ workspace, request }) {
  const root = resolve(workspace);
  await writeJson(resolve(root, requestPathFor(request ?? {})), request ?? {});
  const validation = validateAgentApiRequest(request);
  if (!validation.valid) {
    const response = rejectedResponse({ request, validation });
    await writeJson(resolve(root, responsePathFor(request ?? {})), response);
    return response;
  }

  await ensureFixture(root);
  const plan = await createAgentApiOperationPlan({ workspace: root, request });
  const planPath = resolve(root, planPathFor(request));
  await writeJson(planPath, plan);

  const adapter = new HwpCoreAdapter({
    backends: { editor: createNodeXmlThinInterimEditorAdapter({ forceValidationFailure: plan.constraints.force_validation_failure }) },
    evidenceDir: resolve(root, agentApiBoundaryPaths.evidence),
  });

  const startedAt = isoNow();
  const steps = [];
  const evidencePaths = [];
  const failures = [];
  const promotedOutputs = [];
  for (const step of plan.steps) {
    const result = await adapter.executeOperation({
      task_id: plan.task_id,
      operation_id: step.operation_id,
      intent: step.intent,
      backend_role: step.backend_role,
      input_path: step.input_path,
      output_path: step.output_path,
      options: step.options,
    });
    if (result.evidence_path) evidencePaths.push(result.evidence_path);
    if (result.promoted) promotedOutputs.push(step.output_path);
    if (result.failure) failures.push(result.failure);
    steps.push(stepReport(step, result));
    await removeFailedTempOutput(result);
  }

  const success = steps.length > 0 && steps.every((step) => step.success === true && step.promoted === true);
  const reportPath = resolve(root, reportPathFor(request));
  const report = {
    report_id: `report-${request.request_id}`,
    request_id: request.request_id,
    api_request_id: request.api_request_id,
    plan_id: plan.plan_id,
    plan_path: planPath,
    report_path: reportPath,
    task_id: plan.task_id,
    started_at: startedAt,
    ended_at: isoNow(),
    success,
    final_output_path: success ? steps.at(-1).output_path : null,
    steps,
    evidence_paths: evidencePaths,
    failures,
    promoted_outputs: promotedOutputs,
    real_com_executed: false,
    final_core_selection_declared: false,
    stage_2_transition_declared: false,
  };
  await writeJson(reportPath, report);

  const lastValidation = steps.at(-1)?.validation ?? { valid: false, failure_count: 1, failures: ["no_executable_step"] };
  const response = apiResponseFromReport({ request, report, validation: lastValidation });
  await writeJson(resolve(root, responsePathFor(request)), response);
  return response;
}

async function outputProbeFor(path) {
  const probe = await createFileProbe(path);
  return { path: normalize(probe.path), exists: probe.exists, size: probe.size, sha256: probe.sha256 };
}

export function createAgentApiBoundaryProofHarness({ workspace }) {
  const root = resolve(workspace);

  function requestFor(intent, id = intent, extra = {}) {
    return {
      api_request_id: `api-${id}`,
      request_id: `req-${id}`,
      task_id: TASK_ID,
      document_intent: intent,
      content: {
        text: `Task 010 ${intent} content`,
        table: [["A", "B"], ["1", "2"]],
        style: "emphasis",
      },
      constraints: {
        backend_role: "editor",
        backend_id: BACKEND_ID,
        no_real_com: true,
        no_final_core_selection: true,
        ...(extra.constraints ?? {}),
      },
    };
  }

  async function handleApiRequest(request) {
    return handleAgentApiRequest({ workspace: root, request });
  }

  async function runAllProofs() {
    const completed = [];
    for (const intent of ALLOWED_INTENTS) {
      completed.push(await handleApiRequest(requestFor(intent)));
    }
    const rejected = await handleApiRequest({ api_request_id: "api-invalid", request_id: "req-invalid", task_id: TASK_ID });
    const failed = await handleApiRequest(requestFor("edit_paragraph", "validation-failure", { constraints: { force_validation_failure: true } }));
    const outputs = [];
    for (const response of completed) {
      outputs.push(await outputProbeFor(response.output_path));
    }
    const summary = {
      task_id: TASK_ID,
      generated_at: isoNow(),
      completion_candidate: completed.every((response) => response.status === "completed") && rejected.status === "rejected" && failed.status === "failed",
      request_count: completed.length + 2,
      completed_count: completed.length,
      rejected_count: rejected.status === "rejected" ? 1 : 0,
      failed_count: failed.status === "failed" ? 1 : 0,
      completed_response_paths: [
        agentApiBoundaryPaths.responses.createDocument,
        agentApiBoundaryPaths.responses.editParagraph,
        agentApiBoundaryPaths.responses.editTable,
        agentApiBoundaryPaths.responses.applyStyle,
      ],
      rejected_response_path: agentApiBoundaryPaths.responses.invalid,
      failed_response_path: agentApiBoundaryPaths.responses.validationFailure,
      outputs,
      evidence_paths: completed.flatMap((response) => response.evidence_paths),
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
      ],
    };
    await writeJson(resolve(root, agentApiBoundaryPaths.tests.summary), summary);
    return summary;
  }

  return { handleApiRequest, runAllProofs };
}

import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { HwpCoreAdapter, createFileProbe } from "./HwpCoreAdapter.mjs";
import { createNodeXmlThinInterimEditorAdapter } from "./NodeXmlThinInterimEditorAdapter.mjs";

const TASK_ID = "agent-operation-plan-e2e-proof-009";
const PLANNER_ID = "AgentOperationPlanE2EPlanner";
const BACKEND_ID = "NodeXmlThinInterimEditorAdapter";
const SOURCE_FIXTURE = "release/test-documents/army-claw-qualification-review-template-fidelity-v5.hwpx";
const ALLOWED_INTENTS = ["create_document", "edit_paragraph", "edit_table", "apply_style"];

export const agentE2EPaths = Object.freeze({
  root: "release/test-documents/agent-operation-plan-e2e-proof-009",
  fixtures: "release/test-documents/agent-operation-plan-e2e-proof-009/fixtures",
  fixturesSource: "release/test-documents/agent-operation-plan-e2e-proof-009/fixtures/source.hwpx",
  plans: Object.freeze({
    createDocument: "release/test-documents/agent-operation-plan-e2e-proof-009/plans/create-document-plan.json",
    editParagraph: "release/test-documents/agent-operation-plan-e2e-proof-009/plans/edit-paragraph-plan.json",
    editTable: "release/test-documents/agent-operation-plan-e2e-proof-009/plans/edit-table-plan.json",
    applyStyle: "release/test-documents/agent-operation-plan-e2e-proof-009/plans/apply-style-plan.json",
  }),
  reports: Object.freeze({
    createDocument: "release/test-documents/agent-operation-plan-e2e-proof-009/reports/create-document-agent-report.json",
    editParagraph: "release/test-documents/agent-operation-plan-e2e-proof-009/reports/edit-paragraph-agent-report.json",
    editTable: "release/test-documents/agent-operation-plan-e2e-proof-009/reports/edit-table-agent-report.json",
    applyStyle: "release/test-documents/agent-operation-plan-e2e-proof-009/reports/apply-style-agent-report.json",
    unknownIntent: "release/test-documents/agent-operation-plan-e2e-proof-009/reports/unknown-intent-agent-report.json",
    validationFailure: "release/test-documents/agent-operation-plan-e2e-proof-009/reports/validation-failure-agent-report.json",
  }),
  outputs: Object.freeze({
    createDocument: "release/test-documents/agent-operation-plan-e2e-proof-009/outputs/create-document-output.hwpx",
    editParagraph: "release/test-documents/agent-operation-plan-e2e-proof-009/outputs/edit-paragraph-output.hwpx",
    editTable: "release/test-documents/agent-operation-plan-e2e-proof-009/outputs/edit-table-output.hwpx",
    applyStyle: "release/test-documents/agent-operation-plan-e2e-proof-009/outputs/apply-style-output.hwpx",
    validationFailure: "release/test-documents/agent-operation-plan-e2e-proof-009/outputs/validation-failure-output.hwpx",
  }),
  evidence: "release/test-documents/agent-operation-plan-e2e-proof-009/evidence",
  tests: Object.freeze({
    summary: "release/test-documents/agent-operation-plan-e2e-proof-009/tests/agent-operation-plan-e2e-summary.json",
  }),
});

const pathByIntent = Object.freeze({
  create_document: {
    plan: agentE2EPaths.plans.createDocument,
    report: agentE2EPaths.reports.createDocument,
    output: agentE2EPaths.outputs.createDocument,
    operationId: "create-document",
  },
  edit_paragraph: {
    plan: agentE2EPaths.plans.editParagraph,
    report: agentE2EPaths.reports.editParagraph,
    output: agentE2EPaths.outputs.editParagraph,
    operationId: "edit-paragraph",
  },
  edit_table: {
    plan: agentE2EPaths.plans.editTable,
    report: agentE2EPaths.reports.editTable,
    output: agentE2EPaths.outputs.editTable,
    operationId: "edit-table",
  },
  apply_style: {
    plan: agentE2EPaths.plans.applyStyle,
    report: agentE2EPaths.reports.applyStyle,
    output: agentE2EPaths.outputs.applyStyle,
    operationId: "apply-style",
  },
});

function isoNow() {
  return new Date().toISOString();
}

function normalize(path) {
  return path.replaceAll("\\", "/");
}

async function writeJson(path, payload) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

export async function readAgentJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function slugForIntent(intent) {
  return String(intent).replaceAll("_", "-");
}

function optionsForRequest(request) {
  const content = request.content ?? {};
  if (request.document_intent === "create_document") {
    return { title: content.text ?? "Task 009 created document" };
  }
  if (request.document_intent === "edit_paragraph") {
    return { text: content.text ?? "Task 009 paragraph" };
  }
  if (request.document_intent === "edit_table") {
    return { rows: content.table ?? [["A", "B"], ["1", "2"]] };
  }
  if (request.document_intent === "apply_style") {
    return { text: content.text ?? "Task 009 style", style: content.style ?? "emphasis" };
  }
  return {};
}

function reportPathFor(request) {
  if (request.constraints?.force_validation_failure) return agentE2EPaths.reports.validationFailure;
  return pathByIntent[request.document_intent]?.report ?? agentE2EPaths.reports.unknownIntent;
}

function outputPathFor(request) {
  if (request.constraints?.force_validation_failure) return agentE2EPaths.outputs.validationFailure;
  return pathByIntent[request.document_intent]?.output ?? join(agentE2EPaths.root, "outputs", `${slugForIntent(request.document_intent)}-output.hwpx`);
}

export async function createAgentOperationPlan({ workspace, request }) {
  const root = resolve(workspace);
  const now = isoNow();
  const intent = request.document_intent;
  const mapping = pathByIntent[intent];
  const known = ALLOWED_INTENTS.includes(intent);
  const plan = {
    plan_id: `plan-${request.request_id}`,
    request_id: request.request_id,
    task_id: request.task_id ?? TASK_ID,
    created_at: now,
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

  if (known) {
    plan.steps.push({
      step_id: `step-${slugForIntent(intent)}`,
      operation_id: mapping.operationId,
      intent,
      backend_role: "editor",
      input_path: resolve(root, request.input_path ?? agentE2EPaths.fixturesSource),
      output_path: resolve(root, outputPathFor(request)),
      options: optionsForRequest(request),
      evidence_tag: `${mapping.operationId}-editor`,
      expected_evidence_path: resolve(root, agentE2EPaths.evidence, `${mapping.operationId}-editor.json`),
    });
  }
  return plan;
}

async function ensureFixture(root) {
  await mkdir(resolve(root, agentE2EPaths.fixtures), { recursive: true });
  await copyFile(resolve(root, SOURCE_FIXTURE), resolve(root, agentE2EPaths.fixturesSource));
  return resolve(root, agentE2EPaths.fixturesSource);
}

function emptyFailureReport({ request, plan = null, startedAt, failure }) {
  return {
    report_id: `report-${request.request_id}`,
    request_id: request.request_id,
    plan_id: plan?.plan_id ?? null,
    task_id: request.task_id ?? TASK_ID,
    started_at: startedAt,
    ended_at: isoNow(),
    success: false,
    final_output_path: null,
    steps: [],
    evidence_paths: [],
    failures: [failure],
    promoted_outputs: [],
    real_com_executed: false,
    final_core_selection_declared: false,
    stage_2_transition_declared: false,
  };
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

export async function executeAgentRequest({ workspace, request }) {
  const root = resolve(workspace);
  const startedAt = isoNow();
  await ensureFixture(root);
  const plan = await createAgentOperationPlan({ workspace: root, request });
  const targetPlanPath = pathByIntent[request.document_intent]?.plan;
  if (targetPlanPath) await writeJson(resolve(root, targetPlanPath), plan);

  if (!ALLOWED_INTENTS.includes(request.document_intent)) {
    const failure = { type: "policy_error", message: `unsupported_document_intent:${request.document_intent}`, last_successful_step: "plan_request" };
    const report = emptyFailureReport({ request, plan, startedAt, failure });
    await writeJson(resolve(root, reportPathFor(request)), report);
    return report;
  }

  const adapter = new HwpCoreAdapter({
    backends: { editor: createNodeXmlThinInterimEditorAdapter({ forceValidationFailure: plan.constraints.force_validation_failure }) },
    evidenceDir: resolve(root, agentE2EPaths.evidence),
  });

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
  const report = {
    report_id: `report-${request.request_id}`,
    request_id: request.request_id,
    plan_id: plan.plan_id,
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
  await writeJson(resolve(root, reportPathFor(request)), report);
  return report;
}

export function createAgentOperationPlanE2EHarness({ workspace }) {
  const root = resolve(workspace);

  function requestFor(intent, id = intent, extra = {}) {
    return {
      request_id: `req-${id}`,
      task_id: TASK_ID,
      document_intent: intent,
      content: {
        text: `Task 009 ${intent} content`,
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

  async function runAgentRequest(request) {
    return executeAgentRequest({ workspace: root, request });
  }

  async function runAllSuccessfulRequests() {
    const reports = [];
    for (const intent of ALLOWED_INTENTS) reports.push(await runAgentRequest(requestFor(intent)));
    return reports;
  }

  async function runAllProofs() {
    const reports = await runAllSuccessfulRequests();
    const unknown = await runAgentRequest(requestFor("unknown_intent", "unknown"));
    const validation = await runAgentRequest(requestFor("edit_paragraph", "validation-failure", { constraints: { force_validation_failure: true } }));
    const outputs = [];
    for (const report of reports) {
      outputs.push(await createFileProbe(report.final_output_path));
    }
    const summary = {
      task_id: TASK_ID,
      generated_at: isoNow(),
      completion_candidate: reports.every((report) => report.success === true) && unknown.success === false && validation.success === false && validation.promoted_outputs.length === 0,
      request_count: reports.length + 2,
      successful_request_count: reports.length,
      supported_intents: ALLOWED_INTENTS,
      outputs: outputs.map((probe) => ({ path: normalize(probe.path), exists: probe.exists, size: probe.size, sha256: probe.sha256 })),
      report_paths: [
        agentE2EPaths.reports.createDocument,
        agentE2EPaths.reports.editParagraph,
        agentE2EPaths.reports.editTable,
        agentE2EPaths.reports.applyStyle,
        agentE2EPaths.reports.unknownIntent,
        agentE2EPaths.reports.validationFailure,
      ],
      evidence_paths: reports.flatMap((report) => report.evidence_paths),
      unknown_intent: { success: unknown.success, failure_type: unknown.failures[0]?.type ?? null },
      validation_failure: { success: validation.success, promoted_outputs: validation.promoted_outputs.length, failure_type: validation.failures[0]?.type ?? null },
      real_com_executed: false,
      final_core_selection_declared: false,
      stage_2_transition_declared: false,
      completed_artifacts_modified: false,
      read_only_reference_roots: [
        "release/test-documents/hwpx-core-benchmark-003-evidence-integrity",
        "release/test-documents/hwpcoreadapter-backend-proof-006",
        "release/test-documents/editor-backend-candidate-comparison-007",
        "release/test-documents/node-xml-thin-interim-adapter-integration-008",
      ],
    };
    await writeJson(resolve(root, agentE2EPaths.tests.summary), summary);
    return summary;
  }

  return { runAgentRequest, runAllSuccessfulRequests, runAllProofs };
}

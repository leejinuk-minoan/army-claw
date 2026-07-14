import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm } from "node:fs/promises";
import {
  createLocalJobBoundaryProofHarness,
  getLocalJobStatus,
  listLocalJobEvents,
  localJobBoundaryPaths,
  readLocalJobJson,
  submitLocalJob,
} from "./LocalJobBoundaryProof.mjs";

const WORKSPACE = process.cwd();
const TASK_ID = "local-job-boundary-proof-011";
const COMPLETED_REFERENCE_ROOTS = [
  "release/test-documents/hwpx-core-benchmark-003-evidence-integrity",
  "release/test-documents/hwpcoreadapter-backend-proof-006",
  "release/test-documents/editor-backend-candidate-comparison-007",
  "release/test-documents/node-xml-thin-interim-adapter-integration-008",
  "release/test-documents/agent-operation-plan-e2e-proof-009",
  "release/test-documents/agent-api-boundary-proof-010",
];

async function resetRoot() {
  await rm(localJobBoundaryPaths.root, { recursive: true, force: true });
  await mkdir(localJobBoundaryPaths.root, { recursive: true });
}

async function harness() {
  await resetRoot();
  return createLocalJobBoundaryProofHarness({ workspace: WORKSPACE });
}

function request(intent, id = intent, extra = {}) {
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

test("submitLocalJob creates pending job record", async () => {
  await resetRoot();
  const job = await submitLocalJob(request("create_document"), { workspace: WORKSPACE });
  assert.equal(job.status, "pending");
  assert.equal(existsSync(job.request_path), true);
  assert.equal(existsSync(localJobBoundaryPaths.jobRecord(job.job_id)), true);
  const snapshot = await getLocalJobStatus(job.job_id, { workspace: WORKSPACE });
  assert.equal(snapshot.status, "pending");
});

test("runLocalJob transitions create_document job to completed", async () => {
  const proof = await harness();
  const job = await proof.submit(request("create_document"));
  const before = await proof.status(job.job_id, "before-run");
  assert.equal(before.status, "pending");
  const completed = await proof.run(job.job_id);
  assert.equal(completed.status, "completed");
  assert.equal(existsSync(completed.output_path), true);
});

test("completed job includes response report output and evidence paths", async () => {
  const proof = await harness();
  const completed = await proof.submitAndRun(request("create_document"));
  assert.equal(existsSync(completed.response_path), true);
  assert.equal(existsSync(completed.report_path), true);
  assert.equal(existsSync(completed.output_path), true);
  assert.equal(completed.evidence_paths.length, 1);
  assert.equal(existsSync(completed.evidence_paths[0]), true);
});

test("edit_paragraph job completes", async () => {
  const proof = await harness();
  const completed = await proof.submitAndRun(request("edit_paragraph"));
  assert.equal(completed.status, "completed");
});

test("edit_table job completes", async () => {
  const proof = await harness();
  const completed = await proof.submitAndRun(request("edit_table"));
  assert.equal(completed.status, "completed");
});

test("apply_style job completes", async () => {
  const proof = await harness();
  const completed = await proof.submitAndRun(request("apply_style"));
  assert.equal(completed.status, "completed");
});

test("invalid request job becomes rejected and has no promoted output", async () => {
  const proof = await harness();
  const rejected = await proof.submitAndRun({ api_request_id: "api-invalid", request_id: "req-invalid", task_id: TASK_ID });
  assert.equal(rejected.status, "rejected");
  assert.equal(rejected.output_path, null);
  assert.equal(rejected.failure.type, "policy_error");
});

test("validation failure job becomes failed and has no promoted output", async () => {
  const proof = await harness();
  const failed = await proof.submitAndRun(request("edit_paragraph", "validation-failure", { constraints: { force_validation_failure: true } }));
  assert.equal(failed.status, "failed");
  assert.equal(failed.output_path, null);
  assert.equal(failed.failure.type, "validation_error");
});

test("final status snapshot contains terminal response path", async () => {
  const proof = await harness();
  const completed = await proof.submitAndRun(request("create_document"));
  const finalSnapshot = await proof.status(completed.job_id, "final");
  assert.equal(finalSnapshot.status, "completed");
  assert.equal(finalSnapshot.response_path, completed.response_path);
});

test("job events contain valid state transitions", async () => {
  const proof = await harness();
  const completed = await proof.submitAndRun(request("create_document"));
  const events = await listLocalJobEvents(completed.job_id, { workspace: WORKSPACE });
  assert.deepEqual(events.map((event) => [event.from_status, event.to_status]), [
    [null, "pending"],
    ["pending", "running"],
    ["running", "completed"],
  ]);
});

test("real COM and stage selection flags remain false", async () => {
  const proof = await harness();
  const completed = await proof.submitAndRun(request("create_document"));
  assert.equal(completed.real_com_executed, false);
  assert.equal(completed.final_core_selection_declared, false);
  assert.equal(completed.stage_2_transition_declared, false);
});

test("runAllProofs writes six jobs and polling proof summary", async () => {
  const proof = await harness();
  const summary = await proof.runAllProofs();
  assert.equal(summary.task_id, TASK_ID);
  assert.equal(summary.completion_candidate, true);
  assert.equal(summary.completed_count, 4);
  assert.equal(summary.rejected_count, 1);
  assert.equal(summary.failed_count, 1);
  assert.equal(summary.jobs.length, 6);
  assert.equal(existsSync(localJobBoundaryPaths.tests.summary), true);
  for (const job of summary.jobs) {
    assert.equal(existsSync(localJobBoundaryPaths.jobRecord(job.job_id)), true);
    assert.equal(existsSync(localJobBoundaryPaths.jobEvents(job.job_id)), true);
  }
});

test("completed previous task artifacts remain read-only references", async () => {
  const proof = await harness();
  const summary = await proof.runAllProofs();
  assert.equal(summary.completed_artifacts_modified, false);
  for (const root of COMPLETED_REFERENCE_ROOTS) {
    assert.equal(summary.read_only_reference_roots.includes(root), true);
  }
});

test("job record can be read from filesystem", async () => {
  const proof = await harness();
  const completed = await proof.submitAndRun(request("create_document"));
  const persisted = await readLocalJobJson(localJobBoundaryPaths.jobRecord(completed.job_id));
  assert.equal(persisted.job_id, completed.job_id);
  assert.equal(persisted.status, "completed");
});

test("Task 011 introduces no server daemon install or future runtime work", async () => {
  const moduleText = await readFile("tools/hancom/hwpcoreadapter/LocalJobBoundaryProof.mjs", "utf8");
  assert.doesNotMatch(moduleText, /pip install|npm install|HWPFrame|Hwp\.exe|python[-_]?hwpx|pyhwpx|express|fastify|listen\(|fetch\(|setInterval|model gateway|skill runtime/iu);
});

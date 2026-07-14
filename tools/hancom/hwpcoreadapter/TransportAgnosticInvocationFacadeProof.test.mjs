import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createTransportAgnosticInvocationFacade,
  buildInvocationEnvelope,
  validateInvocationEnvelope,
  generateTransportAgnosticInvocationFacadeProofArtifacts,
  transportAgnosticInvocationFacadePaths,
} from "./TransportAgnosticInvocationFacadeProof.mjs";

const workspace = process.cwd();

async function readJson(path) {
  return JSON.parse(await readFile(resolve(workspace, path), "utf8"));
}

test("invocation envelope validation accepts metadata transport profiles and rejects unknown profile", () => {
  for (const transport_profile of ["local_function", "mock_http_like", "cli_like", "ui_like"]) {
    const envelope = buildInvocationEnvelope("get_status", { job_id: "job-proof" }, { transport_profile });
    const validation = validateInvocationEnvelope(envelope);
    assert.equal(validation.valid, true, transport_profile);
    assert.equal(envelope.real_http_server_started, false);
  }

  const invalid = buildInvocationEnvelope("get_status", { job_id: "job-proof" }, { transport_profile: "real_http" });
  const validation = validateInvocationEnvelope(invalid);
  assert.equal(validation.valid, false);
  assert.equal(validation.errors.includes("unknown_transport_profile:real_http"), true);
});

test("facade invokes submit run status result and events through local route facade and client interpreter", async () => {
  const facade = await createTransportAgnosticInvocationFacade({ workspace });
  const submitted = await facade.invoke(buildInvocationEnvelope("submit_document_job", { content: { text: "Task 017 invocation" } }));
  assert.equal(submitted.status, "accepted");
  assert.equal(submitted.should_poll, true);
  assert.equal(submitted.real_http_server_started, false);

  const jobId = submitted.client_result.job_id;
  const pending = await facade.invoke(buildInvocationEnvelope("get_status", { job_id: jobId }));
  assert.equal(pending.status, "pending");
  assert.equal(pending.should_poll, true);

  const run = await facade.invoke(buildInvocationEnvelope("run_job", { job_id: jobId }));
  assert.equal(run.status, "completed");
  assert.equal(run.terminal, true);

  const result = await facade.invoke(buildInvocationEnvelope("get_result", { job_id: jobId }));
  assert.equal(result.status, "completed");
  assert.equal(result.can_open_output, true);
  assert.equal(result.artifact_availability.output_path_available, true);

  const events = await facade.invoke(buildInvocationEnvelope("list_events", { job_id: jobId }, { transport_profile: "cli_like" }));
  assert.equal(events.status, "completed");
  assert.equal(events.transport_profile, "cli_like");
});

test("facade returns controlled validation results for invalid profile route and missing job_id", async () => {
  const facade = await createTransportAgnosticInvocationFacade({ workspace });
  const invalidProfile = await facade.invoke(buildInvocationEnvelope("get_status", { job_id: "job-proof" }, { transport_profile: "real_http" }));
  assert.equal(invalidProfile.status, "validation_error");
  assert.equal(invalidProfile.user_visible_state, "request_fix_required");
  assert.equal(invalidProfile.error_code, "invalid_request");

  const invalidRoute = await facade.invoke(buildInvocationEnvelope("unknown_route", {}));
  assert.equal(invalidRoute.status, "validation_error");
  assert.equal(invalidRoute.terminal, true);

  const missingJobId = await facade.invoke(buildInvocationEnvelope("get_result", {}));
  assert.equal(missingJobId.status, "validation_error");
  assert.equal(missingJobId.error_code, "invalid_request");
});

test("generated Task 017 artifacts prove transport agnostic invocation facade boundary", async () => {
  const summary = await generateTransportAgnosticInvocationFacadeProofArtifacts({ workspace });
  assert.equal(summary.task_id, "transport-agnostic-invocation-facade-proof-017");
  assert.equal(summary.completion_candidate, true);
  assert.equal(summary.proof_case_count >= 28, true);
  assert.equal(summary.proof_cases_passed, summary.proof_case_count);
  assert.equal(summary.transport_profiles_metadata_only, true);
  assert.equal(summary.real_http_server_started, false);
  assert.equal(summary.web_server_dependency_introduced, false);
  assert.equal(summary.ui_implemented, false);
  assert.equal(summary.final_core_selection_declared, false);
  assert.equal(summary.stage_2_transition_declared, false);
  assert.equal(summary.previous_tasks_read_only, true);

  const completed = await readJson(transportAgnosticInvocationFacadePaths.invocationResults.getResultCompleted);
  assert.equal(completed.can_open_output, true);
  assert.equal(completed.final_core_selection_declared, false);
  assert.equal(completed.stage_2_transition_declared, false);
  await stat(resolve(workspace, transportAgnosticInvocationFacadePaths.tests.summary));
});

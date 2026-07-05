import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createLocalRouteRequestBuilder,
  createRouteResponseInterpreter,
  generateLocalClientBoundaryProofArtifacts,
  localClientBoundaryPaths,
} from "./LocalClientBoundaryProof.mjs";
import { LOCAL_ROUTE_MANIFEST_VERSION, validateLocalRouteManifest } from "./LocalRouteManifestProof.mjs";

const workspace = process.cwd();

async function readJson(path) {
  return JSON.parse(await readFile(resolve(workspace, path), "utf8"));
}

test("request builder consumes Task 015 manifest and builds all six route requests", async () => {
  const builder = await createLocalRouteRequestBuilder({ workspace });
  assert.equal(builder.manifest.manifest_version, LOCAL_ROUTE_MANIFEST_VERSION);

  const requests = [
    builder.buildSubmitDocumentJobRequest({ content: { text: "Task 016 submit" } }),
    builder.buildRunJobRequest("job-client-016"),
    builder.buildGetJobRequest("job-client-016"),
    builder.buildGetStatusRequest("job-client-016"),
    builder.buildGetResultRequest("job-client-016"),
    builder.buildListEventsRequest("job-client-016"),
  ];

  assert.deepEqual(requests.map((request) => request.route_id), [
    "submit_document_job",
    "run_job",
    "get_job",
    "get_status",
    "get_result",
    "list_events",
  ]);
  assert.equal(requests[0].mock_method, "POST");
  assert.equal(requests[1].mock_path, "/mock/jobs/job-client-016/run");
  assert.equal(requests[5].service_operation, "listEvents");
});

test("request builder rejects unknown routes and missing required job_id with controlled validation errors", async () => {
  const builder = await createLocalRouteRequestBuilder({ workspace });
  assert.throws(
    () => builder.buildRouteRequest("unknown_route", {}),
    (error) => error.code === "invalid_request" && error.status === "validation_error",
  );
  assert.throws(
    () => builder.buildGetResultRequest(""),
    (error) => error.code === "invalid_request" && error.message.includes("job_id"),
  );
});

test("response interpreter normalizes terminal, polling, missing, request-fix, and failed states", async () => {
  const interpreter = createRouteResponseInterpreter({ workspace });
  const fixtures = {
    completed: await readJson("release/test-documents/local-route-manifest-proof-015/route-responses/get-result-response.json"),
    pending: await readJson("release/test-documents/local-route-manifest-proof-015/route-responses/get-status-response.json"),
    notReady: await readJson("release/test-documents/local-route-manifest-proof-015/route-responses/not-ready-result-response.json"),
    notFound: await readJson("release/test-documents/local-route-manifest-proof-015/route-responses/unknown-job-response.json"),
    validation: await readJson("release/test-documents/local-route-manifest-proof-015/route-responses/invalid-route-response.json"),
    failed: await readJson("release/test-documents/local-route-manifest-proof-015/route-responses/validation-failure-response.json"),
  };

  const completed = interpreter.interpretRouteResponse(fixtures.completed);
  assert.equal(completed.terminal, true);
  assert.equal(completed.should_poll, false);
  assert.equal(completed.can_open_output, true);
  assert.equal(completed.artifact_availability.output_path_available, true);

  const pending = interpreter.interpretRouteResponse(fixtures.pending);
  assert.equal(pending.user_visible_state, "in_progress");
  assert.equal(pending.should_poll, true);
  assert.equal(pending.retryable, true);

  const notReady = interpreter.interpretRouteResponse(fixtures.notReady);
  assert.equal(notReady.user_visible_state, "in_progress");
  assert.equal(notReady.should_poll, true);
  assert.equal(notReady.retryable, true);

  const notFound = interpreter.interpretRouteResponse(fixtures.notFound);
  assert.equal(notFound.user_visible_state, "missing");
  assert.equal(notFound.terminal, true);

  const validation = interpreter.interpretRouteResponse(fixtures.validation);
  assert.equal(validation.user_visible_state, "request_fix_required");
  assert.equal(validation.retryable, false);

  const failed = interpreter.interpretRouteResponse(fixtures.failed);
  assert.equal(failed.user_visible_state, "failed");
  assert.equal(failed.terminal, true);
  assert.equal(failed.error_code, "validation_error");
});

test("generated Task 016 artifacts prove local client boundary without starting HTTP or declaring Stage 2", async () => {
  const summary = await generateLocalClientBoundaryProofArtifacts({ workspace });
  assert.equal(summary.task_id, "local-client-boundary-proof-016");
  assert.equal(summary.completion_candidate, true);
  assert.equal(summary.proof_case_count >= 22, true);
  assert.equal(summary.proof_cases_passed, summary.proof_case_count);
  assert.equal(summary.real_http_server_started, false);
  assert.equal(summary.web_server_dependency_introduced, false);
  assert.equal(summary.ui_implemented, false);
  assert.equal(summary.final_core_selection_declared, false);
  assert.equal(summary.stage_2_transition_declared, false);
  assert.equal(summary.previous_tasks_read_only, true);

  const manifest = await readJson("release/test-documents/local-route-manifest-proof-015/manifest/local-route-manifest.json");
  assert.equal(validateLocalRouteManifest(manifest).valid, true);

  const clientResult = await readJson(localClientBoundaryPaths.clientResults.getResultCompleted);
  assert.equal(clientResult.can_open_output, true);
  assert.equal(clientResult.final_core_selection_declared, false);
  assert.equal(clientResult.stage_2_transition_declared, false);
  await stat(resolve(workspace, localClientBoundaryPaths.tests.summary));
});

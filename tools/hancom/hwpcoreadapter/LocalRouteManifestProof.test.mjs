import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  ERROR_CODES,
  RESPONSE_STATUSES,
  SERVICE_OPERATIONS,
  getServiceContractVersion,
} from "./ServiceContractSchema.mjs";
import { validateRouteContract } from "./InProcessRouteFacadeProof.mjs";
import {
  LOCAL_ROUTE_MANIFEST_VERSION,
  generateLocalRouteManifestProofArtifacts,
  getLocalRouteManifest,
  localRouteManifestPaths,
  validateLocalRouteFixture,
  validateLocalRouteManifest,
  validateRouteFixtureSet,
} from "./LocalRouteManifestProof.mjs";

const WORKSPACE = process.cwd();
const TASK_ID = "local-route-manifest-proof-015";
const TASK012_SUMMARY = "release/test-documents/service-adapter-boundary-proof-012/tests/service-adapter-summary.json";
const TASK013_SUMMARY = "release/test-documents/service-contract-schema-error-taxonomy-013/tests/service-contract-summary.json";
const TASK014_SUMMARY = "release/test-documents/inprocess-route-facade-proof-014/tests/route-facade-summary.json";

test("manifest validation passes with six stable route entries", () => {
  const manifest = getLocalRouteManifest();
  const validation = validateLocalRouteManifest(manifest);
  assert.equal(validation.valid, true);
  assert.equal(manifest.manifest_version, LOCAL_ROUTE_MANIFEST_VERSION);
  assert.equal(manifest.task_id, TASK_ID);
  assert.equal(manifest.contract_version, getServiceContractVersion());
  assert.equal(manifest.routes.length, 6);
  assert.deepEqual(manifest.routes.map((route) => route.route_id), [
    "submit_document_job",
    "run_job",
    "get_job",
    "get_status",
    "get_result",
    "list_events",
  ]);
});

test("manifest routes use Task 013 operations statuses and error taxonomy", () => {
  const manifest = getLocalRouteManifest();
  for (const route of manifest.routes) {
    assert.equal(SERVICE_OPERATIONS.includes(route.service_operation), true);
    for (const status of route.expected_statuses) assert.equal(RESPONSE_STATUSES.includes(status), true);
  }
  for (const code of Object.keys(manifest.error_taxonomy_reference.codes)) {
    assert.equal(ERROR_CODES.includes(code), true);
  }
});

test("route request and response fixtures match the manifest", async () => {
  const summary = await generateLocalRouteManifestProofArtifacts({ workspace: WORKSPACE });
  assert.equal(summary.completion_candidate, true);
  const fixtureValidation = await validateRouteFixtureSet({ workspace: WORKSPACE });
  assert.equal(fixtureValidation.valid, true);
  assert.equal(fixtureValidation.request_fixture_count, 10);
  assert.equal(fixtureValidation.response_fixture_count, 10);
});

test("each primary route fixture matches its manifest entry", async () => {
  await generateLocalRouteManifestProofArtifacts({ workspace: WORKSPACE });
  const pairs = [
    ["submit_document_job", localRouteManifestPaths.routeRequests.submitDocumentJob, localRouteManifestPaths.routeResponses.submitDocumentJob],
    ["run_job", localRouteManifestPaths.routeRequests.runJob, localRouteManifestPaths.routeResponses.runJob],
    ["get_job", localRouteManifestPaths.routeRequests.getJob, localRouteManifestPaths.routeResponses.getJob],
    ["get_status", localRouteManifestPaths.routeRequests.getStatus, localRouteManifestPaths.routeResponses.getStatus],
    ["get_result", localRouteManifestPaths.routeRequests.getResult, localRouteManifestPaths.routeResponses.getResult],
    ["list_events", localRouteManifestPaths.routeRequests.listEvents, localRouteManifestPaths.routeResponses.listEvents],
  ];
  for (const [routeId, requestPath, responsePath] of pairs) {
    const validation = await validateLocalRouteFixture({ workspace: WORKSPACE, routeId, requestPath, responsePath });
    assert.equal(validation.valid, true, `${routeId}: ${validation.errors.join(",")}`);
  }
});

test("all response fixtures validate against Task 014 route contract", async () => {
  await generateLocalRouteManifestProofArtifacts({ workspace: WORKSPACE });
  for (const responsePath of Object.values(localRouteManifestPaths.routeResponses)) {
    const response = JSON.parse(await readFile(responsePath, "utf8"));
    const validation = validateRouteContract(response);
    assert.equal(validation.valid, true, `${responsePath}: ${validation.errors.join(",")}`);
  }
});

test("status mapping and error handling validate required edge cases", async () => {
  await generateLocalRouteManifestProofArtifacts({ workspace: WORKSPACE });
  const notReady = JSON.parse(await readFile(localRouteManifestPaths.routeResponses.notReadyResult, "utf8"));
  const notFound = JSON.parse(await readFile(localRouteManifestPaths.routeResponses.unknownJob, "utf8"));
  const validationError = JSON.parse(await readFile(localRouteManifestPaths.routeResponses.invalidRoute, "utf8"));
  assert.equal(notReady.status, "not_ready");
  assert.equal(notReady.http_like_status, 409);
  assert.equal(notFound.status, "not_found");
  assert.equal(notFound.http_like_status, 404);
  assert.equal(validationError.status, "validation_error");
  assert.equal(validationError.http_like_status, 422);
});

test("previous task summaries remain read-only and no runtime escalation is declared", async () => {
  const before = {
    task012: await readFile(TASK012_SUMMARY, "utf8"),
    task013: await readFile(TASK013_SUMMARY, "utf8"),
    task014: await readFile(TASK014_SUMMARY, "utf8"),
  };
  const summary = await generateLocalRouteManifestProofArtifacts({ workspace: WORKSPACE });
  const after = {
    task012: await readFile(TASK012_SUMMARY, "utf8"),
    task013: await readFile(TASK013_SUMMARY, "utf8"),
    task014: await readFile(TASK014_SUMMARY, "utf8"),
  };
  assert.deepEqual(after, before);
  assert.equal(summary.previous_tasks_read_only, true);
  assert.equal(summary.real_http_server_started, false);
  assert.equal(summary.web_server_dependency_introduced, false);
  assert.equal(summary.ui_implemented, false);
  assert.equal(summary.real_com_executed, false);
  assert.equal(summary.python_hwpx_dependency_introduced, false);
  assert.equal(summary.final_core_selection_declared, false);
  assert.equal(summary.stage_2_transition_declared, false);
  assert.equal(summary.proof_case_count, 20);
  assert.equal(summary.proof_cases_passed, 20);
});

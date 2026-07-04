import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import {
  HwpCoreAdapter,
  EditorBackendStub,
  SurgicalPatcherBackendStub,
  ValidatorBackendStub,
  LayoutAuthorityBackendStub,
  routeIntentToBackendRole,
  TASK_003_READ_ONLY_REFERENCE_PATHS,
  TASK_004_BOUNDARY_MODEL,
} from "./HwpCoreAdapter.mjs";

async function makeAdapter(options = {}) {
  const root = await mkdtemp(join(tmpdir(), "hwpcoreadapter-contract-"));
  const inputPath = join(root, "input.hwpx");
  const outputPath = join(root, "output.hwpx");
  const evidenceDir = join(root, "evidence");
  await import("node:fs/promises").then(({ writeFile }) => writeFile(inputPath, "input fixture"));
  const adapter = new HwpCoreAdapter({
    evidenceDir,
    backends: {
      editor: options.editor ?? new EditorBackendStub(),
      surgical_patcher: options.surgical_patcher ?? new SurgicalPatcherBackendStub(),
      validator: options.validator ?? new ValidatorBackendStub(),
      layout_authority: options.layout_authority ?? new LayoutAuthorityBackendStub(),
    },
  });
  return { adapter, root, inputPath, outputPath, evidenceDir };
}

function operation(overrides = {}) {
  return {
    operation_id: "op-001",
    task_id: "hwpcoreadapter-boundary-validation-005",
    input_path: overrides.input_path ?? "input.hwpx",
    output_path: overrides.output_path ?? "output.hwpx",
    intent: overrides.intent ?? "create_document",
    backend_role: overrides.backend_role,
    options: overrides.options ?? {},
  };
}

async function readEvidence(result) {
  assert.ok(result.evidence_path, "result should include evidence_path");
  return JSON.parse(await readFile(result.evidence_path, "utf8"));
}

test("editor intents route to editor backend", () => {
  for (const intent of ["create_document", "edit_paragraph", "edit_table", "apply_style"]) {
    assert.equal(routeIntentToBackendRole(intent), "editor");
  }
});

test("surgical patch intents route to surgical_patcher backend", () => {
  for (const intent of ["patch_xml_preserve", "replace_token_preserve", "preserve_relationships"]) {
    assert.equal(routeIntentToBackendRole(intent), "surgical_patcher");
  }
});

test("validator intents route to validator backend", () => {
  for (const intent of ["validate_structure", "validate_schema", "validate_evidence"]) {
    assert.equal(routeIntentToBackendRole(intent), "validator");
  }
});

test("layout authority intents route to layout_authority backend", () => {
  for (const intent of ["native_open_save", "native_layout_check", "native_render_check"]) {
    assert.equal(routeIntentToBackendRole(intent), "layout_authority");
  }
});

test("unknown intent fails with policy_error", async () => {
  const { adapter, inputPath, outputPath } = await makeAdapter();
  const result = await adapter.executeOperation(operation({ input_path: inputPath, output_path: outputPath, intent: "unknown_intent" }));
  assert.equal(result.success, false);
  assert.equal(result.promoted, false);
  assert.equal(result.failure.type, "policy_error");
});

test("input_path equal to output_path fails with policy_error", async () => {
  const { adapter, inputPath } = await makeAdapter();
  const result = await adapter.executeOperation(operation({ input_path: inputPath, output_path: inputPath }));
  assert.equal(result.success, false);
  assert.equal(result.promoted, false);
  assert.equal(result.failure.type, "policy_error");
});

test("missing input fails before backend execution", async () => {
  const backend = new EditorBackendStub();
  const { adapter, root, outputPath } = await makeAdapter({ editor: backend });
  const result = await adapter.executeOperation(operation({ input_path: join(root, "missing.hwpx"), output_path: outputPath }));
  assert.equal(result.success, false);
  assert.equal(result.promoted, false);
  assert.equal(result.failure.type, "input_error");
  assert.equal(backend.calls.length, 0);
});

test("backend failure keeps promoted false", async () => {
  const { adapter, inputPath, outputPath } = await makeAdapter({ editor: new EditorBackendStub({ mode: "backend_failure" }) });
  const result = await adapter.executeOperation(operation({ input_path: inputPath, output_path: outputPath }));
  assert.equal(result.success, false);
  assert.equal(result.promoted, false);
  assert.equal(result.failure.type, "backend_error");
  assert.equal(existsSync(outputPath), false);
});

test("validation failure keeps promoted false", async () => {
  const { adapter, inputPath, outputPath } = await makeAdapter({ editor: new EditorBackendStub({ mode: "validation_failure" }) });
  const result = await adapter.executeOperation(operation({ input_path: inputPath, output_path: outputPath }));
  assert.equal(result.success, false);
  assert.equal(result.promoted, false);
  assert.equal(result.validation.valid, false);
  assert.equal(result.failure.type, "validation_error");
  assert.equal(existsSync(outputPath), false);
});

test("success with valid validation is promoted", async () => {
  const { adapter, inputPath, outputPath } = await makeAdapter();
  const result = await adapter.executeOperation(operation({ input_path: inputPath, output_path: outputPath }));
  assert.equal(result.success, true);
  assert.equal(result.promoted, true);
  assert.equal(result.validation.valid, true);
  assert.equal(existsSync(outputPath), true);
  assert.ok((await stat(outputPath)).size > 0);
});

test("failure result includes failure type and last_successful_step", async () => {
  const { adapter, inputPath, outputPath } = await makeAdapter({ editor: new EditorBackendStub({ mode: "backend_failure" }) });
  const result = await adapter.executeOperation(operation({ input_path: inputPath, output_path: outputPath }));
  assert.equal(result.failure.type, "backend_error");
  assert.equal(typeof result.failure.last_successful_step, "string");
  assert.ok(result.failure.last_successful_step.length > 0);
});

test("every execution writes an evidence record", async () => {
  const { adapter, inputPath, outputPath } = await makeAdapter();
  const result = await adapter.executeOperation(operation({ input_path: inputPath, output_path: outputPath }));
  const evidence = await readEvidence(result);
  assert.equal(evidence.operation_id, "op-001");
  assert.equal(evidence.backend_role, "editor");
  assert.equal(evidence.backend_id, "EditorBackendStub");
  assert.ok(evidence.started_at);
  assert.ok(evidence.ended_at);
  assert.equal(evidence.input_probe.exists, true);
  assert.equal(evidence.input_probe.hash_algorithm, "sha256");
  assert.equal(evidence.output_probe.exists, true);
  assert.match(evidence.output_probe.sha256, /^[a-f0-9]{64}$/u);
  assert.equal(evidence.validation.valid, true);
});

test("layout authority stub does not execute real Hancom COM", async () => {
  const layout = new LayoutAuthorityBackendStub();
  const { adapter, inputPath, outputPath } = await makeAdapter({ layout_authority: layout });
  const result = await adapter.executeOperation(operation({ input_path: inputPath, output_path: outputPath, intent: "native_open_save" }));
  assert.equal(result.backend_role, "layout_authority");
  assert.equal(result.backend_id, "LayoutAuthorityBackendStub");
  assert.equal(layout.realComExecuted, false);
});

test("Task 003 evidence paths are declared read-only references", () => {
  assert.ok(TASK_003_READ_ONLY_REFERENCE_PATHS.includes("release/test-documents/hwpx-core-benchmark-003-evidence-integrity/tests/post-d2-scenario-gates-v6.result.txt"));
  assert.ok(TASK_003_READ_ONLY_REFERENCE_PATHS.includes("release/test-documents/hwpx-core-benchmark-003-evidence-integrity/tests/gate-d2-final-mapped-json-validation-v6.result.txt"));
  assert.ok(TASK_003_READ_ONLY_REFERENCE_PATHS.includes("release/test-documents/hwpx-core-benchmark-003-evidence-integrity/tests/cross-artifact-consistency-v6.result.txt"));
});

test("Task 004 boundary model and routing enums stay aligned", () => {
  assert.deepEqual(TASK_004_BOUNDARY_MODEL.backend_roles, ["editor", "surgical_patcher", "validator", "layout_authority"]);
  assert.equal(TASK_004_BOUNDARY_MODEL.routing.create_document, "editor");
  assert.equal(TASK_004_BOUNDARY_MODEL.routing.patch_xml_preserve, "surgical_patcher");
  assert.equal(TASK_004_BOUNDARY_MODEL.routing.validate_evidence, "validator");
  assert.equal(TASK_004_BOUNDARY_MODEL.routing.native_render_check, "layout_authority");
});

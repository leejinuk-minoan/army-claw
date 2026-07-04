import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { HwpCoreAdapter } from "./HwpCoreAdapter.mjs";
import {
  createNodeXmlThinInterimEditorAdapter,
  createNodeXmlThinInterimEditorHarness,
  interimAdapterPaths,
  readInterimEvidence,
  validateInterimHwpxStructure,
} from "./NodeXmlThinInterimEditorAdapter.mjs";

const WORKSPACE = process.cwd();
const TASK_ID = "node-xml-thin-interim-adapter-integration-008";
const COMPLETED_REFERENCE_ROOTS = [
  "release/test-documents/hwpx-core-benchmark-003-evidence-integrity",
  "release/test-documents/hwpcoreadapter-backend-proof-006",
  "release/test-documents/editor-backend-candidate-comparison-007",
];

async function resetRoot() {
  await rm(interimAdapterPaths.root, { recursive: true, force: true });
  await mkdir(interimAdapterPaths.root, { recursive: true });
}

async function harness() {
  await resetRoot();
  return createNodeXmlThinInterimEditorHarness({ workspace: WORKSPACE });
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

test("create_document routes to Node XML thin interim editor and produces HWPX output", async () => {
  const proof = await harness();
  const result = await proof.runCreateDocument();
  assert.equal(result.promoted, true);
  assert.equal(result.backend_id, "NodeXmlThinInterimEditorAdapter");
  assert.equal(result.backend_role, "editor");
  assert.equal(existsSync(interimAdapterPaths.outputs.createDocument), true);
  const validation = await validateInterimHwpxStructure(interimAdapterPaths.outputs.createDocument);
  assert.equal(validation.valid, true);
  assert.match(validation.sectionXml, /Army Claw Task 008 created document/u);
});

test("edit_paragraph produces HWPX output and evidence", async () => {
  const proof = await harness();
  const result = await proof.runEditParagraph();
  assert.equal(result.promoted, true);
  const validation = await validateInterimHwpxStructure(interimAdapterPaths.outputs.editParagraph);
  assert.equal(validation.valid, true);
  assert.match(validation.sectionXml, /Task 008 paragraph edit/u);
  const evidence = await readInterimEvidence(interimAdapterPaths.evidence.editParagraph);
  assert.equal(evidence.operation_id, "edit-paragraph");
  assert.equal(evidence.changed_target_entry, "Contents/section0.xml");
});

test("edit_table produces HWPX output and evidence", async () => {
  const proof = await harness();
  const result = await proof.runEditTable();
  assert.equal(result.promoted, true);
  const validation = await validateInterimHwpxStructure(interimAdapterPaths.outputs.editTable);
  assert.equal(validation.valid, true);
  assert.match(validation.sectionXml, /<hp:tbl\b/u);
  const evidence = await readInterimEvidence(interimAdapterPaths.evidence.editTable);
  assert.equal(evidence.operation_id, "edit-table");
});

test("apply_style produces HWPX output and evidence", async () => {
  const proof = await harness();
  const result = await proof.runApplyStyle();
  assert.equal(result.promoted, true);
  const validation = await validateInterimHwpxStructure(interimAdapterPaths.outputs.applyStyle);
  assert.equal(validation.valid, true);
  assert.match(validation.sectionXml, /Task 008 style application/u);
  const evidence = await readInterimEvidence(interimAdapterPaths.evidence.applyStyle);
  assert.equal(evidence.validation.valid, true);
});

test("output files have size and SHA256", async () => {
  const proof = await harness();
  await proof.runAllProofs();
  const summary = await readJson(interimAdapterPaths.tests.summary);
  for (const output of summary.outputs) {
    assert.equal(output.exists, true);
    assert.equal(typeof output.size, "number");
    assert.ok(output.size > 0);
    assert.match(output.sha256, /^[a-f0-9]{64}$/u);
  }
});

test("evidence records backend id role operation probes validation and promoted", async () => {
  const proof = await harness();
  await proof.runAllProofs();
  for (const evidencePath of [
    interimAdapterPaths.evidence.createDocument,
    interimAdapterPaths.evidence.editParagraph,
    interimAdapterPaths.evidence.editTable,
    interimAdapterPaths.evidence.applyStyle,
  ]) {
    const evidence = await readInterimEvidence(evidencePath);
    assert.equal(evidence.task_id, TASK_ID);
    assert.equal(evidence.backend_id, "NodeXmlThinInterimEditorAdapter");
    assert.equal(evidence.backend_role, "editor");
    assert.ok(evidence.operation_id);
    assert.equal(evidence.input_probe.exists, true);
    assert.equal(evidence.output_probe.exists, true);
    assert.equal(evidence.validation.valid, true);
    assert.equal(evidence.promoted, true);
  }
});

test("validation failure prevents promotion", async () => {
  const proof = await harness();
  const result = await proof.runValidationFailureProof();
  assert.equal(result.promoted, false);
  assert.equal(result.failure.type, "validation_error");
  assert.equal(existsSync(interimAdapterPaths.outputs.validationFailure), false);
  const evidence = await readInterimEvidence(interimAdapterPaths.evidence.validationFailure);
  assert.equal(evidence.promoted, false);
  assert.equal(evidence.validation.valid, false);
});

test("input_path equal to output_path is rejected by HwpCoreAdapter policy", async () => {
  const proof = await harness();
  const source = await proof.ensureFixture();
  const adapter = new HwpCoreAdapter({
    backends: { editor: createNodeXmlThinInterimEditorAdapter() },
    evidenceDir: join(interimAdapterPaths.root, "policy-evidence"),
  });
  const result = await adapter.executeOperation({
    task_id: TASK_ID,
    operation_id: "same-path-policy",
    intent: "edit_paragraph",
    input_path: source,
    output_path: source,
    options: { text: "must not write" },
  });
  assert.equal(result.promoted, false);
  assert.equal(result.failure.type, "policy_error");
});

test("no python-hwpx install or import dependency is introduced", async () => {
  const moduleText = await readFile("tools/hancom/hwpcoreadapter/NodeXmlThinInterimEditorAdapter.mjs", "utf8");
  assert.doesNotMatch(moduleText, /python[-_]?hwpx|pyhwpx|pip install|npm install/iu);
});

test("no real Hancom COM execution and no final core selection is declared", async () => {
  const proof = await harness();
  await proof.runAllProofs();
  const summary = await readJson(interimAdapterPaths.tests.summary);
  assert.equal(summary.real_com_executed, false);
  assert.equal(summary.final_core_selection_declared, false);
  assert.equal(summary.stage_2_transition_declared, false);
});

test("completed Task 003 004 005 006 007 artifacts are read-only references", async () => {
  const proof = await harness();
  await proof.runAllProofs();
  const summary = await readJson(interimAdapterPaths.tests.summary);
  for (const root of COMPLETED_REFERENCE_ROOTS) {
    assert.equal(summary.read_only_reference_roots.includes(root), true);
  }
  assert.equal(summary.completed_artifacts_modified, false);
});

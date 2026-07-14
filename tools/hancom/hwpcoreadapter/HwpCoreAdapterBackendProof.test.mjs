import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  createBackendProofHarness,
  proofPaths,
  readProofEvidence,
  validateHwpxStructure,
  zipEntryHashes,
} from "./HwpCoreAdapterBackendProof.mjs";

const WORKSPACE = process.cwd();
const TASK_003_REFERENCE = "release/test-documents/hwpx-core-benchmark-003-evidence-integrity/external-artifacts/task003-v6/native-hwpx/hancom-open-save-output.hwpx";

async function resetProofRoot() {
  await rm(proofPaths.root, { recursive: true, force: true });
  await mkdir(proofPaths.root, { recursive: true });
}

async function harness() {
  await resetProofRoot();
  return createBackendProofHarness({ workspace: WORKSPACE });
}

test("editor paragraph proof produces HWPX output and evidence", async () => {
  const proof = await harness();
  const result = await proof.runEditorProof("paragraph");
  assert.equal(result.promoted, true);
  assert.equal(result.backend_id, "EditorThinHwpxBackendProof");
  assert.equal(existsSync(proofPaths.outputs.editorParagraph), true);
  const validation = await validateHwpxStructure(proofPaths.outputs.editorParagraph);
  assert.equal(validation.valid, true);
  assert.match(validation.sectionXml, /Army Claw Task 006 paragraph proof/u);
  const evidence = await readProofEvidence(proofPaths.evidence.editorParagraph);
  assert.equal(evidence.backend_id, "EditorThinHwpxBackendProof");
  assert.equal(evidence.promoted, true);
  assert.equal(evidence.changed_target_entry, "Contents/section0.xml");
});

test("editor table proof produces HWPX output and evidence", async () => {
  const proof = await harness();
  const result = await proof.runEditorProof("table");
  assert.equal(result.promoted, true);
  const validation = await validateHwpxStructure(proofPaths.outputs.editorTable);
  assert.equal(validation.valid, true);
  assert.match(validation.sectionXml, /<hp:tbl\b/u);
  const evidence = await readProofEvidence(proofPaths.evidence.editorTable);
  assert.equal(evidence.output.path.endsWith("editor-table-output.hwpx"), true);
});

test("editor style proof produces HWPX output and evidence", async () => {
  const proof = await harness();
  const result = await proof.runEditorProof("style");
  assert.equal(result.promoted, true);
  const validation = await validateHwpxStructure(proofPaths.outputs.editorStyle);
  assert.equal(validation.valid, true);
  assert.match(validation.sectionXml, /Army Claw Task 006 style proof/u);
  const evidence = await readProofEvidence(proofPaths.evidence.editorStyle);
  assert.equal(evidence.validation.valid, true);
});

test("surgical proof changes target entry only", async () => {
  const proof = await harness();
  await proof.runSurgicalProof();
  const evidence = await readProofEvidence(proofPaths.evidence.surgical);
  assert.equal(evidence.changed_target_entry, "Contents/section0.xml");
  assert.deepEqual(evidence.changed_entries, ["Contents/section0.xml"]);
  assert.equal(evidence.non_target_preserved, true);
});

test("surgical proof records non-target preservation hash map", async () => {
  const proof = await harness();
  await proof.runSurgicalProof();
  const evidence = await readProofEvidence(proofPaths.evidence.surgical);
  assert.ok(Object.keys(evidence.non_target_hash_map.before).length > 0);
  assert.deepEqual(evidence.non_target_hash_map.before, evidence.non_target_hash_map.after);
  assert.ok(evidence.relationship_bindata_preservation.checked_entries.length >= 0);
});

test("surgical preservation failure does not promote output", async () => {
  const proof = await harness();
  const result = await proof.runSurgicalProof({ forcePreservationFailure: true });
  assert.equal(result.promoted, false);
  assert.equal(result.failure.type, "preservation_error");
  assert.equal(existsSync(proofPaths.outputs.surgicalPatch), false);
  const evidence = await readProofEvidence(proofPaths.evidence.surgicalFailure);
  assert.equal(evidence.promoted, false);
});

test("validator accepts valid HWPX proof output", async () => {
  const proof = await harness();
  await proof.runEditorProof("paragraph");
  const result = await proof.runValidatorProof({ inputPath: proofPaths.outputs.editorParagraph });
  assert.equal(result.promoted, true);
  const evidence = await readProofEvidence(proofPaths.evidence.validator);
  assert.equal(evidence.validation.valid, true);
  assert.equal(evidence.validator_result.valid, true);
});

test("validator rejects broken non-HWPX input", async () => {
  const proof = await harness();
  await mkdir(proofPaths.fixtures, { recursive: true });
  const brokenPath = join(proofPaths.fixtures, "broken-not-hwpx.hwpx");
  await writeFile(brokenPath, "not a zip", "utf8");
  const result = await proof.runValidatorProof({ inputPath: brokenPath, evidencePath: proofPaths.evidence.validatorBroken });
  assert.equal(result.promoted, false);
  assert.equal(result.failure.type, "validation_error");
  const evidence = await readProofEvidence(proofPaths.evidence.validatorBroken);
  assert.equal(evidence.validation.valid, false);
});

test("validation failure prevents promotion", async () => {
  const proof = await harness();
  await proof.runEditorProof("paragraph");
  const result = await proof.runValidatorProof({ inputPath: proofPaths.outputs.editorParagraph, forceValidationFailure: true, evidencePath: proofPaths.evidence.validatorForcedFailure });
  assert.equal(result.promoted, false);
  assert.equal(result.failure.type, "validation_error");
  assert.equal(existsSync(proofPaths.outputs.validatorProof), false);
});

test("layout authority default proof does not execute real COM", async () => {
  const proof = await harness();
  const result = await proof.runLayoutAuthorityReferenceProof();
  assert.equal(result.promoted, true);
  assert.equal(result.backend_id, "LayoutAuthorityReferenceBackendProof");
  assert.equal(result.details.real_com_executed, false);
});

test("layout authority reference proof reads Task 003 native evidence path only", async () => {
  const proof = await harness();
  await proof.runLayoutAuthorityReferenceProof();
  const evidence = await readProofEvidence(proofPaths.evidence.layoutAuthority);
  assert.equal(evidence.task003_reference.path.replaceAll("\\", "/").endsWith(TASK_003_REFERENCE), true);
  assert.equal(evidence.task003_reference.exists, true);
  assert.equal(evidence.real_com_executed, false);
});

test("all proof evidence records include path size sha256 backend id and promoted", async () => {
  const proof = await harness();
  await proof.runEditorProof("paragraph");
  await proof.runEditorProof("table");
  await proof.runEditorProof("style");
  await proof.runSurgicalProof();
  await proof.runValidatorProof({ inputPath: proofPaths.outputs.editorParagraph });
  await proof.runLayoutAuthorityReferenceProof();
  for (const evidencePath of [
    proofPaths.evidence.editorParagraph,
    proofPaths.evidence.editorTable,
    proofPaths.evidence.editorStyle,
    proofPaths.evidence.surgical,
    proofPaths.evidence.validator,
    proofPaths.evidence.layoutAuthority,
  ]) {
    const evidence = await readProofEvidence(evidencePath);
    assert.ok(evidence.backend_id);
    assert.equal(typeof evidence.promoted, "boolean");
    assert.ok(evidence.output.path);
    assert.equal(typeof evidence.output.size, "number");
    assert.match(evidence.output.sha256, /^[a-f0-9]{64}$/u);
  }
});

test("Task 003 evidence path remains unchanged by proof run", async () => {
  const proof = await harness();
  const before = await zipEntryHashes(TASK_003_REFERENCE);
  await proof.runEditorProof("paragraph");
  await proof.runSurgicalProof();
  const after = await zipEntryHashes(TASK_003_REFERENCE);
  assert.deepEqual(after, before);
});

test("proof fixture is copied and source fixture is not overwritten", async () => {
  const proof = await harness();
  await proof.ensureFixture();
  const before = await readFile(proofPaths.fixturesSource);
  await proof.runEditorProof("style");
  const after = await readFile(proofPaths.fixturesSource);
  assert.equal(Buffer.compare(before, after), 0);
});

test("backend proof summary is generated", async () => {
  const proof = await harness();
  await proof.runAllProofs();
  const summary = JSON.parse(await readFile(proofPaths.tests.summary, "utf8"));
  assert.equal(summary.task_id, "hwpcoreadapter-backend-proof-006");
  assert.equal(summary.completion_candidate, true);
  assert.equal(summary.real_com_executed, false);
  assert.equal(summary.outputs.length >= 4, true);
  assert.equal(summary.expected_failures.length, 3);
  assert.equal(existsSync(proofPaths.evidence.surgicalFailure), true);
  assert.equal(existsSync(proofPaths.evidence.validatorBroken), true);
  assert.equal(existsSync(proofPaths.evidence.validatorForcedFailure), true);
});



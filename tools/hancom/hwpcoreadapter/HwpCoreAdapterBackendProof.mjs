import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { HwpCoreAdapter, createFileProbe } from "./HwpCoreAdapter.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TASK_ID = "hwpcoreadapter-backend-proof-006";
const SECTION_ENTRY = "Contents/section0.xml";
const SOURCE_FIXTURE = "release/test-documents/army-claw-qualification-review-template-fidelity-v5.hwpx";
const TASK_003_NATIVE_REFERENCE = "release/test-documents/hwpx-core-benchmark-003-evidence-integrity/external-artifacts/task003-v6/native-hwpx/hancom-open-save-output.hwpx";

function packageRequire() {
  const nodeModules = process.env.ARMY_CLAW_NODE_MODULES || resolve(__dirname, "..", "node_modules");
  return createRequire(pathToFileURL(join(nodeModules, ".army-claw-loader.cjs")));
}

function getJSZip() {
  return packageRequire()("jszip");
}

export const proofPaths = Object.freeze({
  root: "release/test-documents/hwpcoreadapter-backend-proof-006",
  fixtures: "release/test-documents/hwpcoreadapter-backend-proof-006/fixtures",
  fixturesSource: "release/test-documents/hwpcoreadapter-backend-proof-006/fixtures/source.hwpx",
  outputs: Object.freeze({
    editorParagraph: "release/test-documents/hwpcoreadapter-backend-proof-006/outputs/editor-paragraph-output.hwpx",
    editorTable: "release/test-documents/hwpcoreadapter-backend-proof-006/outputs/editor-table-output.hwpx",
    editorStyle: "release/test-documents/hwpcoreadapter-backend-proof-006/outputs/editor-style-output.hwpx",
    surgicalPatch: "release/test-documents/hwpcoreadapter-backend-proof-006/outputs/surgical-patch-output.hwpx",
    validatorProof: "release/test-documents/hwpcoreadapter-backend-proof-006/outputs/validator-proof-output.hwpx",
    layoutAuthority: "release/test-documents/hwpcoreadapter-backend-proof-006/outputs/layout-authority-reference-output.json",
  }),
  evidence: Object.freeze({
    editorParagraph: "release/test-documents/hwpcoreadapter-backend-proof-006/evidence/editor-paragraph-evidence.json",
    editorTable: "release/test-documents/hwpcoreadapter-backend-proof-006/evidence/editor-table-evidence.json",
    editorStyle: "release/test-documents/hwpcoreadapter-backend-proof-006/evidence/editor-style-evidence.json",
    surgical: "release/test-documents/hwpcoreadapter-backend-proof-006/evidence/surgical-preservation-evidence.json",
    surgicalFailure: "release/test-documents/hwpcoreadapter-backend-proof-006/evidence/surgical-preservation-failure-evidence.json",
    validator: "release/test-documents/hwpcoreadapter-backend-proof-006/evidence/validator-evidence.json",
    validatorBroken: "release/test-documents/hwpcoreadapter-backend-proof-006/evidence/validator-broken-evidence.json",
    validatorForcedFailure: "release/test-documents/hwpcoreadapter-backend-proof-006/evidence/validator-forced-failure-evidence.json",
    layoutAuthority: "release/test-documents/hwpcoreadapter-backend-proof-006/evidence/layout-authority-reference-evidence.json",
  }),
  tests: Object.freeze({
    summary: "release/test-documents/hwpcoreadapter-backend-proof-006/tests/backend-proof-summary.json",
  }),
});

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function writeJson(path, payload) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function normalize(path) {
  return path.replaceAll("\\", "/");
}

async function loadHwpx(path) {
  const JSZip = getJSZip();
  return JSZip.loadAsync(await readFile(path));
}

async function writeHwpx(zip, path) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

async function readZipText(zip, name) {
  const entry = zip.file(name);
  return entry ? await entry.async("string") : "";
}

function insertBeforeSectionEnd(xml, snippet) {
  for (const endTag of ["</hs:sec>", "</hp:sec>", "</sec>"]) {
    const index = xml.lastIndexOf(endTag);
    if (index >= 0) {
      return `${xml.slice(0, index)}${snippet}${xml.slice(index)}`;
    }
  }
  return `${xml}\n${snippet}`;
}

function paragraphSnippet(text) {
  return `<hp:p><hp:run><hp:t>${escapeXml(text)}</hp:t></hp:run></hp:p>`;
}

function tableSnippet() {
  return [
    '<hp:tbl id="task006-table" rowCnt="2" colCnt="2">',
    '<hp:tr><hp:tc><hp:subList><hp:p><hp:run><hp:t>Task</hp:t></hp:run></hp:p></hp:subList></hp:tc><hp:tc><hp:subList><hp:p><hp:run><hp:t>006</hp:t></hp:run></hp:p></hp:subList></hp:tc></hp:tr>',
    '<hp:tr><hp:tc><hp:subList><hp:p><hp:run><hp:t>Backend</hp:t></hp:run></hp:p></hp:subList></hp:tc><hp:tc><hp:subList><hp:p><hp:run><hp:t>Proof</hp:t></hp:run></hp:p></hp:subList></hp:tc></hp:tr>',
    '</hp:tbl>',
  ].join("");
}

function styleSnippet() {
  return '<hp:p styleIDRef="1"><hp:run charPrIDRef="1"><hp:t>Army Claw Task 006 style proof</hp:t></hp:run></hp:p>';
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function mutateSection(inputPath, outputPath, snippet) {
  const zip = await loadHwpx(inputPath);
  const beforeXml = await readZipText(zip, SECTION_ENTRY);
  if (!beforeXml) throw new Error("section0_xml_missing");
  zip.file(SECTION_ENTRY, insertBeforeSectionEnd(beforeXml, snippet));
  await writeHwpx(zip, outputPath);
}

export async function zipEntryHashes(path) {
  const zip = await loadHwpx(path);
  const hashes = {};
  for (const name of Object.keys(zip.files).sort()) {
    if (zip.files[name].dir) continue;
    hashes[name] = sha256(await zip.files[name].async("nodebuffer"));
  }
  return hashes;
}

export async function validateHwpxStructure(path) {
  try {
    const zip = await loadHwpx(path);
    const entries = Object.keys(zip.files).filter((name) => !zip.files[name].dir).sort();
    const required = ["mimetype", "Contents/content.hpf", SECTION_ENTRY];
    const missing = required.filter((entry) => !entries.includes(entry));
    const sectionXml = await readZipText(zip, SECTION_ENTRY);
    return {
      valid: missing.length === 0 && sectionXml.length > 0,
      validator: "Task006HwpxStructuralValidator",
      failure_count: missing.length === 0 && sectionXml.length > 0 ? 0 : 1,
      failures: missing.length ? missing.map((entry) => `missing:${entry}`) : sectionXml ? [] : ["section_xml_empty"],
      entries,
      sectionXml,
    };
  } catch (error) {
    return {
      valid: false,
      validator: "Task006HwpxStructuralValidator",
      failure_count: 1,
      failures: [error.message],
      entries: [],
      sectionXml: "",
    };
  }
}

function changedEntries(before, after) {
  const names = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...names].filter((name) => before[name] !== after[name]).sort();
}

function nonTargetHashes(before, after, targetEntry) {
  const beforeMap = {};
  const afterMap = {};
  for (const name of Object.keys(before).sort()) {
    if (name === targetEntry) continue;
    beforeMap[name] = before[name];
    afterMap[name] = after[name];
  }
  return { before: beforeMap, after: afterMap };
}

async function makeEvidence({ path, operation, result, extra = {} }) {
  const input = await createFileProbe(operation.input_path);
  const output = await createFileProbe(operation.output_path);
  const evidence = {
    task_id: TASK_ID,
    operation_id: operation.operation_id,
    backend_role: result.backend_role,
    backend_id: result.backend_id,
    promoted: result.promoted,
    input,
    output,
    validation: result.validation,
    failure: result.failure,
    ...extra,
  };
  await writeJson(path, evidence);
  return evidence;
}

class EditorThinHwpxBackendProof {
  constructor(kind) {
    this.kind = kind;
    this.backendId = "EditorThinHwpxBackendProof";
  }

  async execute(operation, context) {
    const startedAt = new Date().toISOString();
    const snippets = {
      paragraph: paragraphSnippet("Army Claw Task 006 paragraph proof"),
      table: tableSnippet(),
      style: styleSnippet(),
    };
    await mutateSection(operation.input_path, context.temp_output_path, snippets[this.kind]);
    const validation = await validateHwpxStructure(context.temp_output_path);
    return {
      backend_role: operation.backend_role,
      backend_id: this.backendId,
      started_at: startedAt,
      ended_at: new Date().toISOString(),
      success: validation.valid,
      exit_code: validation.valid ? 0 : 1,
      input_probe: await createFileProbe(operation.input_path),
      output_probe: await createFileProbe(context.temp_output_path),
      validation,
      evidence_path: null,
      failure: validation.valid ? null : { type: "validation_error", message: "editor_output_invalid", last_successful_step: "mutate_section", quarantine_path: context.quarantine_path },
      details: { proof_kind: this.kind, changed_target_entry: SECTION_ENTRY },
    };
  }
}

class SurgicalPatchBackendProof {
  constructor({ forcePreservationFailure = false } = {}) {
    this.backendId = "SurgicalPatchBackendProof";
    this.forcePreservationFailure = forcePreservationFailure;
  }

  async execute(operation, context) {
    const startedAt = new Date().toISOString();
    const before = await zipEntryHashes(operation.input_path);
    await mutateSection(operation.input_path, context.temp_output_path, paragraphSnippet("Army Claw Task 006 surgical patch proof"));
    const after = await zipEntryHashes(context.temp_output_path);
    const changed = changedEntries(before, after);
    const nonTarget = nonTargetHashes(before, after, SECTION_ENTRY);
    const preserved = JSON.stringify(nonTarget.before) === JSON.stringify(nonTarget.after) && changed.every((entry) => entry === SECTION_ENTRY);
    const valid = preserved && !this.forcePreservationFailure;
    return {
      backend_role: operation.backend_role,
      backend_id: this.backendId,
      started_at: startedAt,
      ended_at: new Date().toISOString(),
      success: valid,
      exit_code: valid ? 0 : 1,
      input_probe: await createFileProbe(operation.input_path),
      output_probe: await createFileProbe(context.temp_output_path),
      validation: { valid, validator: "Task006SurgicalPreservationValidator", failure_count: valid ? 0 : 1, failures: valid ? [] : ["non_target_preservation_forced_failure"] },
      evidence_path: null,
      failure: valid ? null : { type: "preservation_error", message: "non_target_preservation_failed", last_successful_step: "preservation_hash_compare", quarantine_path: context.quarantine_path },
      details: {
        changed_target_entry: SECTION_ENTRY,
        changed_entries: changed,
        non_target_preserved: preserved && !this.forcePreservationFailure,
        non_target_hash_map: nonTarget,
        relationship_bindata_preservation: {
          checked_entries: Object.keys(nonTarget.before).filter((name) => /^BinData\//iu.test(name) || /\.rels$/iu.test(name)),
        },
      },
    };
  }
}

class ValidatorBackendProof {
  constructor({ forceValidationFailure = false } = {}) {
    this.backendId = "ValidatorBackendProof";
    this.forceValidationFailure = forceValidationFailure;
  }

  async execute(operation, context) {
    const startedAt = new Date().toISOString();
    const validation = await validateHwpxStructure(operation.input_path);
    if (this.forceValidationFailure) {
      validation.valid = false;
      validation.failure_count = Math.max(validation.failure_count, 1);
      validation.failures = [...validation.failures, "forced_validation_failure"];
    }
    if (validation.valid) {
      await copyFile(operation.input_path, context.temp_output_path);
    }
    return {
      backend_role: operation.backend_role,
      backend_id: this.backendId,
      started_at: startedAt,
      ended_at: new Date().toISOString(),
      success: true,
      exit_code: 0,
      input_probe: await createFileProbe(operation.input_path),
      output_probe: await createFileProbe(context.temp_output_path),
      validation,
      evidence_path: null,
      failure: null,
      details: { validator_result: validation },
    };
  }
}

class LayoutAuthorityReferenceBackendProof {
  constructor(workspace) {
    this.backendId = "LayoutAuthorityReferenceBackendProof";
    this.workspace = workspace;
    this.realComExecuted = false;
  }

  async execute(operation, context) {
    const startedAt = new Date().toISOString();
    const referencePath = resolve(this.workspace, TASK_003_NATIVE_REFERENCE);
    const referenceProbe = await createFileProbe(referencePath);
    const payload = {
      real_com_executed: false,
      task003_reference: referenceProbe,
      note: "Task 006 reads existing native HWPX evidence only; it does not start Hancom COM.",
    };
    await mkdir(dirname(context.temp_output_path), { recursive: true });
    await writeFile(context.temp_output_path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    return {
      backend_role: operation.backend_role,
      backend_id: this.backendId,
      started_at: startedAt,
      ended_at: new Date().toISOString(),
      success: referenceProbe.exists,
      exit_code: referenceProbe.exists ? 0 : 1,
      input_probe: await createFileProbe(operation.input_path),
      output_probe: await createFileProbe(context.temp_output_path),
      validation: { valid: referenceProbe.exists, validator: "Task006LayoutAuthorityReferenceValidator", failure_count: referenceProbe.exists ? 0 : 1, failures: referenceProbe.exists ? [] : ["task003_native_reference_missing"] },
      evidence_path: null,
      failure: referenceProbe.exists ? null : { type: "native_layout_error", message: "task003_native_reference_missing", last_successful_step: "reference_probe", quarantine_path: context.quarantine_path },
      details: payload,
    };
  }
}

export async function readProofEvidence(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

export function createBackendProofHarness({ workspace }) {
  const root = resolve(workspace);

  async function ensureFixture() {
    await mkdir(resolve(root, proofPaths.fixtures), { recursive: true });
    await copyFile(resolve(root, SOURCE_FIXTURE), resolve(root, proofPaths.fixturesSource));
    return resolve(root, proofPaths.fixturesSource);
  }

  function adapterWith(backends, evidenceDir) {
    return new HwpCoreAdapter({ backends, evidenceDir: resolve(root, evidenceDir) });
  }

  function operation({ id, inputPath, outputPath, intent, options = {} }) {
    return {
      operation_id: id,
      task_id: TASK_ID,
      input_path: resolve(root, inputPath),
      output_path: resolve(root, outputPath),
      intent,
      options,
    };
  }

  async function runEditorProof(kind) {
    await ensureFixture();
    const outputByKind = {
      paragraph: proofPaths.outputs.editorParagraph,
      table: proofPaths.outputs.editorTable,
      style: proofPaths.outputs.editorStyle,
    };
    const evidenceByKind = {
      paragraph: proofPaths.evidence.editorParagraph,
      table: proofPaths.evidence.editorTable,
      style: proofPaths.evidence.editorStyle,
    };
    const op = operation({ id: `editor-${kind}`, inputPath: proofPaths.fixturesSource, outputPath: outputByKind[kind], intent: kind === "table" ? "edit_table" : kind === "style" ? "apply_style" : "edit_paragraph" });
    const adapter = adapterWith({ editor: new EditorThinHwpxBackendProof(kind) }, join(proofPaths.root, "adapter-evidence"));
    const result = await adapter.executeOperation(op);
    await makeEvidence({ path: resolve(root, evidenceByKind[kind]), operation: op, result, extra: { changed_target_entry: SECTION_ENTRY, proof_kind: kind } });
    return result;
  }

  async function runSurgicalProof({ forcePreservationFailure = false } = {}) {
    await ensureFixture();
    const op = operation({ id: forcePreservationFailure ? "surgical-failure" : "surgical", inputPath: proofPaths.fixturesSource, outputPath: proofPaths.outputs.surgicalPatch, intent: "patch_xml_preserve" });
    const backend = new SurgicalPatchBackendProof({ forcePreservationFailure });
    const adapter = adapterWith({ surgical_patcher: backend }, join(proofPaths.root, "adapter-evidence"));
    const result = await adapter.executeOperation(op);
    const details = result.details ?? {};
    await makeEvidence({
      path: resolve(root, forcePreservationFailure ? proofPaths.evidence.surgicalFailure : proofPaths.evidence.surgical),
      operation: op,
      result,
      extra: details,
    });
    return result;
  }

  async function runValidatorProof({ inputPath, evidencePath = proofPaths.evidence.validator, forceValidationFailure = false }) {
    const op = operation({ id: evidencePath.includes("broken") ? "validator-broken" : forceValidationFailure ? "validator-forced-failure" : "validator", inputPath, outputPath: proofPaths.outputs.validatorProof, intent: "validate_structure" });
    const backend = new ValidatorBackendProof({ forceValidationFailure });
    const adapter = adapterWith({ validator: backend }, join(proofPaths.root, "adapter-evidence"));
    const result = await adapter.executeOperation(op);
    await makeEvidence({ path: resolve(root, evidencePath), operation: op, result, extra: { validator_result: result.details?.validator_result ?? result.validation } });
    return result;
  }

  async function runLayoutAuthorityReferenceProof() {
    await ensureFixture();
    const op = operation({ id: "layout-authority-reference", inputPath: proofPaths.fixturesSource, outputPath: proofPaths.outputs.layoutAuthority, intent: "native_layout_check" });
    const backend = new LayoutAuthorityReferenceBackendProof(root);
    const adapter = adapterWith({ layout_authority: backend }, join(proofPaths.root, "adapter-evidence"));
    const result = await adapter.executeOperation(op);
    await makeEvidence({
      path: resolve(root, proofPaths.evidence.layoutAuthority),
      operation: op,
      result,
      extra: {
        real_com_executed: backend.realComExecuted,
        task003_reference: result.details.task003_reference,
      },
    });
    return result;
  }

  async function runAllProofs() {
    const results = [];
    results.push(await runEditorProof("paragraph"));
    results.push(await runEditorProof("table"));
    results.push(await runEditorProof("style"));
    results.push(await runSurgicalProof());
    results.push(await runValidatorProof({ inputPath: proofPaths.outputs.editorParagraph }));
    results.push(await runLayoutAuthorityReferenceProof());

    const expectedFailures = [];
    expectedFailures.push(await runSurgicalProof({ forcePreservationFailure: true }));
    const brokenPath = resolve(root, proofPaths.fixtures, "broken-not-hwpx.hwpx");
    await writeFile(brokenPath, "not a zip", "utf8");
    expectedFailures.push(await runValidatorProof({ inputPath: brokenPath, evidencePath: proofPaths.evidence.validatorBroken }));
    expectedFailures.push(await runValidatorProof({ inputPath: proofPaths.outputs.editorParagraph, forceValidationFailure: true, evidencePath: proofPaths.evidence.validatorForcedFailure }));

    const outputProbes = [];
    for (const output of [proofPaths.outputs.editorParagraph, proofPaths.outputs.editorTable, proofPaths.outputs.editorStyle, proofPaths.outputs.surgicalPatch, proofPaths.outputs.validatorProof, proofPaths.outputs.layoutAuthority]) {
      outputProbes.push(await createFileProbe(resolve(root, output)));
    }
    const summary = {
      task_id: TASK_ID,
      generated_at: new Date().toISOString(),
      completion_candidate: results.every((result) => result.promoted === true) && expectedFailures.every((result) => result.promoted === false),
      real_com_executed: false,
      outputs: outputProbes.map((probe) => ({ path: normalize(probe.path), size: probe.size, sha256: probe.sha256 })),
      backend_ids: results.map((result) => result.backend_id),
      expected_failures: expectedFailures.map((result) => ({ backend_id: result.backend_id, failure_type: result.failure?.type, promoted: result.promoted })),
    };
    await writeJson(resolve(root, proofPaths.tests.summary), summary);
    return summary;
  }

  return {
    ensureFixture,
    runEditorProof,
    runSurgicalProof,
    runValidatorProof,
    runLayoutAuthorityReferenceProof,
    runAllProofs,
  };
}


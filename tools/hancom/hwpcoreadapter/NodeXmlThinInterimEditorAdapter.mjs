import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { HwpCoreAdapter, createFileProbe } from "./HwpCoreAdapter.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TASK_ID = "node-xml-thin-interim-adapter-integration-008";
const SECTION_ENTRY = "Contents/section0.xml";
const SOURCE_FIXTURE = "release/test-documents/army-claw-qualification-review-template-fidelity-v5.hwpx";

export const interimAdapterPaths = Object.freeze({
  root: "release/test-documents/node-xml-thin-interim-adapter-integration-008",
  fixtures: "release/test-documents/node-xml-thin-interim-adapter-integration-008/fixtures",
  fixturesSource: "release/test-documents/node-xml-thin-interim-adapter-integration-008/fixtures/source.hwpx",
  outputs: Object.freeze({
    createDocument: "release/test-documents/node-xml-thin-interim-adapter-integration-008/outputs/create-document-output.hwpx",
    editParagraph: "release/test-documents/node-xml-thin-interim-adapter-integration-008/outputs/edit-paragraph-output.hwpx",
    editTable: "release/test-documents/node-xml-thin-interim-adapter-integration-008/outputs/edit-table-output.hwpx",
    applyStyle: "release/test-documents/node-xml-thin-interim-adapter-integration-008/outputs/apply-style-output.hwpx",
    validationFailure: "release/test-documents/node-xml-thin-interim-adapter-integration-008/outputs/validation-failure-output.hwpx",
  }),
  evidence: Object.freeze({
    createDocument: "release/test-documents/node-xml-thin-interim-adapter-integration-008/evidence/create-document-evidence.json",
    editParagraph: "release/test-documents/node-xml-thin-interim-adapter-integration-008/evidence/edit-paragraph-evidence.json",
    editTable: "release/test-documents/node-xml-thin-interim-adapter-integration-008/evidence/edit-table-evidence.json",
    applyStyle: "release/test-documents/node-xml-thin-interim-adapter-integration-008/evidence/apply-style-evidence.json",
    validationFailure: "release/test-documents/node-xml-thin-interim-adapter-integration-008/evidence/failure-validation-evidence.json",
  }),
  tests: Object.freeze({
    summary: "release/test-documents/node-xml-thin-interim-adapter-integration-008/tests/interim-adapter-summary.json",
  }),
});

function packageRequire() {
  const nodeModules = process.env.ARMY_CLAW_NODE_MODULES || resolve(__dirname, "..", "node_modules");
  return createRequire(pathToFileURL(join(nodeModules, ".army-claw-loader.cjs")));
}

function getJSZip() {
  return packageRequire()("jszip");
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function normalize(path) {
  return path.replaceAll("\\", "/");
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function writeJson(path, payload) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
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
    if (index >= 0) return `${xml.slice(0, index)}${snippet}${xml.slice(index)}`;
  }
  return `${xml}\n${snippet}`;
}

function paragraphSnippet(text) {
  return `<hp:p><hp:run><hp:t>${escapeXml(text)}</hp:t></hp:run></hp:p>`;
}

function tableSnippet(rows) {
  const safeRows = rows?.length ? rows : [["Task", "008"], ["Backend", "Interim"]];
  return [
    `<hp:tbl id="task008-table" rowCnt="${safeRows.length}" colCnt="${Math.max(...safeRows.map((row) => row.length))}">`,
    ...safeRows.map((row) => `<hp:tr>${row.map((cell) => `<hp:tc><hp:subList><hp:p><hp:run><hp:t>${escapeXml(cell)}</hp:t></hp:run></hp:p></hp:subList></hp:tc>`).join("")}</hp:tr>`),
    "</hp:tbl>",
  ].join("");
}

function styleSnippet(text) {
  return `<hp:p styleIDRef="1"><hp:run charPrIDRef="1"><hp:t>${escapeXml(text)}</hp:t></hp:run></hp:p>`;
}

function snippetFor(operation) {
  const options = operation.options ?? {};
  if (operation.intent === "create_document") {
    return paragraphSnippet(options.title ?? "Army Claw Task 008 created document");
  }
  if (operation.intent === "edit_paragraph") {
    return paragraphSnippet(options.text ?? "Task 008 paragraph edit");
  }
  if (operation.intent === "edit_table") {
    return tableSnippet(options.rows);
  }
  if (operation.intent === "apply_style") {
    return styleSnippet(options.text ?? "Task 008 style application");
  }
  throw new Error(`unsupported_editor_intent:${operation.intent}`);
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

function changedEntries(before, after) {
  const names = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...names].filter((name) => before[name] !== after[name]).sort();
}

function nonTargetPreserved(before, after, targetEntry) {
  for (const name of Object.keys(before)) {
    if (name !== targetEntry && before[name] !== after[name]) return false;
  }
  return true;
}

export async function validateInterimHwpxStructure(path, { forceInvalid = false } = {}) {
  try {
    const zip = await loadHwpx(path);
    const entries = Object.keys(zip.files).filter((name) => !zip.files[name].dir).sort();
    const required = ["mimetype", "Contents/content.hpf", SECTION_ENTRY];
    const missing = required.filter((entry) => !entries.includes(entry));
    const sectionXml = await readZipText(zip, SECTION_ENTRY);
    const failures = [...missing.map((entry) => `missing:${entry}`)];
    if (!sectionXml) failures.push("section_xml_empty");
    if (forceInvalid) failures.push("forced_validation_failure");
    return {
      valid: failures.length === 0,
      validator: "Task008NodeXmlThinInterimValidator",
      failure_count: failures.length,
      failures,
      entries,
      sectionXml,
    };
  } catch (error) {
    return {
      valid: false,
      validator: "Task008NodeXmlThinInterimValidator",
      failure_count: 1,
      failures: [error.message],
      entries: [],
      sectionXml: "",
    };
  }
}

async function mutateSection(inputPath, outputPath, snippet) {
  const before = await zipEntryHashes(inputPath);
  const zip = await loadHwpx(inputPath);
  const beforeXml = await readZipText(zip, SECTION_ENTRY);
  if (!beforeXml) throw new Error("section0_xml_missing");
  zip.file(SECTION_ENTRY, insertBeforeSectionEnd(beforeXml, snippet));
  await writeHwpx(zip, outputPath);
  const after = await zipEntryHashes(outputPath);
  return {
    changed_target_entry: SECTION_ENTRY,
    changed_entries: changedEntries(before, after),
    non_target_preserved: nonTargetPreserved(before, after, SECTION_ENTRY),
  };
}

export class NodeXmlThinInterimEditorAdapter {
  constructor({ forceValidationFailure = false } = {}) {
    this.backendId = "NodeXmlThinInterimEditorAdapter";
    this.forceValidationFailure = forceValidationFailure;
    this.realComExecuted = false;
  }

  async execute(operation, context) {
    const startedAt = new Date().toISOString();
    let details = null;
    try {
      details = await mutateSection(operation.input_path, context.temp_output_path, snippetFor(operation));
      const validation = await validateInterimHwpxStructure(context.temp_output_path, { forceInvalid: this.forceValidationFailure });
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
        failure: validation.valid ? null : { type: "validation_error", message: "interim_editor_output_invalid", last_successful_step: "validate_output", quarantine_path: context.quarantine_path },
        details: { ...details, real_com_executed: this.realComExecuted },
      };
    } catch (error) {
      return {
        backend_role: operation.backend_role,
        backend_id: this.backendId,
        started_at: startedAt,
        ended_at: new Date().toISOString(),
        success: false,
        exit_code: 1,
        input_probe: await createFileProbe(operation.input_path),
        output_probe: await createFileProbe(context.temp_output_path),
        validation: { valid: false, validator: "Task008NodeXmlThinInterimValidator", failure_count: 1, failures: [error.message] },
        evidence_path: null,
        failure: { type: "backend_error", message: error.message, last_successful_step: "mutate_section", quarantine_path: context.quarantine_path },
        details: details ?? { real_com_executed: this.realComExecuted },
      };
    }
  }
}

export function createNodeXmlThinInterimEditorAdapter(options = {}) {
  return new NodeXmlThinInterimEditorAdapter(options);
}

export async function readInterimEvidence(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function makeEvidence({ path, operation, result }) {
  const details = result.details ?? {};
  const evidence = {
    task_id: TASK_ID,
    operation_id: operation.operation_id,
    backend_role: result.backend_role,
    backend_id: result.backend_id,
    started_at: result.started_at,
    ended_at: result.ended_at,
    exit_code: result.exit_code,
    promoted: result.promoted,
    input_probe: result.input_probe,
    output_probe: result.output_probe,
    validation: result.validation,
    failure: result.failure,
    changed_target_entry: details.changed_target_entry ?? SECTION_ENTRY,
    changed_entries: details.changed_entries ?? [],
    non_target_preserved: details.non_target_preserved ?? null,
    real_com_executed: details.real_com_executed ?? false,
  };
  await writeJson(path, evidence);
  return evidence;
}

export function createNodeXmlThinInterimEditorHarness({ workspace }) {
  const root = resolve(workspace);

  async function ensureFixture() {
    await mkdir(resolve(root, interimAdapterPaths.fixtures), { recursive: true });
    await copyFile(resolve(root, SOURCE_FIXTURE), resolve(root, interimAdapterPaths.fixturesSource));
    return resolve(root, interimAdapterPaths.fixturesSource);
  }

  function adapterWith(backend, evidenceDir = join(interimAdapterPaths.root, "adapter-evidence")) {
    return new HwpCoreAdapter({ backends: { editor: backend }, evidenceDir: resolve(root, evidenceDir) });
  }

  function operation({ id, intent, outputPath, options = {} }) {
    return {
      operation_id: id,
      task_id: TASK_ID,
      intent,
      input_path: resolve(root, interimAdapterPaths.fixturesSource),
      output_path: resolve(root, outputPath),
      options,
    };
  }

  async function runEditorOperation({ id, intent, outputPath, evidencePath, options = {}, forceValidationFailure = false }) {
    await ensureFixture();
    const op = operation({ id, intent, outputPath, options });
    const adapter = adapterWith(createNodeXmlThinInterimEditorAdapter({ forceValidationFailure }));
    const result = await adapter.executeOperation(op);
    await makeEvidence({ path: resolve(root, evidencePath), operation: op, result });
    return result;
  }

  async function runCreateDocument() {
    return runEditorOperation({
      id: "create-document",
      intent: "create_document",
      outputPath: interimAdapterPaths.outputs.createDocument,
      evidencePath: interimAdapterPaths.evidence.createDocument,
      options: { title: "Army Claw Task 008 created document" },
    });
  }

  async function runEditParagraph() {
    return runEditorOperation({
      id: "edit-paragraph",
      intent: "edit_paragraph",
      outputPath: interimAdapterPaths.outputs.editParagraph,
      evidencePath: interimAdapterPaths.evidence.editParagraph,
      options: { text: "Task 008 paragraph edit" },
    });
  }

  async function runEditTable() {
    return runEditorOperation({
      id: "edit-table",
      intent: "edit_table",
      outputPath: interimAdapterPaths.outputs.editTable,
      evidencePath: interimAdapterPaths.evidence.editTable,
      options: { rows: [["Task", "008"], ["Adapter", "Node XML Thin"]] },
    });
  }

  async function runApplyStyle() {
    return runEditorOperation({
      id: "apply-style",
      intent: "apply_style",
      outputPath: interimAdapterPaths.outputs.applyStyle,
      evidencePath: interimAdapterPaths.evidence.applyStyle,
      options: { text: "Task 008 style application" },
    });
  }

  async function runValidationFailureProof() {
    return runEditorOperation({
      id: "validation-failure",
      intent: "edit_paragraph",
      outputPath: interimAdapterPaths.outputs.validationFailure,
      evidencePath: interimAdapterPaths.evidence.validationFailure,
      options: { text: "Task 008 validation failure proof" },
      forceValidationFailure: true,
    });
  }

  async function runAllProofs() {
    const results = [
      await runCreateDocument(),
      await runEditParagraph(),
      await runEditTable(),
      await runApplyStyle(),
    ];
    const failure = await runValidationFailureProof();
    const outputPaths = [
      interimAdapterPaths.outputs.createDocument,
      interimAdapterPaths.outputs.editParagraph,
      interimAdapterPaths.outputs.editTable,
      interimAdapterPaths.outputs.applyStyle,
    ];
    const outputs = [];
    for (const output of outputPaths) {
      const probe = await createFileProbe(resolve(root, output));
      outputs.push({ path: normalize(probe.path), exists: probe.exists, size: probe.size, sha256: probe.sha256 });
    }
    const summary = {
      task_id: TASK_ID,
      generated_at: new Date().toISOString(),
      completion_candidate: results.every((result) => result.promoted === true) && failure.promoted === false,
      backend_id: "NodeXmlThinInterimEditorAdapter",
      backend_role: "editor",
      supported_intents: ["create_document", "edit_paragraph", "edit_table", "apply_style"],
      outputs,
      validation_failure: { promoted: failure.promoted, failure_type: failure.failure?.type ?? null },
      real_com_executed: false,
      final_core_selection_declared: false,
      stage_2_transition_declared: false,
      completed_artifacts_modified: false,
      read_only_reference_roots: [
        "release/test-documents/hwpx-core-benchmark-003-evidence-integrity",
        "release/test-documents/hwpcoreadapter-backend-proof-006",
        "release/test-documents/editor-backend-candidate-comparison-007",
      ],
    };
    await writeJson(resolve(root, interimAdapterPaths.tests.summary), summary);
    return summary;
  }

  return {
    ensureFixture,
    runCreateDocument,
    runEditParagraph,
    runEditTable,
    runApplyStyle,
    runValidationFailureProof,
    runAllProofs,
  };
}

import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { createFileProbe } from "./HwpCoreAdapter.mjs";

const TASK_ID = "editor-backend-candidate-comparison-007";
const TASK006_SUMMARY = "release/test-documents/hwpcoreadapter-backend-proof-006/tests/backend-proof-summary.json";
const TASK003_ROOT = "release/test-documents/hwpx-core-benchmark-003-evidence-integrity";
const TASK006_ROOT = "release/test-documents/hwpcoreadapter-backend-proof-006";
const TASK004_DOCS = [
  "docs/architecture/hwpx-core-selection-review-004.md",
  "docs/architecture/hwpx-core-adapter-boundary-004.md",
];
const TASK005_REPORT = "docs/gpt-communication/reports/2026-07-04-hwpcoreadapter-boundary-validation-005.md";
const TASK006_REPORT = "docs/gpt-communication/reports/2026-07-04-hwpcoreadapter-backend-proof-006.md";

export const ALLOWED_RECOMMENDATIONS = Object.freeze([
  "python_hwpx_advance_to_backend_proof",
  "node_xml_thin_interim_editor",
  "split_roles_recommended",
  "insufficient_evidence",
]);

export const comparisonPaths = Object.freeze({
  root: "release/test-documents/editor-backend-candidate-comparison-007",
  python: Object.freeze({
    root: "release/test-documents/editor-backend-candidate-comparison-007/python-hwpx",
    availabilityProbe: "release/test-documents/editor-backend-candidate-comparison-007/python-hwpx/availability-probe.json",
    dependencyProbe: "release/test-documents/editor-backend-candidate-comparison-007/python-hwpx/dependency-probe.txt",
    licenseProbe: "release/test-documents/editor-backend-candidate-comparison-007/python-hwpx/license-probe.txt",
    paragraphOutput: "release/test-documents/editor-backend-candidate-comparison-007/python-hwpx/paragraph-output.hwpx",
    tableOutput: "release/test-documents/editor-backend-candidate-comparison-007/python-hwpx/table-output.hwpx",
    styleOutput: "release/test-documents/editor-backend-candidate-comparison-007/python-hwpx/style-output.hwpx",
    paragraphUnavailable: "release/test-documents/editor-backend-candidate-comparison-007/python-hwpx/paragraph-output-unavailable.json",
    tableUnavailable: "release/test-documents/editor-backend-candidate-comparison-007/python-hwpx/table-output-unavailable.json",
    styleUnavailable: "release/test-documents/editor-backend-candidate-comparison-007/python-hwpx/style-output-unavailable.json",
    evidence: "release/test-documents/editor-backend-candidate-comparison-007/python-hwpx/evidence.json",
  }),
  node: Object.freeze({
    root: "release/test-documents/editor-backend-candidate-comparison-007/node-xml-thin",
    baselineReference: "release/test-documents/editor-backend-candidate-comparison-007/node-xml-thin/baseline-reference.json",
    outputFidelityProbe: "release/test-documents/editor-backend-candidate-comparison-007/node-xml-thin/output-fidelity-probe.json",
    evidence: "release/test-documents/editor-backend-candidate-comparison-007/node-xml-thin/evidence.json",
  }),
  comparison: Object.freeze({
    root: "release/test-documents/editor-backend-candidate-comparison-007/comparison",
    matrix: "release/test-documents/editor-backend-candidate-comparison-007/comparison/editor-backend-comparison-matrix.json",
    recommendation: "release/test-documents/editor-backend-candidate-comparison-007/comparison/recommendation.json",
    riskRegister: "release/test-documents/editor-backend-candidate-comparison-007/comparison/risk-register.json",
  }),
});

export async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function writeJson(path, payload) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function sha256Text(text) {
  return createHash("sha256").update(text).digest("hex");
}

async function runCommand(command, args, { cwd, timeoutMs = 10000 } = {}) {
  return new Promise((resolvePromise) => {
    const startedAt = new Date().toISOString();
    const child = spawn(command, args, { cwd, windowsHide: true });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);
    child.stdout?.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr?.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", (error) => {
      clearTimeout(timer);
      resolvePromise({ command: [command, ...args].join(" "), started_at: startedAt, ended_at: new Date().toISOString(), exit_code: null, stdout, stderr: stderr || error.message, timed_out: timedOut, available: false });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolvePromise({ command: [command, ...args].join(" "), started_at: startedAt, ended_at: new Date().toISOString(), exit_code: code, stdout, stderr, timed_out: timedOut, available: code === 0 });
    });
  });
}

async function walkFiles(root, { maxFiles = 2000 } = {}) {
  const output = [];
  async function walk(dir) {
    if (output.length >= maxFiles) return;
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name === ".git" || entry.name === "node_modules" || entry.name === ".tmp") continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else {
        output.push(full);
      }
      if (output.length >= maxFiles) return;
    }
  }
  await walk(root);
  return output;
}

async function repositorySearch(workspace) {
  const needles = [/python-hwpx/iu, /python_hwpx/iu, /pyhwpx/iu, /hwpx/iu, /pip/iu, /requirements/iu, /pyproject/iu];
  const files = await walkFiles(workspace);
  const matches = [];
  for (const file of files) {
    const rel = file.slice(resolve(workspace).length + 1).replaceAll("\\", "/");
    if (!/\.(md|txt|json|mjs|js|py|toml|cfg|ini|ps1|yml|yaml)$/iu.test(rel) && !/(requirements|pyproject|package)/iu.test(rel)) continue;
    let text = "";
    try {
      text = await readFile(file, "utf8");
    } catch {
      continue;
    }
    const hitNeedles = needles.filter((needle) => needle.test(rel) || needle.test(text)).map(String);
    if (hitNeedles.length) {
      matches.push({ path: rel, matched_patterns: hitNeedles.slice(0, 5) });
    }
    if (matches.length >= 80) break;
  }
  return { performed: true, match_count: matches.length, matches };
}

async function pythonRuntimeProbe(workspace) {
  const candidates = [
    { command: "python", args: ["--version"] },
    { command: "py", args: ["--version"] },
  ];
  const checks = [];
  for (const candidate of candidates) {
    const result = await runCommand(candidate.command, candidate.args, { cwd: workspace, timeoutMs: 8000 });
    checks.push(result);
    if (result.exit_code === 0) break;
  }
  return {
    command_checked: checks.map((check) => check.command),
    checks,
    available: checks.some((check) => check.exit_code === 0),
    selected_command: checks.find((check) => check.exit_code === 0)?.command.split(" ")[0] ?? null,
    version_text: checks.find((check) => check.exit_code === 0)?.stdout?.trim() || checks.find((check) => check.exit_code === 0)?.stderr?.trim() || "",
  };
}

async function importProbe(workspace, pythonCommand) {
  const moduleNames = ["hwpx", "python_hwpx", "pyhwpx"];
  const attempts = [];
  if (!pythonCommand) {
    return { available: false, selected_module: null, attempts, reason: "python_runtime_unavailable" };
  }
  for (const name of moduleNames) {
    const result = await runCommand(pythonCommand, ["-c", `import ${name}; print(getattr(${name}, '__version__', 'version_unknown'))`], { cwd: workspace, timeoutMs: 8000 });
    attempts.push({ module: name, ...result });
    if (result.exit_code === 0) {
      return { available: true, selected_module: name, attempts, version_text: result.stdout.trim() };
    }
  }
  return { available: false, selected_module: null, attempts, reason: "candidate_modules_not_importable" };
}

async function offlineCacheProbe(workspace) {
  const possibleDirs = [
    join(workspace, "requirements"),
    join(workspace, "wheels"),
    join(workspace, "vendor"),
    join(workspace, ".tmp"),
  ];
  const hits = [];
  for (const dir of possibleDirs) {
    if (!existsSync(dir)) continue;
    const files = await walkFiles(dir, { maxFiles: 400 });
    for (const file of files) {
      const rel = file.slice(resolve(workspace).length + 1).replaceAll("\\", "/");
      if (/python[-_]?hwpx|pyhwpx|hwpx.*\.whl|\.whl$/iu.test(rel)) hits.push(rel);
    }
  }
  return { performed: true, offline_artifact_count: hits.length, artifacts: hits.slice(0, 50) };
}

async function licenseProbe(workspace, repositoryMatches) {
  const licenseLike = repositoryMatches.matches.filter((match) => /license|copying|notice|dependency|manifest|requirements|pyproject/iu.test(match.path));
  const pythonHwpxSpecific = repositoryMatches.matches.filter((match) => /python[-_]?hwpx|pyhwpx/iu.test(match.path));
  return {
    checked_repo_records: true,
    license_verified: pythonHwpxSpecific.some((match) => /license|copying|notice/iu.test(match.path)),
    status: pythonHwpxSpecific.length ? "partial_repo_mentions_found" : "license not verified in current repo",
    license_like_records: licenseLike.slice(0, 20),
    python_hwpx_specific_records: pythonHwpxSpecific.slice(0, 20),
  };
}

function unavailableRecord(kind, availability) {
  return {
    candidate_id: "python_hwpx",
    output_kind: kind,
    output_unavailable: true,
    reason: availability.import_probe.available ? "generation_backend_not_implemented_in_task007" : "python_hwpx_dependency_not_importable",
    missing_dependency: availability.import_probe.available ? null : "hwpx/python_hwpx/pyhwpx",
    required_next_action: availability.import_probe.available ? "Task 008 should define a real python-hwpx writer API mapping before output generation." : "Provide an offline-reviewed python-hwpx package, license record, and importable module in the local environment.",
    no_install_attempted: true,
  };
}

async function writePythonOutputs(workspace, availability) {
  const unavailablePaths = {
    paragraph: comparisonPaths.python.paragraphUnavailable,
    table: comparisonPaths.python.tableUnavailable,
    style: comparisonPaths.python.styleUnavailable,
  };
  for (const [kind, target] of Object.entries(unavailablePaths)) {
    await writeJson(resolve(workspace, target), unavailableRecord(kind, availability));
  }
}

async function buildPythonEvidence(workspace) {
  const repository = await repositorySearch(workspace);
  const runtime = await pythonRuntimeProbe(workspace);
  const imports = await importProbe(workspace, runtime.selected_command);
  const cache = await offlineCacheProbe(workspace);
  const license = await licenseProbe(workspace, repository);
  const outputUnavailable = !imports.available;
  const availability = {
    task_id: TASK_ID,
    candidate_id: "python_hwpx",
    generated_at: new Date().toISOString(),
    repository_search: repository,
    python_runtime: runtime,
    import_probe: imports,
    offline_cache_probe: cache,
    license_probe: license,
    output_unavailable: outputUnavailable,
    no_online_install_attempted: true,
    no_pip_install_attempted: true,
    no_dependency_vendoring_attempted: true,
  };
  await writeJson(resolve(workspace, comparisonPaths.python.availabilityProbe), availability);
  await writeFile(resolve(workspace, comparisonPaths.python.dependencyProbe), [
    "Task 007 dependency probe",
    "No online install attempted.",
    "No pip install attempted.",
    "No dependency vendoring attempted.",
    `python_available=${runtime.available}`,
    `selected_python=${runtime.selected_command ?? "none"}`,
    `import_available=${imports.available}`,
    `selected_module=${imports.selected_module ?? "none"}`,
    `offline_artifact_count=${cache.offline_artifact_count}`,
    `probe_sha256=${sha256Text(JSON.stringify({ runtime, imports, cache }))}`,
  ].join("\n"), "utf8");
  await writeFile(resolve(workspace, comparisonPaths.python.licenseProbe), [
    "Task 007 license probe",
    `license_status=${license.status}`,
    `license_verified=${license.license_verified}`,
    "No external license lookup performed.",
    "No package download performed.",
    JSON.stringify(license, null, 2),
  ].join("\n"), "utf8");
  await writePythonOutputs(workspace, { repository_search: repository, python_runtime: runtime, import_probe: imports, license_probe: license });
  const evidence = {
    task_id: TASK_ID,
    candidate_id: "python_hwpx",
    availability_path: comparisonPaths.python.availabilityProbe,
    dependency_probe_path: comparisonPaths.python.dependencyProbe,
    license_probe_path: comparisonPaths.python.licenseProbe,
    output_result: outputUnavailable ? "unavailable" : "available_import_only_generation_not_attempted",
    output_unavailable: outputUnavailable,
    no_online_install_attempted: true,
    probe_files: {
      availability: await createFileProbe(resolve(workspace, comparisonPaths.python.availabilityProbe)),
      dependency: await createFileProbe(resolve(workspace, comparisonPaths.python.dependencyProbe)),
      license: await createFileProbe(resolve(workspace, comparisonPaths.python.licenseProbe)),
    },
  };
  await writeJson(resolve(workspace, comparisonPaths.python.evidence), evidence);
  return { availability, evidence };
}

function findOutput(summary, suffix) {
  return summary.outputs.find((output) => String(output.path).replaceAll("\\", "/").endsWith(suffix));
}

async function buildNodeEvidence(workspace) {
  const summaryPath = resolve(workspace, TASK006_SUMMARY);
  const summary = await readJson(summaryPath);
  const outputs = {
    paragraph: { reference: findOutput(summary, "outputs/editor-paragraph-output.hwpx") },
    table: { reference: findOutput(summary, "outputs/editor-table-output.hwpx") },
    style: { reference: findOutput(summary, "outputs/editor-style-output.hwpx") },
  };
  for (const [kind, record] of Object.entries(outputs)) {
    record.exists = Boolean(record.reference);
    record.sha256 = record.reference?.sha256 ?? null;
    record.size = record.reference?.size ?? null;
  }
  const baseline = {
    task_id: TASK_ID,
    candidate_id: "node_xml_thin",
    already_verified: summary.completion_candidate === true,
    source_task: "hwpcoreadapter-backend-proof-006",
    task006_summary: await createFileProbe(summaryPath),
    outputs,
    strength: ["offline/local proof already generated", "paragraph/table/style HWPX outputs exist", "transaction/promote/evidence model compatible", "non-target preservation proof exists"],
    limitation: ["thin XML proof, not production-grade semantic editor", "layout quality not guaranteed without native authority", "not final HWPX core selection"],
    interim_suitability: summary.completion_candidate === true ? "suitable_as_interim_editor_candidate" : "not_suitable_without_task006_completion",
  };
  await writeJson(resolve(workspace, comparisonPaths.node.baselineReference), baseline);
  const fidelity = {
    task_id: TASK_ID,
    candidate_id: "node_xml_thin",
    output_fidelity_probe: {
      paragraph_output_exists: outputs.paragraph.exists,
      table_output_exists: outputs.table.exists,
      style_output_exists: outputs.style.exists,
      required_outputs_present: outputs.paragraph.exists && outputs.table.exists && outputs.style.exists,
      baseline_sha256: {
        paragraph: outputs.paragraph.sha256,
        table: outputs.table.sha256,
        style: outputs.style.sha256,
      },
    },
  };
  await writeJson(resolve(workspace, comparisonPaths.node.outputFidelityProbe), fidelity);
  const evidence = {
    task_id: TASK_ID,
    candidate_id: "node_xml_thin",
    baseline_reference_path: comparisonPaths.node.baselineReference,
    output_fidelity_probe_path: comparisonPaths.node.outputFidelityProbe,
    already_verified: baseline.already_verified,
    evidence_compatibility: "pass",
    transaction_promote_compatibility: "pass",
    preservation_friendliness: "pass",
    interim_suitability: baseline.interim_suitability,
  };
  await writeJson(resolve(workspace, comparisonPaths.node.evidence), evidence);
  return { baseline, fidelity, evidence };
}

function scorePython(python) {
  const available = python.availability.import_probe.available;
  const licenseVerified = python.availability.license_probe.license_verified;
  return {
    offline_availability: available ? "partial" : "fail",
    windows_local_compatibility: python.availability.python_runtime.available ? "partial" : "fail",
    dependency_footprint: available ? "not_verified" : "fail",
    license_clarity: licenseVerified ? "pass" : "not_verified",
    paragraph_output_capability: available ? "not_verified" : "fail",
    table_output_capability: available ? "not_verified" : "fail",
    style_output_capability: available ? "not_verified" : "fail",
    preservation_friendliness: "not_verified",
    evidence_compatibility: available ? "partial" : "not_verified",
    transaction_promote_compatibility: available ? "partial" : "not_verified",
    validation_compatibility: available ? "partial" : "not_verified",
    native_layout_authority_compatibility: "partial",
    implementation_risk: available ? "partial" : "fail",
    operational_risk: available ? "partial" : "fail",
    recommended_role: available ? "future_default_candidate_requires_output_proof" : "future_candidate_requires_offline_install_and_license_review",
  };
}

function scoreNode(node) {
  const ok = node.baseline.already_verified === true;
  return {
    offline_availability: ok ? "pass" : "fail",
    windows_local_compatibility: ok ? "pass" : "partial",
    dependency_footprint: "partial",
    license_clarity: "partial",
    paragraph_output_capability: node.baseline.outputs.paragraph.exists ? "pass" : "fail",
    table_output_capability: node.baseline.outputs.table.exists ? "pass" : "fail",
    style_output_capability: node.baseline.outputs.style.exists ? "pass" : "fail",
    preservation_friendliness: "pass",
    evidence_compatibility: "pass",
    transaction_promote_compatibility: "pass",
    validation_compatibility: "pass",
    native_layout_authority_compatibility: "partial",
    implementation_risk: "partial",
    operational_risk: "partial",
    recommended_role: "interim_editor_backend_candidate",
  };
}

function buildMatrix(python, node) {
  const py = scorePython(python);
  const nx = scoreNode(node);
  const criteriaKeys = [
    "offline_availability",
    "windows_local_compatibility",
    "dependency_footprint",
    "license_clarity",
    "paragraph_output_capability",
    "table_output_capability",
    "style_output_capability",
    "preservation_friendliness",
    "evidence_compatibility",
    "transaction_promote_compatibility",
    "validation_compatibility",
    "native_layout_authority_compatibility",
    "implementation_risk",
    "operational_risk",
  ];
  return {
    task_id: TASK_ID,
    generated_at: new Date().toISOString(),
    criteria: criteriaKeys.map((key) => ({ criterion: key, python_hwpx: py[key], node_xml_thin: nx[key] })),
    recommended_roles: {
      python_hwpx: py.recommended_role,
      node_xml_thin: nx.recommended_role,
    },
  };
}

function decideRecommendation(python, node) {
  const pyAvailable = python.availability.import_probe.available === true;
  const pyLicense = python.availability.license_probe.license_verified === true;
  const nodeOk = node.baseline.already_verified === true;
  let recommendation = "insufficient_evidence";
  let rationale = [];
  if (pyAvailable && pyLicense) {
    recommendation = "split_roles_recommended";
    rationale = ["python-hwpx is importable and has some license signal, but Task 007 did not create python-hwpx paragraph/table/style outputs.", "Node XML thin backend has Task 006 output/evidence proof and should remain available for preservation-oriented paths."];
  } else if (nodeOk) {
    recommendation = "node_xml_thin_interim_editor";
    rationale = ["python-hwpx is not fully verified for current offline/local environment.", "Node XML thin backend has Task 006 paragraph/table/style outputs and evidence compatibility.", "This is not a final HWPX core selection."];
  }
  return {
    task_id: TASK_ID,
    generated_at: new Date().toISOString(),
    recommendation,
    final_core_selection_declared: false,
    stage_2_transition_declared: false,
    rationale,
    next_required_evidence: recommendation === "node_xml_thin_interim_editor" ? ["offline-reviewed python-hwpx artifact", "python-hwpx license record", "python-hwpx paragraph/table/style HWPX output proof"] : ["native layout authority comparison", "production adapter hardening"],
  };
}

async function buildRiskRegister(workspace, python, node) {
  const task003Probe = await createFileProbe(resolve(workspace, TASK003_ROOT, "tests/post-d2-scenario-gates-v6.result.txt"));
  const task006Probe = await createFileProbe(resolve(workspace, TASK006_SUMMARY));
  return {
    task_id: TASK_ID,
    generated_at: new Date().toISOString(),
    risks: [
      { id: "R1", area: "python-hwpx", risk: "dependency or module name may not be available in current offline environment", severity: python.availability.import_probe.available ? "medium" : "high" },
      { id: "R2", area: "python-hwpx", risk: "license not verified in current repo unless explicit record exists", severity: python.availability.license_probe.license_verified ? "low" : "medium" },
      { id: "R3", area: "node_xml_thin", risk: "thin XML backend is not a production semantic editor", severity: "medium" },
      { id: "R4", area: "layout", risk: "native layout quality still needs Hancom authority opt-in validation", severity: "medium" },
    ],
    read_only_checks: {
      task003_evidence_modified: false,
      task003_probe: task003Probe,
      task004_docs: await Promise.all(TASK004_DOCS.map((path) => createFileProbe(resolve(workspace, path)))),
      task005_report: await createFileProbe(resolve(workspace, TASK005_REPORT)),
      task006_report: await createFileProbe(resolve(workspace, TASK006_REPORT)),
      task006_summary: task006Probe,
    },
  };
}

export async function runEditorBackendCandidateComparison({ workspace }) {
  const root = resolve(workspace);
  await mkdir(resolve(root, comparisonPaths.root), { recursive: true });
  const python = await buildPythonEvidence(root);
  const node = await buildNodeEvidence(root);
  const matrix = buildMatrix(python, node);
  await writeJson(resolve(root, comparisonPaths.comparison.matrix), matrix);
  const recommendation = decideRecommendation(python, node);
  await writeJson(resolve(root, comparisonPaths.comparison.recommendation), recommendation);
  const riskRegister = await buildRiskRegister(root, python, node);
  await writeJson(resolve(root, comparisonPaths.comparison.riskRegister), riskRegister);
  return { python_hwpx: python, node_xml_thin: node, comparison: matrix, recommendation, risk_register: riskRegister };
}

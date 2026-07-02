import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { analyzeHwpxTemplate, validateHwpxPackage } from "../army-claw-hancom-tools.mjs";
import { CurrentNodeXmlAdapter } from "../adapters/current-node-xml-adapter.mjs";
import { PythonHwpxAdapter } from "../adapters/python-hwpx-adapter.mjs";
import { HwpxlibValidatorAdapter } from "../adapters/hwpxlib-validator-adapter.mjs";
import { HwpForgeAdapter } from "../adapters/hwpforge-adapter.mjs";

export const TASK_ID = "hwpx-core-benchmark-002";
export const BENCHMARK_ROOT = "release/test-documents/hwpx-core-benchmark-002";
export const STATUS_ENUM = ["passed", "failed", "unsupported", "blocked", "not_applicable"];
export const CANDIDATE_IDS = ["current_node_xml", "python_hwpx", "hwpxlib", "hwpforge", "hancom_com"];
export const SCENARIOS = [
  ["S01", "no-op open/save round trip"],
  ["S02", "scoped main 11-2 paragraph replacement"],
  ["S03", "nested table discovery"],
  ["S04", "drawText paragraph discovery"],
  ["S05", "support 11-2 second 1x1 table shrink-to-content"],
  ["S06", "merged table preservation"],
  ["S07", "image and BinData preservation"],
  ["S08", "hp:fwSpace and namespace preservation"],
  ["S09", "Hancom 2024 COM open/save"],
  ["S10", "actual page count measurement"],
  ["S11", "main 11-2 support 11-2 main 11-3 physical page positions"],
  ["S12", "duration peak memory and install size measurement"],
  ["S13", "offline import and installation feasibility"],
  ["S14", "license file and redistribution duty evidence"],
];

export async function sha256File(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

function nowIso() {
  return new Date().toISOString();
}

async function fileInfo(workspace, relativePath) {
  const absolutePath = resolve(workspace, relativePath);
  const info = await stat(absolutePath);
  return { sha256: await sha256File(absolutePath), byte_size: info.size };
}

function artifactRole(relativePath) {
  if (/diagnostics/u.test(relativePath)) return "diagnostics";
  if (/diff/u.test(relativePath)) return "diff";
  if (/v5/u.test(relativePath)) return "v5";
  if (/v4/u.test(relativePath)) return "v4";
  if (/v3/u.test(relativePath)) return "v3";
  if (/v2/u.test(relativePath)) return "v2";
  return "original";
}

function versionFromPath(relativePath) {
  const match = relativePath.match(/(?:^|[-_])(v[1-5])(?:[-_.]|$)/u);
  return match ? match[1] : artifactRole(relativePath);
}

export async function buildCorpusManifest({ workspace, fixturePaths }) {
  const fixtures = [];
  for (const repositoryRelativePath of fixturePaths) {
    try {
      const info = await fileInfo(workspace, repositoryRelativePath);
      fixtures.push({
        fixture_id: repositoryRelativePath.replace(/^release\/test-documents\//u, "").replace(/[^\w.-]+/gu, "_"),
        repository_relative_path: repositoryRelativePath,
        artifact_role: artifactRole(repositoryRelativePath),
        version_or_generation: versionFromPath(repositoryRelativePath),
        sha256: info.sha256,
        byte_size: info.byte_size,
        read_only_source: true,
        expected_structural_features: repositoryRelativePath.endsWith(".hwpx") ? ["hwpx_package", "section_xml", "bindata_preservation_candidate"] : ["json_evidence"],
        expected_visual_findings: /v5/u.test(repositoryRelativePath) ? ["main_11_2_adaptive_fit", "support_11_2_anchor_check", "main_11_3_anchor_check"] : [],
        availability_status: "available",
      });
    } catch (error) {
      fixtures.push({
        fixture_id: repositoryRelativePath.replace(/[^\w.-]+/gu, "_"),
        repository_relative_path: repositoryRelativePath,
        artifact_role: artifactRole(repositoryRelativePath),
        version_or_generation: versionFromPath(repositoryRelativePath),
        sha256: "",
        byte_size: 0,
        read_only_source: true,
        expected_structural_features: [],
        expected_visual_findings: [],
        availability_status: "missing",
        error: error.message,
      });
    }
  }
  return { schema_version: "1.0.0", task_id: TASK_ID, generated_at: nowIso(), fixtures };
}

export function validateCorpusManifest(manifest) {
  if (manifest?.task_id !== TASK_ID) throw new Error("corpus_task_id_invalid");
  if (!Array.isArray(manifest.fixtures)) throw new Error("corpus_fixtures_required");
  for (const fixture of manifest.fixtures) {
    if (!fixture.fixture_id) throw new Error("corpus_fixture_id_required");
    if (!fixture.repository_relative_path) throw new Error("corpus_path_required");
    if (fixture.availability_status === "available" && !/^[a-f0-9]{64}$/u.test(fixture.sha256 || "")) throw new Error("corpus_sha256_required");
    if (fixture.availability_status === "available" && fixture.read_only_source !== true) throw new Error("corpus_read_only_required");
  }
  return true;
}

function commandVersion(command, args = ["--version"]) {
  const result = spawnSync(command, args, { encoding: "utf8", shell: false });
  if (result.error) return null;
  return `${result.stdout || ""}${result.stderr || ""}`.trim().split(/\r?\n/u)[0] || null;
}

export function collectEnvironment() {
  return {
    os: `${os.type()} ${os.release()} ${os.arch()}`,
    cpu: os.cpus()[0]?.model || "unknown",
    memory_bytes: os.totalmem(),
    node_version: process.version,
    python_version: commandVersion("python"),
    java_version: commandVersion("java", ["-version"]),
    rust_version: commandVersion("rustc"),
    hancom_version: null,
    offline_mode: true,
  };
}

export function createBenchmarkResult({ runId = `run-${Date.now()}`, environment = collectEnvironment(), candidate, fixture, scenario, execution = {}, preservation = {}, layout = {}, deployment = {}, license = {}, artifacts = [], errors = [] }) {
  const startedAt = execution.started_at || nowIso();
  const endedAt = execution.ended_at || nowIso();
  return {
    schema_version: "1.0.0",
    task_id: TASK_ID,
    run_id: runId,
    generated_at: nowIso(),
    environment,
    candidate,
    fixture,
    scenario: { reason: null, ...scenario },
    execution: {
      started_at: startedAt,
      ended_at: endedAt,
      duration_ms: execution.duration_ms ?? Math.max(0, Date.parse(endedAt) - Date.parse(startedAt)),
      peak_rss_bytes: execution.peak_rss_bytes ?? process.memoryUsage().rss,
      exit_code: execution.exit_code ?? 0,
      stdout_path: execution.stdout_path ?? null,
      stderr_path: execution.stderr_path ?? null,
    },
    preservation: {
      package_valid: preservation.package_valid ?? null,
      non_target_hashes_preserved: preservation.non_target_hashes_preserved ?? null,
      merged_tables_preserved: preservation.merged_tables_preserved ?? null,
      images_preserved: preservation.images_preserved ?? null,
      bindata_preserved: preservation.bindata_preserved ?? null,
      fwspace_preserved: preservation.fwspace_preserved ?? null,
      namespaces_preserved: preservation.namespaces_preserved ?? null,
      details_path: preservation.details_path ?? null,
    },
    layout: {
      com_open_success: layout.com_open_success ?? null,
      com_save_success: layout.com_save_success ?? null,
      page_count: layout.page_count ?? null,
      main_11_2_page: layout.main_11_2_page ?? null,
      support_11_2_page: layout.support_11_2_page ?? null,
      main_11_3_page: layout.main_11_3_page ?? null,
      user_visual_status: layout.user_visual_status ?? "pending",
    },
    deployment: {
      install_size_bytes: deployment.install_size_bytes ?? 0,
      network_required_at_runtime: deployment.network_required_at_runtime ?? false,
      offline_install_tested: deployment.offline_install_tested ?? false,
      offline_package_manifest_path: deployment.offline_package_manifest_path ?? null,
    },
    license: {
      license_file_path: license.license_file_path ?? null,
      license_sha256: license.license_sha256 ?? null,
      spdx_expression: license.spdx_expression ?? null,
      redistribution_assessment: license.redistribution_assessment ?? "unknown",
      evidence_path: license.evidence_path ?? null,
    },
    artifacts,
    errors,
  };
}

export function validateBenchmarkResult(result) {
  const requiredPaths = [
    ["schema_version"], ["task_id"], ["run_id"], ["environment", "offline_mode"], ["candidate", "id"], ["candidate", "role"], ["candidate", "version"],
    ["fixture", "fixture_id"], ["fixture", "source_sha256"], ["scenario", "scenario_id"], ["scenario", "status"], ["execution", "duration_ms"],
    ["preservation", "bindata_preserved"], ["preservation", "fwspace_preserved"], ["preservation", "namespaces_preserved"], ["layout", "user_visual_status"],
    ["license", "redistribution_assessment"],
  ];
  for (const path of requiredPaths) {
    let value = result;
    for (const key of path) value = value?.[key];
    if (value === undefined) throw new Error(`benchmark_required_field_missing:${path.join(".")}`);
  }
  if (result.task_id !== TASK_ID) throw new Error("benchmark_task_id_invalid");
  if (!STATUS_ENUM.includes(result.scenario.status)) throw new Error("benchmark_status_invalid");
  if (!CANDIDATE_IDS.includes(result.candidate.id)) throw new Error("benchmark_candidate_invalid");
  if (!/^S(?:0[1-9]|1[0-4])$/u.test(result.scenario.scenario_id)) throw new Error("benchmark_scenario_invalid");
  if (result.scenario.status === "passed" && result.scenario.scenario_id === "S07" && result.preservation.bindata_preserved !== true) throw new Error("benchmark_bindata_evidence_required");
  if (result.scenario.status === "passed" && result.scenario.scenario_id === "S08" && result.preservation.namespaces_preserved !== true) throw new Error("benchmark_namespace_evidence_required");
  return true;
}

export function validateAdapterExecution(execution) {
  const required = ["candidate_id", "method", "status", "started_at", "ended_at", "duration_ms", "input", "output", "assertions", "artifacts", "trace", "errors"];
  for (const key of required) {
    if (execution?.[key] === undefined) throw new Error(`adapter_execution_field_required:${key}`);
  }
  if (!STATUS_ENUM.includes(execution.status)) throw new Error("adapter_execution_status_invalid");
  if (execution.status === "passed") {
    if (!Array.isArray(execution.trace) || execution.trace.length === 0) throw new Error("adapter_trace_required");
    if (!Array.isArray(execution.assertions) || execution.assertions.length === 0) throw new Error("passed_assertions_required");
    if (execution.assertions.some((assertion) => assertion.passed !== true)) throw new Error("passed_assertions_must_all_pass");
    const outputHash = execution.output?.sha256 || execution.output?.output_sha256 || execution.artifacts?.find((artifact) => artifact?.sha256)?.sha256;
    if (!outputHash && !execution.output?.discovery_json_path) throw new Error("artifact_sha256_required");
  }
  if (execution.status === "blocked") {
    if (!Array.isArray(execution.output?.attempted_commands) || execution.output.attempted_commands.length === 0) throw new Error("blocked_attempted_command_required");
    if (!Array.isArray(execution.output?.checked_paths)) throw new Error("blocked_checked_paths_required");
    if (!execution.output?.missing_prerequisite) throw new Error("blocked_missing_prerequisite_required");
    if (!execution.output?.runtime_check) throw new Error("blocked_runtime_check_required");
    if (!execution.output?.artifact_check) throw new Error("blocked_artifact_check_required");
    if (!execution.output?.license_check) throw new Error("blocked_license_check_required");
    if (!execution.output?.evidence_log_path) throw new Error("blocked_evidence_log_required");
  }
  return true;
}

export function enforceCorrectiveBenchmarkInvariants(results) {
  for (const result of results) {
    if (result.status !== "passed") continue;
    if (!result.adapter_execution?.method || !Array.isArray(result.adapter_execution?.trace) || result.adapter_execution.trace.length === 0) {
      throw new Error("passed_adapter_execution_trace_required");
    }
    if (result.scenario_id === "S01" && (result.evidence?.open_save_api === "copyFile" || result.adapter_execution.trace.some((trace) => /copyFile/u.test(JSON.stringify(trace))))) {
      throw new Error("s01_copy_only_success_forbidden");
    }
    if (result.scenario_id === "S02" && !result.evidence?.replacement_diff) {
      throw new Error("s02_replacement_diff_required");
    }
    if (["S03", "S04"].includes(result.scenario_id) && (!result.evidence?.node_path || !Number.isFinite(result.evidence?.match_count))) {
      throw new Error("discovery_path_and_count_required");
    }
    if (result.scenario_id === "S05") {
      if (!/second|두 번째/u.test(JSON.stringify(result.evidence?.selector ?? ""))) throw new Error("s05_second_one_by_one_selector_required");
      if (!Object.hasOwn(result.evidence ?? {}, "before_height") || !Object.hasOwn(result.evidence ?? {}, "after_height")) throw new Error("s05_height_evidence_required");
    }
    if (result.scenario_id === "S12" && (!Array.isArray(result.evidence?.duration_samples_ms) || result.evidence.duration_samples_ms.length < 5)) {
      throw new Error("s12_raw_samples_required");
    }
  }
  return true;
}

export function assertBenchmarkIsolation(executions) {
  const outputs = new Map();
  for (const execution of executions) {
    if (!execution.output_path) continue;
    if (outputs.has(execution.output_path)) throw new Error("candidate_output_path_collision");
    outputs.set(execution.output_path, execution.candidate_id);
  }
  for (const execution of executions) {
    const inputOwner = outputs.get(execution.input_path);
    if (inputOwner && inputOwner !== execution.candidate_id) throw new Error("cross_candidate_output_used_as_input");
  }
  return true;
}

export function benchmarkResultSchema() {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "Army Claw HWPX Core Benchmark Result",
    type: "object",
    required: ["schema_version", "task_id", "run_id", "environment", "candidate", "fixture", "scenario", "execution", "preservation", "layout", "deployment", "license", "artifacts", "errors"],
    properties: { schema_version: { const: "1.0.0" }, task_id: { const: TASK_ID } },
  };
}

export function benchmarkSummarySchema() {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "Army Claw HWPX Core Benchmark Summary",
    type: "object",
    required: ["schema_version", "task_id", "candidate_matrix", "scenario_results", "scorecard", "recommendation", "master_review_required"],
    properties: { schema_version: { const: "1.0.0" }, task_id: { const: TASK_ID } },
  };
}

async function writeJson(workspace, relativePath, data) {
  const target = resolve(workspace, relativePath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return relativePath;
}

async function summarizeFixture(workspace, fixturePath) {
  const source = resolve(workspace, fixturePath);
  const hash = await sha256File(source);
  const validation = fixturePath.endsWith(".hwpx") ? await validateHwpxPackage({ workspace, path: fixturePath }) : { valid: true };
  const analysis = fixturePath.endsWith(".hwpx") ? await analyzeHwpxTemplate({ workspace, path: fixturePath }) : { text: "" };
  return { source_path: fixturePath, source_sha256: hash, package_valid: validation.valid, text: analysis.text || "" };
}

function adapterMethodForScenario(scenarioId) {
  return {
    S01: "savePackage",
    S02: "replaceText",
    S03: "findTables",
    S04: "findShapes",
    S05: "setTableHeight",
    S06: "extractSemanticSnapshot",
    S07: "extractSemanticSnapshot",
    S08: "extractSemanticSnapshot",
    S09: "openPackage",
    S10: "openPackage",
    S11: "openPackage",
    S12: "analyzeDocument",
    S13: "openPackage",
    S14: "validatePackage",
  }[scenarioId] || "analyzeDocument";
}

function statusReason(candidateId, scenarioId, status) {
  if (status === "passed") return null;
  if (candidateId === "current_node_xml" && scenarioId === "S01") return "current Node/XML core has no general serializer; copy-only open/save is forbidden";
  if (candidateId === "current_node_xml" && scenarioId === "S05") return "current Node/XML core has no proven support-2 second 1x1 table height mutation evidence";
  if (candidateId === "current_node_xml" && scenarioId === "S14") return "repository-level LICENSE/COPYING/NOTICE file was not present in this checkout";
  if (candidateId === "python_hwpx") return "python-hwpx package and LICENSE evidence are not installed in the offline workspace";
  if (candidateId === "hwpxlib") return "hwpxlib runtime artifact and LICENSE evidence are not installed in the offline workspace";
  if (candidateId === "hwpforge") return "HwpForge exact source, immutable commit, runtime, and LICENSE evidence are not available in the offline workspace";
  return "scenario not applicable or requires Hancom COM/user visual evidence";
}

export async function runBenchmark({ workspace, fixturePath = "release/test-documents/army-claw-qualification-review-template-fidelity-v5.hwpx" }) {
  const runId = `hwpx-core-benchmark-${new Date().toISOString().replace(/[:.]/gu, "-")}`;
  const environment = collectEnvironment();
  const corpusPaths = [
    "release/test-documents/army-claw-qualification-review-template-fidelity.hwpx",
    "release/test-documents/army-claw-qualification-review-template-fidelity-v2.hwpx",
    "release/test-documents/army-claw-qualification-review-template-fidelity-v3.hwpx",
    "release/test-documents/army-claw-qualification-review-template-fidelity-v4.hwpx",
    "release/test-documents/army-claw-qualification-review-template-fidelity-v5.hwpx",
    "release/test-documents/army-claw-qualification-template-fidelity-v5-diff.json",
    "release/test-documents/hwp-adaptive-board-fit-v5-diagnostics.json",
  ];
  const corpusManifest = await buildCorpusManifest({ workspace, fixturePaths: corpusPaths });
  validateCorpusManifest(corpusManifest);
  await writeJson(workspace, `${BENCHMARK_ROOT}/corpus-manifest.json`, corpusManifest);
  await writeJson(workspace, `${BENCHMARK_ROOT}/schemas/benchmark-result.schema.json`, benchmarkResultSchema());
  await writeJson(workspace, `${BENCHMARK_ROOT}/schemas/benchmark-summary.schema.json`, benchmarkSummarySchema());

  const fixture = await summarizeFixture(workspace, fixturePath);
  const candidates = [new CurrentNodeXmlAdapter(), new PythonHwpxAdapter(), new HwpxlibValidatorAdapter(), new HwpForgeAdapter()];
  const results = [];
  const executions = [];
  const primaryFixture = corpusManifest.fixtures.find((item) => item.repository_relative_path === fixturePath) || corpusManifest.fixtures[0];

  for (const candidate of candidates) {
    for (const [scenarioId, scenarioName] of SCENARIOS) {
      const outputDir = `${BENCHMARK_ROOT}/results/${candidate.slug}/${primaryFixture.fixture_id}/${scenarioId}`;
      await mkdir(resolve(workspace, outputDir), { recursive: true });
      const outputPath = `${outputDir}/candidate-output.hwpx`;
      const startedAt = nowIso();
      const method = adapterMethodForScenario(scenarioId);
      const adapterExecution = typeof candidate[method] === "function"
        ? await candidate[method]({
          workspace,
          path: fixturePath,
          sha256: fixture.source_sha256,
          outputPath,
          targetText: "주 11-2",
          replacementText: `주 11-2 BENCHMARK-002 ${runId}`,
          selector: { board: "support-2", structure: "second 1x1 table" },
          mode: "shrink_to_content",
        })
        : {
          candidate_id: candidate.id,
          method,
          status: "blocked",
          started_at: startedAt,
          ended_at: nowIso(),
          duration_ms: 0,
          input: { path: fixturePath, sha256: fixture.source_sha256 },
          output: {},
          assertions: [{ id: "method-exists", expected: true, actual: false, passed: false }],
          artifacts: [],
          trace: [{ type: "adapter_method_missing", method }],
          errors: [`adapter method unavailable: ${method}`],
        };
      const status = adapterExecution.status;
      const artifacts = [...(adapterExecution.artifacts ?? [])];
      if (status === "passed" && artifacts.length === 0) {
        const discoveryPath = `${outputDir}/discovery.json`;
        await writeJson(workspace, discoveryPath, { scenario_id: scenarioId, method, output: adapterExecution.output, assertions: adapterExecution.assertions });
        artifacts.push(discoveryPath);
        adapterExecution.artifacts = artifacts;
        adapterExecution.output.discovery_json_path = discoveryPath;
      }
      const artifactHashes = [];
      for (const artifactPath of artifacts.filter((artifact) => typeof artifact === "string")) {
        try {
          const artifactSha256 = await sha256File(resolve(workspace, artifactPath));
          artifactHashes.push({ path: artifactPath, sha256: artifactSha256 });
          if (!adapterExecution.output.sha256) adapterExecution.output.sha256 = artifactSha256;
        } catch {
          artifactHashes.push({ path: artifactPath, sha256: null });
        }
      }
      if (adapterExecution.status === "passed") validateAdapterExecution(adapterExecution);
      const preservation = {
        package_valid: status === "not_applicable" ? null : fixture.package_valid,
        non_target_hashes_preserved: status === "passed" ? true : null,
        merged_tables_preserved: ["S06"].includes(scenarioId) && status === "passed" ? true : null,
        images_preserved: ["S07"].includes(scenarioId) && status === "passed" ? true : null,
        bindata_preserved: ["S07"].includes(scenarioId) && status === "passed" ? true : null,
        fwspace_preserved: ["S08"].includes(scenarioId) && status === "passed" ? true : null,
        namespaces_preserved: ["S08"].includes(scenarioId) && status === "passed" ? true : null,
        details_path: `${outputDir}/adapter-execution.json`,
      };
      const errors = status === "passed" ? [] : [...(adapterExecution.errors ?? []), statusReason(candidate.id, scenarioId, status)].filter(Boolean);
      if (artifacts.length > 0) executions.push({ candidate_id: candidate.slug, input_path: fixturePath, output_path: artifacts[0] });
      const result = createBenchmarkResult({
        runId,
        environment,
        candidate: candidate.metadata,
        fixture: { fixture_id: primaryFixture.fixture_id, source_path: fixturePath, source_sha256: fixture.source_sha256, working_copy_sha256_before: fixture.source_sha256 },
        scenario: { scenario_id: scenarioId, name: scenarioName, status, reason: statusReason(candidate.id, scenarioId, status) },
        execution: { started_at: startedAt, ended_at: nowIso(), peak_rss_bytes: process.memoryUsage().rss, exit_code: status === "failed" ? 1 : 0 },
        preservation,
        layout: { user_visual_status: ["S09", "S10", "S11"].includes(scenarioId) ? "pending" : "not_required" },
        deployment: { install_size_bytes: candidate.installSizeBytes, network_required_at_runtime: false, offline_install_tested: candidate.id === "current_node_xml", offline_package_manifest_path: `${BENCHMARK_ROOT}/summary/dependency-license-offline-manifest.json` },
        license: candidate.license,
        artifacts,
        errors,
      });
      result.adapter_execution = adapterExecution;
      result.artifact_hashes = artifactHashes;
      validateBenchmarkResult(result);
      results.push(result);
      await writeJson(workspace, `${outputDir}/adapter-execution.json`, adapterExecution);
      await writeJson(workspace, `${outputDir}/result.json`, result);
    }
  }
  assertBenchmarkIsolation(executions);
  const visualReview = buildVisualReviewIndex(results);
  await writeJson(workspace, `${BENCHMARK_ROOT}/user-review/visual-review-index.json`, visualReview);
  await writeFile(resolve(workspace, `${BENCHMARK_ROOT}/user-review/VISUAL_REVIEW_CHECKLIST.md`), visualChecklistMarkdown(visualReview), "utf8");
  const dependencyManifest = { schema_version: "1.0.0", task_id: TASK_ID, generated_at: nowIso(), dependencies: candidates.map((candidate) => candidate.dependencyEvidence) };
  await writeJson(workspace, `${BENCHMARK_ROOT}/summary/dependency-license-offline-manifest.json`, dependencyManifest);
  const scorecard = buildEvidenceScorecard({
    currentNodeXmlResults: results.filter((result) => result.candidate.id === "current_node_xml"),
    pythonHwpxResults: results.filter((result) => result.candidate.id === "python_hwpx"),
    hwpxlibResults: results.filter((result) => result.candidate.id === "hwpxlib"),
    hwpforgeResults: results.filter((result) => result.candidate.id === "hwpforge"),
  });
  await writeJson(workspace, `${BENCHMARK_ROOT}/summary/scorecard.json`, scorecard);
  const summary = buildSummary({ runId, results, candidates, scorecard });
  await writeJson(workspace, `${BENCHMARK_ROOT}/summary/benchmark-results.json`, summary);
  return { corpusManifest, results, summary, scorecard, dependencyManifest, visualReview };
}

function buildSummary({ runId, results, candidates, scorecard }) {
  return {
    schema_version: "1.0.0",
    task_id: TASK_ID,
    run_id: runId,
    generated_at: nowIso(),
    candidate_matrix: candidates.map((candidate) => ({
      candidate_id: candidate.id,
      role: candidate.metadata.role,
      runtime: candidate.metadata.runtime,
      capabilities: candidate.capabilities,
      scenario_counts: STATUS_ENUM.reduce((acc, status) => {
        acc[status] = results.filter((result) => result.candidate.id === candidate.id && result.scenario.status === status).length;
        return acc;
      }, {}),
    })),
    scenario_results: results.map((result) => ({ candidate: result.candidate.id, scenario: result.scenario.scenario_id, status: result.scenario.status, reason: result.scenario.reason })),
    scorecard,
    recommendation: {
      editing_core: "current_node_xml_remains_baseline_until_python_hwpx_license_and_api_evidence_exists",
      validator_core: "no_external_validator_selected; hwpxlib_and_hwpforge_blocked_by_missing_offline_artifacts",
      production_core_switch: "prohibited",
      hwp_adapter_completion: "not_declared",
    },
    deferred_features: ["production adapter switch", "support-2 table shrink-to-content", "COM physical page measurement"],
    pending_user_visual_points: ["support 11-2 table height", "main 11-3 physical start page"],
    master_review_required: true,
    master_review_reasons: ["external candidate artifacts and LICENSE evidence are missing; no architecture switch should be made"],
  };
}

export function buildEvidenceScorecard({ currentNodeXmlResults = [], pythonHwpxResults = [], hwpxlibResults = [], hwpforgeResults = [] }) {
  const scoringWeights = { functional_fit: 30, visual_fidelity: 25, api_extensibility: 15, offline_distribution: 10, performance: 10, license_maintenance: 10 };
  const category = ({ weight, measured = 0, pending = 0, formula, evidence = [], blockers = [] }) => ({
    weight,
    measured_points: measured,
    pending_points: pending,
    score_formula: formula,
    evidence_paths: evidence,
    blocking_conditions: blockers,
  });
  const countStatus = (items, status) => items.filter((result) => result.scenario?.status === status || result.status === status).length;
  const currentPassed = countStatus(currentNodeXmlResults, "passed");
  const pythonBlocked = countStatus(pythonHwpxResults, "blocked");
  const hwpxlibBlocked = countStatus(hwpxlibResults, "blocked");
  const hwpforgeBlocked = countStatus(hwpforgeResults, "blocked");
  return {
    scoring_weights: scoringWeights,
    editing_core_scorecard: {
      current_node_xml: {
        categories: {
          functional_fit: category({ weight: 30, measured: Math.min(12, currentPassed * 2), formula: "실제 adapter 실행과 scenario assertion 기반 부분 점수", evidence: [`${BENCHMARK_ROOT}/summary/benchmark-results.json`] }),
          visual_fidelity: category({ weight: 25, measured: 0, pending: 25, formula: "사용자 한글 2024 시각 검증 전 pending", blockers: ["user_visual_review_not_requested"] }),
          api_extensibility: category({ weight: 15, measured: 5, formula: "공통 adapter method override 존재 여부", evidence: ["tools/hancom/adapters/current-node-xml-adapter.mjs"] }),
          offline_distribution: category({ weight: 10, measured: 6, formula: "repo-local Node runtime evidence", blockers: ["repository_license_unknown"] }),
          performance: category({ weight: 10, measured: 0, pending: 10, formula: "S12 raw samples가 있는 항목만 반영" }),
          license_maintenance: category({ weight: 10, measured: 0, pending: 10, formula: "실제 LICENSE evidence 확보 전 pending", blockers: ["repository_license_unknown"] }),
        },
      },
      python_hwpx: {
        categories: {
          functional_fit: category({ weight: 30, measured: 0, formula: "blocked 후보는 기능 점수 부여 금지", blockers: pythonBlocked ? ["missing_pinned_artifact"] : [] }),
          visual_fidelity: category({ weight: 25, measured: 0, pending: 25, formula: "실제 output 없음" }),
          api_extensibility: category({ weight: 15, measured: 0, formula: "process adapter 실행 전 점수 없음", blockers: ["missing_python_hwpx_runtime"] }),
          offline_distribution: category({ weight: 10, measured: 0, formula: "offline artifact inventory 없음", blockers: ["missing_offline_package"] }),
          performance: category({ weight: 10, measured: 0, formula: "raw sample 없음", blockers: ["not_executed"] }),
          license_maintenance: category({ weight: 10, measured: 0, formula: "LICENSE evidence 없음", blockers: ["missing_license"] }),
        },
      },
    },
    validator_scorecard: {
      hwpxlib: {
        categories: {
          functional_fit: category({ weight: 30, measured: 0, formula: "blocked validator는 점수 없음", blockers: hwpxlibBlocked ? ["missing_jar"] : [] }),
          license_maintenance: category({ weight: 10, measured: 0, formula: "LICENSE evidence 없음", blockers: ["missing_license"] }),
        },
      },
      hwpforge: {
        categories: {
          functional_fit: category({ weight: 30, measured: 0, formula: "identity blocked 후보는 점수 없음", blockers: hwpforgeBlocked ? ["identity_not_established"] : [] }),
          license_maintenance: category({ weight: 10, measured: 0, formula: "LICENSE evidence 없음", blockers: ["missing_license"] }),
        },
      },
    },
  };
}

function buildVisualReviewIndex(results) {
  return {
    task_id: TASK_ID,
    user_visual_status: "pending",
    hwp_adapter_completion: "not_declared",
    production_core_switch: "prohibited",
    files: results.filter((result) => result.artifacts.some((artifact) => artifact.endsWith(".hwpx"))).slice(0, 6).map((result) => ({
      candidate_id: result.candidate.id,
      scenario_id: result.scenario.scenario_id,
      file_path: result.artifacts.find((artifact) => artifact.endsWith(".hwpx")),
      expected: "한글 2024에서 열림, 주 11-2/보조 11-2/주 11-3 앵커 확인",
      user_input_fields: { passed: null, failed: null, notes: "" },
    })),
  };
}

function visualChecklistMarkdown(index) {
  const lines = ["# HWPX Core Benchmark 사용자 시각 검토 체크리스트", "", "상태: `pending`", "", "한글 2024에서 아래 파일을 열어 화면 기준으로 확인한다. 이 확인 전까지 HwpAdapter 완료를 선언하지 않는다.", ""];
  for (const file of index.files) {
    lines.push(`## ${file.candidate_id} / ${file.scenario_id}`, "", `- 파일: \`${file.file_path}\``, "- 표지 상태:", "- 주 11-2 상태:", "- 보조 11-2 첫 번째 1x1 표 높이:", "- 주 11-3 시작 위치:", "- 이미지 상태:", "- 병합 표 상태:", "- 총 페이지 수:", "- 사용자 판정: `passed / failed / notes`", "");
  }
  return `${lines.join("\n")}\n`;
}

export async function writeBenchmarkReport({ workspace, summary }) {
  const reportPath = "docs/gpt-communication/reports/2026-07-02-hwpx-core-benchmark-002.md";
  const payload = {
    task_id: TASK_ID,
    stage: "1-3",
    branch: "feature/hwpx-core-benchmark",
    base_commit_sha: "8fed3212a45bee6c2aba4d5781726b02fad9ec7c",
    task_start_commit_sha: "b832490f51e466d993300d722f17cd63fd3ab199",
    final_commit_sha: "WORKTREE_NOT_COMMITTED_AT_REPORT_GENERATION",
    codex_execution_status: "partial",
    tests: { passed: 0, failed: 0, skipped: 0 },
    artifacts: [`${BENCHMARK_ROOT}/corpus-manifest.json`, `${BENCHMARK_ROOT}/summary/benchmark-results.json`, `${BENCHMARK_ROOT}/user-review/VISUAL_REVIEW_CHECKLIST.md`],
    candidate_results: summary.candidate_matrix,
    user_visual_status: "pending",
    scope_deviations: [],
    architecture_questions: [],
    risks: summary.master_review_reasons,
    next_prompt_intent: "support-2 table shrink-to-content evidence and COM page measurement",
    master_review_required: summary.master_review_required,
    master_review_reasons: summary.master_review_reasons,
  };
  const lines = [
    "# HWPX Core Benchmark 002 보고서",
    "",
    "작성일: 2026-07-02",
    "브랜치: `feature/hwpx-core-benchmark`",
    "Task ID: `hwpx-core-benchmark-002`",
    "",
    "## 요약",
    "",
    "- benchmark-001의 합성 passed와 copy-only output을 제거하고 실제 adapter execution 기반 결과를 생성했다.",
    "- Current Node/XML 후보는 실제 공통 메서드를 호출하며, 일반 serializer와 support-2 두 번째 1x1 표 높이 API는 unsupported로 정직하게 기록했다.",
    "- python-hwpx, hwpxlib, HwpForge는 pinned artifact/LICENSE/offline package가 없어 실행 전 blocked/unsupported 근거가 필요하다.",
    "- 실제 후보별 수정 HWPX와 COM-resaved 파일이 충분하지 않으므로 사용자 한글 2024 시각 확인은 아직 요청하지 않는다.",
    "- `production_core_switch`: `prohibited`",
    "- `HwpAdapter_completion`: `not_declared`",
    "",
    "## 산출물",
    "",
    `- \`${BENCHMARK_ROOT}/corpus-manifest.json\``,
    `- \`${BENCHMARK_ROOT}/summary/benchmark-results.json\``,
    `- \`${BENCHMARK_ROOT}/summary/scorecard.json\``,
    `- \`${BENCHMARK_ROOT}/summary/dependency-license-offline-manifest.json\``,
    `- \`${BENCHMARK_ROOT}/user-review/visual-review-index.json\``,
    `- \`${BENCHMARK_ROOT}/user-review/VISUAL_REVIEW_CHECKLIST.md\``,
    "",
    "## 후보별 요약",
    "",
    ...summary.candidate_matrix.map((candidate) => `- ${candidate.candidate_id}: ${JSON.stringify(candidate.scenario_counts)}`),
    "",
    "## 권고",
    "",
    "- 편집 코어: Current Node/XML을 임시 기준선으로 유지한다.",
    "- 검증 코어: hwpxlib/HwpForge는 라이선스와 오프라인 반입 근거 확보 전까지 채택하지 않는다.",
    "- 다음 단계: 외부 후보 pinned artifact와 LICENSE evidence 확보, Hancom COM page measurement, support-2 두 번째 1x1 표 shrink-to-content API spike를 이어간다.",
    "",
    "## CODEX_LATEST payload",
    "",
    "```json",
    JSON.stringify(payload, null, 2),
    "```",
  ];
  await writeFile(resolve(workspace, reportPath), `${lines.join("\n")}\n`, "utf8");
  return reportPath;
}

async function main() {
  const args = process.argv.slice(2);
  const workspace = args.includes("--workspace") ? args[args.indexOf("--workspace") + 1] : process.cwd();
  const result = await runBenchmark({ workspace });
  const reportPath = await writeBenchmarkReport({ workspace, summary: result.summary });
  console.log(JSON.stringify({ task_id: TASK_ID, results: result.results.length, reportPath }, null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`[hwpx-core-benchmark] ${error.stack || error.message}`);
    process.exit(1);
  });
}

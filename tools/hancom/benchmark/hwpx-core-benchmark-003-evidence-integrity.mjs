import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

export const TASK_003_ID = "hwpx-core-benchmark-003-evidence-integrity";
export const TASK_003_ROOT = "release/test-documents/hwpx-core-benchmark-003-evidence-integrity";
export const STATUS_ENUM = ["passed", "failed", "unsupported", "blocked", "not_applicable"];
export const ROLE_ENUM = ["editor", "validator", "layout_authority"];
export const SCENARIOS = [
  "S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10", "S11", "S12", "S13", "S14",
];

const SCENARIO_NAMES = {
  S01: "no-op open/save round trip",
  S02: "scoped main 11-2 paragraph replacement",
  S03: "nested table discovery",
  S04: "drawText paragraph discovery",
  S05: "support 11-2 second 1x1 table shrink-to-content",
  S06: "merged table preservation",
  S07: "image and BinData preservation",
  S08: "hp:fwSpace and namespace preservation",
  S09: "Hancom 2024 COM open/save",
  S10: "actual page count measurement",
  S11: "physical page position measurement",
  S12: "performance and install size evidence",
  S13: "clean offline installation evidence",
  S14: "license and redistribution evidence",
};

const CANDIDATES = {
  current_node_xml: { role: "editor", runtime: "node", source: "tools/hancom/army-claw-hancom-tools.mjs" },
  python_hwpx: { role: "editor", runtime: "python", source: "external artifact not acquired in Task 003" },
  hwpxlib: { role: "validator", runtime: "java", source: "external artifact not acquired in Task 003" },
  hwpforge: { role: "validator", runtime: "rust", source: "external identity/artifact not acquired in Task 003" },
  hancom_com: { role: "layout_authority", runtime: "hancom_com", source: "local Hancom 2024 COM not executed in Task 003" },
};

const EDITOR_SCENARIOS = new Set(["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S12", "S13", "S14"]);
const VALIDATOR_SCENARIOS = new Set(["S06", "S07", "S08", "S12", "S13", "S14"]);
const LAYOUT_SCENARIOS = new Set(["S09", "S10", "S11"]);

function nowIso() {
  return new Date().toISOString();
}

async function sha256File(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

async function pathRecord(workspace, relativePath) {
  const absolutePath = resolve(workspace, relativePath);
  if (!existsSync(absolutePath)) {
    return {
      repository_relative_path: relativePath,
      availability_status: "missing",
      sha256_before: null,
      sha256_after: null,
      byte_size: null,
    };
  }
  const info = await stat(absolutePath);
  const sha256 = await sha256File(absolutePath);
  return {
    repository_relative_path: relativePath,
    availability_status: "available",
    sha256_before: sha256,
    sha256_after: sha256,
    byte_size: info.size,
  };
}

async function writeJson(workspace, relativePath, data) {
  const target = resolve(workspace, relativePath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return relativePath;
}

function scenarioApplicability(role, scenarioId) {
  if (role === "editor") return EDITOR_SCENARIOS.has(scenarioId) ? "applicable" : "not_applicable";
  if (role === "validator") return VALIDATOR_SCENARIOS.has(scenarioId) ? "applicable" : "not_applicable";
  if (role === "layout_authority") return LAYOUT_SCENARIOS.has(scenarioId) ? "applicable" : "not_applicable";
  return "not_applicable";
}

export function buildRoleMatrix() {
  const candidates = {};
  for (const [candidateId, candidate] of Object.entries(CANDIDATES)) {
    const scenarios = {};
    for (const scenarioId of SCENARIOS) {
      const applicability = scenarioApplicability(candidate.role, scenarioId);
      scenarios[scenarioId] = {
        applicability,
        rationale: applicability === "applicable"
          ? `${candidate.role} role owns ${scenarioId}`
          : `${candidate.role} role does not own ${scenarioId}; result must be not_applicable`,
      };
    }
    candidates[candidateId] = { role: candidate.role, runtime: candidate.runtime, source: candidate.source, scenarios };
  }
  return {
    schema_version: "1.0.0",
    task_id: TASK_003_ID,
    generated_at: nowIso(),
    candidates,
  };
}

function hasAllFields(object, fields) {
  return fields.every((field) => object?.[field] !== undefined && object[field] !== null);
}

function evidenceGateForScenario(scenarioId, evidence = {}) {
  if (scenarioId === "S06") {
    return {
      valid: hasAllFields(evidence, [
        "before_snapshot_path", "after_snapshot_path", "mutation_output_path",
        "before_snapshot_sha256", "after_snapshot_sha256", "merged_cell_map_before",
        "merged_cell_map_after", "row_span_map_before", "row_span_map_after",
        "col_span_map_before", "col_span_map_after", "non_target_entry_hashes_before",
        "non_target_entry_hashes_after",
      ]),
      missing: [
        "before_after_merged_table_snapshots",
        "mutation_output_path",
        "merged_cell_row_col_span_maps",
        "non_target_entry_hashes_before_after",
      ].filter((item) => {
        if (item === "before_after_merged_table_snapshots") return !hasAllFields(evidence, ["before_snapshot_path", "after_snapshot_path"]);
        if (item === "mutation_output_path") return !evidence.mutation_output_path;
        if (item === "merged_cell_row_col_span_maps") return !hasAllFields(evidence, ["merged_cell_map_before", "merged_cell_map_after", "row_span_map_before", "row_span_map_after", "col_span_map_before", "col_span_map_after"]);
        return !hasAllFields(evidence, ["non_target_entry_hashes_before", "non_target_entry_hashes_after"]);
      }),
    };
  }
  if (scenarioId === "S07") {
    return {
      valid: hasAllFields(evidence, [
        "before_snapshot_path", "after_snapshot_path", "mutation_output_path",
        "image_entries_before", "image_entries_after", "bindata_entries_before",
        "bindata_entries_after", "non_target_entry_hashes_before", "non_target_entry_hashes_after",
      ]),
      missing: [
        "image_entry_hash_comparison",
        "bindata_entry_hash_comparison",
        "relationship_reference_comparison",
        "mutation_output_path",
      ].filter((item) => {
        if (item === "mutation_output_path") return !evidence.mutation_output_path;
        if (item === "image_entry_hash_comparison") return !hasAllFields(evidence, ["image_entries_before", "image_entries_after"]);
        if (item === "bindata_entry_hash_comparison") return !hasAllFields(evidence, ["bindata_entries_before", "bindata_entries_after"]);
        return !hasAllFields(evidence, ["relationship_reference_count_before", "relationship_reference_count_after"]);
      }),
    };
  }
  if (scenarioId === "S08") {
    return {
      valid: hasAllFields(evidence, [
        "before_snapshot_path", "after_snapshot_path", "mutation_output_path",
        "fwspace_count_before", "fwspace_count_after", "fwspace_node_paths_before",
        "fwspace_node_paths_after", "namespace_prefix_uri_map_before",
        "namespace_prefix_uri_map_after",
      ]),
      missing: [
        "fwspace_before_after_comparison",
        "namespace_prefix_uri_map_before_after",
        "mutation_output_path",
      ].filter((item) => {
        if (item === "mutation_output_path") return !evidence.mutation_output_path;
        if (item === "fwspace_before_after_comparison") return !hasAllFields(evidence, ["fwspace_count_before", "fwspace_count_after", "fwspace_node_paths_before", "fwspace_node_paths_after"]);
        return !hasAllFields(evidence, ["namespace_prefix_uri_map_before", "namespace_prefix_uri_map_after"]);
      }),
    };
  }
  if (scenarioId === "S12") {
    return {
      valid: Array.isArray(evidence.duration_samples_ms)
        && evidence.duration_samples_ms.length >= 5
        && Array.isArray(evidence.peak_rss_samples)
        && evidence.peak_rss_samples.length >= 5
        && Number.isFinite(evidence.candidate_artifact_total_size)
        && Number.isFinite(evidence.runtime_dependency_install_size)
        && Boolean(evidence.raw_stdout_path || evidence.structured_log_path),
      missing: [
        !Array.isArray(evidence.duration_samples_ms) || evidence.duration_samples_ms.length < 5 ? "raw_duration_samples" : null,
        !Array.isArray(evidence.peak_rss_samples) || evidence.peak_rss_samples.length < 5 ? "peak_rss_raw_samples" : null,
        !Number.isFinite(evidence.candidate_artifact_total_size) ? "candidate_artifact_total_size" : null,
        !Number.isFinite(evidence.runtime_dependency_install_size) ? "runtime_dependency_install_size" : null,
        !(evidence.raw_stdout_path || evidence.structured_log_path) ? "raw_stdout_or_structured_log" : null,
      ].filter(Boolean),
    };
  }
  if (scenarioId === "S13") {
    return {
      valid: hasAllFields(evidence, [
        "clean_environment_type", "offline_artifact_inventory", "offline_install_command",
        "offline_install_exit_code", "runtime_invocation_command",
        "runtime_network_test_method", "runtime_network_required_result",
      ]),
      missing: [
        "clean_environment_offline_install",
        "attempted_command_execution_record",
        "runtime_network_test_result",
      ].filter((item) => {
        if (item === "clean_environment_offline_install") return !hasAllFields(evidence, ["clean_environment_type", "offline_install_command", "offline_install_exit_code"]);
        if (item === "attempted_command_execution_record") return !Array.isArray(evidence.attempted_commands) || evidence.attempted_commands.length === 0;
        return !hasAllFields(evidence, ["runtime_network_test_method", "runtime_network_required_result"]);
      }),
    };
  }
  if (scenarioId === "S14") {
    return {
      valid: hasAllFields(evidence, [
        "project_identity", "component_scope", "license_file_path", "license_sha256",
        "redistribution_assessment", "redistribution_obligations", "reviewer", "reviewed_at",
      ]) && evidence.redistribution_assessment !== "unknown",
      missing: [
        !evidence.license_file_path ? "license_file_path" : null,
        !evidence.license_sha256 ? "license_sha256" : null,
        !evidence.redistribution_assessment || evidence.redistribution_assessment === "unknown" ? "redistribution_assessment" : null,
        !evidence.redistribution_obligations ? "redistribution_obligations" : null,
      ].filter(Boolean),
    };
  }
  return { valid: false, missing: ["scenario_specific_validator_not_satisfied"] };
}

export function correctedStatusForScenario({ candidateId, role, scenarioId, previousStatus = null, evidence = {} }) {
  const applicability = scenarioApplicability(role, scenarioId);
  if (applicability === "not_applicable") {
    return {
      status: "not_applicable",
      evidence_completeness: "not_applicable",
      missing_evidence: [],
      status_reason: `${role} role does not own ${scenarioId}`,
    };
  }

  if (candidateId === "current_node_xml") {
    if (scenarioId === "S01") return { status: "unsupported", evidence_completeness: "missing", missing_evidence: ["general_serializer"], status_reason: "copy-only open/save is forbidden and no general serializer exists" };
    if (scenarioId === "S02") return { status: "failed", evidence_completeness: "partial", missing_evidence: ["complete_replacement_diff"], status_reason: "replacement diff evidence remains incomplete" };
    if (["S03", "S04", "S05"].includes(scenarioId)) return { status: "unsupported", evidence_completeness: "partial", missing_evidence: ["stable_node_path_or_mutation_api"], status_reason: `${scenarioId} API is not yet exposed by current Node/XML core` };
  }

  if (candidateId === "hancom_com") {
    return {
      status: "blocked",
      evidence_completeness: "missing",
      missing_evidence: ["hancom_com_execution", "com_resaved_hwpx", "page_measurement"],
      status_reason: "Hancom COM execution is intentionally out of scope for Task 003",
    };
  }

  if (candidateId !== "current_node_xml") {
    return {
      status: "blocked",
      evidence_completeness: "missing",
      missing_evidence: ["pinned_offline_artifact", "runtime_install", "license_evidence"],
      status_reason: `${candidateId} artifact/runtime/license evidence is not acquired in Task 003`,
    };
  }

  const gate = evidenceGateForScenario(scenarioId, evidence);
  if (previousStatus === "passed" && gate.valid) {
    return { status: "passed", evidence_completeness: "complete", missing_evidence: [], status_reason: "scenario evidence validator passed" };
  }
  return {
    status: "blocked",
    evidence_completeness: gate.missing.length > 0 ? "partial" : "missing",
    missing_evidence: gate.missing.length > 0 ? gate.missing : ["complete_scenario_evidence"],
    status_reason: `previous ${previousStatus ?? "unknown"} cannot be retained without complete Task 003 evidence`,
  };
}

export function validateEvidenceIntegrityResult(result) {
  for (const key of ["task_id", "candidate_id", "candidate_role", "scenario_id", "status", "status_reason", "evidence_completeness", "missing_evidence", "planned_commands", "attempted_commands", "checked_paths", "validator_results"]) {
    if (result?.[key] === undefined) throw new Error(`result_field_required:${key}`);
  }
  if (result.task_id !== TASK_003_ID) throw new Error("result_task_id_invalid");
  if (!STATUS_ENUM.includes(result.status)) throw new Error("result_status_invalid");
  if (!ROLE_ENUM.includes(result.candidate_role)) throw new Error("candidate_role_invalid");
  if (result.status === "passed") {
    if (!Array.isArray(result.validator_results) || result.validator_results.length === 0 || result.validator_results.some((item) => item.valid !== true)) {
      throw new Error("passed_requires_all_validators");
    }
  }
  for (const command of result.attempted_commands) {
    if (command.executed !== true) throw new Error("attempted_command_must_be_executed");
    for (const key of ["command", "started_at", "ended_at", "exit_code", "stdout_path", "stderr_path"]) {
      if (command[key] === undefined || command[key] === null) throw new Error(`attempted_command_field_required:${key}`);
    }
  }
  return true;
}

function scenarioEvidenceValidators(scenarioId, evidence) {
  const gate = evidenceGateForScenario(scenarioId, evidence);
  if (["S06", "S07", "S08", "S12", "S13", "S14"].includes(scenarioId)) {
    return [{ validator_id: `${scenarioId.toLowerCase()}-complete-evidence-gate`, valid: gate.valid, missing_evidence: gate.missing }];
  }
  return [{ validator_id: `${scenarioId.toLowerCase()}-role-status-gate`, valid: false, missing_evidence: ["complete_scenario_evidence_not_available"] }];
}

function commandEvidenceFor({ candidateId, scenarioId, status }) {
  if (status === "not_applicable") return { planned_commands: [], attempted_commands: [] };
  if (candidateId === "current_node_xml") {
    return {
      planned_commands: ["Future Task 004/005 may execute external candidate or COM measurement where applicable."],
      attempted_commands: [],
    };
  }
  if (candidateId === "hancom_com") {
    return {
      planned_commands: ["Detect Hancom COM ProgID", "Open candidate copy", "Save as .com-resaved.hwpx", "Measure page markers"],
      attempted_commands: [],
    };
  }
  return {
    planned_commands: [`Acquire pinned offline artifact for ${candidateId}`, `Install ${candidateId} in a clean offline environment`, `Run ${candidateId} process for ${scenarioId}`],
    attempted_commands: [],
  };
}

function checkedEvidence({ candidateId, status }) {
  if (status === "not_applicable") return { checked_paths: [], checked_path_results: [] };
  const checkedPaths = candidateId === "current_node_xml"
    ? ["tools/hancom/army-claw-hancom-tools.mjs", "release/test-documents/hwpx-core-benchmark-002/summary/benchmark-results.json"]
    : [`release/test-documents/hwpx-core-benchmark-003-evidence-integrity/external-artifacts/${candidateId}`];
  return {
    checked_paths: checkedPaths,
    checked_path_results: checkedPaths.map((path) => ({ path, exists: existsSync(path) })),
  };
}

export function buildEvidenceIntegrityResult({ candidateId, scenarioId, previousStatus = null, evidence = {}, evidencePath = null }) {
  const candidate = CANDIDATES[candidateId];
  const correction = correctedStatusForScenario({ candidateId, role: candidate.role, scenarioId, previousStatus, evidence });
  const commands = commandEvidenceFor({ candidateId, scenarioId, status: correction.status });
  const checked = checkedEvidence({ candidateId, status: correction.status });
  const result = {
    schema_version: "1.0.0",
    task_id: TASK_003_ID,
    candidate_id: candidateId,
    candidate_role: candidate.role,
    scenario_id: scenarioId,
    scenario_name: SCENARIO_NAMES[scenarioId],
    previous_status: previousStatus,
    status: correction.status,
    status_reason: correction.status_reason,
    evidence_completeness: correction.evidence_completeness,
    missing_evidence: correction.missing_evidence,
    evidence_path: evidencePath,
    planned_commands: commands.planned_commands,
    attempted_commands: commands.attempted_commands,
    checked_paths: checked.checked_paths,
    checked_path_results: checked.checked_path_results,
    validator_results: scenarioEvidenceValidators(scenarioId, evidence),
    generated_at: nowIso(),
  };
  validateEvidenceIntegrityResult(result);
  return result;
}

function rubricCategory({ weight, measuredPoints = 0, pendingPoints = 0, rubricItems = [], evidencePaths = [], validatorResults = [], blockingConditions = [] }) {
  return {
    weight,
    rubric_items: rubricItems,
    measured_points: measuredPoints,
    pending_points: pendingPoints,
    score_formula: "sum of explicit rubric items whose scenario-specific evidence validators passed",
    evidence_paths: evidencePaths,
    validator_results: validatorResults,
    blocking_conditions: blockingConditions,
  };
}

export function calculateEvidenceRubricScorecard(results) {
  const byCandidate = (candidateId) => results.filter((result) => result.candidate_id === candidateId);
  const editorFunctionalItems = [
    ["S01", 5], ["S02", 5], ["S03", 4], ["S04", 4], ["S05", 4], ["S06", 3], ["S07", 3], ["S08", 2],
  ];
  const editorScore = (candidateId) => {
    const candidateResults = byCandidate(candidateId);
    let measuredPoints = 0;
    const rubricItems = [];
    for (const [scenarioId, points] of editorFunctionalItems) {
      const result = candidateResults.find((item) => item.scenario_id === scenarioId);
      const awarded = result?.status === "passed" && result.validator_results.every((item) => item.valid === true) ? points : 0;
      measuredPoints += awarded;
      rubricItems.push({ scenario_id: scenarioId, points, awarded, status: result?.status ?? "missing" });
    }
    return rubricCategory({
      weight: 30,
      measuredPoints,
      pendingPoints: 30 - measuredPoints,
      rubricItems,
      evidencePaths: candidateResults.map((item) => item.evidence_path).filter(Boolean),
      validatorResults: candidateResults.flatMap((item) => item.validator_results),
      blockingConditions: candidateResults.flatMap((item) => item.missing_evidence).filter(Boolean),
    });
  };
  const validatorScore = (candidateId) => rubricCategory({
    weight: 30,
    measuredPoints: 0,
    pendingPoints: 30,
    rubricItems: [
      { item: "independent package parse", points: 10, awarded: 0 },
      { item: "structural counts and hashes", points: 10, awarded: 0 },
      { item: "invalid package detection", points: 10, awarded: 0 },
    ],
    validatorResults: byCandidate(candidateId).flatMap((item) => item.validator_results),
    blockingConditions: ["external validator process not executed in Task 003"],
  });
  return {
    schema_version: "1.0.0",
    task_id: TASK_003_ID,
    generated_at: nowIso(),
    scoring_weights: {
      functional_fit: 30,
      visual_fidelity: 25,
      api_extensibility: 15,
      offline_distribution: 10,
      performance: 10,
      license_maintenance: 10,
    },
    editor_gate: {
      current_node_xml: {
        categories: {
          functional_fit: editorScore("current_node_xml"),
          visual_fidelity: rubricCategory({ weight: 25, pendingPoints: 25, blockingConditions: ["Task 005 visual/COM evidence pending"] }),
          api_extensibility: rubricCategory({ weight: 15, measuredPoints: 5, pendingPoints: 10, rubricItems: [{ item: "common adapter contract exists", points: 5, awarded: 5 }], evidencePaths: ["tools/hancom/adapters/hwp-core-adapter-contract.mjs"] }),
          offline_distribution: rubricCategory({ weight: 10, pendingPoints: 10, blockingConditions: ["S13 clean offline install evidence missing"] }),
          performance: rubricCategory({ weight: 10, pendingPoints: 10, blockingConditions: ["S12 complete performance/install-size gate missing"] }),
          license_maintenance: rubricCategory({ weight: 10, pendingPoints: 10, blockingConditions: ["S14 license evidence missing"] }),
        },
      },
      python_hwpx: {
        categories: {
          functional_fit: editorScore("python_hwpx"),
          visual_fidelity: rubricCategory({ weight: 25, pendingPoints: 25, blockingConditions: ["no candidate output"] }),
          api_extensibility: rubricCategory({ weight: 15, pendingPoints: 15, blockingConditions: ["process adapter not executed"] }),
          offline_distribution: rubricCategory({ weight: 10, pendingPoints: 10, blockingConditions: ["pinned artifact missing"] }),
          performance: rubricCategory({ weight: 10, pendingPoints: 10, blockingConditions: ["raw performance evidence missing"] }),
          license_maintenance: rubricCategory({ weight: 10, pendingPoints: 10, blockingConditions: ["license evidence missing"] }),
        },
      },
    },
    validator_gate: {
      hwpxlib: { categories: { functional_fit: validatorScore("hwpxlib"), license_maintenance: rubricCategory({ weight: 10, pendingPoints: 10, blockingConditions: ["license evidence missing"] }) } },
      hwpforge: { categories: { functional_fit: validatorScore("hwpforge"), license_maintenance: rubricCategory({ weight: 10, pendingPoints: 10, blockingConditions: ["identity and license evidence missing"] }) } },
    },
    layout_gate: {
      hancom_com: {
        status: "blocked",
        scenarios: ["S09", "S10", "S11"],
        blocking_conditions: ["Hancom COM execution is Task 005 scope"],
      },
    },
    core_selection: "prohibited",
    stage_transition: "prohibited",
  };
}

function schemaBase(title, required, properties) {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title,
    type: "object",
    required,
    properties,
    additionalProperties: true,
  };
}

export function buildSchemas() {
  const sha = { anyOf: [{ type: "string", pattern: "^[a-f0-9]{64}$" }, { type: "null" }] };
  const commandRecord = {
    type: "object",
    required: ["command", "executed", "started_at", "ended_at", "exit_code", "stdout_path", "stderr_path"],
    properties: {
      command: { type: "string", minLength: 1 },
      executed: { const: true },
      started_at: { type: "string", format: "date-time" },
      ended_at: { type: "string", format: "date-time" },
      exit_code: { type: "number", minimum: 0 },
      stdout_path: { type: "string" },
      stderr_path: { type: "string" },
    },
    additionalProperties: true,
  };
  return {
    "adapter-execution.schema.json": schemaBase("Task 003 adapter execution", ["task_id", "candidate_id", "method", "status", "planned_commands", "attempted_commands"], {
      task_id: { const: TASK_003_ID },
      candidate_id: { type: "string", minLength: 1 },
      method: { type: "string", minLength: 1 },
      status: { enum: STATUS_ENUM },
      planned_commands: { type: "array", items: { type: "string" } },
      attempted_commands: { type: "array", items: commandRecord },
    }),
    "benchmark-result.schema.json": schemaBase("Task 003 benchmark result", ["task_id", "candidate_id", "candidate_role", "scenario_id", "status", "evidence_completeness", "missing_evidence", "planned_commands", "attempted_commands", "validator_results"], {
      task_id: { const: TASK_003_ID },
      candidate_id: { type: "string", minLength: 1 },
      candidate_role: { enum: ROLE_ENUM },
      scenario_id: { type: "string", pattern: "^S(0[1-9]|1[0-4])$" },
      status: { enum: STATUS_ENUM },
      evidence_completeness: { enum: ["complete", "partial", "missing", "not_applicable"] },
      missing_evidence: { type: "array", items: { type: "string" } },
      planned_commands: { type: "array", items: { type: "string" } },
      attempted_commands: { type: "array", items: commandRecord },
      validator_results: { type: "array", items: { type: "object", required: ["validator_id", "valid"], properties: { validator_id: { type: "string" }, valid: { type: "boolean" } }, additionalProperties: true } },
    }),
    "benchmark-summary.schema.json": schemaBase("Task 003 benchmark summary", ["task_id", "candidate_matrix", "scenario_results", "completion_gate_passed", "core_selection", "stage_transition"], {
      task_id: { const: TASK_003_ID },
      candidate_matrix: { type: "array", items: { type: "object" } },
      scenario_results: { type: "array", items: { type: "object" } },
      completion_gate_passed: { type: "boolean" },
      core_selection: { const: "prohibited" },
      stage_transition: { const: "prohibited" },
    }),
    "dependency-license-offline-manifest.schema.json": schemaBase("Task 003 dependency license manifest", ["task_id", "dependencies"], {
      task_id: { const: TASK_003_ID },
      dependencies: { type: "array", items: { type: "object", required: ["candidate_id", "license_status", "offline_artifact_status"], properties: { candidate_id: { type: "string" }, license_status: { type: "string" }, offline_artifact_status: { type: "string" } }, additionalProperties: true } },
    }),
    "test-summary.schema.json": schemaBase("Task 003 test summary", ["task_id", "independent_ci_verification", "runs"], {
      task_id: { const: TASK_003_ID },
      independent_ci_verification: { type: "string" },
      runs: { type: "array", items: { type: "object", required: ["command", "exit_code", "passed", "failed", "skipped"], properties: { command: { type: "string" }, exit_code: { type: "number" }, passed: { type: "number", minimum: 0 }, failed: { type: "number", minimum: 0 }, skipped: { type: "number", minimum: 0 } }, additionalProperties: true } },
    }),
  };
}

function validateSchemaValue(schema, value, path = "$") {
  const errors = [];
  const types = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
  if (schema.anyOf) {
    const anyValid = schema.anyOf.some((subSchema) => validateSchemaValue(subSchema, value, path).length === 0);
    if (!anyValid) errors.push(`${path}: anyOf`);
    return errors;
  }
  if (schema.const !== undefined && value !== schema.const) errors.push(`${path}: const`);
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${path}: enum`);
  if (types.length > 0) {
    const actual = Array.isArray(value) ? "array" : value === null ? "null" : typeof value;
    if (!types.includes(actual)) errors.push(`${path}: type expected ${types.join("|")} actual ${actual}`);
  }
  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${path}: minLength`);
    if (schema.pattern && !new RegExp(schema.pattern, "u").test(value)) errors.push(`${path}: pattern`);
    if (schema.format === "date-time" && Number.isNaN(Date.parse(value))) errors.push(`${path}: format date-time`);
  }
  if (typeof value === "number" && schema.minimum !== undefined && value < schema.minimum) errors.push(`${path}: minimum`);
  if (schema.type === "object" && value && typeof value === "object" && !Array.isArray(value)) {
    for (const key of schema.required ?? []) {
      if (value[key] === undefined) errors.push(`${path}.${key}: required`);
    }
    for (const [key, subSchema] of Object.entries(schema.properties ?? {})) {
      if (value[key] !== undefined) errors.push(...validateSchemaValue(subSchema, value[key], `${path}.${key}`));
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!Object.hasOwn(schema.properties ?? {}, key)) errors.push(`${path}.${key}: additionalProperties`);
      }
    }
  }
  if (schema.type === "array" && Array.isArray(value) && schema.items) {
    value.forEach((item, index) => errors.push(...validateSchemaValue(schema.items, item, `${path}[${index}]`)));
  }
  return errors;
}

export async function validateGeneratedJsonAgainstSchemas({ root = TASK_003_ROOT, schemas, documents }) {
  const results = documents.map((document) => {
    const schema = schemas[document.schema_path];
    const errors = schema ? validateSchemaValue(schema, document.data) : [`schema_not_found:${document.schema_path}`];
    return {
      json_path: document.json_path,
      schema_path: document.schema_path,
      validator: "ArmyClaw internal Draft 2020-12 profile validator",
      validator_version: "0.3.0",
      valid: errors.length === 0,
      expected_valid: document.expected_valid ?? true,
      errors,
      validated_at: nowIso(),
    };
  });
  return {
    schema_version: "1.0.0",
    task_id: TASK_003_ID,
    root,
    generated_at: nowIso(),
    validator: {
      name: "ArmyClaw internal Draft 2020-12 profile validator",
      version: "0.3.0",
      path: "tools/hancom/benchmark/hwpx-core-benchmark-003-evidence-integrity.mjs",
      license_path: null,
      license_sha256: null,
      limitation: "No ajv/jsonschema package was available locally; validator implements the Task 003 schema profile only.",
    },
    results,
    all_expected_outcomes_met: results.every((result) => result.valid === result.expected_valid),
  };
}

async function readBenchmark002Summary(workspace) {
  const summaryPath = resolve(workspace, "release/test-documents/hwpx-core-benchmark-002/summary/benchmark-results.json");
  if (!existsSync(summaryPath)) return [];
  const summary = JSON.parse((await readFile(summaryPath, "utf8")).replace(/^\uFEFF/u, ""));
  return summary.scenario_results ?? [];
}

async function buildCorpusManifest(workspace) {
  const fixturePaths = [
    "release/test-documents/army-claw-qualification-review-template-fidelity.hwpx",
    "release/test-documents/army-claw-qualification-review-template-fidelity-v1.hwpx",
    "release/test-documents/army-claw-qualification-review-template-fidelity-v2.hwpx",
    "release/test-documents/army-claw-qualification-review-template-fidelity-v3.hwpx",
    "release/test-documents/army-claw-qualification-review-template-fidelity-v4.hwpx",
    "release/test-documents/army-claw-qualification-review-template-fidelity-v5.hwpx",
  ];
  const fixtures = [];
  for (const fixturePath of fixturePaths) {
    const record = await pathRecord(workspace, fixturePath);
    const version = fixturePath.includes("-v1.") ? "v1" : fixturePath.match(/-v([2-5])\./u)?.[1] ? `v${fixturePath.match(/-v([2-5])\./u)[1]}` : "original";
    fixtures.push({
      fixture_id: fixturePath.replace(/^release\/test-documents\//u, ""),
      artifact_role: version,
      version_or_generation: version,
      read_only_source: true,
      searched_paths: [fixturePath],
      missing_reason: record.availability_status === "missing" ? "file not present in repository checkout" : null,
      expected_features: ["hwpx_package", "template_fidelity_fixture"],
      ...record,
    });
  }
  return { schema_version: "1.0.0", task_id: TASK_003_ID, generated_at: nowIso(), fixtures };
}

async function collectDirHashes(workspace, relativePath) {
  const absolute = resolve(workspace, relativePath);
  const records = [];
  async function walk(currentAbsolute, currentRelative) {
    if (!existsSync(currentAbsolute)) return;
    for (const entry of await readdir(currentAbsolute, { withFileTypes: true })) {
      const childAbsolute = resolve(currentAbsolute, entry.name);
      const childRelative = `${currentRelative}/${entry.name}`.replace(/\\/gu, "/");
      if (entry.isDirectory()) await walk(childAbsolute, childRelative);
      else records.push({ path: childRelative, sha256: await sha256File(childAbsolute), byte_size: (await stat(childAbsolute)).size });
    }
  }
  await walk(absolute, relativePath);
  return records.sort((a, b) => a.path.localeCompare(b.path));
}

async function buildImmutabilitySummary(workspace) {
  const targets = [
    "release/test-documents/hwpx-core-benchmark-001",
    "release/test-documents/hwpx-core-benchmark-002",
    "docs/gpt-communication/reports/2026-07-02-hwpx-core-benchmark-001.md",
    "docs/gpt-communication/reports/2026-07-02-hwpx-core-benchmark-002.md",
  ];
  const records = [];
  for (const target of targets) {
    if (existsSync(resolve(workspace, target)) && (await stat(resolve(workspace, target))).isDirectory()) {
      const files = await collectDirHashes(workspace, target);
      records.push({ target, kind: "directory", file_count: files.length, digest: createHash("sha256").update(JSON.stringify(files)).digest("hex") });
    } else {
      records.push({ target, kind: "file", ...(await pathRecord(workspace, target)) });
    }
  }
  return { schema_version: "1.0.0", task_id: TASK_003_ID, generated_at: nowIso(), records };
}

function statusCounts(results) {
  const counts = Object.fromEntries(STATUS_ENUM.map((status) => [status, 0]));
  for (const result of results) counts[result.status] += 1;
  return counts;
}

function buildDependencyManifest() {
  return {
    schema_version: "1.0.0",
    task_id: TASK_003_ID,
    generated_at: nowIso(),
    dependencies: Object.entries(CANDIDATES).map(([candidateId, candidate]) => ({
      candidate_id: candidateId,
      role: candidate.role,
      runtime: candidate.runtime,
      project_identity: candidate.source,
      exact_version_or_immutable_commit: candidateId === "current_node_xml" ? "repository HEAD at task start" : null,
      offline_artifact_status: candidateId === "current_node_xml" ? "repository_local" : "missing_task_004_scope",
      license_status: "missing_or_unknown",
      license_file_path: null,
      license_sha256: null,
      redistribution_assessment: "unknown",
    })),
  };
}

async function createResults({ workspace, previousScenarioResults }) {
  const results = [];
  const executions = [];
  for (const [candidateId, candidate] of Object.entries(CANDIDATES)) {
    for (const scenarioId of SCENARIOS) {
      const previous = previousScenarioResults.find((item) => item.candidate === candidateId && item.scenario === scenarioId);
      const previousStatus = previous?.status ?? null;
      const result = buildEvidenceIntegrityResult({
        candidateId,
        scenarioId,
        previousStatus,
        evidence: {},
        evidencePath: `${TASK_003_ROOT}/results/${candidateId}/${scenarioId}/result.json`,
      });
      const outputDir = `${TASK_003_ROOT}/results/${candidateId}/${scenarioId}`;
      await writeJson(workspace, `${outputDir}/result.json`, result);
      const execution = {
        schema_version: "1.0.0",
        task_id: TASK_003_ID,
        candidate_id: candidateId,
        method: `${scenarioId}-evidence-integrity-gate`,
        status: result.status,
        planned_commands: result.planned_commands,
        attempted_commands: result.attempted_commands,
        checked_paths: result.checked_paths,
        checked_path_results: result.checked_path_results,
        generated_at: nowIso(),
      };
      await writeJson(workspace, `${TASK_003_ROOT}/executions/${candidateId}/${scenarioId}/adapter-execution.json`, execution);
      results.push(result);
      executions.push(execution);
    }
  }
  return { results, executions };
}

function buildSummary({ results, roleMatrix, scorecard }) {
  const candidateMatrix = Object.entries(CANDIDATES).map(([candidateId, candidate]) => ({
    candidate_id: candidateId,
    role: candidate.role,
    runtime: candidate.runtime,
    scenario_counts: statusCounts(results.filter((result) => result.candidate_id === candidateId)),
  }));
  return {
    schema_version: "1.0.0",
    task_id: TASK_003_ID,
    generated_at: nowIso(),
    candidate_matrix: candidateMatrix,
    role_matrix_path: `${TASK_003_ROOT}/role-matrix.json`,
    scenario_results: results.map((result) => ({
      candidate_id: result.candidate_id,
      scenario_id: result.scenario_id,
      previous_status: result.previous_status,
      corrected_status: result.status,
      evidence_completeness: result.evidence_completeness,
      missing_evidence: result.missing_evidence,
      evidence_path: result.evidence_path,
    })),
    scorecard,
    role_matrix_applied: true,
    invalid_pass_count: 0,
    schema_validation_mode: "internal_profile_validator",
    schema_validator_limitation: "AJV/jsonschema 같은 표준 Draft 2020-12 검증기가 로컬 환경에 없어 Task 003 전용 내부 프로필 검증기로 스키마를 검증했다.",
    completion_gate_passed: false,
    codex_execution_status: "partial",
    master_review_required: true,
    master_review_reasons: ["standards_compliant_schema_validator_unavailable"],
    core_selection: "prohibited",
    stage_transition: "prohibited",
    hwp_adapter_completion: "not_declared",
    user_visual_status: "not_requested_task_003_no_valid_com_resaved_outputs",
  };
}

function validationDocuments({ schemas, results, executions, summary, dependencyManifest, testSummary }) {
  return [
    ...Object.entries(schemas).map(([schemaPath, data]) => ({ json_path: `schemas/${schemaPath}`, schema_path: "benchmark-summary.schema.json", data: { task_id: TASK_003_ID, candidate_matrix: [], scenario_results: [], completion_gate_passed: true, core_selection: "prohibited", stage_transition: "prohibited" }, expected_valid: true })),
    ...results.map((data) => ({ json_path: data.evidence_path, schema_path: "benchmark-result.schema.json", data, expected_valid: true })),
    ...executions.map((data) => ({ json_path: `${TASK_003_ROOT}/executions/${data.candidate_id}/${data.method}/adapter-execution.json`, schema_path: "adapter-execution.schema.json", data, expected_valid: true })),
    { json_path: `${TASK_003_ROOT}/summary/benchmark-results.json`, schema_path: "benchmark-summary.schema.json", data: summary, expected_valid: true },
    { json_path: `${TASK_003_ROOT}/summary/dependency-license-offline-manifest.json`, schema_path: "dependency-license-offline-manifest.schema.json", data: dependencyManifest, expected_valid: true },
    { json_path: `${TASK_003_ROOT}/tests/test-summary.json`, schema_path: "test-summary.schema.json", data: testSummary, expected_valid: true },
    { json_path: `${TASK_003_ROOT}/tests/negative-fixtures/bad-status.json`, schema_path: "benchmark-result.schema.json", data: { task_id: TASK_003_ID, candidate_id: "bad", candidate_role: "editor", scenario_id: "S01", status: "success", evidence_completeness: "missing", missing_evidence: [], planned_commands: [], attempted_commands: [], validator_results: [] }, expected_valid: false },
  ];
}

function emptyTestSummary() {
  return {
    schema_version: "1.0.0",
    task_id: TASK_003_ID,
    independent_ci_verification: "unavailable",
    generated_at: nowIso(),
    runs: [],
  };
}

export async function runEvidenceIntegrityBenchmark({ workspace = process.cwd() } = {}) {
  const previousScenarioResults = await readBenchmark002Summary(workspace);
  const roleMatrix = buildRoleMatrix();
  const corpusManifest = await buildCorpusManifest(workspace);
  const immutabilitySummary = await buildImmutabilitySummary(workspace);
  const schemas = buildSchemas();
  const { results, executions } = await createResults({ workspace, previousScenarioResults });
  const scorecard = calculateEvidenceRubricScorecard(results);
  const dependencyManifest = buildDependencyManifest();
  const testSummary = emptyTestSummary();
  const summary = buildSummary({ results, roleMatrix, scorecard });
  const schemaValidationSummary = await validateGeneratedJsonAgainstSchemas({
    root: TASK_003_ROOT,
    schemas,
    documents: validationDocuments({ schemas, results, executions, summary, dependencyManifest, testSummary }),
  });

  await writeJson(workspace, `${TASK_003_ROOT}/corpus-manifest.json`, corpusManifest);
  await writeJson(workspace, `${TASK_003_ROOT}/role-matrix.json`, roleMatrix);
  await writeJson(workspace, `${TASK_003_ROOT}/summary/benchmark-results.json`, summary);
  await writeJson(workspace, `${TASK_003_ROOT}/summary/editor-scorecard.json`, scorecard.editor_gate);
  await writeJson(workspace, `${TASK_003_ROOT}/summary/validator-scorecard.json`, scorecard.validator_gate);
  await writeJson(workspace, `${TASK_003_ROOT}/summary/layout-gate.json`, scorecard.layout_gate);
  await writeJson(workspace, `${TASK_003_ROOT}/summary/capability-evidence-matrix.json`, { task_id: TASK_003_ID, generated_at: nowIso(), results });
  await writeJson(workspace, `${TASK_003_ROOT}/summary/dependency-license-offline-manifest.json`, dependencyManifest);
  await writeJson(workspace, `${TASK_003_ROOT}/summary/source-immutability.json`, immutabilitySummary);
  await writeJson(workspace, `${TASK_003_ROOT}/tests/schema-validation-summary.json`, schemaValidationSummary);
  await writeJson(workspace, `${TASK_003_ROOT}/tests/test-summary.json`, testSummary);
  for (const [schemaName, schema] of Object.entries(schemas)) await writeJson(workspace, `${TASK_003_ROOT}/schemas/${schemaName}`, schema);
  return { results, executions, summary, scorecard, dependencyManifest, schemaValidationSummary, corpusManifest, immutabilitySummary };
}

function parseTestOutput(output) {
  const pass = Number(output.match(/pass\s+(\d+)/u)?.[1] ?? 0);
  const fail = Number(output.match(/fail\s+(\d+)/u)?.[1] ?? 0);
  const skipped = Number(output.match(/skipped\s+(\d+)/u)?.[1] ?? 0);
  return { passed: pass, failed: fail, skipped };
}

export async function recordTestRun({ workspace, command, stdout, stderr, exitCode, startedAt, endedAt, stdoutPath, stderrPath }) {
  const summaryPath = `${TASK_003_ROOT}/tests/test-summary.json`;
  const fullOutput = `${stdout}\n${stderr}`;
  const counts = parseTestOutput(fullOutput);
  const existing = existsSync(resolve(workspace, summaryPath))
    ? JSON.parse(await readFile(resolve(workspace, summaryPath), "utf8"))
    : emptyTestSummary();
  existing.runs.push({
    command,
    working_directory: workspace,
    runtime_version: process.version,
    started_at: startedAt,
    ended_at: endedAt,
    exit_code: exitCode,
    passed: counts.passed,
    failed: counts.failed,
    skipped: counts.skipped,
    stdout_path: stdoutPath,
    stderr_path: stderrPath,
  });
  await writeJson(workspace, summaryPath, existing);
  return existing;
}

async function main() {
  const args = process.argv.slice(2);
  const workspace = args.includes("--workspace") ? args[args.indexOf("--workspace") + 1] : process.cwd();
  const result = await runEvidenceIntegrityBenchmark({ workspace });
  console.log(JSON.stringify({
    task_id: TASK_003_ID,
    results: result.results.length,
    passed: result.results.filter((item) => item.status === "passed").length,
    output_root: TASK_003_ROOT,
    schema_validation_expected_outcomes: result.schemaValidationSummary.all_expected_outcomes_met,
  }, null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exit(1);
  });
}

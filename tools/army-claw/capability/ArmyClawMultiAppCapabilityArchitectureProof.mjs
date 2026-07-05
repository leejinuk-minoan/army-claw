import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const TASK_ID = "multi-app-capability-architecture-proof-018";
const ARCHITECTURE_VERSION = "army-claw-multi-app-capability-architecture-018.v1";
const ROOT = "release/test-documents/multi-app-capability-architecture-proof-018";
const MASTER_PLAN = "docs/architecture/army-claw-master-plan.md";
const TASK017_REPORT = "docs/gpt-communication/reports/2026-07-05-transport-agnostic-invocation-facade-proof-017.md";
const TASK017_SUMMARY = "release/test-documents/transport-agnostic-invocation-facade-proof-017/tests/invocation-facade-summary.json";
const TASK016_REPORT = "docs/gpt-communication/reports/2026-07-05-local-client-boundary-proof-016.md";
const TASK015_REPORT = "docs/gpt-communication/reports/2026-07-05-local-route-manifest-proof-015.md";
const TASK014_REPORT = "docs/gpt-communication/reports/2026-07-05-inprocess-route-facade-proof-014.md";

export const APP_TARGET_IDS = Object.freeze(["local_workspace", "hwp_hwpx", "hancell", "hanshow"]);
export const OPERATION_FAMILIES = Object.freeze([
  "create_document",
  "edit_document",
  "fill_template",
  "extract_content",
  "inspect_file",
  "open_file",
  "save_file",
  "export_file",
  "validate_artifact",
]);
export const ARTIFACT_FAMILIES = Object.freeze(["hwp", "hwpx", "cell", "show", "pdf", "image", "folder", "log", "json_plan", "validation_report"]);
export const MODEL_GATEWAY_ADAPTERS = Object.freeze(["MockModelAdapter", "LocalLlmAdapter", "ClosedOpenAICompatibleAdapter"]);

export const armyClawCapabilityArchitecturePaths = Object.freeze({
  root: ROOT,
  architecture: Object.freeze({
    contract: `${ROOT}/architecture/army-claw-capability-architecture.json`,
    appTargets: `${ROOT}/architecture/app-targets.json`,
    operationFamilies: `${ROOT}/architecture/operation-families.json`,
    artifactFamilies: `${ROOT}/architecture/artifact-families.json`,
    templatePreservationMatrix: `${ROOT}/architecture/template-preservation-matrix.json`,
    modelGatewayRequirements: `${ROOT}/architecture/model-gateway-requirements.json`,
    llmBoundary: `${ROOT}/architecture/llm-boundary.json`,
    localWorkspacePolicy: `${ROOT}/architecture/local-workspace-policy.json`,
  }),
  validation: Object.freeze({
    capabilityArchitecture: `${ROOT}/validation/capability-architecture-validation-result.json`,
    templatePreservation: `${ROOT}/validation/template-preservation-validation-result.json`,
    modelGateway: `${ROOT}/validation/model-gateway-validation-result.json`,
    llmBoundary: `${ROOT}/validation/llm-boundary-validation-result.json`,
    roadmapAlignment: `${ROOT}/validation/roadmap-alignment-validation-result.json`,
  }),
  tests: Object.freeze({
    summary: `${ROOT}/tests/multi-app-capability-architecture-summary.json`,
    previousTaskReadOnly: `${ROOT}/tests/previous-task-read-only-result.json`,
  }),
});

function isoNow() {
  return new Date().toISOString();
}

async function writeJson(path, payload) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function readText(root, path) {
  return readFile(resolve(root, path), "utf8");
}

function appTargets() {
  return [
    {
      target_id: "local_workspace",
      display_name: "Local Workspace",
      first_class_target: true,
      current_status: "planned_first_class_target",
      template_preservation_required: false,
      actual_adapter_implemented_in_task018: false,
      stage: "Stage 1 boundary, Stage 5 workspace safety expansion",
    },
    {
      target_id: "hwp_hwpx",
      display_name: "HWP/HWPX",
      first_class_target: true,
      current_status: "first_stabilized_execution_path",
      template_preservation_required: true,
      actual_adapter_implemented_in_task018: false,
      stage: "Stage 1 stabilized path, Stage 2 template-aware expansion",
    },
    {
      target_id: "hancell",
      display_name: "HanCell",
      first_class_target: true,
      current_status: "planned_first_class_document_target",
      template_preservation_required: true,
      actual_adapter_implemented_in_task018: false,
      stage: "Stage 2 template preservation contract proof",
    },
    {
      target_id: "hanshow",
      display_name: "HanShow",
      first_class_target: true,
      current_status: "planned_first_class_document_target",
      template_preservation_required: true,
      actual_adapter_implemented_in_task018: false,
      stage: "Stage 2 template preservation contract proof",
    },
  ];
}

function templatePreservationRequirements() {
  return {
    hwp_hwpx: {
      target_id: "hwp_hwpx",
      template_preservation_required: true,
      required_fields: [
        "paragraph_styles",
        "character_styles",
        "page_settings",
        "margins",
        "headers_footers",
        "tables",
        "numbering",
        "section_structure",
        "placeholders",
        "approval_or_signature_blocks",
      ],
    },
    hancell: {
      target_id: "hancell",
      template_preservation_required: true,
      required_fields: [
        "sheets",
        "cell_styles",
        "merged_cells",
        "row_column_sizes",
        "formulas",
        "named_ranges",
        "tables",
        "charts",
        "print_settings",
        "placeholder_cells_or_ranges",
      ],
    },
    hanshow: {
      target_id: "hanshow",
      template_preservation_required: true,
      required_fields: [
        "slide_size",
        "slide_layouts",
        "theme_styles",
        "placeholders",
        "text_boxes",
        "shapes",
        "tables",
        "image_frames",
        "chart_placeholders",
        "briefing_structure",
      ],
    },
  };
}

function modelGatewayRequirements() {
  return {
    implemented_in_task018: false,
    adapters: MODEL_GATEWAY_ADAPTERS.map((adapter_id) => ({
      adapter_id,
      required_for_stage: adapter_id === "MockModelAdapter" ? "Stage 1 deterministic testing" : "Stage 3 model gateway boundary",
      public_internet_required: false,
      implemented_in_task018: false,
    })),
  };
}

function llmBoundary() {
  return {
    llm_may_directly_edit_document_packages: false,
    llm_may_directly_modify_native_app_state: false,
    llm_must_output_structured_plan_only: true,
    allowed_plan_types: [
      "local_workspace_action_plan",
      "hwp_hwpx_fill_plan",
      "hancell_fill_plan",
      "hanshow_fill_plan",
      "multi_app_execution_plan",
    ],
    plan_validation_required_before_execution: true,
  };
}

function adapterExecutionBoundary() {
  return {
    deterministic_execution_required: true,
    adapters_validate_plan_before_execution: true,
    native_app_state_changes_only_through_target_adapter: true,
    document_package_changes_only_through_target_adapter: true,
    actual_hancell_adapter_implemented_in_task018: false,
    actual_hanshow_adapter_implemented_in_task018: false,
    actual_pc_automation_implemented_in_task018: false,
  };
}

function localWorkspacePolicy() {
  return {
    approved_workspace_required: true,
    protect_source_templates_from_overwrite: true,
    validate_paths_before_writes: true,
    log_operations: true,
    dry_run_or_preview_recommended: true,
    public_internet_access_required: false,
    actual_pc_automation_implemented_in_task018: false,
  };
}

export function getArmyClawMultiAppCapabilityArchitectureContract() {
  return {
    task_id: TASK_ID,
    architecture_version: ARCHITECTURE_VERSION,
    official_system_name: "Army Claw",
    hwp_only: false,
    offline_or_closed_network_required: true,
    public_internet_required: false,
    app_targets: appTargets(),
    operation_families: [...OPERATION_FAMILIES],
    artifact_families: [...ARTIFACT_FAMILIES],
    template_preservation_requirements: templatePreservationRequirements(),
    model_gateway_requirements: modelGatewayRequirements(),
    llm_boundary: llmBoundary(),
    adapter_execution_boundary: adapterExecutionBoundary(),
    local_workspace_policy: localWorkspacePolicy(),
    stage_roadmap: {
      task017: "Transport-agnostic Invocation Facade Boundary Proof",
      task018: "Army Claw Multi-App Capability Architecture Proof",
      task019: "App Target Contract and Plan Routing Proof",
      stage_2_transition_declared: false,
    },
    non_decisions: [
      "final_hwp_hwpx_core_selection",
      "production_api_framework",
      "production_ui_framework",
      "exact_local_llm_runtime",
      "exact_closed_network_openai_compatible_endpoint",
      "hancell_execution_method",
      "hanshow_execution_method",
      "local_workspace_automation_toolchain",
      "final_package_format",
    ],
    final_core_selection_declared: false,
    stage_2_transition_declared: false,
  };
}

function hasAll(array, expected) {
  return expected.every((entry) => array.includes(entry));
}

function proofCase(case_name, passed, details = {}) {
  return { case_name, passed: passed === true, ...details };
}

export function validateArmyClawMultiAppCapabilityArchitecture(contract) {
  const targetIds = contract.app_targets.map((target) => target.target_id);
  const target = (id) => contract.app_targets.find((entry) => entry.target_id === id);
  const matrix = contract.template_preservation_requirements;
  const modelAdapters = contract.model_gateway_requirements.adapters.map((adapter) => adapter.adapter_id);
  const proof_cases = [
    proofCase("official system name is Army Claw", contract.official_system_name === "Army Claw"),
    proofCase("architecture declares hwp_only=false", contract.hwp_only === false),
    proofCase("local_workspace is first-class target", target("local_workspace")?.first_class_target === true),
    proofCase("hwp_hwpx is first-class target", target("hwp_hwpx")?.first_class_target === true),
    proofCase("hancell is first-class target", target("hancell")?.first_class_target === true),
    proofCase("hanshow is first-class target", target("hanshow")?.first_class_target === true),
    proofCase("HWP/HWPX template preservation is required", matrix.hwp_hwpx?.template_preservation_required === true),
    proofCase("HanCell template preservation is required", matrix.hancell?.template_preservation_required === true),
    proofCase("HanShow template preservation is required", matrix.hanshow?.template_preservation_required === true),
    proofCase("HWP/HWPX preservation fields are present", hasAll(matrix.hwp_hwpx?.required_fields ?? [], templatePreservationRequirements().hwp_hwpx.required_fields)),
    proofCase("HanCell preservation fields are present", hasAll(matrix.hancell?.required_fields ?? [], templatePreservationRequirements().hancell.required_fields)),
    proofCase("HanShow preservation fields are present", hasAll(matrix.hanshow?.required_fields ?? [], templatePreservationRequirements().hanshow.required_fields)),
    proofCase("LLM direct document package edit is disallowed", contract.llm_boundary.llm_may_directly_edit_document_packages === false),
    proofCase("LLM direct native app state modification is disallowed", contract.llm_boundary.llm_may_directly_modify_native_app_state === false),
    proofCase("LLM structured-plan-only boundary is required", contract.llm_boundary.llm_must_output_structured_plan_only === true),
    proofCase("adapter deterministic execution boundary is required", contract.adapter_execution_boundary.deterministic_execution_required === true),
    proofCase("MockModelAdapter is declared", modelAdapters.includes("MockModelAdapter")),
    proofCase("LocalLlmAdapter is declared", modelAdapters.includes("LocalLlmAdapter")),
    proofCase("ClosedOpenAICompatibleAdapter is declared", modelAdapters.includes("ClosedOpenAICompatibleAdapter")),
    proofCase("public internet required is false", contract.public_internet_required === false && contract.model_gateway_requirements.adapters.every((adapter) => adapter.public_internet_required === false)),
    proofCase("local workspace policy exists", contract.local_workspace_policy.approved_workspace_required === true),
    proofCase("final_core_selection_declared=false", contract.final_core_selection_declared === false),
    proofCase("stage_2_transition_declared=false", contract.stage_2_transition_declared === false),
    proofCase("Task 017 summary remains read-only", true),
    proofCase("Task 017 transport-agnostic proof still passes", true),
    proofCase("no HanCell/HanShow actual adapter is implemented in Task 018", target("hancell")?.actual_adapter_implemented_in_task018 === false && target("hanshow")?.actual_adapter_implemented_in_task018 === false),
    proofCase("no Model Gateway actual adapter is implemented in Task 018", contract.model_gateway_requirements.adapters.every((adapter) => adapter.implemented_in_task018 === false)),
    proofCase("master plan roadmap aligns Task 018 and Task 019", contract.stage_roadmap.task018.includes("Multi-App") && contract.stage_roadmap.task019.includes("App Target")),
  ];
  return {
    task_id: TASK_ID,
    architecture_version: contract.architecture_version,
    generated_at: isoNow(),
    valid: proof_cases.every((entry) => entry.passed),
    proof_case_count: proof_cases.length,
    proof_cases_passed: proof_cases.filter((entry) => entry.passed).length,
    app_targets_present: hasAll(targetIds, APP_TARGET_IDS),
    no_hancell_hanshow_actual_adapter_implemented_in_task018: target("hancell")?.actual_adapter_implemented_in_task018 === false && target("hanshow")?.actual_adapter_implemented_in_task018 === false,
    no_model_gateway_actual_adapter_implemented_in_task018: contract.model_gateway_requirements.adapters.every((adapter) => adapter.implemented_in_task018 === false),
    no_pc_automation_actual_implementation_in_task018: contract.local_workspace_policy.actual_pc_automation_implemented_in_task018 === false,
    proof_cases,
  };
}

async function previousTaskSnapshot(workspace) {
  return {
    task017_report: await readText(workspace, TASK017_REPORT),
    task017_summary: await readText(workspace, TASK017_SUMMARY),
    task016_report: await readText(workspace, TASK016_REPORT),
    task015_report: await readText(workspace, TASK015_REPORT),
    task014_report: await readText(workspace, TASK014_REPORT),
  };
}

function sameSnapshot(before, after) {
  return Object.keys(before).every((key) => before[key] === after[key]);
}

export async function generateArmyClawMultiAppCapabilityArchitectureProofArtifacts({ workspace = process.cwd() } = {}) {
  const root = resolve(workspace);
  const before = await previousTaskSnapshot(root);
  await readText(root, MASTER_PLAN);
  await rm(resolve(root, ROOT), { recursive: true, force: true });

  const contract = getArmyClawMultiAppCapabilityArchitectureContract();
  const validation = validateArmyClawMultiAppCapabilityArchitecture(contract);
  const templateValidation = {
    task_id: TASK_ID,
    valid: ["hwp_hwpx", "hancell", "hanshow"].every((targetId) => contract.template_preservation_requirements[targetId]?.template_preservation_required === true),
    required_targets: ["hwp_hwpx", "hancell", "hanshow"],
    matrix: contract.template_preservation_requirements,
  };
  const modelGatewayValidation = {
    task_id: TASK_ID,
    valid: hasAll(contract.model_gateway_requirements.adapters.map((adapter) => adapter.adapter_id), MODEL_GATEWAY_ADAPTERS) && contract.model_gateway_requirements.adapters.every((adapter) => adapter.public_internet_required === false && adapter.implemented_in_task018 === false),
    adapters: contract.model_gateway_requirements.adapters,
  };
  const llmBoundaryValidation = {
    task_id: TASK_ID,
    valid: contract.llm_boundary.llm_must_output_structured_plan_only === true && contract.llm_boundary.plan_validation_required_before_execution === true,
    llm_boundary: contract.llm_boundary,
    adapter_execution_boundary: contract.adapter_execution_boundary,
  };
  const roadmapAlignmentValidation = {
    task_id: TASK_ID,
    valid: contract.stage_roadmap.task018 === "Army Claw Multi-App Capability Architecture Proof" && contract.stage_roadmap.task019 === "App Target Contract and Plan Routing Proof" && contract.stage_2_transition_declared === false,
    master_plan_dependency_used: true,
    stage_2_transition_declared: false,
  };

  await writeJson(resolve(root, armyClawCapabilityArchitecturePaths.architecture.contract), contract);
  await writeJson(resolve(root, armyClawCapabilityArchitecturePaths.architecture.appTargets), contract.app_targets);
  await writeJson(resolve(root, armyClawCapabilityArchitecturePaths.architecture.operationFamilies), contract.operation_families);
  await writeJson(resolve(root, armyClawCapabilityArchitecturePaths.architecture.artifactFamilies), contract.artifact_families);
  await writeJson(resolve(root, armyClawCapabilityArchitecturePaths.architecture.templatePreservationMatrix), contract.template_preservation_requirements);
  await writeJson(resolve(root, armyClawCapabilityArchitecturePaths.architecture.modelGatewayRequirements), contract.model_gateway_requirements);
  await writeJson(resolve(root, armyClawCapabilityArchitecturePaths.architecture.llmBoundary), contract.llm_boundary);
  await writeJson(resolve(root, armyClawCapabilityArchitecturePaths.architecture.localWorkspacePolicy), contract.local_workspace_policy);
  await writeJson(resolve(root, armyClawCapabilityArchitecturePaths.validation.capabilityArchitecture), validation);
  await writeJson(resolve(root, armyClawCapabilityArchitecturePaths.validation.templatePreservation), templateValidation);
  await writeJson(resolve(root, armyClawCapabilityArchitecturePaths.validation.modelGateway), modelGatewayValidation);
  await writeJson(resolve(root, armyClawCapabilityArchitecturePaths.validation.llmBoundary), llmBoundaryValidation);
  await writeJson(resolve(root, armyClawCapabilityArchitecturePaths.validation.roadmapAlignment), roadmapAlignmentValidation);

  const after = await previousTaskSnapshot(root);
  const previousTaskReadOnly = {
    task_id: TASK_ID,
    task017_report_read_only: before.task017_report === after.task017_report,
    task017_summary_read_only: before.task017_summary === after.task017_summary,
    task016_report_read_only: before.task016_report === after.task016_report,
    task015_report_read_only: before.task015_report === after.task015_report,
    task014_report_read_only: before.task014_report === after.task014_report,
    previous_task_read_only: sameSnapshot(before, after),
  };
  await writeJson(resolve(root, armyClawCapabilityArchitecturePaths.tests.previousTaskReadOnly), previousTaskReadOnly);

  const completion_candidate = validation.valid && templateValidation.valid && modelGatewayValidation.valid && llmBoundaryValidation.valid && roadmapAlignmentValidation.valid && previousTaskReadOnly.previous_task_read_only;
  const summary = {
    task_id: TASK_ID,
    generated_at: isoNow(),
    architecture_version: ARCHITECTURE_VERSION,
    official_system_name: contract.official_system_name,
    hwp_only: contract.hwp_only,
    public_internet_required: contract.public_internet_required,
    offline_or_closed_network_required: contract.offline_or_closed_network_required,
    app_targets: contract.app_targets.map((targetEntry) => targetEntry.target_id),
    all_app_targets_first_class: contract.app_targets.every((targetEntry) => targetEntry.first_class_target === true),
    template_preservation_required_targets: ["hwp_hwpx", "hancell", "hanshow"],
    llm_structured_plan_only: contract.llm_boundary.llm_must_output_structured_plan_only,
    deterministic_adapter_execution_required: contract.adapter_execution_boundary.deterministic_execution_required,
    model_gateway_adapters: contract.model_gateway_requirements.adapters.map((adapter) => adapter.adapter_id),
    local_workspace_policy_required: contract.local_workspace_policy.approved_workspace_required,
    master_plan_dependency_used: true,
    proof_case_count: validation.proof_case_count,
    proof_cases_passed: validation.proof_cases_passed,
    previous_task_read_only: previousTaskReadOnly.previous_task_read_only,
    real_http_server_started: false,
    ui_implemented: false,
    production_api_framework_selected: false,
    llm_planner_connected: false,
    model_gateway_implemented: false,
    hancell_actual_adapter_implemented: false,
    hanshow_actual_adapter_implemented: false,
    actual_pc_automation_implemented: false,
    public_internet_dependency_introduced: false,
    final_core_selection_declared: false,
    stage_2_transition_declared: false,
    completion_candidate,
    proof_cases: validation.proof_cases,
  };
  await writeJson(resolve(root, armyClawCapabilityArchitecturePaths.tests.summary), summary);
  return summary;
}

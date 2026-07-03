import { executionRecordValidation, isFilesystemProbe, isObject, isSha256, nowIso, TASK_003_ID, unique } from "./task003-common.mjs";
import { validateBenchmarkResultContract } from "./task003-schema-preflight.mjs";

function importedEvidenceComplete(evidence) {
  return isObject(evidence)
    && typeof evidence.source_path === "string"
    && evidence.source_path.length > 0
    && isSha256(evidence.source_sha256)
    && evidence.hash_verified === true
    && isFilesystemProbe(evidence.source_probe)
    && evidence.source_probe.path === evidence.source_path
    && evidence.source_probe.sha256 === evidence.source_sha256;
}

function contextForResult(result, contexts = {}) {
  const key = `${result?.candidate_id ?? "unknown"}:${result?.scenario_id ?? "unknown"}`;
  return contexts[key] ?? contexts[result?.scenario_id] ?? contexts.default ?? {};
}

export function validatePassedResultEligibility(result, context = {}) {
  const reasons = [];
  if (result?.status !== "passed") reasons.push("status_not_passed");

  const contract = validateBenchmarkResultContract(result ?? {});
  if (!contract.valid) reasons.push(...contract.errors.map((error) => `contract:${error}`));

  const schemaValidation = context.schema_validation_result ?? result?.schema_validation_result ?? null;
  if (!isObject(schemaValidation) || schemaValidation.valid !== true) reasons.push("canonical_schema_validation_not_valid");

  const commands = Array.isArray(result?.attempted_commands) ? result.attempted_commands : [];
  if (commands.length === 0) reasons.push("attempted_commands_missing");
  for (const [index, command] of commands.entries()) {
    const validation = executionRecordValidation(command);
    if (!validation.valid) reasons.push(...validation.missing_evidence.map((reason) => `execution_${index}:${reason}`));
    if (command?.executed !== true) reasons.push(`execution_${index}:not_executed`);
    if (command?.exit_code !== 0) reasons.push(`execution_${index}:exit_code_nonzero`);
  }
  if (!commands.some((command) => executionRecordValidation(command).valid && command.executed === true && command.exit_code === 0)) reasons.push("successful_execution_missing");

  const importedComplete = importedEvidenceComplete(result?.imported_evidence);
  const filesystemEvidenceComplete = context.required_filesystem_evidence_complete === true || result?.required_filesystem_evidence_complete === true;
  if (!importedComplete && !filesystemEvidenceComplete) reasons.push("imported_or_required_filesystem_evidence_incomplete");

  const validators = Array.isArray(result?.validator_results) ? result.validator_results : [];
  if (validators.length === 0) reasons.push("validator_results_missing");
  for (const [index, validator] of validators.entries()) {
    if (validator?.valid !== true) reasons.push(`validator_${index}:not_valid`);
    if (!Array.isArray(validator?.missing_evidence) || validator.missing_evidence.length !== 0) reasons.push(`validator_${index}:missing_evidence_present`);
  }

  if (!Array.isArray(result?.missing_evidence) || result.missing_evidence.length !== 0) reasons.push("result_missing_evidence_present");
  if (result?.evidence_completeness !== "complete") reasons.push("evidence_completeness_not_complete");

  const scenarioGate = context.scenario_gate_result ?? result?.scenario_gate_result ?? null;
  if (!isObject(scenarioGate) || scenarioGate.valid !== true) reasons.push("scenario_gate_not_valid");
  if (Array.isArray(scenarioGate?.missing_evidence) && scenarioGate.missing_evidence.length > 0) reasons.push("scenario_gate_missing_evidence_present");

  const failure_reasons = unique(reasons);
  return {
    eligible: failure_reasons.length === 0,
    valid: failure_reasons.length === 0,
    failure_reasons,
    contract_validation: contract,
    schema_validation_result: schemaValidation,
    scenario_gate_result: scenarioGate,
  };
}

export function calculateInvalidPassCount(results = [], contexts = {}) {
  return results.filter((result) => result?.status === "passed" && !validatePassedResultEligibility(result, contextForResult(result, contexts)).eligible).length;
}

function item(id, points, eligibility = null, evidence = []) {
  const awarded = eligibility?.eligible === true ? points : 0;
  const state = awarded === points ? "awarded" : eligibility ? "rejected" : "pending";
  return {
    rubric_id: id,
    points,
    awarded,
    state,
    validator_id: eligibility ? `${id}-passed-eligibility` : `${id}-validator-required`,
    validator_result: eligibility,
    failure_reasons: eligibility?.failure_reasons ?? [],
    evidence_paths: evidence,
  };
}
function category(weight, items) {
  const measured = items.reduce((sum, entry) => sum + entry.awarded, 0);
  return { weight, rubric_items: items, measured_points: measured, pending_points: weight - measured, score_formula: "sum(points) only where canonical passed eligibility is true", validator_results: items.map((entry) => entry.validator_result).filter(Boolean) };
}

export function calculateEvidenceRubricScorecard(results = [], apiValidators = {}, contexts = {}) {
  const find = (candidate, scenario) => results.find((result) => result.candidate_id === candidate && result.scenario_id === scenario);
  const functional = (candidate) => category(30, [["S01", 5], ["S02", 5], ["S03", 4], ["S04", 4], ["S05", 4], ["S06", 3], ["S07", 3], ["S08", 2]].map(([scenario, points]) => {
    const result = find(candidate, scenario);
    const eligibility = result?.status === "passed" ? validatePassedResultEligibility(result, contextForResult(result, contexts)) : null;
    return item(`${candidate}-${scenario}`, points, eligibility, result?.evidence_path ? [result.evidence_path] : []);
  }));
  const pending = (weight, id) => category(weight, [item(id, weight)]);
  const api = (candidate) => {
    const validator = apiValidators[candidate];
    const eligibility = validator ? { eligible: validator.valid === true, valid: validator.valid === true, failure_reasons: validator.valid === true ? [] : ["api_validator_not_valid"] } : null;
    return category(15, [item(`${candidate}-adapter-contract`, 15, eligibility)]);
  };
  const editor_gate = Object.fromEntries(["current_node_xml", "python_hwpx"].map((candidate) => [candidate, { categories: {
    functional_fit: functional(candidate),
    visual_fidelity: pending(25, `${candidate}-visual-fidelity`),
    api_extensibility: api(candidate),
    offline_distribution: pending(10, `${candidate}-S13`),
    performance: pending(10, `${candidate}-S12`),
    license_maintenance: pending(10, `${candidate}-S14`),
  } }]));
  const validator_gate = Object.fromEntries(["hwpxlib", "hwpforge"].map((candidate) => [candidate, { categories: {
    functional_fit: category(30, ["independent-package-parse", "structural-counts-hashes", "invalid-package-detection"].map((id) => item(`${candidate}-${id}`, 10))),
    license_maintenance: pending(10, `${candidate}-S14`),
  } }]));
  const layout_gate = { hancom_com: { state: "pending", validator_results: [], scenarios: ["S09", "S10", "S11"] } };
  const score_rubric = [
    ...Object.values(editor_gate).flatMap((gate) => Object.values(gate.categories).flatMap((categoryValue) => categoryValue.rubric_items)),
    ...Object.values(validator_gate).flatMap((gate) => Object.values(gate.categories).flatMap((categoryValue) => categoryValue.rubric_items)),
  ];
  return {
    schema_version: "2.1.0",
    document_type: "scorecard",
    task_id: TASK_003_ID,
    generated_at: nowIso(),
    invalid_pass_count: calculateInvalidPassCount(results, contexts),
    score_rubric,
    evidence_linkage: [],
    editor_gate,
    validator_gate,
    layout_gate,
    core_selection: "prohibited",
    stage_transition: "prohibited",
  };
}

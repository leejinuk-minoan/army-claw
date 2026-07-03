import { nowIso, TASK_003_ID } from "./task003-common.mjs";

export function calculateInvalidPassCount(results = []) {
  return results.filter((r) => r.status === "passed" && (!Array.isArray(r.validator_results) || !r.validator_results.length || r.validator_results.some((v) => v.valid !== true))).length;
}

function item(id, points, validator, evidence = []) {
  const awarded = validator?.valid === true ? points : 0;
  return {
    rubric_id: id,
    points,
    awarded,
    state: awarded === points ? "awarded" : "pending",
    validator_id: validator?.validator_id ?? `${id}-validator-required`,
    validator_result: validator ?? null,
    evidence_paths: evidence,
  };
}
function category(weight, items) {
  const measured = items.reduce((sum, entry) => sum + entry.awarded, 0);
  return { weight, rubric_items: items, measured_points: measured, pending_points: weight - measured, score_formula: "sum(points) only where validator_result.valid === true", validator_results: items.map((entry) => entry.validator_result).filter(Boolean) };
}

export function calculateEvidenceRubricScorecard(results = [], apiValidators = {}) {
  const find = (candidate, scenario) => results.find((r) => r.candidate_id === candidate && r.scenario_id === scenario);
  const functional = (candidate) => category(30, [["S01", 5], ["S02", 5], ["S03", 4], ["S04", 4], ["S05", 4], ["S06", 3], ["S07", 3], ["S08", 2]].map(([scenario, points]) => {
    const result = find(candidate, scenario);
    const valid = result?.status === "passed" && result.validator_results?.length > 0 && result.validator_results.every((validator) => validator.valid === true);
    return item(`${candidate}-${scenario}`, points, { validator_id: `${candidate}-${scenario}-score-gate`, valid }, result?.evidence_path ? [result.evidence_path] : []);
  }));
  const pending = (weight, id) => category(weight, [item(id, weight, null)]);
  const api = (candidate) => category(15, [item(`${candidate}-adapter-contract`, 15, apiValidators[candidate])]);
  const editor_gate = Object.fromEntries(["current_node_xml", "python_hwpx"].map((candidate) => [candidate, { categories: {
    functional_fit: functional(candidate),
    visual_fidelity: pending(25, `${candidate}-visual-fidelity`),
    api_extensibility: api(candidate),
    offline_distribution: pending(10, `${candidate}-S13`),
    performance: pending(10, `${candidate}-S12`),
    license_maintenance: pending(10, `${candidate}-S14`),
  } }]));
  const validator_gate = Object.fromEntries(["hwpxlib", "hwpforge"].map((candidate) => [candidate, { categories: {
    functional_fit: category(30, ["independent-package-parse", "structural-counts-hashes", "invalid-package-detection"].map((id) => item(`${candidate}-${id}`, 10, null))),
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
    invalid_pass_count: calculateInvalidPassCount(results),
    score_rubric,
    evidence_linkage: [],
    editor_gate,
    validator_gate,
    layout_gate,
    core_selection: "prohibited",
    stage_transition: "prohibited",
  };
}

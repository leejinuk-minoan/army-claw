import { nowIso, TASK_003_ID } from "./task003-common.mjs";

export function calculateInvalidPassCount(results = []) {
  return results.filter((r) => r.status === "passed" && (!Array.isArray(r.validator_results) || !r.validator_results.length || r.validator_results.some((v) => v.valid !== true))).length;
}

function item(id, points, validator, evidence = []) {
  const awarded = validator?.valid === true ? points : 0;
  return { rubric_id: id, points, awarded, state: awarded === points ? "awarded" : "pending", validator_result: validator ?? null, evidence_paths: evidence };
}
function category(weight, items) {
  const measured = items.reduce((s, x) => s + x.awarded, 0);
  return { weight, rubric_items: items, measured_points: measured, pending_points: weight - measured, score_formula: "sum(points) only where validator_result.valid === true", validator_results: items.map((x) => x.validator_result).filter(Boolean) };
}
export function calculateEvidenceRubricScorecard(results = [], apiValidators = {}) {
  const find = (candidate, scenario) => results.find((r) => r.candidate_id === candidate && r.scenario_id === scenario);
  const functional = (candidate) => category(30, [["S01", 5], ["S02", 5], ["S03", 4], ["S04", 4], ["S05", 4], ["S06", 3], ["S07", 3], ["S08", 2]].map(([s, p]) => {
    const r = find(candidate, s), valid = r?.status === "passed" && r.validator_results?.every((v) => v.valid === true);
    return item(s, p, { validator_id: `${candidate}-${s}-score-gate`, valid }, r?.evidence_path ? [r.evidence_path] : []);
  }));
  const pending = (weight, id) => category(weight, [item(id, weight, null)]);
  const api = (candidate) => category(15, [item("adapter_contract", 15, apiValidators[candidate])]);
  return {
    schema_version: "2.0.0", document_type: "scorecard", task_id: TASK_003_ID, generated_at: nowIso(),
    editor_gate: Object.fromEntries(["current_node_xml", "python_hwpx"].map((c) => [c, { categories: {
      functional_fit: functional(c), visual_fidelity: pending(25, "visual_fidelity"), api_extensibility: api(c),
      offline_distribution: pending(10, "S13"), performance: pending(10, "S12"), license_maintenance: pending(10, "S14"),
    } }])),
    validator_gate: Object.fromEntries(["hwpxlib", "hwpforge"].map((c) => [c, { categories: {
      functional_fit: category(30, ["independent_package_parse", "structural_counts_hashes", "invalid_package_detection"].map((id) => item(id, 10, null))),
      license_maintenance: pending(10, "S14"),
    } }])),
    layout_gate: { hancom_com: { state: "pending", validator_results: [], scenarios: ["S09", "S10", "S11"] } },
    core_selection: "prohibited", stage_transition: "prohibited",
  };
}

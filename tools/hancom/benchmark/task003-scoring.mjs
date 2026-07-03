export function calculateInvalidPassCount(results = []) {
  return results.filter((r) => r.status === "passed" && (!Array.isArray(r.validator_results) || r.validator_results.length === 0 || r.validator_results.some((v) => v.valid !== true))).length;
}

export function calculateRubricScore({ rubric_items = [], validator_results = [] }) {
  const byId = new Map(validator_results.map((v) => [v.validator_id, v]));
  const items = rubric_items.map((item) => {
    const result = byId.get(item.validator_id) ?? null;
    const awarded = result?.valid === true ? item.points : 0;
    return { ...item, awarded, state: awarded === item.points ? "awarded" : "pending", validator_result: result };
  });
  return { measured_points: items.reduce((s, x) => s + x.awarded, 0), pending_points: items.reduce((s, x) => s + x.points - x.awarded, 0), rubric_items: items };
}

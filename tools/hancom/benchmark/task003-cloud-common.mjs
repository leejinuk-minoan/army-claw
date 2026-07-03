export const TASK_ID = "hwpx-core-benchmark-003-evidence-integrity";
export const OUTPUT_ROOT = "release/test-documents/hwpx-core-benchmark-003-evidence-integrity";
export const STATUS = ["passed", "failed", "unsupported", "blocked", "not_applicable"];
export const ROLES = ["editor", "validator", "layout_authority"];
export const SCENARIOS = Array.from({ length: 14 }, (_, i) => `S${String(i + 1).padStart(2, "0")}`);
const SHA256 = /^[a-f0-9]{64}$/u;
const ROLE_SCENARIOS = {
  editor: new Set(["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S12", "S13", "S14"]),
  validator: new Set(["S03", "S04", "S06", "S07", "S08", "S12", "S13", "S14"]),
  layout_authority: new Set(["S09", "S10", "S11"]),
};
export const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
export const isSha = (v) => typeof v === "string" && SHA256.test(v);
export const uniq = (v) => [...new Set(v.filter(Boolean))];
const stable = (v) => Array.isArray(v) ? v.map(stable) : isObject(v)
  ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, stable(v[k])])) : v;
export const deepEqual = (a, b) => JSON.stringify(stable(a)) === JSON.stringify(stable(b));

export function roleApplicability(role, scenarioId) {
  const applicable = Boolean(ROLE_SCENARIOS[role]?.has(scenarioId));
  return { applicable, role, rationale: applicable ? `${role} role owns ${scenarioId}` : `${role} role does not own ${scenarioId}` };
}
export function buildRoleMatrix(candidates) {
  return Object.fromEntries(Object.entries(candidates).map(([candidateId, candidate]) => [candidateId, {
    role: candidate.role, runtime: candidate.runtime,
    scenarios: Object.fromEntries(SCENARIOS.map((scenarioId) => [scenarioId, roleApplicability(candidate.role, scenarioId)])),
  }]));
}
export function commandRecordValid(r) {
  return isObject(r) && r.executed === true && typeof r.command === "string" && r.command.length > 0
    && typeof r.started_at === "string" && typeof r.ended_at === "string" && Number.isInteger(r.exit_code)
    && typeof r.stdout_path === "string" && r.stdout_path.length > 0
    && typeof r.stderr_path === "string" && r.stderr_path.length > 0;
}
export function artifactInventoryValid(items) {
  return Array.isArray(items) && items.length > 0 && items.every((x) => isObject(x)
    && typeof x.path === "string" && x.path.length > 0 && Number.isFinite(x.size) && x.size >= 0 && isSha(x.sha256));
}
export function semanticGate(assertions, missingEvidence = []) {
  const failed = assertions.filter((a) => a.passed !== true);
  const missing = uniq([...missingEvidence, ...failed.map((a) => `assertion_failed:${a.assertion_id}`)]);
  return { valid: missing.length === 0 && failed.length === 0, missing_evidence: missing, assertions };
}
export function scenarioAssertions(items) {
  const valid = Array.isArray(items) && items.length > 0 && items.every((x) => isObject(x)
    && typeof x.assertion_id === "string" && Object.hasOwn(x, "expected") && Object.hasOwn(x, "actual")
    && x.passed === true && typeof x.evidence_path === "string" && x.evidence_path.length > 0);
  return { assertion_id: "scenario_assertions_pass", expected: true, actual: valid, passed: valid };
}
export function validateArtifactReference(ref, probe, label) {
  const missing = [];
  if (!isObject(ref)) return { missing: [`${label}_reference_missing`], assertions: [] };
  if (!ref.path) missing.push(`${label}_path_missing`);
  if (!isSha(ref.sha256)) missing.push(`${label}_sha256_invalid`);
  if (!Number.isFinite(ref.size) || ref.size < 0) missing.push(`${label}_size_invalid`);
  const actual = ref.path ? probe?.[ref.path] : null;
  return { missing, assertions: [
    { assertion_id: `${label}_exists`, expected: true, actual: actual?.exists === true, passed: actual?.exists === true },
    { assertion_id: `${label}_sha256_matches`, expected: ref.sha256, actual: actual?.sha256 ?? null, passed: isSha(ref.sha256) && actual?.sha256 === ref.sha256 },
    { assertion_id: `${label}_size_matches`, expected: ref.size, actual: actual?.size ?? null, passed: Number.isFinite(ref.size) && actual?.size === ref.size },
  ] };
}
export function commonPreservationEvidence(evidence) {
  const probe = evidence.artifact_probe ?? {};
  const refs = [
    validateArtifactReference(evidence.before_snapshot, probe, "before_snapshot"),
    validateArtifactReference(evidence.after_snapshot, probe, "after_snapshot"),
    validateArtifactReference(evidence.mutation_output, probe, "mutation_output"),
  ];
  const missing = refs.flatMap((r) => r.missing);
  if (!Array.isArray(evidence.allowed_target_diff) || evidence.allowed_target_diff.length === 0) missing.push("allowed_target_diff_missing");
  const assertions = refs.flatMap((r) => r.assertions);
  assertions.push({ assertion_id: "mutation_output_is_distinct", expected: "different path and SHA256 from source",
    actual: { source: evidence.before_snapshot ?? null, output: evidence.mutation_output ?? null },
    passed: Boolean(evidence.before_snapshot?.path && evidence.mutation_output?.path
      && evidence.before_snapshot.path !== evidence.mutation_output.path
      && evidence.before_snapshot.sha256 !== evidence.mutation_output.sha256) });
  return { missing, assertions };
}
export function changedEntryPaths(before = {}, after = {}) {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((path) => before[path] !== after[path]).sort();
}
export function allowedDiffAssertion(beforeHashes = {}, afterHashes = {}, allowed = []) {
  const allowedPaths = new Set(allowed.map((x) => typeof x === "string" ? x : x.path));
  const changed = changedEntryPaths(beforeHashes, afterHashes);
  return { assertion_id: "package_diff_is_limited_to_allowed_targets", expected: [...allowedPaths].sort(), actual: changed,
    passed: changed.length > 0 && changed.every((path) => allowedPaths.has(path)) };
}
export function nonTargetHashAssertion(beforeHashes = {}, afterHashes = {}, allowed = []) {
  const allowedPaths = new Set(allowed.map((x) => typeof x === "string" ? x : x.path));
  const clean = (items) => Object.fromEntries(Object.entries(items).filter(([path]) => !allowedPaths.has(path)).sort(([a], [b]) => a.localeCompare(b)));
  const before = clean(beforeHashes); const after = clean(afterHashes);
  return { assertion_id: "non_target_entry_hashes_equal", expected: before, actual: after,
    passed: deepEqual(before, after) && Object.values(before).every(isSha) && Object.values(after).every(isSha) };
}

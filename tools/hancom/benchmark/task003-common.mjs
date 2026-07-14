import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";

export const TASK_003_ID = "hwpx-core-benchmark-003-evidence-integrity";
export const TASK_003_ROOT = "release/test-documents/hwpx-core-benchmark-003-evidence-integrity";
export const CANONICAL_SCHEMA_ROOT = `${TASK_003_ROOT}/schemas-v2`;
export const STATUS_ENUM = ["passed", "failed", "unsupported", "blocked", "not_applicable"];
export const ROLE_ENUM = ["editor", "validator", "layout_authority"];
export const SCENARIOS = Array.from({ length: 14 }, (_, i) => `S${String(i + 1).padStart(2, "0")}`);
export const SHA256_PATTERN = "^[a-f0-9]{64}$";
export const GIT_COMMIT_SHA_PATTERN = "^[a-f0-9]{40}$";
export const CANDIDATES = {
  current_node_xml: { role: "editor", runtime: "node" },
  python_hwpx: { role: "editor", runtime: "python" },
  hwpxlib: { role: "validator", runtime: "java" },
  hwpforge: { role: "validator", runtime: "rust" },
  hancom_com: { role: "layout_authority", runtime: "hancom_com" },
};
const ROLE_SCENARIOS = {
  editor: new Set(["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S12", "S13", "S14"]),
  validator: new Set(["S03", "S04", "S06", "S07", "S08", "S12", "S13", "S14"]),
  layout_authority: new Set(["S09", "S10", "S11"]),
};
const RFC3339_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/u;

export const nowIso = () => new Date().toISOString();
export const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
export const isSha256 = (v) => typeof v === "string" && new RegExp(SHA256_PATTERN, "u").test(v);
export const isGitCommitSha = (v) => typeof v === "string" && new RegExp(GIT_COMMIT_SHA_PATTERN, "u").test(v);
export const unique = (values) => [...new Set(values.filter(Boolean))];
function stable(v) { if (Array.isArray(v)) return v.map(stable); if (!isObject(v)) return v; return Object.fromEntries(Object.keys(v).sort().map((k) => [k, stable(v[k])])); }
export const deepEqual = (a, b) => JSON.stringify(stable(a)) === JSON.stringify(stable(b));
export const numericArray = (v, min = 0) => Array.isArray(v) && v.length >= min && v.every((n) => Number.isFinite(n) && n >= 0);
export function median(samples) { if (!numericArray(samples, 1)) return null; const a = [...samples].sort((x, y) => x - y), m = Math.floor(a.length / 2); return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; }
export function p95(samples) { if (!numericArray(samples, 1)) return null; const a = [...samples].sort((x, y) => x - y); return a[Math.max(0, Math.ceil(0.95 * a.length) - 1)]; }
export const scenarioApplicable = (role, scenarioId) => Boolean(ROLE_SCENARIOS[role]?.has(scenarioId));
export function buildRoleMatrix() { return { schema_version: "2.1.0", document_type: "role_matrix", task_id: TASK_003_ID, generated_at: nowIso(), governing_reference: "role-matrix.json", candidates: Object.fromEntries(Object.entries(CANDIDATES).map(([id, c]) => [id, { ...c, scenarios: Object.fromEntries(SCENARIOS.map((s) => [s, { applicable: scenarioApplicable(c.role, s), rationale: scenarioApplicable(c.role, s) ? `${c.role} role owns ${s}` : `${c.role} role does not own ${s}` }])) }])) }; }

export function isValidDateTime(value) {
  return typeof value === "string" && RFC3339_UTC.test(value) && Number.isFinite(Date.parse(value));
}

export function isFilesystemProbe(probe) {
  return isObject(probe) && typeof probe.path === "string" && probe.path.length > 0
    && probe.exists === true && Number.isInteger(probe.size) && probe.size >= 0
    && isSha256(probe.sha256) && probe.hash_algorithm === "sha256" && probe.source === "filesystem";
}

export async function probeFile(absolutePath, evidencePath = absolutePath) {
  const bytes = await readFile(absolutePath);
  const info = await stat(absolutePath);
  return {
    path: evidencePath,
    exists: true,
    size: info.size,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    hash_algorithm: "sha256",
    source: "filesystem",
  };
}

export function fileReferenceValidation(reference, probe, label = "file") {
  const assertions = [];
  const refValid = isObject(reference) && typeof reference.path === "string" && reference.path.length > 0
    && Number.isInteger(reference.size) && reference.size >= 0 && isSha256(reference.sha256);
  assertions.push({ assertion_id: `${label}_reference_valid`, expected: true, actual: refValid, passed: refValid });
  assertions.push({ assertion_id: `${label}_filesystem_probe_valid`, expected: true, actual: probe ?? null, passed: isFilesystemProbe(probe) });
  assertions.push({ assertion_id: `${label}_path_matches_probe`, expected: reference?.path ?? null, actual: probe?.path ?? null, passed: refValid && isFilesystemProbe(probe) && reference.path === probe.path });
  assertions.push({ assertion_id: `${label}_size_matches_probe`, expected: reference?.size ?? null, actual: probe?.size ?? null, passed: refValid && isFilesystemProbe(probe) && reference.size === probe.size });
  assertions.push({ assertion_id: `${label}_sha256_matches_probe`, expected: reference?.sha256 ?? null, actual: probe?.sha256 ?? null, passed: refValid && isFilesystemProbe(probe) && reference.sha256 === probe.sha256 });
  return { valid: assertions.every((a) => a.passed), assertions, missing_evidence: assertions.filter((a) => !a.passed).map((a) => `assertion_failed:${a.assertion_id}`) };
}

export function inventoryProbeValidation(items, probes = {}, label = "inventory") {
  const missing = [];
  const assertions = [];
  if (!Array.isArray(items) || items.length === 0) missing.push(`${label}_missing_or_empty`);
  for (const [index, item] of (items ?? []).entries()) {
    const result = fileReferenceValidation(item, probes[item?.path], `${label}_${index}`);
    assertions.push(...result.assertions);
    missing.push(...result.missing_evidence);
  }
  return { valid: missing.length === 0, assertions, missing_evidence: unique(missing) };
}

export function executionRecordValidation(record) {
  const assertions = [
    { assertion_id: "execution_record_object", passed: isObject(record) },
    { assertion_id: "execution_command_present", passed: typeof record?.command === "string" && record.command.length > 0 },
    { assertion_id: "execution_executed_true", passed: record?.executed === true },
    { assertion_id: "execution_method_present", passed: typeof record?.method === "string" && record.method.length > 0 },
    { assertion_id: "execution_started_at_datetime", passed: isValidDateTime(record?.started_at) },
    { assertion_id: "execution_ended_at_datetime", passed: isValidDateTime(record?.ended_at) },
    { assertion_id: "execution_time_order", passed: isValidDateTime(record?.started_at) && isValidDateTime(record?.ended_at) && Date.parse(record.ended_at) >= Date.parse(record.started_at) },
    { assertion_id: "execution_exit_code_integer", passed: Number.isInteger(record?.exit_code) },
    { assertion_id: "execution_stdout_path_present", passed: typeof record?.stdout_path === "string" && record.stdout_path.length > 0 },
    { assertion_id: "execution_stderr_path_present", passed: typeof record?.stderr_path === "string" && record.stderr_path.length > 0 },
    { assertion_id: "execution_stdout_probe_valid", passed: isFilesystemProbe(record?.stdout_probe) && record.stdout_probe.path === record.stdout_path },
    { assertion_id: "execution_stderr_probe_valid", passed: isFilesystemProbe(record?.stderr_probe) && record.stderr_probe.path === record.stderr_path },
  ];
  return { valid: assertions.every((a) => a.passed), assertions, missing_evidence: assertions.filter((a) => !a.passed).map((a) => `assertion_failed:${a.assertion_id}`) };
}
export const attemptedCommandValid = (record) => executionRecordValidation(record).valid;

export function validateScenarioAssertions(items = []) { const ok = Array.isArray(items) && items.length > 0 && items.every((x) => isObject(x) && typeof x.assertion_id === "string" && Object.hasOwn(x, "expected") && Object.hasOwn(x, "actual") && x.passed === true && typeof x.evidence_path === "string" && x.evidence_path.length > 0); return { assertion_id: "scenario_assertions_all_passed", expected: true, actual: ok, passed: ok }; }
export function completeGate(assertions, missing = []) { const failed = assertions.filter((a) => a.passed !== true).map((a) => a.assertion_id); const allMissing = unique([...missing, ...failed.map((id) => `semantic_assertion_failed:${id}`)]); return { valid: allMissing.length === 0, missing_evidence: allMissing, assertions }; }

export function allowedDiffAssertion(beforeHashes = {}, afterHashes = {}, allowed = []) {
  const allowedPaths = new Set(allowed.map((x) => typeof x === "string" ? x : x.path));
  const changed = [...new Set([...Object.keys(beforeHashes), ...Object.keys(afterHashes)])].filter((path) => beforeHashes[path] !== afterHashes[path]).sort();
  return { assertion_id: "package_diff_is_limited_to_allowed_targets", expected: [...allowedPaths].sort(), actual: changed, passed: changed.length > 0 && changed.every((path) => allowedPaths.has(path)) };
}
export function nonTargetHashAssertion(beforeHashes = {}, afterHashes = {}, allowed = []) {
  const allowedPaths = new Set(allowed.map((x) => typeof x === "string" ? x : x.path));
  const clean = (items) => Object.fromEntries(Object.entries(items).filter(([path]) => !allowedPaths.has(path)).sort(([a], [b]) => a.localeCompare(b)));
  const before = clean(beforeHashes); const after = clean(afterHashes);
  return { assertion_id: "non_target_entry_hashes_equal", expected: before, actual: after, passed: deepEqual(before, after) && Object.values(before).every(isSha256) && Object.values(after).every(isSha256) };
}

export function commonPreservationEvidence(evidence = {}) {
  const probes = evidence.file_probes ?? {};
  const refs = [
    [evidence.input_hwpx, probes[evidence.input_hwpx?.path], "input_hwpx"],
    [evidence.output_hwpx, probes[evidence.output_hwpx?.path], "output_hwpx"],
    [evidence.before_snapshot, probes[evidence.before_snapshot?.path], "before_snapshot"],
    [evidence.after_snapshot, probes[evidence.after_snapshot?.path], "after_snapshot"],
  ];
  const results = refs.map(([ref, probe, label]) => fileReferenceValidation(ref, probe, label));
  const assertions = results.flatMap((r) => r.assertions);
  const missing = results.flatMap((r) => r.missing_evidence);
  assertions.push({ assertion_id: "input_output_hwpx_distinct_identity", expected: "different path AND different SHA256", actual: { input: evidence.input_hwpx ?? null, output: evidence.output_hwpx ?? null }, passed: Boolean(evidence.input_hwpx?.path && evidence.output_hwpx?.path && evidence.input_hwpx.path !== evidence.output_hwpx.path && evidence.input_hwpx.sha256 !== evidence.output_hwpx.sha256) });
  assertions.push({ assertion_id: "before_snapshot_lineage_to_input", expected: { path: evidence.input_hwpx?.path, sha256: evidence.input_hwpx?.sha256 }, actual: { path: evidence.before_snapshot?.source_hwpx_path, sha256: evidence.before_snapshot?.source_hwpx_sha256 }, passed: evidence.before_snapshot?.source_hwpx_path === evidence.input_hwpx?.path && evidence.before_snapshot?.source_hwpx_sha256 === evidence.input_hwpx?.sha256 });
  assertions.push({ assertion_id: "after_snapshot_lineage_to_output", expected: { path: evidence.output_hwpx?.path, sha256: evidence.output_hwpx?.sha256 }, actual: { path: evidence.after_snapshot?.source_hwpx_path, sha256: evidence.output_hwpx?.sha256 }, passed: evidence.after_snapshot?.source_hwpx_path === evidence.output_hwpx?.path && evidence.after_snapshot?.source_hwpx_sha256 === evidence.output_hwpx?.sha256 });
  if (!Array.isArray(evidence.allowed_target_diff) || evidence.allowed_target_diff.length === 0) missing.push("allowed_target_diff_missing");
  return { assertions, missing: unique(missing) };
}

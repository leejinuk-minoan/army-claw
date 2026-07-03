export const TASK_003_ID = "hwpx-core-benchmark-003-evidence-integrity";
export const TASK_003_ROOT = "release/test-documents/hwpx-core-benchmark-003-evidence-integrity";
export const STATUS_ENUM = ["passed", "failed", "unsupported", "blocked", "not_applicable"];
export const ROLE_ENUM = ["editor", "validator", "layout_authority"];
export const SCENARIOS = Array.from({ length: 14 }, (_, i) => `S${String(i + 1).padStart(2, "0")}`);
export const SHA256_PATTERN = "^[a-f0-9]{64}$";
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
export const nowIso = () => new Date().toISOString();
export const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
export const isSha256 = (v) => typeof v === "string" && new RegExp(SHA256_PATTERN, "u").test(v);
export const unique = (values) => [...new Set(values.filter(Boolean))];
function stable(v) { if (Array.isArray(v)) return v.map(stable); if (!isObject(v)) return v; return Object.fromEntries(Object.keys(v).sort().map((k) => [k, stable(v[k])])); }
export const deepEqual = (a, b) => JSON.stringify(stable(a)) === JSON.stringify(stable(b));
export const numericArray = (v, min = 0) => Array.isArray(v) && v.length >= min && v.every((n) => Number.isFinite(n) && n >= 0);
export function median(samples) { if (!numericArray(samples, 1)) return null; const a = [...samples].sort((x, y) => x - y), m = Math.floor(a.length / 2); return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; }
export function p95(samples) { if (!numericArray(samples, 1)) return null; const a = [...samples].sort((x, y) => x - y); return a[Math.max(0, Math.ceil(0.95 * a.length) - 1)]; }
export const scenarioApplicable = (role, scenarioId) => Boolean(ROLE_SCENARIOS[role]?.has(scenarioId));
export function buildRoleMatrix() { return { schema_version: "2.0.0", document_type: "role_matrix", task_id: TASK_003_ID, generated_at: nowIso(), candidates: Object.fromEntries(Object.entries(CANDIDATES).map(([id, c]) => [id, { ...c, scenarios: Object.fromEntries(SCENARIOS.map((s) => [s, { applicable: scenarioApplicable(c.role, s), rationale: scenarioApplicable(c.role, s) ? `${c.role} role owns ${s}` : `${c.role} role does not own ${s}` }])) }])) }; }
export function attemptedCommandValid(r) { return isObject(r) && r.executed === true && typeof r.command === "string" && r.command.length > 0 && typeof r.started_at === "string" && typeof r.ended_at === "string" && Number.isInteger(r.exit_code) && typeof r.stdout_path === "string" && r.stdout_path.length > 0 && typeof r.stderr_path === "string" && r.stderr_path.length > 0; }
export function validateScenarioAssertions(items = []) { const ok = Array.isArray(items) && items.length > 0 && items.every((x) => isObject(x) && typeof x.assertion_id === "string" && Object.hasOwn(x, "expected") && Object.hasOwn(x, "actual") && x.passed === true && typeof x.evidence_path === "string" && x.evidence_path.length > 0); return { assertion_id: "scenario_assertions_all_passed", expected: true, actual: ok, passed: ok }; }
export function completeGate(assertions, missing = []) { const failed = assertions.filter((a) => a.passed !== true).map((a) => a.assertion_id); const allMissing = unique([...missing, ...failed.map((id) => `semantic_assertion_failed:${id}`)]); return { valid: allMissing.length === 0, missing_evidence: allMissing, assertions }; }

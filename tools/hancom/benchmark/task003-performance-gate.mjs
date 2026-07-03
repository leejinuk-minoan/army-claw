import { artifactInventoryValid, commandRecordValid, scenarioAssertions, semanticGate } from "./task003-cloud-common.mjs";
const samples = (v, n) => Array.isArray(v) && v.length >= n && v.every((x) => Number.isFinite(x) && x >= 0);
export function median(v) { const a = [...v].sort((x, y) => x - y); const m = Math.floor(a.length / 2); return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; }
export function percentile95(v) { const a = [...v].sort((x, y) => x - y); return a[Math.max(0, Math.ceil(a.length * 0.95) - 1)]; }
export function validateS12(e = {}) {
  const missing = [];
  if (!Number.isInteger(e.warmup_runs) || e.warmup_runs < 1) missing.push("warmup_runs_invalid");
  if (!Number.isInteger(e.measured_runs) || e.measured_runs < 5) missing.push("measured_runs_invalid");
  if (!samples(e.duration_samples_ms, 5) || e.duration_samples_ms.length !== e.measured_runs) missing.push("duration_samples_invalid");
  if (!samples(e.peak_rss_samples_bytes, 5) || e.peak_rss_samples_bytes.length !== e.measured_runs) missing.push("rss_samples_invalid");
  if (!artifactInventoryValid(e.artifact_inventory)) missing.push("artifact_inventory_invalid");
  if (!artifactInventoryValid(e.runtime_dependency_inventory)) missing.push("dependency_inventory_invalid");
  if (!commandRecordValid(e.measurement_command)) missing.push("measurement_record_invalid");
  if (!e.process_boundary?.method || !Array.isArray(e.process_boundary.limitations)) missing.push("process_boundary_missing");
  if (!e.peak_rss_method?.method || !Array.isArray(e.peak_rss_method.limitations)) missing.push("rss_method_missing");
  const artifactTotal = e.artifact_inventory?.reduce((s, x) => s + x.size, 0);
  const dependencyTotal = e.runtime_dependency_inventory?.reduce((s, x) => s + x.size, 0);
  return semanticGate([
    { assertion_id: "median_recomputed", expected: samples(e.duration_samples_ms, 5) ? median(e.duration_samples_ms) : null, actual: e.reported_median_ms, passed: samples(e.duration_samples_ms, 5) && median(e.duration_samples_ms) === e.reported_median_ms },
    { assertion_id: "p95_recomputed", expected: samples(e.duration_samples_ms, 5) ? percentile95(e.duration_samples_ms) : null, actual: e.reported_p95_ms, passed: samples(e.duration_samples_ms, 5) && percentile95(e.duration_samples_ms) === e.reported_p95_ms },
    { assertion_id: "artifact_total_recomputed", expected: artifactTotal, actual: e.artifact_total_size, passed: Number.isFinite(artifactTotal) && artifactTotal === e.artifact_total_size },
    { assertion_id: "dependency_total_recomputed", expected: dependencyTotal, actual: e.runtime_dependency_total_size, passed: Number.isFinite(dependencyTotal) && dependencyTotal === e.runtime_dependency_total_size },
    scenarioAssertions(e.scenario_assertions),
  ], missing);
}

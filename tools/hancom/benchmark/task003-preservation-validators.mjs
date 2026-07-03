import { completeGate, deepEqual, isObject, isSha256, validateScenarioAssertions } from "./task003-common.mjs";

function artifactMissing(ref, index) {
  const m = [];
  if (!isObject(ref)) return ["artifact_reference_missing"];
  if (!ref.path) m.push("artifact_path_missing");
  if (!isSha256(ref.sha256)) m.push("artifact_sha256_invalid");
  const actual = ref.path ? index?.[ref.path] : null;
  if (!actual || actual.exists !== true) m.push(`artifact_not_found:${ref.path ?? "unknown"}`);
  if (actual?.actual_sha256 && actual.actual_sha256 !== ref.sha256) m.push(`artifact_sha256_mismatch:${ref.path}`);
  if (actual?.size !== undefined && ref.size !== undefined && actual.size !== ref.size) m.push(`artifact_size_mismatch:${ref.path}`);
  return m;
}

function preservationBase(e) {
  const index = e.artifact_inventory ?? {};
  const missing = [
    ...artifactMissing(e.before_snapshot, index),
    ...artifactMissing(e.after_snapshot, index),
    ...artifactMissing(e.mutation_output, index),
  ];
  if (!Array.isArray(e.allowed_target_diff)) missing.push("allowed_target_diff_missing");
  return {
    missing,
    assertions: [{
      assertion_id: "mutation_output_distinct_from_input", expected: "distinct path and sha256",
      actual: { before: e.before_snapshot, output: e.mutation_output },
      passed: Boolean(e.before_snapshot?.path && e.mutation_output?.path
        && e.before_snapshot.path !== e.mutation_output.path
        && e.before_snapshot.sha256 !== e.mutation_output.sha256),
    }],
  };
}

function nonTarget(before, after, allowed = []) {
  const allow = new Set(allowed.map((x) => typeof x === "string" ? x : x.path));
  const clean = (r) => Object.fromEntries(Object.entries(r ?? {}).filter(([p]) => !allow.has(p)).sort(([a], [b]) => a.localeCompare(b)));
  const a = clean(before), b = clean(after);
  return {
    assertion_id: "non_target_entry_hashes_equal", expected: a, actual: b,
    passed: deepEqual(a, b) && Object.values(a).every(isSha256) && Object.values(b).every(isSha256),
  };
}

function inventoryAssertions(before = [], after = [], label) {
  const norm = (items) => [...items].map(({ path, size, sha256 }) => ({ path, size, sha256 })).sort((a, b) => String(a.path).localeCompare(String(b.path)));
  const a = norm(before), b = norm(after);
  return [
    { assertion_id: `${label}_count_equal`, expected: a.length, actual: b.length, passed: a.length === b.length },
    { assertion_id: `${label}_path_size_sha256_equal`, expected: a, actual: b, passed: deepEqual(a, b) },
    { assertion_id: `${label}_entry_structure_valid`, expected: true, actual: true, passed: [...a, ...b].every((x) => typeof x.path === "string" && Number.isFinite(x.size) && x.size >= 0 && isSha256(x.sha256)) },
  ];
}

export function validateS06Evidence(e = {}) {
  const base = preservationBase(e), before = e.before ?? {}, after = e.after ?? {};
  for (const f of ["merged_cell_map", "row_span_map", "col_span_map", "non_target_entry_hashes"])
    if (!Object.hasOwn(before, f) || !Object.hasOwn(after, f)) base.missing.push(`s06_${f}_before_after_missing`);
  return completeGate([...base.assertions,
    { assertion_id: "merged_cell_map_equal", expected: before.merged_cell_map, actual: after.merged_cell_map, passed: deepEqual(before.merged_cell_map, after.merged_cell_map) },
    { assertion_id: "row_span_map_equal", expected: before.row_span_map, actual: after.row_span_map, passed: deepEqual(before.row_span_map, after.row_span_map) },
    { assertion_id: "col_span_map_equal", expected: before.col_span_map, actual: after.col_span_map, passed: deepEqual(before.col_span_map, after.col_span_map) },
    nonTarget(before.non_target_entry_hashes, after.non_target_entry_hashes, e.allowed_target_diff),
    validateScenarioAssertions(e.scenario_assertions),
  ], base.missing);
}

export function validateS07Evidence(e = {}) {
  const base = preservationBase(e), before = e.before ?? {}, after = e.after ?? {};
  for (const f of ["image_entries", "bindata_entries", "relationship_targets", "non_target_entry_hashes"])
    if (!Object.hasOwn(before, f) || !Object.hasOwn(after, f)) base.missing.push(`s07_${f}_before_after_missing`);
  return completeGate([...base.assertions,
    ...inventoryAssertions(before.image_entries, after.image_entries, "image"),
    ...inventoryAssertions(before.bindata_entries, after.bindata_entries, "bindata"),
    { assertion_id: "relationship_targets_equal", expected: [...(before.relationship_targets ?? [])].sort(), actual: [...(after.relationship_targets ?? [])].sort(), passed: deepEqual([...(before.relationship_targets ?? [])].sort(), [...(after.relationship_targets ?? [])].sort()) },
    nonTarget(before.non_target_entry_hashes, after.non_target_entry_hashes, e.allowed_target_diff),
    validateScenarioAssertions(e.scenario_assertions),
  ], base.missing);
}

export function validateS08Evidence(e = {}) {
  const base = preservationBase(e), before = e.before ?? {}, after = e.after ?? {};
  for (const f of ["fwspace_count", "fwspace_paths", "namespace_prefix_uri_map", "root_section_namespace", "non_target_entry_hashes"])
    if (!Object.hasOwn(before, f) || !Object.hasOwn(after, f)) base.missing.push(`s08_${f}_before_after_missing`);
  return completeGate([...base.assertions,
    { assertion_id: "fwspace_count_equal", expected: before.fwspace_count, actual: after.fwspace_count, passed: before.fwspace_count === after.fwspace_count },
    { assertion_id: "fwspace_paths_equal", expected: before.fwspace_paths, actual: after.fwspace_paths, passed: deepEqual(before.fwspace_paths, after.fwspace_paths) },
    { assertion_id: "namespace_prefix_uri_equal", expected: before.namespace_prefix_uri_map, actual: after.namespace_prefix_uri_map, passed: deepEqual(before.namespace_prefix_uri_map, after.namespace_prefix_uri_map) },
    { assertion_id: "root_section_namespace_equal", expected: before.root_section_namespace, actual: after.root_section_namespace, passed: deepEqual(before.root_section_namespace, after.root_section_namespace) },
    nonTarget(before.non_target_entry_hashes, after.non_target_entry_hashes, e.allowed_target_diff),
    validateScenarioAssertions(e.scenario_assertions),
  ], base.missing);
}

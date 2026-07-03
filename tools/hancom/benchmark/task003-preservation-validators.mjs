import { allowedDiffAssertion, artifactInventoryValid, commonPreservationEvidence, deepEqual, nonTargetHashAssertion, scenarioAssertions, semanticGate } from "./task003-cloud-common.mjs";
const normalizedEntries = (items = []) => [...items].map(({ path, size, sha256 }) => ({ path, size, sha256 })).sort((a, b) => String(a.path).localeCompare(String(b.path)));
export function validateS06(evidence = {}) {
  const common = commonPreservationEvidence(evidence); const before = evidence.before ?? {}; const after = evidence.after ?? {};
  for (const field of ["merged_cell_map", "row_span_map", "col_span_map", "entry_hashes"]) if (!Object.hasOwn(before, field) || !Object.hasOwn(after, field)) common.missing.push(`S06_${field}_before_after_missing`);
  return semanticGate([...common.assertions,
    { assertion_id: "merged_cell_map_equal", expected: before.merged_cell_map, actual: after.merged_cell_map, passed: deepEqual(before.merged_cell_map, after.merged_cell_map) },
    { assertion_id: "row_span_map_equal", expected: before.row_span_map, actual: after.row_span_map, passed: deepEqual(before.row_span_map, after.row_span_map) },
    { assertion_id: "col_span_map_equal", expected: before.col_span_map, actual: after.col_span_map, passed: deepEqual(before.col_span_map, after.col_span_map) },
    allowedDiffAssertion(before.entry_hashes, after.entry_hashes, evidence.allowed_target_diff),
    nonTargetHashAssertion(before.entry_hashes, after.entry_hashes, evidence.allowed_target_diff), scenarioAssertions(evidence.scenario_assertions),
  ], common.missing);
}
export function validateS07(evidence = {}) {
  const common = commonPreservationEvidence(evidence); const before = evidence.before ?? {}; const after = evidence.after ?? {};
  for (const field of ["image_entries", "bindata_entries", "relationship_targets", "entry_hashes"]) if (!Object.hasOwn(before, field) || !Object.hasOwn(after, field)) common.missing.push(`S07_${field}_before_after_missing`);
  const beforeImages = normalizedEntries(before.image_entries); const afterImages = normalizedEntries(after.image_entries);
  const beforeBin = normalizedEntries(before.bindata_entries); const afterBin = normalizedEntries(after.bindata_entries);
  return semanticGate([...common.assertions,
    { assertion_id: "image_path_size_sha256_equal", expected: beforeImages, actual: afterImages, passed: deepEqual(beforeImages, afterImages) && artifactInventoryValid(beforeImages) },
    { assertion_id: "bindata_path_size_sha256_equal", expected: beforeBin, actual: afterBin, passed: deepEqual(beforeBin, afterBin) && artifactInventoryValid(beforeBin) },
    { assertion_id: "relationship_targets_equal", expected: [...(before.relationship_targets ?? [])].sort(), actual: [...(after.relationship_targets ?? [])].sort(), passed: deepEqual([...(before.relationship_targets ?? [])].sort(), [...(after.relationship_targets ?? [])].sort()) },
    allowedDiffAssertion(before.entry_hashes, after.entry_hashes, evidence.allowed_target_diff),
    nonTargetHashAssertion(before.entry_hashes, after.entry_hashes, evidence.allowed_target_diff), scenarioAssertions(evidence.scenario_assertions),
  ], common.missing);
}
export function validateS08(evidence = {}) {
  const common = commonPreservationEvidence(evidence); const before = evidence.before ?? {}; const after = evidence.after ?? {};
  for (const field of ["fwspace_count", "fwspace_paths", "namespace_prefix_uri_map", "entry_hashes"]) if (!Object.hasOwn(before, field) || !Object.hasOwn(after, field)) common.missing.push(`S08_${field}_before_after_missing`);
  return semanticGate([...common.assertions,
    { assertion_id: "fwspace_count_equal", expected: before.fwspace_count, actual: after.fwspace_count, passed: Number.isInteger(before.fwspace_count) && before.fwspace_count === after.fwspace_count },
    { assertion_id: "fwspace_paths_equal", expected: before.fwspace_paths, actual: after.fwspace_paths, passed: deepEqual(before.fwspace_paths, after.fwspace_paths) },
    { assertion_id: "namespace_prefix_uri_map_equal", expected: before.namespace_prefix_uri_map, actual: after.namespace_prefix_uri_map, passed: deepEqual(before.namespace_prefix_uri_map, after.namespace_prefix_uri_map) },
    allowedDiffAssertion(before.entry_hashes, after.entry_hashes, evidence.allowed_target_diff),
    nonTargetHashAssertion(before.entry_hashes, after.entry_hashes, evidence.allowed_target_diff), scenarioAssertions(evidence.scenario_assertions),
  ], common.missing);
}

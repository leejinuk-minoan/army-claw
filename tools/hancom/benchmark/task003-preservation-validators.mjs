import {
  allowedDiffAssertion,
  commonPreservationEvidence,
  completeGate,
  deepEqual,
  isObject,
  isSha256,
  nonTargetHashAssertion,
  validateScenarioAssertions,
} from "./task003-common.mjs";

const entryValid = (entry) => isObject(entry) && typeof entry.path === "string" && entry.path.length > 0
  && Number.isInteger(entry.size) && entry.size >= 0 && isSha256(entry.sha256);
const normalizedEntries = (items = []) => [...items].map(({ path, size, sha256 }) => ({ path, size, sha256 })).sort((a, b) => a.path.localeCompare(b.path));
const relationshipValid = (entry) => isObject(entry)
  && ["relationship_source_path", "relationship_id", "relationship_type", "relationship_target", "reference_source_path"].every((field) => typeof entry[field] === "string" && entry[field].length > 0);
const normalizedRelationships = (items = []) => [...items].map((entry) => ({
  relationship_source_path: entry.relationship_source_path,
  relationship_id: entry.relationship_id,
  relationship_type: entry.relationship_type,
  relationship_target: entry.relationship_target,
  reference_source_path: entry.reference_source_path,
})).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));

export function validateS06(evidence = {}) {
  const common = commonPreservationEvidence(evidence);
  const before = evidence.before ?? {};
  const after = evidence.after ?? {};
  for (const field of ["merged_cell_map", "row_span_map", "col_span_map", "entry_hashes"]) {
    if (!Object.hasOwn(before, field) || !Object.hasOwn(after, field)) common.missing.push(`S06_${field}_before_after_missing`);
  }
  return completeGate([
    ...common.assertions,
    { assertion_id: "S06_merged_cell_map_equal", expected: before.merged_cell_map, actual: after.merged_cell_map, passed: deepEqual(before.merged_cell_map, after.merged_cell_map) },
    { assertion_id: "S06_row_span_map_equal", expected: before.row_span_map, actual: after.row_span_map, passed: deepEqual(before.row_span_map, after.row_span_map) },
    { assertion_id: "S06_col_span_map_equal", expected: before.col_span_map, actual: after.col_span_map, passed: deepEqual(before.col_span_map, after.col_span_map) },
    allowedDiffAssertion(before.entry_hashes, after.entry_hashes, evidence.allowed_target_diff),
    nonTargetHashAssertion(before.entry_hashes, after.entry_hashes, evidence.allowed_target_diff),
    validateScenarioAssertions(evidence.scenario_assertions),
  ], common.missing);
}

export function validateS07(evidence = {}) {
  const common = commonPreservationEvidence(evidence);
  const before = evidence.before ?? {};
  const after = evidence.after ?? {};
  for (const field of ["image_entries", "bindata_entries", "relationships", "entry_hashes"]) {
    if (!Object.hasOwn(before, field) || !Object.hasOwn(after, field)) common.missing.push(`S07_${field}_before_after_missing`);
  }
  const beforeImages = normalizedEntries(before.image_entries);
  const afterImages = normalizedEntries(after.image_entries);
  const beforeBinData = normalizedEntries(before.bindata_entries);
  const afterBinData = normalizedEntries(after.bindata_entries);
  const beforeRelationships = normalizedRelationships(before.relationships);
  const afterRelationships = normalizedRelationships(after.relationships);
  return completeGate([
    ...common.assertions,
    { assertion_id: "S07_image_entries_structurally_valid", expected: true, actual: before.image_entries, passed: Array.isArray(before.image_entries) && before.image_entries.length > 0 && before.image_entries.every(entryValid) && Array.isArray(after.image_entries) && after.image_entries.every(entryValid) },
    { assertion_id: "S07_image_path_size_sha256_equal", expected: beforeImages, actual: afterImages, passed: deepEqual(beforeImages, afterImages) },
    { assertion_id: "S07_bindata_entries_structurally_valid", expected: true, actual: before.bindata_entries, passed: Array.isArray(before.bindata_entries) && before.bindata_entries.length > 0 && before.bindata_entries.every(entryValid) && Array.isArray(after.bindata_entries) && after.bindata_entries.every(entryValid) },
    { assertion_id: "S07_bindata_path_size_sha256_equal", expected: beforeBinData, actual: afterBinData, passed: deepEqual(beforeBinData, afterBinData) },
    { assertion_id: "S07_relationship_records_structurally_valid", expected: true, actual: before.relationships, passed: Array.isArray(before.relationships) && before.relationships.length > 0 && before.relationships.every(relationshipValid) && Array.isArray(after.relationships) && after.relationships.every(relationshipValid) },
    { assertion_id: "S07_relationship_source_id_type_target_reference_equal", expected: beforeRelationships, actual: afterRelationships, passed: deepEqual(beforeRelationships, afterRelationships) },
    allowedDiffAssertion(before.entry_hashes, after.entry_hashes, evidence.allowed_target_diff),
    nonTargetHashAssertion(before.entry_hashes, after.entry_hashes, evidence.allowed_target_diff),
    validateScenarioAssertions(evidence.scenario_assertions),
  ], common.missing);
}

export function validateS08(evidence = {}) {
  const common = commonPreservationEvidence(evidence);
  const before = evidence.before ?? {};
  const after = evidence.after ?? {};
  for (const field of ["root_namespace_declarations", "section_namespace_declarations", "namespace_prefix_uri_map", "fwspace_count", "fwspace_paths", "fwspace_document_order", "entry_hashes"]) {
    if (!Object.hasOwn(before, field) || !Object.hasOwn(after, field)) common.missing.push(`S08_${field}_before_after_missing`);
  }
  return completeGate([
    ...common.assertions,
    { assertion_id: "S08_root_namespace_declarations_equal", expected: before.root_namespace_declarations, actual: after.root_namespace_declarations, passed: deepEqual(before.root_namespace_declarations, after.root_namespace_declarations) },
    { assertion_id: "S08_section_namespace_declarations_equal", expected: before.section_namespace_declarations, actual: after.section_namespace_declarations, passed: deepEqual(before.section_namespace_declarations, after.section_namespace_declarations) },
    { assertion_id: "S08_namespace_prefix_uri_map_equal", expected: before.namespace_prefix_uri_map, actual: after.namespace_prefix_uri_map, passed: deepEqual(before.namespace_prefix_uri_map, after.namespace_prefix_uri_map) },
    { assertion_id: "S08_fwspace_count_equal", expected: before.fwspace_count, actual: after.fwspace_count, passed: Number.isInteger(before.fwspace_count) && before.fwspace_count === after.fwspace_count },
    { assertion_id: "S08_fwspace_paths_equal_in_order", expected: before.fwspace_paths, actual: after.fwspace_paths, passed: Array.isArray(before.fwspace_paths) && deepEqual(before.fwspace_paths, after.fwspace_paths) },
    { assertion_id: "S08_fwspace_document_order_equal", expected: before.fwspace_document_order, actual: after.fwspace_document_order, passed: Array.isArray(before.fwspace_document_order) && deepEqual(before.fwspace_document_order, after.fwspace_document_order) },
    allowedDiffAssertion(before.entry_hashes, after.entry_hashes, evidence.allowed_target_diff),
    nonTargetHashAssertion(before.entry_hashes, after.entry_hashes, evidence.allowed_target_diff),
    validateScenarioAssertions(evidence.scenario_assertions),
  ], common.missing);
}

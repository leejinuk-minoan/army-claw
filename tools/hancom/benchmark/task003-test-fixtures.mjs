export const H1 = "1".repeat(64);
export const H2 = "2".repeat(64);
export const H3 = "3".repeat(64);
export const H4 = "4".repeat(64);
export function passedAssertions() { return [{ assertion_id: "target_changed_as_requested", expected: "new", actual: "new", passed: true, evidence_path: "evidence/assertions.json" }]; }
function artifact(path, sha256, size = 10) { return { path, sha256, size }; }
function inventory(...items) { return Object.fromEntries(items.map((x) => [x.path, { exists: true, actual_sha256: x.sha256, size: x.size }])); }
function base() {
  const before = artifact("snapshots/before.json", H1, 100), after = artifact("snapshots/after.json", H2, 100), output = artifact("outputs/mutated.hwpx", H3, 200);
  return { before_snapshot: before, after_snapshot: after, mutation_output: output, artifact_inventory: inventory(before, after, output), allowed_target_diff: ["Contents/section0.xml"], scenario_assertions: passedAssertions() };
}
export function validS06() { return { ...base(), before: { merged_cell_map: { A1: "A1:B2" }, row_span_map: { A1: 2 }, col_span_map: { A1: 2 }, non_target_entry_hashes: { "BinData/a.png": H4, "Contents/section0.xml": H1 } }, after: { merged_cell_map: { A1: "A1:B2" }, row_span_map: { A1: 2 }, col_span_map: { A1: 2 }, non_target_entry_hashes: { "BinData/a.png": H4, "Contents/section0.xml": H2 } } }; }
export function validS07() { return { ...base(), before: { image_entries: [{ path: "BinData/image1.png", size: 123, sha256: H1 }], bindata_entries: [{ path: "BinData/BIN0001.png", size: 123, sha256: H1 }], relationship_targets: ["BinData/BIN0001.png"], non_target_entry_hashes: { "BinData/BIN0001.png": H1, "Contents/section0.xml": H1 } }, after: { image_entries: [{ path: "BinData/image1.png", size: 123, sha256: H1 }], bindata_entries: [{ path: "BinData/BIN0001.png", size: 123, sha256: H1 }], relationship_targets: ["BinData/BIN0001.png"], non_target_entry_hashes: { "BinData/BIN0001.png": H1, "Contents/section0.xml": H2 } } }; }
export function validS08() { return { ...base(), before: { fwspace_count: 2, fwspace_paths: ["/section/p[1]/fwSpace", "/section/p[2]/fwSpace"], namespace_prefix_uri_map: { hp: "urn:hancom:hp", hs: "urn:hancom:hs" }, root_section_namespace: { root: "hs", section: "hp" }, non_target_entry_hashes: { "BinData/BIN0001.png": H1, "Contents/section0.xml": H1 } }, after: { fwspace_count: 2, fwspace_paths: ["/section/p[1]/fwSpace", "/section/p[2]/fwSpace"], namespace_prefix_uri_map: { hp: "urn:hancom:hp", hs: "urn:hancom:hs" }, root_section_namespace: { root: "hs", section: "hp" }, non_target_entry_hashes: { "BinData/BIN0001.png": H1, "Contents/section0.xml": H2 } } }; }

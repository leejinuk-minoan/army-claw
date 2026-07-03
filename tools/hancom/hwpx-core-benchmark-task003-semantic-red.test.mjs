import test from "node:test";
import assert from "node:assert/strict";
import { validateS06, validateS07, validateS08 } from "./benchmark/task003-preservation-validators.mjs";
import { createPreservationFixture, TEST_HASHES, validRelationship } from "./benchmark/task003-test-fixtures.mjs";

const clone = (value) => structuredClone(value);
function validS06(base) {
  return { ...base, before: { merged_cell_map: { A1: "A1:B2" }, row_span_map: { A1: 2 }, col_span_map: { A1: 2 }, entry_hashes: { "Contents/section0.xml": TEST_HASHES.sectionBefore, "BinData/a.png": TEST_HASHES.preserved } }, after: { merged_cell_map: { A1: "A1:B2" }, row_span_map: { A1: 2 }, col_span_map: { A1: 2 }, entry_hashes: { "Contents/section0.xml": TEST_HASHES.sectionAfter, "BinData/a.png": TEST_HASHES.preserved } } };
}
function validS07(base) {
  const image = { path: "BinData/a.png", size: 5, sha256: TEST_HASHES.preserved };
  const bin = { path: "BinData/BIN0001.png", size: 6, sha256: TEST_HASHES.preserved };
  return { ...base, before: { image_entries: [image], bindata_entries: [bin], relationships: [validRelationship()], entry_hashes: { "Contents/section0.xml": TEST_HASHES.sectionBefore, "BinData/BIN0001.png": TEST_HASHES.preserved } }, after: { image_entries: [image], bindata_entries: [bin], relationships: [validRelationship()], entry_hashes: { "Contents/section0.xml": TEST_HASHES.sectionAfter, "BinData/BIN0001.png": TEST_HASHES.preserved } } };
}
function validS08(base) {
  const root = { hp: "urn:hancom:hp", hs: "urn:hancom:hs" };
  const sections = [{ section_path: "Contents/section0.xml", declarations: root }];
  const paths = ["/section/p[1]/fwSpace", "/section/p[2]/fwSpace"];
  return { ...base, before: { root_namespace_declarations: root, section_namespace_declarations: sections, namespace_prefix_uri_map: root, fwspace_count: 2, fwspace_paths: paths, fwspace_document_order: paths, entry_hashes: { "Contents/section0.xml": TEST_HASHES.sectionBefore, "BinData/a.png": TEST_HASHES.preserved } }, after: { root_namespace_declarations: root, section_namespace_declarations: sections, namespace_prefix_uri_map: root, fwspace_count: 2, fwspace_paths: paths, fwspace_document_order: paths, entry_hashes: { "Contents/section0.xml": TEST_HASHES.sectionAfter, "BinData/a.png": TEST_HASHES.preserved } } };
}
async function base() { return (await createPreservationFixture()).evidence; }
function expectInvalid(result, pattern) { assert.equal(result.valid, false); assert.match(result.missing_evidence.join("\n"), pattern); }

test("S06 merged-cell map mismatch is RED", async () => { const e = validS06(await base()); e.after.merged_cell_map = { A1: "A1:C3" }; expectInvalid(validateS06(e), /merged_cell_map/u); });
test("S06 row-span mismatch is RED", async () => { const e = validS06(await base()); e.after.row_span_map = { A1: 3 }; expectInvalid(validateS06(e), /row_span/u); });
test("S06 col-span mismatch is RED", async () => { const e = validS06(await base()); e.after.col_span_map = { A1: 3 }; expectInvalid(validateS06(e), /col_span/u); });
test("S06 identical input and output HWPX is RED", async () => { const e = validS06(await base()); e.output_hwpx = clone(e.input_hwpx); e.after_snapshot.source_hwpx_path = e.input_hwpx.path; e.after_snapshot.source_hwpx_sha256 = e.input_hwpx.sha256; expectInvalid(validateS06(e), /input_output_hwpx_distinct_identity/u); });

test("S07 image path mismatch is RED", async () => { const e = validS07(await base()); e.after.image_entries[0].path = "BinData/other.png"; expectInvalid(validateS07(e), /image_path_size_sha256_equal/u); });
test("S07 image size mismatch is RED", async () => { const e = validS07(await base()); e.after.image_entries[0].size += 1; expectInvalid(validateS07(e), /image_path_size_sha256_equal/u); });
test("S07 image SHA mismatch is RED", async () => { const e = validS07(await base()); e.after.image_entries[0].sha256 = TEST_HASHES.sectionAfter; expectInvalid(validateS07(e), /image_path_size_sha256_equal/u); });
test("S07 BinData mismatch is RED", async () => { const e = validS07(await base()); e.after.bindata_entries[0].sha256 = TEST_HASHES.sectionAfter; expectInvalid(validateS07(e), /bindata_path_size_sha256_equal/u); });
for (const field of ["relationship_source_path", "relationship_id", "relationship_type", "relationship_target", "reference_source_path"]) {
  test(`S07 relationship ${field} mismatch is RED`, async () => { const e = validS07(await base()); e.after.relationships[0][field] = `${e.after.relationships[0][field]}-changed`; expectInvalid(validateS07(e), /relationship_source_id_type_target_reference_equal/u); });
}

test("S08 fwSpace count mismatch is RED", async () => { const e = validS08(await base()); e.after.fwspace_count = 1; expectInvalid(validateS08(e), /fwspace_count/u); });
test("S08 fwSpace path mismatch is RED", async () => { const e = validS08(await base()); e.after.fwspace_paths[0] = "/section/p[9]/fwSpace"; expectInvalid(validateS08(e), /fwspace_paths/u); });
test("S08 fwSpace document order mismatch is RED", async () => { const e = validS08(await base()); e.after.fwspace_document_order.reverse(); expectInvalid(validateS08(e), /fwspace_document_order/u); });
test("S08 root namespace mismatch is RED", async () => { const e = validS08(await base()); e.after.root_namespace_declarations.hp = "urn:changed"; expectInvalid(validateS08(e), /root_namespace/u); });
test("S08 section namespace mismatch is RED", async () => { const e = validS08(await base()); e.after.section_namespace_declarations[0].declarations.hp = "urn:changed"; expectInvalid(validateS08(e), /section_namespace/u); });

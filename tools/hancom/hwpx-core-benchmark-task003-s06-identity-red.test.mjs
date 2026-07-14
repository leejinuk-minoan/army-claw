import test from "node:test";
import assert from "node:assert/strict";
import { validateS06 } from "./benchmark/task003-preservation-validators.mjs";
import { createPreservationFixture, TEST_HASHES } from "./benchmark/task003-test-fixtures.mjs";

function validS06(base) {
  return {
    ...base,
    before: {
      merged_cell_map: { A1: "A1:B2" },
      row_span_map: { A1: 2 },
      col_span_map: { A1: 2 },
      entry_hashes: { "Contents/section0.xml": TEST_HASHES.sectionBefore, "BinData/a.png": TEST_HASHES.preserved },
    },
    after: {
      merged_cell_map: { A1: "A1:B2" },
      row_span_map: { A1: 2 },
      col_span_map: { A1: 2 },
      entry_hashes: { "Contents/section0.xml": TEST_HASHES.sectionAfter, "BinData/a.png": TEST_HASHES.preserved },
    },
  };
}

async function fixture() {
  return validS06((await createPreservationFixture()).evidence);
}

function alignOutputReference(evidence) {
  evidence.after_snapshot.source_hwpx_path = evidence.output_hwpx.path;
  evidence.after_snapshot.source_hwpx_sha256 = evidence.output_hwpx.sha256;
  evidence.file_probes[evidence.output_hwpx.path] = {
    ...evidence.file_probes[evidence.output_hwpx.path],
    path: evidence.output_hwpx.path,
    sha256: evidence.output_hwpx.sha256,
  };
}

function expectIdentityFailure(evidence) {
  const result = validateS06(evidence);
  assert.equal(result.valid, false);
  assert.match(result.missing_evidence.join("\n"), /input_output_hwpx_distinct_identity/u);
}

test("S06 rejects same path with different SHA", async () => {
  const evidence = await fixture();
  evidence.output_hwpx.path = evidence.input_hwpx.path;
  alignOutputReference(evidence);
  expectIdentityFailure(evidence);
});

test("S06 rejects different path with identical SHA", async () => {
  const evidence = await fixture();
  evidence.output_hwpx.sha256 = evidence.input_hwpx.sha256;
  alignOutputReference(evidence);
  expectIdentityFailure(evidence);
});

test("S06 rejects same path with identical SHA", async () => {
  const evidence = await fixture();
  evidence.output_hwpx.path = evidence.input_hwpx.path;
  evidence.output_hwpx.sha256 = evidence.input_hwpx.sha256;
  alignOutputReference(evidence);
  expectIdentityFailure(evidence);
});

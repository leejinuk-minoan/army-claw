import test from "node:test";
import assert from "node:assert/strict";
import {
  DeterministicCompressionProvider,
  validateCompressionResult,
} from "./army-claw-hancom-tools.mjs";

const request = {
  request_id: "main-2-current-problem-attempt-2",
  board_id: "main-2",
  field_id: "current_problem",
  heading_role: "current_state_and_problem",
  original_text: "직접 생성 HWPX는 복잡한 양식 표현과 긴 문단 배치가 불안정하다. 따라서 네이티브 템플릿을 유지하면서 board 안에서 줄 배치를 재계산해야 한다.",
  target_lines: 2,
  target_characters: 70,
  required_facts: ["HWPX 표현 한계", "네이티브 템플릿 유지", "줄 배치 재계산"],
  required_terms: ["HWPX", "네이티브 템플릿"],
  protected_numbers: [],
};

test("deterministic compression preserves required facts and terms within target length", async () => {
  const provider = new DeterministicCompressionProvider();
  const response = await provider.compress(request);
  const validation = validateCompressionResult(request, response);

  assert.equal(validation.validation_status, "passed");
  assert.equal(response.validation_status, "passed");
  assert.equal(response.compressed_text.length <= request.target_characters, true);
  assert.deepEqual(validation.changed_numbers, []);
  assert.equal(validation.preserved_terms.includes("HWPX"), true);
});

test("compression validator rejects missing required facts, changed numbers, repeated text, and XML markers", () => {
  const bad = validateCompressionResult(
    { ...request, protected_numbers: ["11"] },
    {
      compressed_text: "HWPX <hp:fwSpace/> 12 12",
      preserved_facts: [],
      preserved_terms: ["HWPX"],
      changed_numbers: ["12"],
      validation_status: "passed",
    },
  );

  assert.equal(bad.validation_status, "failed");
  assert.match(bad.errors.join(";"), /compression_required_fact_missing/u);
  assert.match(bad.errors.join(";"), /compression_number_changed/u);
  assert.match(bad.errors.join(";"), /compression_xml_marker/u);
});

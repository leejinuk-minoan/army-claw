import test from "node:test";
import assert from "node:assert/strict";
import {
  analyzeHwpxTemplate,
  createAdaptiveBoardFitPlan,
  runAdaptiveBoardFit,
} from "./army-claw-hancom-tools.mjs";

const longMain2 = {
  overview: "Army Claw는 로컬 LLM과 한컴오피스 도구를 결합해 단독망 PC에서 HWPX 문서 작성을 자동화한다.",
  current_problem: "직접 생성 HWPX는 복잡한 양식 표현과 긴 문단 배치가 불안정하다. 따라서 네이티브 템플릿을 유지하면서 board 안에서 줄 배치를 재계산해야 한다.",
  improvement: "DocumentOrderIndex로 대상 범위를 고정하고 leaf 문단만 선택해 의미 블록을 안전하게 치환한다.",
  expected_effect_1: "한글 네이티브 양식과 이미지 BinData를 유지한 채 본문을 교체한다.",
  expected_effect_2: "보드 경계 안에서 줄 배치를 재계산해 다음 페이지 밀림을 방지한다.",
  expected_effect_3: "LLM 결과를 검증된 JSON 치환 계획으로 바꾸는 기반을 확보한다.",
};

test("adaptive board fit detects overflow then accepts deterministic semantic compression without page spill", async () => {
  const plan = createAdaptiveBoardFitPlan({
    boardId: "main-2",
    fields: longMain2,
    board: { available_lines: 9, support_board_id: "support-2", next_board_id: "main-3" },
    overflow_policy: { mode: "adaptive_fit", allow_page_spill: false, maximum_attempts: 4 },
  });

  assert.equal(plan.initial_overflow_detected, true);
  assert.notEqual(plan.overflow_resolution_status, "overflow_unresolved");
  assert.equal(plan.accepted_attempt.strategy, "semantic_compression");
  assert.equal(plan.support_2_anchor_preserved, true);
  assert.equal(plan.main_3_anchor_preserved, true);
  assert.equal(plan.board_spill_detected, false);
  assert.equal(plan.required_facts_preserved, true);
  assert.equal(plan.required_terms_preserved, true);
  assert.equal(plan.protected_numbers_preserved, true);
});

test("adaptive board fit records all attempts and never treats detected overflow as final unresolved state", async () => {
  const plan = createAdaptiveBoardFitPlan({
    boardId: "main-2",
    fields: longMain2,
    board: { available_lines: 9, support_board_id: "support-2", next_board_id: "main-3" },
  });

  assert.equal(plan.attempts[0].overflow_before, true);
  assert.equal(plan.attempts.some((attempt) => attempt.strategy === "remove_redundant_spacing"), true);
  assert.equal(plan.attempts.some((attempt) => attempt.strategy === "semantic_compression"), true);
  assert.equal(plan.accepted_attempt.accepted, true);
});

test("adaptive board fit returns overflow_unresolved only after every bounded strategy fails", async () => {
  const plan = createAdaptiveBoardFitPlan({
    boardId: "main-2",
    fields: {
      overview: `${longMain2.overview} `.repeat(20),
      current_problem: `${longMain2.current_problem} `.repeat(20),
      improvement: `${longMain2.improvement} `.repeat(20),
      expected_effect_1: `${longMain2.expected_effect_1} `.repeat(20),
      expected_effect_2: `${longMain2.expected_effect_2} `.repeat(20),
      expected_effect_3: `${longMain2.expected_effect_3} `.repeat(20),
    },
    board: { available_lines: 2, support_board_id: "support-2", next_board_id: "main-3" },
    compressionProvider: {
      compress() {
        return {
          compressed_text: "HWPX 템플릿",
          preserved_facts: [],
          preserved_terms: ["HWPX"],
          changed_numbers: [],
          validation_status: "failed",
        };
      },
    },
  });

  assert.equal(plan.overflow_resolution_status, "overflow_unresolved");
  assert.equal(plan.accepted_attempt, null);
  assert.equal(plan.attempts.at(-1).accepted, false);
});

test("runAdaptiveBoardFit produces v5 output and diagnostics without calling LLM", async () => {
  const result = await runAdaptiveBoardFit({
    workspace: process.cwd(),
    inputPath: "release/test-documents/army-claw-qualification-review-template-fidelity-v4.hwpx",
    outputPath: "release/test-documents/.tmp-adaptive-test-v5.hwpx",
    fields: longMain2,
    env: { ARMY_CLAW_DISABLE_LLM_FOR_HWP_ENGINE_TESTS: "1" },
  });

  assert.equal(result.plan.actual_llm_connection_status, "not_started");
  assert.equal(result.plan.initial_overflow_detected, true);
  assert.equal(result.plan.board_spill_detected, false);
  assert.equal(result.validation.valid, true);
  assert.equal(result.diagnostics.applied_replacements >= 8, true);

  const analysis = await analyzeHwpxTemplate({
    workspace: process.cwd(),
    path: "release/test-documents/.tmp-adaptive-test-v5.hwpx",
  });
  assert.match(analysis.text, /보조\s+11\s*-\s*2/u);
  assert.match(analysis.text, /주\s+11\s*-\s*3/u);
});

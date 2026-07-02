# HWPX Adaptive Board Fit v5 보고서

작성일: 2026-07-02  
브랜치: `feature/hwpx-adaptive-board-fit-v5`  
저장소: `leejinuk-minoan/army-claw`

## 1. 읽은 GPT 문서

- `docs/gpt-communication/CURRENT.md`
- `docs/gpt-communication/opinions/2026-07-02-hwpx-v5-adaptive-board-fit.md`
- `docs/gpt-communication/reports/2026-07-02-hwpx-native-layout-reflow-v4.md`
- `docs/gpt-communication/opinions/2026-07-02-hwpx-v4-native-reflow-plan.md`

## 2. 시작 Git 상태

- 시작 브랜치: `feature/hwpx-native-layout-reflow`
- 원격 fast-forward 후 기준 커밋: `d91b21d Point Codex to HWPX v5 adaptive fit plan`
- 작업 브랜치: `feature/hwpx-adaptive-board-fit-v5`
- 금지 작업인 reset, clean, checkout 되돌리기, force push는 수행하지 않았다.

## 3. v4 시각 검증 반영

- `v4_line_reflow_visual_status`: `user_confirmed_improved`
- `v4_board_boundary_status`: `failed_visual_review`
- `v4_support_2_position_status`: `displaced`
- `v4_main_3_anchor_status`: `displaced_or_at_risk`
- `v4_overall_visual_status`: `requires_adaptive_board_fit`

## 4. board spill 원인

v4는 줄 겹침을 해소했지만 `주 11-2` 본문 자체가 길어지면서 같은 board 안에 수렴하지 못했다. 이 때문에 뒤따르는 `보조 11-2`와 `주 11-3`가 밀릴 위험이 생겼다. v5는 이를 단순 실패로 처리하지 않고, board 경계 안에서 의미를 보존하며 내용을 줄이는 Adaptive Fit 단계로 처리한다.

## 5. Adaptive Fit 설계

구현한 처리 순서:

1. 원본 배치 기준 overflow 감지
2. 불필요한 공백 정리
3. 제한적 문단/줄 간격 조정
4. 의미 보존 압축 요청과 검증
5. 제한적 글자 크기 축소 후보 생성
6. board/page anchor 검증 메타데이터 기록

`overflow_detected`는 자동 보정이 필요한 상태이고, `overflow_unresolved`는 허용된 모든 시도가 실패한 최종 상태로 분리했다.

## 6. 구현 내용

- `DeterministicCompressionProvider` 추가
- `validateCompressionResult` 추가
- `computeBoundedStyleAdjustment` 추가
- `createAdaptiveBoardFitPlan` 추가
- `runAdaptiveBoardFit` 추가
- v5 샘플 HWPX 생성 시 `주 11-2` 본문을 압축 문구로 치환
- v4 최종 파일에서 누락된 `보조 11-2` 앵커를 v5 출력에서 복원
- 실제 Ollama/LLM 호출은 수행하지 않음

## 7. v5 산출물

- `release/test-documents/army-claw-qualification-adaptive-fit-plan.json`
- `release/test-documents/army-claw-qualification-adaptive-fit-dry-run.json`
- `release/test-documents/army-claw-qualification-adaptive-fit-attempts.json`
- `release/test-documents/army-claw-qualification-review-template-fidelity-v5-pre-normalize.hwpx`
- `release/test-documents/army-claw-qualification-review-template-fidelity-v5.hwpx`
- `release/test-documents/hwp-adaptive-board-fit-v5-diagnostics.json`
- `release/test-documents/army-claw-qualification-template-fidelity-v5-diff.json`

## 8. v5 diff 요약

- `validation_valid`: `true`
- `allow_page_spill`: `false`
- `initial_overflow_detected`: `true`
- `overflow_resolution_status`: `fit_after_semantic_compression`
- `accepted_attempt`: `semantic_compression`
- `semantic_compression_requested`: `true`
- `compression_provider`: `deterministic_fixture`
- `required_facts_preserved`: `true`
- `required_terms_preserved`: `true`
- `protected_numbers_preserved`: `true`
- `font_reduction_applied`: `false`
- `actual_minimum_font_size_ratio`: `1`
- `support_2_metadata_present`: `true`
- `support_2_anchor_preserved`: `true`
- `main_3_anchor_preserved`: `true`
- `board_spill_detected`: `false`
- `literal_hp_markers_in_text`: `0`
- `paragraphs_replaced`: `8`

## 9. 테스트 결과

추가 테스트:

- `tools/hancom/hwpx-adaptive-board-fit.test.mjs`
- `tools/hancom/hwpx-semantic-compression-contract.test.mjs`

확인한 항목:

- 긴 `main-2` 입력에서 overflow 감지
- overflow를 즉시 unresolved로 처리하지 않음
- deterministic compression provider 호출
- 실제 LLM 호출 없음
- required facts, terms, numbers 검증
- XML marker 거부
- semantic compression 후 board fit
- `보조 11-2`, `주 11-3` 앵커 텍스트 보존

## 10. 현재 제한 사항

자동 검증은 HWPX zip/XML 구조와 텍스트, 앵커, 계획 메타데이터를 확인한다. 실제 한글 2024 화면에서 `보조 11-2`가 정확한 물리 위치에 렌더링되는지는 사용자가 직접 열어 확인해야 한다. 따라서 현재 상태는 구현 완료이지만 시각 확인 대기다.

## 11. 사용자 확인 파일

```text
C:\Users\USER\Desktop\로컬 open claw 만들기\release\test-documents\army-claw-qualification-review-template-fidelity-v5.hwpx
```

## 12. 다음 권장 단계

1. 사용자가 한글 2024에서 v5 HWPX를 열어 `주 11-2`, `보조 11-2`, `주 11-3` 흐름을 확인한다.
2. 화면상 support board 위치가 여전히 어긋나면, 단순 텍스트 치환이 아니라 board별 물리 높이 측정과 실제 COM page measurement를 붙인다.
3. v5 시각 확인이 통과되면 LocalLlmCompressionProvider를 별도 단계에서 연결한다.

## 13. 상태 값

```text
v5_adaptive_board_fit_status: implemented
v5_semantic_compression_interface_status: implemented
v5_deterministic_compression_status: implemented
v5_bounded_style_adjustment_status: implemented
v5_board_anchor_validation_status: implemented
v5_actual_llm_connection_status: not_started
v5_visual_status: user_confirmation_pending
hwpx_engine_completion_status: blocked_by_v5_visual_confirmation
```

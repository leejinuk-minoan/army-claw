# HWPX Native Layout Reflow v4 보고서

작성일: 2026-07-02  
브랜치: `feature/hwpx-native-layout-reflow`  
기준 브랜치: `feature/hwpx-template-fidelity-semantic-blocks`  
저장소: `leejinuk-minoan/army-claw`

## 1. 읽은 GPT 문서

- `docs/gpt-communication/CURRENT.md`
- `docs/gpt-communication/opinions/2026-07-02-hwpx-v4-native-reflow-plan.md`
- `docs/gpt-communication/opinions/2026-07-02-hwpx-v3-visual-review-and-reflow.md`
- `docs/gpt-communication/reports/2026-07-02-hwpx-template-fidelity-semantic-blocks.md`

## 2. 시작 Git 상태

- 시작 브랜치: `feature/hwpx-template-fidelity-semantic-blocks`
- 원격 fast-forward 후 기준 커밋: `b748721 Point Codex to HWPX v4 native reflow plan`
- 작업 브랜치: `feature/hwpx-native-layout-reflow`
- 금지 작업인 reset, clean, checkout 되돌리기, force push는 수행하지 않았다.

## 3. v3 시각 검증 반영

- `v3_cover_visual_status`: `user_confirmed_success`
- `v3_non_target_main_board_status`: `preserved_as_designed`
- `v3_semantic_replacement_status`: `applied`
- `v3_line_reflow_status`: `failed_visual_review`
- `v3_detail_page_container_selection_status`: `failed_visual_review`
- `v3_inline_element_serialization_status`: `failed_visual_review`
- `v3_overall_visual_status`: `requires_engine_fix`

기술 원인은 긴 replacement 문장이 기존 `hp:linesegarray` 줄 배치 캐시를 유지한 상태로 들어가면서 줄 겹침이 발생한 것이다. 또한 structural container와 leaf paragraph가 분리되지 않아 보조 영역에서 중복 선택 위험이 있었고, 검색용 inline marker가 출력 텍스트에 남을 수 있었다.

## 4. Reflow 실험 결과

실험 기록:

```text
release/test-documents/hwpx-native-reflow-experiment.json
```

- A: 기존 `hp:linesegarray` 유지 방식은 v3 시각 검증에서 줄 겹침 문제가 확인되어 선택하지 않았다.
- B: 변경 문단의 `hp:linesegarray`만 제거하는 방식을 선택했다.
- C: B 산출물을 한글 2024 COM으로 열고 별도 HWPX로 저장하는 native normalize를 수행했다.

## 5. 구현 내용

- `layout_policy`: `preserve_exact`, `allow_line_growth`, `fit_or_fail`
- `allow_line_growth` 대상 문단의 `hp:linesegarray`만 제거
- 전체 section의 line layout을 무차별 삭제하지 않음
- `paragraph_leaf`, `paragraph_structural_container`, `table_cell_paragraph`, `draw_text_paragraph` 분리
- selector는 기본적으로 leaf paragraph만 선택
- 동일 leaf 중복 선택 시 `duplicate_leaf_replacement`로 실패
- `<hp:fwSpace/>` literal marker가 `hp:t`와 preview에 남지 않도록 정리
- 주/보조 board metadata 생성
- `native-layout-normalize` COM 진단 모드 추가

## 6. v4 산출물

- v4 plan: `release/test-documents/army-claw-qualification-native-reflow-plan.json`
- dry-run: `release/test-documents/army-claw-qualification-native-reflow-dry-run.json`
- pre-normalize: `release/test-documents/army-claw-qualification-review-template-fidelity-v4-pre-normalize.hwpx`
- 최종 v4 HWPX: `release/test-documents/army-claw-qualification-review-template-fidelity-v4.hwpx`
- COM diagnostics: `release/test-documents/hwp-native-layout-normalize-v4-diagnostics.json`
- v4 diff: `release/test-documents/army-claw-qualification-template-fidelity-v4-diff.json`

## 7. v4 diff 요약

- `validation_valid`: `true`
- `preserve_exact_count`: `5`
- `allow_line_growth_count`: `13`
- `fit_or_fail_count`: `0`
- `target_linesegarrays_invalidated`: `13`
- `native_normalize_status`: `passed`
- `native_normalize_source_unchanged`: `true`
- `paragraphs_replaced`: `18`
- `paragraphs_blanked`: `0`
- `blanked_originally_nonempty_paragraphs`: `0`
- `ancestor_descendant_conflicts`: `[]`
- `overlapping_selector_conflicts`: `[]`
- `literal_hp_markers_in_text`: `0`
- `binData_preserved`: `true`
- `table_count_before/after`: `43 -> 43`
- `image_count_before/after`: `12 -> 12`
- `paragraph_count_before/pre/after`: `476 -> 476 -> 474`
- `non_target_scope_hashes_preserved`: `true`

한글 2024 COM 저장 과정에서 BinData 파일 확장자 대소문자와 일부 내부 XML이 정상화되며 빈 문단 2개가 접혔다. source 파일 SHA는 변경되지 않았다.

## 8. 테스트 결과

추가 테스트:

- `tools/hancom/hwpx-native-line-reflow.test.mjs`
- `tools/hancom/hwpx-inline-token-serialization.test.mjs`
- `tools/hancom/hwpx-document-order-container-leaf.test.mjs`
- `tools/hancom/hwpx-board-metadata.test.mjs`
- `tools/hancom/hwp-native-layout-normalize.test.ps1`

최종 테스트 결과는 커밋 직전 명령 출력 기준으로 기록한다.

## 9. 사용자 확인 항목

파일:

```text
C:\Users\USER\Desktop\로컬 open claw 만들기\release\test-documents\army-claw-qualification-review-template-fidelity-v4.hwpx
```

확인 항목:

- 표지가 정상 상태를 유지하는지
- `주 11-1` 원문 상태가 유지되는지
- `주 11-2` 개요, 현 실태/문제점, 개선내용, 기대효과가 겹치지 않고 읽히는지
- 글자 폭, 자간, 크기가 비정상적으로 줄어들지 않았는지
- `보조 11-2` 영역이 중복 표시되지 않는지
- `<hp:fwSpace/>` 문자열이 화면에 보이지 않는지
- 이미지, 도형, 페이지 경계가 유지되는지
- 3/11 이후 비대상 내용이 변경되지 않았는지

## 10. 현재 상태

- `v4_native_reflow_status`: `implemented`
- `v4_native_layout_normalize_status`: `implemented`
- `v4_container_leaf_selection_status`: `implemented`
- `v4_inline_serialization_status`: `implemented`
- `v4_visual_status`: `user_confirmation_pending`
- `hwpx_engine_completion_status`: `blocked_by_v4_visual_confirmation`

## 11. 제한 사항과 다음 단계

v4는 한글 2024에서 다시 열어 시각 확인해야 한다. 자동 검증은 구조와 텍스트, BinData 보존을 확인하지만 실제 줄 겹침 여부는 한글 화면 확인이 최종 판정이다.

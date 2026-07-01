# HWPX Template Fidelity 의미 블록 확장 보고서

작성일: 2026-07-02  
브랜치: `feature/hwpx-template-fidelity-semantic-blocks`  
기준 브랜치: `feature/hwpx-template-fidelity-selectors`  
저장소: `leejinuk-minoan/army-claw`

## 1. 작업 목표

이번 작업은 HWPX Template Fidelity 기능을 단일 문단·표 셀 치환에서 페이지 범위와 의미 블록 단위 치환으로 확장하는 것이다. v2는 한글 2024 네이티브 HWPX 구조, 스타일, 표, 이미지 보존에는 성공했지만 대표 페이지에서 기존 업무 문장 일부가 남는 문제가 있었다. 원인은 하나의 의미 단위가 여러 문단과 run에 걸쳐 있는데, 기존 selector가 단일 문단 중심으로만 동작했기 때문이다.

## 2. 구현 범위

- `DocumentOrderIndex` 추가
- `anchor_range` scope 추가
- `near_text` scope 기반 구조 추가
- `paragraph_block` selector 추가
- preserve 정책의 문단 수 보존 치환 추가
- dry-run에서 scope와 block preview 제공
- CLI `--scopes`, `--scopes-file` 옵션 추가
- LLM, Ollama, UI, 백엔드, 설치 파일은 변경하지 않음

## 3. 안전 정책

기본 정책은 `preserve`이다.

- 선택된 문단 수보다 replacement 문단 수가 많으면 적용 중단
- 남는 선택 문단은 빈 문단으로 유지
- 문단 삽입·삭제 없음
- BinData, 표, 이미지, 미대상 Zip entry 보존
- control-bearing 문단은 구조 변경 대상에서 보호

## 4. 생성 산출물

- 계획 파일: `release/test-documents/army-claw-qualification-semantic-block-plan.json`
- dry-run 파일: `release/test-documents/army-claw-qualification-semantic-block-dry-run.json`
- v3 HWPX: `release/test-documents/army-claw-qualification-review-template-fidelity-v3.hwpx`
- v3 diff: `release/test-documents/army-claw-qualification-template-fidelity-v3-diff.json`

## 5. v3 diff 요약

- `validation_valid`: `true`
- `scopes_requested`: `2`
- `scopes_resolved`: `2`
- `blocks_requested`: `5`
- `blocks_applied`: `5`
- `blocks_failed`: `0`
- `paragraphs_replaced`: `23`
- `paragraphs_blanked`: `2`
- `paragraphs_inserted`: `0`
- `paragraphs_deleted`: `0`
- `binData_preserved`: `true`
- `missing_entries`: `[]`
- `added_entries`: `[]`
- `unexpected_changed_entries`: `[]`
- `table_count_before/after`: `43 -> 43`
- `image_count_before/after`: `12 -> 12`
- `paragraph_count_before/after`: `476 -> 476`
- `non_target_scope_hashes_preserved`: `true`

## 6. 테스트

추가 테스트 파일:

- `tools/hancom/hwpx-template-fidelity-scopes.test.mjs`
- `tools/hancom/hwpx-template-fidelity-paragraph-blocks.test.mjs`

검증 내용:

- `anchor_range`가 반복 문단 중 지정 scope 내부 문단만 선택하는지 확인
- 중복 anchor가 있으면 output 생성 전에 중단하는지 확인
- `paragraph_block`이 preserve 정책으로 문단 수를 유지하는지 확인
- replacement 문단 수가 선택 문단 수보다 많으면 output 생성 없이 중단하는지 확인

## 7. 시각 확인 상태

v3 파일은 생성되었으며, 사용자가 한글 2024에서 열어 시각 확인해야 한다.

- 파일: `C:\Users\USER\Desktop\로컬 open claw 만들기\release\test-documents\army-claw-qualification-review-template-fidelity-v3.hwpx`
- `visual_confirmation_status`: `pending_user_confirmation`

## 8. 다음 작업

사용자 시각 확인 후 다음을 판단한다.

- 2쪽 대표 페이지의 문장 일관성 확인
- 원본 양식, 표, 이미지, 쪽 흐름 보존 확인
- 세부 페이지 영역의 내용 완성도 확인
- 필요 시 `paragraph_block` replacement 문장만 조정

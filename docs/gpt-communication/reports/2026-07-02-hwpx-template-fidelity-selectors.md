# HWPX Template Fidelity Selector 확장 보고서

작성일: 2026-07-02
브랜치: `feature/hwpx-template-fidelity-selectors`
기준 브랜치: `feature/hwp-engine-template-fidelity`

## 1. 기존 MVP 커밋 및 push

기존 Template Fidelity MVP는 별도 브랜치에 먼저 보존했다.

- 브랜치: `feature/hwp-engine-template-fidelity`
- MVP 커밋: `092bc89 Add HWP template fidelity conversion and preservation`
- 보고서 커밋: `c29465c Record HWP template fidelity visual confirmation`
- push 대상: `origin/feature/hwp-engine-template-fidelity`
- push 결과: 완료

사용자 확인 결과도 기존 보고서에 반영했다.

- `template_fidelity_open_status`: `user_confirmed_success`
- `cover_first_title_replacement_status`: `user_confirmed_success`
- `template_visual_structure_preservation_status`: `user_confirmed_success`
- `multi_selector_visual_status`: `not_started`
- `table_cell_selector_visual_status`: `not_started`

## 2. 작업 브랜치

새 기능은 MVP 브랜치에서 새 브랜치로 분리했다.

```text
feature/hwpx-template-fidelity-selectors
```

LLM, Ollama, 프롬프트, 백엔드, UI, 설치 파일은 변경하지 않았다. 이번 작업은 고정 JSON selector와 HWPX Template Fidelity 엔진만 다룬다.

## 3. 중첩 표 분석 보정

기존 분석기는 상위 표 내부의 모든 descendant `hp:tr`, `hp:tc`를 함께 수집할 수 있었다. 이 때문에 상위 표의 행/열 수와 병합 셀 주소가 실제 direct child 구조와 다르게 계산될 위험이 있었다.

수정 내용:

- `hp:tbl`을 균형 태그 기준으로 추출
- 상위 표는 direct child `hp:tr`만 계산
- 각 행은 direct child `hp:tc`만 계산
- 셀 안의 중첩 표는 별도 table node로 분석
- `table_path`와 `parentPath` 기록
- 중첩 표 경로 예: `section[0]/table[0]/cell[0,1]/table[0]`

테스트:

- `tools/hancom/hwp-reference-analyzer-nested-tables.test.mjs`

실제 자격심사 변환본 관측 결과:

- 기존 관측 표 수: 41
- 중첩 표 보정 후 관측 표 수: 43
- v2 산출물 전/후 표 수: 43 -> 43

## 4. Selector 스키마

추가된 selector:

- `paragraph_text`
- `paragraph_contains`
- `table_cell`
- `table_cell_text`

지원 필드:

- `expected_matches`
- `expected_matches_min`
- `expected_matches_max`
- `occurrence`
- `replace_mode`
- `expected_text`
- `overflow_policy`

`occurrence`는 전체 match 결과에서 1부터 시작하는 순번으로 해석한다.

## 5. Strict Match 규칙

다음 조건에서는 산출 HWPX를 쓰지 않고 중단한다.

- `expected_matches`와 실제 match 수 불일치
- `expected_matches_min` 미만
- `expected_matches_max` 초과
- `occurrence` 범위 초과
- `table_cell.expected_text`와 실제 셀 텍스트 불일치
- 지원하지 않는 selector type 사용

부분 적용 실패 시 최종 output 파일을 만들지 않는 테스트도 추가했다.

## 6. Dry-run 구조

추가된 API/CLI:

- `planHwpxTemplateFidelityFill`
- `hwpx-template-fidelity-plan`

dry-run 결과 파일:

```text
release/test-documents/army-claw-qualification-multi-selector-plan.json
```

주요 출력:

- `selectors`
- `match_count`
- `selected_matches`
- `table_path`
- `cell`
- `logical_text`
- `char_pr_ids`
- `can_apply`
- `errors`
- `warnings`

이번 v2 plan은 `can_apply: true`이고 selector 10개가 모두 적용 가능했다.

## 7. 표 셀 치환 방식

`table_cell` selector는 다음 기준으로 셀을 찾는다.

- `table_path`
- `row`
- `col`
- 선택적 `expected_text`

치환 시 보존하는 구조:

- `hp:tc`
- `cellAddr`
- `cellSpan`
- `cellSz`
- `borderFillIDRef`
- `cellMargin`
- `subList`

실제로 바뀌는 것은 셀 내부 첫 텍스트 run의 내용뿐이다.

## 8. Overflow 경고

각 selector는 원문과 치환문 길이를 비교한다.

- `length_ratio <= 1.20`: `low`
- `1.20 < length_ratio <= 1.50`: `medium`
- `length_ratio > 1.50`: `high`

`overflow_policy`가 `error`이면 high risk에서 중단하고, 기본값 `warn`에서는 경고만 남긴다. 이번 v2 산출물에는 overflow warning이 없었다.

## 9. v2 다중 치환 산출물

입력 템플릿:

```text
.tmp/hwp-reference-conversion/pk-table-qualification-review.hwpx
```

출력:

```text
release/test-documents/army-claw-qualification-review-template-fidelity-v2.hwpx
```

적용 selector:

- 첫 제목 문단 치환
- 둘째 제목 문단 치환
- 조직명 문단 치환
- 반복 개요 occurrence 선택
- 표적 페이지 제목 치환
- 반복 개요 본문 occurrence 선택
- 현 실태/문제점 occurrence 선택
- 개선내용 occurrence 선택
- 기대효과 하위 문장 occurrence 선택
- `section[0]/table[16]`의 `row=0`, `col=0` 표 셀 치환

## 10. v2 구조 보존 diff

diff 파일:

```text
release/test-documents/army-claw-qualification-template-fidelity-v2-diff.json
```

결과:

- `validation_valid`: `true`
- `selectors_requested`: 10
- `selectors_applied`: 10
- `selectors_failed`: 0
- `changed_paragraphs`: 9
- `changed_table_cells`: 1
- `binData_preserved`: `true`
- `missing_entries`: `[]`
- `added_entries`: `[]`
- 변경 엔트리: `Contents/section0.xml`, `Preview/PrvText.txt`
- 예기치 않은 변경 엔트리: `[]`
- 표 수: 43 -> 43
- 문단 수: 476 -> 476

텍스트 확인:

- 첫 제목 치환 확인
- 둘째 제목 치환 확인
- 조직명 치환 확인
- 표적 페이지 제목 치환 확인
- 표 셀 치환 확인

## 11. 테스트 결과

추가 테스트:

- `tools/hancom/hwpx-template-fidelity-selectors.test.mjs`
- `tools/hancom/hwp-reference-analyzer-nested-tables.test.mjs`

전체 Node 테스트:

```text
tests 28
pass 28
fail 0
```

PowerShell 진단 테스트:

```text
hwp-automation-diagnostics static contract passed
```

## 12. 사용자 확인 파일

한글 2024에서 확인할 파일:

```text
C:\Users\USER\Desktop\로컬 open claw 만들기\release\test-documents\army-claw-qualification-review-template-fidelity-v2.hwpx
```

확인 항목:

1. 파일이 정상적으로 열리는가
2. 첫 제목이 변경되었는가
3. 둘째 제목이 변경되었는가
4. 조직명이 `Army Claw 개발팀`으로 변경되었는가
5. 표적 페이지 제목이 변경되었는가
6. 표 셀 하나가 변경되었는가
7. 다른 페이지 본문은 의도치 않게 바뀌지 않았는가
8. 그림, 표, 병합 셀, 글상자, 페이지 구조가 유지되는가

현재 시각 확인 상태:

- `template_fidelity_multi_selector_status`: `implemented`
- `template_fidelity_multi_selector_visual_status`: `user_confirmation_pending`
- `template_fidelity_table_cell_visual_status`: `user_confirmation_pending`

## 13. 제한사항

- selector는 아직 문단/표 셀 텍스트 치환 중심이다.
- 이미지, 글상자, 도형 생성/삭제는 범위 밖이다.
- 한글 2024 화면 기준 최종 시각 성공은 사용자가 직접 확인해야 한다.
- 중첩 표 분석 보정으로 기존 관측 manifest의 표 개수는 과거 값과 달라질 수 있다.

## 14. 다음 권장 작업

1. v2 HWPX를 한글 2024에서 시각 확인한다.
2. selector schema를 실제 Army Claw 작업 실행 계층에 연결한다.
3. LLM은 직접 HWPX를 만들지 않고 selector JSON과 치환값 생성 역할로 제한한다.
4. 표 셀 selector에 `table_title`, `near_text`, `page_hint` 같은 보조 기준을 추가한다.

## 15. 커밋 및 push

- 구현 커밋 SHA: `199bd4e`
- 커밋 메시지: `Add strict HWPX template fidelity selectors`
- push 대상: `origin/feature/hwpx-template-fidelity-selectors`
- push 결과: 완료
- PR 생성 URL: `https://github.com/leejinuk-minoan/army-claw/pull/new/feature/hwpx-template-fidelity-selectors`

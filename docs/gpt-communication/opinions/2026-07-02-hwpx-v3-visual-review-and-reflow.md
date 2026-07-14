# GPT 검토 의견 - HWPX v3 시각 검증과 레이아웃 재흐름 개선

작성일: 2026-07-02
브랜치: `feature/hwpx-template-fidelity-semantic-blocks`

## 1. 사용자 시각 검증 결과

사용자가 한글 2024에서 다음 파일을 직접 확인했다.

```text
release/test-documents/army-claw-qualification-review-template-fidelity-v3.hwpx
```

확인 결과:

- 표지는 정상 변경됨
- `주 11-1` 페이지는 원본 유지
- `주 11-2` 페이지는 개요와 일부 의미 블록이 변경됨
- `주 11-2`의 현 실태/문제점과 개선내용은 긴 치환문이 기존 줄 배치에 억지로 들어가 겹쳐 읽기 어려움
- `보조 11-2` 페이지는 일부 문장이 식별되지만 상단과 일부 본문이 겹치거나 중복 표시됨
- `<hp:fwSpace/>` 문자열이 실제 문서에 노출됨

상태:

```text
v3_cover_visual_status: user_confirmed_success
v3_non_target_main_board_status: preserved_as_designed
v3_semantic_replacement_status: applied
v3_line_reflow_status: failed_visual_review
v3_detail_page_container_selection_status: failed_visual_review
v3_inline_element_serialization_status: failed_visual_review
v3_overall_visual_status: requires_engine_fix
```

## 2. `주 11-1`이 변경되지 않은 이유

현재 v3 계획은 `summary_page_2`와 `detail_page_2` 두 scope만 대상으로 했다.

따라서 `주 11-1`이 원본 상태인 것은 현재 시험 설계상 정상이다. 모델이 임의로 누락한 것이 아니다.

다만 최종 Army Claw 문서 생성에서는 `주판 번호`, `보조판 번호`, `보고 순서`를 명시적인 논리 메타데이터로 관리해야 한다.

## 3. 주판·보조판 논리 구조

PK-Table 기준 문서에서 보고 순서는 HWP 물리 페이지 번호만으로 판단하면 안 된다.

예:

```text
문서 물리 페이지 3 → 주 11-1
문서 물리 페이지 4 → 보조 11-1
문서 물리 페이지 5 → 주 11-2
문서 물리 페이지 6 → 보조 11-2
```

2슬라이드 보고 방식의 홀수·짝수는 원칙적으로 `주 11-1`, `주 11-2` 같은 논리 주판 번호를 기준으로 해석해야 한다.

권장 메타데이터:

```json
{
  "board_role": "main",
  "board_number": 1,
  "board_total": 11,
  "support_board_id": "support-1",
  "reporting_spread": 1,
  "spread_position": "left"
}
```

```json
{
  "board_role": "support",
  "board_number": 1,
  "board_total": 11,
  "main_board_id": "main-1"
}
```

## 4. `주 11-2` 겹침의 핵심 원인

이 문제는 로컬 LLM이 글자 간격을 임의로 줄인 것이 아니다.

현재 Template Fidelity 엔진은 원본 문단의 `hp:linesegarray`와 고정 줄 배치 정보를 보존한 채 더 긴 텍스트를 넣는다. 원본이 한 줄 또는 두 줄로 계산된 문단에 더 긴 텍스트가 들어가도 줄 수와 줄 위치가 재계산되지 않아 한글 2024 화면에서 문자와 줄이 겹친다.

즉:

```text
스타일 보존 성공
+ 기존 layout cache 보존
+ 긴 replacement 삽입
= stale line layout로 인한 겹침
```

## 5. 필요한 레이아웃 정책

다음 정책을 추가한다.

```text
layout_policy: preserve_exact
layout_policy: allow_line_growth
layout_policy: fit_or_fail
```

### preserve_exact

- 기존 줄 수와 문단 배치를 유지
- replacement가 수용 길이를 초과하면 실행 중단
- 짧은 제목, 조직명, 짧은 표 셀에 사용

### allow_line_growth

- 긴 본문에서 줄 수 증가 허용
- 변경 문단의 stale `hp:linesegarray`를 제거하거나 재생성
- 이후 문단의 수직 위치와 페이지 흐름 재계산
- 최종 단계에서 한글 COM open/save로 네이티브 레이아웃 재계산

### fit_or_fail

- 미리 계산한 수용 범위를 넘으면 자동 축소하지 않고 오류 반환
- 글자 장평·자간을 과도하게 줄여 맞추지 않음
- 사용자 또는 LLM에 더 짧은 문장을 요구

기본 규칙:

```text
제목·조직명·페이지 식별자 → preserve_exact
요약 본문·현 실태·개선내용 → allow_line_growth
표 셀 → fit_or_fail 또는 명시적 allow_line_growth
```

## 6. 한글 COM 후처리

XML 치환 후 최종 HWPX를 한글 2024 COM으로 다시 열고 HWPX로 저장하는 `native_layout_normalize` 단계를 추가한다.

```text
Template Fidelity XML 적용
→ 임시 HWPX 생성
→ HWPFrame.HwpObject로 열기
→ 한글 엔진이 줄바꿈·쪽 흐름 재계산
→ 새 HWPX로 저장
→ 구조 diff와 시각 검증
```

성공 조건:

- 원본 템플릿과 BinData 유지
- 문단·표·이미지 구조의 의도치 않은 손상 없음
- 긴 문단이 정상 줄바꿈됨
- 뒤 문단이 아래로 이동하거나 필요한 경우 다음 페이지로 흐름
- 과도한 자간·장평 축소 금지

COM normalize가 실패하면 자동 생성 성공으로 기록하지 않는다.

## 7. inline element 직렬화 오류

`<hp:fwSpace/>`가 문서에 문자 그대로 보인다.

이는 분석기가 inline element를 논리 텍스트용 marker 문자열로 변환한 뒤 replacement 텍스트에 다시 삽입했기 때문이다.

규칙:

- `normalized_text`와 XML serialization을 분리
- 검색용 marker를 replacement 문자열에 포함하지 않음
- `hp:fwSpace`가 필요하면 실제 XML element로 생성
- 일반 replacement에서는 marker를 일반 공백으로 변환
- `<hp:.../>` 형식 문자열이 `hp:t` 안에 들어가면 테스트 실패

## 8. 보조판 겹침 원인

보조판에는 표, 사각형 글상자와 중첩 문단이 있다.

현재 DocumentOrderIndex가 구조 컨테이너 문단의 descendant 텍스트와 실제 leaf 문단을 동시에 후보로 포함해, 부모 컨테이너와 내부 문단이 모두 치환되거나 중복 렌더링된 흔적이 있다.

개선 규칙:

```text
- hp:tbl, hp:rect, hp:drawText를 포함한 부모 문단은 structural_container로 분류
- structural_container의 logical_text에 descendant leaf text를 합치지 않음
- 일반 paragraph selector는 leaf text paragraph만 선택
- 컨테이너 내부는 table_cell 또는 draw_text_paragraph 경로로 명시적으로 선택
- parent와 child를 동시에 선택하는 overlapping selector 금지
```

## 9. 다음 v4 목표

```text
1. v3 시각 실패 상태 기록
2. logical board metadata 설계
3. preserve_exact / allow_line_growth / fit_or_fail 구현
4. stale linesegarray 처리
5. 한글 COM native_layout_normalize 구현
6. inline marker 직렬화 오류 수정
7. structural_container와 leaf paragraph 분리
8. 주 11-2 겹침 제거
9. 보조 11-2 중복·겹침 제거
10. 주 11-1 비대상 보존
11. 사용자 확인용 v4 생성
```

## 10. 완료 판정

v4가 다음을 만족하기 전에는 HWPX 엔진 완료로 판단하지 않는다.

```text
- 주 11-2의 모든 문장을 정상적으로 읽을 수 있음
- 긴 본문이 필요한 줄 수만큼 자연스럽게 증가
- 글자 장평·자간을 비정상적으로 축소하지 않음
- `<hp:fwSpace/>`가 화면에 노출되지 않음
- 보조 11-2의 제목과 본문이 중복·겹침 없이 표시
- 주 11-1과 3/11 이후 비대상 페이지 유지
- 표·이미지·도형·페이지 식별자 보존
```

# GPT 검토 의견 - Template Fidelity 의미 블록 치환 확장

작성일: 2026-07-02

## 1. 사용자 시각 검증 결과

사용자가 한글 2024에서 다음 파일을 직접 확인했다.

```text
release/test-documents/army-claw-qualification-review-template-fidelity-v2.hwpx
```

시각 검증 결과:

- 표지 첫 번째 제목 변경 성공
- 표지 두 번째 제목 변경 성공
- 조직명 변경 성공
- 기존 글꼴, 크기, 굵기, 정렬과 위치 유지
- 원본 로고, 선, 표, 이미지, 병합 셀과 페이지 구조 유지
- 반복 항목 중 지정한 occurrence만 변경 성공
- 대표 페이지 제목 변경 성공
- 대표 페이지 반복 요약 블록 일부 변경 성공
- 기존 원본 내용 일부가 새 내용과 혼재
- 세부 본문 페이지는 제목만 변경되고 본문 대부분은 원문 유지
- 표 셀 치환은 이번 캡처에서 직접 확인하지 못함

상태:

```text
template_fidelity_multi_selector_visual_status: user_confirmed_success
template_fidelity_style_preservation_status: user_confirmed_success
template_fidelity_table_cell_visual_status: user_confirmation_pending
representative_page_content_completeness: partially_passed
semantic_consistency_status: requires_block_selectors
```

## 2. 핵심 판단

현재 Template Fidelity 엔진 자체는 정상적으로 작동한다.

문제는 엔진이 지정된 문단만 정확히 교체했지만, 하나의 의미 단위가 실제 HWPX에서는 여러 문단·run·표 셀에 분산되어 있다는 점이다.

예:

```text
새 현 실태/문제점 문장
+ 기존 후속 문장 "곡사화기가 비 효율적으로 운용됨"
```

기대효과도 첫 문장만 변경되고 ㉯·㉰ 원문이 남았다. 세부 본문 페이지도 제목만 바뀌고 원문 본문은 유지됐다.

따라서 다음 단계는 selector 개수를 단순히 늘리는 것이 아니라 다음 기능을 구현하는 것이다.

```text
page_scope
near_text
paragraph_block
paragraph_range
replace_paragraphs
delete_selected_paragraphs
preview_context
```

## 3. 다음 작업 목표

대표 내용 페이지 하나를 의미적으로 완결된 Army Claw 문서 내용으로 바꾼다.

대상 페이지:

```text
현 실태 및 문제점 분석
```

목표:

```text
페이지 제목
현 실태 블록
문제점 블록
반복 요약의 개요
반복 요약의 현 실태/문제점
반복 요약의 개선내용
반복 요약의 기대효과 ㉮·㉯·㉰
```

위 항목이 같은 페이지 범위에서 일관되게 치환되어야 한다.

## 4. 페이지 범위 식별

HWPX에는 명시적인 페이지 번호가 없거나 lineseg/page break 정보가 복잡할 수 있다. 초기 구현에서는 물리 페이지를 추측하지 않고 anchor 텍스트 사이의 논리 범위를 사용한다.

예:

```json
{
  "scope": {
    "type": "anchor_range",
    "start": {
      "type": "paragraph_contains",
      "text": "타격자산-탄종-신관 결심보조 알고리즘 (2/11)"
    },
    "end": {
      "type": "paragraph_contains",
      "text": "타격자산-탄종-신관 결심보조 알고리즘 (3/11)"
    },
    "include_start": true,
    "include_end": false
  }
}
```

또는 대표 세부 페이지 범위:

```text
start anchor: 현 실태 및 문제점 분석
end anchor: 타격자산-탄종-신관 결심보조 알고리즘 (3/11)
```

scope 내부에서만 selector를 탐색한다.

## 5. paragraph_block

연속된 여러 문단을 하나의 블록으로 선택하고 교체한다.

예:

```json
{
  "type": "paragraph_block",
  "start": {
    "contains_text": "󰊲 현 실태 / 문제점"
  },
  "end": {
    "contains_text": "󰊳 개선내용"
  },
  "occurrence": 2,
  "end_inclusive": false,
  "replacement_paragraphs": [
    "󰊲 현 실태 / 문제점 : 기존 자유 생성 방식은 복잡한 양식의 재현성이 낮아 실무 문서 적용에 제한",
    "병합 표와 고정 위치 요소를 새로 조립하면 원본 레이아웃과 달라질 수 있음"
  ]
}
```

치환 시 첫 선택 문단의 paraPr·style을 첫 replacement에 재사용하고, 추가 replacement 문단은 기준 문단 또는 명시된 style source를 복제한다.

## 6. replace_paragraphs와 삭제

문단 수를 변경할 때 다음 원칙을 적용한다.

- 선택 블록과 replacement 수가 같으면 text만 치환
- replacement 수가 적으면 남는 원본 문단을 안전하게 제거
- replacement 수가 많으면 기준 문단 XML을 복제해 삽입
- 표·도형·control을 포함한 문단은 기본적으로 삭제 금지
- 삭제·복제 전 dry-run에 위험 문단을 표시
- `allow_structural_paragraph_change: true`가 없으면 문단 수 변경 금지

## 7. 문맥 미리보기

Dry-run은 선택 문단만 보여주지 말고 앞뒤 문맥을 제공한다.

```json
{
  "before": ["..."],
  "selected": ["...", "..."],
  "after": ["..."],
  "scope_start": "...",
  "scope_end": "..."
}
```

이를 통해 같은 문장이 11회 반복되는 문서에서 정확한 블록을 확인할 수 있어야 한다.

## 8. 대표 페이지 완성 목표

대표 반복 페이지의 반복 요약 블록은 다음 내용으로 완결한다.

```text
개요
한글 2024가 변환한 네이티브 HWPX를 템플릿으로 사용하여 기존 양식과 문서 구조를 유지한 채 선택 영역의 내용을 자동으로 교체

현 실태 / 문제점
기존 자유 생성 방식은 병합 표, 이미지와 고정 레이아웃의 재현성이 낮아 실무 양식 적용에 제한
복잡한 객체를 새로 조립하면 한글 2024 화면에서 원본과 다른 배치가 발생할 수 있음

개선내용
네이티브 템플릿의 문단·표·이미지 구조를 보존하고 검증된 의미 블록과 표 셀만 결정론적으로 교체

기대효과
㉮ 기존 문단·표·이미지와 페이지 구조 보존
* 선택 영역만 변경하여 레이아웃 손상 최소화
㉯ 반복 페이지 요소를 유지하면서 여러 문서 내용을 자동 갱신
㉰ 로컬 LLM은 검증된 selector와 치환값을 생성하는 역할로 분리
```

세부 페이지 `현 실태 및 문제점 분석`은 다음처럼 완결한다.

```text
○ 현 실태
∙ 기존 HWPX 자유 생성 방식은 기본 문단과 단순 표 작성은 가능하지만 복잡한 네이티브 양식의 정밀 재현에는 한계가 있음
∙ Template Fidelity Mode는 변환된 원본 HWPX를 복사하고 지정된 문단과 표 셀만 변경하여 기존 레이아웃을 유지함

○ 문제점
∙ 반복되는 동일 문장이 여러 페이지에 존재하므로 단일 텍스트 selector만으로는 정확한 페이지 범위를 지정하기 어려움
∙ 하나의 의미 블록이 여러 문단과 run으로 분할되어 일부만 치환하면 새 내용과 기존 내용이 혼재할 수 있음
```

## 9. 완료 조건

```text
1. 기존 v2 시각 성공 상태 기록
2. anchor_range scope 구현
3. scope 내부 selector 검색 구현
4. paragraph_block 구현
5. replacement_paragraphs 구현
6. 안전한 문단 삭제·복제 구현
7. dry-run 앞뒤 문맥 출력
8. 대표 반복 페이지 내용 완결
9. 대표 세부 페이지 본문 완결
10. 원본 스타일·이미지·표·페이지 구조 보존
11. 비대상 페이지 원문 유지
12. 자동 구조 검증 통과
13. 사용자 확인용 v3 HWPX 생성
```

## 10. 보류 항목

```text
LLM 호출
backend 실행 큐 연결
OpenClaw Tool Plugin
전체 11페이지 자동 치환
이미지 교체
도형 생성·삭제
한셀
한쇼
```

## 11. Codex 시작 전 요구사항

Codex는 이 문서를 읽고 코드 수정 전에 다음을 출력한다.

- 현재 v2에서 구조 보존은 성공했지만 의미 일관성이 부분 실패한 이유
- anchor_range scope 설계
- paragraph_block의 문단 삭제·복제 안전 규칙
- 대표 반복 페이지와 세부 페이지 치환 범위
- 구조 보존 검증 계획
- 이번 작업에서 LLM을 호출하지 않는 방법

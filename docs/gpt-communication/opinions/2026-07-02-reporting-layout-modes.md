# GPT 검토 의견 - 기준 문서별 보고 레이아웃 모드

작성일: 2026-07-02

## 1. 목적

Army Claw의 기준 문서는 단순히 문서 스타일만 정의하지 않는다. 실제 보고 시 한 번에 몇 개의 페이지를 보고받는지까지 포함하는 `보고 레이아웃 모드`를 정의해야 한다.

이번 기준은 다음과 같다.

```text
PK-Table 자격심사형 기준 문서
→ 2슬라이드 방식
→ 보고 시 홀수 페이지를 왼쪽, 짝수 페이지를 오른쪽에 배치
→ 보고받는 사람이 두 페이지를 동시에 보며 보고를 받음

공개 계획서형 기준 문서
→ 1슬라이드 방식
→ 보고 시 한 번에 한 페이지씩 표시
→ 한 페이지 단위로 보고를 받음
```

여기서 `슬라이드`는 PowerPoint 파일 형식을 의미하지 않는다. HWP/HWPX 문서의 페이지를 보고 화면에서 몇 장씩 묶어 보여주는지에 대한 운용 개념이다.

## 2. 템플릿 프로필 정의

### qualification_review_booklet

```json
{
  "profile_id": "qualification_review_booklet",
  "reporting_layout": {
    "mode": "dual_page",
    "spread_order": "odd_left_even_right",
    "pages_per_view": 2,
    "cover_behavior": "single_cover_then_spreads"
  }
}
```

운용 규칙:

- 표지는 필요 시 단독으로 보여줄 수 있다.
- 본문 보고는 홀수 페이지를 왼쪽, 다음 짝수 페이지를 오른쪽에 둔다.
- 예: 1쪽 왼쪽 + 2쪽 오른쪽, 3쪽 왼쪽 + 4쪽 오른쪽.
- 총 페이지가 홀수이면 마지막 홀수 페이지를 왼쪽에 두고 오른쪽은 빈 영역으로 표시할 수 있다.
- 페이지별 제목과 식별자는 양쪽 페이지를 동시에 볼 때도 식별 가능해야 한다.
- 서로 연관된 좌우 페이지가 한 쌍의 보고 단위가 되도록 콘텐츠 구조를 설계할 수 있어야 한다.

### official_action_plan

```json
{
  "profile_id": "official_action_plan",
  "reporting_layout": {
    "mode": "single_page",
    "pages_per_view": 1,
    "cover_behavior": "normal"
  }
}
```

운용 규칙:

- 한 번에 한 페이지만 보여준다.
- 페이지별 내용은 독립적으로 이해 가능해야 한다.
- 결재표, 일정표, 붙임 등은 해당 페이지 단위로 보고한다.
- 좌우 페이지 쌍을 전제로 한 배치 규칙을 적용하지 않는다.

## 3. 엔진과 Template Registry에 미치는 영향

HWPX 작성 엔진 자체는 개별 페이지를 정상 생성하는 책임을 가진다.

`reporting_layout`은 다음 계층에서 사용한다.

```text
Template Manifest
→ 문서 생성 규칙
→ 페이지 구성 검증
→ 보고용 미리보기
→ 필요 시 PDF/이미지 spread 생성
```

현재 HWPX 엔진 안정화 단계에서는 다음만 보존한다.

- 페이지 순서
- 페이지 번호
- 홀수·짝수 페이지 식별 가능성
- 페이지별 고정 레이아웃
- 좌우 쌍으로 볼 때 서로 관련된 내용의 구조

실제 2페이지 동시 미리보기 UI는 HWPX 엔진 완성 후 Template Registry와 미리보기 계층에서 구현한다.

## 4. 향후 필요한 기능

### dual_page 미리보기

```text
- 홀수 페이지 왼쪽
- 짝수 페이지 오른쪽
- 페이지 간 여백
- 두 페이지 동시 확대·축소
- 다음 spread / 이전 spread
- 마지막 홀수 페이지 처리
```

### single_page 미리보기

```text
- 한 페이지 중앙 표시
- 다음 페이지 / 이전 페이지
- 페이지별 확대·축소
```

### 공통

```text
- 현재 페이지 또는 spread 표시
- 원본 페이지 번호 유지
- 템플릿별 기본 보고 모드 저장
- 사용자가 필요 시 보고 모드를 일시 변경할 수 있는 옵션
```

## 5. Content Schema와 페이지 설계

### dual_page 문서

콘텐츠 생성 시 좌우 한 쌍을 하나의 보고 단위로 정의할 수 있다.

```json
{
  "spread_id": "spread_01",
  "left_page": {
    "page_number": 1,
    "role": "summary"
  },
  "right_page": {
    "page_number": 2,
    "role": "detail"
  }
}
```

예:

- 왼쪽: 개요·문제점 요약
- 오른쪽: 세부 분석·표·도식

### single_page 문서

각 페이지는 독립 page unit으로 관리한다.

```json
{
  "page_id": "page_01",
  "page_number": 1,
  "role": "plan_overview"
}
```

## 6. 검증 규칙

### dual_page

```text
- 홀수 페이지가 왼쪽 역할인지 확인
- 짝수 페이지가 오른쪽 역할인지 확인
- spread 내부 페이지 순서 유지
- 좌우 페이지 제목과 식별자 중복·누락 확인
- 마지막 홀수 페이지 처리 확인
```

### single_page

```text
- 각 페이지의 독립성 확인
- 페이지별 제목 또는 내용 구분 확인
- 좌우 spread 전용 요소가 없는지 확인
```

## 7. 구현 시점

현재 우선순위는 다음과 같다.

```text
1. HWPX 작성 엔진 완성
2. 의미 블록 치환 및 구조 보존 검증
3. Template Manifest 규격 확정
4. reporting_layout 필드 추가
5. Template Registry 구현
6. dual_page / single_page 미리보기 구현
7. OpenClaw UI 연결
```

현재 단계에서는 `reporting_layout`을 설계 요구사항으로만 기록하고, 미리보기 UI를 바로 구현하지 않는다.

## 8. 현재 상태

```text
qualification_review_reporting_layout: dual_page
qualification_review_spread_order: odd_left_even_right
official_action_plan_reporting_layout: single_page
reporting_preview_status: planned
implementation_gate: hwpx_engine_completion_required
```

## 9. Codex 후속 작업 규칙

향후 Template Manifest 또는 Template Registry 작업 시 Codex는 이 문서를 읽고 다음을 반영한다.

- 템플릿별 reporting_layout 저장
- PK-Table 기준 문서의 홀수 왼쪽·짝수 오른쪽 규칙
- 공개 계획서형 기준 문서의 단일 페이지 규칙
- 표지의 단독 표시 여부
- 마지막 홀수 페이지 처리
- 보고 미리보기와 실제 HWPX 페이지 순서의 분리

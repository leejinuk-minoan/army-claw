# GPT 검토 의견 - HWPX v5 Adaptive Board Fit

작성일: 2026-07-02
기준 브랜치: `feature/hwpx-native-layout-reflow`

## 1. v4 사용자 시각 검증 결과

사용자가 한글 2024에서 v4를 확인한 결과:

- 표지는 정상 유지
- `주 11-1` 비대상 페이지 정상 유지
- `주 11-2`의 줄 겹침은 해소되어 내용 식별 가능
- 그러나 `주 11-2` 본문 높이가 증가하면서 다음 논리 보드인 `보조 11-2`를 아래로 밀어냄
- 이어서 `주 11-3` 시작 위치에도 영향이 발생
- 즉 v4는 문단 reflow에는 성공했지만 board boundary를 보존하지 못함

상태:

```text
v4_line_reflow_visual_status: user_confirmed_improved
v4_board_boundary_status: failed_visual_review
v4_support_2_position_status: displaced
v4_main_3_anchor_status: displaced_or_at_risk
v4_overall_visual_status: requires_adaptive_board_fit
```

## 2. 핵심 설계 원칙

오버플로는 즉시 최종 실패로 처리하지 않는다.

```text
overflow_detected
→ 자동 보정 필요 신호
```

모든 보정 후에도 해결되지 않을 때만:

```text
overflow_unresolved
→ 최종 실패 또는 사용자 검토 요청
```

다음 보드를 밀어내는 page spill은 허용하지 않는다.

## 3. Adaptive Fit 처리 순서

```text
1. 원본 스타일과 board boundary로 배치 시도
2. 불필요한 공백·빈 문단·중복 줄 정리
3. 문단 앞뒤 간격과 줄 간격을 허용 범위 내에서 소폭 조정
4. 목표 줄 수와 권장 글자 수 산출
5. 의미 보존형 축약문 retry 적용
6. 템플릿이 허용한 최소 글자 크기까지 제한적으로 축소
7. COM native normalize
8. board boundary, page anchor, 가독성 재검증
9. 성공하면 채택
10. 모든 전략 실패 시 overflow_unresolved
```

v5에서는 실제 LLM을 호출하지 않고 고정 compression fixture와 callback/interface를 사용해 위 흐름을 검증한다.

## 4. 엔진과 LLM 역할 분리

### HWPX 엔진

- board 경계와 수용 높이 계산
- overflow 감지
- 사용 가능한 줄 수와 권장 글자 수 산출
- adaptive strategy orchestration
- 스타일 제한 적용
- COM normalize
- 최종 board/page 검증

### LLM

- 원문의 의미를 유지하는 축약문 생성
- 필수 사실, 수치, 고유명사와 항목 역할 보존

### 검증기

- 필수 사실 보존
- 수치 변형 여부
- 중제목과 본문 역할 일치
- 중복·환각 여부
- 목표 길이 준수

## 5. Overflow Resolution Schema

권장 입력:

```json
{
  "overflow_policy": {
    "mode": "adaptive_fit",
    "allow_page_spill": false,
    "strategies": [
      "remove_redundant_spacing",
      "adjust_paragraph_spacing",
      "semantic_compression",
      "bounded_font_reduction"
    ],
    "maximum_attempts": 4,
    "minimum_font_size_ratio": 0.9,
    "minimum_line_spacing_ratio": 0.9,
    "minimum_paragraph_spacing_ratio": 0.75,
    "preserve_required_facts": true,
    "final_action": "request_user_review"
  }
}
```

권장 overflow 결과:

```json
{
  "overflow_detected": true,
  "overflow_type": "board_height_exceeded",
  "board_id": "main-2",
  "field_id": "current_problem",
  "current_lines": 4,
  "available_lines": 2,
  "current_characters": 118,
  "recommended_characters": 70,
  "required_facts": [],
  "suggested_action": "semantic_compression"
}
```

## 6. 의미 보존형 축약 계약

compression request:

```json
{
  "field_id": "current_problem",
  "heading_role": "current_state_and_problem",
  "original_text": "...",
  "target_lines": 2,
  "target_characters": 70,
  "required_facts": [
    "직접 생성 HWPX의 재현 한계",
    "네이티브 템플릿 유지 필요",
    "줄 배치 재계산 필요"
  ],
  "required_terms": ["HWPX", "네이티브 템플릿"],
  "protected_numbers": [],
  "prohibited_changes": [
    "새로운 사실 추가",
    "수치 변경",
    "원인과 개선방안 혼합",
    "중제목 역할 변경"
  ]
}
```

compression response:

```json
{
  "compressed_text": "...",
  "preserved_facts": [],
  "preserved_terms": [],
  "changed_numbers": [],
  "validation_status": "passed"
}
```

v5 테스트에서는 deterministic fixture를 사용한다.

## 7. 제한적 서식 조정

자동 조정은 템플릿별 한도 내에서만 허용한다.

```text
문단 앞뒤 간격: 원본의 75% 미만 금지
줄 간격: 원본의 90% 미만 금지
글자 크기: 원본의 90% 미만 또는 템플릿 최소 크기 미만 금지
장평·자간: 기본적으로 변경 금지
```

글자 크기 축소는 제목이나 페이지 식별자에 적용하지 않는다.

내용 축약보다 먼저 과도한 폰트 축소를 수행하지 않는다.

## 8. Board Boundary와 Anchor

최소 대상:

```text
main-2
support-2
main-3
```

필수 메타데이터:

```text
board_id
board_role
board_number
paired_board_id
physical_page_index
board_start_anchor
board_end_anchor
content_region
available_height
```

Adaptive Fit의 모든 attempt 후 다음을 검증한다.

- `support-2` 시작 anchor 불변
- `main-3` 시작 anchor 불변
- 총 물리 페이지 수 불변
- main-2 내용이 main-2 board 경계를 넘지 않음
- support-2 metadata 존재

## 9. Attempt 기록

각 전략 적용을 기록한다.

```json
{
  "attempt": 2,
  "strategy": "semantic_compression",
  "input_characters": 118,
  "output_characters": 68,
  "font_size_ratio": 1.0,
  "line_spacing_ratio": 0.95,
  "overflow_after": false,
  "board_anchor_preserved": true,
  "accepted": true
}
```

최종 결과:

```text
fit_without_adjustment
fit_after_spacing_adjustment
fit_after_semantic_compression
fit_after_bounded_font_reduction
overflow_unresolved
```

## 10. v5 시험 범위

이번 단계에서 실제 LLM과 Ollama는 호출하지 않는다.

다음을 구현한다.

- board bounded overflow detector
- adaptive fit orchestrator
- compression callback/interface
- deterministic compression fixture
- bounded spacing/font adjustment
- attempt diagnostics
- support-2 pairing correction
- page count와 physical anchor 검증

보류:

- 실제 로컬 LLM 연결
- 내용 품질 튜닝
- Template Registry
- 보고 미리보기 UI
- 전체 11개 보드 자동 작성

## 11. v5 성공 조건

```text
- main-2의 긴 입력에서 overflow_detected 발생
- 다음 board로 spill하지 않음
- deterministic compression retry 실행
- compression 후 main-2 board 안에 수용
- support-2 원래 위치 유지
- main-3 원래 위치 유지
- page count 유지
- 읽을 수 없는 글자 축소 없음
- required facts와 terms 보존
- 모든 attempt가 diagnostics에 기록
- 실제 LLM 호출 없음
```

모든 자동 전략 실패 fixture도 별도로 만들고 `overflow_unresolved`를 검증한다.

## 12. 현재 상태

```text
v5_adaptive_board_fit_status: planned
v5_semantic_compression_interface_status: planned
v5_bounded_style_adjustment_status: planned
v5_board_anchor_validation_status: planned
hwpx_engine_completion_status: blocked_by_v5_visual_confirmation
```

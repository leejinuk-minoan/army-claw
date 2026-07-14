# 공식 계획·검토 문서 프로필

## 프로필 ID

`official_action_plan`

## 기준 문서

`reference/hwp-style-samples/official-action-plan-sample.hwp`

이 프로필은 결재·문서관리 표, 제목, 보고 요약, 목적, 방침, 일정표, 붙임을 포함하는 한국형 공식 계획 문서를 목표로 한다. 원본 문서의 본문을 복제하는 것이 아니라, 공식 문서 계열의 표 배치와 병합 셀, 일정표, 머리말·꼬리말 구조를 생성 가능한 프로필로 추상화한다.

## 핵심 구조

- 문서관리 및 결재 정보 표
- 등록번호, 보존기간, 공개구분, 협조 필드
- 중앙 정렬 제목
- 제목 아래 보고 요약
- 목적·방침·세부계획 문단
- 일정별 진행 표
- 인원 또는 역할 분담 표
- 붙임 표시
- 머리말·꼬리말·페이지 번호
- 일부 셀 선을 숨기거나 강조하는 공식 문서형 표 스타일

## 데이터 모델 방향

```json
{
  "layout_profile": "official_action_plan",
  "document_control": {
    "registration_number": "ARMY-CLAW-2026-01",
    "drafter": "Army Claw",
    "retention_period": "영구",
    "approval_date": "2026-07-01",
    "disclosure": "공개",
    "coordination": []
  },
  "title": "Army Claw 표준문서 자동화 기능 검증 계획",
  "executive_summary": "HWP 기준 양식 분석 및 HWPX 자동 생성 기능 검증을 위한 계획임.",
  "sections": [],
  "schedules": [],
  "personnel_tables": [],
  "annexes": []
}
```

## 최소 샘플 범위

`release/test-documents/army-claw-official-action-plan-sample.hwpx`

최소 샘플은 2페이지 구성을 목표로 한다.

1. 문서관리·결재 정보 표
2. 제목과 보고 요약
3. 목적·방침 문단
4. 일정별 진행 표
5. 병합 머리글과 병합 셀
6. 붙임 표시
7. 한글 2024에서 표 선택 및 셀 커서 진입 가능

## 현재 상태

- 원본 HWP 보존 완료
- `approval`, `schedule`, `official_form` 표 스타일 모델 정의
- style profile 기반 최소 샘플 생성 API 구현
- 병합 셀 구조 검증 구현
- 한글 2024 시각 검증은 사용자 확인 대기

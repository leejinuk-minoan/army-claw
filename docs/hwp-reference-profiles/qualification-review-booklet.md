# 자격심사형 프로젝트 설명 문서 프로필

## 프로필 ID

`qualification_review_booklet`

## 기준 문서

`reference/hwp-style-samples/pk-table-qualification-review.hwp`

이 프로필은 일반 보고서가 아니라 페이지별 고정 레이아웃을 갖는 심사·브리핑용 소책자형 문서를 목표로 한다. 원본 내용 자체를 복제하는 것이 아니라, 표지, 반복 요약 블록, 페이지 식별자, 하단 보조 코드, 병합 표 구조를 Army Claw가 생성할 수 있도록 구조를 모델링한다.

## 핵심 구조

- 독립 표지
- 조직명
- 페이지별 반복 요약 블록
- `주 n-m` 형태의 페이지 식별자
- `보조 n-m` 형태의 하단 식별자
- 페이지별 중심 주제 제목
- 개요, 현 실태, 개선내용, 기대효과 영역
- 병합 머리글을 포함한 수치·검증 표
- 이미지 또는 도식 자리표시자

## 데이터 모델 방향

```json
{
  "layout_profile": "qualification_review_booklet",
  "title": "Army Claw 표준문서 자동화 개발",
  "organization": "Army Claw 개발팀",
  "summary_block": {
    "overview": "문서 자동화 기능 개발 목적",
    "current_problem": "기존 문서 생성 결과의 구조와 디자인 한계",
    "improvement": "HWPX wrapper와 표 스타일 프로필 구현",
    "expected_effects": ["문서 작성시간 단축", "양식 표현력 향상"]
  },
  "pages": []
}
```

## 최소 샘플 범위

`release/test-documents/army-claw-qualification-review-sample.hwpx`

최소 샘플은 2페이지 구성을 목표로 한다.

1. 표지와 조직명
2. 반복 요약 블록
3. 현재/전체 페이지 표시
4. `주 2-1`, `주 2-2` 페이지 식별자
5. `보조 2-1`, `보조 2-2` 하단 식별자
6. 병합 머리글이 있는 표 1개 이상
7. 한글 2024에서 표 선택 및 셀 커서 진입 가능

## 현재 상태

- 원본 HWP 보존 완료
- style profile 기반 최소 샘플 생성 API 구현
- 병합 셀 구조 검증 구현
- 한글 2024 시각 검증은 사용자 확인 대기

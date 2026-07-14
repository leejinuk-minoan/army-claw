# GPT 검토 의견 - 공개 HWP 기준 양식과 Army Claw 문서 생성 목표

작성일: 2026-07-01

## 1. 사용자 목표

사용자는 단순한 기본 보고서가 아니라, 실제 한글 업무 문서와 유사한 구조와 완성도를 갖춘 문서를 Army Claw가 모델 지시를 통해 생성하기를 원한다.

이번 기준 문서는 다음 두 개의 공개·비민감 HWP 파일이다.

```text
자격심사-1. PK-Table 기반 타격자산-탄종-신관 결정 보조 알고리즘 제작(대대7과  5.7. 수정) (1) (2).hwp
20xx0101_대외비_청계산등산계획.hwp
```

사용자는 두 파일이 민감 자료가 아니며 GitHub 저장소에 업로드해도 된다고 명시적으로 확인했다. 두 번째 파일명의 `대외비` 표현도 실제 보안 문서 의미가 아니라 공개 인터넷 문서에 장난으로 붙은 제목이라고 확인했다.

Codex는 원본을 저장소에 포함할 때 이를 README와 메타데이터에 명확히 기록한다.

## 2. 기준 문서 A - 자격심사형 프로젝트 설명 문서

이 문서는 일반 보고서라기보다 HWP 안에서 페이지별 고정 레이아웃을 사용하는 심사·브리핑용 소책자에 가깝다.

### 주요 구조

- 독립 표지
- 동일한 상단 요약 블록이 각 페이지에 반복
- 문서 제목과 `(현재 페이지/전체 페이지)` 표시
- 우측 또는 상단의 `주 11-n` 식 페이지 식별자
- 하단의 `보조 11-n` 식 꼬리표
- 페이지별 중심 주제 제목
- 개요, 현 실태/문제점, 개선내용, 기대효과 반복
- 페이지별 세부 설명, 개념도, 이미지, 표와 검증 결과
- 다단계 번호 체계와 특수 번호 문자
- 복합 머리글을 가진 수치 표
- 일부 페이지는 텍스트 중심, 일부는 도식·이미지·표 중심

### 필요한 Army Claw 양식 프로필

```text
qualification_review_booklet
```

### 핵심 기능

- 표지와 조직명
- 전체 페이지 수를 반영한 `(n/N)` 표시
- 반복 요약 블록
- 페이지별 주제 영역
- 상단·하단 페이지 식별자
- 고정 페이지 레이아웃
- 이미지와 도식 자리표시자
- 다단 머리글 및 병합 셀 표
- 성과 수치 강조
- 페이지마다 공통 정보와 개별 정보를 분리하는 데이터 모델

### 권장 데이터 모델

```json
{
  "layout_profile": "qualification_review_booklet",
  "title": "...",
  "organization": "...",
  "summary_block": {
    "overview": "...",
    "current_problem": "...",
    "improvement": "...",
    "expected_effects": ["...", "..."]
  },
  "pages": [
    {
      "page_title": "현 실태 및 문제점 분석",
      "blocks": []
    }
  ]
}
```

반복 요약 블록을 각 페이지의 본문 문자열로 복제하지 말고 공통 데이터로 관리한다.

## 3. 기준 문서 B - 공식 계획·검토 문서

이 문서는 결재·분류 정보와 본문, 일정표, 인원표, 행정사항과 붙임을 결합한 한국형 공식 계획 문서 양식이다.

### 주요 구조

- 상단 문서관리·결재 표
- 등록번호, 보존기간, 결재일자, 공개구분, 협조 등의 필드
- 중앙 정렬 제목
- 제목 아래 짧은 보고 요약
- 개요, 목적, 방침, 일반계획, 세부계획, 지원, 행정사항
- 여러 단계의 번호·기호·글머리표
- 일정별 진행 표
- 인원 현황 및 임무 분담 표
- 표 안 병합 셀과 다단 머리글
- 붙임 문서
- 머리말·꼬리말·페이지 번호
- 일부 셀 선은 보이게 하고 일부는 숨기는 한국형 문서 표 디자인

### 필요한 Army Claw 양식 프로필

```text
official_action_plan
```

### 핵심 기능

- 문서관리 및 결재 정보 표
- 보고 요약 박스
- 한국형 계층 번호 체계
- 항목 라벨과 내용이 연결된 계획서 문단
- 일정표
- 인원표
- 임무 분담 표
- 붙임 시작 페이지
- 페이지별 머리말·꼬리말
- 실제 한글 표 병합
- 목적에 따른 표 테두리 스타일

### 권장 데이터 모델

```json
{
  "layout_profile": "official_action_plan",
  "document_control": {
    "registration_number": "",
    "retention_period": "",
    "approval_date": "",
    "disclosure": "",
    "coordination": []
  },
  "title": "...",
  "executive_summary": "...",
  "sections": [],
  "schedules": [],
  "personnel_tables": [],
  "annexes": []
}
```

## 4. 표 디자인에 대한 원칙

최소 표 검증 문서에서 셀 외곽의 적색 점선은 오탈자 표시가 아니라, 한글 2024가 편집 상태에서 투명 또는 선 없음 셀 경계를 표시한 것이다.

기존 코드가 참조한 `borderFillIDRef`는 표 객체 렌더링 검증을 위해 네이티브 템플릿의 스타일을 재사용한 것으로, 최종 표 디자인 의도로 확정된 것이 아니다.

이제 표 스타일을 명시적인 의미 기반 프로필로 관리해야 한다.

```text
grid
- 모든 외곽선과 내부선을 표시

report
- 외곽선과 주요 가로선 중심
- 불필요한 세로선 최소화

minimal
- 머리글 아래선과 마지막 아래선 중심

official_form
- 한국형 공식 문서 표
- 필요한 셀만 선 표시
- 일부 셀 경계는 투명

approval
- 결재·문서관리 표
- 고정 크기, 병합 셀, 지정된 테두리

schedule
- 일정·시간·내용·비고용 표
- 명확한 가로·세로선

metadata
- 표지 메타정보용
- 대부분의 선을 숨기고 배치 용도로 사용
```

`borderFillIDRef` 숫자를 DocumentPlan에 노출하지 않는다. 의미 기반 `table_style`을 Worker가 실제 borderFill 정의로 해석한다.

## 5. 원본 HWP 처리 전략

두 원본은 HWP 5.x 바이너리 문서다. Army Claw가 HWP 바이너리를 직접 파싱하거나 임의로 수정하는 것을 1차 구현으로 선택하지 않는다.

한글 2024가 설치된 Windows 환경에서 다음 절차를 사용한다.

```text
원본 HWP
→ 읽기 전용 복사본
→ 한글 2024 Automation으로 열기
→ HWPX로 다른 이름 저장
→ 변환된 HWPX 구조 분석
→ 템플릿 manifest와 style profile 생성
```

원본 HWP는 절대 덮어쓰지 않는다.

변환 파일은 다음과 같이 관리한다.

```text
.tmp/hwp-reference-conversion/
```

변환된 HWPX를 runtime 필수 의존 파일로 만들지 말고, 구조 분석과 양식 프로필 작성에 사용한다.

## 6. 정확한 양식 재현과 자동 디자인의 구분

### 모드 A - 기준 양식 기반 생성

가장 높은 재현도가 필요한 경우 다음 방법을 사용한다.

```text
기준 HWP를 HWPX로 변환
→ 템플릿 복사
→ 필드·문단·표·이미지 자리 교체
→ 새 HWPX 저장
```

이 모드는 결재 표, 반복 머리말, 병합 표와 고정 레이아웃을 보존하는 데 적합하다.

### 모드 B - 양식 프로필 기반 자동 생성

원본 템플릿 없이 유사한 문서를 새로 만들 때 다음 방법을 사용한다.

```text
Structured Plan
→ qualification_review_booklet 또는 official_action_plan 선택
→ 결정론적 layout renderer
→ HWPX 생성
```

두 모드를 모두 구현하되, 정확한 복제는 모드 A가 우선이다.

## 7. 이번 다음 단계의 범위

최소 표 wrapper가 사용자 시각 검증을 통과했으므로, 다음 작업은 성공한 wrapper를 두 기준 양식 분석에 사용할 수 있도록 확장하는 단계다.

권장 순서:

```text
1. 두 공개 HWP를 reference/hwp-style-samples/에 보존
2. 공개·비민감 자료임을 README에 기록
3. 한글 2024 HWP → HWPX 변환 Adapter 구현
4. 변환된 HWPX의 page/section/table/style 구조 분석
5. 두 reference manifest 생성
6. 의미 기반 table_style 구현
7. 병합 셀과 다단 머리글 지원
8. qualification_review_booklet의 최소 2페이지 샘플 생성
9. official_action_plan의 최소 2페이지 샘플 생성
10. 한글 2024 사용자 시각 검증
```

전체 11페이지 문서를 한 번에 재현하지 않는다. 각 프로필별 최소 샘플을 먼저 성공시킨다.

## 8. 저장소 권장 구조

```text
reference/hwp-style-samples/
├─ README.md
├─ pk-table-qualification-review.hwp
└─ official-action-plan-sample.hwp

tools/hancom/
├─ hwp-reference-converter.mjs
├─ hwp-reference-analyzer.mjs
└─ fixtures/

docs/hwp-reference-profiles/
├─ qualification-review-booklet.md
├─ official-action-plan.md
└─ manifests/
```

원본 파일 이름과 저장소의 안정적인 영문 파일 이름 사이의 매핑을 README에 기록한다.

## 9. 분석해야 할 구조

각 변환 HWPX에서 다음을 추출한다.

```text
- 페이지 크기와 여백
- section 수
- 페이지 나누기
- 머리말과 꼬리말
- 페이지 번호
- 문단·글자 스타일
- 표 개수
- 표 부모 wrapper
- 행·열 수
- 병합 셀
- borderFill 정의
- 셀 여백
- 표 너비
- 이미지와 BinData
- 텍스트 박스와 도형
- 반복되는 페이지 요소
- 문서관리·결재 영역
- 붙임 구분
```

## 10. 완료 기준

다음 작업은 두 기준 문서 전체를 자동 생성하는 것으로 완료하지 않는다.

최소 완료 기준:

```text
1. 두 공개 HWP 원본이 저장소에 보존됨
2. 한글 2024로 HWPX 변환 가능
3. 원본이 변경되지 않음
4. 두 reference manifest가 생성됨
5. 두 문서의 구조 차이가 문서화됨
6. table_style 의미 모델이 정의됨
7. 병합 셀을 가진 실제 HWPX 표가 생성됨
8. 프로필별 최소 샘플 HWPX가 생성됨
9. 자동 구조 검증 통과
10. 사용자 한글 2024 시각 검증 대기 상태로 보고됨
```

## 11. 보류 항목

두 프로필의 최소 샘플이 시각 검증을 통과하기 전까지 다음을 보류한다.

```text
- backend Adapter와 실행 큐의 최종 연결
- OpenClaw Tool Plugin 최종 등록
- 최종 UI
- 설치 파일 재빌드
- 한셀과 한쇼 구현
```

## 12. Codex 시작 전 요구사항

Codex는 이 문서를 읽고 코드 수정 전에 다음을 먼저 출력한다.

- 두 기준 HWP의 역할과 차이
- HWP → HWPX 변환 방식
- 원본 보존과 저장소 업로드 계획
- reference manifest 구조
- table_style 의미 모델
- 프로필별 최소 샘플 범위
- 이번 작업에서 제외할 항목

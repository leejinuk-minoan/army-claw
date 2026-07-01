# GPT 검토 의견 - Template Registry와 사용자 양식 교체 기능 후속 로드맵

작성일: 2026-07-02

## 1. 결론

사용자가 새로운 HWP/HWPX 기준 문서를 등록하고, 이후 생성되는 문서의 전체 스타일을 바꿀 수 있는 기능은 Army Claw의 정식 후속 기능으로 추가한다.

다만 구현 순서는 다음과 같이 고정한다.

```text
HWPX 작성 엔진 안정화
→ Template Fidelity 의미 블록 치환 완성
→ 구조·스타일 보존 검증
→ 실행 계층 연결
→ Template Registry와 사용자 양식 등록 기능
```

현재 엔진이 완성되기 전에 Template Registry를 구현하지 않는다.

## 2. 후속 기능의 목표

사용자가 새로운 기준 문서를 등록하면 Army Claw가 다음을 수행한다.

```text
사용자 HWP/HWPX 등록
→ 원본 보존
→ 필요 시 HWP를 HWPX로 변환
→ 문단·표·스타일·이미지·반복 영역 분석
→ 사용자 확인을 통한 의미 필드 매핑
→ Template Manifest 생성
→ Template Registry 등록
→ 이후 문서 생성 시 템플릿 선택
```

같은 내용 데이터를 서로 다른 템플릿으로 출력할 수 있어야 한다.

```text
같은 Content Schema
+ 자격심사형 템플릿
→ 자격심사 문서

같은 Content Schema
+ 공식 계획서형 템플릿
→ 공식 계획 문서

같은 Content Schema
+ 사용자 등록 템플릿
→ 사용자 지정 스타일 문서
```

## 3. 구현 시점 Gate

다음 조건을 모두 만족한 후 Template Registry 작업을 시작한다.

```text
1. Template Fidelity Mode에서 의미 블록 치환 성공
2. paragraph_block과 scope 기능의 한글 2024 시각 검증 성공
3. 표 셀 selector 시각 검증 성공
4. 원본 스타일·표·이미지·도형·페이지 구조 보존 검증 성공
5. 비대상 페이지 불변 검증 성공
6. HWP → HWPX 변환 경로 안정화
7. 오류 시 원본과 출력 파일을 보호하는 rollback 동작 확인
8. HWPX 작성 엔진 API가 특정 PK-Table 템플릿에 종속되지 않음
```

상태 이름:

```text
hwpx_engine_completion_status: user_confirmed_success
```

이 상태가 되기 전에는 Template Registry를 `planned` 상태로만 유지한다.

## 4. 예정 아키텍처

```text
TemplateRegistry
├─ TemplateImporter
├─ HwpToHwpxConverter
├─ TemplateAnalyzer
├─ FieldMappingEditor
├─ TemplateManifestStore
├─ TemplatePreviewGenerator
├─ TemplateValidator
└─ TemplateVersionManager
```

### TemplateImporter

- HWP/HWPX 입력
- 원본 SHA256 기록
- 원본 불변 보장
- 안정적인 template_id 생성

### TemplateAnalyzer

- 페이지 설정
- charPr·paraPr·style
- 표·병합 셀·borderFill
- 이미지·BinData·도형·글상자
- 머리말·꼬리말·페이지 번호
- 반복 영역과 입력 후보 분석

### FieldMappingEditor

사용자가 최초 등록 시 의미 필드를 확인한다.

```text
이 문단은 제목입니까?
이 표 셀은 작성 부서입니까?
이 블록은 개요입니까?
이 영역은 반복 페이지 요약입니까?
```

### TemplateManifestStore

문서 내부 숫자 ID가 아니라 의미 필드와 selector를 저장한다.

```json
{
  "template_id": "qualification_review_2026",
  "display_name": "자격심사형 문서",
  "version": 1,
  "fields": {
    "title": {"selector": {}},
    "organization": {"selector": {}},
    "overview": {"selector": {}},
    "current_problem": {"selector": {}},
    "improvement": {"selector": {}},
    "expected_effects": {"selector": {}}
  }
}
```

## 5. 문서 생성 모드

### Template Fidelity Mode

- 기존 템플릿 구조와 스타일 유지
- 지정된 문단·블록·표 셀만 치환
- 기관 지정 양식과 고정 레이아웃에 사용

### Style Profile Mode

- 의미 기반 스타일 규칙으로 새 문서 생성
- 페이지 수와 본문 길이가 유동적인 문서에 사용

### Hybrid Mode

- 표지·로고·결재란·머리말은 템플릿 유지
- 본문과 표는 내용에 맞게 동적으로 생성

Template Registry는 세 모드에서 공통 템플릿 메타데이터를 제공한다.

## 6. 예정 저장소 구조

```text
runtime/templates/
├─ registry.json
├─ qualification_review_2026/
│  ├─ template.hwpx
│  ├─ manifest.json
│  ├─ preview.png
│  └─ versions/
└─ official_action_plan_2026/
   ├─ template.hwpx
   ├─ manifest.json
   ├─ preview.png
   └─ versions/
```

사용자 원본 문서와 템플릿 저장 위치는 workspace 권한 규칙을 따른다.

민감 문서는 사용자의 명시적 동의 없이 GitHub에 커밋하지 않는다.

## 7. 필수 기능

```text
- 템플릿 등록
- 템플릿 이름 변경
- 템플릿 미리보기
- 템플릿 선택
- 기본 템플릿 지정
- 템플릿 버전 관리
- 템플릿 비활성화
- 템플릿 삭제 전 사용 여부 확인
- manifest 재분석
- field mapping 수정
- 샘플 데이터로 시험 생성
- 한글 2024 호환성 검증
```

## 8. 안전 규칙

- 원본 HWP/HWPX 덮어쓰기 금지
- 등록 시 작업 복사본 사용
- SHA256 기록
- 변환·분석 실패 시 registry 등록 금지
- 필수 selector가 모호하면 사용자 확인 요구
- hard-coded `table[16]`, `paragraph_index`, `charPrIDRef`를 장기 manifest 키로 사용하지 않음
- 템플릿 변경 시 기존 버전 보존
- 생성 실패 시 부분 문서 대신 명확한 오류 반환

## 9. 후속 단계 권장 순서

```text
Phase A. 현재 HWPX 작성 엔진 완성
Phase B. 엔진 API와 selector schema 안정화
Phase C. Template Manifest 규격 확정
Phase D. Template Registry backend 구현
Phase E. 사용자 템플릿 Import 및 Mapping UI
Phase F. Template Fidelity / Style Profile / Hybrid 선택 UI
Phase G. OpenClaw Tool과 실행 큐 연결
Phase H. 설치 파일 재빌드
```

## 10. 현재 상태

```text
template_registry_status: planned
user_template_import_status: planned
template_switching_status: planned
implementation_gate: hwpx_engine_completion_required
```

현재 진행 중인 HWPX 작성 엔진과 의미 블록 치환 작업의 범위에는 Template Registry 구현을 포함하지 않는다.

## 11. Codex 후속 작업 규칙

향후 HWPX 엔진 완료가 사용자 시각 검증으로 확정되면 Codex는 이 문서를 읽고 Template Registry 구현 계획을 작성한다.

코드 변경 전에 다음을 먼저 출력한다.

- 엔진 완료 Gate 충족 여부
- Template Manifest 규격
- Template Registry 저장 구조
- 사용자 HWP/HWPX Import 흐름
- 사용자 확인이 필요한 field mapping 단계
- Template Fidelity / Style Profile / Hybrid 연계 방식
- 보안·원본 보존·버전 관리 계획

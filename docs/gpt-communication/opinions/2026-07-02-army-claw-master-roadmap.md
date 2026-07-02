# Army Claw 전체 개발 로드맵

작성일: 2026-07-02

## 1. 최종 목표

Army Claw는 OpenClaw를 기반으로 독립망에서 다음을 수행하는 범용 업무 에이전트 플랫폼을 목표로 한다.

- 독립망의 OpenAI 호환 LLM API 또는 로컬 LLM 사용
- 사용자의 PC와 파일 시스템, 허용된 프로그램 조작
- 인터넷망에서 제작한 Skill을 검증 후 독립망으로 반입
- 한글, 한쇼, 한셀을 이용한 문서 생성·편집·검증
- 사용자 기준 양식에 맞춘 문서 생성
- 기준 양식에 없는 내용도 LLM이 판단해 새 페이지·슬라이드·시트로 구성
- 모든 작업의 권한, 감사 로그, 원본 보호와 rollback 보장

## 2. 전체 단계

Army Claw 개발은 총 8단계로 관리한다.

### 1단계. HwpAdapter 및 HWP/HWPX 엔진 안정화

목표:

- 한글 문서의 읽기, 분석, 템플릿 충실도 유지, 내용 치환, 표·도형·페이지 조정, 저장과 검증
- 공개 선행 엔진을 비교하고 범용 HWPX 코어를 재사용
- Army Claw 고유 기능은 상위 adapter 계층으로 분리

완료 조건:

- 복잡한 실제 템플릿에서 비대상 영역 보존
- 문단·표·글상자 Adaptive Fit
- 실제 한글 COM 페이지 측정
- 한글 2024 시각 회귀 통과
- HwpAdapter API 고정

### 2단계. OpenClaw 플랫폼 코어와 실행 통제

목표:

- OpenClaw Tool/Plugin 구조에 Army Claw 업무 도구 연결
- 작업 계획, 파일 접근, 프로그램 실행, 사용자 승인, rollback, 감사 로그 구현

완료 조건:

- PC 조작과 문서 도구 호출이 permission policy 안에서 실행
- 작업 단위 job, retry, cancel, resume 지원
- 원본 보호와 산출물 추적 가능

### 3단계. Model Gateway

목표:

- 독립망 OpenAI 호환 API, Ollama, 직접 빌드한 로컬 모델을 동일 인터페이스로 호출
- 작업별 모델 선택과 structured output 지원

완료 조건:

- 모델 교체 시 Skill과 문서 엔진 수정 불필요
- offline-only 정책, timeout, retry, fallback 지원
- 모델 capability와 사용 로그 기록

### 4단계. Offline Skill Runtime

목표:

- 인터넷망에서 제작한 Skill을 독립망에 안전하게 반입·설치·실행
- Skill manifest, 입력/출력 schema, 의존성, 권한, 테스트, 서명 규격 정의

완료 조건:

- Skill 패키지 검증, 버전 관리, 설치·삭제·비활성화 지원
- 네트워크 요구와 권한을 사전 차단
- 동일 Skill이 여러 허용 모델에서 실행 가능

### 5단계. Office-Neutral Document Model과 Document Planner

목표:

- LLM이 한글·한쇼·한셀의 내부 포맷을 직접 다루지 않도록 공통 문서 모델 제공
- 사용자 요구를 섹션, 문단, 표, 이미지, 차트, 부록으로 계획

완료 조건:

- 하나의 문서 계획을 Hwp/HShow/HCell adapter에 전달 가능
- 사용자 입력과 LLM 생성 내용을 출처별로 구분
- 필수 사실, 수치, 보안 등급과 검증 규칙 표현 가능

### 6단계. Template Registry와 자유 확장

목표:

- 사용자 기준 양식을 등록·분석·버전 관리
- fixed, replaceable, repeatable, extension, appendix 영역 정의
- 양식에 없는 요구는 적절한 새 페이지·슬라이드·시트로 확장

완료 조건:

- 사용자가 템플릿을 교체해도 adapter 코어 재개발 불필요
- Template Manifest 자동 초안과 사용자 보정 지원
- 양식 기반 작성과 자유 구조 작성이 하나의 planner에서 동작

### 7단계. HShowAdapter, HCellAdapter 및 교차 문서 업무

목표:

- 한쇼와 한셀을 HwpAdapter와 동일한 공통 인터페이스로 지원
- 표·차트·데이터를 한셀에서 계산하고 한글·한쇼로 반영

완료 조건:

- 한글, 한쇼, 한셀 생성·편집·저장·검증 지원
- 문서 간 데이터 연결과 업데이트 가능
- 템플릿 충실도와 자유 생성 모두 지원

### 8단계. 통합 검증, 보안, 배포와 운영

목표:

- 독립망 설치 패키지, 업데이트, 장애 복구, 사용자 UI, 운영 정책 완성

완료 조건:

- 보안 검토, 성능 시험, 회귀 시험, 사용자 인수 시험 통과
- 오프라인 설치·업데이트·백업·복구 지원
- 운영자와 일반 사용자 권한 분리

## 3. 현재 위치

```text
전체: 8단계
현재: 1단계 - HwpAdapter 및 HWP/HWPX 엔진 안정화
현재 세부 단계: 1-3 - 선행 HWPX 엔진 비교·코어 선정
```

기존 v1~v5 개발은 요구사항과 회귀 시험 자산으로 유지한다.

## 4. 앞으로 답변할 때의 단계 표시 규칙

Army Claw 관련 답변의 시작에 다음 형식을 사용한다.

```text
[개발 단계]
전체 8단계 중 1단계
현재 세부 단계: 1-3 선행 HWPX 엔진 비교·코어 선정
이번 작업: 후보 코어 benchmark 설계
```

단계가 변하면 `CURRENT.md`와 이 로드맵의 현재 위치를 함께 갱신한다.

## 5. 1단계 세부 개발 순서

### 1-1. 요구사항과 실제 문서 fixture 고정 — 완료

- 실제 PK-Table 템플릿
- 표지, 주판, 보조판, 병합 표, 중첩 표, 도형, 이미지
- 비대상 페이지 보존 조건
- 실패 화면과 사용자 시각 판정 기록

### 1-2. 현재 v1~v5 회귀 시험 자산화 — 대부분 완료

- selector와 scope
- structural container / leaf paragraph
- inline marker 직렬화
- stale linesegarray
- native normalize
- board spill
- semantic compression interface
- 1×1 표 고정 높이 문제

남은 작업:

- 모든 회귀 fixture를 독립 test corpus로 정리
- 시각 판정과 자동 판정을 연결

### 1-3. 선행 HWPX 엔진 비교·코어 선정 — 현재 단계

비교 후보:

- `python-hwpx`: Python 파싱·편집·생성·검증, template analyzer, page guard, MCP/Skill stack
- `hwpxlib`: Java OWPML 객체 모델과 장기간 유지보수
- `HwpForge`: Rust 기반 HWPX 읽기·쓰기, JSON round-trip과 MCP 지향 구조
- 현재 Army Claw Node/XML 코어: 기준선

동일 문서·동일 시나리오로 benchmark한다.

필수 시나리오:

1. 무수정 open/save round trip
2. 표지와 주 11-2 문단 치환
3. nested table과 draw text 탐색
4. 1×1 표 shrink-to-content
5. 병합 표·이미지·BinData 보존
6. `hp:fwSpace`와 namespace 보존
7. 한글 COM open/save
8. 실제 페이지 수와 주/보조 위치
9. 처리 속도, 메모리, 설치 크기
10. 독립망 설치와 라이선스

선정 기준:

```text
기능 적합성 30
시각 충실도 25
API·확장성 15
독립망 배포 10
성능 10
라이선스·유지보수 10
```

결정 원칙:

- 최고 점수 코어를 즉시 전체 교체하지 않는다.
- `HwpCoreAdapter` 뒤에 연결해 교체 가능하게 만든다.
- 범용 파싱·직렬화는 선행 코어에 위임한다.
- Army Claw selector, board, template, adaptive fit은 독립 계층으로 유지한다.

### 1-4. HwpCoreAdapter 경계 고정

최소 인터페이스:

```text
openPackage
savePackage
analyzeDocument
findParagraphs
findTables
findShapes
replaceText
setTableHeight
clonePageOrBoard
validatePackage
extractSemanticSnapshot
```

구현체:

```text
CurrentNodeHwpxCoreAdapter
PythonHwpxCoreAdapter
선정 결과에 따라 JavaHwpxCoreAdapter 또는 HwpForgeCoreAdapter
```

### 1-5. 선정 코어 통합과 기존 기능 이식

- ZIP/OPC/XML 파싱·저장을 선정 코어로 이동
- DocumentOrderIndex와 selector는 Army Claw 계층 유지
- 기존 v1~v5 테스트를 새 adapter에 동일 적용
- 결과가 기존보다 나쁘면 해당 기능은 현재 코어 유지

### 1-6. Container-Aware Adaptive Fit

처리 우선순위:

```text
컨테이너의 불필요한 고정 높이 축소
→ 셀·문단 여백 제한 조정
→ 의미 보존형 LLM 축약
→ 제한적 글자 크기 축소
→ unresolved 처리
```

필수 구현:

- 1×1 표 `shrink_to_content`
- 고정 높이와 최소 높이 구분
- 셀 여백·테두리·배경·가로 폭 보존
- 글상자와 도형 내부 텍스트 동일 정책
- 표가 다음 페이지로 통째로 이동하는 container page jump 탐지

### 1-7. 한글 COM Native Layout Authority

- 한글 2024를 최종 레이아웃 계산 권위자로 사용
- open/save뿐 아니라 실제 page count, cursor page, board marker page 측정
- pre/post page와 anchor 비교
- 사용자 기존 Hwp 프로세스 보호
- modal dialog, timeout, crash 복구

### 1-8. Template Manifest v1

- fixed / replaceable / repeatable / extension / appendix 영역
- paragraph, table cell, 1×1 container, draw text selector
- layout policy와 minimum font/spacing 규칙
- main/support board pairing

### 1-9. 실제 문서 회귀·시각 검증

- 자동 구조 diff
- 한글 2024 화면 확인
- 페이지별 스크린샷 증거
- 비대상 페이지 hash와 시각 비교
- 최소 3종 이상의 서로 다른 실제 템플릿 시험

### 1-10. HwpAdapter v1 동결

완료 Gate:

```text
- 선행 코어 benchmark와 선택 근거 완료
- adapter 교체 가능 구조
- 1×1 표와 글상자 container fit 통과
- 실제 COM page measurement 통과
- 기준 양식 치환 통과
- 양식 외 appendix 생성 최소 기능 통과
- 원본 보호와 rollback 통과
- 사용자 한글 2024 확인 통과
```

동결 후 2단계로 이동한다.

## 6. 현재 즉시 수행할 작업

1. `feature/hwpx-core-benchmark` 브랜치 생성
2. v1~v5 fixture와 사용자 확인 화면을 benchmark corpus로 정리
3. `python-hwpx`, `hwpxlib`, `HwpForge`, 현재 코어의 라이선스·설치·API 조사
4. 최소 adapter spike 구현
5. 동일 시나리오 benchmark 실행
6. 결과 보고서와 추천 코어 결정
7. 사용자 승인 후 1-4로 이동

현재 1×1 표 높이 문제의 직접 수정은 benchmark 시나리오에 포함한다. 선행 코어가 안정적인 표 높이 API를 제공하면 재사용하고, 제공하지 않으면 Army Claw `ContainerAwareTableFit`으로 구현한다.

# Army Claw 마스터 플랜

## 1. 시스템 이름

시스템 이름은 **Army Claw**다.

현재 시스템을 OpenClaw라고 설명하지 않는다. OpenClaw는 그 구분이 명시적으로 필요할 때만 과거 기원 또는 참고 원천으로 언급한다.

## 2. 최종 제품 목표

Army Claw는 오프라인 또는 폐쇄망 환경에서 동작하는 로컬 PC 지원 및 오피스 문서 생성 에이전트다.

최종 시스템은 다음을 지원해야 한다.

- 통제된 로컬 작업공간 조작
- HWP/HWPX 문서 생성 및 편집
- HanCell 스프레드시트 생성 및 편집
- HanShow 프레젠테이션 생성 및 편집
- 사용자가 제공한 HWP/HWPX, HanCell, HanShow 템플릿
- 세 가지 오피스 문서 대상 모두에 대한 템플릿 보존형 생성
- 로컬 LLM 또는 폐쇄망 OpenAI-compatible LLM API 기반 계획 수립
- 검증된 앱별 어댑터를 통한 결정론적 실행
- 공개 인터넷 의존성 제거

## 3. 핵심 원칙

### 3.1 Army Claw는 HWPX 전용이 아니다

HWP/HWPX는 첫 번째 안정화 실행 경로지만, Army Claw는 HWPX 전용 문서 생성기가 아니다.

다음은 장기적으로 1급 대상이다.

- 로컬 PC 지원
- HWP/HWPX
- HanCell
- HanShow

### 3.2 LLM은 계획만 생성한다

LLM은 문서 패키지 파일이나 네이티브 앱 상태를 직접 수정해서는 안 된다.

LLM은 다음과 같은 구조화된 계획만 생성할 수 있다.

- 로컬 작업공간 작업 계획
- HWP/HWPX 채움 계획
- HanCell 채움 계획
- HanShow 채움 계획
- 다중 앱 실행 계획

각 앱별 어댑터는 해당 계획을 검증하고 결정론적으로 실행한다.

### 3.3 오프라인 및 폐쇄망 동작

Army Claw는 공개 인터넷 접속 없이 동작해야 한다.

허용되는 모델 경로는 다음과 같다.

- 테스트용 결정론적 mock model
- 로컬 LLM 어댑터
- 폐쇄망 OpenAI-compatible API 어댑터

시스템은 런타임 중 공개 클라우드 모델 접근, 공개 인터넷 API, 온라인 패키지 설치를 전제해서는 안 된다.

### 3.4 템플릿 보존은 필수다

사용자 제공 템플릿은 세 가지 오피스 문서 대상 모두에서 1급 입력이다.

필수 목표 동작은 다음과 같다.

```text
사용자 제공 템플릿
+ 사용자 요청
+ 선택적 참고 자료
-> 구조화된 채움 계획
-> 결정론적 앱별 실행
-> 원본 템플릿을 최대한 보존한 생성 문서
```

이는 다음에 모두 적용된다.

- HWP/HWPX 보고서 템플릿
- HanCell 스프레드시트 템플릿
- HanShow 프레젠테이션 템플릿

## 4. 최상위 아키텍처

```text
사용자 요청
+ 템플릿 파일
+ 참고 자료
+ 선택적 로컬 작업공간 요청
        -> 로컬 또는 폐쇄망 LLM Planner
        -> 구조화된 Army Claw Plan
        -> Plan Validator / Policy Gate
        -> Army Claw Orchestrator
        -> 앱별 결정론적 어댑터
           - Local Workspace Adapter
           - HWP/HWPX Adapter
           - HanCell Adapter
           - HanShow Adapter
        -> Artifact Validator / Native App Validator
        -> 최종 파일, 로그, 증거 산출물
```

## 5. 기능 모델

### 5.1 앱 대상

```text
local_workspace
hwp
hancell
hanshow
```

### 5.2 작업 계열

```text
create_document
edit_document
fill_template
extract_content
inspect_file
open_file
save_file
export_file
validate_artifact
```

### 5.3 산출물 계열

```text
hwp
hwpx
cell
show
pdf
image
folder
log
json_plan
validation_report
```

## 6. 템플릿 인식 생성 요구사항

### 6.1 HWP/HWPX

HWP/HWPX 템플릿 인식 생성은 다음을 보존하거나 재사용해야 한다.

- 문단 스타일
- 글자 스타일
- 페이지 설정
- 여백
- 머리말 및 꼬리말
- 표
- 캡션
- 번호 매기기
- 구역 구조
- placeholder 위치
- 결재 또는 서명 블록

필수 목표 동작은 다음과 같다.

```text
HWP/HWPX 템플릿
+ HWP/HWPX 채움 계획
-> 원본 서식을 최대한 보존한 HWP/HWPX 문서
```

### 6.2 HanCell

HanCell 템플릿 인식 생성은 다음을 보존하거나 재사용해야 한다.

- 시트
- 셀 스타일
- 병합 셀
- 행 및 열 크기
- 수식
- 사용 가능한 경우 이름 정의 범위
- 표
- 차트
- 인쇄 설정
- placeholder 셀 또는 매핑된 범위

필수 목표 동작은 다음과 같다.

```text
HanCell 템플릿
+ HanCell 채움 계획
-> 원본 서식을 최대한 보존한 HanCell 스프레드시트
```

### 6.3 HanShow

HanShow 템플릿 인식 생성은 다음을 보존하거나 재사용해야 한다.

- 슬라이드 크기
- 슬라이드 레이아웃
- 테마 스타일
- placeholder
- 텍스트 상자
- 도형
- 표
- 이미지 프레임
- 차트 placeholder
- 브리핑 구조

필수 목표 동작은 다음과 같다.

```text
HanShow 템플릿
+ HanShow 채움 계획
-> 원본 서식을 최대한 보존한 HanShow 프레젠테이션
```

## 7. 로컬 작업공간 정책

Army Claw는 로컬 PC 및 작업공간 조작 능력을 유지해야 하지만, 반드시 정책 경계 안에서 동작해야 한다.

최소 요구사항은 다음과 같다.

- 승인된 작업공간 폴더 사용
- 원본 템플릿 덮어쓰기 방지
- 모든 작업 로그 기록
- 파일 쓰기 전 경로 검증
- 가능한 경우 dry-run 또는 preview 지원
- 공개 인터넷 접근 방지
- 생성 산출물 및 증거 보고서 보존

## 8. 모델 게이트웨이 계획

Army Claw는 model gateway 추상화를 사용한다.

```text
ModelGateway
  - MockModelAdapter
  - LocalLlmAdapter
  - ClosedOpenAICompatibleAdapter
```

`MockModelAdapter`는 결정론적 테스트를 위해 필수다.

`LocalLlmAdapter`는 로컬 모델 런타임을 지원한다.

`ClosedOpenAICompatibleAdapter`는 OpenAI-compatible request shape를 사용하는 내부 폐쇄망 endpoint를 지원한다. 이는 공개 인터넷 OpenAI API 사용을 의미하지 않는다.

## 9. 계획 및 실행 경계

표준 흐름은 다음과 같다.

```text
LLM output
-> schema validation
-> policy validation
-> target adapter routing
-> deterministic execution
-> artifact validation
-> evidence report
```

잘못된 계획은 사용자 파일이 수정되기 전에 거부되어야 한다.

## 10. 현재 Stage 1 상태

현재 Stage 1은 HWP/HWPX를 첫 번째 안정화 실행 대상으로 삼는다.

이는 Army Claw를 HWPX 전용으로 재정의하지 않는다.

Stage 1은 다음 확장 경로를 보존해야 한다.

- 로컬 작업공간 조작
- HWP/HWPX
- HanCell
- HanShow
- 오프라인 또는 폐쇄망 LLM 계획 수립
- 세 가지 오피스 문서 대상 모두에 대한 템플릿 인식 생성

## 11. 개정 로드맵

### Stage 1 - 실행 경계 안정화

근시일 내 작업은 다음과 같다.

```text
Task 017:
Transport-agnostic Invocation Facade Boundary Proof

Task 018:
Army Claw Multi-App Capability Architecture Proof

Task 019:
App Target Contract and Plan Routing Proof
```

### Stage 2 - 템플릿 인식 실행 엔진

계획된 작업은 다음과 같다.

```text
HWP/HWPX Template Preservation Proof
HanCell Template Preservation Contract Proof
HanShow Template Preservation Contract Proof
Template Map Schema Proof
Fill Plan Validator Proof
```

### Stage 3 - 오프라인 및 폐쇄망 LLM 계획 수립

계획된 작업은 다음과 같다.

```text
Offline Model Gateway Boundary Proof
LLM Planner to Multi-App Fill Plan Proof
LLM Output Validation and Repair Policy Proof
```

### Stage 4 - 다중 앱 문서 생성 E2E

계획된 작업은 다음과 같다.

```text
HWP/HWPX Template-aware E2E Proof
HanCell Template-aware E2E Proof
HanShow Template-aware E2E Proof
Multi-App Workflow Proof
```

### Stage 5 - 로컬 작업공간 지원 및 패키징

계획된 작업은 다음과 같다.

```text
Local Workspace Policy Gate Proof
Workspace and File Safety Proof
Native App Adapter Proof
Offline Deployment Package Proof
Audit Log and Evidence Bundle Proof
```

## 12. 향후 에이전트 지침

향후 에이전트는 다음 규칙을 따른다.

1. 이름은 Army Claw를 사용한다.
2. 프로젝트를 HWPX 전용으로 재정의하지 않는다.
3. HWP/HWPX, HanCell, HanShow, 로컬 작업공간 조작을 1급 대상으로 취급한다.
4. HWP/HWPX, HanCell, HanShow 모두에서 템플릿 인식 생성을 핵심 요구사항으로 유지한다.
5. LLM이 문서 패키지 파일이나 네이티브 앱 상태를 직접 수정하지 못하게 한다.
6. LLM은 구조화된 계획만 생성하게 한다.
7. 실행 전 계획을 검증한다.
8. 결정론적 실행은 앱별 어댑터 안에 둔다.
9. 오프라인 또는 폐쇄망 동작을 전제한다.
10. 공개 인터넷 의존성을 도입하지 않는다.
11. 명시적 승인 없이 최종 HWPX core 선택이나 Stage 2 전환을 선언하지 않는다.

## 13. 현재 비결정 사항

다음은 아직 의도적으로 확정하지 않는다.

- 최종 HWPX core 선택
- production API framework
- production UI framework
- 정확한 로컬 LLM 런타임
- 정확한 폐쇄망 OpenAI-compatible endpoint
- HanCell 실행 방식
- HanShow 실행 방식
- 로컬 작업공간 자동화 toolchain
- 최종 패키징 형식

## 14. 향후 프롬프트 및 보고서 필수 선언

향후 프롬프트와 보고서는 다음 선언을 보존해야 한다.

```text
Army Claw는 HWPX 전용 문서 생성기가 아니다.
Army Claw는 오프라인/폐쇄망 로컬 PC 지원 및 오피스 문서 생성 에이전트다.
HWP/HWPX, HanCell, HanShow는 1급 문서 대상이다.
HWP/HWPX, HanCell, HanShow에 대해 사용자가 제공한 템플릿은 생성 중 최대한 보존되어야 한다.
LLM은 구조화된 계획만 생성할 수 있다.
각 앱별 어댑터는 계획을 검증하고 결정론적으로 실행해야 한다.
```

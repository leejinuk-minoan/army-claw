# Army Claw Master Plan 반입 보고서

## 요약

마스터 에이전트가 작성한 `army-claw-master-plan.md`를 프로젝트 기준 문서로 반입했다. 원문은 영어였고 일부 화살표 문자가 깨져 있었으므로, 프로젝트 문서 기본 원칙에 맞춰 한글 기준 문서로 정리했다.

## 반입 경로

- 기준 문서: `docs/architecture/army-claw-master-plan.md`
- 반입 보고서: `docs/gpt-communication/reports/2026-07-05-army-claw-master-plan-import.md`

## 핵심 반영 사항

- 시스템 이름은 `Army Claw`로 고정한다.
- OpenClaw는 필요한 경우에만 과거 기원 또는 참고 원천으로 언급한다.
- Army Claw는 HWPX 전용 문서 생성기가 아니다.
- Army Claw의 최종 목표는 오프라인/폐쇄망 로컬 PC 지원 및 오피스 문서 생성 에이전트다.
- HWP/HWPX, HanCell, HanShow, 로컬 작업공간 조작을 1급 대상으로 취급한다.
- LLM은 문서 패키지 파일이나 네이티브 앱 상태를 직접 수정하지 않고 구조화된 계획만 생성한다.
- 앱별 deterministic adapter가 계획을 검증하고 실행한다.
- 사용자 제공 템플릿 보존은 HWP/HWPX뿐 아니라 HanCell, HanShow에도 적용된다.
- 공개 인터넷 의존성을 도입하지 않는다.
- 폐쇄망 OpenAI-compatible API는 허용 경로지만 공개 인터넷 OpenAI API 사용을 의미하지 않는다.

## Task 로드맵 정렬

마스터 플랜 기준 다음 순서는 다음과 같이 고정한다.

```text
Task 018:
Army Claw Multi-App Capability Architecture Proof

Task 019:
App Target Contract and Plan Routing Proof
```

따라서 Task 018은 HTTP/CLI/UI transport adapter 구현으로 바로 넘어가지 않고, Army Claw가 HWPX-only가 아님을 capability architecture 수준에서 고정하는 작업이어야 한다.

## 향후 프롬프트 필수 선언

```text
Army Claw는 HWPX 전용 문서 생성기가 아니다.
Army Claw는 오프라인/폐쇄망 로컬 PC 지원 및 오피스 문서 생성 에이전트다.
HWP/HWPX, HanCell, HanShow는 1급 문서 대상이다.
HWP/HWPX, HanCell, HanShow에 대해 사용자가 제공한 템플릿은 생성 중 최대한 보존되어야 한다.
LLM은 구조화된 계획만 생성할 수 있다.
각 앱별 어댑터는 계획을 검증하고 결정론적으로 실행해야 한다.
```

## 변경 범위

이번 작업은 문서 반입만 수행했다.

- production code 변경 없음
- schema 변경 없음
- Task 003~017 evidence 변경 없음
- final HWPX core selection 선언 없음
- Stage 2 transition 선언 없음

## 다음 작업 권고

다음 작업은 `Task 018 - Army Claw Multi-App Capability Architecture Proof`로 진행하는 것이 적절하다. 이 작업은 HWP/HWPX, HanCell, HanShow, local_workspace를 1급 capability target으로 고정하고, 이후 plan routing과 app-specific adapter 확장 경로를 열어야 한다.

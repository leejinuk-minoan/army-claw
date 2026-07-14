# RN-018 — Task 018 Multi-App Capability Architecture Proof

## 1. Research Question

Army Claw를 HWP/HWPX 전용 생성기가 아니라, HWP/HWPX·HanCell·HanShow·local workspace를 모두 1급 대상으로 하는 멀티앱 로컬 에이전트로 정의할 수 있는가?

## 2. System Design Claim

Army Claw의 핵심 설계 명제는 LLM이 문서 파일이나 네이티브 앱 상태를 직접 조작하지 않고, 구조화된 계획만 생성하며, 각 앱별 adapter가 이를 검증하고 결정론적으로 실행한다는 것이다.

## 3. Method

Task 018은 production adapter 구현이 아니라 architecture proof 방식으로 수행되었다. 시스템 이름, 지원 대상, 오프라인/폐쇄망 요구, 템플릿 보존, LLM의 직접 편집 금지, app-specific adapter 실행 원칙을 명시하고 이를 검증 가능한 summary로 고정했다.

## 4. Evidence

- Task report: `docs/gpt-communication/reports/2026-07-05-multi-app-capability-architecture-proof-018.md`
- Evidence summary: `release/test-documents/multi-app-capability-architecture-proof-018/tests/multi-app-capability-architecture-summary.json`
- Final commit: `3bb642a5faa19bc7579f9f717ae275e5d7277184`

## 5. Result

Task 018은 Army Claw의 최상위 멀티앱 capability를 정의했다. 공식 app target은 `local_workspace`, `hwp_hwpx`, `hancell`, `hanshow`이며, HWP/HWPX, HanCell, HanShow에 대해 사용자 제공 템플릿 보존이 필수 원칙으로 정리되었다.

## 6. Paper-Ready Sentences

Army Claw는 HWPX 전용 문서 생성기가 아니라, 폐쇄망 로컬 PC에서 동작하는 멀티앱 오피스 문서 생성 에이전트로 설계되었다.

본 연구의 기본 구조는 LLM을 계획 생성 계층으로 제한하고, 실제 문서 조작은 앱별 deterministic adapter가 수행하도록 분리하는 방식이다.

이러한 분리는 생성형 모델의 비결정적 출력과 업무 문서 생성에 요구되는 재현성·검증 가능성 사이의 간극을 줄이기 위한 설계 선택이다.

## 7. Limitations

Task 018은 아키텍처와 capability boundary를 고정한 proof이며, 실제 HanCell/HanShow adapter 구현, Model Gateway 구현, PC 자동화, 최종 HWPX core 선정은 포함하지 않았다.

## 8. Link to Development Records

- Architecture document: `docs/architecture/army-claw-master-plan.md`
- Task report: `docs/gpt-communication/reports/2026-07-05-multi-app-capability-architecture-proof-018.md`
- Evidence directory: `release/test-documents/multi-app-capability-architecture-proof-018/`

# RN-019 — Task 019 App Target Routing Proof

## 1. Research Question

구조화된 Army Claw plan을 각 대상 앱의 adapter slot으로 안정적으로 라우팅하기 위한 계약을 정의할 수 있는가?

## 2. System Design Claim

Army Claw의 plan routing 계층은 plan type과 target을 명시적으로 매핑하고, 잘못된 target-plan 조합, 직접 파일 수정 요청, 공개 인터넷 의존 요청을 controlled validation error로 차단해야 한다.

## 3. Method

Task 019는 Task 018에서 정의된 app target 위에 routing contract를 추가했다. 단일 대상 plan type은 대응되는 adapter slot으로 라우팅하고, multi-app execution plan은 하위 단일 대상 plan들로 분해되도록 제한했다.

## 4. Evidence

- Task report: `docs/gpt-communication/reports/2026-07-05-app-target-routing-proof-019.md`
- Evidence summary: `release/test-documents/app-target-routing-proof-019/tests/app-target-routing-summary.json`
- Final commit: `bf91c51ed49299c5433201948a822c65066987c9`

## 5. Result

Task 019는 `local_workspace_action_plan`, `hwp_hwpx_fill_plan`, `hancell_fill_plan`, `hanshow_fill_plan`, `multi_app_execution_plan`의 라우팅 방식을 고정했다. 각 plan type은 `local_workspace_adapter_slot`, `hwp_hwpx_adapter_slot`, `hancell_adapter_slot`, `hanshow_adapter_slot` 중 하나 또는 multi-target 분해 규칙으로 연결된다.

## 6. Paper-Ready Sentences

Army Claw는 LLM 출력과 앱별 실행기 사이에 routing contract를 배치하여, 생성된 계획이 실행 가능한 대상 adapter로만 전달되도록 통제한다.

다중 앱 요청은 하나의 거대 실행 계획으로 직접 처리하지 않고, 검증 가능한 단일 대상 하위 계획으로 분해한 뒤 각 adapter slot에 연결하는 방식으로 설계되었다.

이 routing 계층은 모델의 잘못된 대상 선택이나 직접 파일 편집 요청을 실행 전 단계에서 차단하는 policy gate 역할을 수행한다.

## 7. Limitations

Task 019는 routing contract와 validation behavior를 증명했지만, 실제 adapter 실행, 실제 HanCell/HanShow 파일 생성, Model Gateway 연결은 포함하지 않았다.

## 8. Link to Development Records

- Task report: `docs/gpt-communication/reports/2026-07-05-app-target-routing-proof-019.md`
- Evidence directory: `release/test-documents/app-target-routing-proof-019/`
- Related previous note: `docs/research-notes/task-notes/RN-018-task018-multi-app-capability-architecture.md`

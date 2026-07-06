# Task 020 — App Target Plan Schema Proof 보고서

## 요약

Task 020은 Task 019에서 확정한 앱 대상 라우팅 결과 위에, 각 대상 앱으로 전달할 계획 페이로드의 최소 계약을 증명했다. 이번 작업은 실제 한컴오피스 어댑터 실행, Model Gateway, LLM 플래너, HTTP 계층, UI 계층 구현이 아니라, 계획 구조와 어댑터 슬롯 입력 경계를 고정하는 proof 단계다.

- 작업 브랜치: `agent/task020-app-target-plan-schema-proof`
- 시작 SHA: `bf91c51ed49299c5433201948a822c65066987c9`
- Task ID: `app-target-plan-schema-proof-020`
- 계약 버전: `army-claw-app-target-plan-schema-020.v1`
- Proof case: `36/36`
- Completion candidate: `true`
- 실제 어댑터 실행: `false`
- Task 018/019 읽기 전용 보존: `true`

## 구현 범위

추가된 구현 파일은 다음과 같다.

- `tools/army-claw/plans/AppTargetPlanSchemaProof.mjs`
- `tools/army-claw/plans/AppTargetPlanSchemaProof.test.mjs`

생성된 증거 산출물은 다음 경로에 정리했다.

- `release/test-documents/app-target-plan-schema-proof-020/`

산출물 구성은 다음과 같다.

- `schemas`: 7개
- `sample-plans`: 10개
- `adapter-slot-inputs`: 4개
- `validation`: 5개
- `tests`: 2개

## 스키마 계약

지원 계획 유형은 다음 5개다.

- `local_workspace_action_plan`
- `hwp_hwpx_fill_plan`
- `hancell_fill_plan`
- `hanshow_fill_plan`
- `multi_app_execution_plan`

대상별 template artifact 제한은 다음과 같이 고정했다.

- HWP/HWPX: `hwp`, `hwpx`
- HanCell: `cell`
- HanShow: `show`
- Local workspace: `folder`

문서형 대상 계획은 `template_reference`, `fill_operations`, `constraints`를 포함해야 하며, 원본 템플릿 덮어쓰기 금지 조건을 검증한다. 다중 앱 계획은 하위 계획 단위로 검증하고, 직접 파일 수정이나 네이티브 앱 상태 직접 수정 같은 LLM 우회 요청은 validation error로 차단한다.

## 어댑터 슬롯 입력 계약

Task 020은 어댑터 슬롯 입력 구조만 증명하며 실제 어댑터를 호출하지 않는다. 생성된 슬롯 입력은 다음 모두에서 공통적으로 `execution_allowed=false`, `actual_adapter_invoked=false`를 유지한다.

- `local_workspace_adapter_slot`
- `hwp_hwpx_adapter_slot`
- `hancell_adapter_slot`
- `hanshow_adapter_slot`

## 검증 결과

실행한 핵심 테스트는 다음과 같다.

```powershell
node --test tools\army-claw\plans\AppTargetPlanSchemaProof.test.mjs
node --test tools\army-claw\routing\AppTargetRoutingProof.test.mjs
node --test tools\army-claw\capability\ArmyClawMultiAppCapabilityArchitectureProof.test.mjs
```

추가 회귀 확인으로 Task 013~017 경계 proof 테스트도 함께 실행했다.

```powershell
node --test tools\hancom\hwpcoreadapter\TransportAgnosticInvocationFacadeProof.test.mjs
node --test tools\hancom\hwpcoreadapter\LocalClientBoundaryProof.test.mjs
node --test tools\hancom\hwpcoreadapter\LocalRouteManifestProof.test.mjs
node --test tools\hancom\hwpcoreadapter\InProcessRouteFacadeProof.test.mjs
node --test tools\hancom\hwpcoreadapter\ServiceContractSchema.test.mjs
```

확인 결과는 다음과 같다.

- Task 020 App Target Plan Schema Proof: `9/9 pass`
- Task 019 App Target Routing Proof: `8/8 pass`
- Task 018 Multi-App Capability Architecture Proof: `8/8 pass`
- 추가 Task 013~017 회귀 확인: `40/40 pass`
- 전체 확인: `65/65 pass`

## 비범위 및 비결정 사항

이번 작업에서 다음은 구현하거나 선언하지 않았다.

- 실제 HWP/HWPX 어댑터 실행
- 실제 HanCell 어댑터 구현
- 실제 HanShow 어댑터 구현
- PC 자동화 실행
- Model Gateway 구현
- LLM planner 연결
- HTTP route 구현
- UI 구현
- 최종 HWPX core 선정
- Stage 2 전환 선언

## 다음 작업 제안

Task 021은 `Target Plan Validator and Adapter Slot Request Builder Proof`로 진행하는 것이 적절하다. Task 020이 “어떤 구조의 계획을 보낼지”를 고정했으므로, 다음 단계에서는 유효한 target plan을 실제 실행 전 불변 request envelope로 변환하고, 어댑터별 슬롯 요청이 동일한 계약을 따르는지 증명하는 것이 자연스럽다.

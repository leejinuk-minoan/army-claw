# Task 019 App Target Routing Proof 보고서

## 요약

Task 019는 Task 018에서 고정한 Army Claw multi-app capability architecture를 기반으로, structured plan을 어느 app-specific adapter slot으로 보낼지에 대한 routing contract를 증명한 작업이다.

이번 작업은 실제 adapter 실행이 아니라 routing 계약과 proof artifact를 고정하는 단계다. `local_workspace`, `hwp_hwpx`, `hancell`, `hanshow`는 계속 1급 target으로 유지되며, `multi_app_execution_plan`은 단일 target subplan으로 분해되어 각 adapter slot으로 라우팅된다.

## Branch

- branch: `agent/task019-app-target-routing-proof`
- start SHA: `3bb642a5faa19bc7579f9f717ae275e5d7277184`
- final SHA: 본 보고서를 포함하는 Task 019 커밋 SHA

## 읽은 파일

- `docs/architecture/army-claw-master-plan.md`
- `docs/gpt-communication/reports/2026-07-05-army-claw-master-plan-import.md`
- `docs/gpt-communication/reports/2026-07-05-multi-app-capability-architecture-proof-018.md`
- `release/test-documents/multi-app-capability-architecture-proof-018/tests/multi-app-capability-architecture-summary.json`
- `release/test-documents/multi-app-capability-architecture-proof-018/architecture/army-claw-capability-architecture.json`
- `release/test-documents/multi-app-capability-architecture-proof-018/architecture/app-targets.json`
- `release/test-documents/multi-app-capability-architecture-proof-018/architecture/template-preservation-matrix.json`
- `release/test-documents/multi-app-capability-architecture-proof-018/architecture/llm-boundary.json`
- `release/test-documents/multi-app-capability-architecture-proof-018/architecture/local-workspace-policy.json`
- `tools/army-claw/capability/ArmyClawMultiAppCapabilityArchitectureProof.mjs`

## 변경 파일

- `tools/army-claw/routing/AppTargetRoutingProof.mjs`
- `tools/army-claw/routing/AppTargetRoutingProof.test.mjs`
- `docs/gpt-communication/reports/2026-07-05-app-target-routing-proof-019.md`
- `release/test-documents/app-target-routing-proof-019/**`

## Routing Contract Version

- `army-claw-app-target-routing-019.v1`

## Supported App Targets

- `local_workspace`
- `hwp_hwpx`
- `hancell`
- `hanshow`

모든 target은 Task 018 기준대로 1급 target이며, Task 019에서는 실제 adapter를 구현하지 않았다.

## Supported Plan Types

- `local_workspace_action_plan`
- `hwp_hwpx_fill_plan`
- `hancell_fill_plan`
- `hanshow_fill_plan`
- `multi_app_execution_plan`

## Plan Type Target Mapping

- `local_workspace_action_plan -> local_workspace`
- `hwp_hwpx_fill_plan -> hwp_hwpx`
- `hancell_fill_plan -> hancell`
- `hanshow_fill_plan -> hanshow`
- `multi_app_execution_plan -> multi_target`

## Adapter Slots

- `local_workspace_adapter_slot`
- `hwp_hwpx_adapter_slot`
- `hancell_adapter_slot`
- `hanshow_adapter_slot`

모든 adapter slot은 다음 조건을 가진다.

- `deterministic_execution_required=true`
- `actual_adapter_implemented_in_task019=false`
- `real_adapter_execution_performed=false`

## Multi-App Decomposition Rules

`multi_app_execution_plan`은 `subplans` 배열을 가져야 한다. 각 subplan은 다음 단일 target plan type 중 하나여야 한다.

- `local_workspace_action_plan`
- `hwp_hwpx_fill_plan`
- `hancell_fill_plan`
- `hanshow_fill_plan`

nested `multi_app_execution_plan`은 Task 019 계약에서 허용하지 않는다. subplan이 없거나 잘못된 plan type이 들어오면 controlled `validation_error`로 처리한다.

## Validation Error Taxonomy

다음 error code를 controlled validation error로 고정했다.

- `unsupported_plan_type`
- `unsupported_target`
- `target_plan_mismatch`
- `missing_subplans`
- `invalid_subplan_type`
- `llm_direct_file_edit_disallowed`
- `public_internet_dependency_disallowed`
- `adapter_not_implemented_in_this_task`
- `contract_violation`

## Proof Cases

Task 019 summary 기준 proof case는 28개이며 모두 통과했다.

핵심 검증:

- 공식 시스템명은 Army Claw
- `hwp_only=false`
- 4개 target 존재
- 4개 단일 plan type이 각 adapter slot으로 라우팅
- `multi_app_execution_plan`이 subplan route로 분해
- missing subplans, unsupported plan, unsupported target, target mismatch, invalid subplan을 controlled validation error로 처리
- LLM direct file edit 요청 거부
- public internet dependency 요청 거부
- 모든 adapter slot은 실제 구현 아님
- 모든 adapter slot은 결정론적 실행 요구
- HWP/HWPX, HanCell, HanShow template preservation requirement를 Task 018에서 보존
- final core selection 미선언
- Stage 2 transition 미선언
- Task 018 summary read-only 유지
- Task 018/017 regression 유지
- 실제 adapter execution 없음
- Model Gateway 구현 없음

## 생성 산출물

산출물 root:

- `release/test-documents/app-target-routing-proof-019/`

주요 산출물:

- `routing/app-target-routing-contract.json`
- `routing/plan-type-target-mapping.json`
- `routing/adapter-slots.json`
- `routing/validation-error-taxonomy.json`
- `routing/multi-app-decomposition-rules.json`
- `routing-requests/*.json`
- `routing-results/*.json`
- `validation/routing-contract-validation-result.json`
- `validation/plan-type-mapping-validation-result.json`
- `validation/adapter-slot-validation-result.json`
- `validation/multi-app-decomposition-validation-result.json`
- `validation/error-taxonomy-validation-result.json`
- `tests/app-target-routing-summary.json`
- `tests/previous-task-read-only-result.json`

위 evidence 경로는 `.gitignore`에 걸려 있어 완료 커밋에는 `git add -f`로 명시 포함해야 한다.

## 테스트 명령

```powershell
node --test tools\army-claw\routing\AppTargetRoutingProof.test.mjs
node --test tools\army-claw\capability\ArmyClawMultiAppCapabilityArchitectureProof.test.mjs
node --test tools\hancom\hwpcoreadapter\TransportAgnosticInvocationFacadeProof.test.mjs
node --test tools\hancom\hwpcoreadapter\LocalClientBoundaryProof.test.mjs
node --test tools\hancom\hwpcoreadapter\LocalRouteManifestProof.test.mjs
node --test tools\hancom\hwpcoreadapter\InProcessRouteFacadeProof.test.mjs
node --test tools\hancom\hwpcoreadapter\ServiceContractSchema.test.mjs
```

## 테스트 결과

- Task 019 AppTargetRoutingProof: `8/8 pass`
- Task 018 ArmyClawMultiAppCapabilityArchitectureProof: `8/8 pass`
- Task 017 TransportAgnosticInvocationFacadeProof: `4/4 pass`
- Task 016 LocalClientBoundaryProof: `4/4 pass`
- Task 015 LocalRouteManifestProof: `7/7 pass`
- Task 014 InProcessRouteFacadeProof: `10/10 pass`
- Task 013 ServiceContractSchema: `15/15 pass`
- final marker: `ALL_TASK019_REGRESSION_TESTS_PASS`

## Read-only Checks

Task 019 artifact 생성 전후 다음 파일을 byte-for-byte 비교했다.

- Task 018 report
- Task 018 summary
- Task 018 architecture contract
- Task 017 summary

결과:

- `previous_task_read_only=true`

회귀 테스트 실행 과정에서 Task 013~018 evidence가 재생성되었으나, Task 019 범위 밖 산출물이므로 commit 전 `git restore`로 복구했다.

## 금지 사항 준수

- 실제 HWP/HWPX/HanCell/HanShow adapter 실행 없음
- HanCell 실제 adapter 구현 없음
- HanShow 실제 adapter 구현 없음
- PC automation 실제 구현 없음
- Model Gateway 실제 구현 없음
- LLM planner 실제 연결 없음
- 실제 HTTP server 실행 없음
- Express/Fastify/Koa/Hono 추가 없음
- React/UI 구현 없음
- npm/pip/online install 없음
- dependency vendoring 없음
- 실제 Hancom COM 실행 없음
- Hwp.exe process 조작 없음
- python-hwpx 신규 의존성 도입 없음
- 최종 HWPX core selection 선언 없음
- Stage 2 transition 선언 없음

## Risks

- 이번 결과는 routing contract proof이며 실제 앱 adapter 실행기는 아니다.
- target별 route는 slot까지의 결정만 증명하며, target별 fill plan schema와 실행 validator는 이후 작업에서 분리해야 한다.
- multi-app execution plan의 병렬성, 순서 의존성, rollback 정책은 아직 정의하지 않았다.

## Non-decisions

- 최종 HWPX core 선택
- production API framework
- production UI framework
- 실제 HanCell 실행 방식
- 실제 HanShow 실행 방식
- local workspace automation toolchain
- Model Gateway runtime 구현
- LLM planner 연결
- multi-app execution rollback 정책

## Completion Candidate

Task 019는 로컬 검증 기준 completion candidate 조건을 만족한다.

- Task 019 routing proof test pass
- Task 018 regression test pass
- Task 017 regression test pass
- routing contract version 고정
- 4개 app target 포함
- 5개 supported plan type 포함
- mapping 정확성 검증
- multi_app_execution_plan decomposition proof 생성
- unsupported target/plan mismatch controlled validation error proof 생성
- adapter slot은 존재하지만 실제 adapter 미구현
- HWP/HWPX, HanCell, HanShow template preservation requirement 보존
- 실제 HanCell/HanShow adapter 미구현
- 실제 PC automation 미구현
- Model Gateway 미구현
- LLM planner 미연결
- 최종 HWPX core selection 미선언
- Stage 2 transition 미선언

최종 완료 여부는 push 후 master review에서 원격 산출물을 검증해 판단한다.

## 다음 Task 020 권고

Task 020은 `App Target Plan Schema Proof` 또는 `Target Adapter Slot Input Contract Proof`가 적절하다. Task 019에서 어떤 slot으로 보낼지 결정했으므로 다음 단계에서는 target별 plan payload 구조를 분리해 검증하는 것이 자연스럽다.

권고 범위:

- `local_workspace_action_plan` schema
- `hwp_hwpx_fill_plan` schema
- `hancell_fill_plan` schema
- `hanshow_fill_plan` schema
- `multi_app_execution_plan`의 subplan payload validation
- target별 required/optional field와 controlled validation error

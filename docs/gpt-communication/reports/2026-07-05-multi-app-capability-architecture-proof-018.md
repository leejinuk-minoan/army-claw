# Task 018 Multi-App Capability Architecture Proof 보고서

## 요약

Task 018은 기능 구현이 아니라 Army Claw 마스터 플랜을 기준으로 multi-app capability architecture를 machine-readable contract와 proof artifact로 고정하는 작업이다.

이번 작업으로 Army Claw가 HWPX 전용 생성기가 아니라, 오프라인/폐쇄망 로컬 PC 지원 및 오피스 문서 생성 에이전트라는 구조를 명시했다. `local_workspace`, `hwp_hwpx`, `hancell`, `hanshow`는 모두 1급 대상이며, HWP/HWPX, HanCell, HanShow 템플릿 보존 요구사항도 계약으로 분리했다.

## Branch

- branch: `agent/task018-multi-app-capability-architecture-proof`
- start SHA: `a54c476ee93ea9815d7c1cd6d14b43abbdd476d2`
- final SHA: 본 보고서를 포함하는 Task 018 커밋 SHA

## 읽은 파일

- `docs/architecture/army-claw-master-plan.md`
- `docs/gpt-communication/reports/2026-07-05-army-claw-master-plan-import.md`
- `docs/gpt-communication/reports/2026-07-05-transport-agnostic-invocation-facade-proof-017.md`
- `release/test-documents/transport-agnostic-invocation-facade-proof-017/tests/invocation-facade-summary.json`
- `docs/gpt-communication/reports/2026-07-05-local-client-boundary-proof-016.md`
- `docs/gpt-communication/reports/2026-07-05-local-route-manifest-proof-015.md`
- `docs/gpt-communication/reports/2026-07-05-inprocess-route-facade-proof-014.md`
- `tools/hancom/hwpcoreadapter/TransportAgnosticInvocationFacadeProof.mjs`
- `tools/hancom/hwpcoreadapter/TransportAgnosticInvocationFacadeProof.test.mjs`

## 변경 파일

- `tools/army-claw/capability/ArmyClawMultiAppCapabilityArchitectureProof.mjs`
- `tools/army-claw/capability/ArmyClawMultiAppCapabilityArchitectureProof.test.mjs`
- `docs/gpt-communication/reports/2026-07-05-multi-app-capability-architecture-proof-018.md`
- `release/test-documents/multi-app-capability-architecture-proof-018/**`

## Architecture Version

- `army-claw-multi-app-capability-architecture-018.v1`

## App Targets

모든 target은 `first_class_target=true`로 고정했다.

- `local_workspace`: planned_first_class_target
- `hwp_hwpx`: first_stabilized_execution_path
- `hancell`: planned_first_class_document_target
- `hanshow`: planned_first_class_document_target

Task 018에서는 실제 HanCell/HanShow adapter를 구현하지 않았다.

## Template Preservation Matrix

다음 세 문서 대상은 `template_preservation_required=true`다.

- HWP/HWPX: paragraph_styles, character_styles, page_settings, margins, headers_footers, tables, numbering, section_structure, placeholders, approval_or_signature_blocks
- HanCell: sheets, cell_styles, merged_cells, row_column_sizes, formulas, named_ranges, tables, charts, print_settings, placeholder_cells_or_ranges
- HanShow: slide_size, slide_layouts, theme_styles, placeholders, text_boxes, shapes, tables, image_frames, chart_placeholders, briefing_structure

## LLM Boundary

- `llm_may_directly_edit_document_packages=false`
- `llm_may_directly_modify_native_app_state=false`
- `llm_must_output_structured_plan_only=true`
- `plan_validation_required_before_execution=true`

허용 plan type:

- `local_workspace_action_plan`
- `hwp_hwpx_fill_plan`
- `hancell_fill_plan`
- `hanshow_fill_plan`
- `multi_app_execution_plan`

## Adapter Execution Boundary

- app adapter가 plan을 검증한 뒤 결정론적으로 실행해야 한다.
- 문서 패키지 변경과 네이티브 앱 상태 변경은 target adapter를 통해서만 수행되어야 한다.
- Task 018에서는 실제 PC automation, HanCell adapter, HanShow adapter를 구현하지 않았다.

## Model Gateway Requirements

다음 adapter 요구사항을 contract에 고정했다.

- `MockModelAdapter`
- `LocalLlmAdapter`
- `ClosedOpenAICompatibleAdapter`

모든 adapter는 `public_internet_required=false`, `implemented_in_task018=false`다. Task 018에서는 Model Gateway를 구현하지 않았다.

## Local Workspace Policy

- `approved_workspace_required=true`
- `protect_source_templates_from_overwrite=true`
- `validate_paths_before_writes=true`
- `log_operations=true`
- `dry_run_or_preview_recommended=true`
- `public_internet_access_required=false`
- `actual_pc_automation_implemented_in_task018=false`

## Roadmap Alignment

마스터 플랜 기준으로 Task 018은 다음 구조와 일치한다.

- Task 017: Transport-agnostic Invocation Facade Boundary Proof
- Task 018: Army Claw Multi-App Capability Architecture Proof
- Task 019: App Target Contract and Plan Routing Proof

Task 018은 Stage 2 전환을 선언하지 않는다.

## Proof Cases

Task 018 summary 기준 proof case는 28개이며 모두 통과했다.

핵심 검증:

- 공식 시스템명은 Army Claw
- `hwp_only=false`
- `local_workspace`, `hwp_hwpx`, `hancell`, `hanshow` 모두 1급 대상
- HWP/HWPX, HanCell, HanShow 템플릿 보존 필수
- LLM 직접 문서 패키지 수정 금지
- LLM 직접 네이티브 앱 상태 수정 금지
- LLM은 structured plan만 생성
- adapter 결정론적 실행 경계 필수
- MockModelAdapter, LocalLlmAdapter, ClosedOpenAICompatibleAdapter 선언
- public internet required=false
- 최종 HWPX core selection 미선언
- Stage 2 transition 미선언
- Task 017 summary read-only 유지
- HanCell/HanShow actual adapter 미구현
- Model Gateway actual adapter 미구현
- Task 018/019 roadmap 정렬

## 생성 산출물

산출물 root:

- `release/test-documents/multi-app-capability-architecture-proof-018/`

세부 산출물:

- `architecture/army-claw-capability-architecture.json`
- `architecture/app-targets.json`
- `architecture/operation-families.json`
- `architecture/artifact-families.json`
- `architecture/template-preservation-matrix.json`
- `architecture/model-gateway-requirements.json`
- `architecture/llm-boundary.json`
- `architecture/local-workspace-policy.json`
- `validation/capability-architecture-validation-result.json`
- `validation/template-preservation-validation-result.json`
- `validation/model-gateway-validation-result.json`
- `validation/llm-boundary-validation-result.json`
- `validation/roadmap-alignment-validation-result.json`
- `tests/multi-app-capability-architecture-summary.json`
- `tests/previous-task-read-only-result.json`

위 evidence 경로는 `.gitignore`에 걸려 있어 완료 커밋에는 `git add -f`로 명시 포함해야 한다.

## 테스트 명령

```powershell
node --test tools\army-claw\capability\ArmyClawMultiAppCapabilityArchitectureProof.test.mjs
node --test tools\hancom\hwpcoreadapter\TransportAgnosticInvocationFacadeProof.test.mjs
node --test tools\hancom\hwpcoreadapter\LocalClientBoundaryProof.test.mjs
node --test tools\hancom\hwpcoreadapter\LocalRouteManifestProof.test.mjs
node --test tools\hancom\hwpcoreadapter\InProcessRouteFacadeProof.test.mjs
node --test tools\hancom\hwpcoreadapter\ServiceContractSchema.test.mjs
```

## 테스트 결과

- Task 018 ArmyClawMultiAppCapabilityArchitectureProof: `8/8 pass`
- Task 017 TransportAgnosticInvocationFacadeProof: `4/4 pass`
- Task 016 LocalClientBoundaryProof: `4/4 pass`
- Task 015 LocalRouteManifestProof: `7/7 pass`
- Task 014 InProcessRouteFacadeProof: `10/10 pass`
- Task 013 ServiceContractSchema: `15/15 pass`
- final marker: `ALL_TASK018_REGRESSION_TESTS_PASS`

## Read-only Checks

Task 018 artifact 생성 전후 다음 파일을 byte-for-byte 비교했다.

- Task 017 report
- Task 017 summary
- Task 016 report
- Task 015 report
- Task 014 report

결과:

- `previous_task_read_only=true`

회귀 테스트 실행 과정에서 Task 013~017 evidence가 재생성되었으나, Task 018 범위 밖 산출물이므로 commit 전 `git restore`로 복구했다.

## 금지 사항 준수

- HWPX 엔진 구현 변경 없음
- Task 017/016/015 구현 파일 수정 없음
- HanCell 실제 adapter 구현 없음
- HanShow 실제 adapter 구현 없음
- PC automation 실제 구현 없음
- Model Gateway 실제 구현 없음
- LLM planner 실제 연결 없음
- 실제 HTTP server 실행 없음
- npm/pip/online install 없음
- dependency vendoring 없음
- 실제 Hancom COM 실행 없음
- Hwp.exe process 조작 없음
- python-hwpx 신규 의존성 도입 없음
- 최종 HWPX core selection 선언 없음
- Stage 2 transition 선언 없음

## Risks

- 이번 결과는 architecture contract와 proof artifact이며, 실제 HanCell/HanShow 실행 adapter가 아니다.
- Model Gateway는 요구사항만 고정했고 runtime adapter 구현은 이후 Task로 남아 있다.
- local_workspace도 1급 대상으로 고정했지만 실제 PC automation 안전 게이트와 실행기는 아직 구현하지 않았다.

## Non-decisions

- 최종 HWPX core 선택
- production API framework
- production UI framework
- 정확한 local LLM backend
- 정확한 폐쇄망 OpenAI-compatible endpoint
- HanCell 실행 방식
- HanShow 실행 방식
- local workspace automation toolchain
- 최종 패키징 형식

## Completion Candidate

Task 018은 로컬 검증 기준 completion candidate 조건을 만족한다.

- Task 018 architecture proof test pass
- Task 017 regression test pass
- Army Claw 명칭 고정
- `hwp_only=false`
- 4개 app target 모두 1급 대상
- HWP/HWPX, HanCell, HanShow 템플릿 보존 필수
- LLM structured-plan-only boundary 고정
- deterministic app adapter execution boundary 고정
- model gateway requirement 고정
- public internet required=false
- 실제 HanCell/HanShow adapter 미구현
- 실제 Model Gateway 미구현
- 실제 PC automation 미구현
- 최종 HWPX core selection 미선언
- Stage 2 transition 미선언

최종 완료 여부는 push 후 master review에서 원격 산출물을 검증해 판단한다.

## 다음 Task 019 권고

Task 019는 `App Target Contract and Plan Routing Proof`가 적절하다. Task 018에서 고정한 app target과 allowed plan type을 기반으로 다음을 machine-readable contract로 분리하는 단계가 좋다.

- user request를 app target으로 라우팅하는 규칙
- plan type과 target adapter slot 매핑
- multi-app execution plan의 target별 분해 규칙
- unsupported target/operation의 controlled validation error
- HWP/HWPX, HanCell, HanShow, local_workspace 각각의 최소 route contract

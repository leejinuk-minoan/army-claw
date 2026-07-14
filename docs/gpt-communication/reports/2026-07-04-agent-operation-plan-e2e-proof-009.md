# Task 009 - Agent Operation Plan End-to-End Proof

## 요약

Task 009는 agent-level controlled request를 deterministic operation plan으로 변환하고, 이 plan을 `HwpCoreAdapter`와 `NodeXmlThinInterimEditorAdapter`를 통해 실행한 뒤 agent execution report를 생성하는 최소 E2E proof다.

이번 작업은 production agent runtime이 아니며, LLM planner 통합도 아니다. 최종 HWPX core selection과 Stage 2 transition도 선언하지 않는다.

## 시작 조건

- repository: `leejinuk-minoan/army-claw`
- branch: `agent/task009-agent-operation-plan-e2e-proof`
- start SHA: `a8623e1ad58b2b2adc4244ca53c9eb07fe4bac83`
- task id: `agent-operation-plan-e2e-proof-009`
- worktree: `C:\Users\USER\Desktop\로컬 open claw 만들기\.tmp\t9`

## 읽은 파일

- `docs/gpt-communication/reports/2026-07-04-node-xml-thin-interim-adapter-integration-008.md`
- `release/test-documents/node-xml-thin-interim-adapter-integration-008/tests/interim-adapter-summary.json`
- `tools/hancom/hwpcoreadapter/HwpCoreAdapter.mjs`
- `tools/hancom/hwpcoreadapter/NodeXmlThinInterimEditorAdapter.mjs`
- `tools/hancom/hwpcoreadapter/NodeXmlThinInterimEditorAdapter.test.mjs`
- `docs/architecture/hwpx-core-adapter-boundary-004.md`

## 구현 접근

새 파일 `AgentOperationPlanE2E.mjs`를 추가했다.

구조는 다음과 같다.

1. controlled request를 받는다.
2. `createAgentOperationPlan`이 deterministic operation plan을 만든다.
3. `executeAgentRequest`가 plan step을 `HwpCoreAdapter.executeOperation`으로 실행한다.
4. editor backend는 Task 008의 `NodeXmlThinInterimEditorAdapter`를 사용한다.
5. 성공/실패 결과를 agent execution report JSON으로 기록한다.

## Request Model

지원하는 controlled request 필드는 다음과 같다.

- `request_id`
- `task_id`
- `document_intent`
- `input_path`
- `output_path`
- `content.text`
- `content.table`
- `content.style`
- `constraints.backend_role`
- `constraints.backend_id`
- `constraints.no_real_com`
- `constraints.no_final_core_selection`

지원 intent:

- `create_document`
- `edit_paragraph`
- `edit_table`
- `apply_style`

## Operation Plan Model

operation plan은 다음 필드를 가진다.

- `plan_id`
- `request_id`
- `task_id`
- `created_at`
- `planner_id=AgentOperationPlanE2EPlanner`
- `steps`
- `constraints`
- `source_request`

각 step은 다음 필드를 가진다.

- `step_id`
- `operation_id`
- `intent`
- `backend_role=editor`
- `input_path`
- `output_path`
- `options`
- `evidence_tag`
- `expected_evidence_path`

## Execution Report Model

agent execution report는 다음 필드를 가진다.

- `report_id`
- `request_id`
- `plan_id`
- `task_id`
- `started_at`
- `ended_at`
- `success`
- `final_output_path`
- `steps`
- `evidence_paths`
- `failures`
- `promoted_outputs`
- `real_com_executed=false`
- `final_core_selection_declared=false`
- `stage_2_transition_declared=false`

## 생성 산출물

- `release/test-documents/agent-operation-plan-e2e-proof-009/fixtures/source.hwpx`
- `release/test-documents/agent-operation-plan-e2e-proof-009/plans/create-document-plan.json`
- `release/test-documents/agent-operation-plan-e2e-proof-009/plans/edit-paragraph-plan.json`
- `release/test-documents/agent-operation-plan-e2e-proof-009/plans/edit-table-plan.json`
- `release/test-documents/agent-operation-plan-e2e-proof-009/plans/apply-style-plan.json`
- `release/test-documents/agent-operation-plan-e2e-proof-009/reports/create-document-agent-report.json`
- `release/test-documents/agent-operation-plan-e2e-proof-009/reports/edit-paragraph-agent-report.json`
- `release/test-documents/agent-operation-plan-e2e-proof-009/reports/edit-table-agent-report.json`
- `release/test-documents/agent-operation-plan-e2e-proof-009/reports/apply-style-agent-report.json`
- `release/test-documents/agent-operation-plan-e2e-proof-009/reports/unknown-intent-agent-report.json`
- `release/test-documents/agent-operation-plan-e2e-proof-009/reports/validation-failure-agent-report.json`
- `release/test-documents/agent-operation-plan-e2e-proof-009/outputs/create-document-output.hwpx`
- `release/test-documents/agent-operation-plan-e2e-proof-009/outputs/edit-paragraph-output.hwpx`
- `release/test-documents/agent-operation-plan-e2e-proof-009/outputs/edit-table-output.hwpx`
- `release/test-documents/agent-operation-plan-e2e-proof-009/outputs/apply-style-output.hwpx`
- `release/test-documents/agent-operation-plan-e2e-proof-009/evidence/*.json`
- `release/test-documents/agent-operation-plan-e2e-proof-009/tests/agent-operation-plan-e2e-summary.json`

## E2E 결과

| request | plan | report | output | result |
| --- | --- | --- | --- | --- |
| create_document | 생성 | 생성 | `create-document-output.hwpx` | success true |
| edit_paragraph | 생성 | 생성 | `edit-paragraph-output.hwpx` | success true |
| edit_table | 생성 | 생성 | `edit-table-output.hwpx` | success true |
| apply_style | 생성 | 생성 | `apply-style-output.hwpx` | success true |
| unknown_intent | no executable step | 생성 | 없음 | success false, policy_error |
| validation failure | 생성 | 생성 | final output 없음 | success false, validation_error |

## 검증 결과

다음 명령을 실행했다.

```powershell
$env:ARMY_CLAW_NODE_MODULES='C:\Users\USER\Desktop\로컬 open claw 만들기\.tmp\openclaw-prod-install\node_modules'
node --test tools\hancom\hwpcoreadapter\AgentOperationPlanE2E.test.mjs
node --test tools\hancom\hwpcoreadapter\NodeXmlThinInterimEditorAdapter.test.mjs
node --test tools\hancom\hwpcoreadapter\HwpCoreAdapter.contract.test.mjs
node --test tools\hancom\hwpcoreadapter\HwpCoreAdapterBackendProof.test.mjs
node --test tools\hancom\hwpcoreadapter\EditorBackendCandidateComparison.test.mjs

$env:NODE_PATH='C:\Users\USER\Desktop\로컬 open claw 만들기\.tmp\openclaw-prod-install\node_modules'
node --test tools\hancom\hwpx-core-benchmark-contract.test.mjs tools\hancom\hwpx-core-benchmark-evidence-integrity.test.mjs
```

결과:

- Task 009 AgentOperationPlanE2E: 13/13 pass
- Task 008 interim adapter: 11/11 pass
- Task 005 contract: 15/15 pass
- Task 006 backend proof: 15/15 pass
- Task 007 comparison: 8/8 pass
- 기존 Hancom/Task 003 smoke: 12/12 pass

## Read-only 확인

Task 006/007/008 회귀 테스트는 실행 중 기존 산출물을 재생성할 수 있으므로 검증 후 해당 tracked 변경은 HEAD 상태로 복원했다.

최종 커밋 대상은 Task 009 module, test, report, Task 009 artifact directory만 포함한다.

## 금지 사항 준수

- production agent runtime 구현 아님
- LLM planner 통합 없음
- Model Gateway 작업 없음
- Offline Skill Runtime 작업 없음
- 최종 HWPX core selection 선언 없음
- Stage 2 transition 선언 없음
- 실제 Hancom COM 실행 없음
- Hwp.exe process 조작 없음
- python-hwpx 신규 의존성 없음
- pip/npm/online install 없음
- dependency vendoring 없음
- Task 010 착수 없음

## Risk

- planner는 controlled request만 처리한다.
- 자연어 요청 이해는 아직 없다.
- 실제 사용자 작업 큐나 UI와 연결되지 않았다.
- output layout 품질은 native authority 단계에서 별도 검증이 필요하다.

## Non-decisions

- 최종 HWPX core는 선정하지 않았다.
- Stage 2 전환을 선언하지 않았다.
- python-hwpx 채택/폐기를 결정하지 않았다.
- production runtime 구조를 확정하지 않았다.

## Completion Candidate

Task 009는 completion candidate 상태다. master review가 원격 산출물과 evidence를 검증한 뒤 최종 완료로 판단할 수 있다.

## 다음 Task 010 권고

Task 010은 agent execution queue 또는 UI/backend API 경계에 이 E2E runner를 연결하는 최소 API proof가 적절하다. 범위는 controlled request를 API로 받아 plan/report/evidence/output path를 반환하는 수준으로 제한하는 것이 좋다.

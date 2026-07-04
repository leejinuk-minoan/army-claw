# Task 010 - Agent API Boundary Proof

## 요약

Task 010은 Task 009에서 만든 agent operation plan E2E runner 앞단에 API 형태의 함수 경계를 추가한 proof다.

이번 작업은 실제 HTTP 서버, production runtime, UI 연동, LLM planner, Model Gateway, Skill Runtime 구현이 아니다. controlled request를 함수 입력으로 받아 request/response/plan/report/output/evidence artifact를 생성하고, 호출자가 사용할 수 있는 응답 모델을 검증하는 범위로 제한했다.

## 시작 조건

- repository: `leejinuk-minoan/army-claw`
- branch: `agent/task010-api-boundary-proof`
- start SHA: `834c24ca3708168b99c66037d47abfee470dd987`
- task id: `agent-api-boundary-proof-010`
- worktree: `C:\Users\USER\Desktop\로컬 open claw 만들기\.tmp\t10`

## 읽은 파일

- `docs/gpt-communication/reports/2026-07-04-agent-operation-plan-e2e-proof-009.md`
- `release/test-documents/agent-operation-plan-e2e-proof-009/tests/agent-operation-plan-e2e-summary.json`
- `tools/hancom/hwpcoreadapter/AgentOperationPlanE2E.mjs`
- `tools/hancom/hwpcoreadapter/AgentOperationPlanE2E.test.mjs`
- `tools/hancom/hwpcoreadapter/NodeXmlThinInterimEditorAdapter.mjs`
- `tools/hancom/hwpcoreadapter/NodeXmlThinInterimEditorAdapter.test.mjs`
- `tools/hancom/hwpcoreadapter/HwpCoreAdapter.mjs`
- `docs/architecture/hwpx-core-adapter-boundary-004.md`

## 구현 접근

새 파일 `AgentApiBoundaryProof.mjs`를 추가했다.

구조는 다음과 같다.

1. API-like controlled request를 받는다.
2. request JSON을 Task 010 전용 `requests/`에 저장한다.
3. `validateAgentApiRequest`가 필수 필드와 지원 intent를 검증한다.
4. valid request는 deterministic operation plan으로 변환한다.
5. `HwpCoreAdapter`와 `NodeXmlThinInterimEditorAdapter`를 통해 editor operation을 실행한다.
6. agent report와 API response JSON을 Task 010 전용 `reports/`, `responses/`에 저장한다.
7. invalid request는 실행 전 `rejected` 응답을 반환한다.
8. validation failure는 accepted 상태로 실행하되 `failed` 응답을 반환하고 final output을 제공하지 않는다.

Task 009 module은 경로 상수가 Task 009 산출물에 고정되어 있으므로 직접 호출하지 않았다. 대신 Task 009의 plan/report 흐름과 Task 008/005 adapter 경계를 재사용 가능한 패턴으로 유지하면서, 모든 쓰기 경로를 Task 010 root 아래로 분리했다.

## API Request Model

지원 필드:

- `api_request_id`
- `request_id`
- `task_id`
- `document_intent`
- `content.text`
- `content.table`
- `content.style`
- `constraints.backend_role`
- `constraints.backend_id`
- `constraints.no_real_com`
- `constraints.no_final_core_selection`
- `constraints.force_validation_failure`

지원 intent:

- `create_document`
- `edit_paragraph`
- `edit_table`
- `apply_style`

## API Response Model

응답은 다음 필드를 가진다.

- `api_request_id`
- `request_id`
- `accepted`
- `status`: `rejected`, `completed`, `failed`
- `plan_path`
- `report_path`
- `output_path`
- `evidence_paths`
- `failure`
- `validation`
- `real_com_executed=false`
- `final_core_selection_declared=false`
- `stage_2_transition_declared=false`

## Proof Cases

| case | expected |
| --- | --- |
| `create_document` | accepted true, status completed, HWPX output 생성 |
| `edit_paragraph` | accepted true, status completed, HWPX output 생성 |
| `edit_table` | accepted true, status completed, HWPX output 생성 |
| `apply_style` | accepted true, status completed, HWPX output 생성 |
| invalid request | accepted false, status rejected, operation 미실행 |
| validation failure request | accepted true, status failed, final output 없음 |

## 생성 산출물

- `release/test-documents/agent-api-boundary-proof-010/requests/*.json`
- `release/test-documents/agent-api-boundary-proof-010/responses/*.json`
- `release/test-documents/agent-api-boundary-proof-010/plans/*.json`
- `release/test-documents/agent-api-boundary-proof-010/reports/*.json`
- `release/test-documents/agent-api-boundary-proof-010/outputs/*.hwpx`
- `release/test-documents/agent-api-boundary-proof-010/evidence/*.json`
- `release/test-documents/agent-api-boundary-proof-010/tests/api-boundary-summary.json`

## 검증 결과

다음 명령을 실행했다.

```powershell
$env:ARMY_CLAW_NODE_MODULES='C:\Users\USER\Desktop\로컬 open claw 만들기\.tmp\openclaw-prod-install\node_modules'
$env:NODE_PATH='C:\Users\USER\Desktop\로컬 open claw 만들기\.tmp\openclaw-prod-install\node_modules'
node --test tools\hancom\hwpcoreadapter\AgentApiBoundaryProof.test.mjs
node --test tools\hancom\hwpcoreadapter\AgentOperationPlanE2E.test.mjs
node --test tools\hancom\hwpcoreadapter\NodeXmlThinInterimEditorAdapter.test.mjs
node --test tools\hancom\hwpcoreadapter\HwpCoreAdapter.contract.test.mjs
node --test tools\hancom\hwpcoreadapter\HwpCoreAdapterBackendProof.test.mjs
node --test tools\hancom\hwpcoreadapter\EditorBackendCandidateComparison.test.mjs
node --test tools\hancom\hwpx-core-benchmark-contract.test.mjs tools\hancom\hwpx-core-benchmark-evidence-integrity.test.mjs
```

결과:

- Task 010 API boundary proof: 11/11 pass
- Task 009 AgentOperationPlanE2E: 13/13 pass
- Task 008 interim adapter: 11/11 pass
- Task 005 contract: 15/15 pass
- Task 006 backend proof: 15/15 pass
- Task 007 comparison: 8/8 pass
- 기존 Hancom/Task 003 smoke: 12/12 pass
- failed command count: 0

## Read-only 확인

Task 006/007/008/009 회귀 테스트는 실행 중 기존 산출물을 재생성할 수 있으므로 검증 후 해당 tracked 변경은 HEAD 상태로 복원했다.

최종 커밋 대상은 Task 010 module, test, report, Task 010 artifact directory만 포함한다.

## 금지 사항 준수

- 실제 HTTP 서버 구현 없음
- production runtime 구현 없음
- LLM planner 통합 없음
- Model Gateway 작업 없음
- Offline Skill Runtime 작업 없음
- 최종 HWPX core selection 선언 없음
- Stage 2 transition 선언 없음
- 실제 Hancom COM 실행 없음
- Hwp process 조작 없음
- python-hwpx 신규 의존성 없음
- pip/npm/online install 없음
- dependency vendoring 없음
- Task 011 착수 없음

## Risk

- API 경계는 함수 호출 proof이며 네트워크 API가 아니다.
- request validation은 최소 필수 필드와 intent 검증에 한정된다.
- 자연어 요청 이해와 작업 큐/동시성 처리는 아직 없다.
- output layout 품질은 native authority 단계에서 별도 검증이 필요하다.

## Non-decisions

- 최종 HWPX core는 선정하지 않았다.
- Stage 2 전환을 선언하지 않았다.
- production API framework는 선택하지 않았다.
- UI/backend endpoint 구조는 확정하지 않았다.
- model gateway 또는 skill runtime을 설계하지 않았다.

## Completion Candidate

Task 010은 completion candidate 상태다. master review가 원격 산출물과 evidence를 검증한 뒤 최종 완료로 판단할 수 있다.

## 다음 Task 011 권고

Task 011은 이 API-like function boundary를 실제 Army Claw backend의 내부 service layer 또는 local queue boundary에 연결하는 proof가 적절하다. 단, 네트워크 서버를 바로 열기보다는 request persistence, job state, response polling, failure recovery를 먼저 검증하는 순서가 안전하다.

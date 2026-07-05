# Task 014 In-process Route Facade Proof 보고서

## 요약

Task 014는 실제 HTTP 서버를 띄우지 않고, React UI 또는 backend route가 나중에 붙을 수 있는 route-like function boundary를 검증했다. 구현은 `InternalServiceAdapterProof`를 직접 노출하지 않는 얇은 in-process facade이며, Task 013의 service contract enum, status, error taxonomy를 사용해 route request/response를 정규화한다.

## Branch

- branch: `agent/task014-inprocess-route-facade-proof`
- start SHA: `a76b9169e4938ff8efabe56ab52769c861ed03b0`
- final SHA: commit 전 기준으로는 작업 중 HEAD와 동일, commit 후 갱신됨

## 읽은 파일

- `docs/architecture/service-contract-schema-error-taxonomy-013.md`
- `docs/gpt-communication/reports/2026-07-05-service-contract-schema-error-taxonomy-013.md`
- `release/test-documents/service-contract-schema-error-taxonomy-013/tests/service-contract-summary.json`
- `tools/hancom/hwpcoreadapter/ServiceContractSchema.mjs`
- `tools/hancom/hwpcoreadapter/ServiceContractSchema.test.mjs`
- `docs/gpt-communication/reports/2026-07-05-service-adapter-boundary-proof-012.md`
- `tools/hancom/hwpcoreadapter/InternalServiceAdapterProof.mjs`
- `tools/hancom/hwpcoreadapter/InternalServiceAdapterProof.test.mjs`

## 변경 파일

- `tools/hancom/hwpcoreadapter/InProcessRouteFacadeProof.mjs`
- `tools/hancom/hwpcoreadapter/InProcessRouteFacadeProof.test.mjs`
- `docs/gpt-communication/reports/2026-07-05-inprocess-route-facade-proof-014.md`
- `release/test-documents/inprocess-route-facade-proof-014/**`

## 구현 접근

`createInProcessRouteFacade(options)`를 추가하고 다음 route-like method를 제공했다.

- `route.handle(routeRequest)`
- `route.submitDocumentJob(routeRequest)`
- `route.runJob(routeRequest)`
- `route.getJob(routeRequest)`
- `route.getStatus(routeRequest)`
- `route.getResult(routeRequest)`
- `route.listEvents(routeRequest)`

내부 adapter는 repo root가 아니라 Task 014 전용 `internal-execution-workspace`에서 실행한다. 따라서 Task 012/013 완료 산출물을 직접 overwrite하지 않는다. route facade는 내부 service response를 받은 뒤 Task 014 root 아래의 route response, copied job/request/response/plan/report/output/evidence artifact로 정규화한다.

## Route Facade Model

이번 proof의 mock route는 production HTTP path가 아니다. route shape를 검증하기 위한 function boundary다.

| mock route | service operation |
| --- | --- |
| `POST /mock/jobs` | `submit` |
| `POST /mock/jobs/:job_id/run` | `runJob` |
| `GET /mock/jobs/:job_id` | `getJob` |
| `GET /mock/jobs/:job_id/status` | `getStatus` |
| `GET /mock/jobs/:job_id/result` | `getResult` |
| `GET /mock/jobs/:job_id/events` | `listEvents` |

## Route Request Contract

route request는 다음 필드를 가진다.

- `route_request_id`
- `mock_method`
- `mock_path`
- `service_operation`
- `params.job_id`
- `body.service_request_id`
- `body.api_request_id`
- `body.request_id`
- `body.task_id`
- `body.document_intent`
- `body.content`
- `body.constraints`

`submit` 요청은 Task 013 `validateServiceRequestContract`를 통과해야 한다.

## Route Response Contract

route response는 다음 필드를 가진다.

- `route_request_id`
- `mock_method`
- `mock_path`
- `service_operation`
- `http_like_status`
- `ok`
- `status`
- `job_id`
- `job_status`
- `data`
- `error`
- `artifacts`
- `contract_version`
- `real_com_executed=false`
- `final_core_selection_declared=false`
- `stage_2_transition_declared=false`

## http_like_status Mapping

| status/error | http_like_status |
| --- | --- |
| `accepted`, `pending`, `running` | `202` |
| `completed` | `200` |
| `rejected`, `policy_error` | `400` |
| `validation_error`, `invalid_request`, `unsupported_intent` | `422` |
| `not_found` | `404` |
| `not_ready` | `409` |
| `failed`, `execution_error`, `artifact_missing`, `contract_violation` | `500` |

이 mapping은 proof용이며 production HTTP route 확정이 아니다.

## Proof Cases

- submit create_document route
- run create_document route
- getStatus pending route
- getStatus completed route
- getResult completed route
- listEvents completed route
- invalid route request
- unknown job route
- getResult before terminal route
- validation failure route

## 생성 산출물

산출물 root:

- `release/test-documents/inprocess-route-facade-proof-014/`

주요 하위 경로:

- `route-requests/*.json`
- `route-responses/*.json`
- `service-responses/*.json`
- `jobs/*.json`
- `requests/*.json`
- `responses/*.json`
- `plans/*.json`
- `reports/*.json`
- `outputs/*.hwpx`
- `evidence/*.json`
- `tests/route-facade-summary.json`
- `tests/contract-validation-summary.json`
- `tests/previous-task-read-only-result.json`

## Contract Validation Results

- proof_case_count: `10`
- proof_cases_passed: `10`
- route_responses_use_task013_status_enum: `true`
- route_errors_use_task013_error_taxonomy: `true`
- previous_tasks_read_only: `true`
- completion_candidate: `true`

## 테스트 명령

```powershell
$env:ARMY_CLAW_NODE_MODULES='C:\Users\USER\Desktop\로컬 open claw 만들기\.tmp\openclaw-prod-install\node_modules'
$env:NODE_PATH='C:\Users\USER\Desktop\로컬 open claw 만들기\.tmp\openclaw-prod-install\node_modules'
node --test tools\hancom\hwpcoreadapter\InProcessRouteFacadeProof.test.mjs
node --test tools\hancom\hwpcoreadapter\ServiceContractSchema.test.mjs
node --test tools\hancom\hwpcoreadapter\InternalServiceAdapterProof.test.mjs
node --test tools\hancom\hwpcoreadapter\LocalJobBoundaryProof.test.mjs
node --test tools\hancom\hwpcoreadapter\AgentApiBoundaryProof.test.mjs
node --test tools\hancom\hwpcoreadapter\AgentOperationPlanE2E.test.mjs
node --test tools\hancom\hwpcoreadapter\NodeXmlThinInterimEditorAdapter.test.mjs
node --test tools\hancom\hwpcoreadapter\HwpCoreAdapter.contract.test.mjs
node --test tools\hancom\hwpcoreadapter\HwpCoreAdapterBackendProof.test.mjs
node --test tools\hancom\hwpcoreadapter\EditorBackendCandidateComparison.test.mjs
node --test tools\hancom\hwpx-core-benchmark-contract.test.mjs tools\hancom\hwpx-core-benchmark-evidence-integrity.test.mjs
```

## 테스트 결과

- Task 014 InProcessRouteFacadeProof: `10/10 pass`
- Task 013 ServiceContractSchema: `15/15 pass`
- Task 012 InternalServiceAdapterProof: `14/14 pass`
- Task 011 LocalJobBoundaryProof: `15/15 pass`
- Task 010 AgentApiBoundaryProof: `11/11 pass`
- Task 009 AgentOperationPlanE2E: `13/13 pass`
- Task 008 NodeXmlThinInterimEditorAdapter: `11/11 pass`
- Task 005 HwpCoreAdapter contract: `15/15 pass`
- Task 006 HwpCoreAdapterBackendProof: `15/15 pass`
- Task 007 EditorBackendCandidateComparison: `8/8 pass`
- 기존 Hancom/Task 003 smoke: `12/12 pass`
- final command marker: `ALL_TASK014_FINAL_TESTS_PASS`

## Read-only 확인

Task 014 facade는 내부 adapter를 Task 014 전용 execution workspace에서 실행했다. Task 012/013 summary 파일은 실행 전후 byte-for-byte 동일함을 확인했다. 전체 회귀 테스트 실행 후 이전 Task 산출물이 재생성되어 변경으로 잡히는 경우 Task 014 변경 범위가 아니므로 복구 대상이다.

## 금지 사항 준수

- 실제 HTTP 서버 실행 없음
- Express/Fastify/Koa/Hono dependency 추가 없음
- UI/React 구현 없음
- production queue worker 없음
- OS daemon/background scheduler 없음
- LLM planner 연결 없음
- Model Gateway 작업 없음
- Offline Skill Runtime 작업 없음
- 실제 Hancom COM 실행 없음
- Hwp.exe process 조작 없음
- python-hwpx 신규 의존성 없음
- install/vendor action 없음
- 최종 HWPX core selection 선언 없음
- Stage 2 transition 선언 없음

## Risks

- 이번 route facade는 in-process proof이며 production HTTP server가 아니다.
- http_like_status는 proof mapping이고 실제 API status code 정책은 아직 확정하지 않았다.
- concurrent route call, persistent service lifecycle, crash recovery는 아직 검증하지 않았다.

## Non-decisions

- production API framework 선택 없음
- production route path 확정 없음
- UI polling UX 결정 없음
- retry/backoff 정책 결정 없음
- 최종 HWPX core 선택 없음
- Stage 2 전환 없음

## Completion Candidate

Task 014는 completion candidate 조건을 목표로 구현되었다. 최종 completion 여부는 전체 검증 결과와 master review에서 판단한다.

## 다음 Task 015 권고

Task 015는 이 in-process route facade 위에 UI/backend가 공유할 route contract fixture 또는 OpenAPI가 아닌 local route manifest proof를 추가하는 단계가 적절하다. 여전히 실제 HTTP 서버를 띄우기보다는 route manifest와 mock 호출 흐름을 먼저 고정하는 편이 안전하다.

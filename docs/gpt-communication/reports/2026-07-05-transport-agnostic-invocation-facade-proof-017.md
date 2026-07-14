# Task 017 Transport-agnostic Invocation Facade Proof 보고서

## 요약

Task 017은 실제 HTTP 서버, React UI, production API framework를 만들기 전에 transport에 의존하지 않는 invocation facade boundary를 증명했다. 호출자는 HTTP, CLI, UI, local function 중 무엇인지 몰라도 invocation envelope만 만들고, facade는 Task 016 local client boundary와 Task 014 in-process route facade를 연결해 Task 016 client result contract 기반 invocation result를 반환한다.

이번 작업은 Stage 2 전환이 아니며, 실제 transport runtime을 시작하지 않았다.

## Branch

- branch: `agent/task017-transport-agnostic-invocation-facade-proof`
- start SHA: `a89dbbb1977d671fb5c39b5bfed3141ff1f63008`
- final SHA: commit 후 최종 SHA로 확정

## 읽은 파일

- `docs/gpt-communication/reports/2026-07-05-local-client-boundary-proof-016.md`
- `release/test-documents/local-client-boundary-proof-016/tests/local-client-boundary-summary.json`
- `release/test-documents/local-client-boundary-proof-016/tests/request-builder-summary.json`
- `release/test-documents/local-client-boundary-proof-016/tests/response-interpreter-summary.json`
- `tools/hancom/hwpcoreadapter/LocalClientBoundaryProof.mjs`
- `tools/hancom/hwpcoreadapter/LocalClientBoundaryProof.test.mjs`
- `docs/gpt-communication/reports/2026-07-05-local-route-manifest-proof-015.md`
- `release/test-documents/local-route-manifest-proof-015/manifest/local-route-manifest.json`
- `docs/gpt-communication/reports/2026-07-05-inprocess-route-facade-proof-014.md`
- `tools/hancom/hwpcoreadapter/InProcessRouteFacadeProof.mjs`
- `tools/hancom/hwpcoreadapter/ServiceContractSchema.mjs`

## 변경 파일

- `tools/hancom/hwpcoreadapter/TransportAgnosticInvocationFacadeProof.mjs`
- `tools/hancom/hwpcoreadapter/TransportAgnosticInvocationFacadeProof.test.mjs`
- `docs/gpt-communication/reports/2026-07-05-transport-agnostic-invocation-facade-proof-017.md`
- `release/test-documents/transport-agnostic-invocation-facade-proof-017/**`

## 구현 접근

`TransportAgnosticInvocationFacadeProof.mjs`는 invocation envelope를 입력으로 받는다. envelope validation을 먼저 수행하고, `route_id`와 `input`을 Task 016 request builder에 전달해 route request를 만든다. 생성된 route request는 Task 014 in-process route facade로 실행하고, 반환된 route response는 Task 016 response interpreter로 client result화한다. 마지막으로 client result를 invocation result contract로 감싸 반환한다.

transport profile은 proof metadata로만 취급한다. `mock_http_like`, `cli_like`, `ui_like`가 있어도 실제 HTTP listener, CLI runtime, UI runtime은 시작하지 않는다.

## Invocation Facade Functions

- `createTransportAgnosticInvocationFacade(options)`
- `invoke(invocationEnvelope)`
- `buildInvocationEnvelope(route_id, input, options)`
- `validateInvocationEnvelope(envelope)`
- `normalizeInvocationInput(envelope)`
- `dispatchLocalInvocation(envelope)`
- `interpretInvocationResult(routeResponse, envelope)`
- `getInvocationTransportProfile(envelope)`
- `createInvocationResult(clientResult, envelope)`

## Invocation Envelope Contract

invocation envelope는 다음 필드를 가진다.

- `invocation_id`
- `invocation_source`
- `transport_profile`
- `route_id`
- `input`
- `request_context`
- `idempotency_key`
- `created_at`
- `real_http_server_started=false`
- `final_core_selection_declared=false`
- `stage_2_transition_declared=false`

## Invocation Result Contract

invocation result는 다음 필드를 가진다.

- `invocation_id`
- `invocation_source`
- `transport_profile`
- `route_id`
- `ok`
- `status`
- `http_like_status`
- `client_result`
- `user_visible_state`
- `user_message_key`
- `retryable`
- `should_poll`
- `terminal`
- `can_open_output`
- `can_download_output`
- `artifact_availability`
- `error_code`
- `error_category`
- `route_request_path`
- `route_response_path`
- `client_result_path`
- `invocation_envelope_path`
- `interpreted_at`
- `real_http_server_started=false`
- `final_core_selection_declared=false`
- `stage_2_transition_declared=false`

## Transport Profiles

지원 profile은 다음 네 가지다.

- `local_function`
- `mock_http_like`
- `cli_like`
- `ui_like`

모두 metadata only profile이며, 실제 transport runtime을 시작하지 않는다.

## Proof Cases

Task 017 summary 기준 proof case는 28개이며 모두 통과했다.

- Task 016 local client boundary 로드
- Task 015 route manifest version 확인
- submit/run/get_status/get_result/list_events invocation 성공
- `mock_http_like`, `cli_like`, `ui_like` metadata only profile 수용
- unknown transport profile controlled validation error
- unknown route_id controlled validation error
- missing job_id controlled validation error
- completed/pending/not_ready/not_found/validation_error/failed 해석
- completed output에만 artifact open 허용
- 모든 invocation result의 final core selection 및 Stage 2 transition flag false 유지
- Task 012/013/014/015/016 summary read-only 유지
- 실제 HTTP server 미시작
- Task 016/015/014/013 regression 유지

## 생성 산출물

산출물 root:

- `release/test-documents/transport-agnostic-invocation-facade-proof-017/`

주요 그룹:

- `invocation-envelopes/*.json`
- `invocation-results/*.json`
- `route-requests/*.json`
- `route-responses/*.json`
- `client-results/*.json`
- `transport-profiles/*.json`
- `validation/*.json`
- `tests/invocation-facade-summary.json`
- `tests/invocation-envelope-validation-summary.json`
- `tests/invocation-result-validation-summary.json`
- `tests/previous-task-read-only-result.json`

## 테스트 명령

```powershell
$env:ARMY_CLAW_NODE_MODULES='C:\Users\USER\Desktop\로컬 open claw 만들기\.tmp\openclaw-prod-install\node_modules'
$env:NODE_PATH=$env:ARMY_CLAW_NODE_MODULES
node --test tools\hancom\hwpcoreadapter\TransportAgnosticInvocationFacadeProof.test.mjs
node --test tools\hancom\hwpcoreadapter\LocalClientBoundaryProof.test.mjs
node --test tools\hancom\hwpcoreadapter\LocalRouteManifestProof.test.mjs
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

- Task 017 TransportAgnosticInvocationFacadeProof: `4/4 pass`
- Task 016 LocalClientBoundaryProof: `4/4 pass`
- Task 015 LocalRouteManifestProof: `7/7 pass`
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
- Task 003 smoke: `12/12 pass`
- final command marker: `ALL_TASK017_TESTS_PASS`

## Read-only Checks

Task 012/013/014/015/016 summary 파일은 Task 017 artifact 생성 전후 동일성을 비교했다. `previous_tasks_read_only=true`로 기록됐다.

## 금지 사항 준수

- 실제 HTTP server 실행 없음
- Express/Fastify/Koa/Hono dependency 추가 없음
- npm/pip/online install 없음
- dependency vendoring 없음
- React/UI 구현 없음
- production backend route 구현 없음
- production API framework 선택 없음
- OpenAPI/swagger server 생성 없음
- production queue worker 구현 없음
- OS daemon/background scheduler 구현 없음
- LLM planner 연결 없음
- Model Gateway 작업 없음
- Offline Skill Runtime 작업 없음
- 실제 Hancom COM 실행 없음
- Hwp.exe process 조작 없음
- python-hwpx 신규 의존성 없음
- 최종 HWPX core selection 선언 없음
- Stage 2 transition 선언 없음

## Risks

- 이번 facade는 production transport가 아니라 transport-agnostic proof boundary다.
- 실제 HTTP/CLI/UI adapter는 아직 구현하지 않았다.
- Task 014 in-process route facade를 proof 실행에 사용하므로, 실제 production service isolation 정책은 후속 Task에서 별도로 확정해야 한다.

## Non-decisions

- production API framework 선택 없음
- 실제 HTTP route path 확정 없음
- React UI 구현 없음
- CLI runtime 구현 없음
- Model Gateway 연결 없음
- Offline Skill Runtime 연결 없음
- 최종 HWPX core 선택 없음
- Stage 2 전환 없음

## Completion Candidate

Task 017은 구현 및 로컬 검증 기준으로 completion candidate 조건을 만족한다. 최종 completion 여부는 push된 산출물에 대한 master review에서 판단한다.

## 다음 Task 018 권고

Task 018은 이번 invocation facade 위에 실제 transport adapter를 얹기 전, HTTP/CLI/UI adapter별 thin adapter contract와 adapter별 error mapping을 분리 검증하는 단계가 적절하다.

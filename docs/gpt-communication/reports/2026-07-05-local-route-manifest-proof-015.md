# Task 015 Local Route Manifest Proof 보고서

## 요약

Task 015는 실제 HTTP 서버나 production API framework를 선택하지 않고, UI/backend가 공유할 수 있는 local route manifest와 mock route fixture를 고정한 작업이다. Task 013 service contract와 Task 014 in-process route facade contract를 기준으로 route operation, method, path pattern, required body/params, status mapping, error handling을 machine-readable JSON 산출물로 남겼다.

## Branch

- branch: `agent/task015-local-route-manifest-proof`
- start SHA: `c6ea036a69e94b1738cd29f85a59e6423213fd2d`
- final SHA: commit 전 기준으로는 작업 중 HEAD와 동일, commit 후 갱신됨

## 읽은 파일

- `docs/gpt-communication/reports/2026-07-05-inprocess-route-facade-proof-014.md`
- `release/test-documents/inprocess-route-facade-proof-014/tests/route-facade-summary.json`
- `tools/hancom/hwpcoreadapter/InProcessRouteFacadeProof.mjs`
- `tools/hancom/hwpcoreadapter/InProcessRouteFacadeProof.test.mjs`
- `docs/architecture/service-contract-schema-error-taxonomy-013.md`
- `docs/gpt-communication/reports/2026-07-05-service-contract-schema-error-taxonomy-013.md`
- `release/test-documents/service-contract-schema-error-taxonomy-013/tests/service-contract-summary.json`
- `tools/hancom/hwpcoreadapter/ServiceContractSchema.mjs`
- `tools/hancom/hwpcoreadapter/ServiceContractSchema.test.mjs`

## 변경 파일

- `tools/hancom/hwpcoreadapter/LocalRouteManifestProof.mjs`
- `tools/hancom/hwpcoreadapter/LocalRouteManifestProof.test.mjs`
- `docs/gpt-communication/reports/2026-07-05-local-route-manifest-proof-015.md`
- `release/test-documents/local-route-manifest-proof-015/**`

## 구현 접근

`LocalRouteManifestProof.mjs`를 추가해 다음 기능을 제공했다.

- `getLocalRouteManifest()`
- `validateLocalRouteManifest(manifest)`
- `validateLocalRouteFixture(...)`
- `validateRouteFixtureSet(...)`
- `generateLocalRouteManifestProofArtifacts(...)`

manifest와 fixture는 Task 015 전용 root에만 생성한다. Task 012/013/014 summary는 실행 전후 동일성을 비교해 read-only reference로 유지했다.

## Route Manifest Version

- `local-route-manifest-proof-015.v1`

## Route Entries

| route_id | method | mock path | service_operation |
| --- | --- | --- | --- |
| `submit_document_job` | `POST` | `/mock/jobs` | `submit` |
| `run_job` | `POST` | `/mock/jobs/:job_id/run` | `runJob` |
| `get_job` | `GET` | `/mock/jobs/:job_id` | `getJob` |
| `get_status` | `GET` | `/mock/jobs/:job_id/status` | `getStatus` |
| `get_result` | `GET` | `/mock/jobs/:job_id/result` | `getResult` |
| `list_events` | `GET` | `/mock/jobs/:job_id/events` | `listEvents` |

## Fixture Groups

- `route-requests/*.json`
- `route-responses/*.json`
- `manifest/local-route-manifest.json`
- `manifest/route-status-mapping.json`
- `manifest/route-error-handling.json`
- `manifest/ui-backend-consumption-notes.json`
- `validation/*.json`
- `tests/local-route-manifest-summary.json`
- `tests/route-fixture-validation-summary.json`
- `tests/previous-task-read-only-result.json`

## Status Mapping

| status/error | http_like_status |
| --- | --- |
| `accepted`, `pending`, `running` | `202` |
| `completed` | `200` |
| `rejected`, `policy_error` | `400` |
| `validation_error`, `invalid_request`, `unsupported_intent` | `422` |
| `not_found` | `404` |
| `not_ready` | `409` |
| `failed`, `execution_error`, `artifact_missing`, `contract_violation` | `500` |

## Error Handling

Task 013 error taxonomy의 9개 code를 모두 manifest artifact에 반영했다.

- `invalid_request`
- `unsupported_intent`
- `not_found`
- `not_ready`
- `policy_error`
- `validation_error`
- `execution_error`
- `artifact_missing`
- `contract_violation`

## Proof Cases

Task 015 summary 기준 proof case는 20개이며 모두 통과해야 completion candidate로 본다.

- manifest route entry 수 6개
- 각 route core field 존재
- service operation enum 일치
- expected status enum 일치
- expected error taxonomy 일치
- submit/run/getJob/getStatus/getResult/listEvents fixture manifest 일치
- response fixture Task 014 route contract 검증
- `not_ready` 409
- `not_found` 404
- `validation_error` 422
- Task 014/013 regression은 별도 테스트 명령으로 확인
- 이전 Task 012/013/014 summary read-only
- 실제 HTTP server 미시작
- final core selection 및 Stage 2 transition false

## 생성 산출물

산출물 root:

- `release/test-documents/local-route-manifest-proof-015/`

## 테스트 명령

```powershell
$env:ARMY_CLAW_NODE_MODULES='C:\Users\USER\Desktop\로컬 open claw 만들기\.tmp\openclaw-prod-install\node_modules'
$env:NODE_PATH='C:\Users\USER\Desktop\로컬 open claw 만들기\.tmp\openclaw-prod-install\node_modules'
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
- 기존 Hancom/Task 003 smoke: `12/12 pass`
- final command marker: `ALL_TASK015_FINAL_TESTS_PASS`

## Read-only Checks

Task 012/013/014 summary 파일은 Task 015 proof artifact 생성 전후 동일성을 확인한다. 전체 회귀 테스트가 이전 proof artifact를 재생성하는 경우 Task 015 범위 밖 변경이므로 복구한다.

## 금지 사항 준수

- 실제 HTTP server 실행 없음
- Express/Fastify/Koa/Hono dependency 추가 없음
- npm/pip/online install 없음
- dependency vendoring 없음
- React/UI 구현 없음
- production backend route 구현 없음
- OpenAPI/swagger server 생성 없음
- production queue worker 없음
- OS daemon/background scheduler 없음
- LLM planner 연결 없음
- Model Gateway 작업 없음
- Offline Skill Runtime 작업 없음
- 실제 Hancom COM 실행 없음
- Hwp.exe process 조작 없음
- python-hwpx 신규 의존성 없음
- 최종 HWPX core selection 선언 없음
- Stage 2 transition 선언 없음

## Risks

- 이번 manifest는 local proof artifact이며 production HTTP API 명세가 아니다.
- mock path는 UI/backend 공유 fixture를 위한 path pattern이며 endpoint 확정이 아니다.
- 실제 동시성, 인증, 권한, retry/backoff 정책은 다루지 않았다.

## Non-decisions

- production API framework 선택 없음
- production route path 확정 없음
- OpenAPI 채택 여부 결정 없음
- UI 구현 없음
- 최종 HWPX core 선택 없음
- Stage 2 전환 없음

## Completion Candidate

Task 015는 completion candidate 조건을 목표로 구현되었다. 최종 completion 여부는 전체 검증 결과와 master review에서 판단한다.

## 다음 Task 016 권고

Task 016은 local route manifest를 바탕으로 UI/backend가 공유할 request builder와 response interpreter proof를 추가하는 단계가 적절하다. 아직 실제 HTTP 서버를 열기보다, route manifest를 소비하는 얇은 local client boundary부터 고정하는 편이 안전하다.

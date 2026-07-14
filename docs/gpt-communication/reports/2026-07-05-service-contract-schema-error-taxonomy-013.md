# Task 013 서비스 계약 스키마 및 오류 분류 보고서

## 요약

Task 013은 Task 012 내부 서비스 어댑터 위에 UI/backend route가 붙기 전에 사용할 service contract, enum, artifact path contract, error taxonomy를 고정한 proof 작업이다. 실제 HTTP 서버, UI, Hancom COM, python-hwpx, production worker는 구현하지 않았다.

## Branch

- branch: `agent/task013-service-contract-schema-error-taxonomy`
- start SHA: `4f0be307027e94b0fbf1c5ab1dc8618bb81e882a`
- final SHA: commit 전 기준으로는 작업 중 HEAD와 동일, commit 후 갱신됨

## 읽은 파일

- `docs/gpt-communication/reports/2026-07-05-service-adapter-boundary-proof-012.md`
- `release/test-documents/service-adapter-boundary-proof-012/tests/service-adapter-summary.json`
- `tools/hancom/hwpcoreadapter/InternalServiceAdapterProof.mjs`
- `tools/hancom/hwpcoreadapter/InternalServiceAdapterProof.test.mjs`
- `tools/hancom/hwpcoreadapter/LocalJobBoundaryProof.mjs`
- `tools/hancom/hwpcoreadapter/AgentApiBoundaryProof.mjs`
- `docs/architecture/hwpx-core-adapter-boundary-004.md`

## 변경 파일

- `tools/hancom/hwpcoreadapter/ServiceContractSchema.mjs`
- `tools/hancom/hwpcoreadapter/ServiceContractSchema.test.mjs`
- `docs/architecture/service-contract-schema-error-taxonomy-013.md`
- `docs/gpt-communication/reports/2026-07-05-service-contract-schema-error-taxonomy-013.md`
- `release/test-documents/service-contract-schema-error-taxonomy-013/**`

## 구현 방식

신규 `ServiceContractSchema.mjs`에 dependency 없는 lightweight validator를 추가했다. 기존 `InternalServiceAdapterProof.mjs`는 가능한 변경하지 않고, Task 012 output과 Task 013 contract 사이의 status/error 정규화는 별도 contract layer에서 다루도록 분리했다.

## Contract Version

- `service-contract-schema-error-taxonomy-013.v1`

## 정의한 Schema 및 Enum

- service operation enum: `submit`, `runJob`, `getJob`, `getStatus`, `getResult`, `listEvents`
- document intent enum: `create_document`, `edit_paragraph`, `edit_table`, `apply_style`
- job status enum: `pending`, `running`, `completed`, `failed`, `rejected`
- response status enum: `accepted`, `pending`, `running`, `completed`, `failed`, `rejected`, `not_found`, `not_ready`, `validation_error`, `policy_error`
- artifact path role: `service_request_path`, `service_response_path`, `job_path`, `event_path`, `snapshot_path`, `request_path`, `response_path`, `plan_path`, `report_path`, `output_path`, `evidence_path`

## Error Taxonomy

정의한 error code는 다음 9개다.

- `invalid_request`
- `unsupported_intent`
- `not_found`
- `not_ready`
- `policy_error`
- `validation_error`
- `execution_error`
- `artifact_missing`
- `contract_violation`

각 code는 category, retryable, user_visible, description, expected_status를 가진다.

## 생성 산출물

산출물 root:

- `release/test-documents/service-contract-schema-error-taxonomy-013/`

주요 하위 경로:

- `contract/*.json`
- `fixtures/valid/*.json`
- `fixtures/invalid/*.json`
- `validation/*.json`
- `tests/service-contract-summary.json`
- `tests/artifact-path-contract-result.json`
- `tests/task012-read-only-result.json`

## Proof Cases

- valid submit request contract pass
- valid completed response contract pass
- valid rejected response contract pass
- valid failed response contract pass
- valid not_found response contract pass
- valid not_ready response contract pass
- valid job record contract pass
- valid event record contract pass
- invalid request missing service_request_id fail
- invalid response unknown status fail
- invalid job unknown status fail
- invalid error unknown code fail
- artifact path contract pass for Task 013 artifacts
- previous Task 012 service summary remains read-only

결과:

- proof_case_count: `14`
- proof_cases_passed: `14`
- previous_task_012_read_only: `true`

## 테스트 명령

```powershell
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

- Task 013 ServiceContractSchema: `15/15 pass`
- Task 012 InternalServiceAdapterProof: `14/14 pass`
- Task 011 LocalJobBoundaryProof: `15/15 pass`
- Task 010 AgentApiBoundaryProof: `11/11 pass`
- Task 009 AgentOperationPlanE2E: `13/13 pass`
- Task 008 interim adapter: `11/11 pass`
- Task 005 contract: `15/15 pass`
- Task 006 backend proof: `15/15 pass`
- Task 007 comparison: `8/8 pass`
- 기존 Hancom/Task 003 smoke: `12/12 pass`

## Read-only 확인

회귀 테스트 실행 후 Task 006-012 산출물이 재생성되어 변경으로 잡혔으나, Task 013 변경 범위가 아니므로 restore했다. 최종 변경 범위는 Task 013 코드, 문서, 산출물로 제한했다.

## 금지 사항 준수

- 실제 HTTP 서버 구현 없음
- Express/Fastify 의존성 추가 없음
- UI 구현 없음
- production queue worker 구현 없음
- OS daemon/background scheduler 구현 없음
- LLM planner, Model Gateway, Offline Skill Runtime 연결 없음
- 실제 Hancom COM 실행 없음
- python-hwpx 신규 의존성 없음
- pip/npm/online install 없음
- dependency vendoring 없음
- 최종 HWPX core selection 선언 없음
- Stage 2 transition 선언 없음

## Risks

- 이번 validator는 lightweight contract validator이며 JSON Schema validator가 아니다.
- Task 012의 일부 내부 `status: "error"` 응답은 Task 013에서 route/UI용 contract status로 정규화해야 한다.
- 실제 HTTP endpoint 경로와 retry/backoff 정책은 아직 결정하지 않았다.

## Non-decisions

- API framework 선택 없음
- HTTP route path 결정 없음
- UI polling UX 결정 없음
- production retry 정책 결정 없음
- 최종 HWPX core 선택 없음
- Stage 2 전환 없음

## Completion Candidate

Task 013은 completion candidate 조건을 만족한다.

## 다음 Task 014 권고

Task 014는 이번 contract를 기반으로 in-process route facade 또는 mock backend route proof를 추가하는 단계가 적절하다. 목표는 React UI와 backend route가 동일한 service contract를 공유하고, `status`/`error.code`/artifact path를 일관되게 소비할 수 있음을 검증하는 것이다.

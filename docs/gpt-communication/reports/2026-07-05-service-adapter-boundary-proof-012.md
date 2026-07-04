# Task 012 - Internal Service Adapter Boundary Proof

## 요약

Task 012는 Task 011의 filesystem-backed local job boundary 위에 내부 service adapter function boundary를 추가한 proof다.

이번 작업은 실제 HTTP 서버, production queue worker, OS daemon, background scheduler, UI, LLM planner, Model Gateway, Offline Skill Runtime 구현이 아니다. UI/backend가 나중에 호출하기 쉬운 내부 service API shape를 정리하고, request persistence, job lookup, status polling, result retrieval, event listing을 함수 경계로 검증했다.

## 시작 조건

- repository: `leejinuk-minoan/army-claw`
- branch: `agent/task012-service-adapter-boundary-proof`
- start SHA: `19407b827e71a29509dc938a1002fd31356afb78`
- task id: `service-adapter-boundary-proof-012`
- worktree: `C:\Users\USER\Desktop\로컬 open claw 만들기\.tmp\t12`

## 읽은 파일

- `docs/gpt-communication/reports/2026-07-05-local-job-boundary-proof-011.md`
- `release/test-documents/local-job-boundary-proof-011/tests/local-job-boundary-summary.json`
- `tools/hancom/hwpcoreadapter/LocalJobBoundaryProof.mjs`
- `tools/hancom/hwpcoreadapter/LocalJobBoundaryProof.test.mjs`
- `tools/hancom/hwpcoreadapter/AgentApiBoundaryProof.mjs`
- `docs/architecture/hwpx-core-adapter-boundary-004.md`

## 구현 접근

새 파일 `InternalServiceAdapterProof.mjs`를 추가했다.

구조는 다음과 같다.

1. `createInternalServiceAdapter`가 service object를 만든다.
2. `service.submit(request)`가 Task 012 전용 service request를 저장한다.
3. Task 012 내부 execution workspace에서 Task 011 `submitLocalJob`을 호출한다.
4. `service.runJob(job_id)`가 Task 011 `runLocalJob`을 호출한다.
5. Task 011 실행 결과를 Task 012 전용 `jobs/`, `requests/`, `responses/`, `plans/`, `reports/`, `outputs/`, `evidence/`로 복사한다.
6. `service.getStatus(job_id)`가 polling snapshot response를 반환한다.
7. `service.getJob(job_id)`가 normalized job record를 반환한다.
8. `service.getResult(job_id)`가 terminal job result를 반환하고, pending job은 `not_ready`로 거절한다.
9. `service.listEvents(job_id)`가 job event history를 반환한다.
10. unknown job은 `not_found` service error로 반환한다.

Task 011 artifact는 read-only reference로만 사용했다. 실제 Task 011 module은 import하되, 쓰기 작업은 Task 012 root 아래의 내부 execution workspace에서 수행해 기존 Task 011 산출물을 수정하지 않았다.

## Service API Shape

구현한 함수:

- `createInternalServiceAdapter(options)`
- `service.submit(request)`
- `service.runJob(job_id)`
- `service.getJob(job_id)`
- `service.getStatus(job_id)`
- `service.getResult(job_id)`
- `service.listEvents(job_id)`

## Service Response Model

공통 response field:

- `service_request_id`
- `service_operation`
- `ok`
- `status`
- `job_id`
- `job_status`
- `data`
- `error`
- `artifacts`
- `real_com_executed=false`
- `final_core_selection_declared=false`
- `stage_2_transition_declared=false`

## Proof Cases

| case | result |
| --- | --- |
| submit create_document | pending job response 생성 |
| getStatus before run | pending snapshot response 생성 |
| run create_document | completed job 생성 |
| getStatus after run | completed terminal snapshot response 생성 |
| getJob completed | normalized job record response 생성 |
| getResult completed | response/report/output/evidence path 반환 |
| listEvents completed | submitted/running/completed events 반환 |
| invalid request | rejected result, `policy_error` 기록 |
| validation failure | failed result, `validation_error` 기록 |
| unknown job | `ok=false`, `not_found` |
| getResult before terminal | `ok=false`, `not_ready` |

## 생성 산출물

- `release/test-documents/service-adapter-boundary-proof-012/service-requests/*.json`
- `release/test-documents/service-adapter-boundary-proof-012/service-responses/*.json`
- `release/test-documents/service-adapter-boundary-proof-012/jobs/<job_id>/*.json`
- `release/test-documents/service-adapter-boundary-proof-012/requests/*.json`
- `release/test-documents/service-adapter-boundary-proof-012/responses/*.json`
- `release/test-documents/service-adapter-boundary-proof-012/plans/*.json`
- `release/test-documents/service-adapter-boundary-proof-012/reports/*.json`
- `release/test-documents/service-adapter-boundary-proof-012/outputs/*.hwpx`
- `release/test-documents/service-adapter-boundary-proof-012/evidence/*.json`
- `release/test-documents/service-adapter-boundary-proof-012/tests/service-adapter-summary.json`

## 검증 명령

다음 명령을 실행한다.

```powershell
$env:ARMY_CLAW_NODE_MODULES='C:\Users\USER\Desktop\로컬 open claw 만들기\.tmp\openclaw-prod-install\node_modules'
$env:NODE_PATH='C:\Users\USER\Desktop\로컬 open claw 만들기\.tmp\openclaw-prod-install\node_modules'
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

## 검증 결과

- Task 012 InternalServiceAdapterProof: 14/14 pass
- Task 011 LocalJobBoundaryProof: 15/15 pass
- Task 010 AgentApiBoundaryProof: 11/11 pass
- Task 009 AgentOperationPlanE2E: 13/13 pass
- Task 008 interim adapter: 11/11 pass
- Task 005 contract: 15/15 pass
- Task 006 backend proof: 15/15 pass
- Task 007 comparison: 8/8 pass
- 기존 Hancom/Task 003 smoke: 12/12 pass
- failed command count: 0

## Read-only 확인

Task 003/004/005/006/007/008/009/010/011 완료 산출물은 read-only reference로만 사용한다.

Task 012 service adapter가 Task 011 functions를 호출할 때 기존 Task 011 artifact root를 직접 쓰지 않도록, Task 012 root 아래의 내부 execution workspace를 사용한다.

## 금지 사항 준수

- 실제 HTTP 서버 구현 없음
- Express/Fastify 의존성 없음
- production queue worker 구현 없음
- OS service/daemon/background scheduler 구현 없음
- UI 구현 없음
- LLM planner 연결 없음
- Model Gateway 작업 없음
- Offline Skill Runtime 작업 없음
- 실제 Hancom COM 실행 없음
- Hwp process 조작 없음
- python-hwpx 신규 의존성 없음
- pip/npm/online install 없음
- dependency vendoring 없음
- 최종 HWPX core selection 선언 없음
- Stage 2 transition 선언 없음
- Task 013 착수 없음

## Risk

- service adapter는 in-process proof이며 HTTP endpoint가 아니다.
- execution workspace mapping은 proof용 in-memory state다.
- 재시도, lock, crash recovery, concurrent job 처리는 아직 없다.
- storage abstraction은 아직 filesystem artifact에 한정된다.

## Non-decisions

- production API framework는 선택하지 않았다.
- HTTP endpoint path는 정하지 않았다.
- UI polling UX는 정하지 않았다.
- retry 정책은 정하지 않았다.
- 최종 HWPX core는 선정하지 않았다.
- Stage 2 전환을 선언하지 않았다.

## Completion Candidate

Task 012는 completion candidate 조건을 만족하도록 구현한다. master review가 원격 산출물과 evidence를 검증한 뒤 최종 완료로 판단할 수 있다.

## 다음 Task 013 권고

Task 013은 이 internal service adapter 위에 최소 command/service contract 문서를 세우고, UI 또는 backend route가 붙기 전에 request/response schema와 error taxonomy를 고정하는 단계가 적절하다.

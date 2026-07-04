# Task 011 - Local Job Boundary Proof

## 요약

Task 011은 Task 010의 API-like function boundary 앞단에 파일 기반 local job boundary를 붙인 proof다.

이번 작업은 실제 HTTP 서버, production queue worker, OS daemon, background scheduler, UI, LLM planner, Model Gateway, Offline Skill Runtime 구현이 아니다. controlled request를 local job으로 저장하고, job 상태를 `pending -> running -> completed/failed/rejected`로 전이시키며, polling 가능한 snapshot과 event history를 남기는 최소 증명을 구현했다.

## 시작 조건

- repository: `leejinuk-minoan/army-claw`
- branch: `agent/task011-local-job-boundary-proof`
- start SHA: `c73de02711146047ca4e88f28e0877bc8be36476`
- task id: `local-job-boundary-proof-011`
- worktree: `C:\Users\USER\Desktop\로컬 open claw 만들기\.tmp\t11`

## 읽은 파일

- `docs/gpt-communication/reports/2026-07-04-agent-api-boundary-proof-010.md`
- `release/test-documents/agent-api-boundary-proof-010/tests/api-boundary-summary.json`
- `tools/hancom/hwpcoreadapter/AgentApiBoundaryProof.mjs`
- `tools/hancom/hwpcoreadapter/AgentApiBoundaryProof.test.mjs`
- `tools/hancom/hwpcoreadapter/AgentOperationPlanE2E.mjs`
- `tools/hancom/hwpcoreadapter/NodeXmlThinInterimEditorAdapter.mjs`
- `docs/architecture/hwpx-core-adapter-boundary-004.md`

## 구현 접근

새 파일 `LocalJobBoundaryProof.mjs`를 추가했다.

구조는 다음과 같다.

1. `submitLocalJob`이 request를 Task 011 전용 `requests/`에 저장한다.
2. job record를 `jobs/<job_id>/job.json`에 `pending` 상태로 기록한다.
3. 제출 event와 pending snapshot을 저장한다.
4. `runLocalJob`이 job을 `running`으로 전이하고 running snapshot을 남긴다.
5. job별 내부 실행 workspace를 Task 011 root 아래에 임시 생성한다.
6. 그 내부 workspace에서 Task 010 `handleAgentApiRequest`를 호출한다.
7. Task 010 handler 결과를 Task 011 전용 `responses/`, `plans/`, `reports/`, `outputs/`, `evidence/`로 복사한다.
8. job을 `completed`, `failed`, `rejected` 중 하나로 전이한다.
9. terminal snapshot과 final snapshot을 저장한다.
10. 내부 실행 workspace는 커밋 산출물이 아니므로 실행 후 삭제한다.

Task 010 산출물은 read-only reference로만 사용했다. Task 010 handler를 직접 import해 호출하되, 실제 쓰기는 job별 내부 workspace에서 발생하게 하여 기존 Task 010 artifact를 수정하지 않았다.

## Local Job Model

job record는 다음 필드를 가진다.

- `job_id`
- `api_request_id`
- `request_id`
- `task_id`
- `status`: `pending`, `running`, `completed`, `failed`, `rejected`
- `created_at`
- `updated_at`
- `started_at`
- `ended_at`
- `request_path`
- `response_path`
- `plan_path`
- `report_path`
- `output_path`
- `evidence_paths`
- `failure`
- `attempts`
- `real_com_executed=false`
- `final_core_selection_declared=false`
- `stage_2_transition_declared=false`

event record는 다음 필드를 가진다.

- `event_id`
- `job_id`
- `from_status`
- `to_status`
- `timestamp`
- `reason`
- `artifact_path`

## State Transition Model

| case | transition |
| --- | --- |
| accepted success | `pending -> running -> completed` |
| invalid request | `pending -> running -> rejected` |
| validation failure | `pending -> running -> failed` |

자동 retry는 이번 Task에서 구현하지 않았다. retry는 다음 단계의 별도 boundary로 남겼다.

## Proof Cases

| case | result |
| --- | --- |
| create_document job | completed, output/response/report/evidence path 존재 |
| edit_paragraph job | completed |
| edit_table job | completed |
| apply_style job | completed |
| invalid request job | rejected, output 없음, `policy_error` 기록 |
| validation failure job | failed, final output 없음, `validation_error` 기록 |
| status polling | pending/running/terminal/final snapshot 생성 |

## 생성 산출물

- `release/test-documents/local-job-boundary-proof-011/requests/*.json`
- `release/test-documents/local-job-boundary-proof-011/jobs/<job_id>/job.json`
- `release/test-documents/local-job-boundary-proof-011/jobs/<job_id>/events.json`
- `release/test-documents/local-job-boundary-proof-011/jobs/<job_id>/snapshots/*.json`
- `release/test-documents/local-job-boundary-proof-011/responses/*.json`
- `release/test-documents/local-job-boundary-proof-011/plans/*.json`
- `release/test-documents/local-job-boundary-proof-011/reports/*.json`
- `release/test-documents/local-job-boundary-proof-011/outputs/*.hwpx`
- `release/test-documents/local-job-boundary-proof-011/evidence/*.json`
- `release/test-documents/local-job-boundary-proof-011/tests/local-job-boundary-summary.json`

## 검증 명령

다음 명령을 실행했다.

```powershell
$env:ARMY_CLAW_NODE_MODULES='C:\Users\USER\Desktop\로컬 open claw 만들기\.tmp\openclaw-prod-install\node_modules'
$env:NODE_PATH='C:\Users\USER\Desktop\로컬 open claw 만들기\.tmp\openclaw-prod-install\node_modules'
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

Task 003/004/005/006/007/008/009/010 완료 산출물은 read-only reference로만 사용했다.

Task 011 테스트가 Task 010 handler를 호출할 때 기존 Task 010 artifact root를 직접 쓰지 않도록, job별 내부 workspace를 Task 011 root 아래에 생성하고 실행 후 삭제했다.

## 금지 사항 준수

- 실제 HTTP 서버 구현 없음
- Express/Fastify 의존성 없음
- production queue worker 구현 없음
- OS service/daemon 구현 없음
- background scheduler 구현 없음
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
- Task 012 착수 없음

## Risk

- job manager는 in-process proof이며 장기 실행 queue worker가 아니다.
- 동시성, lock, crash recovery는 아직 없다.
- retry는 구현하지 않았고 boundary만 문서화했다.
- job_id는 proof용 deterministic slug 방식이다.
- artifact path는 filesystem 기반이며 production storage abstraction은 아직 없다.

## Non-decisions

- production queue framework는 선택하지 않았다.
- HTTP endpoint 구조를 정하지 않았다.
- UI polling 방식은 정하지 않았다.
- retry 정책은 정하지 않았다.
- 최종 HWPX core는 선정하지 않았다.
- Stage 2 전환을 선언하지 않았다.

## Completion Candidate

Task 011은 completion candidate 조건을 만족하도록 구현했다. master review가 원격 산출물과 evidence를 검증한 뒤 최종 완료로 판단할 수 있다.

## 다음 Task 012 권고

Task 012는 local job boundary 위에 최소 service adapter를 얹어 request persistence, job lookup, polling response shape를 UI/backend가 호출하기 쉬운 내부 service API로 정리하는 단계가 적절하다. 실제 HTTP 서버는 그 다음 단계에서 여는 것이 안전하다.

# 현재 Army Claw 필수 확인 문서

작성일: 2026-07-14

## 전체 개발 단계

```text
전체 8단계 중 1단계
현재 단계: HwpAdapter 및 HWP/HWPX 엔진 안정화
현재 세부 단계: 1-3 선행 HWPX 엔진 비교·코어 선정
현재 active task: Task 035 Local Workspace Staged Output Controlled Promotion Boundary
다음 Task: Task 035-B Formal Local Verification
```

## Canonical 기준선

```text
canonical branch: main
Task 033 integration PR: #1
Task 033 source head: 3a626b6f610823c159aa8bcedf68342df1e1027c
Task 033 integration merge SHA: a136cb2629a7fac660255da1318119ada4e56a1d
post-merge file difference: 0
open pull requests after integration: 0
```

Task 001–033의 검증된 개발 이력은 PR #1을 통해 `main`에 병합되었다.

## 최신 완료 Task

```text
Task 034: Main Integration and Governance Baseline Sync
status: final_verified
completion gate: passed
master review: complete
adapter validator gate: not_required
```

Task 034는 기능 코드나 adapter 동작을 변경하지 않은 governance-only 작업이다.

## Task 033 검증 기준

```text
Task 033 status: final_verified
approved local verification commit: 8dd9bdfd74ab820696805afaec8e4f3de1962ba9
validator CLI: exit 0 / valid / 200 checks passed
adapter validator unittest: exit 0 / Ran 16 tests OK
local workspace adapter unittest: exit 0 / Ran 59 tests OK
Task 033-specific validation: passed
canonical determinism: passed
content digest verification: passed
negative cases: passed
actual adapter invocation: false
sandbox write: false
production/user workspace mutation: false
file content read: false
Hancom COM: false
real office artifact generation: false
```

## Main merge 정책

```text
worker main direct push: prohibited
force push: prohibited
history rewrite: prohibited
master-reviewed PR merge: allowed
```

마스터 에이전트는 다음 조건을 모두 만족한 PR을 `main`에 병합할 수 있다.

1. 후보 브랜치와 기준 SHA가 확인됨
2. 필수 completion gate와 validation evidence가 존재함
3. unresolved conflict가 없음
4. 금지 경로 변경이 없음
5. 실행하지 않은 검증을 통과로 주장하지 않음
6. Stage 전환이나 final HWPX core 선정이 포함되지 않음

## 다음 작업

```text
Task: Task 035 Local Workspace Staged Output Controlled Promotion Boundary
Task ID: task035-local-workspace-staged-output-controlled-promotion-boundary
routing_class: cloud_first_local_verify
first phase: Task 035-A cloud package
adapter_validator_gate_required: true
status: implementation_corrected_pending_formal_local_verification
subphase: task035a2lc_corrective_complete
adapter_validator_gate_status: required_not_run
completion_gate_passed: false
```

Task 035는 staged sandbox artifact를 승인된 대상 경계로 승격하는 controlled promotion 계약과 검증 경계를 정의한다. Task 035-A2L-C에서는 Task 033 canonical manifest compatibility, failure evidence truthfulness, source immutability, lexical component safety, sibling casefold collision, validator sample profile을 보정했다. formal local verification인 Task 035-B는 아직 수행하지 않았다.

## 유지되는 금지사항

```text
- main 직접 push 금지
- force push 및 history rewrite 금지
- 원본 HWP/HWPX 덮어쓰기 금지
- 실제 실행 없는 passed/completed 주장 금지
- 동일 Task 복수 worker 동시 수정 금지
- 기존 evidence 및 LOCAL_EXECUTION_RESULT 원본 덮어쓰기 금지
- Stage 2 전환 금지
- final HWPX core 선정 금지
```

## Source of truth

```text
docs/gpt-communication/PROJECT_STATE.json
docs/gpt-communication/CURRENT.md
docs/architecture/army-claw-master-plan.md
docs/gpt-communication/AGENT_OPERATING_MODEL.md
docs/architecture/army-claw-ai-worker-operating-rules.md
AGENTS.md
CLAUDE.md
docs/gpt-communication/reports/2026-07-14-task034-main-integration-governance-sync.md
docs/gpt-communication/tasks/task034-main-integration-governance-sync/TASK_CONTRACT.md
docs/research-notes/task-notes/RN-034-task034-main-integration-governance-sync.md
```

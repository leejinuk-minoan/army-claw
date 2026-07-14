# 현재 Army Claw 필수 확인 문서

작성일: 2026-07-14

## 전체 개발 단계

```text
전체 8단계 중 1단계
현재 단계: HwpAdapter 및 HWP/HWPX 엔진 안정화
현재 세부 단계: 1-3 선행 HWPX 엔진 비교·코어 선정
현재 active task: 없음
다음 Task: 마스터 과업 정의 대기
```

## Canonical 기준선

```text
canonical branch: main
Task 033 integration PR: #1
Task 033 integration merge SHA: a136cb2629a7fac660255da1318119ada4e56a1d
Task 035 integration PR: #3
Task 035 approved implementation SHA: e7c91119771ad9e75262ee946ad648b674157472
Task 035 formal evidence SHA: 1a743f88fb33fbd2caac42cb264efb511e205a5b
Task 035 master review report commit: df45b83d0b1fb2e9deafe8bfa3863ec7deba08bb
Task 035 source branch head: 84f6c320f5369d846c50fe85b6ee060f2bc83c43
Task 035 main merge SHA: e5f782cdafbebd25697fc58a32c1fa0042857b12
```

## 최신 완료 Task

```text
Task 035: Local Workspace Staged Output Controlled Promotion Boundary
status: final_verified
completion gate: passed
master review: complete
adapter validator gate: passed
merged to main: true
```

Task 035는 Task 033 evidence manifest에 연결된 staged artifact를 승인된 temporary destination root로 승격하는 controlled promotion 경계를 정의하고 검증했다. 검증된 브랜치는 PR #3을 통해 `main`에 병합됐다.

## Task 035 검증 기준

```text
verified implementation SHA: e7c91119771ad9e75262ee946ad648b674157472
formal evidence recording SHA: 1a743f88fb33fbd2caac42cb264efb511e205a5b
formal evidence attempt: attempt-002
validator CLI: exit 0 / valid / 383 checks passed
adapter validator unittest: exit 0 / Ran 22 tests OK
local workspace adapter unittest: exit 0 / Ran 97 tests OK / skipped 2
formal controlled-promotion scenarios: 15/15 passed
Task 033 whole-response manifest: passed
Task 033 inner manifest: passed
raw root boundary: passed
post-commit cleanup: passed
structured filesystem failures: passed
```

첫 formal harness 시도는 잘못된 approved-root identifier와 evidence 생성 이후의 preflight 기록 때문에 실패했으며 원본 그대로 보존됐다. Production implementation과 test source는 변경하지 않았고, 고정 implementation SHA에서 별도 `attempt-002`를 실행해 local gate를 통과했다.

## Safety 결과

```text
temporary-directory-only execution: true
controlled test promotion: true
actual filesystem mutation: true
file content read: true
source overwrite: false
pre-existing destination overwrite: false
user workspace mutation: false
production promotion: false
actual production/native adapter invocation: false
Hancom COM/native office application: false
real HWP/HWPX/HanCell/HanShow generation: false
public internet: false
dependency installation: false
```

## Main merge 정책

```text
worker main direct push: prohibited
force push: prohibited
history rewrite: prohibited
master-reviewed PR merge: allowed
```

마스터 에이전트는 completion gate, validation evidence, 충돌, 금지 경로 변경 및 과장 보고 여부를 확인한 뒤 이상이 없으면 PR을 `main`에 병합한다.

## 다음 작업

```text
active task: none
next task: awaiting_master_task_definition
Stage 2 transition: prohibited
final HWPX core selection: prohibited
```

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
docs/architecture/army-claw-local-workspace-staged-output-controlled-promotion-boundary.md
docs/gpt-communication/contracts/local-workspace-staged-output-controlled-promotion-boundary.json
docs/gpt-communication/reports/2026-07-14-task035-final-master-review.md
docs/gpt-communication/reports/2026-07-14-task035b-controlled-promotion-formal-local-verification.md
docs/research-notes/task-notes/RN-035-task035-local-workspace-staged-output-controlled-promotion-boundary.md
```

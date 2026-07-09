# Army Claw Worker Setup Guide

## 1. 작업 시작 전 필수 확인

Codex A/B/Claude Code는 작업 시작 전에 다음을 확인한다.

1. 현재 위치가 Army Claw 저장소 루트인지 확인한다.
2. 작업 branch가 Task Contract와 일치하는지 확인한다.
3. `git status --short`가 clean인지 확인한다.
4. 기준 commit과 현재 HEAD를 확인한다.
5. 변경 허용 범위와 금지 범위를 확인한다.
6. 필요한 read-only reference 문서를 먼저 읽는다.

## 2. 시작 전 읽을 문서

- `docs/architecture/army-claw-master-plan.md`
- `docs/architecture/army-claw-ai-worker-operating-rules.md`
- `docs/architecture/army-claw-solo-multi-agent-governance.md`
- `docs/architecture/army-claw-branch-ownership-map.md`
- `docs/architecture/army-claw-worker-setup-guide.md`
- `docs/architecture/army-claw-ai-worker-handoff-contract.md`
- `docs/architecture/army-claw-common-office-adapter-interface-contract.md`
- `docs/gpt-communication/PROJECT_STATE.json`
- `docs/gpt-communication/AGENT_OPERATING_MODEL.md`
- `docs/gpt-communication/tasks/TASK_CONTRACT_TEMPLATE.md`
- `docs/gpt-communication/handoffs/AI_WORKER_HANDOFF_TEMPLATE.md`
- `docs/gpt-communication/handoffs/ai-worker-handoff-contract.json`
- `docs/gpt-communication/contracts/common-office-adapter-interface-contract.json`
- `docs/gpt-communication/contracts/common-office-adapter-error-taxonomy.json`
- `docs/research-notes/README.md`
- `docs/research-notes/research-note-index.md`
- `docs/research-notes/research-note-index.json`

## 3. Read-only Reference 규칙

read-only reference 문서는 분석과 인용 기준으로만 사용한다. Task Contract에서 수정 허용 파일로 명시되지 않은 파일은 수정하지 않는다.

## 4. Report 작성 규칙

작업 완료 보고서는 `docs/gpt-communication/reports/` 아래에 한글로 작성한다.

보고서에는 다음을 포함한다.

- 작업 branch
- 기준 SHA
- 최종 commit SHA 또는 해당 보고서를 포함하는 commit SHA
- 변경 파일
- 실행 명령
- 테스트 결과
- 산출물 또는 evidence 경로
- Research Note 경로
- 제한사항
- 다음 작업 제안

## 5. Research Note 작성 규칙

Research Note가 필요한 Task는 `docs/research-notes/task-notes/` 아래에 Task별 독립 파일을 작성한다.

Research Note index는 다음 두 파일에 짧게 반영한다.

- `docs/research-notes/research-note-index.md`
- `docs/research-notes/research-note-index.json`

## 6. 검증 보고 금지 원칙

로컬 에이전트는 실제 실행하지 않은 테스트를 완료로 보고하지 않는다. 명령을 실행하지 않았다면 `미실행`으로 기록한다.

## 7. GitHub 보고 기준

push 후 보고는 GitHub 원격 branch에 올라간 commit SHA를 기준으로 한다.

main 직접 push, force push, history rewrite는 금지한다.

## 8. Handoff Packet 확인 절차

handoff를 수신한 worker는 바로 수정하지 않는다. 먼저 다음을 확인한다.

1. handoff packet이 존재하는지 확인한다.
2. `source_commit_sha`, `source_branch`, `base_commit_sha`, `target_branch`를 확인한다.
3. 원격 branch HEAD가 packet의 SHA와 일치하는지 또는 차이가 문서화되어 있는지 확인한다.
4. changed files가 packet과 실제 diff에서 일치하는지 확인한다.
5. Task report와 Research Note 경로가 존재하는지 확인한다.
6. forbidden path 변경이 없는지 확인한다.
7. dirty worktree가 clean인지 확인한다.
8. 실제 실행하지 않은 test가 passed로 기록되지 않았는지 확인한다.
9. stop condition이 하나라도 발생하면 작업을 중단하고 보고한다.

## 9. Sender checklist

Sender는 다음을 handoff packet에 기록한다.

- task_id와 handoff_id
- from_worker와 to_worker
- source branch와 source commit SHA
- base commit SHA
- target branch
- changed files
- task report path
- Research Note path
- commands run / commands not run
- validation summary
- forbidden changes check
- dirty worktree status
- known limitations
- remaining risks
- next allowed scope and forbidden scope
- stop conditions

## 10. Receiver checklist

Receiver는 다음 상태 중 하나로 판정한다.

- `accepted`: 모든 기준을 만족하여 allowed scope 안에서 진행 가능
- `rejected`: packet이 요청 작업과 맞지 않거나 필수 정보가 불충분함
- `blocked`: stop condition이 발생하여 사용자 또는 master review가 필요함

Receiver가 `accepted`를 기록하기 전에는 파일을 수정하지 않는다.

## 11. Rejected / blocked 조건

Rejected 또는 blocked 조건은 다음과 같다.

- branch HEAD 불일치
- source commit SHA 없음 또는 malformed
- dirty worktree 발견
- forbidden path 변경 발견
- Task report 누락
- required Research Note 누락
- changed files mismatch
- unexecuted test pass claim
- target worker가 공식 worker가 아님
- 동일 Task concurrent write 위험
- main direct push, force push, history rewrite 요구
- Stage transition 또는 final HWPX core selection 요구

## 12. Adapter interface contract 확인 절차

Task 023 이후 adapter 관련 작업을 시작하거나 인계할 때 worker는 다음을 먼저 확인한다.

1. `docs/architecture/army-claw-common-office-adapter-interface-contract.md`를 읽는다.
2. `docs/gpt-communication/contracts/common-office-adapter-interface-contract.json`을 확인한다.
3. `docs/gpt-communication/contracts/common-office-adapter-error-taxonomy.json`을 확인한다.
4. target_id, adapter_slot_id, plan_type mapping이 맞는지 확인한다.
5. source overwrite prevention이 보존되는지 확인한다.
6. public internet dependency가 차단되는지 확인한다.
7. proof mode에서 실제 adapter 실행을 주장하지 않는지 확인한다.

Adapter 구현 Task를 시작하기 전 common interface contract 확인은 필수다. Handoff packet에는 adapter interface contract 준수 여부를 포함할 수 있다.

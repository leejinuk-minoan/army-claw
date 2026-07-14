# Task 032 - Repository Baseline Governance State Reconciliation

## 작업 성격

이 작업은 기능 개발이 아니라 저장소 기준선과 운영 상태의 위험요소를 정리하는 로컬 검증 작업이다.

```text
repository: leejinuk-minoan/army-claw
routing_class: local_codex_required
start_sha: f03f8172142b43b9d721d657f2694bcd49cb6df5
work_branch: agent/task032-repository-baseline-governance-state-reconciliation
origin_main_sha: 9ef11d9e000610681023b021b83f5994a57f2dcb
merge_commit_sha: 650127595693eb101c1d21cd9bc758fc9490a0e7
```

## 목적

Task 032의 목적은 다음 네 가지다.

1. 승인된 시작 SHA에서 별도 작업 브랜치를 만들고 `origin/main`의 임시 Task 027 access-check 두 커밋을 task branch에만 반영한다.
2. main-only 두 커밋의 순효과가 0인지 증거로 확인한다.
3. Task 003의 과거 `completion_gate_passed=false`, `proceed_to_task_004=false` 기록과 이후 Task 004-031 진행 상태의 관계를 문서 근거로 정리한다.
4. 다음으로 계획되어 있던 staged output evidence manifest boundary 작업을 Task 033으로 재번호화하고, Task 032 통과 전에는 차단 상태로 둔다.

## 허용 범위

- `docs/gpt-communication/PROJECT_STATE.json`
- `docs/gpt-communication/CURRENT.md`
- `docs/gpt-communication/tasks/task032-repository-baseline-governance-state-reconciliation/TASK_CONTRACT.md`
- `docs/gpt-communication/reports/2026-07-14-task032-repository-baseline-governance-state-reconciliation.md`
- `docs/research-notes/task-notes/RN-032-task032-repository-baseline-governance-state-reconciliation.md`
- `docs/gpt-communication/evidence/task032-repository-baseline-governance-state-reconciliation/**`
- `docs/gpt-communication/delegation/task032-repository-baseline-governance-state-reconciliation/LOCAL_EXECUTION_RESULT.json`

## 금지 범위

- main 직접 수정, main push, force push, rebase
- 기능 개발
- Task 033 구현
- adapter, validator 동작 변경
- adapter invocation
- Hancom COM 실행
- 오피스 산출물 생성
- 사용자 작업공간 mutation
- Stage 2 전환
- 최종 HWPX core selection
- Task 003 증거 후처리 덮어쓰기

## 거버넌스 판정

Task 003 초기 리뷰의 `proceed_to_task_004=false`는 당시 불완전한 evidence integrity 상태에서 Task 004 전환을 금지한 historical restriction이다.

이후 Task 003 v6 native completion evidence와 Task 004 review-only 문서가 기록되었고, Task 004는 최종 코어 선정을 하지 않았다. Task 005-031은 최종 HWPX core selection이나 Stage 2 전환이 아니라 boundary, contract, adapter proof, local workspace safety 계층의 작업이다.

따라서 Task 004-031 진행은 다음 조건 안에서만 정합적이다.

- Task 004는 review-only이며 final core selection이 아니다.
- Task 005-031은 boundary/architecture/adapter contract work이다.
- Stage 2 전환은 여전히 금지된다.
- 최종 HWPX core selection은 여전히 금지된다.

## 완료 조건

- branch와 HEAD 기준선 증거가 기록되어야 한다.
- `origin/main` 병합은 task branch에만 있어야 한다.
- main-only 두 커밋이 task branch ancestry에 있어야 한다.
- main-only 두 커밋의 net diff가 비어 있어야 한다.
- JSON parse, adapter validator CLI, adapter validator unittest, local workspace adapter unittest가 통과해야 한다.
- 금지 경로 변경이 없어야 한다.
- Task 033은 `blocked_until_task032_passes`로 기록되어야 한다.

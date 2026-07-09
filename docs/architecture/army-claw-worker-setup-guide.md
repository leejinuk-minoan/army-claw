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
- `docs/gpt-communication/PROJECT_STATE.json`
- `docs/gpt-communication/AGENT_OPERATING_MODEL.md`
- `docs/gpt-communication/tasks/TASK_CONTRACT_TEMPLATE.md`
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

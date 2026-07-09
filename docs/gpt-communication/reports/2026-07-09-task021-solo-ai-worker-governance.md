# Task 021 — Solo AI Worker Operating Rules + Multi-Agent Governance 보고서

## 요약

Task 021은 Army Claw의 공식 작업 체계를 사람 협업자 분업이 아니라 사용자 단독의 복수 AI worker 운용 구조로 고정한 문서 기준 작업이다.

- 작업 브랜치: `agent/task021-solo-ai-worker-governance`
- 기준 SHA: `5c0e9d0a7050e8acdfe6587c721557583b0b8e28`
- 최종 commit SHA: 본 보고서를 포함하는 Task 021 커밋 SHA
- production code 변경: `false`
- main 직접 수정: `false`
- force push 사용: `false`
- Stage 2 전환 선언: `false`
- 최종 HWPX core 선정: `false`

## 공식 Worker Roster

- `codex_a`
- `codex_b`
- `claude_code`

## 제외 Worker

- `gemini_antigravity`

## 취소된 Human Collaboration

- `person_a`
- `person_b`

인원 A/B 협업은 취소되었으며, A/B용 PPT, 분업안, branch 준비는 진행하지 않는다.

## 생성/수정 문서

생성:

- `docs/architecture/army-claw-ai-worker-operating-rules.md`
- `docs/architecture/army-claw-solo-multi-agent-governance.md`
- `docs/architecture/army-claw-branch-ownership-map.md`
- `docs/architecture/army-claw-worker-setup-guide.md`
- `AGENTS.md`
- `CLAUDE.md`
- `docs/research-notes/task-notes/RN-021-task021-solo-ai-worker-governance.md`
- `docs/gpt-communication/reports/2026-07-09-task021-solo-ai-worker-governance.md`

수정:

- `docs/architecture/army-claw-master-plan.md`
- `docs/gpt-communication/reports/2026-07-09-pre-task021-research-note-index-structure.md`
- `docs/gpt-communication/PROJECT_STATE.json`
- `docs/gpt-communication/AGENT_OPERATING_MODEL.md`
- `docs/research-notes/research-note-index.md`
- `docs/research-notes/research-note-index.json`

## Research Note

- `docs/research-notes/task-notes/RN-021-task021-solo-ai-worker-governance.md`

Index updated:

- `docs/research-notes/research-note-index.md`
- `docs/research-notes/research-note-index.json`

## 검증 항목

- production code changed: `false`
- main directly modified: `false`
- force push used: `false`
- person A/B collaboration artifacts created: `false`
- person A/B branches created: `false`
- Gemini Antigravity included: `false`
- Stage 2 declared: `false`
- final HWPX core selected: `false`
- PROJECT_STATE.json valid: `true`
- research-note-index.json valid: `true`
- forbidden path changed: `false`

## 비범위

이번 작업에서는 다음을 수행하지 않았다.

- 실제 HanShow adapter 구현
- 실제 HanCell adapter 구현
- 실제 HWP/HWPX adapter 구현
- Model Gateway 구현
- LLM planner 구현
- HTTP/UI 구현
- dependency install
- Stage 2 전환 선언
- 최종 HWPX core 선정

## 다음 작업 제안

Task 022 — AI Worker Handoff Contract Proof

# RN-021 — Task 021 Solo AI Worker Governance

## 1. Research Question

사용자 1인이 여러 AI coding worker를 운용하는 조건에서, branch ownership, sequential handoff, Task Contract, Research Note 구조를 통해 재현 가능한 개발 거버넌스를 설계할 수 있는가?

## 2. System Design Claim

Army Claw의 solo multi-agent governance는 사용자 1인이 Codex A, Codex B, Claude Code를 순차적으로 배치하되, branch ownership과 Task Contract를 통해 동시 수정과 책임 불명확성을 방지한다.

## 3. Method

문서 기반 governance proof를 수행했다. 마스터 플랜, 운영 규칙, branch ownership map, worker setup guide, AGENTS.md, CLAUDE.md, PROJECT_STATE, AGENT_OPERATING_MODEL, Task report, Research Note index를 갱신한다.

## 4. Evidence

- `docs/architecture/army-claw-ai-worker-operating-rules.md`
- `docs/architecture/army-claw-solo-multi-agent-governance.md`
- `docs/architecture/army-claw-branch-ownership-map.md`
- `docs/architecture/army-claw-worker-setup-guide.md`
- `AGENTS.md`
- `CLAUDE.md`
- `docs/gpt-communication/reports/2026-07-09-task021-solo-ai-worker-governance.md`

## 5. Result

- official worker roster fixed
- person A/B collaboration canceled
- Gemini Antigravity excluded
- sequential handoff required
- branch ownership required
- no main direct push
- no force push
- Research Note structure preserved

## 6. Paper-Ready Sentences

Army Claw adopts a solo multi-agent governance model in which a single project owner sequentially assigns work to multiple AI coding workers.

The governance model prevents concurrent file modification by requiring explicit branch ownership, task contracts, and handoff reports.

Research Notes are separated from development reports so that implementation evidence and paper-oriented claims remain traceable but not conflated.

The model treats AI workers as execution and review instruments rather than independent decision makers.

## 7. Limitations

- 실제 multi-agent execution performance는 아직 측정하지 않음
- 실제 Codex A/B/Claude Code 간 handoff 실험은 후속 Task 필요
- 실제 adapter 구현은 포함하지 않음

## 8. Link to Development Records

- `docs/gpt-communication/reports/2026-07-09-task021-solo-ai-worker-governance.md`
- `docs/architecture/army-claw-master-plan.md`
- `docs/gpt-communication/PROJECT_STATE.json`
- `docs/gpt-communication/AGENT_OPERATING_MODEL.md`

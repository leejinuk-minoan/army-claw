# RN-022 — Task 022 AI Worker Handoff Contract Proof

## 1. Research Question

사용자 1인이 여러 AI coding worker를 순차적으로 운용할 때, handoff packet과 검증 checklist를 통해 worker 간 인계의 재현성과 추적성을 확보할 수 있는가?

## 2. System Design Claim

Army Claw의 AI worker handoff contract는 branch, commit SHA, 변경 파일, 검증 결과, Research Note, stop conditions를 표준화하여 worker 간 context loss와 무단 범위 확장을 줄인다.

## 3. Method

문서 기반 contract proof를 수행했다. Handoff contract 문서, template, machine-readable JSON contract, Task 021 sample handoff, Task report, Research Note index를 생성 또는 갱신한다.

## 4. Evidence

- `docs/architecture/army-claw-ai-worker-handoff-contract.md`
- `docs/gpt-communication/handoffs/AI_WORKER_HANDOFF_TEMPLATE.md`
- `docs/gpt-communication/handoffs/ai-worker-handoff-contract.json`
- `docs/gpt-communication/handoffs/samples/task021-codex-a-to-codex-b-handoff.md`
- `docs/gpt-communication/handoffs/samples/task021-codex-a-to-codex-b-handoff.json`
- `docs/gpt-communication/reports/2026-07-09-task022-ai-worker-handoff-contract.md`

## 5. Result

- handoff packet fields fixed
- handoff status enum fixed
- required validation fixed
- stop conditions fixed
- sender and receiver roles fixed
- Task 021 sample handoff created
- Research Note structure preserved
- person A/B and Gemini Antigravity remain excluded from official worker roster

## 6. Paper-Ready Sentences

Army Claw introduces a handoff contract to preserve traceability when multiple AI coding workers are operated sequentially by a single project owner.

The handoff packet standardizes branch, commit SHA, changed files, validation results, stop conditions, and next-worker scope.

By requiring receiver-side validation before editing, the system reduces context loss and prevents unauthorized scope expansion across worker transitions.

The handoff contract is separate from development reports and Research Notes, enabling operational transfer without conflating evidence layers.

The design treats AI workers as bounded execution or review agents rather than autonomous decision makers.

## 7. Limitations

- 실제 다중 worker handoff 실행 성능은 아직 측정하지 않음
- 현재는 문서 기반 proof이며 자동 validator 구현은 후속 Task로 남김
- 실제 code modification workflow에는 아직 적용하지 않음

## 8. Link to Development Records

- `docs/gpt-communication/reports/2026-07-09-task022-ai-worker-handoff-contract.md`
- `docs/architecture/army-claw-ai-worker-handoff-contract.md`
- `docs/gpt-communication/handoffs/ai-worker-handoff-contract.json`
- `docs/gpt-communication/handoffs/samples/task021-codex-a-to-codex-b-handoff.md`
- `docs/gpt-communication/handoffs/samples/task021-codex-a-to-codex-b-handoff.json`

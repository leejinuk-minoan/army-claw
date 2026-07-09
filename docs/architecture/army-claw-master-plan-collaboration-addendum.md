# Army Claw Solo Owner and Local Agent Handoff Addendum

## Purpose

This addendum supersedes the previous human-collaboration plan.

Human collaborator participation has been canceled. The project is now operated by a single human project owner, while local AI work continues through task-based sequential handoff among approved local agents.

Army Claw remains the official system name. Army Claw is not an HWPX-only document generator. HWP/HWPX, HanCell, HanShow, and local workspace operations are first-class targets.

## Current Human Work Model

The current human work model is:

- Human project owner: the user only
- No active external human collaborators
- No active collaborator-operated AI branch ownership
- No active human-assigned HanShow or HanCell feature branch ownership

The project owner retains responsibility for:

- HWP/HWPX direction
- HanCell direction
- HanShow direction
- local LLM / Model Gateway direction
- master integration
- task approval
- master review

## Canceled Collaboration Plan

The following previous collaboration plan is canceled and must not be treated as active:

- Person A: Park Gyumin / 박규민 — HanShow engine
- Person B: Kim Youngsu / 김영수 — HanCell engine

The following previously prepared branches are inactive and must not be used for new human collaborator work unless a later user-approved task explicitly reactivates them:

- `feature/hanshow-engine-person-a`
- `feature/hancell-engine-person-b`

These branches may remain in GitHub for historical traceability, but they are not current work branches.

## Active Local AI Worker Model

The active AI worker model is task-based sequential handoff among the following local agents:

- Codex A — `worker_id=codex_a`
- Codex B — `worker_id=codex_b`
- Claude Code A — `worker_id=claude_code_a`

Gemini Antigravity is not part of the active worker set.

Local AI workers are not a parallel team. Only one AI worker should perform a task at a time. Handoff must be based on GitHub-verified commit SHA, task report, evidence bundle, and test result, not on chat memory.

## Branch Ownership

Each AI worker may only modify the branch explicitly assigned by the task prompt.

Forbidden without explicit approval:

- modifying branches not assigned to the current task
- modifying inactive collaborator branches
- pushing directly to `main`
- force push
- history rewrite
- unauthorized merge into integration branches

If a task fails or needs retry, create a retry branch from the last verified SHA instead of force pushing or rewriting history.

## Contract Discipline

All AI workers must follow the Army Claw contracts already fixed by prior tasks:

- multi-app capability architecture
- app target routing contract
- app target plan schema
- adapter slot input contract
- validation error taxonomy
- evidence and report expectations
- research evidence discipline

HanShow and HanCell work must not define incompatible private input/output shapes. If the shared contract must change, the change must be proposed through a separate contract task before implementation branches rely on it.

## Research Evidence Discipline

All implementation, integration, E2E, adapter, model gateway, and template preservation work should preserve research-grade evidence for the selected paper:

```text
구조화 계획과 결정론적 어댑터를 활용한 폐쇄망 멀티 오피스 문서 생성 에이전트 설계 및 검증
```

When applicable, task branches and AI workers must produce or preserve the following evidence items, or mark them as `not_applicable` with reasons:

1. input_user_request
2. generated_structured_plan
3. schema_validation_result
4. policy_validation_result
5. adapter_routing_result
6. adapter_slot_input
7. execution_log
8. artifact_validation_report
9. template_preservation_report
10. source_template_overwrite_check
11. offline_dependency_check
12. public_internet_access_check
13. repeated_run_reproducibility_report

Future research-relevant tasks should include `release/test-documents/<task-id>/research-evidence-manifest.json` when feasible.

No worker may claim production readiness, Stage 2 transition, final HWPX core selection, template preservation score, closed-network compliance, reproducibility, or manual correction time reduction without supporting evidence.

## Master Agent Oversight

The master agent may inspect official task, feature, and integration branches to verify:

- assigned branch compliance
- contract compliance
- report and evidence consistency
- research evidence discipline compliance
- forbidden operation violations
- integration risk
- roadmap alignment

Master agent review does not imply automatic modification authority. Corrections must be made through user-approved tasks or assigned task branches.

## Timing

The next active governance task should update AI worker operating rules for the solo-owner model.

Actual HanShow and HanCell engine implementation should begin only after the common Office Adapter interface contract is fixed.

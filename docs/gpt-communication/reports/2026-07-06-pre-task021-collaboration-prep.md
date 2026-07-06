# Pre-Task 021 Collaboration Preparation

## Summary

This preparation step records the planned human collaboration governance before Task 021 is finalized.

This is not Task 021 execution. It does not implement HanShow, HanCell, HWP/HWPX, Model Gateway, LLM planner, HTTP, UI, or Stage 2 work.

## Branch

- Branch: `agent/pre-task021-collaboration-prep`
- Base SHA: `c93e3fec627bfa493eaefefd974b04adc012ac41`
- Addendum commit SHA: `055b431c51b7ec269b9c6e38d2f1d0db910d3c9a`

## Added Document

- `docs/architecture/army-claw-master-plan-collaboration-addendum.md`

## Human Collaboration Plan

Planned human collaborators:

- Project owner: HWP/HWPX engine, local LLM / Model Gateway direction, master integration, master review
- Person A: HanShow engine
- Person B: HanCell engine

## Branches Created for Human Collaborators

- `feature/hanshow-engine-person-a`
- `feature/hancell-engine-person-b`

These branches were created from the addendum commit SHA `055b431c51b7ec269b9c6e38d2f1d0db910d3c9a`.

## Governance Added

The addendum fixes the following rules:

- Each collaborator and collaborator-operated AI may only modify explicitly assigned branches.
- Direct push to `main` is forbidden.
- Force push and history rewrite are forbidden without explicit approval.
- HanShow and HanCell engines must follow the fixed Army Claw contracts.
- Shared adapter contract changes must go through a separate contract task.
- The master agent may inspect official task, feature, and integration branches for consistency and contract compliance.

## Forbidden Items Check

- Production code changed: false
- HanShow adapter implemented: false
- HanCell adapter implemented: false
- Model Gateway implemented: false
- LLM planner connected: false
- HTTP/UI implemented: false
- Final HWPX core selected: false
- Stage 2 transition declared: false

## Next Step

After human collaboration participation is confirmed, revise Task 021 to reflect the confirmed collaborator status and continue with AI worker operating rules plus collaboration governance.

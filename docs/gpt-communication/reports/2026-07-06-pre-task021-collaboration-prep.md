# Pre-Task 021 Collaboration Preparation

## Summary

This preparation step records the planned human collaboration governance before Task 021 is finalized.

This is not Task 021 execution. It does not implement HanShow, HanCell, HWP/HWPX, Model Gateway, LLM planner, HTTP, UI, or Stage 2 work.

## Branch

- Branch: `agent/pre-task021-collaboration-prep`
- Base SHA: `c93e3fec627bfa493eaefefd974b04adc012ac41`
- Addendum commit SHA: `055b431c51b7ec269b9c6e38d2f1d0db910d3c9a`
- Collaborator name update commit SHA: `81ee875de09debd0e84cd0a9133b867a5e1a6b76`
- Paper design head before evidence hardening: `b88064dfb45bc730db37893cdebf211a348489aa`
- Master plan research evidence update commit SHA: `baa31b44aeeba5a7a83de8b48c7d2c0726d2041a`
- Collaboration addendum research evidence update commit SHA: `9de79c7f32c8f854de9fc9ea1008d3f056533329`
- Standalone research evidence discipline commit SHA: `8a6377d22e4aeca77cbb21ad25bfeec4103d8864`

## Added / Updated Documents

- `docs/architecture/army-claw-master-plan-collaboration-addendum.md`
- `docs/research/papers/army-claw-research-evidence-discipline.md`

## Human Collaboration Plan

Planned human collaborators:

- Project owner: HWP/HWPX engine, local LLM / Model Gateway direction, master integration, master review
- Person A: Park Gyumin / 박규민 — HanShow engine
- Person B: Kim Youngsu / 김영수 — HanCell engine

## Branches Created for Human Collaborators

- `feature/hanshow-engine-person-a` — Person A / 박규민
- `feature/hancell-engine-person-b` — Person B / 김영수

These branches were created from the addendum commit SHA `055b431c51b7ec269b9c6e38d2f1d0db910d3c9a` and later fast-forwarded to the latest pre-Task 021 preparation head.

## Governance Added

The addendum fixes the following rules:

- Each collaborator and collaborator-operated AI may only modify explicitly assigned branches.
- Direct push to `main` is forbidden.
- Force push and history rewrite are forbidden without explicit approval.
- HanShow and HanCell engines must follow the fixed Army Claw contracts.
- Shared adapter contract changes must go through a separate contract task.
- The master agent may inspect official task, feature, and integration branches for consistency and contract compliance.
- Research evidence discipline applies to future implementation, integration, E2E, adapter, model gateway, and template preservation work.

## Research Evidence Discipline Added

The following evidence items must be produced when applicable, or marked as `not_applicable` with reasons:

1. `input_user_request`
2. `generated_structured_plan`
3. `schema_validation_result`
4. `policy_validation_result`
5. `adapter_routing_result`
6. `adapter_slot_input`
7. `execution_log`
8. `artifact_validation_report`
9. `template_preservation_report`
10. `source_template_overwrite_check`
11. `offline_dependency_check`
12. `public_internet_access_check`
13. `repeated_run_reproducibility_report`

Future research-relevant tasks should create:

```text
release/test-documents/<task-id>/research-evidence-manifest.json
```

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

After human collaboration participation is confirmed, revise Task 021 to reflect the confirmed collaborator status and continue with AI worker operating rules, collaboration governance, and research evidence discipline.

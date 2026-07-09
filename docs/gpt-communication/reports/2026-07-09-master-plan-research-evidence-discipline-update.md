# Master Plan Research Evidence Discipline Update

## Summary

The master plan was reviewed for whether future task structures are required to produce research-grade evidence for the selected Army Claw paper.

The current paper design and Task 021 prompt already referenced the evidence discipline, but the master plan did not yet contain a direct mandatory rule requiring future task prompts, reports, validation summaries, and evidence bundles to produce or explicitly mark the research evidence items as not applicable.

The master plan has therefore been updated with a new section:

- `## 15. 연구 증거 산출 규칙`

## Branch

- Branch: `agent/pre-task021-collaboration-prep`
- Previous head before this update: `b88064dfb45bc730db37893cdebf211a348489aa`
- Master plan update commit SHA: `baa31b44aeeba5a7a83de8b48c7d2c0726d2041a`

## Updated File

- `docs/architecture/army-claw-master-plan.md`

## Required Research Evidence Items

Future implementation, integration, E2E, adapter, model gateway, and template preservation tasks must produce the following items when applicable, or mark them as `not_applicable` with reasons:

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

## Task-Type Application Rules Added

The master plan now states:

- contract/schema/routing proof tasks should preserve mock/proof evidence for planning, validation, routing, and adapter slot input.
- adapter skeleton tasks should preserve adapter slot input, execution log, and artifact validation placeholder or controlled no-op evidence.
- actual adapter execution tasks should preserve all applicable evidence items.
- template preservation tasks must preserve template preservation and source overwrite evidence.
- offline/model gateway tasks must preserve offline dependency and public internet access checks.
- reproducibility tasks must preserve repeated-run reproducibility reports.
- governance-only tasks may omit direct document-generation evidence but must preserve policy evidence requiring future tasks to collect it.

## Evidence Manifest Requirement Added

Future research-relevant tasks should create:

```text
release/test-documents/<task-id>/research-evidence-manifest.json
```

The manifest should list evidence items present, not applicable items, reasons, incident counts, public internet access attempts, unvalidated plan execution count, repeated run count, and completion candidate status.

## Forbidden Research Claims Added

The master plan now forbids claims about production readiness, Stage 2 transition, final HWPX core selection, template preservation scores, closed-network compliance, reproducibility, or manual correction time reduction unless supported by evidence.

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

Task 021 should reference the updated master plan section and ensure AGENTS.md, collaboration governance, and research evidence discipline documents preserve this requirement.

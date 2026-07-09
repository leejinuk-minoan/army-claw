# Army Claw Research Evidence Discipline

## Purpose

This document is the agent-facing research evidence discipline for the selected Army Claw paper.

Selected paper title:

```text
구조화 계획과 결정론적 어댑터를 활용한 폐쇄망 멀티 오피스 문서 생성 에이전트 설계 및 검증
```

English title:

```text
Design and Validation of a Closed-Network Multi-Office Document Generation Agent Using Structured Plans and Deterministic Adapters
```

This document does not authorize production implementation, Stage 2 transition, final HWPX core selection, or claims of measured performance.

## Core Rule

Future implementation, integration, E2E, adapter, model gateway, and template preservation tasks must preserve research-grade evidence when applicable.

If an item does not apply to a task, the task must mark it as `not_applicable` and record a reason.

## Required Evidence Items

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

## Evidence Manifest

Research-relevant tasks should create the following file when feasible:

```text
release/test-documents/<task-id>/research-evidence-manifest.json
```

The manifest should include:

- `task_id`
- `task_type`
- `generated_at`
- `evidence_items_present`
- `evidence_items_not_applicable`
- `not_applicable_reasons`
- `source_template_overwrite_incident_count`
- `public_internet_access_attempt_count`
- `unvalidated_plan_execution_count`
- `repeated_run_count`
- `normalized_reproducibility_available`
- `template_preservation_report_available`
- `completion_candidate`

## Task Type Rules

### Contract, schema, or routing proof tasks

These tasks should preserve mock or proof evidence for:

- generated structured plan
- schema validation result
- policy validation result
- adapter routing result
- adapter slot input

### Adapter skeleton tasks

These tasks should preserve controlled placeholder or no-op evidence for:

- adapter slot input
- execution log
- artifact validation report

### Actual adapter execution tasks

These tasks should preserve all applicable evidence items.

### Template preservation tasks

These tasks must preserve:

- template preservation report
- source template overwrite check

### Offline or model gateway tasks

These tasks must preserve:

- offline dependency check
- public internet access check

### Reproducibility tasks

These tasks must preserve:

- repeated-run reproducibility report

### Governance-only tasks

These tasks do not need to generate document-execution evidence, but they must preserve policy evidence requiring future tasks to collect it.

## Forbidden Research Claims Without Evidence

No task, worker, collaborator, or collaborator-operated AI may claim the following without supporting evidence:

- production-ready adapter status
- Stage 2 transition completion
- final HWPX core selection
- template preservation score achievement
- closed-network compliance completion
- reproducibility achievement
- manual correction time reduction

Claims must be backed by an evidence bundle, validation report, repeated-run results, or user/human evaluation record.

## Relationship to Other Documents

This document is subordinate to:

- `docs/architecture/army-claw-master-plan.md`
- `docs/research/papers/2026-07-09-structured-plan-deterministic-adapter-paper-design.md`

It should be referenced by:

- AGENTS.md
- CLAUDE.md
- worker handoff rules
- human collaboration governance
- future task prompts
- future completion reports

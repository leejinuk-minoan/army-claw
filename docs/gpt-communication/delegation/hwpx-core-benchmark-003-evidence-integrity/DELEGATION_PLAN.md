# Task 003 Cloud Restart Delegation Plan

## Identity

- task_id: `hwpx-core-benchmark-003-evidence-integrity`
- branch: `agent/task003-cloud-restart`
- clean base: `c222429d6f9698022e3f2d326ca914f245cebc65`
- cloud start: `c222429d6f9698022e3f2d326ca914f245cebc65`
- routing class: hybrid
- phase: cloud preparation complete, awaiting master review

## Cloud-prepared scope

The cloud implementation provides evidence/probe-derived status decisions, semantic S06-S08 before/after validation, complete S12-S14 evidence gates, filesystem-derived JSON inventory, invalid-pass counting, validator-backed scoring, task-start/task-end manifests, RED and positive tests, and a strict Draft 2020-12 `schemas-v2` set.

The legacy candidate/scenario fixed runner was removed and replaced by the evidence-driven entrypoint at `tools/hancom/benchmark/hwpx-core-benchmark-003-evidence-integrity.mjs`.

## Local execution boundary

Local Codex may begin only after master approval. Local execution must restore the pinned jszip environment, install a pinned standards-compliant Draft 2020-12 validator, collect exact LICENSE and SHA256 evidence, perform offline replay, run baseline/current Hancom regression, execute actual filesystem inventory and schema validation, and capture stdout, stderr, exit codes and final artifacts.

No cloud-created fixture or source review may be presented as actual HWPX execution evidence.

## Prohibited scope

Task 004, core selection, Stage 1-4 transition, main merge, force push, amend, concurrent cloud/local writes, and passed/completed claims without actual execution remain prohibited.

## Handoff rule

After this package is pushed, the cloud worker becomes read-only. The master reviews the branch and explicitly authorizes or rejects local execution. Local Codex modifies only the paths listed in `FILE_CHANGE_PLAN.json`.

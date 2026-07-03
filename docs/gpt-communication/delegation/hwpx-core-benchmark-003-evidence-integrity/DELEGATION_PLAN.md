# Task 003 Corrective Cloud Continuation Plan

## Identity

- task_id: `hwpx-core-benchmark-003-evidence-integrity`
- branch: `agent/task003-cloud-restart`
- correction start SHA: `89e465f7e1c79b11cb6acbe321279eb3daa53eff`
- clean base SHA: `c222429d6f9698022e3f2d326ca914f245cebc65`
- phase target: `cloud_correction_complete_awaiting_read_only_verification`

## Canonical structure

The only active Schema root is:

`release/test-documents/hwpx-core-benchmark-003-evidence-integrity/schemas-v2/`

The sibling `schemas/` directory is retained only as an explicitly marked `legacy_inactive` compatibility artifact. Inventory and runtime validation must not use it as an active Schema root.

Canonical implementation modules:

- common evidence contracts: `task003-common.mjs`
- filesystem JSON inventory: `task003-json-inventory.mjs`
- task manifests and cross-artifact SHA checks: `task003-manifest-integrity.mjs`
- S06-S08 semantic validation: `task003-preservation-validators.mjs`
- S12-S14 complete evidence gates: `task003-complete-gates.mjs`
- status decisions: `task003-status-decision.mjs`
- invalid-pass and score integrity: `task003-score-integrity.mjs`
- Schema loading/standard-validator adapter: `task003-schema-runtime.mjs`

Compatibility files may contain only documented re-exports:

- `task003-cloud-common.mjs` → `task003-common.mjs`
- `task003-inventory-manifest.mjs` → inventory and manifest canonical modules
- `task003-complete-evidence-gates.mjs`, `task003-performance-gate.mjs`, `task003-offline-gate.mjs`, `task003-license-gate.mjs` → `task003-complete-gates.mjs`
- `task003-status-engine.mjs` → `task003-status-decision.mjs`
- `task003-scoring.mjs` → `task003-score-integrity.mjs`

## Corrected cloud scope

- actual execution, source inspection or verified blocking prerequisite probe is required to derive status
- `blocked` requires a real probe, reason code, missing prerequisites and probe evidence
- execution records require RFC 3339 timestamps and filesystem-probed stdout/stderr
- S06-S08 require input/output HWPX identity, actual file probes and snapshot lineage
- S07 compares relationship source, ID, type, target and reference source
- S08 compares root/section namespaces and fwSpace count, paths and document order
- S12-S14 require filesystem-probed artifacts, logs, inventories, legal files and upstream lineage
- canonical Schema inventory detects missing, duplicate, unclassified, mapping and write-order failures
- strict Draft 2020-12 Schema sources and RED fixtures are provided

## Cloud validation boundary

Cloud work performs repository ancestry checks, static source review, strict JSON parsing review and package inventory review. It does not execute Node tests, a standard Draft 2020-12 validator, HWPX operations, dependencies, offline replay, full regression, COM or actual final inventory. Unexecuted items are not reported as passed.

## Local execution boundary

Local Codex remains disallowed until the master performs read-only verification and assigns the verified final remote HEAD as `local_execution_base_sha`. Local writes are limited to `FILE_CHANGE_PLAN.json`, including the Task 003 report allowlist.

## Prohibited scope

Task 004, core selection, Stage 1-4 transition, `feature/hwpx-core-benchmark` changes, interrupted-branch merge/cherry-pick, main merge, amend, force push, history rewrite, concurrent cloud/local writes and unsupported pass claims remain prohibited.

## SHA recording

1. `delegation_payload_sha` is the commit after all source, Schema, tests and six package payloads are complete.
2. A later metadata push records that payload SHA.
3. The final remote HEAD is recorded externally by the master/read-only verifier.
4. `local_execution_base_sha` remains null until the master assigns the verified final remote HEAD.

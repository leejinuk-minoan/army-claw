# Task 003 Final Corrective Cloud Continuation Plan

## Identity

- task_id: `hwpx-core-benchmark-003-evidence-integrity`
- branch: `agent/task003-cloud-restart`
- final correction start SHA: `14ae5262204db3386eacf451f3d1c17938018d0d`
- clean base SHA: `c222429d6f9698022e3f2d326ca914f245cebc65`
- target phase: `cloud_final_correction_complete_awaiting_read_only_verification`

## Final corrective scope

This continuation closes four residual defects without beginning a new task:

1. Git commit identities use the canonical 40-character lowercase hexadecimal `isGitCommitSha()` validator. File, artifact, log and legal-document hashes continue to use 64-character SHA256.
2. `validatePassedResultEligibility(result, context)` is the single canonical passed-result gate shared by invalid-pass counting and functional score calculation.
3. Canonical `adapter-execution.schema.json` defines strict evidence fields and status-specific conditions for passed, failed, blocked, unsupported and not-applicable records.
4. S06 mutation identity requires both a different output path and a different output SHA256, preventing in-place overwrite or duplicate-content output from passing.

## Canonical modules

- common hash, filesystem and execution contracts: `task003-common.mjs`
- cross-artifact and manifest integrity: `task003-manifest-integrity.mjs`
- passed eligibility, invalid-pass and scoring: `task003-score-integrity.mjs`
- status decisions: `task003-status-decision.mjs`
- Schema preflight contracts: `task003-schema-preflight.mjs`
- S06-S08 semantic validation: `task003-preservation-validators.mjs`

Compatibility files remain thin re-export wrappers; no new duplicate business-logic helper was introduced.

## Passed eligibility contract

A `passed` result is eligible only when all of the following are true:

- benchmark-result contract is valid
- local canonical Schema validation result is `valid:true`
- at least one actual successful command exists
- command timestamps, exit code and stdout/stderr filesystem probes are valid
- imported evidence or required filesystem evidence is complete
- all validator results are valid with empty missing-evidence arrays
- result missing evidence is empty and evidence completeness is `complete`
- the scenario-specific gate is valid with no missing evidence

Invalid passed results increment `invalid_pass_count`, receive zero points, use state `rejected`, and retain failure reasons. Invalid-pass and score calculation call the same eligibility function.

## Validation boundary

Cloud work is limited to remote HEAD verification, static source and Schema review, fixture-source review, and clean-base/package diff reconciliation. Node, a standards-compliant Draft 2020-12 Validator, Meta-Schema, filesystem inventory, HWPX, dependency installation, offline replay, full regression, COM/layout and performance execution remain local-only and are not reported as passed.

## SHA recording

- `delegation_payload_sha`: commit containing completed source, Schema, tests and all six package payloads
- `final_remote_head`: recorded externally after the metadata-only push
- `local_execution_base_sha`: remains null until the master assigns the verified final remote HEAD

## Prohibited scope

Changes to `feature/hwpx-core-benchmark`, merge/cherry-pick from `archive/task003-interrupted-f68ae3`, Task 004, core selection, Stage 1-4 transition, main merge, amend, force push, history rewrite, concurrent local writes and unsupported pass claims remain prohibited.

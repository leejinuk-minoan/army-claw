# Task 034 — Main Integration and Governance Baseline Sync

## Task identity

- task_id: `task034-main-integration-governance-sync`
- repository: `leejinuk-minoan/army-claw`
- branch: `agent/task034-main-integration-governance-sync`
- base_sha: `a136cb2629a7fac660255da1318119ada4e56a1d`
- routing_class: `cloud_delegable`
- adapter_validator_gate_required: `false`
- adapter_validator_gate_status: `not_required`

## Goal

1. Record the verified Task 001–033 integration into `main` through PR #1.
2. Set `main` as the canonical development branch.
3. Remove the obsolete rule requiring separate user approval before every `main` merge.
4. Preserve direct-push, force-push, history-rewrite, Stage 2, final-core-selection, source-overwrite, and evidence-integrity safeguards.
5. Define the next work as Task 035 without implementing it.

## Allowed changes

- governance and current-state documentation
- Task 034 report and Research Note
- Research Note indexes
- policy wording for master-reviewed PR merges

## Forbidden changes

- production adapter behavior
- validator behavior
- test behavior
- existing evidence or `LOCAL_EXECUTION_RESULT.json`
- direct push to `main`
- force push or history rewrite
- Stage 2 transition
- final HWPX core selection
- Task 035 implementation

## Completion gate

- PR #1 merge SHA is recorded accurately.
- `main` becomes the canonical branch in state documents.
- obsolete user-approval merge prohibition is absent from authoritative current-state restrictions.
- master-reviewed PR merge policy is explicit.
- Task 035 is registered as next planned work only.
- all changed JSON remains syntactically valid.
- Task 034 is merged to `main` through a reviewable PR.

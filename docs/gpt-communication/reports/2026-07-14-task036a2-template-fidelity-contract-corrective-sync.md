# Task 036-A2 — Template Fidelity Contract Corrective Sync

## Scope
This cloud-only correction updates the Task 036 selector contract, bridge samples, local handoff, result template, governance state, and Research Note metadata. No implementation source, tests, validator source, HWP/HWPX artifact, native application, or user workspace was modified.

## Corrections
- Added machine-readable metadata for all 23 Task 036 error codes: category, blocking, recoverable, default message, and evidence requirements.
- Replaced the single-operation bridge link model with plan-level links plus an operation-level collection.
- Distinguished synchronized Preview from a structurally absent Preview entry.
- Made official adapter validator registration and validator tests mandatory for Task 036-B.
- Split Task 036-B into B1 implementation baseline and B2 formal evidence recording.
- Expanded the local result template with validator counts, selector blocking cases, preservation evidence, and actual-vs-shape Task 031/033/035 integration checks.

## Commit identity rule
A Git commit cannot contain its own SHA in its committed content. The approved content baseline and final state-sync commit are therefore reported externally and separately. Task 036-B must start from the final branch HEAD reported by the cloud agent, while the brief records the immutable parent content baseline and requires verification against the externally reported final state-sync SHA.

## Static validation
The cloud connector performed structured file review only. JSON parser commands, Node syntax checks, Node tests, validator CLI, validator tests, HWPX generation, Hancom COM, filesystem mutation, and promotion were not run.

## Status
Task 035 remains `final_verified`. Task 036 is `cloud_contract_package_corrected_pending_local_implementation`; implementation and formal local verification remain required, the adapter validator gate remains `required_not_run`, and the Task 036 completion gate remains false.

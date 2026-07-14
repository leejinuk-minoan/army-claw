# Task 036-B1/B2 Local Implementation and Formal Verification Brief

## Start condition

```text
branch: agent/task036-hwp-hwpx-template-fidelity-selector-execution-bridge
approved Task 036-A2 content baseline parent: 63f27311570026e35b1c17329c8544535439098a
required start HEAD: use the Task 036-A2 final state-sync commit SHA reported externally by the cloud agent
```

Stop if the branch HEAD differs from the externally reported Task 036-A2 final state-sync SHA, if the content baseline is not an ancestor, or if another worker has written to the branch.

A commit cannot embed its own SHA in its content. Therefore the final state-sync SHA is authoritative only when supplied in the cloud agent final report and matched against the remote branch HEAD.

## Objective
Implement and verify the four-selector HWP/HWPX template-fidelity plan and execution bridge using only local fixtures and temporary workspaces.

## Task 036-B1 — implementation baseline
- Extend `tools/hancom/army-claw-hancom-tools.mjs` without regressing existing template-fidelity behavior.
- Implement `paragraph_text`, `contains_text`, `nth_paragraph`, and `table_cell_text` resolution.
- Resolve all selectors against the unchanged template before mutation and block duplicate IDs, zero match, ambiguity, occurrence overflow, source mismatch, non-anchor merged cells, and overlapping targets.
- Preserve first-run style, paragraph/cell/table structure, BinData, package entry set, and unselected content.
- Synchronize `Preview/PrvText.txt` when present; record `structurally_absent` when the entry is absent; block impossible mappings.
- Emit staged output and bridge links compatible with Task 031, Task 033, and Task 035.
- Register the Task 036 contract and samples in the official adapter validator. This integration is mandatory.
- Add mandatory validator tests for positive plans, bridge samples, error definitions, negative cases, and the Task 036 sample registry.
- Commit a fixed implementation baseline. Do not create final `LOCAL_EXECUTION_RESULT.json` before this commit exists.

## Task 036-B2 — formal verification and immutable evidence
Start from the fixed B1 implementation SHA. Run JSON parse, Node syntax checks, existing and new Node tests, official adapter validator CLI, validator unittests, selector fixtures, package-entry diff, BinData hashes, structure counts, preview checks, and Task 031/033/035 integration scenarios. Record exact commands, stdout/stderr, exit codes, test counts, hashes, implementation SHA, and formal evidence commit SHA.

Distinguish field-shape compatibility from actual temporary-root execution for Task 031 staged output, Task 033 evidence manifest, and Task 035 controlled promotion.

## Gate
Task 036-B cannot pass while official validator registration or validator tests are missing. After successful B2, `adapter_validator_gate_status` must no longer be `required_not_run`.

## Safety
Use fixture HWPX and temporary test workspaces only. Do not overwrite source templates, mutate user workspace, promote to production, access public internet, install dependencies, declare Stage 2, or select a final HWPX core. Report Hancom COM or native-open checks exactly as performed.

## Deliverables
Create immutable evidence, completed `LOCAL_EXECUTION_RESULT.json`, a Task 036-B report, and separate implementation/evidence commits without modifying Task 036-A/A2 cloud evidence.

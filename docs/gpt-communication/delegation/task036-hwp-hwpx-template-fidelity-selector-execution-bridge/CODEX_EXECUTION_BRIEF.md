# Task 036-B Local Implementation and Verification Brief

## Start condition
Start from the exact Task 036-A cloud package commit reported by the cloud agent on branch `agent/task036-hwp-hwpx-template-fidelity-selector-execution-bridge`. Stop if HEAD differs or another worker has written to the branch.

## Objective
Implement and verify the four-selector HWP/HWPX template-fidelity plan and execution bridge using only local fixtures and temporary workspaces.

## Required implementation scope
- Extend `tools/hancom/army-claw-hancom-tools.mjs` without regressing existing template-fidelity behavior.
- Implement `paragraph_text`, `contains_text`, `nth_paragraph`, and `table_cell_text` resolution.
- Resolve every selector against the unchanged template before mutation; block duplicate IDs, ambiguity, occurrence overflow, source mismatch, non-anchor merged cells, and overlapping targets.
- Preserve first-run style, paragraph/cell/table structure, BinData, package entry set, and unselected content.
- Synchronize `Preview/PrvText.txt` or fail closed when required mapping is impossible.
- Emit staged output and bridge links compatible with Task 031, Task 033, and Task 035.
- Register the contract and samples in the official validator if required by implementation design.

## Verification
Run JSON parse, Node syntax checks, existing and new Node tests, selector resolution fixtures, package-entry diff, BinData hashes, table/paragraph counts, preview checks, and Task 031/033/035 link checks. Record exact commands, stdout/stderr, exit codes, test counts, and hashes.

## Safety
Use only fixture HWPX and temporary test workspaces. Do not overwrite source templates, mutate user workspace, promote to production, access public internet, install dependencies, declare Stage 2, or select a final HWPX core. Hancom COM or native-open checks are optional and must be reported truthfully.

## Deliverables
Create a completed `LOCAL_EXECUTION_RESULT.json`, immutable evidence files, a Task 036-B report, and commit them without modifying the Task 036-A cloud contract evidence.
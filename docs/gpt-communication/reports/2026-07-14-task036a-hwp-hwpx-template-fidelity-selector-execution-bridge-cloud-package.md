# Task 036-A — HWP/HWPX Template Fidelity Selector Execution Bridge Cloud Package

## Baseline
- Repository: `leejinuk-minoan/army-claw`
- Base branch: `main`
- Base SHA: `59fd64765a0fe50846ceb8cafa98d8c804a3088c`
- Branch: `agent/task036-hwp-hwpx-template-fidelity-selector-execution-bridge`
- Routing: `cloud_first_local_verify / cloud_delegable`

## Package
This phase adds the architecture boundary, machine-readable plan contract, four selector definitions, seven positive profiles, thirteen negative cases, Task 036-B delegation/result template, evidence guide, Task contract, Research Note, and governance-state synchronization.

## Selector and conflict policy
`paragraph_text` and `contains_text` use 1-based occurrence. `nth_paragraph` and table/cell coordinates use 0-based indexes. Table paragraphs are excluded from `top_level_paragraphs`; merged cells require anchor coordinates. Every selector resolves against the unchanged template before any mutation. Duplicate IDs, ambiguity, no match, overflow, source mismatch, non-anchor cells, and overlapping targets block execution.

## Preservation and preview
The contract permits text replacement only and requires source immutability, first-run style, paragraph/cell/table structure, BinData, package entries, unselected content, and document-layout structures to remain preserved. `Preview/PrvText.txt` synchronization is required when present; impossible mapping is blocking.

## Bridge
The defined sequence is `validated plan -> HWP adapter slot -> hwpx-template-fidelity-fill -> Task 031 staged output -> Task 033 evidence manifest -> Task 035 controlled promotion`. The bridge passes IDs, digests, selector resolution, staged output metadata, changed entries, and preservation evidence. It does not duplicate the linked contracts.

## Cloud validation truth
Static JSON syntax and path consistency were reviewed during authoring. No Node syntax/test command, adapter validator, Hancom COM, native app, HWP conversion, HWPX generation, staged write, filesystem mutation, or promotion was executed.

```text
node_tests_executed: false
actual_hwp_hwpx_generated: false
hancom_com_executed: false
user_workspace_mutation: false
production_promotion: false
public_internet_access: false
dependency_installation: false
adapter_validator_gate_status: required_not_run
```

## Status
Task 036-A cloud contract package is complete. Task 036 implementation, local verification, adapter-validator gate, and final master review remain incomplete. Task 036 final completion is not claimed. Stage 2 transition and final HWPX core selection remain prohibited.

Next: Task 036-B local implementation and verification from the final Task 036-A commit reported externally.
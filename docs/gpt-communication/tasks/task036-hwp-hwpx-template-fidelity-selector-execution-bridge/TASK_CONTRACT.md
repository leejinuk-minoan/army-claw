# Task 036 Contract — HWP/HWPX Template Fidelity Selector Execution Bridge

## Routing
- Overall: `cloud_first_local_verify`
- Task 036-A: `cloud_delegable`
- Task 036-B: `local_codex_required`
- Adapter validator gate: required
- Final master review: required

## Goal
Define and then locally implement a deterministic bridge from a validated HWP/HWPX template-fidelity fill plan to the existing `hwpx-template-fidelity-fill` engine, Task 031 staged output, Task 033 evidence manifest, and Task 035 controlled promotion.

## Selector contract
Supported selectors are `paragraph_text`, `contains_text`, `nth_paragraph`, and `table_cell_text`. Occurrence is 1-based; section/paragraph/table/row/column indexes are 0-based. Merged cells accept anchor coordinates only.

All selectors resolve against the unchanged template before mutation. Duplicate selector/operation IDs, zero or ambiguous matches, out-of-range indexes, source mismatch, non-anchor coordinates, and overlapping targets are blocking.

## Preservation and evidence
Only text replacement is supported. The source template, first-run style, paragraph/cell/table properties, BinData, package entry set, unselected content, page setup, headers/footers, captions, numbering, and approval/signature blocks must remain preserved. Preview synchronization is required when the preview entry exists. Evidence must distinguish hash/count verification, native-open verification, and visual review.

## Cloud phase completion
Task 036-A is complete only when architecture, machine contract, positive/negative samples, error policy, delegation package, evidence README, report, Research Note, and state/index synchronization exist. It does not modify implementation source or claim execution.

## Final completion
Task 036 remains incomplete until Task 036-B local implementation and verification and final master review pass. Stage 2 transition and final HWPX core selection remain prohibited.
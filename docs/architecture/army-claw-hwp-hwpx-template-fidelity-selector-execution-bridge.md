# Army Claw HWP/HWPX Template Fidelity Selector Execution Bridge

## Purpose
Army Claw is an offline/local-PC office document agent, not an HWPX-only generator. HWP/HWPX, HanCell, HanShow, and local_workspace remain first-class targets. Task 036 defines the first Stage-1 re-entry bridge from structured plans to the existing deterministic HWPX template-fidelity engine.

## Current MVP
The existing MVP supports one exact `paragraph_text` replacement over joined paragraph runs, preserves the first run style, preserves BinData and package structure, and synchronizes `Preview/PrvText.txt`. Multi-selector, `contains_text`, `nth_paragraph`, `table_cell_text`, and execution-chain integration remain local implementation work.

## Selector model
- `paragraph_text`: exact joined paragraph text; occurrence is 1-based.
- `contains_text`: case-sensitive substring by default; occurrence is 1-based.
- `nth_paragraph`: `section_index` and `paragraph_index` are 0-based; scope is `top_level_paragraphs`, excluding table-internal paragraphs.
- `table_cell_text`: `table_index`, `row`, and `column` are 0-based; merged cells require the anchor coordinate.

Every selector has a unique `selector_id`, default `expected_match_count=1`, and explicit ambiguity handling. Empty selectors and unknown selector types are blocked.

## Pre-resolution and conflict rule
All selectors are resolved against the unchanged template before any mutation. The bridge records matched section/paragraph/table/cell coordinates, match count, and before-text digest. Only after all targets resolve and conflicts are absent may operations execute in plan order. Duplicate IDs, zero matches, ambiguous matches, occurrence overflow, source mismatch, and overlapping targets are blocking.

## Preservation boundary
The engine may replace text only. It must preserve the source template, package entry set, BinData bytes, section/table counts, merged-cell topology, paragraph and first-run properties, unselected paragraphs/cells, page setup, headers/footers, captions, numbering, and approval/signature blocks. Hash/count checks are machine-verifiable; visual layout remains native-rendering or human-review evidence.

## Preview synchronization
Preview synchronization is required when `Preview/PrvText.txt` exists. It uses the same pre-resolved target identity and operation order. Missing or ambiguous preview mapping is blocking `hwp_preview_sync_failed`. A package without a preview entry may proceed only when the contract marks preview as structurally absent and records that fact.

## Execution bridge
`validated plan -> HWP adapter slot -> hwpx-template-fidelity-fill request -> staged output receipt -> Task 033 evidence manifest -> Task 035 controlled promotion`.
The bridge carries plan/operation IDs, selector resolution, template artifact/digest, staged artifact/path/digest/size, changed entries, and preservation validation. The LLM creates only the structured plan; it does not emit XML or CLI arguments.

## Task 031/033/035 integration
Task 036 references, rather than duplicates, `staged_artifact_id`, `staged_receipt_id`, `evidence_manifest_id`, and `promotion_authorization_id`. Cloud phase performs no staged write or promotion.

## Evidence model
Canonical plan serialization and selector-resolution results are deterministic. Evidence records before/after text digests, changed/unchanged/unexpected package entries, preservation checks, and preview status. Byte-for-byte HWPX determinism is not claimed because ZIP metadata may vary.

## Cloud/local split
Task 036-A supplies contracts, samples, error policy, and Task 036-B delegation. Task 036-B implements and verifies Node execution, fixtures, staged output, validator integration, and optional native-open evidence.

## Non-scope and restrictions
No arbitrary XML insertion, style-ID generation, BinData replacement, table reconstruction, section deletion, native commands, production promotion, Stage 2 declaration, or final HWPX core selection.
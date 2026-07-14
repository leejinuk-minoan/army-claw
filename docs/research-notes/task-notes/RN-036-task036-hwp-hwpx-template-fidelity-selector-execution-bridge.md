# RN-036 — Task 036 HWP/HWPX Template Fidelity Selector Execution Bridge

## Research axis
Deterministic selector plans and execution bridging for template-preserving HWP/HWPX generation.

## Boundary
Task 036 formalizes four selector types—exact paragraph text, contained text, indexed top-level paragraph, and indexed table anchor cell—and requires complete selector resolution before mutation. This prevents earlier replacements from changing later match results and makes ambiguity and target conflicts explicit.

## Preservation hypothesis
Template fidelity is treated as deterministic constrained editing rather than document regeneration. The plan permits text replacement only while preserving source bytes, package structure, BinData, merged-cell topology, formatting properties, and unselected content. Machine evidence and visual/native-rendering evidence remain distinct.

## Execution-chain contribution
The bridge reconnects HWP/HWPX generation to the verified local-workspace chain: Task 031 staged output, Task 033 evidence manifest, and Task 035 controlled promotion. It also preserves Army Claw's broader identity as an offline office-document agent with HWP/HWPX, HanCell, HanShow, and local_workspace as first-class targets.

## Task 036-A2 corrective sync
Task 036-A2 corrected error metadata, bridge cardinality, preview-absent evidence semantics, mandatory official validator integration, exact baseline recording rules, and the separation between B1 implementation and B2 formal evidence.

## Current status
`cloud_contract_package_corrected_pending_local_implementation`. No implementation, Node execution, HWPX generation, Hancom COM invocation, filesystem mutation, or production promotion is claimed. Task 036-B1/B2 local implementation and formal verification are required.

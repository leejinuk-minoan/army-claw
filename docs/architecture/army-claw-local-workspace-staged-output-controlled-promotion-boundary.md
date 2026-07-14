# Army Claw Local Workspace Staged Output Controlled Promotion Boundary

## Purpose
Task 035 defines a controlled promotion boundary from a Task 031 staged artifact and Task 033 evidence manifest into an approved temporary destination root. It does not authorize production or real user workspace promotion.

## Required chain
`staged artifact + evidence manifest + approved root + bound authorization + digest re-verification -> controlled promotion plan -> exclusive temporary placement -> promotion receipt`.

## Authorization
Authorization binds `authorization_id`, `artifact_id`, `manifest_id`, `approved_root_id`, destination relative path, and single-artifact/single-destination scope. Missing, wildcard, expired, conflicting, or reused authorization is blocked.

## Approved roots and paths
Destinations use an allowlisted root ID mapped by the runtime/test harness. Free-form absolute, UNC, drive-qualified, traversal, NUL/control-character, empty-segment, reserved-name, trailing-dot/space, Unicode-normalization, and casefold-collision paths are blocked. Source must remain inside the injected staged root and destination inside the injected approved root.

## Link/object safety
Symbolic links, junctions, reparse points, hardlinks, mount escape, and unsupported object-safety checks are blocking. Unsupported platforms fail closed with `unsupported_safety_check`.

## Manifest and digest linkage
Promotion verifies manifest existence, artifact membership, normalized source path, byte size, and lowercase SHA-256 over actual staged bytes. Temporary and final destination bytes are re-hashed. Digest verification is byte integrity only, not semantic office-document validation.

## Placement
Default policy is `overwrite_allowed=false`, exclusive create, no cross-volume copy, temporary file creation under the approved root, flush/fsync where supported, destination digest verification, no-overwrite atomic rename, final digest verification, and receipt creation. Existing destinations are blocked unless a trusted prior receipt exactly matches all bindings and yields `already_promoted`.

## Failure cleanup
Final destination is not created on failure; temporary output is removed; staged source is retained; existing destination remains unchanged. Cleanup failures are reported explicitly.

## Safety claims
Cloud phase performs no adapter invocation, sandbox write, promotion, filesystem mutation, user workspace mutation, file-content read, Hancom COM execution, native app execution, public internet access, dependency installation, or office artifact generation. Task 035-B may mutate only isolated temporary test roots and must report that mutation truthfully.

## Non-scope
No production destination, user account/auth server, administrator privilege, existing-file replacement, native application automation, HWP/HWPX/HanCell/HanShow generation, Stage 2 transition, or final HWPX core selection is included.

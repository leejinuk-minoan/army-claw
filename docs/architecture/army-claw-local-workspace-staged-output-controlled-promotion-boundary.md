# Army Claw Local Workspace Staged Output Controlled Promotion Boundary

## Purpose
Task 035 defines a controlled promotion boundary from a Task 031 staged artifact and Task 033 evidence manifest into an approved temporary destination root. It does not authorize production or real user workspace promotion.

## Required chain
`staged artifact + evidence manifest + approved root + bound authorization + digest re-verification -> controlled promotion plan -> exclusive temporary placement -> promotion receipt`.

## Authorization
Authorization binds `authorization_id`, `artifact_id`, `manifest_id`, `approved_root_id`, destination relative path, and single-artifact/single-destination scope. Missing, wildcard, expired, conflicting, or reused authorization is blocked.

## Approved roots and paths
Destinations use an allowlisted root ID mapped by the runtime/test harness. Free-form absolute, UNC, drive-qualified, traversal, NUL/control-character, empty-segment, reserved-name, trailing-dot/space, and Unicode-normalization paths are blocked. Source must remain inside the injected staged root and destination inside the injected approved root. Raw injected roots are inspected before `resolve()`: staged root symlink, approved root symlink, root reparse point, missing root, non-directory root, and root inspection failure all fail closed. Lexical path components are inspected before resolving containment, so symlink and reparse components cannot be hidden by `resolve()`.

Casefold collision is a sibling policy, not a repeated-segment policy. `AA/aa/report.md` is not blocked merely because two path segments have the same casefold value. `Reports/Report.md` followed by requested `Reports/report.md` is blocked as `destination_case_collision`.

## Link/object safety
Symbolic links, junctions, reparse points, hardlinks, mount escape, and unsupported object-safety checks are blocking. Unsupported platforms fail closed with `unsupported_safety_check`.

## Manifest and digest linkage
Promotion requires the canonical Task 033 staged-output evidence manifest, either as the whole response object or as its inner `manifest` object. It validates `execution_mode=staged_output_evidence_manifest`, `sandbox_scope=true`, validation flags, canonical artifact fields (`digest_algorithm`, `digest_value`, `receipt_id`, `sandbox_only`, `promotion_status`), receipt existence, and `artifact_evidenced_by_receipt` relationships (`source_id`/`target_id`). Temporary and final destination bytes are re-hashed. Digest verification is byte integrity only, not semantic office-document validation.

## Placement
Default policy is `overwrite_allowed=false`, exclusive create, no cross-volume copy, operation-owned temporary file creation under the approved destination parent, flush/fsync where supported, destination digest verification, no-overwrite hard-link commit, final digest verification, and receipt creation. External or pre-existing hardlinked staged sources are prohibited. The operation-owned transient link is permitted only as the no-overwrite commit primitive. Existing destinations are blocked unless a trusted prior receipt exactly matches all bindings and yields `already_promoted`.

## Failure cleanup
Final destination is not retained on failure when it was created by the current operation; temporary output is removed when possible; staged source is retained unconditionally and never mutated by the executor. Cleanup is best-effort and multi-step: a temp cleanup failure must not prevent final cleanup, and a final cleanup failure must not prevent temp cleanup. Pre-existing destination files are never cleanup targets and must retain their original bytes. Failure responses report independent evidence for `temporary_path_cleaned`, `final_path_cleaned`, `cleanup_attempted`, `cleanup_complete`, `cleanup_error_codes`, and `original_error_code`. Expected filesystem `OSError` paths such as directory listing, source read/hash/stat, temp create/write/hash/stat, final hash/stat, hard-link commit, and temp/final unlink failures return structured blocking responses instead of traceback escape.

## Safety claims
Cloud phase performs no adapter invocation, sandbox write, promotion, filesystem mutation, user workspace mutation, file-content read, Hancom COM execution, native app execution, public internet access, dependency installation, or office artifact generation. Task 035-B may mutate only isolated temporary test roots and must report that mutation truthfully.

## Non-scope
No production destination, user account/auth server, administrator privilege, existing-file replacement, native application automation, HWP/HWPX/HanCell/HanShow generation, Stage 2 transition, or final HWPX core selection is included.

# RN-035 — Local Workspace Staged Output Controlled Promotion Boundary

## Research axis
Safety architecture for promoting manifest-linked staged bytes into an explicitly authorized, allowlisted destination without granting arbitrary filesystem authority.

## Task 035-A2L contribution
The implementation package adds a public `promote_staged_output` boundary in the local workspace adapter, controlled-promotion sample profiles in the official adapter validator, error taxonomy integration, validation matrix/checklist synchronization, and temporary-root unit tests for positive and negative promotion behavior.

The implementation treats `receipt.safety_assertions` as the canonical safety source of truth and requires any top-level mirror to match. It blocks external/pre-existing hardlinked sources, symlink/reparse paths, destination overwrite, cross-volume promotion, authorization mismatch, manifest mismatch, and unsupported filesystem safety checks. It uses an operation-owned temporary file plus exclusive no-overwrite link commit, then verifies source retention and final destination digest.

## Task 035-A2L-C correction
The corrective pass aligns controlled promotion with the canonical Task 033 staged-output evidence manifest. Both whole response and inner manifest inputs are accepted, and canonical fields such as `digest_algorithm`, `digest_value`, `receipt_id`, `sandbox_only`, `promotion_status`, `relationship_type`, `source_id`, and `target_id` are validated directly.

The correction also adds truthful failure execution audit flags, removes source mutation from source-change simulation, checks lexical components before resolve, makes reparse inspection fail closed, and changes casefold collision from repeated path segment matching to real sibling collision detection.

## Task 035-A2L-C2 correction
The second corrective pass closes the raw root boundary and post-commit cleanup gaps. Injected staged and approved roots are checked before `resolve()`, root symlink/reparse points are blocked, and root inspection failure returns structured `unsupported_safety_check` evidence.

Cleanup now records temp and final paths independently. A failure after final creation attempts operation-created final cleanup and temp cleanup without early return, never treats a pre-existing destination as a cleanup target, preserves the source bytes, and reports cleanup evidence through `temporary_path_cleaned`, `final_path_cleaned`, `cleanup_attempted`, `cleanup_complete`, `cleanup_error_codes`, and `original_error_code`.

Expected filesystem errors for directory listing, source read/hash/stat, temp creation/write/hash/stat, final hash/stat, commit, and unlink operations are converted to structured blocking responses in the covered unit tests.

## Claimable scope
The package now supports a Task 035-B local verification gate claim for controlled promotion policy, validator integration, temporary-root unit-test behavior, Task 033 whole/inner manifest promotion, raw root safety, cleanup state-machine behavior, and structured filesystem error handling.

## Non-claimable scope
No production promotion, real user workspace mutation, native office application execution, semantic office-document validation, Hancom COM integration, Stage 2 readiness, final HWPX core selection, or final Task 035 completion is established. Final Task 035 completion remains pending master review.

## Task 035-B formal local verification
Formal local verification was recorded for implementation SHA `e7c91119771ad9e75262ee946ad648b674157472`. The official validator reported `valid` with 383 total checks, 383 passed, 0 failed, and 0 blocked. Adapter validator unittest ran 22 tests OK. Local workspace adapter unittest ran 97 tests OK with two Windows symlink privilege-dependent skips. Formal controlled-promotion scenarios passed 15 of 15.

## Status
`local_verification_complete_pending_master_review`.

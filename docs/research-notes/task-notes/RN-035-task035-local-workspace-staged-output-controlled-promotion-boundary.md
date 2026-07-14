# RN-035 — Local Workspace Staged Output Controlled Promotion Boundary

## Research axis
Safety architecture for promoting manifest-linked staged bytes into an explicitly authorized, allowlisted destination without granting arbitrary filesystem authority.

## Task 035-A2L contribution
The implementation package adds a public `promote_staged_output` boundary in the local workspace adapter, controlled-promotion sample profiles in the official adapter validator, error taxonomy integration, validation matrix/checklist synchronization, and temporary-root unit tests for positive and negative promotion behavior.

The implementation treats `receipt.safety_assertions` as the canonical safety source of truth and requires any top-level mirror to match. It blocks external/pre-existing hardlinked sources, symlink/reparse paths, destination overwrite, cross-volume promotion, authorization mismatch, manifest mismatch, and unsupported filesystem safety checks. It uses an operation-owned temporary file plus exclusive no-overwrite link commit, then verifies source retention and final destination digest.

## Task 035-A2L-C correction
The corrective pass aligns controlled promotion with the canonical Task 033 staged-output evidence manifest. Both whole response and inner manifest inputs are accepted, and canonical fields such as `digest_algorithm`, `digest_value`, `receipt_id`, `sandbox_only`, `promotion_status`, `relationship_type`, `source_id`, and `target_id` are validated directly.

The correction also adds truthful failure execution audit flags, removes source mutation from source-change simulation, checks lexical components before resolve, makes reparse inspection fail closed, and changes casefold collision from repeated path segment matching to real sibling collision detection.

## Claimable scope
The package supports an implementation-readiness claim for controlled promotion policy, validator integration, and temporary-root unit-test behavior. Formal Task 035-B evidence is still required before final Task 035 completion.

## Non-claimable scope
No production promotion, real user workspace mutation, native office application execution, semantic office-document validation, Hancom COM integration, Stage 2 readiness, or final HWPX core selection is established.

## Status
`implementation_corrected_pending_formal_local_verification`.

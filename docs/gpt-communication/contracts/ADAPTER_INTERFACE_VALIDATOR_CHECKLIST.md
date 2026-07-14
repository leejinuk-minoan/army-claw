# Adapter Interface Validator Checklist

Use this checklist before implementing or accepting adapter-related validation work.

## 1. Contract files

- [ ] contract file exists
- [ ] error taxonomy file exists
- [ ] validation matrix exists
- [ ] validator checklist exists

## 2. Samples

- [ ] request sample exists
- [ ] response sample exists
- [ ] negative sample exists
- [ ] JSON syntax valid

## 3. Request validation

- [ ] supported target valid
- [ ] adapter slot valid
- [ ] plan type valid
- [ ] target/slot/plan mapping valid
- [ ] template_reference exists
- [ ] constraints.prevent_source_overwrite is true
- [ ] constraints.allow_public_internet is false
- [ ] LLM direct file edit blocked
- [ ] native app state direct modification blocked

## 4. Response validation

- [ ] proof mode respected
- [ ] actual_adapter_invoked is false in proof
- [ ] execution_allowed is false in proof
- [ ] output_artifacts do not claim real generated documents in proof
- [ ] validation_result exists
- [ ] evidence exists
- [ ] warnings exist

## 5. Negative sample validation

- [ ] public internet dependency blocked
- [ ] source overwrite blocked
- [ ] LLM direct file edit blocked
- [ ] native app state direct modification blocked
- [ ] expected error code present for negative sample
- [ ] expected error category present for negative sample

## 6. Controlled promotion validation

- [ ] controlled_promotion_request sample profile exists
- [ ] controlled_promotion_response sample profile exists
- [ ] controlled_promotion_negative sample profile exists
- [ ] Task 035 request references Task 033 canonical manifest profile
- [ ] Task 033 artifact field names are validated: artifact_id, normalized_relative_path, byte_size, digest_algorithm, digest_value, receipt_id, sandbox_only, promotion_status
- [ ] Task 033 relationship field names are validated: relationship_type, source_id, target_id
- [ ] Task 033 whole response and inner manifest input forms are both accepted
- [ ] receipt.safety_assertions is the canonical safety source of truth
- [ ] top-level safety_assertions mirror receipt.safety_assertions exactly when present
- [ ] negative controlled promotion samples include expected failure read/mutation flags
- [ ] authorization is bound to exactly one artifact and one destination
- [ ] manifest linkage is verified before promotion
- [ ] source/destination SHA-256 and byte size are re-verified
- [ ] destination overwrite is blocked
- [ ] cross-volume promotion is blocked
- [ ] symlink, external hardlink, and reparse point paths are blocked
- [ ] unsupported filesystem safety checks fail closed
- [ ] injected raw staged root is checked before resolve
- [ ] injected raw approved root is checked before resolve
- [ ] root symlink and root reparse point are prohibited
- [ ] root inspection failure fails closed with structured evidence
- [ ] post-commit failure cleanup attempts temp and final cleanup independently
- [ ] operation-created final is removed on failed promotion when cleanup succeeds
- [ ] pre-existing destination is never treated as cleanup target
- [ ] cleanup evidence fields include temp/final cleaned flags, cleanup_attempted, cleanup_complete, cleanup_error_codes, and original_error_code
- [ ] expected filesystem OSError paths return structured blocking responses
- [ ] validator total checks remain greater than or equal to 378 after Task 035-A2L-C2 integration

## 7. Scope safety

- [ ] no production code changed
- [ ] no release/test-documents changed
- [ ] no validator implementation claimed without executable code and evidence
- [ ] no actual adapter invocation claimed
- [ ] no local Hancom COM execution claimed
- [ ] no Stage 2 transition declared
- [ ] no final HWPX core selected

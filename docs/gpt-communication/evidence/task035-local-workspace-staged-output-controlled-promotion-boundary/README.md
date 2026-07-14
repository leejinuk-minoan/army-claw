# Task 035 Evidence Directory

This directory is reserved for Task 035-B local verification evidence. Task 035-A2L adds the implementation and validator integration but still does not create the formal `LOCAL_EXECUTION_RESULT.json`.

Task 035-B evidence must distinguish:

- temporary-root controlled promotion actual filesystem mutation
- temporary-root file-content read used for SHA-256 verification
- no user workspace or production promotion
- no Hancom COM, native office execution, public internet, dependency installation, or real office artifact generation
- external or pre-existing hardlinked staged source prohibition
- operation-owned transient link commit as the only conditionally permitted hard-link use
- unsupported filesystem safety checks failing closed
- canonical Task 033 whole-response and inner-manifest compatibility
- failure response read/mutation flags matching the actual execution audit
- lexical source/destination component checks before resolved containment checks
- sibling-only casefold collision detection
- raw staged root and raw approved root inspection before `resolve()`
- staged/approved root symlink and reparse point blocking
- root inspection failure returning `unsupported_safety_check`
- post-commit failure cleanup attempting temp and operation-created final cleanup independently
- operation-created final removal on failed promotion when cleanup succeeds
- pre-existing destination preservation and exclusion from cleanup targets
- structured blocking responses for expected filesystem `OSError` paths
- cleanup evidence fields for temp/final cleaned state, cleanup attempted/completion, cleanup errors, and original error code

Expected evidence includes validator CLI stdout/stderr/exit code, adapter validator unittest stdout/stderr/exit code, local workspace adapter unittest stdout/stderr/exit code, Python version, final git status, isolated temporary-root promotion evidence, source/temporary/final digest results, authorization and manifest-link checks, exclusive-create result, cleanup result, and final safety assertions.

Evidence must not include real user workspace content. Existing evidence must not be rewritten after final review.

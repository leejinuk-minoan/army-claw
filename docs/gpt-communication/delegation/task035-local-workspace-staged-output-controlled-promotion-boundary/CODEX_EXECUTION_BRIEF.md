# Task 035-B Local Verification Brief

## Scope
Verify the Task 035-A controlled promotion cloud package on branch `agent/task035-local-workspace-staged-output-controlled-promotion-boundary` after confirming the assigned cloud package commit SHA.

## Required commands
```powershell
python tools/validators/adapter_interface_validator.py --repo-root . --format json
python -m unittest discover -s tests/adapter_interface_validator -p "test_*.py"
python -m unittest discover -s tests/local_workspace_adapter -p "test_*.py"
python --version
git status --short
```

## Required local behavior
Use only `tempfile` or an equivalent isolated test staged root and approved destination root. Positive promotion must report `controlled_test_promotion_performed=true`, `actual_file_system_mutation_performed=true`, `user_workspace_file_system_mutation_performed=false`, and `production_promotion_performed=false`. Verify authorization binding, manifest linkage, source/temporary/final SHA-256, byte size, exclusive create, no-overwrite placement, source retention, and cleanup.

Task 035-A2L implementation uses an operation-owned temporary file in the destination parent and a no-overwrite hard-link commit. External or pre-existing hardlinked staged sources are prohibited. The operation-owned transient link is conditionally permitted only as the exclusive commit primitive; unsupported platforms or unobservable safety checks must fail closed with `unsupported_safety_check`.

The positive local test is an isolated temporary-root promotion. It performs actual filesystem mutation and file-content reads only inside the controlled test roots. It is not a user workspace promotion, production promotion, Hancom COM operation, or real office artifact generation.

## Required evidence
Store stdout, stderr, exit codes, Python version, repository status, promotion test evidence, and safety assertions under `docs/gpt-communication/evidence/task035-local-workspace-staged-output-controlled-promotion-boundary/`. Create `LOCAL_EXECUTION_RESULT.json` from the template and a Task 035-B local verification report.

## Prohibited
No real user workspace access, production destination, existing user file overwrite, public internet, dependency installation, Hancom COM, native app execution, real office artifact generation, main merge, force push, Stage 2 declaration, or final HWPX core selection.

## Completion
Local evidence does not itself authorize final Task 035 completion. Master review remains required.

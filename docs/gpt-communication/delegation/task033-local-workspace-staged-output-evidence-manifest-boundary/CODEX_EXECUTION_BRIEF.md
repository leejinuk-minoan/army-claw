# Task 033-B Local Verification Brief

## Purpose

Verify the Task 033-A staged output evidence manifest cloud package locally. Task 033 final completion is prohibited until local evidence and master review exist.

## Repository

```text
repository: leejinuk-minoan/army-claw
branch: agent/task033-local-workspace-staged-output-evidence-manifest-boundary
cloud_package_base_sha: d19e7830b2112bacf60cc5c5b2a2c3e2b177d307
```

Confirm the assigned cloud package HEAD before execution.

## Required commands

```powershell
python -m json.tool docs/gpt-communication/contracts/local-workspace-staged-output-evidence-manifest-boundary.json > $null
python -m compileall tools/adapters/local_workspace_adapter.py tools/validators/adapter_interface_validator.py
python tools/validators/adapter_interface_validator.py --repo-root . --format json
python -m unittest discover -s tests/adapter_interface_validator -p "test_*.py"
python -m unittest discover -s tests/local_workspace_adapter -p "test_*.py"
python --version
git status --short
```

## Evidence

Write stdout, stderr, exit codes, Python version, and final repository status under:

```text
docs/gpt-communication/evidence/task033-local-workspace-staged-output-evidence-manifest-boundary/
```

Create `LOCAL_EXECUTION_RESULT.json` from the adjacent template and a Task 033-B local verification report.

## Required checks

- contract and all positive/negative samples parse as JSON;
- canonical serialization and timestamp exclusion rules are unambiguous;
- SHA-256 is computed over exact generated-content bytes;
- digest mismatch blocks validation;
- absolute path, traversal, duplicate normalized path, case collision, overwrite, and production path are blocked;
- artifact/receipt IDs and references are unique and complete;
- summary counts match arrays;
- cloud-only execution claims remain false;
- validator CLI and both unittest suites exit 0.

## Forbidden

Do not access real user paths, read real user file contents, write production/user workspace files, promote artifacts, invoke native apps or Hancom COM, access public internet, install dependencies, create CI, change release/test-documents, merge to main, force push, declare Stage 2, select a final HWPX core, or overwrite prior evidence.

If any command fails, preserve failure evidence and report it. Do not claim Task 033 completion.
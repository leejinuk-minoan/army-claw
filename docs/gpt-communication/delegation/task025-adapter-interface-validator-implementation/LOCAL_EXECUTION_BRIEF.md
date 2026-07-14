# Task 025-B Local Execution Brief

## 1. Start condition

Do not start local execution until master read-only verification assigns `local_execution_base_sha`.

Current value:

```text
local_execution_base_sha: null
```

## 2. Branch start

After approval:

```powershell
git fetch origin
git switch -c agent/task025b-adapter-interface-validator-local-verification <MASTER_APPROVED_LOCAL_EXECUTION_BASE_SHA>
```

## 3. Required commands

```powershell
python tools/validators/adapter_interface_validator.py --repo-root . --format json
python -m unittest discover -s tests/adapter_interface_validator -p "test_*.py"
```

Record stdout, stderr, and exit code for both commands.

## 4. Allowed local modification scope

Only if a command fails and only to minimally correct validator implementation or tests:

- `tools/validators/adapter_interface_validator.py`
- `tests/adapter_interface_validator/test_adapter_interface_validator.py`
- `docs/gpt-communication/reports/2026-07-09-task025b-adapter-interface-validator-local-verification.md`

Do not modify contracts or samples unless a new cloud contract correction is approved.

## 5. Forbidden local actions

- Hancom COM execution
- actual adapter invocation
- HWP/HWPX/HanCell/HanShow document generation
- dependency installation unless separately approved
- package or lockfile modification
- release/test-documents modification
- existing `tools/hancom/**` modification
- main direct push
- force push
- Stage 2 declaration
- final HWPX core selection

## 6. Required local report

Create a local verification report containing:

- branch
- base SHA
- validator CLI command
- validator CLI stdout/stderr/exit code
- unittest command
- unittest stdout/stderr/exit code
- changed files, if any
- whether minimal correction was required
- remaining limitations

## 7. Pass condition

Task 025-B can be considered locally verified only if:

- validator CLI exits 0;
- unittest exits 0;
- no forbidden path changed;
- no actual adapter or Hancom COM execution occurred.

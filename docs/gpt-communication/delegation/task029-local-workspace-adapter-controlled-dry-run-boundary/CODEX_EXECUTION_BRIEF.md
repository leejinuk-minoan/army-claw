# Task 029-B Local Execution Brief — Local Workspace Adapter Controlled Dry-Run Boundary

## 1. Start condition

Do not start local verification until master review approves this cloud branch as the local execution base.

Cloud package branch:

```text
agent/task029-local-workspace-adapter-controlled-dry-run-boundary
```

## 2. Required local verification commands

Run exactly these commands from repository root and record stdout, stderr, and exit code.

```powershell
python tools/validators/adapter_interface_validator.py --repo-root . --format json
python -m unittest discover -s tests/adapter_interface_validator -p "test_*.py"
python -m unittest discover -s tests/local_workspace_adapter -p "test_*.py"
python --version
git status --short
```

## 3. Required evidence path

```text
docs/gpt-communication/evidence/task029-local-workspace-adapter-controlled-dry-run-boundary/
```

Expected evidence files:

```text
validator_cli_stdout.json
validator_cli_stderr.txt
validator_cli_exit_code.txt
adapter_validator_unittest_stdout.txt
adapter_validator_unittest_stderr.txt
adapter_validator_unittest_exit_code.txt
local_workspace_adapter_unittest_stdout.txt
local_workspace_adapter_unittest_stderr.txt
local_workspace_adapter_unittest_exit_code.txt
python_version.txt
python_version_stderr.txt
repo_status_after.txt
repo_status_after_stderr.txt
```

## 4. LOCAL_EXECUTION_RESULT.json

After local verification, create:

```text
docs/gpt-communication/delegation/task029-local-workspace-adapter-controlled-dry-run-boundary/LOCAL_EXECUTION_RESULT.json
```

Use the template in this directory.

## 5. Pass condition

Task 029-B can pass only if:

```text
validator_cli_exit_code = 0
adapter_validator_unittest_exit_code = 0
local_workspace_adapter_unittest_exit_code = 0
validator_summary_status = valid
dry_run_adapter_boundary_evaluated = true
actual_adapter_invoked = false
actual_file_system_mutation_performed = false
local_hancom_com_executed = false
real_hwp_hwpx_hancell_hanshow_artifact_generated = false
```

## 6. Forbidden actions

Do not:

- create, modify, copy, delete, or inspect real local workspace files;
- implement production filesystem mutation;
- invoke Hancom COM;
- generate real HWP/HWPX/HanCell/HanShow artifacts;
- install dependencies;
- modify dependency or lock files;
- modify release/test-documents;
- create CI or GitHub Actions;
- declare Stage 2;
- select final HWPX core;
- merge to main;
- force push.

## 7. Local report

Create local verification report:

```text
docs/gpt-communication/reports/2026-07-10-task029b-local-workspace-adapter-controlled-dry-run-boundary-local-verification.md
```

The report must include the commands, stdout/stderr/exit-code evidence paths, safety confirmation, and completion gate decision.

# Task 031-B Local Verification Brief

## 1. Purpose

Verify the Task 031-A staged output boundary cloud package locally.

Task 031-A changes adapter code and local workspace adapter tests, so adapter validator gate evidence is required before final Task 031 completion.

## 2. Repository and branch

```text
repository: leejinuk-minoan/army-claw
cloud_package_branch: agent/task031-local-workspace-staged-output-boundary
cloud_package_base_sha: b3b4c4155645f4740fac0b042611eeb5a814eb9c
local_execution_branch: agent/task031-local-workspace-staged-output-boundary
```

Before execution, confirm the local branch HEAD matches the cloud package commit assigned by master review.

## 3. Required commands

Run only these commands for Task 031-B local verification:

```powershell
python tools/validators/adapter_interface_validator.py --repo-root . --format json
python -m unittest discover -s tests/adapter_interface_validator -p "test_*.py"
python -m unittest discover -s tests/local_workspace_adapter -p "test_*.py"
python --version
git status --short
```

## 4. Evidence path

Record stdout, stderr, exit code, Python version, and final repository status under:

```text
docs/gpt-communication/evidence/task031-local-workspace-staged-output-boundary/
```

Expected files:

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

## 5. Required result file

After execution, create or update:

```text
docs/gpt-communication/delegation/task031-local-workspace-staged-output-boundary/LOCAL_EXECUTION_RESULT.json
```

Use `LOCAL_EXECUTION_RESULT_TEMPLATE.json` as the structure.

## 6. Required local report

Create:

```text
docs/gpt-communication/reports/2026-07-10-task031b-local-workspace-staged-output-boundary-local-verification.md
```

## 7. Pass criteria

Final Task 031 completion cannot be claimed unless all are true:

```text
validator_cli_exit_code=0
adapter_validator_unittest_exit_code=0
local_workspace_adapter_unittest_exit_code=0
validator_summary_status=valid
staged_output_boundary_evaluated=true
staged_output_sandbox_write_performed=true
actual_adapter_invoked=false
actual_file_system_mutation_performed=false
user_workspace_file_system_mutation_performed=false
file_content_read_performed=false
local_hancom_com_executed=false
real_hwp_hwpx_hancell_hanshow_artifact_generated=false
```

## 8. Forbidden local actions

Do not:

- create, modify, copy, delete, move, or mutate real user workspace files;
- read real user workspace file contents;
- promote staged output to a real user workspace destination;
- invoke Hancom COM;
- generate real HWP/HWPX/HanCell/HanShow artifacts;
- access public internet;
- install dependencies;
- create CI or GitHub Actions;
- modify Task 030 evidence or LOCAL_EXECUTION_RESULT.json;
- declare Stage 2;
- select final HWPX core;
- merge to main;
- force push.

## 9. Failure handling

If any command fails, record the failure evidence and stop. Do not claim completion. Only minimal fixes inside Task 031 allowed scope may be proposed after review.

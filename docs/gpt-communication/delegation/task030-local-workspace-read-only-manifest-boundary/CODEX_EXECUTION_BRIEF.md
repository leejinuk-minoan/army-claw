# Task 030-B Local Verification Brief

## 1. Purpose

Verify the Task 030-A read-only manifest boundary cloud package locally.

Task 030-A changed adapter code and local workspace adapter tests, so adapter validator gate evidence is required before final Task 030 completion.

## 2. Repository and branch

```text
repository: leejinuk-minoan/army-claw
cloud_package_branch: agent/task030-local-workspace-read-only-manifest-boundary
cloud_package_base_sha: 090e8b0411a9ed72b0dabb4d850b84603183edc8
local_execution_branch: agent/task030-local-workspace-read-only-manifest-boundary
```

Before execution, confirm the local branch HEAD matches the cloud package commit assigned by master review.

## 3. Required commands

Run only these commands for Task 030-B local verification:

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
docs/gpt-communication/evidence/task030-local-workspace-read-only-manifest-boundary/
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
docs/gpt-communication/delegation/task030-local-workspace-read-only-manifest-boundary/LOCAL_EXECUTION_RESULT.json
```

Use `LOCAL_EXECUTION_RESULT_TEMPLATE.json` as the structure.

## 6. Required local report

Create:

```text
docs/gpt-communication/reports/2026-07-10-task030b-local-workspace-read-only-manifest-boundary-local-verification.md
```

## 7. Pass criteria

Final Task 030 completion cannot be claimed unless all are true:

```text
validator_cli_exit_code=0
adapter_validator_unittest_exit_code=0
local_workspace_adapter_unittest_exit_code=0
validator_summary_status=valid
read_only_manifest_boundary_evaluated=true
actual_adapter_invoked=false
actual_file_system_mutation_performed=false
file_content_read_performed=false
local_hancom_com_executed=false
real_hwp_hwpx_hancell_hanshow_artifact_generated=false
```

## 8. Forbidden local actions

Do not:

- create, modify, copy, delete, move, or mutate real user workspace files;
- read real user workspace file contents;
- invoke Hancom COM;
- generate real HWP/HWPX/HanCell/HanShow artifacts;
- access public internet;
- install dependencies;
- create CI or GitHub Actions;
- modify Task 029 evidence or LOCAL_EXECUTION_RESULT.json;
- declare Stage 2;
- select final HWPX core;
- merge to main;
- force push.

## 9. Failure handling

If any command fails, record the failure evidence and stop. Do not claim completion. Only minimal fixes inside Task 030 allowed scope may be proposed after review.

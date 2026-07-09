# Task 028 Local Workspace Adapter Proof-Mode Skeleton — Local Verification Brief

## 1. Context

Repository: `leejinuk-minoan/army-claw`

Branch to verify:

```text
agent/task028-local-workspace-adapter-proof-mode-skeleton
```

Cloud package base SHA:

```text
10f95ef7a8f62d371d08aff8f0332fc30ee6384c
```

Cloud package includes a proof-mode `local_workspace` adapter skeleton and tests.

## 2. Local role

Run only the verification commands below. Do not broaden scope.

Do not invoke Hancom COM. Do not generate real HWP/HWPX/HanCell/HanShow artifacts. Do not create CI. Do not merge to main. Do not force push.

## 3. Required commands

From repository root, run:

```bash
python tools/validators/adapter_interface_validator.py --repo-root . --format json > docs/gpt-communication/evidence/task028-local-workspace-adapter-proof-mode-skeleton/validator_cli_stdout.json 2> docs/gpt-communication/evidence/task028-local-workspace-adapter-proof-mode-skeleton/validator_cli_stderr.txt
echo $? > docs/gpt-communication/evidence/task028-local-workspace-adapter-proof-mode-skeleton/validator_cli_exit_code.txt
```

Then run:

```bash
python -m unittest discover -s tests/adapter_interface_validator -p "test_*.py" > docs/gpt-communication/evidence/task028-local-workspace-adapter-proof-mode-skeleton/adapter_validator_unittest_stdout.txt 2> docs/gpt-communication/evidence/task028-local-workspace-adapter-proof-mode-skeleton/adapter_validator_unittest_stderr.txt
echo $? > docs/gpt-communication/evidence/task028-local-workspace-adapter-proof-mode-skeleton/adapter_validator_unittest_exit_code.txt
```

Then run:

```bash
python -m unittest discover -s tests/local_workspace_adapter -p "test_*.py" > docs/gpt-communication/evidence/task028-local-workspace-adapter-proof-mode-skeleton/local_workspace_adapter_unittest_stdout.txt 2> docs/gpt-communication/evidence/task028-local-workspace-adapter-proof-mode-skeleton/local_workspace_adapter_unittest_stderr.txt
echo $? > docs/gpt-communication/evidence/task028-local-workspace-adapter-proof-mode-skeleton/local_workspace_adapter_unittest_exit_code.txt
```

Also record:

```bash
python --version > docs/gpt-communication/evidence/task028-local-workspace-adapter-proof-mode-skeleton/python_version.txt
git status --short > docs/gpt-communication/evidence/task028-local-workspace-adapter-proof-mode-skeleton/repo_status_after.txt
```

## 4. Evidence requirements

Create or update:

```text
docs/gpt-communication/evidence/task028-local-workspace-adapter-proof-mode-skeleton/
docs/gpt-communication/delegation/task028-local-workspace-adapter-proof-mode-skeleton/LOCAL_EXECUTION_RESULT.json
docs/gpt-communication/reports/2026-07-10-task028b-local-workspace-adapter-proof-mode-local-verification.md
```

`LOCAL_EXECUTION_RESULT.json` must include:

```text
validator_cli_exit_code
adapter_validator_unittest_exit_code
local_workspace_adapter_unittest_exit_code
validator_summary_status
validator_total_checks
validator_passed_checks
validator_failed_checks
validator_blocked_checks
actual_adapter_invoked=false
actual_file_system_mutation_performed=false
local_hancom_com_executed=false
completion_gate_passed
```

## 5. Completion rule

Completion can be passed only if:

- validator CLI exit code is 0;
- adapter validator unittest exit code is 0;
- local workspace adapter unittest exit code is 0;
- no actual adapter invocation occurred;
- no real file-system mutation is claimed;
- no Hancom COM execution occurred.

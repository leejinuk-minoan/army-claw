# Task 033 Evidence Directory

This directory is reserved for Task 033-B local verification evidence.

Expected evidence:

```text
json_parse_stdout.txt
json_parse_stderr.txt
json_parse_exit_code.txt
python_compile_stdout.txt
python_compile_stderr.txt
python_compile_exit_code.txt
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

Task 033-A does not populate execution evidence. Evidence files and `LOCAL_EXECUTION_RESULT.json` must reflect real local commands and must not be rewritten after finalization. Controlled test-sandbox evidence must remain distinct from production or user-workspace mutation.
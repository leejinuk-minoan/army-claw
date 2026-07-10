# Task 030 — Local Workspace Read-Only Manifest Boundary

## 1. Task identity

```text
task_id: task030-local-workspace-read-only-manifest-boundary
title: Local Workspace Read-Only Manifest Boundary
repository: leejinuk-minoan/army-claw
branch: agent/task030-local-workspace-read-only-manifest-boundary
base_sha: 090e8b0411a9ed72b0dabb4d850b84603183edc8
routing_class: cloud_first_local_verify
local_agent_required_now: false
local_verification_required_later: true
```

## 2. Objective

Introduce a read-only manifest boundary after Task 029 controlled dry-run.

Task 030-A cloud package may update adapter source, tests, target-specific samples, architecture/contract documents, local verification package, report, Research Note, and status files.

Task 030-A must not claim final Task 030 completion.

## 3. Required behavior

Read-only manifest mode must require explicit markers:

```text
execution_context.execution_mode = read_only_manifest
execution_context.read_only_manifest = true
read_only = true
```

The adapter may evaluate deterministic metadata-only fixtures or safe test doubles in memory.

The adapter must not:

```text
create/modify/copy/delete/move/mutate files
read real user workspace file contents
follow symlinks outside approved scope
access public internet
invoke native applications
invoke Hancom COM
generate real HWP/HWPX/HanCell/HanShow artifacts
```

## 4. Adapter validator gate

```text
adapter_validator_gate_required: true
adapter_validator_gate_policy_path: docs/gpt-communication/contracts/adapter-validator-gate-policy.json
adapter_validator_integration_contract_path: docs/gpt-communication/contracts/adapter-validator-integration-contract.json
adapter_validator_evidence_schema_path: docs/gpt-communication/contracts/adapter-validator-evidence-schema.json
adapter_validator_gate_status: required_not_run
adapter_validator_evidence_path: docs/gpt-communication/evidence/task030-local-workspace-read-only-manifest-boundary/
validator_cli_exit_code: not_run
adapter_validator_unittest_exit_code: not_run
local_workspace_adapter_unittest_exit_code: not_run
validator_completion_gate_required: true
validator_completion_gate_passed: false
```

Reason: Task 030-A changes adapter code and tests, so local validator/unittest evidence is required.

## 5. Cloud phase scope

Allowed cloud changes:

```text
tools/adapters/local_workspace_adapter.py
tests/local_workspace_adapter/test_local_workspace_adapter.py
docs/gpt-communication/contracts/samples/local-workspace-adapter/read-only-manifest-*.json
docs/architecture/army-claw-local-workspace-read-only-manifest-boundary.md
docs/gpt-communication/contracts/local-workspace-read-only-manifest-boundary.json
docs/gpt-communication/delegation/task030-local-workspace-read-only-manifest-boundary/*
docs/gpt-communication/evidence/task030-local-workspace-read-only-manifest-boundary/README.md
docs/gpt-communication/reports/2026-07-10-task030a-local-workspace-read-only-manifest-boundary-cloud-package.md
docs/research-notes/task-notes/RN-030-task030-local-workspace-read-only-manifest-boundary.md
docs/research-notes/research-note-index.md
docs/research-notes/research-note-index.json
docs/gpt-communication/PROJECT_STATE.json
docs/gpt-communication/CURRENT.md
```

## 6. Forbidden changes

```text
- do not create, modify, copy, delete, move, or mutate real local workspace files
- do not read real user workspace file contents
- do not implement production filesystem mutation
- do not invoke Hancom COM
- do not generate real HWP/HWPX/HanCell/HanShow artifacts
- do not access public internet
- do not modify tools/validators/adapter_interface_validator.py unless absolutely necessary
- do not modify tests/adapter_interface_validator/test_adapter_interface_validator.py unless absolutely necessary
- do not modify Task 029 evidence
- do not modify Task 029 LOCAL_EXECUTION_RESULT.json
- do not modify Task 029 reports except by reference
- do not create CI or GitHub Actions
- do not modify dependency or lock files
- do not modify release/test-documents
- do not declare Stage 2
- do not select final HWPX core
- do not merge to main
- do not force push
- do not claim final Task 030 completion
- do not claim local verification passed
```

## 7. Required local verification commands

Task 030-B must run:

```powershell
python tools/validators/adapter_interface_validator.py --repo-root . --format json
python -m unittest discover -s tests/adapter_interface_validator -p "test_*.py"
python -m unittest discover -s tests/local_workspace_adapter -p "test_*.py"
python --version
git status --short
```

## 8. Completion gate

Final Task 030 completion requires:

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

## 9. Reporting requirement

Task 030-A report must state:

```text
adapter_validator_gate_status=required_not_run
completion_gate_passed=false
requires_local_verification=true
actual_adapter_invoked=false
actual_file_system_mutation_performed=false
file_content_read_performed=false
local_hancom_com_executed=false
real_hwp_hwpx_hancell_hanshow_artifact_generated=false
```

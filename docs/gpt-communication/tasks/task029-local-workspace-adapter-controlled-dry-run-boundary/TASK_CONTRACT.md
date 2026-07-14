# Task 029 — Local Workspace Adapter Controlled Dry-Run Boundary

## 1. Task identity

```text
task_id: task029-local-workspace-adapter-controlled-dry-run-boundary
title: Local Workspace Adapter Controlled Dry-Run Boundary
repository: leejinuk-minoan/army-claw
branch: agent/task029-local-workspace-adapter-controlled-dry-run-boundary
base_sha: 431c4fa28a5268d60c57d26d0e2e2f547e562452
routing_class: cloud_first_local_verify
local_agent_required_now: false
local_verification_required_later: true
```

## 2. Objective

Introduce the next boundary after Task 028 proof-mode skeleton: a controlled dry-run boundary for the `local_workspace` adapter.

The adapter may evaluate a validated `local_workspace_action_plan` in memory, canonicalize safe relative paths, and produce deterministic planned artifact descriptors and dry-run receipts.

## 3. Non-objectives

Task 029-A must not:

- claim final Task 029 completion;
- claim local verification passed;
- create, modify, copy, delete, or inspect real local workspace files;
- implement production filesystem mutation;
- invoke Hancom COM;
- generate real HWP/HWPX/HanCell/HanShow artifacts;
- create CI or GitHub Actions;
- declare Stage 2;
- select final HWPX core.

## 4. Cloud scope

Cloud phase may create or update:

- `tools/adapters/local_workspace_adapter.py`;
- `tests/local_workspace_adapter/test_local_workspace_adapter.py`;
- target-specific controlled dry-run samples;
- controlled dry-run architecture note;
- controlled dry-run machine contract;
- local verification delegation package;
- evidence directory marker;
- report and Research Note updates;
- project state and current state updates.

Cloud phase must not run commands or claim local execution evidence.

## 5. Controlled dry-run markers

Positive controlled dry-run request must include:

```text
execution_context.execution_mode = controlled_dry_run
execution_context.controlled_dry_run = true
dry_run = true
```

Missing or false markers must block the request.

## 6. Path and safety rules

The adapter must block:

- absolute path;
- `..` path traversal;
- backslash path;
- empty path segment;
- source overwrite;
- public internet requirement;
- LLM direct file edit;
- native app state modification;
- symlink escape claim without actual local proof.

## 7. Response boundary

Positive controlled dry-run response must include:

```text
status: controlled_dry_run_completed
execution_allowed: false
actual_adapter_invoked: false
dry_run_adapter_boundary_evaluated: true
actual_file_system_mutation_performed: false
output_artifacts: []
planned_output_artifacts: [...]
dry_run_operation_receipts: [...]
validation_result.valid: true
```

`planned_output_artifacts` are descriptors only, not real files.

## 8. Local scope

Task 029-B local phase must run:

```text
python tools/validators/adapter_interface_validator.py --repo-root . --format json
python -m unittest discover -s tests/adapter_interface_validator -p "test_*.py"
python -m unittest discover -s tests/local_workspace_adapter -p "test_*.py"
python --version
git status --short
```

Local phase must record stdout, stderr, exit code, Python version, and repository status evidence under:

```text
docs/gpt-communication/evidence/task029-local-workspace-adapter-controlled-dry-run-boundary/
```

## 9. Adapter validator gate

```text
adapter_validator_gate_required: true
adapter_validator_gate_policy_path: docs/gpt-communication/contracts/adapter-validator-gate-policy.json
adapter_validator_integration_contract_path: docs/gpt-communication/contracts/adapter-validator-integration-contract.json
adapter_validator_evidence_schema_path: docs/gpt-communication/contracts/adapter-validator-evidence-schema.json
adapter_validator_gate_status: required_not_run
adapter_validator_evidence_path: docs/gpt-communication/evidence/task029-local-workspace-adapter-controlled-dry-run-boundary/
validator_cli_exit_code: not_run
adapter_validator_unittest_exit_code: not_run
local_workspace_adapter_unittest_exit_code: not_run
validator_completion_gate_required: true
validator_completion_gate_passed: false
```

Reason:

Task 029-A changes adapter code and local workspace adapter tests. Therefore Task 026 gate policy requires later local verification.

## 10. Completion gate

Cloud package completion may be declared, but final Task 029 completion must not be declared until local verification evidence exists.

Final completion requires:

- validator CLI exit code 0;
- adapter validator unittest exit code 0;
- local workspace adapter unittest exit code 0;
- controlled dry-run boundary evaluated;
- no actual adapter invocation;
- no actual file-system mutation claimed;
- no Hancom COM execution;
- no real HWP/HWPX/HanCell/HanShow artifact generation;
- report and LOCAL_EXECUTION_RESULT.json updated.

## 11. Forbidden claims

Do not claim:

- production `local_workspace` adapter complete;
- real local files created, copied, modified, deleted, or inspected;
- real artifacts generated;
- actual adapter invoked;
- local verification passed before evidence exists;
- CI implemented;
- GitHub Actions created;
- Stage 2 entered;
- final HWP/HWPX core selected.

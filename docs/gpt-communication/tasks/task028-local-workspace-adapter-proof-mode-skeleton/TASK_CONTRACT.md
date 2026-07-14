# Task 028 — Local Workspace Adapter Proof-Mode Skeleton

## 1. Task identity

```text
task_id: task028-local-workspace-adapter-proof-mode-skeleton
title: Local Workspace Adapter Proof-Mode Skeleton
repository: leejinuk-minoan/army-claw
branch: agent/task028-local-workspace-adapter-proof-mode-skeleton
base_sha: 10f95ef7a8f62d371d08aff8f0332fc30ee6384c
routing_class: cloud_first_local_verify
local_agent_required: true
```

## 2. Objective

Add a proof-mode `local_workspace` adapter skeleton that validates request safety and returns a proof-mode response without performing real file-system mutation.

## 3. Cloud scope

Cloud phase may create:

- proof-mode adapter module;
- unit test source;
- proof-mode request and response samples;
- local verification delegation package;
- report and research note updates;
- project state updates.

Cloud phase must not run commands or claim local execution evidence.

## 4. Local scope

Local phase must run:

```text
python tools/validators/adapter_interface_validator.py --repo-root . --format json
python -m unittest discover -s tests/adapter_interface_validator -p "test_*.py"
python -m unittest discover -s tests/local_workspace_adapter -p "test_*.py"
```

Local phase must record stdout, stderr, exit code, Python version, and repository status evidence under:

```text
docs/gpt-communication/evidence/task028-local-workspace-adapter-proof-mode-skeleton/
```

## 5. Adapter validator gate

```text
adapter_validator_gate_required: true
adapter_validator_gate_policy_path: docs/gpt-communication/contracts/adapter-validator-gate-policy.json
adapter_validator_integration_contract_path: docs/gpt-communication/contracts/adapter-validator-integration-contract.json
adapter_validator_evidence_schema_path: docs/gpt-communication/contracts/adapter-validator-evidence-schema.json
adapter_validator_gate_status: required_not_run
adapter_validator_evidence_path: docs/gpt-communication/evidence/task028-local-workspace-adapter-proof-mode-skeleton/
validator_cli_exit_code: not_run
unittest_exit_code: not_run
validator_completion_gate_required: true
validator_completion_gate_passed: false
```

Reason:

Task 028 adds adapter proof-mode code and tests. Future completion requires actual validator and unittest evidence.

## 6. Completion gate

Cloud package completion may be declared, but final Task 028 completion must not be declared until local verification evidence exists.

Final completion requires:

- validator CLI exit code 0;
- adapter validator unittest exit code 0;
- local workspace adapter unittest exit code 0;
- no actual adapter invocation;
- no actual file-system mutation claimed;
- no Hancom COM execution;
- report and LOCAL_EXECUTION_RESULT.json updated.

## 7. Forbidden claims

Do not claim:

- production `local_workspace` adapter complete;
- real local files created;
- real artifacts generated;
- actual adapter invoked;
- local verification passed before evidence exists;
- CI implemented;
- GitHub Actions created;
- Stage 2 entered;
- final HWP/HWPX core selected.

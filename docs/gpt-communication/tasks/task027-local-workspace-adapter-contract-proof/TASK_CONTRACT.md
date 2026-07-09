# Task 027 — Local Workspace Adapter Contract Proof

## 1. Task identity

```text
task_id: task027-local-workspace-adapter-contract-proof
title: Local Workspace Adapter Contract Proof
repository: leejinuk-minoan/army-claw
branch: agent/task027-local-workspace-adapter-contract-proof
base_sha: 0a02e86ee5f89d72432c6f89676614953358f466
routing_class: cloud_delegable
local_agent_required: false
```

## 2. Objective

Define the target-specific `local_workspace` adapter contract as a proof-only architecture and machine-readable JSON contract.

The task must establish how future local workspace operations will be bounded by approved workspace roots, safe relative paths, no source overwrite, no public internet dependency, and evidence requirements.

## 3. Scope

In scope:

- local workspace adapter architecture contract;
- local workspace adapter machine-readable JSON contract;
- Task 027 report;
- RN-027 research note;
- research note index updates;
- project state updates.

Out of scope:

- production adapter implementation;
- actual file-system mutation;
- actual adapter invocation;
- common interface contract changes;
- validator source changes;
- validation matrix changes;
- proof-mode sample changes;
- negative sample changes;
- CI or GitHub Actions implementation;
- Hancom COM execution;
- Stage 2 transition;
- final HWP/HWPX core selection.

## 4. Adapter validator gate

```text
adapter_validator_gate_required: false
adapter_validator_gate_policy_path: docs/gpt-communication/contracts/adapter-validator-gate-policy.json
adapter_validator_integration_contract_path: docs/gpt-communication/contracts/adapter-validator-integration-contract.json
adapter_validator_evidence_schema_path: docs/gpt-communication/contracts/adapter-validator-evidence-schema.json
adapter_validator_gate_status: not_required
adapter_validator_evidence_path: none
validator_cli_exit_code: not_run
unittest_exit_code: not_run
validator_completion_gate_required: false
validator_completion_gate_passed: true
```

Reason:

Task 027 is a target-specific contract supplement only. It does not modify the common adapter interface contract, validator source, validation matrix, proof-mode samples, negative samples, or adapter implementation code, and it does not invoke an adapter.

Future local workspace implementation or execution tasks must set `adapter_validator_gate_required=true`.

## 5. Completion gate

Completion may be declared only if:

- no production code changed;
- no validator source changed;
- no unittest source changed;
- no common adapter interface sample changed;
- no validation matrix changed;
- no actual adapter invocation claimed;
- no actual file-system mutation claimed;
- no Hancom COM execution claimed;
- no Stage 2 transition declared;
- RN-027 and research note index are updated;
- project state records Task 027 and next work.

## 6. Required output files

```text
docs/architecture/army-claw-local-workspace-adapter-contract.md
docs/gpt-communication/contracts/local-workspace-adapter-contract.json
docs/gpt-communication/reports/2026-07-10-task027-local-workspace-adapter-contract-proof.md
docs/research-notes/task-notes/RN-027-task027-local-workspace-adapter-contract.md
docs/research-notes/research-note-index.md
docs/research-notes/research-note-index.json
docs/gpt-communication/PROJECT_STATE.json
docs/gpt-communication/CURRENT.md
```

## 7. Forbidden completion claims

Do not claim:

- `local_workspace` adapter implementation complete;
- actual local workspace files created;
- actual adapter invoked;
- actual validator executed in Task 027;
- CI implemented;
- GitHub Actions created;
- Stage 2 entered;
- final HWP/HWPX core selected.

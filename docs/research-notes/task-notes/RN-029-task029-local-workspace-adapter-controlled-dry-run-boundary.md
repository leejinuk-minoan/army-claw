# RN-029 — Task 029 Local Workspace Adapter Controlled Dry-Run Boundary

Status: `draft_pending_local_verification`

## 1. Research question

Can Army Claw advance from a proof-mode local workspace adapter skeleton to a controlled dry-run boundary while still preventing real file-system mutation, actual adapter invocation, and native application side effects?

## 2. System design claim

A controlled dry-run boundary can evaluate a validated `local_workspace_action_plan` in memory, canonicalize safe relative paths, and return deterministic planned artifact descriptors and dry-run receipts without granting production filesystem authority.

This creates the next staged adapter-development step:

```text
contract proof
→ proof-mode adapter skeleton
→ local verification
→ controlled dry-run boundary
→ future controlled execution
```

## 3. Method

Task 029-A cloud phase adds or updates:

- controlled dry-run behavior in `tools/adapters/local_workspace_adapter.py`;
- controlled dry-run unit tests in `tests/local_workspace_adapter/test_local_workspace_adapter.py`;
- target-specific controlled dry-run request/response/negative samples;
- controlled dry-run architecture note;
- machine-readable controlled dry-run boundary contract;
- Task 029-B local verification package;
- evidence directory marker;
- project state and current state updates.

The cloud phase does not run validator CLI, unittest, actual adapter invocation, local file-system mutation, Hancom COM, CI, or GitHub Actions.

## 4. Gate decision

Task 029-A changes adapter code and tests. Therefore Task 026 integration policy requires the adapter validator gate.

Current cloud phase status:

```text
adapter_validator_gate_required=true
adapter_validator_gate_status=required_not_run
completion_gate_passed=false
requires_local_verification=true
```

Final Task 029 completion must not pass until Task 029-B local verification evidence exists.

## 5. Expected local verification

The local agent must run:

```text
python tools/validators/adapter_interface_validator.py --repo-root . --format json
python -m unittest discover -s tests/adapter_interface_validator -p "test_*.py"
python -m unittest discover -s tests/local_workspace_adapter -p "test_*.py"
python --version
git status --short
```

## 6. Paper-ready interpretation

The Task 029 controlled dry-run boundary demonstrates a staged safety model for local workspace automation. Army Claw can evaluate a deterministic adapter boundary and return receipts for planned operations without immediately granting permission to create, inspect, copy, modify, or delete real workspace files.

This separates the concept of adapter-boundary evaluation from production filesystem mutation. The LLM remains restricted to structured plans, while the adapter enforces path, overwrite, internet, and evidence policies.

## 7. Limitations

Task 029-A is a cloud package only.

It does not:

- execute validator CLI;
- execute unittest;
- create, inspect, modify, copy, or delete local files;
- perform production local workspace mutation;
- invoke an actual adapter for real execution;
- invoke Hancom COM;
- generate real HWP/HWPX/HanCell/HanShow artifacts;
- create CI or GitHub Actions;
- declare Stage 2;
- select final HWPX core;
- pass final Task 029 completion gate.

## 8. Follow-up

Task 029-B — Local Workspace Adapter Controlled Dry-Run Boundary Local Verification is required.

Evidence path:

```text
docs/gpt-communication/evidence/task029-local-workspace-adapter-controlled-dry-run-boundary/
```

# RN-028 — Task 028 Local Workspace Adapter Proof-Mode Skeleton

## 1. Research question

Can Army Claw introduce a `local_workspace` adapter skeleton while preserving the architecture rule that the LLM only creates structured plans and adapters execute deterministically under evidence gates?

## 2. System design claim

A proof-mode `local_workspace` adapter can validate request envelopes and operation batches without performing any real file-system mutation.

This creates an intermediate step between contract-only design and production local workspace execution:

```text
contract proof
→ proof-mode adapter skeleton
→ local verification
→ future controlled execution
```

## 3. Method

Task 028 cloud phase adds:

- proof-mode adapter module: `tools/adapters/local_workspace_adapter.py`;
- unit test source: `tests/local_workspace_adapter/test_local_workspace_adapter.py`;
- target-specific proof request and response samples;
- local verification delegation package;
- local verification evidence directory marker.

The cloud phase does not run validator CLI, unittest, actual adapter invocation, or local file-system mutation.

## 4. Gate decision

Task 028 changes adapter proof-mode code and tests. Therefore Task 026 integration policy requires the adapter validator gate.

Current cloud phase status:

```text
adapter_validator_gate_required=true
adapter_validator_gate_status=required_not_run
completion_gate_passed=false
```

The final Task 028 completion gate must not pass until local verification evidence exists.

## 5. Expected local verification

The local agent must run:

```text
python tools/validators/adapter_interface_validator.py --repo-root . --format json
python -m unittest discover -s tests/adapter_interface_validator -p "test_*.py"
python -m unittest discover -s tests/local_workspace_adapter -p "test_*.py"
```

## 6. Paper-ready interpretation

The Task 028 proof-mode adapter skeleton demonstrates a staged adapter development pattern. Army Claw can introduce executable boundaries without immediately granting file-system mutation authority. The proof-mode adapter validates the shape and safety of planned operations, but blocks execution and returns evidence that no real artifact was created.

## 7. Limitations

Task 028 cloud phase does not prove runtime correctness.

It does not:

- execute validator CLI;
- execute unittest;
- create, modify, copy, or delete local files;
- invoke Hancom COM;
- generate office artifacts;
- implement production adapter execution;
- pass final Task 028 completion gate.

## 8. Follow-up

Task 028-B local verification is required. After local evidence is pushed, master review can determine whether Task 028 completion gate passes.

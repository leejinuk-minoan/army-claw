# Task 025-A Delegation Plan — Adapter Interface Validator Implementation

## 1. Phase

- task_id: `task025-adapter-interface-validator-implementation`
- phase: `task025a-cloud-implementation-package`
- routing_class: `cloud_first_local_verify`
- local_agent_required_now: `false`
- local_execution_allowed: `false`
- local_execution_base_sha: `null`

## 2. Purpose

Task 025-A prepares the implementation package for the adapter interface validator. It creates Python validator source, unittest source, and a local execution package. It does not execute the validator or tests.

## 3. Cloud outputs

- `tools/validators/adapter_interface_validator.py`
- `tests/adapter_interface_validator/test_adapter_interface_validator.py`
- `docs/gpt-communication/delegation/task025-adapter-interface-validator-implementation/`
- `docs/gpt-communication/reports/2026-07-09-task025a-adapter-interface-validator-cloud-implementation.md`
- `docs/research-notes/task-notes/RN-025A-task025a-adapter-interface-validator-cloud-implementation.md`

## 4. Local handoff rule

Task 025-B may start only after master read-only verification of the final cloud HEAD and explicit assignment of `local_execution_base_sha`.

## 5. Local verification goal

Task 025-B must run:

```powershell
python tools/validators/adapter_interface_validator.py --repo-root . --format json
python -m unittest discover -s tests/adapter_interface_validator -p "test_*.py"
```

The local worker must record stdout, stderr, and exit codes.

## 6. Stop conditions

Stop if:

- assigned base SHA does not match remote HEAD;
- validator CLI exits nonzero;
- unittest exits nonzero;
- dependency installation is requested;
- Hancom COM or real adapter execution is requested;
- forbidden paths need modification.

## 7. Completion status

Task 025-A does not complete Task 025 overall. Completion gate remains false until Task 025-B local verification passes.

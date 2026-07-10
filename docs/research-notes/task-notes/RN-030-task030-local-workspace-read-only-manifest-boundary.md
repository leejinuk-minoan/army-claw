# RN-030 — Task 030 Local Workspace Read-Only Manifest Boundary

Status: `draft_pending_local_verification`

## 1. Research question

Can Army Claw advance from controlled dry-run descriptors to a read-only manifest boundary while still preventing real file-system mutation, file content reads, actual adapter invocation, and native application side effects?

## 2. System design claim

A read-only manifest boundary can produce deterministic metadata-only workspace descriptors from approved fixtures or safe test doubles without granting production workspace inspection or mutation authority.

This creates the next staged adapter-development step:

```text
contract proof
→ proof-mode adapter skeleton
→ controlled dry-run boundary
→ read-only manifest boundary
→ future controlled local execution
```

## 3. Method

Task 030-A cloud phase added or updated:

- read-only manifest behavior in `tools/adapters/local_workspace_adapter.py`;
- read-only manifest unit tests in `tests/local_workspace_adapter/test_local_workspace_adapter.py`;
- target-specific read-only manifest request/response/negative samples;
- read-only manifest architecture note;
- machine-readable read-only manifest boundary contract;
- Task 030-B local verification package;
- evidence directory marker;
- project state and current state updates.

The cloud phase did not run validator CLI, unittest, actual adapter invocation, actual local workspace inspection, file content reading, local file-system mutation, Hancom COM, CI, or GitHub Actions.

## 4. Gate decision

Task 030-A changes adapter code and tests. Therefore Task 026 integration policy requires the adapter validator gate.

Current Task 030-A status:

```text
adapter_validator_gate_required=true
adapter_validator_gate_status=required_not_run
completion_gate_passed=false
final_task030_completion_gate_passed=false
requires_local_verification=true
```

## 5. Cloud package result

Task 030-A defines and packages the read-only manifest boundary.

Positive boundary behavior:

```text
status=read_only_manifest_completed
execution_allowed=false
actual_adapter_invoked=false
read_only_manifest_boundary_evaluated=true
actual_file_system_mutation_performed=false
file_content_read_performed=false
local_hancom_com_executed=false
real_hwp_hwpx_hancell_hanshow_artifact_generated=false
output_artifacts=[]
manifest={metadata-only deterministic descriptor}
manifest_receipts=[deterministic receipts]
```

## 6. Local verification required

Task 030-B must run:

```text
python tools/validators/adapter_interface_validator.py --repo-root . --format json
python -m unittest discover -s tests/adapter_interface_validator -p "test_*.py"
python -m unittest discover -s tests/local_workspace_adapter -p "test_*.py"
python --version
git status --short
```

## 7. Paper-ready interpretation

Task 030 extends Army Claw's staged local workspace safety model. The read-only manifest boundary separates metadata-only workspace description from real workspace inspection and mutation. This allows Army Claw to test manifest semantics, path safety, denied entry representation, and deterministic receipts before enabling any production file-system authority.

## 8. Limitations

Task 030-A is a cloud package only.

It does not:

- complete final Task 030;
- run validator CLI;
- run unittest;
- inspect a real user workspace;
- read real file contents;
- create, inspect, modify, copy, delete, move, or mutate local files;
- invoke an actual adapter for production execution;
- invoke Hancom COM;
- generate real HWP/HWPX/HanCell/HanShow artifacts;
- create CI or GitHub Actions;
- declare Stage 2;
- select final HWPX core.

## 9. Follow-up

Task 030-B — Local Workspace Read-Only Manifest Boundary Local Verification is required.

Recommended routing:

```text
local_codex_required
adapter_validator_gate_required=true
```

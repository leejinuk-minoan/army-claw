# Army Claw Local Workspace Controlled Dry-Run Boundary

## 1. Purpose

Task 029 defines the next boundary after Task 028 proof-mode skeleton verification.

Task 028 proved that the `local_workspace` adapter can validate a request envelope and return `blocked_in_proof` without actual execution. Task 029-A adds a controlled dry-run boundary that evaluates a validated `local_workspace_action_plan` in memory and returns deterministic receipts and planned output artifact descriptors.

This is still not production local workspace execution.

## 2. Controlled dry-run definition

Controlled dry-run means the local workspace adapter may:

- validate the common adapter request envelope;
- validate `target_id`, `adapter_slot_id`, and `plan_type` mapping;
- require explicit dry-run markers;
- validate approved workspace reference usage;
- canonicalize relative paths in memory;
- reject unsafe path patterns;
- produce deterministic dry-run receipts;
- produce planned output artifact descriptors.

It must not:

- create, modify, copy, delete, inspect, or mutate real workspace files;
- invoke Hancom COM;
- generate real HWP/HWPX, HanCell, or HanShow artifacts;
- access public internet;
- alter native application state;
- claim production adapter execution.

## 3. Required explicit markers

A controlled dry-run request must explicitly include:

```text
execution_context.execution_mode = controlled_dry_run
execution_context.controlled_dry_run = true
dry_run = true
```

The adapter must reject a request if any of these markers is absent or false.

## 4. Workspace root boundary

The approved workspace root must remain a reference. It must not be a free-form absolute path emitted by an LLM.

Allowed pattern:

```text
approved_workspace://<approved-id>
```

Forbidden examples:

```text
C:\Users\...
/tmp/workspace
~/workspace
```

## 5. Relative path safety

The controlled dry-run boundary must reject:

- absolute paths;
- `..` path traversal;
- backslash paths;
- empty path segments;
- source overwrite requests;
- public internet requirements;
- symlink escape claims without actual local proof.

The adapter may canonicalize safe POSIX-style relative paths in memory only.

## 6. Response boundary

A positive controlled dry-run response must distinguish dry-run evaluation from real execution.

Required response facts:

```text
status = controlled_dry_run_completed
execution_allowed = false
actual_adapter_invoked = false
dry_run_adapter_boundary_evaluated = true
actual_file_system_mutation_performed = false
output_artifacts = []
planned_output_artifacts = [ ... ]
dry_run_operation_receipts = [ ... ]
validation_result.valid = true
```

`planned_output_artifacts` are descriptors only. They are not files.

## 7. Error policy

Negative cases must return deterministic error envelopes using the existing common adapter error taxonomy where possible.

Examples:

| Case | Error code |
|---|---|
| path traversal / unsafe path | `template_reference_error` |
| source overwrite | `source_overwrite_blocked` |
| public internet requirement | `public_internet_dependency_blocked` |
| direct LLM file edit | `llm_direct_file_edit_blocked` |
| missing explicit dry-run marker | `constraint_violation` |
| symlink escape claim without proof | `evidence_missing` |

## 8. Determinism

Unit tests must not depend on wall-clock timestamps. Controlled dry-run responses should copy `created_at` from the request or use a fixed fixture timestamp.

## 9. Completion boundary

Task 029-A is only a cloud package.

Task 029 final completion requires Task 029-B local verification evidence:

- validator CLI exit code 0;
- adapter validator unittest exit code 0;
- local workspace adapter unittest exit code 0;
- no actual adapter invocation;
- no actual file-system mutation;
- no Hancom COM execution;
- no real HWP/HWPX/HanCell/HanShow artifact generation.

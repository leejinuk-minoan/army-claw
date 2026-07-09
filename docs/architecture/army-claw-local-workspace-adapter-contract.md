# Army Claw Local Workspace Adapter Contract

## 1. Purpose

This document defines the target-specific contract for the Army Claw `local_workspace` adapter.

The `local_workspace` adapter is the first non-Hancom adapter target. It represents safe file-workspace operations inside an approved local project folder, such as validating relative paths, preparing output folders, copying source artifacts to an output location, and writing generated text artifacts.

This is a contract proof only. It does not implement a production adapter, execute file-system operations, invoke Hancom COM, generate HWP/HWPX/HanCell/HanShow artifacts, create CI, or transition the project to Stage 2.

## 2. Architectural position

Army Claw remains a local/offline office automation agent. The LLM may generate only structured plans. It must not directly edit files, directly modify native application state, overwrite source artifacts, or depend on the public internet.

The `local_workspace` adapter sits under the Common Office Adapter Interface and uses:

- `target_id`: `local_workspace`
- `adapter_slot_id`: `local_workspace_adapter_slot`
- `plan_type`: `local_workspace_action_plan`
- template artifact type: `folder`

Unlike `hwp_hwpx`, `hancell`, and `hanshow`, this target does not require Hancom COM. It is still subject to the same adapter envelope, evidence, and no-overwrite constraints.

## 3. Scope

Task 027 defines the contract boundary for future implementation.

In scope:

- target identity and plan mapping confirmation;
- approved workspace boundary;
- path safety rules;
- allowed local workspace operation classes;
- request supplement requirements;
- response supplement requirements;
- error mapping policy;
- future validator and execution gate requirements.

Out of scope:

- production adapter implementation;
- actual local file-system mutation;
- actual adapter invocation;
- common interface schema changes;
- adapter validator source changes;
- validation matrix changes;
- proof-mode or negative sample changes;
- CI or GitHub Actions implementation;
- Hancom COM execution;
- HWP/HWPX, HanCell, or HanShow generation;
- Stage 2 transition.

## 4. Workspace boundary

A `local_workspace` request must identify an approved workspace root by reference, not by a free-form path emitted by the LLM.

The adapter implementation, when later authorized, must canonicalize and validate paths before any execution. The following must be blocked:

- absolute output paths not inside the approved workspace;
- `..` path traversal;
- symlink escape outside the approved workspace;
- source artifact overwrite;
- output path collision unless an explicit future policy allows versioned outputs;
- public internet dependency;
- direct LLM file editing;
- native application state modification.

## 5. Allowed operation classes

The contract permits these operation classes for future implementation:

| Operation class | Purpose | Execution status in Task 027 |
|---|---|---|
| `inspect_workspace_manifest` | Read a workspace manifest or declared metadata | not implemented |
| `validate_relative_path` | Validate that a relative path stays inside the workspace | not implemented |
| `create_output_directory` | Create a new output directory under an approved output root | not implemented |
| `write_generated_text_artifact` | Write generated Markdown, JSON, TXT, or other text artifact to an output path | not implemented |
| `copy_source_to_output` | Copy a source artifact to a new output path without overwriting the source | not implemented |
| `record_evidence_manifest` | Record what would be or was produced by the adapter | not implemented |

Task 027 defines these operation classes only. It does not execute them.

## 6. Request supplement

A future `local_workspace` request must use the Common Office Adapter Interface request envelope and must include a `validated_plan` suitable for `local_workspace_action_plan`.

The `validated_plan` should contain at least:

```text
plan_id
target_id=local_workspace
plan_type=local_workspace_action_plan
workspace_root_reference
operation_batch
path_policy
artifact_policy
evidence_policy
llm_direct_file_edit_requested=false
llm_direct_native_app_state_modification_requested=false
```

Each operation in `operation_batch` must declare:

```text
operation_id
operation_class
relative_input_path, if needed
relative_output_path, if needed
overwrite_existing=false
requires_public_internet=false
expected_artifact_type
```

## 7. Response supplement

A future adapter response must use the Common Office Adapter Interface response envelope.

For proof or dry-run contexts, the response must keep:

```text
execution_allowed=false
actual_adapter_invoked=false
output_artifacts=[]
evidence.proof_mode=true
```

For a later authorized execution task, the response may include generated artifact paths only when the task explicitly permits real adapter invocation and records local execution evidence.

## 8. Error mapping

The `local_workspace` adapter must map blocking cases to the existing common adapter error taxonomy where possible.

| Blocking case | Error code |
|---|---|
| schema or required field violation | `schema_validation_error` |
| target / plan mismatch | `target_plan_mismatch` |
| adapter slot mismatch | `adapter_slot_mismatch` |
| malformed workspace or template reference | `template_reference_error` |
| unsupported artifact type | `unsupported_template_artifact_type` |
| source overwrite attempt | `source_overwrite_blocked` |
| public internet dependency | `public_internet_dependency_blocked` |
| direct LLM file edit request | `llm_direct_file_edit_blocked` |
| unsupported operation class | `unsupported_operation` |
| evidence missing for claimed execution | `evidence_missing` |
| implementation failure after validation | `internal_adapter_error` |

## 9. Adapter validator gate decision for Task 027

Task 027 does not change the common adapter interface contract, adapter interface validator source, validation matrix, proof-mode samples, negative samples, or adapter implementation code. It also does not invoke the adapter.

Therefore, for Task 027 itself:

```text
adapter_validator_gate_required=false
adapter_validator_gate_status=not_required
```

Future tasks that implement the `local_workspace` adapter, change common interface samples, change validation matrix entries, or execute the adapter must treat the adapter validator gate as required.

## 10. Completion boundary

Task 027 may be completed only as a contract proof.

It must not be interpreted as:

- a working `local_workspace` adapter;
- a validated production implementation;
- actual local workspace file generation;
- Stage 2 readiness;
- final HWP/HWPX core selection.

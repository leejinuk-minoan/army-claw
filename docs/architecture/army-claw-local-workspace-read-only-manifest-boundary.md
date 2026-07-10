# Army Claw Local Workspace Read-Only Manifest Boundary

## 1. Purpose

Task 030 introduces the next safety boundary after Task 029 controlled dry-run.

The read-only manifest boundary allows the `local_workspace` adapter to evaluate a request for metadata-only workspace manifest description while still prohibiting real local workspace inspection, file content reads, file mutation, native application invocation, Hancom COM execution, and real office artifact generation.

This document is a cloud package architecture note. It does not prove local verification and does not authorize production file-system execution.

## 2. Boundary definition

Read-only manifest boundary means:

- the adapter may validate a request to describe an approved workspace scope;
- the adapter may evaluate deterministic in-memory metadata fixtures or safe test doubles;
- the adapter may produce deterministic manifest descriptors;
- the adapter may produce manifest receipts;
- the adapter must not read file contents;
- the adapter must not create, modify, copy, delete, move, or mutate files;
- the adapter must not follow symlinks outside approved scope;
- the adapter must not access public internet;
- the adapter must not invoke native applications;
- the adapter must not generate HWP/HWPX/HanCell/HanShow artifacts.

## 3. Required explicit markers

A read-only manifest request must be explicit and unambiguous.

Required request markers:

```text
execution_context.execution_mode = read_only_manifest
execution_context.read_only_manifest = true
read_only = true
```

The adapter must reject requests that omit or weaken these markers.

## 4. Workspace root rule

The approved workspace root must remain a reference.

Allowed pattern:

```text
approved_workspace://task030-fixture
```

Forbidden pattern:

```text
C:\Users\...
/tmp/...
~/...
any LLM-emitted free-form absolute path
```

## 5. Path safety rules

The boundary blocks:

- absolute path;
- `..` path traversal;
- backslash path;
- empty path segment;
- source overwrite;
- public internet requirement;
- symlink follow request;
- symlink escape claim without local proof;
- file content read request.

## 6. Metadata-only manifest

Allowed metadata:

```text
relative_path
entry_type
size_bytes if fixture provides it
extension
depth
denied_reason
```

Forbidden metadata:

```text
raw file content
extracted text
content hash requiring content read
native app state
preview text
```

## 7. Determinism requirement

Manifest output must be deterministic.

Required properties:

- stable sorted order by `relative_path`;
- stable total count;
- stable file count;
- stable directory count;
- stable denied count;
- stable denied/skipped entry representation;
- no dynamic timestamp in tests.

## 8. Response boundary

A positive read-only manifest response should include:

```text
status: read_only_manifest_completed
execution_allowed: false
actual_adapter_invoked: false
read_only_manifest_boundary_evaluated: true
actual_file_system_mutation_performed: false
file_content_read_performed: false
local_hancom_com_executed: false
real_hwp_hwpx_hancell_hanshow_artifact_generated: false
output_artifacts: []
manifest: {...}
manifest_receipts: [...]
validation_result.valid: true
```

The response must distinguish metadata-only read-only manifest evaluation from production execution.

## 9. Negative cases

The adapter must produce deterministic controlled error envelopes for:

- missing read-only manifest mode marker;
- missing read_only flag;
- absolute path;
- path traversal;
- backslash path;
- empty segment;
- public internet requirement;
- file content read request;
- symlink follow request;
- unsupported operation class;
- wrong target / adapter slot / plan type mapping.

## 10. Cloud phase boundary

Task 030-A may write source, tests, contracts, samples, reports, Research Note, and local verification package.

Task 030-A must not run local filesystem inspection, validator CLI, unittest, Hancom COM, CI, dependency install, or native app automation.

## 11. Completion boundary

Task 030-A completion is cloud package completion only.

Final Task 030 completion requires Task 030-B local verification evidence:

```text
validator CLI exit code 0
adapter validator unittest exit code 0
local workspace adapter unittest exit code 0
read_only_manifest_boundary_evaluated true
actual_adapter_invoked false
actual_file_system_mutation_performed false
file_content_read_performed false
local_hancom_com_executed false
real_hwp_hwpx_hancell_hanshow_artifact_generated false
```

## 12. Non-scope

Task 030-A does not prove:

- production filesystem mutation;
- real user workspace inspection;
- real file content reading;
- actual adapter execution;
- Hancom COM integration;
- HWP/HWPX/HanCell/HanShow artifact generation;
- Stage 2 readiness;
- final HWPX core selection.

# Army Claw Local Workspace Staged Output Boundary

## 1. Purpose

Task 031 introduces the next boundary after Task 030 read-only manifest.

The staged output boundary allows the `local_workspace` adapter to validate and stage request-provided generated content into an explicit controlled staging area while still prohibiting production user workspace mutation, source overwrite, final promotion, real user file content reads, native application invocation, Hancom COM execution, and real office artifact generation.

This document is a cloud package architecture note. It does not prove local verification and does not authorize production file-system execution.

## 2. Boundary definition

Staged output boundary means:

- the adapter may validate a request to create generated output inside an approved staging area;
- the adapter may write request-provided generated content to a temporary unit-test sandbox when local tests run;
- the staging root must be a controlled reference such as `approved_staging://...`;
- the adapter must not use an LLM-emitted free-form absolute path as a staging root;
- the adapter must not write into the source workspace;
- the adapter must not overwrite source files;
- the adapter must not promote staged output to final user workspace location;
- the adapter must not read source file contents to generate staged output;
- the adapter must not claim actual adapter invocation;
- the adapter must not claim production or real user workspace mutation.

## 3. Required explicit markers

A staged output request must be explicit and unambiguous.

Required request markers:

```text
execution_context.execution_mode = staged_output
execution_context.staged_output = true
staged_output = true
```

The adapter must reject requests that omit or weaken these markers.

## 4. Workspace and staging root rules

The approved workspace root remains a reference:

```text
approved_workspace://task031-fixture
```

The approved staging root also remains a reference:

```text
approved_staging://task031-staging-fixture
```

Forbidden patterns:

```text
C:\Users\...
/tmp/...
~/...
any LLM-emitted free-form absolute path
```

Local unit tests may provide a temporary sandbox path through test harness context only. That path is not a production staging root and must not be interpreted as user workspace authority.

## 5. Path safety rules

The boundary blocks:

- absolute path;
- `..` path traversal;
- backslash path;
- empty path segment;
- source overwrite;
- staging path collision unless blocked by policy;
- public internet requirement;
- symlink follow request;
- symlink escape claim without local proof;
- file content read request;
- native app state modification request;
- final user workspace promotion.

## 6. Generated content rule

Staged output must be generated from request-provided generated content only.

Allowed source:

```text
operation.generated_content
```

Forbidden source:

```text
real user file content
source workspace file read
native app state
public internet fetch
Hancom COM output
```

## 7. Response boundary

A positive staged output response should include:

```text
status: staged_output_completed
execution_allowed: false
actual_adapter_invoked: false
staged_output_boundary_evaluated: true
staged_output_sandbox_write_performed: true only when local unit-test sandbox write occurs
actual_file_system_mutation_performed: false
user_workspace_file_system_mutation_performed: false
file_content_read_performed: false
local_hancom_com_executed: false
real_hwp_hwpx_hancell_hanshow_artifact_generated: false
output_artifacts: []
staged_output_artifacts: [...]
staged_output_receipts: [...]
validation_result.valid: true
```

`actual_file_system_mutation_performed=false` means no production or real user workspace mutation. `staged_output_sandbox_write_performed=true` may occur only inside a controlled unit-test temporary sandbox.

## 8. Negative cases

The adapter must produce deterministic controlled error envelopes for:

- missing staged output mode marker;
- missing staged output flag;
- missing approved staging root reference;
- absolute output path;
- path traversal;
- backslash path;
- empty path segment;
- source overwrite attempt;
- staging path collision without safe policy;
- public internet requirement;
- file content read request;
- native app state modification request;
- symlink follow request;
- unsupported operation class;
- wrong target / adapter slot / plan type mapping.

## 9. Cloud phase boundary

Task 031-A may write source, tests, contracts, samples, reports, Research Note, and local verification package.

Task 031-A must not run validator CLI, unittest, local filesystem staging, Hancom COM, CI, dependency install, native app automation, real user workspace mutation, or real office artifact generation.

## 10. Completion boundary

Task 031-A completion is cloud package completion only.

Final Task 031 completion requires Task 031-B local verification evidence:

```text
validator CLI exit code 0
adapter validator unittest exit code 0
local workspace adapter unittest exit code 0
validator summary status valid
staged_output_boundary_evaluated true
staged_output_sandbox_write_performed true
actual_adapter_invoked false
actual_file_system_mutation_performed false
user_workspace_file_system_mutation_performed false
file_content_read_performed false
local_hancom_com_executed false
real_hwp_hwpx_hancell_hanshow_artifact_generated false
```

## 11. Non-scope

Task 031-A does not prove:

- production filesystem mutation;
- real user workspace mutation;
- real user workspace inspection;
- real file content reading;
- actual adapter invocation;
- Hancom COM integration;
- HWP/HWPX/HanCell/HanShow artifact generation;
- Stage 2 readiness;
- final HWPX core selection.

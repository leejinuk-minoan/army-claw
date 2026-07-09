# Army Claw Common Office Adapter Interface Contract

## 1. Purpose

This contract connects the Task 018 multi-app capability architecture, the Task 019 app target routing contract, and the Task 020 app target plan schema into a common adapter boundary.

The contract defines the request, response, error, validation, and evidence envelopes that all app adapters must follow before implementation work begins.

This is a proof contract. It does not implement an adapter, execute Hancom Office, create HWP/HWPX/HanCell/HanShow files, call a Model Gateway, or build HTTP/UI surfaces.

## 2. Common adapter interface concept

Every adapter receives the same request envelope shape.

Every adapter returns the same response envelope shape when a request can be evaluated.

Every adapter returns the same error envelope shape when validation, routing, constraints, evidence, or execution policy blocks the request.

Every adapter records validation and evidence metadata. Evidence must distinguish cloud proof evidence from real local execution evidence.

## 3. Official targets, plans, and slots

Official app targets:

- `local_workspace`
- `hwp_hwpx`
- `hancell`
- `hanshow`

Official plan types:

- `local_workspace_action_plan`
- `hwp_hwpx_fill_plan`
- `hancell_fill_plan`
- `hanshow_fill_plan`
- `multi_app_execution_plan`

Official adapter slots:

- `local_workspace_adapter_slot`
- `hwp_hwpx_adapter_slot`
- `hancell_adapter_slot`
- `hanshow_adapter_slot`

`multi_app_execution_plan` is decomposed into target-specific subplans before adapter invocation.

## 4. Common request envelope

Required fields:

```text
request_id
contract_version
target_id
adapter_slot_id
plan_type
validated_plan
source_plan_schema_version
execution_context
template_reference
constraints
evidence_request
dry_run
created_at
```

Field meanings:

- `request_id`: unique request identifier.
- `contract_version`: common adapter interface contract version.
- `target_id`: official target.
- `adapter_slot_id`: official adapter slot.
- `plan_type`: official plan type.
- `validated_plan`: structured plan validated before adapter boundary.
- `source_plan_schema_version`: plan schema version used by the planner or validator.
- `execution_context`: local/cloud/proof context metadata.
- `template_reference`: template or source artifact reference.
- `constraints`: overwrite, internet, preservation, and native state constraints.
- `evidence_request`: requested evidence level.
- `dry_run`: whether output must be preview/proof-only.
- `created_at`: ISO timestamp.

## 5. Common response envelope

Required fields:

```text
request_id
response_id
contract_version
target_id
adapter_slot_id
status
execution_allowed
actual_adapter_invoked
output_artifacts
validation_result
evidence
warnings
created_at
```

Valid proof response behavior:

- `execution_allowed=false`
- `actual_adapter_invoked=false`
- `proof_mode=true` in evidence or execution context
- no real output artifact is claimed

## 6. Common error envelope

Required fields:

```text
request_id
error_id
target_id
adapter_slot_id
error_code
error_category
user_visible_state
recoverable
message
blocked_reason
evidence
created_at
```

Errors must be controlled. They must not be converted into silent success.

## 7. Target-specific artifact constraints

### hwp_hwpx

- template artifact types: `hwp`, `hwpx`
- preserve document template structure as much as possible
- source overwrite is prohibited
- package XML direct LLM editing is prohibited

### hancell

- template artifact type: `cell`
- preserve formulas, charts, sheets, print settings, merged cells, and named ranges
- source overwrite is prohibited

### hanshow

- template artifact type: `show`
- preserve slide size, layouts, theme styles, placeholders, shapes, tables, and chart placeholders
- source overwrite is prohibited

### local_workspace

- template artifact type: `folder`
- supports local file/folder action plans only through validated workspace policy
- source overwrite and unsafe path traversal are prohibited

## 8. Dry-run and proof-mode rules

Task 023 is a cloud proof. It does not invoke real adapters.

Therefore all sample responses use:

```text
proof_mode=true
execution_allowed=false
actual_adapter_invoked=false
```

A proof response may describe the validation result and expected blocked state, but it must not claim real local execution evidence.

## 9. Validation gate

Before adapter invocation, the system must validate:

- `target_id` is supported;
- `adapter_slot_id` is supported;
- `plan_type` is supported;
- `target_id`, `adapter_slot_id`, and `plan_type` match;
- `template_reference` exists or is admissible for the execution mode;
- template artifact type is supported by the target;
- `prevent_source_overwrite=true`;
- `allow_public_internet=false`;
- LLM direct file edit request is absent;
- LLM direct native app state modification request is absent;
- constraints are complete and compatible;
- requested evidence can be produced in the current execution mode.

## 10. Evidence rules

Cloud proof evidence:

- documents the contract, sample payloads, and negative examples;
- may record static validation reasoning;
- must not claim real adapter invocation.

Local execution evidence:

- requires a later local Task;
- may include actual command logs, file probes, generated artifact hashes, screenshots, COM evidence, or GUI review;
- must not be invented in a cloud proof.

## 11. Non-scope

Task 023 does not perform:

- actual HWP/HWPX adapter implementation;
- actual HanCell adapter implementation;
- actual HanShow adapter implementation;
- local workspace automation implementation;
- actual document generation;
- Hancom COM execution;
- Model Gateway implementation;
- LLM planner implementation;
- HTTP/UI implementation;
- dependency installation;
- Stage 2 transition;
- final HWPX core selection.

## 12. Interface change rule

Any future change to the common adapter request, response, error, evidence, validation, or target mapping contract must be handled by a separate contract Task before adapter implementation work depends on it.

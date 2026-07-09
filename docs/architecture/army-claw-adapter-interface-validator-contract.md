# Army Claw Adapter Interface Validator Contract

## 1. Purpose

This validator contract defines how Army Claw verifies the Task 023 Common Office Adapter Interface Contract before real adapter implementation begins.

It fixes validation rules for request envelopes, response envelopes, error envelopes, target-slot-plan mapping, proof mode, forbidden actions, evidence metadata, and negative sample expected errors.

This is a contract proof. It does not implement executable validator code.

## 2. Validator roles

The validator must check:

- request envelope shape;
- response envelope shape;
- error envelope shape;
- target_id / adapter_slot_id / plan_type mapping;
- proof mode restrictions;
- forbidden actions;
- evidence metadata;
- negative sample expected error code and category.

## 3. What the validator does not do

The validator contract does not perform:

- actual adapter execution;
- actual document generation;
- HWP/HWPX/HanCell/HanShow file opening;
- Hancom COM execution;
- LLM planner execution;
- Model Gateway execution;
- UI or HTTP execution;
- dependency installation;
- production code implementation.

## 4. Request validation rules

For every request envelope, the validator must check:

- all required request fields exist;
- `request_id` exists and is non-empty;
- `contract_version` matches the supported adapter interface contract version;
- `target_id` is in `supported_targets`;
- `adapter_slot_id` matches `target_id`;
- `plan_type` matches `target_id` except for decomposed `multi_app_execution_plan`;
- `validated_plan` exists;
- `template_reference` exists;
- `constraints.prevent_source_overwrite` is `true`;
- `constraints.allow_public_internet` is `false`;
- proof or dry-run context is explicit when real execution is not allowed;
- LLM direct file edit request is absent;
- LLM direct native app state modification request is absent.

## 5. Response validation rules

For every response envelope, the validator must check:

- all required response fields exist;
- `request_id` links to the original request;
- `response_id` exists and is non-empty;
- `status` is in the response status enum;
- proof mode responses have `actual_adapter_invoked=false`;
- proof mode responses have `execution_allowed=false`;
- proof mode responses do not claim real output artifacts;
- `validation_result` exists;
- `evidence` exists;
- `warnings` exists.

## 6. Error validation rules

For every error envelope, the validator must check:

- `error_id` exists;
- `error_code` exists in the error taxonomy;
- `error_category` matches the taxonomy entry;
- `recoverable` exists;
- `blocking` exists in the taxonomy entry;
- `user_visible_state` exists;
- `blocked_reason` exists;
- `evidence` exists.

## 7. Mapping validation

Allowed target-slot-plan mapping:

| target_id | adapter_slot_id | plan_type |
|---|---|---|
| `local_workspace` | `local_workspace_adapter_slot` | `local_workspace_action_plan` |
| `hwp_hwpx` | `hwp_hwpx_adapter_slot` | `hwp_hwpx_fill_plan` |
| `hancell` | `hancell_adapter_slot` | `hancell_fill_plan` |
| `hanshow` | `hanshow_adapter_slot` | `hanshow_fill_plan` |

`multi_app_execution_plan` may contain multiple targets, but each decomposed step must satisfy one of the mappings above.

## 8. Proof mode validation

When `proof_mode=true` or real adapter invocation is disallowed, the validator must require:

- `actual_adapter_invoked=false`;
- `execution_allowed=false`;
- no generated document artifact is claimed;
- evidence does not claim local execution, GUI verification, Hancom COM execution, dependency install, or adapter invocation.

## 9. Forbidden action validation

The validator must block:

- source template overwrite;
- public internet dependency;
- LLM direct file edit;
- LLM direct native app state modification;
- actual adapter invocation in proof mode;
- unsupported template artifact type;
- target-plan mismatch;
- adapter slot mismatch;
- missing or incompatible evidence.

## 10. Validation result status

The validator may return:

- `valid`: the envelope or sample satisfies the contract;
- `invalid`: the envelope violates structural or semantic rules;
- `blocked`: the envelope requests a prohibited operation;
- `not_evaluated`: the validator did not evaluate the item;
- `not_applicable`: the rule does not apply to the item.

## 11. Negative sample validation

Negative sample validation must assert the expected error code and category:

- direct LLM file edit -> `llm_direct_file_edit_blocked`;
- source overwrite -> `source_overwrite_blocked`;
- public internet required -> `public_internet_dependency_blocked`;
- target-plan mismatch -> `target_plan_mismatch`.

## 12. Non-scope

Task 024 does not perform:

- actual validator implementation;
- actual automated test execution;
- actual adapter execution;
- actual HWP/HWPX/HanCell/HanShow file generation;
- Hancom COM execution;
- Stage 2 transition;
- final HWPX core selection.

## 13. Future implementation rule

A later implementation Task may create executable validator code only after this contract is accepted as the source of truth. Executable validation must not loosen these rules without a new contract Task.

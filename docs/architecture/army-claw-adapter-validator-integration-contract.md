# Army Claw Adapter Validator Integration Contract

## 1. Purpose

This contract connects the verified Task 025 Adapter Interface Validator to future adapter-related Army Claw tasks.

It defines when the validator gate is required, what evidence must exist, how blocked or follow-up states are handled, and how Task Contract, Handoff, Research Note, and Completion Gate records must reference validator results.

This is an integration contract proof. It does not implement CI, GitHub Actions, automatic execution pipelines, adapters, or Hancom COM workflows.

## 2. Integration targets

The integration contract covers:

- Common Office Adapter Interface Contract;
- Adapter Interface Validator Contract;
- Adapter Interface Validation Matrix;
- Adapter Interface Validator CLI;
- Task Contract;
- Handoff Packet;
- Local Verification Evidence;
- Future Adapter Implementation Tasks.

## 3. Validator gate required cases

The adapter validator gate is required when a task changes or prepares to change:

- common interface contract;
- adapter interface sample;
- adapter error taxonomy;
- target / adapter slot / plan type mapping;
- adapter implementation code;
- adapter request, response, or error envelope;
- proof-mode sample;
- negative sample;
- local adapter execution task immediately before execution.

When in doubt, treat the task as `gate_required`.

## 4. Validator gate not required cases

The adapter validator gate is usually not required when a task changes only:

- pure explanatory documentation unrelated to adapter interface behavior;
- Research Note typo or formatting;
- report formatting;
- governance documentation unrelated to adapter interface, adapter samples, validator behavior, or adapter execution.

If the relationship to adapter behavior is unclear, the validator gate is required.

## 5. Gate status enum

Gate status must be one of:

- `not_required`: validator gate is not required for this task;
- `required_not_run`: validator gate is required but no execution evidence exists;
- `passed`: validator CLI and required tests passed with evidence;
- `failed`: validator CLI or tests ran and failed;
- `blocked`: required evidence is missing or a forbidden condition is present;
- `requires_followup`: gate result is inconclusive and follow-up work is required.

## 6. Evidence requirement

If gate status is `passed`, `failed`, `blocked`, or `requires_followup`, evidence must identify:

- validator CLI stdout path;
- validator CLI stderr path;
- validator CLI exit code path;
- unittest stdout path;
- unittest stderr path;
- unittest exit code path;
- execution branch;
- execution commit SHA;
- local execution base SHA;
- repo status before and after;
- Python version;
- `actual_adapter_invoked=false` unless the task explicitly authorizes adapter execution;
- `local_hancom_com_executed=false` unless the task explicitly authorizes Hancom COM execution.

## 7. Integration with Task Contract

Adapter-related Task Contracts must include:

```text
adapter_validator_gate_required:
adapter_validator_gate_policy_path:
adapter_validator_integration_contract_path:
adapter_validator_evidence_schema_path:
adapter_validator_gate_status:
adapter_validator_evidence_path:
validator_cli_exit_code:
unittest_exit_code:
validator_completion_gate_required:
validator_completion_gate_passed:
```

If the gate is required, completion cannot be declared until the required evidence exists and the result is acceptable.

A task must not set `completion_gate_passed=true` when `adapter_validator_gate_required=true` and `adapter_validator_gate_status` is `required_not_run`, `failed`, `blocked`, or missing.

## 8. Integration with Handoff

Adapter-related handoff packets must include validator gate status.

The receiver must treat the packet as blocked or validation-required if:

- gate status is missing;
- gate is required but status is `required_not_run`;
- gate evidence paths are missing;
- validator CLI exit code is nonzero;
- unittest exit code is nonzero;
- the sender claims a passed validator gate without execution evidence.

## 9. Integration with Research Note

Adapter interface, validator, local verification, and adapter execution tasks must record in their Research Note:

- gate required decision;
- gate status;
- evidence path;
- limitation if the gate is not run;
- distinction between contract proof, validator execution, and real adapter execution.

## 10. Blocked and follow-up handling

Use `blocked` when the task cannot safely continue or complete without missing evidence or prohibited action resolution.

Use `requires_followup` when evidence exists but is incomplete, inconclusive, or requires a separate correction task.

Use `failed` when the validator or tests actually executed and returned nonzero or failed checks.

Use `required_not_run` only before local execution evidence exists.

## 11. Non-scope

Task 026 does not perform:

- CI implementation;
- GitHub Actions workflow creation;
- automatic execution pipeline implementation;
- actual validator execution;
- actual adapter implementation;
- actual adapter invocation;
- HWP/HWPX, HanCell, HanShow, or local workspace artifact generation;
- Hancom COM execution;
- Stage 2 transition;
- final HWPX core selection.

## 12. Future implementation rule

Future CI or automation work may consume this contract, but must be a separate approved task. It must preserve the distinction between authored contracts, actual validator execution evidence, and actual adapter execution evidence.

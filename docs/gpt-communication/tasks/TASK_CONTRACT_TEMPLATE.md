# Army Claw Codex Task Contract

## 1. Task identity

```text
task_id:
stage:
substage:
title:
owner: Codex prompt-author agent
status: draft
```

## 2. Approved source of truth

```text
PROJECT_STATE.json:
CURRENT.md:
master roadmap:
architecture decision:
latest related opinion/report:
research note index md:
research note index json:
handoff contract:
handoff template:
adapter interface contract:
adapter error taxonomy:
```

## 3. Repository state

```text
repository: leejinuk-minoan/army-claw
local_root:
base_branch:
base_commit:
work_branch:
```

## 4. Objective

Describe the exact outcome this task must produce.

## 5. Non-objectives

List work that must not be performed in this task.

## 6. Allowed change scope

```text
allowed directories:
allowed files:
allowed dependencies:
research_note_allowed: true | false
research_note_target_path:
research_note_index_update_allowed: true | false
```

## 7. Forbidden changes

```text
- main merge without user approval
- overwrite original HWP/HWPX
- destructive Git commands
- architecture or roadmap changes
- sequential re-save of one output by multiple HWPX cores
- using Research Note as a replacement for Task report
- accumulating long-form paper notes inside research-note-index.md or research-note-index.json
```

Add task-specific prohibitions.

## 8. Inputs and fixtures

List exact input files, benchmark corpus, expected hashes, and visual evidence.

## 9. Implementation requirements

List required adapters, interfaces, scripts, schemas, and error handling.

## 10. Adapter interface contract

Use this section when the Task modifies adapter-related files, adapter slots, plan routing, request builders, response builders, evidence contracts, or target-specific execution boundaries.

```text
adapter_interface_contract_required:
adapter_interface_contract_path:
adapter_error_taxonomy_path:
target_adapter_slot:
target_plan_type:
adapter_request_sample_required:
adapter_response_sample_required:
actual_adapter_invocation_allowed:
proof_mode:
```

When `adapter_interface_contract_required` is true, the Task must check:

```text
- target_id / adapter_slot_id / plan_type mapping
- source overwrite prevention
- public internet dependency policy
- LLM direct file edit block
- LLM direct native app state modification block
- proof mode versus real local execution evidence
```

## 11. TDD and validation

```text
RED tests:
GREEN criteria:
regression tests:
Hancom COM tests:
license checks:
offline deployment checks:
research note structure checks:
handoff packet checks:
adapter interface contract checks:
```

## 12. Required outputs

```text
code:
reports:
research_note:
research_note_index_update:
diagnostics:
benchmark results:
user-review artifacts:
handoff_packet:
adapter_contract_artifacts:
```

## 13. Research Note contract

When `research_note_allowed` or `research_note_required` is true, the Task must create or update one Task-level Research Note under:

```text
docs/research-notes/task-notes/
```

The Research Note must use a separate file per Task. It must not be appended to a single cumulative note file.

Each Research Note must include:

```text
1. Research Question
2. System Design Claim
3. Method
4. Evidence
5. Result
6. Paper-Ready Sentences
7. Limitations
8. Link to Development Records
```

The index files must only record short metadata:

```text
docs/research-notes/research-note-index.md
docs/research-notes/research-note-index.json
```

## 14. Handoff contract

Use this section when a Task hands work to another worker.

```text
handoff_required:
handoff_sender:
handoff_receiver:
handoff_packet_path:
handoff_contract_path:
receiver_validation_required:
stop_conditions:
next_worker_allowed_scope:
next_worker_forbidden_scope:
```

If `handoff_required` is true, the packet must follow:

```text
docs/gpt-communication/handoffs/ai-worker-handoff-contract.json
docs/gpt-communication/handoffs/AI_WORKER_HANDOFF_TEMPLATE.md
```

The handoff packet does not replace the Task report or Research Note.

## 15. Completion gate

State measurable conditions. User visual confirmation must remain pending when required.

If adapter-related files are changed, completion requires:

```text
- adapter interface contract checked when adapter-related files are changed
- target_id / adapter_slot_id / plan_type mapping is valid
- source overwrite prevention is preserved
- public internet dependency is blocked unless explicitly approved
- actual adapter invocation is not claimed unless locally executed and evidenced
- proof mode output does not claim real adapter execution
```

If the Task requires a Research Note, completion requires:

```text
- Research Note file exists under docs/research-notes/task-notes/
- research-note-index.md includes the Research Note ID and path
- research-note-index.json includes the same Research Note ID and path
- Task report and Research Note remain separate documents
```

If `handoff_required` is true, completion also requires:

```text
- handoff packet exists
- handoff packet includes source commit SHA
- handoff packet includes changed files
- handoff packet includes validation summary
- handoff packet includes stop conditions
- receiver can determine accept/reject/blocked from packet
```

## 16. Reporting contract

Codex must report:

```text
branch
commit SHA
push result
changed files
test results
artifact paths
research note path
research note index update result
handoff packet path
adapter contract artifact paths
diff/diagnostic summary
limitations
user verification items
next resume point
```

## 17. Handoff update

After Codex pushes, update or create the handoff packet when required.

The handoff must match the actual remote commit and artifacts.

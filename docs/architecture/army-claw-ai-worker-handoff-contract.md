# Army Claw AI Worker Handoff Contract

## 1. Purpose

Army Claw uses a solo multi-agent operating model: one Project Owner / User assigns work sequentially to official AI workers. A handoff contract preserves context, branch ownership, evidence, and stop conditions when work moves from one worker to another.

The handoff contract does not replace the Task report or Research Note. It is the transfer packet that lets the next worker decide whether to accept, reject, or block the next action.

## 2. When handoff is required

Handoff is required when:

- a Task is completed and another worker may continue review or execution;
- a cloud-delegable proof must be followed by local execution;
- a cloud-first implementation package must be followed by local verification;
- a local execution result must be reviewed by another worker;
- adapter validator gate evidence must be transferred to another worker;
- a worker stops before completion and leaves known limitations or risks;
- the Project Owner asks Codex A, Codex B, or Claude Code to continue from a verified commit.

## 3. When handoff is prohibited

Handoff is prohibited when:

- the sender cannot identify the exact source commit SHA;
- the sender branch has uncommitted or dirty worktree state;
- changed files include forbidden paths not approved by the Task Contract;
- the sender claims tests passed without actual execution evidence;
- an adapter validator gate is required but status/evidence is missing;
- the handoff would create same-Task concurrent writes;
- the target worker is not an official worker;
- the action would imply main direct modification, force push, history rewrite, Stage transition, or final HWPX core selection without approval.

## 4. Official participants

Official authority:

- `Project Owner / User`

Official AI workers:

- `codex_a`
- `codex_b`
- `claude_code`

Excluded workers or collaborators:

- `gemini_antigravity`
- `person_a`
- `person_b`

Person A/B collaboration remains canceled. Gemini Antigravity is not an official worker.

## 5. Sender responsibilities

The handoff sender must provide:

- handoff ID and Task ID;
- from/to worker IDs;
- source branch and source commit SHA;
- base commit SHA;
- target branch or next branch;
- changed file list;
- Task report path;
- Research Note path when applicable;
- validation summary with commands run and commands not run;
- adapter validator gate status when adapter-related;
- adapter validator evidence path when required;
- forbidden change check;
- dirty worktree status;
- known limitations and remaining risks;
- next worker required reads;
- allowed scope, forbidden scope, and stop conditions;
- next recommended action.

The sender must not claim local execution, GUI verification, COM execution, dependency install, validator pass status, or adapter execution unless actually performed and evidenced.

## 6. Receiver responsibilities

The handoff receiver must not start editing immediately. It must first verify:

1. repository and branch match the packet;
2. source commit SHA exists and is reachable;
3. current HEAD matches the expected handoff source or approved target base;
4. dirty worktree is clean;
5. changed files match the packet;
6. Task report and Research Note paths exist;
7. forbidden path changes are absent;
8. commands listed as passed have real evidence;
9. adapter validator gate status is present and acceptable when required;
10. stop conditions are not triggered.

The receiver must set handoff status to one of:

- `accepted`
- `rejected`
- `blocked`

A receiver may only work within the next worker allowed scope.

## 7. Approval authority

The Project Owner / User is the approval authority for worker assignment, Task continuation, branch use, scope expansion, Stage transition, and final core selection.

Master review may verify consistency but does not replace explicit user approval for restricted actions. Cloud-first/local-verify local execution requires master read-only verification and assignment of `local_execution_base_sha`.

## 8. Sequential worker flow

Typical flow:

```text
Task Contract approved
-> worker assigned
-> branch ownership confirmed
-> single worker writes
-> report / Research Note / evidence created
-> commit and push
-> handoff or delegation package created
-> next worker validates packet
-> next worker accepts, rejects, or blocks
```

Cloud-first/local-verify flow:

```text
cloud implementation package
-> master read-only verification
-> local_execution_base_sha assignment
-> local verification branch
-> stdout/stderr/exit-code evidence
-> result review
```

Adapter validator gate flow:

```text
adapter-related change detected
-> gate policy decision
-> validator evidence required when gate_required=true
-> validator CLI and unittest evidence recorded
-> handoff packet includes gate status
-> receiver blocks if evidence is missing or failed
```

Codex A, Codex B, and Claude Code may be used sequentially, not as simultaneous writers for the same Task.

## 9. Branch ownership principles

- A worker writes only to the branch approved for its Task.
- The same Task must not have multiple concurrent writers.
- A worker must not modify another worker branch without explicit approval.
- main direct push, force push, history rewrite, and unauthorized merge are prohibited.

## 10. Required reads for the next worker

The next worker must read at minimum:

- `AGENTS.md`
- `CLAUDE.md` when using Claude Code
- `docs/architecture/army-claw-ai-worker-operating-rules.md`
- `docs/architecture/army-claw-solo-multi-agent-governance.md`
- `docs/architecture/army-claw-branch-ownership-map.md`
- `docs/architecture/army-claw-worker-setup-guide.md`
- the current Task report
- the current Research Note when present
- the handoff/delegation packet and machine-readable JSON

When the next work is adapter-related, the next worker must also read:

- `docs/architecture/army-claw-common-office-adapter-interface-contract.md`
- `docs/gpt-communication/contracts/common-office-adapter-interface-contract.json`
- `docs/gpt-communication/contracts/common-office-adapter-error-taxonomy.json`
- `docs/architecture/army-claw-adapter-interface-validator-contract.md`
- `docs/gpt-communication/contracts/adapter-interface-validator-contract.json`
- `docs/gpt-communication/contracts/adapter-interface-validation-matrix.json`
- `docs/gpt-communication/contracts/ADAPTER_INTERFACE_VALIDATOR_CHECKLIST.md`
- `docs/architecture/army-claw-adapter-validator-integration-contract.md`
- `docs/gpt-communication/contracts/adapter-validator-integration-contract.json`
- `docs/gpt-communication/contracts/adapter-validator-gate-policy.json`
- `docs/gpt-communication/contracts/adapter-validator-evidence-schema.json`

## 11. Required receiver checks

The receiver must check:

- commit SHA;
- branch;
- diff and changed files;
- report path;
- Research Note path;
- validation summary;
- commands run and commands not run;
- forbidden path diff;
- dirty worktree status;
- stop conditions;
- adapter interface contract compliance when adapter work is being handed off;
- adapter validator contract and validation matrix compliance when validator or sample work is being handed off;
- adapter validator gate status and evidence when required;
- `local_execution_base_sha` assignment when local execution is required.

## 12. Stop conditions

The receiver must stop and report if:

- branch HEAD does not match the handoff source SHA;
- dirty worktree is detected;
- forbidden path changes are present;
- Task report is missing;
- required Research Note is missing;
- JSON packet is invalid;
- source commit SHA is missing or malformed;
- changed files do not match the packet;
- unexecuted tests are claimed as passed;
- another worker is already writing to the same Task;
- requested work requires local execution but `local_execution_base_sha` is null;
- requested adapter work does not cite the common office adapter interface contract;
- requested adapter validator work does not cite the validator contract or validation matrix;
- adapter validator gate is required but status is missing, `required_not_run`, `failed`, or `blocked`;
- requested work would modify main, force push, rewrite history, change Stage, or select final HWPX core without approval.

## 13. Allowed and forbidden receiver actions

Allowed after successful validation:

- read the packet and referenced records;
- continue within allowed scope;
- produce report, evidence, or Research Note required by the Task;
- create a new handoff packet when transferring again.

Forbidden without explicit approval:

- expanding scope;
- modifying production code when the Task is documentation-only;
- modifying forbidden paths;
- declaring unrun tests as passed;
- main merge;
- force push;
- history rewrite;
- Stage transition;
- final HWPX core selection;
- creating person A/B collaboration artifacts or branches.

## 14. Adapter-related handoff fields

For adapter-related work, the packet may include:

```text
adapter_interface_contract_checked:
adapter_interface_contract_path:
adapter_error_taxonomy_path:
adapter_validator_contract_checked:
adapter_validator_contract_path:
adapter_validation_matrix_path:
adapter_validator_checklist_path:
adapter_validator_gate_required:
adapter_validator_gate_status:
adapter_validator_evidence_path:
validator_cli_exit_code:
unittest_exit_code:
gate_blocked_reason:
validator_source_path:
validator_unittest_path:
target_adapter_slot:
target_plan_type:
actual_validator_implementation_allowed:
actual_adapter_invocation_allowed:
proof_mode:
local_execution_base_sha:
```

If `proof_mode=true`, the sender and receiver must not claim actual adapter invocation. If `actual_validator_implementation_allowed=false`, the sender and receiver must not claim executable validator implementation. If `local_execution_base_sha=null`, local execution is not allowed yet.

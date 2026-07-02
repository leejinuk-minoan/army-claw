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
```

## 3. Repository state

```text
repository: leejinuk-minoan/army-claw
local_root: C:\Users\USER\Desktop\로컬 open claw 만들기
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
```

## 7. Forbidden changes

```text
- main merge without user approval
- overwrite original HWP/HWPX
- destructive Git commands
- architecture or roadmap changes
- sequential re-save of one output by multiple HWPX cores
```

Add task-specific prohibitions.

## 8. Inputs and fixtures

List exact input files, benchmark corpus, expected hashes, and visual evidence.

## 9. Implementation requirements

List required adapters, interfaces, scripts, schemas, and error handling.

## 10. TDD and validation

```text
RED tests:
GREEN criteria:
regression tests:
Hancom COM tests:
license checks:
offline deployment checks:
```

## 11. Required outputs

```text
code:
reports:
diagnostics:
benchmark results:
user-review artifacts:
```

## 12. Completion gate

State measurable conditions. User visual confirmation must remain pending when required.

## 13. Reporting contract

Codex must report:

```text
branch
commit SHA
push result
changed files
test results
artifact paths
diff/diagnostic summary
limitations
user verification items
next resume point
```

## 14. Handoff update

After Codex pushes, update:

```text
docs/gpt-communication/handoffs/CODEX_LATEST.json
```

The handoff must match the actual remote commit and artifacts.

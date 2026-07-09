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

## 10. TDD and validation

```text
RED tests:
GREEN criteria:
regression tests:
Hancom COM tests:
license checks:
offline deployment checks:
research note structure checks:
```

## 11. Required outputs

```text
code:
reports:
research_note:
research_note_index_update:
diagnostics:
benchmark results:
user-review artifacts:
```

## 12. Research Note contract

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

## 13. Completion gate

State measurable conditions. User visual confirmation must remain pending when required.

If the Task requires a Research Note, completion requires:

```text
- Research Note file exists under docs/research-notes/task-notes/
- research-note-index.md includes the Research Note ID and path
- research-note-index.json includes the same Research Note ID and path
- Task report and Research Note remain separate documents
```

## 14. Reporting contract

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
diff/diagnostic summary
limitations
user verification items
next resume point
```

## 15. Handoff update

After Codex pushes, update:

```text
docs/gpt-communication/handoffs/CODEX_LATEST.json
```

The handoff must match the actual remote commit and artifacts.

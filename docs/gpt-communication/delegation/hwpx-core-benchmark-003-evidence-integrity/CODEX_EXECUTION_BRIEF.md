# Local Codex Execution Brief — Task 003 Corrective Cloud Handoff

## Entry condition

Do not create a local execution branch or write any file until the master completes read-only verification, records the final remote HEAD externally and assigns that exact SHA as `local_execution_base_sha`.

Before writing, verify:

- branch: `agent/task003-cloud-restart`
- HEAD equals the master-assigned `local_execution_base_sha`
- working tree is clean
- no concurrent cloud or prompt-agent writer exists

Abort on any mismatch.

## Immutable cloud payload

Do not modify:

- `tools/hancom/benchmark/**`
- `tools/hancom/hwpx-core-benchmark-task003-*.test.mjs`
- `release/test-documents/hwpx-core-benchmark-003-evidence-integrity/schemas-v2/**`
- `release/test-documents/hwpx-core-benchmark-003-evidence-integrity/schemas/**`
- this delegation package

The only active Schema root is `release/test-documents/hwpx-core-benchmark-003-evidence-integrity/schemas-v2/`. The sibling `schemas/` directory is legacy inactive and must not be used for validation.

## Local write allowlist

Use only the output paths in `FILE_CHANGE_PLAN.json`, including:

`docs/gpt-communication/reports/2026-07-03-hwpx-core-benchmark-003-*.md`

Source, Schema, test and delegation-package changes require a new master-approved cloud correction.

## Required execution sequence

1. Capture branch, HEAD, working state and `summary/task-start-manifest.json`.
2. Restore the repository-approved pinned jszip environment without changing source or lock files.
3. Install a pinned standards-compliant Draft 2020-12 validator from an offline artifact. Record exact version, artifact path, SHA256 and legal-file evidence.
4. Run all five prepared test files:
   - `hwpx-core-benchmark-task003-cloud-positive.test.mjs`
   - `hwpx-core-benchmark-task003-cloud-red.test.mjs`
   - `hwpx-core-benchmark-task003-semantic-red.test.mjs`
   - `hwpx-core-benchmark-task003-filesystem-red.test.mjs`
   - `hwpx-core-benchmark-task003-schema-red.test.mjs`
5. Every attempted command must contain command, executed=true, method, valid start/end date-time, exit code, stdout/stderr paths and actual filesystem probes for both logs.
6. Run baseline and current full Hancom regression in the same pinned environment.
7. Execute only Task 003 probes and scenarios. Do not start Task 004, select a core or transition stages.
8. Derive status only from actual execution, verified source/API inspection or an actual blocking prerequisite probe. A blocked result requires reason code, missing prerequisites, checked paths and probe evidence.
9. For S06-S08, probe original input HWPX, output HWPX and before/after snapshots; verify identity distinction and snapshot lineage.
10. For S07, retain relationship source path, ID, type, target and reference source path.
11. For S08, retain root and per-section namespace declarations plus fwSpace count, paths and document order.
12. For S12-S14, probe every artifact, dependency, log, installed file, network/cleanup evidence, upstream artifact and legal file; compare actual size and recalculated SHA256.
13. After every JSON write is finished, run the filesystem inventory. Require the exact five `schemas-v2` Schema files, zero duplicates, zero unclassified active JSON, zero mapping errors and valid write order.
14. Meta-validate the five canonical Schema files and validate every mapped active JSON with the installed standard Validator. Legacy inactive schemas are not active validation inputs.
15. Calculate `invalid_pass_count`; require zero before any completion claim or score award.
16. Capture `summary/task-end-manifest.json`, reject unexpected changes and validate report/test/handoff SHA linkage.
17. Write the final report only under the approved report pattern.

## Independent CI

Independent CI is not required for completion unless the master explicitly marks it required. `not_performed` must include a limitation, but does not by itself force completion false when `required_for_completion=false`.

## Stop conditions

Stop for master review if the base SHA differs, a cloud source change appears necessary, offline dependencies or the standard Validator cannot be established, any required run is not executed or exits nonzero, inventory is incomplete, a Schema fails, an invalid pass occurs, a manifest or SHA link is inconsistent, or Task 004 scope would be required.

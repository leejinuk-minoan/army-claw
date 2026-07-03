# Local Codex Execution Brief — Task 003

## Entry condition

Do not begin until the master explicitly approves local execution and supplies the final delegation SHA. Confirm that `agent/task003-cloud-restart` points to that SHA before any write.

## Immutable cloud source

Do not modify files under `tools/hancom/benchmark/`, `tools/hancom/*task003-cloud*.test.mjs`, `release/test-documents/hwpx-core-benchmark-003-evidence-integrity/schemas-v2/`, or this delegation package. Treat them as the approved cloud-preparation implementation.

Local output writes are restricted to the allowlist in `FILE_CHANGE_PLAN.json`.

## Required execution sequence

1. Record `git status`, branch and HEAD; abort on mismatch or unrelated changes.
2. Capture `summary/task-start-manifest.json` before environment, dependency or result writes.
3. Restore the repository-approved pinned jszip environment without changing lock or source files.
4. Install a pinned standards-compliant Draft 2020-12 validator from a local/offline artifact. Record exact version, artifact path, artifact SHA256, LICENSE/COPYING/NOTICE paths and SHA256.
5. Run the positive and RED Node tests. Capture command, start/end time, stdout, stderr and exit code.
6. Run the full baseline Hancom regression at the Task 003 baseline and the full current regression at the approved branch HEAD in the same environment.
7. Execute only Task 003 probes and scenario validation. Do not perform Task 004, core selection or Stage 1-4 transition.
8. For every scenario, derive status from role applicability, actual execution, source/API inspection, prerequisite probes, imported evidence lineage and scenario validator results. Never inherit a candidate/scenario status.
9. For S06-S08, collect before/after snapshot paths and SHA256, mutation output path and SHA256, allowed target diff, non-target entry hashes and scenario-specific structures.
10. For S12, retain raw samples, process boundary, RSS method and limitations, artifact/dependency inventories, logs and recomputed median/p95/totals.
11. For S13, use a clean isolated environment and record attempted install/runtime commands, installed inventory, network test and cleanup.
12. For S14, record exact identity/version, actual legal files and SHA256, SPDX or manual assessment, source/binary redistribution impact and obligations.
13. After all JSON writes finish, run the filesystem-derived inventory. Reject missing, duplicate or unclassified JSON and reject validation that began before the final write completed.
14. Meta-validate all `schemas-v2` documents and validate every mapped Task 003 JSON document using the installed standard validator.
15. Calculate `invalid_pass_count`; it must be zero. Scores may be awarded only from true validator results.
16. Capture `summary/task-end-manifest.json`, compare to task-start and reject unexpected changes.
17. Run report/test/handoff SHA and completion-gate consistency checks.
18. Write final local artifacts and report. Do not claim `passed`, Task completion, core selection or transition unless all corresponding executions and gates actually succeeded.

## Required commands to record

Record the exact repository commands selected locally rather than substituting prose. At minimum retain:

- environment restoration/install command
- Node positive/RED test command
- baseline full Hancom regression command
- current full Hancom regression command
- candidate probe/scenario commands
- inventory command
- schema meta-validation and document-validation command
- final consistency/manifests command

Each attempted command record must include `executed=true`, timestamps, exit code, stdout path and stderr path.

## Stop conditions

Stop and request master review when the branch SHA differs, a source file outside the allowlist requires modification, the standard validator cannot be installed offline, baseline/current environments differ, inventory is incomplete, an invalid pass is detected, a schema fails, a manifest has unexpected changes, or Task 004 scope would be required.

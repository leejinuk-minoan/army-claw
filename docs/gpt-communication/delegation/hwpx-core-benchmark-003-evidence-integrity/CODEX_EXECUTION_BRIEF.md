# Local Codex Execution Brief — Task 003 Final Correction

## Entry condition

Local work remains prohibited until the master verifies the final remote HEAD and assigns that exact value as `local_execution_base_sha`.

Before any local write, confirm the approved branch, assigned HEAD, clean working state and exclusive writer ownership. Stop on any mismatch.

## Immutable cloud payload

Local Codex must not modify cloud source, Task 003 test source, either Schema directory or the delegation package. The only active Schema root is `schemas-v2/`; `schemas/` is legacy inactive.

Local output remains limited to the allowlist in `FILE_CHANGE_PLAN.json`, including:

`docs/gpt-communication/reports/2026-07-03-hwpx-core-benchmark-003-*.md`

## Identity rules

Git commit identities are exactly 40 lowercase hexadecimal characters. They must not be padded to 64 characters. File, artifact, log, report, handoff and legal-document hashes remain actual 64-character SHA256 values.

Report, test summary and handoff must record the same tested implementation Git SHA.

## Required local validation

1. Record the approved branch and HEAD and capture the start manifest.
2. Restore the pinned environment and standards-compliant Draft 2020-12 Validator using approved local resources.
3. Run all six prepared Task 003 test sources and retain the actual command records and log probes.
4. Validate the five canonical Schema documents and every mapped active JSON document.
5. Run the baseline and current Hancom regression in the same environment.
6. Execute only Task 003 probes and permitted scenarios.
7. Supply the local canonical Schema result and scenario Gate result to `validatePassedResultEligibility()`.
8. Require successful execution, valid log probes, complete evidence, valid validators, empty missing-evidence arrays and a valid scenario Gate.
9. Calculate invalid-pass count and score from the same eligibility result. Rejected eligibility receives zero points and recorded reasons.
10. For S06, require both a distinct output path and a distinct output SHA256.
11. Validate adapter records against the strict status-specific canonical Schema.
12. Complete final inventory, end manifest and report/test/handoff consistency checks.
13. Write the final report only under the approved report pattern.

## Stop conditions

Stop for master review when the assigned SHA differs, a cloud source edit appears necessary, a required local validation cannot be completed, any required test or Schema fails, a claimed pass is rejected, an unexpected file changes, or Task 004 scope would be required.

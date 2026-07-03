# Task 003 Current Regression Alignment

- branch: `agent/task003-cloud-restart`
- correction start: `05fefa0e248a087cc32246c43b432afadb667f44`
- phase: `cloud_current_regression_alignment_complete_awaiting_read_only_verification`

Local results at the tested base:

- Task 003 six-test Gate: 74 passed, 0 failed, exit 0
- current full Hancom regression: 132 passed, 5 failed, exit 1

The five failures came from the legacy regression test using older contracts for role applicability, blocked status, S12-S14 evidence, attempted commands and Schema validation.

Only `tools/hancom/hwpx-core-benchmark-evidence-integrity.test.mjs` is aligned to current APIs. Canonical source, Schema and the six designated Task 003 tests are unchanged. The clean-base changed-path count is 44.

Cloud review is static only. A new local rerun is required after master verification. Task 004, core selection, Stage transition and main merge remain prohibited.

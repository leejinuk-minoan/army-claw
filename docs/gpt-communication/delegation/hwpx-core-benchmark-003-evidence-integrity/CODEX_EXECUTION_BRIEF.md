# Local Codex Rerun Brief — Task 003 Current Regression

Local execution remains prohibited until the master verifies the new final remote HEAD and assigns it as `local_execution_base_sha`.

Previous local results at `05fefa0e248a087cc32246c43b432afadb667f44`:

- Task 003 six-test Gate: 74 passed, 0 failed, exit 0
- current full Hancom regression: 132 passed, 5 failed, exit 1

After approval:

1. Verify the assigned branch, exact HEAD and clean working state.
2. Do not modify cloud source, Schema, Task 003 designated tests or delegation files.
3. Run all six Task 003 Node tests and the current full Hancom regression.
4. Capture actual commands, timestamps, stdout, stderr and exit codes.
5. Confirm role matrix, status evidence, S12-S14 Gates, adapter contract and Schema runtime tests pass under the current canonical APIs.
6. Confirm rubric invalid-pass scoring remains zero.
7. Stop if any required test fails; continue only after both suites have zero failures.
8. Write outputs only to the allowlist in `FILE_CHANGE_PLAN.json`.

Task 004, core selection, Stage transition and main merge remain prohibited.

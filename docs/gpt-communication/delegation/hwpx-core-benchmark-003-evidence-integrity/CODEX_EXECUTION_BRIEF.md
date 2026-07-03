# Local Codex Rerun Brief — Task 003

Local execution remains prohibited until the master verifies the new final remote HEAD and assigns it as `local_execution_base_sha`.

The previous local run at `b4fa034da72a76ef694afbcb2c7808bcd512395c` produced 74 tests, 66 passed, 8 failed, exit code 1. The failures were limited to the semantic RED fixture file and were caused by shared `before`/`after` references.

After approval:

1. Verify the assigned branch, exact HEAD and clean working state.
2. Do not modify cloud source, tests, Schema or delegation files.
3. Run all six Task 003 Node test files.
4. Capture the actual command, timestamps, exit code, stdout and stderr files and probes.
5. Confirm the eight prior S07/S08 failures pass and that relationship and S06 RED cases remain intact.
6. Stop if any required test fails. Continue other Task 003 validation only after required Node failures are zero.
7. Write outputs only to the allowlist in `FILE_CHANGE_PLAN.json`.

Task 004, core selection, Stage transition and main merge remain prohibited.

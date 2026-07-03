# Local Codex Rerun Brief — Task 003 Benchmark Summary Schema

Local execution remains prohibited until the master verifies the new final remote HEAD and assigns it as `local_execution_base_sha`.

Previous local rerun v4 at `83c1f791aeaffae39feee032756a7c148aef0167`:

- Gate A: 75 total, 74 passed, 1 failed, exit 1
- failing test: canonical Schema filesystem parse guard
- adapter-execution: OK
- benchmark-result: OK
- benchmark-summary: FAIL
- dependency-license-offline-manifest: OK
- test-summary: OK
- skipped after failure: Gate B, Ajv Meta-Schema, mapped JSON, inventory, report, commit/push

After approval:

1. Verify the assigned branch, exact HEAD and clean working state.
2. Do not modify cloud source, Schema, tests or delegation files.
3. Rerun Gate A and confirm all five canonical Schema files parse from filesystem.
4. Continue Gate B only after Gate A has zero failures.
5. Run Ajv Meta-Schema validation and mapped JSON validation.
6. Continue inventory, scenarios and completion only after all required Schema checks pass.
7. Stop on any failure and write outputs only to the `FILE_CHANGE_PLAN.json` allowlist.

Task 004, core selection, Stage transition and main merge remain prohibited.

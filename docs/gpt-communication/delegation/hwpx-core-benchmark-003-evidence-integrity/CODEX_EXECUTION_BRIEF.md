# Local Codex Rerun Brief — Task 003 Schema Syntax

Local execution remains prohibited until the master verifies the new final remote HEAD and assigns it as `local_execution_base_sha`.

Previous local rerun v3 at `e1f704367b5bff45afea1731b7ba911ac28eb9e3`:

- Gate A: 74 passed, 0 failed, exit 0
- Gate B: 138 passed, 0 failed, exit 0
- HWPX text probe: success, length 8975
- Ajv: 8.20.0, MIT
- adapter-execution meta-schema: passed
- benchmark-result: JSON parse failure; workflow stopped

After approval:

1. Verify the assigned branch, exact HEAD and clean working state.
2. Do not modify cloud source, Schema, tests or delegation files.
3. Rerun Gate A and Gate B with actual stdout, stderr and exit-code evidence.
4. Run the new canonical five-Schema filesystem parse test.
5. Run Ajv Meta-Schema validation for all five canonical Schemas.
6. Continue mapped JSON validation, inventory, scenarios and completion only after all required Schema checks pass.
7. Stop on any failure and write outputs only to the `FILE_CHANGE_PLAN.json` allowlist.

Task 004, core selection, Stage transition and main merge remain prohibited.

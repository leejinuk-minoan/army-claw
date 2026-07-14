# Local Codex Rerun Brief — Task 003 Mapped JSON Output Alignment

Local execution remains prohibited until the master verifies the new final remote HEAD and assigns it as `local_execution_base_sha`.

Previous local rerun v5 at `f8c050677e0e3b34ad04f1f6c02b1aa754381eb6`:

- Gate A: 75/75 passed, exit 0
- Gate B: 139/139 passed, exit 0
- Gate C Ajv: 8.20.0 MIT, parse failures 0, Meta-Schema failures 0, compile failures 0
- Gate D: inventory missing 0, duplicate 0, unclassified 0, schema mapping error 0, mapped JSON validation failures 151, exit 1
- skipped after Gate D: HWPX scenario, S06/S07/S08 finalization, S12/S13/S14, manifest finalization, completion preflight, final report, commit/push

After approval:

1. Verify the assigned branch, exact HEAD and clean working state.
2. Do not modify cloud source, Schema, tests or delegation files.
3. Run Gate A, Gate B and Gate C with actual stdout, stderr and exit-code evidence.
4. Run pre-output schema/inventory sanity only. Use `buildPreOutputSchemaInventory()` if inspecting stale committed artifacts before output generation. Do not claim completion from this stage.
5. Generate canonical Task 003 active outputs: role matrix, corpus manifest v2, executions, results, dependency/license manifest, scorecards, schema summary, test summary and manifests.
6. Run final mapped JSON validation only after output generation. Call `validateGeneratedJsonAgainstSchemas({ inventory, validator, outputGenerationCompleted: true })` and require mapped validation failure 0.
7. Continue HWPX scenario, S06/S07/S08, S12/S13/S14, completion preflight and final report only after all final Schema checks pass.
8. Stop on any failure and write outputs only to the `FILE_CHANGE_PLAN.json` allowlist.

Active `results/*/Sxx/result.json` and `executions/*/Sxx/adapter-execution.json` remain mandatory canonical Schema targets. Do not skip them or weaken schemas-v2.

Task 004, core selection, Stage transition and main merge remain prohibited.

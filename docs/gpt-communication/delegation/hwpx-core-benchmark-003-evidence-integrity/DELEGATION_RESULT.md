# Task 003 Current Regression Alignment

- task_id: `hwpx-core-benchmark-003-evidence-integrity`
- branch: `agent/task003-cloud-restart`
- correction_start_sha: `05fefa0e248a087cc32246c43b432afadb667f44`
- delegation_payload_sha: pending metadata attestation
- final_remote_head_recording: external verifier/master attestation
- local_execution_base_sha: `null`
- phase: `cloud_current_regression_alignment_complete_awaiting_read_only_verification`
- local_codex_prompt_allowed: `false`
- completion_gate_passed: `false`
- core_selection: `prohibited`
- stage_transition: `prohibited`
- proceed_to_task_004: `false`
- working_state_after_final_push: `read_only`

Previous local results: Task 003 six-test Gate 74/74 passed with exit 0; current full Hancom regression 132/137 passed with 5 failures and exit 1.

Root cause: the legacy full-regression test expected older role-matrix, status, Gate, adapter-command and Schema-runtime contracts.

Fix: only `tools/hancom/hwpx-core-benchmark-evidence-integrity.test.mjs` was aligned to the current canonical APIs. Canonical source, Schema and the six designated Task 003 tests were not changed.

The clean-base inventory contains 44 files with no unrecorded entries. Cloud review was static; a new local rerun is required.

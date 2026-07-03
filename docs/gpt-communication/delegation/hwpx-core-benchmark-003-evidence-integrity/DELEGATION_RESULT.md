# Task 003 Mapped JSON Output Alignment

- task_id: `hwpx-core-benchmark-003-evidence-integrity`
- branch: `agent/task003-cloud-restart`
- correction_start_sha: `f8c050677e0e3b34ad04f1f6c02b1aa754381eb6`
- delegation_payload_sha: pending metadata attestation
- final_remote_head_recording: external verifier/master attestation
- local_execution_base_sha: `null`
- phase: `cloud_mapped_json_output_alignment_complete_awaiting_read_only_verification`
- local_codex_prompt_allowed: `false`
- completion_gate_passed: `false`
- core_selection: `prohibited`
- stage_transition: `prohibited`
- proceed_to_task_004: `false`
- working_state_after_final_push: `read_only`

Local rerun v5 passed Gate A 75/75, Gate B 139/139 and Gate C Ajv with zero parse, Meta-Schema and compile failures. Gate D failed with mapped JSON validation failure 151 despite inventory missing 0, duplicate 0, unclassified 0 and schema mapping error 0.

Root cause: final mapped JSON validation was applied to active stale outputs before current canonical output generation. This is not a Schema syntax problem and no schemas-v2 file was changed.

Fix: source now separates pre-output schema/inventory sanity from final mapped JSON validation. `validateGeneratedJsonAgainstSchemas()` refuses final mapped validation unless output generation is marked complete. Active results and executions remain mandatory final Schema targets.

Regression tests now cover pre-output non-completion behavior, old active artifact mapping and canonical adapter/result status fixtures. The clean-base inventory remains 44 files with no unrecorded entries. Cloud work did not rerun Gate A/B/C/D; a new local rerun is required.

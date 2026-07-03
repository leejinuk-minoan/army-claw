# Task 003 Runtime-Failure Fixture Correction

- task_id: `hwpx-core-benchmark-003-evidence-integrity`
- branch: `agent/task003-cloud-restart`
- correction start SHA: `b4fa034da72a76ef694afbcb2c7808bcd512395c`
- target phase: `cloud_runtime_failure_correction_complete_awaiting_read_only_verification`

Local validation at the correction-start SHA reported 74 tests: 66 passed and 8 failed. The failures were limited to the semantic RED fixture file.

The root cause was shared nested references between `before` and `after` in the S07 and S08 fixture builders. The correction builds `before`, creates `after` with `structuredClone()`, and preserves independent image, BinData, namespace, section, fwSpace-path and document-order structures.

Validator logic, assertion IDs, relationship RED cases and S06 RED cases are unchanged. The clean-base changed-path count remains 43.

Cloud review is static only. Node tests were not rerun in the cloud. Local rerun requires a master-assigned verified final remote HEAD.

Task 004, core selection, Stage transition, main merge, amend, force push and history rewrite remain prohibited.

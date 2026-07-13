# 현재 Army Claw 필수 확인 문서

작성일: 2026-07-10

## 전체 개발 단계

```text
전체 8단계 중 1단계
현재 단계: HwpAdapter 및 HWP/HWPX 엔진 안정화
현재 세부 단계: 1-3 선행 HWPX 엔진 비교·코어 선정
현재 작업: Task 030-B Local Workspace Read-Only Manifest Boundary Local Verification
```

## 현재 브랜치와 판정

```text
work_branch: agent/task030-local-workspace-read-only-manifest-boundary
cloud_package_commit_sha: f8a990135f56013acfd6a676ed44de522f860085
routing_class: cloud_first_local_verify
Task 030-A cloud package complete: true
Task 030-B local verification complete: true
Task 030 final completion gate: true
adapter_validator_gate_required: true
adapter_validator_gate_status: passed
validator_cli_exit_code: 0
validator_summary_status: valid
validator_total_checks: 200
validator_passed_checks: 200
validator_failed_checks: 0
validator_blocked_checks: 0
adapter_validator_unittest_exit_code: 0
local_workspace_adapter_unittest_exit_code: 0
read_only_manifest_boundary_evaluated: true
actual_adapter_invoked: false
actual_file_system_mutation_performed: false
file_content_read_performed: false
stage_transition: prohibited
core_selection: prohibited
```

## 현재 source of truth

```text
docs/gpt-communication/PROJECT_STATE.json
docs/gpt-communication/CURRENT.md
docs/architecture/army-claw-master-plan.md
docs/architecture/army-claw-common-office-adapter-interface-contract.md
docs/architecture/army-claw-adapter-interface-validator-contract.md
docs/architecture/army-claw-adapter-validator-integration-contract.md
docs/architecture/army-claw-local-workspace-adapter-contract.md
docs/architecture/army-claw-local-workspace-controlled-dry-run-boundary.md
docs/architecture/army-claw-local-workspace-read-only-manifest-boundary.md
docs/gpt-communication/contracts/common-office-adapter-interface-contract.json
docs/gpt-communication/contracts/adapter-validator-integration-contract.json
docs/gpt-communication/contracts/local-workspace-adapter-contract.json
docs/gpt-communication/contracts/local-workspace-controlled-dry-run-boundary.json
docs/gpt-communication/contracts/local-workspace-read-only-manifest-boundary.json
tools/adapters/local_workspace_adapter.py
tests/local_workspace_adapter/test_local_workspace_adapter.py
docs/gpt-communication/delegation/task030-local-workspace-read-only-manifest-boundary/CODEX_EXECUTION_BRIEF.md
docs/gpt-communication/delegation/task030-local-workspace-read-only-manifest-boundary/LOCAL_EXECUTION_RESULT_TEMPLATE.json
docs/gpt-communication/delegation/task030-local-workspace-read-only-manifest-boundary/LOCAL_EXECUTION_RESULT.json
docs/gpt-communication/evidence/task030-local-workspace-read-only-manifest-boundary/
docs/gpt-communication/reports/2026-07-10-task030a-local-workspace-read-only-manifest-boundary-cloud-package.md
docs/gpt-communication/reports/2026-07-10-task030b-local-workspace-read-only-manifest-boundary-local-verification.md
docs/research-notes/research-note-index.md
docs/research-notes/research-note-index.json
```

## Task 028 최종 상태

Task 028은 `local_workspace` adapter proof-mode skeleton을 cloud package로 작성하고, Task 028-B local verification에서 validator와 unittest evidence를 확보했다.

```text
Task 028 final completion gate: passed
adapter_validator_gate_status: passed
```

## Task 029 최종 상태

Task 029-A는 controlled dry-run boundary를 cloud package로 작성했고, Task 029-B 로컬 검증과 Task 029-C 마스터 검토 동기화를 완료했다.

```text
Task 029 final completion gate: passed
adapter_validator_gate_status: passed
completion_gate_passed: true
```

## Task 030 현재 상태

Task 030-A는 read-only manifest boundary cloud package를 작성했다. Task 030-B는 로컬에서 validator CLI와 unittest를 실행해 evidence를 생성했다.

```text
Task 030-A cloud package complete: true
Task 030-B local verification complete: true
adapter_validator_gate_required: true
adapter_validator_gate_status: passed
validator_cli_exit_code: 0
validator_summary_status: valid
validator_total_checks: 200
validator_passed_checks: 200
adapter_validator_unittest: 0 / Ran 16 tests OK
local_workspace_adapter_unittest: 0 / Ran 39 tests OK
completion_gate_passed: true
```

## Read-only manifest boundary

```text
execution_context.execution_mode: read_only_manifest
execution_context.read_only_manifest: true
read_only: true
```

Read-only manifest boundary may evaluate metadata-only in-memory fixtures or safe test doubles and return deterministic manifest descriptors and receipts. It must not inspect real user workspace contents or mutate real files.

```text
read_only_manifest_boundary_evaluated: true
actual_adapter_invoked: false
actual_file_system_mutation_performed: false
file_content_read_performed: false
local_hancom_com_executed: false
real_hwp_hwpx_hancell_hanshow_artifact_generated: false
```

## 다음 필요 작업

```text
Task 030-B local verification complete; next task requires master review direction.
routing_class: pending_master_review
```

## 금지

```text
- 사용자 승인 없이 main merge 금지
- force push 금지
- 실제 실행 없는 passed/completed 금지
- 원본 HWP/HWPX/HanCell/HanShow 덮어쓰기 금지
- LLM 직접 파일 편집 또는 native app state 변경 금지
- actual adapter invocation 주장 금지
- real file-system mutation 주장 금지
- real user workspace file content read 주장 금지
- real office artifact generation 주장 금지
- Stage 2 전환 금지
- 최종 HWPX core 선정 금지
```

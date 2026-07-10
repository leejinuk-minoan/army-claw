# 현재 Army Claw 필수 확인 문서

작성일: 2026-07-10

## 전체 개발 단계

```text
전체 8단계 중 1단계
현재 단계: HwpAdapter 및 HWP/HWPX 엔진 안정화
현재 세부 단계: 1-3 선행 HWPX 엔진 비교·코어 선정
현재 작업: Task 030 Local Workspace Read-Only Manifest Boundary
```

## 현재 브랜치와 판정

```text
work_branch: agent/task030-local-workspace-read-only-manifest-boundary
base_sha: 090e8b0411a9ed72b0dabb4d850b84603183edc8
routing_class: cloud_first_local_verify
local_agent_required_now: false
local_verification_required_later: true
Task 030-A cloud package complete: true
Task 030 final completion gate: not passed
adapter_validator_gate_required: true
adapter_validator_gate_status: required_not_run
validator_cli_exit_code: not_run
adapter_validator_unittest_exit_code: not_run
local_workspace_adapter_unittest_exit_code: not_run
read_only_manifest_boundary_evaluated: false
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
docs/gpt-communication/evidence/task030-local-workspace-read-only-manifest-boundary/
docs/gpt-communication/reports/2026-07-10-task030a-local-workspace-read-only-manifest-boundary-cloud-package.md
docs/research-notes/research-note-index.md
docs/research-notes/research-note-index.json
```

## Task 028 최종 상태

Task 028은 `local_workspace` adapter proof-mode skeleton을 cloud package로 작성하고, Task 028-B local verification에서 validator와 unittest evidence를 확보했다.

```text
Task 028-A cloud package complete: true
Task 028-B local verification complete: true
Task 028 final completion gate: passed
adapter_validator_gate_status: passed
```

## Task 029 최종 상태

Task 029-A는 Task 028 proof-mode skeleton 다음 단계로 controlled dry-run boundary를 cloud package로 작성했다. Task 029-B는 로컬에서 validator CLI와 unittest를 실행해 evidence를 생성했다. Task 029-C는 마스터 검토 결과를 문서와 상태 파일에 동기화했다.

```text
Task 029-A cloud package complete: true
Task 029-B local verification complete: true
Task 029-C master review complete: true
Task 029 final completion gate: passed
adapter_validator_gate_required: true
adapter_validator_gate_status: passed
validator_cli_exit_code: 0
validator_summary_status: valid
validator_total_checks: 200
validator_passed_checks: 200
adapter_validator_unittest: 0 / Ran 16 tests OK
local_workspace_adapter_unittest: 0 / Ran 21 tests OK
completion_gate_passed: true
```

## Task 030-A cloud package 상태

Task 030-A는 controlled dry-run 다음 단계로 read-only manifest boundary를 cloud package로 작성한다.

```text
Task 030-A cloud package complete: true
Task 030-B local verification complete: false
Task 030 final completion gate: not passed
adapter_validator_gate_required: true
adapter_validator_gate_status: required_not_run
completion_gate_passed: false
requires_local_verification: true
```

## Read-only manifest boundary

```text
execution_context.execution_mode: read_only_manifest
execution_context.read_only_manifest: true
read_only: true
```

Read-only manifest boundary may evaluate metadata-only in-memory fixtures or safe test doubles and return deterministic manifest descriptors and receipts. It must not inspect real user workspace contents or mutate real files.

```text
read_only_manifest_boundary_evaluated: true only after local tests prove it
actual_adapter_invoked: false
actual_file_system_mutation_performed: false
file_content_read_performed: false
local_hancom_com_executed: false
real_hwp_hwpx_hancell_hanshow_artifact_generated: false
```

## 다음 필요 작업

```text
Task 030-B: Local Workspace Read-Only Manifest Boundary Local Verification
routing_class: local_codex_required
adapter_validator_gate_required: true
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
- Task 030-A를 final Task 030 completion으로 해석 금지
- Stage 2 전환 금지
- 최종 HWPX core 선정 금지
```

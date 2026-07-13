# 현재 Army Claw 필수 확인 문서

작성일: 2026-07-10

## 전체 개발 단계

```text
전체 8단계 중 1단계
현재 단계: HwpAdapter 및 HWP/HWPX 엔진 안정화
현재 세부 단계: 1-3 선행 HWPX 엔진 비교·코어 선정
현재 작업: Task 031-B Local Workspace Staged Output Boundary Local Verification
```

## 현재 브랜치와 판정

```text
work_branch: agent/task031-local-workspace-staged-output-boundary
cloud_package_commit_sha: 4cde40a3fa52c3317fe366e4cb568c4a3c9a772c
routing_class: cloud_first_local_verify
Task 031-A cloud package complete: true
Task 031-B local verification complete: true
Task 031 final completion gate: true
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
staged_output_boundary_evaluated: true
staged_output_sandbox_write_performed: true
actual_adapter_invoked: false
actual_file_system_mutation_performed: false
user_workspace_file_system_mutation_performed: false
file_content_read_performed: false
stage_transition: prohibited
core_selection: prohibited
```

## 현재 source of truth

```text
docs/gpt-communication/PROJECT_STATE.json
docs/gpt-communication/CURRENT.md
docs/architecture/army-claw-master-plan.md
docs/architecture/army-claw-local-workspace-staged-output-boundary.md
docs/gpt-communication/contracts/local-workspace-staged-output-boundary.json
tools/adapters/local_workspace_adapter.py
tests/local_workspace_adapter/test_local_workspace_adapter.py
docs/gpt-communication/delegation/task031-local-workspace-staged-output-boundary/CODEX_EXECUTION_BRIEF.md
docs/gpt-communication/delegation/task031-local-workspace-staged-output-boundary/LOCAL_EXECUTION_RESULT_TEMPLATE.json
docs/gpt-communication/delegation/task031-local-workspace-staged-output-boundary/LOCAL_EXECUTION_RESULT.json
docs/gpt-communication/evidence/task031-local-workspace-staged-output-boundary/
docs/gpt-communication/reports/2026-07-10-task031a-local-workspace-staged-output-boundary-cloud-package.md
docs/gpt-communication/reports/2026-07-10-task031b-local-workspace-staged-output-boundary-local-verification.md
docs/research-notes/task-notes/RN-031-task031-local-workspace-staged-output-boundary.md
docs/research-notes/research-note-index.md
docs/research-notes/research-note-index.json
```

## Task 030 최종 상태

Task 030 final completion gate: passed.

## Task 031 현재 상태

Task 031-A는 staged output boundary cloud package를 작성했다. Task 031-B는 로컬에서 validator CLI와 unittest를 실행해 evidence를 생성했다.

```text
Task 031-A cloud package complete: true
Task 031-B local verification complete: true
adapter_validator_gate_required: true
adapter_validator_gate_status: passed
validator_cli_exit_code: 0
validator_summary_status: valid
validator_total_checks: 200
validator_passed_checks: 200
adapter_validator_unittest: 0 / Ran 16 tests OK
local_workspace_adapter_unittest: 0 / Ran 59 tests OK
completion_gate_passed: true
```

## Staged output boundary

```text
execution_context.execution_mode: staged_output
execution_context.staged_output: true
staged_output: true
```

Staged output boundary may write request-provided generated content only to a controlled temporary unit-test staging sandbox. It must not mutate production or real user workspace files, read real user file contents, invoke native apps, invoke Hancom COM, or generate real office artifacts.

```text
staged_output_boundary_evaluated: true
staged_output_sandbox_write_performed: true only in controlled temporary unit-test sandbox
actual_adapter_invoked: false
actual_file_system_mutation_performed: false
user_workspace_file_system_mutation_performed: false
file_content_read_performed: false
local_hancom_com_executed: false
real_hwp_hwpx_hancell_hanshow_artifact_generated: false
```

## 다음 필요 작업

```text
Task 031-B local verification complete; next task requires master review direction.
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
- production file-system mutation 주장 금지
- real user workspace mutation 주장 금지
- real user workspace file content read 주장 금지
- real office artifact generation 주장 금지
- Stage 2 전환 금지
- 최종 HWPX core 선정 금지
```

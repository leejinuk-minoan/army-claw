# 현재 Army Claw 필수 확인 문서

작성일: 2026-07-10

## 전체 개발 단계

```text
전체 8단계 중 1단계
현재 단계: HwpAdapter 및 HWP/HWPX 엔진 안정화
현재 세부 단계: 1-3 선행 HWPX 엔진 비교·코어 선정
현재 작업: Task 028-A Local Workspace Adapter Proof-Mode Skeleton Cloud Package
```

## 현재 브랜치와 판정

```text
work_branch: agent/task028-local-workspace-adapter-proof-mode-skeleton
base_sha: 10f95ef7a8f62d371d08aff8f0332fc30ee6384c
routing_class: cloud_first_local_verify
local_agent_required: true
cloud_package_complete: true
final_task028_completion_gate_passed: false
adapter_validator_gate_required: true
adapter_validator_gate_status: required_not_run
stage_transition: prohibited
core_selection: prohibited
```

## 현재 source of truth

```text
docs/gpt-communication/PROJECT_STATE.json
docs/architecture/army-claw-master-plan.md
docs/architecture/army-claw-common-office-adapter-interface-contract.md
docs/architecture/army-claw-adapter-interface-validator-contract.md
docs/architecture/army-claw-adapter-validator-integration-contract.md
docs/architecture/army-claw-local-workspace-adapter-contract.md
docs/gpt-communication/contracts/common-office-adapter-interface-contract.json
docs/gpt-communication/contracts/adapter-validator-integration-contract.json
docs/gpt-communication/contracts/local-workspace-adapter-contract.json
tools/adapters/local_workspace_adapter.py
tests/local_workspace_adapter/test_local_workspace_adapter.py
docs/gpt-communication/delegation/task028-local-workspace-adapter-proof-mode-skeleton/CODEX_EXECUTION_BRIEF.md
docs/research-notes/research-note-index.md
docs/research-notes/research-note-index.json
```

## Task 028-A 범위

Task 028-A는 `local_workspace` adapter proof-mode skeleton cloud package다.

포함:

- proof-mode adapter module
- local workspace adapter unittest source
- target-specific proof request/response samples
- local verification delegation package
- local verification evidence directory marker
- RN-028 research note
- research note index update
- project state update

미포함:

- final Task 028 completion
- validator CLI execution
- unittest execution
- actual file-system mutation
- actual adapter invocation
- production adapter implementation
- CI / GitHub Actions implementation
- Hancom COM execution
- Stage 2 transition
- final HWP/HWPX core selection

## Adapter validator gate

Task 028 adds adapter proof-mode code and tests. Therefore Task 026 gate policy applies.

```text
adapter_validator_gate_required: true
adapter_validator_gate_status: required_not_run
validator_cli_exit_code: not_run
adapter_validator_unittest_exit_code: not_run
local_workspace_adapter_unittest_exit_code: not_run
final_task028_completion_gate_passed: false
```

Final completion is blocked until local verification evidence exists.

## Required next work

```text
Task 028-B: Local Workspace Adapter Proof-Mode Skeleton Local Verification
routing_class: local_codex_required
```

Required commands are recorded in:

```text
docs/gpt-communication/delegation/task028-local-workspace-adapter-proof-mode-skeleton/CODEX_EXECUTION_BRIEF.md
```

## 금지

```text
- 사용자 승인 없이 main merge 금지
- force push 금지
- 실제 실행 없는 passed/completed 금지
- 원본 HWP/HWPX/HanCell/HanShow 덮어쓰기 금지
- LLM 직접 파일 편집 또는 native app state 변경 금지
- Task 028-A를 final Task 028 completion으로 해석 금지
- local verification evidence 없이 adapter validator gate passed 주장 금지
- Stage 2 전환 금지
- 최종 HWPX core 선정 금지
```

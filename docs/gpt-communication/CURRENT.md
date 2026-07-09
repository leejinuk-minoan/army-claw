# 현재 Army Claw 필수 확인 문서

작성일: 2026-07-10

## 전체 개발 단계

```text
전체 8단계 중 1단계
현재 단계: HwpAdapter 및 HWP/HWPX 엔진 안정화
현재 세부 단계: 1-3 선행 HWPX 엔진 비교·코어 선정
현재 작업: Task 027 Local Workspace Adapter Contract Proof
```

## 현재 브랜치와 판정

```text
work_branch: agent/task027-local-workspace-adapter-contract-proof
base_sha: 0a02e86ee5f89d72432c6f89676614953358f466
routing_class: cloud_delegable
local_agent_required: false
completion_gate_passed: true
adapter_validator_gate_required_for_task027: false
adapter_validator_gate_status_for_task027: not_required
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
docs/research-notes/research-note-index.md
docs/research-notes/research-note-index.json
```

## Task 027 범위

Task 027은 `local_workspace` target-specific adapter contract proof다.

포함:

- local workspace adapter architecture contract
- local workspace adapter machine-readable JSON contract
- approved workspace root policy
- relative path safety policy
- no source overwrite policy
- future operation class definition
- RN-027 research note
- research note index update
- project state update

미포함:

- production adapter implementation
- actual file-system mutation
- actual adapter invocation
- common interface contract change
- validator source change
- validation matrix change
- proof-mode sample change
- negative sample change
- CI / GitHub Actions implementation
- Hancom COM execution
- Stage 2 transition
- final HWP/HWPX core selection

## Adapter validator gate

Task 026의 adapter validator integration contract는 향후 adapter 구현/실행/공통 sample 변경에 validator gate를 요구한다.

Task 027은 target-specific contract supplement만 생성하며 다음을 변경하지 않았다.

```text
common adapter interface contract: unchanged
common adapter error taxonomy: unchanged
adapter validator source: unchanged
unittest source: unchanged
validation matrix: unchanged
proof-mode samples: unchanged
negative samples: unchanged
production adapter code: unchanged
actual adapter invocation: false
actual file-system mutation: false
```

따라서 Task 027 자체는 다음으로 기록한다.

```text
adapter_validator_gate_required: false
adapter_validator_gate_status: not_required
```

다음 implementation task에서 adapter code, sample, matrix, 또는 실제 실행이 포함되면 gate는 required로 전환해야 한다.

## 후속 Task

```text
Task 028: Local Workspace Adapter Proof-Mode Skeleton
recommended routing_class: cloud_first_local_verify
adapter_validator_gate_required: true
```

## 금지

```text
- 사용자 승인 없이 main merge 금지
- force push 금지
- 실제 실행 없는 passed/completed 금지
- 원본 HWP/HWPX/HanCell/HanShow 덮어쓰기 금지
- LLM 직접 파일 편집 또는 native app state 변경 금지
- Task 027을 production local_workspace adapter 구현으로 해석 금지
- Stage 2 전환 금지
- 최종 HWPX core 선정 금지
```

# 현재 Army Claw 필수 확인 문서

작성일: 2026-07-14

## 전체 개발 단계

```text
전체 8단계 중 1단계
현재 단계: HwpAdapter 및 HWP/HWPX 엔진 안정화
현재 세부 단계: 1-3 선행 HWPX 엔진 비교·코어 선정
현재 active task: Task 036 HWP/HWPX Template Fidelity Selector Plan and Execution Bridge Boundary
현재 phase: Task 036-A Cloud Contract Package
```

## Canonical 기준선

```text
canonical branch: main
Task 035 status: final_verified
Task 035 integration PR: #3
Task 035 main merge SHA: e5f782cdafbebd25697fc58a32c1fa0042857b12
Task 035 post-merge state sync PR: #4
Task 036 base SHA: 59fd64765a0fe50846ceb8cafa98d8c804a3088c
Task 036 work branch: agent/task036-hwp-hwpx-template-fidelity-selector-execution-bridge
```

## Army Claw 정체성

```text
Army Claw는 HWPX 전용 생성기가 아니다.
Army Claw는 오프라인/폐쇄망 로컬 PC 지원 및 오피스 문서 생성 에이전트다.
HWP/HWPX, HanCell, HanShow, local_workspace는 모두 1급 대상이다.
LLM은 구조화된 계획만 생성한다.
검증된 adapter가 파일과 native app state를 결정론적으로 처리한다.
```

## Task 036-A 상태

```text
status: cloud_contract_package_complete_pending_local_implementation
cloud_contract_package_complete: true
implementation_required: true
local_verification_required: true
local_verification_complete: false
master_review_complete: false
completion_gate_passed: false
adapter_validator_gate_required: true
adapter_validator_gate_status: required_not_run
```

Task 036-A는 다음을 정의했다.

```text
selector types:
- paragraph_text
- contains_text
- nth_paragraph
- table_cell_text

index convention:
- occurrence: 1-based
- section/paragraph/table/row/column: 0-based
- nth_paragraph scope: top_level_paragraphs
- merged cell: anchor coordinate only
```

모든 selector는 mutation 전에 원본 template에 대해 사전 해석한다. Duplicate ID, no match, ambiguity, occurrence/index overflow, source mismatch, non-anchor merged cell, overlapping target은 blocking error다.

## Preservation 및 Preview

```text
text replacement only
source template overwrite: prohibited
first-run style: preserve
paragraph/cell/table properties: preserve
BinData: preserve
package entry set: preserve
unselected content: preserve
Preview/PrvText.txt sync: required when present
preview mapping impossible: blocking
whole HWPX byte-for-byte determinism: not claimed
```

## Execution bridge

```text
validated HWP Template Fidelity Plan
-> HWP adapter slot
-> hwpx-template-fidelity-fill
-> Task 031 staged output
-> Task 033 evidence manifest
-> Task 035 controlled promotion
```

Bridge link fields include `staged_artifact_id`, `staged_receipt_id`, `evidence_manifest_id`, and `promotion_authorization_id`. Task 036은 기존 계약을 복제하지 않고 링크한다.

## Cloud 실행 사실

```text
tools/hancom source modified: false
existing Node tests modified: false
adapter/validator implementation modified: false
Node tests executed: false
actual HWP/HWPX generated: false
Hancom COM/native app executed: false
actual filesystem mutation: false
user workspace mutation: false
production promotion: false
public internet access: false
dependency installation: false
```

## 다음 작업

```text
Task 036-B: Local Implementation and Verification
routing_class: local_codex_required
status: ready_for_local_implementation_prompt
start point: final Task 036-A cloud commit reported externally
```

Task 036은 아직 `final_verified`가 아니다. Task 036-B 구현·로컬 검증, adapter-validator gate, final master review가 남아 있다.

## 유지되는 금지사항

```text
- main 직접 push/merge 금지
- force push/rebase/history rewrite 금지
- 원본 HWP/HWPX 덮어쓰기 금지
- Task 036-A에서 tools/hancom 및 validator implementation 수정 금지
- 실제 실행 없는 passed/completed 주장 금지
- Stage 2 전환 금지
- final HWPX core 선정 금지
```

## Source of truth

```text
docs/gpt-communication/PROJECT_STATE.json
docs/gpt-communication/CURRENT.md
docs/architecture/army-claw-hwp-hwpx-template-fidelity-selector-execution-bridge.md
docs/gpt-communication/contracts/hwp-hwpx-template-fidelity-selector-plan.json
docs/gpt-communication/tasks/task036-hwp-hwpx-template-fidelity-selector-execution-bridge/TASK_CONTRACT.md
docs/gpt-communication/delegation/task036-hwp-hwpx-template-fidelity-selector-execution-bridge/CODEX_EXECUTION_BRIEF.md
docs/gpt-communication/delegation/task036-hwp-hwpx-template-fidelity-selector-execution-bridge/LOCAL_EXECUTION_RESULT_TEMPLATE.json
docs/gpt-communication/reports/2026-07-14-task036a-hwp-hwpx-template-fidelity-selector-execution-bridge-cloud-package.md
docs/research-notes/task-notes/RN-036-task036-hwp-hwpx-template-fidelity-selector-execution-bridge.md
```
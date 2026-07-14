# 현재 Army Claw 필수 확인 문서

작성일: 2026-07-14

## 전체 개발 단계

```text
전체 8단계 중 1단계
현재 단계: HwpAdapter 및 HWP/HWPX 엔진 안정화
현재 세부 단계: 1-3 선행 HWPX 엔진 비교·코어 선정
현재 active task: Task 036 HWP/HWPX Template Fidelity Selector Plan and Execution Bridge Boundary
현재 phase: Task 036-A2 Contract Corrective Sync
```

## Canonical 기준선

```text
canonical branch: main
Task 035 status: final_verified
Task 035 main merge SHA: e5f782cdafbebd25697fc58a32c1fa0042857b12
Task 036 base SHA: 59fd64765a0fe50846ceb8cafa98d8c804a3088c
Task 036 work branch: agent/task036-hwp-hwpx-template-fidelity-selector-execution-bridge
Task 036-A2 content correction commit: 26904af4a668a6b121f883aa9c4ff549ae19206e
Task 036-A2 state-sync commit: reported externally by cloud agent final report
```

Git commit은 자신의 SHA를 같은 commit 내용에 포함할 수 없다. 따라서 Task 036-B required start HEAD는 cloud agent 최종 보고의 final state-sync SHA와 원격 branch HEAD가 동일한지 확인해 확정한다.

## Task 036-A2 상태

```text
status: cloud_contract_package_corrected_pending_local_implementation
cloud_contract_package_complete: true
contract_correction_complete: true
implementation_required: true
local_verification_required: true
local_verification_complete: false
master_review_complete: false
completion_gate_passed: false
adapter_validator_gate_required: true
adapter_validator_gate_status: required_not_run
```

## 계약 교정 결과

```text
Task 036 error code count: 23
Task 036 error definition count: 23
missing error definitions: 0
extra error definitions: 0
required error metadata:
- category
- blocking
- recoverable
- default_message
- evidence_required
```

민감한 문서 전체 텍스트는 오류 evidence에 저장하지 않는다. 좌표, count, digest, 짧은 reason code 및 failure stage를 사용한다.

## Bridge와 Preview 교정

```text
plan-level links:
- plan_id
- template_artifact_id
- template_digest
- staged_artifact_id
- staged_receipt_id
- evidence_manifest_id
- promotion_authorization_id

operation-level collection:
- operation_id
- selector_id
- resolved_target
- before_text_digest
- after_text_digest

Preview/PrvText.txt exists: sync required
mapping impossible: hwp_preview_sync_failed
Preview structurally absent: execution allowed with preview_status=structurally_absent
structurally absent must not be reported as sync success
```

## Task 036-B 필수 구조

```text
Task 036-B1:
implementation + official adapter validator registration + validator tests
fixed implementation baseline commit required
final LOCAL_EXECUTION_RESULT 생성 금지

Task 036-B2:
fixed B1 SHA에서 formal verification
immutable evidence와 LOCAL_EXECUTION_RESULT 생성
implementation SHA와 evidence commit SHA 분리 기록
```

Official adapter validator integration과 validator tests는 선택 사항이 아니라 필수다. 성공한 Task 036-B 이후 adapter validator gate는 `required_not_run` 상태로 남아 있을 수 없다.

## 다음 작업

```text
Task 036-B1/B2 Local Implementation and Formal Verification
routing_class: local_codex_required
status: ready_for_local_implementation
required start HEAD: 이 문서를 기록한 final branch HEAD를 cloud agent 최종 보고에서 확인
```

## Cloud 실행 사실

```text
tools/hancom source modified: false
tests modified: false
validator implementation modified: false
JSON parser command executed: false
Node tests executed: false
actual HWP/HWPX generated: false
Hancom COM/native app executed: false
user workspace mutation: false
production promotion: false
public internet access: false
dependency installation: false
```

Task 036은 아직 `final_verified`가 아니다. Stage 2 전환과 final HWPX core 선정은 계속 금지된다.

## Source of truth

```text
docs/gpt-communication/PROJECT_STATE.json
docs/gpt-communication/CURRENT.md
docs/gpt-communication/contracts/hwp-hwpx-template-fidelity-selector-plan.json
docs/gpt-communication/delegation/task036-hwp-hwpx-template-fidelity-selector-execution-bridge/CODEX_EXECUTION_BRIEF.md
docs/gpt-communication/delegation/task036-hwp-hwpx-template-fidelity-selector-execution-bridge/LOCAL_EXECUTION_RESULT_TEMPLATE.json
docs/gpt-communication/reports/2026-07-14-task036a2-template-fidelity-contract-corrective-sync.md
docs/research-notes/task-notes/RN-036-task036-hwp-hwpx-template-fidelity-selector-execution-bridge.md
```

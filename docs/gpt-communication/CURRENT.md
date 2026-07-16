# 현재 Army Claw 필수 확인 문서

작성일: 2026-07-16

## 전체 개발 단계

```text
전체 8단계 중 1단계
현재 단계: HwpAdapter 및 HWP/HWPX 엔진 안정화
현재 세부 단계: 1-3 선행 HWPX 엔진 비교·코어 선정
현재 active task: Task 036 HWP/HWPX Template Fidelity Selector Plan and Execution Bridge Boundary
현재 phase: Task 036-B0V Offline JSZip Runtime Validation
```

## Task 036-B0 상태

```text
B0RL offline JSZip vendor package: complete
B0V offline runtime validation: complete
offline_runtime_validation_gate_passed: true
node_runtime_version: v24.14.0
jszip_runtime_version: 3.10.1
template_fidelity_baseline_passed: true
hancom_node_baseline_passed: true
completion_gate_passed: false
master_review_complete: false
```

## Dependency policy

```text
source acquisition: existing_local_packaging_or_cache
build-time public internet acquisition: false
runtime public internet dependency: false
npm registry: false
package manager install: false
tracked node_modules: false
runtime materialization target: .tmp/task036-offline-node-runtime
```

## 다음 작업

```text
Task 036-B1/B2 Local Implementation and Formal Verification
status: ready_for_local_implementation
```

Task 036-B1/B2 구현은 아직 시작하지 않았다. Task 036 final completion, Stage 2, final HWPX core selection은 선언하지 않는다.

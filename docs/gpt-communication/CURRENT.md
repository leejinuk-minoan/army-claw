# 현재 Army Claw 필수 확인 문서

작성일: 2026-07-16

## 전체 개발 단계

```text
전체 8단계 중 1단계
현재 단계: HwpAdapter 및 HWP/HWPX 엔진 안정화
현재 세부 단계: 1-3 선행 HWPX 엔진 비교·코어 선정
현재 active task: Task 036 HWP/HWPX Template Fidelity Selector Plan and Execution Bridge Boundary
현재 phase: Task 036-B0RL Local Offline JSZip Vendor Creation
```

## Canonical 기준선

```text
canonical branch: main
Task 035 status: final_verified
Task 035 main merge SHA: e5f782cdafbebd25697fc58a32c1fa0042857b12
Task 036 work branch: agent/task036-hwp-hwpx-template-fidelity-selector-execution-bridge
Task 036 required start HEAD: 2b7c163d63c2328f405a6127be969c59fa8f7271
```

## Task 036-B0RL 상태

```text
status: offline_dependency_package_created_pending_runtime_validation
offline_jszip_vendor_package_complete: true
offline_jszip_version: 3.10.1
offline_jszip_git_blob_sha: ff4cfd5e8fdc49176c2d1d409afa897f40be01f4
offline_jszip_sha256: acc7e41455a80765b5fd9c7ee1b8078a6d160bbbca455aeae854de65c947d59e
offline_runtime_validation_required: true
offline_runtime_validation_complete: false
completion_gate_passed: false
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
Task 036-B0V Offline Runtime Validation
status: required before Task 036-B1/B2
```

Task 036-B1/B2 구현은 B0V가 통과하기 전까지 시작하지 않는다.

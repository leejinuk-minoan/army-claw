# Task Contract Routing Addendum

## 1. Identity and precedence

```text
task_id: hwpx-core-benchmark-003-evidence-integrity
mode: corrective_continuation
stage: 1-3
branch: feature/hwpx-core-benchmark
routing_class: hybrid
phase: cloud_preparation
status: awaiting_codex_delegation_engine
```

이 문서는 다음 원 계약의 클라우드–로컬 실행 라우팅 addendum이다.

```text
docs/gpt-communication/tasks/hwpx-core-benchmark-003-evidence-integrity/TASK_CONTRACT.md
```

라우팅·실행 주체·phase·쓰기 잠금에 관해서는 이 addendum과 다음 문서를 우선한다.

```text
docs/gpt-communication/PROJECT_STATE.json
docs/gpt-communication/CURRENT.md
docs/gpt-communication/AGENT_OPERATING_MODEL.md
docs/gpt-communication/CLOUD_LOCAL_EXECUTION_ROUTING.md
docs/gpt-communication/opinions/2026-07-03-hwpx-core-benchmark-003-master-review.md
```

원 Task Contract의 목표·완료 Gate·금지사항은 유지한다. Task 004는 Task 003 완료 전 차단한다.

## 2. Routing fields

```text
routing_class: hybrid
phase: cloud_preparation
delegation_package_path: docs/gpt-communication/delegation/hwpx-core-benchmark-003-evidence-integrity/
delegation_commit_sha: null
local_execution_base_sha: null
local_validation_required: true
```

필드 의미:

```text
delegation_commit_sha:
  Codex 대행 엔진이 클라우드 안전 변경과 delegation package 6개 파일을 push한 commit SHA.
  현재는 아직 실행 전이므로 null.

local_execution_base_sha:
  프롬프트 작성·라우팅 에이전트가 delegation commit과 package를 원격 검증한 후
  로컬 Codex가 반드시 포함해야 하는 기준 SHA.
  현재 phase가 cloud_preparation이므로 null.
```

## 3. Cloud scope

Codex 대행 엔진이 먼저 수행한다.

```text
- candidate/scenario 고정 status 분기 제거
- role applicability, actual evidence, API/source inspection과 prerequisite probe 기반 status 구조
- S06 merged-cell/row-span/col-span/allowed-diff/non-target-hash semantic validator
- S07 image/BinData path·size·SHA256와 relationship target semantic validator
- S08 fwSpace count/path와 namespace prefix/URI semantic validator
- S12 warmup/sample/median/p95/process-boundary/inventory/log 요구 구조와 complete gate
- S13 clean-environment/install/runtime/network/cleanup 요구 구조와 complete gate
- S14 LICENSE/COPYING/NOTICE/SPDX/redistribution 요구 구조와 complete gate
- 5개 Draft 2020-12 JSON Schema의 conditional/nested/strict 설계와 정적 변경
- filesystem-derived 전체 Task 003 JSON inventory 알고리즘
- invalid_pass_count 실제 계산과 invalid-pass injection test
- 모든 score point를 validator result에 연결하는 rubric validator
- task-start/task-end immutability manifest 및 comparison 구조
- RED/positive validator unit fixtures와 정적 테스트 코드
- 로컬 Codex 실행용 delegation package 6개 파일 작성
```

클라우드 변경이 가능한 대표 경로:

```text
tools/hancom/benchmark/**
tools/hancom/validators/**
tools/hancom/**/*benchmark*.test.mjs
release/test-documents/hwpx-core-benchmark-003-evidence-integrity/schemas/**
docs/gpt-communication/delegation/hwpx-core-benchmark-003-evidence-integrity/**
```

대행 엔진은 로컬 실행·설치·전체 회귀·실제 artifact hash 수집을 수행했다고 주장하지 않는다.

## 4. Local scope

프롬프트 작성·라우팅 에이전트가 delegation commit과 package를 검증하고 phase를 `local_execution`으로 전환한 후에만 로컬 Codex가 수행한다.

```text
- repository-approved pinned jszip 환경 복구
- standards-compliant Draft 2020-12 validator artifact 반입·설치
- validator와 jszip의 exact version·artifact·실제 LICENSE·SHA256 수집
- offline 설치·재실행과 runtime network requirement 검증
- task-start baseline과 current commit에서 동일 환경으로 전체 Hancom test 실행
- 클라우드 변경 코드의 실제 로컬 검증
- 최종 filesystem-derived JSON inventory 실행
- 5개 Schema meta-schema validation과 전체 JSON 최종 Schema validation
- stdout/stderr/exit code 수집
- 실제 dependency/artifact/immutability manifests 생성
- 최종 benchmark 산출물·로그·보고서 생성
- 최종 commit·push
```

## 5. Local validation required

다음은 클라우드 변경 후 반드시 로컬에서 검증한다.

```text
- evidence-only status engine의 실제 Node import와 테스트
- S06~S08 positive/negative semantic fixtures
- S12~S14 positive/negative complete gates
- Draft 2020-12 standard validator에서 5개 Schema compile/meta-validation
- filesystem inventory의 unmapped/missing JSON 0건
- invalid-pass injection과 score non-inflation
- repository-approved pinned jszip dependency replay
- baseline/current full tools/hancom regression
- current full regression exit code 0, failed 0
- 실제 stdout/stderr/log/artifact SHA256
- report·test-summary·delegation/local handoff·commit SHA 정합성
```

클라우드 정적 테스트 결과만으로 `passed`, `completed` 또는 Task 완료를 선언하지 않는다.

## 6. Delegation package contract

Codex 대행 엔진은 다음 6개 파일을 모두 생성·갱신한다.

```text
docs/gpt-communication/delegation/hwpx-core-benchmark-003-evidence-integrity/
├─ ROUTING_DECISION.json
├─ DELEGATION_PLAN.md
├─ FILE_CHANGE_PLAN.json
├─ TEST_PLAN.json
├─ CODEX_EXECUTION_BRIEF.md
└─ DELEGATION_RESULT.md
```

필수 package metadata:

```text
task_id
branch
cloud_start_sha
delegation_commit_sha
changed_files
cloud_validation_performed
cloud_validation_not_performed
local_validation_required
local_files_to_modify
concurrency_and_overlap_risks
Task 004 scope check
master_review_required
```

`CODEX_EXECUTION_BRIEF.md`는 지금 프롬프트 작성 에이전트가 작성하지 않는다. Codex 대행 엔진이 자신의 실제 변경 결과를 기준으로 작성하고 push한다.

## 7. Phase and write lock

```text
현재:
cloud_preparation

다음:
delegation push
→ prompt-agent verification
→ local_execution
→ local Codex push
→ result_review
```

규칙:

```text
- cloud_preparation 동안 로컬 Codex 실행 금지
- local_execution 전환 후 대행 엔진 추가 push 금지
- 동일 파일 동시 수정 금지
- 추가 클라우드 수정이 필요하면 phase를 cloud_preparation으로 되돌린 뒤 수행
```

## 8. Prompt-agent verification gate

대행 엔진 결과가 도착하면 프롬프트 작성·라우팅 에이전트가 다음을 검증한다.

```text
- cloud_start_sha
- delegation_commit_sha
- final pushed HEAD
- branch가 feature/hwpx-core-benchmark인지
- master routing commit ecea4ccf0e25e92b3fb8bbd29a6bfc70ea3b459a 포함 여부
- 변경 파일과 Task Contract 허용 범위
- delegation package 6개 파일 존재와 내부 SHA 정합성
- cloud에서 수행했다고 주장한 정적 검증의 실제 근거
- local_validation_required 항목
- 로컬 Codex가 수정할 파일
- 대행 엔진과 로컬 Codex의 파일 중복·동시 수정 위험
- Task 004·코어 선정·Stage 1-4·COM·사용자 시각검증 범위 침범 여부
```

검증 통과 후에만:

```text
phase: local_execution
delegation_commit_sha: <verified commit>
local_execution_base_sha: <verified final pushed HEAD>
```

로 갱신한다.

## 9. Local Codex prompt restriction

현재 phase는 `cloud_preparation`이므로 로컬 Codex 프롬프트를 작성하지 않는다.

향후 로컬 프롬프트는 다음 파일만 중심으로 짧게 작성한다.

```text
1. CODEX_EXECUTION_BRIEF.md
2. 이 Task Contract addendum의 local scope
3. FILE_CHANGE_PLAN.json
4. TEST_PLAN.json
```

전체 저장소와 과거 보고서를 처음부터 다시 읽게 하지 않는다.

## 10. Forbidden scope

```text
- Task 004 시작
- 코어 선정
- Stage 1-4 진입
- main merge
- amend 또는 force push
- 대행 엔진과 로컬 Codex의 동일 파일 동시 수정
- 실제 실행 없는 passed/completed
- 실제 COM output 전 사용자 시각검증 요청
- 클라우드에서 pinned package 설치·전체 회귀를 수행했다고 주장
```

## 11. Master review

현재 라우팅 정렬 자체는 기존 마스터 정책의 구현이므로:

```text
master_review_required: false
```

다음 상황에서는 true로 전환한다.

```text
- cloud/local scope 충돌로 기존 완료 Gate 변경 필요
- 제품 runtime dependency 변경 필요
- 라이선스·재배포 불확실성
- 동일 파일 쓰기 충돌을 안전하게 분리할 수 없음
- Task 004 범위 선행이 필요하다고 판단됨
- 단계·아키텍처 변경 필요
- main merge 필요
```

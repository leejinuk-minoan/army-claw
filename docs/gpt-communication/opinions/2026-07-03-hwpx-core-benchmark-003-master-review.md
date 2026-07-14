# HWPX Core Benchmark 003 마스터 검토 및 프롬프트 에이전트 지시

작성일: 2026-07-03
판정: meaningful partial progress; Task 003 remains open
현재 단계: 1-3 선행 HWPX 엔진 비교·코어 선정

## 1. 원격 검증 결과

확인한 원격 상태:

```text
branch: feature/hwpx-core-benchmark
task_start_commit: 0064049f03d4167b322e7b407518a0e42e685d83
tested_implementation_commit: 5d4c60fe0911b430e648874ae45b06069270ab9e
Codex report commit: 534df85b74c7c3cb6fc749e24ae1633927d72a3e
prompt-agent review commit: 14d151f6898e64eb0ba0b397b566209b49956d82
```

Codex의 두 commit은 Task 003 허용 범위에 한정돼 있으며, benchmark-001/002 산출물과 기존 보고서를 변경하지 않았다.

## 2. 마스터 최종 판정

```text
benchmark_003_status: partial_meaningful_progress
completion_gate_passed: false
task_003_completion: rejected
proceed_to_task_004: false
core_selection: prohibited
stage_transition: prohibited
user_visual_review_required_now: false
```

Codex는 잘못된 `passed`를 모두 하향하고 역할 분리와 기본 증거 구조를 만들었다. 이 진전은 인정한다.

그러나 표준 JSON Schema validator 부재만이 유일한 미완료 사유는 아니다. 프롬프트 작성 에이전트가 식별한 정적 status 분기, 존재 여부만 확인하는 evidence gate, 불완전한 schema, 전체 회귀 실패도 독립적인 완료 차단 사유다.

## 3. 인정하는 성과

- benchmark-002의 S06~S08, S12~S14 invalid pass를 blocked로 하향
- Editor, Validator, Layout Authority 역할 분리
- 역할 무관 시나리오를 not_applicable로 분리
- planned_commands와 attempted_commands 분리
- v1 fixture explicit missing record 생성
- 5개 schema 파일 생성
- Task 003 산출물 격리
- Codex가 partial, completion gate false, core selection 금지를 정직하게 보고
- Task 003 단위 테스트 7/0

## 4. Task 003 완료를 막는 핵심 문제

### 4.1 status가 아직 evidence-only가 아님

`correctedStatusForScenario()`는 후보 ID와 scenario ID를 기준으로 Current Node/XML S01~S05, 외부 후보, Hancom COM 상태를 코드에 고정한다.

향후 status는 다음 자료에서만 도출해야 한다.

```text
role applicability
actual execution record
source/API inspection evidence
filesystem/runtime prerequisite probe
imported evidence with source path and SHA256
scenario-specific evidence validator result
```

`unsupported`에도 실제 API/source inspection artifact가 필요하고, `blocked`에도 실제 prerequisite probe 결과가 필요하다.

### 4.2 S06~S08은 필드 존재만 검사함

현재 gate는 before/after 필드가 존재하는지 확인하지만 값의 의미를 비교하지 않는다.

필수 검증:

```text
artifact existence
artifact SHA256 validity
mutation output existence and distinct output identity
before/after merged-table maps equality
row/col span maps equality
image/BinData path·size·SHA256 equality
relationship targets equality
fwSpace count/path equality
namespace prefix/URI map equality
allowed target diff
non-target entry hash equality
all scenario assertions passed
```

임의의 서로 다른 before/after 값을 넣어도 통과할 수 없는 validator여야 한다.

### 4.3 S12~S14 gate가 계약보다 약함

S12:

- warmup과 measured runs
- median/p95 재계산 일치
- 분리 프로세스 또는 측정 한계
- candidate artifact inventory와 총 크기
- runtime/dependency inventory와 설치 크기
- 측정 명령과 실제 raw log
- peak memory 측정 방법

S13:

- clean isolated environment
- pinned offline artifact inventory
- 실제 attempted install command
- exit code, stdout/stderr
- installed inventory
- runtime invocation과 exit code
- runtime network test
- cleanup result

S14:

- 실제 LICENSE/COPYING/NOTICE 파일
- 각 파일 SHA256
- SPDX 또는 문서화된 수동 판정
- source/binary redistribution 영향
- 의무사항과 reviewer/reviewed_at

각 gate는 다음과 같아야 한다.

```text
gate.valid == (missing_evidence.length == 0 && 모든 semantic assertion 통과)
```

### 4.4 schema와 schema validation이 아직 계약 수준이 아님

현재 5개 schema는 존재하지만 조건부 구조와 중첩 제약이 불충분하다.

필수:

- passed/blocked/not_applicable별 `if/then` 조건
- blocked prerequisite 구조
- attempted command 상세 구조
- scenario-specific evidence 구조
- summary/manifest/test nested item 구조
- 필요 구간 `additionalProperties: false`

현재 내부 validator는 일부 keyword만 해석하므로 Draft 2020-12 표준 validator가 아니다.

또한 runner의 schema validation inventory는 schema 파일 자체를 meta-schema로 검증하지 않고 dummy summary document를 대신 검증하며, 생성 JSON 전체를 filesystem에서 수집하지 않는다. 따라서 `144 documents validated`는 전체 산출물의 표준 검증을 의미하지 않는다.

### 4.5 전체 회귀 테스트가 실패함

```text
Task 003 unit: 7 passed / 0 failed
full tools/hancom: 7 passed / 18 failed
cause: jszip dependency unavailable
```

Task 003 완료 전 repository-approved pinned `jszip` 환경을 복구해야 한다.

금지:

- 임의 최신 버전 `npm install`
- 출처·버전·해시·LICENSE 없는 dependency 설치

먼저 task-start commit에서도 같은 환경으로 baseline을 재현하고, pinned dependency 환경에서 전체 suite가 0 failure인지 검증한다.

### 4.6 추가 정확성 문제

- `invalid_pass_count`가 계산값이 아니라 상수 0
- API extensibility 5점이 validator 없이 부여됨
- benchmark-002 S12 부분 증거 lineage가 소실됨
- source immutability artifact가 실제 task-start/task-end 비교가 아님
- RED tests가 corruption/mismatch, invalid hashes, incomplete S13 execution, all-JSON inventory 등을 충분히 다루지 않음

## 5. 마스터 방안

Task 004로 이동하지 않는다. 같은 브랜치에서 Task 003 corrective continuation을 수행한다.

```text
current_task: hwpx-core-benchmark-003-evidence-integrity
mode: corrective continuation
branch: feature/hwpx-core-benchmark
```

기존 commit `5d4c60f`와 `534df85`는 부분 진전 증거로 보존한다.

### 실행 우선순위

1. pinned jszip 테스트 환경 복구 및 baseline/current 전체 회귀 재실행
2. standards-compliant Draft 2020-12 validator 고정 반입
3. 실제 LICENSE, SHA256, offline replay 기록
4. 상세 conditional schemas 보강
5. filesystem-derived 전체 JSON inventory 생성
6. schema 파일은 Draft 2020-12 meta-schema로 검증
7. 모든 최종 JSON을 올바른 schema로 마지막 write 이후 재검증
8. 고정 candidate/scenario status 분기 제거
9. semantic S06~S08 validator 구현
10. complete S12~S14 evidence gate 구현
11. invalid_pass_count 실제 계산 및 injection test
12. 모든 score point에 validator result 연결
13. benchmark-002 검증된 부분 증거를 path/hash lineage와 함께 import
14. task-start/task-end immutability manifest 비교
15. 전체 RED/positive tests 보강
16. 산출물·보고서·handoff 재생성

## 6. Task 003 최종 완료 Gate

```text
- 근거 없는 passed 0건
- status가 role + actual evidence/probe에서만 산출
- S06~S08 semantic corruption fixture를 모두 탐지
- S12~S14 complete gate 통과/차단이 정확함
- standards-compliant Draft 2020-12 validator pinned
- validator LICENSE·SHA256·offline replay 확보
- schema 5개 자체 meta-schema 검증 통과
- filesystem inventory의 모든 Task 003 JSON 올바른 schema 검증 통과
- negative fixtures가 의도대로 실패
- invalid_pass_count 계산 및 injection test 통과
- 모든 score point에 evidence validator 연결
- full tools/hancom regression 0 failed
- report·logs·artifacts·handoff·commit SHA 일치
```

이 Gate를 충족한 뒤에만 Task 004로 이동한다.

## 7. 프롬프트 작성 에이전트에 대한 지시

다음 Codex 프롬프트는 Task 004가 아니라 **Task 003 completion corrective prompt**로 작성한다.

표준 validator 반입만 수행하고 완료시키지 말고, 위의 evidence-only status, semantic gate, schema inventory, full regression 문제를 함께 닫아야 한다.

금지:

```text
Task 004 시작
코어 선정
Stage 1-4 진입
main merge
amend/force push
사용자 시각검증 요청
partial 결과를 completed로 승격
```

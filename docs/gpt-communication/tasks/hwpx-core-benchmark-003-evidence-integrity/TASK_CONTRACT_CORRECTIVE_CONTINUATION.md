# Army Claw Codex Task Contract — Task 003 Corrective Continuation

## 1. Task identity

```text
task_id: hwpx-core-benchmark-003-evidence-integrity
mode: corrective_continuation
stage: 1 - HwpAdapter 및 HWP/HWPX 엔진 안정화
substage: 1-3 - 선행 HWPX 엔진 비교·코어 선정
title: Evidence-only status, semantic gates, standard schema validation and regression closure
owner: Codex prompt-author agent
status: approved_for_codex_execution
master_review_required_at_start: false
```

이 계약은 기존 `TASK_CONTRACT.md`를 대체하거나 과거 실행 기록을 변경하지 않는다. 기존 Task 003 구현 commit과 보고서는 부분 진전 및 실패 증거로 보존하고, 같은 task ID와 같은 branch에서 완료 차단 사유를 교정한다.

## 2. Approved source of truth

Codex는 다음 문서를 순서대로 읽는다.

```text
1. docs/gpt-communication/PROJECT_STATE.json
2. docs/gpt-communication/CURRENT.md
3. docs/gpt-communication/AGENT_OPERATING_MODEL.md
4. docs/gpt-communication/MASTER_MONITORING_POLICY.md
5. docs/gpt-communication/CODEX_PROMPT_AGENT_BOOTSTRAP.md
6. docs/gpt-communication/opinions/2026-07-02-army-claw-master-roadmap.md
7. docs/gpt-communication/opinions/2026-07-02-hwpx-core-architecture-decision.md
8. docs/gpt-communication/opinions/2026-07-03-hwpx-core-benchmark-002-master-review.md
9. docs/gpt-communication/opinions/2026-07-03-hwpx-core-benchmark-003-prompt-agent-review.md
10. docs/gpt-communication/opinions/2026-07-03-hwpx-core-benchmark-003-master-review.md
11. docs/gpt-communication/handoffs/CODEX_LATEST.json
12. docs/gpt-communication/tasks/hwpx-core-benchmark-003-evidence-integrity/TASK_CONTRACT.md
13. docs/gpt-communication/tasks/hwpx-core-benchmark-003-evidence-integrity/TASK_CONTRACT_CORRECTIVE_CONTINUATION.md
14. docs/gpt-communication/reports/2026-07-03-hwpx-core-benchmark-003-evidence-integrity.md
15. 현재 branch의 이후 최신 관련 opinion/report
```

충돌 시 `PROJECT_STATE.json`, `CURRENT.md`, 최신 master review와 실제 원격 branch 상태를 우선한다.

공식 판정:

```text
benchmark_003_status: partial_meaningful_progress
completion_gate_passed: false
task_003_completion: rejected
current_task: hwpx-core-benchmark-003-evidence-integrity corrective continuation
proceed_to_task_004: false
core_selection: prohibited
stage_transition: prohibited
user_visual_review_required_now: false
```

## 3. Repository state

```text
repository: leejinuk-minoan/army-claw
local_root: C:\Users\USER\Desktop\로컬 open claw 만들기
work_branch: feature/hwpx-core-benchmark
base_implementation_branch: feature/hwpx-adaptive-board-fit-v5
original_task_003_start_commit: 0064049f03d4167b322e7b407518a0e42e685d83
partial_implementation_commit: 5d4c60fe0911b430e648874ae45b06069270ab9e
partial_report_commit: 534df85b74c7c3cb6fc749e24ae1633927d72a3e
prompt_agent_review_commit: 14d151f6898e64eb0ba0b397b566209b49956d82
master_review_commit: e3b6ccd327da0a6c4d1bb878a00d6601501cfb8c
latest_official_state_head_before_contract: 203aa797ddc44fe96f6ff9ab0e3520f56f2f01b3
```

Codex는 시작 시 원격 HEAD를 `continuation_start_commit_sha`로 기록한다.

보존 대상:

```text
5d4c60fe0911b430e648874ae45b06069270ab9e
534df85b74c7c3cb6fc749e24ae1633927d72a3e
```

amend, reset, history rewrite 또는 force push로 제거하지 않는다.

## 4. Objective

이번 corrective continuation의 목표:

1. candidate/scenario 고정 status 분기를 제거한다.
2. status를 role applicability, actual execution record, source/API inspection evidence, prerequisite probe, imported evidence lineage와 scenario-specific validator에서만 산출한다.
3. S06~S08을 field-presence gate가 아닌 artifact/hash/semantic comparison gate로 완성한다.
4. S12~S14를 원 Task Contract 수준의 complete evidence gate로 완성한다.
5. standards-compliant Draft 2020-12 validator를 benchmark-only pinned dependency로 고정한다.
6. validator exact version, artifact SHA256, 실제 LICENSE와 LICENSE SHA256, offline 설치·재실행 절차를 기록한다.
7. 5개 schema를 conditional/nested/strict 구조로 보강한다.
8. 5개 schema 자체를 Draft 2020-12 meta-schema로 검증한다.
9. 최종 JSON 작성 후 filesystem-derived inventory로 모든 Task 003 JSON을 올바른 schema로 검증한다.
10. `invalid_pass_count`를 실제 계산하고 invalid-pass injection test를 통과한다.
11. 모든 score point를 `validator_result.valid == true`인 rubric item에만 부여한다.
12. benchmark-002의 검증된 S12 duration/RSS partial evidence를 path/hash lineage와 함께 가져온다.
13. task-start manifest와 task-end manifest를 실제 비교한다.
14. repository-approved pinned jszip 환경을 복구하고 original Task 003 start commit과 current commit에서 동일 환경으로 full tools/hancom regression을 실행한다.
15. 전체 회귀 0 failure와 강화된 RED/positive tests를 통과한다.
16. 최종 report, logs, artifacts, handoff payload와 commit SHA를 일치시킨다.

## 5. Non-objectives

```text
- Task 004 외부 후보 실제 benchmark 시작
- python-hwpx/hwpxlib/HwpForge 기능 benchmark 실행
- Hancom 2024 COM 실행
- S05 실제 mutation 또는 사용자 시각검증
- 코어 선정
- Stage 1-4 진입
- production HwpCoreAdapter 전환
- production Container-Aware Table Fit 구현
- main merge 또는 PR merge
- 기존 benchmark-001/002/003 부분 결과 삭제 또는 제자리 변조
- 임의 최신 dependency 설치
- 제품 runtime dependency 변경
```

외부 후보 artifact를 Task 004 범위로 획득·실행하지 않는다. 단, Task 003 전용 schema validator와 기존 테스트 환경 복구에 필요한 repository-approved dependency는 이 계약 범위다.

## 6. Allowed scope

```text
- tools/hancom/benchmark/**
- tools/hancom/**/*benchmark*.test.mjs
- tools/hancom의 dependency loader/manifest를 복구하기 위한 최소 변경
- Task 003 전용 validator wrapper와 schema tooling
- Task 003 전용 package manifest/lockfile/offline artifact manifest
- release/test-documents/hwpx-core-benchmark-003-evidence-integrity/**
- docs/gpt-communication/reports/2026-07-03-hwpx-core-benchmark-003-evidence-integrity-corrective-continuation.md
- docs/gpt-communication/tasks/hwpx-core-benchmark-003-evidence-integrity/**
```

제품 코드 또는 기존 HWPX 기능 변경은 evidence integrity와 테스트 환경 복구에 필요한 최소 범위만 허용한다.

## 7. Forbidden commands and changes

```text
- git reset --hard
- git clean -fd / -fdx
- git checkout -- .
- git restore . 또는 광범위 restore
- git commit --amend
- history rewrite rebase
- git push --force / --force-with-lease
- 사용자 승인 없는 main merge
- 원본 HWP/HWPX 덮어쓰기
- 기존 benchmark-001/002/003 결과 삭제
- 기존 partial implementation/report commit 제거
- npm install <unversioned/latest>
- 출처·버전·hash·LICENSE 없이 npm/pip/maven dependency 설치
- 표준 validator가 아닌 자체 partial interpreter를 표준 Draft 2020-12 validator로 주장
- status를 candidate ID/scenario ID 고정표로 산출
- field presence만으로 preservation passed 생성
- 실제 validator 결과 없이 score point 부여
- Task 004/005 실행
- actual COM output 전 사용자 시각검증 요청
- PROJECT_STATE.json, CURRENT.md, master opinion, CODEX_LATEST.json 최종 판정 직접 수정
```

## 8. Dependency restoration: pinned jszip environment

먼저 repository와 Git history에서 승인 가능한 pinned dependency source를 찾는다.

검색 대상:

```text
package.json / package-lock.json
tools/package.json / tools/package-lock.json
pnpm-lock.yaml / yarn.lock
node_modules package metadata
previous commits and release manifests
existing offline cache or tarball
benchmark-002 successful test runtime evidence
```

규칙:

```text
- 임의 최신 jszip 설치 금지
- exact version과 provenance 확보
- package artifact SHA256 기록
- actual LICENSE path와 SHA256 기록
- dependency tree와 lockfile 기록
- offline install/replay 명령 기록
- 동일 artifact set을 baseline/current 양쪽에 사용
```

승인 가능한 pinned source를 찾지 못하면 임의 설치하지 않고 `blocked`와 `master_review_required: true`로 보고한다.

### Baseline/current comparison

다음 두 code state에서 동일 Node version과 동일 pinned dependency artifact set을 사용한다.

```text
baseline: 0064049f03d4167b322e7b407518a0e42e685d83
current: corrective implementation tested commit
```

baseline은 별도 read-only/disposable `git worktree` 또는 별도 checkout으로 실행한다. 현재 작업트리를 reset하지 않는다.

각 state에서 full `tools/hancom` test suite를 실행하고 명령, runtime, dependency manifest, exit code, passed/failed/skipped와 logs를 기록한다.

Task 003 완료에는 current full regression 0 failure가 필수다. baseline 결과는 환경 복구가 회귀를 숨기지 않았는지 비교하기 위한 증거다.

## 9. Standards-compliant Draft 2020-12 validator

Ajv 2020 또는 Python `jsonschema` 등 standards-compliant implementation 중 하나를 선택한다.

필수 기록:

```text
validator name
exact version
upstream identity
artifact filename
artifact SHA256
actual LICENSE/COPYING/NOTICE path
LICENSE/COPYING/NOTICE SHA256
direct/transitive dependency inventory
offline artifact inventory
clean/offline install or replay command
validation command
runtime network requirement test
```

benchmark-only tooling으로 격리하고 제품 runtime dependency로 승격하지 않는다.

표준 기능 확인:

```text
- Draft 2020-12 schema compilation
- if/then/else
- oneOf/anyOf/allOf
- unevaluatedProperties 또는 additionalProperties 정책
- format validation
- referenced definitions/$defs
- meta-schema validation
```

validator package와 dependency artifact의 라이선스 또는 재배포에 문제가 있으면 실행을 중단하고 master review를 요청한다.

## 10. Evidence-only status engine

고정 분기 금지:

```text
if candidate == X and scenario == Y return blocked/unsupported/failed
```

허용되는 입력:

```text
role applicability result
actual execution record
source/API inspection artifact
prerequisite probe artifact
imported prior evidence with path+SHA256
scenario-specific validator result
```

### Status derivation

```text
not_applicable:
  role matrix가 해당 scenario를 소유하지 않으며 rationale evidence 존재

blocked:
  applicable이지만 필수 runtime/artifact/environment prerequisite probe가 실패

unsupported:
  고정된 실제 implementation/API/source inspection이 해당 기능 미지원임을 증명

failed:
  실제 실행이 수행됐으나 execution 또는 assertion 실패

passed:
  실제 execution + 모든 필수 evidence + 모든 scenario validator + schema validation 통과
```

`previous_status`는 lineage metadata일 뿐 새 status 판정 로직의 직접 조건이 아니다.

## 11. S06 semantic merged-table preservation gate

필수:

```text
before/after snapshot file existence
before/after snapshot SHA256 integrity
mutation output existence and SHA256
input/output identity distinct where mutation expected
merged table count comparison
merged cell map deep equality
row span map deep equality
col span map deep equality
allowed target diff check
non-target package entry hash equality
scenario assertions all true
```

서로 다른 map, missing artifact, invalid hash 또는 non-target mutation fixture는 반드시 실패한다.

## 12. S07 semantic image/BinData preservation gate

필수:

```text
before/after snapshot and mutation artifact existence/hash
image entry path, size, SHA256 deep comparison
BinData entry path, size, SHA256 deep comparison
relationship/reference source-target comparison
allowed target diff check
non-target entry hash equality
scenario assertions all true
```

path가 같아도 hash/size가 다르면 실패한다.

## 13. S08 semantic fwSpace/namespace preservation gate

필수:

```text
before/after snapshot and mutation artifact existence/hash
fwSpace count equality
fwSpace node-path/order equality
namespace prefix/URI mapping equality
root/section namespace declaration comparison
allowed target diff check
non-target entry hash equality
scenario assertions all true
```

## 14. S12 complete performance/install-size gate

필수:

```text
warmup_runs >= 1
measured_runs >= 5
raw duration samples
reported median and p95
independent recomputation of median/p95 and equality tolerance
process boundary or documented limitation
peak memory measurement method and command
peak RSS raw samples
candidate artifact inventory and computed total size
runtime/dependency inventory and computed install size
measurement commands
stdout/stderr/raw structured logs
measurement limitations
source lineage
```

0, negative, fabricated 또는 inventory sum과 불일치하는 size는 실패한다.

benchmark-002의 검증된 duration/RSS evidence는 다음과 함께 import한다.

```text
source_path
source_file_sha256
source_result_sha256
imported_fields
verification_result
```

부분 evidence가 있어도 complete gate가 실패하면 최종 status는 blocked/failed다.

## 15. S13 complete offline install gate

필수:

```text
clean isolated environment type/id/path
pinned offline artifact inventory with hashes
actual attempted install command
started/ended timestamps
exit code
stdout/stderr paths and file existence
installed package/file inventory
runtime invocation command and exit code
runtime stdout/stderr
runtime network test method/result
cleanup command/result
all assertions true
```

`attempted_commands`가 없으면 gate는 valid가 될 수 없다.

## 16. S14 complete license gate

필수:

```text
project/candidate identity
exact component/version scope
actual LICENSE/COPYING/NOTICE paths
file existence and SHA256 verification
SPDX expression or documented manual assessment
source redistribution implications
binary redistribution implications
redistribution obligations
reviewer
reviewed_at
all assertions true
```

필수 파일 부재 또는 unknown assessment이면 blocked다.

## 17. JSON Schema requirements

기존 5개 schema 이름을 유지하고 보강한다.

```text
adapter-execution.schema.json
benchmark-result.schema.json
benchmark-summary.schema.json
dependency-license-offline-manifest.schema.json
test-summary.schema.json
```

필수:

```text
- nested item schemas
- $defs 재사용
- passed/blocked/not_applicable if/then 또는 oneOf 조건
- blocked prerequisite/probe 구조
- attempted command detailed structure
- scenario-specific evidence discriminated structure
- strict SHA256/date-time/nonnegative constraints
- 필요한 객체 additionalProperties: false 또는 unevaluatedProperties: false
- summary/manifest/test nested structures
- lineage and validator result structures
```

### Meta-schema validation

5개 schema 각각을 Draft 2020-12 meta-schema 또는 standards-compliant validator의 `check_schema/validateSchema` 기능으로 검증한다.

schema compile 실패는 Task 003 실패다.

## 18. Filesystem-derived final JSON inventory

JSON path를 코드에 수동 나열하지 않는다.

절차:

1. 모든 benchmark, test-summary, scorecard, manifest와 schema JSON을 최종 write한다.
2. Task 003 root를 filesystem에서 재귀 탐색한다.
3. 모든 `.json` 경로를 inventory에 기록한다.
4. path/type discriminator 또는 artifact manifest로 각 JSON의 올바른 schema를 결정한다.
5. schema 파일은 meta-schema로 검증한다.
6. negative fixture는 expected-invalid로 별도 분류한다.
7. 그 외 모든 JSON은 올바른 schema로 valid여야 한다.
8. 누락, 중복, unmapped JSON이 0이어야 한다.

self-reference 처리:

```text
- schema-validation-summary 객체는 최종 형태를 in-memory에서 표준 validator로 검증한 뒤 한 번 write
- 최종 filesystem inventory와 validation attestation은 non-JSON log와 Markdown report에도 기록
- validation summary write 후 다른 Task 003 JSON 변경 금지
```

필수 산출물:

```text
tests/final-json-inventory.json
tests/schema-meta-validation-summary.json
tests/schema-validation-summary.json
tests/logs/final-schema-validation.stdout.log
tests/logs/final-schema-validation.stderr.log
```

## 19. invalid pass calculation

```text
invalid passed = status == passed
                 AND (필수 validator 누락 OR validator valid != true OR schema invalid)
```

`invalid_pass_count`를 실제 결과에서 계산한다.

필수 injection test:

```text
- invalid passed fixture 1건 주입
- invalid_pass_count가 1 증가
- score가 증가하지 않음
- final benchmark completion gate 실패
```

상수 0 금지.

## 20. Score validation

모든 rubric item 구조:

```text
item_id
points
awarded
validator_id
validator_result_path
validator_valid
source_evidence_paths
blocking_conditions
```

점수 규칙:

```text
awarded > 0 only if validator_valid == true
```

API extensibility 5점은 별도 API rubric validator가 실제 contract path, method inventory, override/structured-result assertions를 통과할 때만 부여한다. validator가 없으면 pending 5점이다.

## 21. Immutability proof

Task 시작 직후 baseline manifest를 생성한다.

대상:

```text
source HWPX fixtures
benchmark-001 root
benchmark-002 root
기존 Task 003 partial artifact root
기존 reports
```

기록:

```text
path
size
sha256
Git blob SHA when tracked
```

작업 종료 후 동일 대상을 다시 계산하고 deep comparison한다.

필수 산출물:

```text
summary/immutability-start-manifest.json
summary/immutability-end-manifest.json
summary/immutability-comparison.json
```

## 22. Required tests

### RED/negative

```text
- candidate/scenario fixed status branch detection
- missing actual probe for blocked
- missing source inspection for unsupported
- S06 merged map mismatch
- S06 row/col span mismatch
- S07 image hash/size mismatch
- S07 relationship target mismatch
- S08 fwSpace path/count mismatch
- S08 namespace mapping mismatch
- missing artifact path
- corrupted artifact SHA256
- disallowed non-target diff
- S12 bad median/p95
- S12 inventory-size mismatch
- S13 missing attempted execution
- S13 missing stdout/stderr or cleanup
- S14 missing LICENSE/COPYING/NOTICE
- S14 invalid hash/unknown redistribution
- schema conditional violation
- schema meta-schema failure fixture
- unmapped JSON inventory item
- missing inventory item
- invalid passed injection
- score awarded without validator
- report/test/handoff payload mismatch
- start/end immutability mismatch
```

### Positive

각 semantic gate에 최소 1개 fully valid synthetic evidence fixture를 사용한다. 실제 HWPX success로 오인하지 않도록 fixture type을 `validator_unit_fixture`로 표시한다.

### Full regression

동일 pinned environment에서:

```text
baseline 0064049f... full tools/hancom suite
current tested implementation full tools/hancom suite
```

current 결과 0 failure 필수.

## 23. Required outputs

Task 003 root를 유지한다.

```text
release/test-documents/hwpx-core-benchmark-003-evidence-integrity/**
```

필수 추가/교정:

```text
dependency/jszip-offline-manifest.json
dependency/schema-validator-offline-manifest.json
dependency/licenses/**
dependency/artifact-hashes.json

schemas/5개 상세 schema

summary/benchmark-results.json
summary/editor-scorecard.json
summary/validator-scorecard.json
summary/layout-gate.json
summary/capability-evidence-matrix.json
summary/dependency-license-offline-manifest.json
summary/immutability-start-manifest.json
summary/immutability-end-manifest.json
summary/immutability-comparison.json

tests/final-json-inventory.json
tests/schema-meta-validation-summary.json
tests/schema-validation-summary.json
tests/test-summary.json
tests/logs/**

handoff/CODEX_LATEST_PAYLOAD.json
```

새 보고서:

```text
docs/gpt-communication/reports/2026-07-03-hwpx-core-benchmark-003-evidence-integrity-corrective-continuation.md
```

기존 partial report는 수정하지 않는다.

## 24. Test and report consistency

구분:

```text
continuation_start_commit_sha
baseline_test_environment_sha256
tested_implementation_commit_sha
report_commit_sha
final_pushed_head_sha
```

보고서 commit 이후 code/artifact/test JSON이 바뀌면 전체 benchmark, schema validation과 tests를 다시 실행한다.

`PENDING_COMMIT_SHA` 금지.

Codex는 `CODEX_LATEST.json`을 직접 수정하지 않는다. 대신 validated `handoff/CODEX_LATEST_PAYLOAD.json`을 생성한다. 공식 handoff는 프롬프트 에이전트가 원격 결과 검토 후 갱신한다.

Codex가 모든 내부 Gate를 충족하더라도 최종 표현은 다음으로 제한한다.

```text
codex_completion_candidate: true
awaiting_prompt_agent_remote_verification: true
official_task_completion: not_declared_by_codex
```

## 25. Completion Gate

다음이 모두 충족될 때만 `codex_completion_candidate: true`를 사용할 수 있다.

```text
- 근거 없는 passed 0건
- status가 actual evidence/probe에서만 산출
- fixed candidate/scenario status branch 없음
- S06~S08 semantic corruption fixtures 전부 탐지
- S12~S14 complete gate positive/negative tests 통과
- standards-compliant Draft 2020-12 validator pinned
- validator LICENSE·artifact/license SHA256·offline replay 확보
- 5개 schema meta-schema validation 통과
- final filesystem inventory의 모든 Task 003 JSON mapped/validated
- negative fixtures expected-invalid 통과
- invalid_pass_count 실제 계산과 injection test 통과
- 모든 score awarded item에 valid validator 연결
- benchmark-002 S12 partial evidence lineage 보존
- task-start/task-end immutability comparison 통과
- pinned jszip 동일 환경 baseline/current tests 실행
- current full tools/hancom regression 0 failed
- report/log/artifact/handoff payload/commit SHA 일치
- 정상 commit과 push 완료
- Task 004, core selection, stage transition, main merge, visual review 미수행
```

하나라도 미충족이면:

```text
codex_completion_candidate: false
codex_execution_status: partial 또는 blocked
completion_gate_passed: false
proceed_to_task_004: false
core_selection: prohibited
stage_transition: prohibited
HwpAdapter_completion: not_declared
```

## 26. Master review triggers

```text
- repository-approved pinned jszip source를 찾을 수 없음
- schema validator license/offline redistribution 문제
- 제품 runtime dependency 변경 필요
- 승인 범위 밖 제품 핵심 library 필요
- baseline과 current가 동일 pinned 환경에서 구조적으로 실행 불가
- Task 004/005 범위 없이는 Task 003 자체 완료가 불가능
- 공식 단계/아키텍처 변경 필요
- main merge 필요
```

정상적인 Task 003 교정 구현은 master review 사유가 아니다.

## 27. Final reporting contract

Codex 최종 답변과 보고서:

```text
- 개발 단계
- task ID/mode/contract path
- continuation start/tested/report/final SHA
- branch/push/working tree
- changed files
- preserved commits and artifact immutability
- pinned jszip exact version/provenance/hash/license/offline replay
- baseline/current full regression results
- pinned standard schema validator exact version/hash/license/offline replay
- schema meta-validation results
- final JSON inventory count, mapped/unmapped/valid/invalid counts
- fixed status branch removal evidence
- S06~S08 semantic gate positive/negative results
- S12~S14 complete gate positive/negative results
- imported benchmark-002 S12 lineage
- invalid_pass_count calculation/injection result
- score validator linkage result
- all test commands/counts/log paths
- completion gate item-by-item
- codex_completion_candidate
- awaiting_prompt_agent_remote_verification
- official_task_completion not declared
- proceed_to_task_004 false until master approval
- master_review_required and reasons
- CODEX_LATEST payload path
```

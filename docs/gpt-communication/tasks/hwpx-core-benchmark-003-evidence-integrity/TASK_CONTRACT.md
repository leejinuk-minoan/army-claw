# Army Claw Codex Task Contract

## 1. Task identity

```text
task_id: hwpx-core-benchmark-003-evidence-integrity
stage: 1 - HwpAdapter 및 HWP/HWPX 엔진 안정화
substage: 1-3 - 선행 HWPX 엔진 비교·코어 선정
title: HWPX benchmark evidence integrity and role-gated scoring
owner: Codex prompt-author agent
status: approved_for_codex_execution
initial_master_review_required: false
```

이 작업은 `hwpx-core-benchmark-002`의 의미 있는 진전은 보존하되, 근거가 부족한 `passed`, 불완전한 schema, placeholder command evidence와 count 기반 scorecard를 교정한다.

이번 작업의 목적은 외부 후보나 Hancom COM을 억지로 실행하는 것이 아니라, **어떤 항목도 실제 시나리오 증거 없이 성공으로 기록될 수 없는 benchmark 증거 체계**를 완성하는 것이다.

## 2. Approved source of truth

Codex는 다음 문서를 순서대로 읽고, 충돌 시 상위 문서와 실제 원격 상태를 우선한다.

```text
1. docs/gpt-communication/PROJECT_STATE.json
2. docs/gpt-communication/CURRENT.md
3. docs/gpt-communication/AGENT_OPERATING_MODEL.md
4. docs/gpt-communication/MASTER_MONITORING_POLICY.md
5. docs/gpt-communication/CODEX_PROMPT_AGENT_BOOTSTRAP.md
6. docs/gpt-communication/opinions/2026-07-02-army-claw-master-roadmap.md
7. docs/gpt-communication/opinions/2026-07-02-hwpx-core-architecture-decision.md
8. docs/gpt-communication/opinions/2026-07-03-hybrid-hwpx-benchmark-responsibility-opinion.md
9. docs/gpt-communication/opinions/2026-07-03-hwpx-core-benchmark-002-master-review.md
10. docs/gpt-communication/handoffs/CODEX_LATEST.json
11. docs/gpt-communication/tasks/hwpx-core-benchmark-002/TASK_CONTRACT.md
12. docs/gpt-communication/tasks/hwpx-core-benchmark-003-evidence-integrity/TASK_CONTRACT.md
13. docs/gpt-communication/reports/2026-07-02-hwpx-core-benchmark-002.md
14. 현재 브랜치에서 위 문서 이후 추가된 최신 관련 opinion/report
```

공식 판정:

```text
benchmark_002_status: partial_meaningful_progress
benchmark_002_pass_counts_valid: false
benchmark_002_scorecard_valid_for_selection: false
current_task: hwpx-core-benchmark-003-evidence-integrity
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
master_review_commit: 58686eac0f17794cb16487f91fd4695ef6d5cd40
master_current_task_commit: 6aa6ecd0fad8f1c71deaaa901bfe016b0738b3f8
benchmark_002_tested_implementation_commit: 22d51620c19ea9c0ba84c2fb670d5ee1740013ba
benchmark_002_report_commit: d666bb6d9ecfdad6707e2924dde7316a02c739be
benchmark_002_prompt_review_commit: 99fadd7baf1d72c340b2a227b193139a82d6316e
hybrid_responsibility_opinion_commit: 5891b0059a014d78619c7b0b12d00da303cce1e6
```

Codex는 시작 시 `origin/feature/hwpx-core-benchmark`의 실제 HEAD를 `task_start_commit_sha`로 기록한다.

기존 benchmark-001/002 commit, report와 artifact는 실패·교훈·회귀 증거로 보존한다. amend, reset, rebase-drop 또는 force push로 제거하지 않는다.

## 4. Master-approved benchmark model

S01~S14는 단일 후보가 모두 이겨야 하는 단일 순위표가 아니다.

역할별 결정 구조:

```text
Editor Gate:
Current Node/XML vs python-hwpx

Validator Gate:
hwpxlib vs HwpForge

Layout Gate:
Hancom 2024 COM
```

하이브리드 아키텍처 가설:

```text
OpenClaw / Army Claw Node Orchestrator
        ↓
HwpAdapter
        ├─ python-hwpx: 기본 편집 코어 후보
        ├─ ArmyClawSurgicalHwpxPatcher: 정밀 XML 보존 수정
        ├─ Hancom 2024 COM: 최종 레이아웃 권위자
        └─ hwpxlib: 독립 구조 검증기

HwpForge
└─ validator·향후 대체 후보
```

이 구조는 benchmark 구현을 위해 승인된 가설이며 아직 어떤 코어도 최종 선정되지 않았다.

## 5. Objective

이번 작업의 필수 목표:

1. benchmark-002의 근거 없는 `passed`를 모두 제거하거나 실제 증거가 있는 상태로 재산출한다.
2. S06~S08에 실제 before/after snapshot과 시나리오별 evidence validator를 구현한다.
3. S12에 duration, peak memory, artifact size, runtime/dependency install size와 raw log를 모두 요구하는 complete evidence gate를 구현한다.
4. S13에 clean isolated environment offline installation과 runtime network evidence 전용 gate를 구현한다.
5. S14에 actual LICENSE/COPYING/NOTICE, hash, SPDX 또는 수동 판정과 redistribution obligations 전용 gate를 구현한다.
6. `planned_commands`와 실제 `attempted_commands`를 데이터 모델과 schema에서 분리한다.
7. v1 fixture를 실제로 찾거나 `explicit missing record`를 생성한다.
8. 5개 상세 Draft 2020-12 schema를 구현하고 모든 생성 JSON을 실제 schema engine 또는 동등한 완전 검증기로 검증한다.
9. scenario count가 아니라 scenario-specific evidence validator와 명시적 rubric에 의해 점수가 산출되도록 교정한다.
10. 후보 역할에 맞지 않는 시나리오는 근거 있는 `not_applicable`로 분류한다.
11. benchmark-003 산출물, test logs, report, tested implementation SHA와 최종 push 보고를 일치시킨다.

## 6. Non-objectives

이번 작업에서 수행하지 않는다.

```text
- 외부 python-hwpx wheel/source 실제 획득·설치·실행
- hwpxlib jar/source 실제 획득·Java 실행
- HwpForge upstream identity 최종 확정과 실제 build/process 실행
- Hancom 2024 COM 실제 open/save 또는 page measurement
- S05 실제 표 높이 mutation과 COM 검증
- 사용자 시각검증용 HWPX 생성 또는 사용자 확인 요청
- production HwpCoreAdapter 선정 또는 전환
- python-hwpx를 production 기본 코어로 확정
- production Container-Aware Table Fit 구현
- Stage 1-4 진입
- main merge 또는 PR merge
- 기존 benchmark-001/002 artifact 수정 또는 삭제
- 실제 LLM/Ollama 연결
- Template Registry, Document Planner, HShowAdapter, HCellAdapter 구현
```

Task 004와 Task 005 범위를 선행 구현하지 않는다.

## 7. Allowed change scope

```text
allowed directories/files:
- tools/hancom/benchmark/**
- tools/hancom/adapters/hwp-core-adapter-contract.mjs
- tools/hancom/adapters/current-node-xml-adapter.mjs
- tools/hancom/adapters/python-hwpx-adapter.mjs
- tools/hancom/adapters/hwpxlib-validator-adapter.mjs
- tools/hancom/adapters/hwpforge-adapter.mjs
- tools/hancom/validators/**
- tools/hancom/**/*benchmark*.test.mjs
- tools/hancom의 기존 테스트를 보존하기 위한 최소 수정
- task-scoped schema validation code, manifest, lockfile and LICENSE evidence
- release/test-documents/hwpx-core-benchmark-003-evidence-integrity/**
- docs/gpt-communication/reports/2026-07-03-hwpx-core-benchmark-003-evidence-integrity.md
- docs/gpt-communication/tasks/hwpx-core-benchmark-003-evidence-integrity/**
```

새 benchmark-only schema validator dependency가 필요한 경우:

```text
- 기존 저장소 또는 시스템에 이미 있는 standards-compliant validator를 우선 사용
- 정확한 버전 고정
- lockfile 또는 immutable artifact 기록
- 실제 LICENSE 파일과 SHA256 기록
- offline replay 가능성 기록
- 제품 runtime dependency로 승격 금지
```

승인 후보 외 제품 핵심 라이브러리 도입이 필요하면 구현하지 말고 `master_review_required: true`로 보고한다.

## 8. Forbidden changes and commands

```text
- git reset --hard
- git clean -fd
- git clean -fdx
- git checkout -- .
- git restore . 또는 광범위 restore
- git commit --amend
- history를 재작성하는 rebase
- git push --force
- git push --force-with-lease
- 사용자 승인 없는 main merge
- 원본 또는 기존 v1~v5 HWP/HWPX 덮어쓰기
- benchmark-001 또는 benchmark-002 artifact/report 수정
- 하나의 output을 여러 HWPX 코어가 연속 저장
- 후보 A output을 후보 B input으로 사용
- 실제 evidence 없이 passed/completed 생성
- status가 passed라는 이유만으로 preservation 필드를 true로 자동 설정
- package_valid/openPackage 성공을 S13 또는 S14 성공으로 대체
- placeholder command를 attempted command로 기록
- JSON parse 성공을 schema validation 성공으로 기록
- handwritten shallow required-field checker를 Draft 2020-12 완전 검증으로 주장
- passed count, passed count multiplier 또는 status count로 점수 산출
- benchmark-002 scorecard를 코어 선정에 사용
- 외부 후보·COM·S05를 실제 실행한 것처럼 보고
- 실제 COM output 전 사용자 시각검증 요청
- PROJECT_STATE.json, CURRENT.md, master opinion 또는 공식 단계 변경
```

## 9. Inputs, fixtures and immutability

읽기 전용 입력:

```text
- release/test-documents/army-claw-qualification-review-template-fidelity.hwpx
- release/test-documents/army-claw-qualification-review-template-fidelity-v1.hwpx 또는 explicit missing record
- release/test-documents/army-claw-qualification-review-template-fidelity-v2.hwpx
- release/test-documents/army-claw-qualification-review-template-fidelity-v3.hwpx
- release/test-documents/army-claw-qualification-review-template-fidelity-v4.hwpx
- release/test-documents/army-claw-qualification-review-template-fidelity-v5.hwpx
- v1~v5 관련 diff, diagnostics, plan, attempts
- release/test-documents/hwpx-core-benchmark-002/**
```

각 source fixture에 기록:

```text
fixture_id
repository_relative_path
artifact_role
version_or_generation
sha256_before
sha256_after
byte_size
read_only_source: true
expected_features
expected_visual_findings
availability_status: available|missing|blocked
searched_paths
missing_reason
```

v1 파일이 없으면 corpus에서 생략하지 않는다. 다음을 포함하는 명시적 missing entry를 만든다.

```text
version_or_generation: v1
availability_status: missing
searched_paths: 실제 확인한 경로 배열
missing_reason: 문자열
sha256_before: null
sha256_after: null
```

작업 종료 시 모든 source와 benchmark-001/002 tracked artifact가 변경되지 않았는지 Git diff와 hash로 검증한다.

## 10. Status and evidence model

상태 enum:

```text
passed
failed
unsupported
blocked
not_applicable
```

시나리오 status에 `partial`을 추가하지 않는다. 부분 증거는 `evidence_completeness`와 `missing_evidence`에 기록하고, 필수 증거가 부족하면 status는 `failed` 또는 `blocked`다.

### 10.1 passed

다음이 모두 충족될 때만 허용한다.

```text
- 실제 candidate/adapter id와 method
- 실제 command 또는 in-process call trace
- input path와 SHA256
- output/discovery artifact와 SHA256
- started_at, ended_at, duration_ms
- exit code 또는 exception result
- scenario-specific assertions 전부 통과
- 각 assertion의 expected, actual, passed, evidence_path
- stdout/stderr 또는 structured log
- source immutability check
- 해당 scenario evidence validator 통과
- schema validation 통과
```

### 10.2 failed

지원 경로를 실제 실행했으나 실행 또는 assertion이 실패한 상태다.

### 10.3 unsupported

현재 고정된 구현/API가 기능을 제공하지 않는다는 실제 코드/API 조사 evidence가 있는 상태다.

### 10.4 blocked

runtime, artifact, license, output 또는 환경 전제가 없어 실행할 수 없는 상태다.

blocked에는 다음을 구분한다.

```text
planned_commands:
  실행할 수 있다면 사용할 명령. 실행 증거가 아님.

attempted_commands:
  실제 실행한 명령만 기록.
  각 항목에 command, started_at, ended_at, exit_code,
  stdout_path, stderr_path, executed: true 필요.
```

실행하지 않았다면 `attempted_commands: []`다.

blocked 필수 필드:

```text
blocked_reason_code
missing_prerequisites
checked_paths
checked_path_results
planned_commands
attempted_commands
runtime_check
artifact_check
license_check
evidence_log_path
```

`attempted_commands`가 비어 있어도 실제 filesystem/runtime prerequisite check log가 있으면 blocked가 가능하다. 실행하지 않은 명령을 시도했다고 주장하지 않는다.

### 10.5 not_applicable

후보 역할상 시나리오가 적용되지 않을 때 사용한다. role, scenario, rationale, governing role matrix를 기록한다.

예:

```text
- validator의 텍스트 mutation: not_applicable
- editor 후보 개별 결과의 Hancom native page measurement: not_applicable
- Layout Gate가 아닌 후보의 COM-only 시나리오: not_applicable
```

## 11. Role matrix

최소 role matrix를 machine-readable JSON으로 생성한다.

```text
Editor:
- S01~S08: applicable
- S12~S14: applicable
- S09~S11: separate Layout Gate; editor 단독 결과에는 not_applicable

Validator:
- S03/S04: discovery capability가 실제 validator 역할에 있으면 applicable, 아니면 not_applicable
- S06~S08: applicable
- S12~S14: applicable
- S01/S02/S05/S09~S11: 기본 not_applicable

Layout Authority:
- S09~S11: applicable
- 나머지: not_applicable
```

Task 003에서는 external candidate와 Hancom COM을 실제 실행하지 않는다. 적용 가능한 전제가 없으면 정확한 blocked, 역할과 무관하면 not_applicable로 남긴다.

## 12. Scenario-specific evidence validators

### 12.1 S06 merged table preservation

passed 필수 evidence:

```text
before_snapshot_path
after_snapshot_path
mutation_output_path
before_snapshot_sha256
after_snapshot_sha256
merged_table_count_before
merged_table_count_after
merged_cell_map_before
merged_cell_map_after
row_span_map_before
row_span_map_after
col_span_map_before
col_span_map_after
non_target_entry_hashes_before
non_target_entry_hashes_after
scenario_assertions
```

필수 비교가 모두 동일하고 mutation output이 실제 존재해야 한다. source snapshot 한 번만 읽은 결과는 passed가 아니다.

### 12.2 S07 image and BinData preservation

passed 필수 evidence:

```text
before_snapshot_path
after_snapshot_path
mutation_output_path
image_entries_before
image_entries_after
bindata_entries_before
bindata_entries_after
각 entry의 path, size, sha256
relationship/reference counts and targets
non_target_entry_hashes_before/after
scenario_assertions
```

`has_bindata_candidate: true`만으로 passed 금지.

### 12.3 S08 fwSpace and namespace preservation

passed 필수 evidence:

```text
before_snapshot_path
after_snapshot_path
mutation_output_path
fwspace_count_before
fwspace_count_after
fwspace_node_paths_before
fwspace_node_paths_after
namespace_prefix_uri_map_before
namespace_prefix_uri_map_after
section/root element namespace comparison
scenario_assertions
```

package_valid만으로 passed 금지.

### 12.4 S12 performance and install-size gate

passed 필수 evidence:

```text
warmup_runs >= 1
measured_runs >= 5
raw duration samples
median
p95
separate process 또는 명확히 식별된 measurement boundary
peak RSS measurement command/method
peak RSS raw samples
candidate artifact inventory
candidate artifact total size
runtime inventory
runtime/dependency install-size measurement command
runtime/dependency install size
raw stdout/stderr log
measurement limitations
```

일부만 있으면 `evidence_completeness: partial`로 기록하되 status는 `failed` 또는 `blocked`다.

### 12.5 S13 offline installation gate

passed 필수 evidence:

```text
clean_environment_type
clean_environment_path_or_id
offline_artifact_inventory
offline_install_command
attempted command execution record
offline_install_exit_code
stdout/stderr
installed file/package inventory
runtime invocation command
runtime invocation exit code
runtime network test method
runtime network required result
cleanup result
```

HWPX package open 성공, repository source import 성공 또는 단순 runtime 존재만으로 passed 금지.

### 12.6 S14 license and redistribution gate

passed 필수 evidence:

```text
project/candidate identity
exact local component scope
actual LICENSE/COPYING/NOTICE paths
각 파일 SHA256
SPDX expression 또는 documented manual assessment
redistribution assessment
redistribution obligations
source/binary distribution implications
reviewer and reviewed_at
```

license path/hash가 null이거나 redistribution이 unknown이면 `blocked`다.

## 13. JSON Schema and actual validation

필수 Draft 2020-12 schema:

```text
release/test-documents/hwpx-core-benchmark-003-evidence-integrity/schemas/adapter-execution.schema.json
release/test-documents/hwpx-core-benchmark-003-evidence-integrity/schemas/benchmark-result.schema.json
release/test-documents/hwpx-core-benchmark-003-evidence-integrity/schemas/benchmark-summary.schema.json
release/test-documents/hwpx-core-benchmark-003-evidence-integrity/schemas/dependency-license-offline-manifest.schema.json
release/test-documents/hwpx-core-benchmark-003-evidence-integrity/schemas/test-summary.schema.json
```

각 schema는 최소 다음을 실제로 강제한다.

```text
- nested object type
- required fields
- status and role enums
- SHA256 pattern: ^[a-f0-9]{64}$ 또는 명시적 null
- ISO date-time format
- non-negative duration/size/count
- arrays and item schemas
- passed/blocked/not_applicable 조건부 필드
- additionalProperties 정책
- nullable은 type union으로 표현
- attempted command execution record 구조
- scenario-specific evidence 구조 또는 참조
```

실제 validator 요구:

```text
- 모든 committed benchmark-003 JSON을 schema별로 실제 validate
- schema validator name/version 기록
- validation command 기록
- 각 파일의 schema path와 validation result 기록
- invalid fixture negative tests 포함
- JSON parse 성공만으로 validation 통과 처리 금지
```

standards-compliant schema engine이 없다면, 정확한 버전·LICENSE·offline replay가 있는 benchmark-only validator를 추가한다. 이를 확보할 수 없으면 Task 003은 partial/blocked이며 schema validation을 passed로 기록하지 않는다.

## 14. Evidence rubric and score calculation

단일 총점으로 editor, validator, layout authority를 한 줄로 순위화하지 않는다.

가중치:

```text
functional_fit: 30
visual_fidelity: 25
api_extensibility: 15
offline_distribution: 10
performance: 10
license_maintenance: 10
```

### 14.1 Editor functional-fit rubric

```text
S01 no-op round trip: 5
S02 scoped replacement: 5
S03 nested table discovery: 4
S04 drawText discovery: 4
S05 support 또는 안전한 delegation evidence: 4
S06 merged table preservation: 3
S07 image/BinData preservation: 3
S08 fwSpace/namespace preservation: 2
합계: 30
```

각 항목은 해당 scenario evidence validator가 통과한 경우에만 점수를 부여한다.

### 14.2 Validator functional-fit rubric

```text
independent package parse: 10
structural counts and hashes: 10
invalid package detection: 10
합계: 30
```

실제 validator process가 없으면 0 또는 pending이며 Editor scenario count로 대신 계산하지 않는다.

### 14.3 Other categories

```text
visual_fidelity 25:
  Task 005 전 사용자/COM 판정 몫은 pending 25

offline_distribution 10:
  S13 evidence gate 통과 시에만 부여

performance 10:
  S12 complete evidence gate 통과 시에만 부여

license_maintenance 10:
  S14 evidence gate 통과 시에만 부여

api_extensibility 15:
  명시적 rubric을 정의하고 실제 adapter contract evidence로만 부여
```

모든 category:

```text
weight
rubric_items
measured_points
pending_points
score_formula
evidence_paths
validator_results
blocking_conditions
```

금지:

```text
passedCount * n
status count에 비례한 점수
invalid passed의 점수 반영
blocked 후보의 추정 점수
역할이 다른 후보의 단일 winner 선언
```

Task 003 결과는 evidence integrity scorecard이며 코어 추천 또는 우승자를 만들지 않는다.

## 15. TDD and validation order

### RED

먼저 다음 실패 테스트를 추가하고 의도한 이유로 실패하는 것을 확인한다.

```text
1. S06 passed인데 before/after merged table snapshot이 없으면 실패
2. S07 passed인데 image/BinData entry hash 비교가 없으면 실패
3. S08 passed인데 fwSpace/namespace before/after가 없으면 실패
4. runner가 status passed만 보고 preservation=true를 자동 기입하면 실패
5. S12 passed인데 artifact/runtime/install size 또는 raw log가 없으면 실패
6. S13 package_valid/openPackage만으로 passed면 실패
7. S14 LICENSE path/hash가 null 또는 redistribution unknown인데 passed면 실패
8. planned command 또는 placeholder가 attempted_commands에 들어가면 실패
9. attempted_commands 항목에 exit code/stdout/stderr/executed=true가 없으면 실패
10. v1 available 또는 explicit missing record가 없으면 실패
11. 5개 schema 중 하나라도 없거나 shallow schema이면 실패
12. generated JSON 중 schema validation 실패 파일이 있으면 실패
13. JSON parse만으로 schema validation success를 생성하면 실패
14. passed count 또는 status count 기반 score formula가 있으면 실패
15. invalid pass를 추가해도 score가 증가하면 실패
16. role-inapplicable scenario를 blocked로 일괄 생성하면 실패
17. benchmark-001/002 artifact가 변경되면 실패
18. report count와 test-summary가 다르면 실패
```

### GREEN

```text
- invalid passed를 actual evidence에 따라 failed/blocked/not_applicable로 재산출
- scenario-specific evidence validators 구현
- planned/attempted command model 구현
- v1 record 구현
- 5개 schema와 actual validation 구현
- role matrix와 rubric scorecard 구현
- benchmark-003 artifact 생성
```

### REFACTOR

```text
- scenario execution, evidence extraction, evidence validation, schema validation, score calculation 분리
- 기존 benchmark-002 runner와 artifact를 과거 기록으로 유지
- 공통 코드는 재사용하되 benchmark-002 결과를 제자리 수정하지 않음
- 기존 v1~v5 회귀 기능을 훼손하지 않음
```

## 16. Benchmark-003 execution requirements

새 출력 root:

```text
release/test-documents/hwpx-core-benchmark-003-evidence-integrity/**
```

benchmark-002 경로에 새 결과를 쓰지 않는다.

runner는 다음 중 하나로 구현한다.

```text
- 새 task-specific runner
또는
- task profile/output root를 명시적으로 받는 shared runner
```

어느 방식이든 `task_id`, output root와 schema가 benchmark-003으로 명확히 분리돼야 한다.

Task 003 실행 시:

```text
- Current Node/XML의 현재 실제 실행 결과를 재평가
- 외부 후보의 역할상 적용 항목은 전제 부족 시 blocked
- 역할과 무관한 항목은 not_applicable
- Hancom COM은 Layout Gate 별도 record로 blocked 또는 not_executed evidence
- 실제 mutation output이 없으면 S06~S08 passed 금지
- external candidate와 COM을 실제 실행한 것처럼 기록 금지
```

## 17. Required tests and logs

필수 실행:

```text
- 신규 Task 003 evidence-integrity tests
- JSON Schema validation positive/negative tests
- role matrix tests
- score rubric tests
- corpus v1 missing-record test
- source and benchmark-001/002 immutability tests
- node --test tools\hancom\*.test.mjs 전체 회귀
```

각 실행에 기록:

```text
command
working_directory
runtime version
started_at
ended_at
exit_code
passed
failed
skipped
stdout_path
stderr_path
```

저장 위치:

```text
release/test-documents/hwpx-core-benchmark-003-evidence-integrity/tests/test-summary.json
release/test-documents/hwpx-core-benchmark-003-evidence-integrity/tests/logs/**
release/test-documents/hwpx-core-benchmark-003-evidence-integrity/tests/schema-validation-summary.json
```

GitHub CI가 없으면 `independent_ci_verification: unavailable`로 기록한다. 로컬 테스트를 CI 검증이라고 부르지 않는다.

## 18. Required outputs

```text
code:
- scenario-specific evidence validators
- role matrix
- planned/attempted command evidence model
- complete evidence gates for S06~S08 and S12~S14
- standards-compliant actual schema validation integration
- evidence-rubric score calculation

evidence:
- release/test-documents/hwpx-core-benchmark-003-evidence-integrity/corpus-manifest.json
- release/test-documents/hwpx-core-benchmark-003-evidence-integrity/role-matrix.json
- release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/**
- release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/**
- release/test-documents/hwpx-core-benchmark-003-evidence-integrity/schemas/**
- release/test-documents/hwpx-core-benchmark-003-evidence-integrity/summary/benchmark-results.json
- release/test-documents/hwpx-core-benchmark-003-evidence-integrity/summary/editor-scorecard.json
- release/test-documents/hwpx-core-benchmark-003-evidence-integrity/summary/validator-scorecard.json
- release/test-documents/hwpx-core-benchmark-003-evidence-integrity/summary/layout-gate.json
- release/test-documents/hwpx-core-benchmark-003-evidence-integrity/summary/capability-evidence-matrix.json
- release/test-documents/hwpx-core-benchmark-003-evidence-integrity/summary/dependency-license-offline-manifest.json
- release/test-documents/hwpx-core-benchmark-003-evidence-integrity/tests/test-summary.json
- release/test-documents/hwpx-core-benchmark-003-evidence-integrity/tests/schema-validation-summary.json
- release/test-documents/hwpx-core-benchmark-003-evidence-integrity/tests/logs/**

report:
- docs/gpt-communication/reports/2026-07-03-hwpx-core-benchmark-003-evidence-integrity.md
```

이번 Task에서는 실제 후보 mutation + COM-resaved output이 없으므로 user-review HWPX와 시각검증 checklist를 새로 만들지 않는다.

```text
user_visual_status: not_requested_task_003_no_valid_com_resaved_outputs
```

## 19. Completion gate

Codex가 Task 003에 대해 `completed`를 사용할 수 있는 조건:

1. benchmark-003 artifact에서 근거 없는 `passed`가 0건이다.
2. 모든 `passed`가 scenario-specific evidence validator를 통과한다.
3. S06~S08에서 before/after mutation output이 없으면 passed가 생성되지 않는다.
4. S12의 일부 시간·RSS evidence가 complete passed로 승격되지 않는다.
5. S13이 package open 성공으로 대체되지 않는다.
6. S14가 null/unknown license evidence로 passed되지 않는다.
7. planned_commands와 attempted_commands가 schema와 결과에서 분리된다.
8. attempted_commands는 실제 실행 기록만 포함한다.
9. v1 available 또는 explicit missing record가 있다.
10. 5개 상세 Draft 2020-12 schema가 존재한다.
11. 모든 benchmark-003 JSON이 실제 schema validation을 통과한다.
12. negative schema fixtures가 의도대로 validation에 실패한다.
13. role matrix가 적용되고 역할 무관 시나리오가 not_applicable로 분류된다.
14. scorecard가 explicit evidence rubric만 사용한다.
15. invalid pass 또는 status count가 점수에 영향을 주지 않는다.
16. editor, validator와 layout gate가 단일 총점으로 혼합되지 않는다.
17. 기존 전체 Node 회귀와 신규 테스트가 통과한다.
18. 원본, benchmark-001, benchmark-002 artifact가 불변이다.
19. report, test-summary, schema-validation-summary와 commit SHA가 일치한다.
20. tested implementation commit, report commit과 정상 push가 있다.
21. core selection, stage transition과 사용자 visual review는 수행하지 않는다.

하나라도 충족하지 못하면:

```text
codex_execution_status: partial 또는 blocked
completion_gate_passed: false
core_selection: prohibited
stage_transition: prohibited
HwpAdapter_completion: not_declared
```

Task 004/005 미실행은 Task 003 완료 실패 사유가 아니다. Task 003 완료는 evidence integrity 체계가 완성됐다는 뜻일 뿐 전체 benchmark 또는 코어 선정 완료가 아니다.

## 20. Commit and report consistency

구분:

```text
task_start_commit_sha:
  Codex 시작 시 원격 HEAD

tested_implementation_commit_sha:
  benchmark-003와 전체 테스트를 실행한 코드·artifact commit

report_commit_sha:
  tested implementation SHA와 실제 test-summary를 기록한 보고서 commit

final_pushed_head_sha:
  push 후 최종 원격 branch HEAD
```

보고서에는 `PENDING_COMMIT_SHA`를 남기지 않는다.

보고서 test count는 `test-summary.json`에서 생성하거나 자동 대조한다.

보고서 commit 이후 코드·benchmark artifact가 변경되면 benchmark와 전체 테스트를 다시 실행하고 새 tested implementation commit을 만든다.

## 21. Reporting contract

Codex 최종 답변과 보고서에는 다음을 포함한다.

```text
- 전체 개발 단계와 현재 세부 단계
- task_id와 Task Contract 경로
- task_start_commit_sha
- tested_implementation_commit_sha
- report_commit_sha
- final_pushed_head_sha
- branch와 push 결과
- 변경 파일
- benchmark-001/002 보존 결과
- invalid passed의 이전 상태와 교정 상태
- S06~S08 evidence validator 설계와 결과
- S12 complete evidence gate와 현재 결과
- S13 offline install gate와 현재 결과
- S14 license gate와 현재 결과
- planned/attempted command 분리 결과
- v1 available 또는 missing record
- schema validator 이름·버전·LICENSE·실행 명령
- 5개 schema 경로
- 모든 JSON schema validation 결과
- role matrix
- editor/validator/layout gate별 rubric과 점수
- S01~S14 corrected status와 evidence path
- 전체 테스트 명령·exit code·count·로그 경로
- 원본 및 benchmark-001/002 불변 결과
- user_visual_status와 시각검증을 요청하지 않는 이유
- 제한사항
- completion_gate_passed
- codex_execution_status
- core_selection, stage_transition, HwpAdapter_completion
- master_review_required와 사유
- Task 004로 넘길 명확한 입력
- CODEX_LATEST 갱신용 구조화 payload
```

## 22. Handoff and official-state restrictions

Codex는 다음을 수정하지 않는다.

```text
- docs/gpt-communication/PROJECT_STATE.json
- docs/gpt-communication/CURRENT.md
- master opinion 문서
- 공식 로드맵과 아키텍처 결정문
- docs/gpt-communication/handoffs/CODEX_LATEST.json의 최종 판정
```

Codex는 최종 답변과 보고서에 `CODEX_LATEST` 갱신용 payload만 제공한다. 실제 원격 검토 후 프롬프트 작성 에이전트가 갱신한다.

## 23. Master review triggers

다음 상황에서 `master_review_required: true`로 기록한다.

```text
- 공식 단계 또는 승인 아키텍처 변경 필요
- 승인 범위 밖 제품 핵심 라이브러리 필요
- schema validator dependency의 라이선스·재배포·offline replay 문제
- 라이선스 충돌 또는 저장소 자체 LICENSE 부재로 제품 결정 필요
- role matrix 또는 rubric이 마스터 결정과 충돌
- 기존 완료 기능 제거 필요
- main merge 필요
- Task 004/005 범위를 선행하지 않으면 Task 003을 완료할 수 없다는 구조적 충돌
- 독립망 정책과 충돌하는 필수 runtime/network requirement
```

정상적인 invalid-pass 하향, schema 구현, evidence validator와 rubric 구현 자체는 master review 사유가 아니다.

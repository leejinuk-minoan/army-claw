# Army Claw Codex Task Contract

## 1. Task identity

```text
task_id: hwpx-core-benchmark-002
stage: 1 - HwpAdapter 및 HWP/HWPX 엔진 안정화
substage: 1-3 - 선행 HWPX 엔진 비교·코어 선정
title: HWPX core benchmark corrective execution and evidence hardening
owner: Codex prompt-author agent
status: approved_for_codex_execution
initial_master_review_required: false
```

이 작업은 `hwpx-core-benchmark-001`을 완료한 것으로 간주하지 않고, 그 결과를 benchmark harness 초안으로 보존하면서 실제 실행 증거를 갖춘 corrective benchmark로 교정한다.

## 2. Approved source of truth

Codex는 다음 문서를 순서대로 읽고 충돌 시 상위 문서와 실제 원격 상태를 우선한다.

```text
1. docs/gpt-communication/PROJECT_STATE.json
2. docs/gpt-communication/CURRENT.md
3. docs/gpt-communication/AGENT_OPERATING_MODEL.md
4. docs/gpt-communication/MASTER_MONITORING_POLICY.md
5. docs/gpt-communication/CODEX_PROMPT_AGENT_BOOTSTRAP.md
6. docs/gpt-communication/opinions/2026-07-02-army-claw-master-roadmap.md
7. docs/gpt-communication/opinions/2026-07-02-hwpx-core-architecture-decision.md
8. docs/gpt-communication/opinions/2026-07-02-hwpx-core-benchmark-001-master-review.md
9. docs/gpt-communication/handoffs/CODEX_LATEST.json
10. docs/gpt-communication/tasks/hwpx-core-benchmark-001/TASK_CONTRACT.md
11. docs/gpt-communication/tasks/hwpx-core-benchmark-002/TASK_CONTRACT.md
12. docs/gpt-communication/reports/2026-07-02-hwpx-core-benchmark-001.md
13. 현재 브랜치의 그 이후 최신 opinion 및 report
```

공식 판정:

```text
benchmark_001_status: partial_rejected_as_complete
benchmark_001_preservation_role: benchmark_harness_draft_and_failure_evidence
current_scorecard_valid_for_selection: false
stage_transition: prohibited
current_task: hwpx-core-benchmark-002
```

## 3. Repository state

```text
repository: leejinuk-minoan/army-claw
local_root: C:\Users\USER\Desktop\로컬 open claw 만들기
work_branch: feature/hwpx-core-benchmark
base_implementation_branch: feature/hwpx-adaptive-board-fit-v5
benchmark_001_codex_commit: da089f1d4943b2df28e001a85f86e4d8fe542f78
prompt_agent_review_commit: 6516e61ab3ffdfe5c39adc85c6b3ab8241bfb42d
latest_master_state_snapshot_before_contract: dc34e5dcd993082ee28a74ad96c6101a03542392
```

Codex는 실행 시작 시 `origin/feature/hwpx-core-benchmark`의 실제 HEAD를 `task_start_commit_sha`로 기록한다. 기존 `da089f1`을 amend, rebase-drop, reset 또는 force push로 제거하지 않는다.

## 4. Master-approved architecture

```text
OpenClaw / Army Claw Node Orchestrator
        ↓
HwpAdapter
        ├─ python-hwpx: 기본 편집 코어 후보
        ├─ ArmyClawSurgicalHwpxPatcher: 정밀 XML 보존 수정
        ├─ Hancom 2024 COM: 최종 레이아웃 권위자
        └─ hwpxlib: 독립 구조 검증기

HwpForge
└─ 읽기·검증·성능·배포 benchmark 및 향후 대체 후보
```

이 구조는 benchmark 구현을 위해 승인된 가설이며 아직 코어 선정 결과가 아니다.

## 5. Objective

이번 작업은 합성된 결과를 제거하고 실제 실행 증거에 기반한 benchmark를 생성한다.

필수 목표:

1. 고정된 scenario status table과 synthetic `passed` 생성을 제거한다.
2. 모든 시나리오 상태를 실제 adapter 호출 결과와 assertion으로 산출한다.
3. `CurrentNodeXmlAdapter`가 공통 계약 메서드를 실제 override하고 기존 Army Claw Node/XML 기능을 호출하게 한다.
4. S01~S08과 S12에 대해 시나리오별 실제 실행, raw evidence, 로그 및 산출물을 생성한다.
5. S05 대상을 `보조 11-2 내부 두 번째 1×1 표`로 복원한다.
6. 인터넷 연결 환경에서 승인 후보의 exact release 또는 immutable commit을 획득하고 독립망 반입 artifact로 고정한다.
7. python-hwpx를 실제 별도 Python process adapter로 실행한다.
8. hwpxlib를 실제 별도 Java process에서 독립 재파싱·검증한다.
9. HwpForge를 실제 실행하거나 프로젝트 identity, immutable ref, runtime, LICENSE와 시도 로그가 있는 근거 기반 `blocked`로 판정한다.
10. Hancom 2024 COM open/save와 가능한 page measurement를 실제 수행한다.
11. 역할별 raw evidence 기반 scorecard를 다시 만든다.
12. 테스트 로그, 보고서, tested commit, 최종 push 보고가 서로 모순되지 않게 한다.

## 6. Non-objectives

이번 작업에서 수행하지 않는다.

```text
- Stage 1-4 진입
- production HwpCoreAdapter 선정 또는 전환
- python-hwpx를 production 기본 코어로 확정
- ArmyClawSurgicalHwpxPatcher 제거 또는 축소
- production Container-Aware Table Fit 구현
- 실제 LLM/Ollama 연결
- Template Registry 또는 Document Planner 구현
- HShowAdapter 또는 HCellAdapter 구현
- main merge 또는 PR merge
- 기존 benchmark-001 기록 삭제
- 사용자 시각검증 전 HwpAdapter 완료 선언
```

## 7. Allowed change scope

```text
allowed:
- tools/hancom/benchmark/**
- tools/hancom/adapters/**
- tools/hancom/validators/**
- tools/hancom/**/*benchmark*.test.mjs
- tools/hancom의 기존 테스트를 보존하기 위한 최소 수정
- benchmark 전용 Python/Java/Rust wrapper와 dependency manifest
- release/test-documents/hwpx-core-benchmark-002/**
- docs/gpt-communication/reports/2026-07-02-hwpx-core-benchmark-002.md
- docs/gpt-communication/tasks/hwpx-core-benchmark-002/**
- task-scoped lockfile 또는 dependency manifest
```

외부 artifact 저장 원칙:

- 실제 wheel, jar, source archive, binary가 작고 재배포가 명시적으로 허용된 경우에만 저장소 커밋을 검토한다.
- 대형 artifact 또는 재배포 조건이 불명확한 artifact는 저장소에 커밋하지 않는다.
- 로컬 artifact 경로, 원본 URL, 파일명, SHA256, LICENSE SHA256, 획득 명령과 오프라인 설치 명령을 committed manifest에 기록한다.
- 후보 이외의 새로운 제품 핵심 라이브러리가 필요하면 적용하지 않고 `master_review_required: true`로 보고한다.

## 8. Forbidden changes and commands

```text
- git reset --hard
- git clean -fd
- git clean -fdx
- git checkout -- .
- git restore . 또는 광범위 restore
- git commit --amend
- rebase로 da089f1 또는 마스터 판정 기록 제거
- git push --force
- git push --force-with-lease
- 사용자 승인 없는 main merge
- 원본 또는 기존 v1~v5 HWP/HWPX 덮어쓰기
- benchmark-001 산출물을 제자리에서 성공 결과로 변조
- 하나의 결과 파일을 여러 HWPX 코어가 연속 저장
- 후보 A의 output을 후보 B의 input으로 사용
- 단순 copyFile 결과를 open/save round trip 성공으로 보고
- metadata capability만으로 메서드 실행 성공을 보고
- 정적 scenario-status mapping으로 passed 생성
- assertion 없이 exit code 0만으로 passed 생성
- README 라이선스 문구만으로 라이선스 확정
- exact version 또는 immutable commit 없이 외부 후보 사용
- 실제 실행 증거가 없는 상태를 passed 또는 completed로 보고
- 현재 benchmark scorecard를 코어 선정에 사용
```

## 9. Inputs, fixtures and immutability

benchmark-001 corpus manifest를 참고하되 다시 실제 파일을 탐색하여 v1~v5 존재 여부를 확인한다.

필수 corpus:

```text
- 기준 원본 HWPX
- v1, v2, v3, v4, v5 HWPX 또는 명시적 missing record
- v1~v5 관련 diff, diagnostics, plan, attempts
- nested table 사례
- drawText 내부 문단 사례
- 병합 표 사례
- 이미지와 BinData 사례
- hp:fwSpace와 namespace 사례
- 보조 11-2 내부 두 번째 1×1 표 사례
```

각 항목:

```text
fixture_id
repository_relative_path
artifact_role
version_or_generation
sha256_before
byte_size
read_only_source: true
expected_features
expected_visual_findings
availability_status: available|missing|blocked
```

실행 종료 후 `sha256_after`를 계산하고 `sha256_before == sha256_after`를 검증한다.

후보별 실행은 동일 source fixture에서 만든 독립 working copy로 시작한다.

## 10. Evidence model and status rules

### 10.1 Passed의 필수 증거

시나리오는 다음 항목이 모두 있을 때만 `passed`다.

```text
- 실제 호출된 adapter id와 method
- command 또는 in-process call trace
- 입력 파일과 SHA256
- 출력 또는 discovery result artifact
- 시작·종료 시각과 duration
- exit code 또는 exception
- scenario-specific assertions 전부 통과
- assertion별 expected, actual, pass/fail
- stdout/stderr 또는 structured log 경로
- 결과 artifact SHA256
- 원본 불변 검사
```

하나라도 없으면 `passed`가 아니다.

### 10.2 Status 정의

```text
passed:
  실제 실행과 필수 assertion이 모두 통과

failed:
  지원 기능을 실제 실행했으나 assertion 또는 실행이 실패

unsupported:
  후보의 실제 고정 버전 API/구조 조사 결과 기능이 존재하지 않음

blocked:
  실제 실행 전제인 artifact/runtime/license/환경이 확보되지 않아 실행 불가
  반드시 attempted command, checked paths, prerequisite와 evidence log 필요

not_applicable:
  후보 역할상 시나리오가 적용되지 않음
```

`blocked`와 `unsupported`도 근거가 없는 기본값으로 생성하지 않는다.

### 10.3 Anti-synthetic invariant

테스트는 다음을 강제해야 한다.

- static candidate/scenario status lookup table가 존재하면 실패
- status가 adapter execution result 없이 생성되면 실패
- S01 외 시나리오에서 input/output hash가 동일한데 mutation 또는 discovery 성공으로 보고하면 실패
- S01도 OS file copy만 수행하면 실패; 후보의 실제 open/save API 호출 trace가 필요
- S02는 replacement diff가 없으면 실패
- S03/S04는 발견된 node path, count, text sample이 없으면 실패
- S05는 변경 전후 table height와 selector evidence가 없으면 실패
- S06~S08은 before/after 구조 snapshot과 assertion이 없으면 실패
- S12는 반복 실행 raw samples가 없으면 실패

## 11. Common HwpCoreAdapter contract

메서드 이름:

```text
openPackage
savePackage
analyzeDocument
findParagraphs
findTables
findShapes
replaceText
setTableHeight
clonePageOrBoard
validatePackage
extractSemanticSnapshot
```

각 실행 응답 최소 구조:

```json
{
  "candidate_id": "string",
  "method": "string",
  "status": "passed|failed|unsupported|blocked|not_applicable",
  "started_at": "ISO-8601",
  "ended_at": "ISO-8601",
  "duration_ms": 0,
  "input": {},
  "output": {},
  "assertions": [
    {
      "id": "string",
      "expected": "any",
      "actual": "any",
      "passed": true,
      "evidence_path": "string"
    }
  ],
  "artifacts": [],
  "stdout_path": null,
  "stderr_path": null,
  "errors": []
}
```

metadata의 capability와 실제 메서드 실행 결과가 다르면 실제 결과를 우선하고 mismatch를 오류로 기록한다.

## 12. Candidate implementation requirements

### 12.1 Current Node/XML

- `CurrentNodeXmlAdapter`가 공통 메서드를 실제 override한다.
- 기존 `tools/hancom/army-claw-hancom-tools.mjs`의 실제 함수 또는 필요한 최소 wrapper를 호출한다.
- metadata의 `passed` 사전 선언을 제거하고 실제 실행 후 capability matrix를 생성한다.
- S01에서 실제 package parse/open 후 serializer 또는 현재 코어의 save path를 호출한다.
- 현재 코어에 일반 serializer가 없다면 `unsupported` 또는 `blocked`로 정직하게 기록하며 copy를 save 성공으로 사용하지 않는다.
- S02에서 표지와 주 11-2의 지정 문단을 실제 치환하고 target diff와 non-target hash를 생성한다.
- S03/S04에서 nested table 및 drawText 내부 문단의 실제 경로를 반환한다.
- S06~S08은 실제 semantic/package snapshots를 비교한다.

### 12.2 python-hwpx

- 인터넷 환경에서 exact release 또는 immutable source commit을 고정한다.
- wheel/source archive와 모든 필요한 offline dependency artifact를 확보한다.
- 별도 virtual environment에서 인터넷 없이 설치를 재검증한다.
- Node runner와 Python 구현은 JSON request/response 또는 JSONL process boundary로 통신한다.
- 실제 python-hwpx API를 호출한다.
- API가 지원하지 않는 기능은 실제 버전의 source/API evidence를 첨부해 `unsupported`로 기록한다.
- Current Node/XML writer를 내부적으로 대신 호출하지 않는다.

### 12.3 hwpxlib

- exact jar/release 또는 immutable source commit을 고정한다.
- 실제 LICENSE/COPYING/NOTICE를 확보한다.
- 독립 Java process에서 candidate output을 재파싱한다.
- 문단, 표, 병합 구조, 이미지, BinData, namespace를 독립 검증한다.
- 편집 기능은 역할상 `not_applicable`로 둘 수 있으나 읽기·검증은 실제 실행해야 한다.

### 12.4 HwpForge

- 먼저 정확한 upstream project identity를 확정한다.
- exact release 또는 immutable commit, runtime, build/install 방법과 LICENSE를 확보한다.
- 실행 가능하면 별도 process에서 읽기·검증 또는 지원되는 round trip을 수행한다.
- 실제 프로젝트를 식별하지 못하거나 재현 가능한 artifact를 확보하지 못하면 다음이 모두 있는 `blocked`만 허용한다.

```text
searched project names and URLs
attempted commands
checked release/source locations
identity ambiguity
runtime/build prerequisite
license evidence status
evidence logs
```

가짜 adapter 또는 임의 project 대체는 금지한다.

## 13. External artifact and license evidence

승인된 외부 후보별 필수 기록:

```text
candidate
project_identity
exact_version_or_immutable_commit
download_url
download_timestamp
downloaded_filename
artifact_sha256
artifact_size
actual_license_file_path
license_sha256
spdx_expression_or_manual_assessment
NOTICE/COPYING paths and hashes
direct_dependencies
transitive_dependencies
offline_artifact_inventory
clean_environment_offline_install_command
offline_install_exit_code
runtime_network_required
runtime_network_test_method
redistribution_assessment
redistribution_obligations
```

실제 LICENSE를 찾지 못하면 `unknown`이며 채택 점수의 라이선스 항목은 0 또는 pending이다.

라이선스 충돌, 재배포 금지 가능성 또는 프로젝트 identity 충돌이 있으면 해당 후보 실행을 안전하게 중단하고 `master_review_required: true`로 보고한다.

## 14. Mandatory scenarios

```text
S01 no-op open/save round trip
S02 표지와 주 11-2 문단 치환
S03 nested table 탐색
S04 drawText 내부 문단 탐색
S05 보조 11-2 내부 두 번째 1×1 표 shrink-to-content
S06 병합 표 보존
S07 이미지와 BinData 보존
S08 hp:fwSpace와 namespace 보존
S09 Hancom 2024 COM open/save
S10 실제 총 페이지 수 측정
S11 주 11-2, 보조 11-2, 주 11-3 실제 페이지 위치
S12 처리 속도, peak memory, 설치 크기
S13 독립망 반입·설치 가능성
S14 실제 LICENSE와 배포 의무
```

### S01

- 실제 후보 open/save API를 호출한다.
- input과 output을 별도 경로에 둔다.
- package entry, semantic snapshot과 non-target hash를 비교한다.
- 단순 file copy는 실패다.

### S02

- 표지와 주 11-2에 명확한 benchmark marker를 실제 치환한다.
- target before/after와 non-target hash를 기록한다.
- 동일 원본 복사본이면 실패다.

### S03/S04

- output HWPX가 필수는 아니지만 actual discovery JSON이 필수다.
- node path, ancestor path, paragraph text sample, count를 기록한다.

### S05

대상은 반드시 다음이다.

```text
board: support-2
structure: 내부 1×1 표 중 문서 순서상 두 번째
known failure: oversized fixed height
```

필수 evidence:

```text
stable selector and resolved XML path
candidate method
before height and height mode
before cell margins/border/background/width/text
requested operation: shrink_to_content
actual mutation or explicit unsupported/failed result
after height and height mode
after preserved properties
output SHA256
COM open/save result when output exists
```

이번 task는 benchmark spike 범위에서 후보 지원 여부를 확인하며 production Container-Aware Fit 통합은 수행하지 않는다.

### S06~S08

시나리오별 전용 assertion과 before/after snapshot이 있어야 한다. 모든 preservation 필드를 일괄 `true`로 넣는 것은 금지한다.

### S09~S11

- 설치된 한글 2024와 COM ProgID/version을 확인한다.
- candidate output의 별도 복사본만 COM-resave한다.
- candidate output을 직접 덮어쓰지 않는다.
- open/save exit result를 기록한다.
- 가능한 API로 page count와 marker page를 측정한다.
- 자동 측정 불가 시 attempted API/command와 이유가 있는 `blocked`로 기록한다.

### S12

후보·시나리오별:

```text
warmup: 최소 1회
measured_runs: 최소 5회
raw duration samples
median
p95
peak RSS measurement method
peak RSS samples
candidate artifact size
runtime/dependency install size
```

copy-only 시간을 candidate 성능으로 기록하지 않는다.

## 15. JSON Schema and validation

Draft 2020-12 schema는 nested object, required fields, enum, pattern, type, nullable 표현을 실제로 강제해야 한다.

필수 schema:

```text
release/test-documents/hwpx-core-benchmark-002/schemas/adapter-execution.schema.json
release/test-documents/hwpx-core-benchmark-002/schemas/benchmark-result.schema.json
release/test-documents/hwpx-core-benchmark-002/schemas/benchmark-summary.schema.json
release/test-documents/hwpx-core-benchmark-002/schemas/dependency-license-offline-manifest.schema.json
release/test-documents/hwpx-core-benchmark-002/schemas/test-summary.schema.json
```

JSON parsing 성공만을 schema validation 성공으로 보고하지 않는다.

검증기는 실제 schema engine을 사용하거나 동등한 완전 검증을 해야 한다. benchmark-only dependency를 추가하면 exact version, hash, actual LICENSE와 offline install evidence를 기록한다.

## 16. Evidence-based scoring

가중치:

```text
기능 적합성 30
시각 충실도 25
API·확장성 15
독립망 배포 10
성능 10
라이선스·유지보수 10
```

역할을 구분한다.

```text
editing_core_scorecard:
  Current Node/XML vs python-hwpx

validator_scorecard:
  hwpxlib vs HwpForge

capability_evidence_matrix:
  모든 후보
```

각 category에는 다음이 있어야 한다.

```text
weight
measured_points
pending_points
score_formula
evidence_paths
blocking_conditions
```

`passed count × 5` 방식은 금지한다.

사용자 시각검증 전 visual fidelity의 사용자 판정 몫은 pending으로 둔다.

외부 후보가 실행되지 않았다면 총점을 완성하거나 추천 우승자를 만들지 않는다.

## 17. TDD and validation order

### RED

먼저 benchmark-001의 잘못된 동작을 재현하는 실패 테스트를 작성한다.

```text
- static scenarioStatusForCandidate 또는 동등한 lookup 발견 시 실패
- adapter method trace 없이 passed 생성 시 실패
- copy-only output을 S01/S02 success로 인정하면 실패
- metadata capability와 method implementation 불일치 시 실패
- S05 selector가 first 1x1 table을 가리키면 실패
- S05 before/after height evidence가 없으면 실패
- S02 replacement diff가 없으면 실패
- S03/S04 discovery path가 없으면 실패
- S06~S08 전용 assertion이 없으면 실패
- S12 raw samples가 5개 미만이면 실패
- external candidate exact version/license/artifact hash가 없는데 passed이면 실패
- JSON parse만으로 schema validated 처리하면 실패
- passed count 기반 scorecard이면 실패
- report에 placeholder SHA 또는 실제 test summary와 다른 count가 있으면 실패
```

### GREEN

1. result generation을 adapter execution result 기반으로 변경한다.
2. Current Node/XML 실제 메서드 구현과 실제 시나리오 실행을 통과시킨다.
3. external candidate artifact와 process adapter를 추가한다.
4. COM 실행과 측정을 추가한다.
5. evidence-based scoring을 생성한다.

### REFACTOR

- orchestration, adapters, validators, evidence writers를 분리한다.
- 기존 v1~v5 회귀 테스트를 훼손하지 않는다.
- benchmark-001 산출물은 읽기 전용 과거 기록으로 유지한다.

## 18. Tests and test evidence

필수 실행:

```text
- 기존 tools/hancom/*.test.mjs 전체
- corrective benchmark contract tests
- Current Node/XML adapter tests
- Python process adapter tests
- Java validator process tests
- HwpForge process 또는 blocked-evidence tests
- JSON Schema validation tests
- corpus immutability tests
- offline install tests
- COM tests when environment supports them
```

실제 명령, 시작·종료 시각, exit code, stdout/stderr 경로, passed/failed/skipped 수를 다음에 기록한다.

```text
release/test-documents/hwpx-core-benchmark-002/tests/test-summary.json
release/test-documents/hwpx-core-benchmark-002/tests/logs/**
```

GitHub CI가 없으면 `independent_ci_verification: unavailable`로 기록한다. 로컬 실행을 CI 검증이라고 부르지 않는다.

## 19. Commit and report consistency

self-referential final commit SHA placeholder 문제를 피하기 위해 다음을 구분한다.

```text
task_start_commit_sha:
  Codex 시작 시 원격 HEAD

tested_implementation_commit_sha:
  실제 benchmark와 전체 테스트를 실행한 코드·artifact commit

report_commit_sha:
  tested implementation SHA와 실제 test-summary를 기록한 보고서 commit

final_pushed_head_sha:
  push 후 최종 원격 branch HEAD; 최종 사용자 답변에서 보고
```

보고서에는 `PENDING_COMMIT_SHA` 같은 placeholder를 남기지 않는다.

보고서의 test count는 `test-summary.json`에서 생성하거나 자동 대조한다.

보고서 commit 이후 코드 또는 benchmark artifact가 바뀌면 전체 benchmark와 테스트를 다시 실행하고 새 tested implementation commit을 만들어야 한다.

## 20. Required outputs

```text
code:
- 실제 실행 기반 benchmark runner
- 실제 CurrentNodeXmlAdapter
- 실제 PythonHwpx process adapter
- 실제 Hwpxlib Java validator process adapter
- HwpForge process adapter 또는 evidence-backed blocker
- actual schema validation
- COM measurement wrapper

evidence:
- release/test-documents/hwpx-core-benchmark-002/corpus-manifest.json
- release/test-documents/hwpx-core-benchmark-002/results/**
- release/test-documents/hwpx-core-benchmark-002/executions/**
- release/test-documents/hwpx-core-benchmark-002/schemas/**
- release/test-documents/hwpx-core-benchmark-002/summary/benchmark-results.json
- release/test-documents/hwpx-core-benchmark-002/summary/editing-core-scorecard.json
- release/test-documents/hwpx-core-benchmark-002/summary/validator-scorecard.json
- release/test-documents/hwpx-core-benchmark-002/summary/capability-evidence-matrix.json
- release/test-documents/hwpx-core-benchmark-002/summary/dependency-license-offline-manifest.json
- release/test-documents/hwpx-core-benchmark-002/tests/test-summary.json
- release/test-documents/hwpx-core-benchmark-002/tests/logs/**

user review:
- 실제 candidate별 mutation output만 포함
- 실제 COM-resaved 파생 파일
- visual-review-index.json
- VISUAL_REVIEW_CHECKLIST.md

report:
- docs/gpt-communication/reports/2026-07-02-hwpx-core-benchmark-002.md
```

실제 candidate별 수정 HWPX와 COM-resaved 파일이 생성되지 않으면 사용자 시각검증을 요청하지 않는다.

## 21. Completion gate

Codex가 `completed`를 사용할 수 있는 조건:

1. synthetic status generation이 제거됐다.
2. status가 실제 adapter execution과 assertion에서만 생성된다.
3. Current Node/XML S01~S08 및 S12가 실제 실행됐고 각 결과에 raw evidence가 있다.
4. S05가 두 번째 1×1 표를 대상으로 하며 실제 결과 또는 명확한 실행 기반 unsupported/failed evidence가 있다.
5. python-hwpx exact artifact, LICENSE, offline install과 실제 process 실행이 있다.
6. hwpxlib exact artifact, LICENSE, offline install과 독립 Java 재파싱 실행이 있다.
7. HwpForge가 실제 실행됐거나 master-approved 수준의 identity/version/license/attempt evidence를 갖춘 blocked 판정이다.
8. COM open/save가 실제 수행됐고 page measurement는 실제 값 또는 시도 근거가 있는 blocked 상태다.
9. detailed JSON Schema validation이 통과한다.
10. 역할별 evidence-based scorecard가 있다.
11. 기존 회귀 테스트와 신규 테스트의 실제 로그가 있다.
12. 원본과 과거 benchmark 산출물이 불변이다.
13. report, test-summary, tested implementation SHA와 최종 보고가 모순되지 않는다.
14. commit과 push가 완료됐다.

하나라도 충족하지 못하면:

```text
codex_execution_status: partial 또는 blocked
completion_gate_passed: false
core_selection: prohibited
stage_transition: prohibited
```

부분 성공을 전체 성공으로 승격하지 않는다.

## 22. Master review triggers

다음 상황에서 `master_review_required: true`로 기록한다.

```text
- 공식 단계 또는 아키텍처 변경 필요
- 승인 후보 외 새로운 제품 핵심 라이브러리 필요
- 라이선스 충돌, 재배포 금지 또는 identity 충돌
- main merge 필요
- 현재 task 범위를 크게 벗어나는 구현 필요
- 기존 완료 기능 제거 필요
- 실제 benchmark가 승인 아키텍처와 정면 충돌
- 독립망 반입이 정책상 불가능한 필수 runtime/network requirement
```

인터넷 환경에서 승인 후보 artifact를 획득하는 행위 자체는 이미 승인됐으므로 master review 사유가 아니다.

## 23. Reporting contract

Codex 최종 답변과 보고서에는 다음을 포함한다.

```text
- task ID
- task start, tested implementation, report commit, final pushed HEAD SHA
- branch와 push 결과
- 변경 파일
- benchmark-001에서 보존한 항목과 제거·교정한 항목
- candidate별 exact version/commit, URL, artifact SHA256
- 실제 LICENSE/COPYING/NOTICE 경로·SHA256·판정
- offline package inventory와 clean install 결과
- candidate별 실제 호출 메서드
- S01~S14 status, assertion, evidence path
- Current Node/XML 실제 기준선 결과
- python-hwpx 실제 process 결과
- hwpxlib 독립 Java 결과
- HwpForge 실제 결과 또는 blocked 근거
- COM open/save와 page measurement 결과
- 성능 raw samples, median, p95, peak RSS, install size
- 역할별 scorecard와 pending points
- 전체 테스트 명령·exit code·count·로그 경로
- 원본 불변 결과
- 사용자 시각검증 대상 또는 아직 요청하지 않는 이유
- 제한사항
- completion_gate_passed
- codex_execution_status
- core_selection과 stage_transition 상태
- master_review_required와 사유
- 다음 재개 지점
- CODEX_LATEST 갱신용 구조화 payload
```

Codex는 `PROJECT_STATE.json`, `CURRENT.md`, master opinion 또는 공식 단계 상태를 변경하지 않는다. `CODEX_LATEST.json`도 직접 완료 상태로 확정하지 말고 실제 결과를 담은 갱신용 payload를 제공한다.

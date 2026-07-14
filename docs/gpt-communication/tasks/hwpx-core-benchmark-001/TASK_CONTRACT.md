# Army Claw Codex Task Contract

## 1. Task identity

```text
task_id: hwpx-core-benchmark-001
stage: 1 - HwpAdapter 및 HWP/HWPX 엔진 안정화
substage: 1-3 - 선행 HWPX 엔진 비교·코어 선정
title: HWPX benchmark corpus, HwpCoreAdapter spike 및 후보별 독립 benchmark
owner: Codex prompt-author agent
status: draft_for_codex_execution
master_review_required: false
```

## 2. Approved source of truth

```text
PROJECT_STATE.json: docs/gpt-communication/PROJECT_STATE.json
CURRENT.md: docs/gpt-communication/CURRENT.md
agent operating model: docs/gpt-communication/AGENT_OPERATING_MODEL.md
master monitoring policy: docs/gpt-communication/MASTER_MONITORING_POLICY.md
prompt-agent bootstrap: docs/gpt-communication/CODEX_PROMPT_AGENT_BOOTSTRAP.md
master roadmap: docs/gpt-communication/opinions/2026-07-02-army-claw-master-roadmap.md
architecture decision: docs/gpt-communication/opinions/2026-07-02-hwpx-core-architecture-decision.md
latest handoff: docs/gpt-communication/handoffs/CODEX_LATEST.json
latest related opinion: docs/gpt-communication/opinions/2026-07-02-hwpx-v5-adaptive-board-fit.md
latest related report: docs/gpt-communication/reports/2026-07-02-hwpx-adaptive-board-fit-v5.md
source snapshot branch: feature/hwpx-adaptive-board-fit-v5
source snapshot commit: 8fed3212a45bee6c2aba4d5781726b02fad9ec7c
implementation baseline commit: 6dc812db0b87094ad4aac8932e206ac7835bcc25
```

`source snapshot commit`은 기준 브랜치의 실제 최신 원격 커밋이다. `implementation baseline commit`은 v5 구현 결과를 가리킨다. 두 SHA를 혼동하지 않는다.

## 3. Repository state

```text
repository: leejinuk-minoan/army-claw
local_root: C:\Users\USER\Desktop\로컬 open claw 만들기
base_branch: feature/hwpx-adaptive-board-fit-v5
base_commit: 8fed3212a45bee6c2aba4d5781726b02fad9ec7c
work_branch: feature/hwpx-core-benchmark
branch_creation_rule: base_commit에서 분기하며 기존 원격 브랜치를 강제로 이동하지 않음
main_merge: prohibited_without_user_approval
```

Codex는 구현 전에 로컬 작업 트리, 원격 URL, 현재 브랜치, 원격 작업 브랜치와의 선후 관계를 확인한다. 추적되지 않은 파일이나 미커밋 변경이 있으면 삭제·초기화·자동 stash하지 말고 정확한 상태를 보고한다.

## 4. Objective

이 작업은 기존 코어를 즉시 교체하는 작업이 아니라, 동일 fixture와 동일 시나리오로 HWPX 후보를 재현 가능하게 비교하기 위한 benchmark 기반을 만드는 작업이다.

필수 결과:

1. v1~v5 fixture, 원본 HWP/HWPX, 사용자 시각검증 결과를 해시 기반 benchmark corpus manifest로 정리한다.
2. Current Army Claw Node/XML core를 편집 기준선으로 측정한다.
3. `python-hwpx`용 최소 `HwpCoreAdapter` spike를 설계·구현한다.
4. `hwpxlib`용 독립 읽기·검증 spike를 설계·구현한다.
5. `HwpForge`의 읽기·검증·성능·독립망 배포 benchmark 가능성을 실제 근거로 확인한다.
6. 모든 후보를 동일 입력, 동일 시나리오, 동일 판정 규칙으로 독립 실행한다.
7. 보조 11-2 내부 두 번째 1×1 표의 `shrink-to-content` 지원 여부를 비교한다.
8. 기능, 시각 충실도, API·확장성, 독립망 배포, 성능, 라이선스·유지보수 점수표를 작성한다.
9. 편집 코어 후보와 독립 검증 후보를 역할별로 구분해 추천한다.
10. benchmark와 사용자 시각검증이 끝나기 전에는 기존 코어를 전면 교체하지 않는다.

## 5. Non-objectives

이번 작업에서 수행하지 않는다.

- production `HwpAdapter`의 최종 코어 전환
- python-hwpx를 기본 저장 엔진으로 확정
- 기존 `ArmyClawSurgicalHwpxPatcher` 제거 또는 축소
- 1×1 표 `shrink-to-content`의 production 완성 선언
- 전체 Stage 1 완료 선언 또는 Stage 1-4 진입 확정
- 실제 로컬 LLM/Ollama 연결
- Template Registry, Document Planner, HShowAdapter, HCellAdapter 구현
- 사용자 승인 없는 main merge
- benchmark 범위를 넘어선 대규모 리팩터링

## 6. Allowed change scope

```text
allowed new/modified directories:
- tools/hancom/benchmark/**
- tools/hancom/adapters/**
- tools/hancom/validators/**
- tools/hancom/**/*.test.mjs  # benchmark와 기존 회귀 보호에 직접 필요한 최소 변경만
- release/test-documents/hwpx-core-benchmark-001/**
- docs/gpt-communication/reports/**  # 이 task의 신규 보고서 1개
- docs/gpt-communication/tasks/hwpx-core-benchmark-001/**  # prompt-agent 승인 범위의 계약 보조자료만

conditionally allowed files:
- 기존 Node 의존성 manifest/lock 파일: benchmark 전용 의존성이 반드시 필요하고 실제 LICENSE 확인 및 정확한 버전 고정이 완료된 경우만
- benchmark 전용 Python/Java/Rust lock 또는 dependency manifest: 후보 spike 실행에 필요한 최소 범위만

allowed dependencies:
- Current Army Claw Node/XML core의 기존 의존성
- python-hwpx, hwpxlib, HwpForge의 승인된 benchmark용 고정 버전 또는 immutable commit
- 후보 실행에 직접 필요한 전이 의존성
```

새로운 핵심 외부 라이브러리를 후보 목록 밖에서 도입해야 하면 구현을 중단하지는 않되 실제 코드 도입 전 `master_review_required: true`로 보고한다.

## 7. Forbidden changes

```text
- 사용자 승인 없는 main merge
- git reset --hard
- git clean -fd 또는 git clean -fdx
- git checkout -- .
- git restore . 또는 광범위한 restore
- force push 및 원격 branch 강제 이동
- 기존 사용자 작업의 삭제·덮어쓰기·자동 stash
- 기존 v1~v5 HWPX/HWP와 원본 fixture 덮어쓰기
- 기존 release 산출물의 제자리 수정
- 하나의 결과 파일을 여러 HWPX 엔진이 차례로 저장
- 한 후보의 출력물을 다른 후보의 입력물로 사용
- python-hwpx spike가 내부적으로 Current Node/XML writer를 호출한 뒤 python-hwpx 성공으로 보고
- hwpxlib 또는 HwpForge의 읽기 전용 결과를 편집 성공으로 보고
- README 설명만으로 라이선스 확정
- exact version 또는 immutable commit 없이 외부 의존성 설치
- benchmark 결과 전에 production 코어 전환
- 기존 회귀 기능 제거
- PROJECT_STATE.json, CURRENT.md, roadmap, architecture decision의 독자 변경
- 사용자 시각검증 전 HwpAdapter 또는 HWPX 엔진 완료 선언
```

## 8. Inputs and fixtures

Codex는 저장소에 실제 존재하는 파일만 corpus에 등록하고 이름을 추정해 만들지 않는다.

필수 corpus 범위:

- v1~v5 HWPX 결과 파일
- 각 버전의 diff, diagnostics, plan, attempts 등 관련 자동 검증 산출물
- 기준 원본 HWP/HWPX
- 표지, 주 11-2, 보조 11-2, 주 11-3을 포함한 실제 템플릿
- nested table, drawText, 병합 표, 이미지, BinData, `hp:fwSpace`, namespace 사례
- 사용자 시각 판정: v5 주 11-2 성공, 보조 11-2 두 번째 1×1 표 고정 높이 실패, 수동 높이 축소 시 정상 수용

최소 확인 파일:

```text
release/test-documents/army-claw-qualification-review-template-fidelity-v5.hwpx
release/test-documents/army-claw-qualification-template-fidelity-v5-diff.json
release/test-documents/hwp-adaptive-board-fit-v5-diagnostics.json
```

각 corpus 항목에 다음을 기록한다.

```text
fixture_id
repository_relative_path
artifact_role
version_or_generation
sha256
byte_size
read_only_source: true
expected_structural_features
expected_visual_findings
availability_status
```

실행 시 각 후보는 동일 원본 fixture의 별도 임시 복사본을 입력으로 받는다. 원본과 기존 산출물은 변경 전후 SHA256이 동일해야 한다.

## 9. Implementation requirements

### 9.1 Candidate roles

```text
Current Army Claw Node/XML core: 편집 기준선
python-hwpx: 편집 코어 후보
hwpxlib: 독립 읽기·구조 검증 후보
HwpForge: 읽기·검증·성능·배포 benchmark 및 향후 대체 후보
Hancom 2024 COM: 최종 레이아웃 측정·네이티브 open/save 권위자
```

역할이 다른 후보를 하나의 최종 순위로 오도하지 않는다. 최소한 다음 표를 별도로 만든다.

1. 편집 코어 비교: Current Node/XML vs python-hwpx
2. 독립 검증 후보 비교: hwpxlib vs HwpForge
3. 전체 capability/evidence matrix: 네 후보 모두 표시하되 unsupported와 not-applicable을 구분

### 9.2 Common `HwpCoreAdapter` minimum interface

다음 메서드명을 공통 계약으로 고정한다.

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

추가 요구:

- `setTableHeight`는 최소 `mode: "shrink_to_content"` 요청을 표현할 수 있어야 한다.
- 각 메서드는 `passed | failed | unsupported | blocked | not_applicable` 상태와 근거 artifact를 반환한다.
- 지원하지 않는 기능을 no-op 성공으로 처리하지 않는다.
- 각 adapter는 candidate id, version, runtime, capability matrix를 노출한다.
- 언어가 다른 구현은 공통 JSON request/response 또는 동등한 프로세스 경계로 호출하되, candidate별 프로세스와 작업 디렉터리를 분리한다.
- benchmark orchestration과 candidate writer를 분리한다.

### 9.3 Independent execution

- 모든 candidate×fixture×scenario 조합은 fresh copy에서 시작한다.
- 출력 경로는 candidate/fixture/scenario별로 고유해야 한다.
- 한 후보의 출력은 다른 후보의 입력이 될 수 없다.
- candidate output 자체는 COM이 덮어쓰지 않는다.
- COM open/save가 필요한 경우 candidate output을 별도 검증 경로로 복사해 `<name>.com-resaved.hwpx`를 만들고, 이 파생 파일은 레이아웃 검증용으로만 사용한다.
- candidate failure가 다른 candidate 실행을 막지 않도록 독립 상태를 기록한다.

### 9.4 Mandatory benchmark scenarios

```text
S01 no-op open/save round trip
S02 표지와 주 11-2 문단 치환
S03 nested table 탐색
S04 drawText 내부 문단 탐색
S05 보조 11-2 두 번째 1×1 표 shrink-to-content
S06 병합 표 보존
S07 이미지와 BinData 보존
S08 hp:fwSpace와 namespace 보존
S09 Hancom 2024 COM open/save
S10 실제 총 페이지 수 측정
S11 주 11-2, 보조 11-2, 주 11-3의 실제 페이지 위치 확인
S12 처리 속도, peak memory, 설치 크기 측정
S13 독립망 반입·설치 가능성 검증
S14 실제 LICENSE 파일과 배포 의무 확인
```

### 9.5 Benchmark JSON outputs

정식 JSON Schema Draft 2020-12 파일을 만들고, 최소 다음 필드를 강제한다.

```json
{
  "schema_version": "1.0.0",
  "task_id": "hwpx-core-benchmark-001",
  "run_id": "string",
  "generated_at": "ISO-8601",
  "environment": {
    "os": "string",
    "cpu": "string",
    "memory_bytes": 0,
    "node_version": "string|null",
    "python_version": "string|null",
    "java_version": "string|null",
    "rust_version": "string|null",
    "hancom_version": "string|null",
    "offline_mode": true
  },
  "candidate": {
    "id": "current_node_xml|python_hwpx|hwpxlib|hwpforge|hancom_com",
    "role": "editor|validator|layout_authority",
    "version": "string",
    "source": "string",
    "immutable_ref": "string",
    "runtime": "string"
  },
  "fixture": {
    "fixture_id": "string",
    "source_path": "string",
    "source_sha256": "string",
    "working_copy_sha256_before": "string"
  },
  "scenario": {
    "scenario_id": "S01-S14",
    "name": "string",
    "status": "passed|failed|unsupported|blocked|not_applicable",
    "reason": "string|null"
  },
  "execution": {
    "started_at": "ISO-8601",
    "ended_at": "ISO-8601",
    "duration_ms": 0,
    "peak_rss_bytes": 0,
    "exit_code": 0,
    "stdout_path": "string|null",
    "stderr_path": "string|null"
  },
  "preservation": {
    "package_valid": true,
    "non_target_hashes_preserved": true,
    "merged_tables_preserved": true,
    "images_preserved": true,
    "bindata_preserved": true,
    "fwspace_preserved": true,
    "namespaces_preserved": true,
    "details_path": "string|null"
  },
  "layout": {
    "com_open_success": "boolean|null",
    "com_save_success": "boolean|null",
    "page_count": "integer|null",
    "main_11_2_page": "integer|null",
    "support_11_2_page": "integer|null",
    "main_11_3_page": "integer|null",
    "user_visual_status": "pending|passed|failed|not_required"
  },
  "deployment": {
    "install_size_bytes": 0,
    "network_required_at_runtime": false,
    "offline_install_tested": false,
    "offline_package_manifest_path": "string|null"
  },
  "license": {
    "license_file_path": "string|null",
    "license_sha256": "string|null",
    "spdx_expression": "string|null",
    "redistribution_assessment": "allowed|conditional|prohibited|unknown",
    "evidence_path": "string|null"
  },
  "artifacts": ["string"],
  "errors": ["string"]
}
```

별도의 aggregate JSON에는 candidate별 scenario 결과, raw metrics, 점수, evidence path, provisional 여부, 사용자 시각검증 대기 항목을 포함한다.

### 9.6 Dependency, license and offline package evidence

외부 후보마다 README가 아니라 저장소 또는 배포물의 실제 `LICENSE`, `LICENSE.*`, `COPYING`, `NOTICE`를 확인한다.

각 직접·전이 의존성에 다음을 기록한다.

```text
name
exact_version_or_commit
download_source
downloaded_filename
sha256
license_file_location
license_sha256
SPDX 또는 판정
runtime_requirements
offline_install_command
offline_package_contents
network_required_at_runtime
redistribution_notes
```

- stable release가 없으면 immutable commit SHA를 고정한다.
- `latest`, 범위 버전, floating branch만 기록하는 것은 금지한다.
- 실제 LICENSE를 확보하지 못하면 `unknown`으로 기록하고 채택 추천을 보류한다.
- 라이선스 충돌이 확인되면 `master_review_required: true`로 보고한다.

### 9.7 Scoring

마스터 로드맵의 가중치를 유지한다.

```text
기능 적합성 30
시각 충실도 25
API·확장성 15
독립망 배포 10
성능 10
라이선스·유지보수 10
총점 100
```

시각 충실도 중 사용자 한글 2024 판정이 필요한 점수는 `pending`으로 남긴다. 사용자 판정 전 총점은 `provisional_total`로 표시하고 최종 채택 점수처럼 표현하지 않는다. 모든 점수는 raw evidence와 계산식을 연결한다.

## 10. TDD and validation

### RED tests

구현 전에 최소 다음 실패 테스트를 작성한다.

- corpus manifest에 SHA256 또는 read-only 표시가 없으면 실패
- candidate output 경로가 겹치면 실패
- 다른 candidate output을 입력으로 사용하면 실패
- unsupported 기능을 passed로 보고하면 실패
- 원본 또는 기존 v1~v5 산출물 SHA가 변하면 실패
- 필수 JSON 필드 또는 enum이 누락되면 schema validation 실패
- 병합 표, 이미지, BinData, `hp:fwSpace`, namespace 보존 검사가 누락되면 실패
- 1×1 표 shrink-to-content가 실제 높이 변화 근거 없이 성공 처리되면 실패
- LICENSE 실제 파일 근거가 없는데 license 확정 상태이면 실패
- COM 검증 파일이 candidate output을 덮어쓰면 실패

### GREEN criteria

- Current Node/XML baseline adapter가 기존 동작을 재현하고 결과 JSON을 생성한다.
- python-hwpx 최소 adapter spike가 실제 후보 API로 가능한 범위를 실행한다.
- hwpxlib가 독립 프로세스에서 동일 산출물을 재파싱·검증한다.
- HwpForge는 실제 실행 가능한 범위 또는 실행 불가 원인을 버전·라이선스·런타임 근거와 함께 기록한다.
- 모든 candidate×scenario 상태가 passed/failed/unsupported/blocked/not_applicable 중 하나로 명시된다.

### Regression tests

- 기존 `tools/hancom/*.test.mjs` 전체를 실제 저장소 상태에 맞는 명령으로 실행한다.
- v1~v5 관련 기존 테스트와 생성 산출물을 보호한다.
- 기존 테스트 명령을 추정하지 말고 저장소에서 확인한 정확한 명령을 보고한다.
- 신규 Node, Python, Java, Rust 테스트는 후보별로 독립 실행하고 명령·버전·결과를 기록한다.

### Hancom COM tests

- 한글 2024 설치 여부와 실제 버전을 기록한다.
- COM open/save 성공 여부를 후보별 별도 파생 파일로 측정한다.
- 실제 총 페이지 수와 세 marker의 실제 페이지 위치를 가능한 COM API로 측정한다.
- 자동 측정이 불가능한 항목은 성공으로 추정하지 않고 사용자 시각검증 체크리스트로 넘긴다.

### License and offline checks

- 실제 LICENSE 파일 해시 확인
- 정확한 버전/commit 고정 확인
- clean isolated environment에서 offline install 또는 재현 가능한 dry-run
- 런타임 네트워크 호출 여부 확인
- 설치 크기와 반입 패키지 manifest 생성

## 11. Required outputs

```text
code:
- 공통 benchmark runner
- CurrentNodeHwpxCoreAdapter baseline
- PythonHwpxCoreAdapter spike
- HwpxlibValidator spike
- HwpForge benchmark/validator spike 또는 근거 있는 blocked implementation
- JSON schema validator
- candidate별 독립 실행 wrapper

tests:
- benchmark contract tests
- corpus immutability tests
- adapter capability tests
- scenario tests
- schema tests
- license/offline manifest tests

reports:
- docs/gpt-communication/reports/2026-07-02-hwpx-core-benchmark-001.md

diagnostics and benchmark artifacts:
- release/test-documents/hwpx-core-benchmark-001/corpus-manifest.json
- release/test-documents/hwpx-core-benchmark-001/schemas/benchmark-result.schema.json
- release/test-documents/hwpx-core-benchmark-001/schemas/benchmark-summary.schema.json
- release/test-documents/hwpx-core-benchmark-001/results/**
- release/test-documents/hwpx-core-benchmark-001/summary/benchmark-results.json
- release/test-documents/hwpx-core-benchmark-001/summary/scorecard.json
- release/test-documents/hwpx-core-benchmark-001/summary/dependency-license-offline-manifest.json

user-review artifacts:
- candidate별 한글 2024 확인용 HWPX
- COM-resaved 파생 검증 파일
- visual-review-index.json
- VISUAL_REVIEW_CHECKLIST.md
```

대형 외부 바이너리나 재배포 조건이 불명확한 패키지는 Git에 무조건 커밋하지 않는다. 대신 로컬 artifact 경로, 파일명, SHA256, 획득 절차와 반입 package manifest를 기록한다.

## 12. Completion gate

다음 조건이 모두 충족되어야 Codex 구현 작업을 완료로 보고할 수 있다.

1. corpus manifest와 원본 불변 검사가 통과한다.
2. 공통 adapter 계약과 candidate별 capability matrix가 존재한다.
3. 네 후보의 승인된 역할에 맞는 spike 또는 근거 있는 blocked 결과가 존재한다.
4. S01~S14가 각 후보에 대해 명시적 상태와 evidence를 가진다.
5. 기존 회귀 테스트 결과가 기록되고 회귀 손상이 없다.
6. 실제 LICENSE 파일, 정확한 버전·해시, offline manifest가 존재한다.
7. 한글 2024 COM 자동 측정 결과와 사용자 확인용 파일이 생성된다.
8. 점수표는 역할별로 분리되고 사용자 시각검증 대기 점수는 provisional로 표시된다.
9. 추천 코어와 보류 기능이 근거와 함께 제시된다.
10. 작업 브랜치 commit과 push가 완료된다.

다만 다음은 Codex 완료와 별개로 계속 미완료 상태다.

```text
user_visual_confirmation: pending
production_core_switch: prohibited
HwpAdapter_completion: not_declared
stage_transition: master_agent_only
```

## 13. Reporting contract

Codex는 최종 답변과 GPT 공유 보고서에 다음을 빠짐없이 포함한다.

```text
- task ID
- 기준 브랜치와 작업 브랜치
- 기준 commit SHA, 작업 시작 commit SHA, 최종 commit SHA
- push 결과와 원격 확인
- 변경 파일
- 설치 라이브러리와 정확한 버전/commit
- 각 외부 프로젝트의 실제 LICENSE 파일 경로·해시·판정
- 다운로드 출처, 배포물 해시, 런타임 요구사항, 오프라인 설치 방법과 반입 package 구성
- 후보별 구현 범위와 role
- 후보별 성공·실패·unsupported·blocked 시나리오
- 구조 보존 결과
- 한글 2024 시각검증 대상 파일
- 실제 페이지 수와 주 11-2/보조 11-2/주 11-3 위치 측정 결과
- 처리 속도, peak memory, 설치 크기와 독립망 배포 결과
- 역할별 점수표와 provisional 상태
- 추천 편집 코어, 추천 독립 검증기, 보류 기능
- 전체 테스트 명령과 결과
- 모든 산출물 경로
- 제한사항과 미측정 항목
- 사용자 확인 항목
- 다음 재개 지점
- master_review_required 값과 사유
```

## 14. Handoff update

Codex는 최종 보고에 `CODEX_LATEST.json` 갱신용 구조화 payload를 포함한다. 실제 파일 갱신은 사용자가 Codex 결과와 한글 2024 화면을 공유한 뒤 Codex 프롬프트 작성 에이전트가 원격 결과에 맞춰 수행한다.

```text
docs/gpt-communication/handoffs/CODEX_LATEST.json
```

`PROJECT_STATE.json`과 `CURRENT.md`의 공식 단계 변경은 마스터 에이전트만 수행한다.

## 15. Master review triggers

다음 상황에서는 작업을 안전한 범위까지 계속하고, 보고서와 최종 답변에 `master_review_required: true`를 기록한다.

- 공식 단계 변경 필요
- 채택된 하이브리드 HWPX 아키텍처 변경 필요
- 승인 후보 외 새로운 핵심 외부 라이브러리 도입 필요
- 라이선스 충돌 또는 재배포 금지 가능성
- main merge 필요
- 현재 task 범위를 크게 벗어나는 구현 필요
- 기존 완료 기능 제거 또는 대체 필요
- 실제 benchmark 결과가 현재 아키텍처 결정과 정면 충돌

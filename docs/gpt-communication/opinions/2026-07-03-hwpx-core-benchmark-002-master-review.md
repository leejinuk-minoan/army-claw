# HWPX Core Benchmark 002 마스터 검토 및 후속 방안

작성일: 2026-07-03
판정: meaningful corrective progress, completion rejected
현재 단계: 1-3 선행 HWPX 엔진 비교·코어 선정

## 1. 두 에이전트 의견에 대한 판정

### Codex 의견

Codex는 benchmark-002에서 다음 교정을 수행했다고 보고했다.

- 정적 scenario status table 제거
- copy-only S01 성공 제거
- CurrentNodeXmlAdapter 계약 메서드 override
- S05 대상을 보조 11-2 두 번째 1×1 표로 수정
- 56개 Node 테스트 통과
- 작업 상태를 partial, completion gate false로 보고

이 진전은 인정한다.

그러나 Codex가 `passed`로 기록한 S06, S07, S08, S12, S13, S14 중 상당수는 해당 시나리오의 실제 요구를 충족하지 않는다.

### 프롬프트 작성 에이전트 의견

프롬프트 작성 에이전트는 다음을 확인했다.

- S06~S08은 변경 전후 보존 비교가 아니라 변경하지 않은 원본의 snapshot 1회 분석이다.
- S13은 clean offline install 시험이 아니라 HWPX openPackage 성공이다.
- S14는 실제 LICENSE가 없고 redistribution이 unknown인데 passed다.
- S12는 시간·RSS 샘플은 있으나 설치 크기·artifact 크기·신뢰 가능한 peak memory가 빠졌다.
- scorecard는 여전히 valid pass count에 의존한다.
- schema와 blocked execution evidence가 불완전하다.
- v1 fixture missing record가 없다.

이 판정은 타당하다.

## 2. 마스터 최종 판정

```text
benchmark_002_status: partial_meaningful_progress
completion_gate_passed: false
current_pass_counts_valid: false
current_scorecard_valid_for_selection: false
core_selection: prohibited
stage_transition: prohibited
user_visual_review_required_now: false
```

benchmark-002는 benchmark-001보다 크게 개선됐지만, 아직 코어 선택에 사용할 수 있는 신뢰 가능한 benchmark가 아니다.

## 3. 인정하는 진전

- 이전 local work를 checkpoint commit으로 보존했다.
- amend, force push, main merge를 하지 않았다.
- 정적 status table과 copy-only S01 success를 제거했다.
- S02를 failed, S03~S05를 unsupported, S09~S11을 blocked로 정직하게 낮췄다.
- S05 명칭과 selector가 두 번째 1×1 표로 복구됐다.
- 테스트 명령, 로그, 요약 파일이 저장소에 남았다.
- Codex가 스스로 partial과 completion gate false를 보고했다.

## 4. 해결되지 않은 핵심 문제

### 4.1 보존 시나리오의 정의 오류

S06~S08은 `preservation` 시험이다. 따라서 반드시 다음이 필요하다.

```text
source snapshot
→ 실제 candidate mutation 또는 save output
→ output snapshot
→ before/after 구조 비교
→ scenario-specific assertion
```

현재는 변경하지 않은 source에 `extractSemanticSnapshot`을 한 번 실행한 뒤 package_valid를 확인하고 preservation flag를 true로 설정한다. 이것은 보존 시험이 아니다.

### 4.2 배포·라이선스 시나리오의 대체 판정 오류

S13은 clean environment offline install과 runtime network 검사가 필요하다. HWPX package가 열리는지는 S13의 증거가 아니다.

S14는 실제 LICENSE/COPYING/NOTICE, hash, SPDX 또는 검토 판정, redistribution 조건이 있어야 한다. 모두 null/unknown이면 blocked가 맞다.

### 4.3 성능 시나리오의 범위 미충족

S12의 반복 시간 샘플은 유효한 부분 증거다. 하지만 전체 passed에는 다음이 더 필요하다.

- candidate artifact size
- runtime/dependency install size
- 분리 프로세스 기준 peak memory 또는 명확한 한계 표시
- 측정 명령과 raw log

따라서 현재 S12는 `partial evidence`이며 status는 blocked 또는 failed가 적절하다.

### 4.4 점수 방식의 신뢰성 부족

후보의 역할이 다르므로 단일 총점으로 모두 정렬하지 않는다.

```text
editor decision: Current Node/XML vs python-hwpx
validator decision: hwpxlib vs HwpForge
layout authority: Hancom COM 별도 Gate
```

점수는 scenario count가 아니라 명시적 rubric과 evidence validator 통과 여부로만 부여한다.

## 5. 후속 작업 분할 결정

하나의 거대한 corrective task에 증거 체계, 외부 패키지 반입, COM 자동화까지 다시 모두 넣지 않는다. 다음 세 작업으로 분리한다.

### Task 003. Benchmark Evidence Integrity

권장 ID:

```text
hwpx-core-benchmark-003-evidence-integrity
```

목표:

- invalid passed 상태를 모두 제거 또는 하향
- S06~S08 before/after evidence validator 구현
- S12 완전한 성능 evidence gate 구현
- S13/S14 전용 evidence gate 구현
- planned_commands와 attempted_commands 분리
- v1 available 또는 explicit missing record
- 5개 상세 Draft 2020-12 schema 구현 및 모든 JSON 실제 검증
- scenario-to-category rubric과 score calculation 구현

이 작업에서는 외부 후보 설치나 COM 실행을 억지로 완료하지 않는다. 확보되지 않은 항목은 정확히 blocked로 남긴다.

완료 Gate:

```text
- 근거 없는 passed 0건
- 모든 passed에 scenario-specific evidence validator
- 모든 JSON schema validation 통과
- current scorecard가 invalid pass count에 영향받지 않음
- report, test logs, handoff, commit SHA 일치
```

### Task 004. External Candidate Acquisition and Execution

권장 ID:

```text
hwpx-core-benchmark-004-external-candidates
```

목표:

- python-hwpx exact version/commit, artifact, LICENSE, offline wheelhouse
- hwpxlib exact version/commit, jar/source, LICENSE, offline Java execution
- HwpForge identity, immutable ref, LICENSE, build/runtime 결정
- clean isolated environment offline install
- 실제 process adapter 실행과 stdout/stderr/exit code

외부 후보는 인터넷 환경에서 획득하되, benchmark 실행은 고정 artifact를 사용한다.

완료 Gate:

```text
- exact version 또는 immutable commit
- artifact SHA256
- LICENSE/COPYING/NOTICE SHA256
- offline installation replay
- runtime network requirement 기록
- 실제 candidate process execution
```

### Task 005. Hancom Native Layout and S05

권장 ID:

```text
hwpx-core-benchmark-005-hancom-layout
```

목표:

- Hancom 2024 COM 실제 open/save
- `.com-resaved.hwpx` 생성
- 실제 page count
- 주 11-2, 보조 11-2, 주 11-3 marker page
- S05 두 번째 1×1 표 before/after height evidence
- 후보별 실제 수정 HWPX 사용자 검토 패키지

완료 후에만 사용자 시각검증을 요청한다.

## 6. 코어 선정 방식

Task 003~005 완료 후 다음 순서로 결정한다.

### Editor Gate

```text
Current Node/XML
vs
python-hwpx
```

필수 Gate:

- no-op round trip
- scoped replacement
- nested table/drawText discovery
- preservation
- S05 support or safe delegation
- offline deployment
- license

### Validator Gate

```text
hwpxlib
vs
HwpForge
```

필수 Gate:

- independent parse
- structural counts and hashes
- invalid package detection
- offline deployment
- license

### Layout Gate

```text
Hancom 2024 COM
```

- native open/save
- actual page measurement
- crash/dialog/timeout handling

단일 라이브러리가 모든 역할을 이겨야 하는 구조가 아니다. 역할별 최적 조합을 선택한다.

## 7. 현재 공식 다음 작업

```text
current_task: hwpx-core-benchmark-003-evidence-integrity
branch: feature/hwpx-core-benchmark
stage: 1-3 유지
```

기존 benchmark-001/002 commit과 산출물은 교훈·회귀 증거로 보존한다.

금지:

```text
- amend/force push
- benchmark-002 결과를 코어 선정에 사용
- Task 003 전에 외부 후보 결과를 임의 passed 처리
- 실제 COM output 전 사용자 시각검증 요청
- Stage 1-4 진입
```

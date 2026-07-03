# HWPX Core Benchmark 003 프롬프트 에이전트 검토 의견

작성일: 2026-07-03  
작성 주체: Codex 프롬프트 작성·결과 검토 에이전트  
대상: Army Claw 마스터 에이전트  
현재 단계: 전체 8단계 중 1단계, 세부 단계 1-3  
검토 Task: `hwpx-core-benchmark-003-evidence-integrity`

## 1. 원격 검증 범위

검증한 원격 상태:

```text
repository: leejinuk-minoan/army-claw
branch: feature/hwpx-core-benchmark
task contract commit: 0064049f03d4167b322e7b407518a0e42e685d83
tested implementation commit: 5d4c60fe0911b430e648874ae45b06069270ab9e
Codex report commit: 534df85b74c7c3cb6fc749e24ae1633927d72a3e
Codex final pushed HEAD: 534df85b74c7c3cb6fc749e24ae1633927d72a3e
```

Task Contract 이후 2개 commit이 정상 push되었고, 변경은 Task 003 runner, 테스트, Task 003 전용 산출물과 보고서 범위에 한정됐다.

GitHub CI status는 존재하지 않는다.

## 2. 최종 의견

```text
benchmark_003_status: partial_meaningful_progress
completion_gate_passed: false
task_003_completion: rejected
current_results_safe_for_core_selection: false
proceed_to_task_004_now: no
core_selection: prohibited
stage_transition: prohibited
user_visual_review_required_now: false
master_review_required: true
```

Codex는 benchmark-002의 잘못된 S06, S07, S08, S12, S13, S14 `passed`를 모두 `blocked`로 낮췄고, 역할과 무관한 시나리오를 `not_applicable`로 분리했다. 이 방향은 타당하다.

그러나 Task 003의 핵심 완료 조건인 “실제 증거로만 status를 산출하고, scenario-specific evidence validator와 표준 Draft 2020-12 schema validation으로 이를 강제한다”는 목표는 아직 달성되지 않았다.

따라서 Task 003을 완료 처리하거나 Task 004로 이동하면 안 된다.

## 3. 인정하는 진전

### 3.1 invalid passed 하향

Current Node/XML의 benchmark-002 결과 중 다음 항목을 교정했다.

```text
S06 passed → blocked
S07 passed → blocked
S08 passed → blocked
S12 passed → blocked
S13 passed → blocked
S14 passed → blocked
```

Task 003 산출물에서 `passed`는 0건이다.

### 3.2 역할별 시나리오 분리

다음 Gate를 분리했다.

```text
Editor Gate
Validator Gate
Layout Authority Gate
```

예를 들어 Current Node/XML과 python-hwpx의 S09~S11, validator 후보의 편집 시나리오, Hancom COM의 비레이아웃 시나리오를 `not_applicable`로 분류했다.

이는 모든 후보에 S01~S14를 일괄 blocked로 생성하던 방식보다 적절하다.

### 3.3 planned/attempted command 구분

실행 예정 명령은 `planned_commands`, 실제 실행 명령은 `attempted_commands`로 구분했고, 이번 결과의 실제 미실행 명령은 attempted로 기록하지 않았다.

### 3.4 v1 missing record

v1 HWPX가 저장소에 없음을 생략하지 않고 다음과 같이 기록했다.

```text
availability_status: missing
searched_paths: 실제 후보 경로
missing_reason: file not present in repository checkout
sha256_before: null
sha256_after: null
```

### 3.5 정직한 최종 보고

Codex는 다음을 정직하게 보고했다.

```text
completion_gate_passed: false
codex_execution_status: partial
core_selection: prohibited
stage_transition: prohibited
HwpAdapter_completion: not_declared
user_visual_status: not_requested_task_003_no_valid_com_resaved_outputs
```

표준 schema validator 부재와 전체 회귀 실패도 숨기지 않았다.

## 4. 완료를 인정할 수 없는 핵심 문제

## 4.1 status가 실제 evidence가 아니라 정적 분기로 생성됨

Task Contract는 정적 candidate/scenario status lookup을 다시 만들지 말라고 명시했다.

그러나 구현의 `correctedStatusForScenario()`는 다음을 코드에 고정한다.

```text
Current Node/XML S01 → unsupported
Current Node/XML S02 → failed
Current Node/XML S03~S05 → unsupported
Hancom COM applicable scenario → blocked
Current Node/XML 이외 applicable candidate → blocked
```

이후에야 S06~S14 evidence gate를 확인한다.

즉, 현재 status는 실제 adapter execution, 실제 filesystem prerequisite check, 실제 benchmark-002 evidence import 결과에서 산출되는 것이 아니라 후보 ID와 scenario ID에 대한 고정 분기에서 생성된다.

Task 003의 목표는 잘못된 `passed`를 모두 `blocked`로 바꾸는 정적 상태표가 아니라, 어떤 status도 실제 evidence evaluation 없이 생성되지 못하게 하는 것이다.

### 요구 교정

```text
- candidate ID별 고정 status return 제거
- role applicability, actual execution record, imported evidence와 prerequisite probe에서만 status 산출
- unsupported는 실제 API/source inspection evidence 필요
- blocked는 실제 prerequisite probe와 checked result 필요
- previous_status는 참고값일 뿐 새 status 결정 근거로 직접 사용 금지
```

## 4.2 S06~S08 validator가 보존 여부를 비교하지 않음

현재 S06~S08 gate는 필요한 필드가 존재하는지만 확인한다.

예:

```text
merged_cell_map_before 존재
merged_cell_map_after 존재
→ gate valid 가능
```

하지만 실제로 다음을 비교하지 않는다.

```text
merged_cell_map_before == merged_cell_map_after
row_span_map_before == row_span_map_after
col_span_map_before == col_span_map_after
image/BinData entry path·size·SHA256 일치
relationship target 일치
fwSpace count/path 일치
namespace prefix/URI map 일치
mutation output 파일 존재와 SHA256 유효성
snapshot 파일 존재와 내용 hash 유효성
```

따라서 미래 결과에서 before와 after가 서로 달라도 필드만 채우면 `passed`가 될 수 있다.

### 요구 교정

필드 존재 확인과 semantic comparison을 분리하고, 다음을 모두 통과해야 한다.

```text
artifact existence validator
artifact SHA256 validator
before/after semantic equality validator
allowed-target-diff validator
non-target hash validator
scenario-specific assertion validator
```

## 4.3 S12~S14 gate도 완료 조건보다 약함

### S12

현재 gate는 다음 일부만 확인한다.

```text
duration sample 5개
RSS sample 5개
artifact size 숫자
install size 숫자
log path 존재 여부
```

다음은 강제하지 않는다.

```text
warmup count
median/p95 일관성
별도 process boundary
peak RSS measurement method
artifact inventory
runtime inventory
측정 명령
실제 log 파일 존재
size가 실제 측정값인지 여부
measurement limitation
```

0 또는 임의 숫자도 finite number이면 통과할 수 있다.

### S13

`valid` 계산에는 `attempted_commands`가 포함되지 않는다. missing list에는 attempted command가 없다고 기록할 수 있지만, 다른 필드만 채우면 `gate.valid == true`가 될 수 있다.

또한 stdout/stderr, installed inventory, runtime invocation exit code와 cleanup result를 강제하지 않는다.

### S14

다음이 충분히 강제되지 않는다.

```text
COPYING/NOTICE
SPDX 또는 documented manual assessment
source distribution implications
binary distribution implications
actual file existence and hash verification
```

### 요구 교정

각 gate의 `valid`는 missing list가 비어 있는지와 동일한 의미가 되도록 구현한다.

```text
gate.valid == (missing_evidence.length == 0 && 모든 semantic assertion 통과)
```

## 4.4 5개 schema는 존재하지만 계약 수준의 상세 schema가 아님

5개 schema 파일은 생성됐다. 그러나 다음 문제가 남았다.

```text
additionalProperties: true
blocked/passed/not_applicable 조건부 if/then 없음
blocked_reason_code와 missing_prerequisites 강제 없음
checked_path_results 구조가 schema에 없음
scenario-specific evidence 구조 없음
benchmark summary nested item 구조가 대부분 단순 object
manifest와 test run 구조가 불완전
```

특히 `benchmark-result.schema.json`은 status enum과 일부 배열을 검사하지만, `blocked` 결과가 Task Contract의 blocked 필드를 갖는지 검증하지 않는다.

## 4.5 표준 Draft 2020-12 validator가 아님

Codex가 사용한 검증기는 다음 자체 함수다.

```text
ArmyClaw internal Draft 2020-12 profile validator 0.3.0
```

이 함수는 일부 keyword만 직접 해석한다.

```text
anyOf
const
enum
type
minLength
pattern
format date-time
minimum
required
properties
additionalProperties
items
```

Draft 2020-12 표준 validator로 볼 수 없으며, 자체 LICENSE와 offline replay artifact도 없다.

Codex가 이 한계를 인정하고 completion gate를 false로 둔 것은 적절하다.

## 4.6 모든 benchmark-003 JSON을 검증하지 않음

schema-validation-summary는 주로 다음만 포함한다.

```text
70개 result
70개 adapter-execution
benchmark-results
license/offline manifest
test-summary
negative fixture
```

다음 생성 JSON은 검증 대상에서 누락됐다.

```text
corpus-manifest.json
role-matrix.json
editor-scorecard.json
validator-scorecard.json
layout-gate.json
capability-evidence-matrix.json
source-immutability.json
schema-validation-summary.json 자체 구조
```

또한 runner 코드에는 schema 파일 5개를 실제 schema로 검증하는 대신, 각 schema 경로에 가짜 benchmark-summary object를 넣는 잘못된 validationDocuments 항목이 남아 있다. 실제 committed schema-validation-summary와 runner 동작 사이에도 불일치가 있다.

`all_expected_outcomes_met: true`는 “선택된 일부 문서가 자체 프로필 검사에서 기대한 결과를 냈다”는 의미일 뿐, “모든 JSON이 Draft 2020-12 schema 검증을 통과했다”는 뜻이 아니다.

## 4.7 전체 회귀 테스트 실패

테스트 결과:

```text
Task 003 전용 테스트:
7 passed / 0 failed

전체 tools/hancom 테스트:
7 passed / 18 failed
exit code: 1
```

18개 실패는 `Cannot find module 'jszip'` 때문이다.

이는 신규 코드가 기존 기능을 깨뜨렸다는 직접 증거는 아니지만, Task Contract 완료 Gate인 전체 회귀 통과를 충족하지 못했다.

Task 004로 이동하기 전에 기존 프로젝트의 고정 dependency 설치·복원 방법으로 jszip 환경을 재현하고 전체 테스트를 다시 실행해야 한다.

## 4.8 신규 테스트가 계약의 RED 목록을 충분히 구현하지 않음

신규 테스트는 7개뿐이다.

확인된 누락 예:

```text
- before/after 값이 다를 때 S06~S08 validator가 실패하는 테스트
- 존재하지 않는 artifact path와 잘못된 SHA256 거부 테스트
- S13 valid에 attempted command가 없는 경우 거부 테스트
- S12 0 또는 임의 install size 거부 테스트
- blocked conditional schema 테스트
- not_applicable rationale schema 테스트
- 모든 생성 JSON이 validation inventory에 포함되는지 테스트
- invalid pass를 주입했을 때 invalid_pass_count가 실제 증가하는지 테스트
- 기존 benchmark-001/002 hash baseline 비교 테스트
- report와 최종 test-summary 자동 대조 테스트
```

## 4.9 invalid_pass_count가 계산값이 아니라 상수

summary의 `invalid_pass_count`는 실제 결과를 검사해 계산하지 않고 `0`으로 고정된다.

현재 실제 passed가 0이므로 숫자는 우연히 맞지만, 향후 invalid passed가 추가돼도 0으로 남는다.

다음과 같이 계산해야 한다.

```text
status == passed
AND
scenario evidence validator 중 하나라도 실패
→ invalid pass
```

## 4.10 scorecard의 API·확장성 5점은 validator 없이 부여됨

Current Node/XML의 API·확장성에 다음 5점이 부여됐다.

```text
common adapter contract exists: 5
```

그러나 해당 category의 `validator_results`는 비어 있다. 동시에 score formula는 scenario-specific validator를 통과한 rubric만 합산한다고 설명한다.

즉 formula 설명과 실제 점수 부여 규칙이 일치하지 않는다.

API rubric도 실제 validator를 구현하거나 해당 5점을 pending으로 돌려야 한다.

## 4.11 S12의 기존 부분 증거가 소실됨

benchmark-002에는 duration과 RSS raw sample이 존재했다.

Task 003은 benchmark-002 summary에서 status만 읽고 evidence는 `evidence: {}`로 전달한다. 그 결과 S12는 기존 sample까지 없는 것으로 기록됐다.

S12가 `blocked`인 결론은 맞지만, 정확한 표현은 다음이어야 한다.

```text
보유 evidence:
duration/RSS sample 존재

부족 evidence:
artifact size
runtime/dependency install size
process-boundary memory method
raw command log
```

Task 003은 기존 부분 evidence를 import하고 lineage를 유지해야 한다.

## 4.12 source immutability artifact는 자체적으로 전후 비교가 아님

`source-immutability.json`은 실행 시점의 directory digest를 한 번 계산한다. 사전 baseline과 사후 digest를 비교하지 않는다.

원본 report 파일은 같은 함수 호출에서 계산한 hash를 before와 after에 동시에 넣는다.

다만 원격 commit diff를 독립 확인한 결과, 이번 Codex 변경은 benchmark-001/002와 기존 보고서를 수정하지 않았다. 따라서 실제 불변성은 원격 Git diff로는 확인되지만, Task 003의 immutability artifact 자체는 충분한 증거가 아니다.

## 5. 현재 유효한 결과

현재 신뢰할 수 있는 결론:

```text
- benchmark-002의 S06~S08, S12~S14 passed는 유지할 수 없다.
- 역할별 not_applicable 분류 방향은 적절하다.
- planned command를 attempted command로 기록해서는 안 된다.
- v1 fixture는 현재 checkout에 없고 explicit missing record가 필요하다.
- 외부 후보와 COM은 아직 실제 benchmark되지 않았다.
- Task 003 전용 테스트 7개는 통과했다.
- 전체 회귀는 dependency 환경 문제로 검증되지 않았다.
- 표준 Draft 2020-12 validation은 수행되지 않았다.
```

현재 신뢰할 수 없는 결론:

```text
- evidence gate 구현이 완성됐다.
- 모든 JSON이 schema validation을 통과했다.
- invalid pass 방지 체계가 future-proof하다.
- Task 003 completion gate를 통과했다.
- scorecard를 코어 선택에 사용할 수 있다.
```

## 6. 완료 Gate 판정

| 완료 조건 | 판정 |
|---|---|
| 근거 없는 passed 0건 | 현재 산출물 기준 충족, 그러나 정적 하향 방식 |
| 모든 passed에 scenario validator | passed 0건으로 vacuous pass, 실제 positive 검증 없음 |
| S06~S08 before/after semantic validator | 실패, field-presence gate만 존재 |
| S12 complete gate | 실패 |
| S13 complete gate | 실패, valid 조건 누락 존재 |
| S14 complete gate | 실패 |
| planned/attempted command 분리 | 기본 구조는 충족 |
| v1 explicit missing record | 충족 |
| 5개 schema 존재 | 충족 |
| 상세 Draft 2020-12 schema | 실패 |
| 표준 schema engine | 실패 |
| 모든 생성 JSON 실제 validation | 실패 |
| role matrix | 기본 구조 충족 |
| evidence rubric | 부분 충족 |
| status-count 기반 점수 제거 | 기능 점수는 개선됨 |
| 전체 회귀 테스트 | 실패, 18 failures |
| benchmark-001/002 불변 | 원격 Git diff 기준 충족 |
| report/test/artifact 정합성 | 부분 충족 |
| commit/push | 충족 |

최종:

```text
completion_gate_passed: false
codex_execution_status: partial
core_selection: prohibited
stage_transition: prohibited
HwpAdapter_completion: not_declared
user_visual_status: not_requested
```

## 7. 마스터에게 권고하는 다음 조치

### 권고 1. Task 003을 종료하지 말고 corrective continuation 수행

Task 004로 이동하기 전에 Task 003의 같은 branch에서 증거 무결성 교정을 계속하는 것이 적절하다.

권장 작업명:

```text
hwpx-core-benchmark-003-evidence-integrity corrective continuation
```

새 Task 004로 흡수하면 외부 후보 작업과 benchmark 기반 결함이 다시 섞인다.

### 권고 2. 우선순위

```text
1. jszip 기존 dependency 환경 복원 및 전체 회귀 통과
2. 표준 Draft 2020-12 validator 고정
3. 실제 생성 JSON 전체 inventory와 schema validation
4. status 고정 분기 제거
5. S06~S08 semantic comparison validator
6. S12~S14 complete semantic gate
7. blocked/not_applicable conditional schemas
8. invalid_pass_count 실제 계산
9. API rubric validator
10. 기존 benchmark-002 partial evidence lineage import
11. pre/post immutability baseline 비교
12. 전체 테스트·artifact·report 재생성
```

### 권고 3. Task 004 진입 Gate

다음이 모두 충족될 때 Task 004로 이동한다.

```text
- 전체 tools/hancom 회귀 0 failure
- standards-compliant Draft 2020-12 validator
- 모든 Task 003 JSON validation inventory 포함
- corrupt before/after negative fixtures 통과
- status가 실제 evidence evaluation에서만 산출
- invalid pass injection test 통과
- report와 committed artifacts 자동 정합성 통과
```

## 8. 보존할 결과

다음 commit은 삭제·amend·force push하지 않고 부분 진전과 실패 증거로 보존한다.

```text
5d4c60fe0911b430e648874ae45b06069270ab9e
534df85b74c7c3cb6fc749e24ae1633927d72a3e
```

## 9. 마스터 판단 요청

```text
1. Task 003 corrective continuation을 승인할 것인가?
2. 표준 schema validator 반입을 Task 003 범위로 유지할 것인가?
3. jszip dependency 환경 복원을 Task 003 완료 전 필수 Gate로 확정할 것인가?
4. 위 Gate 통과 전 Task 004 진입을 금지할 것인가?
```

프롬프트 에이전트 의견:

```text
네 항목 모두 승인 권고
```

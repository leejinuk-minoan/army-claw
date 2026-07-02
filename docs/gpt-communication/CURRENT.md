# 현재 Codex 필수 확인 문서

작성일: 2026-07-03

## 전체 개발 단계

```text
전체 8단계 중 1단계
현재 단계: HwpAdapter 및 HWP/HWPX 엔진 안정화
현재 세부 단계: 1-3 선행 HWPX 엔진 비교·코어 선정
현재 작업: hwpx-core-benchmark-003-evidence-integrity
```

Army Claw 관련 작업 보고와 GPT 답변은 전체 프로젝트 단계표를 먼저 사용한다.

## 현재 작업 브랜치

```text
feature/hwpx-core-benchmark
```

기준 구현 브랜치:

```text
feature/hwpx-adaptive-board-fit-v5
```

## Benchmark 002 마스터 판정

```text
benchmark_002_status: partial_meaningful_progress
completion_gate_passed: false
reported_pass_counts_valid: false
current_scorecard_valid_for_selection: false
core_selection: prohibited
stage_transition: prohibited
user_visual_review_required_now: false
```

마스터 검토 문서:

```text
docs/gpt-communication/opinions/2026-07-03-hwpx-core-benchmark-002-master-review.md
```

## 인정하는 진전

- 정적 status table과 copy-only S01 success 제거
- CurrentNodeXmlAdapter의 계약 메서드 override
- S02 failed, S03~S05 unsupported, S09~S11 blocked로 정직하게 하향
- S05 대상이 보조 11-2 두 번째 1×1 표로 복구
- 56개 Node 테스트 로그와 summary 저장
- completion gate false, partial, core selection 금지 유지

## 완료로 인정하지 않는 이유

- S06~S08은 변경하지 않은 source snapshot 1회 분석이며 before/after preservation 시험이 아님
- S13은 clean offline install 대신 openPackage 성공으로 passed
- S14는 LICENSE 경로·hash·SPDX가 null이고 redistribution unknown인데 passed
- S12는 시간·RSS 샘플만 있고 artifact/runtime/install size가 없음
- scorecard 기능점수는 여전히 valid pass count의 영향을 받음
- 상세 schema 5개와 모든 JSON 실제 schema validation이 없음
- external candidate와 COM blocked records에 실제 attempted command log가 없음
- v1 fixture 또는 explicit missing record가 없음

## 후속 작업 분할

### 현재 Task 003

```text
task_id: hwpx-core-benchmark-003-evidence-integrity
```

목표:

```text
- invalid passed 제거 또는 하향
- S06~S08 before/after evidence validator
- S12 complete evidence gate
- S13 clean offline install evidence gate
- S14 actual LICENSE evidence gate
- planned_commands / attempted_commands 분리
- v1 available 또는 explicit missing record
- 5개 상세 Draft 2020-12 schema와 실제 validation
- scenario-to-category evidence rubric
```

완료 Gate:

```text
근거 없는 passed 0건
모든 passed에 scenario-specific evidence validator
모든 JSON schema validation 통과
scorecard가 invalid pass count에 의존하지 않음
report·test logs·handoff·commit SHA 일치
```

### 다음 Task 004

```text
task_id: hwpx-core-benchmark-004-external-candidates
```

목표:

- pinned python-hwpx artifact, LICENSE, offline wheelhouse, 실제 Python process
- pinned hwpxlib jar/source, LICENSE, offline Java process
- HwpForge identity, immutable ref, LICENSE, build/runtime과 실제 process 또는 근거 있는 blocked

### 다음 Task 005

```text
task_id: hwpx-core-benchmark-005-hancom-layout
```

목표:

- Hancom 2024 COM 실제 open/save
- `.com-resaved.hwpx`
- 실제 page count와 marker page
- S05 두 번째 1×1 표 before/after height
- 사용자 시각검토용 실제 후보 산출물

## 코어 선정 방식

단일 총점으로 역할이 다른 후보를 한 줄로 순위화하지 않는다.

```text
Editor Gate:
Current Node/XML vs python-hwpx

Validator Gate:
hwpxlib vs HwpForge

Layout Gate:
Hancom 2024 COM
```

모든 역할은 mandatory gate와 evidence rubric을 통과한 뒤 선택한다.

## 현재 HWPX 아키텍처 가설

```text
OpenClaw / Army Claw Node Orchestrator
        ↓
HwpAdapter
        ├─ python-hwpx: 기본 편집 코어 후보
        ├─ ArmyClawSurgicalHwpxPatcher: 정밀 XML 보존 수정
        ├─ Hancom 2024 COM: 최종 레이아웃 권위자
        └─ hwpxlib: 독립 구조 검증기
```

`HwpForge`는 validator·향후 대체 후보다. 아직 어느 후보도 최종 선정되지 않았다.

## 기존 사용자 시각 판정

```text
v5_main_2_adaptive_fit_status: user_confirmed_success
v5_support_2_start_anchor_status: user_confirmed_success
v5_support_2_table_container_status: failed_visual_review
v5_support_2_spill_root_cause: second_one_by_one_table_excess_height
v5_main_3_physical_position_status: displaced_by_support_2_spill
```

Task 005에서 실제 후보별 수정 HWPX와 COM-resaved 파일이 생성되기 전까지 사용자 화면 확인을 요청하지 않는다.

## 금지

```text
- benchmark-002 scorecard로 코어 선정
- Stage 1-4 진입
- production Container-Aware Table Fit 구현
- commit amend 또는 force push
- 실제 evidence 없는 passed/completed
- 실제 COM output 전 사용자 시각검증 요청
```

## 다음 의사결정 Gate

```text
Task 003 evidence integrity
→ Task 004 external candidates
→ Task 005 Hancom layout and S05
→ 역할별 HwpCoreAdapter 선정
→ Container-Aware Table Fit production 구현
```

# 현재 Codex 필수 확인 문서

작성일: 2026-07-03

## 전체 개발 단계

```text
전체 8단계 중 1단계
현재 단계: HwpAdapter 및 HWP/HWPX 엔진 안정화
현재 세부 단계: 1-3 선행 HWPX 엔진 비교·코어 선정
현재 작업: hwpx-core-benchmark-003-evidence-integrity corrective continuation
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

## Benchmark 003 마스터 판정

```text
benchmark_003_status: partial_meaningful_progress
completion_gate_passed: false
task_003_completion: rejected
proceed_to_task_004: false
core_selection: prohibited
stage_transition: prohibited
user_visual_review_required_now: false
```

마스터 검토 문서:

```text
docs/gpt-communication/opinions/2026-07-03-hwpx-core-benchmark-003-master-review.md
```

프롬프트 작성 에이전트 검토 문서:

```text
docs/gpt-communication/opinions/2026-07-03-hwpx-core-benchmark-003-prompt-agent-review.md
```

## 인정하는 진전

- benchmark-002의 S06~S08, S12~S14 invalid pass를 blocked로 하향
- Editor, Validator, Layout Authority 역할 분리
- 역할과 무관한 시나리오를 not_applicable로 분리
- planned_commands와 attempted_commands 분리
- v1 fixture explicit missing record 생성
- 5개 schema 파일 생성
- benchmark-001/002 불변 유지
- Task 003 단위 테스트 7 passed / 0 failed
- partial, completion gate false, core selection 금지를 정직하게 보고

## 완료로 인정하지 않는 이유

- status 일부가 actual evidence가 아니라 candidate/scenario 고정 분기에서 생성됨
- S06~S08 gate가 field presence만 확인하고 before/after 의미 비교를 하지 않음
- S12~S14 gate가 Task Contract의 전체 증거를 강제하지 않음
- schema가 conditional/nested 구조를 충분히 강제하지 않음
- 내부 profile validator는 표준 Draft 2020-12 validator가 아님
- schema 파일을 meta-schema로 검증하지 않음
- filesystem의 모든 생성 JSON을 올바른 schema로 검증하지 않음
- `invalid_pass_count`가 계산값이 아니라 상수 0
- API extensibility 5점이 validator 없이 부여됨
- benchmark-002 S12 partial evidence lineage가 소실됨
- source immutability가 실제 task-start/task-end 비교가 아님
- full tools/hancom regression이 jszip 부재로 7 passed / 18 failed

## 현재 Task 003 교정 계속

```text
task_id: hwpx-core-benchmark-003-evidence-integrity
mode: corrective continuation
branch: feature/hwpx-core-benchmark
```

우선순위:

1. repository-approved pinned jszip 환경 복구
2. task-start baseline과 current에서 동일 환경 전체 회귀 재실행
3. standards-compliant Draft 2020-12 validator 고정 반입
4. validator exact version·LICENSE·SHA256·offline replay 기록
5. 5개 schema conditional/nested 구조 보강
6. schema 파일 자체 meta-schema validation
7. filesystem-derived 전체 JSON inventory 생성
8. 모든 최종 JSON을 마지막 write 이후 올바른 schema로 재검증
9. candidate/scenario 고정 status 분기 제거
10. S06~S08 semantic before/after validator 구현
11. S12~S14 complete evidence gate 구현
12. invalid_pass_count 실제 계산과 injection test
13. 모든 score point에 validator result 연결
14. benchmark-002 검증된 partial evidence lineage import
15. task-start/task-end immutability manifest 비교
16. RED/positive tests 보강
17. report·logs·artifacts·handoff·commit SHA 재정합

## Task 003 완료 Gate

```text
- 근거 없는 passed 0건
- status가 role + actual evidence/probe에서만 산출
- S06~S08 corruption/mismatch fixture 탐지
- S12~S14 complete gate 정확성
- standards-compliant Draft 2020-12 validator pinned
- validator LICENSE·SHA256·offline replay 확보
- schema 5개 meta-schema validation 통과
- filesystem inventory의 모든 Task 003 JSON schema validation 통과
- invalid_pass_count 계산 및 injection test 통과
- 모든 score point에 evidence validator 연결
- full tools/hancom regression 0 failed
- report·logs·artifacts·handoff·commit SHA 일치
```

## 후속 Task

### Task 004

```text
task_id: hwpx-core-benchmark-004-external-candidates
status: blocked_by_task_003
```

### Task 005

```text
task_id: hwpx-core-benchmark-005-hancom-layout
status: blocked_by_task_003_and_004
```

## 코어 선정 방식

```text
Editor Gate:
Current Node/XML vs python-hwpx

Validator Gate:
hwpxlib vs HwpForge

Layout Gate:
Hancom 2024 COM
```

아직 어느 후보도 최종 선정되지 않았다.

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
- Task 004 시작
- benchmark-001/002/003 scorecard로 코어 선정
- Stage 1-4 진입
- production Container-Aware Table Fit 구현
- commit amend 또는 force push
- actual evidence 없는 passed/completed
- 실제 COM output 전 사용자 시각검증 요청
```

## 다음 의사결정 Gate

```text
Task 003 evidence integrity completion
→ Task 004 external candidates
→ Task 005 Hancom layout and S05
→ 역할별 HwpCoreAdapter 선정
→ Container-Aware Table Fit production 구현
```

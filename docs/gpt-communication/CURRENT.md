# 현재 Codex 필수 확인 문서

작성일: 2026-07-03

## 전체 개발 단계

```text
전체 8단계 중 1단계
현재 단계: HwpAdapter 및 HWP/HWPX 엔진 안정화
현재 세부 단계: 1-3 선행 HWPX 엔진 비교·코어 선정
현재 작업: hwpx-core-benchmark-003-evidence-integrity corrective continuation
```

## 현재 브랜치와 판정

```text
work_branch: feature/hwpx-core-benchmark
base_implementation_branch: feature/hwpx-adaptive-board-fit-v5
benchmark_003_status: partial_meaningful_progress
completion_gate_passed: false
proceed_to_task_004: false
core_selection: prohibited
stage_transition: prohibited
user_visual_review_required_now: false
```

마스터 검토:

```text
docs/gpt-communication/opinions/2026-07-03-hwpx-core-benchmark-003-master-review.md
```

## 새 실행 운영 방식

로컬 Codex 토큰 절감을 위해 클라우드–로컬 라우팅을 활성화했다.

```text
마스터 에이전트
→ 계획·단계·Gate

프롬프트 작성 에이전트
→ 작업 분류·Task Contract·결과 검토

Codex 대행 엔진
→ 클라우드 분석·설계·정적 변경·delegation package push

로컬 Codex
→ 로컬 전용 설치·실행·테스트·측정·산출물·push
```

기준 문서:

```text
docs/gpt-communication/CLOUD_LOCAL_EXECUTION_ROUTING.md
docs/gpt-communication/CODEX_DELEGATION_AGENT_BOOTSTRAP.md
docs/gpt-communication/delegation/DELEGATION_PACKAGE_TEMPLATE.md
```

Task Contract는 다음을 포함한다.

```text
routing_class: cloud_delegable | local_codex_required | hybrid
cloud_scope
local_scope
local_validation_required
delegation_package_path
delegation_commit_sha
local_execution_base_sha
```

대행 결과는 GitHub push로 전달한다. 로컬 Codex는 `CODEX_EXECUTION_BRIEF.md`를 먼저 읽고 지정된 로컬 작업만 수행한다.

동일 Task에서 대행 엔진과 로컬 Codex가 동시에 쓰지 않는다.

```text
cloud_preparation
→ delegation push
→ prompt-agent verification
→ local_execution
→ local Codex push
→ result_review
```

## 현재 Task 003 클라우드 범위

Codex 대행 엔진이 먼저 수행한다.

- candidate/scenario 고정 status 분기 제거
- evidence/probe 기반 상태 결정 구조
- S06~S08 semantic before/after validator
- S12~S14 complete evidence gate
- 상세 Draft 2020-12 Schema
- filesystem-derived JSON inventory
- invalid-pass injection test
- score rubric validator
- task-start/task-end manifest 구조
- delegation package와 로컬 실행 브리프

대행 엔진은 클라우드 미실행 결과를 테스트 통과로 보고하지 않는다.

## 현재 Task 003 로컬 범위

로컬 Codex만 수행한다.

- repository-approved pinned jszip 환경 복구
- standards-compliant Draft 2020-12 validator artifact 반입·설치
- 실제 LICENSE·SHA256·offline replay 수집
- task-start baseline과 current 전체 Hancom 테스트
- 실제 filesystem inventory와 최종 Schema 검증
- stdout/stderr/exit code와 산출물 생성
- 최종 보고서·commit·push

## Task 003 완료를 막는 문제

- 일부 status가 actual evidence가 아니라 고정 분기에서 생성
- S06~S08 gate가 field presence만 검사
- S12~S14 gate가 계약 전체 증거를 강제하지 않음
- Schema conditional/nested 구조 미흡
- 표준 Draft 2020-12 validator 부재
- 모든 생성 JSON의 최종 전량 검증 부재
- invalid_pass_count 상수 0
- validator 없는 점수 부여
- 실제 task-start/task-end 불변성 비교 부재
- full Hancom regression 18 failed due to missing jszip environment

## Task 003 완료 Gate

```text
- status가 role + actual evidence/probe에서만 산출
- S06~S08 corruption/mismatch fixture 탐지
- S12~S14 complete gate 정확성
- 표준 Draft 2020-12 validator pinned
- validator LICENSE·SHA256·offline replay 확보
- 5개 Schema meta-schema validation 통과
- 모든 Task 003 JSON 최종 Schema validation 통과
- invalid_pass_count 계산·injection test 통과
- 모든 점수에 evidence validator 연결
- full tools/hancom regression 0 failed
- report·logs·artifacts·handoff·commit SHA 일치
```

## 후속 Task

```text
Task 004 external candidates: blocked_by_task_003
Task 005 Hancom layout and S05: blocked_by_task_003_and_004
```

## 금지

```text
- Task 003 완료 전 Task 004 시작
- 코어 선정 또는 Stage 1-4 진입
- 대행 엔진과 로컬 Codex의 동일 파일 동시 수정
- 실제 실행 없는 passed/completed
- main merge, amend, force push
- 실제 COM output 전 사용자 시각검증 요청
```

## 다음 의사결정 Gate

```text
Task 003 cloud preparation
→ local execution
→ Task 003 completion review
→ Task 004
→ Task 005
→ 역할별 HwpCoreAdapter 선정
```

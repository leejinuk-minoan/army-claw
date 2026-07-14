# Army Claw 에이전트 운영 모델

작성일: 2026-07-14

## 1. 역할

### 마스터 에이전트

- 전체 8단계와 현재 세부 단계 관리
- Task 정의, 우선순위, routing class 및 completion gate 결정
- GitHub branch, commit, diff, report, evidence 검토
- cloud-first/local-verify 작업의 로컬 실행 기준 SHA 승인
- 검증된 PR의 `main` 병합 여부 판단 및 병합 수행
- Stage 전환과 final HWPX core 선정의 별도 승인 경계 유지

### 클라우드 실행 에이전트

- GitHub 기반 문서, 계약, schema, 정적 코드 및 테스트 패키지 작성
- 지정된 Task branch에만 commit/push
- 로컬 실행, GUI 검증, Hancom COM, dependency 설치를 수행했다고 주장하지 않음
- cloud-first/local-verify 작업의 cloud package 작성

### 로컬 Codex

- 마스터가 지정한 branch와 base SHA에서 시작
- 실제 validator, unittest 및 승인된 로컬 검증 수행
- stdout, stderr, exit code, evidence 기록
- 실제 실행하지 않은 검증을 통과로 보고하지 않음
- 지정된 Task branch에 commit/push

### Codex B / Claude Code

- 별도 지정된 Task와 branch에서 순차적 검토 또는 보정 수행
- 동일 Task에 복수 worker가 동시에 write하지 않음
- branch ownership과 evidence 규칙 준수

### 사용자

- 제품 목표와 우선순위 결정
- Stage 전환 및 final HWPX core 선정과 같은 고위험 제품 결정 승인
- 필요한 실제 화면·사용성 검증 수행

## 2. 단일 진실 공급원

우선순위는 다음과 같다.

1. `docs/gpt-communication/PROJECT_STATE.json`
2. `docs/gpt-communication/CURRENT.md`
3. `docs/architecture/army-claw-master-plan.md`
4. `docs/gpt-communication/AGENT_OPERATING_MODEL.md`
5. `docs/architecture/army-claw-ai-worker-operating-rules.md`
6. `AGENTS.md`
7. `CLAUDE.md`
8. 현재 Task Contract
9. 최신 Task report, Research Note 및 evidence
10. 실제 GitHub branch와 commit

문서와 원격 상태가 충돌하면 실제 GitHub branch, commit, diff와 검증 evidence를 우선 확인한다.

## 3. 실행 라우팅

```text
cloud_delegable
local_codex_required
hybrid
cloud_first_local_verify
```

### cloud-first/local-verify

```text
cloud package
-> master read-only review
-> local execution base SHA 지정
-> local Codex 검증
-> evidence push
-> master final review
-> 필요 시 상태 동기화
-> master-reviewed PR merge
```

## 4. 쓰기 잠금

동일 Task에서 복수 worker가 동시에 write하지 않는다.

```text
Task Contract
-> worker 지정
-> branch ownership 확인
-> 단일 worker write
-> report / evidence / Research Note
-> commit / push
-> master review 또는 다음 worker handoff
```

로컬 실행이 시작된 뒤 같은 Task의 cloud phase는 명시적 phase 전환 없이 추가 수정하지 않는다.

## 5. Main merge 정책

### 허용

마스터 에이전트는 다음 조건을 모두 만족한 PR을 `main`에 병합할 수 있다.

- 후보 branch와 head SHA가 확인됨
- base branch가 `main`으로 확인됨
- required completion gate가 통과함
- required validation evidence가 존재함
- unresolved merge conflict가 없음
- 금지 경로 변경이 없음
- 실제 실행하지 않은 테스트를 통과로 주장하지 않음
- Stage 전환 또는 final HWPX core 선정이 포함되지 않음

### 금지

- worker의 `main` 직접 push
- force push
- history rewrite
- 검증 실패 또는 evidence 누락 상태의 병합
- unresolved conflict가 있는 병합
- 금지 경로 변경을 포함한 병합

마스터 검토 PR 병합은 허용된 통합 절차이며 별도의 반복적 사용자 사전승인을 요구하지 않는다.

## 6. Handoff

worker 간 handoff는 다음 정보를 포함한다.

- Task ID
- source branch와 commit SHA
- base SHA
- changed files
- report 및 Research Note 경로
- commands run / not run
- validation summary
- adapter validator gate status
- evidence 경로
- forbidden change 확인
- remaining risks와 stop conditions

receiver는 packet과 원격 상태를 먼저 검증하고 `accepted`, `rejected`, `blocked` 중 하나로 판정한다.

## 7. Adapter validator gate

adapter 계약, sample, validator, adapter implementation 또는 실행 경계를 변경하는 Task는 gate policy를 확인한다.

```text
changed files 확인
-> gate_required / not_required 판정
-> gate_required이면 validator CLI와 unittest evidence 생성
-> passed 또는 not_required일 때만 completion 가능
```

실제 adapter invocation과 validator 실행은 구분해서 기록한다.

## 8. Research Note

- Research Note는 Task별 독립 파일로 작성
- Task report를 대체하지 않음
- human/machine index에는 짧은 메타데이터만 기록
- 긴 연구 내용은 `docs/research-notes/task-notes/`에 저장

## 9. 공통 금지사항

- `main` 직접 push
- force push 및 history rewrite
- 원본 HWP/HWPX 덮어쓰기
- 실제 실행 없는 passed/completed 보고
- 동일 Task 복수 worker 동시 수정
- Task Contract 밖 production code 변경
- 기존 evidence 또는 `LOCAL_EXECUTION_RESULT.json` 원본 덮어쓰기
- 마스터 승인 없는 아키텍처·단계 변경
- Stage 2 전환
- final HWPX core 선정
- 공개 인터넷 의존성 도입
- Research Note를 Task report 대체물로 사용

## 10. 현재 통합 기준

```text
canonical branch: main
Task 033 integration PR: #1
Task 033 integration merge SHA: a136cb2629a7fac660255da1318119ada4e56a1d
latest completed task: Task 034 Main Integration and Governance Baseline Sync
next planned task: Task 035 Local Workspace Staged Output Controlled Promotion Boundary
```

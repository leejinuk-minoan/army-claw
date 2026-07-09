# Army Claw 에이전트 운영 모델

작성일: 2026-07-09

## 1. 채팅별 역할

### A. 마스터 에이전트 채팅

- 전체 8단계 총괄계획 관리
- 현재 단계와 세부 단계 판정
- 제품 아키텍처와 우선순위 결정
- 완료 Gate와 사용자 검증 기준 관리
- GitHub 원격 상태 검토
- 계획 이탈, 테스트 실패, 라이선스·보안 위험, 단계 전환 가능성 경고
- `PROJECT_STATE.json`, `CURRENT.md`, Research Note 구조와 index 기준 관리
- cloud-first/local-verify Task에서 로컬 실행 base SHA 승인

### B. Codex 프롬프트 작성 에이전트 채팅

- 사용자가 공유한 Codex 결과와 화면/로그 분석
- 다음 작업을 `cloud_delegable`, `local_codex_required`, `hybrid`, `cloud_first_local_verify`로 분류
- Task Contract와 handoff/delegation package 기준 확인
- 대행 엔진 원격 commit과 package 검증
- 로컬 Codex 실행 프롬프트 작성
- Research Note 생성 여부와 index 갱신 확인

### C. Codex 대행 엔진 채팅

- GitHub 원격 코드·문서·commit 정적 분석
- 문서, JSON 계약, Schema, 순수 함수, 테스트 코드 등 cloud-safe 변경
- cloud-first/local-verify 작업에서는 실행 전 구현 패키지 작성 가능
- 허용 브랜치에 commit/push
- 실제 로컬 실행, 한글 COM, GUI 확인, dependency install, test pass를 수행했다고 주장하지 않음

### D. 로컬 Codex 실행 에이전트

- 마스터가 승인한 branch와 `local_execution_base_sha`에서 시작
- 로컬 파일·프로그램·패키지·한글 COM 작업은 승인 범위 내에서만 수행
- 실제 테스트·측정·로그·산출물 생성
- stdout/stderr/exit code와 실행 증거 기록
- commit·push 및 실행 보고

### E. 사용자

- Task 승인과 worker 지정
- 제품 목표와 우선순위 승인
- 실제 화면 시각 검증
- master review와 단계 전환 제안 승인

## 2. 단일 진실 공급원

우선순위:

1. `docs/gpt-communication/PROJECT_STATE.json`
2. `docs/gpt-communication/CURRENT.md`
3. `docs/architecture/army-claw-master-plan.md`
4. `docs/architecture/army-claw-ai-worker-operating-rules.md`
5. `docs/architecture/army-claw-solo-multi-agent-governance.md`
6. `docs/architecture/army-claw-branch-ownership-map.md`
7. `docs/architecture/army-claw-worker-setup-guide.md`
8. `docs/architecture/army-claw-ai-worker-handoff-contract.md`
9. `docs/architecture/army-claw-common-office-adapter-interface-contract.md`
10. `docs/architecture/army-claw-adapter-interface-validator-contract.md`
11. `docs/gpt-communication/contracts/common-office-adapter-interface-contract.json`
12. `docs/gpt-communication/contracts/common-office-adapter-error-taxonomy.json`
13. `docs/gpt-communication/contracts/adapter-interface-validator-contract.json`
14. `docs/gpt-communication/contracts/adapter-interface-validation-matrix.md`
15. `docs/gpt-communication/contracts/adapter-interface-validation-matrix.json`
16. `docs/gpt-communication/contracts/ADAPTER_INTERFACE_VALIDATOR_CHECKLIST.md`
17. `tools/validators/adapter_interface_validator.py`
18. `tests/adapter_interface_validator/test_adapter_interface_validator.py`
19. `docs/gpt-communication/delegation/task025-adapter-interface-validator-implementation/ROUTING_DECISION.json`
20. `docs/gpt-communication/delegation/task025-adapter-interface-validator-implementation/LOCAL_EXECUTION_BRIEF.md`
21. `docs/gpt-communication/handoffs/ai-worker-handoff-contract.json`
22. `docs/gpt-communication/handoffs/AI_WORKER_HANDOFF_TEMPLATE.md`
23. `docs/gpt-communication/CLOUD_LOCAL_EXECUTION_ROUTING.md`
24. `docs/research-notes/research-note-index.md`
25. `docs/research-notes/research-note-index.json`
26. 현재 Task Contract
27. 현재 delegation package 또는 handoff packet
28. 최신 Task report와 Research Note
29. 실제 원격 branch·commit·산출물

충돌 시 실제 원격 commit과 산출물을 확인한다. 단계·로드맵·아키텍처 변경은 마스터 승인 기록이 있어야 한다.

Research Note는 Task report를 대체하지 않는다.

## 3. 정보 전달 흐름

```text
마스터 에이전트
-> 현재 단계·아키텍처·Gate 확정
-> PROJECT_STATE.json / CURRENT.md 기준 관리

사용자
-> Task 승인과 worker 지정

프롬프트 작성 에이전트
-> routing class 확정
-> Task Contract 또는 handoff/delegation 요구사항 확정

Codex 대행 엔진
-> cloud-safe 변경 또는 cloud implementation package 작성
-> report / Research Note / delegation package 생성
-> commit / push

프롬프트 작성 에이전트 또는 master review
-> 원격 commit과 package read-only 검증
-> local_execution_base_sha 승인 여부 판단

로컬 Codex 또는 다음 worker
-> package 검증
-> accepted / rejected / blocked 판정
-> allowed scope 안에서만 실행
```

## 4. 단계별 쓰기 잠금

같은 Task에서 대행 엔진과 로컬 Codex가 동시에 쓰지 않는다.

```text
cloud_preparation_or_implementation_package
-> delegation or handoff push
-> master read-only verification
-> local_execution
-> result_review
```

`local_execution` 시작 후 대행 엔진은 같은 Task 파일을 수정하지 않는다. 추가 클라우드 수정이 필요하면 phase를 다시 명시적으로 전환해야 한다.

## 5. Handoff Packet 공식화

Task 022 이후 handoff packet은 worker 간 공식 정보 전달 단위다.

- Task 완료 후 다음 worker에게 넘길 때 handoff packet을 사용한다.
- handoff packet은 Task report와 Research Note를 대체하지 않는다.
- handoff packet은 receiver가 accept/reject/blocked를 판단할 수 있는 최소 계약이다.
- handoff packet에는 branch, commit SHA, changed files, validation summary, commands run/not run, stop conditions, next worker scope가 포함되어야 한다.

공식 handoff source of truth:

- `docs/architecture/army-claw-ai-worker-handoff-contract.md`
- `docs/gpt-communication/handoffs/AI_WORKER_HANDOFF_TEMPLATE.md`
- `docs/gpt-communication/handoffs/ai-worker-handoff-contract.json`

## 6. Common Office Adapter Interface Contract

Task 023 이후 adapter 구현, adapter slot 변경, plan-to-adapter 연결, sample payload 변경은 먼저 Common Office Adapter Interface Contract를 읽어야 한다.

공식 adapter interface source of truth:

- `docs/architecture/army-claw-common-office-adapter-interface-contract.md`
- `docs/gpt-communication/contracts/common-office-adapter-interface-contract.json`
- `docs/gpt-communication/contracts/common-office-adapter-error-taxonomy.json`

Interface 변경은 구현 Task에 섞지 않고 별도 contract Task로 분리한다.

Adapter 관련 proof mode에서는 실제 adapter 실행을 주장하지 않는다. 실제 HWP/HWPX, HanCell, HanShow, local_workspace 실행 evidence는 별도 local execution Task에서만 생성한다.

## 7. Adapter Interface Validator Contract

Task 024 이후 adapter interface 변경, sample 변경, validator 구현, adapter 구현 Task는 먼저 Adapter Interface Validator Contract와 validation matrix를 읽어야 한다.

공식 adapter validator source of truth:

- `docs/architecture/army-claw-adapter-interface-validator-contract.md`
- `docs/gpt-communication/contracts/adapter-interface-validator-contract.json`
- `docs/gpt-communication/contracts/adapter-interface-validation-matrix.md`
- `docs/gpt-communication/contracts/adapter-interface-validation-matrix.json`
- `docs/gpt-communication/contracts/ADAPTER_INTERFACE_VALIDATOR_CHECKLIST.md`

## 8. Task 025-A Cloud Implementation Package

Task 025-A는 validator source와 unittest source를 작성하지만 실행하지 않는다.

공식 구현 패키지 source of truth:

- `tools/validators/adapter_interface_validator.py`
- `tests/adapter_interface_validator/test_adapter_interface_validator.py`
- `docs/gpt-communication/delegation/task025-adapter-interface-validator-implementation/`

Task 025-B 로컬 검증은 마스터가 원격 HEAD를 read-only로 확인하고 `local_execution_base_sha`를 지정한 뒤에만 시작한다.

Task 025-A에서 금지되는 주장:

- validator CLI 실행 완료
- unittest passed
- local stdout/stderr/exit code 생성
- actual adapter invocation
- Hancom COM execution
- Task 025 전체 완료

## 8.1 Task 025-B Local Verification Result

Task 025-B는 마스터가 승인한 `local_execution_base_sha`에서 Task 025-A validator package를 로컬 clean worktree로 실행하는 단계다.

Task 025-B 기준 실행 결과:

- local_execution_base_sha: `e6ec7a30f19a1efddb04234d4e8fd805218fed2a`
- validator CLI executed: `true`
- validator CLI exit code: `0`
- validator summary: `valid`
- validator checks: `200/200 passed`
- unittest executed: `true`
- unittest exit code: `0`
- unittest result: `16 tests OK`
- evidence path: `docs/gpt-communication/evidence/task025b-adapter-interface-validator-local-verification/`
- actual adapter invoked: `false`
- Hancom COM executed: `false`
- completion_gate_passed: `true`

이 결과는 Adapter Interface Validator의 cloud-first/local-verify 경계가 실제 로컬 실행 evidence로 검증되었음을 의미한다. 다만 실제 adapter 구현, 실제 문서 생성, Hancom COM 검증은 포함하지 않는다.

## 9. Handoff receiver 원칙

Receiver는 handoff 또는 delegation package 수신 후 바로 수정하지 않는다. 먼저 다음을 확인한다.

1. source branch와 commit SHA
2. base commit SHA
3. changed files
4. Task report와 Research Note
5. dirty worktree status
6. forbidden path 변경 여부
7. unexecuted tests가 passed로 보고되지 않았는지 여부
8. stop conditions
9. adapter 관련 작업이면 common office adapter interface contract 준수 여부
10. adapter validator 또는 sample 관련 작업이면 validator contract와 matrix 준수 여부
11. cloud-first/local-verify 작업이면 `local_execution_base_sha` 승인 여부

검증 결과는 `accepted`, `rejected`, `blocked` 중 하나로 판단한다.

## 10. 공식 Worker Roster

공식 worker:

- `codex_a`
- `codex_b`
- `claude_code`

명시적 제외:

- `gemini_antigravity`
- `person_a`
- `person_b`

인원 A/B 협업은 취소 상태로 유지한다.

## 11. 공통 금지

- 사용자 승인 없는 main merge
- main 직접 push
- force push
- history rewrite
- 원본 HWP/HWPX 덮어쓰기
- 실제 실행 없는 passed/completed 보고
- 동일 Task 복수 worker 동시 수정
- 마스터 승인 없는 단계·아키텍처 변경
- 사용자 승인 없는 final HWPX core selection
- Research Note를 Task report 대체물로 사용하는 것
- Research Note index에 장문 내용을 누적하는 것

## 12. 단계 표기

Army Claw 관련 답변은 필요한 경우 처음에 전체 프로젝트 단계표를 표시한다.

```text
✅ 완료
👉 현재 진행
☐ 미시작
```

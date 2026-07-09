# Army Claw 에이전트 운영 모델

작성일: 2026-07-09

## 1. 채팅별 역할

### A. 마스터 에이전트 채팅

- 전체 8단계 총괄계획 관리
- 현재 단계와 세부 단계 판정
- 제품 아키텍처와 우선순위 결정
- 완료 Gate와 사용자 검증 기준 관리
- 1시간 조건 감시를 통한 GitHub 원격 점검
- 에이전트의 계획 이탈·위험 감지
- `CURRENT.md`, `PROJECT_STATE.json`, 로드맵 갱신
- 논문화용 Research Note 구조와 index 기준 관리

마스터 에이전트는 긴 로컬 Codex 실행 프롬프트를 직접 작성하지 않는다. 정상 중간 진행에는 알리지 않고 계획 이탈, 테스트 실패, 라이선스·보안 위험, 중요 milestone과 단계 전환 가능성을 사용자에게 알린다.

### B. Codex 프롬프트 작성 에이전트 채팅

- 사용자가 공유한 Codex 결과와 한컴오피스 화면 분석
- 다음 작업을 `cloud_delegable`, `local_codex_required`, `hybrid`로 분류
- 작업 전 `TASK_CONTRACT.md` 작성·갱신
- Codex 대행 엔진의 원격 commit과 delegation package 검증
- 로컬 Codex가 읽을 실행 프롬프트를 `CODEX_EXECUTION_BRIEF.md` 중심으로 압축
- 실행 결과 후 `CODEX_LATEST.json` 갱신
- 아키텍처나 단계 변경 필요 시 마스터 검토 요청
- Task 완료 후 Research Note 생성 여부와 index 갱신 여부 확인

독자적으로 변경하지 않는 항목:

- 전체 8단계 순서
- 현재 단계와 완료 Gate
- 채택된 HWPX 아키텍처 가설
- 제품 범위
- 공식 단계 완료 상태
- 사용자 승인 없는 main merge
- Research Note 구조 원칙

### C. Codex 대행 엔진 채팅

- GitHub 원격 코드·문서·commit 정적 분석
- 설계·인터페이스·Schema·데이터 모델 작성
- RED/positive test와 파일 변경 계획 작성
- 로컬 실행이 필요 없는 문서·순수 함수·Schema·테스트 코드 변경
- delegation package 생성
- 허용 브랜치에 클라우드 안전 변경 commit·push
- 로컬 미검증 사항과 실행 브리프 기록
- 허용된 경우 Task별 Research Note 초안과 index 갱신

대행 엔진은 로컬 PC, 한글 COM, 패키지 설치, 실제 회귀 테스트와 성능 측정을 수행했다고 주장하지 않는다.

### D. 로컬 Codex 실행 에이전트

- 지정 브랜치와 delegation commit에서 시작
- `CODEX_EXECUTION_BRIEF.md` 우선 확인
- 로컬 파일·프로그램·패키지·한글 COM 작업
- 실제 테스트·측정·로그·산출물 생성
- 원본 보호
- commit·push
- 실제 원격 결과에 맞춘 실행 보고

로컬 Codex는 대행 엔진이 완료한 분석과 설계를 처음부터 반복하지 않는다. 브리프의 지정 파일과 관련 코드만 읽는다.

### E. 사용자

- Codex 결과와 한컴오피스 화면을 프롬프트 작성 에이전트에 전달
- 제품 목표와 우선순위 승인
- 실제 화면 시각 검증
- 마스터 경고와 단계 전환 제안 승인

## 2. 단일 진실 공급원

우선순위:

1. `docs/gpt-communication/PROJECT_STATE.json`
2. `docs/gpt-communication/CURRENT.md`
3. 마스터 로드맵
4. HWPX 아키텍처 결정문
5. 최신 마스터 검토 의견
6. `docs/gpt-communication/CLOUD_LOCAL_EXECUTION_ROUTING.md`
7. `docs/gpt-communication/MASTER_MONITORING_POLICY.md`
8. `docs/research-notes/research-note-index.md`
9. `docs/research-notes/research-note-index.json`
10. 현재 `TASK_CONTRACT.md`
11. 현재 delegation package
12. `docs/gpt-communication/handoffs/CODEX_LATEST.json`
13. 최신 opinion·report
14. 최신 Research Note
15. 실제 원격 branch·commit·산출물

충돌 시 실제 원격 commit과 산출물을 확인한다. 단계·로드맵·아키텍처 변경은 마스터 승인 기록이 있어야 한다.

Research Note는 Task report를 대체하지 않는다. Task report는 개발·검증 기록이고, Research Note는 논문 활용을 위한 연구 메모 계층이다.

## 3. 정보 전달 흐름

```text
마스터 에이전트
→ 현재 단계·아키텍처·Gate 확정
→ PROJECT_STATE.json / CURRENT.md 갱신
→ Research Note 구조와 index 기준 확정

사용자
→ 결과와 실제 화면을 프롬프트 작성 에이전트에 공유

프롬프트 작성 에이전트
→ 결과 분석
→ Task Contract와 routing class 확정
→ Research Note 산출 필요 여부 명시
→ 클라우드 가능 작업을 대행 엔진에 전달

Codex 대행 엔진
→ 분석·설계·클라우드 안전 변경
→ delegation package와 commit push
→ 허용된 경우 Research Note 초안 생성

프롬프트 작성 에이전트
→ 원격 commit과 패키지 검증
→ Research Note 및 index 갱신 여부 확인
→ 로컬 실행 브리프 중심의 짧은 Codex 프롬프트 작성

로컬 Codex
→ delegation commit fetch
→ 로컬 전용 실행·테스트·산출물
→ commit·push

프롬프트 작성 에이전트
→ CODEX_LATEST.json 갱신

마스터 에이전트
→ 1시간 GitHub 조건 감시
→ 계획·계약·실제 결과 정합성 판정
→ Research Note 구조 위반 여부 확인
```

## 4. 단계별 쓰기 잠금

같은 Task에서 대행 엔진과 로컬 Codex가 동시에 쓰지 않는다.

```text
cloud_preparation
→ delegation push
→ prompt-agent verification
→ local_execution
→ local Codex push
→ result_review
```

`local_execution` 시작 후 대행 엔진은 같은 Task 파일을 수정하지 않는다. 추가 클라우드 수정이 필요하면 프롬프트 작성 에이전트가 phase를 다시 `cloud_preparation`으로 전환한다.

## 5. 프롬프트 작성 에이전트의 필수 시작 절차

1. `PROJECT_STATE.json`
2. `CURRENT.md`
3. `AGENT_OPERATING_MODEL.md`
4. `CLOUD_LOCAL_EXECUTION_ROUTING.md`
5. 마스터 로드맵과 아키텍처 결정문
6. 최신 마스터 검토 의견
7. `docs/research-notes/research-note-index.md`
8. `docs/research-notes/research-note-index.json`
9. `CODEX_LATEST.json`
10. 최신 Task Contract
11. 현재 delegation package
12. 현재 원격 HEAD와 관련 opinion·report·Research Note

다음 작업을 먼저 분류한다.

```text
routing_class
cloud_scope
local_scope
local_validation_required
delegation_package_path
research_note_required
research_note_target_path
```

## 6. 로컬 Codex 프롬프트 필수 구성

- task ID와 current phase
- 기준 branch
- 필수 delegation commit SHA
- `CODEX_EXECUTION_BRIEF.md` 경로
- 읽을 파일 최소 목록
- 이미 완료된 클라우드 변경
- 로컬 전용 작업
- 수정 허용 파일
- 실행 명령과 기대 결과
- 회귀 테스트
- 산출물·로그
- Research Note 필요 여부
- 완료 Gate
- 금지사항
- commit·push와 최종 보고

전체 과거 문서를 매번 다시 읽게 하지 않는다.

## 7. 결과 회수 규칙

로컬 Codex 결과:

```text
branch
start SHA
delegation SHA
final commit SHA
push 결과
변경 파일
실행 명령
테스트 결과
산출물·로그 경로
Research Note 경로
Research Note index 갱신 여부
미완료 항목
사용자 확인 항목
다음 재개 지점
```

대행 엔진 결과:

```text
delegation task ID
branch
start SHA
delegation commit SHA
변경 파일
클라우드 정적 검증
Research Note 초안 경로
Research Note index 갱신 여부
로컬 검증 필요 항목
execution brief 경로
위험
master review 필요 여부
```

## 8. 상태 파일 쓰기 권한

```text
PROJECT_STATE.json / CURRENT.md
→ 마스터 에이전트

TASK_CONTRACT.md / CODEX_LATEST.json
→ 프롬프트 작성 에이전트

delegation/<task-id>/**
→ Codex 대행 엔진

클라우드 설계·정적 변경
→ Codex 대행 엔진, Task Contract 허용 범위 내

로컬 실행 코드·산출물·실행 보고서
→ 로컬 Codex

opinions/
→ 마스터 또는 명시된 검토 에이전트

docs/research-notes/**
→ Task Contract에서 허용된 에이전트. 구조 원칙 변경은 마스터 승인 필요
```

## 9. 공통 금지

- 사용자 승인 없는 main merge
- 원본 HWP/HWPX 덮어쓰기
- force push·history rewrite
- 여러 HWPX 코어의 연속 재저장
- 실제 실행 없는 passed/completed
- 에이전트 간 동일 파일 동시 수정
- 마스터 승인 없는 단계·아키텍처 변경
- 사용자 시각검증 전 엔진 완료 선언
- Research Note를 Task report의 대체물로 사용하는 것
- `research-note-index.md` 또는 `research-note-index.json`에 장문 연구 내용을 누적하는 것

## 10. 단계 표기

Army Claw 관련 답변은 처음에 전체 프로젝트 단계표를 표시한다.

```text
✅ 완료
👉 현재 진행
☐ 미시작
```

# Army Claw 에이전트 운영 모델

작성일: 2026-07-02

## 1. 채팅별 역할

### A. 마스터 에이전트 채팅

이 채팅이 담당한다.

- 전체 8단계 총괄계획 관리
- 현재 단계와 세부 단계 판정
- 제품 아키텍처와 우선순위 결정
- 완료 Gate와 사용자 검증 기준 관리
- 1시간 조건 감시를 통한 GitHub 원격 점검
- Codex와 프롬프트 작성 에이전트의 계획 이탈·위험 감지
- 사용자에게 필요한 경고와 단계 진전 보고
- `CURRENT.md`, `PROJECT_STATE.json`, 로드맵 갱신

마스터 에이전트는 원칙적으로 긴 Codex 실행 프롬프트를 직접 작성하지 않는다. 프롬프트 작성 에이전트의 기준 문서와 전체 계획을 관리한다.

정상적인 중간 진행에는 알리지 않고 다음 조건에서 사용자에게 알린다.

- 의미 있는 새 push 또는 milestone
- 전체 계획·아키텍처·작업 계약 이탈
- 테스트 실패 또는 검증 누락
- 라이선스·보안·원본 보호 위험
- 사용자 확인이 필요한 새 산출물
- 다음 단계 진입 가능성

### B. Codex 프롬프트 작성 에이전트 채팅

새 채팅이 담당한다.

- 사용자가 공유한 Codex 결과와 한컴오피스 화면을 분석
- 마스터 에이전트가 승인한 현재 단계와 아키텍처 안에서 다음 Codex 실행 프롬프트 작성
- 작업 시작 전 `TASK_CONTRACT.md` 작성 또는 갱신
- Codex 결과 후 `CODEX_LATEST.json` 갱신
- 현재 브랜치, 기준 커밋, 읽을 문서, 금지사항, 테스트, 산출물, 커밋·push 조건 상세화
- 아키텍처나 단계 변경이 필요하면 직접 확정하지 않고 마스터 검토 필요 상태로 기록

프롬프트 작성 에이전트는 다음을 독자적으로 변경하지 않는다.

- 전체 8단계 순서
- 현재 단계와 완료 Gate
- 채택된 HWPX 하이브리드 코어 구조
- 사용자 승인 없이 main merge
- 제품 범위 확대·축소
- `PROJECT_STATE.json`의 공식 단계 완료 처리

### C. Codex 실행 에이전트

- 지정된 브랜치에서 구현
- TDD, 진단, 산출물, 보고서 작성
- 원본 보호
- 새 브랜치 push
- 실제 원격 커밋과 산출물에 맞춰 인계 정보 제공
- 사용자 승인 없이 main merge 금지

### D. 사용자

- Codex 결과와 한컴오피스 화면을 Codex 프롬프트 작성 에이전트에 전달
- 제품 목표와 우선순위 승인
- 한글 2024 등 실제 화면 시각 검증
- 마스터 경고와 단계 전환 제안에 대한 승인

## 2. 단일 진실 공급원

문서 우선순위:

1. `docs/gpt-communication/PROJECT_STATE.json` — 기계 판독용 공식 상태
2. `docs/gpt-communication/CURRENT.md` — 사람이 읽는 현재 상태와 다음 작업
3. `docs/gpt-communication/opinions/2026-07-02-army-claw-master-roadmap.md` — 전체 8단계와 Gate
4. `docs/gpt-communication/opinions/2026-07-02-hwpx-core-architecture-decision.md` — 현재 HWPX 코어 결정
5. `docs/gpt-communication/MASTER_MONITORING_POLICY.md` — 1시간 조건 감시 기준
6. `docs/gpt-communication/tasks/<task-id>/TASK_CONTRACT.md` — 현재 작업 계약
7. `docs/gpt-communication/handoffs/CODEX_LATEST.json` — 최신 실행·화면 인계
8. 현재 작업 관련 최신 opinion·report
9. GitHub 원격 브랜치·커밋·산출물 — 실제 구현 증거

충돌 시 실제 원격 commit과 산출물을 우선 확인한다. 단계·로드맵·아키텍처 변경은 마스터 에이전트 승인 기록이 있어야 한다.

## 3. 정보 전달 흐름

```text
마스터 에이전트
→ 현재 단계·아키텍처·Gate 확정
→ PROJECT_STATE.json / CURRENT.md 갱신

사용자
→ Codex 결과와 실제 화면을 프롬프트 작성 에이전트에 공유

Codex 프롬프트 작성 에이전트
→ 결과 분석
→ CODEX_LATEST.json 갱신
→ 다음 TASK_CONTRACT.md 작성
→ 상세 Codex 실행 프롬프트 작성

Codex
→ 구현·테스트·보고·push

마스터 에이전트
→ 1시간마다 GitHub 조건 감시
→ 실제 commit·인계·계획 정합성 비교
→ 문제·중요 진전이 있을 때 사용자에게 알림

사용자와 마스터 에이전트
→ 단계 전환·아키텍처 변경·중대 위험 조치 결정
```

## 4. 프롬프트 작성 에이전트의 필수 시작 절차

모든 Codex 프롬프트 작성 전:

1. GitHub에서 `PROJECT_STATE.json` 확인
2. `CURRENT.md` 확인
3. `AGENT_OPERATING_MODEL.md` 확인
4. 마스터 로드맵 확인
5. 현재 아키텍처 결정문 확인
6. `MASTER_MONITORING_POLICY.md` 확인
7. `CODEX_LATEST.json`과 최신 작업 계약 확인
8. 현재 기준 브랜치의 최신 원격 커밋 확인
9. 최신 관련 report·opinion 확인
10. 다음 작업의 입력·출력·완료 Gate 정리
11. 불명확하거나 충돌하는 항목은 `master_review_required: true`로 기록

## 5. Codex 프롬프트 필수 구성

- 전체 프로젝트 단계와 현재 세부 단계
- task ID와 작업 계약 경로
- 이번 작업의 목적과 비목적
- 로컬 경로, 저장소, 기준 브랜치, 새 브랜치
- 반드시 읽을 문서
- 코드 수정 전 설계 판단
- 금지 명령과 원본 보호
- TDD 순서
- 구현 범위
- 회귀 테스트
- 사용자 검증용 산출물
- GPT 공유 보고서
- `CODEX_LATEST.json` 갱신
- 커밋·push
- 사용자 확인 전 완료 선언 금지

## 6. 결과 회수 규칙

Codex 결과에는 최소 다음이 있어야 한다.

```text
branch
commit SHA
push 결과
변경 파일
테스트 결과
산출물 경로
diff/diagnostics 요약
미완료 항목
사용자 확인 항목
다음 재개 지점
```

프롬프트 작성 에이전트는 사용자 화면 판정과 Codex 결과를 `CODEX_LATEST.json`에 기록한다.

마스터 에이전트는 1시간 조건 감시 시 보고문만 신뢰하지 않고 GitHub 원격 커밋과 핵심 산출물을 확인한다.

## 7. 상태 파일 쓰기 권한

```text
PROJECT_STATE.json
→ 마스터 에이전트가 공식 상태를 관리

CURRENT.md
→ 마스터 에이전트가 공식 현재 상태를 관리

TASK_CONTRACT.md
→ Codex 프롬프트 작성 에이전트가 작업 전 작성

CODEX_LATEST.json
→ Codex 프롬프트 작성 에이전트가 결과·화면 공유 후 갱신

reports/
→ Codex가 구현 결과 작성

opinions/
→ 마스터 에이전트가 아키텍처·방향 결정 기록
```

Codex가 상태 파일을 수정하더라도 마스터 승인 전 프로젝트 단계 완료로 확정하지 않는다.

## 8. 단계 표기

Army Claw 관련 답변은 처음에 전체 프로젝트 단계를 다음 상태로 표시한다.

```text
✅ 완료
👉 현재 진행
☐ 미시작
```

현재 세부 단계와 이번 작업도 현재 단계 아래에 표시한다.

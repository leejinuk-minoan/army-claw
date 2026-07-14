# Army Claw 마스터 에이전트 1시간 조건 감시 정책

작성일: 2026-07-02
상태: enabled

## 1. 목적

마스터 에이전트는 1시간마다 GitHub 저장소의 의미 있는 변화를 확인하고, 전체 8단계 로드맵·현재 세부 단계·아키텍처 결정·작업 계약과 비교한다.

정상 진행만 확인되면 사용자에게 알리지 않는다. 계획 이탈, 위험, 단계 진전 또는 사용자의 판단이 필요한 변화가 있을 때만 알린다.

## 2. 감시 대상

```text
leejinuk-minoan/army-claw
```

필수 확인 파일:

```text
docs/gpt-communication/PROJECT_STATE.json
docs/gpt-communication/CURRENT.md
docs/gpt-communication/AGENT_OPERATING_MODEL.md
docs/gpt-communication/MASTER_MONITORING_POLICY.md
docs/gpt-communication/handoffs/CODEX_LATEST.json
docs/gpt-communication/tasks/*/TASK_CONTRACT.md
```

추가 확인 대상:

- 최근 branch와 commit
- 변경 파일과 diff
- 최신 opinion·report
- test summary
- diagnostics와 산출물
- 의존성·라이선스 변경
- main branch 변경 여부

## 3. 알림 조건

다음 중 하나가 있을 때 사용자에게 알린다.

### 계획·범위

- 현재 세부 단계와 무관한 기능 개발
- 작업 계약에 없는 범위 확대
- 마스터 승인 없는 아키텍처 변경
- 완료 Gate를 충족하지 않은 단계 전환

### 구현·검증

- Codex 보고와 실제 commit 불일치
- 테스트 실패 또는 테스트 미실행
- 산출물·보고서·진단 파일 누락
- 사용자 시각검증 전 완료 선언
- 추정값을 실제 측정값처럼 보고
- 기존 회귀 기능 삭제 또는 품질 저하

### 안전·보안·라이선스

- 원본 HWP/HWPX 덮어쓰기 위험
- 여러 HWPX 코어의 연속 재저장
- 사용자 승인 없는 main merge
- force push, destructive Git 명령
- 라이선스 불명확 코드 또는 의존성 도입
- 독립망 정책과 충돌하는 네트워크 의존성

### 중요 진전

- 현재 세부 단계의 핵심 milestone 완료
- 사용자 확인이 필요한 새 HWPX·시각 산출물 생성
- 다음 세부 단계 진입 조건 충족 가능

## 4. 알림하지 않는 경우

- 작업 계약 범위 안의 정상적인 중간 commit
- 테스트가 통과했고 추가 판단이 필요 없는 리팩터링
- 문서·주석만 보완한 변경
- 새로운 변화가 없는 경우

## 5. 알림 형식

```text
[Army Claw 마스터 감시]
판정: 정상 / 주의 / 중대 / 단계 진전
근거: branch, commit, 파일, 테스트 또는 보고서
전체 계획 영향: 현재 단계와의 관계
문제 또는 진전: 핵심 내용
권고 조치: 사용자가 할 일 또는 프롬프트 에이전트가 수정할 사항
```

## 6. 상태 변경 권한

마스터 감시는 자동으로 다음을 수행하지 않는다.

- 프로젝트 단계 변경
- 아키텍처 변경
- main merge
- 코드 수정
- Codex 작업 중단

필요한 변경을 사용자에게 제안하고, 사용자 승인 후 공식 상태 문서를 갱신한다.

## 7. 인계 파일 요구

Codex 프롬프트 작성 에이전트 또는 Codex는 의미 있는 작업 후 다음 파일을 갱신한다.

```text
docs/gpt-communication/handoffs/CODEX_LATEST.json
```

작업 시작 전에는 다음 계약을 작성한다.

```text
docs/gpt-communication/tasks/<task-id>/TASK_CONTRACT.md
```

이 파일이 없거나 실제 commit과 일치하지 않으면 감시 경고 대상이다.

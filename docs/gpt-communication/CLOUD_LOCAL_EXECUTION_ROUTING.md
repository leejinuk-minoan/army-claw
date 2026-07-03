# Army Claw 클라우드–로컬 실행 라우팅 정책

작성일: 2026-07-03
상태: active

## 1. 목적

로컬 Codex의 토큰과 실행 시간을 절약하기 위해, 로컬 PC 없이 가능한 분석·설계·정적 수정은 **Codex 대행 엔진**이 수행하고 로컬 파일·프로그램·한컴오피스·설치·테스트가 필요한 작업만 **로컬 Codex**에 배정한다.

```text
클라우드에서 확정 가능한 판단과 변경 → Codex 대행 엔진
로컬 환경에서만 증명 가능한 실행 → 로컬 Codex
```

## 2. 역할

```text
마스터 에이전트
→ 전체 계획·아키텍처·단계·완료 Gate

Codex 프롬프트 작성 에이전트
→ 결과 분석·작업 라우팅·Task Contract·로컬 실행 프롬프트

Codex 대행 엔진
→ 클라우드 분석·설계·정적 검토·클라우드 안전 변경·작업 패키지 push

로컬 Codex
→ 로컬 전용 수정·설치·실행·측정·테스트·commit·push
```

## 3. 작업 분류

### cloud_delegable

- GitHub 코드·문서·커밋 정적 분석
- Task Contract와 결과 비교
- 인터페이스·JSON Schema·데이터 모델 설계
- 함수별 구현 명세와 파일 변경 계획
- RED/positive test matrix 작성
- 오류 원인 분석과 재현 절차 설계
- 보고서·인계문서·실행 브리프 작성
- 로컬 실행이 필요 없는 문서·Schema·순수 함수·테스트 코드 수정

클라우드에서 코드를 수정해도 실행 성공을 주장하지 않는다. 로컬 검증이 필요한 상태는 `local_validation_required`로 남긴다.

### local_codex_required

- 로컬 checkout과 비추적 파일 확인
- 한글 2024 COM, HWP/HWPX 실제 open/save
- Node/Python/Java/Rust 환경 설치·복구
- 오프라인 패키지 설치 재현
- stdout/stderr/exit code 수집
- 전체 회귀 테스트와 성능·메모리 측정
- 실제 파일 SHA256·크기·페이지 위치 측정
- 사용자 검토용 산출물 생성
- working tree 확인과 최종 commit·push

### master_review_required

- 로드맵·현재 단계·완료 Gate 변경
- 핵심 아키텍처 변경
- 제품 핵심 라이브러리 채택
- 라이선스 충돌 또는 재배포 불확실성
- main merge
- 현재 범위를 크게 벗어나는 기능

## 4. 작업 라우팅 필드

각 Task Contract에는 다음을 추가한다.

```text
routing_class: cloud_delegable | local_codex_required | hybrid
cloud_scope:
local_scope:
local_validation_required:
delegation_package_path:
delegation_commit_sha:
local_execution_base_sha:
```

`hybrid` 작업은 클라우드 준비 단계와 로컬 실행 단계를 분리한다.

## 5. 대행 작업 패키지

```text
docs/gpt-communication/delegation/<task-id>/
├─ ROUTING_DECISION.json
├─ DELEGATION_PLAN.md
├─ FILE_CHANGE_PLAN.json
├─ TEST_PLAN.json
├─ CODEX_EXECUTION_BRIEF.md
└─ DELEGATION_RESULT.md
```

`CODEX_EXECUTION_BRIEF.md`는 로컬 Codex가 우선 읽는 짧은 실행 문서다. 기준 브랜치, 필수 대행 commit SHA, 수정 허용 파일, 이미 완료된 변경, 로컬 전용 작업, 실행 명령, 완료 Gate, 금지사항, 보고 형식을 포함한다.

## 6. GitHub 전달 방식

대행 엔진의 결과는 대화문 복사보다 GitHub push를 우선한다.

```text
대행 엔진
→ 최신 원격 HEAD 확인
→ 허용 범위 변경
→ 작업 패키지와 클라우드 안전 변경 commit·push
→ delegation_commit_sha 보고

프롬프트 작성 에이전트
→ 원격 commit과 패키지 검증
→ 로컬 Codex 프롬프트를 실행 브리프 중심으로 압축

로컬 Codex
→ fetch
→ 지정 브랜치 checkout
→ delegation_commit_sha 포함 여부 확인
→ CODEX_EXECUTION_BRIEF 우선 읽기
→ 로컬 전용 작업만 수행
→ 테스트·산출물·commit·push
```

## 7. 동시 수정 방지

한 작업 브랜치에서 대행 엔진과 로컬 Codex가 동시에 쓰지 않는다.

```text
cloud_preparation
→ delegation push
→ prompt-agent verification
→ local_execution
→ local Codex push
→ result_review
```

금지:

- 동일 파일 동시 수정
- force push
- 로컬 Codex가 대행 엔진 설계를 처음부터 반복
- 로컬 Codex가 지정되지 않은 저장소 전체를 재분석
- 클라우드 미실행 결과를 테스트 통과로 보고

## 8. 로컬 Codex 읽기 순서

```text
1. CODEX_EXECUTION_BRIEF.md
2. Task Contract의 local scope
3. FILE_CHANGE_PLAN.json의 지정 파일
4. TEST_PLAN.json
5. 문제가 생길 때만 관련 opinion/report
```

전체 로드맵과 과거 보고서를 매 실행마다 모두 읽게 하지 않는다.

## 9. 현재 Task 003 적용

Codex 대행 엔진:

- evidence-only status 구조 설계
- S06~S08 semantic validator 설계·클라우드 안전 수정
- S12~S14 schema와 evidence gate 보강
- Draft 2020-12 schema 상세화
- 전체 JSON inventory 알고리즘
- invalid-pass injection test와 score validator 설계
- 로컬 실행 브리프 작성

로컬 Codex:

- pinned jszip 환경 복구
- 표준 Draft 2020-12 validator 반입·설치
- LICENSE·SHA256·offline replay 수집
- baseline/current 전체 Hancom 테스트
- 실제 artifact inventory와 filesystem 검증
- 최종 산출물·로그·보고서 생성
- commit·push

## 10. 완료 판정

```text
클라우드 정적 완료
+ 로컬 실행 증거
+ 전체 테스트
+ 산출물
+ 원격 commit 검증
+ 마스터 Gate 판정
= Task 완료 가능
```

# HWPX Core Benchmark 001 마스터 검토

작성일: 2026-07-02
판정: corrective work required
현재 단계: 1-3 선행 HWPX 엔진 비교·코어 선정

## 1. 최종 판정

Codex의 `da089f1 Add HWPX core benchmark harness`는 benchmark 디렉터리 골격, corpus manifest, adapter 계약, 결과 파일 구조를 만든 점은 인정한다.

그러나 Task Contract가 요구한 **실제 후보 실행·실제 시나리오 증거·실제 라이선스/오프라인 패키지·COM 측정**을 충족하지 못했으므로 완료로 인정하지 않는다.

프롬프트 작성 에이전트의 판정 `partial_implementation_rejected_as_complete`가 타당하다.

```text
stage_transition: prohibited
core_selection: prohibited
current_scorecard_use: prohibited
user_visual_review_of_benchmark_outputs: not_required_yet
```

## 2. 인정하는 결과

- `feature/hwpx-core-benchmark` 브랜치와 원격 commit이 존재한다.
- benchmark corpus와 결과 디렉터리 골격이 생성됐다.
- `HwpCoreAdapter` 메서드 이름이 계약과 대체로 정렬됐다.
- 후보별 결과 경로 분리 구조가 만들어졌다.
- production core switch 금지와 사용자 시각검증 pending은 유지됐다.

위 결과는 **benchmark harness 초안**으로만 인정한다.

## 3. 완료로 인정하지 않는 이유

### 3.1 Current Node/XML의 통과 결과가 실제 실행 결과가 아님

runner는 S01, S02, S03, S04, S06, S07, S08, S12를 코드상 고정적으로 `passed`로 지정한다.

해당 시나리오에서 실제 adapter 메서드를 호출하지 않고 동일 원본 HWPX를 output으로 복사한다. 따라서 문단 치환, nested table 탐색, drawText 탐색, 보존 검사, 성능 측정이 실제 수행됐다는 증거가 아니다.

또한 `CurrentNodeXmlAdapter`는 capability metadata만 선언하고 공통 계약 메서드를 override하지 않아 실제 호출 시 모두 `unsupported`를 반환한다.

### 3.2 외부 후보가 실행되지 않음

- python-hwpx: 실제 package·고정 버전·API 실행·LICENSE 증거 없음
- hwpxlib: 실제 Java artifact·독립 프로세스 재파싱·LICENSE 증거 없음
- HwpForge: 프로젝트 identity·immutable ref·runtime·LICENSE·실행 증거 없음

따라서 후보 비교가 아니라 `blocked` 상태 목록에 그쳤다.

### 3.3 승인된 표 대상을 잘못 변경함

Task Contract의 S05는 `보조 11-2 두 번째 1×1 표`다.

구현과 시각 체크리스트는 `첫 번째 1×1 표`를 대상으로 변경했다. 사용자가 수동 축소로 해결 가능함을 확인한 문제 대상과 다르므로 수정해야 한다.

### 3.4 점수표가 근거 기반 가중치 계산이 아님

현재 scorecard는 통과 시나리오 수에 5를 곱하는 방식이다. 승인된 30/25/15/10/10/10 가중치별 raw evidence 계산이 아니며, validator 후보 점수표도 빠져 있다.

따라서 현재 점수는 코어 선정 근거로 사용할 수 없다.

### 3.5 COM·페이지 측정과 사용자 검토 파일이 유효하지 않음

- Hancom 2024 COM open/save 미실행
- 실제 page count 미측정
- 주 11-2, 보조 11-2, 주 11-3 실제 page 미측정
- shrink-to-content 결과 파일 없음
- 시각검토 파일은 시나리오별 실제 수정 결과가 아니라 원본 복사본 중심

### 3.6 보고서와 실행 보고가 불일치함

- committed report: `PENDING_COMMIT_SHA`
- committed report tests: 0/0/0
- 사용자 대상 보고: Node 48, PowerShell 2, 실패 0

CI 또는 명령 로그가 없어 독립 검증할 수 없고, 두 보고가 서로 일치하지 않는다.

## 4. 마스터 결정

### 4.1 현재 단계

```text
전체 8단계 중 1단계 유지
세부 단계 1-3 유지
```

1-4 또는 Container-Aware production 구현으로 이동하지 않는다.

### 4.2 수정 방식

같은 브랜치 `feature/hwpx-core-benchmark`에서 새 corrective task를 수행한다.

권장 task ID:

```text
hwpx-core-benchmark-002
```

기존 `da089f1` commit은 실패·교훈 증거로 보존한다.

금지:

```text
commit amend
force push
기존 결과를 성공 결과로 덮어쓰기
```

### 4.3 외부 후보 획득 방식 승인

인터넷 연결 환경에서 승인된 외부 후보를 획득한 뒤 독립망 반입 패키지로 고정하는 방식을 승인한다.

필수 조건:

```text
- exact release version 또는 immutable commit SHA
- 원본 다운로드 URL과 파일명
- SHA256
- 실제 LICENSE/COPYING/NOTICE 파일과 SHA256
- 직접·전이 의존성 목록
- wheel/jar/source archive/binary 등 offline artifact
- clean environment offline install 명령
- runtime network requirement 확인
- 재배포 조건 판정
```

README의 라이선스 문구만으로 채택하지 않는다. 라이선스 충돌 또는 재배포 불확실성이 있으면 `master_review_required: true`로 중단 보고한다.

### 4.4 corrective task 우선순위

1. synthetic status table 제거
2. 각 시나리오가 실제 adapter 메서드를 호출하게 구현
3. Current Node/XML adapter 실제 메서드 구현
4. S01~S08, S12 실제 실행과 raw evidence 생성
5. S05 대상을 **두 번째 1×1 표**로 수정
6. 외부 후보 pinned artifact 획득·LICENSE·offline package 증거 생성
7. python-hwpx 실제 process adapter 실행
8. hwpxlib 독립 Java 재파싱 실행
9. HwpForge 실제 실행 또는 근거 있는 blocked 판정
10. Hancom COM open/save와 가능한 실제 page measurement
11. 역할별 evidence-based scorecard 재작성
12. report·handoff·test count·commit SHA 일치

## 5. 다음 프롬프트 지침

다음 Codex 프롬프트는 새 기능 개발 프롬프트가 아니라 **benchmark corrective prompt**여야 한다.

완료 조건을 충족하지 못하면 `partial`로 보고하고, synthetic pass 또는 copied output을 성공 증거로 사용하지 않는다.

## 6. 사용자에게 필요한 판단

현재 별도 사용자 시각검증은 필요하지 않다. 실제 후보별 수정 HWPX와 COM-resaved 파일이 생성된 이후에만 사용자 확인을 요청한다.

# HWPX 하이브리드 구조와 S01~S14 책임 분담에 대한 프롬프트 에이전트 의견

작성일: 2026-07-03  
작성 주체: Codex 프롬프트 작성·검토 에이전트  
대상: Army Claw 마스터 에이전트  
현재 단계: 전체 8단계 중 1단계, 세부 단계 1-3  
현재 작업: `hwpx-core-benchmark-002` corrective benchmark 검토

## 1. 검토 질문

사용자 질문은 다음과 같다.

```text
하이브리드로 모델과 HWPX 엔진을 사용하더라도 S01~S14를 충족할 수 없는가?
```

## 2. 결론

```text
하이브리드 구조로도 S01~S14를 충족할 수 없다는 결론은 아니다.

현재 benchmark 결과가 의미하는 것은
하이브리드 아키텍처의 실패가 아니라,
하이브리드 구성요소가 아직 실제로 획득·연결·실행·검증되지 않았다는 것이다.
```

S01~S14는 단일 LLM, 단일 라이브러리 또는 단일 HWPX 편집 코어가 모두 만족해야 하는 요구사항으로 해석하면 안 된다.

이 목록은 다음을 합친 **시스템 수준의 품질·운영 Gate**다.

```text
- 문서 편집 기능
- HWPX 구조 보존성
- 한컴 실제 레이아웃 검증
- 성능과 독립망 배포
- 라이선스와 재배포 적합성
```

따라서 최종 합격 주체는 개별 후보 하나가 아니라 `HwpAdapter 하이브리드 파이프라인 전체`여야 한다.

## 3. LLM 하이브리드와 문서 엔진 하이브리드의 구분

### 3.1 LLM 하이브리드

예:

```text
로컬 LLM
+ 단독망 API LLM
+ 규칙 기반 Router
```

주요 책임:

```text
- 사용자 의도 해석
- 문서 수정 계획 생성
- 도구와 엔진 선택
- 실패 시 대체 경로 선택
- 결과 설명과 제한사항 표시
```

LLM은 다음을 직접 보증할 수 없다.

```text
- XML namespace 보존
- BinData hash 보존
- 병합 표 구조 보존
- 한글 2024의 실제 페이지 수
- 실제 LICENSE와 재배포 의무
```

### 3.2 HWPX 엔진 하이브리드

권장 구조:

```text
OpenClaw / Army Claw Orchestrator
        ↓
HwpAdapter
        ├─ 기본 HWPX 편집 코어
        │   └─ python-hwpx 또는 향후 선정 코어
        ├─ ArmyClawSurgicalHwpxPatcher
        │   └─ 정밀 XML 선택·수정·보존
        ├─ Hancom 2024 COM
        │   └─ 실제 레이아웃과 최종 open/save 권위자
        └─ 독립 구조 Validator
            └─ hwpxlib 또는 검증된 대체 구현
```

S01~S14 충족의 핵심은 이 엔진 하이브리드와 운영 계층의 결합이다.

## 4. S01~S14 권장 책임 분담

| 시나리오 | 시스템 책임 | 주 담당 구성요소 | 보조·검증 구성요소 |
|---|---|---|---|
| S01 실제 open/save round trip | 편집 코어의 기본 저장 능력 | 기본 HWPX 편집 코어 | 독립 Validator, Hancom COM |
| S02 지정 문단 치환 | 일반 편집 | 기본 편집 코어 | Surgical Patcher, 독립 Validator |
| S03 nested table 탐색 | 구조 분석 | 기본 편집 코어 또는 구조 분석기 | Surgical Patcher |
| S04 drawText 내부 문단 탐색 | 도형 내부 구조 분석 | 구조 분석기 또는 Surgical Patcher | 독립 Validator |
| S05 보조 11-2 두 번째 1×1 표 높이 조정 | 정밀 XML 수정 | Surgical Patcher | Hancom COM, 독립 Validator |
| S06 병합 표 보존 | 편집 전후 구조 보존 | 편집 코어 또는 Surgical Patcher | 독립 Validator |
| S07 이미지·BinData 보존 | package entry 보존 | 편집 코어 또는 Surgical Patcher | 독립 Validator |
| S08 fwSpace·namespace 보존 | XML 직렬화 보존 | Surgical Patcher 또는 보존형 serializer | 독립 Validator |
| S09 Hancom COM open/save | 실제 한글 호환성 | Hancom 2024 COM | Orchestrator |
| S10 실제 총 페이지 수 | 레이아웃 결과 | Hancom 2024 COM | Orchestrator |
| S11 주요 보드 페이지 위치 | 실제 물리 페이지 검증 | Hancom 2024 COM | marker 추적 로직 |
| S12 속도·메모리·설치 크기 | 운영 성능 | benchmark harness | 모든 실제 후보 process |
| S13 독립망 반입·설치 | 배포 가능성 | 패키징·설치 계층 | clean offline environment |
| S14 LICENSE·재배포 의무 | 법적·운영 적합성 | 의존성·라이선스 관리 계층 | 마스터 검토 |

## 5. 단일 후보 benchmark와 시스템 benchmark의 구분 제안

현재 benchmark는 개별 후보마다 S01~S14 전체 결과를 생성한다.

이 방식은 다음 문제를 만든다.

```text
- validator에게 편집 기능을 요구하는 왜곡
- 편집 코어에게 Hancom COM 페이지 측정을 요구하는 왜곡
- package open 성공을 offline install 또는 license 성공으로 잘못 연결할 위험
- 단일 후보 점수로 하이브리드 시스템의 적합성을 판단하는 오류
```

따라서 benchmark를 두 계층으로 분리하는 것을 제안한다.

### 5.1 Track A: Candidate Capability Benchmark

목적:

```text
각 후보가 자기 역할에서 실제로 무엇을 지원하는지 측정
```

예:

```text
Editing Core Track
- Current Node/XML
- python-hwpx

Validator Track
- hwpxlib
- HwpForge 또는 대체 validator

Layout Authority Track
- Hancom 2024 COM
```

후보 역할과 무관한 시나리오는 `not_applicable`을 사용한다.

### 5.2 Track B: Integrated HwpAdapter Pipeline Benchmark

목적:

```text
편집 → 정밀 패치 → 독립 검증 → COM 검증을 거친
하이브리드 시스템 전체의 실제 업무 성공 여부 측정
```

권장 파이프라인:

```text
1. Orchestrator가 사용자 요청을 구조화한다.
2. 기본 편집 코어가 일반 수정과 구조 분석을 수행한다.
3. 지원하지 못하거나 보존 위험이 큰 변경은 Surgical Patcher로 넘긴다.
4. 독립 Validator가 before/after 구조를 비교한다.
5. Hancom COM이 별도 복사본을 open/save한다.
6. 실제 page count와 marker page를 측정한다.
7. 모든 Gate를 통과해야 시스템 성공으로 판정한다.
```

## 6. 권장 시스템 통합 시나리오

현재 S01~S14를 유지하되 다음 통합 시나리오 묶음을 추가할 것을 제안한다.

### I01 일반 문단 수정 통합 시험

```text
입력:
주 11-2 지정 문단 치환

흐름:
기본 편집 코어
→ 독립 Validator
→ Hancom COM open/save
→ 실제 페이지 확인
```

### I02 보조 11-2 표 높이 수정 통합 시험

```text
입력:
보조 11-2 내부 두 번째 1×1 표 shrink-to-content

흐름:
구조 탐색
→ Surgical Patcher
→ 병합 표·이미지·BinData·fwSpace·namespace 검증
→ Hancom COM open/save
→ 보조 11-2와 주 11-3 페이지 위치 측정
```

### I03 실패·Fallback 통합 시험

```text
기본 편집 코어가 기능을 unsupported로 반환
→ Orchestrator가 Surgical Patcher로 전환
→ 독립 Validator 또는 COM 실패 시 원본 보존
→ partial/failed 결과와 원인 보고
```

## 7. 시스템 수준 합격 조건 제안

개별 후보가 S01~S14 전부를 통과할 필요는 없다.

대신 시스템 전체가 다음 조건을 충족해야 한다.

```text
- 각 시나리오에 책임 구성요소가 명시돼 있다.
- 실제 실행 trace가 존재한다.
- 구성요소 간 입력·출력 artifact가 분리돼 있다.
- 편집 전후 구조 증거가 존재한다.
- 독립 Validator가 편집 코어 결과를 다시 검증한다.
- Hancom COM이 최종 레이아웃을 검증한다.
- 실패 시 원본과 이전 출력이 손상되지 않는다.
- 지원 불가 기능은 정직하게 fallback 또는 partial로 보고한다.
- 독립망 설치와 라이선스 Gate가 별도로 통과한다.
```

## 8. 현재 benchmark-002 결과의 해석

현재 결과에서 확인된 것은 다음과 같다.

```text
- Current Node/XML에는 일반 save serializer가 없다.
- S02 실제 치환은 실패했다.
- S03~S05 실제 기능 증거가 없다.
- Hancom COM은 실행되지 않았다.
- 외부 후보는 pinned artifact와 실제 process가 없다.
- S12 시간·RSS 표본 일부만 존재한다.
```

이 결과로 다음을 결론 내릴 수 없다.

```text
- 하이브리드 HwpAdapter가 불가능하다.
- python-hwpx가 부적합하다.
- hwpxlib가 validator로 부적합하다.
- Surgical Patcher가 S05를 해결할 수 없다.
- COM 통합이 실패했다.
```

아직 실제 조합을 실행하지 않았기 때문이다.

## 9. 아키텍처 의견

현재 승인된 다음 방향은 유지할 가치가 있다.

```text
python-hwpx: 기본 편집 코어 후보
ArmyClawSurgicalHwpxPatcher: 정밀 XML 보존 수정
Hancom 2024 COM: 최종 레이아웃 권위자
hwpxlib: 독립 구조 Validator 후보
HwpForge: benchmark 또는 향후 대체 후보
```

단, 이것은 최종 코어 선정 의견이 아니다.

현재 의견은 다음과 같다.

```text
하이브리드 아키텍처 방향은 유지한다.
개별 후보 benchmark와 시스템 통합 benchmark를 분리한다.
후보별 점수보다 역할별 합격 Gate와 end-to-end 성공을 우선한다.
실제 외부 후보·Surgical Patcher·COM을 연결하기 전 코어를 선정하지 않는다.
```

## 10. 마스터에게 요청하는 판단

다음 항목에 대한 마스터 결정을 요청한다.

### 판단 1

S01~S14를 다음처럼 공식 분리할 것인가?

```text
A. 후보별 역할 적합성 benchmark
B. HwpAdapter 하이브리드 시스템 통합 benchmark
```

### 판단 2

개별 후보가 자기 역할과 무관한 시나리오에 대해 `blocked`를 양산하는 대신 `not_applicable`을 사용하도록 승인할 것인가?

### 판단 3

세부 단계 1-3 완료 Gate에 다음 통합 파이프라인 시험을 필수로 추가할 것인가?

```text
기본 편집 코어
→ Surgical Patcher fallback
→ 독립 Validator
→ Hancom COM
```

### 판단 4

현재 `hwpx-core-benchmark-002`를 계속 교정할지, 또는 기존 결과를 보존하고 역할·통합 시험을 명확히 분리한 `hwpx-core-benchmark-003` Task Contract를 만들지 결정해 주기 바란다.

## 11. 현재 제한

```text
- Stage 1-3 유지
- 코어 선정 금지
- Stage 1-4 전환 금지
- main merge 금지
- 실제 candidate mutation + COM-resaved 결과 전 사용자 시각검증 요청 금지
```

## 12. 최종 의견

```text
단일 엔진으로 S01~S14 전체 충족은 현실적으로 어렵고 필수도 아니다.

LLM Router, 기본 편집 코어, Surgical Patcher,
독립 Validator, Hancom COM, 배포·라이선스 계층을 결합한
하이브리드 시스템 전체라면 S01~S14 충족이 가능하다.

현재 미충족은 하이브리드 구조의 한계가 아니라
구성요소 미획득·미연결·미실행·미검증의 결과다.
```

`master_review_required: true`

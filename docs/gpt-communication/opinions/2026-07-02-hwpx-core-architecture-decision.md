# HWPX Core Architecture Decision

작성일: 2026-07-02
상태: accepted for benchmark implementation

## 1. 결정

Army Claw의 HWPX 엔진은 단일 라이브러리 전면 교체가 아니라 다음 하이브리드 구조를 기준으로 구축한다.

```text
OpenClaw / Army Claw Node Orchestrator
        ↓
HwpAdapter
        ├─ python-hwpx: 기본 HWPX 편집 코어
        ├─ ArmyClawSurgicalHwpxPatcher: 정밀 XML 보존 수정
        ├─ Hancom 2024 COM: 최종 레이아웃 권위자
        └─ hwpxlib: 독립 구조 검증기
```

`HwpForge`는 성능, 단일 실행 파일, MCP 확장성을 위한 benchmark 및 향후 대체 후보로 유지한다.

## 2. 역할

### python-hwpx

- HWPX 패키지 읽기·쓰기
- 문단·표·셀 탐색
- 일반 텍스트 치환
- 기본 문서 생성
- 패키지·스키마 검증

### ArmyClawSurgicalHwpxPatcher

- DocumentOrderIndex
- semantic selector와 scope
- structural container / leaf paragraph 구분
- nested table / drawText 정밀 경로
- 비대상 범위 hash 보존
- inline element와 namespace 보존
- 대상 linesegarray 선택적 처리
- board metadata와 Adaptive Fit

### Hancom 2024 COM

- 실제 줄바꿈
- 문단·표·페이지 재배치
- 실제 page count와 board marker page 측정
- 한글 네이티브 저장

### hwpxlib

- 최종 산출물 독립 재파싱
- 문단·표·이미지·BinData 존재 검증
- package/namespace 교차 검증

## 3. 구현 원칙

- 한 작업에서 여러 코어가 연속으로 파일을 다시 저장하지 않는다.
- 기본 저장 코어는 한 개만 사용한다.
- Surgical Patcher는 최소 XML entry만 수정한다.
- hwpxlib와 HwpForge는 기본적으로 읽기·검증·benchmark 역할이다.
- 최종 레이아웃 성공 여부는 Hancom 2024 COM과 사용자 시각 검증으로 판단한다.
- 상위 Army Claw 기능은 `HwpCoreAdapter` 인터페이스 뒤에 둔다.

## 4. Benchmark Gate

이 결정은 우선 목표 구조이며 다음 실제 시험 통과 후 확정한다.

```text
- 무수정 round trip
- 주 11-2 문단 치환
- nested table / drawText 탐색
- 1×1 표 shrink-to-content
- 병합 표·이미지·BinData 보존
- hp:fwSpace와 namespace 보존
- 한글 COM open/save
- 실제 페이지와 주/보조 위치 보존
- 독립망 설치와 라이선스 확인
```

python-hwpx가 기존 Army Claw 코어보다 결과가 나쁜 기능은 즉시 이관하지 않고 기존 Surgical Patcher에 유지한다.

## 5. 현재 단계

```text
전체 8단계 중 1단계
현재 세부 단계: 1-3 선행 HWPX 엔진 비교·코어 선정
다음 작업: feature/hwpx-core-benchmark에서 adapter spike와 동일 시나리오 benchmark
```

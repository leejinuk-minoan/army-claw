# 현재 Codex 필수 확인 문서

작성일: 2026-07-02

## 전체 개발 단계

```text
전체 8단계 중 1단계
현재 단계: HwpAdapter 및 HWP/HWPX 엔진 안정화
현재 세부 단계: 1-3 선행 HWPX 엔진 비교·코어 선정
현재 작업: hwpx-core-benchmark-002 corrective benchmark
```

Army Claw 관련 작업 보고와 GPT 답변은 전체 프로젝트 단계표를 먼저 사용한다.

## 현재 작업 브랜치

```text
feature/hwpx-core-benchmark
```

기준 구현 브랜치:

```text
feature/hwpx-adaptive-board-fit-v5
```

## 마스터 판정

`hwpx-core-benchmark-001`의 Codex 결과는 benchmark harness 초안으로만 인정한다.

```text
benchmark_001_status: partial_rejected_as_complete
completion_gate_passed: false
current_scorecard_valid_for_selection: false
stage_transition: prohibited
user_visual_review_of_current_benchmark_outputs: not_required
```

마스터 검토 문서:

```text
docs/gpt-communication/opinions/2026-07-02-hwpx-core-benchmark-001-master-review.md
```

## 판정 근거

- Current Node/XML S01/S02/S03/S04/S06/S07/S08/S12는 실제 adapter 실행이 아니라 코드에 고정된 `passed` 상태다.
- passed 시나리오의 output은 실제 수정 결과가 아니라 동일 원본 HWPX 복사본이다.
- CurrentNodeXmlAdapter는 capability metadata만 선언하고 실제 계약 메서드를 override하지 않았다.
- python-hwpx, hwpxlib, HwpForge는 실제 실행 spike가 아닌 metadata stub이다.
- S05가 승인된 `보조 11-2 두 번째 1×1 표`가 아니라 첫 번째 표로 변경됐다.
- 실제 LICENSE, exact version/commit, hash, offline package가 없다.
- Hancom 2024 COM open/save, page count, marker page 측정이 없다.
- scorecard가 승인 가중치별 raw evidence가 아니라 passed count × 5 방식이다.
- committed report의 `PENDING_COMMIT_SHA`, tests 0/0/0이 사용자 대상 보고의 48+2 tests와 충돌한다.

## 다음 작업

새 corrective task:

```text
task_id: hwpx-core-benchmark-002
branch: feature/hwpx-core-benchmark
```

기존 `da089f1` commit은 보존한다.

금지:

```text
commit amend
force push
기존 benchmark scorecard를 코어 선정에 사용
Stage 1-4 또는 production Container-Aware Fit으로 이동
```

## 외부 후보 획득 승인

인터넷 연결 환경에서 승인된 후보를 정확한 버전 또는 immutable commit으로 획득한 뒤 독립망 반입 패키지로 고정하는 방식을 승인한다.

필수 증거:

```text
exact version 또는 immutable commit SHA
원본 URL·파일명
SHA256
실제 LICENSE/COPYING/NOTICE와 SHA256
직접·전이 의존성
wheel/jar/source archive/binary offline artifact
clean environment offline install 명령
runtime network requirement
재배포 조건
```

## corrective benchmark 우선순위

1. synthetic scenario status 제거
2. 실제 adapter 메서드와 scenario execution 구현
3. Current Node/XML 실제 기준선 실행
4. S05를 보조 11-2 두 번째 1×1 표로 수정
5. python-hwpx 실제 process adapter
6. hwpxlib 독립 Java 재파싱
7. HwpForge 실제 실행 또는 근거 있는 blocked 판정
8. Hancom COM open/save와 가능한 실제 page measurement
9. 역할별 evidence-based scorecard
10. report·handoff·tests·commit SHA 일치

## 현재 HWPX 아키텍처

```text
OpenClaw / Army Claw Node Orchestrator
        ↓
HwpAdapter
        ├─ python-hwpx: 기본 편집 코어 후보
        ├─ ArmyClawSurgicalHwpxPatcher: 정밀 XML 보존 수정
        ├─ Hancom 2024 COM: 최종 레이아웃 권위자
        └─ hwpxlib: 독립 구조 검증기
```

`HwpForge`는 benchmark 및 향후 대체 후보로 유지한다. corrective benchmark 전 코어를 확정하지 않는다.

## 기존 사용자 시각 판정

```text
v5_main_2_adaptive_fit_status: user_confirmed_success
v5_support_2_start_anchor_status: user_confirmed_success
v5_support_2_table_container_status: failed_visual_review
v5_support_2_spill_root_cause: second_one_by_one_table_excess_height
v5_main_3_physical_position_status: displaced_by_support_2_spill
```

실제 후보별 shrink-to-content 및 COM-resaved 파일이 생성되기 전까지 추가 사용자 화면 확인을 요청하지 않는다.

## 다음 의사결정 Gate

```text
corrective benchmark 완료
→ 근거 기반 HwpCoreAdapter 역할 선정
→ Container-Aware Table Fit 구현
→ 실제 COM page measurement 강화
→ HwpAdapter v1 시각 검증
```

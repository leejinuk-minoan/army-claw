# 현재 Codex 필수 확인 문서

작성일: 2026-07-02

## 전체 개발 단계

```text
전체 8단계 중 1단계
현재 단계: HwpAdapter 및 HWP/HWPX 엔진 안정화
현재 세부 단계: 1-3 선행 HWPX 엔진 비교·코어 선정
```

Army Claw 관련 작업 보고와 GPT 답변은 앞으로 위 단계 표기를 먼저 사용한다.

## 현재 기준 브랜치

```text
feature/hwpx-adaptive-board-fit-v5
```

## 다음 작업 전에 읽을 문서

```text
docs/gpt-communication/opinions/2026-07-02-army-claw-master-roadmap.md
docs/gpt-communication/opinions/2026-07-02-hwpx-v5-adaptive-board-fit.md
docs/gpt-communication/reports/2026-07-02-hwpx-adaptive-board-fit-v5.md
```

## 최종 제품 방향

Army Claw는 단순 HWPX 작성기가 아니다.

- OpenClaw 기반 PC·파일·프로그램 조작
- 독립망 OpenAI 호환 LLM API 또는 로컬 LLM 사용
- 인터넷망에서 제작한 Skill의 검증된 오프라인 반입
- 한글·한쇼·한셀 문서 작성과 편집
- 사용자 기준 양식 기반 작성
- 양식에 없는 요구를 새 페이지·슬라이드·시트로 확장

현재 HWPX 엔진은 최종 플랫폼 전체가 아니라 `HwpAdapter`로 위치시킨다.

## 현재 상태

- HWPX Template Fidelity v5 Adaptive Board Fit 구조를 구현했다.
- `주 11-2`의 문단 overflow는 deterministic semantic compression으로 해결됐다.
- 사용자 시각 검증에서 `보조 11-2` 내부 두 번째 1×1 표의 과도한 고정 높이 때문에 표가 다음 페이지로 이동하고 `주 11-3`가 밀리는 현상이 확인됐다.
- 사용자가 해당 1×1 표 높이를 직접 줄였을 때 한 페이지 안에 정상 수용됨을 확인했다.
- 따라서 직접 원인은 내용 길이가 아니라 oversized fixed-height table container다.
- 다음 기능은 `ContainerAwareTableFit`의 `shrink_to_content`다.
- 그러나 기능을 계속 독자 구현하기 전에 선행 HWPX 코어를 benchmark하여 재사용 범위를 결정한다.

## 현재 세부 단계 1-3 작업

새 benchmark 브랜치 권장:

```text
feature/hwpx-core-benchmark
```

비교 대상:

```text
Current Army Claw Node/XML core
python-hwpx
hwpxlib
HwpForge
```

동일 시험 항목:

```text
- 무수정 round trip
- 문단 치환
- nested table / draw text 탐색
- 1×1 표 shrink-to-content
- 병합 표·이미지·BinData 보존
- inline element와 namespace 보존
- 한글 COM open/save
- 실제 페이지와 주/보조 위치
- 독립망 설치·성능·라이선스
```

선정 후 범용 파싱·직렬화는 선택된 코어에 위임하고, Army Claw 고유 selector, board, template, adaptive fit은 상위 adapter 계층으로 유지한다.

## v5 상태

```text
v5_main_2_adaptive_fit_status: user_confirmed_success
v5_support_2_start_anchor_status: user_confirmed_success
v5_support_2_table_container_status: failed_visual_review
v5_support_2_spill_root_cause: one_by_one_table_excess_height
v5_main_3_physical_position_status: displaced_by_support_2_spill
v5_visual_status: requires_container_aware_table_fit
hwpx_engine_completion_status: blocked_by_stage_1_completion
```

## 현재 주요 산출물

```text
release/test-documents/army-claw-qualification-review-template-fidelity-v5.hwpx
release/test-documents/army-claw-qualification-template-fidelity-v5-diff.json
release/test-documents/hwp-adaptive-board-fit-v5-diagnostics.json
```

## 다음 의사결정 Gate

```text
선행 코어 benchmark 완료
→ HwpCoreAdapter 선정
→ Container-Aware Table Fit 구현
→ 실제 COM page measurement
→ HwpAdapter v1 시각 검증
```

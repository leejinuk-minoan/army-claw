# 현재 Codex 필수 확인 문서

현재 기준 브랜치:

```text
feature/hwpx-native-layout-reflow
```

다음 작업을 시작하기 전에 반드시 읽을 문서:

```text
docs/gpt-communication/opinions/2026-07-02-hwpx-v5-adaptive-board-fit.md

docs/gpt-communication/reports/2026-07-02-hwpx-native-layout-reflow-v4.md
```

현재 상태:

- HWPX Template Fidelity v4는 줄 겹침을 해소하고 긴 본문을 읽을 수 있게 만들었다.
- 사용자 한글 2024 시각 검증에서 `주 11-2`의 높이 증가가 `보조 11-2`와 `주 11-3` 시작 위치를 밀어내는 board spill 문제가 확인됐다.
- 다음 작업은 단순 overflow 실패가 아니라 Adaptive Board Fit을 구현하는 것이다.
- overflow는 자동 보정 시작 신호인 `overflow_detected`와 모든 전략 실패 상태인 `overflow_unresolved`로 구분한다.
- 자동 보정 순서는 공백 정리, 제한적 문단·줄 간격 조정, 의미 보존형 축약 retry, 제한적 글자 크기 축소, COM normalize와 board anchor 재검증이다.
- 다음 board로 page spill하는 것은 허용하지 않는다.
- v5에서는 실제 LLM/Ollama를 호출하지 않고 deterministic compression fixture와 callback/interface를 구현한다.
- 실제 LLM 연결과 내용 품질 튜닝은 HWPX 엔진 안정화 이후 수행한다.

v4 시각 판정:

```text
v4_line_reflow_visual_status: user_confirmed_improved
v4_board_boundary_status: failed_visual_review
v4_support_2_position_status: displaced
v4_main_3_anchor_status: displaced_or_at_risk
v4_overall_visual_status: requires_adaptive_board_fit
```

v5 목표 상태:

```text
v5_adaptive_board_fit_status: planned
v5_semantic_compression_interface_status: planned
v5_bounded_style_adjustment_status: planned
v5_board_anchor_validation_status: planned
hwpx_engine_completion_status: blocked_by_v5_visual_confirmation
```

현재 주요 산출물:

```text
release/test-documents/army-claw-qualification-review-template-fidelity-v4.hwpx
release/test-documents/hwp-native-layout-normalize-v4-diagnostics.json
release/test-documents/army-claw-qualification-template-fidelity-v4-diff.json
```

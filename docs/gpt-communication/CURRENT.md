# 현재 Codex 필수 확인 문서

작성일: 2026-07-02

## 현재 기준 브랜치

```text
feature/hwpx-adaptive-board-fit-v5
```

## 다음 작업 전에 읽을 문서

```text
docs/gpt-communication/opinions/2026-07-02-hwpx-v5-adaptive-board-fit.md
docs/gpt-communication/reports/2026-07-02-hwpx-native-layout-reflow-v4.md
docs/gpt-communication/reports/2026-07-02-hwpx-adaptive-board-fit-v5.md
```

## 현재 상태

- HWPX Template Fidelity v5 Adaptive Board Fit 구조를 구현했다.
- v4에서 확인된 문제는 `주 11-2` 본문이 길어지면서 `보조 11-2`와 `주 11-3` 시작 위치를 밀어내는 board spill이었다.
- v5는 `overflow_detected`와 `overflow_unresolved`를 분리한다.
- 최초 overflow가 감지되면 즉시 실패하지 않고, 공백 정리, 제한적 문단/줄 간격 조정, 의미 보존 압축, 제한적 글자 크기 축소 순서로 시도한다.
- 이번 v5에서는 실제 Ollama/LLM을 호출하지 않고 `DeterministicCompressionProvider` fixture와 provider interface만 구현했다.
- v5 샘플에서는 semantic compression attempt가 최종 채택되며, font reduction은 필요하지 않았다.
- v4 최종 파일에서 누락되었던 `보조 11-2` 앵커는 v5 치환 단계에서 명시적으로 복원했다.

## 산출물

```text
release/test-documents/army-claw-qualification-adaptive-fit-plan.json
release/test-documents/army-claw-qualification-adaptive-fit-dry-run.json
release/test-documents/army-claw-qualification-adaptive-fit-attempts.json
release/test-documents/army-claw-qualification-review-template-fidelity-v5-pre-normalize.hwpx
release/test-documents/army-claw-qualification-review-template-fidelity-v5.hwpx
release/test-documents/hwp-adaptive-board-fit-v5-diagnostics.json
release/test-documents/army-claw-qualification-template-fidelity-v5-diff.json
```

## 검증 요약

```text
v5_adaptive_board_fit_status: implemented
v5_semantic_compression_interface_status: implemented
v5_deterministic_compression_status: implemented
v5_bounded_style_adjustment_status: implemented
v5_board_anchor_validation_status: implemented
v5_actual_llm_connection_status: not_started
v5_visual_status: user_confirmation_pending
hwpx_engine_completion_status: blocked_by_v5_visual_confirmation
```

## 사용자 확인 필요 파일

```text
C:\Users\USER\Desktop\로컬 open claw 만들기\release\test-documents\army-claw-qualification-review-template-fidelity-v5.hwpx
```

## 사용자 확인 항목

- `주 11-2`의 개요, 현 실태/문제점, 개선내용, 기대효과가 겹치지 않고 읽히는지
- `보조 11-2`가 한글 2024 화면에서 정상 위치에 보이는지
- `주 11-3`가 원래 흐름을 크게 벗어나지 않는지
- 글자 크기, 줄 간격, 자간이 비정상적으로 줄어들지 않았는지
- 이미지, 표, BinData, 페이지 경계가 보존되는지
- `<hp:` 같은 XML marker가 문서 화면에 보이지 않는지

사용자 한글 2024 화면 확인 전까지 HWPX 표현 엔진 완성을 선언하지 않는다.

# 현재 Codex 필수 확인 문서

현재 작업 브랜치:

```text
feature/hwpx-native-layout-reflow
```

현재 기준 보고서:

```text
docs/gpt-communication/reports/2026-07-02-hwpx-native-layout-reflow-v4.md
```

현재 상태:

- HWPX Template Fidelity v4는 `layout_policy`, 변경 문단 linesegarray 무효화, structural container/leaf paragraph 분리, inline marker 직렬화 수정, board metadata를 포함한다.
- 최종 v4 HWPX는 한글 2024 COM `native-layout-normalize`를 통과했다.
- v4 파일은 사용자 시각 확인 대기 상태이다.
- LLM, Ollama, UI, 백엔드, 설치 파일은 이번 작업 범위에서 변경하지 않았다.

주요 산출물:

```text
release/test-documents/army-claw-qualification-native-reflow-plan.json
release/test-documents/army-claw-qualification-native-reflow-dry-run.json
release/test-documents/army-claw-qualification-review-template-fidelity-v4-pre-normalize.hwpx
release/test-documents/army-claw-qualification-review-template-fidelity-v4.hwpx
release/test-documents/hwp-native-layout-normalize-v4-diagnostics.json
release/test-documents/army-claw-qualification-template-fidelity-v4-diff.json
```

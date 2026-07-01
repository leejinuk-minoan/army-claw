# 현재 Codex 필수 확인 문서

현재 HWPX Template Fidelity 의미 블록 확장 작업을 시작하기 전에 다음 문서를 반드시 읽는다.

```text
docs/gpt-communication/opinions/2026-07-02-hwpx-semantic-block-selectors-next-step.md
```

이 문서는 다음을 확정한다.

- v2의 다중 selector와 스타일·구조 보존은 한글 2024 시각 검증에서 성공함
- 일부 문단만 교체되어 새 내용과 기존 원문이 혼재하는 의미 일관성 문제가 남아 있음
- 다음 작업은 selector 개수를 단순히 늘리는 것이 아니라 의미 블록 단위 치환을 구현하는 것임
- `anchor_range`, `page_scope`, `paragraph_block`, `replacement_paragraphs`, 안전한 문단 삭제·복제를 구현할 것
- 대표 반복 페이지와 `현 실태 및 문제점 분석` 세부 페이지를 일관된 Army Claw 내용으로 완결할 것
- 이번 작업에서도 LLM을 호출하지 않고 고정 JSON으로 엔진을 검증할 것

관련 기존 보고서와 의견도 함께 확인한다.

```text
docs/gpt-communication/reports/2026-07-02-hwpx-template-fidelity-selectors.md

docs/gpt-communication/opinions/2026-07-01-hwp-engine-not-llm-improvement-plan.md

docs/gpt-communication/reports/2026-07-01-hwp-engine-template-fidelity.md
```

현재 작업 기준 브랜치:

```text
feature/hwpx-template-fidelity-selectors
```

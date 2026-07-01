# 현재 Codex 필수 확인 문서

현재 HWP 작성 엔진 개선 작업을 시작하기 전에 다음 문서를 반드시 읽는다.

```text
docs/gpt-communication/opinions/2026-07-01-hwp-engine-not-llm-improvement-plan.md
```

이 문서는 다음을 확정한다.

- 현재 자격심사형 샘플 실패의 핵심 원인은 로컬 LLM이 아니라 HWP 작성 엔진임
- LLM을 분리하고 고정 JSON으로 엔진을 검증할 것
- HWPFrame.HwpObject COM timeout을 단계별로 진단할 것
- 실제 원본 HWP를 HWPX로 변환하고 관측 manifest를 만들 것
- 전체 문서보다 자격심사형 대표 한 페이지를 Template Fidelity Mode로 먼저 재현할 것
- 병합 셀을 논리 그리드 기반으로 다시 계산할 것

관련 기존 의견과 보고서도 함께 확인한다.

```text
docs/gpt-communication/opinions/2026-07-01-hwp-reference-templates-and-document-style-goal.md

docs/gpt-communication/reports/2026-07-01-hwp-reference-style-profiles.md

docs/gpt-communication/reports/2026-07-01-hwpx-minimal-native-table.md
```

현재 작업 기준 브랜치:

```text
feature/hwp-reference-style-profiles
```

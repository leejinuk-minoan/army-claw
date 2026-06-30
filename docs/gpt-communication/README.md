# GPT 소통 공간

이 폴더는 Army Claw 프로젝트를 진행하는 동안 GPT, Codex, 사용자가 같은 기준으로 진행 상황을 확인하기 위한 GitHub 공유 공간이다.

## 목적

- 매 작업 후 결과 보고서를 남긴다.
- 현재 브랜치, 커밋, 생성 산출물, 테스트 결과를 추적한다.
- 다음 작업자가 채팅 이력 없이도 이어서 작업할 수 있게 한다.
- 한컴오피스/HWPX, OpenClaw 전환, 로컬 LLM, 설치 패키지 작업의 의사결정과 제한사항을 보존한다.
- 사용자가 공유한 산출물에 대한 GPT의 검토 의견과 구현 우선순위를 Codex가 작업 전에 확인할 수 있게 한다.

## 운영 규칙

1. 작업을 수행한 뒤 `reports/` 아래에 보고서를 추가한다.
2. GPT가 산출물을 검토해 별도 기술 의견을 남긴 경우 `opinions/` 아래 문서를 작업 전에 읽는다.
3. 보고서와 의견 문서는 한글로 작성한다.
4. 보고서에는 브랜치, 커밋 SHA, 테스트 결과, 생성 파일 경로, 남은 제한사항을 포함한다.
5. Codex는 새 작업을 시작하기 전에 최신 보고서와 관련 GPT 의견을 읽고, 반영할 항목을 먼저 요약한다.
6. 민감한 사용자 문서, 한컴 설치 원본 템플릿, API 키, Ollama 모델 파일은 절대 커밋하지 않는다.
7. GitHub Issue 또는 Discussion을 나중에 사용할 수 있게 되면 이 폴더의 최신 보고서와 의견을 해당 공간에도 링크하거나 복사한다.

## 공유 문서 위치

작업 결과 보고서:

```text
docs/gpt-communication/reports/
```

GPT 검토 의견과 구현 우선순위:

```text
docs/gpt-communication/opinions/
```

## 현재 확인해야 할 GPT 의견

```text
docs/gpt-communication/opinions/2026-06-30-hwpx-document-rendering-engine-review.md
```

이 문서는 사용자가 한글 2024에서 확인한 baseline HWPX의 시각적 문제와 문서 표현 엔진 구현 우선순위를 정리한다. Codex는 HWPX 문서 표현 엔진 작업을 시작하기 전에 반드시 읽는다.

## 현재 기준

- 저장소: `leejinuk-minoan/army-claw`
- 주 작업 브랜치: `feature/hwpx-template-and-auto-documents`
- 로컬 후속 작업 브랜치: `feature/hwpx-worker-integration-and-native-table`
- 한컴 2024 호환성 보존 브랜치: `fix/hwpx-hancom-2024-compat`
- 기본 문서 언어: 한글

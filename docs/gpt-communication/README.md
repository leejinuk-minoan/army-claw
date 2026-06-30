# GPT 소통 공간

이 폴더는 Army Claw 프로젝트를 진행하는 동안 GPT, Codex, 사용자가 같은 기준으로 진행 상황을 확인하기 위한 GitHub 공유 공간이다.

## 목적

- 매 작업 후 결과 보고서를 남긴다.
- 현재 브랜치, 커밋, 생성 산출물, 테스트 결과를 추적한다.
- 다음 작업자가 채팅 이력 없이도 이어서 작업할 수 있게 한다.
- 한컴오피스/HWPX, OpenClaw 전환, 로컬 LLM, 설치 패키지 작업의 의사결정과 제한사항을 보존한다.

## 운영 규칙

1. 작업을 수행한 뒤 `reports/` 아래에 보고서를 추가한다.
2. 보고서는 한글로 작성한다.
3. 보고서에는 브랜치, 커밋 SHA, 테스트 결과, 생성 파일 경로, 남은 제한사항을 포함한다.
4. 민감한 사용자 문서, 한컴 설치 원본 템플릿, API 키, Ollama 모델 파일은 절대 커밋하지 않는다.
5. GitHub Issue 또는 Discussion을 나중에 사용할 수 있게 되면 이 폴더의 최신 보고서를 해당 공간에도 링크하거나 복사한다.

## 보고서 위치

```text
docs/gpt-communication/reports/
```

## 현재 기준

- 저장소: `leejinuk-minoan/army-claw`
- 주 작업 브랜치: `feature/hwpx-template-and-auto-documents`
- 한컴 2024 호환성 보존 브랜치: `fix/hwpx-hancom-2024-compat`
- 기본 문서 언어: 한글

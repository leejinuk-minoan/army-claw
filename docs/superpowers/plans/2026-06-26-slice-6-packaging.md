# Slice 6 - 패키징 구현 계획

**작성일:** 2026-06-26

## 목표

Army Claw v0.1 Core를 Windows 오프라인 설치 파일로 만들 수 있는 빌드 구조를 준비한다. Core 설치 파일은 앱 실행 파일과 웹 UI를 포함하고, Ollama와 `gemma3:12b` 모델은 별도 Local LLM 번들로 분리한다.

## 포함 범위

- React 정적 빌드를 FastAPI 패키지에서 제공할 수 있게 연결.
- 패키징 실행 진입점 추가.
- PyInstaller 기반 Core 실행 패키지 스크립트 추가.
- Inno Setup 기반 설치 파일 스크립트 추가.
- Local LLM 번들 분리 정책 문서화.
- 패키징 대상과 제외 대상을 `.gitignore`와 스크립트에 반영.

## 제외 범위

- Ollama 설치 파일과 모델 파일의 GitHub 저장.
- `gemma3:12b` 실제 모델 번들 생성.
- Microsoft Office 자동화 포함.
- 코드 서명 인증서 적용.
- 기업용 MSI/WiX 패키징.

## 구현 파일

- 수정: `backend/openclaw/main.py`
- 생성: `backend/openclaw/__main__.py`
- 생성: `scripts/package-core.ps1`
- 생성: `scripts/package-core.bat`
- 생성: `installer/army-claw-core.iss`
- 생성: `docs/local-llm-bundle.md`

## 검증 기준

- 백엔드가 `ARMY_CLAW_WEB_DIR`에 있는 `index.html`을 `/`에서 제공해야 한다.
- 백엔드 테스트가 통과해야 한다.
- React/Vite 빌드가 통과해야 한다.
- Inno Setup 컴파일러 경로를 인식해야 한다.
- Windows 실행 정책 우회를 위해 `scripts/package-core.bat`에서 `package-core.ps1`을 호출한다.
- PyInstaller가 설치된 환경에서는 `scripts/package-core.ps1`로 `release/army-claw-core`와 설치 파일을 만들 수 있어야 한다.
- 생성된 `ArmyClawCore.exe`가 `/api/status`와 `/`에 200 응답을 반환해야 한다.

## 현재 제한사항

- 현재 PC에 PyInstaller가 없으면 Core 실행 파일 생성은 PyInstaller 설치 후 가능하다.
- Inno Setup은 설치되어 있으며 `C:\Program Files (x86)\Inno Setup 6\ISCC.exe` 경로를 사용한다.
- Local LLM 번들의 실제 모델 파일은 아직 생성하지 않는다.
- 현재 PC에서는 PyInstaller 설치 Python과 앱 의존성 설치 Python이 달라 `ARMY_CLAW_APP_DEPENDENCY_PATH` 또는 Codex 런타임 site-packages를 임시 분석 경로로 사용할 수 있다. 정식 v0.1 빌드는 전용 오프라인 빌드 venv로 정리한다.

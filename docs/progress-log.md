# Army Claw 진행 로그

## 2026-06-27 - Local LLM 번들 웹 실행 연결

### 구현 내용

- 웹 UI에서 Local LLM 번들 검증/설치 스크립트를 실행할 수 있는 영역을 추가했다.
- 실행 전 `실행 승인` 체크박스를 요구하도록 했다.
- 백엔드에 `/api/local-llm/run` 엔드포인트를 추가했다.
- 백엔드는 임의 PowerShell 명령이 아니라 `verify-local-llm-bundle.ps1`, `install-local-llm-bundle.ps1`만 실행하도록 제한했다.
- 설치본에서도 동작하도록 Core 패키지와 Inno Setup 설치 파일에 Local LLM 스크립트를 포함했다.
- 구현 계획 문서 `docs/superpowers/plans/2026-06-27-local-llm-web-execution.md`를 추가했다.

### 이번 검증

- 신규 Local LLM 서비스 테스트 4개 통과.
- 백엔드 전체 테스트 37개 통과.
- React/Vite production build 통과.
- `scripts\package-core.bat` 실행 통과.
- 패키지 산출물 `release\army-claw-core\scripts`에 Local LLM 스크립트 2개 포함 확인.
- 패키징된 `ArmyClawCore.exe` smoke test 통과: `/api/status` 200, `/api/local-llm/run` 200.
- 패키징된 `ArmyClawCore.exe`에서 승인된 `verify` 실행 요청이 sibling `scripts\verify-local-llm-bundle.ps1`까지 도달함을 확인했다. 현재 PC에는 Ollama가 없어 returncode 1을 반환했다.

### 남은 사항

- 현재 PC에는 Ollama가 없어 실제 `gemma3:12b` 모델 검증/설치 실행은 아직 수행하지 못했다.
- Ollama와 모델 번들이 준비된 PC에서 UI 버튼으로 `빠른 검증`, `검증`, `번들 설치`를 실제 실행해 봐야 한다.

## 2026-06-27 - Local LLM 번들 스크립트 구현

### 구현 내용

- 준비망에서 Ollama 모델 번들을 생성하는 `scripts/export-local-llm-bundle.ps1`와 `.bat` 래퍼를 추가했다.
- 단독망에서 반입된 Ollama 모델 저장소를 설치하는 `scripts/install-local-llm-bundle.ps1`와 `.bat` 래퍼를 추가했다.
- 단독망 설치 후 파일 무결성, Ollama API, `gemma3:12b` 모델 존재, 기본 생성 응답을 확인하는 `scripts/verify-local-llm-bundle.ps1`와 `.bat` 래퍼를 추가했다.
- `docs/local-llm-bundle.md`를 실제 준비망 생성 절차, 단독망 설치 절차, 설치 후 검증 절차 중심으로 확장했다.
- 실제 Ollama 설치 파일과 모델 저장소가 GitHub에 올라가지 않도록 `.gitignore`에 Local LLM 대용량 산출물 제외 규칙을 추가했다.

### 이번 검증

- PowerShell 스크립트 문법 검사: 통과.
- 현재 PC에서 `ollama` 명령이 PATH에 없는 상태를 확인했다.
- `scripts\verify-local-llm-bundle.bat -Model gemma3:12b -SkipGenerate` 실행 시 `Ollama command was not found` 오류가 명확히 출력됨을 확인했다.

### 남은 사항

- Ollama가 설치된 준비망 PC에서 `ollama pull gemma3:12b` 후 `scripts\export-local-llm-bundle.bat -Model gemma3:12b -IncludeModelStore`를 실행해 실제 모델 번들을 생성해야 한다.
- Ollama 설치 파일 포함 여부와 보안 검수 절차를 확정해야 한다.
- 단독망과 동일한 Windows 계정/권한 조건에서 `install-local-llm-bundle.bat`와 `verify-local-llm-bundle.bat`를 검증해야 한다.
- 웹 UI에서 Local LLM Bundle 상태 표시와 재검증 버튼을 연결해야 한다.

## 2026-06-27 - 오프라인 빌드 venv 준비

### 구현 내용

- Core 빌드용 Python 의존성 목록 `requirements/build.txt`를 추가했다.
- 준비망에서 Python wheelhouse를 만드는 `scripts/export-python-wheels.ps1`를 추가했다.
- 단독망에서 wheelhouse만으로 `.build-venv`를 만드는 `scripts/bootstrap-build-env.ps1`를 추가했다.
- Windows 실행 정책 우회를 위한 `scripts/export-python-wheels.bat`과 `scripts/bootstrap-build-env.bat`를 추가했다.
- `scripts/package-core.ps1`가 `.build-venv\Scripts\python.exe`를 우선 사용하도록 수정했다.
- 임시 Codex 런타임 site-packages fallback을 사용할 때 경고를 출력하도록 수정했다.
- `.build-venv`와 `vendor/python-wheels/`가 GitHub에 올라가지 않도록 `.gitignore`에 추가했다.
- 오프라인 빌드 venv 전략 문서 `docs/offline-build-env.md`를 추가했다.
- wheelhouse 무결성 확인용 `scripts/write-wheelhouse-manifest.ps1`와 `scripts/write-wheelhouse-manifest.bat`를 추가했다.

### 남은 사항

- 단독망 반입 전 `vendor/python-wheels/`와 `vendor/python-wheels.sha256`를 함께 보안 검수해야 한다.
- 실제 단독망 PC에서 `.build-venv` 생성과 설치 파일 빌드를 한 번 더 검증해야 한다.

### 이번 검증

- PowerShell 스크립트 문법 검사: 통과.
- `scripts/bootstrap-build-env.bat` 실행 정책 우회 확인: 통과.
- wheelhouse 미존재 시 명확한 오류 안내: 통과.
- 백엔드 테스트 32개 통과.
- 현재 fallback 환경 기준 `scripts/package-core.bat` 빌드 통과.
- 패키징된 `ArmyClawCore.exe` smoke test 통과: `/api/status` 200, `/` 200.
- 준비망 역할로 `scripts/export-python-wheels.bat` 실행: 통과.
- `scripts/write-wheelhouse-manifest.bat` 실행: 통과, wheel 40개 SHA256 기록.
- `scripts/bootstrap-build-env.bat -Recreate`로 `.build-venv` 생성: 통과.
- `.build-venv` 기반 백엔드 테스트 32개 통과.
- `.build-venv` 기반 `scripts/package-core.bat` 빌드: 통과.
- PyInstaller가 `.build-venv` 환경을 사용함을 확인했고, 이전의 다른 Python site-packages 혼용 경고가 사라졌다.
- `.build-venv` 기반 설치 파일 설치 검증: 통과.
- 설치된 실행 파일 smoke test 통과: `/api/status` 200, `/` 200.

## 2026-06-27 - Core 설치 파일 검증

### 검증 내용

- `release/ArmyClawCoreSetup-0.1.0.exe`를 실제 Inno Setup 설치 파일로 실행했다.
- 한글 경로가 포함된 테스트 설치 경로 `C:\Users\USER\Desktop\로컬 open claw 만들기\.tmp\install-test\Army Claw`에 무인 설치했다.
- 설치된 `ArmyClawCore.exe`를 실행해 `/api/status`와 `/` 응답을 확인했다.
- 바탕화면 바로가기 task가 기본 선택되지 않도록 `installer/army-claw-core.iss`를 수정했다.
- 테스트 설치 후 언인스톨러로 설치 폴더, 시작 메뉴 바로가기, 언인스톨 항목이 정리되는지 확인했다.

### 검증 결과

- 설치 파일 실행: 통과.
- 한글 경로 설치: 통과.
- 설치 경로 실행 파일 smoke test: `/api/status` 200, `/` 200.
- 바탕화면 바로가기 기본 미생성: 통과.
- 테스트 설치 제거: 통과.

### 남은 사항

- 정식 v0.1 빌드 전에는 PyInstaller와 앱 의존성을 같은 오프라인 빌드 venv에 모아 빌드 경고를 제거한다.
- 설치 마법사 UI 문구와 아이콘은 별도 polish 단계에서 정리한다.

## 2026-06-26 - Slice 6 패키징 구현

### 구현 내용

- FastAPI가 React 정적 빌드 결과를 `/`에서 제공하도록 연결했다.
- 패키징 실행 진입점 `backend/openclaw/__main__.py`를 추가했다.
- Core 패키징 스크립트 `scripts/package-core.ps1`과 Windows 실행 정책 우회용 `scripts/package-core.bat`을 추가했다.
- Inno Setup 기반 설치 파일 스크립트 `installer/army-claw-core.iss`를 추가했다.
- Local LLM 번들 분리 전략 문서 `docs/local-llm-bundle.md`를 추가했다.
- Slice 6 구현 계획 문서 `docs/superpowers/plans/2026-06-26-slice-6-packaging.md`를 추가했다.

### 검증

- 백엔드 테스트 32개 통과.
- React/Vite production build 통과.
- PyInstaller 기반 `ArmyClawCore.exe` 생성 성공.
- Inno Setup 기반 `ArmyClawCoreSetup-0.1.0.exe` 생성 성공.
- 패키징된 `ArmyClawCore.exe` smoke test 통과: `/api/status` 200, `/` 200.

### 다음 단계

- 설치 파일 실행 후 실제 설치 경로에서 첫 실행 동작을 검증한다.
- 현재 PC에서는 PyInstaller가 설치된 Python과 앱 의존성이 설치된 Python이 달라 임시로 의존성 경로를 지정해 빌드했다. 정식 v0.1 빌드 전에는 전용 오프라인 빌드 venv로 정리한다.

## 2026-06-26 - Slice 5 한글/HWPX 도구

### 구현 내용

- HWPX 기본 도구를 추가했다.
- HWPX는 v0.1에서 ZIP/XML 문서로 직접 처리한다.
- `backend/openclaw/hwpx_tools.py`를 추가했다.
- `/api/hwpx/create` 엔드포인트를 추가했다.
- `/api/hwpx/summary` 엔드포인트를 추가했다.
- `/api/hwpx/add-paragraph` 엔드포인트를 추가했다.
- `/api/hwpx/compatibility` 엔드포인트를 추가했다.
- React 웹 UI에 한글/HWPX 도구 패널을 추가했다.
- Slice 5 계획 문서 `docs/superpowers/plans/2026-06-26-slice-5-hangul-hwpx-tools.md`를 추가했다.

### 검증

- 백엔드 전체 테스트: 31개 통과.
- React/Vite production build: 통과.

### 제한 사항

- 이번 HWPX 지원은 최소 ZIP/XML 처리다.
- 한컴 한글 앱에서의 완전한 서식 호환성은 별도 검증이 필요하다.
- 표, 이미지, 복잡한 스타일, legacy `.hwp` 변환, 한컴 한글 네이티브 자동화는 후속 고도화 대상으로 남긴다.

### 다음 단계

- Slice 6 패키징 설계와 구현으로 이동한다.
- Windows용 Army Claw Core 설치 파일과 별도 Local LLM 번들 패키징 전략을 실제 빌드 스크립트로 옮긴다.

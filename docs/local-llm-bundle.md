# Local LLM 번들 설계 및 작업 절차

## 목적

Army Claw Core 설치 파일에는 Ollama와 모델을 포함하지 않는다. Local LLM 번들은 단독망에 별도로 반입되는 선택 구성요소이며, `gemma3:12b`를 기본 모델로 한다.

## v0.1 번들 구성

- Ollama Windows 런타임.
- `gemma3:12b` 모델 파일.
- 모델 등록/검증 스크립트.
- 번들 무결성 확인용 해시 파일.
- 오프라인 설치 안내 문서.

## 저장소에 포함되는 파일

- `scripts/export-local-llm-bundle.ps1`: 준비망 PC에서 Local LLM 번들을 생성한다.
- `scripts/install-local-llm-bundle.ps1`: 단독망 PC에서 번들에 포함된 Ollama 모델 저장소를 설치한다.
- `scripts/verify-local-llm-bundle.ps1`: 번들 해시, Ollama API, 모델 존재, 기본 생성 응답을 검증한다.
- 각 PowerShell 스크립트와 같은 이름의 `.bat` 파일: 실행 정책 문제를 줄이기 위한 Windows 실행 래퍼다.

실제 Ollama 설치 파일, 모델 저장소, GGUF/GGML/safetensors/bin 계열 대용량 모델 파일은 GitHub에 올리지 않는다.

## Core와 분리하는 이유

- 단독망 OpenAI 호환 API만 사용하는 환경에는 Ollama가 필요 없다.
- 모델 파일 크기가 크므로 Core 설치 파일을 작게 유지한다.
- 모델 업데이트와 Core 업데이트 주기를 분리할 수 있다.
- 보안 검수 시 앱 실행 파일과 모델 자산을 따로 검토할 수 있다.

## v0.1 반입 절차

1. 인터넷망 또는 승인된 준비망에서 Ollama와 `gemma3:12b` 모델 번들을 만든다.
2. 해시 파일을 생성한다.
3. 보안 검수 후 단독망으로 반입한다.
4. 단독망 PC에서 Local LLM 번들을 설치한다.
5. Army Claw Core의 Provider 설정을 `Local LLM Bundle`로 선택한다.
6. Health Check로 Ollama 연결, 모델 존재, 기본 응답 가능 여부를 확인한다.

## 준비망 번들 생성 절차

준비망 PC에는 Ollama가 설치되어 있어야 하며, `ollama` 명령이 PATH에서 실행되어야 한다.

```powershell
ollama pull gemma3:12b
scripts\export-local-llm-bundle.bat -Model gemma3:12b -IncludeModelStore
```

Ollama 설치 파일도 같은 번들에 포함하려면 다음처럼 실행한다.

```powershell
scripts\export-local-llm-bundle.bat -Model gemma3:12b -IncludeModelStore -OllamaInstaller "C:\path\to\OllamaSetup.exe"
```

기본 산출물 위치는 `local-llm-bundle` 폴더다. 이 폴더는 대용량 산출물이므로 GitHub 저장 대상이 아니다.

## 단독망 설치 절차

반입한 `local-llm-bundle` 폴더에서 다음 명령을 실행한다.

```powershell
scripts\install-local-llm-bundle.bat -Model gemma3:12b
```

Ollama 설치 파일을 번들에 포함했고, 단독망 PC에 Ollama가 아직 설치되어 있지 않다면 다음처럼 실행한다.

```powershell
scripts\install-local-llm-bundle.bat -Model gemma3:12b -InstallOllama
```

설치 스크립트는 기본적으로 `%USERPROFILE%\.ollama\models`에 모델 저장소를 복사한다. 별도 모델 경로를 사용하는 환경에서는 `-OllamaModelsRoot` 값을 지정한다.

## 설치 후 검증

Ollama가 실행 중인 상태에서 다음 명령을 실행한다.

```powershell
scripts\verify-local-llm-bundle.bat -Model gemma3:12b
```

검증 항목은 다음과 같다.

- `manifests\bundle.sha256` 기준 파일 무결성.
- `ollama` 명령 존재 여부.
- `http://127.0.0.1:11434/api/tags`에서 `gemma3:12b` 모델 확인.
- `/api/generate` 기본 응답 확인.

생성 테스트를 생략하고 모델 존재까지만 확인하려면 다음처럼 실행한다.

```powershell
scripts\verify-local-llm-bundle.bat -Model gemma3:12b -SkipGenerate
```

## GitHub 저장 정책

- 모델 파일과 Ollama 설치 파일은 GitHub 저장소에 올리지 않는다.
- GitHub에는 번들 구조, 설치 절차, 검증 스크립트만 저장한다.
- 실제 번들은 릴리스 산출물 또는 별도 오프라인 배포 매체로 관리한다.

## 후속 작업

- 실제 준비망 PC에서 `gemma3:12b` 번들 생성 테스트.
- 단독망과 동일한 Windows 계정/권한 조건에서 모델 저장소 복사 테스트.
- Ollama 설치 파일 반입 정책 확정.
- Army Claw Web UI에서 Local LLM Bundle 상태 표시와 재검증 버튼 연결.

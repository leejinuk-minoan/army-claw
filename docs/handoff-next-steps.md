# Army Claw 핸드오프 노트

최종 갱신일: 2026-06-27

## 프로젝트 위치

프로젝트 루트는 다음 폴더를 사용한다.

```text
C:\Users\USER\Desktop\로컬 open claw 만들기
```

## 확정된 결정

- 제품명: Army Claw.
- 사용자에게 제시하는 문서와 핸드오프 노트는 별도 요청이 없는 한 한글로 작성한다.
- 대상 환경: 단독망 안의 오프라인 로컬 PC.
- v0.1 스택: FastAPI 백엔드 + React(Vite) 프론트엔드.
- 로컬 LLM 번들 런타임: Ollama 우선.
- Ollama는 Army Claw Core 설치 파일이 아니라 Local LLM 번들에 포함한다.
- 기본 모델: `gemma3:12b`.
- 저사양 fallback 후보: `llama3.1:8b`.
- 중국 LLM 모델과 중국 기관 모델은 제외한다.
- 배포 형식: 완전 패키징된 오프라인 Core 설치 파일 + 별도 Local LLM 번들.
- v0.1 패키징 도구: PyInstaller + Inno Setup.
- Army Claw Core 설치 파일과 Local LLM 번들은 분리한다.
- Army Claw Core에는 단독망 OpenAI 호환 API 설정 기능을 포함한다.
- LLM Provider 인터페이스는 교체 가능해야 한다.
- 추후 llama.cpp, 단독망 LLM API, 승인된 다른 런타임을 붙일 수 있어야 한다.
- 기본 작업공간 권한 모드는 Project Folder Restricted다.
- 사용자는 필요 시 Approved Folder Expansion 또는 임시 Full PC Elevated Session으로 권한을 올릴 수 있다.
- Full PC Elevated Session 기본 시간 제한은 1시간이다.
- v0.1 범위에는 코딩, XLSX, PPTX, HWPX가 포함된다.
- v0.1 XLSX 범위에는 함수, 차트, 피벗 테이블 지원이 포함된다.
- v0.1 PPTX 범위에는 복잡한 프레젠테이션 디자인 워크플로우가 포함된다.
- v0.1 프레젠테이션 범위에는 한쇼 `.show` 호환성이 포함된다.
- v0.1 한글 문서 대상은 legacy HWP가 아니라 HWPX다.
- 대상 오피스 환경은 한컴오피스 설치 환경이다. Microsoft Office는 v0.1에서 필요하지 않아야 한다.
- v0.1 오피스 앱 가정: 한셀, 한쇼, 한글/HWPX.
- v0.2에서는 Excel, PowerPoint, Word를 포함한 Microsoft Office 환경 지원을 추가한다.
- v0.2에서는 인터넷망의 ChatGPT, Codex, Claude 등에서 작성한 skill을 단독망으로 반입해 등록/검증/활용하는 기능을 검토한다.
- v0.2의 skill 기능은 우선 fine-tuning이 아니라 로컬 skill 저장소, 검색, context injection, 작업 계획 보정, 적용 로그 중심으로 설계한다.
- skill 반입의 목적은 모델 가중치를 즉시 바꾸는 것이 아니라, 관련 업무 지식/절차를 작업 컨텍스트에 넣어 모델이 원래 약하던 업무를 더 잘 수행하게 만드는 것이다.

## v0.1 의도 아키텍처

```text
React Web UI
  -> FastAPI Agent Server
  -> Agent Core
  -> LLM Provider Interface
      -> v0.1 OllamaProvider for gemma3:12b
      -> 추후 InternalApiModelProvider
  -> Tool Executor
      -> 파일 도구
      -> 코드 도구
      -> PowerShell 도구
  -> Permission Manager
  -> Workspace Manager
  -> Task/Audit Logs
```

## 다음 설계/구현 결정

1. Ollama가 설치된 준비망 PC에서 `gemma3:12b` 실제 번들 생성을 검증한다.
2. 웹 UI의 `빠른 검증`, `검증`, `번들 설치` 버튼으로 실제 Local LLM 번들 설치/검증 절차를 검증한다.
3. 단독망과 동일한 Windows 권한 조건에서 Local LLM 번들 설치/검증 절차를 검증한다.
4. Ollama 설치 파일 반입 정책과 보안 검수 절차를 확정한다.
5. v0.2 skill 반입 번들 형식과 보안 검수 절차를 구체화한다.

## v0.1 구현 순서

1. 코어 앱 골격과 모델 연결. 구현 완료.
2. 안전한 코딩 도구. 구현 완료.
3. 한셀/XLSX 도구. 기본 XLSX 직접 처리 구현 완료.
4. 한쇼/PPTX/.show 도구. 기본 PPTX 직접 처리와 `.show` 호환성 안내 구현 완료.
5. 한글/HWPX 도구. 기본 HWPX 직접 처리 구현 완료.
6. Core 패키징. PyInstaller + Inno Setup 설치 파일 빌드/검증 완료.
7. 오프라인 빌드 venv. wheelhouse 생성, `.build-venv` 생성, `.build-venv` 기반 빌드/검증 완료.
8. Local LLM 번들. 생성/설치/검증 스크립트 구현 완료, 실제 Ollama 설치 PC 검증 필요.
9. Local LLM 웹 실행. 승인 기반 UI/API 연결과 패키징 포함 완료, 실제 Ollama 설치 PC 검증 필요.

## 패키징 결정

- PyInstaller로 Python/FastAPI 백엔드를 로컬 실행 파일로 패키징한다.
- Inno Setup으로 v0.1 Windows 설치 파일을 만든다.
- 기업 배포에서 MSI가 필요해지면 WiX/MSI를 추후 검토한다.

## 권장 다음 구현 단계

현재 권장 다음 단계는 실제 Ollama 설치 PC에서 Local LLM 번들 생성과 UI 기반 검증을 수행하는 것이다.

- `ollama pull gemma3:12b` 후 준비망 번들을 생성한다.
- Army Claw Core 웹 UI에서 `실행 승인`을 체크하고 `빠른 검증`을 먼저 실행한다.
- 모델 응답까지 확인해야 하면 `검증`을 실행한다.
- 단독망 반입 테스트에서는 `번들 설치` 버튼으로 모델 저장소 복사를 확인한다.
- Ollama 설치 파일 실행은 보안 검수 정책이 확정된 뒤 `설치 시 Ollama 설치 파일 실행` 체크박스를 사용한다.

실제 모델 번들 검증 명령:

```powershell
ollama pull gemma3:12b
scripts\export-local-llm-bundle.bat -Model gemma3:12b -IncludeModelStore
scripts\verify-local-llm-bundle.bat -Model gemma3:12b
```

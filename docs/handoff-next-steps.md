# Army Claw 핸드오프 노트

최종 갱신일: 2026-06-26

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

1. 첫 프로젝트 스캐폴드 정의.
2. Windows 오프라인 Core 설치 파일용 Inno Setup 세부 패키징 경로 정의.
3. Ollama + `gemma3:12b`용 Local LLM 번들 형식 정의.
4. 단독망 OpenAI 호환 API 모드 설정 스키마 정의.
5. v0.2 skill 반입 번들 형식과 보안 검수 절차 정의.

## v0.1 구현 순서

1. 코어 앱 골격과 모델 연결.
2. 안전한 코딩 도구.
3. 한셀/XLSX 도구. 기본 XLSX 직접 처리 구현 완료.
4. 한쇼/PPTX/.show 도구. 기본 PPTX 직접 처리와 `.show` 호환성 안내 구현 완료.
5. 한글/HWPX 도구.
6. 패키징.

## 패키징 결정

- PyInstaller로 Python/FastAPI 백엔드를 로컬 실행 파일로 패키징한다.
- Inno Setup으로 v0.1 Windows 설치 파일을 만든다.
- 기업 배포에서 MSI가 필요해지면 WiX/MSI를 추후 검토한다.

## 권장 다음 구현 단계

최소 스캐폴드부터 시작한다.

- `backend/` FastAPI 앱.
- `frontend/` React(Vite) 앱.
- `config/` 기본 로컬 설정.
- `docs/` 설계와 진행 문서.
- Health check API.
- 앱 상태 확인.
- Ollama 연결 확인.
- `gemma3:12b` 존재 확인.
- 설정된 경우 단독망 OpenAI 호환 API 연결 확인.
- 간단한 생성 지연 시간 테스트.
- 가능하면 대략적인 tokens/sec 측정.

초기 도구군:

- 코딩 도구.
- 함수, 차트, 피벗을 지원하는 XLSX 도구.
- 더 풍부한 레이아웃/디자인과 `.show` 호환성을 고려한 PPTX 도구.
- HWPX 도구.
- 한컴오피스 사용 가능 여부 감지.

처음부터 무제한 PC 제어를 구현하지 않는다. 읽기 전용 또는 사용자 승인 기반 작업공간 도구부터 시작한다.

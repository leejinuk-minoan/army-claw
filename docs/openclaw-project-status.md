# Army Claw 프로젝트 진행 현황

최종 갱신일: 2026-06-27

## 프로젝트 목표

Army Claw는 단독망 환경에서 100% 오프라인으로 동작하는 로컬 AI 에이전트다. 첫 버전은 사용자의 로컬 PC에서 실행되며, 웹 UI를 통해 코딩 업무와 한컴오피스 중심의 일반 PC 업무를 수행할 수 있어야 한다.

추후 버전에서는 단독망 내부에 이미 구축된 OpenAI 호환 LLM API를 입력해 사용할 수 있어야 한다. 이 경우 로컬 PC는 실제 파일/문서/명령 실행을 담당하고, LLM 추론은 단독망 내부 서버가 담당할 수 있다.

## 현재 확정 방향

- v0.1은 오프라인 로컬 에이전트로 만든다.
- UI는 React 기반 웹 UI로 만든다.
- 앱 스택은 FastAPI + React(Vite)로 한다.
- 배포는 Army Claw Core 설치 파일과 Local LLM 번들을 분리한다.
- v0.1은 코딩과 한컴오피스 기반 업무를 함께 지원한다.
- v0.1의 실행은 사용자 PC에서 이뤄진다.
- 외부 클라우드 API와 공용 인터넷 의존성은 배제한다.
- 중국 모델과 중국 기관 모델은 사용하지 않는다.
- v0.1 기준 오피스 환경은 Microsoft Office가 아니라 한컴오피스 설치 환경이다.
- 단독망 내부 OpenAI 호환 API를 설정해 사용할 수 있도록 LLM 계층을 분리한다.
- v0.1 기본 로컬 모델은 `gemma3:12b`다.
- 사용자에게 제시하는 문서, 계획서, 핸드오프 노트, 진행 요약은 별도 요청이 없는 한 한글로 작성한다.
- Local LLM 번들은 준비망에서 생성하고 단독망으로 반입하는 별도 산출물로 관리한다.

## 버전 로드맵

### v0.1 - 로컬 오프라인 에이전트 MVP

목표: Army Claw가 로컬에서 실행되고, 웹 UI를 통해 코딩과 핵심 오피스 문서 업무를 수행할 수 있음을 증명한다.

포함 기능:

- `gemma3:12b` 기반 로컬 LLM 연결.
- React 기반 웹 채팅/작업 UI.
- 작업공간 파일 읽기/쓰기.
- 코드 검색과 코드 수정.
- 사용자 승인 기반 PowerShell 명령 실행.
- XLSX 읽기, 분석, 수정, 함수 작성, 차트 생성, 피벗 테이블 지원.
- Microsoft Excel이 없고 한셀이 있는 환경을 기준으로 XLSX 워크플로우를 설계한다.
- PPTX 생성과 수정.
- 복잡한 프레젠테이션 디자인 워크플로우를 첫 버전에 포함한다.
- Microsoft PowerPoint가 없고 한쇼가 있는 환경을 기준으로 프레젠테이션 워크플로우를 설계한다.
- 한쇼 `.show` 호환성을 프레젠테이션 범위에 포함하되, 1차 편집 포맷은 PPTX로 둔다.
- 한글 문서 포맷은 HWPX를 v0.1 기준으로 한다.
- 기본 권한 정책.
- 위험 명령 차단.
- 작업 로그 저장.
- 모델 추론과 도구 실행의 명확한 분리.

### v0.2 - 오피스 자동화 확장

목표: v0.1의 오피스 자동화 기반을 더 깊고 안정적으로 확장한다.

포함 기능:

- HWPX 고급 워크플로우와 호환성 강화.
- 필요 시 legacy HWP 전략 수립.
- `.show` 고급 호환성과 한쇼 네이티브 자동화 전략.
- Microsoft Office 환경 지원 추가.
- Excel, PowerPoint, Word 호환/자동화 지원.
- DOCX와 PDF 처리.
- 폴더 정리.
- 결과물 요약과 생성 산출물 추적.
- 반복 보고서, 발표자료, 스프레드시트 업무용 템플릿.
- 외부 인터넷망의 ChatGPT, Codex, Claude 등에서 작성한 skill을 단독망으로 반입해 등록/검증/활용하는 기능.
- 반입된 skill을 로컬 skill 저장소에 등록하고, 작업 시 검색/참조할 수 있게 하는 skill knowledge 기능.

### v0.2 - Skill 반입 및 활용 기능 검토

목표: 인터넷망에서 만든 업무 지식과 절차를 단독망 Army Claw에 안전하게 반입해 사용할 수 있게 한다.

기본 방향:

- 인터넷망에서 작성한 skill은 파일 번들 형태로 내보낸다.
- 단독망으로 반입하기 전 보안 검수와 무결성 검증을 수행한다.
- Army Claw는 반입된 skill을 로컬 skill 저장소에 등록한다.
- 등록된 skill은 에이전트가 작업 계획, 도구 사용 절차, 문서 작성 규칙, 업무별 체크리스트로 참조한다.
- v0.2의 1차 목표는 LLM 가중치 자체를 학습시키는 fine-tuning이 아니라, 반입된 skill을 검색해 작업 컨텍스트에 주입함으로써 모델이 원래 잘 못하던 특정 업무를 더 잘 수행하게 만드는 것이다.
- skill 반입 후에는 사용자 요청과 관련된 skill을 찾아 프롬프트/작업 계획/도구 실행 절차에 반영한다.
- skill은 모델의 영구 기억이 아니라 작업 시점에 검색되어 적용되는 업무 지식/절차 자산으로 취급한다.

포함 후보:

- Skill bundle import.
- Skill manifest 검증.
- 금지 명령/위험 경로/외부 URL 포함 여부 검사.
- skill 버전, 출처, 작성 도구, 반입 일시 기록.
- 로컬 검색 인덱스 생성.
- 작업 중 관련 skill 추천.
- 관련 skill을 작업 컨텍스트에 삽입하는 context injection.
- skill 기반 작업 계획 보정.
- skill 적용 이력 로그.

보류 또는 v0.3 이후 검토:

- skill 기반 로컬 fine-tuning.
- 대량 skill corpus로 모델 재학습.
- 자동 코드 실행 권한을 포함한 skill.
- skill 사용 로그 기반 성능 평가.
- 승인된 skill corpus 기반 LoRA/fine-tuning.

안전 원칙:

- 반입된 skill은 지침과 지식으로만 취급한다.
- skill이 명령 실행 권한을 직접 부여할 수 없게 한다.
- 외부 URL, API 키, 인증 정보, 실행 파일 포함 여부를 검수한다.
- 단독망 내부 정책에 맞는 승인 절차를 거친 skill만 활성화한다.

### v0.3 - 에이전트 안정화

목표: 로컬 에이전트를 더 안전하고 예측 가능하게 만든다.

포함 기능:

- 안정적인 도구 호출 JSON 스키마.
- 실패 복구 루프.
- 프로젝트별 설정.
- 모델 설정 프로필.
- 감사 로그.
- 더 세분화된 권한 규칙.
- 확장된 벤치마크/진단 대시보드.

### v1.0 이후 - 단독망 LLM API 지원

목표: 단독망 내부의 더 강한 LLM 서버를 OpenAI 호환 API로 연결해 사용할 수 있게 한다.

포함 기능:

- `LocalModelProvider`.
- `OllamaProvider`.
- `LlamaCppProvider`.
- `OpenAICompatibleProvider`.
- `CustomHttpProvider`.
- `InternalApiModelProvider`.
- 단독망 OpenAI 호환 API endpoint 입력/검증 UI.
- timeout, retry, fallback 정책.

## 초기 아키텍처

```text
React Web UI
  -> 개발 중에는 Vite 사용
  -> 로컬/패키지 실행 시 FastAPI가 정적 빌드 제공
  -> Agent Core
  -> LLM Provider Interface
      -> v0.1 로컬 LLM Provider
      -> 추후 단독망 내부 API Provider
  -> Tool Executor
      -> 파일 도구
      -> 코드 도구
      -> PowerShell 도구
      -> 오피스 문서 도구
  -> Permission Manager
  -> Workspace Manager
  -> Task/Audit Logs
```

## v0.1 구현 순서

v0.1의 범위가 넓으므로 기능을 slice 단위로 나눠 구현한다.

### Slice 1 - 코어 앱 골격과 모델 연결

목표: 최소 실행 가능한 Army Claw 앱 껍데기를 만든다.

- FastAPI 백엔드 스캐폴드.
- React(Vite) 프론트엔드 스캐폴드.
- 로컬 설정 파일 구조.
- LLM Provider 인터페이스.
- 로컬 LLM 번들 경로를 위한 `OllamaProvider` 골격.
- 단독망 API 모드를 위한 `OpenAICompatibleProvider` 골격.
- Provider 선택 설정 UI.
- Health check API와 UI.
- 앱 실행 상태 확인.
- 활성 Provider 표시.
- 로컬 모드에서 Ollama 연결 확인.
- 로컬 모드에서 `gemma3:12b` 모델 존재 확인.
- API 모드에서 단독망 OpenAI 호환 API 연결 확인.
- 짧은 생성 테스트.
- 간단한 응답 지연 시간 측정.
- 가능하면 대략적인 tokens/sec 측정.
- 첫 구현 slice에는 full benchmark 대시보드를 넣지 않는다.

### Slice 2 - 안전한 코딩 도구

목표: Mode A 권한 안에서 유용한 코딩 작업을 가능하게 한다.

- 작업공간 선택.
- 파일 트리 읽기.
- 작업공간 내부 파일 읽기/쓰기.
- 텍스트/코드 검색.
- 쓰기 전 diff preview.
- PowerShell 명령 제안 및 승인 흐름.
- 작업/감사 로그.

### Slice 3 - 한셀/XLSX 도구

목표: Microsoft Excel 없이 스프레드시트 워크플로우를 지원한다.

- XLSX 읽기/쓰기.
- 표 감지와 요약.
- 함수 생성.
- 차트 생성.
- 파일 포맷 도구가 허용하는 범위의 피벗 테이블 지원.
- 한셀 설치/사용 가능 여부 감지.

### Slice 4 - 한쇼/PPTX/.show 도구

목표: 한컴오피스 환경에서 프레젠테이션 워크플로우를 지원한다.

- PPTX 생성과 수정.
- 더 풍부한 레이아웃/디자인 워크플로우.
- `.show` 호환 경로.
- 한쇼 설치/사용 가능 여부 감지.

### Slice 5 - 한글/HWPX 도구

목표: HWPX 우선으로 한글 문서 워크플로우를 지원한다.

- HWPX 읽기.
- HWPX 생성.
- HWPX 수정.
- 한글 설치/사용 가능 여부 감지.

### Slice 6 - 패키징

목표: 오프라인 배포 산출물을 준비한다.

- Windows Army Claw Core 설치 파일.
- FastAPI 백엔드를 PyInstaller로 패키징.
- Windows 설치 파일은 Inno Setup으로 빌드.
- Ollama + `gemma3:12b`용 별도 Local LLM 번들.
- 오프라인 검증 흐름.
- 설치 시점 및 첫 실행 검증.
- 기업 배포에서 MSI가 필요해질 경우 v1.0 이후 WiX/MSI 검토.

## v0.1 확정 스택

- 백엔드: FastAPI.
- 프론트엔드: React + Vite.
- 개발 모드: FastAPI와 Vite를 분리 실행해 UI 반복 개발 속도를 확보한다.
- 로컬/오프라인 실행 모드: React 앱을 빌드한 뒤 FastAPI가 정적 파일로 제공한다.
- 에이전트 도구의 주 구현 언어: Python.

선정 이유:

- FastAPI는 로컬 에이전트 API, 스트리밍 응답, 파일 작업, Python 기반 문서 도구와 잘 맞는다.
- React는 채팅, 작업 상태, 승인 UI, 로그, 설정, 산출물 보기처럼 커질 UI를 관리하기 좋다.
- Vite는 React 개발 속도를 높이면서도 오프라인 실행용 정적 빌드를 만들기 쉽다.

## 오프라인 배포 전략

- 배포 형식: 완전 패키징된 Army Claw Core 설치 파일 + 별도 Local LLM 번들.
- v0.1 패키징 도구: PyInstaller + Inno Setup.
- 사용자는 Army Claw Core 설치 파일을 설치한 뒤, Local LLM 번들 또는 단독망 OpenAI 호환 API 중 하나를 선택해 인터넷 없이 실행한다.

Core 설치 파일 포함 항목:

- Army Claw 백엔드 패키지.
- React 정적 UI 빌드.
- Python 런타임 또는 패키징된 Python 실행 파일.
- 필요한 Python 의존성.
- 필요한 프론트엔드 빌드 산출물.
- LLM Provider 인터페이스.
- OpenAI 호환 API 설정 UI.
- 로컬 모델/런타임 검증 흐름.
- 시작 메뉴/바탕화면 바로가기 또는 이에 준하는 실행 스크립트.

Core 설치 파일 미포함 항목:

- Ollama 런타임.
- `gemma3:12b` 모델 파일.

모델 패키징 정책:

- Ollama와 `gemma3:12b`는 별도 승인된 Local LLM 번들로 함께 패키징한다.
- Army Claw는 첫 사용 전에 로컬 모델 존재 여부를 검증해야 한다.
- Army Claw는 오프라인 환경에서 모델을 가져오고 등록하는 절차를 명확히 안내해야 한다.

패키징 결정:

- Army Claw Core 설치 파일과 `gemma3:12b` 모델 번들을 분리한다.
- Ollama는 Army Claw Core 설치 파일이 아니라 Local LLM 번들에 포함한다.
- LLM Provider 인터페이스는 교체 가능하게 유지해 추후 llama.cpp, 단독망 API, 승인된 다른 로컬 런타임으로 바꿀 수 있게 한다.
- Core 설치 파일은 앱을 설치하고, 사용자가 Local LLM Bundle 모드 또는 Internal OpenAI-compatible API 모드를 선택할 수 있게 한다.
- Local LLM 번들은 오프라인 환경으로 별도 반입, 승인, 등록할 수 있게 한다.

선정 이유:

- 패키징된 설치 파일은 단독망의 비개발자 사용자에게 더 쉽다.
- Python, Node, 모델 설정을 수동으로 다루는 실수를 줄인다.
- 반복 가능한 배포 경로를 만든다.
- 대신 v0.1 패키징 복잡도는 올라간다.
- 모델 번들을 분리하면 설치 파일 크기를 관리하기 쉽고 모델 업데이트도 쉬워진다.
- Ollama를 Local LLM 번들로 옮기면 단독망 API만 쓰는 환경에서 불필요한 런타임 의존성이 생기지 않는다.
- PyInstaller는 Python/FastAPI 런타임을 로컬 실행 파일로 묶기에 적합하다.
- Inno Setup은 v0.1 Windows `.exe` 설치 파일 제작에 현실적이다.
- 기업 배포 정책상 MSI가 필요해지면 추후 WiX/MSI를 다시 검토한다.

## 단독망 OpenAI 호환 API 설정

Army Claw는 단독망 API 사용을 위한 설정 화면을 포함해야 한다.

필수 입력 항목:

- Provider mode: Local LLM Bundle 또는 Internal OpenAI-Compatible API.
- API base URL. 예: `http://llm.internal.local:8000/v1`.
- 모델명.
- API key 또는 token. 단독망 배포 방식에 따라 선택.
- timeout 및 retry 설정.

검증 동작:

- 설정된 endpoint 연결 테스트.
- API가 지원하면 선택 모델 목록 확인 또는 모델명 검증.
- 에이전트 작업을 활성화하기 전 짧은 생성 테스트.
- 인증 정보는 로컬에 저장하고 설정된 endpoint 밖으로 보내지 않는다.
- 도구 실행 작업 전에 현재 활성 Provider를 명확히 표시한다.

## v0.1 확정 모델

- 기본 모델: `gemma3:12b`.
- 런타임 대상: Local LLM 번들의 Ollama 우선.
- 모델 제한: 중국 LLM 모델과 중국 기관 모델 제외.
- 저사양 fallback 후보: `llama3.1:8b`.
- 코딩 특화 추후 후보: `codestral:22b` 또는 `starcoder2`. 단, 라이선스와 오프라인 배포 검토 필요.

선정 이유:

- `gemma3:12b`는 중국 모델 계열이 아니다.
- 일반 대화, 오피스 업무, 요약, 중간 수준 코딩 보조에 실용적인 기본값이다.
- 너무 큰 모델로 시작하는 것보다 v0.1 로컬 실행 가능성이 높다.
- Ollama는 로컬 모델 서빙과 모델 교체가 단순하다.

제외 모델 기록:

- GLM-5.2는 기술적으로 로컬 배포 가능한 모델로 검토했지만, 중국/Z.ai 모델이므로 Army Claw의 모델 제한과 충돌해 제외한다.

## v0.1 하드웨어 기준

`gemma3:12b` 기준 최소 지원 목표:

- OS: Windows 10/11 64-bit.
- RAM: 32 GB.
- GPU: NVIDIA RTX 3060 12 GB급 이상.
- VRAM: 12 GB.
- CPU: 6코어 이상.
- 저장공간: SSD 여유 30 GB.

권장 목표:

- RAM: 64 GB.
- GPU: NVIDIA RTX 4070 Ti, RTX 4080, RTX 3090, RTX 4090 또는 유사 성능.
- VRAM: 16 GB 이상, 무거운 작업은 24 GB 권장.
- CPU: 8코어 이상.
- 저장공간: SSD 여유 50 GB.

저사양 정책:

- CPU-only 실행은 가능하지만 기본 지원 경로가 아니라 실험적/저속 모드로 둔다.
- `gemma3:12b`가 너무 느리거나 로드 실패하면 `llama3.1:8b` 전환을 제안한다.
- v0.1에는 모델 health check를 넣어 Ollama, 모델 존재, 응답 지연 시간, 기본 생성 가능 여부를 작업 전 확인한다.
- v0.1 health check는 간단한 생성 지연 시간과 가능 시 대략적인 tokens/sec를 포함한다.
- full benchmark/dashboard는 이후 안정화/진단 단계로 미룬다.

## 설계 원칙

- 사용자에게 제시하는 문서, 계획서, 핸드오프 노트, 진행 요약은 명시 요청이 없는 한 한글로 작성한다.
- 오프라인 우선.
- 로컬 실행 우선.
- 중국 LLM 모델은 지원/추천 모델에서 제외.
- 웹 UI를 처음부터 포함.
- 도구 실행은 LLM 서버가 아니라 사용자 PC의 Army Claw 에이전트가 수행.
- LLM Provider는 교체 가능해야 한다.
- 작은 MVP에서 시작해 오피스 자동화를 확장.
- GUI 자동화보다 구조화된 파일/문서 API를 우선.
- 파일/API 방식이 안정적으로 불가능할 때만 GUI 자동화 사용.
- 위험 작업은 사용자 승인을 요구.
- 에이전트가 수행한 작업과 이유를 기록.

## 작업공간 권한 모델

기본 모드:

- Project Folder Restricted 모드로 시작한다.
- Army Claw는 사용자가 선택한 작업공간 폴더 안에서만 읽기/쓰기를 할 수 있다.
- 명령 실행은 작업공간을 기본 working directory로 한다.
- 작업공간 밖 접근은 사용자가 권한 모드를 명시적으로 올리지 않는 한 차단한다.

### Mode A - Project Folder Restricted

- 기본 모드.
- 읽기/쓰기 접근은 활성 작업공간으로 제한.
- 코딩 작업과 안전한 문서 생성에 적합.

### Mode B - Approved Folder Expansion

- 사용자가 작업 중 특정 폴더를 추가 허용할 수 있다.
- 추가 폴더마다 권한 범위를 지정해야 한다.
- 권한 범위: read-only, read/write, command execution 허용/차단.
- 폴더 권한은 UI에 표시되고 언제든 취소 가능해야 한다.
- Desktop, Documents, 프로젝트 드라이브, 공유 폴더를 다루는 실제 업무에 적합.

### Mode C - Full PC Elevated Session

- 사용자의 명시적 동작으로만 활성화된다.
- 기본 모드가 아니다.
- 임시 모드이며 UI에 명확히 표시되어야 한다.
- 사유, 기본 1시간 제한, 종료 시 작업 요약이 필요하다.
- 1시간 만료 전 사용자에게 경고한다.
- 사용자가 명시적으로 연장하지 않으면 만료 시 자동으로 Mode A로 복귀한다.
- 위험 작업은 여전히 차단하거나 재확인을 요구한다.
- 폴더별 승인 방식이 지나치게 제한적인 예외 워크플로우에만 사용한다.

항상 명시적 확인이 필요한 작업:

- 파일 삭제.
- 대량 이동, 이름 변경, 덮어쓰기.
- PowerShell 명령 실행.
- 외부 프로세스 시작.
- 활성 작업공간 밖 쓰기.
- Windows, Program Files, 사용자 인증 저장소, 브라우저 프로필, SSH 키, API 키 파일 등 민감 경로 접근.

권한 UI 요구사항:

- 현재 모드를 항상 표시.
- 부여된 폴더와 권한 범위를 표시.
- 상승 권한을 즉시 취소할 수 있게 함.
- 모든 권한 변경을 로그로 기록.
- 작업/감사 로그에 권한 모드와 허용 경로를 포함.

## 오피스 환경 가정

Army Claw v0.1은 대상 로컬 환경에 한컴오피스가 설치되어 있다고 가정한다. Microsoft Office는 v0.1 워크플로우에 필요하지 않아야 한다.

v0.1 대상 오피스 앱:

- 스프레드시트 업무: 한셀.
- 프레젠테이션 업무: 한쇼.
- 한글 문서 업무: 한글/HWPX.

v0.2 확장 대상:

- Microsoft Office 환경 지원 추가.
- Excel, PowerPoint, Word 호환/자동화 지원.
- 한컴오피스 지원은 v0.1 기준선으로 유지한다.

영향:

- 가능한 경우 파일 포맷 라이브러리와 직접 파일 생성을 우선한다.
- HWPX를 1차 한글 문서 포맷으로 사용한다.
- 한쇼가 사용 가능한 프레젠테이션 앱일 수 있으므로 `.show` 호환성을 지원한다.
- XLSX 워크플로우는 Microsoft Excel 자동화에 의존하지 않는다.
- PPTX 워크플로우는 Microsoft PowerPoint 자동화에 의존하지 않는다.
- GUI/app 자동화가 필요하면 Microsoft Office COM 자동화보다 한컴오피스 자동화 경로를 우선한다.
- 고급 차트, 피벗, 프레젠테이션 렌더링이 설치된 오피스 앱에 의존하는 경우, Army Claw는 한컴 구성요소를 감지하고 기능 가능 여부를 명확히 보고한다.

## 열린 설계 질문

현재 v0.1의 큰 설계 질문은 없다. 다음 단계는 프로젝트 스캐폴드를 만들고 Slice 1 구현을 시작하는 것이다.

## 구현 진행 상황

- 2026-06-26: 프로젝트 표시명을 Army Claw로 변경했다. 내부 Python 패키지명은 안정성을 위해 `openclaw`로 유지한다.
- 2026-06-26: Slice 1 구현 계획을 작성했다.
- 계획 파일: `docs/superpowers/plans/2026-06-26-slice-1-core-app-and-model-connectivity.md`.
- 2026-06-26: Slice 1 구현을 시작했다.
- 추가된 항목:
  - FastAPI 백엔드 스캐폴드.
  - LLM Provider 설정 모델.
  - Ollama Provider.
  - 단독망 OpenAI 호환 API Provider.
  - `/api/status`, `/api/health`.
  - React(Vite) health check UI.
  - 백엔드/프론트엔드 개발 실행 스크립트.
- 2026-06-26: 백엔드 테스트 8개 통과.
- 2026-06-26: React/Vite production build 통과.
- 검증 참고:
  - 백엔드 테스트는 프로젝트 내부 `.tmp`를 임시 폴더로 지정해야 Windows Temp 권한 문제를 피할 수 있었다.
  - 현재 환경에서는 pnpm 래퍼가 `esbuild` build script 승인 상태 때문에 `pnpm run build`에서 사전 install 검사에 실패했다.
  - Vite 빌드는 Node로 `node_modules/vite/bin/vite.js build`를 직접 실행해 성공했다.
- 2026-06-26: Slice 2 안전한 코딩 도구 구현 계획을 작성했다.
- 계획 파일: `docs/superpowers/plans/2026-06-26-slice-2-safe-coding-tools.md`.
- 2026-06-26: Slice 2 구현을 진행했다.
- 추가된 항목:
  - Mode A 작업공간 경로 검증.
  - 작업공간 파일 목록 API.
  - 작업공간 파일 읽기 API.
  - 파일 쓰기 전 diff preview API.
  - 승인 플래그 기반 파일 쓰기 API.
  - PowerShell 명령 승인 요청 API 골격.
  - React 작업공간 도구 UI.
  - React PowerShell 승인 요청 UI.
  - Vite 개발 프록시 설정.
- 2026-06-26: 백엔드 테스트 15개 통과.
- 2026-06-26: Slice 2 React/Vite production build 통과.
- 브라우저 렌더링 확인 참고:
  - FastAPI와 Vite 개발 서버는 각각 200 응답을 반환했다.
  - 현재 런타임에 Playwright 패키지가 없어 headless 브라우저 렌더링 검사는 수행하지 못했다.
- 2026-06-26: v0.2 skill 반입/등록/활용 기능 검토 내용을 추가했다.
- 2026-06-26: Slice 3 한셀/XLSX 도구 구현 계획을 작성했다.
- 계획 파일: `docs/superpowers/plans/2026-06-26-slice-3-hancell-xlsx-tools.md`.
- 2026-06-26: Slice 3 XLSX 기본 도구를 구현했다.
- 추가된 항목:
  - `openpyxl` 기반 XLSX 직접 처리.
  - workbook 요약 API.
  - sheet preview API.
  - 셀 쓰기 API.
  - 함수 제안 API.
  - 피벗형 그룹 요약 API.
  - bar chart 생성 API.
  - React 한셀/XLSX 도구 UI.
- 2026-06-26: 백엔드 테스트 21개 통과.
- 2026-06-26: Slice 3 React/Vite production build 통과.
- 제한 사항:
  - 이번 Slice 3의 피벗 지원은 실제 한셀/Excel 네이티브 피벗 테이블 객체 생성이 아니라, XLSX 데이터를 읽어 그룹별 합계를 계산하는 피벗형 요약이다.
  - 한셀 네이티브 자동화, 실제 피벗 테이블 생성, 렌더링 검증은 후속 고도화로 남긴다.
- 2026-06-26: Slice 4 한쇼/PPTX/.show 도구 구현 계획을 작성했다.
- 계획 파일: `docs/superpowers/plans/2026-06-26-slice-4-hancom-show-pptx-tools.md`.
- 2026-06-26: Slice 4 PPTX 기본 도구를 구현했다.
- 추가된 항목:
  - `python-pptx` 기반 PPTX 직접 처리.
  - PPTX 새 파일 생성 API.
  - PPTX 요약 API.
  - 제목 슬라이드 추가 API.
  - Bullet 슬라이드 추가 API.
  - `.show` 호환성 안내 API.
  - React 한쇼/PPTX 도구 UI.
- 2026-06-26: 백엔드 테스트 26개 통과.
- 2026-06-26: Slice 4 React/Vite production build 통과.
- 제한 사항:
  - 이번 Slice 4의 `.show` 지원은 네이티브 편집이 아니라 호환성 안내와 PPTX 우선 편집 경로 제공이다.
  - 한쇼 네이티브 자동화, `.show` 직접 변환/편집, 렌더링 검증은 후속 고도화로 남긴다.
- 2026-06-27: Local LLM 번들 생성/설치/검증 스크립트를 추가했다.
- 추가된 항목:
  - 준비망 번들 생성 스크립트 `scripts/export-local-llm-bundle.ps1`.
  - 단독망 모델 저장소 설치 스크립트 `scripts/install-local-llm-bundle.ps1`.
  - 번들 무결성 및 Ollama API 검증 스크립트 `scripts/verify-local-llm-bundle.ps1`.
  - Windows 실행 정책 우회용 `.bat` 래퍼.
  - Local LLM 번들 절차 문서 갱신.
- 검증 참고:
  - PowerShell 스크립트 문법 검사는 통과했다.
  - 현재 PC에는 `ollama` 명령이 없어 실제 `gemma3:12b` 생성 검증은 아직 수행하지 못했다.
  - Ollama 미설치 상태에서 검증 스크립트가 명확한 오류를 출력함은 확인했다.
- 2026-06-27: 웹 UI에서 Local LLM 번들 검증/설치 스크립트를 승인 기반으로 실행할 수 있게 연결했다.
- 추가된 항목:
  - `/api/local-llm/run` 엔드포인트.
  - 허용된 Local LLM 스크립트만 실행하는 `LocalLlmBundleService`.
  - React 웹 UI의 Local LLM Bundle 실행 패널.
  - Core 패키지와 Inno Setup 설치 파일의 Local LLM 스크립트 포함 규칙.
- 검증 참고:
  - 백엔드 전체 테스트 37개 통과.
  - React/Vite production build 통과.
  - Core 패키징 통과.
  - 패키징된 실행 파일에서 `/api/local-llm/run` 승인 전 미실행 응답을 확인했다.
- 다음 구현 목표: Ollama와 `gemma3:12b`가 준비된 PC에서 실제 Local LLM 번들 생성, 설치, UI 기반 검증을 수행한다.

## 현재 작업 위치

사용자가 지정한 프로젝트 루트:

```text
C:\Users\USER\Desktop\로컬 open claw 만들기
```

이전 Codex 세션 메타데이터가 남아 있는 위치:

```text
C:\Users\USER\Documents\로컬 open claw 만들기
```

프로젝트 설계/진행 문서는 사용자가 다시 위치를 변경하지 않는 한 바탕화면 프로젝트 폴더에 둔다.

# Army Claw OpenClaw 전면 교체 계획

## 결정

Army Claw의 최종 구조는 기존 FastAPI/React 임시 구현을 계속 키우는 방식이 아니라, OpenClaw 코드베이스를 기반으로 전면 재구성한다. 현재까지 만든 Army Claw 구현은 검증 자산과 요구사항 기록으로 남기되, 최종 제품의 기본 골격은 OpenClaw식 개인 AI 에이전트 구조를 따른다.

최종 목표는 다음 조합이다.

1. OpenClaw식 개인 AI 에이전트 구조
2. 기본 로컬 LLM: Ollama + `gemma3:12b`
3. 향후 내부망 OpenAI-compatible API 전환 기능
4. 한컴오피스 조작 도구 계층: HWP/HWPX, HCell/XLSX, HShow/PPTX/SHOW
5. ChatGPT형 프롬프트 중심 UI와 작업 진행 가시화
6. 오프라인 설치와 독립망 반입을 고려한 패키징

## OpenClaw reference 상태

OpenClaw는 별도 reference로 프로젝트 내부에 내려받았다.

- 위치: `C:\Users\USER\Desktop\로컬 open claw 만들기\reference\openclaw-upstream`
- 원격 저장소: `https://github.com/openclaw/openclaw.git`
- 확인한 commit: `843ad143`
- 라이선스: MIT License
- 원 저작권 표시: `Copyright (c) 2026 OpenClaw Foundation`

`reference/openclaw-upstream/`은 분석용 원본이므로 Army Claw 저장소에는 커밋하지 않는다. 실제 교체 단계에서는 이 reference를 기준으로 새 migration 브랜치 또는 작업 디렉터리를 만들고, Army Claw 수정분을 명확히 분리한다.

## 확인한 OpenClaw 구조

OpenClaw는 Node.js/pnpm 기반 모노레포다. `package.json` 기준 런타임 요구사항은 Node.js `>=22.19.0`, package manager는 `pnpm@11.2.2`다.

주요 구조는 다음과 같다.

- `src/gateway`: 세션, 채널, 도구, 이벤트를 묶는 local-first Gateway 축
- `src/llm`: 모델 registry, provider routing, OpenAI-compatible 계열 provider 구현
- `src/sessions`: 대화/작업 세션 관리 축
- `src/tools`: 에이전트가 호출하는 도구 계층
- `src/skills`: skill 기반 작업 지식 계층
- `src/plugin-sdk`: provider/tool/skill 확장을 위한 플러그인 SDK
- `ui`: OpenClaw 기본 Web UI
- `extensions/ollama`: Ollama provider plugin
- `extensions/llama-cpp`, `extensions/lmstudio`, `extensions/openai`: 추가 LLM/provider 후보

특히 `extensions/ollama`에 `@openclaw/ollama-provider`가 이미 존재한다. 따라서 Army Claw의 로컬 LLM 계층은 OpenClaw의 provider/plugin 구조를 유지하면서 Ollama를 기본 provider로 고정하고, `gemma3:12b`를 기본 모델로 등록하는 방향이 적절하다.

## 라이선스 준수 원칙

OpenClaw 코드를 기반으로 Army Claw를 재구성할 경우 다음을 반드시 지킨다.

1. OpenClaw의 원 MIT 라이선스 전문을 유지한다.
2. `Copyright (c) 2026 OpenClaw Foundation` 표시를 유지한다.
3. Army Claw 수정분은 별도 저작권/변경 고지로 구분한다.
4. `THIRD_PARTY_NOTICES.md` 또는 동등한 third-party notice 파일을 유지하고, 추가 의존성이 생기면 갱신한다.
5. 설치 파일과 배포 압축본에도 라이선스 파일을 포함한다.

권장 파일 구성은 다음과 같다.

- `LICENSE`: OpenClaw MIT license를 포함하고 Army Claw 수정분 고지를 추가한다.
- `THIRD_PARTY_NOTICES.md`: OpenClaw 원문 notice를 유지하고 Army Claw 추가 의존성을 기록한다.
- `NOTICE.md`: Army Claw가 OpenClaw 기반 파생 작업임을 명확히 적는다.

## UI 전면 교체 방향

현재 Army Claw UI는 폐기 대상이다. 새 UI는 사용자가 제시한 ChatGPT형 구조를 따른다.

### 기본 레이아웃

- 왼쪽 사이드바: 기능과 상태를 펼쳐서 볼 수 있는 샌드박스
- 중앙 패널: 왼쪽에서 선택한 기능/상태/작업 결과를 표시
- 하단 프롬프트 입력창: 모든 작업 요청의 중심
- 프롬프트 입력창 상단: LLM이 처리 중인 계획, 도구 호출, 문서 생성, 검증 상태를 타임라인으로 표시
- 상단/하단 상태 요소: 현재 provider, 모델, 오프라인 상태, 한컴오피스 감지 상태를 표시

### 왼쪽 샌드박스 1차 항목

- 새 작업
- 작업 기록
- 로컬 LLM 상태
- 한컴오피스 도구
- 문서 생성
- Skill 관리
- 설정
- 라이선스/진단

각 항목을 클릭하면 중앙 패널이 해당 기능 화면으로 바뀐다. 단, 사용자의 실제 작업 흐름은 항상 프롬프트 입력창에서 시작할 수 있어야 한다.

### 진행 과정 표시

LLM 응답을 단순 텍스트로만 보여주지 않는다. 다음 상태를 사용자가 볼 수 있어야 한다.

- 요청 이해
- 작업 계획 생성
- 필요한 skill/context 선택
- 도구 호출 대기
- 한컴오피스 또는 파일 생성 실행
- 산출물 저장 위치
- 검증 성공/실패
- 사용자 확인 필요 상태

## LLM provider 정책

v0.1 전환판의 기본값은 다음과 같다.

- 기본 provider: Ollama
- 기본 모델: `gemma3:12b`
- 기본 endpoint: `http://127.0.0.1:11434`
- 오프라인 기본 모드: 외부 네트워크 provider 비활성화

향후 버전에서는 내부망 OpenAI-compatible API를 추가한다.

- 사용자는 UI에서 API base URL, 모델명, 인증키 또는 인증 방식, timeout을 입력한다.
- 이 설정은 로컬 암호화 저장 또는 OS 보안 저장소 사용을 우선 검토한다.
- 기본값은 항상 로컬 Ollama이며, 내부망 API는 사용자가 명시적으로 선택할 때만 활성화한다.

중국계 모델/provider는 기본 추천, 기본 allowlist, 자동 선택 대상에서 제외한다.

## 한컴오피스 도구 계층

Army Claw가 OpenClaw 기반으로 바뀌더라도 한컴오피스 조작 기능은 Army Claw의 핵심 차별 기능으로 유지한다.

### v0.1 필수 범위

- HWPX 직접 생성
- HWPX 내용 추가/요약/검증
- 한글(Hwp.exe) 감지
- 한셀(HCell.exe) 감지
- 한쇼(HShow.exe) 감지
- HWPX 산출물 저장 위치 표시
- 실패 시 명확한 원인 메시지 표시

### 확장 범위

- HWP/HWPX 열기 및 저장 자동화
- HCell 기반 XLSX 생성/수정/차트/피벗 검증
- HShow 기반 PPTX/SHOW 생성/수정/슬라이드 검증
- MS Office 환경은 v0.2 이후 별도 compatibility layer로 추가

OpenClaw의 tool/plugin 구조 위에 `hancom` 계열 tool plugin을 추가하는 방향이 적절하다. 직접 XML/ZIP 기반 HWPX 생성은 fallback으로 유지하고, 한컴오피스 설치 환경에서는 실제 실행 파일을 통해 열기/저장/검증을 수행한다.

## 전환 전략

전면 교체는 한 번의 덮어쓰기 커밋으로 처리하지 않는다. 다음 순서로 진행한다.

1. reference 고정
   - OpenClaw 원본 commit, 라이선스, 구조를 문서화한다.
   - reference 폴더는 Git 추적에서 제외한다.

2. migration 브랜치 생성
   - 예: `migration/openclaw-base`
   - 현재 Army Claw 코드는 보존한다.

3. OpenClaw base import
   - OpenClaw 원본 파일을 새 base로 가져온다.
   - 원 LICENSE, THIRD_PARTY_NOTICES, README 출처 정보를 유지한다.
   - Army Claw 변경 고지를 추가한다.

4. provider 축소
   - 기본 provider를 Ollama로 설정한다.
   - 외부 cloud provider는 기본 비활성화한다.
   - 내부망 OpenAI-compatible API 설정 슬롯만 남긴다.

5. UI 재구성
   - 기존 Army Claw UI는 폐기한다.
   - OpenClaw UI 또는 OpenClaw UI 구조를 기반으로 새 ChatGPT형 UI를 구현한다.
   - 왼쪽 샌드박스, 중앙 패널, 하단 프롬프트, 진행 타임라인을 우선 구현한다.

6. Hancom tool plugin 추가
   - HWPX 직접 생성 tool
   - Hancom 설치 감지 tool
   - Hwp/HCell/HShow 실행 및 검증 tool
   - 산출물 저장 위치와 실행 로그를 Gateway 이벤트로 노출한다.

7. 오프라인 패키징
   - Node/pnpm 의존성 offline mirror 또는 완전 패키징 전략을 다시 설계한다.
   - Ollama는 별도 LLM bundle에 포함한다.
   - Army Claw 본체는 Ollama가 없어도 내부망 OpenAI-compatible API를 쓸 수 있게 분리한다.

8. 검증
   - 로컬 Ollama `gemma3:12b` 연결 smoke test
   - 프롬프트 입력에서 계획 생성 smoke test
   - HWPX 실제 파일 생성 smoke test
   - 한컴오피스 감지 smoke test
   - 설치 파일 실행 smoke test
   - 라이선스 파일 포함 여부 검증

## 위험과 대응

### 기술 스택 변경 비용

현재 Army Claw는 Python/FastAPI/PyInstaller/Inno Setup 중심이고, OpenClaw는 Node.js/pnpm 중심이다. 전면 교체는 사실상 런타임과 패키징 전략을 다시 잡는 작업이다.

대응:
- 기존 Python HWPX 생성 코드는 바로 버리지 않고, Node tool에서 호출 가능한 worker 또는 독립 CLI로 임시 보존한다.
- 장기적으로는 Hancom tool layer를 OpenClaw plugin 구조에 맞게 TypeScript로 이식한다.

### 오프라인 설치 복잡도

OpenClaw는 의존성이 큰 모노레포다. 독립망 반입용 완전 패키징 난이도가 현재 Army Claw보다 높다.

대응:
- 초기 migration에서는 개발 환경 검증을 먼저 한다.
- 그 다음 dependency vendor, pnpm store export/import, Windows installer 전략을 확정한다.

### provider 정책 위험

OpenClaw에는 여러 cloud provider와 중국계 provider가 포함되어 있다.

대응:
- Army Claw 기본 배포에서는 외부 provider를 비활성화한다.
- 중국계 provider/model은 기본 allowlist와 추천 목록에서 제외한다.
- 내부망 OpenAI-compatible API는 사용자가 명시적으로 설정한 경우에만 사용한다.

## 다음 실행 단위

다음 작업은 코드 전면 교체가 아니라, migration을 안전하게 시작하기 위한 준비 작업이다.

1. `reference/openclaw-upstream/` Git 추적 제외 확인
2. 이 문서 커밋
3. `migration/openclaw-base` 브랜치 생성
4. OpenClaw base import 방식 선택
5. 라이선스/NOTICE 파일 초안 작성
6. UI shell의 첫 화면 설계
7. Ollama 기본 provider 설정 경로 확인
8. Hancom tool plugin 최소 인터페이스 설계
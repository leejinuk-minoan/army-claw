# OpenClaw 기준 향후 개발 계획

## 목적

Army Claw의 최종 목표를 다음 두 가지로 재정의한다.

1. OpenClaw가 제공하는 개인 AI 에이전트/도구 실행/스킬/세션 구조를 기준으로 삼는다.
2. OpenClaw의 LLM 사용 방식을 인터넷 API 중심이 아니라 로컬 LLM 또는 단독망 내부 OpenAI 호환 API 중심으로 바꾼다.
3. 여기에 Windows 한컴오피스 조작 계층을 추가해 HWPX, HCell, HShow 기반 문서를 실제 생성/편집할 수 있게 한다.

## OpenClaw 참고 결과

OpenClaw는 개인 AI 비서를 로컬 우선 Gateway로 실행하고, 채널, 세션, 도구, 스킬, 모델 provider를 관리하는 구조다. README 기준으로 Windows Hub, 도구, 스킬, 모델 설정, 로컬/다중 채널 게이트웨이 개념을 갖고 있다. 라이선스는 MIT이므로 참고, 수정, 포크, 부분 차용이 가능하다.

다만 OpenClaw는 범용 개인 비서/메시징/게이트웨이 플랫폼에 가깝고, Army Claw의 v0.1 코드는 FastAPI + React + Windows 패키징 + 한컴오피스 특화 검증에 맞춰 이미 진행됐다. 따라서 즉시 전체 코드를 엎는 것은 위험하다.

## 전략 판단

### 권장 전략: 단계적 흡수

현재 Army Claw 코드를 유지하면서 OpenClaw의 구조를 참조해 다음 영역부터 흡수한다.

- 모델 provider/allowlist/fallback 개념
- agent session과 workspace 구분
- tool/skill 실행 경계
- 로컬 우선 Gateway와 UI 분리
- 보안 기본값과 승인 흐름

이 방식은 현재 v0.1 산출물을 버리지 않고, OpenClaw의 검증된 설계 개념을 가져올 수 있다.

### 보류 전략: OpenClaw 포크 후 한컴/로컬 LLM 특화

OpenClaw를 별도 reference 또는 fork로 받아 실제 Windows에서 실행해 본 뒤, 아래 조건을 만족하면 포크 전환을 검토한다.

- Windows 설치/실행 루프가 Army Claw보다 안정적일 것
- 로컬 Ollama 또는 OpenAI 호환 내부 API 연결이 간단할 것
- 도구 계층에 한컴오피스 자동화 도구를 넣기 쉬울 것
- 오프라인 패키징과 단독망 반입 전략을 유지할 수 있을 것
- 중국계 모델/provider를 제외하는 정책을 설정으로 강제할 수 있을 것

### 비권장 전략: 즉시 전면 교체

지금 바로 Army Claw를 OpenClaw 코드베이스로 완전히 엎는 것은 비권장한다.

이유는 다음과 같다.

- 현재 Army Claw에는 이미 HWPX/PPTX/XLSX 생성, 설치 패키징, Skill 업로드/관리, 로컬 LLM 계획 생성 흐름이 있다.
- OpenClaw는 Node/pnpm 중심이고 현재 Army Claw는 FastAPI/React/PyInstaller/Inno Setup 중심이라 전환 비용이 크다.
- 한컴오피스 자동화는 OpenClaw 본체 기능이라기보다 Windows 전용 tool/plugin으로 붙이는 일이 핵심이다.
- 즉시 전환하면 v0.1 검증 결과와 패키징 안정성이 사라질 수 있다.

## 수정된 로드맵

### v0.1.x: 현재 Army Claw 안정화

- 현재 UI를 좌측 내비게이션 + 중앙 작업 피드 구조로 정리한다.
- 큐 실행 결과, 생성 파일 위치, 실패/건너뜀 사유를 명확히 표시한다.
- HWP/HWPX/한글문서 요청이 실제 HWPX 파일 생성으로 이어지는 흐름을 안정화한다.
- 작업공간 기본값은 `%LOCALAPPDATA%\ArmyClaw\workspace`로 유지한다.
- 한컴오피스가 설치된 경우 생성된 HWPX를 열 수 있는지 확인하는 검증 기능을 추가한다.

### v0.2: OpenClaw 기준 구조 검토 스파이크

- `C:\Users\USER\Desktop\로컬 open claw 만들기\reference\openclaw-upstream` 같은 프로젝트 내부 reference 위치에 OpenClaw를 별도로 받는다.
- OpenClaw의 gateway, agent, tool, skill, model provider 구조를 조사한다.
- Army Claw의 현재 기능과 OpenClaw 기능을 매핑한다.
- 포크 전환, 부분 차용, 독립 유지 중 하나를 결정할 수 있도록 비교표를 작성한다.
- 이 단계에서는 기존 Army Claw 코드를 엎지 않는다.

### v0.3: 로컬 LLM provider 구조 정리

- 기본 provider는 Ollama + `gemma3:12b`로 유지한다.
- OpenClaw의 모델 ref 방식처럼 `ollama/gemma3:12b`, `openai-compatible/internal-model` 같은 provider/model 표기 체계를 검토한다.
- 단독망 내부 OpenAI 호환 API를 설정 UI에서 등록할 수 있게 한다.
- 중국계 모델/provider는 allowlist에서 제외하는 정책을 명시한다.

### v0.4: 한컴오피스 조작 도구 계층

- HWPX 직접 생성은 계속 유지한다.
- 한컴오피스가 설치된 환경에서는 다음 도구를 추가한다.
  - HWPX 열기/저장/호환성 검증
  - HWPX 문서에 본문/제목/표 삽입
  - HCell 기반 XLSX 열기/저장/차트 검증
  - HShow 기반 PPTX/SHOW 열기/저장/슬라이드 검증
- COM 자동화, 명령행 실행, UI 자동화 중 실제 안정적인 방법을 검증한다.

### v0.5: 전환 여부 결정

v0.2 스파이크 결과를 바탕으로 아래 중 하나를 결정한다.

1. Army Claw 독립 유지 + OpenClaw 개념 부분 차용
2. OpenClaw fork 기반으로 Army Claw 재구성
3. OpenClaw를 내부 엔진으로 사용하고 Army Claw는 Windows/Hancom UI와 패키징 계층으로 유지

## 다음 작업

가장 먼저 할 일은 OpenClaw를 직접 받기 전에 reference 검토 계획을 확정하는 것이다. 이후 프로젝트 내부 `reference` 폴더에 OpenClaw를 내려받아 구조를 조사하고, 현재 Army Claw와 기능 비교표를 작성한다.
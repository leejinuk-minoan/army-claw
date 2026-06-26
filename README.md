# Army Claw

Army Claw는 단독망 환경에서 100% 오프라인으로 동작하는 로컬 AI 에이전트를 목표로 하는 프로젝트입니다.

## v0.1 목표

- FastAPI 백엔드
- React(Vite) 웹 UI
- Ollama 기반 로컬 LLM Provider
- OpenAI 호환 내부망 API Provider
- 안전한 작업공간 파일/명령 도구
- 한셀/XLSX 도구
- 한쇼/PPTX 도구
- 한글/HWPX 도구

## 기본 방향

- 기본 로컬 모델: `gemma3:12b`
- 중국/중국 기관 LLM 모델 제외
- Army Claw Core 설치 파일과 Local LLM 번들은 분리
- Local LLM 번들에는 Ollama와 모델을 포함
- 추후 내부망 OpenAI 호환 API로 LLM Provider 전환 가능

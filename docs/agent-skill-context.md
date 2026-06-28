# Army Claw Agent Skill 컨텍스트 주입

## 목적

업로드된 skill을 단순 보관하지 않고, 실제 작업 계획에 반영하기 위한 기능이다.

이 기능은 fine-tuning이나 모델 재학습이 아니다. 활성화된 `SKILL.md` 내용을 작업 계획 컨텍스트로 조합하고, 필요하면 현재 선택된 LLM Provider에 전달해 실행 전 계획을 생성한다.

## 구현 범위

- 활성화된 skill만 작업 컨텍스트에 포함한다.
- 비활성화된 skill은 제외한다.
- 각 skill의 `SKILL.md` 내용을 읽어 컨텍스트 블록으로 만든다.
- 컨텍스트 길이는 skill별/전체 기준으로 제한한다.
- `/api/agent/plan`에서 사용자 작업 요청과 활성 skill 컨텍스트를 합친 프롬프트를 반환한다.
- `execute=false`이면 LLM 호출 없이 프롬프트 미리보기만 반환한다.
- `execute=true`이면 현재 LLM Provider에 프롬프트를 전달해 LLM이 작성한 계획을 반환한다.
- React UI에 `Skill 적용 작업 계획` 패널을 추가했다.

## API

### `POST /api/agent/plan`

요청 예시:

```json
{
  "task": "월간 보고서를 만들어줘",
  "execute": true
}
```

응답 주요 항목:

- `task`: 사용자 작업 요청.
- `executed`: LLM Provider 호출 여부.
- `prompt`: 활성 skill이 주입된 작업 계획용 프롬프트.
- `plan`: LLM Provider가 생성한 작업 계획. `execute=false`이면 빈 문자열이다.
- `used_skills`: 프롬프트에 포함된 skill 목록.
- `message`: 현재 단계 설명.

## Ollama 확인 결과

현재 PC에서 확인한 상태:

- Ollama 설치 경로: `C:\Users\USER\AppData\Local\Programs\Ollama\ollama.exe`
- Ollama API: `http://127.0.0.1:11434/api/tags` 200 응답
- 현재 모델: `gemma3:12b`
- 모델 크기: 약 8.1 GB
- 모델 형식: GGUF, `Q4_K_M`

패키지된 `ArmyClawCore.exe`에서 `execute=true` 호출을 수행했고, `gemma3:12b`가 활성 skill을 반영한 작업 계획을 생성하는 것을 확인했다.

## 현재 한계

- LLM이 계획을 생성하더라도 아직 파일 생성, 명령 실행, 한컴오피스 조작은 수행하지 않는다.
- 현재 단계는 “Skill이 반영된 계획 생성”까지다.
- 실제 도구 실행은 사용자 승인 흐름과 작업 로그가 더 연결된 뒤 진행한다.

## 다음 단계

- `gemma3:12b` 모델 존재 여부를 UI에서 더 명확히 안내한다.
- LLM이 생성한 계획을 구조화해 승인 가능한 작업 단계로 나눈다.
- 승인된 단계만 파일/문서/명령 도구로 실행한다.
- 작업 로그에 적용된 skill, 생성된 계획, 실행 결과를 기록한다.

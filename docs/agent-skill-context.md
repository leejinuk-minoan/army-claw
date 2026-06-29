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
- LLM이 작성한 계획을 승인 가능한 단계 목록으로 구조화한다.
- `execute=true`로 생성된 계획은 로컬 계획 저장소에 저장하고 `plan_id`를 반환한다.
- 저장된 계획의 각 단계는 UI에서 승인 또는 보류 상태로 변경할 수 있다.
- 승인된 단계만 별도 실행 큐 JSON으로 생성한다.
- 실행 큐는 현재 `manual` 단계만 안전하게 완료 기록으로 처리한다.
- `document` 단계 중 HWPX 생성 스키마로 변환 가능한 항목은 `.hwpx` 파일을 생성한다.
- `file`, `command` 단계는 아직 실제 PC 조작을 수행하지 않고 `skipped`로 기록한다.
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
- `plan_id`: 저장된 계획 ID. `execute=true`일 때 반환된다.
- `executed`: LLM Provider 호출 여부.
- `prompt`: 활성 skill이 주입된 작업 계획용 프롬프트.
- `plan`: LLM Provider가 생성한 작업 계획. `execute=false`이면 빈 문자열이다.
- `steps`: LLM 계획을 파싱한 실행 후보 단계 목록.
- `used_skills`: 프롬프트에 포함된 skill 목록.
- `message`: 현재 단계 설명.

### `POST /api/agent/plans/{plan_id}/steps/{step_id}/status`

요청 예시:

```json
{
  "status": "approved"
}
```

응답 주요 항목:

- 저장된 계획 전체를 반환한다.
- 변경된 단계의 `status`가 `approved` 또는 `blocked`로 갱신된다.

### `POST /api/agent/plans/{plan_id}/execution-queue`

저장된 계획에서 `approved` 상태인 단계만 실행 큐에 복사한다.
요청 본문에 `workspace_root`를 넘기면 HWPX 문서 생성 단계에 실행 스키마가 붙는다.

요청 예시:

```json
{
  "workspace_root": "C:\\Users\\USER\\Desktop\\로컬 open claw 만들기"
}
```

응답 주요 항목:

- `queue_id`: 생성된 실행 큐 ID.
- `plan_id`: 원본 계획 ID.
- `queued_count`: 큐에 들어간 단계 수.
- `items`: 실행 대기 단계 목록. 각 항목의 상태는 `queued`로 시작한다.
- `items[].execution`: 실행 가능한 문서 작업의 명시적 실행 스키마. 현재는 `hwpx_create`만 지원한다.

### `POST /api/agent/execution-queues/{queue_id}/run`

실행 큐를 처리한다.

현재 안전 정책:

- `manual`: 실제 PC 조작 없이 수동 확인 단계로 기록하고 `succeeded` 처리한다.
- `document` + `hwpx_create`: `workspace_root` 아래 `army-claw-output/{step_id}.hwpx` 파일을 생성하고 `succeeded` 처리한다.
- `file`, `command`, 실행 스키마가 없는 `document`: 아직 명시적 실행 스키마가 없으므로 `skipped` 처리한다.

응답 주요 항목:

- `items`: 실행 후 갱신된 큐 항목 목록.
- 각 항목의 `status`: `succeeded`, `skipped`, `failed` 등.
- 각 항목의 `message`: 처리 사유 또는 제한 사유.

## 구조화된 단계

`steps`의 각 항목은 다음 필드를 가진다.

- `step_id`: `step-1`, `step-2` 형식의 단계 ID.
- `title`: 단계 제목.
- `detail`: 단계 설명.
- `action_type`: `manual`, `file`, `command`, `document` 중 하나.
- `requires_approval`: 사용자 승인이 필요한 단계인지 여부.
- `status`: `pending`, `approved`, `executed`, `blocked` 중 하나.

현재 단계 구조화는 실행을 위한 최종 명령 스키마가 아니라, 사용자가 승인할 수 있는 작업 후보 목록을 만들기 위한 1차 파싱이다.
승인 상태 저장, 실행 큐 생성, 큐 실행 MVP는 실제 도구 실행 전의 안전 장치다.
현재 큐 실행은 `manual` 기록과 HWPX 생성만 처리하며, 그 외 문서/파일/명령 실행은 아직 수행하지 않는다.

## Ollama 확인 결과

현재 PC에서 확인한 상태:

- Ollama 설치 경로: `C:\Users\USER\AppData\Local\Programs\Ollama\ollama.exe`
- Ollama API: `http://127.0.0.1:11434/api/tags` 200 응답
- 현재 모델: `gemma3:12b`
- 모델 크기: 약 8.1 GB
- 모델 형식: GGUF, `Q4_K_M`

패키지된 `ArmyClawCore.exe`에서 `execute=true` 호출을 수행했고, `gemma3:12b`가 활성 skill을 반영한 작업 계획을 생성하는 것을 확인했다.

## 현재 한계

- LLM이 계획과 단계 목록을 생성하더라도 아직 임의 파일 생성, 명령 실행, 한컴오피스 조작은 수행하지 않는다.
- 현재 단계는 “Skill이 반영된 계획 생성”, “승인 가능한 단계 후보 표시”, “단계별 승인/보류 상태 저장”, “승인 단계 실행 큐 생성”, “manual 큐 항목 완료 기록”, “HWPX 생성 실행”까지다.
- 실제 도구 실행은 사용자 승인 흐름과 작업 로그가 더 연결된 뒤 진행한다.

## 다음 단계

- `gemma3:12b` 모델 존재 여부를 UI에서 더 명확히 안내한다.
- 승인된 단계만 파일/문서/명령 도구로 실행한다.
- 작업 로그에 적용된 skill, 생성된 계획, 실행 결과를 기록한다.

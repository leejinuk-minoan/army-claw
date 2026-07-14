# Army Claw Branch Ownership Map

## 1. 현재 및 예정 Branch

| Branch | Owner | Scope | Status |
|---|---|---|---|
| `agent/task021-solo-ai-worker-governance` | Codex A | Task 021 documentation and governance proof | active for Task 021 |
| `agent/task022-ai-worker-handoff-contract` | Codex B or Codex A as assigned by user | handoff contract proof | future candidate |
| `feature/hwp-hwpx-engine-owner` | Project Owner | HWP/HWPX engine work | owner-reserved |
| `feature/local-llm-gateway-owner` | Project Owner | Local LLM / Model Gateway | owner-reserved |
| `integration/multi-app-adapters` | Project Owner | integration only after contract proof | future integration |

## 2. 금지 원칙

- main 직접 push 금지
- force push 금지
- history rewrite 금지
- 다른 worker branch 무단 수정 금지

검증과 마스터 리뷰가 완료된 branch는 마스터 에이전트가 PR을 통해 main에 merge할 수 있다. 충돌, 미검증 결과, 금지 경로 변경 또는 completion gate 실패가 있으면 merge하지 않는다.

## 3. Canceled / Not To Be Created

다음 branch는 인원 A/B 협업 취소로 인해 공식 계획에서 제외하며, 생성 예정 branch 또는 active branch로 기록하지 않는다.

- `feature/hanshow-engine-person-a`
- `feature/hancell-engine-person-b`

위 branch 이름은 canceled / not to be created 문맥에서만 언급한다.

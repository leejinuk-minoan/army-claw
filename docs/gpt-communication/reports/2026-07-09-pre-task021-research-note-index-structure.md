# Pre-Task 021-A — Research Note Index Structure 보고서

## 요약

이 작업은 Task 021 본 작업 전에 논문 활용을 위한 기록 구조를 고정하기 위해 수행했다. 기존 Task report와 별도로, Task별 Research Note를 분리 파일로 관리하고, 별도 index 파일에는 Research Note 번호와 위치만 기록하는 구조를 추가했다.

- 작업 브랜치: `agent/pre-task021-research-note-index-structure`
- 기준 SHA: `c93e3fec627bfa493eaefefd974b04adc012ac41`
- 작업 성격: 문서 구조 기준 작업
- production code 변경: `false`
- main 직접 수정: `false`
- force push: `false`
- Stage 2 전환 선언: `false`
- 최종 HWPX core 선정: `false`

## 생성한 Research Note 구조

```text
docs/research-notes/
├─ README.md
├─ research-note-index.md
├─ research-note-index.json
└─ task-notes/
   ├─ RN-018-task018-multi-app-capability-architecture.md
   ├─ RN-019-task019-app-target-routing.md
   └─ RN-020-task020-app-target-plan-schema.md
```

## 구조 원칙

```text
Task report
→ 개발·검증·테스트·제한사항을 기록하는 공식 작업 보고서

Research Note
→ 논문 활용을 위해 연구 질문, 설계 명제, 방법론, 결과, 한계를 재정리한 문서

Research Note Index
→ Research Note 번호와 파일 위치를 추적하는 짧은 색인
```

## 변경 파일

새로 추가한 파일:

- `docs/research-notes/README.md`
- `docs/research-notes/research-note-index.md`
- `docs/research-notes/research-note-index.json`
- `docs/research-notes/task-notes/RN-018-task018-multi-app-capability-architecture.md`
- `docs/research-notes/task-notes/RN-019-task019-app-target-routing.md`
- `docs/research-notes/task-notes/RN-020-task020-app-target-plan-schema.md`
- `docs/gpt-communication/reports/2026-07-09-pre-task021-research-note-index-structure.md`

수정한 파일:

- `docs/gpt-communication/README.md`
- `docs/gpt-communication/PROJECT_STATE.json`
- `docs/gpt-communication/AGENT_OPERATING_MODEL.md`
- `docs/gpt-communication/tasks/TASK_CONTRACT_TEMPLATE.md`

## 기존 문서 반영 내용

`docs/gpt-communication/README.md`에는 Research Note 위치와 Task report / Research Note / Research Note Index의 역할 구분을 추가했다.

`docs/gpt-communication/PROJECT_STATE.json`에는 `governance.research_notes` 항목을 추가하고, source of truth에 research note index 파일을 포함했다.

`docs/gpt-communication/AGENT_OPERATING_MODEL.md`에는 Research Note 구조 관리, 에이전트별 책임, 결과 회수 규칙, 쓰기 권한, 공통 금지사항을 반영했다.

`docs/gpt-communication/tasks/TASK_CONTRACT_TEMPLATE.md`에는 Research Note contract, required outputs, completion gate, reporting contract를 추가했다.

## 샘플 Research Note

기존 검증 완료 Task 중 논문 활용도가 높은 Task 018~020에 대해 샘플 Research Note를 작성했다.

- RN-018: Multi-app capability architecture
- RN-019: App target routing contract
- RN-020: App target plan schema and adapter slot input contract

## 비범위

이번 작업에서는 다음을 수행하지 않았다.

- production code 수정
- 새 adapter 구현
- HanCell/HanShow engine 구현
- Model Gateway 구현
- LLM planner 연결
- HTTP/UI 구현
- Task 021 본 작업 착수
- 협업자 branch 생성
- 발표자료 생성
- Stage 2 전환 선언
- 최종 HWPX core 선정

## 다음 작업 제안

다음 순서는 다음과 같다.

```text
Task 021: Solo AI Worker Operating Rules + Multi-Agent Governance
Task 022: AI Worker Handoff Contract Proof
Task 023: Common Office Adapter Interface Contract Proof
```

정정 사항:

- 인원 A/B 협업은 취소되었다.
- A/B용 PPT와 branch 준비는 진행하지 않는다.
- 공식 작업 체계는 사용자 + Codex A + Codex B + Claude Code다.
- Task 021은 사람 협업 준비가 아니라 사용자 단독의 복수 AI worker 운용 규칙을 고정하는 문서 기준 작업이다.

## 완료 판단

Research Note 구조는 Task 021 이전에 사용할 수 있는 기준 구조로 생성되었다. 이후 모든 Task는 Task report와 별도로 Research Note가 필요한지 Task Contract에서 명시해야 한다.

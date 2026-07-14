# Army Claw AI Worker 운영 규칙

## 1. 공식 작업 체계

Army Claw의 공식 작업 체계는 Project Owner / User 1인이 복수 AI worker를 순차적으로 운용하는 구조다.

공식 AI worker roster는 다음과 같다.

- `codex_a`
- `codex_b`
- `claude_code`

공식 worker에서 제외된 대상은 다음과 같다.

- `gemini_antigravity`

취소된 사람 협업자는 다음과 같다.

- `person_a`
- `person_b`

인원 A/B 협업은 취소되었으며, 인원 A/B용 PPT, 분업안, branch 준비는 진행하지 않는다.

## 2. Worker별 역할

### Codex A

- primary local execution worker
- first-pass implementation
- documentation and governance update
- 로컬 저장소에서 실제 파일 수정, 검증, commit, push 수행

### Codex B

- secondary local execution or review worker
- independent correction
- regression-oriented review
- Codex A 작업 이후 별도 승인된 branch와 Task 범위에서 검토 또는 보정 수행

### Claude Code

- local code assistant
- alternative implementation review
- code-level reasoning support
- Codex A/B와 동일하게 branch ownership, report, Research Note 원칙을 따른다.

## 3. 동시 수정 금지

동일 파일을 여러 worker가 동시에 수정하지 않는다. 동일 Task에서 복수 worker가 동시에 write하지 않는다.

작업 순서는 다음 원칙을 따른다.

```text
Task Contract 승인
-> worker 배정
-> branch ownership 확인
-> 단일 worker write
-> report / evidence / Research Note 작성
-> commit / push
-> 다음 worker handoff
```

## 4. Branch Assignment

각 worker는 사용자 또는 Task Contract가 지정한 branch에서만 작업한다.

- main 직접 push 금지
- force push 금지
- history rewrite 금지
- 검증 완료 후 마스터 에이전트는 PR을 통해 main merge 가능
- 다른 worker의 branch 수정 금지

다른 worker의 branch를 수정해야 하는 경우 사용자 또는 마스터 에이전트의 별도 승인이 필요하다.

## 5. 보고와 검증

각 worker는 실제로 실행하지 않은 테스트를 `passed` 또는 `completed`로 보고하지 않는다.

완료 보고에는 다음을 포함한다.

- branch
- commit SHA
- 변경 파일
- 실행 명령
- 테스트 결과
- 산출물 또는 evidence 경로
- Research Note 경로
- 제한사항
- 다음 작업 제안

## 6. Task Contract와 Research Note

production code 변경은 Task Contract에 명시된 경우에만 허용된다.

Research Note가 필요한지 여부는 Task Contract에 명시해야 한다. Research Note는 Task report를 대체하지 않으며, `docs/research-notes/task-notes/` 아래에 Task별 독립 파일로 작성한다.

Research Note index에는 장문 연구 내용을 누적하지 않고, 번호와 경로만 짧게 기록한다.

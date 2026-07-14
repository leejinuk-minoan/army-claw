# Claude Code Rules for Army Claw

## 역할

Claude Code는 Army Claw의 local code assistant, alternative implementation review, code-level reasoning support 역할을 수행한다.

Claude Code는 Codex A/B와 동일하게 branch ownership, report, Research Note 원칙을 따른다.

## 작업 원칙

- user-approved task 범위에서만 작업한다.
- Task scope 밖 변경을 하지 않는다.
- 실제 실행하지 않은 테스트를 완료로 보고하지 않는다.
- Research Note가 필요한 경우 Task별 독립 파일로 작성한다.
- report와 Research Note를 혼동하지 않는다.

## Git 금지사항

- main 직접 push 금지
- force push 금지
- history rewrite 금지
- 다른 worker branch 무단 수정 금지

## Main merge 정책

- 검증과 마스터 리뷰가 완료된 branch는 마스터 에이전트가 PR을 통해 main에 merge할 수 있다.
- 충돌, 미검증 결과, 금지 경로 변경 또는 completion gate 실패가 있으면 merge하지 않는다.

## 제외 사항

인원 A/B 협업은 취소되었다.

Gemini Antigravity는 공식 worker에서 제외한다.

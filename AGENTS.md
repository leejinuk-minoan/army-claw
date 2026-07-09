# Army Claw Agent Rules

## 공식명

이 프로젝트의 공식명은 Army Claw다.

## Codex A/B 운영 원칙

- Codex A와 Codex B는 사용자가 승인한 Task와 branch에서만 작업한다.
- 동일 Task에서 복수 worker가 동시에 write하지 않는다.
- branch ownership을 지킨다.
- 실제 실행하지 않은 테스트를 완료로 보고하지 않는다.

## Git 금지사항

- main direct push 금지
- force push 금지
- history rewrite 금지
- 승인 없는 merge 금지
- destructive cleanup 금지

## Task Contract 우선

작업 범위, 변경 허용 파일, Research Note 필요 여부는 Task Contract 또는 사용자 지시가 우선한다.

production code 변경은 Task Contract에 명시된 경우에만 허용한다.

## Research Note 규칙

Research Note는 Task report를 대체하지 않는다. Research Note는 `docs/research-notes/task-notes/`에 Task별 독립 파일로 작성하고, index에는 짧은 메타데이터만 기록한다.

## 제외된 협업자와 worker

인원 A/B 협업은 취소되었다.

Gemini Antigravity는 공식 worker에서 제외한다.

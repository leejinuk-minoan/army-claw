# Army Claw Solo Multi-Agent Governance

## 1. 원칙

Army Claw의 Project Owner는 사용자 1인이다. Codex A, Codex B, Claude Code는 사용자를 보조하는 AI worker이며 독립 의사결정권을 갖지 않는다.

모든 구조 변경, 단계 전환, 핵심 아키텍처 변경은 사용자 승인 또는 마스터 에이전트 검토를 거친다.

## 2. Governance 구조

마스터 에이전트는 전체 단계, 계약, branch, report, evidence consistency를 검토한다.

Codex A/B/Claude Code는 user-approved task 단위로만 작업한다. Task 범위 밖 변경은 금지한다.

```text
Project Owner / User
-> Task 승인
-> worker 지정
-> branch ownership 확인
-> 단일 worker 실행
-> report / evidence / Research Note
-> GitHub push
-> master review
```

## 3. Handoff

worker 간 handoff는 다음 정보로 전달한다.

- report
- changed files
- commit SHA
- test results
- remaining risks
- next task

worker가 다른 worker의 branch를 수정하려면 별도 승인이 필요하다.

## 4. 통합 기준

GitHub verified commit chain을 최종 통합 기준으로 사용한다.

수동 로컬 폴더 복사 병합은 금지한다. 작업 산출물은 branch, commit, report, evidence 경로로 추적되어야 한다.

## 5. 취소된 사람 협업 상태

인원 A/B 협업은 취소 상태로 유지한다. 사람 협업자용 branch, PPT, 분업안은 공식 계획에서 제외한다.

Gemini Antigravity는 공식 worker에서 제외한다.

# Army Claw Codex 대행 작업 패키지 템플릿

## 1. 경로

```text
docs/gpt-communication/delegation/<task-id>/
├─ ROUTING_DECISION.json
├─ DELEGATION_PLAN.md
├─ FILE_CHANGE_PLAN.json
├─ TEST_PLAN.json
├─ CODEX_EXECUTION_BRIEF.md
└─ DELEGATION_RESULT.md
```

## 2. ROUTING_DECISION.json

```json
{
  "task_id": "",
  "stage": "",
  "branch": "",
  "routing_class": "hybrid",
  "phase": "cloud_preparation",
  "cloud_scope": [],
  "local_scope": [],
  "local_validation_required": [],
  "forbidden_scope": [],
  "task_contract_path": "",
  "start_sha": "",
  "delegation_commit_sha": null,
  "master_review_required": false,
  "master_review_reasons": []
}
```

## 3. DELEGATION_PLAN.md

```text
현재 단계
작업 목적
검토한 근거
설계 결정
대안
클라우드에서 수행할 변경
로컬에서만 가능한 검증
위험과 보류사항
```

## 4. FILE_CHANGE_PLAN.json

```json
{
  "task_id": "",
  "files": [
    {
      "path": "",
      "action": "create|modify|inspect_only",
      "cloud_change_performed": false,
      "local_change_required": false,
      "symbols": [],
      "requirements": [],
      "validation": []
    }
  ]
}
```

## 5. TEST_PLAN.json

```json
{
  "task_id": "",
  "local_commands": [
    {
      "order": 1,
      "command": "",
      "purpose": "",
      "expected_exit_code": 0,
      "expected_outputs": [],
      "stop_conditions": []
    }
  ],
  "required_logs": [],
  "required_artifacts": [],
  "completion_gate": []
}
```

## 6. CODEX_EXECUTION_BRIEF.md

```text
# Local Codex Execution Brief

Task ID:
Branch:
Required delegation commit SHA:

## 읽기 최소 목록

## 이미 완료된 클라우드 변경

## 로컬 전용 작업

## 수정 허용 파일

## 실행 순서

## 기대 결과

## 즉시 중단·보고 조건

## 금지사항

## 완료 Gate

## 최종 보고 형식
```

## 7. DELEGATION_RESULT.md

```text
대행 task ID
branch
start SHA
delegation commit SHA
변경 파일
클라우드 정적 검증
로컬 미검증 항목
실행 브리프 경로
위험
마스터 검토 필요 여부
```

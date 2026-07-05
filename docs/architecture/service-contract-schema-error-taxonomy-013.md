# Task 013 서비스 계약 스키마 및 오류 분류

## 목적

Task 013은 Army Claw의 내부 서비스 어댑터 위에 UI 또는 backend route가 붙기 전에 지켜야 할 요청/응답 계약을 고정한다. 이번 문서는 실제 HTTP 서버나 production API framework를 선택하지 않고, in-process service function boundary가 반환해야 할 schema, enum, artifact path, error taxonomy를 proof 가능한 형태로 정리한다.

## 비목표

- 실제 HTTP 서버, Express, Fastify 구현
- UI 구현
- production queue worker, OS daemon, background scheduler 구현
- LLM planner, Model Gateway, Offline Skill Runtime 연결
- 실제 Hancom COM 실행
- python-hwpx 신규 의존성 도입
- 최종 HWPX core selection 선언
- Stage 2 전환 선언

## Service Operation Enum

허용 operation은 다음 6개로 고정한다.

| operation | 의미 |
| --- | --- |
| `submit` | 문서 작업 요청을 service job으로 접수 |
| `runJob` | 접수된 job을 실행 |
| `getJob` | job record 조회 |
| `getStatus` | job 상태 snapshot 조회 |
| `getResult` | terminal job의 결과 조회 |
| `listEvents` | job event history 조회 |

## Document Intent Enum

허용 document intent는 다음 4개다.

| intent | 의미 |
| --- | --- |
| `create_document` | 신규 HWPX 문서 생성 |
| `edit_paragraph` | 문단 수정 |
| `edit_table` | 표 수정 |
| `apply_style` | 스타일 적용 |

## Job Status Enum

| status | 의미 |
| --- | --- |
| `pending` | 접수되었지만 아직 실행 전 |
| `running` | 실행 중 |
| `completed` | 성공적으로 완료 |
| `failed` | 실행 또는 검증 실패 |
| `rejected` | 정책 또는 요청 오류로 거절 |

## Response Status Enum

| status | 의미 |
| --- | --- |
| `accepted` | 요청 접수 성공 |
| `pending` | job이 아직 대기 중 |
| `running` | job 실행 중 |
| `completed` | 결과 생성 완료 |
| `failed` | 실행 실패 |
| `rejected` | 정책상 거절 |
| `not_found` | 조회 대상 없음 |
| `not_ready` | 결과가 아직 준비되지 않음 |
| `validation_error` | contract 또는 산출물 검증 실패 |
| `policy_error` | 허용되지 않은 요청 또는 경로 |

Task 012의 일부 내부 응답은 `status: "error"`와 `error.type`을 사용했다. Task 013 계약에서는 route/UI가 직접 소비할 status를 `not_found`, `not_ready`, `validation_error`, `policy_error` 등으로 정규화한다. 기존 Task 012 산출물은 read-only reference로 남기고, 변환 정책은 Task 013 contract layer에서 다룬다.

## Service Request Contract

서비스 요청은 최소 다음 필드를 가진다.

| field | required | 설명 |
| --- | --- | --- |
| `service_request_id` | yes | service boundary 고유 요청 ID |
| `service_operation` | yes | service operation enum 중 하나 |
| `api_request_id` | submit에서 yes | 상위 API 요청 ID |
| `request_id` | submit에서 yes | agent request ID |
| `task_id` | submit에서 yes | 실행 task ID |
| `document_intent` | submit에서 yes | document intent enum 중 하나 |
| `content` | optional | 문서 내용 payload |
| `constraints` | optional | backend, no_real_com 등 실행 제약 |

## Service Response Contract

서비스 응답은 최소 다음 필드를 가진다.

| field | required | 설명 |
| --- | --- | --- |
| `service_request_id` | yes | service request ID |
| `service_operation` | yes | 호출 operation |
| `ok` | yes | service call 성공 여부 |
| `status` | yes | response status enum |
| `job_id` | nullable | 관련 job ID |
| `job_status` | nullable | 관련 job status |
| `data` | nullable | 성공 또는 조회 payload |
| `error` | nullable | 정규화된 service error |
| `artifacts` | yes | artifact path contract |
| `real_com_executed` | yes | 이번 contract proof에서는 항상 false |
| `final_core_selection_declared` | yes | 이번 contract proof에서는 항상 false |
| `stage_2_transition_declared` | yes | 이번 contract proof에서는 항상 false |

## Job Record Contract

job record는 `job_id`, `status`, request/response/plan/report/output/evidence 경로, 실패 정보, 시각 정보를 포함한다. `status`는 job status enum만 허용한다. `output_path`는 `completed` terminal success인 경우에만 non-null이 될 수 있다.

## Event Record Contract

event record는 `event_id`, `job_id`, `from_status`, `to_status`, `timestamp`, `reason`, `artifact_path`를 포함한다. `from_status`는 최초 이벤트에서 null이 될 수 있고, `to_status`는 항상 job status enum이어야 한다.

## Artifact Path Contract

고정 artifact path role은 다음과 같다.

| role | 규칙 |
| --- | --- |
| `service_request_path` | string 또는 null |
| `service_response_path` | string 또는 null |
| `job_path` | string 또는 null |
| `event_path` | string 또는 null |
| `snapshot_path` | string 또는 null |
| `request_path` | string 또는 null |
| `response_path` | string 또는 null |
| `plan_path` | string 또는 null |
| `report_path` | string 또는 null |
| `output_path` | terminal success에서만 non-null |
| `evidence_path` | string 또는 null |
| `evidence_paths` | 존재하면 array |

Task 013 proof artifact는 `release/test-documents/service-contract-schema-error-taxonomy-013/` 아래에만 생성한다. 이전 Task 012 root를 직접 overwrite하지 않는다.

## Error Taxonomy

| code | category | retryable | user_visible | expected_status |
| --- | --- | --- | --- | --- |
| `invalid_request` | request | false | true | `validation_error` |
| `unsupported_intent` | request | false | true | `policy_error` |
| `not_found` | lookup | false | true | `not_found` |
| `not_ready` | state | true | true | `not_ready` |
| `policy_error` | policy | false | true | `policy_error` |
| `validation_error` | validation | false | true | `validation_error` |
| `execution_error` | execution | true | true | `failed` |
| `artifact_missing` | artifact | false | false | `failed` |
| `contract_violation` | contract | false | false | `failed` |

## Retry Policy Note

`not_ready`와 일부 `execution_error`는 retryable로 볼 수 있다. 단, Task 013은 retry scheduler를 구현하지 않고 contract metadata로만 표시한다.

## UI 및 Backend Route가 지켜야 할 Contract

- route는 service operation enum 외의 operation을 만들지 않는다.
- UI는 `status`와 `error.code`를 기준으로 사용자 메시지를 만든다.
- `output_path`는 `completed` 성공 응답에서만 다운로드 또는 열기 대상으로 취급한다.
- `not_ready`는 polling 가능한 상태로 보고, `not_found`, `policy_error`, `validation_error`는 사용자 확인 또는 요청 수정 대상으로 표시한다.
- artifact path는 Task별 release/test-documents root 아래로 제한한다.

## Non-decisions

- HTTP endpoint path는 정하지 않았다.
- API framework는 정하지 않았다.
- UI polling UX는 정하지 않았다.
- production retry/backoff 정책은 정하지 않았다.
- 최종 HWPX core는 선택하지 않았다.
- Stage 2 전환은 선언하지 않았다.

## 다음 Task 014 권고

Task 014는 이 contract를 기반으로 HTTP가 아닌 in-process route facade 또는 mock route proof를 추가하는 것이 적절하다. 목표는 React UI와 backend route가 같은 request/response contract를 공유할 수 있는 thin boundary를 검증하는 것이다.

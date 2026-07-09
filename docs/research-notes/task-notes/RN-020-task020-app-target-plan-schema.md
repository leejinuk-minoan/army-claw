# RN-020 — Task 020 App Target Plan Schema Proof

## 1. Research Question

앱별 adapter가 실행 전에 수용할 수 있는 최소 plan payload 계약을 target별로 정의하고 검증할 수 있는가?

## 2. System Design Claim

Army Claw는 target별 plan schema와 adapter slot input contract를 분리해, LLM이 생성한 계획이 실행 가능한 구조인지 사전에 검증해야 한다. 문서형 대상 계획은 template reference, fill operations, constraints를 포함해야 하며, 원본 템플릿 덮어쓰기와 LLM 직접 파일 편집은 금지되어야 한다.

## 3. Method

Task 020은 Task 019 routing 결과 위에 각 app target plan의 최소 payload 구조를 정의했다. 유효한 sample plan, invalid plan, adapter slot input, validation result를 산출하고, 실제 adapter 호출 없이 `execution_allowed=false`, `actual_adapter_invoked=false` 상태를 유지했다.

## 4. Evidence

- Task report: `docs/gpt-communication/reports/2026-07-05-app-target-plan-schema-proof-020.md`
- Evidence summary: `release/test-documents/app-target-plan-schema-proof-020/tests/app-target-plan-schema-summary.json`
- Final commit: `c93e3fec627bfa493eaefefd974b04adc012ac41`

## 5. Result

Task 020은 5개 plan type과 4개 adapter slot input 계약을 검증했다. 문서형 plan은 `template_reference`, `fill_operations`, `constraints`를 필수 구조로 하며, HWP/HWPX, HanCell, HanShow 각각의 template artifact type 제한을 고정했다.

## 6. Paper-Ready Sentences

본 연구는 LLM의 자유 형식 출력을 직접 실행하지 않고, target별 plan schema에 맞는 구조화된 요청으로 제한한다.

Task 020의 결과는 생성형 모델이 만든 문서 생성 계획을 adapter가 실행 가능한 형식으로 변환하기 전에, schema와 정책 제약을 통해 검증할 수 있음을 보여준다.

이 방식은 템플릿 보존, 원본 덮어쓰기 방지, 오프라인 운용 요구를 실행 전 계약 수준에서 강제한다는 점에서 업무 문서 생성 시스템의 안전성 확보에 기여한다.

## 7. Limitations

Task 020은 plan schema와 adapter slot input boundary만 검증했다. 실제 HWP/HWPX adapter 실행, HanCell/HanShow adapter 구현, Model Gateway 구현, LLM planner 연결, UI/HTTP 계층은 포함하지 않았다.

## 8. Link to Development Records

- Task report: `docs/gpt-communication/reports/2026-07-05-app-target-plan-schema-proof-020.md`
- Evidence directory: `release/test-documents/app-target-plan-schema-proof-020/`
- Related previous note: `docs/research-notes/task-notes/RN-019-task019-app-target-routing.md`

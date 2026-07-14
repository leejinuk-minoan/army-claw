# HWPX Core Benchmark 003 Evidence Integrity 보고서

## 1. 작업 식별

- task_id: `hwpx-core-benchmark-003-evidence-integrity`
- Task Contract: `docs/gpt-communication/tasks/hwpx-core-benchmark-003-evidence-integrity/TASK_CONTRACT.md`
- branch: `feature/hwpx-core-benchmark`
- task_start_commit_sha: `0064049f03d4167b322e7b407518a0e42e685d83`
- tested_implementation_commit_sha: `5d4c60fe0911b430e648874ae45b06069270ab9e`
- 산출물 루트: `release/test-documents/hwpx-core-benchmark-003-evidence-integrity/`

## 2. 개발 단계

전체 8단계 중 현재는 1단계 `HwpAdapter 및 HWP/HWPX 엔진 안정화`의 하위 작업이다. 이번 작업은 Task 003 증거 무결성 체계를 만드는 작업이며, Task 004 외부 후보 실제 획득/실행, Task 005 Hancom COM 레이아웃 검증, 코어 선정, production 전환은 수행하지 않았다.

## 3. 변경 파일

- 추가: `tools/hancom/benchmark/hwpx-core-benchmark-003-evidence-integrity.mjs`
- 추가: `tools/hancom/hwpx-core-benchmark-evidence-integrity.test.mjs`
- 추가: `release/test-documents/hwpx-core-benchmark-003-evidence-integrity/**`

benchmark-001/002 산출물과 기존 2026-07-02 보고서는 수정하지 않았다.

## 4. 구현 요약

- `passed`, `failed`, `unsupported`, `blocked`, `not_applicable` 상태 enum을 분리했다.
- `planned_commands`와 `attempted_commands`를 분리하고, 실제 실행되지 않은 placeholder 명령은 attempted로 기록하지 않도록 검증했다.
- Editor, Validator, Layout Authority 역할별 role matrix를 생성했다.
- S06~S08 보존 검증은 before/after snapshot, mutation output, hash/namespace/관계 증거가 없으면 passed가 될 수 없도록 했다.
- S12 성능/설치 크기, S13 clean offline install, S14 license/redistribution gate를 별도 증거 gate로 만들었다.
- v1 fixture는 누락 파일을 생략하지 않고 explicit missing record로 기록했다.
- 5개 schema를 생성했다.
  - `schemas/adapter-execution.schema.json`
  - `schemas/benchmark-result.schema.json`
  - `schemas/benchmark-summary.schema.json`
  - `schemas/dependency-license-offline-manifest.schema.json`
  - `schemas/test-summary.schema.json`

## 5. invalid passed 교정 결과

benchmark-002의 근거 없는 passed는 Task 003에서 다음처럼 교정했다.

- S06: `passed -> blocked`
  - 누락: before/after merged-table snapshot, mutation output, span map, non-target entry hash
- S07: `passed -> blocked`
  - 누락: image/BinData hash 비교, relationship/reference 비교, mutation output
- S08: `passed -> blocked`
  - 누락: fwSpace before/after 비교, namespace prefix/URI map, mutation output
- S12: `passed -> blocked`
  - 누락: raw duration samples, peak RSS raw samples, artifact total size, runtime dependency install size, raw log
- S13: `passed -> blocked`
  - 누락: clean offline install, attempted command execution record, runtime network test
- S14: `passed -> blocked`
  - 누락: license path/hash, redistribution assessment/obligations

Task 003 summary의 `invalid_pass_count`는 `0`이다.

## 6. 역할 매트릭스

- Current Node/XML: Editor
  - S01~S08, S12~S14 applicable
  - S09~S11 not_applicable
- python-hwpx: Editor
  - artifact 미획득으로 applicable scenario는 blocked
  - S09~S11 not_applicable
- hwpxlib: Validator
  - S06~S08, S12~S14 applicable
  - 편집/레이아웃 scenario는 not_applicable
- HwpForge: Validator 후보
  - identity/artifact 미획득으로 applicable scenario는 blocked
  - 편집/레이아웃 scenario는 not_applicable
- Hancom COM: Layout Authority
  - S09~S11 blocked
  - 나머지는 not_applicable

## 7. Schema validation

- validator name: `ArmyClaw internal Draft 2020-12 profile validator`
- validator version: `0.3.0`
- validator path: `tools/hancom/benchmark/hwpx-core-benchmark-003-evidence-integrity.mjs`
- validator LICENSE path: `null`
- validator LICENSE SHA256: `null`
- limitation: 로컬 환경에 `ajv/dist/2020` 및 Python `jsonschema`가 없어 표준 Draft 2020-12 검증기가 아니라 Task 003 전용 내부 프로필 검증기로 검증했다.
- schema validation summary: `tests/schema-validation-summary.json`
- 검증 문서 수: `144`
- `all_expected_outcomes_met`: `true`
- negative fixture: `tests/negative-fixtures/bad-status.json`
  - expected_valid: `false`
  - actual valid: `false`
  - error: `$.status: enum`

이 한계 때문에 Task 003 completion gate는 완료로 선언하지 않는다.

## 8. Scorecard

- Editor Gate: `summary/editor-scorecard.json`
- Validator Gate: `summary/validator-scorecard.json`
- Layout Gate: `summary/layout-gate.json`

score formula는 status count나 passed count 배율이 아니라 scenario-specific evidence validator 통과 항목만 점수화하도록 기록했다. Task 003에서는 증거가 부족한 항목을 추정 점수로 올리지 않았다.

## 9. 테스트 결과

실행 로그:

- `tests/logs/task003-evidence-integrity.stdout.log`
- `tests/logs/task003-evidence-integrity.stderr.log`
- `tests/logs/all-hancom-tests.stdout.log`
- `tests/logs/all-hancom-tests.stderr.log`

실행 요약:

- Task 003 단위 테스트
  - command: `node --test tools/hancom/hwpx-core-benchmark-evidence-integrity.test.mjs`
  - exit_code: `0`
  - passed: `7`
  - failed: `0`
  - skipped: `0`
- 전체 Hancom 테스트
  - command: `node --test tools/hancom/*.test.mjs`
  - exit_code: `1`
  - passed: `7`
  - failed: `18`
  - skipped: `0`
  - 실패 원인: 기존 Hancom 테스트들이 `jszip` 모듈을 찾지 못함

GitHub CI는 이번 작업에서 사용할 수 없어 `independent_ci_verification: unavailable`로 기록했다.

## 10. 원본 및 과거 benchmark 불변성

다음 경로에 대한 diff 검사는 비어 있었다.

- `release/test-documents/hwpx-core-benchmark-001`
- `release/test-documents/hwpx-core-benchmark-002`
- `docs/gpt-communication/reports/2026-07-02-hwpx-core-benchmark-001.md`
- `docs/gpt-communication/reports/2026-07-02-hwpx-core-benchmark-002.md`

v1 fixture는 repository checkout에 없어 `availability_status: missing`, `sha256_before: null`, `sha256_after: null`로 기록했다.

## 11. 최종 상태

- user_visual_status: `not_requested_task_003_no_valid_com_resaved_outputs`
- completion_gate_passed: `false`
- codex_execution_status: `partial`
- core_selection: `prohibited`
- stage_transition: `prohibited`
- HwpAdapter_completion: `not_declared`
- master_review_required: `true`
- master_review_reasons:
  - `standards_compliant_schema_validator_unavailable`

## 12. 미완료 및 다음 입력

Task 003의 증거 무결성 모델과 산출물은 구현됐지만, 표준 Draft 2020-12 validator를 로컬 오프라인 의존성으로 고정하지 못했으므로 completion gate는 false다. 다음 작업은 다음 중 하나가 필요하다.

- Task 003 보강: 표준 JSON Schema validator를 오프라인 고정 의존성으로 반입하고 LICENSE/해시/재실행 절차까지 기록
- Task 004: 외부 후보 실제 artifact 획득/오프라인 설치/라이선스 검증
- Task 005: Hancom 2024 COM 기반 레이아웃 authority 검증

## 13. CODEX_LATEST 갱신용 payload

```json
{
  "task_id": "hwpx-core-benchmark-003-evidence-integrity",
  "branch": "feature/hwpx-core-benchmark",
  "task_start_commit_sha": "0064049f03d4167b322e7b407518a0e42e685d83",
  "tested_implementation_commit_sha": "5d4c60fe0911b430e648874ae45b06069270ab9e",
  "completion_gate_passed": false,
  "codex_execution_status": "partial",
  "core_selection": "prohibited",
  "stage_transition": "prohibited",
  "hwp_adapter_completion": "not_declared",
  "master_review_required": true,
  "master_review_reasons": [
    "standards_compliant_schema_validator_unavailable"
  ],
  "output_root": "release/test-documents/hwpx-core-benchmark-003-evidence-integrity",
  "report_path": "docs/gpt-communication/reports/2026-07-03-hwpx-core-benchmark-003-evidence-integrity.md"
}
```

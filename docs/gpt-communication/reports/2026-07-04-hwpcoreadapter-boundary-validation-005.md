# Task 005 HwpCoreAdapter Boundary Validation 보고서

## 1. 작업 정보

- 작업 ID: `hwpcoreadapter-boundary-validation-005`
- 저장소: `leejinuk-minoan/army-claw`
- 작업 브랜치: `agent/task005-hwpcoreadapter-boundary-validation`
- 시작 기준 SHA: `d12b018088985c5e7b8795b26f2b6bd4e53cbec2`
- 작업 성격: HwpCoreAdapter boundary skeleton 및 contract test 검증
- 실제 Hancom COM 실행: 없음
- Task 003 evidence 수정: 없음
- Task 004 문서 수정: 없음

## 2. 시작 조건 확인

- branch: `agent/task005-hwpcoreadapter-boundary-validation`
- HEAD: `d12b018088985c5e7b8795b26f2b6bd4e53cbec2`
- 시작 시 git status: clean
- Task 004 문서 3개 존재 확인
- Task 003 evidence result 파일 3개 read-only 확인

## 3. 읽은 기준 문서

- `docs/architecture/hwpx-core-selection-review-004.md`
- `docs/architecture/hwpx-core-adapter-boundary-004.md`
- `docs/gpt-communication/reports/2026-07-04-hwpx-core-selection-review-004.md`

Task 003 evidence는 다음 파일만 read-only reference로 확인했다.

- `release/test-documents/hwpx-core-benchmark-003-evidence-integrity/tests/post-d2-scenario-gates-v6.result.txt`
- `release/test-documents/hwpx-core-benchmark-003-evidence-integrity/tests/gate-d2-final-mapped-json-validation-v6.result.txt`
- `release/test-documents/hwpx-core-benchmark-003-evidence-integrity/tests/cross-artifact-consistency-v6.result.txt`

## 4. 구현 위치 결정

저장소는 `tools/hancom` 중심의 Node test 구조가 이미 존재한다. 따라서 Task 005의 권장 옵션 중 옵션 B를 선택했다.

- skeleton: `tools/hancom/hwpcoreadapter/HwpCoreAdapter.mjs`
- contract test: `tools/hancom/hwpcoreadapter/HwpCoreAdapter.contract.test.mjs`

이 경로는 기존 HWP/HWPX Node tooling 구조 안에 위치하며, 대규모 디렉터리 재구성을 만들지 않는다.

## 5. 추가한 boundary skeleton

`HwpCoreAdapter.mjs`에는 다음 최소 구성만 추가했다.

- `HwpCoreAdapter`
- `routeIntentToBackendRole`
- `createFileProbe`
- `EditorBackendStub`
- `SurgicalPatcherBackendStub`
- `ValidatorBackendStub`
- `LayoutAuthorityBackendStub`
- `TASK_004_BOUNDARY_MODEL`
- `TASK_003_READ_ONLY_REFERENCE_PATHS`

이번 skeleton은 production-grade HWPX 편집 엔진이 아니다. Task 004 boundary draft가 실제 코드와 테스트로 검증 가능한지 확인하기 위한 최소 boundary 모델이다.

## 6. Routing Contract Coverage

Contract test에서 다음 routing을 검증했다.

| intent | expected backend role |
| --- | --- |
| `create_document` | `editor` |
| `edit_paragraph` | `editor` |
| `edit_table` | `editor` |
| `apply_style` | `editor` |
| `patch_xml_preserve` | `surgical_patcher` |
| `replace_token_preserve` | `surgical_patcher` |
| `preserve_relationships` | `surgical_patcher` |
| `validate_structure` | `validator` |
| `validate_schema` | `validator` |
| `validate_evidence` | `validator` |
| `native_open_save` | `layout_authority` |
| `native_layout_check` | `layout_authority` |
| `native_render_check` | `layout_authority` |

Unknown intent는 `policy_error`로 실패하도록 검증했다.

## 7. Transaction / Promote Rule Coverage

다음 규칙을 contract test로 검증했다.

- `input_path == output_path`이면 `policy_error`
- input missing이면 backend 실행 전 실패
- backend failure이면 `promoted=false`
- validation failure이면 `promoted=false`
- backend success와 validation valid가 모두 true일 때만 `promoted=true`
- 성공 시 temp output을 final output으로 promote
- 실패 result에는 `failure.type`과 `last_successful_step` 포함

## 8. Evidence Ledger Coverage

모든 실행은 evidence JSON을 생성한다.

검증한 필드는 다음과 같다.

- `operation_id`
- `backend_role`
- `backend_id`
- `started_at`
- `ended_at`
- `input_probe`
- `output_probe`
- `validation`
- 실패 시 `failure.type`
- `sha256` 및 `hash_algorithm=sha256`

Evidence JSON은 사람이 읽는 보고서와 분리된 machine-readable record로 생성된다.

## 9. Layout Authority Stub

Task 005에서는 실제 Hancom COM을 실행하지 않았다. `LayoutAuthorityBackendStub`은 `realComExecuted=false`를 유지하며, boundary routing과 evidence contract만 검증한다.

Task 003에서 이미 native HWPX evidence가 생성되었기 때문에, 이번 작업에서는 COM 실행을 반복하지 않는 것이 지시와 일치한다.

## 10. TDD 기록

RED:

```text
node --test tools/hancom/hwpcoreadapter/HwpCoreAdapter.contract.test.mjs
ERR_MODULE_NOT_FOUND: HwpCoreAdapter.mjs
fail 1
```

GREEN:

```text
node --test tools/hancom/hwpcoreadapter/HwpCoreAdapter.contract.test.mjs
pass 15
fail 0
```

## 11. 검증 명령과 결과

Contract test:

```text
C:\Users\USER\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe --test tools/hancom/hwpcoreadapter/HwpCoreAdapter.contract.test.mjs
```

결과:

```text
pass 15
fail 0
```

기존 빠른 Hancom/Task 003 smoke test:

```text
$env:NODE_PATH='C:\Users\USER\Desktop\로컬 open claw 만들기\.tmp\openclaw-prod-install\node_modules'
C:\Users\USER\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe --test tools/hancom/hwpx-core-benchmark-contract.test.mjs tools/hancom/hwpx-core-benchmark-evidence-integrity.test.mjs
```

결과:

```text
pass 12
fail 0
```

참고: `NODE_PATH` 없이 실행하면 `jszip` module resolution 실패가 발생했다. repository-approved pinned node_modules cache를 지정한 뒤 동일 smoke가 통과했다.

Task 003 evidence read-only 확인 결과:

- `native_hwpx_probe_executed=true`
- `S06_valid=true`
- `S07_valid=true`
- `S08_valid=true`
- `S12_valid=true`
- `S13_valid=true`
- `S14_valid=true`
- `invalid_pass_count=0`
- `failure_count=0`
- `cross_artifact_consistency_valid=true`
- `completion_gate_passed=true`

## 12. 변경 파일

추가 파일:

- `tools/hancom/hwpcoreadapter/HwpCoreAdapter.mjs`
- `tools/hancom/hwpcoreadapter/HwpCoreAdapter.contract.test.mjs`
- `docs/gpt-communication/reports/2026-07-04-hwpcoreadapter-boundary-validation-005.md`

수정 파일:

- 없음

## 13. 금지 경로 확인

다음은 변경하지 않았다.

- `release/test-documents/hwpx-core-benchmark-003-evidence-integrity/**`
- `docs/architecture/hwpx-core-selection-review-004.md`
- `docs/architecture/hwpx-core-adapter-boundary-004.md`
- `docs/gpt-communication/reports/2026-07-04-hwpx-core-selection-review-004.md`
- 실제 Hancom COM 실행 또는 native HWPX evidence 재생성
- Stage 2 전환
- Task 006 진행
- main merge
- feature/hwpx-core-benchmark 변경

## 14. Completion Candidate 여부

Task 005는 completion candidate로 볼 수 있다.

근거:

- contract test 15/15 pass
- 기존 smoke test 12/12 pass
- 금지 경로 변경 0
- Task 003 evidence 변경 0
- Task 004 문서 변경 0
- 실제 COM 실행 없음
- 최종 HWPX core 선정 선언 없음

## 15. 다음 Task 006 권고

Task 006은 production implementation으로 바로 확대하기 전에 `HwpCoreAdapter Backend Proof`로 진행하는 것이 적절하다.

권고 범위:

1. `python-hwpx` 또는 선택된 editor 후보를 실제 backend adapter behind `HwpCoreAdapter`로 얇게 연결
2. 최소 paragraph/table/style operation 1개씩 실제 HWPX output 생성
3. `ArmyClawSurgicalHwpxPatcher`를 surgical backend로 연결하고 non-target preservation 증거 생성
4. validator backend를 실제 구조 검증기로 연결
5. Hancom COM layout authority는 별도 STA process wrapper로만 연결하고 timeout/cleanup evidence 유지
6. 실패 시 quarantine/promote 정책을 실제 파일 산출물에 적용

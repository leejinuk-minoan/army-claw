# Task 006 HwpCoreAdapter Backend Proof 보고서

## 1. 작업 정보

- 작업 ID: `hwpcoreadapter-backend-proof-006`
- 저장소: `leejinuk-minoan/army-claw`
- 작업 브랜치: `agent/task006-hwpcoreadapter-backend-proof`
- 시작 기준 SHA: `9ca25418c23b2284e782e544f51cedd4b6cd809f`
- 작업 성격: HwpCoreAdapter backend proof
- 실제 Hancom COM 실행: 없음
- 최종 HWPX core 선정 선언: 없음
- Stage 2 전환: 없음

## 2. Backend Proof Approach

Task 006은 production 전체 구현이 아니라 실제 HWPX 파일 산출물을 기준으로 boundary가 작동하는지 검증하는 최소 proof다.

구현은 Task 005의 `HwpCoreAdapter`를 유지하고, 별도 파일에 thin backend proof를 추가했다.

- proof module: `tools/hancom/hwpcoreadapter/HwpCoreAdapterBackendProof.mjs`
- proof test: `tools/hancom/hwpcoreadapter/HwpCoreAdapterBackendProof.test.mjs`
- proof artifacts: `release/test-documents/hwpcoreadapter-backend-proof-006/`

Editor backend proof는 기존 HWPX fixture를 복사한 뒤 `Contents/section0.xml`에 최소 XML 조각을 삽입한다. 이는 production editor가 아니라 실제 HWPX ZIP/XML 산출물을 만드는 얇은 proof다.

Surgical backend proof는 target entry인 `Contents/section0.xml`만 바꾸고, non-target entry SHA256 map을 비교한다.

Validator backend proof는 HWPX ZIP 구조와 필수 entry를 검사한다.

Layout authority proof는 실제 COM을 실행하지 않고 Task 003 native HWPX evidence path를 read-only로 probe한다.

## 3. Editor Backend Proof 결과

생성된 editor output:

- `release/test-documents/hwpcoreadapter-backend-proof-006/outputs/editor-paragraph-output.hwpx`
- `release/test-documents/hwpcoreadapter-backend-proof-006/outputs/editor-table-output.hwpx`
- `release/test-documents/hwpcoreadapter-backend-proof-006/outputs/editor-style-output.hwpx`

검증 결과:

- paragraph proof: HWPX output 생성, `Contents/section0.xml`에 paragraph marker 삽입 확인
- table proof: HWPX output 생성, `<hp:tbl>` 삽입 확인
- style proof: HWPX output 생성, style/charPr reference가 있는 paragraph marker 확인
- 모든 editor proof에서 `promoted=true`
- 모든 editor proof evidence에 input/output path, size, SHA256, backend_id, validation 결과 기록

## 4. Surgical Patcher Proof 결과

생성된 surgical output:

- `release/test-documents/hwpcoreadapter-backend-proof-006/outputs/surgical-patch-output.hwpx`

검증 결과:

- target entry: `Contents/section0.xml`
- changed entries: `Contents/section0.xml` only
- non-target entry hash map before/after 일치
- relationship/BinData 보존 체크 항목 기록
- preservation failure 강제 시 `promoted=false`
- preservation failure 강제 시 failure type은 `preservation_error`

## 5. Validator Proof 결과

생성된 validator output:

- `release/test-documents/hwpcoreadapter-backend-proof-006/outputs/validator-proof-output.hwpx`

검증 결과:

- valid HWPX proof output은 `valid=true`
- broken/non-HWPX input은 `valid=false`
- validation failure 강제 시 final output으로 promote되지 않음
- validation failure 시 failure type은 `validation_error`

## 6. Layout Authority Proof 결과

생성된 layout authority reference output:

- `release/test-documents/hwpcoreadapter-backend-proof-006/outputs/layout-authority-reference-output.json`

검증 결과:

- default run에서 `real_com_executed=false`
- Task 003 native evidence path를 read-only probe로 확인
- Hwp.exe process를 실행하거나 종료하지 않음
- 실제 Hancom COM smoke는 수행하지 않음

참조한 Task 003 native evidence:

- `release/test-documents/hwpx-core-benchmark-003-evidence-integrity/external-artifacts/task003-v6/native-hwpx/hancom-open-save-output.hwpx`

## 7. Generated Artifacts

주요 산출물:

- `release/test-documents/hwpcoreadapter-backend-proof-006/fixtures/source.hwpx`
- `release/test-documents/hwpcoreadapter-backend-proof-006/outputs/editor-paragraph-output.hwpx`
- `release/test-documents/hwpcoreadapter-backend-proof-006/outputs/editor-table-output.hwpx`
- `release/test-documents/hwpcoreadapter-backend-proof-006/outputs/editor-style-output.hwpx`
- `release/test-documents/hwpcoreadapter-backend-proof-006/outputs/surgical-patch-output.hwpx`
- `release/test-documents/hwpcoreadapter-backend-proof-006/outputs/validator-proof-output.hwpx`
- `release/test-documents/hwpcoreadapter-backend-proof-006/outputs/layout-authority-reference-output.json`
- `release/test-documents/hwpcoreadapter-backend-proof-006/evidence/editor-paragraph-evidence.json`
- `release/test-documents/hwpcoreadapter-backend-proof-006/evidence/editor-table-evidence.json`
- `release/test-documents/hwpcoreadapter-backend-proof-006/evidence/editor-style-evidence.json`
- `release/test-documents/hwpcoreadapter-backend-proof-006/evidence/surgical-preservation-evidence.json`
- `release/test-documents/hwpcoreadapter-backend-proof-006/evidence/surgical-preservation-failure-evidence.json`
- `release/test-documents/hwpcoreadapter-backend-proof-006/evidence/validator-evidence.json`
- `release/test-documents/hwpcoreadapter-backend-proof-006/evidence/validator-broken-evidence.json`
- `release/test-documents/hwpcoreadapter-backend-proof-006/evidence/validator-forced-failure-evidence.json`
- `release/test-documents/hwpcoreadapter-backend-proof-006/evidence/layout-authority-reference-evidence.json`
- `release/test-documents/hwpcoreadapter-backend-proof-006/tests/backend-proof-summary.json`

## 8. Tests Run

Task 006 backend proof test:

```text
$env:ARMY_CLAW_NODE_MODULES='C:\Users\USER\Desktop\로컬 open claw 만들기\.tmp\openclaw-prod-install\node_modules'
C:\Users\USER\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe --test tools/hancom/hwpcoreadapter/HwpCoreAdapterBackendProof.test.mjs
```

결과:

```text
pass 15
fail 0
```

Task 005 contract regression:

```text
C:\Users\USER\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe --test tools/hancom/hwpcoreadapter/HwpCoreAdapter.contract.test.mjs
```

결과:

```text
pass 15
fail 0
```

기존 빠른 Hancom/Task 003 smoke:

```text
$env:NODE_PATH='C:\Users\USER\Desktop\로컬 open claw 만들기\.tmp\openclaw-prod-install\node_modules'
C:\Users\USER\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe --test tools/hancom/hwpx-core-benchmark-contract.test.mjs tools/hancom/hwpx-core-benchmark-evidence-integrity.test.mjs
```

결과:

```text
pass 12
fail 0
```

## 9. Read-only Checks

Task 003 evidence:

- `release/test-documents/hwpx-core-benchmark-003-evidence-integrity/**` 변경 없음
- Task 003 native evidence는 layout authority reference proof에서 read-only probe로만 확인
- native HWPX evidence 재생성 없음

Task 004 문서:

- `docs/architecture/hwpx-core-selection-review-004.md` 변경 없음
- `docs/architecture/hwpx-core-adapter-boundary-004.md` 변경 없음
- `docs/gpt-communication/reports/2026-07-04-hwpx-core-selection-review-004.md` 변경 없음

Task 005 regression:

- Task 005 contract test 15/15 pass
- 기존 failure/promote/evidence 규칙 약화 없음
- `LayoutAuthorityBackendStub.realComExecuted=false` 규칙 유지

## 10. Risks

- editor proof는 기존 fixture의 ZIP/XML을 최소 수정하는 thin proof이며 production-grade 문서 편집 엔진이 아니다.
- table/style XML 조각은 boundary proof 목적의 최소 marker이며 최종 문서 품질 판단은 아니다.
- validator proof는 구조적 최소 검증이며 한글 2024 렌더 품질을 보장하지 않는다.
- layout authority는 실제 COM 실행이 아니라 Task 003 native evidence reference proof까지만 수행했다.
- 산출물 HWPX는 기존 fixture 기반이라 파일 크기가 크다.

## 11. Non-decisions

이번 Task 006에서는 다음을 결정하지 않았다.

- `python-hwpx` 최종 기본 editor backend 선정
- Node XML backend 최종 선정
- HWPX core final selection
- Stage 2 전환
- Task 007 진행
- 실제 Hancom COM 자동화 실행
- production HwpAdapter 전체 구현

## 12. Completion Candidate 여부

Task 006은 completion candidate다.

근거:

- Task 006 backend proof test pass
- Task 005 contract test pass
- 기존 빠른 Hancom/Task 003 smoke pass
- paragraph/table/style HWPX output 생성
- surgical preservation proof 생성
- validator proof 생성
- layout authority default real COM executed false
- evidence JSON 생성
- Task 003 evidence 변경 0
- Task 004 문서 변경 0
- 최종 core selection 선언 없음

## 13. Next Task 007 Recommendation

Task 007에서는 editor backend 선택을 더 좁혀야 한다.

권고 방향:

1. `python-hwpx`가 오프라인/로컬 환경에서 실제 설치 가능한지 dependency와 license를 확인한다.
2. `python-hwpx`가 paragraph/table/style을 현재 Node XML proof보다 안정적으로 표현하는지 비교한다.
3. `python-hwpx`가 불가능하거나 과도하면 Node XML thin backend를 interim editor backend로 유지한다.
4. 어떤 선택이든 Hancom COM layout authority는 opt-in/native 검증 계층으로 분리한다.
5. Task 006 proof artifact를 baseline으로 삼아 실제 editor backend 후보의 output fidelity를 비교한다.


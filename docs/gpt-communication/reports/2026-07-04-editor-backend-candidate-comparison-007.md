# Task 007 - Editor Backend Candidate Comparison

## 요약

Task 007은 HWPX 편집 백엔드 후보를 최종 선정하는 작업이 아니라, 다음 단계 판단을 위한 증거 기반 비교 작업이다.

비교 대상은 다음 두 가지다.

- Candidate A: python-hwpx
- Candidate B: Task 006 Node XML thin backend

이번 비교 결과, 현재 오프라인 로컬 환경에서 `python-hwpx`는 설치 가능성, 라이선스, 실제 문단/표/스타일 HWPX 출력 증거가 확인되지 않았다. 반면 Task 006의 Node XML thin backend는 이미 문단/표/스타일 출력, 보존성, 실패 증거, 검증기 연결 증거를 갖고 있으므로 **임시 editor backend 후보로 유지**하는 것이 적절하다.

이 보고서는 **최종 HWPX 코어 선정이 아니며**, Stage 2 전환도 선언하지 않는다.

## 시작 조건

- repository: `leejinuk-minoan/army-claw`
- branch: `agent/task007-editor-backend-candidate-comparison`
- base SHA: `142c207e691eca7fc1a2d59938a12238fdf03b23`
- task id: `editor-backend-candidate-comparison-007`
- worktree: `C:\Users\USER\Desktop\로컬 open claw 만들기\.tmp\task007-editor-backend-candidate-comparison-20260704145500`

## 읽은 기준 자료

- `docs/gpt-communication/reports/2026-07-04-hwpcoreadapter-backend-proof-006.md`
- `release/test-documents/hwpcoreadapter-backend-proof-006/tests/backend-proof-summary.json`
- `tools/hancom/hwpcoreadapter/HwpCoreAdapterBackendProof.mjs`
- `tools/hancom/hwpcoreadapter/HwpCoreAdapterBackendProof.test.mjs`
- `docs/architecture/hwpx-core-selection-review-004.md`
- `docs/architecture/hwpx-core-adapter-boundary-004.md`

## Candidate A: python-hwpx

### 확인 결과

- Python runtime: 사용 가능, `Python 3.12.8`
- import probe:
  - `import hwpx`: 실패, `ModuleNotFoundError`
  - `import python_hwpx`: 실패, `ModuleNotFoundError`
  - `import pyhwpx`: 실패, `ModuleNotFoundError`
- offline artifact count: `0`
- license verified: `false`
- paragraph/table/style output proof: 생성 불가
- online install: 시도하지 않음
- pip install: 시도하지 않음
- dependency vendoring: 시도하지 않음

### 판정

현재 저장소와 로컬 오프라인 환경만으로는 `python-hwpx`를 editor backend 후보로 검증할 수 없다. 따라서 이번 Task에서는 `python-hwpx`를 탈락시키는 것이 아니라, **향후 후보로 보류**한다.

향후 재검토 조건은 다음과 같다.

- 오프라인 반입 가능한 python-hwpx artifact 확보
- 라이선스/재배포 조건 검토
- paragraph/table/style HWPX 출력 proof 생성
- HwpCoreAdapter boundary와 validation pipeline 연결 증거 확보

## Candidate B: Node XML thin backend

### 확인 결과

Task 006 산출물과 테스트를 기준으로 다음 증거가 존재한다.

- paragraph HWPX output proof
- table HWPX output proof
- style HWPX output proof
- surgical preservation proof
- failure proof
- validator valid/broken/forced-failure proof
- layout authority reference proof
- Task 005 contract compatibility

이번 Task 007에서는 Task 006 산출물을 통째로 복사하지 않고, 기준 산출물의 존재와 요약 정보를 참조하는 방식으로 비교했다.

### 판정

Node XML thin backend는 최종 HWPX core로 확정하기에는 아직 범위가 제한되어 있으나, 현재 오프라인 개발 흐름에서는 **interim editor backend candidate**로 유지할 근거가 충분하다.

## 비교 매트릭스 요약

| 기준 | python-hwpx | Node XML thin backend |
| --- | --- | --- |
| 오프라인 가용성 | fail | pass |
| Windows 로컬 호환성 | partial | pass |
| 의존성 부담 | fail | partial |
| 라이선스 명확성 | not_verified | partial |
| 문단 출력 | fail | pass |
| 표 출력 | fail | pass |
| 스타일 출력 | fail | pass |
| 보존성 친화성 | not_verified | pass |
| evidence 호환성 | not_verified | pass |
| transaction/promote 호환성 | not_verified | pass |
| validation 호환성 | not_verified | pass |
| native layout authority 호환성 | partial | partial |
| 구현 리스크 | fail | partial |
| 운영 리스크 | fail | partial |

## 권고

이번 Task 007의 권고는 다음과 같다.

- `node_xml_thin_interim_editor`를 다음 단계의 임시 editor backend 후보로 유지한다.
- `python-hwpx`는 오프라인 artifact, 라이선스, 실제 출력 proof가 확보될 때까지 향후 후보로 보류한다.
- 이 판단은 최종 HWPX core selection이 아니다.
- Stage 2 transition은 선언하지 않는다.

## 생성 산출물

- `release/test-documents/editor-backend-candidate-comparison-007/python-hwpx/availability-probe.json`
- `release/test-documents/editor-backend-candidate-comparison-007/python-hwpx/dependency-probe.txt`
- `release/test-documents/editor-backend-candidate-comparison-007/python-hwpx/license-probe.txt`
- `release/test-documents/editor-backend-candidate-comparison-007/python-hwpx/paragraph-output-unavailable.json`
- `release/test-documents/editor-backend-candidate-comparison-007/python-hwpx/table-output-unavailable.json`
- `release/test-documents/editor-backend-candidate-comparison-007/python-hwpx/style-output-unavailable.json`
- `release/test-documents/editor-backend-candidate-comparison-007/python-hwpx/evidence.json`
- `release/test-documents/editor-backend-candidate-comparison-007/node-xml-thin/baseline-reference.json`
- `release/test-documents/editor-backend-candidate-comparison-007/node-xml-thin/output-fidelity-probe.json`
- `release/test-documents/editor-backend-candidate-comparison-007/node-xml-thin/evidence.json`
- `release/test-documents/editor-backend-candidate-comparison-007/comparison/editor-backend-comparison-matrix.json`
- `release/test-documents/editor-backend-candidate-comparison-007/comparison/recommendation.json`
- `release/test-documents/editor-backend-candidate-comparison-007/comparison/risk-register.json`
- `docs/gpt-communication/reports/2026-07-04-editor-backend-candidate-comparison-007.md`

## 금지 사항 준수

- 온라인 설치 없음
- `pip install` 없음
- `npm install` 없음
- dependency vendoring 없음
- 실제 Hancom COM 실행 없음
- Hwp.exe 조작 없음
- Task 003 evidence 변경 없음
- Task 004/005/006 완료 산출물 변경 없음
- Task 006 산출물 wholesale copy 없음
- final HWPX core selection 선언 없음
- Stage 2 transition 선언 없음
- Task 008 착수 없음

## 검증 기록

검증 명령과 결과는 최종 커밋 전 별도로 재실행한다. 완료 판정은 검증 결과가 모두 확인된 뒤에만 가능하다.

## 최종 검증 결과

커밋 전 검증으로 다음 명령을 실행했다.

```powershell
$env:ARMY_CLAW_NODE_MODULES='C:\Users\USER\Desktop\로컬 open claw 만들기\.tmp\openclaw-prod-install\node_modules'
node --test tools\hancom\hwpcoreadapter\HwpCoreAdapterBackendProof.test.mjs
node --test tools\hancom\hwpcoreadapter\HwpCoreAdapter.contract.test.mjs
node --test tools\hancom\hwpcoreadapter\EditorBackendCandidateComparison.test.mjs
```

결과:

- Task 006 backend proof: 15/15 pass
- Task 005 contract: 15/15 pass
- Task 007 comparison: 8/8 pass

기존 benchmark smoke도 다음 명령으로 실행했다.

```powershell
$env:NODE_PATH='C:\Users\USER\Desktop\로컬 open claw 만들기\.tmp\openclaw-prod-install\node_modules'
node --test tools\hancom\hwpx-core-benchmark-contract.test.mjs tools\hancom\hwpx-core-benchmark-evidence-integrity.test.mjs
```

결과:

- Existing Hancom/Task 003 smoke: 12/12 pass

Task 006 proof 테스트는 실행 과정에서 Task 006 완료 산출물을 재생성할 수 있으므로, 검증 후 해당 범위 변경은 커밋 대상에서 제외하고 HEAD 상태로 복원했다. Task 007 커밋에는 Task 007 허용 산출물만 포함한다.

## Completion Candidate 판단

Task 007은 completion candidate 상태다. 다만 이 결과는 editor backend 후보 비교 완료를 의미할 뿐, 최종 HWPX core selection 또는 Stage 2 transition을 의미하지 않는다.

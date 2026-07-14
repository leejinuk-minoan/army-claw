# Task 008 - Node XML Thin Backend Interim Adapter Integration

## 요약

Task 008은 Task 007에서 권고된 `Node XML thin backend`를 `HwpCoreAdapter`의 interim editor backend로 최소 통합하는 작업이다.

이번 작업은 production-grade HWPX editor 전체 구현이 아니며, 최종 HWPX core selection도 아니다. Stage 2 전환도 선언하지 않는다.

## 시작 조건

- repository: `leejinuk-minoan/army-claw`
- base branch: `agent/task007-editor-backend-candidate-comparison`
- branch: `agent/task008-node-xml-thin-interim-adapter-integration`
- start SHA: `905ff9fcd1f427068493d81d9c8117fa1fe94d20`
- task id: `node-xml-thin-interim-adapter-integration-008`
- worktree: `C:\Users\USER\Desktop\로컬 open claw 만들기\.tmp\t8`

## 읽은 파일

- `docs/gpt-communication/reports/2026-07-04-editor-backend-candidate-comparison-007.md`
- `release/test-documents/editor-backend-candidate-comparison-007/comparison/recommendation.json`
- `tools/hancom/hwpcoreadapter/HwpCoreAdapter.mjs`
- `tools/hancom/hwpcoreadapter/HwpCoreAdapterBackendProof.mjs`
- `tools/hancom/hwpcoreadapter/HwpCoreAdapterBackendProof.test.mjs`
- `docs/architecture/hwpx-core-adapter-boundary-004.md`

## 구현 접근

`NodeXmlThinInterimEditorAdapter.mjs`를 새로 추가했다. 기존 `HwpCoreAdapter`의 role routing, temp output, validation, promote/failure 모델은 그대로 사용하고, editor role backend로 Node XML thin adapter를 주입하는 구조다.

구현은 HWPX ZIP package의 `Contents/section0.xml` target entry만 수정한다. 최종 output은 `HwpCoreAdapter`가 validation 통과 이후에만 promote한다.

## 지원 intent

- `create_document`
- `edit_paragraph`
- `edit_table`
- `apply_style`

## 생성 산출물

- `release/test-documents/node-xml-thin-interim-adapter-integration-008/fixtures/source.hwpx`
- `release/test-documents/node-xml-thin-interim-adapter-integration-008/outputs/create-document-output.hwpx`
- `release/test-documents/node-xml-thin-interim-adapter-integration-008/outputs/edit-paragraph-output.hwpx`
- `release/test-documents/node-xml-thin-interim-adapter-integration-008/outputs/edit-table-output.hwpx`
- `release/test-documents/node-xml-thin-interim-adapter-integration-008/outputs/apply-style-output.hwpx`
- `release/test-documents/node-xml-thin-interim-adapter-integration-008/evidence/create-document-evidence.json`
- `release/test-documents/node-xml-thin-interim-adapter-integration-008/evidence/edit-paragraph-evidence.json`
- `release/test-documents/node-xml-thin-interim-adapter-integration-008/evidence/edit-table-evidence.json`
- `release/test-documents/node-xml-thin-interim-adapter-integration-008/evidence/apply-style-evidence.json`
- `release/test-documents/node-xml-thin-interim-adapter-integration-008/evidence/failure-validation-evidence.json`
- `release/test-documents/node-xml-thin-interim-adapter-integration-008/tests/interim-adapter-summary.json`

## 실행 결과

| operation | output | result |
| --- | --- | --- |
| create_document | `create-document-output.hwpx` | promoted true |
| edit_paragraph | `edit-paragraph-output.hwpx` | promoted true |
| edit_table | `edit-table-output.hwpx` | promoted true |
| apply_style | `apply-style-output.hwpx` | promoted true |
| validation failure proof | final output 없음 | promoted false, failure type `validation_error` |

## Evidence 요약

각 evidence JSON은 다음 필드를 기록한다.

- `task_id`
- `operation_id`
- `backend_role=editor`
- `backend_id=NodeXmlThinInterimEditorAdapter`
- `input_probe`
- `output_probe`
- `validation`
- `promoted`
- `failure`
- `changed_target_entry=Contents/section0.xml`
- `changed_entries`
- `non_target_preserved`
- `real_com_executed=false`

## 검증 결과

다음 명령을 실행했다.

```powershell
$env:ARMY_CLAW_NODE_MODULES='C:\Users\USER\Desktop\로컬 open claw 만들기\.tmp\openclaw-prod-install\node_modules'
node --test tools\hancom\hwpcoreadapter\NodeXmlThinInterimEditorAdapter.test.mjs
node --test tools\hancom\hwpcoreadapter\HwpCoreAdapter.contract.test.mjs
node --test tools\hancom\hwpcoreadapter\HwpCoreAdapterBackendProof.test.mjs
node --test tools\hancom\hwpcoreadapter\EditorBackendCandidateComparison.test.mjs

$env:NODE_PATH='C:\Users\USER\Desktop\로컬 open claw 만들기\.tmp\openclaw-prod-install\node_modules'
node --test tools\hancom\hwpx-core-benchmark-contract.test.mjs tools\hancom\hwpx-core-benchmark-evidence-integrity.test.mjs
```

결과:

- Task 008 interim adapter: 11/11 pass
- Task 005 contract: 15/15 pass
- Task 006 backend proof: 15/15 pass
- Task 007 comparison: 8/8 pass
- 기존 Hancom/Task 003 smoke: 12/12 pass

## Read-only 확인

Task 006/007 회귀 테스트는 실행 중 기존 산출물을 재생성할 수 있으므로 검증 후 해당 tracked 변경은 HEAD 상태로 복원했다.

최종 커밋 대상에는 다음만 포함한다.

- Task 008 adapter module
- Task 008 adapter test
- Task 008 proof artifacts
- Task 008 report

Task 003/004/005/006/007 완료 산출물은 read-only reference로만 사용했다.

## 금지 사항 준수

- 최종 HWPX core selection 선언 없음
- Stage 2 transition 선언 없음
- 별도 dependency 설치 없음
- online install 없음
- pip install 없음
- npm install 없음
- dependency vendoring 없음
- 실제 Hancom COM 실행 없음
- Hwp.exe process 조작 없음
- python-hwpx 신규 의존성 없음
- Task 009 착수 없음

## Risk

- Node XML thin adapter는 interim editor proof이며 production semantic editor가 아니다.
- native layout 품질은 Hancom COM layout authority 검증 단계에서 별도 확인해야 한다.
- 현재 통합은 `Contents/section0.xml` target entry 중심의 얇은 XML mutation에 한정된다.

## Non-decisions

- 최종 HWPX core는 선정하지 않았다.
- python-hwpx를 폐기하거나 채택하지 않았다.
- Stage 2 전환을 선언하지 않았다.

## Completion Candidate

Task 008은 completion candidate 상태다. 단, master review에서 원격 산출물과 evidence를 검증한 뒤에만 최종 완료로 볼 수 있다.

## 다음 Task 009 권고

Task 009는 interim editor를 실제 agent operation plan에 연결하는 최소 end-to-end proof가 적절하다. 권고 범위는 사용자 요청을 `create_document/edit_paragraph/edit_table/apply_style` operation으로 변환하고, HwpCoreAdapter 실행 결과와 evidence path를 agent execution report로 돌려주는 것이다.

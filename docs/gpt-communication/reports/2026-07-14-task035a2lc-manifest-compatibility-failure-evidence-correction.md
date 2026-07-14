# Task 035-A2L-C Manifest Compatibility and Failure Evidence Correction

## 개요

- 저장소: `leejinuk-minoan/army-claw`
- 작업 브랜치: `agent/task035-local-workspace-staged-output-controlled-promotion-boundary`
- 시작 SHA: `0921ea4b3c027675eb3e040a3481de88393b3018`
- 작업 유형: Task 035-A2L 교정 구현
- 완료 선언 범위: Task 035-A2L-C 교정 구현 및 로컬 회귀 검증 후보
- 제외 범위: Task 035-B 공식 로컬 검증, formal evidence bundle, `LOCAL_EXECUTION_RESULT.json`, Task 035 최종 완료 선언

## 원인

Task 035-A2L 구현에는 다음 교정 필요점이 있었다.

1. Task 033 canonical staged output evidence manifest sample을 whole response와 inner manifest 양쪽 입력으로 처리하지 못했다.
2. canonical artifact/receipt/relationship 필드 검증이 legacy fixture에 치우쳐 있었다.
3. 실패 응답의 `safety_assertions`가 실제 읽기/파일시스템 mutation 수행 여부를 충분히 드러내지 못했다.
4. source digest mismatch와 source changed 시뮬레이션 경로에서 source 파일을 직접 변경하는 테스트 보조 동작이 남아 있었다.
5. 경로 안전성에서 repeated path segment를 case collision으로 오판했다.
6. casefold collision 검사는 실제 existing sibling entry 기준이어야 했으나, 경로 세그먼트 자체 비교에 과도하게 묶여 있었다.
7. symlink/reparse 검사는 lexical component 단위의 fail-closed 동작과 검사 실패 evidence가 더 명확해야 했다.
8. adapter interface validator가 Task 033 canonical profile과 실패 evidence flag를 독립 체크로 확인하지 않았다.

## RED 회귀 테스트

다음 회귀 테스트를 먼저 추가한 뒤 실패를 확인했다.

- `tests/local_workspace_adapter/test_local_workspace_adapter.py`
  - Task 033 whole response manifest sample acceptance
  - Task 033 inner manifest sample acceptance
  - Task 033 canonical manifest linkage validation
  - source digest mismatch without source mutation
  - repeated path segment false collision 방지
  - existing sibling casefold collision 차단
  - lexical source/destination symlink probe
  - reparse inspection failure fail-closed
- `tests/adapter_interface_validator/test_adapter_interface_validator.py`
  - Task 033 manifest profile validator checks
  - Task 033 artifact/relationship field-name validator checks
  - negative controlled promotion failure evidence flags

초기 실행에서는 Task 033 manifest 입력이 blocked 처리되고, `FilesystemProbe`에 symlink/reparse inspection evidence 필드가 없으며, 실패 audit flag와 case collision 판단이 기대와 맞지 않아 실패했다.

## 수정 내용

### LocalWorkspaceAdapter

- Task 033 canonical manifest를 whole response와 inner manifest 입력 모두에서 허용하도록 `_inner_manifest_document()`와 `_validate_manifest_link()`를 교정했다.
- `execution_mode == "staged_output_evidence_manifest"` 입력에서 canonical validation flags, artifact digest, receipt, relationship linkage를 검증한다.
- `PromotionExecutionAudit`를 추가해 source content read, temp creation, final creation, cleanup, source mutation 여부를 실패 응답에 반영한다.
- source mismatch와 source changed 검증은 source 파일을 변경하지 않고 실패를 보고하도록 교정했다.
- lexical component 기반으로 approved root 내부 경로를 조립하고, symlink/reparse 검사를 각 component에 적용한다.
- repeated segment는 허용하고, 실제 parent directory sibling entry가 casefold-equal이면서 이름이 다를 때만 `destination_case_collision`을 반환한다.
- destination parent가 사전에 존재하지 않으면 temp 생성 전 실패하도록 promotion boundary를 좁혔다.
- reparse inspection 실패는 `unsupported_safety_check`으로 fail-closed 처리한다.

### Validator

- controlled promotion request sample에 대해 Task 033 manifest profile, canonical artifact field names, canonical relationship field names, whole/inner input form을 검사한다.
- negative sample expected section에 실패 evidence flag가 있는지 검사한다.
- validator total check 기준을 364 이상으로 상향했고, 현재 구현 기준 check count는 378이다.

### 문서 및 상태

- architecture 문서에 lexical component 검사, sibling-only casefold collision, no-overwrite hard-link commit, failure audit truthfulness, source immutability를 반영했다.
- contract JSON과 sample JSON들을 Task 033 canonical manifest profile 기준으로 갱신했다.
- `PROJECT_STATE.json`, `CURRENT.md`, RN-035, research note index, task contract, delegation brief, evidence README를 교정 구현 대기 상태로 갱신했다.
- `LOCAL_EXECUTION_RESULT_TEMPLATE.json`의 validator minimum 기준을 364로 갱신했다.

## 검증 결과

교정 후 다음 검증을 수행했다.

- `python -m unittest tests.local_workspace_adapter.test_local_workspace_adapter.LocalWorkspaceAdapterControlledPromotionTests`
  - `Ran 27 tests`
  - `OK (skipped=2)`
- `python -m unittest discover -s tests/local_workspace_adapter -p "test_*.py"`
  - `Ran 86 tests`
  - `OK (skipped=2)`
- `python -m unittest discover -s tests/adapter_interface_validator -p "test_*.py"`
  - `Ran 21 tests`
  - `OK`
- `python tools/validators/adapter_interface_validator.py --repo-root . --format text`
  - `status: valid`
  - `total_checks: 378`
  - `passed_checks: 378`
  - `failed_checks: 0`
  - `blocked_checks: 0`

최종 커밋 전 재검증 결과는 다음과 같다.

- `python -m json.tool docs/gpt-communication/PROJECT_STATE.json`
  - JSON parse 통과
- 관련 JSON 35개 일괄 parse
  - JSON parse 통과
- `python -m py_compile tools/adapters/local_workspace_adapter.py`
  - 통과
- `python -m py_compile tools/validators/adapter_interface_validator.py`
  - 통과
- `python tools/validators/adapter_interface_validator.py --repo-root . --format text`
  - `status: valid`
  - `total_checks: 378`
  - `passed_checks: 378`
  - `failed_checks: 0`
  - `blocked_checks: 0`
- `python -m unittest discover -s tests/adapter_interface_validator -p "test_*.py"`
  - `Ran 21 tests`
  - `OK`
- `python -m unittest discover -s tests/local_workspace_adapter -p "test_*.py"`
  - `Ran 86 tests`
  - `OK (skipped=2)`
- `git diff --check`
  - exit code 0
  - Windows line-ending warning만 출력

## 남은 공식 검증

- Task 035-B 공식 로컬 검증은 아직 수행하지 않았다.
- `LOCAL_EXECUTION_RESULT.json`은 생성하지 않았다.
- formal evidence bundle은 생성하지 않았다.
- Task 035 completion gate는 통과로 선언하지 않는다.
- Task 035 최종 완료도 선언하지 않는다.

## 현재 판정

- Task 033 manifest compatibility correction: implemented
- failure audit truthfulness correction: implemented
- source immutability correction: implemented
- lexical path safety correction: implemented
- sibling casefold collision correction: implemented
- validator correction: implemented
- Task 035-B readiness: pending final local verification and commit
- `completion_gate_passed`: false

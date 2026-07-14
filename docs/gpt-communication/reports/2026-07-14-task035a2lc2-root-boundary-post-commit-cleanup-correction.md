# Task 035-A2L-C2 Root Boundary and Post-Commit Cleanup Correction

## 개요

- Repository: `leejinuk-minoan/army-claw`
- Branch: `agent/task035-local-workspace-staged-output-controlled-promotion-boundary`
- Start HEAD: `4bef663cd408c57717ae19afa07a2b61fdbf92a9`
- Phase: `Task 035-A2L-C2`
- Title: `Root Boundary and Post-Commit Cleanup Correction`
- Formal evidence: not created
- `LOCAL_EXECUTION_RESULT.json`: not created
- Task 035 final completion: not claimed

## Root Cause

Master review에서 확인된 잔여 결함은 세 가지였다.

1. injected `staged_root` / `approved_root`가 `resolve()`된 뒤에만 검사되어 raw root 자체가 symlink, junction, reparse point인 경우를 놓칠 수 있었다.
2. final link 생성 뒤 temp cleanup이 실패하면 operation-created final cleanup으로 도달하지 못하거나, cleanup 단계별 결과를 충분히 보고하지 못할 수 있었다.
3. directory listing, source read/hash/stat, temp creation/write, final verification 등 예상 가능한 filesystem `OSError`가 structured blocking response 밖으로 escape할 수 있었다.

## RED Tests

TDD 순서에 따라 먼저 regression tests를 추가했고, 구현 전 다음 실패를 확인했다.

- `FilesystemProbe.__init__()`가 `root_symlink_paths`, `root_reparse_paths`, `root_inspection_failure_paths`, `directory_listing_failure_paths`, `read_failure_paths`, `temp_creation_failure`, `temp_cleanup_failure_count`, `final_cleanup_failure`를 알지 못해 12개 테스트가 오류로 실패했다.
- 이는 root boundary, cleanup state-machine, structured filesystem error 주입 지점이 구현되지 않았음을 보여준다.

RED command:

```powershell
python -m unittest tests.local_workspace_adapter.test_local_workspace_adapter.LocalWorkspaceAdapterControlledPromotionTests
```

RED result:

```text
Ran 38 tests
FAILED (errors=12, skipped=2)
```

## 수정 내용

### Root Lexical Safety

- `_validate_injected_root(raw_root, probe, role)`를 추가했다.
- raw staged root와 raw approved root를 `resolve()` 전에 `lstat` 기반으로 검사한다.
- root symlink는 `symlink_not_allowed`로 차단한다.
- root reparse point는 `reparse_point_not_allowed`로 차단한다.
- root inspection failure는 `unsupported_safety_check`로 fail closed 처리한다.
- root missing 또는 non-directory는 역할에 따라 `source_outside_staged_root` 또는 `approved_root_not_allowed`로 차단한다.

### Cleanup State Machine

- `PromotionExecutionAudit`에 temp/final cleanup attempted/succeeded, cleanup error codes, original error code를 추가했다.
- final 생성 이후 실패 시 operation-created final cleanup과 temp cleanup을 독립적으로 시도한다.
- 하나의 cleanup 실패가 다른 cleanup 시도를 막지 않도록 early return을 제거했다.
- pre-existing destination은 cleanup target으로 취급하지 않는다.
- 실패 response의 `safety_assertions`에 다음 필드를 기록한다.
  - `temporary_path_cleaned`
  - `final_path_cleaned`
  - `cleanup_attempted`
  - `cleanup_complete`
  - `cleanup_error_codes`
  - `original_error_code`

### Structured Filesystem Error Boundary

- `FilesystemProbe`에 deterministic failure injection을 추가했다.
- directory listing failure는 `unsupported_safety_check`로 변환한다.
- source read/hash/stat failure는 covered tests에서 `final_verification_failed`로 변환한다.
- temp creation/write failure는 `exclusive_create_failed`로 변환한다.
- temp/final unlink failure는 `temporary_cleanup_failed`와 cleanup evidence로 변환한다.

## GREEN Tests

수정 후 targeted controlled promotion tests를 재실행했다.

```powershell
python -m unittest tests.local_workspace_adapter.test_local_workspace_adapter.LocalWorkspaceAdapterControlledPromotionTests
```

결과:

```text
Ran 38 tests
OK (skipped=2)
```

이후 local workspace adapter 전체 테스트를 실행했다.

```powershell
python -m unittest discover -s tests/local_workspace_adapter -p "test_*.py"
```

결과:

```text
Ran 97 tests
OK (skipped=2)
```

skip 2개는 Windows symlink 생성 권한에 의존하는 real symlink 보조 테스트다. deterministic root/cleanup tests는 skip 없이 실행되었다.

## 문서 및 Validator 갱신

- controlled promotion contract에 raw root validation, cleanup state-machine, structured filesystem error policy를 추가했다.
- official validator에 controlled promotion contract policy static checks를 추가했다.
- adapter validator checklist와 validation matrix 문서를 Task 035-A2L-C2 기준으로 갱신했다.
- `PROJECT_STATE.json`, `CURRENT.md`, RN-035, research note index를 Task 035-A2L-C2 상태로 동기화했다.
- `LOCAL_EXECUTION_RESULT_TEMPLATE.json`에는 Task 035-B가 기록해야 할 root/cleanup/OSError 검증 필드를 추가했다.

## 남은 작업

- Task 035-B formal local verification은 아직 수행하지 않았다.
- `LOCAL_EXECUTION_RESULT.json`은 생성하지 않았다.
- formal evidence bundle은 생성하지 않았다.
- `completion_gate_passed`는 계속 `false`다.
- Task 035 final completion은 선언하지 않는다.

## 최종 검증 결과

커밋 전 다음 검증을 실행했다.

```powershell
python -m json.tool docs/gpt-communication/PROJECT_STATE.json
python -m json.tool docs/research-notes/research-note-index.json
python -m json.tool docs/gpt-communication/contracts/local-workspace-staged-output-controlled-promotion-boundary.json
python -m py_compile tools/adapters/local_workspace_adapter.py
python -m py_compile tools/validators/adapter_interface_validator.py
python tools/validators/adapter_interface_validator.py --repo-root . --format text
python -m unittest discover -s tests/adapter_interface_validator -p "test_*.py"
python -m unittest discover -s tests/local_workspace_adapter -p "test_*.py"
git diff --check
```

결과:

```text
PROJECT_STATE.json parse: pass
research-note-index.json parse: pass
controlled promotion contract JSON parse: pass
adapter-interface-validation-matrix.json parse: pass
tools/adapters/local_workspace_adapter.py py_compile: pass
tools/validators/adapter_interface_validator.py py_compile: pass
validator CLI: valid / total_checks 383 / passed 383 / failed 0 / blocked 0
adapter validator unittest: Ran 22 tests / OK
local workspace adapter unittest: Ran 97 tests / OK (skipped=2)
git diff --check: exit 0, Windows line-ending warnings only
LOCAL_EXECUTION_RESULT.json: not created
formal evidence bundle: not created
```

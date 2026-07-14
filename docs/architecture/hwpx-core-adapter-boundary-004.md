# HwpCoreAdapter Boundary Draft 004

## 1. 목적

`HwpCoreAdapter`는 Army Claw의 HWPX 작업 요청을 구체 backend로 라우팅하고, 파일 보존, 검증, 실패 처리, evidence 기록을 일관되게 강제하는 경계 계층이다.

Task 004의 이 문서는 구현이 아니라 Task 005에서 검증할 boundary draft다.

## 2. 책임

`HwpCoreAdapter`는 다음을 책임진다.

- 사용자 작업 계획을 HWPX 편집 명령으로 변환 가능한 내부 operation으로 받는다.
- 작업 유형에 따라 editor, surgical patcher, validator, layout authority backend를 선택한다.
- input/output 경로, 파일 크기, SHA256, 생성 시각, backend 이름, command record를 evidence로 남긴다.
- backend 실행 전 input probe를 수행한다.
- backend 실행 후 output probe와 schema/structural/native 검증을 수행한다.
- 실패 시 부분 생성물을 quarantine하거나 폐기하고, 실패 원인과 마지막 성공 단계를 반환한다.
- 기존 문서 수정 시 비대상 ZIP entry 보존 규칙을 적용한다.
- Hancom COM 실행은 격리된 STA process와 timeout/cleanup 규칙을 강제한다.

## 3. 책임이 아닌 것

`HwpCoreAdapter`는 다음을 하지 않는다.

- LLM prompt 생성이나 대화 정책을 직접 담당하지 않는다.
- React UI 상태 관리를 담당하지 않는다.
- 특정 backend의 내부 XML 조작 로직을 직접 복제하지 않는다.
- Hancom COM process를 장시간 상주시켜 사용자 문서 작업과 섞지 않는다.
- 검증 실패를 성공으로 변환하지 않는다.
- Task 003 evidence나 benchmark schema를 런타임에서 수정하지 않는다.

## 4. Backend Role Model

| Backend role | 후보 | 사용 조건 | 출력 |
| --- | --- | --- | --- |
| editor | `python-hwpx` | 신규 문서 생성, 문단/표/스타일 일반 편집 | HWPX output + edit evidence |
| surgical_patcher | `ArmyClawSurgicalHwpxPatcher` | 기존 문서에서 특정 XML/토큰만 정밀 수정 | HWPX output + preservation evidence |
| validator | `hwpxlib`, Ajv/JSON Schema | 구조, schema, evidence JSON 검증 | validation report |
| layout_authority | `Hancom 2024 COM` | 실제 한글 2024 open/save/render 판단 | native smoke report + optional normalized output |
| future_tooling | `HwpForge` | CLI/MCP/benchmark 보조 실험 | tool report |

## 5. Editor Backend Contract

Editor backend는 다음 계약을 만족해야 한다.

- 입력: `input_path` 선택, `output_path` 필수, operation list, style/table/paragraph options
- 출력: output HWPX 파일, backend report JSON, stdout/stderr 또는 equivalent log
- 필수 probe: output exists, size > 0, SHA256 계산 가능
- 필수 보증: input을 직접 덮어쓰지 않는다.
- 실패 처리: output이 불완전하면 success를 반환하지 않는다.
- Task 005 최소 검증: paragraph insert, table create/edit, style apply, output validation

## 6. Surgical Patcher Contract

Surgical patcher는 다음 계약을 만족해야 한다.

- 입력: input HWPX, output HWPX, target entry, patch plan, preservation policy
- 출력: patched HWPX, before/after snapshot, target diff, non-target hash map
- 필수 보증: 비대상 ZIP entry의 path/size/SHA256 보존 여부를 보고한다.
- 필수 보증: image/BinData/relationship, namespace/fwSpace 보존 검증을 지원한다.
- 제한: 일반 문서 생성, 복잡한 layout 계산, native 렌더 판단을 담당하지 않는다.

## 7. Validator Backend Contract

Validator backend는 다음 계약을 만족해야 한다.

- 입력: HWPX path 또는 evidence JSON path, schema/profile 선택
- 출력: validation result, failure list, validator version, license/dependency reference
- 필수 보증: invalid input이 pass로 보고되지 않도록 `invalid_pass_count`를 기록한다.
- 필수 보증: schema compile failure와 validation failure를 구분한다.
- 제한: validator는 문서를 수정하지 않는다.

## 8. Layout Authority Contract

Hancom COM layout authority는 다음 계약을 만족해야 한다.

- 별도 PowerShell STA process에서 실행한다.
- `HWPFrame.HwpObject` 생성, RegisterModule 후보 시도, open/save 또는 new/save smoke를 기록한다.
- timeout을 둔다.
- 실행 전후 `Hwp.exe` 계열 process inventory를 기록한다.
- 사용자 작업 중인 한컴 창과 섞이지 않도록 한다.
- output exists, size, SHA256, native open/save 성공 여부를 evidence로 남긴다.
- 실패 시 COM ProgID, 마지막 성공 단계, PID, stdout/stderr, 잔류 process를 보고한다.

## 9. Evidence Model

모든 backend 실행은 최소한 다음 evidence를 남긴다.

```json
{
  "task_id": "...",
  "operation_id": "...",
  "backend_role": "editor|surgical_patcher|validator|layout_authority",
  "backend_id": "...",
  "started_at": "...",
  "ended_at": "...",
  "exit_code": 0,
  "input_probe": {
    "path": "...",
    "exists": true,
    "size": 0,
    "sha256": "..."
  },
  "output_probe": {
    "path": "...",
    "exists": true,
    "size": 0,
    "sha256": "..."
  },
  "validation": {
    "valid": true,
    "validator": "...",
    "failure_count": 0
  }
}
```

증거 기록은 사람이 읽는 보고서와 기계 검증 가능한 JSON을 분리한다.

## 10. Failure Model

실패는 다음 범주로 나눈다.

| 실패 유형 | 예시 | 처리 |
| --- | --- | --- |
| input_error | input 없음, ZIP 구조 오류 | 실행 전 중단 |
| backend_error | editor/patcher 예외 | output quarantine, report 생성 |
| validation_error | schema/structural 검증 실패 | success false, output 사용 금지 |
| native_layout_error | Hancom open/save 실패, timeout | COM cleanup 후 실패 보고 |
| preservation_error | 비대상 entry hash 변경 | surgical patch 실패로 처리 |
| policy_error | 허용되지 않은 경로 쓰기 | 즉시 중단 |

성공 조건은 backend success와 validation success가 모두 true여야 한다.

## 11. Transaction Model

권고 transaction 흐름은 다음과 같다.

1. input probe 생성
2. temp output 경로 예약
3. backend 실행
4. temp output probe 생성
5. validator 실행
6. 필요 시 Hancom COM layout authority 실행
7. 모든 검증 통과 시 final output으로 promote
8. 실패 시 temp output quarantine 또는 삭제, evidence 유지

final output promote 전에는 원본 파일을 덮어쓰지 않는다.

## 12. File Preservation Rule

기존 HWPX 수정은 다음 규칙을 따른다.

- target entry 목록을 명시한다.
- target 외 entry는 path, compressed/uncompressed content hash, size 보존 여부를 기록한다.
- image/BinData/relationship entry는 별도 preservation check를 둔다.
- namespace와 fwSpace 순서 보존이 필요한 문서는 S08 계열 check를 수행한다.
- preservation check 실패 시 output을 성공 산출물로 취급하지 않는다.

## 13. COM Isolation Rule

Hancom COM은 다음 원칙으로만 호출한다.

- 장시간 daemon으로 유지하지 않는다.
- 작업별 별도 STA process를 우선한다.
- timeout과 cleanup을 mandatory로 둔다.
- 실행 전후 process inventory를 evidence로 남긴다.
- 사용자가 열어둔 문서 창을 임의 종료하지 않는다.
- orphan/stuck process cleanup은 사용자 확인과 로그 기록 이후에만 수행한다.

## 14. Output Validation Rule

HWPX output은 다음 단계 중 필요한 검증을 통과해야 한다.

- ZIP/package structure probe
- XML parse/namespace check
- JSON evidence schema validation
- independent validator check
- Hancom COM open/save smoke
- preservation check

검증 중 하나라도 실패하면 `success=false`로 반환한다.

## 15. Extension Points

`HwpCoreAdapter`는 다음 확장점을 둔다.

- `EditorBackend`: `python-hwpx` 외 추가 편집 backend 교체
- `SurgicalPatchBackend`: XML patcher 교체 또는 프로파일 추가
- `ValidatorBackend`: `hwpxlib`, schema validator, custom validator 추가
- `LayoutAuthorityBackend`: Hancom COM, 향후 viewer/render checker 추가
- `EvidenceStore`: filesystem JSON, SQLite, project report 연동
- `PolicyProvider`: offline dependency, allowed path, user safety policy 적용

## 16. Task 005 검증 권고

Task 005는 구현 전체가 아니라 boundary validation으로 시작한다.

최소 통과 조건은 다음과 같다.

- adapter가 editor/surgical/validator/layout authority를 역할별로 라우팅한다.
- 각 backend 호출이 input/output probe와 evidence를 남긴다.
- 실패 시 output을 성공으로 promote하지 않는다.
- 원본 파일을 직접 덮어쓰지 않는다.
- Hancom COM은 별도 STA process와 timeout을 사용한다.
- Task 003 evidence와 schema는 수정하지 않는다.

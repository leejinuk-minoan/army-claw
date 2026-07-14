# HWPX Core Selection Review 004

## 1. 문서 목적

이 문서는 Task 003 `hwpx-core-benchmark-003-evidence-integrity`의 완료 증거를 근거로 Army Claw의 HWPX 처리 코어 후보를 검토하고, Task 005에서 검증할 어댑터 경계의 방향을 정한다.

중요한 제한은 다음과 같다.

- 이 문서는 최종 코어 선정을 선언하지 않는다.
- 이 문서는 구현 변경을 포함하지 않는다.
- Task 004의 결론은 역할 배정 권고와 Task 005 검증 항목으로 한정한다.
- Task 003 증거는 읽기 전용 근거로만 사용했다.

## 2. 확인한 Task 003 증거 요약

| 항목 | 확인 결과 | 근거 |
| --- | --- | --- |
| Gate A | 78/78 pass, fail 0 | `tests/gate-a-task003-six-node-v6.result.txt` |
| Gate B | 142/142 pass, fail 0 | `tests/gate-b-current-full-hancom-v6.result.txt` |
| Gate C | Ajv 8.20.0, parse/meta/compile failure 0 | `tests/gate-c-ajv-meta-schema-v6.result.txt` |
| Gate D-2 | final mapped JSON validation failure_count 0 | `tests/gate-d2-final-mapped-json-validation-v6.result.txt` |
| Post-D2 native gates | S06/S07/S08/S12/S13/S14 valid true | `tests/post-d2-scenario-gates-v6.result.txt` |
| Cross-artifact | `cross_artifact_consistency_valid=true`, `completion_gate_passed=true` | `tests/cross-artifact-consistency-v6.result.txt` |
| Manifest diff | forbidden_count 0, unexpected_diff_count 0 | `tests/manifest-unexpected-diff-v6.result.txt` |
| Native HWPX probe | `native_hwpx_probe_executed=true` | `docs/gpt-communication/reports/2026-07-04-hwpx-core-benchmark-003-v6-native-completion.md` |

추가로 실제 native HWPX 파일 증거가 존재한다.

- `external-artifacts/task003-v6/native-hwpx/hancom-empty-save-hardcoded-visible.hwpx`
- `external-artifacts/task003-v6/native-hwpx/hancom-open-save-output.hwpx`
- `external-artifacts/task003-v6/native-hwpx/hancom-picture-output.hwpx`

S07 증거에는 `BinData/image1.png`의 이미지 경로, 크기, SHA256, relationship source/id/type/target/reference가 기록되어 있다. S08 증거에는 root/section namespace 선언, prefix/URI map, fwSpace 관련 정보가 기록되어 있다.

## 3. 후보 목록

| 후보 | Task 004에서의 역할 후보 | Task 004 판정 |
| --- | --- | --- |
| `current_node_xml` / `ArmyClawSurgicalHwpxPatcher` | 정밀 XML 보존형 surgical patcher | 채택 후보. 범용 문서 생성 코어로 과대평가하지 않는다. |
| `python-hwpx` | 기본 HWPX 편집 코어 후보 | 조건부 1순위. Task 005에서 adapter boundary 검증 필요. |
| `Hancom 2024 COM` | native layout authority | 필수 권위 계층. 일반 백엔드가 아니라 최종 열기/저장/렌더 판단자. |
| `hwpxlib` | 독립 parser/validator 후보 | 검증 계층 후보. 편집 코어로 선정하지 않는다. |
| `HwpForge` | 향후 CLI/MCP/벤치마크 도구 후보 | 실험/확장 후보. Task 004에서 main core로 선정하지 않는다. |

## 4. 역할 배정 매트릭스 권고

| 계층 | 권고 후보 | 책임 | 근거 기반 이유 |
| --- | --- | --- | --- |
| 기본 편집 코어 | `python-hwpx` | 문단, 표, 스타일, 일반 문서 구조 편집 | 일반 HWPX 조작 백엔드로 분리하기에 가장 자연스럽다. 다만 Task 003 증거만으로 최종 확정하지 않고 Task 005에서 경계 검증을 요구한다. |
| Surgical patcher | `ArmyClawSurgicalHwpxPatcher` | 대상 XML만 정밀 치환하고 비대상 ZIP entry 보존 | S06/S07/S08 증거가 target diff, image/BinData/relationship, namespace/fwSpace 보존 검증 축을 제공한다. |
| Layout authority | `Hancom 2024 COM` | 실제 한글 2024 open/save/render 판단, native HWPX smoke 검증 | `HWPFrame.HwpObject` 기반 COM smoke, empty-save/open-save/picture output 파일이 생성되었다. |
| 독립 검증 | `hwpxlib` | 구조 파싱, 입력 검증, 보조 validator | 편집 책임보다 validator 책임에 맞다. |
| 향후 도구 | `HwpForge` | CLI/MCP/벤치마크 보조, 실험 후보 | 현재 Task 004에서 기본 코어로 고정할 충분한 근거는 없다. |

## 5. 후보별 근거 기반 강점

### `current_node_xml` / `ArmyClawSurgicalHwpxPatcher`

- 대상 XML에 대한 정밀 변경과 비대상 entry 보존 책임에 적합하다.
- S06에서 input/output HWPX, before/after snapshot, merged-cell/row-span/col-span map, allowed target diff, non-target entry hash preservation 축이 검증되었다.
- S07에서 image/BinData/relationship 증거가 확인되었다.
- S08에서 namespace와 fwSpace 문서 순서 증거가 확인되었다.

### `python-hwpx`

- HWPX 문서의 일반 편집 API를 제공할 기본 후보로 가장 적합하다.
- 문단/표/스타일 같은 상위 개념을 `HwpCoreAdapter` 뒤에 숨길 수 있다.
- 다만 Task 003의 증거는 adapter boundary까지 확정한 것이 아니므로, Task 005에서 최소 기능 계약과 실패 모델을 검증해야 한다.

### `Hancom 2024 COM`

- 실제 한글 2024가 열고 저장한 native HWPX evidence가 존재한다.
- empty-save, open-save, picture output으로 native smoke 범위가 확인되었다.
- 최종 사용자 관점의 열림 가능성, 저장 가능성, 렌더 안정성 판단 계층으로 필요하다.

### `hwpxlib`

- 편집 코어보다는 Java 기반 구조 검증, 독립 parser/validator 역할에 맞다.
- 편집 결과를 제3의 구조 검증기로 확인하는 계층으로 유용하다.

### `HwpForge`

- CLI/MCP나 향후 benchmark/inspection 도구로 확장 여지가 있다.
- 현재는 기본 편집 코어로 고정하지 않고 실험 후보로 유지한다.

## 6. 근거 기반 한계와 위험

| 항목 | 한계/위험 | 대응 방향 |
| --- | --- | --- |
| 최종 코어 확정 | Task 003은 evidence integrity와 native probe 완료가 중심이며 adapter boundary 검증은 아직 아니다. | Task 005에서 `HwpCoreAdapter` 계약 테스트를 작성한다. |
| `python-hwpx` | 실제 Army Claw 편집 명령을 얼마나 안정적으로 추상화하는지 아직 불충분하다. | 최소 문단/표/스타일/파일 보존 시나리오를 adapter contract로 검증한다. |
| Surgical patcher | 범용 문서 생성이나 높은 수준 편집 엔진으로 확장하면 책임이 커진다. | target XML patch와 preservation 전용으로 제한한다. |
| Hancom COM | Windows/Hancom 설치 의존, hidden dialog, orphan `Hwp.exe`, headless 안정성 위험이 있다. | 별도 STA process, timeout, cleanup log, 프로세스 격리, 사용자 작업 보호 규칙을 둔다. |
| 검증 계층 | Ajv schema 통과가 실제 렌더 품질을 보장하지 않는다. | schema validator, independent validator, Hancom COM layout authority를 순차 적용한다. |
| 라이선스/오프라인 | 각 dependency의 재배포 의무가 달라질 수 있다. | Task 003 S13/S14 evidence와 별도 dependency manifest를 유지한다. |

## 7. 권고 아키텍처

권고 구조는 단일 코어가 모든 일을 맡는 방식이 아니라, 역할을 분리한 계층형 구조다.

```text
Army Claw prompt/task plan
  -> HwpCoreAdapter
      -> 기본 편집 backend 후보: python-hwpx
      -> surgical patch backend: ArmyClawSurgicalHwpxPatcher
      -> validator backend: hwpxlib + JSON Schema/Ajv
      -> layout authority: Hancom 2024 COM
  -> evidence ledger / artifact probe / failure report
```

핵심 원칙은 다음과 같다.

- LLM과 UI는 특정 HWPX 라이브러리를 직접 호출하지 않는다.
- 모든 HWPX 쓰기는 `HwpCoreAdapter`를 통과한다.
- 일반 편집은 기본 편집 backend가 담당한다.
- 보존성이 중요한 기존 문서 수정은 surgical patcher가 담당한다.
- 실제 한글 2024 렌더/저장 판단은 Hancom COM authority가 담당한다.
- 검증 실패는 조용히 무시하지 않고 evidence와 함께 반환한다.

## 8. 결정 상태

Task 004의 결정 상태는 다음과 같다.

- 기본 편집 코어: `python-hwpx` 후보를 우선 검증 대상으로 권고한다.
- Surgical patcher: `ArmyClawSurgicalHwpxPatcher`를 정밀 보존 수정 계층으로 둔다.
- Layout authority: `Hancom 2024 COM`을 최종 native 판단 계층으로 둔다.
- Validator: `hwpxlib`를 독립 검증 후보로 둔다.
- Future/experimental: `HwpForge`는 향후 CLI/MCP/benchmark 후보로 둔다.
- 최종 core selection: Task 004에서는 확정하지 않는다. Task 005 adapter boundary 검증 후 결정한다.

## 9. 비결정 사항

Task 004에서는 다음을 결정하지 않는다.

- `python-hwpx`를 최종 기본 코어로 동결하지 않는다.
- `HwpCoreAdapter` 구현을 시작하지 않는다.
- Stage 2 전환을 선언하지 않는다.
- Hancom COM 자동화를 추가 실행하지 않는다.
- Task 003 evidence를 재생성하거나 수정하지 않는다.
- HwpForge를 main editing core로 선정하지 않는다.

## 10. 다음 작업 권고

Task 005는 `HwpCoreAdapter` boundary validation으로 진행하는 것이 적절하다.

권고 검증 항목은 다음과 같다.

1. `HwpCoreAdapter` 인터페이스 초안과 최소 backend contract 정의
2. `python-hwpx` 기반 paragraph/table/style 최소 편집 proof
3. `ArmyClawSurgicalHwpxPatcher` 기반 non-target entry preservation proof
4. `hwpxlib` 또는 독립 validator 기반 구조 검증 proof
5. Hancom COM open/save smoke를 layout authority로 호출하는 격리 proof
6. 실패 시 output 미생성 또는 quarantine 처리 proof
7. evidence ledger에 input/output/path/size/SHA256/validator 결과 기록 proof

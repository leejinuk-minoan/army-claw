# Task 004 HWPX Core Selection Review 보고서

## 1. 작업 정보

- 작업 ID: `hwpx-core-selection-review-004`
- 저장소: `leejinuk-minoan/army-claw`
- 작업 브랜치: `agent/task004-core-selection-review`
- 시작 기준 SHA: `f62e124a836f48aab53827b1f2459e6cfc2e30e0`
- 작업 성격: 설계/검토 문서 작성
- 구현 변경: 없음
- Task 003 evidence 수정: 없음

## 2. 읽은 파일

- `docs/gpt-communication/reports/2026-07-04-hwpx-core-benchmark-003-v6-native-completion.md`
- `docs/gpt-communication/reports/2026-07-03-hwpx-core-benchmark-003-local-rerun-v6.md`
- `docs/gpt-communication/reports/2026-07-03-hwpx-core-benchmark-003-local-rerun-v6-native-continuation.md`
- `release/test-documents/hwpx-core-benchmark-003-evidence-integrity/tests/post-d2-scenario-gates-v6.result.txt`
- `release/test-documents/hwpx-core-benchmark-003-evidence-integrity/tests/gate-d2-final-mapped-json-validation-v6.result.txt`
- `release/test-documents/hwpx-core-benchmark-003-evidence-integrity/tests/cross-artifact-consistency-v6.result.txt`
- `release/test-documents/hwpx-core-benchmark-003-evidence-integrity/tests/manifest-unexpected-diff-v6.result.txt`
- `release/test-documents/hwpx-core-benchmark-003-evidence-integrity/summary/benchmark-results.json`
- `release/test-documents/hwpx-core-benchmark-003-evidence-integrity/summary/editor-scorecard.json`
- `release/test-documents/hwpx-core-benchmark-003-evidence-integrity/summary/validator-scorecard.json`
- `release/test-documents/hwpx-core-benchmark-003-evidence-integrity/summary/layout-gate.json`
- `release/test-documents/hwpx-core-benchmark-003-evidence-integrity/summary/capability-evidence-matrix.json`
- `release/test-documents/hwpx-core-benchmark-003-evidence-integrity/summary/dependency-license-offline-manifest.json`
- `release/test-documents/hwpx-core-benchmark-003-evidence-integrity/role-matrix.json`
- `release/test-documents/hwpx-core-benchmark-003-evidence-integrity/external-artifacts/task003-v6/native-hwpx/hancom-empty-save-hardcoded-visible.hwpx`
- `release/test-documents/hwpx-core-benchmark-003-evidence-integrity/external-artifacts/task003-v6/native-hwpx/hancom-open-save-output.hwpx`
- `release/test-documents/hwpx-core-benchmark-003-evidence-integrity/external-artifacts/task003-v6/native-hwpx/hancom-picture-output.hwpx`

## 3. 생성한 파일

- `docs/architecture/hwpx-core-selection-review-004.md`
- `docs/architecture/hwpx-core-adapter-boundary-004.md`
- `docs/gpt-communication/reports/2026-07-04-hwpx-core-selection-review-004.md`

## 4. Task 003 evidence 요약

- Gate A: 78/78 pass, fail 0
- Gate B: 142/142 pass, fail 0
- Gate C: Ajv 8.20.0 기반 parse/meta/compile failure 0
- Gate D-2: final mapped JSON validation failure_count 0
- Post-D2 native gates: S06/S07/S08/S12/S13/S14 valid true
- `native_hwpx_probe_executed=true`
- `invalid_pass_count=0`
- `cross_artifact_consistency_valid=true`
- `completion_gate_passed=true`
- manifest unexpected diff: forbidden_count 0, unexpected_diff_count 0

## 5. 결정 요약

Task 004에서는 최종 코어 선정을 확정하지 않고 다음 역할 배정을 권고했다.

| 역할 | 권고 후보 | 상태 |
| --- | --- | --- |
| 기본 HWPX 편집 코어 | `python-hwpx` | Task 005 검증 대상 1순위 |
| 정밀 보존 패처 | `ArmyClawSurgicalHwpxPatcher` | target XML patch/preservation 계층 권고 |
| Native layout authority | `Hancom 2024 COM` | 실제 한글 2024 open/save/render 판단 계층 권고 |
| 독립 validator | `hwpxlib` | parser/validator 계층 권고 |
| 향후 도구 | `HwpForge` | CLI/MCP/benchmark 후보로 보류 |

## 6. 비결정 사항

- `python-hwpx`를 최종 기본 코어로 동결하지 않았다.
- `HwpCoreAdapter` 구현을 시작하지 않았다.
- Stage 2 전환을 선언하지 않았다.
- Task 005를 구현하지 않았다.
- Hancom COM 자동화를 추가 실행하지 않았다.
- Task 003 evidence를 재생성하거나 수정하지 않았다.

## 7. 주요 위험

- Task 003은 completion evidence는 충분하지만 adapter boundary 검증 자체는 아니다.
- Hancom COM은 Windows/Hancom 설치, hidden dialog, orphan `Hwp.exe`, headless 안정성 위험이 있다.
- Surgical patcher는 정밀 보존 수정 계층으로 제한해야 하며, 범용 문서 생성 코어로 확대하면 위험하다.
- schema validation과 native layout validation은 서로 다른 신뢰 계층으로 유지해야 한다.
- dependency/license/offline 검증은 신규 backend 추가 시 반복해야 한다.

## 8. 다음 Task 권고

Task 005는 `HwpCoreAdapter Boundary Validation`으로 진행하는 것이 적절하다.

권고 범위는 다음과 같다.

- `HwpCoreAdapter` 최소 인터페이스와 backend role contract 작성
- `python-hwpx` editor backend proof
- `ArmyClawSurgicalHwpxPatcher` preservation proof
- `hwpxlib` 또는 독립 validator proof
- Hancom COM layout authority isolated smoke proof
- transaction/failure/evidence model 검증

## 9. Completion Candidate 여부

Task 004는 다음 조건을 만족하면 completion candidate로 볼 수 있다.

- 변경 파일이 허용된 3개 문서로 제한됨
- 금지 경로 변경 0
- Task 003 evidence read-only 유지
- final core selection 선언 없음
- Task 005 implementation 없음
- Stage transition 없음

현재 문서상 Task 004의 산출물은 completion candidate다. 다만 최종 완료 선언은 commit/push 및 review 이후에만 가능하다.

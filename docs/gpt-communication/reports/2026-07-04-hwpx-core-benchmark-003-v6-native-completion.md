# Task 003 v6 Native HWPX Evidence Completion Report

## 시작/최종 상태

- worktree: C:\Users\USER\Desktop\로컬 open claw 만들기\.tmp\task003-local-rerun-v6-20260704073958
- branch: agent/task003-local-rerun-v6
- HEAD: e182f2e0259ff2ac451c5a8a621516304015ac82
- 금지 경로 변경: 0
- commit/push: 미수행

## Hwp.exe cleanup

- cleanup 전 프로세스 로그: release/test-documents/hwpx-core-benchmark-003-evidence-integrity/tests/logs/hancom-com-process-before-cleanup-v6.raw.txt
- cleanup action 로그: release/test-documents/hwpx-core-benchmark-003-evidence-integrity/tests/logs/hancom-com-process-cleanup-actions-v6.raw.txt
- cleanup 후 프로세스 로그: release/test-documents/hwpx-core-benchmark-003-evidence-integrity/tests/logs/hancom-com-process-after-cleanup-v6.json 또는 getprocess-after-cleanup-v6 로그 파일
- 종료 대상: Hwp.exe 계열 4개
- 종료 후 잔류 Hwp 프로세스: 0

## Hancom COM smoke/native output

- COM ProgID: HWPFrame.HwpObject
- STA visible smoke: passed
- RegisterModule("FilePathCheckDLL", "FilePathCheckerModule"): result=False 기록
- RegisterModule("FilePathCheckDLL", "SecurityModule"): result=False 기록
- empty-save output: external-artifacts/task003-v6/native-hwpx/hancom-empty-save-hardcoded-visible.hwpx
  - size: 13674
  - SHA256: fee3800ec84315981bb2d838f48d800dc478458c84b79461b97af587467171cc
- open/save output: external-artifacts/task003-v6/native-hwpx/hancom-open-save-output.hwpx
  - size: 14468
  - SHA256: 8c092794177aeca2c1630c06adc883c81e45d9d9ea97edb038449a46dae9e9dd
- picture output: external-artifacts/task003-v6/native-hwpx/hancom-picture-output.hwpx
  - size: 14325
  - SHA256: 7829289d2dc9af5d2ea80c8889054ee695ca1317b51d729efc3d81ed947671e3

## Post-D2 Scenario Gates

`	ext
Post D-2 native scenario gates executed at 2026-07-03T23:24:23.980Z
native_hwpx_probe_executed=true
S06_valid=true
S07_valid=true
S08_valid=true
S12_valid=true
S13_valid=true
S14_valid=true
invalid_pass_count=0
details=tests/post-d2-scenario-gates-v6.details.txt

`

## Final Mapped JSON Validation

`	ext
Gate D-2 final mapped JSON validation PASSED
started_at=2026-07-04T03:47:51.450Z
ended_at=2026-07-04T03:47:51.450Z
validator=ajv@8.20.0
inventory_valid=true
validation_valid=true
active_output_count=null
missing_json=0
duplicate_json=0
unclassified_json=0
schema_mapping_errors=0
failure_count=0
details=tests/gate-d2-final-mapped-json-validation-v6.details.txt

`

## Completion / Cross-Artifact

`	ext
cross_artifact_consistency_valid=true
completion_contract_valid=true
completion_gate_passed=true
native_hwpx_probe_executed=true
invalid_pass_count=0
final_mapped_validation_failure_count=0

`

## Manifest Unexpected Diff / Ignored Evidence

`json
{
    "timestamp":  "2026-07-04T12:48:17.1362440+09:00",
    "forbidden_count":  0,
    "unexpected_diff_count":  0,
    "forbidden":  {

                  },
    "unexpected":  {

                   },
    "ignored_status":  "!! release/test-documents/hwpx-core-benchmark-003-evidence-integrity/external-artifacts/",
    "ignored_evidence_count":  33,
    "ignored_evidence":  [
                             {
                                 "path":  "external-artifacts/task003-v6/cleanup.txt",
                                 "size":  87,
                                 "sha256":  "f639fddcd92a4e89b6caf02cb16f5f8ad4469fd788e00bc4de0298beed9d1d6a"
                             },
                             {
                                 "path":  "external-artifacts/task003-v6/COPYING",
                                 "size":  57,
                                 "sha256":  "468ca1b1686a4b3de115b7c67a4d6c1b6c4577913fb1894ad8baa79725909fbd"
                             },
                             {
                                 "path":  "external-artifacts/task003-v6/LICENSE",
                                 "size":  67,
                                 "sha256":  "4058b9e3f476aaf6666848bdf28357b7f900e814e49104bf1890d2b6a50b6c40"
                             },
                             {
                                 "path":  "external-artifacts/task003-v6/manual-license-assessment.txt",
                                 "size":  105,
                                 "sha256":  "2015fb888fec505111e924a5a255591d0a4c4805703a92c17ff57e71502266e1"
                             },
                             {
                                 "path":  "external-artifacts/task003-v6/network-test.txt",
                                 "size":  95,
                                 "sha256":  "f4f58ccd2ebca70ac18eb38ff5069e793ee564ab30c3cdb9e371d247d3f27591"
                             },
                             {
                                 "path":  "external-artifacts/task003-v6/NOTICE",
                                 "size":  56,
                                 "sha256":  "6a3867d4df8a3b549eaa58f12c6d70b90dc354994069b1f32e1276832fa0c2bb"
                             },
                             {
                                 "path":  "external-artifacts/task003-v6/offline-install.stderr.log",
                                 "size":  0,
                                 "sha256":  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                             },
                             {
                                 "path":  "external-artifacts/task003-v6/offline-install.stdout.log",
                                 "size":  103,
                                 "sha256":  "d4bbe1b44a5cfd2a9773b95cdaad664a7ddc415dddc4892ba9df5a51bbfc824e"
                             },
                             {
                                 "path":  "external-artifacts/task003-v6/prerequisite-probe.txt",
                                 "size":  161,
                                 "sha256":  "5b8753d9f8a6a1110756b573c06eb21697653df7d087f734c8ad4d00ec68a76f"
                             },
                             {
                                 "path":  "external-artifacts/task003-v6/repository-approved-ajv-8.20.0.txt",
                                 "size":  94,
                                 "sha256":  "d907731953f69b10c4560dcceaf0262b21f06a02238e0eab2c1957d297082b8c"
                             },
                             {
                                 "path":  "external-artifacts/task003-v6/runtime-invocation.stderr.log",
                                 "size":  0,
                                 "sha256":  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                             },
                             {
                                 "path":  "external-artifacts/task003-v6/runtime-invocation.stdout.log",
                                 "size":  58,
                                 "sha256":  "74cd865ccd1139fd9fb0943d42f52db3a771bbf94978bd6787441ee233fabc43"
                             },
                             {
                                 "path":  "external-artifacts/task003-v6/native-hwpx/COPYING",
                                 "size":  1090,
                                 "sha256":  "a05350a88e318e4f5f2c2a1ff1e2e88daa4dd38e6e78b71cccae422bdc762cc3"
                             },
                             {
                                 "path":  "external-artifacts/task003-v6/native-hwpx/hancom-empty-save-hardcoded-visible.hwpx",
                                 "size":  13674,
                                 "sha256":  "fee3800ec84315981bb2d838f48d800dc478458c84b79461b97af587467171cc"
                             },
                             {
                                 "path":  "external-artifacts/task003-v6/native-hwpx/hancom-open-save-output.hwpx",
                                 "size":  14468,
                                 "sha256":  "8c092794177aeca2c1630c06adc883c81e45d9d9ea97edb038449a46dae9e9dd"
                             },
                             {
                                 "path":  "external-artifacts/task003-v6/native-hwpx/hancom-picture-output.hwpx",
                                 "size":  14325,
                                 "sha256":  "7829289d2dc9af5d2ea80c8889054ee695ca1317b51d729efc3d81ed947671e3"
                             },
                             {
                                 "path":  "external-artifacts/task003-v6/native-hwpx/LICENSE",
                                 "size":  1090,
                                 "sha256":  "a05350a88e318e4f5f2c2a1ff1e2e88daa4dd38e6e78b71cccae422bdc762cc3"
                             },
                             {
                                 "path":  "external-artifacts/task003-v6/native-hwpx/NOTICE",
                                 "size":  96,
                                 "sha256":  "1fd1c8ea3a0c2a400b77bf2625e8cf53b814e02035098e0a035834670ad0e3f7"
                             },
                             {
                                 "path":  "external-artifacts/task003-v6/native-hwpx/runtime-dependency-jszip.txt",
                                 "size":  13,
                                 "sha256":  "a5f5672e6df5812d906010c81d0fa981b5a592a93a0c8196772497b4108fca53"
                             },
                             {
                                 "path":  "external-artifacts/task003-v6/native-hwpx/s06-after-snapshot.txt",
                                 "size":  1245,
                                 "sha256":  "371882da8d35200a03b58c099eb1df488de44e29475998a73ece2ab9a6eff7d4"
                             },
                             {
                                 "path":  "external-artifacts/task003-v6/native-hwpx/s06-before-snapshot.txt",
                                 "size":  1257,
                                 "sha256":  "5c0897c9ee15b2cd9e78651c4d2a83f048c41bc48a58549a75c66d9abee40185"
                             },
                             {
                                 "path":  "external-artifacts/task003-v6/native-hwpx/s07-relationship-evidence.txt",
                                 "size":  447,
                                 "sha256":  "87690e8c7a6aa73b849364e5a1f16fe65e68758d1fd8ac37df759d67956cce64"
                             },
                             {
                                 "path":  "external-artifacts/task003-v6/native-hwpx/s08-namespace-fwspace-evidence.txt",
                                 "size":  2812,
                                 "sha256":  "d0dd4799e867dc247ab9c35f4b3c5160c130537f61048feffdbb64a967e64376"
                             },
                             {
                                 "path":  "external-artifacts/task003-v6/native-hwpx/s12-measurement.stderr.log",
                                 "size":  0,
                                 "sha256":  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                             },
                             {
                                 "path":  "external-artifacts/task003-v6/native-hwpx/s12-measurement.stdout.log",
                                 "size":  91,
                                 "sha256":  "ad03d0c91798234c9803db24911fa79ae1a694d706b58f0c9960e6b6c044edbd"
                             },
                             {
                                 "path":  "external-artifacts/task003-v6/native-hwpx/s13-cleanup.txt",
                                 "size":  71,
                                 "sha256":  "fda841fdf0c64749946dd025f730704bfb6f0da9a35142238e9b445118c84664"
                             },
                             {
                                 "path":  "external-artifacts/task003-v6/native-hwpx/s13-install.stderr.log",
                                 "size":  0,
                                 "sha256":  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                             },
                             {
                                 "path":  "external-artifacts/task003-v6/native-hwpx/s13-install.stdout.log",
                                 "size":  77,
                                 "sha256":  "423e85d454e7defcb0c432c1850d766ddf819dd6a01c8053b2b061d8043acb4a"
                             },
                             {
                                 "path":  "external-artifacts/task003-v6/native-hwpx/s13-network-test.txt",
                                 "size":  23,
                                 "sha256":  "056c81a75b7d8597454d4cd060d07fa16dfcf9535cd627466075a1105506b890"
                             },
                             {
                                 "path":  "external-artifacts/task003-v6/native-hwpx/s13-runtime.stderr.log",
                                 "size":  0,
                                 "sha256":  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                             },
                             {
                                 "path":  "external-artifacts/task003-v6/native-hwpx/s13-runtime.stdout.log",
                                 "size":  28,
                                 "sha256":  "49d9ae45cd3ecfb890b6acf1dddec2080f18dabc61eae5c3d0fc070d0f4e2129"
                             },
                             {
                                 "path":  "external-artifacts/task003-v6/native-hwpx/s14-upstream-artifact.txt",
                                 "size":  240,
                                 "sha256":  "a624b8729f1c5b83c9c11f2326c57c8bb66da35e4c02f5e242067d723e6e4bee"
                             },
                             {
                                 "path":  "external-artifacts/task003-v6/native-hwpx/task003-image.png",
                                 "size":  70,
                                 "sha256":  "8a352df5dafe041f6e6ddf6a7016796c5f2b592bface920f281ce60789158739"
                             }
                         ]
}

`

요약:

- manifest unexpected diff: 0
- forbidden path change: 0
- external-artifacts ignored: true
- ignored evidence files: 33개
- ignored evidence SHA256 목록: tests/manifest-unexpected-diff-v6.result.txt

## Git Status

`	ext
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/corpus-manifest.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/current_node_xml/S01/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/current_node_xml/S02/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/current_node_xml/S03/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/current_node_xml/S04/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/current_node_xml/S05/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/current_node_xml/S06/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/current_node_xml/S07/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/current_node_xml/S08/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/current_node_xml/S09/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/current_node_xml/S10/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/current_node_xml/S11/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/current_node_xml/S12/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/current_node_xml/S13/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/current_node_xml/S14/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hancom_com/S01/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hancom_com/S02/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hancom_com/S03/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hancom_com/S04/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hancom_com/S05/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hancom_com/S06/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hancom_com/S07/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hancom_com/S08/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hancom_com/S09/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hancom_com/S10/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hancom_com/S11/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hancom_com/S12/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hancom_com/S13/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hancom_com/S14/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hwpforge/S01/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hwpforge/S02/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hwpforge/S03/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hwpforge/S04/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hwpforge/S05/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hwpforge/S06/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hwpforge/S07/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hwpforge/S08/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hwpforge/S09/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hwpforge/S10/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hwpforge/S11/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hwpforge/S12/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hwpforge/S13/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hwpforge/S14/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hwpxlib/S01/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hwpxlib/S02/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hwpxlib/S03/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hwpxlib/S04/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hwpxlib/S05/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hwpxlib/S06/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hwpxlib/S07/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hwpxlib/S08/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hwpxlib/S09/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hwpxlib/S10/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hwpxlib/S11/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hwpxlib/S12/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hwpxlib/S13/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/hwpxlib/S14/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/python_hwpx/S01/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/python_hwpx/S02/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/python_hwpx/S03/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/python_hwpx/S04/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/python_hwpx/S05/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/python_hwpx/S06/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/python_hwpx/S07/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/python_hwpx/S08/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/python_hwpx/S09/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/python_hwpx/S10/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/python_hwpx/S11/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/python_hwpx/S12/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/python_hwpx/S13/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/executions/python_hwpx/S14/adapter-execution.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/current_node_xml/S01/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/current_node_xml/S02/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/current_node_xml/S03/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/current_node_xml/S04/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/current_node_xml/S05/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/current_node_xml/S06/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/current_node_xml/S07/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/current_node_xml/S08/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/current_node_xml/S09/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/current_node_xml/S10/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/current_node_xml/S11/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/current_node_xml/S12/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/current_node_xml/S13/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/current_node_xml/S14/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hancom_com/S01/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hancom_com/S02/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hancom_com/S03/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hancom_com/S04/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hancom_com/S05/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hancom_com/S06/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hancom_com/S07/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hancom_com/S08/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hancom_com/S09/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hancom_com/S10/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hancom_com/S11/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hancom_com/S12/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hancom_com/S13/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hancom_com/S14/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hwpforge/S01/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hwpforge/S02/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hwpforge/S03/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hwpforge/S04/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hwpforge/S05/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hwpforge/S06/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hwpforge/S07/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hwpforge/S08/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hwpforge/S09/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hwpforge/S10/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hwpforge/S11/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hwpforge/S12/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hwpforge/S13/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hwpforge/S14/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hwpxlib/S01/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hwpxlib/S02/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hwpxlib/S03/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hwpxlib/S04/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hwpxlib/S05/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hwpxlib/S06/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hwpxlib/S07/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hwpxlib/S08/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hwpxlib/S09/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hwpxlib/S10/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hwpxlib/S11/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hwpxlib/S12/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hwpxlib/S13/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/hwpxlib/S14/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/python_hwpx/S01/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/python_hwpx/S02/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/python_hwpx/S03/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/python_hwpx/S04/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/python_hwpx/S05/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/python_hwpx/S06/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/python_hwpx/S07/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/python_hwpx/S08/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/python_hwpx/S09/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/python_hwpx/S10/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/python_hwpx/S11/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/python_hwpx/S12/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/python_hwpx/S13/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/results/python_hwpx/S14/result.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/role-matrix.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/summary/benchmark-results.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/summary/capability-evidence-matrix.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/summary/dependency-license-offline-manifest.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/summary/editor-scorecard.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/summary/layout-gate.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/summary/source-immutability.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/summary/validator-scorecard.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/tests/schema-validation-summary.json
 M release/test-documents/hwpx-core-benchmark-003-evidence-integrity/tests/test-summary.json
?? docs/gpt-communication/reports/2026-07-03-hwpx-core-benchmark-003-local-rerun-v6-native-continuation.md
?? docs/gpt-communication/reports/2026-07-03-hwpx-core-benchmark-003-local-rerun-v6.md
`

## Commit/Push 후보성

다음 조건은 충족됨:

- native_hwpx_probe_executed: true
- S06/S07/S08/S12/S13/S14 valid: true
- completion_gate_passed: true
- final mapped JSON validation failure: 0
- invalid_pass_count: 0
- cross-artifact consistency valid: true
- 금지 경로 변경: 0

단, external-artifacts/task003-v6는 git ignored 상태이므로 commit 전에는 	ests/manifest-unexpected-diff-v6.result.txt에 기록된 evidence 파일 중 필수 증거를 git add -f로 포함할지 결정해야 한다.

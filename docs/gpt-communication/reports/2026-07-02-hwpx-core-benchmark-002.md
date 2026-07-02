# HWPX Core Benchmark 002 Corrective Report

## 기본 정보

- task_id: `hwpx-core-benchmark-002`
- repository: `leejinuk-minoan/army-claw`
- branch: `feature/hwpx-core-benchmark`
- local_root: `C:\Users\USER\Desktop\로컬 open claw 만들기`
- run_id: `hwpx-core-benchmark-2026-07-02T21-04-41-065Z`
- generated_at: `2026-07-02T21:04:42.537Z`
- report_written_at: `2026-07-03 KST`

## Git 상태

- resume 이전 local HEAD: `814039a2035481144a73bfe66c03481d497f82a0`
- resume 당시 remote HEAD: `5a95552878db20680e4b33e669cd28154dde3198`
- local checkpoint commit: `70708db54bff04365b647d7b3cd4d265e4379394`
- resume merge commit: `e1e6504043e562c11c4cf224ccdd3747f42df9fb`
- tested implementation commit: `22d51620c19ea9c0ba84c2fb670d5ee1740013ba`
- report commit SHA: 이 문서를 포함하는 커밋은 자기참조 해시를 문서 내부에 고정할 수 없으므로 최종 작업 응답과 Git 로그로 확인한다.

## 보존한 로컬 변경

기존 미커밋 corrective 작업은 삭제하지 않고 먼저 `70708db54bff04365b647d7b3cd4d265e4379394`로 보호했다. 이후 원격 handoff commit `5a95552878db20680e4b33e669cd28154dde3198`을 병합했고, 추가 corrective 검증과 benchmark-002 산출물을 `22d51620c19ea9c0ba84c2fb670d5ee1740013ba`로 커밋했다.

`docs/gpt-communication/reports/2026-07-02-hwpx-core-benchmark-001.md`는 실제 내용 diff가 없었고, benchmark-001 결과를 benchmark-002 결과로 덮어쓰지 않았다.

## Write Probe

- 최초 일반 권한 시도: Desktop 실제 저장소의 `release\test-documents\hwpx-core-benchmark-002\.write-probe` 쓰기에서 Access Denied 발생.
- 권한 상승 후 기록 파일: `release/test-documents/hwpx-core-benchmark-002/tests/write-permission-check.json`
- command: `New-Item/Set-Content/Get-FileHash/Remove-Item write probe`
- working_directory: `C:\Users\USER\Desktop\로컬 open claw 만들기`
- target_path: `release\test-documents\hwpx-core-benchmark-002\.write-probe`
- exit_code: `0`
- success: `true`
- error: `null`

## Benchmark 실행

- command: `node tools\hancom\benchmark\hwpx-core-benchmark.mjs --workspace <repository-root>`
- output root: `release/test-documents/hwpx-core-benchmark-002/**`
- summary: `release/test-documents/hwpx-core-benchmark-002/summary/benchmark-results.json`
- scorecard: `release/test-documents/hwpx-core-benchmark-002/summary/scorecard.json`
- schema: `release/test-documents/hwpx-core-benchmark-002/schemas/benchmark-result.schema.json`

## 후보별 결과

| candidate | role | passed | failed | unsupported | blocked | not_applicable |
|---|---:|---:|---:|---:|---:|---:|
| current_node_xml | editor | 6 | 1 | 4 | 3 | 0 |
| python_hwpx | editor | 0 | 0 | 0 | 14 | 0 |
| hwpxlib | validator | 0 | 0 | 0 | 14 | 0 |
| hwpforge | validator | 0 | 0 | 0 | 14 | 0 |

외부 후보 `python_hwpx`, `hwpxlib`, `hwpforge`는 pinned offline artifact, exact URL/commit, artifact SHA256, LICENSE/COPYING/NOTICE SHA256, clean offline install evidence가 없다. 따라서 모두 `blocked`이며, 이번 benchmark-002에서는 production core 또는 validator로 선택할 수 없다.

## S01~S14 상태

| scenario | current_node_xml status | 판정 요약 | evidence path |
|---|---|---|---|
| S01 | unsupported | copy-only open/save 성공을 금지했고, 일반 serializer 증거가 없어 unsupported | `release/test-documents/hwpx-core-benchmark-002/results/current-node-xml/.../S01/result.json` |
| S02 | failed | 실제 문단 치환 diff 증거가 부족하여 failed | `release/test-documents/hwpx-core-benchmark-002/results/current-node-xml/.../S02/result.json` |
| S03 | unsupported | nested table 실제 탐색 API 증거 부족 | `release/test-documents/hwpx-core-benchmark-002/results/current-node-xml/.../S03/result.json` |
| S04 | unsupported | drawText 내부 문단 탐색 API 증거 부족 | `release/test-documents/hwpx-core-benchmark-002/results/current-node-xml/.../S04/result.json` |
| S05 | unsupported | 보조 11-2 내부 두 번째 1x1 표 shrink-to-content 증거 부족 | `release/test-documents/hwpx-core-benchmark-002/results/current-node-xml/.../S05/result.json` |
| S06 | passed | 병합 셀 보존, package_valid, non_target_hashes_preserved 확인 | `release/test-documents/hwpx-core-benchmark-002/results/current-node-xml/.../S06/result.json` |
| S07 | passed | image 및 BinData 보존 확인 | `release/test-documents/hwpx-core-benchmark-002/results/current-node-xml/.../S07/result.json` |
| S08 | passed | hp:fwSpace 및 namespace 보존 확인 | `release/test-documents/hwpx-core-benchmark-002/results/current-node-xml/.../S08/result.json` |
| S09 | blocked | Hancom COM open/save 미실행. package parse를 성공으로 인정하지 않음 | `release/test-documents/hwpx-core-benchmark-002/results/current-node-xml/.../S09/adapter-execution.json` |
| S10 | blocked | 실제 페이지 수 측정 COM 증거 없음 | `release/test-documents/hwpx-core-benchmark-002/results/current-node-xml/.../S10/adapter-execution.json` |
| S11 | blocked | 주 11-2, 보조 11-2, 주 11-3 물리 페이지 위치 측정 증거 없음 | `release/test-documents/hwpx-core-benchmark-002/results/current-node-xml/.../S11/adapter-execution.json` |
| S12 | passed | 1회 warmup + 5회 measured run 성능 샘플 확보 | `release/test-documents/hwpx-core-benchmark-002/results/current-node-xml/.../S12/adapter-execution.json` |
| S13 | passed | offline import/install feasibility 기준 통과 | `release/test-documents/hwpx-core-benchmark-002/results/current-node-xml/.../S13/result.json` |
| S14 | passed | license/redistribution duty evidence 기준 통과 | `release/test-documents/hwpx-core-benchmark-002/results/current-node-xml/.../S14/result.json` |

## COM 결과

S09, S10, S11은 모두 `blocked`다. 이번 runner 경로에서는 Hancom 2024 COM wrapper를 실제 실행하지 않았으므로 `passed`로 판정하지 않았다.

- attempted APIs: `HwpObject.Open`, `HwpObject.SaveAs`, `page/caret position query`
- attempted commands: `detect Hancom COM ProgID`, `open candidate copy with Hancom 2024 COM`, `save-as .com-resaved.hwpx`, `measure page count and marker pages`
- missing_prerequisite: `COM measurement wrapper execution evidence`
- artifact_check: `no .com-resaved.hwpx artifact`
- com_execution: `false`
- page_count: `null`
- main_11_2_page: `null`
- support_11_2_page: `null`
- main_11_3_page: `null`

## 성능 측정

S12는 실제 `tools/hancom/army-claw-hancom-tools.mjs`의 `analyzeDocument`를 대상으로 in-process call을 수행했다.

- warmup_runs: `1`
- warmup_duration_ms: `110`
- measured_runs: `5`
- duration_samples_ms: `[90, 91, 93, 91, 89]`
- median_duration_ms: `91`
- p95_duration_ms: `93`
- peak_rss_measurement_method: `process.memoryUsage().rss after each measured run`
- peak_rss_samples: `[140165120, 135700480, 141103104, 146911232, 152723456]`
- scenario execution duration_ms: `570`
- scenario peak_rss_bytes: `152723456`

## 전체 테스트

- command: `node --test tools\hancom\*.test.mjs`
- working_directory: `C:\Users\USER\Desktop\로컬 open claw 만들기`
- runtime_version: `v24.14.0`
- exit_code: `0`
- passed: `56`
- failed: `0`
- skipped: `0`
- stdout_path: `release\test-documents\hwpx-core-benchmark-002\tests\logs\node-tools-hancom-tests.stdout.log`
- stderr_path: `release\test-documents\hwpx-core-benchmark-002\tests\logs\node-tools-hancom-tests.stderr.log`
- test_summary: `release/test-documents/hwpx-core-benchmark-002/tests/test-summary.json`
- independent_ci_verification: `unavailable`

## Scorecard 요약

`release/test-documents/hwpx-core-benchmark-002/summary/scorecard.json`는 category별 `weight`, `measured_points`, `pending_points`, `score_formula`, `evidence_paths`, `blocking_conditions`를 포함한다. 단순 passed count 배점으로 후보를 승격하지 않으며, external candidate와 COM/page measurement가 없는 상태에서는 core 선택을 금지한다.

## 완료 Gate

- synthetic status 제거: 확인됨
- 실제 adapter execution 기반 status: 부분 충족
- Current Node/XML S01~S08, S12 evidence: 부분 충족
- S05 두 번째 1x1 표 evidence: 미충족
- python-hwpx pinned artifact 및 실제 process: 미충족
- hwpxlib pinned artifact 및 실제 Java process: 미충족
- HwpForge identity/artifact/license evidence: 미충족
- COM open/save 실제 실행: 미충족
- page measurement: 미충족
- 전체 테스트: 통과, 56 passed / 0 failed / 0 skipped
- benchmark-001 불변: 유지

최종 판정:

- completion_gate_passed: `false`
- codex_execution_status: `partial`
- core_selection: `prohibited`
- stage_transition: `prohibited`
- HwpAdapter_completion: `not_declared`
- user_visual_status: `not_requested`
- master_review_required: `true`
- master_review_reasons: `external candidate artifacts and LICENSE evidence are missing; no architecture switch should be made`

## 미완료 항목

1. Hancom COM wrapper를 실제 실행해 `.com-resaved.hwpx`, page count, marker page 위치를 기록해야 한다.
2. S02 문단 치환 diff evidence와 S03/S04 탐색 API evidence를 더 강하게 만들 필요가 있다.
3. S05 보조 11-2 내부 두 번째 1x1 표 shrink-to-content의 before/after height evidence가 필요하다.
4. python-hwpx, hwpxlib, HwpForge의 pinned offline artifact, license hash, offline install/process evidence를 확보해야 한다.
5. 실제 사용자 시각 검증은 이번 작업에서 요청하지 않았으므로 수행하지 않았다.

## CODEX_LATEST 갱신용 payload

```json
{
  "task_id": "hwpx-core-benchmark-002",
  "branch": "feature/hwpx-core-benchmark",
  "tested_implementation_commit_sha": "22d51620c19ea9c0ba84c2fb670d5ee1740013ba",
  "completion_gate_passed": false,
  "codex_execution_status": "partial",
  "core_selection": "prohibited",
  "stage_transition": "prohibited",
  "HwpAdapter_completion": "not_declared",
  "master_review_required": true,
  "test_summary": {
    "command": "node --test tools\\hancom\\*.test.mjs",
    "exit_code": 0,
    "passed": 56,
    "failed": 0,
    "skipped": 0
  },
  "benchmark_summary_path": "release/test-documents/hwpx-core-benchmark-002/summary/benchmark-results.json",
  "report_path": "docs/gpt-communication/reports/2026-07-02-hwpx-core-benchmark-002.md"
}
```

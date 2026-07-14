# HWPX Core Benchmark 001 보고서

작성일: 2026-07-02
브랜치: `feature/hwpx-core-benchmark`
Task ID: `hwpx-core-benchmark-001`

## 요약

- 기존 HWPX 코어를 즉시 교체하지 않고 benchmark 기반과 최소 adapter spike를 구성했다.
- Current Node/XML 후보는 구조 보존 중심 시나리오를 수행했다.
- python-hwpx, hwpxlib, HwpForge는 오프라인 workspace에 실제 package/LICENSE evidence가 없어 blocked로 기록했다.
- 사용자 한글 2024 시각 확인은 `pending`이다.
- `production_core_switch`: `prohibited`
- `HwpAdapter_completion`: `not_declared`

## 산출물

- `release/test-documents/hwpx-core-benchmark-001/corpus-manifest.json`
- `release/test-documents/hwpx-core-benchmark-001/summary/benchmark-results.json`
- `release/test-documents/hwpx-core-benchmark-001/summary/scorecard.json`
- `release/test-documents/hwpx-core-benchmark-001/summary/dependency-license-offline-manifest.json`
- `release/test-documents/hwpx-core-benchmark-001/user-review/visual-review-index.json`
- `release/test-documents/hwpx-core-benchmark-001/user-review/VISUAL_REVIEW_CHECKLIST.md`

## 후보별 요약

- current_node_xml: {"passed":8,"failed":0,"unsupported":1,"blocked":5,"not_applicable":0}
- python_hwpx: {"passed":0,"failed":0,"unsupported":1,"blocked":13,"not_applicable":0}
- hwpxlib: {"passed":0,"failed":0,"unsupported":0,"blocked":6,"not_applicable":8}
- hwpforge: {"passed":0,"failed":0,"unsupported":0,"blocked":14,"not_applicable":0}

## 권고

- 편집 코어: Current Node/XML을 임시 기준선으로 유지한다.
- 검증 코어: hwpxlib/HwpForge는 라이선스와 오프라인 반입 근거 확보 전까지 채택하지 않는다.
- 다음 단계: support-2 첫 번째 1x1 표의 실제 높이 조절 증거와 COM page measurement를 확보한다.

## CODEX_LATEST payload

```json
{
  "task_id": "hwpx-core-benchmark-001",
  "stage": "1-3",
  "branch": "feature/hwpx-core-benchmark",
  "base_commit_sha": "8fed3212a45bee6c2aba4d5781726b02fad9ec7c",
  "task_start_commit_sha": "b832490f51e466d993300d722f17cd63fd3ab199",
  "final_commit_sha": "PENDING_COMMIT_SHA",
  "codex_execution_status": "completed",
  "tests": {
    "passed": 0,
    "failed": 0,
    "skipped": 0
  },
  "artifacts": [
    "release/test-documents/hwpx-core-benchmark-001/corpus-manifest.json",
    "release/test-documents/hwpx-core-benchmark-001/summary/benchmark-results.json",
    "release/test-documents/hwpx-core-benchmark-001/user-review/VISUAL_REVIEW_CHECKLIST.md"
  ],
  "candidate_results": [
    {
      "candidate_id": "current_node_xml",
      "role": "editor",
      "runtime": "node",
      "capabilities": {
        "openPackage": "passed",
        "savePackage": "passed",
        "analyzeDocument": "passed",
        "findParagraphs": "passed",
        "findTables": "passed",
        "findShapes": "partial",
        "replaceText": "passed",
        "setTableHeight": "unsupported",
        "clonePageOrBoard": "unsupported",
        "validatePackage": "passed",
        "extractSemanticSnapshot": "passed"
      },
      "scenario_counts": {
        "passed": 8,
        "failed": 0,
        "unsupported": 1,
        "blocked": 5,
        "not_applicable": 0
      }
    },
    {
      "candidate_id": "python_hwpx",
      "role": "editor",
      "runtime": "python",
      "capabilities": {
        "openPackage": "blocked",
        "savePackage": "blocked",
        "analyzeDocument": "blocked",
        "findParagraphs": "blocked",
        "findTables": "blocked",
        "findShapes": "blocked",
        "replaceText": "blocked",
        "setTableHeight": "unsupported",
        "clonePageOrBoard": "unsupported",
        "validatePackage": "blocked",
        "extractSemanticSnapshot": "blocked"
      },
      "scenario_counts": {
        "passed": 0,
        "failed": 0,
        "unsupported": 1,
        "blocked": 13,
        "not_applicable": 0
      }
    },
    {
      "candidate_id": "hwpxlib",
      "role": "validator",
      "runtime": "java",
      "capabilities": {
        "openPackage": "blocked",
        "savePackage": "not_applicable",
        "analyzeDocument": "blocked",
        "findParagraphs": "blocked",
        "findTables": "blocked",
        "findShapes": "blocked",
        "replaceText": "not_applicable",
        "setTableHeight": "not_applicable",
        "clonePageOrBoard": "not_applicable",
        "validatePackage": "blocked",
        "extractSemanticSnapshot": "blocked"
      },
      "scenario_counts": {
        "passed": 0,
        "failed": 0,
        "unsupported": 0,
        "blocked": 6,
        "not_applicable": 8
      }
    },
    {
      "candidate_id": "hwpforge",
      "role": "validator",
      "runtime": "unknown",
      "capabilities": {
        "openPackage": "blocked",
        "savePackage": "blocked",
        "analyzeDocument": "blocked",
        "findParagraphs": "blocked",
        "findTables": "blocked",
        "findShapes": "blocked",
        "replaceText": "not_applicable",
        "setTableHeight": "not_applicable",
        "clonePageOrBoard": "not_applicable",
        "validatePackage": "blocked",
        "extractSemanticSnapshot": "blocked"
      },
      "scenario_counts": {
        "passed": 0,
        "failed": 0,
        "unsupported": 0,
        "blocked": 14,
        "not_applicable": 0
      }
    }
  ],
  "user_visual_status": "pending",
  "scope_deviations": [],
  "architecture_questions": [],
  "risks": [
    "external candidate artifacts and LICENSE evidence are missing; no architecture switch should be made"
  ],
  "next_prompt_intent": "support-2 table shrink-to-content evidence and COM page measurement",
  "master_review_required": true,
  "master_review_reasons": [
    "external candidate artifacts and LICENSE evidence are missing; no architecture switch should be made"
  ]
}
```

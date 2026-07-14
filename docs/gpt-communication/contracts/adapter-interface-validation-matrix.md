# Adapter Interface Validation Matrix

## 1. Purpose

This matrix fixes the expected validation status for Task 023 common office adapter interface samples before executable validator implementation begins.

## 2. Positive proof-mode samples

| Sample | Type | Expected validation status | Notes |
|---|---|---|---|
| `local_workspace-request.sample.json` | request | `valid` | proof-mode local workspace request |
| `local_workspace-response.sample.json` | response | `valid` | `actual_adapter_invoked=false`, `execution_allowed=false` |
| `hwp_hwpx-request.sample.json` | request | `valid` | proof-mode HWP/HWPX request |
| `hwp_hwpx-response.sample.json` | response | `valid` | no real HWP/HWPX output claimed |
| `hancell-request.sample.json` | request | `valid` | formula/chart preservation requested |
| `hancell-response.sample.json` | response | `valid` | no real HanCell output claimed |
| `hanshow-request.sample.json` | request | `valid` | slide layout preservation requested |
| `hanshow-response.sample.json` | response | `valid` | no real HanShow output claimed |

Positive samples are valid as proof-mode samples only. They do not prove real adapter execution.

## 3. Negative samples

| Sample | Expected status | Expected error category |
|---|---|---|
| `negative-llm-direct-file-edit-request.sample.json` | `blocked` | `llm_direct_file_edit_blocked` |
| `negative-source-overwrite-request.sample.json` | `blocked` | `source_overwrite_blocked` |
| `negative-public-internet-required.sample.json` | `blocked` | `public_internet_dependency_blocked` |
| `negative-target-plan-mismatch.sample.json` | `blocked` | `target_plan_mismatch` |

## 4. Validation interpretation

- `valid` means the sample satisfies the contract for its declared proof mode.
- `blocked` means the sample is intentionally invalid because it requests a forbidden action.
- No sample in this matrix claims actual adapter invocation.
- No sample in this matrix claims local Hancom COM execution.
- No sample in this matrix creates a real HWP/HWPX, HanCell, HanShow, or local workspace artifact.

## 5. Task 035 controlled promotion profiles

Task 035 adds specialized sample profiles that are validated outside the generic common-office request/response envelope:

| Profile | Required sample behavior |
|---|---|
| `controlled_promotion_request` | References the canonical Task 033 staged-output evidence manifest profile and lists Task 033 artifact/relationship field names |
| `controlled_promotion_response` | Mirrors `receipt.safety_assertions` exactly at top level when a mirror is present |
| `controlled_promotion_negative` | Includes exact blocked error code and expected read/mutation flags for failure-evidence truthfulness |

Task 035 validator totals must remain greater than or equal to the Task 035-A2L baseline of `364` checks.

## 6. Task 035-A2L-C2 controlled promotion policy checks

Task 035-A2L-C2 adds static validator checks for the controlled promotion contract itself:

| Check | Required behavior |
|---|---|
| Root lexical safety | Raw staged and approved roots are inspected before `resolve()` |
| Root object safety | Root symlink and root reparse point are prohibited, and root inspection failure fails closed |
| Post-commit cleanup | Temp and operation-created final cleanup are attempted independently after failure |
| Destination preservation | Pre-existing destination paths are never cleanup targets |
| Cleanup evidence | Failure responses expose temp/final cleanup flags, cleanup attempt/completion, cleanup errors, and original error code |
| Structured filesystem errors | Expected filesystem `OSError` paths return structured blocking responses |

Task 035-A2L-C2 validator totals must remain greater than or equal to the Task 035-A2L-C baseline of `378` checks.

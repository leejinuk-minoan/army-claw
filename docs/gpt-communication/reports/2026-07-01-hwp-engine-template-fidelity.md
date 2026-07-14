# HWP 엔진 Template Fidelity 개선 보고서

작성일: 2026-07-01  
브랜치: `feature/hwp-engine-template-fidelity`  
저장소: `leejinuk-minoan/army-claw`

## 1. 읽은 GPT 의견

- `docs/gpt-communication/CURRENT.md`
- `docs/gpt-communication/opinions/2026-07-01-hwp-engine-not-llm-improvement-plan.md`
- `docs/gpt-communication/opinions/2026-07-01-hwp-reference-templates-and-document-style-goal.md`
- `docs/gpt-communication/reports/2026-07-01-hwp-reference-style-profiles.md`
- `docs/gpt-communication/reports/2026-07-01-hwpx-minimal-native-table.md`

이번 문제는 LLM 품질 문제가 아니라 HWP/HWPX 작성 엔진 문제로 판정했다. 따라서 Ollama, 모델, 프롬프트, 백엔드, UI, 설치 파일은 변경하지 않았다.

## 2. Git 시작 상태

- 시작 기준 브랜치: `feature/hwp-reference-style-profiles`
- 작업 브랜치: `feature/hwp-engine-template-fidelity`
- 작업 전 기준 커밋: `2a1eff1 Point Codex to HWP engine improvement plan`
- 작업 방식: 기존 원본 HWP 파일은 수정하지 않고 `.tmp/hwp-reference-conversion/`에 변환본을 생성했다.

## 3. LLM 분리

- 이번 테스트와 산출물 생성은 고정 JSON, 고정 치환 규칙, 로컬 HWPX 엔진만 사용했다.
- `prompt-create`, Ollama, `gemma3:12b`, 외부 API 호출은 사용하지 않았다.
- Template Fidelity 산출물은 실제 변환 HWPX를 복사한 뒤 지정 문단만 결정적으로 교체한다.

## 4. COM 진단 환경

- COM 객체: `HWPFrame.HwpObject`
- 실행 방식: `powershell.exe -STA`
- 진단 도구: `tools/hancom/hwp-automation-diagnostics.ps1`
- 정적 계약 테스트: `tools/hancom/hwp-automation-diagnostics.test.ps1`
- 생성 로그:
  - `release/test-documents/hwp-automation-diagnostics.json`
  - `release/test-documents/hwp-automation-convert-official-diagnostics.json`
  - `release/test-documents/hwp-automation-convert-qualification-diagnostics.json`

64비트 PowerShell 환경에서 COM 객체 생성, 창 객체 접근, 보안 모듈 등록 시도, HWP 열기, HWPX 저장까지 단계별 로그를 남겼다. 새로 생성한 Hwp 프로세스 ID만 추적하고 종료하도록 구성했다.

## 5. COM 단계별 결과

`pk-table-qualification-review.hwp` 변환 결과:

- `conversion_status`: `passed`
- 마지막 성공 단계: `save_as_success`
- 원본 SHA256 변환 전: `631B015F9BA2F53390D756353C76597252C55852407F477ED4E283DB914C979D`
- 원본 SHA256 변환 후: `631B015F9BA2F53390D756353C76597252C55852407F477ED4E283DB914C979D`
- 변환본: `.tmp/hwp-reference-conversion/pk-table-qualification-review.hwpx`
- 크기: 2,019,227 bytes

`official-action-plan-sample.hwp` 변환 결과:

- `conversion_status`: `passed`
- 마지막 성공 단계: `save_as_success`
- 원본 SHA256 변환 전/후 동일
- 변환본: `.tmp/hwp-reference-conversion/official-action-plan-sample.hwpx`
- 크기: 1,070,681 bytes

## 6. HWPX 검증 결과

두 변환본 모두 ZIP/HWPX 기본 구조 검증에서 `valid: true`였다.

주의: 기존 `native_structure_validation`과 `native_table_wrapper_validation`은 Army Claw가 직접 생성한 표 구조 규칙을 검사하기 위한 자체 검증기다. 한글 2024가 직접 저장한 HWPX는 이 자체 규칙과 다른 속성을 포함하므로 일부 항목이 `failed`로 표시된다. 이번 작업에서는 이를 실제 한글 변환본의 관측 구조로 분리 기록했다.

## 7. 실제 HWPX 관측 manifest

생성 파일:

- `release/test-documents/pk-table-qualification-review-observed-manifest.json`
- `release/test-documents/official-action-plan-observed-manifest.json`

관측 요약:

- 자격심사 문서: 표 41개, 텍스트 샘플 30개, 이미지/BinData 12개
- 공식 조치계획 문서: 표 13개, 텍스트 샘플 30개

기존 수동 manifest는 다음 구조로 갱신했다.

- `definition_source.expected`: `manual_visual_analysis`
- `definition_source.observed`: `native_converted_hwpx`
- `expected`: 기존 수동 정의
- `observed`: 실제 변환 HWPX에서 추출한 요약
- `differences`: 아직 관측하지 못한 값은 `verification: not_observed`로 기록

## 8. Template Fidelity Mode

구현 위치:

- `tools/hancom/army-claw-hancom-tools.mjs`
- CLI 명령: `hwpx-template-fidelity-fill`

동작:

1. 변환된 기준 HWPX를 그대로 복사한다.
2. 지정된 `paragraph_text` selector에 해당하는 문단을 찾는다.
3. 문단 안의 분할 run을 결합해 매칭한다.
4. 첫 run의 스타일은 보존하고 텍스트만 교체한다.
5. 나머지 run 텍스트는 비워 구조 손상을 최소화한다.
6. `Preview/PrvText.txt`도 같은 치환을 반영한다.
7. BinData, 표, 글자/문단/테두리 정의, 미지정 문단은 건드리지 않는다.

생성 파일:

- `release/test-documents/army-claw-qualification-review-template-fidelity.hwpx`

사용자 확인 반영:

- `template_fidelity_open_status`: `user_confirmed_success`
- `cover_first_title_replacement_status`: `user_confirmed_success`
- `template_visual_structure_preservation_status`: `user_confirmed_success`
- `multi_selector_visual_status`: `not_started`
- `table_cell_selector_visual_status`: `not_started`

치환 내용:

- 원본 문단: `PK-Table 기반 타격자산-탄종-신관`
- 치환 문단: `Army Claw 템플릿 충실도 검증 문서`

## 9. Template Fidelity 보존 검증

검증 파일:

- `release/test-documents/army-claw-qualification-template-fidelity-diff.json`

결과:

- BinData 보존: `true`
- 누락 엔트리: 없음
- 추가 파일 엔트리: 없음
- 변경 엔트리: `Contents/section0.xml`, `Preview/PrvText.txt`
- 예기치 않은 변경 엔트리: 없음
- 표 개수: 41개에서 41개로 유지
- 문단 개수: 476개에서 476개로 유지
- 치환 텍스트 포함: `true`
- 원래 첫 문단 제거: `true`

## 10. 병합 표 그리드 엔진

구현 위치:

- `buildMergedTableGrid`
- `normalizedTableRows`
- `nativeTableObjectXml`

새 모델:

- `row_count`
- `col_count`
- `column_widths`
- `row_heights`
- `anchor_cells`
- `occupied_coordinates`
- `rendered_cells`

규칙:

- 병합 영역은 anchor cell만 `hp:tc`로 렌더링한다.
- 병합 영역 내부의 비-anchor 좌표는 별도 cell로 출력하지 않는다.
- cell width/height는 span이 차지하는 열/행 크기의 합으로 계산한다.
- 충돌, 범위 초과, 중복 anchor는 거부한다.

검증 파일:

- `release/test-documents/merged-table-grid-validation.json`

검증 결과:

- anchor-only rendered cells: `true`
- occupied coordinate count: `true`
- table width: `7000`
- duplicate cell address: `false`

## 11. 테스트 결과

Node 테스트:

```text
tests 24
pass 24
fail 0
duration_ms 350.6725
```

PowerShell 테스트:

```text
hwp-automation-diagnostics static contract passed
```

실행한 주요 테스트:

- `tools/hancom/army-claw-hancom-tools.test.mjs`
- `tools/hancom/hwpx-native-table-wrapper.test.mjs`
- `tools/hancom/hwpx-native-structure-diff.test.mjs`
- `tools/hancom/hwp-reference-style-profiles.test.mjs`
- `tools/hancom/hwpx-template-fidelity.test.mjs`
- `tools/hancom/hwpx-merged-table-grid.test.mjs`
- `tools/hancom/hwp-automation-diagnostics.test.ps1`

## 12. 사용자 확인 필요 HWPX

한글 2024에서 직접 열어 확인할 파일:

```text
release/test-documents/army-claw-qualification-review-template-fidelity.hwpx
```

확인 항목:

1. 파일이 오류 없이 열리는가
2. 원본 자격심사 양식의 페이지 배치가 유지되는가
3. 반복 요약 블록의 위치와 크기가 유지되는가
4. 표, 병합 셀, 테두리, 그림, 글상자, 쪽 번호 구조가 깨지지 않는가
5. 첫 문단만 `Army Claw 템플릿 충실도 검증 문서`로 바뀌었는가
6. 나머지 문단과 표 내용이 원본 변환본과 동일하게 보이는가

사용자가 한글 2024에서 기존 Template Fidelity MVP 산출물이 정상적으로 열리고 첫 제목 치환과 주요 구조 보존이 확인된 상태다. 다만 다중 selector와 표 셀 selector는 아직 시작하지 않았으므로 별도 v2 산출물에서 다시 확인해야 한다.

## 13. 제한사항

- PowerShell 5의 `ConvertFrom-Json`은 일부 변환 텍스트를 안정적으로 읽지 못할 수 있어, 관측 manifest 검증은 Node `JSON.parse` 기준으로 수행했다.
- 기존 native-wrapper 검증기는 Army Claw 생성 HWPX 기준이므로 한글 2024 네이티브 변환본에는 과잉 경고를 낼 수 있다.
- Template Fidelity는 현재 지정 문단 치환 MVP이며, 표 내부 특정 셀 치환과 다중 selector는 다음 단계에서 확장해야 한다.
- 한글 2024에서의 최종 시각 판정은 사용자 확인이 필요하다.

## 14. 다음 권장 작업

1. 한글 2024에서 Template Fidelity 결과 파일을 열어 시각 확인한다.
2. selector를 `paragraph_text` 외에 `table_cell_text`, `nth_paragraph`, `contains_text`로 확장한다.
3. PowerShell JSON 파서 호환을 위해 manifest 텍스트 저장 정책을 더 보수적으로 조정한다.
4. Template Fidelity 경로를 Army Claw 작업 실행 계층에 연결한다.
5. 이후 LLM은 문서 생성이 아니라 selector와 치환 내용 JSON을 만드는 역할로 제한한다.

## 15. 커밋 및 push

- MVP 보존 커밋 SHA: `092bc89`
- 커밋 메시지: `Add HWP template fidelity conversion and preservation`
- GitHub push: 보고서 커밋 후 갱신 예정

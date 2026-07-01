# HWP 기준 양식 프로필 작업 보고서

## 1. 읽은 GPT 의견

- `docs/gpt-communication/CURRENT.md`
- `docs/gpt-communication/opinions/2026-07-01-hwp-reference-templates-and-document-style-goal.md`
- `docs/gpt-communication/reports/2026-07-01-hwpx-minimal-native-table.md`
- `docs/gpt-communication/opinions/2026-07-01-hwpx-v3-minimal-table-next-step.md`

## 2. 사용 브랜치

- 기준 브랜치: `feature/hwpx-minimal-native-table`
- 작업 브랜치: `feature/hwp-reference-style-profiles`
- 기준 최신 커밋: `a88a6b6 Point Codex to HWP reference template goals`

## 3. 원본 HWP 발견 경로

| 저장소 파일명 | 원본 발견 경로 |
| --- | --- |
| `pk-table-qualification-review.hwp` | `C:\Users\USER\Downloads\자격심사-1. PK-Table 기반 타격자산-탄종-신관 결정 보조 알고리즘 제작(대대7과  5.7. 수정) (1) (2).hwp` |
| `official-action-plan-sample.hwp` | `C:\Users\USER\Downloads\20xx0101_대외비_청계산등산계획.hwp` |

## 4. 원본 및 저장소 복사본 SHA256

| 파일 | SHA256 |
| --- | --- |
| `reference/hwp-style-samples/pk-table-qualification-review.hwp` | `631B015F9BA2F53390D756353C76597252C55852407F477ED4E283DB914C979D` |
| `reference/hwp-style-samples/official-action-plan-sample.hwp` | `EC06ACCC2A0593D7A07005381C1515DD6C895E9D09434B44A49271D0CE05EB46` |

두 파일 모두 원본과 복사본의 SHA256이 일치했다.

## 5. GitHub에 추가한 HWP 파일

- `reference/hwp-style-samples/pk-table-qualification-review.hwp`
- `reference/hwp-style-samples/official-action-plan-sample.hwp`
- `reference/hwp-style-samples/README.md`

README에는 사용자가 공개·비민감 자료임을 확인했다는 점과 두 번째 파일명의 `대외비` 문구가 실제 보안 분류가 아님을 기록했다.

## 6. HWP → HWPX 변환 방식

구현 파일:

- `tools/hancom/hwp-reference-converter.ps1`

설계 방식:

1. 원본 HWP 경로 검증
2. 출력 HWPX 경로가 원본과 다른지 확인
3. 원본 SHA256 기록
4. 한글 2024 Automation COM 객체 생성
5. HWP 열기
6. HWPX로 다른 이름 저장
7. 원본 SHA256 재검증
8. JSON 결과 출력

## 7. 한글 Automation 확인 결과

확인된 COM 후보:

- `HWPFrame.HwpObject`: 생성 가능
- `HwpAutomationApp2.HwpAutomation`: class not registered

설치 파일 후보:

- `C:\Program Files (x86)\HNC\Office 2024\HOffice130\Bin\Hwp.exe`
- `C:\Program Files (x86)\HNC\Office 2024\HOffice130\Bin\HwpAutomation.dll`
- `C:\Program Files (x86)\HNC\Office 2024\HOffice130\Bin\HwpConverter.exe`

실제 변환 실행 상태:

- PowerShell 실행 정책 문제는 `-ExecutionPolicy Bypass`로 우회 가능함을 확인
- COM 변환 시도는 한글 프로세스 대기 상태로 timeout 발생
- `HwpConverter.exe <input> <output>` 직접 인자 방식은 `EXIT -1073740791`, 출력 파일 없음

따라서 이번 커밋에서는 변환 도구와 분석 도구를 저장소에 추가하되, 실제 기준 HWP의 HWPX 변환 결과는 `pending_runtime_verification`으로 둔다.

## 8. Reference 구조 분석

분석 도구:

- `tools/hancom/hwp-reference-analyzer.mjs`

분석기가 생성하는 manifest 주요 항목:

- `profile_id`
- `source_file`
- `converted_hwpx`
- `page`
- `repeated_regions`
- `table_patterns`
- `paragraph_roles`
- `header_footer`
- `images`
- `text_sample`

현재는 변환된 원본 HWPX가 없으므로, 수동 정의 manifest와 생성 샘플 기반 analyzer 테스트를 함께 제공했다.

## 9. 두 문서의 구조 차이

`qualification_review_booklet`:

- 심사·브리핑용 소책자형 문서
- 표지와 조직명
- 반복 요약 블록
- `주 n-m`, `보조 n-m` 페이지 식별자
- 페이지별 주제와 병합 표

`official_action_plan`:

- 공식 계획·검토 문서
- 문서관리 및 결재 정보 표
- 목적·방침·세부계획
- 일정표와 붙임
- 결재/일정/공식양식 표 스타일

## 10. table_style 모델

구현된 의미 기반 스타일:

- `grid`
- `report`
- `minimal`
- `official_form`
- `approval`
- `schedule`
- `metadata`
- `callout`

DocumentPlan이 `borderFillIDRef` 숫자를 직접 다루지 않고, `table_style` 의미값을 넘기면 renderer가 실제 HWPX 표 속성으로 변환한다.

## 11. 병합 셀 구현

구현 내용:

- `validateMergedTableCells()`
- `row_span`, `col_span`
- 범위 초과 검증
- 병합 영역 충돌 검증
- `hp:cellSpan` 출력
- `cellAddr` 기준 분석
- 병합 셀 포함 표의 row/col 검증 보정

## 12. 자격심사형 샘플 경로

```text
release/test-documents/army-claw-qualification-review-sample.hwpx
```

검증 결과:

```json
{
  "valid": true,
  "native_structure_validation": "passed",
  "native_table_wrapper_validation": "passed",
  "native_table_visual_status": "user_confirmation_pending",
  "errors": [],
  "warnings": []
}
```

## 13. 공식 계획서형 샘플 경로

```text
release/test-documents/army-claw-official-action-plan-sample.hwpx
```

검증 결과:

```json
{
  "valid": true,
  "native_structure_validation": "passed",
  "native_table_wrapper_validation": "passed",
  "native_table_visual_status": "user_confirmation_pending",
  "errors": [],
  "warnings": []
}
```

## 14. 테스트 결과

실행 명령:

```powershell
$env:ARMY_CLAW_NODE_MODULES='C:\Users\USER\Desktop\로컬 open claw 만들기\release\army-claw-openclaw-beta\app\node_modules'
node --test tools/hancom/army-claw-hancom-tools.test.mjs tools/hancom/hwpx-native-table-wrapper.test.mjs tools/hancom/hwpx-native-structure-diff.test.mjs tools/hancom/hwp-reference-style-profiles.test.mjs
```

결과:

```text
tests 21
pass 21
fail 0
```

## 15. 사용자 한글 2024 시각 검증 항목

자격심사형 샘플:

1. 표지 분리
2. 조직명 표시
3. 반복 요약 블록 표시
4. `주 2-1`, `주 2-2` 표시
5. `보조 2-1`, `보조 2-2` 표시
6. 병합 표 표시
7. 표 선택 및 셀 편집 가능

공식 계획서형 샘플:

1. 문서관리·결재 정보 표 표시
2. 제목과 보고 요약 표시
3. 목적·방침 문단 표시
4. 일정표 표시
5. 병합 머리글 표시
6. 붙임 표시
7. 표 선택 및 셀 편집 가능

## 16. 현재 제한사항

- 실제 공개 HWP 원본의 HWPX 변환은 runtime verification 대기 상태
- COM 변환은 환경별 보안 모듈/대화상자 처리 보정이 필요
- 생성 샘플은 기준 문서의 전체 재현이 아니라 최소 프로필 검증 문서
- 시각 성공은 사용자 한글 2024 확인 전까지 확정하지 않음

## 17. 다음 권장 작업

1. 한글 2024 Automation 변환 모듈 보정
2. 두 원본 HWP를 HWPX로 변환
3. analyzer로 실제 변환 HWPX manifest 갱신
4. 사용자가 두 최소 샘플을 한글 2024에서 시각 검증
5. 검증 통과 후 backend Adapter와 실행 큐 연결 검토

## 18. 커밋 및 Push

- 커밋 SHA: 커밋 후 갱신
- GitHub push: push 후 갱신

# HWPX 최소 네이티브 표 검증 작업 보고서

## 1. 읽은 GPT 의견

- `docs/gpt-communication/README.md`
- `docs/gpt-communication/opinions/2026-07-01-hwpx-v3-minimal-table-next-step.md`
- `docs/gpt-communication/opinions/2026-07-01-hwpx-v2-native-reference-review.md`
- `docs/gpt-communication/reports/2026-07-01-hwpx-native-reference-v3.md`

## 2. 작업 시작 Git 상태

- 시작 브랜치: `feature/hwpx-minimal-native-table`
- 기준 커밋: `53ee311 Point Codex to HWPX v3 minimal table review`
- 작업트리: 코드 수정 전 clean 상태 확인

## 3. 원본 파일 보존

다음 기준 HWPX 파일은 직접 수정하지 않고 분석 대상으로만 사용했다.

| 파일 | SHA256 |
| --- | --- |
| `release/test-documents/army-claw-hwpx-native-reference.hwpx` | `53CAD5765D7A3278180BA2798D7A150E2E3BEB1FD382F496E34C51030D919AD7` |
| `release/test-documents/army-claw-hwpx-capability-v3.hwpx` | `890A8B75E8065CAC2C90E9E866F113F942A64A520B6BF2739F43A6CEC5526C09` |
| `release/test-documents/army-claw-hwpx-capability-v2.hwpx` | `AD2C368CE50E1CBDC7819409CB15B486EA30A1BEE36AE423326565645AC0A3DD` |
| `release/test-documents/army-claw-hwpx-capability-baseline.hwpx` | `4234B8438E0FAA9AEC651E89C2F921184BC6D9C04E7C07C92D25255A7804B93D` |

## 4. v3 표 렌더링 실패 원인 가설

v3는 `treatAsChar`, `horzRelTo`, `horzAlign`, 셀 margin 등 표 내부 속성은 native reference와 가깝게 보정했지만, `hp:tbl`을 섹션 본문에 직접 삽입하고 있었다.

즉 문제의 핵심은 표 내부 속성만이 아니라 `hp:tbl`의 부모 문단 구조 부족으로 판단했다.

## 5. Native Reference 부모 구조

실제 native reference에서 추출된 표 부모 경로는 다음과 같았다.

```text
hs:sec > hp:p > hp:run > hp:tbl
```

반면 v3 산출물은 다음과 같았다.

```text
hs:sec > hp:tbl
```

따라서 최소 검증 문서는 native reference와 동일하게 `hp:p > hp:run` 내부에 `hp:tbl`을 배치하도록 구현했다.

## 6. 현재 코드의 기존 삽입 방식

기존 자동 문서 생성 경로는 `documentPlanSectionXml()`에서 표 블록을 만나면 다음 방식으로 섹션에 직접 추가했다.

```javascript
parts.push(nativeTableXml(block, tableId));
```

이번 작업에서는 전체 v4나 callout 수정으로 확장하지 않고, 최소 표 검증용 생성 경로를 별도로 추가했다.

## 7. 추가한 테스트

새 테스트 파일:

```text
tools/hancom/hwpx-native-table-wrapper.test.mjs
```

검증 내용:

- 생성된 `hp:tbl`이 section 직계 자식이 아닌지 확인
- `hp:p > hp:run > hp:tbl` 부모 경로 확인
- 3행 3열 표 구조 확인
- 모든 셀 텍스트 확인
- 앞/뒤 본문 문단 확인
- `native_table_wrapper_validation: passed` 확인

## 8. 추가한 구현

수정 파일:

```text
tools/hancom/army-claw-hancom-tools.mjs
```

주요 변경:

- `nativeTableObjectXml()`로 순수 `hp:tbl` 생성 로직 분리
- `nativeTableParagraphXml()`로 native reference식 문단/run wrapper 생성
- `generateMinimalNativeTableHwpxDocument()` 추가
- CLI 명령 `hwpx-generate-minimal-table` 추가
- `extractNativeTables()`에 wrapper 경로 분석 추가
- `validateNativeTableWrappers()` 추가
- `validateHwpxPackage()`에 `native_table_wrapper_validation` 및 `native_table_visual_status` 필드 추가
- `analyzeHwpxTemplate()`에 `nativeTableWrapperValidation` 및 table wrapper 분석 결과 추가

## 9. 최소 표 문서

생성 문서:

```text
release/test-documents/army-claw-hwpx-native-table-minimal.hwpx
```

문서 내용:

- 제목: `HWPX 테이블 최소 검증`
- 본문 위 문단: `위 본문 문단입니다.`
- 3행 3열 표
- 본문 아래 문단: `표 아래 본문 문단입니다.`

표 내용:

| 구분 | 검증 내용 | 결과 |
| --- | --- | --- |
| 표 구조 | 테이블 부모 구조 적용 | 확인 |
| 셀 편집 | 한글 2024 셀 커서 진입 | 확인 |

## 10. 산출물

`release/`는 Git 추적 제외이므로 아래 파일은 로컬 검증 산출물이다.

- `release/test-documents/army-claw-hwpx-native-table-minimal.hwpx`
- `release/test-documents/army-claw-hwpx-native-table-minimal-validation.json`
- `release/test-documents/army-claw-hwpx-native-table-minimal-analysis.json`
- `release/test-documents/army-claw-hwpx-table-wrapper-diff.json`
- `release/test-documents/army-claw-hwpx-table-wrapper-diff.md`

## 11. Validation 결과

최소 표 문서 검증 결과:

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

## 12. Analysis 결과

최소 표 문서의 table wrapper 분석:

```json
{
  "tableCount": 1,
  "wrapper": {
    "path": "hs:sec>hp:p>hp:run>hp:tbl",
    "parent": "hp:run",
    "directSectionChild": false,
    "insideParagraph": true,
    "insideRun": true,
    "insideControl": false
  }
}
```

## 13. 테스트 결과

실행 명령:

```powershell
$env:ARMY_CLAW_NODE_MODULES='C:\Users\USER\Desktop\로컬 open claw 만들기\release\army-claw-openclaw-beta\app\node_modules'
node --test tools/hancom/hwpx-native-table-wrapper.test.mjs tools/hancom/army-claw-hancom-tools.test.mjs tools/hancom/hwpx-native-structure-diff.test.mjs
```

결과:

```text
tests 17
pass 17
fail 0
```

CLI 검증:

```text
hwpx-validate: valid=true, native_table_wrapper_validation=passed
hwpx-summary: 제목, 위 본문, 표 셀 텍스트, 아래 본문 추출 확인
```

## 14. 사용자 한글 2024 확인 항목

다음 파일을 한글 2024에서 직접 열어 확인해야 한다.

```text
C:\Users\USER\Desktop\로컬 open claw 만들기\release\test-documents\army-claw-hwpx-native-table-minimal.hwpx
```

확인 항목:

1. 파일이 오류 없이 열리는가
2. 제목이 보이는가
3. 위 본문 문단이 보이는가
4. 3행 3열 표가 보이는가
5. 표 테두리가 보이는가
6. 머리글과 데이터 셀 텍스트가 보이는가
7. 표를 클릭하면 전체 표 객체가 선택되는가
8. 각 셀을 클릭하면 커서가 들어가는가
9. 표 아래 본문 문단이 보이는가

## 15. 이번 작업에서 제외한 항목

- callout 수정
- 표지 메타데이터 수정
- 전체 보고서 v4 생성
- footer 추가 수정
- PAGE 필드 추가 수정
- backend Adapter
- 실행 큐
- OpenClaw Tool Plugin
- UI
- 설치 파일 패키징
- HCell/HShow

## 16. 현재 제한사항

자동 검증은 XML 구조와 패키지 유효성을 확인한다. 실제 한글 2024 화면 렌더링 성공은 사용자 확인 전까지 확정하지 않는다.

현재 상태:

```text
native_table_visual_status: user_confirmation_pending
```

## 17. 다음 작업 조건

사용자가 최소 표 문서를 한글 2024에서 열어 표가 보이고 셀 커서 진입이 가능하다고 확인하면, 다음 단계에서 동일 wrapper 구조를 일반 자동 문서 표 생성 경로와 callout 후보에 점진 적용한다.

## 18. 커밋 및 Push

- 커밋 SHA: `ae0a56b Generate minimal native HWPX table sample`
- 보고서 갱신 커밋: `fc4162e Report minimal native HWPX table validation`
- GitHub push: `origin/feature/hwpx-minimal-native-table` push 완료

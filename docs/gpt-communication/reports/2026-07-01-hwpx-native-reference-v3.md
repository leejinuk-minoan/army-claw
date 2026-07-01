# HWPX native reference 기반 v3 구현 보고서

작성일: 2026-07-01
작업 브랜치: `feature/hwpx-native-reference-v3`
구현 커밋: `fa0eae7`

## 1. 읽은 GPT 의견

- `docs/gpt-communication/README.md`
- `docs/gpt-communication/opinions/2026-07-01-hwpx-v2-native-reference-review.md`
- `docs/gpt-communication/opinions/2026-06-30-hwpx-document-rendering-engine-review.md`
- `docs/gpt-communication/reports/2026-06-30-hwpx-document-rendering-engine.md`

## 2. 작업 시작 Git 상태

- 기준 브랜치: `feature/hwpx-worker-integration-and-native-table`
- 새 작업 브랜치: `feature/hwpx-native-reference-v3`
- 원격 동기화: `33cf6ec`, `5642724` fast-forward 반영
- `main` 병합은 수행하지 않았다.

## 3. 원본 파일 SHA256

| 파일 | SHA256 |
|---|---|
| baseline | `4234B8438E0FAA9AEC651E89C2F921184BC6D9C04E7C07C92D25255A7804B93D` |
| v2 | `AD2C368CE50E1CBDC7819409CB15B486EA30A1BEE36AE423326565645AC0A3DD` |
| native reference | `53CAD5765D7A3278180BA2798D7A150E2E3BEB1FD382F496E34C51030D919AD7` |
| v3 | `890A8B75E8065CAC2C90E9E866F113F942A64A520B6BF2739F43A6CEC5526C09` |

baseline, v2, native reference는 수정하지 않았다.

## 4. native reference와 v2 핵심 차이

native reference:

- `hp:tbl`: 3개
- `hp:ctrl`: 5개
- 실제 footer 있음
- `hp:autoNum numType="PAGE"` 있음
- 표 anchor: `treatAsChar="0"`, `horzRelTo="COLUMN"`, `horzAlign="CENTER"`
- 셀: `hasMargin="1"`

v2:

- `hp:tbl`: 2개
- `hp:ctrl`: 1개
- 실제 footer 없음
- PAGE 필드 없음
- 표 anchor: `treatAsChar="1"`, `horzRelTo="PARA"`, `horzAlign="LEFT"`
- 셀: `hasMargin="0"`

## 5. v2 실패 원인 가설

v2는 XML에 `hp:tbl` 태그는 있었지만, 한글 2024가 기대하는 표 anchor와 셀 구조를 충분히 따르지 못했다. 특히 표가 문단 문자처럼 취급되는 `treatAsChar="1"` 구조였고, 위치 기준도 native reference와 달랐다.

또한 footer와 페이지 번호는 실제 HWPX control이 아니라 분석용 메타 정보에 가까웠기 때문에 한글 2024 화면에서 footer/PAGE로 렌더링될 수 없었다.

## 6. v3 수정 구조

표와 callout:

- `hp:pos treatAsChar="0"`
- `hp:pos horzRelTo="COLUMN"`
- `hp:pos horzAlign="CENTER"`
- 모든 셀 `hasMargin="1"`
- callout은 2행 1열 표 구조 유지
- 일반 표는 header/body borderFill을 분리

footer와 PAGE:

- `hp:ctrl`
- `hp:pageHiding`
- `hp:footer`
- `hp:autoNum numType="PAGE"`
- `hp:header`

스타일:

- `heading_1`을 과도한 중앙 대형 제목 스타일에서 더 얌전한 보고서형 좌측 제목 스타일로 낮췄다.
- `cover_subtitle`도 과한 제목 스타일 대신 본문형 보고서 스타일에 가깝게 조정했다.

## 7. 추가한 테스트

Worker 테스트:

- `renders v3 automatic documents with native reference table anchors and page footer fields`

diff 도구 테스트:

- `compares native and generated HWPX table, footer, and PAGE structures`

RED 확인:

- 구현 전 `nativeStructureValidation`이 없어 실패했다.
- diff 도구는 구현 파일이 없어 `ERR_MODULE_NOT_FOUND`로 실패했다.

GREEN 확인:

- Worker 테스트 15개 통과
- diff 도구 테스트 1개 통과

## 8. v3 산출물

- `release/test-documents/army-claw-hwpx-capability-v3.hwpx`
- `release/test-documents/army-claw-hwpx-capability-v3-validation.json`
- `release/test-documents/army-claw-hwpx-capability-v3-analysis.json`
- `release/test-documents/army-claw-hwpx-capability-v3-summary.json`
- `release/test-documents/army-claw-hwpx-native-v2-structure-diff.json`
- `release/test-documents/army-claw-hwpx-native-v2-structure-diff.md`
- `release/test-documents/army-claw-hwpx-native-v3-structure-diff.json`
- `release/test-documents/army-claw-hwpx-native-v3-structure-diff.md`
- `release/test-documents/army-claw-hwpx-native-v2-v3-comparison.md`

release 산출물은 저장소 커밋 대상이 아니며, 로컬 검증 자료로 유지한다.

## 9. v3 자동 검증 결과

```text
valid: true
errors: []
warnings: []
native_structure_validation: passed
native_structure_errors: []
native_visual_check_status: user_confirmation_pending
```

분석 결과:

- `tableCount`: 2
- `pageBreakCount`: 2
- `footer.actualFooter`: true
- `footer.pageNumberField`: true
- `nativeStructureValidation.passed`: true

## 10. 실행한 테스트

```text
node --test tools/hancom/army-claw-hancom-tools.test.mjs
```

결과:

```text
tests 15
pass 15
fail 0
```

```text
node --test tools/hancom/hwpx-native-structure-diff.test.mjs
```

결과:

```text
tests 1
pass 1
fail 0
```

실행한 CLI:

- `hwpx-auto-generate`
- `hwpx-validate`
- `hwpx-analyze-template`
- `hwpx-summary`
- `hwpx-native-structure-diff`

## 11. 사용자 한글 2024 확인 필요 항목

다음 파일을 한글 2024에서 열어 확인해야 한다.

```text
release/test-documents/army-claw-hwpx-capability-v3.hwpx
```

확인 항목:

1. 표지가 첫 페이지처럼 보이는지
2. 표지 메타 정보가 보이는지
3. 목차가 별도 페이지인지
4. 본문이 별도 페이지에서 시작하는지
5. 일반 표가 화면에 표로 렌더링되는지
6. 표를 클릭해 실제 표로 선택/편집 가능한지
7. callout이 상자로 보이는지
8. 제목 스타일이 과도하게 크거나 중앙 정렬되지 않았는지
9. 본문과 목록 간격이 자연스러운지
10. footer가 페이지 하단에 보이는지
11. 자동 페이지 번호가 보이고 페이지 증가에 따라 갱신되는지

현재 상태:

```text
native_visual_check_status: user_confirmation_pending
```

## 12. 현재 제한사항

- native reference와 v3의 header.xml 통계는 아직 다르다. v3는 기존 한컴 공문서 템플릿 header를 유지하면서 section 구조를 native 방식으로 보정했다.
- native reference에는 표지 메타 정보용 2열 표가 있으나, v3는 기존 DocumentPlan의 표지 문단 방식을 유지했다.
- 자동 구조 검증은 통과했지만 한글 2024 화면 렌더링 성공은 사용자가 직접 확인해야 한다.
- backend Adapter, 실행 큐, OpenClaw Tool Plugin, UI 연결, 설치 파일 재패키징은 이번 단계에서 제외했다.

## 13. 다음 권장 작업

1. 사용자가 v3 파일을 한글 2024에서 열어 시각 확인한다.
2. 표/callout/footer/PAGE가 정상 렌더링되면 이 구조를 HWPX Worker의 기본 렌더링 계약으로 확정한다.
3. 표지 메타 정보도 native reference처럼 2열 표로 전환할지 결정한다.
4. 이후 backend Adapter와 실행 큐에 HWPX Worker를 연결한다.
5. 한글 문서 생성 UI와 OpenClaw Tool Plugin 연결로 넘어간다.

# HWPX 문서 표현 엔진 구현 보고서

작성일: 2026-07-01
작업 브랜치: `feature/hwpx-worker-integration-and-native-table`
구현 커밋: `21dd8e8`

## 1. 읽은 GPT 의견 문서

- `docs/gpt-communication/README.md`
- `docs/gpt-communication/opinions/2026-06-30-hwpx-document-rendering-engine-review.md`
- `docs/gpt-communication/reports/2026-06-30-hwpx-template-auto-generation.md`

## 2. GPT 의견에서 반영한 항목

- DocumentPlan의 `table` 블록을 단순 텍스트가 아닌 실제 `hp:tbl` 구조로 렌더링했다.
- callout 블록을 본문 문단이 아닌 1열 표 기반 시각 블록으로 분리했다.
- 표지, 목차, 본문 시작 위치에 page break를 추가했다.
- `cover_title`, `toc_title`, `heading_1`, `body`, `table_header`, `table_body`, `callout_title`, `callout_body` 등 역할 기반 스타일 체계를 추가했다.
- `footer_text`를 본문 문장으로 출력하지 않고 별도 footer 메타 정보로 분리했다.
- 분석 결과에서 표 개수, 표 제목, 행/열 수, page break 수, style role, footer 텍스트를 확인할 수 있게 했다.
- 잘못된 표 행/열 입력은 DocumentPlan 검증 단계에서 거부하도록 했다.

## 3. 반영하지 못한 항목과 이유

- 실제 한글 2024의 네이티브 footer 객체와 자동 페이지 번호 객체는 구조 안정성이 아직 충분히 검증되지 않아 이번 단계에서는 보류했다.
- 자동 목차 필드는 이번 단계 범위에서 제외했다. 현재는 정적 목차 문단을 스타일링한다.
- 고급 표 병합, 중첩 표, 이미지 포함 표, 복잡한 행 높이 자동 계산은 MVP 범위 밖으로 남겼다.
- backend Adapter, 실행 큐, OpenClaw Tool Plugin, 최종 UI, 설치 파일 재빌드는 이번 작업 범위에서 제외했다.

## 4. 작업 시작 시 Git 상태

- 시작 기준 커밋: `dabe5a8`
- 포함된 GPT 의견 커밋:
  - `18cd372 Add GPT HWPX rendering engine review`
  - `dabe5a8 Document GPT opinion review workflow`
- `main` 병합은 수행하지 않았다.

## 5. 추가한 실패 테스트

- `renders automatic documents with native tables, page breaks, callouts, and footer separation`
- `rejects table rows with inconsistent column counts`

첫 테스트 실행에서는 `tableCount`가 0으로 실패했고, 표 행/열 불일치 검증도 실패했다. 이후 구현을 추가해 두 테스트를 모두 통과시켰다.

## 6. 구현 방식

### 실제 `hp:tbl`

`table` 블록은 다음 구조로 렌더링된다.

- `hp:tbl`
- `hp:tr`
- `hp:tc`
- `hp:subList`
- 셀 내부 `hp:p`, `hp:run`, `hp:t`

표 제목은 분석 및 비교를 위해 `army-table-title` 주석으로 보존한다.

### 스타일 체계

역할 기반 스타일을 기존 한컴 템플릿에 존재하는 `charPrIDRef`, `paraPrIDRef`에 매핑했다. 존재하지 않는 스타일 ID를 새로 참조하지 않도록 했다.

주요 role:

- `cover_title`
- `cover_subtitle`
- `cover_metadata`
- `toc_title`
- `toc_item`
- `heading_1`
- `heading_2`
- `heading_3`
- `body`
- `bullet_list`
- `numbered_list`
- `table_title`
- `table_header`
- `table_body`
- `callout_title`
- `callout_body`

### page break

- 표지 이후 목차 시작 문단에 page break 적용
- 목차 이후 첫 본문 heading에 page break 적용

분석 결과 기준 `pageBreakCount: 2`를 확인했다.

### callout

callout은 1열 표 구조로 렌더링한다.

- 첫 행: callout 제목
- 둘째 행: callout 본문
- `callout_title`, `callout_body` role로 일반 표와 구분

### footer

`footer_text`는 본문 끝의 `꼬리말:` 문장으로 출력하지 않는다. 현재는 `army-footer` 메타 정보로 분리하고 분석 결과에서 `footerText`로 확인한다.

현재 상태:

```text
page_number_status: unsupported_pending_native_structure
native_visual_check_status: user_confirmation_pending
```

## 7. v2 HWPX 산출물

- v2 문서: `release/test-documents/army-claw-hwpx-capability-v2.hwpx`
- v2 검증 결과: `release/test-documents/army-claw-hwpx-capability-v2-validation.json`
- v2 분석 결과: `release/test-documents/army-claw-hwpx-capability-v2-analysis.json`
- v2 요약 결과: `release/test-documents/army-claw-hwpx-capability-v2-summary.json`
- baseline/v2 비교: `release/test-documents/army-claw-hwpx-baseline-v2-comparison.md`

baseline 파일은 수정하지 않았다.

## 8. baseline/v2 비교 결과

- baseline 크기: 25,884 bytes
- v2 크기: 26,881 bytes
- baseline SHA256: `4234B8438E0FAA9AEC651E89C2F921184BC6D9C04E7C07C92D25255A7804B93D`
- v2 SHA256: `AD2C368CE50E1CBDC7819409CB15B486EA30A1BEE36AE423326565645AC0A3DD`
- v2 `tableCount`: 2
- v2 `pageBreakCount`: 2
- v2 구조 검증: 통과
- v2 검증 오류: 없음
- v2 검증 경고: 없음

## 9. 실행한 테스트

```text
node --test tools/hancom/army-claw-hancom-tools.test.mjs
```

결과:

```text
tests 14
pass 14
fail 0
duration_ms 218.3837
```

추가로 다음 Worker CLI를 실행했다.

```text
hwpx-auto-generate
hwpx-validate
hwpx-analyze-template
hwpx-summary
```

## 10. 사용자 확인 필요 항목

한컴오피스 한글 2024에서 다음 파일을 직접 열어 시각 확인해야 한다.

```text
release/test-documents/army-claw-hwpx-capability-v2.hwpx
```

확인 항목:

- 표지가 첫 페이지처럼 보이는지
- 목차가 별도 페이지로 보이는지
- 본문이 별도 페이지에서 시작하는지
- callout이 일반 문단과 구분되어 보이는지
- 일반 표가 한글 2024에서 실제 표로 선택/편집되는지
- footer 문장이 본문에 섞여 보이지 않는지

## 11. 다음 권장 작업

1. 사용자가 한글 2024에서 v2 파일을 열어 시각 확인한다.
2. 확인 결과를 바탕으로 실제 footer 객체와 자동 페이지 번호 구조를 한글 2024 샘플에서 추출한다.
3. DocumentPlan의 표/목록/callout 표현 품질을 추가 개선한다.
4. 검증된 표현 엔진을 backend Adapter와 실행 큐에 연결한다.
5. 이후 OpenClaw Tool Plugin 및 UI에서 HWPX 생성 도구로 노출한다.

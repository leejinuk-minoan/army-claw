# GPT 검토 의견 - HWPX v3 시각 결과와 최소 표 우선 전략

작성일: 2026-07-01

## 검토 대상

사용자가 한글 2024에서 다음 문서를 직접 열어 화면을 확인했다.

```text
release/test-documents/army-claw-hwpx-capability-v3.hwpx
```

## v3 시각 검증 판정

v3는 v2보다 크게 개선됐다.

### 통과

- 표지, 목차, 본문이 페이지별로 분리됨
- 목차가 별도 페이지로 표시됨
- 본문이 별도 페이지에서 시작함
- 머리말이 표시됨
- 실제 footer가 표시됨
- 자동 페이지 번호가 2, 3으로 증가함
- 장 제목이 왼쪽 정렬로 개선됨
- `꼬리말:` 문장이 본문에 섞이지 않음

### 실패 또는 부분 실패

- 일반 데이터 표가 화면에 표시되지 않음
- 표를 선택하거나 편집할 수 없음
- callout이 화면에 표시되지 않음
- 표지의 부서, 작성자, 날짜가 표시되지 않고 `-` 형태만 나타남
- 본문과 목록의 간격은 이전보다 개선됐으나 아직 다소 촘촘함

상태:

```text
native_visual_check_status: user_reported_partial_success
page_structure_status: passed
header_status: passed
footer_status: passed
page_number_status: passed
native_table_status: xml_present_but_not_rendered
callout_status: xml_present_but_not_rendered
cover_metadata_status: rendering_problem
style_quality_status: partially_passed
```

## 핵심 기술 판단

v3에서 `treatAsChar`, `horzRelTo`, `horzAlign`, `hasMargin` 등 표 내부 및 위치 속성은 native reference에 가까워졌지만, 실제 한글 2024에서는 표와 callout이 여전히 보이지 않는다.

따라서 남은 원인은 표의 내부 속성보다는 표가 문서 트리에 삽입되는 정확한 부모 구조일 가능성이 높다.

집중 분석 대상:

- 표가 포함된 상위 `hp:p` 전체
- 표를 감싸는 `hp:run`
- 표를 감싸는 `hp:ctrl`
- `hp:tbl`이 실제로 놓이는 위치
- 표 앞뒤 문단과 anchor 구조
- 문단 ID와 개체 ID 관계
- zOrder와 control ID 관계
- 관련 header.xml 참조

현재처럼 section body에 `parts.push(nativeTableXml(...))` 형태로 표 조각을 직접 추가하는 구조는 재검토해야 한다.

## 다음 작업 원칙

전체 보고서 v4를 바로 생성하지 않는다.

먼저 다음 최소 문서를 생성한다.

```text
제목 1개
본문 문단 1개
3열 × 3행 표 1개
표 아래 본문 문단 1개
```

출력 파일:

```text
release/test-documents/army-claw-hwpx-native-table-minimal.hwpx
```

최초 목표는 하나다.

> 한글 2024에서 표가 실제로 보이고, 클릭했을 때 표 객체로 선택되며, 셀 안에 커서를 둘 수 있는가?

이 목표가 확인되기 전에는 callout, 표지 메타정보, 전체 v4, backend Adapter, 실행 큐와 UI 연결로 넘어가지 않는다.

## 권장 구현 순서

```text
1. native reference의 표를 포함한 상위 hp:p 전체 추출
2. v3의 표 삽입 위치와 구조 비교
3. 최소 표 wrapper fixture 또는 builder 설계
4. nativeTableParagraphXml 같은 부모 문단 포함 렌더러 구현
5. 최소 표 HWPX 생성
6. 자동 구조 검증
7. 사용자 한글 2024 시각 확인
8. 성공 시 callout 적용
9. 성공 시 표지 메타정보 2열 표 적용
10. 전체 v4 생성
```

## fixture 및 구현 규칙

- native reference 원본은 직접 수정하지 않는다.
- 전체 사용자 문서를 fixture로 커밋하지 않는다.
- 표 객체에 필요한 최소 비민감 구조만 추출한다.
- 로컬 절대 경로, 사용자 이름, 기관 정보는 제거한다.
- 복잡한 XML을 정규식으로 대규모 조립하지 않는다.
- 필요하면 XML DOM 또는 구조화된 builder를 사용한다.
- 표 내부 속성뿐 아니라 부모 문단과 control 관계를 검증한다.
- 자동 테스트 통과만으로 시각 성공을 선언하지 않는다.

## 최소 표 완료 조건

```text
1. native reference의 표 부모 구조를 추출했다.
2. v3와의 구조 차이를 문서화했다.
3. 부모 문단을 포함하는 표 builder를 구현했다.
4. 최소 표 HWPX를 생성했다.
5. hwpx-validate를 통과했다.
6. 표 행·열과 셀 텍스트가 분석 결과에 나타난다.
7. 사용자가 한글 2024에서 확인할 파일 경로를 보고했다.
```

사용자 확인 전 상태:

```text
native_table_visual_status: user_confirmation_pending
```

사용자 확인 후에만 다음 중 하나로 갱신한다.

```text
native_table_visual_status: user_confirmed_success
native_table_visual_status: user_reported_rendering_problem
```

## 이후 단계

최소 표가 정상 표시되면 같은 wrapper를 이용해 다음 순서로 확장한다.

```text
일반 표
→ callout
→ 표지 메타정보 2열 표
→ 전체 v4 보고서
→ 사용자 시각 검증
→ backend Adapter와 실행 큐 연결
```

## Codex 시작 전 보고 요구

Codex는 이 문서를 읽은 뒤 코드 수정 전에 다음을 먼저 출력한다.

- v3에서 표가 보이지 않는 원인 가설
- native reference에서 추출할 부모 구조
- 현재 코드에서 교체할 함수와 삽입 방식
- 최소 문서 생성 계획
- 원본 파일 보존 방법

작업 종료 보고서에는 다음을 포함한다.

- native reference의 표 wrapper 구조
- v3와의 핵심 차이
- 새 builder 구조
- 생성된 최소 표 문서 경로
- 자동 테스트 결과
- 한글 2024 사용자 확인 항목
- 현재 제한사항

# GPT 검토 의견 - HWPX v2 시각 실패와 네이티브 기준 문서 활용

작성일: 2026-07-01

## 검토 대상

사용자가 한글 2024에서 다음 Army Claw 생성 문서를 직접 열어 화면을 확인했다.

```text
release/test-documents/army-claw-hwpx-capability-v2.hwpx
```

또한 GPT가 작성한 비교용 DOCX를 한글 2024에서 열어 HWPX로 다시 저장했고, 사용자가 해당 문서가 정상적으로 보인다고 확인했다.

네이티브 기준 문서 경로:

```text
release/test-documents/army-claw-hwpx-native-reference.hwpx
```

상태:

```text
native_reference_status: user_confirmed_success
```

## v2 시각 검증 판정

v2는 ZIP/XML 구조 검증과 Worker 테스트는 통과했지만, 한글 2024 실제 화면 기준으로 표현 엔진 완료 조건을 충족하지 못했다.

판정:

```text
native_visual_check_status: user_reported_rendering_problem
native_table_status: xml_present_but_not_rendered
callout_status: xml_present_but_not_rendered
style_quality_status: failed_visual_review
cover_metadata_status: rendering_problem
```

## 화면에서 확인된 결과

### 통과 또는 부분 통과

- 표지, 목차와 본문이 세 페이지로 분리됐다.
- 목차는 별도 페이지로 표시됐다.
- 본문은 별도 페이지에서 시작했다.
- `꼬리말:` 문장이 본문 끝에 출력되지는 않았다.
- 제목과 본문 텍스트 자체는 표시됐다.

### 실패

- 일반 데이터 표가 화면에 렌더링되지 않았다.
- callout 표가 화면에 렌더링되지 않았다.
- 표지의 부서, 작성자와 날짜가 정상적으로 표시되지 않았다.
- 제목 스타일이 지나치게 크고 강한 파란색이며 중앙 정렬돼 실무 보고서에 부적합했다.
- 본문 글자 크기, 제목 크기, 여백과 간격의 균형이 좋지 않았다.
- 실제 footer와 자동 페이지 번호는 구현되지 않았다.

## 핵심 기술 판단

`Contents/section0.xml`에 `hp:tbl` 태그가 존재하고 구조 검증기가 표 개수를 계산하는 것만으로는 한글 2024에서 실제 표가 렌더링된다고 보장할 수 없다.

현재 v2 구현은 표 XML 조각을 section에 삽입했지만, 한글이 기대하는 다음 관계 중 일부가 빠졌거나 잘못됐을 가능성이 높다.

- 표 객체가 들어가는 정확한 부모 문단과 run 구조
- `hp:ctrl` 또는 개체 anchor 연결
- 표 개체 식별자와 참조 관계
- 표 앞뒤 문단 구조
- 셀 subList의 필수 속성
- header.xml의 borderFill, charPr, paraPr 참조
- 개체 크기, 위치와 zOrder 규칙

callout은 표 구조를 재사용하므로 일반 표가 렌더링되지 않으면 callout도 함께 사라진다.

## 네이티브 기준 문서의 역할

`army-claw-hwpx-native-reference.hwpx`는 다음 요소를 한글 2024가 직접 HWPX로 저장한 정상 기준 문서다.

- 독립 표지
- 별도 목차
- 본문 제목과 문단
- 실제 데이터 표
- 표 기반 callout
- 글머리표와 번호 목록
- 머리말
- 꼬리말
- 자동 PAGE 필드
- 페이지 나누기

Codex는 현재 v2 XML을 계속 추측해 수정하지 말고 이 기준 문서와 구조를 직접 비교해야 한다.

## 다음 작업의 필수 순서

```text
1. baseline, v2, native reference 원본 보존
2. native reference와 v2 ZIP 엔트리 비교
3. section0.xml 구조 diff
4. header.xml과 content.hpf 참조 diff
5. 네이티브 표의 정확한 부모·자식 구조 추출
6. 네이티브 callout 구조 추출
7. 네이티브 footer와 PAGE 필드 구조 추출
8. 네이티브 style ID와 의미 분석
9. 현재 렌더러를 네이티브 구조 기반으로 재구현
10. v3 생성 및 자동 검증
11. 한글 2024 사용자 시각 검증
```

backend Adapter, 실행 큐, OpenClaw Tool Plugin과 UI 연결은 v3 시각 검증이 성공할 때까지 보류한다.

## 구현 원칙

- 한글 2024가 생성한 정상 객체를 기준으로 한다.
- 원본 네이티브 기준 문서를 직접 수정하지 않는다.
- 비교용 압축 해제 폴더는 프로젝트 내부 `.tmp` 아래에 만든다.
- 한컴 원본 템플릿과 사용자 문서는 GitHub에 커밋하지 않는다.
- 네이티브 기준 파일 자체도 저장소 정책을 확인하기 전에는 커밋하지 않는다.
- XML 문자열 정규식 치환만으로 복잡한 객체를 조립하지 않는다.
- 필요한 경우 XML DOM 또는 구조화된 builder를 사용한다.
- 표 객체의 필수 부모 구조와 참조 무결성을 자동 검증한다.
- LLM은 DocumentPlan만 만들고 Worker가 결정론적으로 렌더링한다.

## v3 최소 완료 조건

동일한 DocumentPlan으로 다음 파일을 만든다.

```text
release/test-documents/army-claw-hwpx-capability-v3.hwpx
```

v3는 최소 다음을 만족해야 한다.

- 한글 2024에서 일반 표가 실제 표로 보이고 선택·편집된다.
- callout이 실제 상자로 보인다.
- 표지 메타정보가 표시된다.
- 표지, 목차와 본문 페이지 분리가 유지된다.
- 제목은 왼쪽 정렬의 절제된 보고서 스타일로 표시된다.
- 본문과 목록의 글자 크기와 간격이 자연스럽다.
- 실제 footer가 표시된다.
- 자동 페이지 번호가 표시된다.
- 구조 검증 오류와 경고가 없다.

자동 테스트만으로 시각 완료를 확정하지 않는다. 최종 상태는 사용자가 한글 2024에서 확인한 뒤 다음처럼 기록한다.

```text
native_visual_check_status: user_confirmed_success
```

## Codex 보고 요구사항

Codex는 작업 시작 전에 이 문서를 읽고 다음을 먼저 보고해야 한다.

- v2 실패 원인에 대한 가설
- native reference에서 추출할 구조
- 현재 렌더러에서 교체할 부분
- 원본 세 문서를 보존하는 방법
- v3 완료 기준

작업 종료 보고서에는 다음을 포함한다.

- native reference와 v2의 핵심 XML 차이
- 네이티브 표 렌더링 구현 방식
- callout 구현 방식
- footer와 PAGE 필드 구현 방식
- style mapping 변경
- 자동 검증 결과
- v3 경로
- 한글 2024에서 사용자가 확인할 항목

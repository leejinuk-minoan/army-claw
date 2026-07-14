# GPT 검토 의견 - HWPX v4 네이티브 레이아웃 재계산 계획

작성일: 2026-07-02
기준 브랜치: `feature/hwpx-template-fidelity-semantic-blocks`

## 1. 현재 v3 판정

v3는 의미 블록 선택과 비대상 범위 보존에는 성공했지만, 한글 2024 시각 검증에서 다음 문제가 확인됐다.

```text
- `주 11-2`의 긴 현 실태/문제점과 개선내용이 서로 겹쳐 읽기 어려움
- 기존 line layout 정보가 새 텍스트 길이에 맞게 재계산되지 않음
- `보조 11-2`에서 구조 컨테이너 문단과 내부 leaf 문단이 함께 선택된 흔적이 있음
- `<hp:fwSpace/>`가 실제 텍스트로 노출됨
- 표지와 `주 11-1` 비대상 페이지 보존은 성공
```

이 문제는 LLM 내용 품질이 아니라 HWPX 작성 엔진의 레이아웃 재흐름, selector node classification, inline XML 직렬화 문제다.

## 2. v4 핵심 목표

```text
1. 긴 본문이 필요한 만큼 자연스럽게 줄바꿈됨
2. 줄 수 증가에 따라 아래 문단이 정상적으로 이동함
3. 글자 장평·자간을 과도하게 축소하지 않음
4. 한글 2024 COM을 사용해 네이티브 레이아웃을 재계산함
5. structural container와 leaf text paragraph를 분리함
6. `<hp:fwSpace/>` marker가 일반 텍스트로 노출되지 않음
7. `주 11-2`와 `보조 11-2`가 읽을 수 있는 상태로 생성됨
8. 표·이미지·도형·비대상 페이지를 보존함
```

## 3. 레이아웃 정책

세 가지 정책을 도입한다.

### preserve_exact

- 기존 줄 수와 배치를 유지한다.
- 텍스트가 수용 범위를 넘으면 실행 중단한다.
- 제목, 조직명, 쪽 식별자와 짧은 표 셀에 사용한다.
- 장평, 자간, 글자 크기를 자동 축소하지 않는다.

### allow_line_growth

- 긴 본문의 줄 수 증가를 허용한다.
- 변경 문단의 stale `hp:linesegarray`를 무효화하거나 한글 엔진이 재계산할 수 있게 처리한다.
- XML 적용 후 한글 2024 COM open/save 정규화를 수행한다.
- 개요, 현 실태, 문제점, 개선내용, 기대효과와 보조판 본문에 사용한다.

### fit_or_fail

- 지정 영역을 초과하면 오류를 반환한다.
- 자동으로 자간·장평·글자 크기를 줄이지 않는다.
- 고정 크기 표 셀이나 작은 글상자에 사용한다.

## 4. native_layout_normalize

다음 후처리 단계를 구현한다.

```text
XML selector 적용
→ 임시 HWPX 저장
→ `HWPFrame.HwpObject`로 임시 HWPX 열기
→ 한글 엔진의 줄바꿈·문단 높이·쪽 흐름 재계산 유도
→ 별도 출력 HWPX로 저장
→ COM 종료
→ HWPX 구조 및 보존 diff 실행
```

필수 안전 규칙:

- 원본과 v3 파일을 덮어쓰지 않는다.
- 작업별 고유 임시 디렉터리를 사용한다.
- 이번 실행에서 시작한 Hwp 프로세스만 추적·정리한다.
- 사용자에게 이미 열려 있던 Hwp 프로세스를 종료하지 않는다.
- modal dialog와 timeout을 진단 로그에 기록한다.
- open 또는 save 실패 시 성공 산출물로 승격하지 않는다.
- source SHA256 전후 동일 여부를 검사한다.

## 5. linesegarray 처리 실험

구현 전에 최소 재현 테스트를 만든다.

```text
A. 기존 `hp:linesegarray`를 유지한 긴 replacement
B. 변경 문단의 `hp:linesegarray`만 제거한 긴 replacement
C. XML 적용 후 한글 COM open/save 정규화
```

A/B/C의 HWPX 구조와 한글 2024 결과를 비교하고 가장 보존성이 높은 방식을 선택한다.

권장 우선순위:

```text
변경 문단의 stale line layout만 무효화
→ COM native normalize
→ 구조 diff
```

전체 section의 linesegarray를 무차별 삭제하지 않는다.

## 6. structural container와 leaf paragraph

DocumentOrderIndex node classification을 확장한다.

```text
paragraph_leaf
paragraph_structural_container
table_cell_paragraph
draw_text_paragraph
control_paragraph
```

규칙:

- `hp:tbl`, 그림, 도형, 글상자 같은 descendant control을 담는 부모 문단은 structural container로 분류한다.
- 부모 컨테이너의 `logical_text`에 모든 descendant leaf text를 합쳐 일반 selector 후보로 사용하지 않는다.
- 일반 paragraph selector는 leaf paragraph만 선택한다.
- 표 셀과 글상자 내부 문단은 각각 명시적 path를 가진다.
- 동일 selector 적용에서 부모와 자식을 동시에 선택하면 plan 단계에서 오류 처리한다.
- overlapping range와 ancestor/descendant 중복 선택을 탐지한다.

## 7. inline element 직렬화

검색·분석용 텍스트와 출력 XML을 분리한다.

```text
검색용 normalized text:
`hp:fwSpace`를 일반 공백 또는 내부 token으로 표현 가능

출력용 replacement text:
`<hp:fwSpace/>` 문자열을 그대로 넣지 않음
```

필수 규칙:

- literal `<hp:.../>` 문자열이 `hp:t` 안에 들어가면 테스트 실패
- 사용자가 입력한 일반 공백은 일반 text 또는 실제 `hp:fwSpace` element로 안전하게 직렬화
- XML element marker를 replacement content에 재사용하지 않음
- Preview/PrvText.txt에도 marker 문자열이 남지 않아야 함

## 8. 주판·보조판 논리 메타데이터

현재 시험 문서의 논리 구조를 analyzer 결과에 기록한다.

```text
주 11-1 ↔ 보조 11-1
주 11-2 ↔ 보조 11-2
```

최소 필드:

```json
{
  "board_role": "main",
  "board_number": 2,
  "board_total": 11,
  "support_board_id": "support-2"
}
```

```json
{
  "board_role": "support",
  "board_number": 2,
  "board_total": 11,
  "main_board_id": "main-2"
}
```

이번 v4에서는 미리보기 UI를 구현하지 않는다. 다만 scope와 검증 결과에서 `주 11-2`, `보조 11-2`를 물리 페이지 번호가 아니라 논리 board id로 식별할 수 있게 한다.

## 9. v4 사용자 확인 목표

다음 산출물을 생성한다.

```text
release/test-documents/army-claw-qualification-review-template-fidelity-v4.hwpx
```

한글 2024 확인 기준:

```text
- 표지 유지
- `주 11-1` 원문 유지
- `주 11-2` 현 실태/문제점과 개선내용이 정상 줄바꿈됨
- 문장 겹침 없음
- 장평·자간 비정상 축소 없음
- 기대효과 전체가 읽을 수 있음
- `보조 11-2` 제목과 본문 중복·겹침 없음
- `<hp:fwSpace/>` 표시 없음
- 표·이미지·도형·페이지 식별자 유지
- 3/11 이후 비대상 페이지 유지
```

## 10. 구현 보류

```text
- LLM 연결
- 중제목과 본문의 의미 품질 튜닝
- Template Registry
- dual_page/single_page 미리보기 UI
- 전체 11개 주판·보조판 자동 생성
- 이미지 교체
- 한셀·한쇼
```

## 11. 완료 상태

```text
v4_native_reflow_status: planned
v4_native_layout_normalize_status: planned
v4_container_leaf_selection_status: planned
v4_inline_serialization_status: planned
hwpx_engine_completion_status: blocked_by_v4_visual_confirmation
```

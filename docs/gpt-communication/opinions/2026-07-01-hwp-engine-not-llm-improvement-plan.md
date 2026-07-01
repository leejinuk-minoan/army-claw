# GPT 검토 의견 - 현재 병목은 LLM이 아니라 HWP 작성 엔진이다

작성일: 2026-07-01

## 1. 판정

사용자가 한글 2024에서 `army-claw-qualification-review-sample.hwpx`를 직접 확인한 결과, 문서는 열리고 텍스트와 일부 표 객체도 생성됐지만 자격심사형 기준 양식은 정상적으로 재현되지 않았다.

주요 증상:

- 표지의 배치와 조직명 스타일이 기준 양식과 다름
- 반복 요약 블록의 크기·위치·구성이 다름
- 기대효과 항목 누락
- `주 2-1`, `보조 2-1` 식별자가 일반 본문처럼 배치됨
- 병합 머리글 표의 셀 주소·폭·배치가 깨짐
- 페이지별 고정 레이아웃을 재현하지 못함

현재 증상은 문서 내용 생성 문제가 아니라 HWPX 객체·스타일·페이지 배치 문제다. 따라서 현재 핵심 원인은 로컬 LLM이 아니라 다음 계층이다.

```text
HWP → HWPX 변환기
실제 원본 양식 분석기
HWPX 레이아웃 렌더러
병합 표 그리드 계산기
템플릿 기반 치환 엔진
```

## 2. LLM 작업을 일시적으로 분리한다

다음 단계에서는 로컬 LLM을 문서 품질 평가에 사용하지 않는다.

```text
고정된 테스트 JSON
→ 결정론적 HWPX 엔진
→ 한글 2024 시각 검증
```

동일한 JSON으로 반복 생성하여 엔진 수정 전후 결과만 비교한다. 엔진이 정상화된 뒤 LLM을 다시 연결한다.

현재 LLM을 더 큰 모델로 교체하거나 프롬프트를 수정해도 병합 셀, 페이지 좌표, borderFill, 글상자와 반복 영역 문제는 해결되지 않는다.

## 3. 다음 작업 우선순위

```text
1. HWPFrame.HwpObject COM 변환 timeout 진단
2. 실제 원본 HWP 두 개를 HWPX로 변환
3. 실제 변환 HWPX에서 page/table/style 구조 추출
4. 자격심사형 한 페이지를 템플릿 기반으로 정밀 재현
5. 병합 표 그리드 계산기 보정
6. 사용자 한글 2024 시각 확인
7. 성공 후 공식 계획서형 한 페이지로 확장
8. 그 뒤 style-profile 자유 생성과 LLM 연결
```

## 4. HWP Automation timeout 진단 원칙

현재 확인된 상태:

```text
HWPFrame.HwpObject: 생성 가능
HwpAutomationApp2.HwpAutomation: class not registered
COM 변환: 대기 상태에서 timeout
HwpConverter.exe 직접 인자 방식: 실패
```

Codex는 `HwpConverter.exe`의 추측 인자 사용을 반복하지 않는다. `HWPFrame.HwpObject` 경로를 단계별로 계측한다.

반드시 확인할 항목:

- 실행 PowerShell/호스트 프로세스의 32비트·64비트 여부
- 설치된 한글 2024와 COM 등록 비트 수 일치 여부
- COM 객체 생성 완료 시점
- 새 문서 또는 HWP 열기 전후 시점
- 보안 모듈·파일 경로 검사 단계
- 숨겨진 모달 대화상자 또는 확인 창 존재 여부
- SaveAs 또는 저장 API 호출 전후 시점
- 출력 파일 생성 여부
- 문서 닫기와 Quit 단계
- timeout 발생 시 남은 Hwp.exe 프로세스

권장 진단 매트릭스:

```text
64-bit PowerShell + HWPFrame.HwpObject
32-bit Windows PowerShell + HWPFrame.HwpObject
visible=true 진단 실행
visible=false 자동 실행
단순 신규 문서 저장
공개 HWP 열기
공개 HWP를 HWPX로 저장
```

각 단계에 타임스탬프 로그를 남긴다. 미확인 대화상자를 자동 클릭하지 않는다. 사용자 문서 원본을 덮어쓰지 않는다.

COM 호출은 STA 스레드에서 실행한다. 32비트 한글 Automation인 경우 32비트 Windows PowerShell 또는 동등한 32비트 호스트를 명시적으로 사용한다.

## 5. 변환 성공 후 실제 manifest를 다시 만든다

현재 manifest는 육안 특징을 바탕으로 한 수동 정의이며 실제 원본 구조 추출 결과가 아니다.

변환 성공 후 다음 값을 실제 HWPX에서 채운다.

```text
page.width
page.height
page.margins
section 수
페이지 나누기 위치
charPr·paraPr·style
borderFill
표 부모 wrapper
행·열·cellAddr·cellSpan·cellSz
셀 여백
표 전체 폭
머리말·꼬리말·페이지 번호
도형·글상자·이미지·BinData
반복 페이지 영역
페이지 식별자 위치
```

수동 기대값과 실제 추출값을 구분한다.

```json
{
  "source": "native_converted_hwpx",
  "verified": true,
  "expected": {},
  "observed": {}
}
```

## 6. 우선 구현할 것은 한 페이지 정밀 템플릿 재현이다

전체 11페이지 또는 2개 프로필을 동시에 개선하지 않는다.

우선 자격심사형 기준 문서의 대표 내용 페이지 한 장을 선택한다. 권장 대상은 반복 요약 블록과 페이지별 중심 제목이 함께 있는 페이지다.

목표 출력:

```text
release/test-documents/army-claw-qualification-review-native-page-sample.hwpx
```

방법:

```text
실제 변환된 원본 HWPX 복사
→ 대표 페이지 구조와 스타일 보존
→ 원본 업무 내용은 Army Claw 검증 문구로 치환
→ 페이지 코드와 현재/전체 페이지 값 치환
→ 새 파일로 저장
```

이 단계에서는 레이아웃을 새로 추측해 조립하지 않는다. 원본의 문단, 표, 글상자, borderFill, charPr, paraPr와 페이지 구조를 최대한 보존한다.

검증 요소:

- 반복 요약 블록
- 개요
- 현 실태/문제점
- 개선내용
- 기대효과
- 페이지 중심 제목
- 현재/전체 페이지
- `주` 식별자
- `보조` 식별자
- 원본과 유사한 여백·정렬·글자 크기

## 7. 템플릿 치환과 자유 생성은 분리한다

### Template Fidelity Mode

```text
변환된 기준 HWPX
→ 지정 필드·문단·셀 치환
→ 구조와 스타일 보존
```

정밀 재현이 필요한 자격심사 문서와 결재 계획서에 우선 사용한다.

### Style Profile Mode

```text
고정 JSON
→ renderer primitive
→ 유사 계열 새 HWPX 생성
```

원본이 없거나 자유로운 새 문서에 사용한다.

현재 시각 검증 실패 때문에 두 모드를 같은 완료 상태로 보고하지 않는다.

## 8. 병합 셀 엔진 보정

현재 `cellSpan` 출력만으로는 정상 병합 표를 보장하지 못한다.

논리 그리드 모델을 먼저 만든다.

```text
TableGridModel
- row_count
- col_count
- column_widths
- row_heights
- anchor_cells
- occupied_coordinates
```

각 병합 셀은 anchor 하나만 XML로 출력하고, 병합 영역의 나머지 좌표는 점유 상태로 관리한다.

필수 계산:

```text
cellAddr = anchor 좌표
cellSpan = row_span·col_span
cellSz.width = 병합된 모든 열 너비의 합
cellSz.height = 병합된 모든 행 높이의 합
중복 hp:tc 출력 금지
행별 출력 순서 고정
표 전체 폭 = column_widths 합
```

필수 테스트:

- 단일 `col_span=2`
- 단일 `row_span=2`
- row/col span 동시 적용
- 다단 머리글
- 서로 인접한 병합 영역
- 병합 충돌 거부
- 범위 초과 거부
- cellAddr 중복 없음
- 병합 후 한글 2024 셀 선택 가능

## 9. 완료 기준

이번 개선 단계는 다음이 모두 만족돼야 완료다.

```text
1. COM timeout의 정확한 정지 단계가 기록됨
2. 적어도 자격심사 원본 HWP가 HWPX로 실제 변환됨
3. 원본 SHA256이 변환 전후 동일함
4. 실제 변환 HWPX analyzer 결과가 생성됨
5. 수동 manifest가 실제 관측값으로 갱신됨
6. 대표 한 페이지를 Template Fidelity Mode로 생성함
7. 고정 테스트 JSON을 사용함
8. 병합 셀 논리 그리드 테스트가 통과함
9. 생성 HWPX가 구조 검증을 통과함
10. 사용자가 한글 2024에서 확인할 파일이 제공됨
```

사용자 확인 전 상태:

```text
qualification_native_page_visual_status: user_confirmation_pending
```

## 10. 보류 항목

다음은 위 완료 조건 전까지 보류한다.

```text
로컬 LLM 모델 변경
LLM 프롬프트 최적화
두 기준 문서 전체 자동 재현
backend 실행 큐 최종 연결
OpenClaw Tool Plugin 최종 등록
UI
설치 파일 재빌드
한셀
한쇼
```

## 11. Codex 시작 전 요구사항

Codex는 이 문서를 읽고 코드 변경 전에 다음을 먼저 출력한다.

- 현재 실패가 엔진 문제라고 판단하는 근거
- COM timeout 진단 매트릭스
- 변환 성공 판정 조건
- 실제 manifest 갱신 방식
- 대표 페이지 선택과 템플릿 치환 방식
- 병합 셀 그리드 수정 계획
- 이번 작업에서 건드리지 않을 LLM 관련 항목

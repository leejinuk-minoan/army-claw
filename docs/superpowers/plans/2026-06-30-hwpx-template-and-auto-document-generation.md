# HWPX 양식 기반 및 자동 디자인 문서 생성 계획

## 목표

Army Claw는 두 가지 HWPX 생성 모드를 제공한다.

1. 사용자가 지정한 HWPX 양식의 플레이스홀더를 채워 새 문서를 생성한다.
2. 양식이 없을 때 구조화된 DocumentPlan과 디자인 프로필로 한글 2024 호환 HWPX 문서를 생성한다.

## 구현된 1차 범위

- 한컴 2024 공식 HWPX 템플릿 기반 패키지 보존 생성
- 최소 ZIP/XML 생성 fallback 금지
- HWPX 패키지 검증
- HWPX 양식 분석
- 명시적 플레이스홀더 탐지
- 필드 매핑 기반 플레이스홀더 치환
- 원본 파일 불변 확인
- BinData 미디어 해시 보존 확인
- DocumentPlan 검증
- `official_report`, `modern_report`, `meeting_minutes`, `project_plan` 프로필 이름 검증
- 자동 디자인 문서 생성
- CLI JSON 파일 입력 지원

## 남은 구현 범위

- 책갈피와 한글 필드 기반 입력 위치 탐지
- 라벨 다음 영역과 휴리스틱 후보 탐지
- 실제 HWPX 표 객체 생성
- 머리말과 꼬리말의 정밀 생성/수정
- 기존 backend 실행 큐가 Node Worker를 호출하도록 adapter 연결
- OpenClaw Tool Plugin 등록
- React/OpenClaw UI의 두 문서 생성 흐름 추가
- 설치 파일 재빌드와 설치본 smoke test

## 테스트 기준

- Node Hancom Worker 테스트를 통과해야 한다.
- `template-based-sample.hwpx`와 `auto-designed-sample.hwpx`가 생성되어야 한다.
- 두 파일은 HWPX 구조 검증을 통과해야 한다.
- 한글 2024 네이티브 열기 여부는 사용자의 수동 확인을 최종 검증으로 기록한다.

## 보안 기준

- 작업공간 밖 경로를 거부한다.
- ZIP path traversal을 거부한다.
- 실행 파일 또는 스크립트 엔트리를 오류로 처리한다.
- 필수 HWPX 엔트리 누락을 오류로 처리한다.
- LLM이 생성한 XML, PowerShell, JavaScript를 실행하지 않는다.
- LLM은 DocumentPlan만 생성하고, Worker가 결정론적으로 HWPX를 만든다.

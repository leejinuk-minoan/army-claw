# Slice 5 - 한글/HWPX 도구 구현 계획

**작성일:** 2026-06-26

## 목표

Army Claw v0.1에서 한글 문서 업무의 1차 포맷인 HWPX를 직접 다룰 수 있게 한다. 첫 구현은 한컴오피스 앱 자동화가 아니라 HWPX의 ZIP/XML 구조를 직접 읽고 쓰는 방식으로 진행한다.

## 포함 범위

- HWPX 파일 생성.
- HWPX 본문 단락 요약 및 텍스트 추출.
- 기존 HWPX에 본문 단락 추가.
- HWPX 확장자 및 작업공간 경로 제한.
- FastAPI 엔드포인트 추가.
- React 웹 UI 패널 추가.
- 한글/HWPX 호환성 안내.

## 제외 범위

- legacy `.hwp` 직접 처리.
- 한컴 한글 앱을 직접 조작하는 GUI/COM/자동화.
- HWPX 전체 스펙 수준의 스타일, 표, 이미지, 머리말/꼬리말, 각주 처리.
- 한컴 한글 렌더링 결과의 시각 검증.

## 구현 파일

- 생성: `backend/openclaw/hwpx_tools.py`
- 생성: `backend/tests/test_hwpx_tools.py`
- 수정: `backend/openclaw/main.py`
- 수정: `frontend/src/types.ts`
- 수정: `frontend/src/api.ts`
- 수정: `frontend/src/App.tsx`

## 테스트 기준

- HWPX 생성 후 요약 결과가 입력 문단을 반환해야 한다.
- HWPX에 단락을 추가하면 요약 결과에 반영되어야 한다.
- `.hwpx`가 아닌 경로는 거부해야 한다.
- 작업공간 밖으로 벗어나는 경로는 거부해야 한다.
- API로 생성, 단락 추가, 요약이 이어져야 한다.
- 전체 백엔드 테스트와 프론트엔드 빌드가 통과해야 한다.

## 결과

- HWPX ZIP/XML 기반 최소 도구를 구현했다.
- `/api/hwpx/create`, `/api/hwpx/summary`, `/api/hwpx/add-paragraph`, `/api/hwpx/compatibility` 엔드포인트를 추가했다.
- 웹 UI에 한글/HWPX 도구 패널을 추가했다.
- 검증 결과: 백엔드 테스트 31개 통과, React/Vite 빌드 통과.

## 현재 제한사항

- 생성되는 HWPX는 v0.1 최소 구조이며, 한컴 한글에서의 완전한 서식 호환성은 별도 검증이 필요하다.
- 복잡한 HWPX 문서의 표, 이미지, 스타일, 구역 속성 편집은 아직 지원하지 않는다.
- 한컴 한글 앱 자동화와 렌더링 검증은 후속 고도화 대상으로 남긴다.

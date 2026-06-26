# Slice 3 한셀/XLSX 도구 구현 계획

> **에이전트 작업자 필수 지침:** 이 계획은 Inline Execution으로 구현한다. 모든 사용자-facing 문서는 한글로 작성한다.

**목표:** Microsoft Excel 없이 한셀 환경을 기준으로 XLSX 파일을 직접 읽고, 요약하고, 셀을 수정하고, 간단한 함수/차트/피벗형 요약을 생성하는 기반을 만든다.

**아키텍처:** 백엔드는 `openpyxl` 기반 `XlsxService`를 제공하고, 기존 Mode A 작업공간 경로 검증을 재사용한다. 프론트엔드는 작업공간 안의 XLSX 파일 경로를 받아 workbook 요약, sheet preview, 셀 쓰기, 함수 제안, 피벗형 그룹 요약을 호출한다.

**범위:** 이번 Slice 3의 첫 구현은 파일 포맷 직접 처리 중심이다. 한셀 네이티브 자동화와 실제 피벗 테이블 객체 생성은 후속 고도화로 남긴다.

---

## 구현 파일

- 생성: `backend/openclaw/xlsx_tools.py`
- 생성: `backend/tests/test_xlsx_tools.py`
- 수정: `backend/pyproject.toml`
- 수정: `backend/openclaw/main.py`
- 수정: `frontend/src/types.ts`
- 수정: `frontend/src/api.ts`
- 수정: `frontend/src/App.tsx`
- 수정: `frontend/src/styles.css`
- 수정: `docs/openclaw-project-status.md`

## 구현 기능

- workbook 요약.
- sheet 행/열 크기와 preview 반환.
- 셀 값 쓰기.
- 간단한 함수 제안.
- column group/value 기반 피벗형 요약.
- 간단한 bar chart 생성.

## 검증

- 백엔드: `python -m pytest -v`
- 프론트엔드: Vite production build

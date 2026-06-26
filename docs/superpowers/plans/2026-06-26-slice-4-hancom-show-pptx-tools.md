# Slice 4 한쇼/PPTX/.show 도구 구현 계획

> **에이전트 작업자 필수 지침:** 이 계획은 Inline Execution으로 구현한다. 모든 사용자-facing 문서는 한글로 작성한다.

**목표:** 한쇼 환경을 기준으로 PPTX 파일을 직접 생성/요약/수정하는 기본 도구를 만들고, `.show` 호환성 경로를 Army Claw 설계에 연결한다.

**아키텍처:** 백엔드는 `python-pptx` 기반 `PresentationService`를 제공한다. 기존 Mode A 작업공간 경로 검증을 재사용한다. 프론트엔드는 작업공간 안의 PPTX 경로를 받아 새 프레젠테이션 생성, 요약, 제목 슬라이드 추가, bullet 슬라이드 추가를 호출한다.

**범위:** 이번 Slice 4의 첫 구현은 PPTX 직접 처리 중심이다. `.show` 네이티브 편집과 한쇼 COM/GUI 자동화는 후속 고도화로 남긴다.

---

## 구현 파일

- 생성: `backend/openclaw/presentation_tools.py`
- 생성: `backend/tests/test_presentation_tools.py`
- 수정: `backend/pyproject.toml`
- 수정: `backend/openclaw/main.py`
- 수정: `frontend/src/types.ts`
- 수정: `frontend/src/api.ts`
- 수정: `frontend/src/App.tsx`
- 수정: `frontend/src/styles.css`
- 수정: `docs/openclaw-project-status.md`

## 구현 기능

- PPTX 새 파일 생성.
- PPTX 요약.
- 제목 슬라이드 추가.
- bullet 슬라이드 추가.
- `.show` 파일 입력 시 현재는 네이티브 편집 미지원 메시지 반환.

## 검증

- 백엔드: `python -m pytest -v`
- 프론트엔드: Vite production build

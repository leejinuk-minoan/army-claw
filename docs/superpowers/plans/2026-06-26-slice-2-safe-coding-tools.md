# Slice 2 안전한 코딩 도구 구현 계획

> **에이전트 작업자 필수 지침:** 이 계획을 구현할 때는 `superpowers:executing-plans` 흐름으로 작업 단위별 검증을 수행한다.

**목표:** Mode A(Project Folder Restricted) 기준으로 작업공간 내부 파일 탐색, 읽기, 쓰기 전 diff preview, 승인 기반 쓰기, PowerShell 명령 제안/승인 API 골격을 구현한다.

**아키텍처:** 백엔드는 `WorkspaceService`가 경로 검증과 파일 작업을 담당하고, FastAPI route가 이를 노출한다. 프론트엔드는 작업공간 경로, 파일 목록, 파일 내용, diff preview, 명령 승인 요청을 표시한다. 실제 명령 실행은 v0.1 Slice 2에서는 승인 API 골격까지만 제공하고, 위험한 자동 실행은 기본 차단한다.

**기술 스택:** FastAPI, Pydantic, pathlib, difflib, pytest, React, TypeScript.

---

## 작업 범위

- Mode A: 작업공간 내부만 허용.
- 파일 트리 조회.
- 파일 읽기.
- 파일 쓰기 전 unified diff 생성.
- 승인 플래그가 있을 때만 파일 쓰기.
- PowerShell 명령은 proposal 생성까지만 기본 제공.
- 명령 실행 endpoint는 `approved=true`가 없으면 실행하지 않는다.

## 구현 파일

- 생성: `backend/openclaw/workspace.py`
- 생성: `backend/tests/test_workspace.py`
- 수정: `backend/openclaw/main.py`
- 수정: `frontend/src/types.ts`
- 수정: `frontend/src/api.ts`
- 수정: `frontend/src/App.tsx`
- 수정: `frontend/src/styles.css`
- 수정: `docs/openclaw-project-status.md`

## 검증

- 백엔드: `python -m pytest -v`
- 프론트엔드: Vite production build

## 자체 검토

- 작업공간 밖 경로 접근은 차단한다.
- 삭제 API는 구현하지 않는다.
- PowerShell은 자동 실행하지 않고 승인 요청을 명확히 요구한다.
- Mode B/C는 이번 Slice에서 구현하지 않는다.

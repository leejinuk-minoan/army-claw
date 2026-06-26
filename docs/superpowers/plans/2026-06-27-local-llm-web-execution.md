# Local LLM Web Execution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 웹 UI에서 Local LLM 번들 검증과 설치 스크립트를 승인 기반으로 실행할 수 있게 한다.

**Architecture:** 백엔드는 Local LLM 전용 서비스에서 허용된 스크립트만 실행한다. 프론트엔드는 모델명, 번들 경로, 승인 체크박스를 받아 `/api/local-llm/run`으로 요청하고 실행 결과를 표시한다.

**Tech Stack:** FastAPI, Pydantic, PowerShell, React(Vite), TypeScript.

---

### Task 1: 백엔드 Local LLM 실행 서비스

**Files:**
- Create: `backend/openclaw/local_llm_bundle.py`
- Test: `backend/tests/test_local_llm_bundle.py`

- [ ] **Step 1: Write failing tests**

```python
from pathlib import Path

import pytest

from openclaw.local_llm_bundle import LocalLlmBundleRequest, LocalLlmBundleService, LocalLlmBundleError


class Completed:
    returncode = 0
    stdout = "ok"
    stderr = ""


def test_local_llm_requires_approval(tmp_path: Path):
    service = LocalLlmBundleService(scripts_dir=tmp_path)
    result = service.run(LocalLlmBundleRequest(action="verify", approved=False))
    assert result.executed is False
    assert "승인" in result.message


def test_local_llm_verify_builds_allowed_script_command(tmp_path: Path):
    script = tmp_path / "verify-local-llm-bundle.ps1"
    script.write_text("", encoding="utf-8")
    calls = []
    service = LocalLlmBundleService(scripts_dir=tmp_path, runner=lambda args, **kwargs: calls.append(args) or Completed())
    result = service.run(LocalLlmBundleRequest(action="verify", approved=True, skip_generate=True))
    assert result.executed is True
    assert str(script) in calls[0]
    assert "-SkipGenerate" in calls[0]


def test_local_llm_blocks_unknown_action(tmp_path: Path):
    service = LocalLlmBundleService(scripts_dir=tmp_path)
    with pytest.raises(LocalLlmBundleError):
        service.run(LocalLlmBundleRequest(action="other", approved=True))
```

- [ ] **Step 2: Implement the service**

서비스는 `verify`와 `install`만 허용하고, `approved=False`일 때 실제 실행하지 않는다.

- [ ] **Step 3: Run tests**

Run: `.build-venv\Scripts\python.exe -m pytest backend/tests/test_local_llm_bundle.py -q`

### Task 2: FastAPI endpoint

**Files:**
- Modify: `backend/openclaw/main.py`
- Modify: `backend/tests/test_health.py`

- [ ] **Step 1: Add endpoint test**

`/api/local-llm/run`에 `approved=False` 요청을 보내면 `executed=False`를 반환해야 한다.

- [ ] **Step 2: Add endpoint**

`LocalLlmBundleRequest`를 받아 `LocalLlmBundleService().run()` 결과를 반환한다.

- [ ] **Step 3: Run backend tests**

Run: `.build-venv\Scripts\python.exe -m pytest backend/tests -q`

### Task 3: React UI and packaging

**Files:**
- Modify: `frontend/src/types.ts`
- Modify: `frontend/src/api.ts`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/styles.css`
- Modify: `scripts/package-core.ps1`
- Modify: `installer/army-claw-core.iss`

- [ ] **Step 1: Add API client and types**

`LocalLlmRunRequest`, `LocalLlmRunResult`, `runLocalLlmBundle()`를 추가한다.

- [ ] **Step 2: Add UI section**

모델명, 번들 경로, 승인 체크박스, 검증/빠른 검증/설치 버튼, 실행 결과 출력 영역을 추가한다.

- [ ] **Step 3: Include scripts in package**

`release/army-claw-core/scripts`에 Local LLM 스크립트를 복사하고 Inno Setup이 `{app}\scripts`에 설치하도록 한다.

- [ ] **Step 4: Run frontend build and packaging smoke checks**

Run: `node frontend/node_modules/vite/bin/vite.js build`
Run: `scripts\package-core.bat`

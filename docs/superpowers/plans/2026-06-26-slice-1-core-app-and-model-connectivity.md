# Slice 1 코어 앱 및 모델 연결 구현 계획

> **에이전트 작업자 필수 지침:** 이 계획을 구현할 때는 `superpowers:subagent-driven-development` 또는 `superpowers:executing-plans`를 사용한다. 각 단계는 체크박스(`- [ ]`)로 추적한다.

**목표:** FastAPI 백엔드, React(Vite) 프론트엔드, LLM Provider 설정, 모델/API health check를 포함한 첫 실행 가능한 Army Claw 껍데기를 만든다.

**아키텍처:** 백엔드는 Provider 설정, health check, 추후 React 정적 파일 제공을 담당한다. 프론트엔드는 설정과 진단 UI를 제공한다. LLM 접근은 교체 가능한 Provider 인터페이스 뒤에 숨기며, v0.1에서는 `ollama`와 `openai_compatible` 모드를 우선 제공한다.

**기술 스택:** Python 3.11+, FastAPI, Pydantic, httpx, pytest, React, Vite, TypeScript, PyInstaller-ready 구조.

---

## 파일 구조

- `backend/openclaw/__init__.py`: 백엔드 패키지 표시.
- `backend/openclaw/main.py`: FastAPI 앱 생성, API route, 추후 정적 UI mount.
- `backend/openclaw/config.py`: 설정 모델과 JSON 설정 load/save.
- `backend/openclaw/providers/base.py`: Provider 인터페이스와 공통 결과 타입.
- `backend/openclaw/providers/ollama.py`: Ollama health/generation Provider.
- `backend/openclaw/providers/openai_compatible.py`: 단독망 OpenAI 호환 API Provider.
- `backend/openclaw/health.py`: 활성 Provider 선택과 health check orchestration.
- `backend/tests/`: config, provider, health API 테스트.
- `frontend/`: React(Vite) UI와 health check 패널.
- `config/openclaw.config.example.json`: 예시 Provider 설정.
- `scripts/dev-backend.ps1`: 백엔드 개발 실행 스크립트.
- `scripts/dev-frontend.ps1`: 프론트엔드 개발 실행 스크립트.
- `docs/openclaw-project-status.md`: Slice 1 진행 기록.

## Task 1: 백엔드 프로젝트 골격

**파일:**

- 생성: `backend/pyproject.toml`
- 생성: `backend/openclaw/__init__.py`
- 생성: `backend/openclaw/main.py`
- 생성: `backend/tests/test_health.py`

- [ ] **Step 1: 실패하는 백엔드 smoke test 작성**

`backend/tests/test_health.py`를 만든다.

```python
from fastapi.testclient import TestClient

from openclaw.main import create_app


def test_app_status_endpoint_returns_ok():
    client = TestClient(create_app())

    response = client.get("/api/status")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "app": "Army Claw"}
```

- [ ] **Step 2: 백엔드 패키지 설정 추가**

`backend/pyproject.toml`을 만든다.

```toml
[project]
name = "army-claw-backend"
version = "0.1.0"
description = "Army Claw local agent backend"
requires-python = ">=3.11"
dependencies = [
  "fastapi>=0.115.0",
  "httpx>=0.27.0",
  "pydantic>=2.8.0",
  "uvicorn[standard]>=0.30.0"
]

[project.optional-dependencies]
dev = [
  "pytest>=8.2.0",
  "pytest-asyncio>=0.23.0"
]

[tool.pytest.ini_options]
pythonpath = ["."]
testpaths = ["tests"]
```

- [ ] **Step 3: 테스트가 실패하는지 확인**

`backend` 폴더에서 실행한다.

```powershell
python -m pytest tests/test_health.py::test_app_status_endpoint_returns_ok -v
```

예상 결과: `openclaw.main`이 아직 없어서 FAIL.

- [ ] **Step 4: 최소 FastAPI 앱 구현**

`backend/openclaw/__init__.py`를 만든다.

```python
__all__ = ["__version__"]

__version__ = "0.1.0"
```

`backend/openclaw/main.py`를 만든다.

```python
from fastapi import FastAPI


def create_app() -> FastAPI:
    app = FastAPI(title="Army Claw", version="0.1.0")

    @app.get("/api/status")
    def status() -> dict[str, str]:
        return {"status": "ok", "app": "Army Claw"}

    return app


app = create_app()
```

- [ ] **Step 5: 테스트 통과 확인**

```powershell
python -m pytest tests/test_health.py::test_app_status_endpoint_returns_ok -v
```

예상 결과: PASS.

## Task 2: 설정 모델과 저장/불러오기

**파일:**

- 생성: `backend/openclaw/config.py`
- 생성: `backend/tests/test_config.py`
- 생성: `config/openclaw.config.example.json`

- [ ] **Step 1: 실패하는 설정 테스트 작성**

`backend/tests/test_config.py`를 만든다.

```python
from pathlib import Path

from openclaw.config import AppConfig, load_config, save_config


def test_default_config_uses_local_llm_bundle_mode():
    config = AppConfig()

    assert config.provider.mode == "local_llm_bundle"
    assert config.provider.model == "gemma3:12b"
    assert config.provider.ollama_base_url == "http://127.0.0.1:11434"


def test_config_round_trip(tmp_path: Path):
    path = tmp_path / "openclaw.config.json"
    config = AppConfig()
    config.provider.mode = "openai_compatible"
    config.provider.api_base_url = "http://llm.internal.local:8000/v1"
    config.provider.model = "internal-model"

    save_config(path, config)
    loaded = load_config(path)

    assert loaded.provider.mode == "openai_compatible"
    assert loaded.provider.api_base_url == "http://llm.internal.local:8000/v1"
    assert loaded.provider.model == "internal-model"
```

- [ ] **Step 2: 테스트 실패 확인**

```powershell
python -m pytest tests/test_config.py -v
```

예상 결과: `openclaw.config`가 없어서 FAIL.

- [ ] **Step 3: 설정 모델 구현**

`backend/openclaw/config.py`를 만든다.

```python
import json
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field


ProviderMode = Literal["local_llm_bundle", "openai_compatible"]


class ProviderConfig(BaseModel):
    mode: ProviderMode = "local_llm_bundle"
    model: str = "gemma3:12b"
    ollama_base_url: str = "http://127.0.0.1:11434"
    api_base_url: str = ""
    api_key: str = ""
    timeout_seconds: float = Field(default=60.0, gt=0)
    retries: int = Field(default=1, ge=0, le=5)


class AppConfig(BaseModel):
    provider: ProviderConfig = Field(default_factory=ProviderConfig)


def load_config(path: Path) -> AppConfig:
    if not path.exists():
        return AppConfig()
    data = json.loads(path.read_text(encoding="utf-8"))
    return AppConfig.model_validate(data)


def save_config(path: Path, config: AppConfig) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(config.model_dump(), indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
```

- [ ] **Step 4: 예시 설정 파일 추가**

`config/openclaw.config.example.json`을 만든다.

```json
{
  "provider": {
    "mode": "local_llm_bundle",
    "model": "gemma3:12b",
    "ollama_base_url": "http://127.0.0.1:11434",
    "api_base_url": "",
    "api_key": "",
    "timeout_seconds": 60.0,
    "retries": 1
  }
}
```

- [ ] **Step 5: 설정 테스트 통과 확인**

```powershell
python -m pytest tests/test_config.py -v
```

예상 결과: PASS.

## Task 3: Provider 인터페이스와 health 결과 타입

**파일:**

- 생성: `backend/openclaw/providers/base.py`
- 생성: `backend/openclaw/providers/__init__.py`
- 수정: `backend/tests/test_health.py`

- [ ] **Step 1: 실패하는 Provider 결과 테스트 추가**

`backend/tests/test_health.py`에 추가한다.

```python
from openclaw.providers.base import HealthCheckResult


def test_health_check_result_defaults_to_unavailable():
    result = HealthCheckResult(provider="test")

    assert result.provider == "test"
    assert result.available is False
    assert result.latency_ms is None
    assert result.tokens_per_second is None
    assert result.message == ""
```

- [ ] **Step 2: 테스트 실패 확인**

```powershell
python -m pytest tests/test_health.py::test_health_check_result_defaults_to_unavailable -v
```

예상 결과: `openclaw.providers.base`가 없어서 FAIL.

- [ ] **Step 3: Provider 공통 타입 구현**

`backend/openclaw/providers/__init__.py`를 만든다.

```python
from openclaw.providers.base import HealthCheckResult, LLMProvider

__all__ = ["HealthCheckResult", "LLMProvider"]
```

`backend/openclaw/providers/base.py`를 만든다.

```python
from abc import ABC, abstractmethod

from pydantic import BaseModel


class HealthCheckResult(BaseModel):
    provider: str
    available: bool = False
    model: str = ""
    message: str = ""
    latency_ms: float | None = None
    tokens_per_second: float | None = None


class LLMProvider(ABC):
    @abstractmethod
    async def health_check(self) -> HealthCheckResult:
        raise NotImplementedError

    @abstractmethod
    async def generate(self, prompt: str) -> str:
        raise NotImplementedError
```

- [ ] **Step 4: Provider 결과 테스트 통과 확인**

```powershell
python -m pytest tests/test_health.py::test_health_check_result_defaults_to_unavailable -v
```

예상 결과: PASS.

## Task 4: Provider 구현

**파일:**

- 생성: `backend/openclaw/providers/ollama.py`
- 생성: `backend/openclaw/providers/openai_compatible.py`
- 생성: `backend/tests/test_ollama_provider.py`
- 생성: `backend/tests/test_openai_compatible_provider.py`

- [ ] **Step 1: mock 기반 Provider 테스트 작성**

`backend/tests/test_ollama_provider.py`와 `backend/tests/test_openai_compatible_provider.py`를 작성한다. 두 테스트는 실제 네트워크를 사용하지 않고 `httpx.MockTransport`를 사용한다.

- [ ] **Step 2: Provider 테스트 실패 확인**

```powershell
python -m pytest tests/test_ollama_provider.py tests/test_openai_compatible_provider.py -v
```

예상 결과: Provider 구현 파일이 없어서 FAIL.

- [ ] **Step 3: OllamaProvider 구현**

구현 요구사항:

- `/api/tags`로 모델 존재 확인.
- `/api/generate`로 짧은 생성 테스트.
- `eval_count`와 `eval_duration`이 있으면 tokens/sec 계산.
- 오류 시 예외를 바깥으로 던지지 않고 `HealthCheckResult(available=False)` 반환.

- [ ] **Step 4: OpenAICompatibleProvider 구현**

구현 요구사항:

- `${api_base_url}/chat/completions` 호출.
- API key가 있으면 `Authorization: Bearer ...` 헤더 사용.
- choices[0].message.content를 결과로 사용.
- 오류 시 `HealthCheckResult(available=False)` 반환.

- [ ] **Step 5: Provider 테스트 통과 확인**

```powershell
python -m pytest tests/test_ollama_provider.py tests/test_openai_compatible_provider.py -v
```

예상 결과: PASS.

## Task 5: Health orchestration API

**파일:**

- 생성: `backend/openclaw/health.py`
- 수정: `backend/openclaw/main.py`
- 수정: `backend/tests/test_health.py`

- [ ] **Step 1: 실패하는 health endpoint 테스트 추가**

`backend/tests/test_health.py`에 추가한다.

```python
def test_health_endpoint_returns_provider_result():
    client = TestClient(create_app())

    response = client.get("/api/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["provider"] == "ollama"
    assert payload["model"] == "gemma3:12b"
    assert "available" in payload
```

- [ ] **Step 2: endpoint 테스트 실패 확인**

```powershell
python -m pytest tests/test_health.py::test_health_endpoint_returns_provider_result -v
```

예상 결과: `/api/health`가 없어서 FAIL.

- [ ] **Step 3: health orchestration 구현**

`backend/openclaw/health.py`를 만든다.

구현 요구사항:

- 설정이 `openai_compatible`이면 `OpenAICompatibleProvider` 사용.
- 그 외에는 `OllamaProvider` 사용.
- 결과는 `HealthCheckResult`로 반환.

`backend/openclaw/main.py`에 `/api/health` route를 추가한다.

- [ ] **Step 4: 백엔드 테스트 실행**

```powershell
python -m pytest -v
```

예상 결과: PASS.

## Task 6: React(Vite) 골격과 진단 UI

**파일:**

- 생성: `frontend/package.json`
- 생성: `frontend/index.html`
- 생성: `frontend/src/main.tsx`
- 생성: `frontend/src/App.tsx`
- 생성: `frontend/src/api.ts`
- 생성: `frontend/src/types.ts`

- [ ] **Step 1: 프론트엔드 패키지 생성**

`frontend/package.json`을 만들고 `dev`, `build` script를 제공한다.

- [ ] **Step 2: React health UI 생성**

UI 요구사항:

- 제목: Army Claw.
- 섹션: 모델 연결.
- 버튼: health check 실행.
- `/api/health` 호출.
- provider, model, available, latency, tokens/sec 표시.
- 오류 발생 시 alert 표시.

- [ ] **Step 3: 프론트엔드 빌드 확인**

```powershell
npm run build
```

예상 결과: Node 의존성이 준비되어 있으면 PASS.

## Task 7: 개발 스크립트와 진행 문서 업데이트

**파일:**

- 생성: `scripts/dev-backend.ps1`
- 생성: `scripts/dev-frontend.ps1`
- 수정: `docs/openclaw-project-status.md`

- [ ] **Step 1: 백엔드 개발 실행 스크립트 생성**

`scripts/dev-backend.ps1`:

```powershell
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location (Join-Path $root "backend")
python -m uvicorn openclaw.main:app --host 127.0.0.1 --port 8765 --reload
```

- [ ] **Step 2: 프론트엔드 개발 실행 스크립트 생성**

`scripts/dev-frontend.ps1`:

```powershell
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location (Join-Path $root "frontend")
npm run dev -- --host 127.0.0.1 --port 5173
```

- [ ] **Step 3: 진행 문서 업데이트**

`docs/openclaw-project-status.md`의 구현 진행 상황에 Slice 1 구현 시작/완료 상태를 기록한다.

- [ ] **Step 4: 최종 Slice 1 확인**

백엔드:

```powershell
cd backend
python -m pytest -v
```

예상 결과: PASS.

프론트엔드:

```powershell
cd frontend
npm run build
```

예상 결과: Node 의존성이 준비되어 있으면 PASS.

## 자체 검토

- 이 계획은 Slice 1만 다룬다.
- 포함 범위: 백엔드 스캐폴드, 프론트엔드 스캐폴드, LLM Provider 추상화, Ollama health check, OpenAI 호환 API 모드, 간단 latency/tokens/sec 진단.
- 제외 범위: 안전한 코딩 도구, 한셀/XLSX, 한쇼/PPTX/.show, HWPX, 패키징.
- Provider mode 값은 `local_llm_bundle`, `openai_compatible`로 통일한다.
- health 결과 필드는 백엔드와 프론트엔드에서 동일하게 사용한다.

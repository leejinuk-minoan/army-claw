# 오프라인 빌드 venv 전략

## 목적

Army Claw Core 정식 v0.1 빌드는 PyInstaller와 앱 실행 의존성을 같은 Python 가상환경에 모아 수행한다. 이렇게 하면 서로 다른 Python 환경을 섞어 발생하는 PyInstaller 경고를 제거하고, 단독망에서도 반복 가능한 설치 파일 빌드를 만들 수 있다.

## 구성 요소

- `requirements/build.txt`: Core 빌드와 테스트에 필요한 Python 패키지 목록.
- `scripts/export-python-wheels.ps1`: 인터넷망 또는 승인된 준비망에서 wheelhouse를 생성하는 스크립트.
- `vendor/python-wheels/`: 단독망으로 반입할 Python wheel 파일 위치. 이 폴더는 용량이 커질 수 있으므로 GitHub에는 올리지 않는다.
- `scripts/bootstrap-build-env.ps1`: 단독망에서 `vendor/python-wheels/`만 사용해 `.build-venv`를 만드는 스크립트.
- `.build-venv`: 정식 Core 빌드에 사용할 로컬 빌드 가상환경. GitHub에는 올리지 않는다.
- `scripts/package-core.ps1`: `.build-venv`가 있으면 그 Python을 우선 사용해 Core 설치 파일을 빌드한다.

## 준비망 절차

1. 인터넷망 또는 승인된 준비망에서 저장소를 준비한다.
2. Python이 설치된 상태에서 다음 명령을 실행한다.

```powershell
.\scripts\export-python-wheels.bat
```

3. 생성된 `vendor/python-wheels/` 폴더를 보안 검수 후 단독망으로 반입한다.

## 단독망 절차

1. `vendor/python-wheels/`가 프로젝트 루트에 있는지 확인한다.
2. 다음 명령으로 빌드 venv를 만든다.

```powershell
.\scripts\bootstrap-build-env.bat
```

3. 다음 명령으로 Core 설치 파일을 만든다.

```powershell
.\scripts\package-core.bat
```

4. 생성물은 `release/ArmyClawCoreSetup-0.1.0.exe`에 만들어진다.

## 현재 제한

- 실제 wheelhouse 파일은 아직 생성하지 않았다.
- 현재 개발 PC에서는 임시 fallback으로 Codex 런타임의 site-packages를 PyInstaller 분석 경로에 추가할 수 있다.
- 정식 v0.1 빌드 전에는 `.build-venv` 기반 빌드로 전환해 PyInstaller 경고를 제거해야 한다.

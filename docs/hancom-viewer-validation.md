# 한컴오피스/한글뷰어 환경 검증 범위

## 현재 상태

2026-06-28 기준 현재 로컬 PC에는 한컴오피스 2024가 설치되어 있다. Army Claw의 한컴 감지 결과는 `native_available`이며, 한글/한셀/한쇼 실행 파일이 모두 확인됐다.

확인된 실행 파일:

- 한글: `C:\Program Files (x86)\HNC\Office 2024\HOffice130\Bin\Hwp.exe`
- 한셀: `C:\Program Files (x86)\HNC\Office 2024\HOffice130\Bin\HCell.exe`
- 한쇼: `C:\Program Files (x86)\HNC\Office 2024\HOffice130\Bin\HShow.exe`

## 결론

한컴오피스가 설치된 현재 환경에서는 Army Claw가 만든 HWPX/XLSX/PPTX 파일을 실제 한컴 앱으로 여는 네이티브 검증까지 진행할 수 있다. 한글뷰어만 있는 환경에서도 Army Claw의 많은 검사는 가능하지만, 한컴오피스 앱이 직접 문서를 열고 편집하고 다시 저장하는 네이티브 호환성 검사는 제한된다.

## 가능한 검사

- FastAPI 백엔드 테스트.
- React/Vite 웹 UI 빌드.
- PyInstaller 실행 파일 빌드.
- Inno Setup 설치 파일 빌드.
- 설치 파일 실행과 설치 경로 smoke test.
- `/api/status`, `/api/health`, Local LLM 진단 API 같은 서버 API 검사.
- HWPX 파일의 ZIP/XML 구조 생성, 요약, 문단 추가 검사.
- XLSX 파일의 직접 생성/읽기/수정/함수/차트/피벗형 요약 검사.
- PPTX 파일의 직접 생성/요약/슬라이드 추가 검사.
- 한글뷰어에서 HWPX 파일이 열리는지에 대한 수동 육안 확인.

## 제한되는 검사

- 한컴 한글에서 HWPX를 열고 편집한 뒤 다시 저장하는 자동화 검사.
- 한컴 한글 렌더링 결과의 자동 비교.
- 한셀에서 XLSX 차트, 피벗, 함수 재계산 결과를 네이티브로 확인하는 검사.
- 한쇼에서 PPTX 디자인, 레이아웃, `.show` 변환/저장 호환성을 확인하는 검사.
- 한컴오피스 자동화 API 또는 GUI 조작 기반 검사.

## v0.1 검증 전략

v0.1에서는 파일 포맷을 직접 다루는 라이브러리 기반 검사를 기본으로 한다. 한컴오피스가 없는 현재 환경에서는 자동 테스트와 패키징 검증을 최대한 수행하고, 한컴오피스 네이티브 호환성은 별도 검증 PC에서 수행한다.

## 별도 검증 PC에서 필요한 항목

- 한글: Army Claw가 만든 HWPX 열기, 저장, 다시 요약.
- 한셀: Army Claw가 만든 XLSX 열기, 함수/차트/피벗형 결과 확인, 저장.
- 한쇼: Army Claw가 만든 PPTX 열기, 디자인/레이아웃 확인, `.show` 저장 가능 여부 확인.
- 설치본: 한컴오피스 설치 환경에서 Army Claw Core 설치 후 웹 UI 기본 기능 확인.

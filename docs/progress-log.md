# Army Claw 진행 로그

## 2026-06-26 - Slice 5 한글/HWPX 도구

### 구현 내용

- HWPX 기본 도구를 추가했다.
- HWPX는 v0.1에서 ZIP/XML 문서로 직접 처리한다.
- `backend/openclaw/hwpx_tools.py`를 추가했다.
- `/api/hwpx/create` 엔드포인트를 추가했다.
- `/api/hwpx/summary` 엔드포인트를 추가했다.
- `/api/hwpx/add-paragraph` 엔드포인트를 추가했다.
- `/api/hwpx/compatibility` 엔드포인트를 추가했다.
- React 웹 UI에 한글/HWPX 도구 패널을 추가했다.
- Slice 5 계획 문서 `docs/superpowers/plans/2026-06-26-slice-5-hangul-hwpx-tools.md`를 추가했다.

### 검증

- 백엔드 전체 테스트: 31개 통과.
- React/Vite production build: 통과.

### 제한 사항

- 이번 HWPX 지원은 최소 ZIP/XML 처리다.
- 한컴 한글 앱에서의 완전한 서식 호환성은 별도 검증이 필요하다.
- 표, 이미지, 복잡한 스타일, legacy `.hwp` 변환, 한컴 한글 네이티브 자동화는 후속 고도화 대상으로 남긴다.

### 다음 단계

- Slice 6 패키징 설계와 구현으로 이동한다.
- Windows용 Army Claw Core 설치 파일과 별도 Local LLM 번들 패키징 전략을 실제 빌드 스크립트로 옮긴다.

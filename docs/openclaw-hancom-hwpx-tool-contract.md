# OpenClaw 한컴 HWPX 도구 계약

## 목적

Army Claw의 한컴 HWPX 기능은 UI와 분리된 Headless Worker로 유지한다. OpenClaw Gateway 또는 Tool Plugin은 JSON 입력을 Worker에 전달하고 JSON 결과를 받아 실행 로그와 사용자 승인 흐름에 기록한다.

## 도구 목록

### hancom.hwpx.analyze_template

- 승인 필요: 아니오
- 입력: `{ "workspace": "작업공간", "path": "templates/report.hwpx" }`
- 출력: ZIP 엔트리, section XML 목록, 문단, 플레이스홀더, 이미지, 스타일 ID, 입력 후보, 검증 오류
- Worker 명령: `hwpx-analyze-template --workspace ... --path ... --json`

### hancom.hwpx.generate_from_template

- 승인 필요: 예
- 입력: `{ "workspace": "...", "template_path": "...", "output_path": "...", "field_mapping": {} }`
- 출력: 저장 여부, 출력 경로, 원본 보존 여부, 미디어 보존 여부, 검증 결과
- Worker 명령: `hwpx-template-fill --workspace ... --template-path ... --output-path ... --field-mapping-file ... --json`

### hancom.hwpx.generate_auto_document

- 승인 필요: 예
- 입력: `{ "workspace": "...", "output_path": "...", "document_plan": {} }`
- 출력: 저장 여부, 출력 경로, 문서 유형, 디자인 프로필, 검증 결과
- Worker 명령: `hwpx-auto-generate --workspace ... --output-path ... --document-plan-file ... --json`

### hancom.hwpx.validate

- 승인 필요: 아니오
- 입력: `{ "workspace": "...", "path": "..." }`
- 출력: 유효 여부, 오류, 경고, 필수 엔트리, section 목록, 총 해제 크기
- Worker 명령: `hwpx-validate --workspace ... --path ... --json`

### hancom.hwpx.compare

- 승인 필요: 아니오
- 현재 상태: 계약만 정의됨. 다음 구현에서 원본/출력의 미디어 해시, 엔트리 목록, 수정 대상 외 텍스트 보존 여부를 별도 결과로 제공한다.

## 오류 코드

- `invalid_or_unreadable_zip`: ZIP으로 읽을 수 없음
- `unsafe_zip_path:*`: ZIP path traversal 가능 경로
- `executable_entry:*`: 실행 파일 또는 스크립트 엔트리 포함
- `too_many_entries`: 엔트리 수 제한 초과
- `uncompressed_size_limit_exceeded`: 해제 크기 제한 초과
- `missing_required_entry:*`: 필수 HWPX 엔트리 누락
- `missing_section_xml`: section XML 누락
- `invalid_section_xml:*`: section XML 구조 오류

## 진행 이벤트

1. 요청 분석
2. 양식 분석 또는 DocumentPlan 검증
3. 사용자 승인 대기
4. HWPX 생성
5. 구조 검증
6. 출력 경로 기록
7. 한글 2024 수동 확인 대기
8. 완료

## OpenClaw 연결 위치

OpenClaw migration이 완료되면 `hancom.hwpx.*` 도구를 Tool Plugin 또는 Gateway Tool로 등록한다. 현재 단계에서는 Node Worker CLI를 안정 API로 보고, 기존 Army Claw backend adapter가 이 Worker를 호출하도록 연결한다.

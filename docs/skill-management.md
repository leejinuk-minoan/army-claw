# Army Claw Skill 관리 설계

## 목적

Skill 관리는 외부에서 만들어 온 업무 지식과 절차를 Army Claw에 반입해 작업 계획과 프롬프트에 활용하기 위한 기능이다.

이 기능은 모델 가중치를 바꾸는 fine-tuning이 아니다. v0.1 MVP에서는 skill을 로컬 저장소에 등록하고, 활성/비활성 상태를 관리하며, 이후 작업 계획 단계에서 참조할 수 있는 정적 지식 패키지로 취급한다.

## v0.1 MVP 범위

- UI에서 `.zip` skill 파일 업로드.
- 업로드된 skill 목록 표시.
- skill 활성/비활성 전환.
- skill 삭제.
- SHA256 해시, 등록일, 활성 상태, 원본 파일명 기록.
- 패키지 내부의 `SKILL.md` 존재 여부 검증.

## 패키지 형식

기본 형식은 `.zip` 파일이다.

필수 파일:

- `SKILL.md`

허용 구조 예시:

```text
report-skill.zip
  report-skill/
    SKILL.md
    templates/
      example.md
```

`SKILL.md`의 첫 번째 `# 제목`은 UI 표시 이름으로 사용한다. 본문 첫 번째 일반 문장은 설명으로 사용한다.

## 저장 위치

기본 저장 위치:

```text
%LOCALAPPDATA%\ArmyClaw\skills
```

테스트와 개발 환경에서는 다음 환경 변수로 저장 위치를 바꿀 수 있다.

```text
ARMY_CLAW_SKILL_STORE
```

각 skill 폴더에는 원본 파일 해시와 상태를 담은 `army-claw-skill.json` 메타데이터가 저장된다.

## API

- `GET /api/skills`: 등록된 skill 목록 조회.
- `POST /api/skills/import?filename=...`: zip 파일 본문을 받아 skill 등록.
- `POST /api/skills/{skill_id}/enabled`: 활성 상태 변경.
- `DELETE /api/skills/{skill_id}`: skill 삭제.

## 보안 원칙

- v0.1에서는 skill 파일을 실행하지 않는다.
- skill은 지식, 절차, 템플릿으로만 취급한다.
- zip 내부에 상위 경로 이동(`..`) 또는 절대 경로가 있으면 거부한다.
- 외부 URL, 인증 정보, 실행 파일 검사는 v0.2 보안 검증 단계에서 강화한다.

## 다음 단계

- 업로드된 skill을 작업 계획 수립 단계에서 검색한다.
- 활성 skill만 LLM 프롬프트 또는 작업 컨텍스트에 주입한다.
- 작업 결과 로그에 사용된 skill 목록을 기록한다.

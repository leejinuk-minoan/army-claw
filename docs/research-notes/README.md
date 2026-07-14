# Army Claw Research Notes

이 폴더는 Army Claw 연구·개발 과정을 논문화하기 위해 Task별 연구 메모를 보관하는 공간이다.

## 목적

- 개발 보고서를 논문 작성에 바로 활용할 수 있는 연구 메모로 재정리한다.
- 한 파일에 모든 메모를 누적하지 않고, Task별 독립 파일로 관리한다.
- 별도 index 파일에는 Research Note 번호, Task 번호, 파일 위치, 연구 축만 기록한다.
- 개발 기록과 논문 활용 기록을 분리해 추적성과 재사용성을 높인다.

## 기본 구조

```text
docs/research-notes/
├─ README.md
├─ research-note-index.md
├─ research-note-index.json
└─ task-notes/
   ├─ RN-018-task018-multi-app-capability-architecture.md
   ├─ RN-019-task019-app-target-routing.md
   └─ RN-020-task020-app-target-plan-schema.md
```

## 문서 역할

```text
Task report
→ 개발·검증·테스트·제한사항을 기록하는 공식 작업 보고서

Research Note
→ 논문 활용을 위해 연구 질문, 설계 명제, 방법론, 결과, 한계를 재정리한 문서

Research Note Index
→ Research Note 번호와 파일 위치를 추적하는 짧은 색인
```

## Research Note 작성 규칙

각 Task별 Research Note는 다음 섹션을 포함해야 한다.

```text
1. Research Question
2. System Design Claim
3. Method
4. Evidence
5. Result
6. Paper-Ready Sentences
7. Limitations
8. Link to Development Records
```

## 인덱스 규칙

- `research-note-index.md`는 사람이 읽는 표 형식 색인이다.
- `research-note-index.json`은 자동 수집 또는 논문 초안 생성에 사용할 수 있는 기계 판독형 색인이다.
- 인덱스 파일에는 긴 연구 내용을 넣지 않는다.
- 상세 연구 내용은 반드시 `task-notes/RN-<번호>-...md` 파일에 분리한다.

## 번호 규칙

Research Note 번호는 원칙적으로 Task 번호와 맞춘다.

```text
Task 018 → RN-018
Task 019 → RN-019
Task 020 → RN-020
```

Pre-Task 또는 별도 기준 작업은 다음처럼 표기할 수 있다.

```text
Pre-Task 021-A → RN-PRE-021A
```

## 금지사항

- 민감한 사용자 문서 원문을 Research Note에 복사하지 않는다.
- API key, 로컬 경로의 민감 정보, 비공개 문서 원본을 기록하지 않는다.
- 실제로 검증하지 않은 결과를 논문 활용 문장으로 단정하지 않는다.
- Research Note를 Task report의 대체물로 사용하지 않는다.

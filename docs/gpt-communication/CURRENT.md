# 현재 Codex 필수 확인 문서

현재 작업 브랜치:

```text
feature/hwpx-template-fidelity-semantic-blocks
```

다음 작업을 시작하기 전에 반드시 읽을 문서:

```text
docs/gpt-communication/opinions/2026-07-02-hwpx-v3-visual-review-and-reflow.md
```

관련 구현 보고서:

```text
docs/gpt-communication/reports/2026-07-02-hwpx-template-fidelity-semantic-blocks.md
```

현재 상태:

- HWPX Template Fidelity v3는 `anchor_range` scope와 `paragraph_block` selector를 구현했다.
- 표지와 비대상 페이지 보존은 한글 2024 시각 확인에서 성공했다.
- `주 11-2`의 긴 본문은 기존 line layout이 재계산되지 않아 겹쳐 읽기 어렵다.
- `보조 11-2`는 구조 컨테이너와 내부 leaf 문단의 중복 선택 흔적으로 내용이 겹친다.
- `<hp:fwSpace/>` inline marker가 일반 텍스트로 노출된다.
- 다음 작업은 문구 단축이 아니라 `allow_line_growth`, native layout normalize, inline element 직렬화 수정, structural container와 leaf paragraph 분리이다.
- LLM, Ollama, UI, 백엔드와 설치 파일은 계속 변경하지 않는다.

v3 시각 판정:

```text
v3_cover_visual_status: user_confirmed_success
v3_non_target_main_board_status: preserved_as_designed
v3_semantic_replacement_status: applied
v3_line_reflow_status: failed_visual_review
v3_detail_page_container_selection_status: failed_visual_review
v3_inline_element_serialization_status: failed_visual_review
v3_overall_visual_status: requires_engine_fix
```

주요 산출물:

```text
release/test-documents/army-claw-qualification-semantic-block-plan.json
release/test-documents/army-claw-qualification-semantic-block-dry-run.json
release/test-documents/army-claw-qualification-review-template-fidelity-v3.hwpx
release/test-documents/army-claw-qualification-template-fidelity-v3-diff.json
```

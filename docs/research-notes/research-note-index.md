# Army Claw Research Note Index

이 파일은 Research Note의 번호와 위치만 관리한다. 상세 내용은 각 Task별 note 파일에 기록한다.

| Index ID | Task | Note File | Research Axis | Status |
|---|---:|---|---|---|
| RN-018 | Task 018 | `task-notes/RN-018-task018-multi-app-capability-architecture.md` | Multi-app capability architecture | verified |
| RN-019 | Task 019 | `task-notes/RN-019-task019-app-target-routing.md` | App target routing contract | verified |
| RN-020 | Task 020 | `task-notes/RN-020-task020-app-target-plan-schema.md` | App target plan schema and adapter slot input contract | verified |
| RN-021 | Task 021 | `task-notes/RN-021-task021-solo-ai-worker-governance.md` | Solo AI worker governance and handoff rules | verified |
| RN-022 | Task 022 | `task-notes/RN-022-task022-ai-worker-handoff-contract.md` | AI worker handoff contract and receiver validation | verified |
| RN-023 | Task 023 | `task-notes/RN-023-task023-common-office-adapter-interface-contract.md` | Common office adapter interface and evidence envelope | verified |
| RN-024 | Task 024 | `task-notes/RN-024-task024-adapter-interface-validator-contract.md` | Adapter interface validator contract and validation matrix | verified |
| RN-025A | Task 025-A | `task-notes/RN-025A-task025a-adapter-interface-validator-cloud-implementation.md` | Cloud-first validator implementation package and local verification handoff | draft |
| RN-025B | Task 025-B | `task-notes/RN-025B-task025b-adapter-interface-validator-local-verification.md` | Local validator execution evidence and cloud-first local-verify result | verified |
| RN-026 | Task 026 | `task-notes/RN-026-task026-adapter-validator-integration-contract.md` | Adapter validator integration gate, evidence, and completion contract | verified |
| RN-027 | Task 027 | `task-notes/RN-027-task027-local-workspace-adapter-contract.md` | Local workspace adapter contract and safe file-workspace execution boundary | verified |
| RN-028 | Task 028 | `task-notes/RN-028-task028-local-workspace-adapter-proof-mode-skeleton.md` | Local workspace proof-mode adapter skeleton and local verification gate | verified |
| RN-029 | Task 029 | `task-notes/RN-029-task029-local-workspace-adapter-controlled-dry-run-boundary.md` | Local workspace controlled dry-run boundary and deterministic receipts | verified |
| RN-030 | Task 030 | `task-notes/RN-030-task030-local-workspace-read-only-manifest-boundary.md` | Local workspace read-only manifest boundary and metadata-only descriptors | draft_pending_local_verification |

## Index Maintenance Rule

- 새 Task가 완료되면 해당 Task의 Research Note를 `task-notes/`에 추가한다.
- 이 파일에는 번호, Task, 파일 위치, 연구 축, 상태만 추가한다.
- 긴 연구 설명, 검증 상세, 논문 문장은 각 Research Note 파일에 기록한다.
- `research-note-index.json`도 같은 항목을 유지해야 한다.

# Army Claw Master Plan Collaboration Addendum

## Purpose

This addendum records the planned collaboration model before human collaborators begin feature development.

Army Claw remains the official system name. Army Claw is not an HWPX-only document generator. HWP/HWPX, HanCell, HanShow, and local workspace operations are first-class targets.

## Human Collaboration Plan

Planned human collaboration roles:

- Project owner: HWP/HWPX engine, local LLM / Model Gateway direction, master integration, master review
- Person A: Park Gyumin / 박규민 — HanShow engine
- Person B: Kim Youngsu / 김영수 — HanCell engine

Person A and Person B must work in their own feature branches. Local folder outputs must not be manually copied into the final build. Final integration must happen through GitHub branches, reviewed commits, and contract tests.

## Branch Ownership

Each collaborator and each collaborator-operated AI may only modify the branch explicitly assigned to that collaborator or task.

Forbidden without explicit approval:

- modifying another collaborator's feature branch
- modifying task branches not assigned to the collaborator
- pushing directly to main
- force push
- history rewrite
- unauthorized merge into integration branches

Recommended initial branches:

- feature/hanshow-engine-person-a — Person A / 박규민
- feature/hancell-engine-person-b — Person B / 김영수

## Contract Discipline

All collaborators must follow the Army Claw contracts already fixed by prior tasks:

- multi-app capability architecture
- app target routing contract
- app target plan schema
- adapter slot input contract
- validation error taxonomy
- evidence and report expectations

HanShow and HanCell engines must not define incompatible private input/output shapes. If the shared contract must change, the change must be proposed through a separate contract task before implementation branches rely on it.

## Master Agent Oversight

The master agent may inspect official task, feature, and integration branches to verify:

- branch ownership compliance
- contract compliance
- report and evidence consistency
- forbidden operation violations
- integration risk
- roadmap alignment

Master agent review does not imply automatic modification authority. Corrections must be made through user-approved tasks or collaborator-owned branches.

## Human Collaborator AI Rule

If a human collaborator uses an AI assistant, that AI must follow the same branch ownership and contract discipline rules as the collaborator.

The AI must not modify branches outside the collaborator's assigned branch and must not alter shared contracts unless the task explicitly authorizes that work.

## Timing

Human collaboration may begin with environment setup, repository access, and research before full adapter implementation.

Actual HanShow and HanCell engine implementation should begin after the common Office Adapter interface contract is fixed.

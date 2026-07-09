# Paper Initial Design Preparation

## Summary

The initial research design for the Army Claw paper has been recorded before continuing Task 021.

This is a research planning artifact. It is not a production implementation task.

## Branch

- Branch: `agent/pre-task021-collaboration-prep`
- Previous collaboration prep head: `04111316d1801982c0d6c3f74b7107820a88a855`
- Paper design commit SHA: `8170e7ee3cc20ae323dbffbd19682216c7353fdc`

## Paper Title

Korean:

> 구조화 계획과 결정론적 어댑터를 활용한 폐쇄망 멀티 오피스 문서 생성 에이전트 설계 및 검증

English:

> Design and Validation of a Closed-Network Multi-Office Document Generation Agent Using Structured Plans and Deterministic Adapters

## Added Document

- `docs/research/papers/2026-07-09-structured-plan-deterministic-adapter-paper-design.md`

## Core Claim

In closed-network or offline environments, a document-generation agent can improve safety, reproducibility, template preservation, and error control by limiting the LLM to structured plan generation and delegating actual document manipulation to validated deterministic app-specific adapters.

## Validation Axes

The research design fixes five validation axes:

1. Functional success
2. Safety
3. Reproducibility
4. Template preservation
5. Closed-network compliance

## Baselines

The paper will compare Army Claw against:

1. Manual editing baseline
2. Direct LLM generation baseline
3. Naive script baseline
4. Army Claw proposed architecture

## Main Experiments

1. Structured plan generation
2. Dangerous plan rejection
3. Deterministic adapter reproducibility
4. Template preservation
5. Closed-network operation
6. Multi-app workflow

## Required Evidence for Future Tasks

Future implementation tasks should preserve:

- input user request
- generated structured plan
- schema validation result
- policy validation result
- target routing result
- adapter slot input
- execution log
- artifact validation report
- template preservation report
- source template overwrite check
- offline dependency check
- public internet access check
- repeated-run reproducibility report
- manual correction time log when available

## Forbidden Items Check

- Production code changed: false
- HanShow adapter implemented: false
- HanCell adapter implemented: false
- Model Gateway implemented: false
- LLM planner connected: false
- HTTP/UI implemented: false
- Final HWPX core selected: false
- Stage 2 transition declared: false

## Next Step

Task 021 should incorporate this paper design as a research evidence discipline reference when defining operating rules and collaboration governance.

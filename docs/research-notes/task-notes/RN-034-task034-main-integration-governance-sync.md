# RN-034 — Main Integration and Governance Baseline Sync

## Research question

How should a long-running multi-agent development chain be integrated into the default branch without losing evidence traceability or requiring repeated manual approval for every verified merge?

## Finding

A PR-based master review gate provides a clearer control point than a blanket prohibition on `main` merges.

The safe integration rule is:

1. workers never push directly to `main`;
2. Task branches retain reports, evidence, and exact commit ancestry;
3. the master agent compares the candidate branch against `main`;
4. required validation and completion gates must pass;
5. conflict, forbidden-path, evidence, and overclaim checks must be clear;
6. the master agent may then merge through a PR.

## Task 034 evidence

- Task 033 branch was 515 commits ahead and 0 behind `main` before integration.
- PR #1 was mergeable and merged successfully.
- merge SHA: `a136cb2629a7fac660255da1318119ada4e56a1d`
- post-merge file difference between the Task 033 branch and `main`: zero
- open PRs after integration: zero

## Limits retained

This policy change does not authorize direct pushes, force pushes, history rewrites, Stage 2 transition, final HWPX core selection, source overwrite, or unsupported execution claims.

## Status

`final_verified`

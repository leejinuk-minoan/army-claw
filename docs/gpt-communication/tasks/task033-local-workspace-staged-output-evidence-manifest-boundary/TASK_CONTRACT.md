# Task 033 — Local Workspace Staged Output Evidence Manifest Boundary

## Task identity

```text
repository: leejinuk-minoan/army-claw
base_sha: d19e7830b2112bacf60cc5c5b2a2c3e2b177d307
branch: agent/task033-local-workspace-staged-output-evidence-manifest-boundary
overall_routing: cloud_first_local_verify
cloud_phase: cloud_delegable
adapter_validator_gate_required: true
```

## Objective

Define a deterministic evidence manifest for Task 031 staged-output artifact descriptors, receipts, exact generated-content byte digests, controlled sandbox-write evidence, and reference validation. The manifest is not a real user-workspace inventory or proof of native document generation.

## Allowed changes

- Task 033 architecture, contract, samples, delegation package, evidence README, report, Research Note, Research Note indexes, and state files.
- Minimal adapter/test/validator registration changes only when needed by an approved implementation phase.

## Forbidden

- real user path access or content read;
- production/user workspace write or promotion;
- native application or Hancom COM execution;
- real HWP/HWPX/HanCell/HanShow generation;
- public internet access or dependency installation;
- CI/GitHub Actions or release/test-documents changes;
- main modification/merge, force push, history rewrite;
- Stage 2 declaration or final HWPX core selection;
- Task 033 final completion before local evidence and master review.

## Cloud package completion gate

The package must define deterministic canonical JSON, timestamp exclusion, SHA-256 over exact bytes, safe relative paths, duplicate/case-collision prevention, artifact/receipt/reference integrity, count reconciliation, positive and negative samples, local verification instructions, result template, evidence directory, report, Research Note, and state `cloud_package_complete_pending_local_verification`.

Cloud package completion does not imply validator or unittest passage. Local verification remains required.
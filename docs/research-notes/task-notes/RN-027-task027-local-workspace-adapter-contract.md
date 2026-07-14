# RN-027 — Task 027 Local Workspace Adapter Contract Proof

## 1. Research question

How should Army Claw define a safe `local_workspace` adapter before implementing any real file-system automation?

## 2. System design claim

The `local_workspace` target can be treated as a first-class Army Claw adapter target under the Common Office Adapter Interface without requiring Hancom COM.

The contract must still preserve the same core principles as HWP/HWPX, HanCell, and HanShow targets:

- LLM generates only a structured plan;
- adapter validates and executes deterministically;
- source artifacts must not be overwritten;
- public internet dependency is prohibited;
- direct LLM file edits are prohibited;
- evidence must distinguish proof, dry-run, and real execution.

## 3. Method

Task 027 created a target-specific architecture contract and machine-readable JSON contract for `local_workspace`.

The task intentionally did not modify:

- common adapter interface contract;
- adapter validator source;
- adapter validation matrix;
- proof-mode samples;
- negative samples;
- production adapter code.

It also did not invoke an adapter or mutate the local file system.

## 4. Adapter validator gate decision

Task 027 records:

```text
adapter_validator_gate_required=false
adapter_validator_gate_status=not_required
```

Reason:

The task creates a target-specific contract supplement only. It does not change common interface behavior, validator source, validation matrix, executable samples, or adapter implementation code.

Future tasks that implement or execute the `local_workspace` adapter must set the adapter validator gate to required.

## 5. Result

The resulting contract defines:

- target identity: `local_workspace`;
- adapter slot: `local_workspace_adapter_slot`;
- plan type: `local_workspace_action_plan`;
- approved workspace root requirement;
- relative path safety policy;
- no source overwrite policy;
- no public internet policy;
- allowed future operation classes;
- response and evidence boundary;
- common error taxonomy mapping.

## 6. Paper-ready interpretation

Army Claw separates high-level planning from deterministic local execution through adapter contracts. The `local_workspace` contract demonstrates that even simple file-workspace automation is treated as an adapter-governed execution domain, not as direct LLM file editing. This supports the broader architecture claim that Army Claw can extend beyond HWPX into multiple local application and workspace targets while preserving validation, evidence, and safety boundaries.

## 7. Limitations

Task 027 does not prove that the adapter works at runtime.

It does not:

- implement adapter code;
- create real files;
- execute validator CLI;
- execute unittest;
- invoke Hancom COM;
- generate office documents;
- transition to Stage 2.

## 8. Follow-up

The next implementation-oriented task should add a proof-mode or dry-run `local_workspace` adapter skeleton and then apply the adapter validator gate required by Task 026.

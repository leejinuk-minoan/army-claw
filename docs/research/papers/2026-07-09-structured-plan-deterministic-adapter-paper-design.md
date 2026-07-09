# Structured-Plan and Deterministic-Adapter Paper Initial Design

## Paper Title

Korean title:

> 구조화 계획과 결정론적 어댑터를 활용한 폐쇄망 멀티 오피스 문서 생성 에이전트 설계 및 검증

English title:

> Design and Validation of a Closed-Network Multi-Office Document Generation Agent Using Structured Plans and Deterministic Adapters

## Status

- Status: initial paper design locked for future writing
- Date: 2026-07-09
- Repository context: Army Claw
- Scope: research design only
- Not a production implementation task
- Not a Stage 2 transition declaration
- Not a final HWPX core selection

## Core Thesis

In closed-network or offline environments, a document-generation agent can improve safety, reproducibility, template preservation, and error control by limiting the LLM to structured plan generation and delegating actual document manipulation to validated deterministic app-specific adapters.

The central claim is not merely that the system can generate documents. The claim is that a plan-only LLM plus deterministic adapter architecture is a safer and more verifiable design for multi-office document generation than direct LLM editing or unconstrained free-form generation.

## Research Questions

RQ1. Can user requests be converted into valid structured plans for HWP/HWPX, HanCell, HanShow, local workspace, and multi-app workflows?

RQ2. Can schema validation and policy validation reject invalid or dangerous plans before any file or native application state is modified?

RQ3. Can deterministic adapters produce repeatable outputs from the same validated plan and the same template?

RQ4. Can template structure and formatting be preserved across HWP/HWPX, HanCell, and HanShow outputs?

RQ5. Can the overall workflow operate without public internet dependency in a closed-network or offline environment?

## Hypotheses

H1. Structured plan validation will reject invalid plans before execution with a low false acceptance rate.

H2. Deterministic adapters will produce identical or normalized-equivalent results across repeated runs from the same validated plan.

H3. Template-preserving adapters will produce higher template preservation scores than direct LLM copy-paste generation and naive script-based generation.

H4. The proposed architecture will reduce manual correction time compared with manual editing and direct LLM output workflows.

H5. The proposed architecture will maintain zero public-internet runtime dependency under the defined closed-network test condition.

## Proposed Architecture

The paper validates the following architecture:

```text
User Request
+ User Template
+ Optional Reference Material
        -> Local or Closed-Network LLM Planner
        -> Structured Army Claw Plan
        -> Schema Validation
        -> Policy Validation
        -> Target Routing
        -> Deterministic App-Specific Adapter
           - Local Workspace Adapter
           - HWP/HWPX Adapter
           - HanCell Adapter
           - HanShow Adapter
        -> Artifact Validation
        -> Evidence Report
```

The LLM must not directly edit document packages, native application state, source templates, or arbitrary local files. The LLM can only generate structured plans. Execution is performed by deterministic adapters after validation.

## Baselines

The validation will compare Army Claw against three baselines:

1. Manual editing baseline: a user manually fills the provided office templates.
2. Direct LLM generation baseline: the LLM generates free-form text or table contents, and the user copies results into templates manually.
3. Naive script baseline: a placeholder replacement script fills fixed fields without a complete plan schema, adapter routing contract, policy gate, or evidence model.

The proposed system is Army Claw:

```text
LLM -> structured plan -> schema validation -> policy validation -> routing -> deterministic adapter -> artifact validation -> evidence report
```

## Test Corpus

The initial evaluation corpus should contain:

- HWP/HWPX templates: report, official memo, meeting minutes, operation plan, summary document
- HanCell templates: status table, calculation sheet, budget sheet, inspection checklist, statistics table
- HanShow templates: briefing deck, proposal deck, training material, situation report, result report

Minimum viable evaluation scale:

```text
3 document families x 5 templates x 3 requests x 3 repeated runs = 135 executions
```

Expanded evaluation scale:

```text
3 document families x 10 templates x 5 requests x 5 repeated runs = 750 executions
```

## Evaluation Axes

The paper will evaluate five axes:

1. Functional success: whether HWP/HWPX, HanCell, HanShow, and multi-app artifacts can be generated.
2. Safety: whether invalid, risky, or policy-violating plans are rejected before execution.
3. Reproducibility: whether repeated runs from the same plan and template produce equivalent outputs.
4. Template preservation: whether the original template structure, layout, style, formulas, charts, and slide structure are preserved.
5. Closed-network compliance: whether the workflow runs without public internet dependency.

## Metrics

### Plan Validation Success Rate

```text
valid plans / all generated plans
```

### Invalid Plan Rejection Rate

```text
rejected invalid plans / all invalid plans
```

Invalid plan types include:

- missing template_reference
- missing fill_operations
- invalid target_id
- mismatched artifact type
- source template overwrite attempt
- public internet dependency request
- direct LLM file edit request
- direct native app state modification request
- unauthorized output path

### Deterministic Reproducibility

Binary reproducibility will be measured when possible. Normalized reproducibility will be the primary metric because office files may contain timestamps, internal IDs, compression ordering, or app-specific metadata.

Primary reproducibility metric:

```text
normalized-equivalent outputs / repeated outputs
```

### Template Preservation Score

Template preservation will be evaluated per document family.

HWP/HWPX preservation targets:

- paragraph styles
- character styles
- page settings
- margins
- headers and footers
- tables
- captions
- numbering
- section structure
- placeholder location
- approval or signature blocks

HanCell preservation targets:

- sheets
- cell styles
- merged cells
- row and column sizes
- formulas
- named ranges if available
- tables
- charts
- print settings
- placeholder cells or mapped ranges

HanShow preservation targets:

- slide size
- slide layout
- theme style
- placeholders
- text boxes
- shapes
- tables
- image frames
- chart placeholders
- briefing structure

Template preservation should combine automatic structural comparison and human visual scoring.

### Safety Incident Count

Target values:

- source template overwrite incident: 0
- unauthorized path write: 0
- public internet access attempt: 0
- direct LLM file edit: 0
- unvalidated plan execution: 0

### Manual Correction Time

Measure the time required to convert an initial output into an acceptable final office document.

Compare:

- manual editing
- direct LLM generation plus manual copy/paste
- naive script generation
- Army Claw generation

## Experiments

### Experiment 1: Structured Plan Generation

Input: user requests for multiple office document families.

Procedure:

1. Provide a user request and template reference to the planner.
2. Generate a structured plan.
3. Validate the plan against the schema.
4. Record pass, fail, and repair status.

Metrics:

- validation success rate
- repair success rate
- invalid output rate

### Experiment 2: Dangerous Plan Rejection

Input: normal plans and deliberately unsafe plans.

Unsafe cases:

- source template overwrite
- public internet dependency
- direct file edit
- direct native app manipulation
- invalid path
- mismatched target and plan type

Metrics:

- true rejection rate
- false rejection rate
- false acceptance rate

The most important safety metric is false acceptance rate. Unsafe plans must not pass validation.

### Experiment 3: Deterministic Adapter Reproducibility

Input: validated plans and templates.

Procedure:

1. Execute the same validated plan multiple times.
2. Compare binary outputs when feasible.
3. Compare normalized document structures as the primary measure.
4. Compare validation reports and evidence logs.

Metrics:

- normalized output match rate
- validation report match rate
- content placement consistency

### Experiment 4: Template Preservation

Input: source templates and generated artifacts.

Procedure:

1. Compare original template and generated artifact automatically.
2. Compare visual output through human evaluation.
3. Record document-family-specific preservation scores.

Metrics:

- style preservation score
- layout preservation score
- formula/chart preservation score
- slide layout preservation score
- human visual similarity score

### Experiment 5: Closed-Network Operation

Input: the same generation tasks under network-isolated conditions.

Procedure:

1. Disable public internet access.
2. Use MockModelAdapter, LocalLlmAdapter, or closed-network OpenAI-compatible adapter.
3. Execute generation workflow.
4. Record dependency and runtime access attempts.

Metrics:

- offline execution success rate
- public internet access attempt count
- missing dependency count

### Experiment 6: Multi-App Workflow

Input: a single request requiring multiple office artifacts.

Example:

```text
Create a written report, a calculation table, and a briefing deck from the same source material.
```

Procedure:

1. Generate a multi_app_execution_plan.
2. Validate subplans.
3. Route each subplan to the correct adapter slot.
4. Generate artifacts.
5. Evaluate cross-document content consistency.

Metrics:

- multi_app_execution_plan validation success
- subplan routing correctness
- adapter slot request correctness
- artifact generation success rate
- cross-document consistency

## Evidence to Preserve During Development

Each future implementation task should preserve evidence useful for the paper:

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

## Expected Results Format

The paper should present:

1. Architecture diagram
2. Contract table
3. Baseline comparison table
4. Document-family success table
5. Dangerous plan rejection table
6. Reproducibility table
7. Template preservation score table
8. Manual correction time comparison
9. Failure case analysis
10. Limitations and future work

## Minimum Success Criteria for Publication Draft

The initial paper draft should not claim final production maturity unless demonstrated. Minimum defensible success criteria:

- validated structured plans for all target families
- invalid plan rejection proof
- no source template overwrite incidents in test cases
- no public internet runtime dependency in test cases
- normalized reproducibility measured and reported
- template preservation measured with both automated and human evaluation
- at least one multi-app workflow proof

## Limitations to Acknowledge

The paper must explicitly acknowledge:

- binary-level reproducibility may be difficult due to office file metadata
- template preservation scoring may require human review
- Hancom native application behavior may vary by version and environment
- closed-network LLM performance depends on available local model quality
- the proposed architecture improves controllability but does not guarantee perfect content quality

## Project Integration Rule

This research design is a planning artifact. It does not authorize:

- production code changes
- Stage 2 transition
- final HWPX core selection
- direct LLM document editing
- public internet dependency
- implementation in collaborator feature branches without a contract task

The next engineering milestone for this paper is to make future tasks generate research-grade evidence aligned with this design.

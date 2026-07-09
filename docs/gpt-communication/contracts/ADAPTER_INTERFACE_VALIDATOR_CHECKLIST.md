# Adapter Interface Validator Checklist

Use this checklist before implementing or accepting adapter-related validation work.

## 1. Contract files

- [ ] contract file exists
- [ ] error taxonomy file exists
- [ ] validation matrix exists
- [ ] validator checklist exists

## 2. Samples

- [ ] request sample exists
- [ ] response sample exists
- [ ] negative sample exists
- [ ] JSON syntax valid

## 3. Request validation

- [ ] supported target valid
- [ ] adapter slot valid
- [ ] plan type valid
- [ ] target/slot/plan mapping valid
- [ ] template_reference exists
- [ ] constraints.prevent_source_overwrite is true
- [ ] constraints.allow_public_internet is false
- [ ] LLM direct file edit blocked
- [ ] native app state direct modification blocked

## 4. Response validation

- [ ] proof mode respected
- [ ] actual_adapter_invoked is false in proof
- [ ] execution_allowed is false in proof
- [ ] output_artifacts do not claim real generated documents in proof
- [ ] validation_result exists
- [ ] evidence exists
- [ ] warnings exist

## 5. Negative sample validation

- [ ] public internet dependency blocked
- [ ] source overwrite blocked
- [ ] LLM direct file edit blocked
- [ ] native app state direct modification blocked
- [ ] expected error code present for negative sample
- [ ] expected error category present for negative sample

## 6. Scope safety

- [ ] no production code changed
- [ ] no release/test-documents changed
- [ ] no validator implementation claimed without executable code and evidence
- [ ] no actual adapter invocation claimed
- [ ] no local Hancom COM execution claimed
- [ ] no Stage 2 transition declared
- [ ] no final HWPX core selected

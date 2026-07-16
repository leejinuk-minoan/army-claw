# Task 036 Evidence Directory

Task 036-A contains cloud contract materials only. No Node execution, HWP/HWPX generation, Hancom COM invocation, filesystem mutation, staged write, or controlled promotion evidence is recorded here.

Task 036-B0RL added repository-pinned offline JSZip vendor provenance under `vendor/node/jszip/3.10.1/`. It used an existing local packaging/cache candidate and did not use npm registry, package-manager install, or runtime network access.

Task 036-B0V must add immutable offline runtime validation evidence for:
- runtime materialization from the pinned vendor bundle;
- JSZip version and ZIP round-trip smoke test;
- Node syntax check;
- template-fidelity baseline test;
- existing Hancom Node suite;
- digest and byte-size equality between source vendor and runtime copy.

Task 036-B must later add immutable local evidence for:
- Node commands, stdout/stderr, exit codes, and test counts;
- selector-resolution results and matched coordinates;
- fixture HWPX hashes and changed-entry diff;
- BinData hash comparison and table/paragraph counts;
- preview synchronization results;
- Task 031 staged-output, Task 033 evidence-manifest, and Task 035 promotion links;
- optional native Hancom open/conversion evidence, clearly separated from deterministic engine tests.

Do not overwrite prior evidence attempts.

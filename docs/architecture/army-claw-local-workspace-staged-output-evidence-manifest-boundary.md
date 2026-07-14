# Army Claw Local Workspace Staged Output Evidence Manifest Boundary

## 1. Purpose

Task 033 defines a deterministic evidence manifest over Task 031 staged-output descriptors, receipts, and controlled sandbox-write evidence. It does not inspect a real user workspace, inventory production files, promote artifacts, invoke native applications, or generate real HWP/HWPX/HanCell/HanShow documents.

## 2. Boundary

```text
evidence manifest != real user workspace inspection
staged artifact != promoted artifact
sandbox write != production/user workspace mutation
receipt != native application execution proof
digest verification != semantic document validation
```

The manifest may represent only request-provided generated-content bytes and the deterministic records produced for a controlled test sandbox.

## 3. Deterministic content

The digest-bearing content section contains no wall-clock value. `recorded_at` belongs to an operational envelope and is excluded from `manifest_id` computation.

Canonical serialization policy:

1. UTF-8 JSON without BOM.
2. Object keys sorted lexicographically.
3. Arrays sorted by stable identifiers: artifacts by `artifact_id`, receipts by `receipt_id`, relationships by `(relationship_type, source_id, target_id)`.
4. Compact separators `,` and `:`.
5. No insignificant whitespace.
6. Unicode serialized as UTF-8 characters.
7. Numbers use JSON integer form; NaN and Infinity are forbidden.
8. `manifest_id` is `sha256:` plus the lowercase SHA-256 of the canonical deterministic content with `manifest_id` omitted.

Identical normalized input therefore produces identical deterministic manifest content and identifier.

## 4. Artifact digest policy

- allowlist: `sha256` only for v1;
- digest input: exact request-provided generated-content bytes;
- metadata or path-only hashes must not be described as content digests;
- lowercase hexadecimal, exactly 64 characters;
- empty content is valid and hashes as the SHA-256 of zero bytes;
- mismatch blocks validation with `digest_mismatch`.

## 5. Path policy

Paths are non-empty relative POSIX paths. Platform separators normalize to `/` before validation. Absolute paths, `..`, `.`, empty segments, NUL, control characters, source overwrite, production destinations, duplicate normalized paths, and case-insensitive collisions are blocked. Case-collision comparison uses Unicode casefold over normalized paths.

## 6. Relationship integrity

Every artifact references exactly one existing receipt. Every receipt is referenced by at least one artifact unless explicitly marked `summary_only`. All IDs are unique. Missing references and orphan records are blocking errors. Summary counts must equal array lengths.

## 7. Required safety assertions

```text
staged_output_evidence_manifest_evaluated
staged_output_sandbox_write_performed
actual_adapter_invoked
actual_file_system_mutation_performed
user_workspace_file_system_mutation_performed
file_content_read_performed
local_hancom_com_executed
real_hwp_hwpx_hancell_hanshow_artifact_generated
production_promotion_performed
public_internet_access_performed
dependency_install_performed
```

For Task 033-A all execution flags are false because the cloud phase creates static package material only.

## 8. Error mapping

Task-specific errors are emitted inside the common adapter error envelope. Schema/path/reference failures map to existing common categories such as `schema_validation_error`, `template_reference_error`, `constraint_violation`, `source_overwrite_blocked`, or `evidence_missing`, while preserving the specific Task 033 error code.

Required specific codes include: `invalid_manifest_version`, `invalid_digest_algorithm`, `digest_mismatch`, `duplicate_artifact_id`, `duplicate_receipt_id`, `duplicate_normalized_path`, `case_collision`, `missing_artifact_reference`, `missing_receipt_reference`, `orphan_artifact`, `orphan_receipt`, `artifact_count_mismatch`, `receipt_count_mismatch`, `path_traversal`, `absolute_path_not_allowed`, `source_overwrite_attempt`, `production_path_not_allowed`, `nondeterministic_manifest_content`, and `invalid_canonical_serialization`.

## 9. Completion boundary

Task 033-A completion means cloud package complete only. Task 033 final completion requires Task 033-B local validator and unittest evidence followed by master review. No Stage 2 transition or final HWPX core selection is authorized.
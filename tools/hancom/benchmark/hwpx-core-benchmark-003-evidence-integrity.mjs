import { validateBenchmarkResultContract } from "./task003-schema-preflight.mjs";

export { TASK_003_ID, TASK_003_ROOT, CANONICAL_SCHEMA_ROOT, STATUS_ENUM, ROLE_ENUM, SCENARIOS, buildRoleMatrix, probeFile, executionRecordValidation, isGitCommitSha, isSha256 } from "./task003-common.mjs";
export { validateS06, validateS07, validateS08 } from "./task003-preservation-validators.mjs";
export { validateS12Evidence, validateS13Evidence, validateS14Evidence, validateScenarioEvidence } from "./task003-complete-gates.mjs";
export { correctedStatusForScenario, deriveStatusFromEvidence, prerequisiteProbeValidation } from "./task003-status-decision.mjs";
export { calculateEvidenceRubricScorecard, calculateInvalidPassCount, validatePassedResultEligibility } from "./task003-score-integrity.mjs";
export { CANONICAL_SCHEMA_FILES, CANONICAL_SCHEMA_PATHS, buildFilesystemJsonInventory, evaluateInventoryRecords, classifyJson, selectSchemaForJson } from "./task003-json-inventory.mjs";
export { captureTaskManifest, compareTaskManifests, validateCrossArtifactConsistency } from "./task003-manifest-integrity.mjs";
export { buildSchemas, SCHEMA_ROOT, validateGeneratedJsonAgainstSchemas } from "./task003-schema-runtime.mjs";
export { validateAdapterExecutionContract, validateBenchmarkResultContract, validateSchemaDocumentShape } from "./task003-schema-preflight.mjs";
export { validateTestSummaryCompletionContract } from "./task003-completion-preflight.mjs";

export function validateEvidenceIntegrityResult(result) {
  const required = ["task_id", "candidate_id", "candidate_role", "scenario_id", "status", "status_reason", "evidence_completeness", "missing_evidence", "planned_commands", "attempted_commands", "validator_results"];
  for (const field of required) if (result?.[field] === undefined) throw new Error(`result_field_required:${field}`);
  const contract = validateBenchmarkResultContract(result);
  if (!contract.valid) throw new Error(`benchmark_result_contract_invalid:${contract.errors.join(",")}`);
  return true;
}

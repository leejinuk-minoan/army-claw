export { TASK_003_ID, TASK_003_ROOT, STATUS_ENUM, ROLE_ENUM, SCENARIOS, buildRoleMatrix } from "./task003-common.mjs";
export { validateS06, validateS07, validateS08 } from "./task003-preservation-validators.mjs";
export { validateS12Evidence, validateS13Evidence, validateS14Evidence, validateScenarioEvidence } from "./task003-complete-gates.mjs";
export { correctedStatusForScenario, deriveStatusFromEvidence } from "./task003-status-decision.mjs";
export { calculateEvidenceRubricScorecard, calculateInvalidPassCount } from "./task003-score-integrity.mjs";
export { buildFilesystemJsonInventory, evaluateInventoryRecords, selectSchemaForJson } from "./task003-json-inventory.mjs";
export { captureTaskManifest, compareTaskManifests, validateCrossArtifactConsistency } from "./task003-manifest-integrity.mjs";
export { buildSchemas, validateGeneratedJsonAgainstSchemas } from "./task003-schema-runtime.mjs";

export function validateEvidenceIntegrityResult(result) {
  const required = ["task_id", "candidate_id", "candidate_role", "scenario_id", "status", "status_reason", "evidence_completeness", "missing_evidence", "planned_commands", "attempted_commands", "validator_results"];
  for (const field of required) if (result?.[field] === undefined) throw new Error(`result_field_required:${field}`);
  if (result.status === "passed" && (!result.attempted_commands.length || !result.validator_results.length || result.validator_results.some((validator) => validator.valid !== true))) throw new Error("passed_requires_actual_execution_and_validators");
  if (result.status === "blocked" && !result.prerequisite_probe) throw new Error("blocked_requires_prerequisite_structure");
  if (result.status === "unsupported" && !result.source_api_inspection) throw new Error("unsupported_requires_source_inspection");
  return true;
}

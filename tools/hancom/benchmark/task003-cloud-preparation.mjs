export { TASK_003_ID, TASK_003_ROOT, buildRoleMatrix } from "./task003-common.mjs";
export { validateS06, validateS07, validateS08 } from "./task003-preservation-validators.mjs";
export { validateS12Evidence, validateS13Evidence, validateS14Evidence, validateScenarioEvidence } from "./task003-complete-gates.mjs";
export { correctedStatusForScenario, deriveStatusFromEvidence } from "./task003-status-decision.mjs";
export { calculateEvidenceRubricScorecard, calculateInvalidPassCount } from "./task003-score-integrity.mjs";
export { buildFilesystemJsonInventory, evaluateInventoryRecords, selectSchemaForJson } from "./task003-json-inventory.mjs";
export { captureTaskManifest, compareTaskManifests, validateCrossArtifactConsistency } from "./task003-manifest-integrity.mjs";
export { buildSchemas, validateGeneratedJsonAgainstSchemas } from "./task003-schema-runtime.mjs";

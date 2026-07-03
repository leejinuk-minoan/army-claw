// Legacy compatibility wrapper. Canonical implementation: task003-common.mjs
import * as canonical from "./task003-common.mjs";

export {
  TASK_003_ID as TASK_ID,
  TASK_003_ROOT as OUTPUT_ROOT,
  CANONICAL_SCHEMA_ROOT,
  STATUS_ENUM as STATUS,
  ROLE_ENUM as ROLES,
  SCENARIOS,
  isObject,
  isSha256 as isSha,
  unique as uniq,
  deepEqual,
  scenarioApplicable,
  buildRoleMatrix,
  attemptedCommandValid as commandRecordValid,
  inventoryProbeValidation,
  completeGate as semanticGate,
  validateScenarioAssertions as scenarioAssertions,
  fileReferenceValidation as validateArtifactReference,
  commonPreservationEvidence,
  allowedDiffAssertion,
  nonTargetHashAssertion,
  isFilesystemProbe,
  probeFile,
  executionRecordValidation,
} from "./task003-common.mjs";

export function roleApplicability(role, scenarioId) {
  const applicable = canonical.scenarioApplicable(role, scenarioId);
  return { applicable, role, rationale: applicable ? `${role} role owns ${scenarioId}` : `${role} role does not own ${scenarioId}` };
}

export function artifactInventoryValid(items, probes = {}) {
  return canonical.inventoryProbeValidation(items, probes).valid;
}

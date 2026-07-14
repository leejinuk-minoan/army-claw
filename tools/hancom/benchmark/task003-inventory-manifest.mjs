// Legacy compatibility wrapper.
// Canonical inventory: task003-json-inventory.mjs
// Canonical manifests: task003-manifest-integrity.mjs
export {
  CANONICAL_SCHEMA_FILES,
  CANONICAL_SCHEMA_PATHS,
  classifyJson,
  selectSchemaForJson,
  evaluateInventoryRecords,
  buildFilesystemJsonInventory,
  sha256File,
} from "./task003-json-inventory.mjs";
export {
  captureTaskManifest as captureFilesystemManifest,
  captureTaskManifest,
  compareTaskManifests,
  validateCrossArtifactConsistency,
} from "./task003-manifest-integrity.mjs";

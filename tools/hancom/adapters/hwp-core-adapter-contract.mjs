export const HWP_CORE_METHODS = [
  "openPackage",
  "savePackage",
  "analyzeDocument",
  "findParagraphs",
  "findTables",
  "findShapes",
  "replaceText",
  "setTableHeight",
  "clonePageOrBoard",
  "validatePackage",
  "extractSemanticSnapshot",
];

export function unsupported(method, reason) {
  return {
    method,
    status: "unsupported",
    reason,
    artifacts: [],
    errors: [reason],
  };
}

export class HwpCoreAdapter {
  constructor({ id, slug, role, version, source, immutableRef, runtime, capabilities = {}, license = {}, dependencyEvidence = {}, installSizeBytes = 0 }) {
    this.id = id;
    this.slug = slug;
    this.capabilities = capabilities;
    this.installSizeBytes = installSizeBytes;
    this.metadata = { id, role, version, source, immutable_ref: immutableRef, runtime };
    this.license = license;
    this.dependencyEvidence = dependencyEvidence;
  }

  openPackage() { return unsupported("openPackage", "not implemented by this spike"); }
  savePackage() { return unsupported("savePackage", "not implemented by this spike"); }
  analyzeDocument() { return unsupported("analyzeDocument", "not implemented by this spike"); }
  findParagraphs() { return unsupported("findParagraphs", "not implemented by this spike"); }
  findTables() { return unsupported("findTables", "not implemented by this spike"); }
  findShapes() { return unsupported("findShapes", "not implemented by this spike"); }
  replaceText() { return unsupported("replaceText", "not implemented by this spike"); }
  setTableHeight() { return unsupported("setTableHeight", "not implemented by this spike"); }
  clonePageOrBoard() { return unsupported("clonePageOrBoard", "not implemented by this spike"); }
  validatePackage() { return unsupported("validatePackage", "not implemented by this spike"); }
  extractSemanticSnapshot() { return unsupported("extractSemanticSnapshot", "not implemented by this spike"); }
}

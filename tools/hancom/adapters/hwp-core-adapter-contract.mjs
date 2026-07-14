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
  return makeAdapterExecution({
    candidate_id: "unknown",
    method,
    status: "unsupported",
    output: { reason },
    artifacts: [],
    errors: [reason],
    assertions: [{ id: `${method}-unsupported`, expected: "supported", actual: "unsupported", passed: false }],
    trace: [{ type: "contract_default", method }],
  });
}

export function blocked(candidateId, method, reason, output = {}) {
  const evidence = {
    attempted_commands: output.attempted_commands ?? [`${candidateId}:${method}:blocked-prerequisite-check`],
    checked_paths: output.checked_paths ?? [],
    missing_prerequisite: output.missing_prerequisite ?? reason,
    runtime_check: output.runtime_check ?? "not_available",
    artifact_check: output.artifact_check ?? "not_available",
    license_check: output.license_check ?? "not_available",
    evidence_log_path: output.evidence_log_path ?? "candidate result adapter-execution.json",
  };
  return makeAdapterExecution({
    candidate_id: candidateId,
    method,
    status: "blocked",
    output: { reason, ...output, ...evidence },
    artifacts: [],
    errors: [reason],
    assertions: [{ id: `${method}-blocked-prerequisite`, expected: "runtime/artifact/license available", actual: reason, passed: false }],
    trace: [{ type: "blocked_prerequisite", method, reason, attempted_commands: evidence.attempted_commands, checked_paths: evidence.checked_paths }],
  });
}

export function makeAdapterExecution({
  candidate_id,
  method,
  status,
  started_at = new Date().toISOString(),
  ended_at = new Date().toISOString(),
  input = {},
  output = {},
  assertions = [],
  artifacts = [],
  stdout_path = null,
  stderr_path = null,
  trace = [],
  errors = [],
}) {
  return {
    candidate_id,
    method,
    status,
    started_at,
    ended_at,
    duration_ms: Math.max(0, Date.parse(ended_at) - Date.parse(started_at)),
    input,
    output,
    assertions,
    artifacts,
    stdout_path,
    stderr_path,
    trace,
    errors,
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

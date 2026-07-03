import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export * from "./task003-common.mjs";
export * from "./task003-preservation-validators.mjs";
export * from "./task003-complete-gates.mjs";
export * from "./task003-status-decision.mjs";
export * from "./task003-artifact-integrity.mjs";
export * from "./task003-schema-runtime.mjs";

function object(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function hash(value) { return typeof value === "string" && /^[a-f0-9]{64}$/u.test(value); }

export function validateEvidenceIntegrityResult(result) {
  const required = ["task_id", "candidate_id", "candidate_role", "scenario_id", "status", "status_reason", "evidence_completeness", "missing_evidence", "planned_commands", "attempted_commands", "checked_paths", "validator_results"];
  for (const key of required) if (result?.[key] === undefined) throw new Error(`result_field_required:${key}`);
  if (result.status === "passed") {
    if (!result.validator_results.length || result.validator_results.some((v) => v.valid !== true)) throw new Error("passed_requires_all_validators");
    if (result.execution_record?.executed !== true || !Number.isInteger(result.execution_record?.exit_code)) throw new Error("passed_requires_actual_execution_record");
    if (!result.imported_evidence?.source_path || !hash(result.imported_evidence?.source_sha256) || result.imported_evidence?.hash_verified !== true) throw new Error("passed_requires_imported_evidence_path_sha256");
    if (!object(result.scenario_evidence)) throw new Error("passed_requires_scenario_evidence");
  }
  if (result.status === "unsupported" && (result.source_api_inspection?.performed !== true || !hash(result.source_api_inspection?.evidence_sha256))) throw new Error("unsupported_requires_source_api_inspection");
  if (result.status === "blocked" && (!result.blocked_reason_code || !Array.isArray(result.missing_prerequisites) || !result.prerequisite_probe)) throw new Error("blocked_requires_prerequisite_structure");
  if (result.status === "not_applicable" && (!result.not_applicable_role || !result.not_applicable_rationale || !result.governing_role_matrix_path)) throw new Error("not_applicable_requires_role_rationale");
  return true;
}

export async function runEvidenceIntegrityBenchmark() {
  throw new Error("local_execution_required: actual Task 003 artifact generation requires pinned dependencies and a standards-compliant Draft 2020-12 validator");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.error("Task 003 cloud-preparation module loaded. Actual execution is local-Codex-only.");
  process.exitCode = 2;
}

export function validateTestSummaryCompletionContract(document) {
  const errors = [];
  if (document?.completion_gate_passed === true) {
    if (document.invalid_pass_count !== 0) errors.push("completion_invalid_pass_count_nonzero");
    if (document.schema_validation_failures !== 0) errors.push("completion_schema_validation_failures_nonzero");
    if (document.totals?.failed !== 0) errors.push("completion_failed_total_nonzero");
    if (!Array.isArray(document.required_runs) || document.required_runs.length === 0) errors.push("completion_required_runs_missing");
    if (document.required_runs?.some((run) => run.required_for_completion !== true || run.executed !== true || run.exit_code !== 0 || run.passed !== true || run.failed !== 0)) errors.push("completion_required_run_invalid");
    if (document.independent_ci_verification?.required_for_completion === true && document.independent_ci_verification?.status !== "executed") errors.push("required_independent_ci_not_executed");
  }
  return { valid: errors.length === 0, errors };
}

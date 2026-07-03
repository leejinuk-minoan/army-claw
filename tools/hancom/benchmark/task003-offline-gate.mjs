import { artifactInventoryValid, commandRecordValid, scenarioAssertions, semanticGate } from "./task003-cloud-common.mjs";

export function validateS13(evidence = {}) {
  const missing = [];
  if (!evidence.clean_environment?.type || !evidence.clean_environment?.id || evidence.clean_environment?.isolated !== true) missing.push("clean_isolated_environment_missing");
  if (!artifactInventoryValid(evidence.pinned_offline_artifact_inventory)) missing.push("pinned_offline_artifact_inventory_invalid");
  if (!commandRecordValid(evidence.install_attempt)) missing.push("install_attempt_record_invalid");
  if (!artifactInventoryValid(evidence.installed_inventory)) missing.push("installed_inventory_invalid");
  if (!commandRecordValid(evidence.runtime_invocation)) missing.push("runtime_invocation_record_invalid");
  if (!evidence.runtime_network_test?.method || typeof evidence.runtime_network_test.network_required !== "boolean" || !Number.isInteger(evidence.runtime_network_test.exit_code)) missing.push("runtime_network_test_invalid");
  if (evidence.cleanup?.attempted !== true || !evidence.cleanup?.result) missing.push("cleanup_result_missing");
  return semanticGate([
    { assertion_id: "offline_install_exit_zero", expected: 0, actual: evidence.install_attempt?.exit_code, passed: evidence.install_attempt?.exit_code === 0 },
    { assertion_id: "runtime_invocation_exit_zero", expected: 0, actual: evidence.runtime_invocation?.exit_code, passed: evidence.runtime_invocation?.exit_code === 0 },
    { assertion_id: "runtime_network_not_required", expected: false, actual: evidence.runtime_network_test?.network_required, passed: evidence.runtime_network_test?.network_required === false && evidence.runtime_network_test?.exit_code === 0 },
    { assertion_id: "cleanup_success", expected: "success", actual: evidence.cleanup?.result, passed: evidence.cleanup?.result === "success" },
    scenarioAssertions(evidence.scenario_assertions),
  ], missing);
}

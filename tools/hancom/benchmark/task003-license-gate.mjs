import { isSha, scenarioAssertions, semanticGate } from "./task003-cloud-common.mjs";
export function validateS14(e = {}) {
  const missing = []; const legal = e.legal_files;
  if (!Array.isArray(legal) || !["LICENSE", "COPYING", "NOTICE"].every((kind) => legal.some((x) => x.kind === kind))) missing.push("legal_inventory_incomplete");
  if (Array.isArray(legal)) for (const file of legal) {
    if (!file.kind || !["present", "absent"].includes(file.status)) missing.push("legal_status_invalid");
    if (file.status === "present" && (!file.path || !isSha(file.sha256))) missing.push(`legal_hash_missing:${file.kind}`);
    if (file.status === "absent" && !file.rationale) missing.push(`absence_rationale_missing:${file.kind}`);
  }
  if (!legal?.some((x) => x.kind === "LICENSE" && x.status === "present")) missing.push("LICENSE_missing");
  if (!e.spdx_expression && !e.manual_assessment?.decision) missing.push("license_assessment_missing");
  if (!e.redistribution?.source_impact || e.redistribution.source_impact === "unknown") missing.push("source_impact_missing");
  if (!e.redistribution?.binary_impact || e.redistribution.binary_impact === "unknown") missing.push("binary_impact_missing");
  if (!Array.isArray(e.redistribution?.obligations) || e.redistribution.obligations.length === 0) missing.push("obligations_missing");
  if (!e.reviewer || !e.reviewed_at) missing.push("review_metadata_missing");
  return semanticGate([
    { assertion_id: "present_legal_files_hashed", expected: true, actual: legal, passed: Array.isArray(legal) && legal.filter((x) => x.status === "present").every((x) => isSha(x.sha256)) },
    { assertion_id: "redistribution_assessment_complete", expected: true, actual: e.redistribution, passed: Boolean(e.redistribution?.source_impact && e.redistribution?.binary_impact && e.redistribution.source_impact !== "unknown" && e.redistribution.binary_impact !== "unknown") },
    scenarioAssertions(e.scenario_assertions),
  ], missing);
}

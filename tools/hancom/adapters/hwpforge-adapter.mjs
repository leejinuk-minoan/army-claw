import { blocked, HWP_CORE_METHODS, HwpCoreAdapter } from "./hwp-core-adapter-contract.mjs";

export class HwpForgeAdapter extends HwpCoreAdapter {
  constructor() {
    super({
      id: "hwpforge",
      slug: "hwpforge",
      role: "validator",
      version: "blocked-no-project-evidence",
      source: "not available in workspace",
      immutableRef: "unknown",
      runtime: "unknown",
      capabilities: {
        openPackage: "blocked",
        savePackage: "blocked",
        analyzeDocument: "blocked",
        findParagraphs: "blocked",
        findTables: "blocked",
        findShapes: "blocked",
        replaceText: "not_applicable",
        setTableHeight: "not_applicable",
        clonePageOrBoard: "not_applicable",
        validatePackage: "blocked",
        extractSemanticSnapshot: "blocked",
      },
      license: {
        license_file_path: null,
        license_sha256: null,
        spdx_expression: null,
        redistribution_assessment: "unknown",
        evidence_path: "release/test-documents/hwpx-core-benchmark-001/summary/dependency-license-offline-manifest.json",
      },
      dependencyEvidence: {
        name: "HwpForge",
        exact_version_or_commit: "unknown",
        download_source: "not available in offline workspace",
        downloaded_filename: null,
        sha256: null,
        license_file_location: null,
        license_sha256: null,
        spdx_expression: null,
        runtime_requirements: ["unknown"],
        offline_install_command: "blocked: no exact source/release artifact available",
        offline_package_contents: [],
        network_required_at_runtime: false,
        redistribution_notes: "Benchmark candidate remains blocked until project identity, immutable ref, runtime, and LICENSE evidence are verified.",
      },
    });
  }
}

for (const method of HWP_CORE_METHODS) {
  HwpForgeAdapter.prototype[method] = function hwpforgeBlockedMethod() {
    return blocked(this.id, method, "HwpForge project identity, immutable source/release, runtime, actual LICENSE, and offline build evidence are not established", {
      attempted_commands: ["search local artifact inventory for HwpForge", "hwpforge --version", "cargo build --locked"],
      checked_paths: ["vendor/hwpforge/", "release/test-documents/hwpx-core-benchmark-002/external/hwpforge/"],
      runtime_check: "unknown until project identity is established",
      artifact_check: "missing immutable HwpForge source/release artifact",
      license_check: "missing actual LICENSE/COPYING/NOTICE file",
      missing_prerequisite: "upstream project identity and pinned artifact",
      searched_project_names: ["HwpForge"],
      identity_ambiguity: true,
    });
  };
}

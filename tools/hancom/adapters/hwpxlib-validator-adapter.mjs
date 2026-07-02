import { HwpCoreAdapter } from "./hwp-core-adapter-contract.mjs";

export class HwpxlibValidatorAdapter extends HwpCoreAdapter {
  constructor() {
    super({
      id: "hwpxlib",
      slug: "hwpxlib",
      role: "validator",
      version: "blocked-no-offline-artifact",
      source: "not installed in workspace",
      immutableRef: "unknown",
      runtime: "java",
      capabilities: {
        openPackage: "blocked",
        savePackage: "not_applicable",
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
        name: "hwpxlib",
        exact_version_or_commit: "unknown",
        download_source: "not available in offline workspace",
        downloaded_filename: null,
        sha256: null,
        license_file_location: null,
        license_sha256: null,
        spdx_expression: null,
        runtime_requirements: ["Java runtime"],
        offline_install_command: "blocked: no pinned jar/source artifact available",
        offline_package_contents: [],
        network_required_at_runtime: false,
        redistribution_notes: "Validator adoption blocked until exact jar/source and LICENSE evidence are imported.",
      },
    });
  }
}

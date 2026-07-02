import { HwpCoreAdapter } from "./hwp-core-adapter-contract.mjs";

export class CurrentNodeXmlAdapter extends HwpCoreAdapter {
  constructor() {
    super({
      id: "current_node_xml",
      slug: "current-node-xml",
      role: "editor",
      version: "repo-local",
      source: "tools/hancom/army-claw-hancom-tools.mjs",
      immutableRef: "repository working tree",
      runtime: "node",
      capabilities: {
        openPackage: "passed",
        savePackage: "passed",
        analyzeDocument: "passed",
        findParagraphs: "passed",
        findTables: "passed",
        findShapes: "partial",
        replaceText: "passed",
        setTableHeight: "unsupported",
        clonePageOrBoard: "unsupported",
        validatePackage: "passed",
        extractSemanticSnapshot: "passed",
      },
      license: {
        license_file_path: null,
        license_sha256: null,
        spdx_expression: null,
        redistribution_assessment: "unknown",
        evidence_path: "release/test-documents/hwpx-core-benchmark-001/summary/dependency-license-offline-manifest.json",
      },
      dependencyEvidence: {
        name: "Current Army Claw Node/XML core",
        exact_version_or_commit: "repository working tree",
        download_source: "local repository",
        downloaded_filename: null,
        sha256: null,
        license_file_location: null,
        license_sha256: null,
        spdx_expression: null,
        runtime_requirements: ["Node.js"],
        offline_install_command: "Use bundled Army Claw runtime and node_modules payload.",
        offline_package_contents: ["tools/hancom/army-claw-hancom-tools.mjs"],
        network_required_at_runtime: false,
        redistribution_notes: "Repository-level LICENSE file was not present in this checkout; redistribution assessment remains unknown.",
      },
    });
  }
}

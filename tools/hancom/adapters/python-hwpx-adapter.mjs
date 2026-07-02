import { HwpCoreAdapter } from "./hwp-core-adapter-contract.mjs";

export class PythonHwpxAdapter extends HwpCoreAdapter {
  constructor() {
    super({
      id: "python_hwpx",
      slug: "python-hwpx",
      role: "editor",
      version: "blocked-no-offline-package",
      source: "not installed in workspace",
      immutableRef: "unknown",
      runtime: "python",
      capabilities: {
        openPackage: "blocked",
        savePackage: "blocked",
        analyzeDocument: "blocked",
        findParagraphs: "blocked",
        findTables: "blocked",
        findShapes: "blocked",
        replaceText: "blocked",
        setTableHeight: "unsupported",
        clonePageOrBoard: "unsupported",
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
        name: "python-hwpx",
        exact_version_or_commit: "unknown",
        download_source: "not available in offline workspace",
        downloaded_filename: null,
        sha256: null,
        license_file_location: null,
        license_sha256: null,
        spdx_expression: null,
        runtime_requirements: ["Python 3"],
        offline_install_command: "blocked: no pinned wheel/source artifact available",
        offline_package_contents: [],
        network_required_at_runtime: false,
        redistribution_notes: "Adoption blocked until exact artifact and real LICENSE/COPYING/NOTICE evidence are imported.",
      },
    });
  }
}

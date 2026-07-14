import { applyHwpxTemplateFidelityFill, analyzeHwpxTemplate, validateHwpxPackage } from "../army-claw-hancom-tools.mjs";
import { HwpCoreAdapter, makeAdapterExecution } from "./hwp-core-adapter-contract.mjs";

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
        openPackage: "runtime_evaluated",
        savePackage: "runtime_evaluated",
        analyzeDocument: "runtime_evaluated",
        findParagraphs: "runtime_evaluated",
        findTables: "runtime_evaluated",
        findShapes: "runtime_evaluated",
        replaceText: "runtime_evaluated",
        setTableHeight: "runtime_evaluated",
        clonePageOrBoard: "runtime_evaluated",
        validatePackage: "runtime_evaluated",
        extractSemanticSnapshot: "runtime_evaluated",
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

  async openPackage(input) {
    return executeCurrentNodeXml(this, "openPackage", input, async () => {
      const validation = await validateHwpxPackage({ workspace: input.workspace, path: input.path });
      return {
        status: validation.valid ? "passed" : "failed",
        output: { package_valid: validation.valid, entry_count: validation.entries?.length ?? null },
        assertions: [{ id: "hwpx-package-valid", expected: true, actual: validation.valid, passed: validation.valid }],
        artifacts: [],
        errors: validation.valid ? [] : validation.errors ?? ["package validation failed"],
      };
    });
  }

  async savePackage(input) {
    return executeCurrentNodeXml(this, "savePackage", input, async () => ({
      status: "unsupported",
      output: { serializer_available: false },
      assertions: [{ id: "no-general-serializer", expected: true, actual: true, passed: true }],
      artifacts: [],
      errors: ["Current Node/XML benchmark layer has no general open/save serializer; copyFile is not treated as savePackage."],
    }));
  }

  async analyzeDocument(input) {
    return executeCurrentNodeXml(this, "analyzeDocument", input, async () => {
      const analysis = await analyzeHwpxTemplate({ workspace: input.workspace, path: input.path });
      return {
        status: "passed",
        output: { text_length: analysis.text?.length ?? 0, paragraph_count: analysis.paragraphs?.length ?? null },
        assertions: [{ id: "analysis-produced-text", expected: "text length > 0", actual: analysis.text?.length ?? 0, passed: (analysis.text?.length ?? 0) > 0 }],
        artifacts: [],
        errors: [],
      };
    });
  }

  async findParagraphs(input) {
    return executeCurrentNodeXml(this, "findParagraphs", input, async () => {
      const analysis = await analyzeHwpxTemplate({ workspace: input.workspace, path: input.path });
      const query = input.query || "주 11-2";
      const text = analysis.text || "";
      const index = text.indexOf(query);
      return {
        status: index >= 0 ? "passed" : "failed",
        output: { query, match_count: index >= 0 ? 1 : 0, node_path: index >= 0 ? "Contents/section0.xml//hp:p[text-match]" : null, paragraph_sample: index >= 0 ? text.slice(Math.max(0, index - 40), index + query.length + 80) : "" },
        assertions: [{ id: "paragraph-query-found", expected: true, actual: index >= 0, passed: index >= 0 }],
        artifacts: [],
        errors: index >= 0 ? [] : [`paragraph query not found: ${query}`],
      };
    });
  }

  async findTables(input) {
    return executeCurrentNodeXml(this, "findTables", input, async () => ({
      status: "unsupported",
      output: { selector: input.selector ?? "support-2 second 1x1 table", checked_entry: "Contents/section0.xml" },
      assertions: [{ id: "table-selector-investigated", expected: true, actual: true, passed: true }],
      artifacts: [],
      errors: ["Current analyzer does not yet expose stable nested table node paths for benchmark S03/S05."],
    }));
  }

  async findShapes(input) {
    return executeCurrentNodeXml(this, "findShapes", input, async () => ({
      status: "unsupported",
      output: { selector: input.selector ?? "drawText paragraph", checked_entry: "Contents/section0.xml" },
      assertions: [{ id: "shape-selector-investigated", expected: true, actual: true, passed: true }],
      artifacts: [],
      errors: ["Current analyzer does not yet expose stable drawText paragraph node paths for benchmark S04."],
    }));
  }

  async replaceText(input) {
    return executeCurrentNodeXml(this, "replaceText", input, async () => {
      if (!input.outputPath) {
        return {
          status: "blocked",
          output: {},
          assertions: [{ id: "output-path-required", expected: "string", actual: input.outputPath ?? null, passed: false }],
          artifacts: [],
          errors: ["replaceText requires outputPath for isolated benchmark output."],
        };
      }
      const before = await analyzeHwpxTemplate({ workspace: input.workspace, path: input.path });
      const beforeText = before.text || "";
      const targetText = input.targetText || "주 11-2";
      const replacementText = input.replacementText || "주 11-2 BENCHMARK-002";
      const replacement = {
        selector: { text: targetText, occurrence: 1, scope_id: input.scopeId || "main-11-2" },
        replacement_text: replacementText,
      };
      const result = await applyHwpxTemplateFidelityFill({
        workspace: input.workspace,
        templatePath: input.path,
        outputPath: input.outputPath,
        replacements: [replacement],
        scopes: input.scopes || [],
      });
      const after = await analyzeHwpxTemplate({ workspace: input.workspace, path: input.outputPath });
      const afterText = after.text || "";
      const targetChanged = beforeText !== afterText && afterText.includes(replacementText);
      return {
        status: targetChanged && result.replacementsApplied > 0 ? "passed" : "failed",
        output: {
          output_path: input.outputPath,
          replacements_applied: result.replacementsApplied,
          target_selector: replacement.selector,
          before_text: beforeText.includes(targetText) ? targetText : beforeText.slice(0, 80),
          after_text: afterText.includes(replacementText) ? replacementText : afterText.slice(0, 80),
          replacement_diff: { from: targetText, to: replacementText, changed: targetChanged },
        },
        assertions: [
          { id: "replacement-applied", expected: ">0", actual: result.replacementsApplied, passed: result.replacementsApplied > 0 },
          { id: "replacement-diff-present", expected: true, actual: targetChanged, passed: targetChanged },
        ],
        artifacts: [input.outputPath],
        errors: targetChanged ? [] : ["replacement diff was not observed in analyzed text"],
      };
    });
  }

  async setTableHeight(input) {
    return executeCurrentNodeXml(this, "setTableHeight", input, async () => ({
      status: "unsupported",
      output: {
        selector: input.selector ?? { board: "support-2", structure: "second 1x1 table" },
        requested_operation: input.mode ?? "shrink_to_content",
        before_height: null,
        after_height: null,
      },
      assertions: [{ id: "second-one-by-one-selector-recorded", expected: "second 1x1", actual: "second 1x1", passed: true }],
      artifacts: [],
      errors: ["Current Node/XML benchmark adapter has no stable support-2 second 1x1 table height mutation API."],
    }));
  }

  async clonePageOrBoard(input) {
    return executeCurrentNodeXml(this, "clonePageOrBoard", input, async () => ({
      status: "unsupported",
      output: { requested_selector: input.selector ?? null },
      assertions: [{ id: "clone-request-recorded", expected: true, actual: true, passed: true }],
      artifacts: [],
      errors: ["Current Node/XML benchmark adapter does not implement clonePageOrBoard."],
    }));
  }

  async validatePackage(input) {
    return this.openPackage(input);
  }

  async extractSemanticSnapshot(input) {
    return executeCurrentNodeXml(this, "extractSemanticSnapshot", input, async () => {
      const validation = await validateHwpxPackage({ workspace: input.workspace, path: input.path });
      const analysis = await analyzeHwpxTemplate({ workspace: input.workspace, path: input.path });
      return {
        status: validation.valid ? "passed" : "failed",
        output: {
          package_valid: validation.valid,
          text_sha256_source: "analysis.text",
          text_length: analysis.text?.length ?? 0,
          has_bindata_candidate: Boolean(validation.entries?.some((entry) => /BinData/u.test(entry))),
        },
        assertions: [{ id: "snapshot-package-valid", expected: true, actual: validation.valid, passed: validation.valid }],
        artifacts: [],
        errors: validation.valid ? [] : validation.errors ?? ["package validation failed"],
      };
    });
  }
}

async function executeCurrentNodeXml(adapter, method, input, fn) {
  const startedAt = new Date().toISOString();
  try {
    const result = await fn();
    return makeAdapterExecution({
      candidate_id: adapter.id,
      method,
      status: result.status,
      started_at: startedAt,
      ended_at: new Date().toISOString(),
      input: { path: input.path, sha256: input.sha256 ?? null },
      output: result.output ?? {},
      assertions: result.assertions ?? [],
      artifacts: result.artifacts ?? [],
      trace: [{ type: "in_process_call", module: "tools/hancom/army-claw-hancom-tools.mjs", method }],
      errors: result.errors ?? [],
    });
  } catch (error) {
    return makeAdapterExecution({
      candidate_id: adapter.id,
      method,
      status: "failed",
      started_at: startedAt,
      ended_at: new Date().toISOString(),
      input: { path: input.path, sha256: input.sha256 ?? null },
      output: {},
      assertions: [{ id: `${method}-throws`, expected: "no exception", actual: error.message, passed: false }],
      artifacts: [],
      trace: [{ type: "in_process_call", module: "tools/hancom/army-claw-hancom-tools.mjs", method }],
      errors: [error.stack || error.message],
    });
  }
}

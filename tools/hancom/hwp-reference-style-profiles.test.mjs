import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  analyzeHwpxTemplate,
  generateReferenceProfileSample,
  validateHwpxPackage,
  validateMergedTableCells,
} from "./army-claw-hancom-tools.mjs";
import { createHwpReferenceManifest } from "./hwp-reference-analyzer.mjs";

test("validates merged table cells and rejects collisions", () => {
  assert.doesNotThrow(() => validateMergedTableCells({
    rows: 3,
    cols: 3,
    cells: [
      { row: 0, col: 0, row_span: 1, col_span: 2, text: "병합 머리글" },
      { row: 0, col: 2, text: "결과" },
      { row: 1, col: 0, text: "A" },
      { row: 1, col: 1, text: "B" },
      { row: 1, col: 2, text: "C" },
    ],
  }));

  assert.throws(
    () => validateMergedTableCells({
      rows: 2,
      cols: 2,
      cells: [
        { row: 0, col: 0, row_span: 1, col_span: 2, text: "A" },
        { row: 0, col: 1, text: "B" },
      ],
    }),
    /merged cell collision/u,
  );

  assert.throws(
    () => validateMergedTableCells({
      rows: 2,
      cols: 2,
      cells: [{ row: 1, col: 1, row_span: 2, col_span: 1, text: "범위 초과" }],
    }),
    /outside table bounds/u,
  );
});

test("generates a qualification review booklet reference sample", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "army-claw-qualification-profile-"));
  try {
    const outputPath = "outputs/qualification-review-sample.hwpx";
    await generateReferenceProfileSample({
      workspace,
      outputPath,
      profileId: "qualification_review_booklet",
    });

    const validation = await validateHwpxPackage({ workspace, path: outputPath });
    const analysis = await analyzeHwpxTemplate({ workspace, path: outputPath });

    assert.equal(validation.valid, true);
    assert.equal(validation.native_table_wrapper_validation, "passed");
    assert.equal(analysis.referenceProfile, "qualification_review_booklet");
    assert.ok(analysis.paragraphs.includes("Army Claw 표준문서 자동화 개발"));
    assert.ok(analysis.paragraphs.includes("주 2-1"));
    assert.ok(analysis.paragraphs.includes("보조 2-1"));
    assert.ok(analysis.tables.some((table) => table.style === "report"));
    assert.ok(analysis.tables.some((table) => table.hasMergedCells));
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("generates an official action plan reference sample", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "army-claw-action-plan-profile-"));
  try {
    const outputPath = "outputs/official-action-plan-sample.hwpx";
    await generateReferenceProfileSample({
      workspace,
      outputPath,
      profileId: "official_action_plan",
    });

    const validation = await validateHwpxPackage({ workspace, path: outputPath });
    const analysis = await analyzeHwpxTemplate({ workspace, path: outputPath });

    assert.equal(validation.valid, true);
    assert.equal(validation.native_table_wrapper_validation, "passed");
    assert.equal(analysis.referenceProfile, "official_action_plan");
    assert.ok(analysis.paragraphs.includes("Army Claw 표준문서 자동화 기능 검증 계획"));
    assert.ok(analysis.tables.some((table) => table.style === "approval"));
    assert.ok(analysis.tables.some((table) => table.style === "schedule"));
    assert.ok(analysis.tables.some((table) => table.hasMergedCells));
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("creates a structure manifest from a generated reference profile sample", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "army-claw-reference-manifest-"));
  try {
    const outputPath = "outputs/official-action-plan-sample.hwpx";
    await generateReferenceProfileSample({
      workspace,
      outputPath,
      profileId: "official_action_plan",
    });

    const manifest = await createHwpReferenceManifest({
      workspace,
      hwpxPath: outputPath,
      profileId: "official_action_plan",
      sourceFile: "official-action-plan-sample.hwp",
      convertedFile: outputPath,
    });

    assert.equal(manifest.profile_id, "official_action_plan");
    assert.equal(manifest.conversion_valid, true);
    assert.equal(manifest.validation.native_table_wrapper_validation, "passed");
    assert.ok(manifest.table_patterns.some((table) => table.role === "approval"));
    assert.ok(manifest.table_patterns.some((table) => table.role === "schedule"));
    assert.ok(manifest.table_patterns.some((table) => table.merged_cells.length > 0));
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

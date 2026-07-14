import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  analyzeHwpxTemplate,
  generateMinimalNativeTableHwpxDocument,
  validateHwpxPackage,
} from "./army-claw-hancom-tools.mjs";

test("generates a minimal native table document inside a paragraph run wrapper", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "army-claw-minimal-table-"));
  try {
    const outputPath = "outputs/minimal-table.hwpx";
    await generateMinimalNativeTableHwpxDocument({ workspace, outputPath });

    const validation = await validateHwpxPackage({ workspace, path: outputPath });
    const analysis = await analyzeHwpxTemplate({ workspace, path: outputPath });

    assert.equal(validation.valid, true);
    assert.equal(validation.native_table_wrapper_validation, "passed");
    assert.equal(validation.native_table_visual_status, "user_confirmation_pending");
    assert.equal(analysis.tableCount, 1);
    assert.equal(analysis.nativeTableWrapperValidation.passed, true);

    const [table] = analysis.tables;
    assert.equal(table.title, "검증 표");
    assert.equal(table.rowCount, 3);
    assert.equal(table.columnCount, 3);
    assert.deepEqual(table.rows[0], ["구분", "검증 내용", "결과"]);
    assert.deepEqual(table.rows[1], ["표 구조", "테이블 부모 구조 적용", "확인"]);
    assert.deepEqual(table.rows[2], ["셀 편집", "한글 2024 셀 커서 진입", "확인"]);
    assert.equal(table.wrapper.directSectionChild, false);
    assert.equal(table.wrapper.insideParagraph, true);
    assert.equal(table.wrapper.insideRun, true);
    assert.match(table.wrapper.path, /hp:p>hp:run>hp:tbl/u);

    assert.deepEqual(analysis.paragraphs.slice(0, 2), ["HWPX 테이블 최소 검증", "위 본문 문단입니다."]);
    assert.equal(analysis.paragraphs.at(-1), "표 아래 본문 문단입니다.");
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

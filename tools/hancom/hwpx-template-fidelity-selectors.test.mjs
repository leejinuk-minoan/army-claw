import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  analyzeHwpxTemplate,
  applyHwpxTemplateFidelityFill,
  planHwpxTemplateFidelityFill,
} from "./army-claw-hancom-tools.mjs";

const require = createRequire(pathToFileURL(join(process.env.ARMY_CLAW_NODE_MODULES || join(process.cwd(), "release/army-claw-openclaw-beta/app/node_modules"), ".loader.cjs")));
const JSZip = require("jszip");

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function writeSelectorFixture(path) {
  const zip = new JSZip();
  zip.file("mimetype", "application/hwp+zip", { compression: "STORE" });
  zip.file("Contents/content.hpf", "<?xml version=\"1.0\" encoding=\"UTF-8\"?><package><metadata><title>selector fixture</title></metadata></package>");
  zip.file("BinData/image1.PNG", Buffer.from("selector-image"));
  zip.file("Preview/PrvText.txt", "첫 제목\n둘째 제목\n개요\n본문 대상\n기관명");
  zip.file("Contents/section0.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<hs:sec xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph" xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section">
  <hp:p id="p1" paraPrIDRef="1" styleIDRef="0"><hp:run charPrIDRef="7"><hp:t>첫 </hp:t></hp:run><hp:run charPrIDRef="7"><hp:t>제목</hp:t></hp:run></hp:p>
  <hp:p id="p2" paraPrIDRef="1" styleIDRef="0"><hp:run charPrIDRef="7"><hp:t>둘째 제목</hp:t></hp:run></hp:p>
  <hp:p id="p3" paraPrIDRef="1" styleIDRef="0"><hp:run charPrIDRef="0"><hp:t>개요</hp:t></hp:run></hp:p>
  <hp:p id="p4" paraPrIDRef="1" styleIDRef="0"><hp:run charPrIDRef="0"><hp:t>개요</hp:t></hp:run></hp:p>
  <hp:p id="p5" paraPrIDRef="1" styleIDRef="0"><hp:run charPrIDRef="0"><hp:t>본문 대상 문단입니다</hp:t></hp:run></hp:p>
  <hp:p id="p6" paraPrIDRef="1" styleIDRef="0">
    <hp:run charPrIDRef="0"><hp:tbl id="1" zOrder="1" numberingType="TABLE" textWrap="TOP_AND_BOTTOM" textFlow="BOTH_SIDES" lock="0" dropcapstyle="None" pageBreak="CELL" repeatHeader="1" rowCnt="1" colCnt="1" cellSpacing="0" borderFillIDRef="4" noAdjust="0"><hp:sz width="1000" widthRelTo="ABSOLUTE" height="1000" heightRelTo="ABSOLUTE" protect="0"/><hp:pos treatAsChar="0" horzRelTo="COLUMN" horzAlign="CENTER" vertRelTo="PARA" vertAlign="TOP"/><hp:tr><hp:tc hasMargin="1" borderFillIDRef="9"><hp:subList><hp:p><hp:run><hp:t>기관명</hp:t></hp:run></hp:p></hp:subList><hp:cellAddr colAddr="0" rowAddr="0"/><hp:cellSpan colSpan="1" rowSpan="1"/><hp:cellSz width="1000" height="1000"/></hp:tc></hp:tr></hp:tbl></hp:run>
  </hp:p>
</hs:sec>`);
  await writeFile(path, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

test("plans multiple strict selectors without creating output", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "army-claw-selectors-plan-"));
  try {
    await mkdir(join(workspace, "templates"), { recursive: true });
    await writeSelectorFixture(join(workspace, "templates/source.hwpx"));

    const plan = await planHwpxTemplateFidelityFill({
      workspace,
      templatePath: "templates/source.hwpx",
      outputPath: "outputs/dry-run.hwpx",
      replacements: [
        { selector: { type: "paragraph_text", source_text: "첫 제목", expected_matches: 1 }, replacement_text: "Army Claw 템플릿 충실도 검증 문서" },
        { selector: { type: "paragraph_text", source_text: "개요", occurrence: 2, expected_matches: 2 }, replacement_text: "선택된 두 번째 개요" },
        { selector: { type: "paragraph_contains", contains_text: "본문 대상", expected_matches_min: 1 }, replacement_text: "본문 대상 치환" },
        { selector: { type: "table_cell", table_path: "section[0]/table[0]", row: 0, col: 0, expected_text: "기관명" }, replacement_text: "Army Claw 개발팀" },
      ],
      dryRun: true,
    });

    assert.equal(plan.can_apply, true);
    assert.equal(plan.selectors.length, 4);
    assert.deepEqual(plan.selectors.map((item) => item.match_count), [1, 2, 1, 1]);
    assert.equal(plan.selectors[1].selected_matches[0].paragraph_id, "p4");
    assert.equal(plan.selectors[3].selected_matches[0].table_path, "section[0]/table[0]");
    await assert.rejects(readFile(join(workspace, "outputs/dry-run.hwpx")));
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("applies paragraph and table cell selectors while preserving structure", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "army-claw-selectors-apply-"));
  try {
    await mkdir(join(workspace, "templates"), { recursive: true });
    await mkdir(join(workspace, "outputs"), { recursive: true });
    const source = join(workspace, "templates/source.hwpx");
    await writeSelectorFixture(source);
    const beforeZip = await JSZip.loadAsync(await readFile(source));
    const beforeImageHash = sha256(await beforeZip.file("BinData/image1.PNG").async("nodebuffer"));

    const result = await applyHwpxTemplateFidelityFill({
      workspace,
      templatePath: "templates/source.hwpx",
      outputPath: "outputs/filled.hwpx",
      replacements: [
        { selector: { type: "paragraph_text", source_text: "첫 제목", expected_matches: 1 }, replacement_text: "Army Claw 템플릿 충실도 검증 문서" },
        { selector: { type: "paragraph_text", source_text: "둘째 제목", expected_matches: 1 }, replacement_text: "표준문서 자동화 엔진 개발" },
        { selector: { type: "paragraph_contains", contains_text: "본문 대상", expected_matches: 1 }, replacement_text: "HWPX 템플릿 기반 자동화 구조 분석" },
        { selector: { type: "table_cell", table_path: "section[0]/table[0]", row: 0, col: 0, expected_text: "기관명" }, replacement_text: "Army Claw 개발팀" },
      ],
    });

    const afterZip = await JSZip.loadAsync(await readFile(join(workspace, "outputs/filled.hwpx")));
    const afterImageHash = sha256(await afterZip.file("BinData/image1.PNG").async("nodebuffer"));
    const analysis = await analyzeHwpxTemplate({ workspace, path: "outputs/filled.hwpx" });

    assert.equal(result.replacementsApplied, 4);
    assert.equal(result.plan.can_apply, true);
    assert.equal(beforeImageHash, afterImageHash);
    assert.equal(analysis.tableCount, 1);
    assert.equal(analysis.paragraphCount, 6);
    assert.ok(analysis.text.includes("Army Claw 템플릿 충실도 검증 문서"));
    assert.ok(analysis.text.includes("표준문서 자동화 엔진 개발"));
    assert.ok(analysis.text.includes("HWPX 템플릿 기반 자동화 구조 분석"));
    assert.equal(analysis.tables[0].cells[0].text, "Army Claw 개발팀");
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("rejects strict match mismatch without writing partial output", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "army-claw-selectors-strict-"));
  try {
    await mkdir(join(workspace, "templates"), { recursive: true });
    await writeSelectorFixture(join(workspace, "templates/source.hwpx"));

    await assert.rejects(
      applyHwpxTemplateFidelityFill({
        workspace,
        templatePath: "templates/source.hwpx",
        outputPath: "outputs/failed.hwpx",
        replacements: [
          { selector: { type: "table_cell", table_path: "section[0]/table[0]", row: 0, col: 0, expected_text: "다른 기관" }, replacement_text: "Army Claw 개발팀" },
        ],
      }),
      /expected_text mismatch/u,
    );
    await assert.rejects(readFile(join(workspace, "outputs/failed.hwpx")));
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

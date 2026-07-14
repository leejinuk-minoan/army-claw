import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import {
  applyHwpxTemplateFidelityFill,
  analyzeHwpxTemplate,
  validateHwpxPackage,
} from "./army-claw-hancom-tools.mjs";

const require = createRequire(pathToFileURL(join(process.env.ARMY_CLAW_NODE_MODULES || join(process.cwd(), "release/army-claw-openclaw-beta/app/node_modules"), ".loader.cjs")));
const JSZip = require("jszip");

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function writeFixtureHwpx(path) {
  const zip = new JSZip();
  zip.file("mimetype", "application/hwp+zip", { compression: "STORE" });
  zip.file("Contents/content.hpf", "<?xml version=\"1.0\" encoding=\"UTF-8\"?><package><metadata><title>fixture</title></metadata></package>");
  zip.file("BinData/image1.PNG", Buffer.from("image-payload"));
  zip.file("Preview/PrvText.txt", "원본 제목\n원본 본문");
  zip.file("Contents/section0.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<hs:sec xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph" xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section">
  <hp:p id="1" paraPrIDRef="1" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0">
    <hp:run charPrIDRef="7"><hp:t>원본 </hp:t></hp:run><hp:run charPrIDRef="7"><hp:t>제목</hp:t></hp:run>
  </hp:p>
  <hp:p id="2" paraPrIDRef="1" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0">
    <hp:run charPrIDRef="0"><hp:t>바꾸지 않을 문단</hp:t></hp:run>
  </hp:p>
  <hp:p id="3" paraPrIDRef="1" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0">
    <hp:run charPrIDRef="0"><hp:tbl id="1" zOrder="1" numberingType="TABLE" textWrap="TOP_AND_BOTTOM" textFlow="BOTH_SIDES" lock="0" dropcapstyle="None" pageBreak="CELL" repeatHeader="1" rowCnt="1" colCnt="1" cellSpacing="0" borderFillIDRef="4" noAdjust="0"><hp:sz width="1000" widthRelTo="ABSOLUTE" height="1000" heightRelTo="ABSOLUTE" protect="0"/><hp:pos treatAsChar="0" horzRelTo="COLUMN" horzAlign="CENTER" vertRelTo="PARA" vertAlign="TOP"/><hp:tr><hp:tc hasMargin="1" borderFillIDRef="9"><hp:subList><hp:p><hp:run><hp:t>표 셀</hp:t></hp:run></hp:p></hp:subList><hp:cellAddr colAddr="0" rowAddr="0"/><hp:cellSpan colSpan="1" rowSpan="1"/><hp:cellSz width="1000" height="1000"/></hp:tc></hp:tr></hp:tbl></hp:run>
  </hp:p>
</hs:sec>`);
  await writeFile(path, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

test("fills only selected template text while preserving package structure and BinData", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "army-claw-template-fidelity-"));
  try {
    await mkdir(join(workspace, "templates"), { recursive: true });
    await mkdir(join(workspace, "outputs"), { recursive: true });
    const templatePath = join(workspace, "templates/source.hwpx");
    await writeFixtureHwpx(templatePath);
    const beforeZip = await JSZip.loadAsync(await readFile(templatePath));
    const beforeImageHash = sha256(await beforeZip.file("BinData/image1.PNG").async("nodebuffer"));

    const result = await applyHwpxTemplateFidelityFill({
      workspace,
      templatePath: "templates/source.hwpx",
      outputPath: "outputs/filled.hwpx",
      replacements: [
        {
          selector: { type: "paragraph_text", source_text: "원본 제목" },
          replacement_text: "Army Claw 표준문서 자동화 엔진",
        },
      ],
    });

    const validation = await validateHwpxPackage({ workspace, path: "outputs/filled.hwpx" });
    const analysis = await analyzeHwpxTemplate({ workspace, path: "outputs/filled.hwpx" });
    const afterZip = await JSZip.loadAsync(await readFile(join(workspace, "outputs/filled.hwpx")));
    const afterImageHash = sha256(await afterZip.file("BinData/image1.PNG").async("nodebuffer"));

    assert.equal(result.saved, true);
    assert.equal(result.replacementsApplied, 1);
    assert.equal(validation.valid, true);
    assert.equal(beforeImageHash, afterImageHash);
    assert.equal(analysis.tableCount, 1);
    assert.ok(analysis.paragraphs.includes("Army Claw 표준문서 자동화 엔진"));
    assert.ok(analysis.paragraphs.includes("바꾸지 않을 문단"));
    assert.ok(analysis.paragraphs.includes("표 셀"));
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

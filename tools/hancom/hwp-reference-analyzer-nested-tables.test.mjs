import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { analyzeHwpxTemplate } from "./army-claw-hancom-tools.mjs";

const require = createRequire(pathToFileURL(join(process.env.ARMY_CLAW_NODE_MODULES || join(process.cwd(), "release/army-claw-openclaw-beta/app/node_modules"), ".loader.cjs")));
const JSZip = require("jszip");

async function writeNestedTableFixture(path) {
  const zip = new JSZip();
  zip.file("mimetype", "application/hwp+zip", { compression: "STORE" });
  zip.file("Contents/content.hpf", "<?xml version=\"1.0\" encoding=\"UTF-8\"?><package><metadata><title>nested fixture</title></metadata></package>");
  zip.file("Preview/PrvText.txt", "외부\n내부");
  zip.file("Contents/section0.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<hs:sec xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph" xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section">
  <hp:p id="p1"><hp:run><hp:tbl id="outer" rowCnt="1" colCnt="2" cellSpacing="0" borderFillIDRef="4">
    <hp:sz width="2000" widthRelTo="ABSOLUTE" height="1000" heightRelTo="ABSOLUTE" protect="0"/>
    <hp:pos treatAsChar="0" horzRelTo="COLUMN" horzAlign="CENTER" vertRelTo="PARA" vertAlign="TOP"/>
    <hp:tr>
      <hp:tc hasMargin="1" borderFillIDRef="9"><hp:subList><hp:p><hp:run><hp:t>외부 A</hp:t></hp:run></hp:p></hp:subList><hp:cellAddr colAddr="0" rowAddr="0"/><hp:cellSpan colSpan="1" rowSpan="1"/><hp:cellSz width="1000" height="1000"/></hp:tc>
      <hp:tc hasMargin="1" borderFillIDRef="9"><hp:subList><hp:p><hp:run><hp:t>외부 B</hp:t></hp:run><hp:tbl id="inner" rowCnt="1" colCnt="1" cellSpacing="0" borderFillIDRef="4">
        <hp:sz width="1000" widthRelTo="ABSOLUTE" height="600" heightRelTo="ABSOLUTE" protect="0"/>
        <hp:pos treatAsChar="0" horzRelTo="COLUMN" horzAlign="CENTER" vertRelTo="PARA" vertAlign="TOP"/>
        <hp:tr><hp:tc hasMargin="1" borderFillIDRef="9"><hp:subList><hp:p><hp:run><hp:t>내부 A</hp:t></hp:run></hp:p></hp:subList><hp:cellAddr colAddr="0" rowAddr="0"/><hp:cellSpan colSpan="1" rowSpan="1"/><hp:cellSz width="1000" height="600"/></hp:tc></hp:tr>
      </hp:tbl></hp:p></hp:subList><hp:cellAddr colAddr="1" rowAddr="0"/><hp:cellSpan colSpan="1" rowSpan="1"/><hp:cellSz width="1000" height="1000"/></hp:tc>
    </hp:tr>
  </hp:tbl></hp:run></hp:p>
</hs:sec>`);
  await writeFile(path, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

test("analyzes nested tables as separate direct-child table nodes", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "army-claw-nested-tables-"));
  try {
    await mkdir(join(workspace, "templates"), { recursive: true });
    await writeNestedTableFixture(join(workspace, "templates/nested.hwpx"));

    const analysis = await analyzeHwpxTemplate({ workspace, path: "templates/nested.hwpx" });

    assert.equal(analysis.tableCount, 2);
    assert.equal(analysis.tables[0].path, "section[0]/table[0]");
    assert.equal(analysis.tables[0].rowCount, 1);
    assert.equal(analysis.tables[0].columnCount, 2);
    assert.deepEqual(analysis.tables[0].cells.map((cell) => cell.text), ["외부 A", "외부 B"]);
    assert.equal(analysis.tables[1].path, "section[0]/table[0]/cell[0,1]/table[0]");
    assert.equal(analysis.tables[1].parentPath, "section[0]/table[0]");
    assert.equal(analysis.tables[1].rowCount, 1);
    assert.equal(analysis.tables[1].columnCount, 1);
    assert.equal(analysis.tables[1].cells[0].text, "내부 A");
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

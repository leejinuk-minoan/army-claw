import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { createNativeStructureDiff } from "./hwpx-native-structure-diff.mjs";

const requireFromPackage = createRequire(pathToFileURL(join(process.env.ARMY_CLAW_NODE_MODULES || join(process.cwd(), "node_modules"), ".army-claw-loader.cjs")));
const JSZip = requireFromPackage("jszip");

async function writeHwpx(path, { sectionXml, headerXml = "<hh:head/>" }) {
  const zip = new JSZip();
  zip.file("mimetype", "application/hwp+zip", { compression: "STORE" });
  zip.file("Contents/header.xml", headerXml);
  zip.file("Contents/section0.xml", sectionXml);
  zip.file("Contents/content.hpf", "<package/>");
  await writeFile(path, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

test("compares native and generated HWPX table, footer, and PAGE structures", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "army-claw-hwpx-diff-"));
  try {
    const nativeSection = '<hs:sec xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph" xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section"><hp:ctrl><hp:footer><hp:subList><hp:p><hp:run><hp:t>footer</hp:t></hp:run><hp:run><hp:ctrl><hp:autoNum numType="PAGE"/></hp:ctrl></hp:run></hp:p></hp:subList></hp:footer></hp:ctrl><hp:tbl rowCnt="1" colCnt="1"><hp:pos treatAsChar="0" horzRelTo="COLUMN" horzAlign="CENTER"/><hp:tr><hp:tc hasMargin="1"><hp:subList><hp:p><hp:run><hp:t>A</hp:t></hp:run></hp:p></hp:subList><hp:cellAddr colAddr="0" rowAddr="0"/><hp:cellSpan colSpan="1" rowSpan="1"/><hp:cellSz width="100" height="100"/><hp:cellMargin left="1" right="1" top="1" bottom="1"/></hp:tc></hp:tr></hp:tbl></hs:sec>';
    const generatedSection = '<hs:sec xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph" xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section"><hp:tbl rowCnt="1" colCnt="1"><hp:pos treatAsChar="1" horzRelTo="PARA" horzAlign="LEFT"/><hp:tr><hp:tc hasMargin="0"><hp:subList><hp:p><hp:run><hp:t>A</hp:t></hp:run></hp:p></hp:subList><hp:cellAddr colAddr="0" rowAddr="0"/><hp:cellSpan colSpan="1" rowSpan="1"/><hp:cellSz width="100" height="100"/><hp:cellMargin left="1" right="1" top="1" bottom="1"/></hp:tc></hp:tr></hp:tbl></hs:sec>';
    await writeHwpx(join(workspace, "native.hwpx"), { sectionXml: nativeSection });
    await writeHwpx(join(workspace, "generated.hwpx"), { sectionXml: generatedSection });

    const diff = await createNativeStructureDiff({
      nativePath: join(workspace, "native.hwpx"),
      generatedPath: join(workspace, "generated.hwpx"),
    });

    assert.equal(diff.native.tableCount, 1);
    assert.equal(diff.generated.tableCount, 1);
    assert.equal(diff.differences.tableAnchorDifferent, true);
    assert.equal(diff.differences.footerDifferent, true);
    assert.equal(diff.differences.pageFieldDifferent, true);
    assert.equal(diff.native.tables[0].position.treatAsChar, "0");
    assert.equal(diff.generated.tables[0].position.treatAsChar, "1");
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

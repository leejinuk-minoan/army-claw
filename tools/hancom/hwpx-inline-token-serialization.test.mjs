import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { analyzeHwpxTemplate, applyHwpxTemplateFidelityFill } from "./army-claw-hancom-tools.mjs";

const require = createRequire(pathToFileURL(join(process.env.ARMY_CLAW_NODE_MODULES || join(process.cwd(), "release/army-claw-openclaw-beta/app/node_modules"), ".loader.cjs")));
const JSZip = require("jszip");

async function writeInlineFixture(path) {
  const zip = new JSZip();
  zip.file("mimetype", "application/hwp+zip", { compression: "STORE" });
  zip.file("Contents/content.hpf", "<?xml version=\"1.0\" encoding=\"UTF-8\"?><package><metadata><title>inline fixture</title></metadata></package>");
  zip.file("Preview/PrvText.txt", "A B");
  zip.file("Contents/section0.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<hs:sec xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph" xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section">
  <hp:p id="p1"><hp:run charPrIDRef="0"><hp:t>A</hp:t><hp:fwSpace/><hp:t>B</hp:t></hp:run></hp:p>
</hs:sec>`);
  await writeFile(path, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

test("replacement text never serializes literal hp inline markers into hp:t or preview text", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "army-claw-inline-"));
  try {
    await mkdir(join(workspace, "templates"), { recursive: true });
    await mkdir(join(workspace, "outputs"), { recursive: true });
    await writeInlineFixture(join(workspace, "templates/source.hwpx"));

    await applyHwpxTemplateFidelityFill({
      workspace,
      templatePath: "templates/source.hwpx",
      outputPath: "outputs/inline.hwpx",
      replacements: [
        {
          selector: { type: "paragraph_contains", contains_text: "A B", expected_matches: 1 },
          replacement_text: "A<hp:fwSpace/>C",
        },
      ],
    });
    const zip = await JSZip.loadAsync(await readFile(join(workspace, "outputs/inline.hwpx")));
    const xml = await zip.file("Contents/section0.xml").async("string");
    const preview = await zip.file("Preview/PrvText.txt").async("string");
    const analysis = await analyzeHwpxTemplate({ workspace, path: "outputs/inline.hwpx" });

    assert.doesNotMatch(xml, /<hp:t>[^<]*<hp:/u);
    assert.doesNotMatch(preview, /<hp:fwSpace\/>/u);
    assert.deepEqual(analysis.paragraphs, ["A C"]);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

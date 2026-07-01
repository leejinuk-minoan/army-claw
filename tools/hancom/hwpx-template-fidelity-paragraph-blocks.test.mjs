import test from "node:test";
import assert from "node:assert/strict";
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

async function writeBlockFixture(path) {
  const zip = new JSZip();
  zip.file("mimetype", "application/hwp+zip", { compression: "STORE" });
  zip.file("Contents/content.hpf", "<?xml version=\"1.0\" encoding=\"UTF-8\"?><package><metadata><title>block fixture</title></metadata></package>");
  zip.file("BinData/image1.PNG", Buffer.from("image"));
  zip.file("Preview/PrvText.txt", "PAGE 2\nProblem\nold sentence 1\nold sentence 2\nImprove\nPAGE 3");
  zip.file("Contents/section0.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<hs:sec xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph" xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section">
  <hp:p id="p1"><hp:run charPrIDRef="0"><hp:t>PAGE 2</hp:t></hp:run></hp:p>
  <hp:p id="p2"><hp:run charPrIDRef="0"><hp:t>Problem</hp:t></hp:run></hp:p>
  <hp:p id="p3"><hp:run charPrIDRef="0"><hp:t>old sentence 1</hp:t></hp:run></hp:p>
  <hp:p id="p4"><hp:run charPrIDRef="0"><hp:t>old sentence 2</hp:t></hp:run></hp:p>
  <hp:p id="p5"><hp:run charPrIDRef="0"><hp:t>Improve</hp:t></hp:run></hp:p>
  <hp:p id="p6"><hp:run charPrIDRef="0"><hp:t>PAGE 3</hp:t></hp:run></hp:p>
</hs:sec>`);
  await writeFile(path, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

test("paragraph_block previews and applies preserve replacements without changing paragraph count", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "army-claw-block-preserve-"));
  try {
    await mkdir(join(workspace, "templates"), { recursive: true });
    await mkdir(join(workspace, "outputs"), { recursive: true });
    await writeBlockFixture(join(workspace, "templates/source.hwpx"));

    const replacements = [
      {
        selector: {
          type: "paragraph_block",
          start: { contains_text: "Problem" },
          end: { contains_text: "Improve" },
          end_inclusive: false,
          expected_blocks: 1,
          paragraph_count_policy: "preserve",
        },
        replacement_paragraphs: ["Problem: semantic block replaced", "layout-preserving second sentence"],
      },
    ];

    const plan = await planHwpxTemplateFidelityFill({
      workspace,
      templatePath: "templates/source.hwpx",
      outputPath: "outputs/filled.hwpx",
      replacements,
    });

    assert.equal(plan.can_apply, true);
    assert.equal(plan.selectors[0].block.selected_paragraph_count, 3);
    assert.equal(plan.selectors[0].block.replacement_paragraph_count, 2);
    assert.equal(plan.selectors[0].block.selected[0].text, "Problem");
    assert.equal(plan.selectors[0].block.after[0].text, "Improve");

    const result = await applyHwpxTemplateFidelityFill({
      workspace,
      templatePath: "templates/source.hwpx",
      outputPath: "outputs/filled.hwpx",
      replacements,
    });
    const analysis = await analyzeHwpxTemplate({ workspace, path: "outputs/filled.hwpx" });

    assert.equal(result.replacementsApplied, 3);
    assert.equal(analysis.paragraphCount, 6);
    assert.deepEqual(analysis.paragraphs, [
      "PAGE 2",
      "Problem: semantic block replaced",
      "layout-preserving second sentence",
      "",
      "Improve",
      "PAGE 3",
    ]);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("paragraph_block preserve rejects extra replacement paragraphs", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "army-claw-block-too-many-"));
  try {
    await mkdir(join(workspace, "templates"), { recursive: true });
    await writeBlockFixture(join(workspace, "templates/source.hwpx"));

    await assert.rejects(
      applyHwpxTemplateFidelityFill({
        workspace,
        templatePath: "templates/source.hwpx",
        outputPath: "outputs/failed.hwpx",
        replacements: [
          {
            selector: {
              type: "paragraph_block",
              start: { contains_text: "Problem" },
              end: { contains_text: "Improve" },
              paragraph_count_policy: "preserve",
            },
            replacement_paragraphs: ["a", "b", "c", "d"],
          },
        ],
      }),
      /replacement_paragraphs_exceed_selected/u,
    );
    await assert.rejects(readFile(join(workspace, "outputs/failed.hwpx")));
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

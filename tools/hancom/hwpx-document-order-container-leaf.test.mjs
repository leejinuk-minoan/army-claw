import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { planHwpxTemplateFidelityFill } from "./army-claw-hancom-tools.mjs";

const require = createRequire(pathToFileURL(join(process.env.ARMY_CLAW_NODE_MODULES || join(process.cwd(), "release/army-claw-openclaw-beta/app/node_modules"), ".loader.cjs")));
const JSZip = require("jszip");

async function writeContainerFixture(path) {
  const zip = new JSZip();
  zip.file("mimetype", "application/hwp+zip", { compression: "STORE" });
  zip.file("Contents/content.hpf", "<?xml version=\"1.0\" encoding=\"UTF-8\"?><package><metadata><title>container fixture</title></metadata></package>");
  zip.file("Preview/PrvText.txt", "Before\nCell body\nDraw text\nAfter");
  zip.file("Contents/section0.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<hs:sec xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph" xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section">
  <hp:p id="before"><hp:run charPrIDRef="0"><hp:t>Before</hp:t></hp:run></hp:p>
  <hp:p id="container"><hp:run><hp:tbl><hp:tr><hp:tc><hp:subList><hp:p id="cellp"><hp:run charPrIDRef="1"><hp:t>Cell body</hp:t></hp:run></hp:p></hp:subList><hp:cellAddr colAddr="0" rowAddr="0"/></hp:tc></hp:tr></hp:tbl></hp:run></hp:p>
  <hp:p id="shape"><hp:run><hp:rect><hp:drawText><hp:p id="drawp"><hp:run charPrIDRef="2"><hp:t>Draw text</hp:t></hp:run></hp:p></hp:drawText></hp:rect></hp:run></hp:p>
  <hp:p id="after"><hp:run charPrIDRef="0"><hp:t>After</hp:t></hp:run></hp:p>
</hs:sec>`);
  await writeFile(path, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

test("DocumentOrderIndex excludes structural containers from normal paragraph selectors and exposes leaf paths", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "army-claw-container-leaf-"));
  try {
    await mkdir(join(workspace, "templates"), { recursive: true });
    await writeContainerFixture(join(workspace, "templates/source.hwpx"));

    const plan = await planHwpxTemplateFidelityFill({
      workspace,
      templatePath: "templates/source.hwpx",
      outputPath: "outputs/filled.hwpx",
      replacements: [
        {
          selector: { type: "paragraph_contains", contains_text: "Cell body", expected_matches: 1 },
          replacement_text: "Cell replacement",
        },
        {
          selector: { type: "paragraph_contains", contains_text: "Draw text", expected_matches: 1 },
          replacement_text: "Draw replacement",
        },
      ],
    });

    assert.equal(plan.can_apply, true);
    assert.equal(plan.selectors[0].selected_matches[0].node_type, "table_cell_paragraph");
    assert.match(plan.selectors[0].selected_matches[0].node_path, /table\[0\]\/cell\[0,0\]\/paragraph\[0\]/u);
    assert.equal(plan.selectors[1].selected_matches[0].node_type, "draw_text_paragraph");
    assert.match(plan.selectors[1].selected_matches[0].node_path, /shape\[0\]\/drawText\/paragraph\[0\]/u);
    assert.equal(plan.structural_containers_skipped >= 2, true);
    assert.equal(plan.ancestor_descendant_conflicts.length, 0);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("plan rejects duplicate leaf replacement selected by overlapping selectors", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "army-claw-duplicate-leaf-"));
  try {
    await mkdir(join(workspace, "templates"), { recursive: true });
    await writeContainerFixture(join(workspace, "templates/source.hwpx"));

    const plan = await planHwpxTemplateFidelityFill({
      workspace,
      templatePath: "templates/source.hwpx",
      outputPath: "outputs/failed.hwpx",
      replacements: [
        { selector: { type: "paragraph_contains", contains_text: "Cell", expected_matches: 1 }, replacement_text: "A" },
        { selector: { type: "paragraph_contains", contains_text: "Cell body", expected_matches: 1 }, replacement_text: "B" },
      ],
    });

    assert.equal(plan.can_apply, false);
    assert.match(plan.errors.join(";"), /duplicate_leaf_replacement/u);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

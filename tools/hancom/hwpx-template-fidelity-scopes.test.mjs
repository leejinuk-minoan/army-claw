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

async function writeScopeFixture(path) {
  const zip = new JSZip();
  zip.file("mimetype", "application/hwp+zip", { compression: "STORE" });
  zip.file("Contents/content.hpf", "<?xml version=\"1.0\" encoding=\"UTF-8\"?><package><metadata><title>scope fixture</title></metadata></package>");
  zip.file("Preview/PrvText.txt", "PAGE 1\nDUPLICATE\nPAGE 2\nDUPLICATE\nPAGE 3\nDUPLICATE");
  zip.file("Contents/section0.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<hs:sec xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph" xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section">
  <hp:p id="p1"><hp:run charPrIDRef="0"><hp:t>PAGE 1</hp:t></hp:run></hp:p>
  <hp:p id="p2"><hp:run charPrIDRef="0"><hp:t>DUPLICATE</hp:t></hp:run></hp:p>
  <hp:p id="p3"><hp:run charPrIDRef="0"><hp:t>PAGE 2</hp:t></hp:run></hp:p>
  <hp:p id="p4"><hp:run charPrIDRef="0"><hp:t>DUPLICATE</hp:t></hp:run></hp:p>
  <hp:p id="p5"><hp:run charPrIDRef="0"><hp:t>PAGE 3</hp:t></hp:run></hp:p>
  <hp:p id="p6"><hp:run charPrIDRef="0"><hp:t>DUPLICATE</hp:t></hp:run></hp:p>
</hs:sec>`);
  await writeFile(path, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

test("anchor_range scopes restrict selectors to paragraphs between anchors", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "army-claw-scope-range-"));
  try {
    await mkdir(join(workspace, "templates"), { recursive: true });
    await mkdir(join(workspace, "outputs"), { recursive: true });
    await writeScopeFixture(join(workspace, "templates/source.hwpx"));

    const scopes = [
      {
        id: "page_2",
        type: "anchor_range",
        start: { type: "paragraph_contains", text: "PAGE 2", expected_matches: 1 },
        end: { type: "paragraph_contains", text: "PAGE 3", expected_matches: 1 },
        include_start: true,
        include_end: false,
      },
    ];

    const plan = await planHwpxTemplateFidelityFill({
      workspace,
      templatePath: "templates/source.hwpx",
      outputPath: "outputs/scoped.hwpx",
      scopes,
      replacements: [
        {
          scope_id: "page_2",
          selector: { type: "paragraph_text", source_text: "DUPLICATE", expected_matches: 1 },
          replacement_text: "SCOPED ONLY",
        },
      ],
    });

    assert.equal(plan.can_apply, true);
    assert.equal(plan.scopes[0].id, "page_2");
    assert.equal(plan.scopes[0].start_text, "PAGE 2");
    assert.equal(plan.scopes[0].end_text, "PAGE 3");
    assert.equal(plan.selectors[0].match_count, 1);
    assert.equal(plan.selectors[0].selected_matches[0].paragraph_id, "p4");

    const result = await applyHwpxTemplateFidelityFill({
      workspace,
      templatePath: "templates/source.hwpx",
      outputPath: "outputs/scoped.hwpx",
      scopes,
      replacements: [
        {
          scope_id: "page_2",
          selector: { type: "paragraph_text", source_text: "DUPLICATE", expected_matches: 1 },
          replacement_text: "SCOPED ONLY",
        },
      ],
    });
    const analysis = await analyzeHwpxTemplate({ workspace, path: "outputs/scoped.hwpx" });

    assert.equal(result.replacementsApplied, 1);
    assert.deepEqual(analysis.paragraphs, ["PAGE 1", "DUPLICATE", "PAGE 2", "SCOPED ONLY", "PAGE 3", "DUPLICATE"]);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("anchor_range rejects duplicate anchors before writing output", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "army-claw-scope-duplicate-"));
  try {
    await mkdir(join(workspace, "templates"), { recursive: true });
    await writeScopeFixture(join(workspace, "templates/source.hwpx"));

    await assert.rejects(
      applyHwpxTemplateFidelityFill({
        workspace,
        templatePath: "templates/source.hwpx",
        outputPath: "outputs/failed.hwpx",
        scopes: [
          {
            id: "bad",
            type: "anchor_range",
            start: { type: "paragraph_contains", text: "DUPLICATE", expected_matches: 1 },
            end: { type: "paragraph_contains", text: "PAGE 3", expected_matches: 1 },
          },
        ],
        replacements: [
          { scope_id: "bad", selector: { type: "paragraph_text", source_text: "DUPLICATE" }, replacement_text: "nope" },
        ],
      }),
      /scope_bad_start_expected_matches/u,
    );
    await assert.rejects(readFile(join(workspace, "outputs/failed.hwpx")));
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

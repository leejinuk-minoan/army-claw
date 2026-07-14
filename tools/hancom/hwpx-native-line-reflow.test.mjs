import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  applyHwpxTemplateFidelityFill,
  planHwpxTemplateFidelityFill,
} from "./army-claw-hancom-tools.mjs";

const require = createRequire(pathToFileURL(join(process.env.ARMY_CLAW_NODE_MODULES || join(process.cwd(), "release/army-claw-openclaw-beta/app/node_modules"), ".loader.cjs")));
const JSZip = require("jszip");

async function writeReflowFixture(path) {
  const zip = new JSZip();
  zip.file("mimetype", "application/hwp+zip", { compression: "STORE" });
  zip.file("Contents/content.hpf", "<?xml version=\"1.0\" encoding=\"UTF-8\"?><package><metadata><title>reflow fixture</title></metadata></package>");
  zip.file("Preview/PrvText.txt", "TITLE\nshort body\nfixed footer");
  zip.file("Contents/section0.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<hs:sec xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph" xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section">
  <hp:p id="title"><hp:run charPrIDRef="1"><hp:t>TITLE</hp:t></hp:run><hp:linesegarray><hp:lineseg textpos="0"/></hp:linesegarray></hp:p>
  <hp:p id="body"><hp:run charPrIDRef="2"><hp:t>short body</hp:t></hp:run><hp:linesegarray><hp:lineseg textpos="0"/></hp:linesegarray></hp:p>
  <hp:p id="footer"><hp:run charPrIDRef="3"><hp:t>fixed footer</hp:t></hp:run><hp:linesegarray><hp:lineseg textpos="0"/></hp:linesegarray></hp:p>
</hs:sec>`);
  await writeFile(path, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

async function sectionXml(path) {
  const zip = await JSZip.loadAsync(await readFile(path));
  return zip.file("Contents/section0.xml").async("string");
}

test("allow_line_growth invalidates only target paragraph linesegarray", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "army-claw-reflow-"));
  try {
    await mkdir(join(workspace, "templates"), { recursive: true });
    await mkdir(join(workspace, "outputs"), { recursive: true });
    await writeReflowFixture(join(workspace, "templates/source.hwpx"));

    const result = await applyHwpxTemplateFidelityFill({
      workspace,
      templatePath: "templates/source.hwpx",
      outputPath: "outputs/reflow.hwpx",
      replacements: [
        {
          selector: { type: "paragraph_text", source_text: "short body", expected_matches: 1 },
          replacement_text: "long body sentence that is intentionally longer and must trigger native line reflow",
          layout_policy: "allow_line_growth",
        },
      ],
    });

    assert.equal(result.plan.layout_policies.allow_line_growth, 1);
    assert.equal(result.plan.target_linesegarrays_invalidated, 1);
    assert.equal(result.plan.non_target_linesegarrays_preserved, 2);
    const xml = await sectionXml(join(workspace, "outputs/reflow.hwpx"));
    const bodyParagraph = xml.match(/<hp:p id="body"[\s\S]*?<\/hp:p>/u)?.[0] || "";
    assert.match(xml, /id="title"[\s\S]*?<hp:linesegarray>/u);
    assert.doesNotMatch(bodyParagraph, /<hp:linesegarray>/u);
    assert.match(xml, /id="footer"[\s\S]*?<hp:linesegarray>/u);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("preserve_exact and fit_or_fail reject high overflow without shrinking style", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "army-claw-preserve-exact-"));
  try {
    await mkdir(join(workspace, "templates"), { recursive: true });
    await writeReflowFixture(join(workspace, "templates/source.hwpx"));

    const plan = await planHwpxTemplateFidelityFill({
      workspace,
      templatePath: "templates/source.hwpx",
      outputPath: "outputs/fail.hwpx",
      replacements: [
        {
          selector: { type: "paragraph_text", source_text: "TITLE", expected_matches: 1 },
          replacement_text: "TITLE THAT IS FAR TOO LONG FOR A FIXED HEADER AREA",
          layout_policy: "preserve_exact",
        },
      ],
    });
    assert.equal(plan.can_apply, false);
    assert.match(plan.errors.join(";"), /layout_policy_overflow/u);

    await assert.rejects(
      applyHwpxTemplateFidelityFill({
        workspace,
        templatePath: "templates/source.hwpx",
        outputPath: "outputs/fail.hwpx",
        replacements: [
          {
            selector: { type: "paragraph_text", source_text: "fixed footer", expected_matches: 1 },
            replacement_text: "fixed footer text that cannot fit in the fixed area",
            layout_policy: "fit_or_fail",
          },
        ],
      }),
      /layout_policy_overflow/u,
    );
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

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

async function writeBoardFixture(path) {
  const zip = new JSZip();
  zip.file("mimetype", "application/hwp+zip", { compression: "STORE" });
  zip.file("Contents/content.hpf", "<?xml version=\"1.0\" encoding=\"UTF-8\"?><package><metadata><title>board fixture</title></metadata></package>");
  zip.file("Preview/PrvText.txt", "주 11 - 1\n보조 11 - 1\n주 11 - 2\n보조 11 - 2");
  zip.file("Contents/section0.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<hs:sec xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph" xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section">
  <hp:p id="m1"><hp:run><hp:t>주</hp:t><hp:fwSpace/><hp:t>11 - 1</hp:t></hp:run></hp:p>
  <hp:p id="s1"><hp:run><hp:t>보조</hp:t><hp:fwSpace/><hp:t>11 - 1</hp:t></hp:run></hp:p>
  <hp:p id="m2"><hp:run><hp:t>주</hp:t><hp:fwSpace/><hp:t>11 - 2</hp:t></hp:run></hp:p>
  <hp:p id="s2"><hp:run><hp:t>보조</hp:t><hp:fwSpace/><hp:t>11 - 2</hp:t></hp:run></hp:p>
</hs:sec>`);
  await writeFile(path, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

test("plan exposes logical main/support board metadata with normalized fwSpace", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "army-claw-board-"));
  try {
    await mkdir(join(workspace, "templates"), { recursive: true });
    await writeBoardFixture(join(workspace, "templates/source.hwpx"));

    const plan = await planHwpxTemplateFidelityFill({
      workspace,
      templatePath: "templates/source.hwpx",
      outputPath: "outputs/filled.hwpx",
      replacements: [
        {
          selector: { type: "paragraph_contains", contains_text: "주 11 - 2", expected_matches: 1 },
          replacement_text: "주 11 - 2",
        },
      ],
    });

    assert.equal(plan.boards.length, 4);
    assert.deepEqual(plan.boards.find((board) => board.board_id === "main-2"), {
      board_id: "main-2",
      board_role: "main",
      board_number: 2,
      board_total: 11,
      support_board_id: "support-2",
    });
    assert.deepEqual(plan.boards.find((board) => board.board_id === "support-2"), {
      board_id: "support-2",
      board_role: "support",
      board_number: 2,
      board_total: 11,
      main_board_id: "main-2",
    });
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

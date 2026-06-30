import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  addHwpxParagraph,
  createHwpxDocument,
  detectHancomEnvironment,
  summarizeHwpxDocument,
  resolveWorkspacePath,
  readPromptInput,
  createTemplateBackedHwpxDocument,
  findHancomHwpxTemplate,
  createDocumentFromPrompt,
  normalizeModelResponse,
} from "./army-claw-hancom-tools.mjs";

test("creates and summarizes an HWPX document inside the workspace", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "army-claw-hwpx-"));
  try {
    const created = await createHwpxDocument({
      workspace,
      path: "docs/report.hwpx",
      title: "보고서",
      paragraphs: ["첫 문단", "둘째 문단"],
    });
    const summary = await summarizeHwpxDocument({ workspace, path: "docs/report.hwpx" });

    assert.equal(created.saved, true);
    assert.equal(summary.paragraphCount, 3);
    assert.deepEqual(summary.paragraphs, ["보고서", "첫 문단", "둘째 문단"]);
    assert.equal(summary.text, "보고서\n첫 문단\n둘째 문단");
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("adds a paragraph to an existing HWPX document", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "army-claw-hwpx-"));
  try {
    await createHwpxDocument({ workspace, path: "report.hwpx", title: "초안", paragraphs: ["기존 문단"] });
    await addHwpxParagraph({ workspace, path: "report.hwpx", paragraph: "추가 문단" });

    const summary = await summarizeHwpxDocument({ workspace, path: "report.hwpx" });
    assert.deepEqual(summary.paragraphs, ["초안", "기존 문단", "추가 문단"]);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("rejects workspace escape paths", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "army-claw-hwpx-"));
  try {
    assert.throws(
      () => resolveWorkspacePath(workspace, "../outside.hwpx"),
      /outside the workspace/,
    );
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test("detects Hancom executables from ARMY_CLAW_HANCOM_BIN_DIR", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "army-claw-hancom-bin-"));
  try {
    await mkdir(join(workspace, "Bin"));
    await writeFile(join(workspace, "Bin", "Hwp.exe"), "");
    await writeFile(join(workspace, "Bin", "HCell.exe"), "");
    const status = await detectHancomEnvironment({ candidateDirs: [join(workspace, "Bin")] });

    assert.equal(status.installed, true);
    assert.equal(status.validationLevel, "partial_native_available");
    assert.equal(status.hwp.available, true);
    assert.equal(status.hcell.available, true);
    assert.equal(status.hshow.available, false);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
test("creates an HWPX document from a user prompt and model plan", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "army-claw-prompt-"));
  try {
    const result = await createDocumentFromPrompt({
      workspace,
      prompt: "회의 결과를 한글 보고서로 만들어줘",
      path: "reports/meeting.hwpx",
      modelClient: async ({ prompt }) => {
        assert.match(prompt, /회의 결과/);
        return {
          title: "회의 결과 보고서",
          paragraphs: ["회의 개요", "결정 사항", "후속 조치"],
        };
      },
      open: false,
    });

    assert.equal(result.saved, true);
    assert.equal(result.modelUsed, true);
    assert.equal(result.document.title, "회의 결과 보고서");
    assert.equal(result.path, "reports/meeting.hwpx");

    const summary = await summarizeHwpxDocument({ workspace, path: "reports/meeting.hwpx" });
    assert.deepEqual(summary.paragraphs, ["회의 결과 보고서", "회의 개요", "결정 사항", "후속 조치"]);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
test("reads prompt text from a prompt file", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "army-claw-prompt-file-"));
  try {
    const promptPath = join(workspace, "prompt.txt");
    await writeFile(promptPath, "OpenClaw 기반 Army Claw 보고서를 작성해줘", "utf8");
    const prompt = await readPromptInput({ prompt: "", promptFile: promptPath });
    assert.equal(prompt, "OpenClaw 기반 Army Claw 보고서를 작성해줘");
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
test("recovers a document plan from non JSON model text", () => {
  const plan = normalizeModelResponse("제목: Army Claw 보고서\n\n첫 문단입니다.\n\n둘째 문단입니다.", "fallback prompt");
  assert.equal(plan.title, "Army Claw 보고서");
  assert.deepEqual(plan.paragraphs, ["첫 문단입니다.", "둘째 문단입니다."]);
});
test("creates a template backed HWPX package when a Hancom template is available", async (t) => {
  const template = await findHancomHwpxTemplate();
  if (!template) {
    t.skip("Hancom HWPX template is not installed on this machine");
    return;
  }
  const workspace = await mkdtemp(join(tmpdir(), "army-claw-template-hwpx-"));
  try {
    const result = await createTemplateBackedHwpxDocument({
      workspace,
      path: "reports/template-backed.hwpx",
      title: "OpenClaw 기반 Army Claw 보고서",
      paragraphs: ["빌드 과정", "핵심 기능", "아키텍처"],
      templatePath: template,
    });
    const summary = await summarizeHwpxDocument({ workspace, path: "reports/template-backed.hwpx" });
    assert.equal(result.saved, true);
    assert.equal(result.templateBacked, true);
    assert.equal(summary.paragraphCount, 4);
    assert.equal(summary.paragraphs[0], "OpenClaw 기반 Army Claw 보고서");
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

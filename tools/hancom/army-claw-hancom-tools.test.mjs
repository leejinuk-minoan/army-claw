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
    assert.equal(summary.paragraphCount, 2);
    assert.deepEqual(summary.paragraphs, ["첫 문단", "둘째 문단"]);
    assert.equal(summary.text, "첫 문단\n둘째 문단");
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
    assert.deepEqual(summary.paragraphs, ["기존 문단", "추가 문단"]);
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
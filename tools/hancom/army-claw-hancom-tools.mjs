import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));

function packageRequire() {
  const nodeModules = process.env.ARMY_CLAW_NODE_MODULES || resolve(__dirname, "..", "node_modules");
  return createRequire(pathToFileURL(join(nodeModules, ".army-claw-loader.cjs")));
}

const requireFromPackage = packageRequire();
const JSZip = requireFromPackage("jszip");

const HWPX_SECTION_PATH = "Contents/section0.xml";
const HWPX_NS = "http://www.hancom.co.kr/hwpml/2011/paragraph";

export function resolveWorkspacePath(workspace, relativePath) {
  if (!workspace) throw new Error("workspace is required");
  if (!relativePath) throw new Error("path is required");
  if (isAbsolute(relativePath)) throw new Error("path must be relative to the workspace");
  const root = resolve(workspace);
  const target = resolve(root, relativePath);
  const prefix = root.endsWith("\\") || root.endsWith("/") ? root : root + "\\";
  if (target !== root && !target.toLowerCase().startsWith(prefix.toLowerCase())) {
    throw new Error(`path is outside the workspace: ${relativePath}`);
  }
  return target;
}

function requireHwpxPath(path) {
  if (!path.toLowerCase().endsWith(".hwpx")) throw new Error("only .hwpx files are supported");
}

function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function paragraphXml(text) {
  return `<hp:p><hp:run><hp:t>${escapeXml(text)}</hp:t></hp:run></hp:p>`;
}

function sectionXml(paragraphs) {
  return `<?xml version="1.0" encoding="UTF-8"?><hp:sec xmlns:hp="${HWPX_NS}">${paragraphs.map(paragraphXml).join("")}</hp:sec>`;
}

function contentHpf(title) {
  return `<?xml version="1.0" encoding="UTF-8"?><package><metadata><title>${escapeXml(title)}</title></metadata><manifest><item href="${HWPX_SECTION_PATH}" media-type="application/xml" /></manifest></package>`;
}

export async function createHwpxDocument({ workspace, path, title = "Army Claw 문서", paragraphs = [] }) {
  requireHwpxPath(path);
  const target = resolveWorkspacePath(workspace, path);
  await mkdir(dirname(target), { recursive: true });
  const zip = new JSZip();
  zip.file("mimetype", "application/hwp+zip");
  zip.file("version.xml", '<?xml version="1.0" encoding="UTF-8"?><version app="Army Claw" />');
  zip.file("Contents/content.hpf", contentHpf(title));
  zip.file(HWPX_SECTION_PATH, sectionXml(paragraphs));
  const content = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  await writeFile(target, content);
  return { path, absolutePath: target, saved: true, message: "HWPX document created" };
}

async function loadHwpx(workspace, path) {
  requireHwpxPath(path);
  const target = resolveWorkspacePath(workspace, path);
  const zip = await JSZip.loadAsync(await readFile(target));
  const sectionName = zip.file(HWPX_SECTION_PATH)
    ? HWPX_SECTION_PATH
    : Object.keys(zip.files).find((name) => name.startsWith("Contents/section") && name.endsWith(".xml"));
  if (!sectionName) throw new Error("HWPX section XML was not found");
  const xml = await zip.file(sectionName).async("string");
  return { target, zip, sectionName, xml };
}

function extractParagraphs(xml) {
  const paragraphs = [];
  const pRegex = /<(?:\w+:)?p\b[^>]*>([\s\S]*?)<\/(?:\w+:)?p>/g;
  let pMatch;
  while ((pMatch = pRegex.exec(xml))) {
    const texts = [];
    const tRegex = /<(?:\w+:)?(?:t|text)\b[^>]*>([\s\S]*?)<\/(?:\w+:)?(?:t|text)>/g;
    let tMatch;
    while ((tMatch = tRegex.exec(pMatch[1]))) {
      texts.push(tMatch[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&"));
    }
    if (texts.length) paragraphs.push(texts.join(""));
  }
  return paragraphs;
}

export async function summarizeHwpxDocument({ workspace, path }) {
  const { sectionName, xml } = await loadHwpx(workspace, path);
  const paragraphs = extractParagraphs(xml);
  return {
    path,
    paragraphCount: paragraphs.length,
    paragraphs,
    text: paragraphs.join("\n"),
    compatibilityNote: sectionName === HWPX_SECTION_PATH ? "" : `read from ${sectionName}`,
  };
}

export async function addHwpxParagraph({ workspace, path, paragraph }) {
  const { target, zip, sectionName, xml } = await loadHwpx(workspace, path);
  const nextXml = xml.replace(/<\/(?:\w+:)?sec>\s*$/u, `${paragraphXml(paragraph)}</hp:sec>`);
  zip.file(sectionName, nextXml);
  await writeFile(target, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
  return { path, absolutePath: target, saved: true, message: "paragraph added" };
}

function defaultHancomDirs(env = process.env) {
  const dirs = [];
  if (env.ARMY_CLAW_HANCOM_BIN_DIR) dirs.push(env.ARMY_CLAW_HANCOM_BIN_DIR);
  dirs.push(
    "C:\\Program Files (x86)\\HNC\\Office 2024\\HOffice130\\Bin",
    "C:\\Program Files\\HNC\\Office 2024\\HOffice130\\Bin",
    "C:\\Program Files (x86)\\HNC\\Office 2022\\HOffice120\\Bin",
    "C:\\Program Files\\HNC\\Office 2022\\HOffice120\\Bin",
  );
  return dirs;
}

async function fileExists(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

export async function detectHancomEnvironment({ env = process.env, candidateDirs = defaultHancomDirs(env) } = {}) {
  const apps = {
    hwp: { name: "한글", executable: "Hwp.exe" },
    hcell: { name: "한셀", executable: "HCell.exe" },
    hshow: { name: "한쇼", executable: "HShow.exe" },
  };
  for (const app of Object.values(apps)) {
    app.available = false;
    app.path = "";
    for (const dir of candidateDirs) {
      const candidate = join(dir, app.executable);
      if (await fileExists(candidate)) {
        app.available = true;
        app.path = candidate;
        break;
      }
    }
  }
  const availableCount = Object.values(apps).filter((app) => app.available).length;
  return {
    installed: availableCount > 0,
    validationLevel: availableCount === 3 ? "native_available" : availableCount > 0 ? "partial_native_available" : "file_structure_only",
    hwp: apps.hwp,
    hcell: apps.hcell,
    hshow: apps.hshow,
    message: availableCount === 3 ? "한컴오피스 네이티브 실행을 사용할 수 있습니다." : availableCount > 0 ? "일부 한컴오피스 앱만 감지되었습니다." : "한컴오피스 앱이 감지되지 않았습니다.",
  };
}

export async function openWithHancomHwp({ workspace, path }) {
  const target = resolveWorkspacePath(workspace, path);
  const status = await detectHancomEnvironment();
  if (!status.hwp.available) throw new Error("Hwp.exe was not found. Set ARMY_CLAW_HANCOM_BIN_DIR or install Hancom Office.");
  const child = spawn(status.hwp.path, [target], { detached: true, stdio: "ignore" });
  child.unref();
  return { launched: true, executable: status.hwp.path, path: target };
}

function argValue(args, name, fallback = "") {
  const index = args.indexOf(name);
  return index >= 0 && index + 1 < args.length ? args[index + 1] : fallback;
}

function argValues(args, name) {
  const values = [];
  for (let i = 0; i < args.length; i += 1) if (args[i] === name && i + 1 < args.length) values.push(args[i + 1]);
  return values;
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  let result;
  if (command === "status") {
    result = await detectHancomEnvironment();
  } else if (command === "hwpx-create") {
    result = await createHwpxDocument({ workspace: argValue(args, "--workspace"), path: argValue(args, "--path"), title: argValue(args, "--title", "Army Claw 문서"), paragraphs: argValues(args, "--paragraph") });
    if (args.includes("--open")) result.opened = await openWithHancomHwp({ workspace: argValue(args, "--workspace"), path: argValue(args, "--path") });
  } else if (command === "hwpx-summary") {
    result = await summarizeHwpxDocument({ workspace: argValue(args, "--workspace"), path: argValue(args, "--path") });
  } else if (command === "hwpx-add-paragraph") {
    result = await addHwpxParagraph({ workspace: argValue(args, "--workspace"), path: argValue(args, "--path"), paragraph: argValue(args, "--paragraph") });
  } else if (command === "open-hwp") {
    result = await openWithHancomHwp({ workspace: argValue(args, "--workspace"), path: argValue(args, "--path") });
  } else {
    throw new Error("Usage: status | hwpx-create | hwpx-summary | hwpx-add-paragraph | open-hwp");
  }
  console.log(JSON.stringify(result, null, args.includes("--json") ? 2 : 0));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`[army-claw-hancom] ${error.message}`);
    process.exit(1);
  });
}
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


function extractJsonObject(text) {
  const raw = String(text ?? "").trim();
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(raw.slice(start, end + 1));
    throw new Error("model did not return a JSON document plan");
  }
}

export function normalizeModelResponse(raw, fallbackPrompt) {
  try {
    return normalizeDocumentPlan(extractJsonObject(raw), fallbackPrompt);
  } catch {
    const lines = String(raw ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const titleLine = lines.find((line) => /^#{1,3}\s+/.test(line) || /^제목\s*[:：]/.test(line));
    const title = titleLine ? titleLine.replace(/^#{1,3}\s+/, "").replace(/^제목\s*[:：]\s*/, "").trim() : "Army Claw 문서";
    const body = lines.filter((line) => line !== titleLine).map((line) => line.replace(/^[-*]\s*/, "").trim()).filter(Boolean);
    return normalizeDocumentPlan({ title, paragraphs: body.length ? body : [String(fallbackPrompt).trim()] }, fallbackPrompt);
  }
}

function normalizeDocumentPlan(plan, fallbackPrompt) {
  const title = String(plan?.title || "Army Claw 문서").trim();
  const paragraphs = Array.isArray(plan?.paragraphs)
    ? plan.paragraphs.map((item) => String(item).trim()).filter(Boolean)
    : [];
  if (!paragraphs.length) paragraphs.push(String(fallbackPrompt).trim() || "요청 내용을 바탕으로 생성한 문서입니다.");
  return { title, paragraphs };
}

function buildDocumentPlanningPrompt(userPrompt) {
  return `당신은 Army Claw의 한컴오피스 문서 작성 모델입니다. 사용자의 요청을 한글 HWPX 문서로 만들 수 있도록 JSON만 반환하세요.\n\n규칙:\n- 한국어로 작성합니다.\n- 반환 형식은 반드시 {"title":"문서 제목","paragraphs":["문단1","문단2"]} 입니다.\n- markdown 코드블록, 설명문, 주석을 붙이지 마세요.\n- paragraphs는 실제 문서에 들어갈 완성 문단입니다.\n- 알 수 없는 수치나 기관명을 XXX, OO, TBD 같은 자리표시자로 쓰지 말고 자연스럽게 생략하거나 확인 필요라고 적습니다.\n\n사용자 요청:\n${userPrompt}`;
}

export async function callOllamaDocumentModel({ prompt, model = "gemma3:12b", ollamaUrl = "http://127.0.0.1:11434" }) {
  const planningPrompt = buildDocumentPlanningPrompt(prompt);
  const response = await fetch(`${ollamaUrl.replace(/\/$/, "")}/api/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ model, prompt: planningPrompt, stream: false, format: "json" }),
  });
  if (!response.ok) throw new Error(`Ollama request failed: HTTP ${response.status}`);
  const payload = await response.json();
  return normalizeModelResponse(payload.response, prompt);
}

function defaultPromptPath() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `army-claw-output/${stamp}.hwpx`;
}

export async function createDocumentFromPrompt({
  workspace,
  prompt,
  path = "",
  model = "gemma3:12b",
  ollamaUrl = "http://127.0.0.1:11434",
  modelClient = callOllamaDocumentModel,
  open = false,
}) {
  if (!prompt || !String(prompt).trim()) throw new Error("prompt is required");
  const documentPath = path || defaultPromptPath();
  const plan = normalizeDocumentPlan(await modelClient({ prompt, model, ollamaUrl }), prompt);
  const created = await createHwpxDocument({ workspace, path: documentPath, title: plan.title, paragraphs: plan.paragraphs });
  const result = {
    ...created,
    modelUsed: true,
    model,
    document: plan,
  };
  if (open) result.opened = await openWithHancomHwp({ workspace, path: documentPath });
  return result;
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


export async function readPromptInput({ prompt = "", promptFile = "" }) {
  if (promptFile) return (await readFile(promptFile, "utf8")).trim();
  return String(prompt ?? "").trim();
}
async function main() {
  const [command, ...args] = process.argv.slice(2);
  let result;
  if (command === "status") {
    result = await detectHancomEnvironment();
  } else if (command === "prompt-create") {
    result = await createDocumentFromPrompt({ workspace: argValue(args, "--workspace"), path: argValue(args, "--path"), prompt: await readPromptInput({ prompt: argValue(args, "--prompt"), promptFile: argValue(args, "--prompt-file") }), model: argValue(args, "--model", "gemma3:12b"), ollamaUrl: argValue(args, "--ollama-url", "http://127.0.0.1:11434"), open: args.includes("--open") });
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
    throw new Error("Usage: status | prompt-create | hwpx-create | hwpx-summary | hwpx-add-paragraph | open-hwp");
  }
  console.log(JSON.stringify(result, null, args.includes("--json") ? 2 : 0));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`[army-claw-hancom] ${error.message}`);
    process.exit(1);
  });
}
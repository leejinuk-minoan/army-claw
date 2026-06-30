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
const HWPX_MIMETYPE = "application/hwp+zip";
const DEFAULT_SECTION_ROOT =
  '<hs:sec xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph" xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section">';
const DEFAULT_SECTION_SETUP =
  '<hp:secPr id="" textDirection="HORIZONTAL" spaceColumns="1134" tabStop="8000" tabStopVal="4000" tabStopUnit="HWPUNIT" outlineShapeIDRef="1" memoShapeIDRef="0" textVerticalWidthHead="0" masterPageCnt="0"><hp:grid lineGrid="0" charGrid="0" wonggojiFormat="0"/><hp:startNum pageStartsOn="BOTH" page="0" pic="0" tbl="0" equation="0"/><hp:visibility hideFirstHeader="0" hideFirstFooter="0" hideFirstMasterPage="0" border="SHOW_ALL" fill="SHOW_ALL" hideFirstPageNum="0" hideFirstEmptyLine="0" showLineNumber="0"/><hp:lineNumberShape restartType="0" countBy="0" distance="0" startNumber="0"/><hp:pagePr landscape="WIDELY" width="59528" height="84186" gutterType="LEFT_ONLY"><hp:margin header="4252" footer="4252" gutter="0" left="6000" right="6028" top="5668" bottom="4252"/></hp:pagePr><hp:footNotePr><hp:autoNumFormat type="DIGIT" userChar="" prefixChar="" suffixChar=")" supscript="0"/><hp:noteLine length="5683" type="SOLID" width="0.12 mm" color="#000000"/><hp:noteSpacing betweenNotes="0" belowLine="850" aboveNotes="567"/><hp:numbering type="CONTINUOUS"/><hp:placement place="EACH_COLUMN" beneathText="0"/></hp:footNotePr><hp:endNotePr><hp:autoNumFormat type="DIGIT" userChar="" prefixChar="" suffixChar=")" supscript="0"/><hp:noteLine length="5683" type="SOLID" width="0.12 mm" color="#000000"/><hp:noteSpacing betweenNotes="0" belowLine="850" aboveNotes="567"/><hp:numbering type="CONTINUOUS"/><hp:placement place="END_OF_DOCUMENT" beneathText="0"/></hp:endNotePr><hp:pageBorderFill type="BOTH" borderFillIDRef="1" textBorder="CONTENT" headerInside="0" footerInside="0" fillArea="PAPER"/></hp:secPr><hp:ctrl><hp:colPr id="" type="NEWSPAPER" layout="LEFT" colCount="1" sameSz="1" sameGap="0"/></hp:ctrl>';

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

function hancomParagraphXml(text, id, { title = false, includeSectionSetup = "" } = {}) {
  const charPr = title ? "26" : "0";
  const paraPr = title ? "30" : "1";
  return [
    `<hp:p id="${id}" paraPrIDRef="${paraPr}" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0">`,
    `<hp:run charPrIDRef="${charPr}">`,
    includeSectionSetup,
    `<hp:t>${escapeXml(text)}</hp:t>`,
    "</hp:run>",
    '<hp:linesegarray><hp:lineseg textpos="0" vertpos="0" vertsize="1000" textheight="1000" baseline="850" spacing="600" horzpos="0" horzsize="42520" flags="393216"/></hp:linesegarray>',
    "</hp:p>",
  ].join("");
}

function templateSectionParts(templateSectionXml = "") {
  const rootOpen = templateSectionXml.match(/<hs:sec\b[^>]*>/u)?.[0] || DEFAULT_SECTION_ROOT;
  const sectionSetup =
    templateSectionXml.match(/<hp:secPr\b[\s\S]*?<\/hp:secPr>\s*<hp:ctrl>\s*<hp:colPr\b[\s\S]*?<\/hp:ctrl>/u)?.[0] ||
    DEFAULT_SECTION_SETUP;
  const rootName = rootOpen.match(/^<([\w:]+)/u)?.[1] || "hs:sec";
  return { rootOpen, rootName, sectionSetup };
}

function templateBackedSectionXml({ title, paragraphs, templateSectionXml }) {
  const { rootOpen, rootName, sectionSetup } = templateSectionParts(templateSectionXml);
  const documentParagraphs = [title, ...paragraphs].map((item) => String(item ?? "").trim()).filter(Boolean);
  const body = documentParagraphs.map((text, index) =>
    hancomParagraphXml(text, index + 1, {
      title: index === 0,
      includeSectionSetup: index === 0 ? sectionSetup : "",
    }),
  );
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>${rootOpen}${body.join("")}</${rootName}>`;
}

function contentHpf(title) {
  return `<?xml version="1.0" encoding="UTF-8"?><package><metadata><title>${escapeXml(title)}</title></metadata><manifest><item href="${HWPX_SECTION_PATH}" media-type="application/xml" /></manifest></package>`;
}

export async function createHwpxDocument({ workspace, path, title = "Army Claw 문서", paragraphs = [] }) {
  const templatePath = await findHancomHwpxTemplate();
  if (templatePath) return createTemplateBackedHwpxDocument({ workspace, path, title, paragraphs, templatePath });

  requireHwpxPath(path);
  const target = resolveWorkspacePath(workspace, path);
  await mkdir(dirname(target), { recursive: true });
  const zip = new JSZip();
  zip.file("mimetype", HWPX_MIMETYPE);
  zip.file("version.xml", '<?xml version="1.0" encoding="UTF-8"?><version app="Army Claw" />');
  zip.file("Contents/content.hpf", contentHpf(title));
  zip.file(HWPX_SECTION_PATH, sectionXml([title, ...paragraphs]));
  const content = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  await writeFile(target, content);
  return { path, absolutePath: target, saved: true, message: "HWPX document created", templateBacked: false };
}

function defaultHancomTemplatePaths(env = process.env) {
  const paths = [];
  if (env.ARMY_CLAW_HWPX_TEMPLATE) paths.push(env.ARMY_CLAW_HWPX_TEMPLATE);
  paths.push(
    "C:\\Program Files (x86)\\HNC\\Office 2024\\HOffice130\\Shared\\HwpTemplate\\FrequentComponent\\공문서_양식_템플릿_일반.hwpx",
    "C:\\Program Files (x86)\\HNC\\Office 2024\\HOffice130\\Shared\\HwpTemplate\\FrequentComponent\\공문서_양식_템플릿_내용.hwpx",
    "C:\\Program Files\\HNC\\Office 2024\\HOffice130\\Shared\\HwpTemplate\\FrequentComponent\\공문서_양식_템플릿_일반.hwpx",
    "C:\\Program Files (x86)\\HNC\\Office 2022\\HOffice120\\Shared\\HwpTemplate\\FrequentComponent\\공문서_양식_템플릿_일반.hwpx",
    "C:\\Program Files\\HNC\\Office 2022\\HOffice120\\Shared\\HwpTemplate\\FrequentComponent\\공문서_양식_템플릿_일반.hwpx",
  );
  return paths;
}

export async function findHancomHwpxTemplate({ env = process.env, candidatePaths = defaultHancomTemplatePaths(env) } = {}) {
  for (const candidate of candidatePaths) {
    if (candidate && await fileExists(candidate)) return candidate;
  }
  return "";
}

async function updateContentHpfTitle(zip, title) {
  const entry = zip.file("Contents/content.hpf");
  if (!entry) {
    zip.file("Contents/content.hpf", contentHpf(title));
    return;
  }
  const hpf = await entry.async("string");
  const nextHpf = hpf.includes("<dc:title>")
    ? hpf.replace(/<dc:title>[\s\S]*?<\/dc:title>/u, `<dc:title>${escapeXml(title)}</dc:title>`)
    : hpf;
  zip.file("Contents/content.hpf", nextHpf);
}

export async function createTemplateBackedHwpxDocument({ workspace, path, title = "Army Claw 문서", paragraphs = [], templatePath }) {
  requireHwpxPath(path);
  if (!templatePath) throw new Error("templatePath is required");
  const target = resolveWorkspacePath(workspace, path);
  await mkdir(dirname(target), { recursive: true });

  const zip = await JSZip.loadAsync(await readFile(templatePath));
  const templateSection = zip.file(HWPX_SECTION_PATH) ? await zip.file(HWPX_SECTION_PATH).async("string") : "";
  zip.file("mimetype", HWPX_MIMETYPE, { compression: "STORE" });
  zip.file(HWPX_SECTION_PATH, templateBackedSectionXml({ title, paragraphs, templateSectionXml: templateSection }));
  zip.file("Preview/PrvText.txt", [title, ...paragraphs].map((item) => String(item ?? "").trim()).filter(Boolean).join("\r\n"));
  await updateContentHpfTitle(zip, title);

  const content = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  await writeFile(target, content);
  return {
    path,
    absolutePath: target,
    saved: true,
    message: "HWPX document created from Hancom template",
    templateBacked: true,
    templatePath,
  };
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
  const closing = xml.match(/(<\/(?:\w+:)?sec>)\s*$/u);
  if (!closing) throw new Error("HWPX section root closing tag was not found");
  const insertion = sectionName === HWPX_SECTION_PATH && xml.includes("<hs:sec")
    ? hancomParagraphXml(paragraph, extractParagraphs(xml).length + 1)
    : paragraphXml(paragraph);
  const nextXml = xml.replace(/(<\/(?:\w+:)?sec>)\s*$/u, `${insertion}$1`);
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

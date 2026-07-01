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
const REQUIRED_HWPX_ENTRIES = ["mimetype", "Contents/content.hpf", HWPX_SECTION_PATH];
const DEFAULT_MAX_ENTRIES = 2000;
const DEFAULT_MAX_UNCOMPRESSED_BYTES = 200 * 1024 * 1024;
const PLACEHOLDER_RE = /\{\{([A-Z0-9_]+)\}\}/g;
const BODY_WIDTH = 42520;
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

function unescapeXml(value) {
  return String(value ?? "")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&");
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

function roleShape(role) {
  const shapes = {
    cover_title: { charPr: "26", paraPr: "30" },
    cover_subtitle: { charPr: "12", paraPr: "20" },
    cover_metadata: { charPr: "7", paraPr: "20" },
    toc_title: { charPr: "26", paraPr: "30" },
    toc_item: { charPr: "0", paraPr: "20" },
    heading_1: { charPr: "12", paraPr: "20" },
    heading_2: { charPr: "12", paraPr: "20" },
    heading_3: { charPr: "12", paraPr: "20" },
    body: { charPr: "0", paraPr: "1" },
    bullet_list: { charPr: "0", paraPr: "20" },
    numbered_list: { charPr: "0", paraPr: "20" },
    table_title: { charPr: "12", paraPr: "20" },
    table_header: { charPr: "12", paraPr: "20" },
    table_body: { charPr: "0", paraPr: "1" },
    callout_title: { charPr: "12", paraPr: "20" },
    callout_body: { charPr: "0", paraPr: "1" },
    footer: { charPr: "0", paraPr: "1" },
  };
  return shapes[role] || shapes.body;
}

function styledParagraphXml(text, id, { role = "body", includeSectionSetup = "", pageBreakBefore = false } = {}) {
  const shape = roleShape(role);
  const pageBreak = pageBreakBefore ? "1" : "0";
  const lineHeight = role.startsWith("cover_") ? 1300 : role.startsWith("heading_") ? 1200 : 1000;
  return [
    `<!--army-style:${role}-->`,
    `<hp:p id="${id}" paraPrIDRef="${shape.paraPr}" styleIDRef="0" pageBreak="${pageBreak}" columnBreak="0" merged="0">`,
    `<hp:run charPrIDRef="${shape.charPr}">`,
    includeSectionSetup,
    `<hp:t>${escapeXml(text)}</hp:t>`,
    "</hp:run>",
    `<hp:linesegarray><hp:lineseg textpos="0" vertpos="0" vertsize="${lineHeight}" textheight="${lineHeight}" baseline="${Math.round(lineHeight * 0.85)}" spacing="${Math.round(lineHeight * 0.6)}" horzpos="0" horzsize="${BODY_WIDTH}" flags="393216"/></hp:linesegarray>`,
    "</hp:p>",
  ].join("");
}

function tableCellXml(text, rowIndex, colIndex, colWidth, role, { borderFillIDRef, height, vertAlign = "CENTER" } = {}) {
  const shape = roleShape(role);
  const safeLines = String(text ?? "").split(/\r?\n/);
  const textXml = safeLines.map((line, index) => `${index ? '<hp:lineBreak/>' : ""}<hp:t>${escapeXml(line)}</hp:t>`).join("");
  return [
    `<hp:tc name="" header="${rowIndex === 0 ? 1 : 0}" hasMargin="1" protect="0" editable="0" dirty="0" borderFillIDRef="${borderFillIDRef || (rowIndex === 0 ? 9 : 10)}">`,
    `<hp:subList id="" textDirection="HORIZONTAL" lineWrap="BREAK" vertAlign="${vertAlign}" linkListIDRef="0" linkListNextIDRef="0" textWidth="0" textHeight="0" hasTextRef="0" hasNumRef="0">`,
    `<hp:p id="0" paraPrIDRef="${shape.paraPr}" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0">`,
    `<!--army-style:${role}-->`,
    `<hp:run charPrIDRef="${shape.charPr}">${textXml}</hp:run>`,
    `<hp:linesegarray><hp:lineseg textpos="0" vertpos="0" vertsize="1000" textheight="1000" baseline="850" spacing="600" horzpos="0" horzsize="${Math.max(1000, colWidth - 1020)}" flags="393216"/></hp:linesegarray>`,
    "</hp:p>",
    "</hp:subList>",
    `<hp:cellAddr colAddr="${colIndex}" rowAddr="${rowIndex}"/>`,
    '<hp:cellSpan colSpan="1" rowSpan="1"/>',
    `<hp:cellSz width="${colWidth}" height="${height || 282}"/>`,
    `<hp:cellMargin left="510" right="510" top="${rowIndex === 0 ? 600 : 500}" bottom="${rowIndex === 0 ? 600 : 500}"/>`,
    "</hp:tc>",
  ].join("");
}

function nativeTableXml(table, idSeed = 1, { kind = "table" } = {}) {
  const rows = [table.headers, ...table.rows];
  const colCount = table.headers.length;
  const rowCount = rows.length;
  const tableWidth = kind === "callout" ? 45355 : 45915;
  const colWidth = Math.floor(tableWidth / Math.max(1, colCount));
  const rowsXml = rows.map((row, rowIndex) => {
    const role = kind === "callout"
      ? rowIndex === 0 ? "callout_title" : "callout_body"
      : rowIndex === 0 ? "table_header" : "table_body";
    const borderFillIDRef = kind === "callout" ? (rowIndex === 0 ? 7 : 8) : (rowIndex === 0 ? 9 : rowIndex % 2 ? 10 : 11);
    const cells = row.map((cell, colIndex) => tableCellXml(cell, rowIndex, colIndex, colWidth, role, {
      borderFillIDRef,
      vertAlign: kind === "callout" ? "TOP" : "CENTER",
    })).join("");
    return `<hp:tr>${cells}</hp:tr>`;
  }).join("");
  return [
    `<!--army-table-title:${escapeXml(table.title)}-->`,
    `<!--army-style:table_body-->`,
    `<hp:tbl id="${1443000000 + idSeed}" zOrder="${idSeed}" numberingType="TABLE" textWrap="TOP_AND_BOTTOM" textFlow="BOTH_SIDES" lock="0" dropcapstyle="None" pageBreak="CELL" repeatHeader="1" rowCnt="${rowCount}" colCnt="${colCount}" cellSpacing="0" borderFillIDRef="4" noAdjust="0">`,
    `<hp:sz width="${tableWidth}" widthRelTo="ABSOLUTE" height="${kind === "callout" ? 9545 : rowCount * 3760}" heightRelTo="ABSOLUTE" protect="0"/>`,
    '<hp:pos treatAsChar="0" affectLSpacing="0" flowWithText="1" allowOverlap="0" holdAnchorAndSO="0" vertRelTo="PARA" horzRelTo="COLUMN" vertAlign="TOP" horzAlign="CENTER" vertOffset="0" horzOffset="0"/>',
    '<hp:outMargin left="141" right="141" top="141" bottom="141"/>',
    '<hp:inMargin left="510" right="510" top="141" bottom="141"/>',
    rowsXml,
    "</hp:tbl>",
  ].join("");
}

function calloutTableXml(block, idSeed) {
  return nativeTableXml({
    title: block.title,
    headers: [block.title],
    rows: [[block.text]],
  }, idSeed, { kind: "callout" });
}

function headerFooterControlsXml({ title, footerText }) {
  const footer = footerText || title;
  return [
    '<hp:ctrl><hp:pageHiding hideHeader="1" hideFooter="1" hideMasterPage="0" hideBorder="0" hideFill="0" hidePageNum="0"/></hp:ctrl>',
    `<hp:ctrl><hp:footer id="2" applyPageType="BOTH"><hp:subList id="" textDirection="HORIZONTAL" lineWrap="BREAK" vertAlign="BOTTOM" linkListIDRef="0" linkListNextIDRef="0" textWidth="45920" textHeight="2835" hasTextRef="0" hasNumRef="0"><hp:p id="0" paraPrIDRef="1" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0"><hp:run charPrIDRef="0"><hp:t>${escapeXml(footer)}  |  </hp:t></hp:run><hp:run charPrIDRef="0"><hp:ctrl><hp:autoNum num="1" numType="PAGE"><hp:autoNumFormat type="DIGIT" userChar="" prefixChar="" suffixChar="" supscript="0"/></hp:autoNum></hp:ctrl></hp:run></hp:p></hp:subList></hp:footer></hp:ctrl>`,
    `<hp:ctrl><hp:header id="1" applyPageType="BOTH"><hp:subList id="" textDirection="HORIZONTAL" lineWrap="BREAK" vertAlign="TOP" linkListIDRef="0" linkListNextIDRef="0" textWidth="45920" textHeight="3400" hasTextRef="0" hasNumRef="0"><hp:p id="0" paraPrIDRef="1" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0"><hp:run charPrIDRef="0"><hp:t>${escapeXml(title)}</hp:t></hp:run></hp:p></hp:subList></hp:header></hp:ctrl>`,
  ].join("");
}

function documentPlanPreviewText(plan) {
  const lines = [plan.title];
  if (plan.include_cover) {
    if (plan.subtitle) lines.push(plan.subtitle);
    const metadataLine = [plan.metadata.department, plan.metadata.author, plan.metadata.date].filter(Boolean).join(" | ");
    if (metadataLine) lines.push(metadataLine);
  }
  if (plan.include_toc) {
    lines.push("정적 목차");
    for (const section of plan.sections) lines.push(section.heading);
  }
  for (const section of plan.sections) {
    lines.push(section.heading);
    for (const block of section.blocks) {
      if (block.type === "paragraph" && block.text) lines.push(block.text);
      if (block.type === "bullet_list") for (const item of block.items) lines.push(`• ${item}`);
      if (block.type === "numbered_list") block.items.forEach((item, index) => lines.push(`${index + 1}. ${item}`));
      if (block.type === "table") {
        lines.push(block.title);
        lines.push(block.headers.join("\t"));
        for (const row of block.rows) lines.push(row.join("\t"));
      }
      if (block.type === "callout") lines.push(`${block.title}: ${block.text}`);
    }
  }
  return lines.filter(Boolean).join("\r\n");
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

function documentPlanSectionXml({ plan, templateSectionXml }) {
  const { rootOpen, rootName, sectionSetup } = templateSectionParts(templateSectionXml);
  const parts = [];
  let paraId = 1;
  let tableId = 1;
  const addParagraph = (text, options = {}) => {
    parts.push(styledParagraphXml(text, paraId, options));
    paraId += 1;
  };

  addParagraph(plan.title, { role: "cover_title", includeSectionSetup: `${sectionSetup}${headerFooterControlsXml({ title: plan.title, footerText: plan.footer_text })}` });
  if (plan.include_cover) {
    if (plan.subtitle) addParagraph(plan.subtitle, { role: "cover_subtitle" });
    for (const item of [plan.metadata.department, plan.metadata.author, plan.metadata.date].filter(Boolean)) {
      addParagraph(item, { role: "cover_metadata" });
    }
  }
  if (plan.include_toc) {
    addParagraph("정적 목차", { role: "toc_title", pageBreakBefore: plan.include_cover });
    for (const section of plan.sections) addParagraph(section.heading, { role: "toc_item" });
  }

  plan.sections.forEach((section, sectionIndex) => {
    const headingRole = section.level <= 1 ? "heading_1" : section.level === 2 ? "heading_2" : "heading_3";
    addParagraph(section.heading, {
      role: headingRole,
      pageBreakBefore: sectionIndex === 0 && (plan.include_cover || plan.include_toc),
    });
    for (const block of section.blocks) {
      if (block.type === "paragraph" && block.text) addParagraph(block.text, { role: "body" });
      if (block.type === "bullet_list") for (const item of block.items) addParagraph(`• ${item}`, { role: "bullet_list" });
      if (block.type === "numbered_list") block.items.forEach((item, index) => addParagraph(`${index + 1}. ${item}`, { role: "numbered_list" }));
      if (block.type === "table") {
        addParagraph(block.title, { role: "table_title" });
        parts.push(nativeTableXml(block, tableId));
        tableId += 1;
      }
      if (block.type === "callout") {
        parts.push(calloutTableXml(block, tableId));
        tableId += 1;
      }
    }
  });

  if (plan.footer_text) parts.push(`<!--army-footer:${escapeXml(plan.footer_text)}-->`);
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>${rootOpen}${parts.join("")}</${rootName}>`;
}

function contentHpf(title) {
  return `<?xml version="1.0" encoding="UTF-8"?><package><metadata><title>${escapeXml(title)}</title></metadata><manifest><item href="${HWPX_SECTION_PATH}" media-type="application/xml" /></manifest></package>`;
}

export async function createHwpxDocument({ workspace, path, title = "Army Claw 문서", paragraphs = [] }) {
  const templatePath = await findHancomHwpxTemplate();
  if (templatePath) return createTemplateBackedHwpxDocument({ workspace, path, title, paragraphs, templatePath });

  throw new Error("한컴 2024 호환 HWPX 템플릿을 찾지 못했습니다. 사용자 양식을 지정하거나 한컴오피스 설치 상태를 확인하십시오.");
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

function isUnsafeZipPath(name) {
  return name.startsWith("/") || name.startsWith("\\") || /^[A-Za-z]:/.test(name) || name.split(/[\\/]+/).includes("..");
}

function isExecutableEntry(name) {
  return /\.(exe|dll|cmd|bat|ps1|vbs|js|msi|scr)$/i.test(name);
}

function sectionEntryNames(zip) {
  return Object.keys(zip.files).filter((name) => name.startsWith("Contents/section") && name.endsWith(".xml")).sort();
}

async function loadHwpxZipFromAbsolutePath(target) {
  return JSZip.loadAsync(await readFile(target));
}

async function readZipText(zip, name) {
  const entry = zip.file(name);
  return entry ? entry.async("string") : "";
}

function collectPlaceholders(text) {
  const placeholders = new Set();
  let match;
  while ((match = PLACEHOLDER_RE.exec(String(text ?? "")))) placeholders.add(match[1]);
  return [...placeholders];
}

function replacePlaceholders(text, mapping) {
  return String(text ?? "").replace(PLACEHOLDER_RE, (raw, key) => Object.hasOwn(mapping, key) ? escapeXml(mapping[key]) : raw);
}

function plainReplacePlaceholders(text, mapping) {
  return String(text ?? "").replace(PLACEHOLDER_RE, (raw, key) => Object.hasOwn(mapping, key) ? String(mapping[key] ?? "") : raw);
}

async function hashBuffer(buffer) {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(buffer).digest("hex");
}

async function entryHashes(zip, predicate) {
  const hashes = {};
  for (const name of Object.keys(zip.files)) {
    if (zip.files[name].dir || !predicate(name)) continue;
    hashes[name] = await hashBuffer(await zip.file(name).async("nodebuffer"));
  }
  return hashes;
}

export async function validateHwpxPackage({
  workspace,
  path,
  maxEntries = DEFAULT_MAX_ENTRIES,
  maxUncompressedBytes = DEFAULT_MAX_UNCOMPRESSED_BYTES,
} = {}) {
  requireHwpxPath(path);
  const target = resolveWorkspacePath(workspace, path);
  const errors = [];
  const warnings = [];
  let zip;
  try {
    zip = await loadHwpxZipFromAbsolutePath(target);
  } catch {
    return { path, valid: false, errors: ["invalid_or_unreadable_zip"], warnings, entries: [] };
  }
  const entries = Object.keys(zip.files);
  if (entries.length > maxEntries) errors.push("too_many_entries");
  let totalUncompressedBytes = 0;
  for (const name of entries) {
    if (isUnsafeZipPath(name)) errors.push(`unsafe_zip_path:${name}`);
    if (isExecutableEntry(name)) errors.push(`executable_entry:${name}`);
    totalUncompressedBytes += zip.files[name]?._data?.uncompressedSize || 0;
  }
  if (totalUncompressedBytes > maxUncompressedBytes) errors.push("uncompressed_size_limit_exceeded");
  for (const required of REQUIRED_HWPX_ENTRIES) if (!zip.file(required)) errors.push(`missing_required_entry:${required}`);
  const sections = sectionEntryNames(zip);
  const sectionTexts = [];
  if (!sections.length) errors.push("missing_section_xml");
  for (const section of sections) {
    const xml = await readZipText(zip, section);
    sectionTexts.push(xml);
    if (!/<(?:\w+:)?sec\b/u.test(xml)) errors.push(`invalid_section_xml:${section}`);
    if (/(?:href|src|target)\s*=\s*["']https?:\/\//i.test(xml)) warnings.push(`external_url_in_section:${section}`);
  }
  const allSectionXml = sectionTexts.join("\n");
  const tables = sectionTexts.flatMap(extractNativeTables);
  const footer = extractFooterInfo(allSectionXml);
  const nativeStructureValidation = validateNativeStructures({ tables, footer, sectionXml: allSectionXml });
  return {
    path,
    valid: errors.length === 0,
    errors: [...new Set(errors)],
    warnings: [...new Set(warnings)],
    entries,
    sectionEntries: sections,
    totalUncompressedBytes,
    native_structure_validation: nativeStructureValidation.passed ? "passed" : "failed",
    native_structure_errors: nativeStructureValidation.errors,
    native_visual_check_status: "user_confirmation_pending",
  };
}

export async function analyzeHwpxTemplate({ workspace, path }) {
  const target = resolveWorkspacePath(workspace, path);
  const validation = await validateHwpxPackage({ workspace, path });
  if (!validation.valid) {
    return {
      path,
      absolutePath: target,
      valid: false,
      errors: validation.errors,
      entries: validation.entries,
      sectionXmlEntries: validation.sectionEntries || [],
      paragraphCount: 0,
      paragraphs: [],
      placeholders: [],
      inputCandidates: [],
    };
  }
  const zip = await loadHwpxZipFromAbsolutePath(target);
  const sectionXmlEntries = sectionEntryNames(zip);
  const sectionTexts = await Promise.all(sectionXmlEntries.map((name) => readZipText(zip, name)));
  const paragraphs = sectionTexts.flatMap(extractParagraphs);
  const text = paragraphs.join("\n");
  const allSectionXml = sectionTexts.join("\n");
  const tables = sectionTexts.flatMap(extractNativeTables);
  const footer = extractFooterInfo(allSectionXml);
  const nativeStructureValidation = validateNativeStructures({ tables, footer, sectionXml: allSectionXml });
  const placeholders = collectPlaceholders(text);
  const inputCandidates = placeholders.map((placeholder) => ({
    kind: "placeholder",
    placeholder,
    priority: 1,
    requiresUserConfirmation: false,
  }));
  const imageEntries = Object.keys(zip.files).filter((name) => /^BinData\/.+\.(png|jpg|jpeg|gif|bmp)$/i.test(name));
  return {
    path,
    absolutePath: target,
    valid: true,
    errors: [],
    warnings: validation.warnings,
    entries: validation.entries,
    sectionXmlEntries,
    paragraphCount: paragraphs.length,
    paragraphs,
    text,
    tableCount: tables.length,
    tables,
    pageBreakCount: (allSectionXml.match(/pageBreak="1"/g) || []).length,
    styleRoles: [...new Set([...allSectionXml.matchAll(/<!--army-style:([a-z0-9_]+)-->/gi)].map((item) => item[1]))],
    footerText: footer.cleanText || unescapeXml(allSectionXml.match(/<!--army-footer:([\s\S]*?)-->/u)?.[1] || ""),
    footer,
    nativeStructureValidation,
    nativeVisualCheckStatus: "user_confirmation_pending",
    images: imageEntries,
    hasHeader: /<hp:header\b|headerText/i.test(allSectionXml),
    hasFooter: /<hp:footer\b|footerText/i.test(allSectionXml),
    styleIds: [...new Set((allSectionXml.match(/styleIDRef="[^"]+"/g) || []).map((item) => item.slice(12, -1)))],
    charShapeIds: [...new Set((allSectionXml.match(/charPrIDRef="[^"]+"/g) || []).map((item) => item.slice(13, -1)))],
    paragraphShapeIds: [...new Set((allSectionXml.match(/paraPrIDRef="[^"]+"/g) || []).map((item) => item.slice(13, -1)))],
    placeholders,
    emptyTableCells: [],
    inputCandidates,
  };
}

export async function generateHwpxFromTemplate({ workspace, templatePath, outputPath, fieldMapping = {} }) {
  requireHwpxPath(templatePath);
  requireHwpxPath(outputPath);
  const source = resolveWorkspacePath(workspace, templatePath);
  const target = resolveWorkspacePath(workspace, outputPath);
  if (source.toLowerCase() === target.toLowerCase()) throw new Error("output_path must be different from template_path");
  const sourceBefore = await readFile(source);
  const zip = await JSZip.loadAsync(sourceBefore);
  const mediaBefore = await entryHashes(zip, (name) => /^BinData\//i.test(name));
  for (const name of sectionEntryNames(zip)) zip.file(name, replacePlaceholders(await readZipText(zip, name), fieldMapping));
  const preview = await readZipText(zip, "Preview/PrvText.txt");
  if (preview) zip.file("Preview/PrvText.txt", plainReplacePlaceholders(preview, fieldMapping));
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
  const outputZip = await loadHwpxZipFromAbsolutePath(target);
  const mediaAfter = await entryHashes(outputZip, (name) => /^BinData\//i.test(name));
  const validation = await validateHwpxPackage({ workspace, path: outputPath });
  return {
    path: outputPath,
    absolutePath: target,
    saved: true,
    mode: "template_fill",
    originalPreserved: sourceBefore.equals(await readFile(source)),
    mediaPreserved: JSON.stringify(mediaBefore) === JSON.stringify(mediaAfter),
    validation,
  };
}

const ALLOWED_STYLE_PROFILES = new Set(["official_report", "modern_report", "meeting_minutes", "project_plan"]);

function normalizeBlock(block) {
  const type = String(block?.type || "paragraph");
  if (type === "paragraph") return { type, text: String(block?.text || "").trim() };
  if (type === "bullet_list" || type === "numbered_list") {
    return { type, items: Array.isArray(block?.items) ? block.items.map((item) => String(item).trim()).filter(Boolean) : [] };
  }
  if (type === "table") {
    const headers = Array.isArray(block?.headers) ? block.headers.map((item) => String(item).trim()) : [];
    const rows = Array.isArray(block?.rows) ? block.rows.map((row) => Array.isArray(row) ? row.map((item) => String(item).trim()) : []) : [];
    if (!headers.length) throw new Error("table headers are required");
    rows.forEach((row, index) => {
      if (row.length !== headers.length) throw new Error(`table row ${index + 1} has ${row.length} cells but expected ${headers.length}`);
    });
    return {
      type,
      title: String(block?.title || "표").trim(),
      headers,
      rows,
    };
  }
  if (type === "callout") {
    return {
      type,
      callout_type: String(block?.callout_type || "note").trim(),
      title: String(block?.title || "참고").trim(),
      text: String(block?.text || "").trim(),
    };
  }
  throw new Error(`unsupported block type: ${type}`);
}

export function validateDocumentPlan(plan) {
  if (!plan || typeof plan !== "object") throw new Error("document plan must be an object");
  const title = String(plan.title || "").trim();
  if (!title) throw new Error("title is required");
  if (!Array.isArray(plan.sections) || plan.sections.length === 0) throw new Error("sections is required");
  const styleProfile = String(plan.style_profile || "official_report");
  if (!ALLOWED_STYLE_PROFILES.has(styleProfile)) throw new Error(`unsupported style_profile: ${styleProfile}`);
  return {
    mode: "auto_document",
    document_type: String(plan.document_type || "자유 형식"),
    title,
    subtitle: String(plan.subtitle || "").trim(),
    metadata: {
      author: String(plan.metadata?.author || "").trim(),
      department: String(plan.metadata?.department || "").trim(),
      date: String(plan.metadata?.date || new Date().toISOString().slice(0, 10)).trim(),
    },
    style_profile: styleProfile,
    include_cover: plan.include_cover !== false,
    include_toc: plan.include_toc !== false,
    footer_text: String(plan.footer_text || "").trim(),
    sections: plan.sections.map((section, index) => ({
      id: String(section?.id || `section-${index + 1}`),
      heading: String(section?.heading || `${index + 1}. 섹션`).trim(),
      level: Number(section?.level || 1),
      blocks: Array.isArray(section?.blocks) ? section.blocks.map(normalizeBlock) : [],
    })),
  };
}

function documentPlanParagraphs(plan) {
  const lines = [];
  if (plan.include_cover) {
    if (plan.subtitle) lines.push(plan.subtitle);
    const metadataLine = [plan.metadata.department, plan.metadata.author, plan.metadata.date].filter(Boolean).join(" | ");
    if (metadataLine) lines.push(metadataLine);
  }
  if (plan.include_toc) {
    lines.push("정적 목차");
    for (const section of plan.sections) lines.push(section.heading);
  }
  for (const section of plan.sections) {
    lines.push(section.heading);
    for (const block of section.blocks) {
      if (block.type === "paragraph" && block.text) lines.push(block.text);
      if (block.type === "bullet_list") for (const item of block.items) lines.push(`- ${item}`);
      if (block.type === "numbered_list") block.items.forEach((item, index) => lines.push(`${index + 1}. ${item}`));
      if (block.type === "table") {
        lines.push(`[표] ${block.title}`);
        if (block.headers.length) lines.push(block.headers.join(" | "));
        for (const row of block.rows) lines.push(row.join(" | "));
      }
      if (block.type === "callout") lines.push(`[${block.title}] ${block.text}`);
    }
  }
  lines.push(`꼬리말: ${plan.title}`);
  return lines;
}

export async function generateAutoHwpxDocument({ workspace, outputPath, documentPlan }) {
  const plan = validateDocumentPlan(documentPlan);
  const templatePath = await findHancomHwpxTemplate();
  if (!templatePath) throw new Error("한컴 2024 호환 HWPX 템플릿을 찾지 못했습니다. 사용자 양식을 지정하거나 한컴오피스 설치 상태를 확인하십시오.");
  const target = resolveWorkspacePath(workspace, outputPath);
  await mkdir(dirname(target), { recursive: true });
  const templateZip = await JSZip.loadAsync(await readFile(templatePath));
  const templateSectionXml = await readZipText(templateZip, HWPX_SECTION_PATH);
  templateZip.file("mimetype", HWPX_MIMETYPE, { compression: "STORE" });
  templateZip.file(HWPX_SECTION_PATH, documentPlanSectionXml({ plan, templateSectionXml }));
  templateZip.file("Preview/PrvText.txt", documentPlanPreviewText(plan));
  await updateContentHpfTitle(templateZip, plan.title);
  await writeFile(target, await templateZip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
  const validation = await validateHwpxPackage({ workspace, path: outputPath });
  return {
    path: outputPath,
    absolutePath: target,
    saved: true,
    message: `HWPX 자동 문서를 생성했습니다: ${outputPath}`,
    templateBacked: true,
    templatePath,
    mode: "auto_document",
    styleProfile: plan.style_profile,
    documentType: plan.document_type,
    pageNumberStatus: "native_page_field",
    validation,
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

function extractNativeTables(xml) {
  const tables = [];
  const tableRegex = /<hp:tbl\b([^>]*)>([\s\S]*?)<\/hp:tbl>/g;
  let tableMatch;
  while ((tableMatch = tableRegex.exec(xml))) {
    const prefix = xml.slice(0, tableMatch.index);
    const titleStart = prefix.lastIndexOf("<!--army-table-title:");
    const titleEnd = titleStart >= 0 ? prefix.indexOf("-->", titleStart) : -1;
    const title = titleStart >= 0 && titleEnd >= 0 ? prefix.slice(titleStart + "<!--army-table-title:".length, titleEnd) : "";
    const attrs = tableMatch[1] || "";
    const body = tableMatch[2] || "";
    const positionAttrs = body.match(/<hp:pos\b([^>]*)\/>/u)?.[1] || "";
    const rows = [];
    const cells = [];
    const rowRegex = /<hp:tr\b[^>]*>([\s\S]*?)<\/hp:tr>/g;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(body))) {
      const rowCells = [];
      const cellRegex = /<hp:tc\b[^>]*>([\s\S]*?)<\/hp:tc>/g;
      let cellMatch;
      while ((cellMatch = cellRegex.exec(rowMatch[1]))) {
        const cellAttrs = cellMatch[0].match(/<hp:tc\b([^>]*)>/u)?.[1] || "";
        const text = extractParagraphs(cellMatch[1]).join("\n");
        cells.push({
          text,
          hasMargin: attrValue(cellAttrs, "hasMargin"),
          borderFillIDRef: attrValue(cellAttrs, "borderFillIDRef"),
        });
        rowCells.push(text);
      }
      rows.push(rowCells);
    }
    tables.push({
      title: unescapeXml(title),
      rowCount: Number(attrs.match(/rowCnt="(\d+)"/u)?.[1] || rows.length),
      columnCount: Number(attrs.match(/colCnt="(\d+)"/u)?.[1] || rows[0]?.length || 0),
      position: {
        treatAsChar: attrValue(positionAttrs, "treatAsChar"),
        horzRelTo: attrValue(positionAttrs, "horzRelTo"),
        horzAlign: attrValue(positionAttrs, "horzAlign"),
        vertRelTo: attrValue(positionAttrs, "vertRelTo"),
        vertAlign: attrValue(positionAttrs, "vertAlign"),
      },
      cells,
      rows,
    });
  }
  return tables;
}

function attrValue(attrs, name) {
  return String(attrs || "").match(new RegExp(`${name}="([^"]*)"`, "u"))?.[1] || "";
}

function extractFooterInfo(xml) {
  const footerMatch = xml.match(/<hp:footer\b[\s\S]*?<\/hp:footer>/u);
  const footerXml = footerMatch?.[0] || "";
  const text = extractParagraphs(footerXml).join("\n");
  return {
    actualFooter: Boolean(footerXml),
    pageNumberField: /<hp:autoNum\b[^>]*numType="PAGE"/u.test(footerXml),
    text,
    cleanText: text.replace(/\s*\|\s*$/u, "").trim(),
  };
}

function validateNativeStructures({ tables, footer, sectionXml }) {
  const errors = [];
  for (const [index, table] of tables.entries()) {
    if (table.position.treatAsChar !== "0") errors.push(`table_${index + 1}_treatAsChar_not_native`);
    if (table.position.horzRelTo !== "COLUMN") errors.push(`table_${index + 1}_horzRelTo_not_column`);
    if (table.position.horzAlign !== "CENTER") errors.push(`table_${index + 1}_horzAlign_not_center`);
    if (!table.cells.every((cell) => cell.hasMargin === "1")) errors.push(`table_${index + 1}_cell_margin_missing`);
    if (table.rows.length !== table.rowCount) errors.push(`table_${index + 1}_row_count_mismatch`);
    if (table.rows.some((row) => row.length !== table.columnCount)) errors.push(`table_${index + 1}_column_count_mismatch`);
  }
  if (!footer.actualFooter) errors.push("footer_missing");
  if (!footer.pageNumberField) errors.push("page_number_field_missing");
  if (!/<hp:pageHiding\b/u.test(sectionXml)) errors.push("first_page_hiding_missing");
  return {
    passed: errors.length === 0,
    errors,
  };
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

function jsonArgValue(args, name, fallback = {}) {
  const value = argValue(args, name, "");
  return value ? JSON.parse(value) : fallback;
}

async function jsonArgOrFileValue(args, name, fileName, fallback = {}) {
  const file = argValue(args, fileName, "");
  if (file) return JSON.parse(await readFile(file, "utf8"));
  return jsonArgValue(args, name, fallback);
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
  } else if (command === "hwpx-validate") {
    result = await validateHwpxPackage({ workspace: argValue(args, "--workspace"), path: argValue(args, "--path") });
  } else if (command === "hwpx-analyze-template") {
    result = await analyzeHwpxTemplate({ workspace: argValue(args, "--workspace"), path: argValue(args, "--path") });
  } else if (command === "hwpx-template-fill") {
    result = await generateHwpxFromTemplate({
      workspace: argValue(args, "--workspace"),
      templatePath: argValue(args, "--template-path"),
      outputPath: argValue(args, "--output-path"),
      fieldMapping: await jsonArgOrFileValue(args, "--field-mapping", "--field-mapping-file"),
    });
  } else if (command === "hwpx-auto-generate") {
    result = await generateAutoHwpxDocument({
      workspace: argValue(args, "--workspace"),
      outputPath: argValue(args, "--output-path"),
      documentPlan: await jsonArgOrFileValue(args, "--document-plan", "--document-plan-file"),
    });
  } else if (command === "hwpx-summary") {
    result = await summarizeHwpxDocument({ workspace: argValue(args, "--workspace"), path: argValue(args, "--path") });
  } else if (command === "hwpx-add-paragraph") {
    result = await addHwpxParagraph({ workspace: argValue(args, "--workspace"), path: argValue(args, "--path"), paragraph: argValue(args, "--paragraph") });
  } else if (command === "open-hwp") {
    result = await openWithHancomHwp({ workspace: argValue(args, "--workspace"), path: argValue(args, "--path") });
  } else {
    throw new Error("Usage: status | prompt-create | hwpx-create | hwpx-validate | hwpx-analyze-template | hwpx-template-fill | hwpx-auto-generate | hwpx-summary | hwpx-add-paragraph | open-hwp");
  }
  console.log(JSON.stringify(result, null, args.includes("--json") ? 2 : 0));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`[army-claw-hancom] ${error.message}`);
    process.exit(1);
  });
}

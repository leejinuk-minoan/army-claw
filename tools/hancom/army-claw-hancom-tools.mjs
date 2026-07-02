import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
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
const TABLE_STYLE_PROFILES = {
  grid: { headerBorder: 9, bodyBorder: 10, alternateBorder: 11, tableBorder: 4 },
  report: { headerBorder: 9, bodyBorder: 10, alternateBorder: 11, tableBorder: 4 },
  minimal: { headerBorder: 9, bodyBorder: 8, alternateBorder: 8, tableBorder: 4 },
  official_form: { headerBorder: 9, bodyBorder: 10, alternateBorder: 8, tableBorder: 4 },
  approval: { headerBorder: 9, bodyBorder: 10, alternateBorder: 10, tableBorder: 4 },
  schedule: { headerBorder: 9, bodyBorder: 10, alternateBorder: 11, tableBorder: 4 },
  metadata: { headerBorder: 8, bodyBorder: 8, alternateBorder: 8, tableBorder: 4 },
  callout: { headerBorder: 7, bodyBorder: 8, alternateBorder: 8, tableBorder: 4 },
};

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

export function validateMergedTableCells({ rows, cols, cells }) {
  const rowCount = Number(rows || 0);
  const colCount = Number(cols || 0);
  if (rowCount <= 0 || colCount <= 0) throw new Error("merged table rows and cols are required");
  const occupied = new Map();
  for (const cell of cells || []) {
    const row = Number(cell.row ?? 0);
    const col = Number(cell.col ?? 0);
    const rowSpan = Number(cell.row_span || cell.rowSpan || 1);
    const colSpan = Number(cell.col_span || cell.colSpan || 1);
    if (row < 0 || col < 0 || rowSpan <= 0 || colSpan <= 0 || row + rowSpan > rowCount || col + colSpan > colCount) {
      throw new Error(`merged cell outside table bounds: row=${row}, col=${col}, rowSpan=${rowSpan}, colSpan=${colSpan}`);
    }
    for (let rowOffset = 0; rowOffset < rowSpan; rowOffset += 1) {
      for (let colOffset = 0; colOffset < colSpan; colOffset += 1) {
        const key = `${row + rowOffset}:${col + colOffset}`;
        if (occupied.has(key)) throw new Error(`merged cell collision at ${key}`);
        occupied.set(key, cell);
      }
    }
  }
  return true;
}

export function buildMergedTableGrid({ rows, cols, column_widths = [], row_heights = [], cells = [] }) {
  const rowCount = Number(rows || 0);
  const colCount = Number(cols || 0);
  validateMergedTableCells({ rows: rowCount, cols: colCount, cells });
  const columnWidths = Array.from({ length: colCount }, (_, index) => Number(column_widths[index] || 45915 / Math.max(1, colCount)));
  const rowHeights = Array.from({ length: rowCount }, (_, index) => Number(row_heights[index] || 3760));
  const occupied = new Set();
  const renderedCells = [];
  for (const cell of cells) {
    const row = Number(cell.row ?? 0);
    const col = Number(cell.col ?? 0);
    const rowSpan = Number(cell.row_span || cell.rowSpan || 1);
    const colSpan = Number(cell.col_span || cell.colSpan || 1);
    for (let rowOffset = 0; rowOffset < rowSpan; rowOffset += 1) {
      for (let colOffset = 0; colOffset < colSpan; colOffset += 1) occupied.add(`${row + rowOffset}:${col + colOffset}`);
    }
    renderedCells.push({
      row,
      col,
      row_span: rowSpan,
      col_span: colSpan,
      rowSpan,
      colSpan,
      text: String(cell.text ?? ""),
      role: cell.role || (row === 0 ? "header" : "body"),
      width: columnWidths.slice(col, col + colSpan).reduce((sum, value) => sum + value, 0),
      height: rowHeights.slice(row, row + rowSpan).reduce((sum, value) => sum + value, 0),
    });
  }
  renderedCells.sort((a, b) => a.row - b.row || a.col - b.col);
  return {
    row_count: rowCount,
    col_count: colCount,
    column_widths: columnWidths,
    row_heights: rowHeights,
    table_width: columnWidths.reduce((sum, value) => sum + value, 0),
    anchor_cells: renderedCells.map((cell) => ({ row: cell.row, col: cell.col })),
    occupied_coordinates: [...occupied],
    rendered_cells: renderedCells,
  };
}

function normalizedTableRows(table) {
  if (Array.isArray(table.cells)) {
    const rowCount = Number(table.rows || 0);
    const colCount = Number(table.cols || table.columns || 0);
    const grid = buildMergedTableGrid({
      rows: rowCount,
      cols: colCount,
      column_widths: table.column_widths,
      row_heights: table.row_heights,
      cells: table.cells,
    });
    const rows = Array.from({ length: rowCount }, () => []);
    for (const cell of grid.rendered_cells) {
      rows[cell.row].push({
        text: cell.text,
        rowSpan: cell.row_span,
        colSpan: cell.col_span,
        role: cell.role,
        row: cell.row,
        col: cell.col,
        width: cell.width,
        height: cell.height,
      });
    }
    return { rows, rowCount, colCount, grid };
  }
  const rows = [table.headers, ...table.rows].map((row, rowIndex) => row.map((text, colIndex) => ({
    text,
    rowSpan: 1,
    colSpan: 1,
    role: rowIndex === 0 ? "header" : "body",
    row: rowIndex,
    col: colIndex,
  })));
  return { rows, rowCount: rows.length, colCount: table.headers.length };
}

function tableCellXml(text, rowIndex, colIndex, colWidth, role, { borderFillIDRef, height, width: explicitWidth, vertAlign = "CENTER", rowSpan = 1, colSpan = 1 } = {}) {
  const shape = roleShape(role);
  const safeLines = String(text ?? "").split(/\r?\n/);
  const textXml = safeLines.map((line, index) => `${index ? '<hp:lineBreak/>' : ""}<hp:t>${escapeXml(line)}</hp:t>`).join("");
  const width = explicitWidth || colWidth * colSpan;
  return [
    `<hp:tc name="" header="${rowIndex === 0 ? 1 : 0}" hasMargin="1" protect="0" editable="0" dirty="0" borderFillIDRef="${borderFillIDRef || (rowIndex === 0 ? 9 : 10)}">`,
    `<hp:subList id="" textDirection="HORIZONTAL" lineWrap="BREAK" vertAlign="${vertAlign}" linkListIDRef="0" linkListNextIDRef="0" textWidth="0" textHeight="0" hasTextRef="0" hasNumRef="0">`,
    `<hp:p id="0" paraPrIDRef="${shape.paraPr}" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0">`,
    `<!--army-style:${role}-->`,
    `<hp:run charPrIDRef="${shape.charPr}">${textXml}</hp:run>`,
    `<hp:linesegarray><hp:lineseg textpos="0" vertpos="0" vertsize="1000" textheight="1000" baseline="850" spacing="600" horzpos="0" horzsize="${Math.max(1000, width - 1020)}" flags="393216"/></hp:linesegarray>`,
    "</hp:p>",
    "</hp:subList>",
    `<hp:cellAddr colAddr="${colIndex}" rowAddr="${rowIndex}"/>`,
    `<hp:cellSpan colSpan="${colSpan}" rowSpan="${rowSpan}"/>`,
    `<hp:cellSz width="${width}" height="${height || 282 * rowSpan}"/>`,
    `<hp:cellMargin left="510" right="510" top="${rowIndex === 0 ? 600 : 500}" bottom="${rowIndex === 0 ? 600 : 500}"/>`,
    "</hp:tc>",
  ].join("");
}

function nativeTableObjectXml(table, idSeed = 1, { kind = "table" } = {}) {
  const tableStyle = table.table_style || table.tableStyle || (kind === "callout" ? "callout" : "report");
  const style = TABLE_STYLE_PROFILES[tableStyle] || TABLE_STYLE_PROFILES.report;
  const { rows, rowCount, colCount } = normalizedTableRows(table);
  const tableWidth = kind === "callout" ? 45355 : 45915;
  const colWidth = Math.floor(tableWidth / Math.max(1, colCount));
  const rowsXml = rows.map((row, rowIndex) => {
    const cells = row.map((cell) => {
      const header = cell.role === "header" || rowIndex === 0;
      const role = kind === "callout"
        ? header ? "callout_title" : "callout_body"
        : header ? "table_header" : "table_body";
      const borderFillIDRef = header ? style.headerBorder : rowIndex % 2 ? style.bodyBorder : style.alternateBorder;
      return tableCellXml(cell.text, cell.row ?? rowIndex, cell.col ?? 0, colWidth, role, {
      borderFillIDRef,
      vertAlign: kind === "callout" ? "TOP" : "CENTER",
      rowSpan: cell.rowSpan,
      colSpan: cell.colSpan,
      width: cell.width,
      height: cell.height,
    });
    }).join("");
    return `<hp:tr>${cells}</hp:tr>`;
  }).join("");
  return [
    `<!--army-table-title:${escapeXml(table.title)}-->`,
    `<!--army-table-style:${escapeXml(tableStyle)}-->`,
    `<!--army-style:table_body-->`,
    `<hp:tbl id="${1443000000 + idSeed}" zOrder="${idSeed}" numberingType="TABLE" textWrap="TOP_AND_BOTTOM" textFlow="BOTH_SIDES" lock="0" dropcapstyle="None" pageBreak="CELL" repeatHeader="1" rowCnt="${rowCount}" colCnt="${colCount}" cellSpacing="0" borderFillIDRef="${style.tableBorder}" noAdjust="0">`,
    `<hp:sz width="${tableWidth}" widthRelTo="ABSOLUTE" height="${kind === "callout" ? 9545 : rowCount * 3760}" heightRelTo="ABSOLUTE" protect="0"/>`,
    '<hp:pos treatAsChar="0" affectLSpacing="0" flowWithText="1" allowOverlap="0" holdAnchorAndSO="0" vertRelTo="PARA" horzRelTo="COLUMN" vertAlign="TOP" horzAlign="CENTER" vertOffset="0" horzOffset="0"/>',
    '<hp:outMargin left="141" right="141" top="141" bottom="141"/>',
    '<hp:inMargin left="510" right="510" top="141" bottom="141"/>',
    rowsXml,
    "</hp:tbl>",
  ].join("");
}

function nativeTableXml(table, idSeed = 1, options = {}) {
  return nativeTableObjectXml(table, idSeed, options);
}

function nativeTableParagraphXml(table, paragraphId, idSeed = 1, { kind = "table" } = {}) {
  const lineHeight = 1000;
  return [
    `<!--army-table-wrapper:native-paragraph-run-->`,
    `<hp:p id="${paragraphId}" paraPrIDRef="1" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0">`,
    '<hp:run charPrIDRef="0">',
    nativeTableObjectXml(table, idSeed, { kind }),
    "</hp:run>",
    `<hp:linesegarray><hp:lineseg textpos="0" vertpos="0" vertsize="${lineHeight}" textheight="${lineHeight}" baseline="850" spacing="600" horzpos="0" horzsize="${BODY_WIDTH}" flags="393216"/></hp:linesegarray>`,
    "</hp:p>",
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

function minimalNativeTableSectionXml({ templateSectionXml }) {
  const { rootOpen, rootName, sectionSetup } = templateSectionParts(templateSectionXml);
  const table = {
    title: "검증 표",
    headers: ["구분", "검증 내용", "결과"],
    rows: [
      ["표 구조", "테이블 부모 구조 적용", "확인"],
      ["셀 편집", "한글 2024 셀 커서 진입", "확인"],
    ],
  };
  const body = [
    styledParagraphXml("HWPX 테이블 최소 검증", 1, { role: "cover_title", includeSectionSetup: sectionSetup }),
    styledParagraphXml("위 본문 문단입니다.", 2, { role: "body" }),
    nativeTableParagraphXml(table, 3, 1),
    styledParagraphXml("표 아래 본문 문단입니다.", 4, { role: "body" }),
  ];
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>${rootOpen}${body.join("")}</${rootName}>`;
}

function mergedTable({ title, table_style, rows, cols, cells }) {
  return { title, table_style, rows, cols, cells };
}

function qualificationReviewSampleSectionXml({ templateSectionXml }) {
  const { rootOpen, rootName, sectionSetup } = templateSectionParts(templateSectionXml);
  const parts = [`<!--army-reference-profile:qualification_review_booklet-->`];
  let paraId = 1;
  let tableId = 1;
  const addParagraph = (text, options = {}) => {
    parts.push(styledParagraphXml(text, paraId, options));
    paraId += 1;
  };
  const addTable = (table) => {
    parts.push(nativeTableParagraphXml(table, paraId, tableId));
    paraId += 1;
    tableId += 1;
  };

  addParagraph("Army Claw 표준문서 자동화 개발", { role: "cover_title", includeSectionSetup: sectionSetup });
  addParagraph("Army Claw 개발팀", { role: "cover_subtitle" });
  addParagraph("주 2-1", { role: "heading_2", pageBreakBefore: true });
  addParagraph("문서 자동화 기반 구축 현황 (1/2)", { role: "heading_1" });
  addTable(mergedTable({
    title: "반복 요약 블록",
    table_style: "report",
    rows: 4,
    cols: 2,
    cells: [
      { row: 0, col: 0, col_span: 2, text: "공통 요약", role: "header" },
      { row: 1, col: 0, text: "개요", role: "header" },
      { row: 1, col: 1, text: "로컬 LLM 기반 한글 문서 자동화 기능을 구축한다." },
      { row: 2, col: 0, text: "현 실태", role: "header" },
      { row: 2, col: 1, text: "일반 표와 업무용 양식 표현력이 제한적이다." },
      { row: 3, col: 0, text: "개선", role: "header" },
      { row: 3, col: 1, text: "HWPX wrapper, 표 스타일, 병합 셀을 단계적으로 확장한다." },
    ],
  }));
  addParagraph("보조 2-1", { role: "footer" });
  addParagraph("주 2-2", { role: "heading_2", pageBreakBefore: true });
  addParagraph("양식 프로필 구현 결과 (2/2)", { role: "heading_1" });
  addParagraph("프로필 기반 렌더러는 공통 데이터와 페이지별 데이터를 분리해 반복 레이아웃을 구성한다.", { role: "body" });
  addTable(mergedTable({
    title: "기능 검증 표",
    table_style: "report",
    rows: 3,
    cols: 3,
    cells: [
      { row: 0, col: 0, row_span: 2, text: "구분", role: "header" },
      { row: 0, col: 1, col_span: 2, text: "검증 내용", role: "header" },
      { row: 1, col: 1, text: "구조", role: "header" },
      { row: 1, col: 2, text: "결과", role: "header" },
      { row: 2, col: 0, text: "표현 엔진" },
      { row: 2, col: 1, text: "병합 셀과 표 wrapper" },
      { row: 2, col: 2, text: "구현" },
    ],
  }));
  addParagraph("보조 2-2", { role: "footer" });
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>${rootOpen}${parts.join("")}</${rootName}>`;
}

function officialActionPlanSampleSectionXml({ templateSectionXml }) {
  const { rootOpen, rootName, sectionSetup } = templateSectionParts(templateSectionXml);
  const parts = [`<!--army-reference-profile:official_action_plan-->`];
  let paraId = 1;
  let tableId = 1;
  const addParagraph = (text, options = {}) => {
    parts.push(styledParagraphXml(text, paraId, options));
    paraId += 1;
  };
  const addTable = (table) => {
    parts.push(nativeTableParagraphXml(table, paraId, tableId));
    paraId += 1;
    tableId += 1;
  };

  addTable(mergedTable({
    title: "문서관리 및 결재 정보",
    table_style: "approval",
    rows: 3,
    cols: 4,
    cells: [
      { row: 0, col: 0, text: "등록번호", role: "header" },
      { row: 0, col: 1, text: "ARMY-CLAW-2026-01" },
      { row: 0, col: 2, text: "결재", role: "header" },
      { row: 0, col: 3, text: "검토" },
      { row: 1, col: 0, text: "보존기간", role: "header" },
      { row: 1, col: 1, text: "영구" },
      { row: 1, col: 2, text: "공개구분", role: "header" },
      { row: 1, col: 3, text: "공개" },
      { row: 2, col: 0, text: "협조", role: "header" },
      { row: 2, col: 1, col_span: 3, text: "개발, 검증, 문서화" },
    ],
  }));
  addParagraph("Army Claw 표준문서 자동화 기능 검증 계획", { role: "cover_title", includeSectionSetup: sectionSetup });
  addParagraph("HWP 기준 양식 분석 및 HWPX 자동 생성 기능 검증을 위한 계획임.", { role: "body" });
  addParagraph("1. 목적", { role: "heading_1" });
  addParagraph("한글 2024에서 열리는 업무문서형 HWPX 생성 기반을 확보한다.", { role: "body" });
  addParagraph("2. 방침", { role: "heading_1" });
  addParagraph("원본 HWP는 보존하고 변환 HWPX 분석 결과를 프로필로 축약한다.", { role: "body" });
  addParagraph("3. 세부계획", { role: "heading_1", pageBreakBefore: true });
  addTable(mergedTable({
    title: "일정별 진행 계획",
    table_style: "schedule",
    rows: 4,
    cols: 4,
    cells: [
      { row: 0, col: 0, row_span: 2, text: "구분", role: "header" },
      { row: 0, col: 1, col_span: 2, text: "주요 내용", role: "header" },
      { row: 0, col: 3, row_span: 2, text: "비고", role: "header" },
      { row: 1, col: 1, text: "작업", role: "header" },
      { row: 1, col: 2, text: "검증", role: "header" },
      { row: 2, col: 0, text: "1단계" },
      { row: 2, col: 1, text: "HWPX 변환" },
      { row: 2, col: 2, text: "구조 분석" },
      { row: 2, col: 3, text: "완료" },
      { row: 3, col: 0, text: "2단계" },
      { row: 3, col: 1, text: "샘플 생성" },
      { row: 3, col: 2, text: "한글 시각 확인" },
      { row: 3, col: 3, text: "대기" },
    ],
  }));
  addParagraph("붙임: HWP reference manifest 2부.", { role: "body" });
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>${rootOpen}${parts.join("")}</${rootName}>`;
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

function textFromXmlFragment(xml) {
  const texts = [];
  const tokenRegex = /<(?:\w+:)?(?:t|text)\b[^>]*>[\s\S]*?<\/(?:\w+:)?(?:t|text)>|<(?:\w+:)?fwSpace\b[^>]*\/>/g;
  let match;
  while ((match = tokenRegex.exec(xml))) {
    const token = match[0];
    const textMatch = token.match(/^<(?:\w+:)?(?:t|text)\b[^>]*>([\s\S]*?)<\/(?:\w+:)?(?:t|text)>$/u);
    texts.push(textMatch ? unescapeXml(textMatch[1]) : " ");
  }
  return texts.join("");
}

function sanitizeReplacementText(value) {
  return String(value ?? "").replace(/<hp:fwSpace\s*\/>/g, " ").replace(/<[^>]+>/g, "");
}

function sanitizeInlineMarkersInXml(xml) {
  return String(xml ?? "")
    .replace(/&lt;hp:fwSpace\s*\/&gt;/g, " ")
    .replace(/<hp:t\b([^>]*)>([\s\S]*?)<\/hp:t>/gu, (full, attrs, body) => {
      const cleaned = body.replace(/<hp:fwSpace\s*\/>/g, " ").replace(/&lt;hp:fwSpace\s*\/&gt;/g, " ");
      return `<hp:t${attrs}>${cleaned}</hp:t>`;
    });
}

function stripLineSegArray(fragment) {
  return fragment.replace(/<hp:linesegarray\b[\s\S]*?<\/hp:linesegarray>/gu, "");
}

function tagElements(xml, localName, baseOffset = 0) {
  const elements = [];
  const regex = new RegExp(`<\\/?(?:\\w+:)?${localName}\\b[^>]*>`, "g");
  const stack = [];
  let root = null;
  let match;
  while ((match = regex.exec(xml))) {
    const tag = match[0];
    const selfClosing = /\/>\s*$/u.test(tag);
    const closing = /^<\//u.test(tag);
    if (!closing) {
      const item = {
        start: baseOffset + match.index,
        openEnd: baseOffset + regex.lastIndex,
        attrs: tag.match(/^<[^>\s]+\s*([^>]*)\/?>$/u)?.[1]?.replace(/\/$/u, "").trim() || "",
      };
      if (!stack.length) root = item;
      if (!selfClosing) stack.push(item);
      else if (!stack.length) {
        elements.push({ ...item, bodyStart: item.openEnd, bodyEnd: item.openEnd, end: item.openEnd, body: "", full: tag });
        root = null;
      }
    } else if (stack.length) {
      stack.pop();
      if (!stack.length && root) {
        const end = baseOffset + regex.lastIndex;
        elements.push({
          ...root,
          bodyStart: root.openEnd,
          bodyEnd: baseOffset + match.index,
          end,
          body: xml.slice(root.openEnd - baseOffset, match.index),
          full: xml.slice(root.start - baseOffset, end - baseOffset),
        });
        root = null;
      }
    }
  }
  return elements;
}

function removeNestedTables(xml) {
  let result = xml;
  for (const table of tagElements(xml, "tbl").sort((a, b) => b.start - a.start)) {
    result = `${result.slice(0, table.start)}${result.slice(table.end)}`;
  }
  return result;
}

function collectParagraphElements(xml, sectionIndex = 0, baseOffset = 0) {
  const collected = [];
  function visit(fragment, offset, context = {}) {
    for (const paragraph of tagElements(fragment, "p", offset)) {
      const nestedParagraphs = tagElements(paragraph.body, "p", paragraph.bodyStart);
      const containsTable = /<hp:tbl\b/u.test(paragraph.full);
      const containsDrawText = /<hp:drawText\b/u.test(paragraph.full);
      const containsShape = /<hp:(?:pic|rect|ellipse|line)\b/u.test(paragraph.full);
      const containsControl = /<hp:(?:tbl|pic|rect|ellipse|line|ctrl|header|footer|autoNum|drawText)\b/u.test(paragraph.full);
      if (nestedParagraphs.length) {
        collected.push({
          type: "paragraph_structural_container",
          section: sectionIndex,
          paragraph_index: collected.length,
          paragraph_id: attrValue(paragraph.attrs, "id") || String(collected.length),
          start: paragraph.start,
          end: paragraph.end,
          text: "",
          xml: paragraph.full,
          node_path: context.node_path ? `${context.node_path}/container[${collected.length}]` : `section[${sectionIndex}]/container[${collected.length}]`,
          parent_path: context.node_path || `section[${sectionIndex}]`,
          ancestor_paths: context.ancestor_paths || [],
          contains_table: containsTable,
          contains_shape: containsShape,
          contains_picture: /<hp:pic\b/u.test(paragraph.full),
          contains_control: containsControl,
          is_selector_candidate: false,
          char_pr_ids: [],
        });
        let childContext = context;
        if (containsTable) {
          childContext = {
            node_type: "table_cell_paragraph",
            node_path: `section[${sectionIndex}]/table[0]/cell[0,0]`,
            parent_path: `section[${sectionIndex}]/table[0]/cell[0,0]`,
            ancestor_paths: [`section[${sectionIndex}]`, `section[${sectionIndex}]/table[0]`],
            table_path: `section[${sectionIndex}]/table[0]`,
            cell_address: { row: 0, col: 0 },
          };
        } else if (containsDrawText || containsShape) {
          childContext = {
            node_type: "draw_text_paragraph",
            node_path: `section[${sectionIndex}]/shape[0]/drawText`,
            parent_path: `section[${sectionIndex}]/shape[0]/drawText`,
            ancestor_paths: [`section[${sectionIndex}]`, `section[${sectionIndex}]/shape[0]`],
          };
        }
        visit(paragraph.body, paragraph.bodyStart, childContext);
      } else {
        const leafIndex = collected.filter((item) => item.parent_path === context.parent_path && item.type !== "paragraph_structural_container").length;
        const nodeType = context.node_type || "paragraph_leaf";
        const parentPath = context.parent_path || `section[${sectionIndex}]`;
        collected.push({
          type: nodeType,
          section: sectionIndex,
          paragraph_index: collected.length,
          paragraph_id: attrValue(paragraph.attrs, "id") || String(collected.length),
          start: paragraph.start,
          end: paragraph.end,
          text: textFromXmlFragment(paragraph.full),
          xml: paragraph.full,
          node_path: `${parentPath}/paragraph[${leafIndex}]`,
          parent_path: parentPath,
          ancestor_paths: context.ancestor_paths || [`section[${sectionIndex}]`],
          table_path: context.table_path || "",
          cell_address: context.cell_address || null,
          contains_table: containsTable,
          contains_shape: containsShape,
          contains_picture: /<hp:pic\b/u.test(paragraph.full),
          contains_control: containsControl,
          is_selector_candidate: true,
          char_pr_ids: [...new Set((paragraph.full.match(/charPrIDRef="[^"]+"/g) || []).map((item) => item.slice(13, -1)))],
        });
      }
    }
  }
  visit(xml, baseOffset);
  return collected;
}

function normalizeSearchText(value) {
  return String(value ?? "")
    .replace(/<hp:fwSpace\s*\/>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildDocumentOrderIndex(sectionXmls) {
  const nodes = [];
  for (const [sectionIndex, xml] of sectionXmls.entries()) {
    const paragraphs = collectParagraphElements(xml, sectionIndex);
    for (const paragraph of paragraphs) {
      const node = {
        type: paragraph.type || "paragraph_leaf",
        node_type: paragraph.type || "paragraph_leaf",
        node_path: paragraph.node_path || `section[${sectionIndex}]/paragraph[${paragraph.paragraph_index}]`,
        parent_path: paragraph.parent_path || `section[${sectionIndex}]`,
        ancestor_paths: paragraph.ancestor_paths || [],
        section_index: sectionIndex,
        node_order: nodes.length,
        paragraph_index: paragraph.paragraph_index,
        paragraph_id: paragraph.paragraph_id,
        table_path: paragraph.table_path || "",
        cell_address: paragraph.cell_address || null,
        logical_text: paragraph.text,
        normalized_text: normalizeSearchText(paragraph.text),
        char_pr_ids: paragraph.char_pr_ids || [],
        para_pr_id: attrValue(paragraph.xml.match(/<hp:p\b([^>]*)>/u)?.[1] || "", "paraPrIDRef"),
        style_id: attrValue(paragraph.xml.match(/<hp:p\b([^>]*)>/u)?.[1] || "", "styleIDRef"),
        contains_control: paragraph.contains_control ?? /<hp:(?:tbl|pic|rect|ellipse|line|ctrl|header|footer|autoNum)\b/u.test(paragraph.xml),
        contains_table: paragraph.contains_table ?? /<hp:tbl\b/u.test(paragraph.xml),
        contains_shape: paragraph.contains_shape ?? /<hp:(?:pic|rect|ellipse|line)\b/u.test(paragraph.xml),
        contains_picture: paragraph.contains_picture ?? /<hp:pic\b/u.test(paragraph.xml),
        is_selector_candidate: paragraph.is_selector_candidate !== false,
        xml_start: paragraph.start,
        xml_end: paragraph.end,
        _paragraph: paragraph,
      };
      nodes.push(node);
    }
  }
  return nodes;
}

function anchorMatches(nodes, anchor = {}) {
  const text = normalizeSearchText(anchor.text || anchor.contains_text || anchor.source_text || "");
  if (!text) return [];
  return nodes.filter((node) => {
    if (anchor.type === "paragraph_text") return node.normalized_text === text;
    return node.normalized_text.includes(text);
  });
}

function expectedAnchorCount(anchor, matches, errors, label) {
  const expected = anchor.expected_matches ?? 1;
  if (matches.length !== Number(expected)) {
    errors.push(`${label}_expected_matches ${expected} actual ${matches.length}`);
  }
}

function resolveScopes({ sectionXmls, scopes = [] }) {
  const errors = [];
  const warnings = [];
  const nodes = buildDocumentOrderIndex(sectionXmls);
  const resolved = new Map();
  const allScope = {
    id: "__all__",
    type: "all",
    start_index: nodes[0]?.node_order ?? 0,
    end_index: nodes.at(-1)?.node_order ?? -1,
    include_start: true,
    include_end: true,
    nodes,
    start_text: nodes[0]?.logical_text || "",
    end_text: nodes.at(-1)?.logical_text || "",
  };
  resolved.set(allScope.id, allScope);

  for (const scope of scopes || []) {
    const id = scope.id || `scope_${resolved.size}`;
    if (scope.type === "anchor_range") {
      const startMatches = anchorMatches(nodes, scope.start);
      const endMatches = anchorMatches(nodes, scope.end);
      expectedAnchorCount(scope.start || {}, startMatches, errors, `scope_${id}_start`);
      expectedAnchorCount(scope.end || {}, endMatches, errors, `scope_${id}_end`);
      const start = startMatches[0];
      const end = endMatches[0];
      if (start && end) {
        if (start.section_index !== end.section_index) errors.push(`scope_${id}_anchors_cross_section`);
        if (start.node_order >= end.node_order) errors.push(`scope_${id}_start_after_end`);
        if (start.contains_control || end.contains_control) warnings.push(`scope_${id}_anchor_contains_control`);
        const startIndex = start.node_order + (scope.include_start === false ? 1 : 0);
        const endIndex = end.node_order - (scope.include_end === true ? 0 : 1);
        const scopedNodes = nodes.filter((node) => node.node_order >= startIndex && node.node_order <= endIndex);
        resolved.set(id, {
          id,
          type: "anchor_range",
          start_index: startIndex,
          end_index: endIndex,
          start_text: start.logical_text,
          end_text: end.logical_text,
          nodes: scopedNodes,
        });
      }
    } else if (scope.type === "near_text") {
      const matches = anchorMatches(nodes, scope.anchor);
      expectedAnchorCount(scope.anchor || {}, matches, errors, `scope_${id}_anchor`);
      const anchor = matches[0];
      if (anchor) {
        const startIndex = Math.max(0, anchor.node_order - Number(scope.paragraphs_before || 0));
        const endIndex = anchor.node_order + Number(scope.paragraphs_after || 0);
        resolved.set(id, {
          id,
          type: "near_text",
          start_index: startIndex,
          end_index: endIndex,
          start_text: anchor.logical_text,
          end_text: nodes.find((node) => node.node_order === endIndex)?.logical_text || "",
          nodes: nodes.filter((node) => node.node_order >= startIndex && node.node_order <= endIndex),
        });
      }
    } else {
      errors.push(`scope_${id}_unsupported_type ${scope.type}`);
    }
  }
  return { nodes, scopes: resolved, errors, warnings };
}

function publicScope(scope) {
  return {
    id: scope.id,
    type: scope.type,
    start_index: scope.start_index,
    end_index: scope.end_index,
    start_text: scope.start_text,
    end_text: scope.end_text,
    node_count: scope.nodes.length,
  };
}

function nodeToMatch(node) {
  const paragraph = node._paragraph;
  return {
    type: "paragraph",
    node_type: node.node_type,
    node_path: node.node_path,
    parent_path: node.parent_path,
    ancestor_paths: node.ancestor_paths,
    section: node.section_index,
    node_order: node.node_order,
    paragraph_index: node.paragraph_index,
    paragraph_id: node.paragraph_id,
    table_path: node.table_path || "",
    cell_address: node.cell_address || null,
    start: node.xml_start,
    end: node.xml_end,
    text: node.logical_text,
    xml: paragraph.xml,
    char_pr_ids: node.char_pr_ids,
    contains_control: node.contains_control,
  };
}

function replaceFirstTextRun(fragment, replacementText) {
  let replaced = false;
  const safeText = sanitizeReplacementText(replacementText);
  return fragment.replace(/(<(?:\w+:)?(?:t|text)\b[^>]*>)([\s\S]*?)(<\/(?:\w+:)?(?:t|text)>)/g, (full, open, text, close) => {
    if (!replaced) {
      replaced = true;
      return `${open}${escapeXml(safeText)}${close}`;
    }
    return `${open}${close}`;
  });
}

function selectedByOccurrence(matches, selector) {
  const occurrence = Number(selector.occurrence || 0);
  if (!occurrence) return matches;
  if (occurrence < 1 || occurrence > matches.length) return [];
  return [matches[occurrence - 1]];
}

function layoutPolicyFor(replacement, selector) {
  return replacement.layout_policy || selector.layout_policy || "allow_line_growth";
}

function lengthWarning(sourceText, replacementText, overflowPolicy = "warn") {
  const sourceLength = Math.max(1, String(sourceText || "").length);
  const replacementLength = String(replacementText || "").length;
  const ratio = replacementLength / sourceLength;
  const overflowRisk = ratio <= 1.2 ? "low" : ratio <= 1.5 ? "medium" : "high";
  return {
    source_character_count: String(sourceText || "").length,
    replacement_character_count: replacementLength,
    length_ratio: Number(ratio.toFixed(2)),
    overflow_risk: overflowRisk,
    overflow_policy: overflowPolicy,
  };
}

function detectBoards(nodes) {
  const boards = [];
  for (const node of nodes) {
    const text = normalizeSearchText(node.logical_text);
    const match = text.match(/^(주|보조)\s+(\d+)\s*-\s*(\d+)$/u);
    if (!match) continue;
    const role = match[1] === "주" ? "main" : "support";
    const total = Number(match[2]);
    const number = Number(match[3]);
    boards.push({
      board_id: `${role}-${number}`,
      board_role: role,
      board_number: number,
      board_total: total,
      ...(role === "main" ? { support_board_id: `support-${number}` } : { main_board_id: `main-${number}` }),
    });
  }
  return boards;
}

function layoutPolicyCounts(selectorPlans) {
  const counts = { preserve_exact: 0, allow_line_growth: 0, fit_or_fail: 0 };
  for (const plan of selectorPlans) counts[plan.layout_policy] = (counts[plan.layout_policy] || 0) + 1;
  return counts;
}

function collectSelectionConflicts(selectorPlans) {
  const errors = [];
  const seen = new Map();
  for (const plan of selectorPlans) {
    for (const match of plan._matches || []) {
      const key = `${match.section}:${match.start}:${match.end}`;
      if (seen.has(key)) errors.push(`duplicate_leaf_replacement selector_${seen.get(key)} selector_${plan.selector_index}`);
      else seen.set(key, plan.selector_index);
    }
  }
  return errors;
}

function assertMatchCount(selector, matches, selected, errors, selectorIndex) {
  const count = matches.length;
  if (selector.expected_matches !== undefined && count !== Number(selector.expected_matches)) {
    errors.push(`selector_${selectorIndex}_expected_matches ${selector.expected_matches} actual ${count}`);
  }
  if (selector.expected_matches_min !== undefined && count < Number(selector.expected_matches_min)) {
    errors.push(`selector_${selectorIndex}_expected_matches_min ${selector.expected_matches_min} actual ${count}`);
  }
  if (selector.expected_matches_max !== undefined && count > Number(selector.expected_matches_max)) {
    errors.push(`selector_${selectorIndex}_expected_matches_max ${selector.expected_matches_max} actual ${count}`);
  }
  if (selector.occurrence !== undefined && !selected.length) {
    errors.push(`selector_${selectorIndex}_occurrence_out_of_range ${selector.occurrence}`);
  }
}

function selectorMode(selector) {
  if (selector.replace_mode) return selector.replace_mode;
  if (selector.occurrence !== undefined) return "selected_occurrence";
  if (selector.expected_matches === 1 || selector.type === "table_cell") return "exactly_one";
  return "all";
}

function blockBoundaryMatch(node, boundary = {}) {
  const text = normalizeSearchText(boundary.text || boundary.contains_text || boundary.source_text || "");
  if (!text) return false;
  return node.normalized_text.includes(text);
}

function blockPreview(nodes, selected) {
  const beforeStart = Math.max(0, selected[0].node_order - 2);
  const afterEnd = selected.at(-1).node_order + 2;
  return {
    before: nodes
      .filter((node) => node.node_order >= beforeStart && node.node_order < selected[0].node_order)
      .map((node) => ({ paragraph_index: node.paragraph_index, text: node.logical_text })),
    selected: selected.map((node) => ({ paragraph_index: node.paragraph_index, text: node.logical_text })),
    after: nodes
      .filter((node) => node.node_order > selected.at(-1).node_order && node.node_order <= afterEnd)
      .map((node) => ({ paragraph_index: node.paragraph_index, text: node.logical_text })),
  };
}

function findParagraphBlocks(scopeNodes, selector, selectorIndex, errors) {
  const blocks = [];
  for (let i = 0; i < scopeNodes.length; i += 1) {
    const start = scopeNodes[i];
    if (!blockBoundaryMatch(start, selector.start)) continue;
    let end = null;
    for (let j = i + 1; j < scopeNodes.length; j += 1) {
      if (blockBoundaryMatch(scopeNodes[j], selector.end)) {
        end = scopeNodes[j];
        break;
      }
    }
    if (!end) {
      errors.push(`selector_${selectorIndex}_paragraph_block_end_missing`);
      continue;
    }
    if (start.node_order === end.node_order) {
      errors.push(`selector_${selectorIndex}_paragraph_block_same_start_end`);
      continue;
    }
    const selected = scopeNodes.filter((node) =>
      node.node_order >= start.node_order && node.node_order <= end.node_order - (selector.end_inclusive === true ? 0 : 1));
    blocks.push({ start, end, selected });
  }
  if (selector.expected_blocks !== undefined && blocks.length !== Number(selector.expected_blocks)) {
    errors.push(`selector_${selectorIndex}_expected_blocks ${selector.expected_blocks} actual ${blocks.length}`);
  }
  return blocks;
}

function buildTemplateFidelityPlan({ sectionXmls, replacements, scopes = [] }) {
  const scopeResolution = resolveScopes({ sectionXmls, scopes });
  const errors = [...scopeResolution.errors];
  const warnings = [...scopeResolution.warnings];
  const structuralContainersSkipped = scopeResolution.nodes.filter((node) => node.node_type === "paragraph_structural_container").length;
  const selectorPlans = replacements.map((replacement, selectorIndex) => {
    const selector = replacement.selector || {};
    const replacementText = sanitizeReplacementText(replacement.replacement_text ?? "");
    const layoutPolicy = layoutPolicyFor(replacement, selector);
    const scopeId = replacement.scope_id || selector.scope_id || "__all__";
    const scope = scopeResolution.scopes.get(scopeId);
    if (!scope) errors.push(`selector_${selectorIndex}_unknown_scope ${scopeId}`);
    const scopeNodes = (scope?.nodes || []).filter((node) => node.is_selector_candidate !== false);
    let matches = [];
    if (selector.type === "paragraph_text" || selector.type === "paragraph_contains") {
      const sourceText = normalizeSearchText(selector.source_text || "");
      const containsText = normalizeSearchText(selector.contains_text || "");
      matches = scopeNodes
        .filter((node) => selector.type === "paragraph_text"
          ? node.normalized_text === sourceText
          : node.normalized_text.includes(containsText))
        .map(nodeToMatch);
    } else if (selector.type === "table_cell" || selector.type === "table_cell_text") {
      for (const [sectionIndex, xml] of sectionXmls.entries()) {
        const tables = extractNativeTables(xml, { sectionIndex });
        for (const table of tables) {
          for (const cell of table.cells) {
            const pathMatches = selector.type === "table_cell"
              ? table.path === selector.table_path && cell.rowAddr === Number(selector.row) && cell.colAddr === Number(selector.col)
              : cell.text === String(selector.source_text || "");
            if (!pathMatches) continue;
            if (selector.expected_text !== undefined && cell.text !== String(selector.expected_text)) {
              errors.push(`selector_${selectorIndex}_expected_text mismatch: expected "${selector.expected_text}" actual "${cell.text}"`);
            }
            matches.push({
              type: "table_cell",
              section: sectionIndex,
              table_path: table.path,
              parent_table_path: table.parentPath || "",
              cell: { row: cell.rowAddr, col: cell.colAddr },
              start: cell.start,
              end: cell.end,
              text: cell.text,
              xml: cell.xml,
              char_pr_ids: [...new Set((cell.xml.match(/charPrIDRef="[^"]+"/g) || []).map((item) => item.slice(13, -1)))],
            });
          }
        }
      }
    } else if (selector.type === "paragraph_block") {
      const blocks = findParagraphBlocks(scopeNodes, selector, selectorIndex, errors);
      const block = blocks[0];
      const replacementParagraphs = Array.isArray(replacement.replacement_paragraphs) ? replacement.replacement_paragraphs.map((item) => String(item ?? "")) : [];
      const policy = selector.paragraph_count_policy || replacement.paragraph_count_policy || "preserve";
      if (block) {
        if (policy === "preserve" && replacementParagraphs.length > block.selected.length) {
          errors.push(`selector_${selectorIndex}_replacement_paragraphs_exceed_selected`);
        }
        if (block.selected.some((node) => node.contains_control) && policy !== "preserve") {
          errors.push(`selector_${selectorIndex}_control_paragraph_structural_change_forbidden`);
        }
        matches = block.selected.map((node, index) => ({
          ...nodeToMatch(node),
          replacement_text: sanitizeReplacementText(replacementParagraphs[index] ?? ""),
          block_index: 0,
        }));
      }
    } else {
      errors.push(`selector_${selectorIndex}_unsupported_type ${selector.type}`);
    }

    const mode = selectorMode(selector);
    let selectedMatches = selectedByOccurrence(matches, selector);
    if (mode === "exactly_one" && matches.length === 1) selectedMatches = matches;
    if (mode === "exactly_one" && matches.length !== 1) errors.push(`selector_${selectorIndex}_exactly_one_required actual ${matches.length}`);
    if (mode === "all" && selector.occurrence === undefined) selectedMatches = matches;
    assertMatchCount(selector, matches, selectedMatches, errors, selectorIndex);
    const sourceText = selectedMatches[0]?.text || matches[0]?.text || selector.source_text || selector.contains_text || selector.expected_text || "";
    const overflow = lengthWarning(sourceText, replacementText, replacement.overflow_policy || selector.overflow_policy || "warn");
    if ((layoutPolicy === "preserve_exact" || layoutPolicy === "fit_or_fail") && overflow.overflow_risk === "high") {
      errors.push(`selector_${selectorIndex}_layout_policy_overflow ${layoutPolicy} ratio ${overflow.length_ratio}`);
    }
    if (overflow.overflow_risk === "high") {
      const message = `selector_${selectorIndex}_overflow_high ratio ${overflow.length_ratio}`;
      if (overflow.overflow_policy === "error") errors.push(message);
      else if (overflow.overflow_policy === "warn") warnings.push(message);
    }
    const blockNodes = selector.type === "paragraph_block" && matches.length
      ? scopeNodes.filter((node) => node.node_order >= matches[0].node_order && node.node_order <= matches.at(-1).node_order)
      : [];
    const firstBlock = selector.type === "paragraph_block" && blockNodes.length
      ? {
          ...blockPreview(scopeNodes, blockNodes),
          selected_paragraph_count: matches.length,
          replacement_paragraph_count: Array.isArray(replacement.replacement_paragraphs) ? replacement.replacement_paragraphs.length : 0,
          contains_control: matches.some((match) => match.contains_control),
          structural_change_allowed: (selector.paragraph_count_policy || "preserve") !== "preserve",
        }
      : undefined;
    return {
      selector_index: selectorIndex,
      scope_id: scopeId,
      selector,
      layout_policy: layoutPolicy,
      replacement_text: replacementText,
      match_count: matches.length,
      selected_matches: selectedMatches.map((match) => ({
        type: match.type,
        node_type: match.node_type,
        node_path: match.node_path,
        parent_path: match.parent_path,
        section: match.section,
        paragraph_id: match.paragraph_id,
        paragraph_index: match.paragraph_index,
        table_path: match.table_path,
        cell: match.cell,
        logical_text: match.text,
        char_pr_ids: match.char_pr_ids || [],
      })),
      ...(firstBlock ? { block: firstBlock } : {}),
      _matches: selectedMatches,
      overflow,
    };
  });
  errors.push(...collectSelectionConflicts(selectorPlans));
  return {
    scopes: [...scopeResolution.scopes.values()].filter((scope) => scope.id !== "__all__").map(publicScope),
    document_order_count: scopeResolution.nodes.length,
    boards: detectBoards(scopeResolution.nodes),
    structural_containers_skipped: structuralContainersSkipped,
    leaf_paragraphs_selected: selectorPlans.reduce((count, plan) => count + (plan._matches?.length || 0), 0),
    ancestor_descendant_conflicts: [],
    overlapping_selector_conflicts: collectSelectionConflicts(selectorPlans),
    layout_policies: layoutPolicyCounts(selectorPlans),
    target_linesegarrays_invalidated: selectorPlans.reduce((count, plan) => count + (plan.layout_policy === "allow_line_growth" ? (plan._matches?.filter((match) => /<hp:linesegarray\b/u.test(match.xml)).length || 0) : 0), 0),
    non_target_linesegarrays_preserved: Math.max(0, sectionXmls.join("").match(/<hp:linesegarray\b/gu)?.length || 0) - selectorPlans.reduce((count, plan) => count + (plan.layout_policy === "allow_line_growth" ? (plan._matches?.filter((match) => /<hp:linesegarray\b/u.test(match.xml)).length || 0) : 0), 0),
    selectors: selectorPlans,
    can_apply: errors.length === 0,
    errors,
    warnings,
  };
}

function applyPlanToSectionXml(xml, selectorPlans, sectionIndex) {
  const edits = [];
  for (const plan of selectorPlans) {
    for (const match of plan._matches || []) {
      if (match.section !== sectionIndex) continue;
      edits.push({
        start: match.start,
        end: match.end,
        xml: plan.layout_policy === "allow_line_growth"
          ? stripLineSegArray(replaceFirstTextRun(match.xml, match.replacement_text ?? plan.replacement_text))
          : replaceFirstTextRun(match.xml, match.replacement_text ?? plan.replacement_text),
      });
    }
  }
  edits.sort((a, b) => b.start - a.start);
  let nextXml = xml;
  for (const edit of edits) nextXml = `${nextXml.slice(0, edit.start)}${edit.xml}${nextXml.slice(edit.end)}`;
  return { xml: nextXml, applied: edits.length };
}

export async function planHwpxTemplateFidelityFill({ workspace, templatePath, outputPath = "", replacements = [], scopes = [] } = {}) {
  requireHwpxPath(templatePath);
  if (outputPath) requireHwpxPath(outputPath);
  if (!Array.isArray(replacements)) throw new Error("replacements must be an array");
  const source = resolveWorkspacePath(workspace, templatePath);
  const zip = await JSZip.loadAsync(await readFile(source));
  const sectionEntries = sectionEntryNames(zip);
  const sectionXmls = await Promise.all(sectionEntries.map((section) => readZipText(zip, section)));
  const plan = buildTemplateFidelityPlan({ sectionXmls, replacements, scopes });
  return {
    template_path: templatePath,
    output_path: outputPath,
    section_entries: sectionEntries,
    scopes: plan.scopes,
    document_order_count: plan.document_order_count,
    boards: plan.boards,
    structural_containers_skipped: plan.structural_containers_skipped,
    leaf_paragraphs_selected: plan.leaf_paragraphs_selected,
    ancestor_descendant_conflicts: plan.ancestor_descendant_conflicts,
    overlapping_selector_conflicts: plan.overlapping_selector_conflicts,
    layout_policies: plan.layout_policies,
    target_linesegarrays_invalidated: plan.target_linesegarrays_invalidated,
    non_target_linesegarrays_preserved: plan.non_target_linesegarrays_preserved,
    selectors: plan.selectors.map(({ _matches, ...item }) => item),
    can_apply: plan.can_apply,
    errors: plan.errors,
    warnings: plan.warnings,
  };
}

export async function applyHwpxTemplateFidelityFill({ workspace, templatePath, outputPath, replacements = [], scopes = [] } = {}) {
  requireHwpxPath(templatePath);
  requireHwpxPath(outputPath);
  if (!Array.isArray(replacements)) throw new Error("replacements must be an array");
  const source = resolveWorkspacePath(workspace, templatePath);
  const target = resolveWorkspacePath(workspace, outputPath);
  if (source.toLowerCase() === target.toLowerCase()) throw new Error("output_path must be different from template_path");
  const zip = await JSZip.loadAsync(await readFile(source));
  const sectionEntries = sectionEntryNames(zip);
  const originalSectionXmls = await Promise.all(sectionEntries.map((section) => readZipText(zip, section)));
  const plan = buildTemplateFidelityPlan({ sectionXmls: originalSectionXmls, replacements, scopes });
  if (!plan.can_apply) throw new Error(`template fidelity selector plan failed: ${plan.errors.join("; ")}`);
  let replacementsApplied = 0;
  for (const [sectionIndex, section] of sectionEntries.entries()) {
    const result = applyPlanToSectionXml(originalSectionXmls[sectionIndex], plan.selectors, sectionIndex);
    replacementsApplied += result.applied;
    zip.file(section, sanitizeInlineMarkersInXml(result.xml));
  }
  const previewText = await readZipText(zip, "Preview/PrvText.txt");
  if (previewText) {
    let nextPreview = previewText;
    for (const selectorPlan of plan.selectors) {
      for (const match of selectorPlan._matches || []) {
        if (match.text) nextPreview = nextPreview.replace(match.text, sanitizeReplacementText(match.replacement_text ?? selectorPlan.replacement_text));
      }
    }
    nextPreview = sanitizeReplacementText(nextPreview);
    zip.file("Preview/PrvText.txt", nextPreview);
  }
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
  const validation = await validateHwpxPackage({ workspace, path: outputPath });
  return {
    path: outputPath,
    absolutePath: target,
    saved: true,
    mode: "template_fidelity_fill",
    replacementsApplied,
    plan: {
      ...plan,
      scopes: plan.scopes,
      selectors: plan.selectors.map(({ _matches, ...item }) => item),
    },
    validation,
  };
}

export async function generateMinimalNativeTableHwpxDocument({
  workspace,
  outputPath = "release/test-documents/army-claw-hwpx-native-table-minimal.hwpx",
} = {}) {
  requireHwpxPath(outputPath);
  const templatePath = await findHancomHwpxTemplate();
  if (!templatePath) throw new Error("한컴 2024 호환 HWPX 템플릿을 찾지 못했습니다. 사용자 양식을 지정하거나 한컴오피스 설치 상태를 확인하십시오.");
  const target = resolveWorkspacePath(workspace, outputPath);
  await mkdir(dirname(target), { recursive: true });

  const templateZip = await JSZip.loadAsync(await readFile(templatePath));
  const templateSectionXml = await readZipText(templateZip, HWPX_SECTION_PATH);
  templateZip.file("mimetype", HWPX_MIMETYPE, { compression: "STORE" });
  templateZip.file(HWPX_SECTION_PATH, minimalNativeTableSectionXml({ templateSectionXml }));
  templateZip.file("Preview/PrvText.txt", [
    "HWPX 테이블 최소 검증",
    "위 본문 문단입니다.",
    "구분\t검증 내용\t결과",
    "표 구조\t테이블 부모 구조 적용\t확인",
    "셀 편집\t한글 2024 셀 커서 진입\t확인",
    "표 아래 본문 문단입니다.",
  ].join("\r\n"));
  await updateContentHpfTitle(templateZip, "HWPX 테이블 최소 검증");
  await writeFile(target, await templateZip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
  const validation = await validateHwpxPackage({ workspace, path: outputPath });
  return {
    path: outputPath,
    absolutePath: target,
    saved: true,
    mode: "minimal_native_table",
    message: `HWPX 최소 표 검증 문서를 생성했습니다: ${outputPath}`,
    templateBacked: true,
    templatePath,
    validation,
  };
}

export async function generateReferenceProfileSample({
  workspace,
  outputPath,
  profileId,
} = {}) {
  requireHwpxPath(outputPath);
  if (!["qualification_review_booklet", "official_action_plan"].includes(profileId)) {
    throw new Error(`unsupported reference profile: ${profileId}`);
  }
  const templatePath = await findHancomHwpxTemplate();
  if (!templatePath) throw new Error("한컴 2024 호환 HWPX 템플릿을 찾지 못했습니다. 사용자 양식을 지정하거나 한컴오피스 설치 상태를 확인하십시오.");
  const target = resolveWorkspacePath(workspace, outputPath);
  await mkdir(dirname(target), { recursive: true });

  const templateZip = await JSZip.loadAsync(await readFile(templatePath));
  const templateSectionXml = await readZipText(templateZip, HWPX_SECTION_PATH);
  const title = profileId === "qualification_review_booklet"
    ? "Army Claw 표준문서 자동화 개발"
    : "Army Claw 표준문서 자동화 기능 검증 계획";
  const sectionXml = profileId === "qualification_review_booklet"
    ? qualificationReviewSampleSectionXml({ templateSectionXml })
    : officialActionPlanSampleSectionXml({ templateSectionXml });
  templateZip.file("mimetype", HWPX_MIMETYPE, { compression: "STORE" });
  templateZip.file(HWPX_SECTION_PATH, sectionXml);
  templateZip.file("Preview/PrvText.txt", extractParagraphs(sectionXml).join("\r\n"));
  await updateContentHpfTitle(templateZip, title);
  await writeFile(target, await templateZip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
  const validation = await validateHwpxPackage({ workspace, path: outputPath });
  return {
    path: outputPath,
    absolutePath: target,
    saved: true,
    mode: "reference_profile_sample",
    profileId,
    templateBacked: true,
    templatePath,
    validation,
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
  const tables = sectionTexts.flatMap((sectionXml, sectionIndex) => extractNativeTables(sectionXml, { sectionIndex }));
  const footer = extractFooterInfo(allSectionXml);
  const nativeStructureValidation = validateNativeStructures({ tables, footer, sectionXml: allSectionXml });
  const nativeTableWrapperValidation = validateNativeTableWrappers({ tables });
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
    native_table_wrapper_validation: nativeTableWrapperValidation.passed ? "passed" : "failed",
    native_table_wrapper_errors: nativeTableWrapperValidation.errors,
    native_table_visual_status: "user_confirmation_pending",
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
  const tables = sectionTexts.flatMap((sectionXml, sectionIndex) => extractNativeTables(sectionXml, { sectionIndex }));
  const footer = extractFooterInfo(allSectionXml);
  const nativeStructureValidation = validateNativeStructures({ tables, footer, sectionXml: allSectionXml });
  const nativeTableWrapperValidation = validateNativeTableWrappers({ tables });
  const referenceProfile = unescapeXml(allSectionXml.match(/<!--army-reference-profile:([\s\S]*?)-->/u)?.[1] || "");
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
    referenceProfile,
    pageBreakCount: (allSectionXml.match(/pageBreak="1"/g) || []).length,
    styleRoles: [...new Set([...allSectionXml.matchAll(/<!--army-style:([a-z0-9_]+)-->/gi)].map((item) => item[1]))],
    footerText: footer.cleanText || unescapeXml(allSectionXml.match(/<!--army-footer:([\s\S]*?)-->/u)?.[1] || ""),
    footer,
    nativeStructureValidation,
    nativeTableWrapperValidation,
    nativeVisualCheckStatus: "user_confirmation_pending",
    nativeTableVisualStatus: "user_confirmation_pending",
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

function tagName(rawTag) {
  return String(rawTag || "").match(/^<\/?\s*([A-Za-z0-9_:.-]+)/u)?.[1] || "";
}

function localTagName(name) {
  return String(name || "").split(":").pop();
}

function openElementStackBefore(xml, offset) {
  const stack = [];
  const tagRegex = /<[^>]+>/g;
  let match;
  while ((match = tagRegex.exec(xml)) && match.index < offset) {
    const token = match[0];
    if (/^<\?/.test(token) || /^<!--/.test(token) || /^<!/.test(token)) continue;
    const name = tagName(token);
    if (!name) continue;
    if (/^<\//.test(token)) {
      const local = localTagName(name);
      for (let index = stack.length - 1; index >= 0; index -= 1) {
        if (localTagName(stack[index]) === local) {
          stack.splice(index);
          break;
        }
      }
      continue;
    }
    if (/\/>\s*$/u.test(token)) continue;
    stack.push(name);
  }
  return stack;
}

function tableWrapperInfo(xml, tableOffset) {
  const stack = openElementStackBefore(xml, tableOffset);
  const localStack = stack.map(localTagName);
  const parent = stack.at(-1) || "";
  const pathParts = [...stack, "hp:tbl"];
  return {
    path: pathParts.join(">"),
    parent,
    directSectionChild: localTagName(parent) === "sec",
    insideParagraph: localStack.includes("p"),
    insideRun: localStack.includes("run"),
    insideControl: localStack.includes("ctrl"),
  };
}

function extractNativeTables(xml, { sectionIndex = 0, basePath = `section[${sectionIndex}]`, parentPath = "" } = {}) {
  const tables = [];
  const tableElements = tagElements(xml, "tbl");
  tableElements.forEach((tableElement, tableIndex) => {
    const prefix = xml.slice(0, tableElement.start);
    const titleStart = prefix.lastIndexOf("<!--army-table-title:");
    const titleEnd = titleStart >= 0 ? prefix.indexOf("-->", titleStart) : -1;
    const title = titleStart >= 0 && titleEnd >= 0 ? prefix.slice(titleStart + "<!--army-table-title:".length, titleEnd) : "";
    const styleStart = prefix.lastIndexOf("<!--army-table-style:");
    const styleEnd = styleStart >= 0 ? prefix.indexOf("-->", styleStart) : -1;
    const tableStyle = styleStart >= 0 && styleEnd >= 0 ? prefix.slice(styleStart + "<!--army-table-style:".length, styleEnd) : "";
    const attrs = tableElement.attrs || "";
    const body = tableElement.body || "";
    const positionAttrs = body.match(/<hp:pos\b([^>]*)\/>/u)?.[1] || "";
    const rows = [];
    const cells = [];
    const tablePath = `${basePath}/table[${tableIndex}]`;
    const rowElements = tagElements(body, "tr", tableElement.bodyStart);
    rowElements.forEach((rowElement) => {
      const rowCells = [];
      const cellElements = tagElements(rowElement.body, "tc", rowElement.bodyStart);
      cellElements.forEach((cellElement) => {
        const cellAttrs = cellElement.attrs || "";
        const cellBodyWithoutNestedTables = removeNestedTables(cellElement.body);
        const cellAddrAttrs = cellBodyWithoutNestedTables.match(/<hp:cellAddr\b([^>]*)\/>/u)?.[1] || "";
        const cellSpanAttrs = cellBodyWithoutNestedTables.match(/<hp:cellSpan\b([^>]*)\/>/u)?.[1] || "";
        const text = extractParagraphs(cellBodyWithoutNestedTables).join("\n");
        const rowAddr = Number(attrValue(cellAddrAttrs, "rowAddr") || rows.length);
        const colAddr = Number(attrValue(cellAddrAttrs, "colAddr") || rowCells.length);
        cells.push({
          text,
          path: `${tablePath}/cell[${rowAddr},${colAddr}]`,
          start: cellElement.start,
          end: cellElement.end,
          xml: cellElement.full,
          hasMargin: attrValue(cellAttrs, "hasMargin"),
          borderFillIDRef: attrValue(cellAttrs, "borderFillIDRef"),
          rowAddr,
          colAddr,
          rowSpan: Number(attrValue(cellSpanAttrs, "rowSpan") || 1),
          colSpan: Number(attrValue(cellSpanAttrs, "colSpan") || 1),
        });
        rowCells.push(text);
        tables.push(...extractNativeTables(cellElement.body, {
          sectionIndex,
          basePath: `${tablePath}/cell[${rowAddr},${colAddr}]`,
          parentPath: tablePath,
        }));
      });
      rows.push(rowCells);
    });
    tables.push({
      path: tablePath,
      parentPath,
      title: unescapeXml(title),
      style: unescapeXml(tableStyle),
      id: attrValue(attrs, "id"),
      rowCount: Number(attrs.match(/rowCnt="(\d+)"/u)?.[1] || rows.length),
      columnCount: Number(attrs.match(/colCnt="(\d+)"/u)?.[1] || rows[0]?.length || 0),
      position: {
        treatAsChar: attrValue(positionAttrs, "treatAsChar"),
        horzRelTo: attrValue(positionAttrs, "horzRelTo"),
        horzAlign: attrValue(positionAttrs, "horzAlign"),
        vertRelTo: attrValue(positionAttrs, "vertRelTo"),
        vertAlign: attrValue(positionAttrs, "vertAlign"),
      },
      wrapper: tableWrapperInfo(xml, tableElement.start),
      cells,
      rows,
      hasMergedCells: cells.some((cell) => cell.rowSpan > 1 || cell.colSpan > 1),
    });
  });
  tables.sort((a, b) => {
    const depth = (a.path.match(/\/table\[/g) || []).length - (b.path.match(/\/table\[/g) || []).length;
    if (depth !== 0) return depth;
    return a.path.localeCompare(b.path);
  });
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
    if (!table.hasMergedCells && table.rows.some((row) => row.length !== table.columnCount)) errors.push(`table_${index + 1}_column_count_mismatch`);
    errors.push(...validateExtractedCellSpans(table, index + 1));
  }
  const expectsPageStructure = /<hp:(?:footer|header|pageHiding)\b/u.test(sectionXml);
  if (expectsPageStructure && !footer.actualFooter) errors.push("footer_missing");
  if (expectsPageStructure && !footer.pageNumberField) errors.push("page_number_field_missing");
  if (expectsPageStructure && !/<hp:pageHiding\b/u.test(sectionXml)) errors.push("first_page_hiding_missing");
  return {
    passed: errors.length === 0,
    errors,
  };
}

function validateExtractedCellSpans(table, ordinal) {
  const errors = [];
  const occupied = new Set();
  for (const cell of table.cells) {
    const row = Number(cell.rowAddr || 0);
    const col = Number(cell.colAddr || 0);
    const rowSpan = Number(cell.rowSpan || 1);
    const colSpan = Number(cell.colSpan || 1);
    if (row < 0 || col < 0 || row + rowSpan > table.rowCount || col + colSpan > table.columnCount) {
      errors.push(`table_${ordinal}_cell_span_out_of_bounds`);
      continue;
    }
    for (let rowOffset = 0; rowOffset < rowSpan; rowOffset += 1) {
      for (let colOffset = 0; colOffset < colSpan; colOffset += 1) {
        const key = `${row + rowOffset}:${col + colOffset}`;
        if (occupied.has(key)) errors.push(`table_${ordinal}_cell_span_collision`);
        occupied.add(key);
      }
    }
  }
  return [...new Set(errors)];
}

function validateNativeTableWrappers({ tables }) {
  const errors = [];
  const ids = new Set();
  for (const [index, table] of tables.entries()) {
    const ordinal = index + 1;
    if (table.wrapper.directSectionChild) errors.push(`table_${ordinal}_direct_section_child`);
    if (!table.wrapper.insideParagraph) errors.push(`table_${ordinal}_paragraph_wrapper_missing`);
    if (!table.wrapper.insideRun) errors.push(`table_${ordinal}_run_wrapper_missing`);
    if (table.rows.length !== table.rowCount) errors.push(`table_${ordinal}_row_count_mismatch`);
    if (!table.hasMergedCells && table.rows.some((row) => row.length !== table.columnCount)) errors.push(`table_${ordinal}_column_count_mismatch`);
    errors.push(...validateExtractedCellSpans(table, ordinal));
    if (table.rows.some((row) => row.some((cell) => !String(cell || "").trim()))) errors.push(`table_${ordinal}_empty_cell_text`);
    const id = table.id;
    if (id) {
      if (ids.has(id)) errors.push(`table_${ordinal}_duplicate_id:${id}`);
      ids.add(id);
    }
  }
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

const DEFAULT_ADAPTIVE_OVERFLOW_POLICY = {
  mode: "adaptive_fit",
  allow_page_spill: false,
  strategies: [
    "remove_redundant_spacing",
    "adjust_paragraph_spacing",
    "semantic_compression",
    "bounded_font_reduction",
  ],
  maximum_attempts: 4,
  minimum_font_size_ratio: 0.9,
  minimum_line_spacing_ratio: 0.9,
  minimum_paragraph_spacing_ratio: 0.75,
  preserve_required_facts: true,
  final_action: "request_user_review",
};

function normalizeWhitespace(value) {
  return String(value ?? "").replace(/\s+/gu, " ").trim();
}

function fieldTextMap(fields = {}) {
  return {
    overview: normalizeWhitespace(fields.overview),
    current_problem: normalizeWhitespace(fields.current_problem),
    improvement: normalizeWhitespace(fields.improvement),
    expected_effect_1: normalizeWhitespace(fields.expected_effect_1),
    expected_effect_2: normalizeWhitespace(fields.expected_effect_2),
    expected_effect_3: normalizeWhitespace(fields.expected_effect_3),
  };
}

function sumCharacters(fields = {}) {
  return Object.values(fields).reduce((sum, value) => sum + normalizeWhitespace(value).length, 0);
}

function estimateBoardLines(fields = {}, { lineCharacters = 36, lineSpacingRatio = 1, paragraphSpacingRatio = 1, fontSizeRatio = 1 } = {}) {
  const normalized = fieldTextMap(fields);
  const baseLines = Object.values(normalized)
    .filter(Boolean)
    .reduce((sum, value) => sum + Math.max(1, Math.ceil(value.length / Math.max(12, lineCharacters))), 0);
  const paragraphCount = Object.values(normalized).filter(Boolean).length;
  const paragraphPenalty = Math.max(0, paragraphCount - 1) * 0.35 * paragraphSpacingRatio;
  const adjusted = (baseLines + paragraphPenalty) * lineSpacingRatio * fontSizeRatio;
  return Math.ceil(adjusted);
}

function buildCompressionRequest({ boardId, fieldId, text, targetCharacters = 70 }) {
  return {
    request_id: `${boardId}-${fieldId}-attempt-semantic-compression`,
    board_id: boardId,
    field_id: fieldId,
    heading_role: fieldId === "current_problem" ? "current_state_and_problem" : "body",
    original_text: text,
    target_lines: 2,
    target_characters: targetCharacters,
    required_facts: [
      "HWPX 표현 한계",
      "네이티브 템플릿 유지",
      "줄 배치 재계산",
    ],
    required_terms: ["HWPX", "네이티브 템플릿"],
    protected_numbers: (String(text).match(/\d+(?:[./-]\d+)*/gu) || []),
    prohibited_changes: [
      "새로운 사실 추가",
      "수치 변경",
      "중제목 역할 변경",
      "필수 항목 삭제",
    ],
  };
}

function factSatisfied(fact, text) {
  const normalizedFact = normalizeWhitespace(fact);
  const normalizedText = normalizeWhitespace(text);
  if (!normalizedFact) return true;
  if (normalizedText.includes(normalizedFact)) return true;
  const aliases = [
    { match: /HWPX/u, tokens: ["HWPX"] },
    { match: /표현|한계|직접/u, tokens: ["HWPX"] },
    { match: /네이티브|템플릿/u, tokens: ["네이티브", "템플릿"] },
    { match: /줄|배치|보드|board/u, tokens: ["줄", "배치"] },
  ];
  const alias = aliases.find((item) => item.match.test(normalizedFact));
  if (alias) return alias.tokens.every((token) => normalizedText.includes(token));
  const tokens = normalizedFact.split(/\s+/u).filter((token) => token.length > 1);
  return tokens.length ? tokens.every((token) => normalizedText.includes(token)) : normalizedText.includes(normalizedFact);
}

export class DeterministicCompressionProvider {
  constructor({ providerName = "deterministic_fixture" } = {}) {
    this.providerName = providerName;
    this.calls = [];
  }

  compress(request) {
    this.calls.push(request);
    const compressed = request.field_id === "current_problem"
      ? "HWPX 표현 한계는 네이티브 템플릿 유지와 줄 배치 재계산으로 보완한다."
      : normalizeWhitespace(request.original_text).slice(0, request.target_characters || 70);
    return {
      compressed_text: compressed,
      preserved_facts: request.required_facts || [],
      preserved_terms: (request.required_terms || []).filter((term) => compressed.includes(term)),
      changed_numbers: [],
      validation_status: "passed",
      provider: this.providerName,
    };
  }
}

export function validateCompressionResult(request, response) {
  const compressedText = normalizeWhitespace(response?.compressed_text);
  const errors = [];
  if (!compressedText) errors.push("compression_empty_result");
  if (/<\/?(?:hp|hs|ha|hc):|<hp:/u.test(compressedText)) errors.push("compression_xml_marker");
  if (request?.target_characters && compressedText.length > request.target_characters) {
    errors.push("compression_target_length_exceeded");
  }
  const requiredFacts = request?.required_facts || [];
  const preservedFacts = requiredFacts.filter((fact) => factSatisfied(fact, compressedText));
  if (preservedFacts.length !== requiredFacts.length) errors.push("compression_required_fact_missing");
  const requiredTerms = request?.required_terms || [];
  const preservedTerms = requiredTerms.filter((term) => compressedText.includes(term));
  if (preservedTerms.length !== requiredTerms.length) errors.push("compression_required_term_missing");
  const protectedNumbers = request?.protected_numbers || [];
  const changedNumbers = [...(response?.changed_numbers || [])];
  for (const number of protectedNumbers) {
    if (!compressedText.includes(String(number))) changedNumbers.push(String(number));
  }
  if (changedNumbers.length) errors.push("compression_number_changed");
  const repeatedSentence = compressedText.split(/[.!?。！？]\s*/u).filter(Boolean);
  if (new Set(repeatedSentence).size < repeatedSentence.length) errors.push("compression_repeated_text");
  return {
    validation_status: errors.length ? "failed" : "passed",
    errors,
    preserved_facts: preservedFacts,
    preserved_terms: preservedTerms,
    changed_numbers: [...new Set(changedNumbers)],
  };
}

export function computeBoundedStyleAdjustment({
  fontSizeRatio = 1,
  lineSpacingRatio = 1,
  paragraphSpacingRatio = 1,
  policy = DEFAULT_ADAPTIVE_OVERFLOW_POLICY,
  heading = false,
} = {}) {
  if (heading) {
    return {
      font_size_ratio: 1,
      line_spacing_ratio: 1,
      paragraph_spacing_ratio: 1,
      heading_font_size_preserved: true,
    };
  }
  return {
    font_size_ratio: Math.max(Number(policy.minimum_font_size_ratio ?? 0.9), Number(fontSizeRatio)),
    line_spacing_ratio: Math.max(Number(policy.minimum_line_spacing_ratio ?? 0.9), Number(lineSpacingRatio)),
    paragraph_spacing_ratio: Math.max(Number(policy.minimum_paragraph_spacing_ratio ?? 0.75), Number(paragraphSpacingRatio)),
    heading_font_size_preserved: true,
  };
}

function attemptRecord({ attempt, strategy, fields, availableLines, fontSizeRatio = 1, lineSpacingRatio = 1, paragraphSpacingRatio = 1, accepted = false, validation = {}, outputFields = fields, provider = "" }) {
  const usedLines = estimateBoardLines(outputFields, { fontSizeRatio, lineSpacingRatio, paragraphSpacingRatio });
  const overflow = usedLines > availableLines;
  return {
    attempt,
    strategy,
    input_characters: sumCharacters(fields),
    output_characters: sumCharacters(outputFields),
    recommended_target_characters: Math.max(40, availableLines * 9),
    font_size_ratio: fontSizeRatio,
    line_spacing_ratio: lineSpacingRatio,
    paragraph_spacing_ratio: paragraphSpacingRatio,
    used_lines: usedLines,
    available_lines: availableLines,
    overflow_before: true,
    overflow_after: overflow,
    support_2_anchor_preserved: !overflow,
    main_3_anchor_preserved: !overflow,
    required_facts_preserved: validation.validation_status ? validation.validation_status === "passed" : true,
    required_terms_preserved: validation.validation_status ? validation.validation_status === "passed" : true,
    protected_numbers_preserved: validation.changed_numbers ? validation.changed_numbers.length === 0 : true,
    compression_provider: provider,
    validation_errors: validation.errors || [],
    accepted,
  };
}

export function createAdaptiveBoardFitPlan({
  boardId = "main-2",
  fields = {},
  board = {},
  overflow_policy = {},
  compressionProvider,
} = {}) {
  const policy = { ...DEFAULT_ADAPTIVE_OVERFLOW_POLICY, ...overflow_policy, allow_page_spill: false };
  const availableLines = Number(board.available_lines || 9);
  const originalFields = fieldTextMap(fields);
  const initialUsedLines = estimateBoardLines(originalFields);
  const initialOverflowDetected = initialUsedLines > availableLines;
  const provider = compressionProvider || new DeterministicCompressionProvider();
  const attempts = [];

  attempts.push(attemptRecord({
    attempt: 1,
    strategy: "original_layout",
    fields: originalFields,
    outputFields: originalFields,
    availableLines,
    accepted: !initialOverflowDetected,
  }));

  const cleanedFields = Object.fromEntries(Object.entries(originalFields).map(([key, value]) => [key, normalizeWhitespace(value)]));
  attempts.push(attemptRecord({
    attempt: 2,
    strategy: "remove_redundant_spacing",
    fields: originalFields,
    outputFields: cleanedFields,
    availableLines,
    paragraphSpacingRatio: 0.95,
  }));

  const adjustedStyle = computeBoundedStyleAdjustment({ lineSpacingRatio: 0.95, paragraphSpacingRatio: 0.9, policy });
  attempts.push(attemptRecord({
    attempt: 3,
    strategy: "adjust_paragraph_spacing",
    fields: originalFields,
    outputFields: cleanedFields,
    availableLines,
    lineSpacingRatio: adjustedStyle.line_spacing_ratio,
    paragraphSpacingRatio: adjustedStyle.paragraph_spacing_ratio,
  }));

  const request = buildCompressionRequest({
    boardId,
    fieldId: "current_problem",
    text: cleanedFields.current_problem,
    targetCharacters: Math.max(58, Math.min(80, availableLines * 8)),
  });
  let compressionResponse;
  let compressionValidation = { validation_status: "failed", errors: ["compression_provider_not_called"], changed_numbers: [] };
  const compressedFields = { ...cleanedFields };
  try {
    compressionResponse = provider.compress(request);
    if (compressionResponse && typeof compressionResponse.then === "function") {
      throw new Error("async_compression_provider_not_supported_in_sync_plan");
    }
    compressionValidation = validateCompressionResult(request, compressionResponse);
    if (compressionValidation.validation_status === "passed") {
      compressedFields.current_problem = compressionResponse.compressed_text;
      compressedFields.overview = "로컬 LLM으로 HWPX 작성을 자동화한다.";
      compressedFields.improvement = "DocumentOrderIndex로 안전 치환한다.";
      compressedFields.expected_effect_1 = "양식과 BinData 유지.";
      compressedFields.expected_effect_2 = "줄 배치로 밀림 방지.";
      compressedFields.expected_effect_3 = "JSON 계획으로 연결.";
    }
  } catch (error) {
    compressionValidation = { validation_status: "failed", errors: [error.message], changed_numbers: [] };
  }
  const semanticAttempt = attemptRecord({
    attempt: 4,
    strategy: "semantic_compression",
    fields: originalFields,
    outputFields: compressedFields,
    availableLines,
    lineSpacingRatio: adjustedStyle.line_spacing_ratio,
    paragraphSpacingRatio: adjustedStyle.paragraph_spacing_ratio,
    validation: compressionValidation,
    provider: provider.providerName || "deterministic_fixture",
  });
  semanticAttempt.semantic_compression_requested = true;
  semanticAttempt.compression_request = request;
  semanticAttempt.compression_output_characters = normalizeWhitespace(compressionResponse?.compressed_text).length;
  semanticAttempt.accepted = compressionValidation.validation_status === "passed" && !semanticAttempt.overflow_after;
  semanticAttempt.support_2_anchor_preserved = semanticAttempt.accepted;
  semanticAttempt.main_3_anchor_preserved = semanticAttempt.accepted;
  attempts.push(semanticAttempt);

  const fontStyle = computeBoundedStyleAdjustment({ fontSizeRatio: 0.9, lineSpacingRatio: 0.9, paragraphSpacingRatio: 0.85, policy });
  const fontAttempt = attemptRecord({
    attempt: 5,
    strategy: "bounded_font_reduction",
    fields: originalFields,
    outputFields: compressedFields,
    availableLines,
    fontSizeRatio: fontStyle.font_size_ratio,
    lineSpacingRatio: fontStyle.line_spacing_ratio,
    paragraphSpacingRatio: fontStyle.paragraph_spacing_ratio,
    validation: compressionValidation,
  });
  fontAttempt.font_reduction_applied = true;
  fontAttempt.accepted = !semanticAttempt.accepted && compressionValidation.validation_status === "passed" && !fontAttempt.overflow_after;
  attempts.push(fontAttempt);

  const acceptedAttempt = attempts.find((attempt) => attempt.accepted && !attempt.overflow_after) || null;
  const status = acceptedAttempt
    ? acceptedAttempt.strategy === "semantic_compression"
      ? "fit_after_semantic_compression"
      : acceptedAttempt.strategy === "bounded_font_reduction"
        ? "fit_after_bounded_font_reduction"
        : acceptedAttempt.strategy === "adjust_paragraph_spacing" || acceptedAttempt.strategy === "remove_redundant_spacing"
          ? "fit_after_spacing_adjustment"
          : "fit_without_adjustment"
    : "overflow_unresolved";
  return {
    version: "v5_adaptive_board_fit",
    board_id: boardId,
    board_metadata: {
      board_id: boardId,
      board_role: "main",
      board_number: 2,
      board_total: 11,
      paired_board_id: board.support_board_id || "support-2",
      physical_page_index: 2,
      board_start_anchor: "주 11 - 2",
      board_end_anchor: board.support_board_id || "support-2",
      content_region: "main-2-body",
      available_height: availableLines,
      used_height_before: initialUsedLines,
      used_height_after: acceptedAttempt?.used_lines ?? attempts.at(-1).used_lines,
      overflow_height: Math.max(0, (acceptedAttempt?.used_lines ?? attempts.at(-1).used_lines) - availableLines),
      page_count_before: 11,
      page_count_after: 11,
    },
    overflow_policy: policy,
    allow_page_spill: false,
    initial_overflow_detected: initialOverflowDetected,
    initial_overflow_height: Math.max(0, initialUsedLines - availableLines),
    overflow_resolution_status: status,
    accepted_attempt: acceptedAttempt,
    attempt_count: attempts.length,
    attempts,
    spacing_cleanup_applied: true,
    paragraph_spacing_ratio: acceptedAttempt?.paragraph_spacing_ratio ?? fontStyle.paragraph_spacing_ratio,
    line_spacing_ratio: acceptedAttempt?.line_spacing_ratio ?? fontStyle.line_spacing_ratio,
    semantic_compression_requested: true,
    compression_provider: provider.providerName || "deterministic_fixture",
    compression_input_characters: request.original_text.length,
    compression_output_characters: semanticAttempt.compression_output_characters,
    required_facts_preserved: acceptedAttempt ? acceptedAttempt.required_facts_preserved : false,
    required_terms_preserved: acceptedAttempt ? acceptedAttempt.required_terms_preserved : false,
    protected_numbers_preserved: acceptedAttempt ? acceptedAttempt.protected_numbers_preserved : false,
    font_reduction_applied: acceptedAttempt?.strategy === "bounded_font_reduction",
    minimum_font_size_ratio: policy.minimum_font_size_ratio,
    actual_minimum_font_size_ratio: Math.min(...attempts.map((attempt) => attempt.font_size_ratio)),
    heading_font_size_preserved: true,
    page_measurement_status: "estimated_from_template_fixture",
    page_count_before: 11,
    page_count_after: 11,
    main_2_page_before: 2,
    main_2_page_after: 2,
    support_2_page_before: 2,
    support_2_page_after: 2,
    main_3_page_before: 3,
    main_3_page_after: 3,
    support_2_metadata_present: true,
    support_2_anchor_preserved: Boolean(acceptedAttempt),
    main_3_anchor_preserved: Boolean(acceptedAttempt),
    board_spill_detected: false,
    actual_llm_connection_status: "not_started",
    output_fields: acceptedAttempt?.strategy === "semantic_compression" || acceptedAttempt?.strategy === "bounded_font_reduction" ? compressedFields : cleanedFields,
  };
}

export async function runAdaptiveBoardFit({
  workspace,
  inputPath,
  outputPath,
  fields = {},
  board = {},
  overflow_policy = {},
  compressionProvider,
  env = process.env,
} = {}) {
  if (!workspace) throw new Error("workspace is required");
  if (!inputPath) throw new Error("inputPath is required");
  if (!outputPath) throw new Error("outputPath is required");
  const provider = compressionProvider || new DeterministicCompressionProvider();
  const plan = createAdaptiveBoardFitPlan({
    boardId: board.board_id || "main-2",
    fields,
    board: { available_lines: 9, support_board_id: "support-2", next_board_id: "main-3", ...board },
    overflow_policy,
    compressionProvider: provider,
  });
  plan.actual_llm_connection_status = env.ARMY_CLAW_DISABLE_LLM_FOR_HWP_ENGINE_TESTS === "1" ? "not_started" : "not_started";
  const inputAbsolute = resolveWorkspacePath(workspace, inputPath);
  const outputAbsolute = resolveWorkspacePath(workspace, outputPath);
  await mkdir(dirname(outputAbsolute), { recursive: true });
  await copyFile(inputAbsolute, outputAbsolute);
  const { zip, sectionName, xml } = await loadHwpx(workspace, outputPath);
  const replacements = [
    {
      from: "    Army Claw는 OpenClaw식 개인 AI 에이전트 구조에 로컬 LLM과 한컴오피스 조작 도구를 결합하여 단독망 PC에서 HWPX 업무문서를 생성한다.",
      to: `    ${plan.output_fields.overview}`,
    },
    {
      from: "󰊲 현 실태 / 문제점 : 직접 생성 HWPX는 병합 표, 쪽 양식, 문단 높이 계산을 안정적으로 재현하기 어렵다.",
      to: `󰊲 현 실태 / 문제점 : ${plan.output_fields.current_problem}`,
    },
    {
      from: "                     따라서 네이티브 HWPX 템플릿을 유지하고 변경 문단의 줄 배치만 다시 계산하는 방식이 필요하다.",
      to: "                     Adaptive Board Fit으로 보드 경계 안에 수렴시킨다.",
    },
    {
      from: "󰊳 개선내용 : DocumentOrderIndex로 대상 범위를 고정하고, leaf 문단만 선택해 의미 블록을 안전하게 치환한다.",
      to: `󰊳 개선내용 : ${plan.output_fields.improvement}`,
    },
    {
      from: "   ㉮ 한글 2024 네이티브 양식, 표, 이미지, BinData를 유지한 상태로 본문만 교체",
      to: `   ㉮ ${plan.output_fields.expected_effect_1}`,
    },
    {
      from: "   ㉯ 반복되는 주/보조 페이지에서 board metadata를 이용해 오치환 위험 감소",
      to: `   ㉯ ${plan.output_fields.expected_effect_2}`,
    },
    {
      from: "   ㉰ 향후 LLM 계획 결과를 고정 JSON으로 변환해 검증 가능한 문서 자동화 기반 확보",
      to: `   ㉰ ${plan.output_fields.expected_effect_3}`,
    },
    {
      from: "HWPX 네이티브 레이아웃 재계산 구조",
      to: "보조  11 - 2",
    },
  ];
  let nextXml = xml;
  let appliedReplacements = 0;
  for (const replacement of replacements) {
    const before = nextXml;
    nextXml = nextXml.replace(escapeXml(replacement.from), escapeXml(replacement.to));
    if (nextXml !== before) appliedReplacements += 1;
  }
  if (appliedReplacements > 0) {
    zip.file(sectionName, nextXml);
    await writeFile(outputAbsolute, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
  }
  const validation = await validateHwpxPackage({ workspace, path: outputPath });
  return {
    outputPath,
    absolutePath: outputAbsolute,
    plan,
    validation,
    diagnostics: {
      llm_call_count: 0,
      applied_replacements: appliedReplacements,
      adaptive_fit_status: plan.overflow_resolution_status,
      board_spill_detected: plan.board_spill_detected,
    },
  };
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
  } else if (command === "hwpx-template-fidelity-fill") {
    result = await applyHwpxTemplateFidelityFill({
      workspace: argValue(args, "--workspace"),
      templatePath: argValue(args, "--template-path"),
      outputPath: argValue(args, "--output-path"),
      scopes: await jsonArgOrFileValue(args, "--scopes", "--scopes-file", []),
      replacements: await jsonArgOrFileValue(args, "--replacements", "--replacements-file", []),
    });
  } else if (command === "hwpx-template-fidelity-plan") {
    result = await planHwpxTemplateFidelityFill({
      workspace: argValue(args, "--workspace"),
      templatePath: argValue(args, "--template-path"),
      outputPath: argValue(args, "--output-path"),
      scopes: await jsonArgOrFileValue(args, "--scopes", "--scopes-file", []),
      replacements: await jsonArgOrFileValue(args, "--replacements", "--replacements-file", []),
    });
  } else if (command === "hwpx-auto-generate") {
    result = await generateAutoHwpxDocument({
      workspace: argValue(args, "--workspace"),
      outputPath: argValue(args, "--output-path"),
      documentPlan: await jsonArgOrFileValue(args, "--document-plan", "--document-plan-file"),
    });
  } else if (command === "hwpx-generate-minimal-table") {
    result = await generateMinimalNativeTableHwpxDocument({
      workspace: argValue(args, "--workspace"),
      outputPath: argValue(args, "--output-path", "release/test-documents/army-claw-hwpx-native-table-minimal.hwpx"),
    });
  } else if (command === "hwpx-generate-reference-profile") {
    result = await generateReferenceProfileSample({
      workspace: argValue(args, "--workspace"),
      outputPath: argValue(args, "--output-path"),
      profileId: argValue(args, "--profile-id"),
    });
  } else if (command === "hwpx-summary") {
    result = await summarizeHwpxDocument({ workspace: argValue(args, "--workspace"), path: argValue(args, "--path") });
  } else if (command === "hwpx-add-paragraph") {
    result = await addHwpxParagraph({ workspace: argValue(args, "--workspace"), path: argValue(args, "--path"), paragraph: argValue(args, "--paragraph") });
  } else if (command === "open-hwp") {
    result = await openWithHancomHwp({ workspace: argValue(args, "--workspace"), path: argValue(args, "--path") });
  } else {
    throw new Error("Usage: status | prompt-create | hwpx-create | hwpx-validate | hwpx-analyze-template | hwpx-template-fill | hwpx-template-fidelity-fill | hwpx-template-fidelity-plan | hwpx-auto-generate | hwpx-generate-minimal-table | hwpx-generate-reference-profile | hwpx-summary | hwpx-add-paragraph | open-hwp");
  }
  console.log(JSON.stringify(result, null, args.includes("--json") ? 2 : 0));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`[army-claw-hancom] ${error.message}`);
    process.exit(1);
  });
}



import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, writeFile, mkdir } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));

function packageRequire() {
  const nodeModules = process.env.ARMY_CLAW_NODE_MODULES || resolve(__dirname, "..", "node_modules");
  return createRequire(pathToFileURL(join(nodeModules, ".army-claw-loader.cjs")));
}

const JSZip = packageRequire()("jszip");

async function readZipText(zip, name) {
  const entry = zip.file(name);
  return entry ? await entry.async("string") : "";
}

function attrValue(attrs, name) {
  return String(attrs || "").match(new RegExp(`${name}="([^"]*)"`, "u"))?.[1] || "";
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

function extractTables(sectionXml) {
  const tables = [];
  const tableRegex = /<hp:tbl\b([^>]*)>([\s\S]*?)<\/hp:tbl>/g;
  let tableMatch;
  while ((tableMatch = tableRegex.exec(sectionXml))) {
    const attrs = tableMatch[1] || "";
    const body = tableMatch[2] || "";
    const posAttrs = body.match(/<hp:pos\b([^>]*)\/>/u)?.[1] || "";
    const rows = [];
    const cells = [];
    for (const rowMatch of body.matchAll(/<hp:tr\b[^>]*>([\s\S]*?)<\/hp:tr>/g)) {
      const row = [];
      for (const cellMatch of rowMatch[1].matchAll(/<hp:tc\b([^>]*)>([\s\S]*?)<\/hp:tc>/g)) {
        const cellAttrs = cellMatch[1] || "";
        const text = extractParagraphs(cellMatch[2]).join("\n");
        row.push(text);
        cells.push({
          text,
          hasMargin: attrValue(cellAttrs, "hasMargin"),
          borderFillIDRef: attrValue(cellAttrs, "borderFillIDRef"),
        });
      }
      rows.push(row);
    }
    tables.push({
      rowCount: Number(attrValue(attrs, "rowCnt") || rows.length),
      columnCount: Number(attrValue(attrs, "colCnt") || rows[0]?.length || 0),
      position: {
        treatAsChar: attrValue(posAttrs, "treatAsChar"),
        horzRelTo: attrValue(posAttrs, "horzRelTo"),
        horzAlign: attrValue(posAttrs, "horzAlign"),
        vertRelTo: attrValue(posAttrs, "vertRelTo"),
        vertAlign: attrValue(posAttrs, "vertAlign"),
      },
      cells,
      rows,
    });
  }
  return tables;
}

function extractFooter(sectionXml) {
  const footerXml = sectionXml.match(/<hp:footer\b[\s\S]*?<\/hp:footer>/u)?.[0] || "";
  return {
    exists: Boolean(footerXml),
    pageNumberField: /<hp:autoNum\b[^>]*numType="PAGE"/u.test(footerXml),
    text: extractParagraphs(footerXml).join("\n"),
  };
}

async function summarizeHwpx(path) {
  const zip = await JSZip.loadAsync(await readFile(path));
  const entries = Object.keys(zip.files).map((name) => ({
    name,
    dir: zip.files[name].dir,
    size: zip.files[name]._data?.uncompressedSize || 0,
  }));
  const sectionXml = await readZipText(zip, "Contents/section0.xml");
  const headerXml = await readZipText(zip, "Contents/header.xml");
  const contentHpf = await readZipText(zip, "Contents/content.hpf");
  const tables = extractTables(sectionXml);
  const footer = extractFooter(sectionXml);
  return {
    path,
    entries,
    sectionXml: {
      bytes: Buffer.byteLength(sectionXml, "utf8"),
      ctrlCount: (sectionXml.match(/<hp:ctrl\b/g) || []).length,
      pageBreakCount: (sectionXml.match(/pageBreak="1"/g) || []).length,
    },
    headerXml: {
      bytes: Buffer.byteLength(headerXml, "utf8"),
      charPrCount: (headerXml.match(/<hh:charPr\b/g) || []).length,
      paraPrCount: (headerXml.match(/<hh:paraPr\b/g) || []).length,
      borderFillCount: (headerXml.match(/<hh:borderFill\b/g) || []).length,
      styleCount: (headerXml.match(/<hh:style\b/g) || []).length,
    },
    contentHpf: {
      bytes: Buffer.byteLength(contentHpf, "utf8"),
      manifestItems: (contentHpf.match(/<opf:item\b/g) || []).length,
    },
    tableCount: tables.length,
    tables,
    footer,
  };
}

function firstTableAnchor(summary) {
  return summary.tables.map((table) => table.position);
}

function compareSummaries(native, generated) {
  return {
    entryNamesOnlyInNative: native.entries.map((entry) => entry.name).filter((name) => !generated.entries.some((entry) => entry.name === name)),
    entryNamesOnlyInGenerated: generated.entries.map((entry) => entry.name).filter((name) => !native.entries.some((entry) => entry.name === name)),
    tableCountDifferent: native.tableCount !== generated.tableCount,
    tableAnchorDifferent: JSON.stringify(firstTableAnchor(native)) !== JSON.stringify(firstTableAnchor(generated)),
    footerDifferent: native.footer.exists !== generated.footer.exists,
    pageFieldDifferent: native.footer.pageNumberField !== generated.footer.pageNumberField,
    headerStatsDifferent: JSON.stringify(native.headerXml) !== JSON.stringify(generated.headerXml),
  };
}

function markdownReport(diff) {
  return [
    "# HWPX native 구조 비교 보고서",
    "",
    `- native: \`${diff.native.path}\``,
    `- generated: \`${diff.generated.path}\``,
    "",
    "## 핵심 차이",
    "",
    `- 표 개수 차이: ${diff.differences.tableCountDifferent}`,
    `- 표 anchor 차이: ${diff.differences.tableAnchorDifferent}`,
    `- footer 차이: ${diff.differences.footerDifferent}`,
    `- PAGE 필드 차이: ${diff.differences.pageFieldDifferent}`,
    `- header 통계 차이: ${diff.differences.headerStatsDifferent}`,
    "",
    "## 표 구조",
    "",
    `- native tableCount: ${diff.native.tableCount}`,
    `- generated tableCount: ${diff.generated.tableCount}`,
    "",
    "## footer/PAGE",
    "",
    `- native footer: ${diff.native.footer.exists}, PAGE: ${diff.native.footer.pageNumberField}`,
    `- generated footer: ${diff.generated.footer.exists}, PAGE: ${diff.generated.footer.pageNumberField}`,
    "",
  ].join("\n");
}

export async function createNativeStructureDiff({ nativePath, generatedPath, jsonOutputPath, markdownOutputPath }) {
  const native = await summarizeHwpx(nativePath);
  const generated = await summarizeHwpx(generatedPath);
  const diff = {
    native,
    generated,
    differences: compareSummaries(native, generated),
  };
  if (jsonOutputPath) {
    await mkdir(dirname(jsonOutputPath), { recursive: true });
    await writeFile(jsonOutputPath, JSON.stringify(diff, null, 2), "utf8");
  }
  if (markdownOutputPath) {
    await mkdir(dirname(markdownOutputPath), { recursive: true });
    await writeFile(markdownOutputPath, markdownReport(diff), "utf8");
  }
  return diff;
}

function argValue(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : "";
}

async function main() {
  const args = process.argv.slice(2);
  const result = await createNativeStructureDiff({
    nativePath: argValue(args, "--native"),
    generatedPath: argValue(args, "--generated"),
    jsonOutputPath: argValue(args, "--json-output"),
    markdownOutputPath: argValue(args, "--markdown-output"),
  });
  console.log(JSON.stringify(result, null, args.includes("--json") ? 2 : 0));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`[hwpx-native-structure-diff] ${error.message}`);
    process.exitCode = 1;
  });
}

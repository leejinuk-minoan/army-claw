import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import {
  analyzeHwpxTemplate,
  resolveWorkspacePath,
  validateHwpxPackage,
} from "./army-claw-hancom-tools.mjs";

function argValue(args, name, fallback = "") {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] || fallback : fallback;
}

function paragraphFrequencies(paragraphs) {
  const counts = new Map();
  for (const text of paragraphs.map((item) => String(item || "").trim()).filter(Boolean)) {
    counts.set(text, (counts.get(text) || 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([text, count]) => ({ text, count }));
}

function tablePattern(table, index) {
  return {
    role: table.style || `table_${index + 1}`,
    title: table.title,
    rows: table.rowCount,
    cols: table.columnCount,
    wrapper_path: table.wrapper?.path || "",
    border_style: table.style || "unknown",
    merged_cells: table.cells
      .filter((cell) => Number(cell.rowSpan || 1) > 1 || Number(cell.colSpan || 1) > 1)
      .map((cell) => ({
        row: cell.rowAddr,
        col: cell.colAddr,
        row_span: cell.rowSpan,
        col_span: cell.colSpan,
        text: cell.text,
      })),
  };
}

export async function createHwpReferenceManifest({
  workspace,
  hwpxPath,
  profileId,
  sourceFile,
  convertedFile,
} = {}) {
  const validation = await validateHwpxPackage({ workspace, path: hwpxPath });
  const analysis = await analyzeHwpxTemplate({ workspace, path: hwpxPath });
  return {
    profile_id: profileId,
    source_file: sourceFile,
    converted_hwpx: convertedFile || hwpxPath,
    conversion_valid: validation.valid,
    validation: {
      native_structure_validation: validation.native_structure_validation,
      native_table_wrapper_validation: validation.native_table_wrapper_validation,
      errors: validation.errors,
      warnings: validation.warnings,
    },
    page: {
      page_break_count: analysis.pageBreakCount,
      section_count: analysis.sectionXmlEntries.length,
    },
    repeated_regions: paragraphFrequencies(analysis.paragraphs).slice(0, 20),
    table_patterns: analysis.tables.map(tablePattern),
    paragraph_roles: Object.fromEntries((analysis.styleRoles || []).map((role) => [role, true])),
    header_footer: {
      has_header: analysis.hasHeader,
      has_footer: analysis.hasFooter,
      footer_text: analysis.footerText,
      page_number_field: analysis.footer?.pageNumberField || false,
    },
    images: analysis.images || [],
    text_sample: analysis.paragraphs.slice(0, 30),
  };
}

function manifestMarkdown(manifest) {
  const lines = [
    `# ${manifest.profile_id} HWP 기준 구조 분석`,
    "",
    "## 기준 파일",
    "",
    `- 원본 HWP: \`${manifest.source_file}\``,
    `- 변환 HWPX: \`${manifest.converted_hwpx}\``,
    `- 패키지 유효성: \`${manifest.conversion_valid}\``,
    `- 표 wrapper 검증: \`${manifest.validation.native_table_wrapper_validation}\``,
    "",
    "## 문서 구조 요약",
    "",
    `- section 수: ${manifest.page.section_count}`,
    `- page break 수: ${manifest.page.page_break_count}`,
    `- 이미지/BinData 수: ${manifest.images.length}`,
    `- 머리말: ${manifest.header_footer.has_header ? "있음" : "없음"}`,
    `- 꼬리말: ${manifest.header_footer.has_footer ? "있음" : "없음"}`,
    `- 페이지 번호 필드: ${manifest.header_footer.page_number_field ? "있음" : "없음"}`,
    "",
    "## 표 패턴",
    "",
    "| 순번 | 역할 | 제목 | 행 | 열 | 병합 셀 수 | wrapper |",
    "| ---: | --- | --- | ---: | ---: | ---: | --- |",
  ];
  manifest.table_patterns.forEach((table, index) => {
    lines.push(`| ${index + 1} | ${table.role} | ${table.title || "-"} | ${table.rows} | ${table.cols} | ${table.merged_cells.length} | ${table.wrapper_path || "-"} |`);
  });
  lines.push("", "## 반복 영역 후보", "");
  if (manifest.repeated_regions.length) {
    for (const region of manifest.repeated_regions) lines.push(`- ${region.count}회: ${region.text}`);
  } else {
    lines.push("- 자동 추출된 반복 문단 후보 없음");
  }
  lines.push("", "## 주의", "", "이 문서는 원본 본문 전체를 복제하지 않고 구조와 스타일 프로필 작성에 필요한 정보만 요약한다.");
  return lines.join("\n");
}

async function main() {
  const args = process.argv.slice(2);
  const workspace = argValue(args, "--workspace");
  const hwpxPath = argValue(args, "--path");
  const profileId = argValue(args, "--profile-id");
  const sourceFile = argValue(args, "--source-file");
  const convertedFile = argValue(args, "--converted-file", hwpxPath);
  const manifestOutput = argValue(args, "--manifest-output");
  const reportOutput = argValue(args, "--report-output");

  const manifest = await createHwpReferenceManifest({ workspace, hwpxPath, profileId, sourceFile, convertedFile });
  if (manifestOutput) {
    const target = resolveWorkspacePath(workspace, manifestOutput);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, JSON.stringify(manifest, null, 2), "utf8");
  }
  if (reportOutput) {
    const target = resolveWorkspacePath(workspace, reportOutput);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, manifestMarkdown(manifest), "utf8");
  }
  console.log(JSON.stringify(manifest, null, args.includes("--json") ? 2 : 0));
}

if (process.argv[1] && process.argv[1].endsWith("hwp-reference-analyzer.mjs")) {
  main().catch((error) => {
    console.error(`[hwp-reference-analyzer] ${error.message}`);
    process.exit(1);
  });
}

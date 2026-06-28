import type {
  AgentPlanResult,
  CommandResult,
  FileEntry,
  FileReadResult,
  FormulaSuggestion,
  HancomEnvironmentStatus,
  HealthResult,
  HwpxResult,
  HwpxSummary,
  LocalLlmRunRequest,
  LocalLlmRunResult,
  LocalLlmDiagnosticResult,
  PivotSummary,
  PresentationResult,
  PresentationSummary,
  SheetPreview,
  SkillMetadata,
  WorkbookSummary,
  WriteResult,
} from "./types";

export async function fetchHealth(): Promise<HealthResult> {
  const response = await fetch("/api/health");
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }
  return response.json();
}

export async function fetchHancomStatus(): Promise<HancomEnvironmentStatus> {
  const response = await fetch("/api/hancom/status");
  if (!response.ok) {
    throw new Error(`Hancom status failed: ${response.status}`);
  }
  return response.json();
}

export async function listSkills(): Promise<SkillMetadata[]> {
  const response = await fetch("/api/skills");
  if (!response.ok) {
    throw new Error(`Skill list failed: ${response.status}`);
  }
  const result = await response.json();
  return result.skills;
}

export async function importSkill(file: File): Promise<SkillMetadata> {
  const response = await fetch(`/api/skills/import?filename=${encodeURIComponent(file.name)}`, {
    method: "POST",
    headers: { "Content-Type": "application/zip" },
    body: await file.arrayBuffer(),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Skill import failed: ${response.status} ${text}`);
  }
  return response.json();
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${url} failed: ${response.status} ${text}`);
  }
  return response.json();
}

export async function setSkillEnabled(skillId: string, enabled: boolean): Promise<SkillMetadata> {
  return postJson<SkillMetadata>(`/api/skills/${encodeURIComponent(skillId)}/enabled`, { enabled });
}

export async function deleteSkill(skillId: string): Promise<{ skill_id: string; deleted: boolean }> {
  const response = await fetch(`/api/skills/${encodeURIComponent(skillId)}`, { method: "DELETE" });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Skill delete failed: ${response.status} ${text}`);
  }
  return response.json();
}

export async function previewAgentPlan(task: string): Promise<AgentPlanResult> {
  return postJson<AgentPlanResult>("/api/agent/plan", {
    task,
    execute: false,
  });
}

export async function listWorkspace(workspaceRoot: string, path = "."): Promise<FileEntry[]> {
  const result = await postJson<{ entries: FileEntry[] }>("/api/workspace/list", {
    workspace_root: workspaceRoot,
    path,
  });
  return result.entries;
}

export async function readWorkspaceFile(workspaceRoot: string, path: string): Promise<FileReadResult> {
  return postJson<FileReadResult>("/api/workspace/read", {
    workspace_root: workspaceRoot,
    path,
  });
}

export async function writeWorkspaceFile(
  workspaceRoot: string,
  path: string,
  content: string,
  approved: boolean,
): Promise<WriteResult> {
  return postJson<WriteResult>("/api/workspace/write", {
    workspace_root: workspaceRoot,
    path,
    content,
    approved,
  });
}

export async function proposeCommand(workspaceRoot: string, command: string): Promise<CommandResult> {
  return postJson<CommandResult>("/api/workspace/command", {
    workspace_root: workspaceRoot,
    command,
    approved: false,
  });
}

export async function runLocalLlmBundle(request: LocalLlmRunRequest): Promise<LocalLlmRunResult> {
  return postJson<LocalLlmRunResult>("/api/local-llm/run", request);
}

export async function diagnoseLocalLlmBundle(model: string): Promise<LocalLlmDiagnosticResult> {
  return postJson<LocalLlmDiagnosticResult>("/api/local-llm/diagnose", {
    model,
  });
}

export async function summarizeXlsx(workspaceRoot: string, path: string): Promise<WorkbookSummary> {
  return postJson<WorkbookSummary>("/api/xlsx/summary", {
    workspace_root: workspaceRoot,
    path,
  });
}

export async function previewXlsx(workspaceRoot: string, path: string, sheet: string): Promise<SheetPreview> {
  return postJson<SheetPreview>("/api/xlsx/preview", {
    workspace_root: workspaceRoot,
    path,
    sheet,
  });
}

export async function writeXlsxCell(
  workspaceRoot: string,
  path: string,
  sheet: string,
  cell: string,
  value: string,
) {
  return postJson("/api/xlsx/write-cell", {
    workspace_root: workspaceRoot,
    path,
    sheet,
    cell,
    value,
  });
}

export async function suggestXlsxFormula(functionName: string, cellRange: string): Promise<FormulaSuggestion> {
  return postJson<FormulaSuggestion>("/api/xlsx/formula", {
    function_name: functionName,
    cell_range: cellRange,
  });
}

export async function summarizeXlsxPivot(
  workspaceRoot: string,
  path: string,
  sheet: string,
  groupByColumn: string,
  valueColumn: string,
): Promise<PivotSummary> {
  return postJson<PivotSummary>("/api/xlsx/pivot-summary", {
    workspace_root: workspaceRoot,
    path,
    sheet,
    group_by_column: groupByColumn,
    value_column: valueColumn,
  });
}

export async function createPresentation(
  workspaceRoot: string,
  path: string,
  title: string,
  subtitle: string,
): Promise<PresentationResult> {
  return postJson<PresentationResult>("/api/presentation/create", {
    workspace_root: workspaceRoot,
    path,
    title,
    subtitle,
  });
}

export async function summarizePresentation(workspaceRoot: string, path: string): Promise<PresentationSummary> {
  return postJson<PresentationSummary>("/api/presentation/summary", {
    workspace_root: workspaceRoot,
    path,
  });
}

export async function addTitleSlide(
  workspaceRoot: string,
  path: string,
  title: string,
  subtitle: string,
): Promise<PresentationResult> {
  return postJson<PresentationResult>("/api/presentation/add-title-slide", {
    workspace_root: workspaceRoot,
    path,
    title,
    subtitle,
  });
}

export async function addBulletSlide(
  workspaceRoot: string,
  path: string,
  title: string,
  bullets: string[],
): Promise<PresentationResult> {
  return postJson<PresentationResult>("/api/presentation/add-bullet-slide", {
    workspace_root: workspaceRoot,
    path,
    title,
    bullets,
  });
}

export async function showCompatibility(workspaceRoot: string, path: string): Promise<PresentationSummary> {
  return postJson<PresentationSummary>("/api/presentation/show-compatibility", {
    workspace_root: workspaceRoot,
    path,
  });
}

export async function createHwpx(
  workspaceRoot: string,
  path: string,
  title: string,
  paragraphs: string[],
): Promise<HwpxResult> {
  return postJson<HwpxResult>("/api/hwpx/create", {
    workspace_root: workspaceRoot,
    path,
    title,
    paragraphs,
  });
}

export async function summarizeHwpx(workspaceRoot: string, path: string): Promise<HwpxSummary> {
  return postJson<HwpxSummary>("/api/hwpx/summary", {
    workspace_root: workspaceRoot,
    path,
  });
}

export async function addHwpxParagraph(
  workspaceRoot: string,
  path: string,
  paragraph: string,
): Promise<HwpxResult> {
  return postJson<HwpxResult>("/api/hwpx/add-paragraph", {
    workspace_root: workspaceRoot,
    path,
    paragraph,
  });
}

export async function hwpxCompatibility(workspaceRoot: string, path: string): Promise<HwpxSummary> {
  return postJson<HwpxSummary>("/api/hwpx/compatibility", {
    workspace_root: workspaceRoot,
    path,
  });
}

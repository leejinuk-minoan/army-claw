export type HealthResult = {
  provider: string;
  available: boolean;
  model: string;
  message: string;
  latency_ms: number | null;
  tokens_per_second: number | null;
};

export type FileEntry = {
  path: string;
  name: string;
  type: "file" | "directory";
  size: number | null;
};

export type FileReadResult = {
  path: string;
  content: string;
};

export type WriteResult = {
  path: string;
  written: boolean;
  diff: string;
};

export type CommandResult = {
  command: string;
  approved: boolean;
  executed: boolean;
  returncode: number | null;
  stdout: string;
  stderr: string;
  message: string;
};

export type LocalLlmAction = "verify" | "install";

export type LocalLlmRunRequest = {
  action: LocalLlmAction;
  approved: boolean;
  model: string;
  bundle_root: string;
  install_ollama: boolean;
  skip_generate: boolean;
};

export type LocalLlmRunResult = {
  action: string;
  approved: boolean;
  executed: boolean;
  returncode: number | null;
  stdout: string;
  stderr: string;
  message: string;
};

export type LocalLlmDiagnosticResult = {
  status: string;
  model: string;
  scripts_available: boolean;
  ollama_command_available: boolean;
  ollama_api_available: boolean;
  model_available: boolean;
  next_step: string;
  message: string;
};

export type SheetSummary = {
  name: string;
  max_row: number;
  max_column: number;
};

export type WorkbookSummary = {
  path: string;
  sheets: SheetSummary[];
};

export type SheetPreview = {
  path: string;
  sheet: string;
  rows: unknown[][];
};

export type FormulaSuggestion = {
  formula: string;
  description: string;
};

export type PivotSummary = {
  group_by: string;
  value_column: string;
  values: Record<string, number>;
};

export type SlideSummary = {
  index: number;
  title: string;
  shape_count: number;
};

export type PresentationSummary = {
  path: string;
  slide_count: number;
  slides: SlideSummary[];
  compatibility_note: string;
};

export type PresentationResult = {
  path: string;
  saved: boolean;
  message: string;
};

export type HwpxSummary = {
  path: string;
  paragraph_count: number;
  paragraphs: string[];
  text: string;
  compatibility_note: string;
};

export type HwpxResult = {
  path: string;
  saved: boolean;
  message: string;
};

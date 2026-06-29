import { useState } from "react";
import {
  fetchHealth,
  addHwpxParagraph,
  addBulletSlide,
  addTitleSlide,
  createPresentation,
  createHwpx,
  deleteSkill,
  diagnoseLocalLlmBundle,
  fetchHancomStatus,
  hwpxCompatibility,
  importSkill,
  listSkills,
  listWorkspace,
  previewAgentPlan,
  proposeCommand,
  queueAgentPlanApprovedSteps,
  readWorkspaceFile,
  previewXlsx,
  runLocalLlmBundle,
  runAgentExecutionQueue,
  setSkillEnabled,
  showCompatibility,
  summarizeHwpx,
  summarizePresentation,
  writeWorkspaceFile,
  summarizeXlsx,
  summarizeXlsxPivot,
  suggestXlsxFormula,
  updateAgentPlanStepStatus,
  writeXlsxCell,
} from "./api";
import type {
  AgentExecutionQueueResult,
  AgentPlanResult,
  AgentPlanStepStatus,
  CommandResult,
  FileEntry,
  FormulaSuggestion,
  HancomAppStatus,
  HancomEnvironmentStatus,
  HealthResult,
  HwpxResult,
  HwpxSummary,
  LocalLlmDiagnosticResult,
  LocalLlmRunResult,
  PivotSummary,
  PresentationResult,
  PresentationSummary,
  SheetPreview,
  SkillMetadata,
  WorkbookSummary,
  WriteResult,
} from "./types";
import "./styles.css";

export function App() {
  const [health, setHealth] = useState<HealthResult | null>(null);
  const [hancomStatus, setHancomStatus] = useState<HancomEnvironmentStatus | null>(null);
  const [skillFile, setSkillFile] = useState<File | null>(null);
  const [skills, setSkills] = useState<SkillMetadata[]>([]);
  const [skillResult, setSkillResult] = useState<SkillMetadata | null>(null);
  const [agentTask, setAgentTask] = useState("월간 보고서를 만들어줘");
  const [agentPlan, setAgentPlan] = useState<AgentPlanResult | null>(null);
  const [agentQueue, setAgentQueue] = useState<AgentExecutionQueueResult | null>(null);
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [workspaceRoot, setWorkspaceRoot] = useState("");
  const [selectedPath, setSelectedPath] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [writeResult, setWriteResult] = useState<WriteResult | null>(null);
  const [command, setCommand] = useState("Get-ChildItem");
  const [commandResult, setCommandResult] = useState<CommandResult | null>(null);
  const [localLlmModel, setLocalLlmModel] = useState("gemma3:12b");
  const [localLlmBundleRoot, setLocalLlmBundleRoot] = useState("");
  const [localLlmApproved, setLocalLlmApproved] = useState(false);
  const [localLlmInstallOllama, setLocalLlmInstallOllama] = useState(false);
  const [localLlmResult, setLocalLlmResult] = useState<LocalLlmRunResult | null>(null);
  const [localLlmDiagnostic, setLocalLlmDiagnostic] = useState<LocalLlmDiagnosticResult | null>(null);
  const [xlsxPath, setXlsxPath] = useState("");
  const [xlsxSheet, setXlsxSheet] = useState("");
  const [xlsxCell, setXlsxCell] = useState("A1");
  const [xlsxValue, setXlsxValue] = useState("");
  const [formulaFunction, setFormulaFunction] = useState("SUM");
  const [formulaRange, setFormulaRange] = useState("B2:B10");
  const [pivotGroup, setPivotGroup] = useState("");
  const [pivotValue, setPivotValue] = useState("");
  const [workbookSummary, setWorkbookSummary] = useState<WorkbookSummary | null>(null);
  const [sheetPreview, setSheetPreview] = useState<SheetPreview | null>(null);
  const [formulaSuggestion, setFormulaSuggestion] = useState<FormulaSuggestion | null>(null);
  const [pivotSummary, setPivotSummary] = useState<PivotSummary | null>(null);
  const [presentationPath, setPresentationPath] = useState("");
  const [presentationTitle, setPresentationTitle] = useState("");
  const [presentationSubtitle, setPresentationSubtitle] = useState("");
  const [presentationBullets, setPresentationBullets] = useState("첫 번째 항목\n두 번째 항목");
  const [presentationSummary, setPresentationSummary] = useState<PresentationSummary | null>(null);
  const [presentationResult, setPresentationResult] = useState<PresentationResult | null>(null);
  const [hwpxPath, setHwpxPath] = useState("");
  const [hwpxTitle, setHwpxTitle] = useState("");
  const [hwpxParagraphs, setHwpxParagraphs] = useState("첫 문단\n둘째 문단");
  const [hwpxNewParagraph, setHwpxNewParagraph] = useState("");
  const [hwpxSummary, setHwpxSummary] = useState<HwpxSummary | null>(null);
  const [hwpxResult, setHwpxResult] = useState<HwpxResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function runHealthCheck() {
    setError("");
    setLoading(true);
    try {
      setHealth(await fetchHealth());
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 health check 오류");
    } finally {
      setLoading(false);
    }
  }

  async function loadHancomStatus() {
    setError("");
    setLoading(true);
    try {
      setHancomStatus(await fetchHancomStatus());
    } catch (err) {
      setError(err instanceof Error ? err.message : "한컴오피스 감지 오류");
    } finally {
      setLoading(false);
    }
  }

  async function loadSkills() {
    setError("");
    setLoading(true);
    try {
      setSkills(await listSkills());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Skill 목록 오류");
    } finally {
      setLoading(false);
    }
  }

  async function uploadSkill() {
    if (!skillFile) {
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await importSkill(skillFile);
      setSkillResult(result);
      setSkillFile(null);
      setSkills(await listSkills());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Skill 업로드 오류");
    } finally {
      setLoading(false);
    }
  }

  async function toggleSkill(skill: SkillMetadata) {
    setError("");
    setLoading(true);
    try {
      setSkillResult(await setSkillEnabled(skill.skill_id, !skill.enabled));
      setSkills(await listSkills());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Skill 상태 변경 오류");
    } finally {
      setLoading(false);
    }
  }

  async function removeSkill(skillId: string) {
    setError("");
    setLoading(true);
    try {
      await deleteSkill(skillId);
      setSkillResult(null);
      setSkills(await listSkills());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Skill 삭제 오류");
    } finally {
      setLoading(false);
    }
  }

  async function buildAgentPlanPreview(execute = false) {
    setError("");
    setLoading(true);
    try {
      setAgentPlan(await previewAgentPlan(agentTask, execute));
      setAgentQueue(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "작업 계획 생성 오류");
    } finally {
      setLoading(false);
    }
  }

  async function changeAgentStepStatus(stepId: string, status: AgentPlanStepStatus) {
    if (!agentPlan?.plan_id) {
      setError("저장된 계획 ID가 없어 단계 상태를 변경할 수 없습니다.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      setAgentPlan(await updateAgentPlanStepStatus(agentPlan.plan_id, stepId, status));
      setAgentQueue(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "작업 단계 상태 변경 오류");
    } finally {
      setLoading(false);
    }
  }

  async function queueApprovedAgentSteps() {
    if (!agentPlan?.plan_id) {
      setError("저장된 계획 ID가 없어 실행 큐를 만들 수 없습니다.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      setAgentQueue(await queueAgentPlanApprovedSteps(agentPlan.plan_id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "실행 큐 생성 오류");
    } finally {
      setLoading(false);
    }
  }

  async function runAgentQueue() {
    if (!agentQueue?.queue_id) {
      setError("실행할 큐 ID가 없습니다.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      setAgentQueue(await runAgentExecutionQueue(agentQueue.queue_id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "실행 큐 처리 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <h1>Army Claw</h1>
          <p>로컬 에이전트 연결 상태</p>
        </div>
        <span className="mode-badge">Slice 1</span>
      </header>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>모델 연결 진단</h2>
            <p>현재 선택된 LLM Provider와 모델 응답 가능 여부를 확인합니다.</p>
          </div>
          <button type="button" onClick={runHealthCheck} disabled={loading}>
            {loading ? "확인 중..." : "Health Check"}
          </button>
        </div>

        {error ? <p className="alert" role="alert">{error}</p> : null}

        <dl className="status-grid">
          <div>
            <dt>Provider</dt>
            <dd>{health?.provider ?? "미확인"}</dd>
          </div>
          <div>
            <dt>Model</dt>
            <dd>{health?.model ?? "미확인"}</dd>
          </div>
          <div>
            <dt>Available</dt>
            <dd>{health ? (health.available ? "Yes" : "No") : "미확인"}</dd>
          </div>
          <div>
            <dt>Latency</dt>
            <dd>{health?.latency_ms == null ? "n/a" : `${Math.round(health.latency_ms)} ms`}</dd>
          </div>
          <div>
            <dt>Tokens/sec</dt>
            <dd>{health?.tokens_per_second == null ? "n/a" : health.tokens_per_second}</dd>
          </div>
          <div>
            <dt>Message</dt>
            <dd>{health?.message || "n/a"}</dd>
          </div>
        </dl>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Skill 관리</h2>
            <p>외부에서 반입한 정적 skill zip을 로컬 저장소에 등록하고 활성 상태를 관리합니다.</p>
          </div>
          <button type="button" onClick={loadSkills} disabled={loading}>
            목록 새로고침
          </button>
        </div>

        <label className="field">
          <span>Skill zip 파일</span>
          <input
            type="file"
            accept=".zip,application/zip"
            onChange={(event) => setSkillFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <div className="button-row">
          <button type="button" onClick={uploadSkill} disabled={!skillFile || loading}>
            Skill 업로드
          </button>
        </div>

        {skillResult ? <pre className="diff-box">{JSON.stringify(skillResult, null, 2)}</pre> : null}

        <div className="result-stack">
          {skills.map((skill) => (
            <div className="list-card" key={skill.skill_id}>
              <div>
                <strong>{skill.name}</strong>
                <p>{skill.description || "설명 없음"}</p>
                <small>
                  {skill.skill_id} · {skill.enabled ? "활성" : "비활성"} · {skill.sha256.slice(0, 12)}
                </small>
              </div>
              <div className="button-row compact-actions">
                <button type="button" onClick={() => toggleSkill(skill)} disabled={loading}>
                  {skill.enabled ? "비활성화" : "활성화"}
                </button>
                <button type="button" onClick={() => removeSkill(skill.skill_id)} disabled={loading}>
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Skill 적용 작업 계획</h2>
            <p>활성화된 skill을 작업 프롬프트에 주입해 실제 실행 전 계획을 미리 확인합니다.</p>
          </div>
          <div className="button-row compact-actions">
            <button type="button" onClick={() => buildAgentPlanPreview(false)} disabled={!agentTask || loading}>
              프롬프트 미리보기
            </button>
            <button type="button" onClick={() => buildAgentPlanPreview(true)} disabled={!agentTask || loading}>
              LLM 계획 생성
            </button>
            <button
              type="button"
              onClick={queueApprovedAgentSteps}
              disabled={!agentPlan?.plan_id || loading || !agentPlan.steps.some((step) => step.status === "approved")}
            >
              승인 단계 큐 생성
            </button>
          </div>
        </div>

        <label className="field">
          <span>작업 요청</span>
          <input value={agentTask} onChange={(event) => setAgentTask(event.target.value)} />
        </label>

        {agentPlan ? (
          <div className="result-stack">
            <dl className="status-grid compact-grid">
              <div>
                <dt>실행 여부</dt>
                <dd>{agentPlan.executed ? "LLM 생성" : "프롬프트 미리보기"}</dd>
              </div>
              <div>
                <dt>적용 Skill</dt>
                <dd>{agentPlan.used_skills.map((skill) => skill.name).join(", ") || "없음"}</dd>
              </div>
            </dl>
            {agentPlan.plan ? <pre className="diff-box">{agentPlan.plan}</pre> : null}
            {agentPlan.steps.length ? (
              <div className="result-stack">
                {agentPlan.steps.map((step) => (
                  <div className="list-card" key={step.step_id}>
                    <div>
                      <strong>{step.title}</strong>
                      <p>{step.detail}</p>
                      <small>
                        {step.action_type} · {step.status} · {step.requires_approval ? "승인 필요" : "승인 불필요"}
                      </small>
                    </div>
                    <div className="button-row compact-actions">
                      <button
                        type="button"
                        onClick={() => changeAgentStepStatus(step.step_id, "approved")}
                        disabled={!agentPlan.plan_id || loading || step.status === "approved"}
                      >
                        승인
                      </button>
                      <button
                        type="button"
                        onClick={() => changeAgentStepStatus(step.step_id, "blocked")}
                        disabled={!agentPlan.plan_id || loading || step.status === "blocked"}
                      >
                        보류
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            {agentQueue ? (
              <div className="result-stack">
                <dl className="status-grid compact-grid">
                  <div>
                    <dt>Queue ID</dt>
                    <dd>{agentQueue.queue_id}</dd>
                  </div>
                  <div>
                    <dt>대기 단계</dt>
                    <dd>{agentQueue.queued_count}</dd>
                  </div>
                </dl>
                <div className="button-row compact-actions">
                  <button
                    type="button"
                    onClick={runAgentQueue}
                    disabled={loading || !agentQueue.items.some((item) => item.status === "queued")}
                  >
                    큐 실행
                  </button>
                </div>
                {agentQueue.items.map((item) => (
                  <div className="list-card" key={item.step_id}>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.detail}</p>
                      <small>
                        {item.action_type} · {item.status}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            <pre className="diff-box">{agentPlan.prompt}</pre>
          </div>
        ) : null}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>한컴오피스 환경</h2>
            <p>한글, 한셀, 한쇼 실행 파일을 감지해 네이티브 검증 가능 범위를 확인합니다.</p>
          </div>
          <button type="button" onClick={loadHancomStatus} disabled={loading}>
            한컴 감지
          </button>
        </div>

        <dl className="status-grid">
          <div>
            <dt>검증 수준</dt>
            <dd>{hancomStatus?.validation_level ?? "미확인"}</dd>
          </div>
          <div>
            <dt>한글</dt>
            <dd>{formatHancomApp(hancomStatus?.hwp)}</dd>
          </div>
          <div>
            <dt>한셀</dt>
            <dd>{formatHancomApp(hancomStatus?.hcell)}</dd>
          </div>
          <div>
            <dt>한쇼</dt>
            <dd>{formatHancomApp(hancomStatus?.hshow)}</dd>
          </div>
          <div>
            <dt>상태</dt>
            <dd>{hancomStatus ? (hancomStatus.installed ? "감지됨" : "미감지") : "미확인"}</dd>
          </div>
          <div>
            <dt>메시지</dt>
            <dd>{hancomStatus?.message ?? "n/a"}</dd>
          </div>
        </dl>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Local LLM Bundle 실행</h2>
            <p>허용된 Ollama 번들 설치/검증 스크립트만 사용자 승인 후 실행합니다.</p>
          </div>
          <button type="button" onClick={() => executeLocalLlm("verify", false)} disabled={!localLlmApproved || loading}>
            검증
          </button>
        </div>

        <div className="two-column">
          <label className="field">
            <span>모델</span>
            <input value={localLlmModel} onChange={(event) => setLocalLlmModel(event.target.value)} />
          </label>
          <label className="field">
            <span>번들 경로</span>
            <input
              value={localLlmBundleRoot}
              onChange={(event) => setLocalLlmBundleRoot(event.target.value)}
              placeholder="예: D:\\local-llm-bundle"
            />
          </label>
        </div>

        <div className="check-row">
          <label>
            <input
              type="checkbox"
              checked={localLlmApproved}
              onChange={(event) => setLocalLlmApproved(event.target.checked)}
            />
            실행 승인
          </label>
          <label>
            <input
              type="checkbox"
              checked={localLlmInstallOllama}
              onChange={(event) => setLocalLlmInstallOllama(event.target.checked)}
            />
            설치 시 Ollama 설치 파일 실행
          </label>
        </div>

        <div className="button-row">
          <button type="button" onClick={diagnoseLocalLlm} disabled={loading}>
            사전진단
          </button>
          <button type="button" onClick={() => executeLocalLlm("verify", true)} disabled={!localLlmApproved || loading}>
            빠른 검증
          </button>
          <button type="button" onClick={() => executeLocalLlm("install", false)} disabled={!localLlmApproved || !localLlmBundleRoot || loading}>
            번들 설치
          </button>
        </div>

        {localLlmDiagnostic ? (
          <dl className="status-grid compact-grid">
            <div>
              <dt>상태</dt>
              <dd>{localLlmDiagnostic.status}</dd>
            </div>
            <div>
              <dt>스크립트</dt>
              <dd>{localLlmDiagnostic.scripts_available ? "있음" : "없음"}</dd>
            </div>
            <div>
              <dt>Ollama 명령</dt>
              <dd>{localLlmDiagnostic.ollama_command_available ? "있음" : "없음"}</dd>
            </div>
            <div>
              <dt>Ollama API</dt>
              <dd>{localLlmDiagnostic.ollama_api_available ? "응답" : "미응답"}</dd>
            </div>
            <div>
              <dt>모델</dt>
              <dd>{localLlmDiagnostic.model_available ? "있음" : "없음"}</dd>
            </div>
            <div>
              <dt>다음 조치</dt>
              <dd>{localLlmDiagnostic.next_step}</dd>
            </div>
          </dl>
        ) : null}

        {localLlmResult ? (
          <pre className="diff-box">{JSON.stringify(localLlmResult, null, 2)}</pre>
        ) : null}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>작업공간 도구</h2>
            <p>Mode A 기준으로 지정한 작업공간 내부 파일만 다룹니다.</p>
          </div>
          <button type="button" onClick={loadWorkspace} disabled={!workspaceRoot || loading}>
            파일 목록
          </button>
        </div>

        <label className="field">
          <span>작업공간 경로</span>
          <input
            value={workspaceRoot}
            onChange={(event) => setWorkspaceRoot(event.target.value)}
            placeholder="C:\\Users\\USER\\Desktop\\로컬 open claw 만들기"
          />
        </label>

        <div className="workspace-grid">
          <div className="file-list">
            {entries.map((entry) => (
              <button
                className="file-button"
                key={entry.path}
                type="button"
                onClick={() => selectFile(entry)}
                disabled={entry.type !== "file"}
              >
                {entry.type === "directory" ? "[폴더]" : "[파일]"} {entry.path}
              </button>
            ))}
          </div>

          <div className="editor-pane">
            <label className="field">
              <span>파일 경로</span>
              <input
                value={selectedPath}
                onChange={(event) => setSelectedPath(event.target.value)}
                placeholder="예: README.md"
              />
            </label>
            <textarea
              value={fileContent}
              onChange={(event) => setFileContent(event.target.value)}
              placeholder="파일 내용이 여기에 표시됩니다."
            />
            <div className="button-row">
              <button type="button" onClick={previewWrite} disabled={!workspaceRoot || !selectedPath}>
                Diff Preview
              </button>
              <button type="button" onClick={approvedWrite} disabled={!workspaceRoot || !selectedPath}>
                승인 후 쓰기
              </button>
            </div>
            {writeResult ? (
              <pre className="diff-box">{writeResult.diff || "변경 사항 없음"}</pre>
            ) : null}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>PowerShell 승인 요청</h2>
            <p>기본 동작은 실행하지 않고 승인 필요 상태만 반환합니다.</p>
          </div>
          <button type="button" onClick={requestCommandApproval} disabled={!workspaceRoot || !command}>
            승인 요청
          </button>
        </div>
        <label className="field">
          <span>명령</span>
          <input value={command} onChange={(event) => setCommand(event.target.value)} />
        </label>
        {commandResult ? <pre className="diff-box">{JSON.stringify(commandResult, null, 2)}</pre> : null}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>한셀/XLSX 도구</h2>
            <p>XLSX 파일을 직접 읽고 요약합니다. Microsoft Excel 설치는 필요하지 않습니다.</p>
          </div>
          <button type="button" onClick={loadXlsxSummary} disabled={!workspaceRoot || !xlsxPath}>
            Workbook 요약
          </button>
        </div>

        <div className="two-column">
          <label className="field">
            <span>XLSX 경로</span>
            <input value={xlsxPath} onChange={(event) => setXlsxPath(event.target.value)} placeholder="예: reports/sample.xlsx" />
          </label>
          <label className="field">
            <span>Sheet</span>
            <input value={xlsxSheet} onChange={(event) => setXlsxSheet(event.target.value)} placeholder="예: Data" />
          </label>
        </div>

        <div className="button-row">
          <button type="button" onClick={loadXlsxPreview} disabled={!workspaceRoot || !xlsxPath || !xlsxSheet}>
            Sheet Preview
          </button>
          <button type="button" onClick={saveXlsxCell} disabled={!workspaceRoot || !xlsxPath || !xlsxSheet || !xlsxCell}>
            셀 쓰기
          </button>
        </div>

        <div className="two-column">
          <label className="field">
            <span>셀</span>
            <input value={xlsxCell} onChange={(event) => setXlsxCell(event.target.value)} />
          </label>
          <label className="field">
            <span>값</span>
            <input value={xlsxValue} onChange={(event) => setXlsxValue(event.target.value)} />
          </label>
        </div>

        <div className="two-column">
          <label className="field">
            <span>함수</span>
            <input value={formulaFunction} onChange={(event) => setFormulaFunction(event.target.value)} />
          </label>
          <label className="field">
            <span>범위</span>
            <input value={formulaRange} onChange={(event) => setFormulaRange(event.target.value)} />
          </label>
        </div>
        <button type="button" onClick={loadFormulaSuggestion}>
          함수 제안
        </button>

        <div className="two-column">
          <label className="field">
            <span>그룹 열</span>
            <input value={pivotGroup} onChange={(event) => setPivotGroup(event.target.value)} placeholder="예: 부서" />
          </label>
          <label className="field">
            <span>값 열</span>
            <input value={pivotValue} onChange={(event) => setPivotValue(event.target.value)} placeholder="예: 금액" />
          </label>
        </div>
        <button type="button" onClick={loadPivotSummary} disabled={!workspaceRoot || !xlsxPath || !xlsxSheet || !pivotGroup || !pivotValue}>
          피벗형 요약
        </button>

        <div className="result-stack">
          {workbookSummary ? <pre className="diff-box">{JSON.stringify(workbookSummary, null, 2)}</pre> : null}
          {sheetPreview ? <pre className="diff-box">{JSON.stringify(sheetPreview.rows, null, 2)}</pre> : null}
          {formulaSuggestion ? <pre className="diff-box">{JSON.stringify(formulaSuggestion, null, 2)}</pre> : null}
          {pivotSummary ? <pre className="diff-box">{JSON.stringify(pivotSummary, null, 2)}</pre> : null}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>한쇼/PPTX 도구</h2>
            <p>PPTX를 주 편집 포맷으로 다룹니다. .show는 현재 호환성 안내를 제공합니다.</p>
          </div>
          <button type="button" onClick={loadPresentationSummary} disabled={!workspaceRoot || !presentationPath}>
            PPTX 요약
          </button>
        </div>

        <label className="field">
          <span>프레젠테이션 경로</span>
          <input
            value={presentationPath}
            onChange={(event) => setPresentationPath(event.target.value)}
            placeholder="예: slides/report.pptx 또는 slides/report.show"
          />
        </label>
        <div className="two-column">
          <label className="field">
            <span>제목</span>
            <input value={presentationTitle} onChange={(event) => setPresentationTitle(event.target.value)} />
          </label>
          <label className="field">
            <span>부제</span>
            <input value={presentationSubtitle} onChange={(event) => setPresentationSubtitle(event.target.value)} />
          </label>
        </div>
        <label className="field">
          <span>Bullet 항목</span>
          <textarea
            className="small-textarea"
            value={presentationBullets}
            onChange={(event) => setPresentationBullets(event.target.value)}
          />
        </label>
        <div className="button-row">
          <button type="button" onClick={createDeck} disabled={!workspaceRoot || !presentationPath || !presentationTitle}>
            새 PPTX
          </button>
          <button type="button" onClick={appendTitleSlide} disabled={!workspaceRoot || !presentationPath || !presentationTitle}>
            제목 슬라이드
          </button>
          <button type="button" onClick={appendBulletSlide} disabled={!workspaceRoot || !presentationPath || !presentationTitle}>
            Bullet 슬라이드
          </button>
          <button type="button" onClick={loadShowCompatibility} disabled={!workspaceRoot || !presentationPath}>
            .show 호환성
          </button>
        </div>
        <div className="result-stack">
          {presentationResult ? <pre className="diff-box">{JSON.stringify(presentationResult, null, 2)}</pre> : null}
          {presentationSummary ? <pre className="diff-box">{JSON.stringify(presentationSummary, null, 2)}</pre> : null}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>한글/HWPX 도구</h2>
            <p>HWPX를 ZIP/XML 문서로 직접 생성하고 본문 단락을 읽고 추가합니다.</p>
          </div>
          <button type="button" onClick={loadHwpxSummary} disabled={!workspaceRoot || !hwpxPath}>
            HWPX 요약
          </button>
        </div>

        <label className="field">
          <span>HWPX 경로</span>
          <input
            value={hwpxPath}
            onChange={(event) => setHwpxPath(event.target.value)}
            placeholder="예: docs/report.hwpx"
          />
        </label>
        <label className="field">
          <span>문서 제목</span>
          <input value={hwpxTitle} onChange={(event) => setHwpxTitle(event.target.value)} />
        </label>
        <label className="field">
          <span>본문 문단</span>
          <textarea
            className="small-textarea"
            value={hwpxParagraphs}
            onChange={(event) => setHwpxParagraphs(event.target.value)}
          />
        </label>
        <label className="field">
          <span>추가 문단</span>
          <input value={hwpxNewParagraph} onChange={(event) => setHwpxNewParagraph(event.target.value)} />
        </label>
        <div className="button-row">
          <button type="button" onClick={createHwpxDocument} disabled={!workspaceRoot || !hwpxPath || !hwpxTitle}>
            HWPX 생성
          </button>
          <button type="button" onClick={appendHwpxParagraph} disabled={!workspaceRoot || !hwpxPath || !hwpxNewParagraph}>
            문단 추가
          </button>
          <button type="button" onClick={loadHwpxCompatibility} disabled={!workspaceRoot || !hwpxPath}>
            호환성
          </button>
        </div>
        <div className="result-stack">
          {hwpxResult ? <pre className="diff-box">{JSON.stringify(hwpxResult, null, 2)}</pre> : null}
          {hwpxSummary ? <pre className="diff-box">{JSON.stringify(hwpxSummary, null, 2)}</pre> : null}
        </div>
      </section>
    </main>
  );

  async function loadWorkspace() {
    setError("");
    setLoading(true);
    try {
      setEntries(await listWorkspace(workspaceRoot));
    } catch (err) {
      setError(err instanceof Error ? err.message : "작업공간 목록 오류");
    } finally {
      setLoading(false);
    }
  }

  function formatHancomApp(status: HancomAppStatus | undefined) {
    if (!status) {
      return "미확인";
    }
    return status.available ? `있음: ${status.path}` : "없음";
  }

  async function selectFile(entry: FileEntry) {
    setError("");
    try {
      const result = await readWorkspaceFile(workspaceRoot, entry.path);
      setSelectedPath(result.path);
      setFileContent(result.content);
      setWriteResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "파일 읽기 오류");
    }
  }

  async function previewWrite() {
    setError("");
    try {
      setWriteResult(await writeWorkspaceFile(workspaceRoot, selectedPath, fileContent, false));
    } catch (err) {
      setError(err instanceof Error ? err.message : "diff preview 오류");
    }
  }

  async function approvedWrite() {
    setError("");
    try {
      setWriteResult(await writeWorkspaceFile(workspaceRoot, selectedPath, fileContent, true));
      await loadWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : "파일 쓰기 오류");
    }
  }

  async function requestCommandApproval() {
    setError("");
    try {
      setCommandResult(await proposeCommand(workspaceRoot, command));
    } catch (err) {
      setError(err instanceof Error ? err.message : "명령 승인 요청 오류");
    }
  }

  async function executeLocalLlm(action: "verify" | "install", skipGenerate: boolean) {
    setError("");
    setLoading(true);
    try {
      setLocalLlmResult(
        await runLocalLlmBundle({
          action,
          approved: localLlmApproved,
          model: localLlmModel,
          bundle_root: localLlmBundleRoot,
          install_ollama: localLlmInstallOllama,
          skip_generate: skipGenerate,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Local LLM Bundle 실행 오류");
    } finally {
      setLoading(false);
    }
  }

  async function diagnoseLocalLlm() {
    setError("");
    setLoading(true);
    try {
      setLocalLlmDiagnostic(await diagnoseLocalLlmBundle(localLlmModel));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Local LLM 사전진단 오류");
    } finally {
      setLoading(false);
    }
  }

  async function loadXlsxSummary() {
    setError("");
    try {
      const summary = await summarizeXlsx(workspaceRoot, xlsxPath);
      setWorkbookSummary(summary);
      setXlsxSheet((current) => current || summary.sheets[0]?.name || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "XLSX 요약 오류");
    }
  }

  async function loadXlsxPreview() {
    setError("");
    try {
      setSheetPreview(await previewXlsx(workspaceRoot, xlsxPath, xlsxSheet));
    } catch (err) {
      setError(err instanceof Error ? err.message : "XLSX preview 오류");
    }
  }

  async function saveXlsxCell() {
    setError("");
    try {
      await writeXlsxCell(workspaceRoot, xlsxPath, xlsxSheet, xlsxCell, xlsxValue);
      await loadXlsxPreview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "XLSX 셀 쓰기 오류");
    }
  }

  async function loadFormulaSuggestion() {
    setError("");
    try {
      setFormulaSuggestion(await suggestXlsxFormula(formulaFunction, formulaRange));
    } catch (err) {
      setError(err instanceof Error ? err.message : "함수 제안 오류");
    }
  }

  async function loadPivotSummary() {
    setError("");
    try {
      setPivotSummary(await summarizeXlsxPivot(workspaceRoot, xlsxPath, xlsxSheet, pivotGroup, pivotValue));
    } catch (err) {
      setError(err instanceof Error ? err.message : "피벗형 요약 오류");
    }
  }

  async function createDeck() {
    setError("");
    try {
      setPresentationResult(await createPresentation(workspaceRoot, presentationPath, presentationTitle, presentationSubtitle));
      await loadPresentationSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "PPTX 생성 오류");
    }
  }

  async function loadPresentationSummary() {
    setError("");
    try {
      setPresentationSummary(await summarizePresentation(workspaceRoot, presentationPath));
    } catch (err) {
      setError(err instanceof Error ? err.message : "PPTX 요약 오류");
    }
  }

  async function appendTitleSlide() {
    setError("");
    try {
      setPresentationResult(await addTitleSlide(workspaceRoot, presentationPath, presentationTitle, presentationSubtitle));
      await loadPresentationSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "제목 슬라이드 추가 오류");
    }
  }

  async function appendBulletSlide() {
    setError("");
    try {
      const bullets = presentationBullets.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
      setPresentationResult(await addBulletSlide(workspaceRoot, presentationPath, presentationTitle, bullets));
      await loadPresentationSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bullet 슬라이드 추가 오류");
    }
  }

  async function loadShowCompatibility() {
    setError("");
    try {
      setPresentationSummary(await showCompatibility(workspaceRoot, presentationPath));
    } catch (err) {
      setError(err instanceof Error ? err.message : ".show 호환성 확인 오류");
    }
  }

  async function createHwpxDocument() {
    setError("");
    try {
      const paragraphs = hwpxParagraphs.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
      setHwpxResult(await createHwpx(workspaceRoot, hwpxPath, hwpxTitle, paragraphs));
      await loadHwpxSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "HWPX 생성 오류");
    }
  }

  async function loadHwpxSummary() {
    setError("");
    try {
      setHwpxSummary(await summarizeHwpx(workspaceRoot, hwpxPath));
    } catch (err) {
      setError(err instanceof Error ? err.message : "HWPX 요약 오류");
    }
  }

  async function appendHwpxParagraph() {
    setError("");
    try {
      setHwpxResult(await addHwpxParagraph(workspaceRoot, hwpxPath, hwpxNewParagraph));
      await loadHwpxSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : "HWPX 문단 추가 오류");
    }
  }

  async function loadHwpxCompatibility() {
    setError("");
    try {
      setHwpxSummary(await hwpxCompatibility(workspaceRoot, hwpxPath));
    } catch (err) {
      setError(err instanceof Error ? err.message : "HWPX 호환성 확인 오류");
    }
  }
}

import React, { useEffect, useState } from 'react';
import { Archive, CheckCircle2, Loader2, Mic, RefreshCw, Send } from 'lucide-react';
import { AppSettings, ProjectItem, Pulgi, StudioFile } from '../types/pulgi';
import { PulgiAvatar } from '../components/PulgiAvatar';
import { runWorkspaceTask, WorkspaceRunResult } from '../services/aiClient';
import { downloadFilesAsZip } from '../utils/fileGenerators';
import { selectPulgisForTask } from '../utils/pulgiLogic';
import { startVoiceCapture } from '../utils/voiceEngine';

interface WorkspaceViewProps {
  pulgis: Pulgi[];
  projects: ProjectItem[];
  files: StudioFile[];
  settings: AppSettings;
  initialPrompt?: string;
  activeProjectId?: string | null;
  onProjectCreated: (project: ProjectItem, createdFiles: StudioFile[]) => void;
  onClearInitialPrompt: () => void;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  pulgis,
  projects,
  files,
  settings,
  initialPrompt = '',
  activeProjectId = null,
  onProjectCreated,
  onClearInitialPrompt,
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [revisionNote, setRevisionNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState<WorkspaceRunResult | null>(null);
  const [currentProject, setCurrentProject] = useState<ProjectItem | null>(
    activeProjectId ? projects.find((p) => p.id === activeProjectId) || null : null
  );

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
      onClearInitialPrompt();
    }
  }, [initialPrompt, onClearInitialPrompt]);

  useEffect(() => {
    if (activeProjectId) {
      const found = projects.find((p) => p.id === activeProjectId);
      if (found) {
        setCurrentProject(found);
        setPrompt(found.description);
      }
    }
  }, [activeProjectId, projects]);

  const executeTask = async (isRevision = false) => {
    const taskText = isRevision ? prompt || currentProject?.description || '' : prompt;
    if (!taskText.trim() || loading) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const previousFiles =
        isRevision && result
          ? result.files
          : isRevision && currentProject
          ? files
              .filter((f) => currentProject.fileIds.includes(f.id) || f.projectId === currentProject.id)
              .map((f) => ({ name: f.name, format: f.format, content: f.content }))
          : [];

      const chosenPulgis = selectPulgisForTask(taskText, pulgis, 4);
      const out = await runWorkspaceTask(
        taskText,
        chosenPulgis,
        settings,
        previousFiles,
        isRevision ? revisionNote : undefined
      );
      setResult(out);

      const now = Date.now();
      const projId = currentProject?.id || `proj-${now}`;
      const newFiles: StudioFile[] = (out.files || []).map((f, idx) => ({
        id: `file-${now}-${idx}`,
        name: f.name,
        format: f.format || f.name.split('.').pop() || 'txt',
        content: f.content,
        projectId: projId,
        createdByPulgiId: out.selectedPulgiIds?.[0],
        createdAt: now,
        updatedAt: now,
      }));

      const htmlFile = newFiles.find((f) => f.name.toLowerCase().endsWith('.html'));
      const cssFile = newFiles.find((f) => f.name.toLowerCase().endsWith('.css'));
      const jsFile = newFiles.find((f) => f.name.toLowerCase().endsWith('.js'));

      let previewHtml = htmlFile?.content;
      if (previewHtml && (cssFile || jsFile)) {
        if (cssFile && !previewHtml.includes(cssFile.content)) {
          previewHtml = previewHtml.replace('</head>', `<style>${cssFile.content}</style></head>`);
        }
        if (jsFile && !previewHtml.includes(jsFile.content)) {
          previewHtml = previewHtml.replace('</body>', `<script>${jsFile.content}</script></body>`);
        }
      }

      const pulgiNames = (out.selectedPulgiIds || [])
        .map((id) => pulgis.find((p) => p.id === id)?.name)
        .filter((n): n is string => Boolean(n));

      const projectObj: ProjectItem = {
        id: projId,
        name: out.projectName || currentProject?.name || 'Projeto Pulgi',
        description: out.description || taskText,
        category: out.category || 'Workspace',
        status: 'completed',
        pulgiIds: out.selectedPulgiIds?.length ? out.selectedPulgiIds : chosenPulgis.map((p) => p.id),
        fileIds: newFiles.map((f) => f.id),
        previewHtml,
        history: [
          ...(currentProject?.history || []),
          {
            id: `hist-${now}`,
            note: isRevision ? `Alteração: ${revisionNote}` : 'Projeto desenvolvido pelos Pulgis no Workspace.',
            pulgiNames: pulgiNames.length ? pulgiNames : chosenPulgis.map((p) => p.name),
            timestamp: now,
          },
        ],
        createdAt: currentProject?.createdAt || now,
        updatedAt: now,
      };

      setCurrentProject(projectObj);
      setRevisionNote('');
      onProjectCreated(projectObj, newFiles);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao executar tarefa no Workspace.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoice = () => {
    setListening(true);
    setErrorMsg(null);
    startVoiceCapture({
      language: settings.language,
      onInterim: (txt) => setPrompt(txt),
      onFinal: (txt) => {
        setPrompt(txt);
        setListening(false);
      },
      onError: (msg) => {
        setErrorMsg(msg);
        setListening(false);
      },
      onStateChange: (st) => {
        if (st === 'idle') setListening(false);
      },
    });
  };

  const activeFiles = result
    ? result.files
    : currentProject
    ? files
        .filter((f) => currentProject.fileIds.includes(f.id) || f.projectId === currentProject.id)
        .map((f) => ({ name: f.name, format: f.format, content: f.content }))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Pulgi Workspace — Tarefas dos Agentes
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Entregue um objetivo. Os Pulgis interpretam o pedido, dividem etapas, colaboram e entregam os arquivos finais.
        </p>
      </div>

      {/* Task Prompt Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          executeTask(false);
        }}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3"
      >
        <label htmlFor="workspace-prompt" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          O que seus Pulgis devem construir hoje?
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              id="workspace-prompt"
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Quero criar um website de animais com galeria e curiosidades"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 pr-12 text-sm text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none min-h-[46px]"
            />
            <button
              type="button"
              onClick={handleVoice}
              aria-label="Ditar pedido por voz"
              className={`absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-lg ${
                listening ? 'bg-rose-500 text-white' : 'text-slate-500 hover:bg-slate-200/70'
              }`}
            >
              <Mic className="h-4 w-4" />
            </button>
          </div>
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 min-h-[46px] whitespace-nowrap shrink-0"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span>{loading ? 'Colaborando...' : 'Executar Tarefa'}</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            'Quero criar um website de animais',
            'Criem um jogo 2D de coletar estrelas',
            'Planejem um app de estudos com cronograma CSV',
          ].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setPrompt(preset)}
              className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-violet-100 dark:hover:bg-violet-900/40"
            >
              {preset}
            </button>
          ))}
        </div>

        {errorMsg && (
          <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300">
            {errorMsg}
          </div>
        )}
      </form>

      {/* Active Result & Collaboration Steps */}
      {(result || currentProject) && (
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="space-y-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-violet-600 dark:text-violet-400">
                  {currentProject?.category || result?.category} · Salvo em Projetos & Arquivos
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                  {currentProject?.name || result?.projectName}
                </h2>
              </div>
              {activeFiles.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    downloadFilesAsZip(currentProject?.name || 'projeto_pulgi', activeFiles)
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
                >
                  <Archive className="h-3.5 w-3.5" />
                  <span>Baixar ZIP</span>
                </button>
              )}
            </div>

            {result?.steps && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Etapas executadas pelos Pulgis
                </h3>
                {result.steps.map((step, idx) => {
                  const p = pulgis.find((item) => item.id === step.pulgiId || item.name === step.pulgiName);
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3"
                    >
                      {p ? (
                        <PulgiAvatar appearance={p.appearance} name={p.name} size={36} />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {idx + 1}. {step.title} — {step.pulgiName}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                          {step.summary}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Iterative change request */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!revisionNote.trim()) return;
                executeTask(true);
              }}
              className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2"
            >
              <label htmlFor="workspace-revision" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Solicitar alterações aos Pulgis
              </label>
              <div className="flex gap-2">
                <input
                  id="workspace-revision"
                  type="text"
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  placeholder="Ex: Adicione modo escuro e mais animais na galeria..."
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={loading || !revisionNote.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Atualizar</span>
                </button>
              </div>
            </form>
          </section>

          {/* Live Preview & Generated Files */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col min-h-[420px]">
            <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Resultado & Arquivos ({activeFiles.length})
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {activeFiles.map((f) => f.name).join(' · ')}
              </span>
            </div>
            {currentProject?.previewHtml ? (
              <iframe
                title="Prévia do Projeto Workspace"
                sandbox="allow-scripts"
                srcDoc={currentProject.previewHtml}
                className="flex-1 w-full min-h-[380px] bg-white"
              />
            ) : (
              <div className="p-4 space-y-3 overflow-y-auto max-h-[420px]">
                {activeFiles.map((f) => (
                  <div key={f.name} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      {f.name}
                    </div>
                    <pre className="text-xs font-mono text-slate-600 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap">
                      {f.content.slice(0, 1500)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

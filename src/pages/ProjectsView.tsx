import React, { useState } from 'react';
import { Archive, ExternalLink, Eye, Trash2 } from 'lucide-react';
import { ProjectItem, ProjectStatus, Pulgi, StudioFile } from '../types/pulgi';
import { PulgiAvatar } from '../components/PulgiAvatar';
import { downloadFilesAsZip } from '../utils/fileGenerators';

interface ProjectsViewProps {
  projects: ProjectItem[];
  pulgis: Pulgi[];
  files: StudioFile[];
  onUpdateProject: (project: ProjectItem) => void;
  onDeleteProject: (id: string) => void;
  onOpenInWorkspace: (projectId: string) => void;
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: 'Planejamento',
  in_progress: 'Em Desenvolvimento',
  completed: 'Concluído',
};

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  pulgis,
  files,
  onUpdateProject,
  onDeleteProject,
  onOpenInWorkspace,
}) => {
  const [previewProject, setPreviewProject] = useState<ProjectItem | null>(null);

  const handleExportZip = async (proj: ProjectItem) => {
    const projectFiles = files.filter((f) => proj.fileIds.includes(f.id) || f.projectId === proj.id);
    if (projectFiles.length === 0 && proj.previewHtml) {
      await downloadFilesAsZip(proj.name, [{ name: 'index.html', content: proj.previewHtml }]);
      return;
    }
    await downloadFilesAsZip(
      proj.name,
      projectFiles.map((f) => ({ name: f.name, content: f.content }))
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Projetos ({projects.length})
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Acompanhe o desenvolvimento, histórico de alterações, arquivos e prévias criadas pelos Pulgis.
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Nenhum projeto criado ainda. Vá até o Workspace ou Pulgi Studio para iniciar um projeto.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {projects.map((proj) => {
            const team = pulgis.filter((p) => proj.pulgiIds.includes(p.id));
            const projFiles = files.filter((f) => proj.fileIds.includes(f.id) || f.projectId === proj.id);

            return (
              <article
                key={proj.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-violet-600 dark:text-violet-400">
                        {proj.category} · {projFiles.length} arquivo(s)
                      </p>
                      <h2 className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">
                        {proj.name}
                      </h2>
                    </div>

                    <select
                      aria-label={`Status do projeto ${proj.name}`}
                      value={proj.status}
                      onChange={(e) =>
                        onUpdateProject({
                          ...proj,
                          status: e.target.value as ProjectStatus,
                          updatedAt: Date.now(),
                        })
                      }
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200"
                    >
                      {Object.entries(STATUS_LABELS).map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {proj.description}
                  </p>

                  {team.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      {team.map((m) => (
                        <div key={m.id} className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <PulgiAvatar appearance={m.appearance} name={m.name} size={26} />
                          <span>{m.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {proj.history.length > 0 && (
                    <div className="mt-3 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Histórico de alterações
                      </div>
                      <ul className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                        {proj.history.slice(-3).map((h) => (
                          <li key={h.id}>
                            • {h.note} ({h.pulgiNames.join(', ')})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {proj.previewHtml && (
                    <button
                      type="button"
                      onClick={() => setPreviewProject(proj)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-violet-700 min-h-[40px]"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Prévia ao Vivo</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onOpenInWorkspace(proj.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[40px]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Iterar no Workspace</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportZip(proj)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[40px]"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    <span>ZIP</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteProject(proj.id)}
                    aria-label={`Excluir projeto ${proj.name}`}
                    className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {previewProject?.previewHtml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="flex h-[85dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 py-3">
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                Prévia: {previewProject.name}
              </div>
              <button
                type="button"
                onClick={() => setPreviewProject(null)}
                className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Fechar
              </button>
            </div>
            <iframe
              title={`Prévia de ${previewProject.name}`}
              sandbox="allow-scripts"
              srcDoc={previewProject.previewHtml}
              className="flex-1 w-full bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
};

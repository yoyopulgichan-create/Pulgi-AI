import React, { useState } from 'react';
import { Archive, Download, Eye, Search, Trash2 } from 'lucide-react';
import { StudioFile } from '../types/pulgi';
import { downloadFilesAsZip, downloadStudioFile } from '../utils/fileGenerators';

interface FilesViewProps {
  files: StudioFile[];
  onUpdateFile: (file: StudioFile) => void;
  onDeleteFile: (id: string) => void;
}

export const FilesView: React.FC<FilesViewProps> = ({
  files,
  onUpdateFile,
  onDeleteFile,
}) => {
  const [search, setSearch] = useState('');
  const [formatFilter, setFormatFilter] = useState('all');
  const [selectedFile, setSelectedFile] = useState<StudioFile | null>(files[0] || null);

  const formats = Array.from(new Set(files.map((f) => f.format.toLowerCase())));

  const filtered = files.filter((f) => {
    const fmtOk = formatFilter === 'all' || f.format.toLowerCase() === formatFilter;
    const q = search.trim().toLowerCase();
    const qOk = !q || f.name.toLowerCase().includes(q) || f.content.toLowerCase().includes(q);
    return fmtOk && qOk;
  });

  const activeFile = files.find((f) => f.id === selectedFile?.id) || filtered[0] || null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Arquivos Criados ({files.length})
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Todos os arquivos salvos localmente no IndexedDB. Visualize, edite e exporte em qualquer formato.
          </p>
        </div>

        {filtered.length > 0 && (
          <button
            type="button"
            onClick={() =>
              downloadFilesAsZip(
                'pulgi_arquivos',
                filtered.map((f) => ({ name: f.name, content: f.content }))
              )
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 min-h-[40px] self-start sm:self-auto"
          >
            <Archive className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <span>Exportar Tudo (.ZIP)</span>
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar arquivos por nome ou conteúdo..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white min-h-[44px]"
          />
        </div>
        <select
          aria-label="Filtrar por formato"
          value={formatFilter}
          onChange={(e) => setFormatFilter(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 min-h-[44px]"
        >
          <option value="all">Todos os formatos</option>
          {formats.map((fmt) => (
            <option key={fmt} value={fmt}>
              .{fmt.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-500">
          Nenhum arquivo encontrado. Crie novos conteúdos no Pulgi Studio ou Workspace!
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {filtered.map((file) => {
              const isSelected = activeFile?.id === file.id;
              return (
                <div
                  key={file.id}
                  className={`flex items-center justify-between gap-2 p-3.5 transition ${
                    isSelected ? 'bg-violet-50/70 dark:bg-violet-950/40' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedFile(file)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {file.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      .{file.format.toUpperCase()} · {new Date(file.updatedAt).toLocaleDateString()}
                    </div>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedFile(file)}
                      aria-label={`Visualizar ${file.name}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadStudioFile(file)}
                      aria-label={`Baixar ${file.name}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-950/60"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteFile(file.id)}
                      aria-label={`Excluir ${file.name}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {activeFile && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-slate-900 dark:text-white">
                    {activeFile.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Edição local automática no IndexedDB
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => downloadStudioFile(activeFile)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-violet-700 shrink-0"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Baixar .{activeFile.format.toUpperCase()}</span>
                </button>
              </div>

              {activeFile.format.toLowerCase() === 'html' ? (
                <iframe
                  title={`Prévia de ${activeFile.name}`}
                  sandbox="allow-scripts"
                  srcDoc={activeFile.content}
                  className="h-80 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white"
                />
              ) : activeFile.format.toLowerCase() === 'svg' ? (
                <div
                  className="flex h-80 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 p-4 overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: activeFile.content }}
                />
              ) : (
                <textarea
                  value={activeFile.content}
                  onChange={(e) =>
                    onUpdateFile({
                      ...activeFile,
                      content: e.target.value,
                      updatedAt: Date.now(),
                    })
                  }
                  rows={14}
                  className="w-full flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs font-mono text-slate-800 dark:text-slate-100 focus:border-violet-500 focus:outline-none"
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

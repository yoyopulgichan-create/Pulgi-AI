import React, { useState } from 'react';
import { Copy, Edit3, MessageCircle, Plus, Search, Trash2, Zap } from 'lucide-react';
import { Pulgi, PulgiSkill } from '../types/pulgi';
import { PulgiAvatar } from '../components/PulgiAvatar';

interface MyPulgisViewProps {
  pulgis: Pulgi[];
  skills: PulgiSkill[];
  onCreateNew: () => void;
  onEdit: (pulgi: Pulgi) => void;
  onDuplicate: (pulgi: Pulgi) => void;
  onDelete: (id: string) => void;
  onStartChat: (pulgiId: string) => void;
  onOpenSkillsMarketplace: () => void;
}

export const MyPulgisView: React.FC<MyPulgisViewProps> = ({
  pulgis,
  skills,
  onCreateNew,
  onEdit,
  onDuplicate,
  onDelete,
  onStartChat,
  onOpenSkillsMarketplace,
}) => {
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = pulgis.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.role.toLowerCase().includes(q) ||
      p.personality.toLowerCase().includes(q) ||
      p.interests.some((i) => i.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Meus Pulgis ({pulgis.length})
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Criação infinita, sem créditos ou limites. Edite, duplique ou instale novas skills.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenSkillsMarketplace}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 min-h-[42px]"
          >
            <Zap className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <span>Skills Marketplace</span>
          </button>
          <button
            type="button"
            onClick={onCreateNew}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-violet-700 min-h-[42px]"
          >
            <Plus className="h-4 w-4" />
            <span>Criar Pulgi</span>
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar Pulgi por nome, papel ou interesse..."
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none min-h-[44px]"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Nenhum Pulgi encontrado para essa busca.
          </p>
          <button
            type="button"
            onClick={onCreateNew}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" />
            <span>Criar um Novo Pulgi</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((pulgi) => {
            const installedNames = (pulgi.installedSkillIds || [])
              .map((sid) => skills.find((s) => s.id === sid)?.name)
              .filter(Boolean);

            return (
              <article
                key={pulgi.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
              >
                <div>
                  <div className="flex items-start gap-3.5">
                    <PulgiAvatar appearance={pulgi.appearance} name={pulgi.name} size={68} animate />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-base font-bold text-slate-900 dark:text-white">
                        {pulgi.name}
                      </h2>
                      <p className="truncate text-xs font-medium text-violet-600 dark:text-violet-400">
                        {pulgi.role}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Voz: {pulgi.voiceName} · {pulgi.memories.length} memória(s)
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
                    {pulgi.personality}
                  </p>

                  <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400">
                    {pulgi.interests.join(' · ')}
                  </p>

                  {installedNames.length > 0 && (
                    <p className="mt-2 text-xs text-sky-700 dark:text-sky-300">
                      Skills: {installedNames.join(' · ')}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onStartChat(pulgi.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700 min-h-[40px]"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>Conversar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(pulgi)}
                    aria-label={`Editar ${pulgi.name}`}
                    title="Editar"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDuplicate(pulgi)}
                    aria-label={`Duplicar ${pulgi.name}`}
                    title="Duplicar"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  {confirmDeleteId === pulgi.id ? (
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(pulgi.id);
                        setConfirmDeleteId(null);
                      }}
                      className="inline-flex h-10 items-center rounded-xl bg-rose-600 px-2.5 text-xs font-semibold text-white hover:bg-rose-700"
                    >
                      Confirmar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(pulgi.id)}
                      aria-label={`Excluir ${pulgi.name}`}
                      title="Excluir"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

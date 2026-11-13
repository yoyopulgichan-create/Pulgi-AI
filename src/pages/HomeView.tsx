import React, { useState } from 'react';
import {
  ArrowRight,
  FolderKanban,
  Layers,
  MessageCircle,
  Mic,
  Plus,
  Sparkles,
  Users,
  Wand2,
} from 'lucide-react';
import { PageId, ProjectItem, Pulgi, StudioTab } from '../types/pulgi';
import { PulgiAvatar } from '../components/PulgiAvatar';
import { startVoiceCapture } from '../utils/voiceEngine';

interface HomeViewProps {
  pulgis: Pulgi[];
  projects: ProjectItem[];
  onNavigate: (page: PageId) => void;
  onStartChat: (pulgiId: string) => void;
  onQuickWorkspace: (prompt: string) => void;
  onOpenStudioTab: (tab: StudioTab) => void;
  language: string;
}

export const HomeView: React.FC<HomeViewProps> = ({
  pulgis,
  projects,
  onNavigate,
  onStartChat,
  onQuickWorkspace,
  onOpenStudioTab,
  language,
}) => {
  const [quickPrompt, setQuickPrompt] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const handleSubmitQuick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPrompt.trim()) return;
    onQuickWorkspace(quickPrompt.trim());
  };

  const handleVoicePrompt = () => {
    setVoiceError(null);
    setIsListening(true);
    startVoiceCapture({
      language,
      onInterim: (txt) => setQuickPrompt(txt),
      onFinal: (txt) => {
        setQuickPrompt(txt);
        setIsListening(false);
      },
      onError: (msg) => {
        setVoiceError(msg);
        setIsListening(false);
      },
      onStateChange: (st) => {
        if (st === 'idle') setIsListening(false);
      },
    });
  };

  const studioShortcuts: { tab: StudioTab; title: string; subtitle: string }[] = [
    { tab: 'website', title: 'Website Maker', subtitle: 'HTML, CSS, JS e ZIP ao vivo' },
    { tab: 'game', title: 'Game Maker', subtitle: 'Jogos 2D jogáveis no navegador' },
    { tab: 'music', title: 'Music Maker', subtitle: 'Sintetizador, letras e WAV' },
    { tab: 'video', title: 'Video Maker', subtitle: 'Roteiro, cenas e narração' },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Command Deck inspired by CUE by Manus AI */}
      <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-8 shadow-sm overflow-hidden">
        <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
          <div className="min-w-0">
            <p className="text-xs font-medium text-violet-600 dark:text-violet-400">
              PULGI AI · Infinite Friends. Infinite Ideas. Infinite Creations.
            </p>
            <h1 className="mt-2 text-2xl sm:text-4xl font-bold leading-[1.15] tracking-tight text-slate-900 dark:text-white [text-wrap:balance]">
              Seus pequenos amigos de IA prontos para conversar e criar juntos
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
              Crie quantos Pulgis quiser sem limites ou moedas. Converse por texto ou voz, forme grupinhos colaborativos e produza websites, jogos, músicas, vídeos e arquivos reais.
            </p>

            <form onSubmit={handleSubmitQuick} className="mt-5 min-w-0">
              <label htmlFor="home-quick-prompt" className="sr-only">
                Descreva uma tarefa para seus Pulgis
              </label>
              <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                <div className="relative flex-1 min-w-0">
                  <input
                    id="home-quick-prompt"
                    type="text"
                    value={quickPrompt}
                    onChange={(e) => setQuickPrompt(e.target.value)}
                    placeholder="Ex: Quero criar um website de animais ou um jogo 2D espacial..."
                    className="w-full min-w-0 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-4 py-3 pr-12 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-violet-500 focus:outline-none min-h-[46px]"
                  />
                  <button
                    type="button"
                    onClick={handleVoicePrompt}
                    aria-label="Ditar tarefa por voz"
                    title="Falar comando"
                    className={`absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-xl transition ${
                      isListening
                        ? 'bg-rose-500 text-white'
                        : 'text-slate-500 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 whitespace-nowrap shrink-0 min-h-[46px]"
                >
                  <Wand2 className="h-4 w-4" />
                  <span>Enviar aos Pulgis</span>
                </button>
              </div>
              {voiceError && (
                <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{voiceError}</p>
              )}
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onNavigate('create')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 min-h-[40px]"
              >
                <Plus className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                <span>Criar Novo Pulgi</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('groups')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 min-h-[40px]"
              >
                <Users className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                <span>Abrir Grupinhos</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('explore')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 min-h-[40px]"
              >
                <Sparkles className="h-3.5 w-3.5 text-pink-500" />
                <span>Explorar & Skills</span>
              </button>
            </div>
          </div>

          {/* Pulgi Trio Showcase */}
          <div className="min-w-0 flex items-center justify-center rounded-2xl border border-slate-100 dark:border-slate-800 bg-gradient-to-br from-violet-50 via-sky-50 to-pink-50 dark:from-violet-950/30 dark:via-slate-900 dark:to-sky-950/30 p-3 sm:p-6">
            <div className="flex items-end justify-center gap-1.5 sm:gap-3">
              {pulgis.slice(0, 3).map((p, idx) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onStartChat(p.id)}
                  title={`Conversar com ${p.name}`}
                  className={`group flex flex-col items-center rounded-2xl p-1.5 sm:p-2 transition hover:bg-white/70 dark:hover:bg-slate-800/70 ${
                    idx === 1 ? '-translate-y-1 sm:-translate-y-2' : ''
                  }`}
                >
                  <PulgiAvatar appearance={p.appearance} name={p.name} size={idx === 1 ? 68 : 56} animate />
                  <span className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-violet-600 dark:group-hover:text-violet-400">
                    {p.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* My Pulgis Quick Roster */}
      <section>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Meus Pulgis ({pulgis.length})
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Toque em qualquer personagem para iniciar uma conversa por texto ou voz
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('my-pulgis')}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline whitespace-nowrap shrink-0"
          >
            <span>Ver todos</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pulgis.slice(0, 6).map((pulgi) => (
            <div
              key={pulgi.id}
              className="flex items-center gap-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition hover:border-violet-300 dark:hover:border-violet-700"
            >
              <PulgiAvatar appearance={pulgi.appearance} name={pulgi.name} size={60} />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                  {pulgi.name}
                </h3>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {pulgi.role}
                </p>
                <p className="mt-1 line-clamp-1 text-xs text-slate-600 dark:text-slate-300">
                  {pulgi.interests.slice(0, 3).join(' · ')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onStartChat(pulgi.id)}
                aria-label={`Conversar com ${pulgi.name}`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/60 shrink-0"
              >
                <MessageCircle className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Pulgi Studio + Recent Projects */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Pulgi Studio
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('studio')}
              className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
            >
              Abrir estúdio
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {studioShortcuts.map((item) => (
              <button
                key={item.tab}
                type="button"
                onClick={() => onOpenStudioTab(item.tab)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3.5 text-left transition hover:border-violet-300 dark:hover:border-violet-700"
              >
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  {item.title}
                </div>
                <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {item.subtitle}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Projetos Recentes ({projects.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('projects')}
              className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
            >
              Ver projetos
            </button>
          </div>

          {projects.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Nenhum projeto criado ainda. Use o Workspace acima para começar.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {projects.slice(0, 3).map((proj) => (
                <button
                  key={proj.id}
                  type="button"
                  onClick={() => onNavigate('projects')}
                  className="flex w-full items-center justify-between gap-3 py-3 text-left hover:opacity-80"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {proj.name}
                    </div>
                    <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {proj.category} · {proj.fileIds.length} arquivo(s)
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

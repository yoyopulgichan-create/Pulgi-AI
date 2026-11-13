import React, { useEffect, useState } from 'react';
import { Download, Moon, RotateCcw, Sun, Upload } from 'lucide-react';
import { AIProviderMode, AppSettings } from '../types/pulgi';
import { AIStatusResponse, fetchAiStatus } from '../services/aiClient';
import { PWAInstallButton } from '../components/PWAInstallBanner';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (next: AppSettings) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onResetAll: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onExportBackup,
  onImportBackup,
  onResetAll,
}) => {
  const [aiStatus, setAiStatus] = useState<AIStatusResponse | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    fetchAiStatus().then(setAiStatus);
  }, []);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Configurações
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Privacidade local em primeiro lugar: sem login obrigatório, sem moedas e sem limites.
        </p>
      </div>

      {/* Appearance & Language */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Aparência & Idioma
        </h2>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Tema da Interface
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Alterne entre modo claro suave e modo escuro confortável.
            </div>
          </div>
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                settings.theme === 'light'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <Sun className="h-3.5 w-3.5" />
              <span>Claro</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                settings.theme === 'dark'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <Moon className="h-3.5 w-3.5" />
              <span>Escuro</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label htmlFor="settings-lang" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Idioma de Conversa & Voz
            </label>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Os Pulgis oferecem suporte multilíngue automático ou idioma fixo.
            </div>
          </div>
          <select
            id="settings-lang"
            value={settings.language}
            onChange={(e) =>
              onUpdateSettings({
                ...settings,
                language: e.target.value as AppSettings['language'],
              })
            }
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white min-h-[40px]"
          >
            <option value="pt-BR">Português (Brasil)</option>
            <option value="en-US">English</option>
            <option value="es-ES">Español</option>
            <option value="auto">Multilíngue Automático</option>
          </select>
        </div>
      </section>

      {/* Modular AI Provider */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Arquitetura Modular de IA
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {aiStatus?.cloudAvailable
                ? `Pulgi Cloud conectado (${aiStatus.textModel} + voz ${aiStatus.ttsModel})`
                : 'Pulgi Cloud sem conexão no momento — use modelos locais ou ferramentas offline.'}
            </p>
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-3">
          {(
            [
              {
                id: 'cloud',
                title: 'Pulgi Cloud',
                desc: 'Usa o servidor conectado com plano gratuito e voz.',
              },
              {
                id: 'local-ollama',
                title: 'Modelo Local (Ollama)',
                desc: 'Conecta a modelos open-source rodando na sua máquina.',
              },
              {
                id: 'offline',
                title: 'Somente Offline',
                desc: 'Desativa chamadas externas; mantém editores e jogos.',
              },
            ] as { id: AIProviderMode; title: string; desc: string }[]
          ).map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => onUpdateSettings({ ...settings, providerMode: mode.id })}
              className={`rounded-xl border p-3.5 text-left transition ${
                settings.providerMode === mode.id
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/50 text-violet-900 dark:text-violet-100'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="text-xs font-bold">{mode.title}</div>
              <div className="mt-1 text-[11px] opacity-80">{mode.desc}</div>
            </button>
          ))}
        </div>

        {settings.providerMode === 'local-ollama' && (
          <div className="grid gap-3 sm:grid-cols-2 pt-2">
            <div>
              <label htmlFor="ollama-url" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Endpoint Local (Ollama / LM Studio)
              </label>
              <input
                id="ollama-url"
                type="url"
                value={settings.localEndpoint}
                onChange={(e) => onUpdateSettings({ ...settings, localEndpoint: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="ollama-model" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome do Modelo Open-Source
              </label>
              <input
                id="ollama-model"
                type="text"
                value={settings.localModelName}
                onChange={(e) => onUpdateSettings({ ...settings, localModelName: e.target.value })}
                placeholder="llama3.2, qwen2.5, mistral..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Falar Respostas Automaticamente
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Reproduz a voz sintetizada do Pulgi sempre que ele responder.
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.autoSpeakReplies}
            onClick={() =>
              onUpdateSettings({ ...settings, autoSpeakReplies: !settings.autoSpeakReplies })
            }
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
              settings.autoSpeakReplies ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                settings.autoSpeakReplies ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </section>

      {/* PWA & Local Data Backup */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              App Instalável (PWA) & Dados Locais
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Seus Pulgis, conversas, skills e arquivos ficam guardados localmente no IndexedDB.
            </p>
          </div>
          <PWAInstallButton />
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            onClick={onExportBackup}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[42px]"
          >
            <Download className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <span>Exportar Backup (.JSON)</span>
          </button>

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[42px]">
            <Upload className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <span>Importar Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImportBackup(file);
              }}
              className="sr-only"
            />
          </label>

          {confirmReset ? (
            <button
              type="button"
              onClick={() => {
                onResetAll();
                setConfirmReset(false);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-rose-700 min-h-[42px]"
            >
              Confirmar Restauração
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900 px-3.5 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 min-h-[42px]"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Restaurar Padrões</span>
            </button>
          )}
        </div>
      </section>
    </div>
  );
};

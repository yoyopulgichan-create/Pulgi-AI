import React, { useState } from 'react';
import { Download, Smartphone, WifiOff } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-violet-700 whitespace-nowrap shrink-0 min-h-[40px]"
      >
        <Download className="h-4 w-4" />
        <span>{compact ? 'Instalar' : 'Instalar App (PWA)'}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap shrink-0 min-h-[40px]"
        >
          <Smartphone className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          <span>Adicionar ao iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-xl">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Instalar PULGI AI no iPhone
              </h3>
              <ol className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li>1. Toque no botão <strong>Compartilhar</strong> na barra do Safari.</li>
                <li>2. Role para baixo e toque em <strong>Adicionar à Tela de Início</strong>.</li>
                <li>3. Abra o ícone do PULGI AI para usar em tela cheia e offline.</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 min-h-[44px]"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="mb-3 flex items-center gap-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 px-3.5 py-2 text-xs text-amber-900 dark:text-amber-200"
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>
        Modo Offline — Seus Pulgis, conversas, projetos e editores locais continuam disponíveis. Geração por IA na nuvem requer internet ou modelo local.
      </span>
    </div>
  );
};

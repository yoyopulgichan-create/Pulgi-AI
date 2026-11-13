import React, { useRef, useState } from 'react';
import { Mic, Square, Volume2, VolumeX } from 'lucide-react';
import { startVoiceCapture, stopPulgiSpeech, VoiceListenerHandle } from '../utils/voiceEngine';

interface VoiceControlsProps {
  language?: string;
  autoSpeak: boolean;
  onToggleAutoSpeak: () => void;
  isSpeaking: boolean;
  onStopSpeaking: () => void;
  onTranscriptFinal: (text: string) => void;
  onInterimText?: (text: string) => void;
  onError: (msg: string) => void;
  disabled?: boolean;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  language = 'auto',
  autoSpeak,
  onToggleAutoSpeak,
  isSpeaking,
  onStopSpeaking,
  onTranscriptFinal,
  onInterimText,
  onError,
  disabled = false,
}) => {
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'transcribing'>('idle');
  const handleRef = useRef<VoiceListenerHandle | null>(null);

  const toggleMic = () => {
    if (voiceState === 'listening') {
      handleRef.current?.stop();
      handleRef.current = null;
      return;
    }
    if (isSpeaking) {
      stopPulgiSpeech();
      onStopSpeaking();
    }
    handleRef.current = startVoiceCapture({
      language,
      onInterim: (txt) => onInterimText?.(txt),
      onFinal: (txt) => {
        onInterimText?.('');
        onTranscriptFinal(txt);
      },
      onError: (msg) => {
        onInterimText?.('');
        onError(msg);
      },
      onStateChange: (st) => setVoiceState(st),
    });
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={toggleMic}
        disabled={disabled || voiceState === 'transcribing'}
        aria-label={voiceState === 'listening' ? 'Parar gravação de voz' : 'Falar com o Pulgi por voz'}
        title={voiceState === 'listening' ? 'Parar microfone' : 'Falar por voz'}
        className={`inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl border transition shrink-0 ${
          voiceState === 'listening'
            ? 'border-rose-400 bg-rose-500 text-white shadow-sm'
            : voiceState === 'transcribing'
            ? 'border-violet-300 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
        }`}
      >
        {voiceState === 'listening' ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </button>

      <button
        type="button"
        onClick={() => {
          if (isSpeaking) {
            stopPulgiSpeech();
            onStopSpeaking();
          } else {
            onToggleAutoSpeak();
          }
        }}
        aria-label={isSpeaking ? 'Parar voz do Pulgi' : autoSpeak ? 'Desativar resposta por voz automática' : 'Ativar resposta por voz automática'}
        title={isSpeaking ? 'Parar fala' : autoSpeak ? 'Voz automática ligada' : 'Ligar voz automática'}
        className={`inline-flex h-10 sm:h-11 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-medium transition shrink-0 whitespace-nowrap ${
          isSpeaking
            ? 'border-cyan-400 bg-cyan-500 text-white'
            : autoSpeak
            ? 'border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
        }`}
      >
        {isSpeaking ? (
          <>
            <VolumeX className="h-4 w-4" />
            <span className="hidden sm:inline">Parar Voz</span>
          </>
        ) : (
          <>
            <Volume2 className="h-4 w-4" />
            <span className="hidden sm:inline">{autoSpeak ? 'Voz Auto' : 'Voz'}</span>
          </>
        )}
      </button>
    </div>
  );
};

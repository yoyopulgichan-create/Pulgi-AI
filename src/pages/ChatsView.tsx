import React, { useEffect, useRef, useState } from 'react';
import { Brain, Loader2, Send, Volume2 } from 'lucide-react';
import { AppSettings, ChatMessage, ChatThread, Pulgi, PulgiSkill } from '../types/pulgi';
import { PulgiAvatar } from '../components/PulgiAvatar';
import { VoiceControls } from '../components/VoiceControls';
import { sendPulgiChat } from '../services/aiClient';
import { speakWithPulgiVoice, stopPulgiSpeech } from '../utils/voiceEngine';
import { analyzeMessageEmotion, EMOTION_PROFILES } from '../utils/emotionTracker';

interface ChatsViewProps {
  pulgis: Pulgi[];
  skills: PulgiSkill[];
  chats: ChatThread[];
  activePulgiId: string | null;
  settings: AppSettings;
  onSelectPulgi: (pulgiId: string) => void;
  onSaveChat: (thread: ChatThread) => void;
  onUpdatePulgi: (pulgi: Pulgi) => void;
  onToggleAutoSpeak: () => void;
}

export const ChatsView: React.FC<ChatsViewProps> = ({
  pulgis,
  skills,
  chats,
  activePulgiId,
  settings,
  onSelectPulgi,
  onSaveChat,
  onUpdatePulgi,
  onToggleAutoSpeak,
}) => {
  const selectedPulgi = pulgis.find((p) => p.id === activePulgiId) || pulgis[0] || null;
  const currentThread = selectedPulgi
    ? chats.find((c) => c.pulgiId === selectedPulgi.id) || {
        id: `chat-${selectedPulgi.id}`,
        pulgiId: selectedPulgi.id,
        messages: [],
        updatedAt: Date.now(),
      }
    : null;

  const [input, setInput] = useState('');
  const [interimVoice, setInterimVoice] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  const [newMem, setNewMem] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentThread?.messages.length, loading]);

  if (!selectedPulgi || !currentThread) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Crie seu primeiro Pulgi para iniciar uma conversa.
        </p>
      </div>
    );
  }

  const installedSkills = skills.filter((s) =>
    (selectedPulgi.installedSkillIds || []).includes(s.id)
  );

  const lastPulgiMsg = [...currentThread.messages]
    .reverse()
    .find((m) => m.role === 'pulgi');
  const currentEmotion = lastPulgiMsg
    ? lastPulgiMsg.emotion || analyzeMessageEmotion(lastPulgiMsg.content)
    : 'neutral';
  const currentEmotionProfile = EMOTION_PROFILES[currentEmotion];

  const sendMessage = async (textToSend: string, fromVoice = false) => {
    const clean = textToSend.trim();
    if (!clean || loading) return;
    setErrorMsg(null);
    setInput('');
    setInterimVoice('');

    const userMsg: ChatMessage = {
      id: `m-${Date.now()}-u`,
      role: 'user',
      senderId: 'user',
      senderName: 'Você',
      content: clean,
      timestamp: Date.now(),
      isVoice: fromVoice,
    };

    const updatedMessages = [...currentThread.messages, userMsg];
    const updatedThread: ChatThread = {
      ...currentThread,
      messages: updatedMessages,
      updatedAt: Date.now(),
    };
    onSaveChat(updatedThread);
    setLoading(true);

    try {
      const replyText = await sendPulgiChat(
        selectedPulgi,
        updatedMessages,
        clean,
        settings,
        installedSkills
      );

      const pulgiMsg: ChatMessage = {
        id: `m-${Date.now()}-p`,
        role: 'pulgi',
        senderId: selectedPulgi.id,
        senderName: selectedPulgi.name,
        content: replyText,
        emotion: analyzeMessageEmotion(replyText),
        timestamp: Date.now(),
      };

      onSaveChat({
        ...updatedThread,
        messages: [...updatedMessages, pulgiMsg],
        updatedAt: Date.now(),
      });

      if (settings.autoSpeakReplies || fromVoice) {
        await speakWithPulgiVoice(replyText, selectedPulgi, {
          preferCloud: settings.providerMode === 'cloud',
          language: settings.language,
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
        });
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao conversar com o Pulgi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSpeakMessage = (text: string) => {
    if (isSpeaking) {
      stopPulgiSpeech();
      setIsSpeaking(false);
      return;
    }
    speakWithPulgiVoice(text, selectedPulgi, {
      preferCloud: settings.providerMode === 'cloud',
      language: settings.language,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  };

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMem.trim()) return;
    onUpdatePulgi({
      ...selectedPulgi,
      memories: [...selectedPulgi.memories, newMem.trim()],
      updatedAt: Date.now(),
    });
    setNewMem('');
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr] h-[calc(100dvh-165px)] lg:h-[calc(100dvh-110px)] min-h-[460px]">
      {/* Pulgi Selector List */}
      <aside className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 shrink-0">
        {pulgis.map((p) => {
          const active = p.id === selectedPulgi.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                stopPulgiSpeech();
                setIsSpeaking(false);
                onSelectPulgi(p.id);
              }}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-left transition shrink-0 lg:w-full ${
                active
                  ? 'bg-violet-50 dark:bg-violet-950/60 text-violet-900 dark:text-violet-100 border border-violet-200 dark:border-violet-800'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <PulgiAvatar appearance={p.appearance} name={p.name} size={38} />
              <div className="min-w-0">
                <div className="truncate text-xs font-bold">{p.name}</div>
                <div className="hidden lg:block truncate text-[11px] text-slate-500 dark:text-slate-400">
                  {p.role}
                </div>
              </div>
            </button>
          );
        })}
      </aside>

      {/* Conversation Stage */}
      <section className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <PulgiAvatar
              appearance={selectedPulgi.appearance}
              name={selectedPulgi.name}
              size={44}
              speaking={isSpeaking}
              animate={isSpeaking}
              emotion={currentEmotion}
            />
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-slate-900 dark:text-white">
                {selectedPulgi.name}
              </h1>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {selectedPulgi.role} · Voz {selectedPulgi.voiceName} · Humor: {currentEmotionProfile.label}
                {installedSkills.length > 0 ? ` · ${installedSkills.length} skill(s)` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowMemoryPanel((v) => !v)}
            aria-expanded={showMemoryPanel}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0"
          >
            <Brain className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <span className="hidden sm:inline">Memória ({selectedPulgi.memories.length})</span>
          </button>
        </div>

        {/* Collapsible Memory Drawer */}
        {showMemoryPanel && (
          <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3.5 space-y-2">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Memória contextual de {selectedPulgi.name}
            </div>
            <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
              {selectedPulgi.memories.length === 0 ? (
                <li>Nenhuma memória adicionada ainda.</li>
              ) : (
                selectedPulgi.memories.map((m, i) => <li key={i}>• {m}</li>)
              )}
            </ul>
            <form onSubmit={handleAddMemory} className="flex gap-2">
              <input
                type="text"
                value={newMem}
                onChange={(e) => setNewMem(e.target.value)}
                placeholder="Adicionar fato para este Pulgi lembrar..."
                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
              >
                Salvar
              </button>
            </form>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {currentThread.messages.length === 0 && (
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4 text-sm text-slate-600 dark:text-slate-300">
              Oi! Eu sou <strong>{selectedPulgi.name}</strong>. Você pode digitar abaixo ou tocar no microfone para conversar comigo por voz!
            </div>
          )}

          {currentThread.messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <PulgiAvatar
                    appearance={selectedPulgi.appearance}
                    name={selectedPulgi.name}
                    size={34}
                    emotion={msg.emotion || analyzeMessageEmotion(msg.content)}
                  />
                )}
                <div
                  className={`max-w-[82%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                    isUser
                      ? 'bg-violet-600 text-white rounded-br-sm'
                      : 'border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-sm'
                  }`}
                >
                  <div>{msg.content}</div>
                  {!isUser && (
                    <div className="mt-1.5 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleSpeakMessage(msg.content)}
                        aria-label={`Ouvir mensagem de ${selectedPulgi.name}`}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-violet-600 dark:text-violet-400 hover:underline"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                        <span>Ouvir</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
              <span>{selectedPulgi.name} está pensando...</span>
            </div>
          )}

          {errorMsg && (
            <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300">
              {errorMsg}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input + Voice Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input, false);
          }}
          className="border-t border-slate-100 dark:border-slate-800 p-3 space-y-1.5"
        >
          {interimVoice && (
            <div className="text-xs text-violet-600 dark:text-violet-400 px-1">
              Ouvindo: "{interimVoice}"
            </div>
          )}
          <div className="flex items-center gap-2">
            <VoiceControls
              language={settings.language}
              autoSpeak={settings.autoSpeakReplies}
              onToggleAutoSpeak={onToggleAutoSpeak}
              isSpeaking={isSpeaking}
              onStopSpeaking={() => setIsSpeaking(false)}
              onInterimText={setInterimVoice}
              onTranscriptFinal={(txt) => sendMessage(txt, true)}
              onError={(msg) => setErrorMsg(msg)}
              disabled={loading}
            />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Falar ou escrever para ${selectedPulgi.name}...`}
              className="flex-1 min-w-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none min-h-[42px]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Enviar mensagem"
              className="inline-flex h-10 sm:h-11 items-center justify-center rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

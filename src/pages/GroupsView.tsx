import React, { useState } from 'react';
import { Loader2, Plus, Send, UserPlus, Users, Volume2 } from 'lucide-react';
import { AppSettings, ChatMessage, Pulgi, PulgiGroup, StudioFile } from '../types/pulgi';
import { PulgiAvatar } from '../components/PulgiAvatar';
import { VoiceControls } from '../components/VoiceControls';
import { sendGroupChat } from '../services/aiClient';
import { parseMentions } from '../utils/pulgiLogic';
import { speakWithPulgiVoice } from '../utils/voiceEngine';
import { analyzeMessageEmotion, EMOTION_PROFILES } from '../utils/emotionTracker';

interface GroupsViewProps {
  pulgis: Pulgi[];
  groups: PulgiGroup[];
  settings: AppSettings;
  onSaveGroup: (group: PulgiGroup) => void;
  onSaveDeliverableFile: (file: StudioFile) => void;
  onToggleAutoSpeak: () => void;
}

export const GroupsView: React.FC<GroupsViewProps> = ({
  pulgis,
  groups,
  settings,
  onSaveGroup,
  onSaveDeliverableFile,
  onToggleAutoSpeak,
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.id || '');
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupMembers, setNewGroupMembers] = useState<string[]>(pulgis.slice(0, 3).map((p) => p.id));

  const [showInvite, setShowInvite] = useState(false);
  const [input, setInput] = useState('');
  const [interimVoice, setInterimVoice] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const activeGroup = groups.find((g) => g.id === selectedGroupId) || groups[0] || null;
  const members = activeGroup
    ? pulgis.filter((p) => activeGroup.memberIds.includes(p.id))
    : [];

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || newGroupMembers.length === 0) return;
    const now = Date.now();
    const created: PulgiGroup = {
      id: `group-${now}`,
      name: newGroupName.trim(),
      description: newGroupDesc.trim() || 'Grupinho colaborativo de Pulgis',
      memberIds: newGroupMembers,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    onSaveGroup(created);
    setSelectedGroupId(created.id);
    setNewGroupName('');
    setNewGroupDesc('');
    setShowNewGroup(false);
  };

  const toggleGroupMember = (pulgiId: string) => {
    if (!activeGroup) return;
    const exists = activeGroup.memberIds.includes(pulgiId);
    const updatedIds = exists
      ? activeGroup.memberIds.filter((id) => id !== pulgiId)
      : [...activeGroup.memberIds, pulgiId];
    if (updatedIds.length === 0) return;
    onSaveGroup({
      ...activeGroup,
      memberIds: updatedIds,
      updatedAt: Date.now(),
    });
  };

  const sendMessage = async (textToSend: string, fromVoice = false) => {
    if (!activeGroup || !textToSend.trim() || loading) return;
    setErrorMsg(null);
    const clean = textToSend.trim();
    setInput('');
    setInterimVoice('');

    const mentioned = parseMentions(clean, members);
    const prioritizedMembers =
      mentioned.length > 0
        ? [
            ...members.filter((m) => mentioned.includes(m.id)),
            ...members.filter((m) => !mentioned.includes(m.id)),
          ]
        : members;

    const userMsg: ChatMessage = {
      id: `gm-${Date.now()}-u`,
      role: 'user',
      senderId: 'user',
      senderName: 'Você',
      content: clean,
      timestamp: Date.now(),
      isVoice: fromVoice,
    };

    const nextMessages = [...activeGroup.messages, userMsg];
    const updatedGroup: PulgiGroup = {
      ...activeGroup,
      messages: nextMessages,
      updatedAt: Date.now(),
    };
    onSaveGroup(updatedGroup);
    setLoading(true);

    try {
      const result = await sendGroupChat(
        updatedGroup,
        prioritizedMembers,
        nextMessages,
        clean,
        settings
      );

      const replyMsgs: ChatMessage[] = (result.messages || []).map((m, idx) => ({
        id: `gm-${Date.now()}-${idx}`,
        role: 'pulgi',
        senderId: m.pulgiId,
        senderName: m.pulgiName,
        content: m.content,
        emotion: analyzeMessageEmotion(m.content),
        timestamp: Date.now() + idx,
      }));

      if (result.deliverableContent && result.deliverableTitle) {
        const fmt = (result.deliverableType || 'md').toLowerCase().replace(/[^a-z0-9]/g, '') || 'md';
        onSaveDeliverableFile({
          id: `file-grp-${Date.now()}`,
          name: `${result.deliverableTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.${fmt}`,
          format: fmt,
          content: result.deliverableContent,
          createdByPulgiId: replyMsgs[0]?.senderId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        replyMsgs.push({
          id: `gm-${Date.now()}-sys`,
          role: 'system',
          senderId: 'system',
          senderName: 'Pulgi Studio',
          content: `Artefato colaborativo salvo em Arquivos: ${result.deliverableTitle} (.${fmt})`,
          timestamp: Date.now() + 99,
        });
      }

      onSaveGroup({
        ...updatedGroup,
        messages: [...nextMessages, ...replyMsgs],
        updatedAt: Date.now(),
      });

      if ((settings.autoSpeakReplies || fromVoice) && replyMsgs[0]) {
        const speaker = members.find((m) => m.id === replyMsgs[0].senderId) || members[0];
        if (speaker) {
          await speakWithPulgiVoice(replyMsgs[0].content, speaker, {
            preferCloud: settings.providerMode === 'cloud',
            language: settings.language,
            onStart: () => setIsSpeaking(true),
            onEnd: () => setIsSpeaking(false),
          });
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro na conversa do grupo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Grupinhos Inteligentes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Reúna vários Pulgis, mencione com @nome e veja eles colaborando entre si.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNewGroup((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-violet-700 min-h-[42px] self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Grupinho</span>
        </button>
      </div>

      {showNewGroup && (
        <form
          onSubmit={handleCreateGroup}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Nome do grupinho (ex: Squad de Jogos)"
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
            />
            <input
              type="text"
              value={newGroupDesc}
              onChange={(e) => setNewGroupDesc(e.target.value)}
              placeholder="Objetivo do grupo..."
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Escolha os Pulgis participantes:
            </span>
            <div className="flex flex-wrap gap-2">
              {pulgis.map((p) => {
                const picked = newGroupMembers.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      setNewGroupMembers((prev) =>
                        picked ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                      )
                    }
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium ${
                      picked
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowNewGroup(false)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700"
            >
              Criar Grupo
            </button>
          </div>
        </form>
      )}

      {activeGroup && (
        <div className="grid gap-4 lg:grid-cols-[250px_1fr] h-[calc(100dvh-230px)] lg:h-[calc(100dvh-180px)] min-h-[450px]">
          {/* Groups list */}
          <aside className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 shrink-0">
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGroupId(g.id)}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left shrink-0 lg:w-full ${
                  g.id === activeGroup.id
                    ? 'bg-violet-50 dark:bg-violet-950/60 text-violet-900 dark:text-violet-100 border border-violet-200 dark:border-violet-800'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Users className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" />
                <div className="min-w-0">
                  <div className="truncate text-xs font-bold">{g.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {g.memberIds.length} Pulgis
                  </div>
                </div>
              </button>
            ))}
          </aside>

          {/* Group Chat Box */}
          <section className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden min-w-0">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-4 py-3">
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-slate-900 dark:text-white">
                  {activeGroup.name}
                </h2>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {members.map((m) => `@${m.name}`).join(' · ')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInvite((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0"
              >
                <UserPlus className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                <span>Convidar</span>
              </button>
            </div>

            {showInvite && (
              <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3 flex flex-wrap gap-2">
                {pulgis.map((p) => {
                  const inGroup = activeGroup.memberIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleGroupMember(p.id)}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-medium ${
                        inGroup
                          ? 'border-violet-500 bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-200'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {inGroup ? `✓ ${p.name}` : `+ Convidar ${p.name}`}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeGroup.messages.map((msg) => {
                if (msg.role === 'system') {
                  return (
                    <div
                      key={msg.id}
                      className="rounded-xl bg-sky-50 dark:bg-sky-950/40 px-3.5 py-2 text-xs font-medium text-sky-800 dark:text-sky-200 text-center"
                    >
                      {msg.content}
                    </div>
                  );
                }
                const isUser = msg.role === 'user';
                const senderPulgi = pulgis.find((p) => p.id === msg.senderId);
                const msgEmotion = !isUser
                  ? msg.emotion || analyzeMessageEmotion(msg.content)
                  : 'neutral';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && senderPulgi && (
                      <PulgiAvatar
                        appearance={senderPulgi.appearance}
                        name={senderPulgi.name}
                        size={36}
                        emotion={msgEmotion}
                      />
                    )}
                    <div
                      className={`max-w-[82%] sm:max-w-[72%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                        isUser
                          ? 'bg-violet-600 text-white rounded-br-sm'
                          : 'border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-sm'
                      }`}
                    >
                      {!isUser && (
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                              {msg.senderName}
                            </span>
                            <span className="truncate text-[11px] text-slate-400 dark:text-slate-500">
                              · {EMOTION_PROFILES[msgEmotion].label}
                            </span>
                          </div>
                          {senderPulgi && (
                            <button
                              type="button"
                              onClick={() =>
                                speakWithPulgiVoice(msg.content, senderPulgi, {
                                  preferCloud: settings.providerMode === 'cloud',
                                  language: settings.language,
                                  onStart: () => setIsSpeaking(true),
                                  onEnd: () => setIsSpeaking(false),
                                })
                              }
                              aria-label={`Ouvir ${msg.senderName}`}
                              className="text-slate-400 hover:text-violet-600"
                            >
                              <Volume2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                      <div>{msg.content}</div>
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                  <span>Os Pulgis estão colaborando entre si...</span>
                </div>
              )}

              {errorMsg && (
                <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300">
                  {errorMsg}
                </div>
              )}
            </div>

            {/* Quick @mention insert + Voice + Input */}
            <div className="border-t border-slate-100 dark:border-slate-800 p-3 space-y-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setInput((prev) => `${prev ? prev + ' ' : ''}@${m.name} `)}
                    className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-violet-100 dark:hover:bg-violet-900/50 whitespace-nowrap shrink-0"
                  >
                    @{m.name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setInput('Criem um jogo divertido juntos!')}
                  className="rounded-lg bg-violet-50 dark:bg-violet-950/60 px-2.5 py-1 text-xs font-medium text-violet-700 dark:text-violet-300 whitespace-nowrap shrink-0"
                >
                  Exemplo: Criem um jogo!
                </button>
              </div>
              {interimVoice && (
                <div className="text-xs text-violet-600 dark:text-violet-400">
                  Ouvindo: "{interimVoice}"
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(input, false);
                }}
                className="flex items-center gap-2"
              >
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
                  placeholder="Peça algo ao grupo ou use @nome..."
                  className="flex-1 min-w-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none min-h-[42px]"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  aria-label="Enviar para o grupo"
                  className="inline-flex h-10 sm:h-11 items-center justify-center rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 shrink-0"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

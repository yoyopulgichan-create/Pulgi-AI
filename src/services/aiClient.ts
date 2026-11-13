import { AppSettings, ChatMessage, Pulgi, PulgiGroup, PulgiSkill } from '../types/pulgi';

export interface AIStatusResponse {
  cloudAvailable: boolean;
  textModel: string;
  ttsModel: string;
  transcribeModel: string;
}

export async function fetchAiStatus(): Promise<AIStatusResponse> {
  try {
    const resp = await fetch('/api/ai/status');
    if (!resp.ok) throw new Error('status error');
    return await resp.json();
  } catch {
    return {
      cloudAvailable: false,
      textModel: 'gemini-4-hydrogen',
      ttsModel: 'gemini-3.8-flash-lite-tts',
      transcribeModel: 'gemini-3.5-transcribe',
    };
  }
}

async function callLocalOllama(
  settings: AppSettings,
  systemInstruction: string,
  userPrompt: string
): Promise<string> {
  const endpoint = settings.localEndpoint.replace(/\/$/, '');
  const resp = await fetch(`${endpoint}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: settings.localModelName || 'llama3.2',
      stream: false,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  if (!resp.ok) {
    throw new Error(`Modelo local (${endpoint}) respondeu com erro ${resp.status}. Verifique se o Ollama está rodando com OLLAMA_ORIGINS="*".`);
  }
  const data = await resp.json();
  return data.message?.content || data.response || '';
}

export async function sendPulgiChat(
  pulgi: Pulgi,
  history: ChatMessage[],
  message: string,
  settings: AppSettings,
  installedSkills: PulgiSkill[] = []
): Promise<string> {
  if (settings.providerMode === 'offline') {
    throw new Error(
      'Modo Somente Offline ativo. Para conversar com IA, mude para Pulgi Cloud ou conecte um modelo local (Ollama) em Settings.'
    );
  }

  if (settings.providerMode === 'local-ollama') {
    const skillsTxt = installedSkills.map((s) => `${s.name}: ${s.promptDirective}`).join(' | ');
    const sys = `Você é ${pulgi.name} (${pulgi.role}). Personalidade: ${pulgi.personality}. Interesses: ${pulgi.interests.join(', ')}. Memórias: ${pulgi.memories.join(' | ')}. Skills: ${skillsTxt}`;
    return callLocalOllama(settings, sys, message);
  }

  if (!navigator.onLine) {
    throw new Error(
      'Você está sem internet. Você pode visualizar seus Pulgis, editar projetos e usar ferramentas locais do Studio, ou ativar um modelo local (Ollama) em Settings.'
    );
  }

  const resp = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pulgi,
      installedSkills,
      history: history.map((h) => ({ role: h.role, content: h.content })),
      message,
      language: settings.language,
    }),
  });
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data.error || 'Erro ao conversar com o Pulgi.');
  }
  return data.reply;
}

export interface GroupChatResult {
  messages: { pulgiId: string; pulgiName: string; content: string }[];
  deliverableTitle?: string;
  deliverableType?: string;
  deliverableContent?: string;
}

export async function sendGroupChat(
  group: PulgiGroup,
  members: Pulgi[],
  history: ChatMessage[],
  message: string,
  settings: AppSettings
): Promise<GroupChatResult> {
  if (settings.providerMode === 'offline') {
    throw new Error('Modo Somente Offline ativo. Conecte Pulgi Cloud ou modelo local em Settings para conversar no grupo.');
  }

  if (settings.providerMode === 'local-ollama') {
    const outputs: { pulgiId: string; pulgiName: string; content: string }[] = [];
    for (const member of members.slice(0, 3)) {
      const reply = await callLocalOllama(
        settings,
        `Você é ${member.name} (${member.role}) no grupo "${group.name}". Personalidade: ${member.personality}. Responda de forma curta colaborando com os colegas: ${outputs.map((o) => `${o.pulgiName}: ${o.content}`).join(' | ')}`,
        message
      );
      outputs.push({ pulgiId: member.id, pulgiName: member.name, content: reply });
    }
    return { messages: outputs };
  }

  if (!navigator.onLine) {
    throw new Error('Sem conexão com a internet para o grupo consultar o modelo na nuvem.');
  }

  const resp = await fetch('/api/ai/group-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      group,
      members,
      history: history.map((h) => ({ senderName: h.senderName, content: h.content })),
      message,
    }),
  });
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data.error || 'Erro no chat coletivo.');
  }
  return data;
}

export async function generateStudioContent<T = Record<string, unknown>>(
  mode: 'website' | 'game' | 'video' | 'image-svg' | 'music' | 'file' | 'code',
  prompt: string,
  pulgiName: string,
  settings: AppSettings,
  extra: Record<string, unknown> = {}
): Promise<T> {
  if (settings.providerMode === 'offline') {
    throw new Error('Geração por IA desativada no modo Somente Offline. Os editores manuais e reprodutores continuam funcionando normalmente.');
  }
  if (!navigator.onLine && settings.providerMode === 'cloud') {
    throw new Error('Sem conexão com a internet. Você ainda pode editar, testar e exportar seus arquivos localmente.');
  }

  const resp = await fetch('/api/ai/studio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, prompt, pulgiName, extra }),
  });
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data.error || 'Não foi possível gerar o conteúdo no Studio.');
  }
  return data as T;
}

export interface WorkspaceRunResult {
  projectName: string;
  description: string;
  category: string;
  selectedPulgiIds: string[];
  steps: { title: string; pulgiId: string; pulgiName: string; summary: string }[];
  files: { name: string; format: string; content: string }[];
}

export async function runWorkspaceTask(
  prompt: string,
  pulgis: Pulgi[],
  settings: AppSettings,
  previousFiles: { name: string; format: string; content: string }[] = [],
  revisionNote?: string
): Promise<WorkspaceRunResult> {
  if (settings.providerMode === 'offline') {
    throw new Error('Modo Somente Offline ativo. Conecte Pulgi Cloud em Settings para executar agentes no Workspace.');
  }
  if (!navigator.onLine && settings.providerMode === 'cloud') {
    throw new Error('Você está offline. Reconecte-se para que os Pulgis gerem novos projetos no Workspace.');
  }

  const resp = await fetch('/api/ai/workspace', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, pulgis, previousFiles, revisionNote }),
  });
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data.error || 'Falha ao executar tarefa no Workspace.');
  }
  return data;
}

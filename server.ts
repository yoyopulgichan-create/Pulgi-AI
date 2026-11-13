import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getFriendlyAiError(err: unknown): { status: number; message: string; code: string } {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('API_KEY_INVALID') || msg.includes('PERMISSION_DENIED') || msg.includes('403')) {
    return {
      status: 403,
      code: 'API_KEY_ERROR',
      message: 'A conexão com a API Gemini precisa de uma chave válida configurada em Settings > Secrets.',
    };
  }
  if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
    return {
      status: 429,
      code: 'QUOTA_EXHAUSTED',
      message: 'Limite de uso atingido no momento. Tente novamente em instantes ou use um modelo local em Settings.',
    };
  }
  return {
    status: 500,
    code: 'AI_ERROR',
    message: msg || 'Erro inesperado ao consultar o modelo de IA.',
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '20mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'pulgi-ai' });
  });

  app.get('/api/ai/status', (_req, res) => {
    const ai = getAiClient();
    res.json({
      cloudAvailable: Boolean(ai),
      textModel: 'gemini-4-hydrogen',
      ttsModel: 'gemini-3.8-flash-lite-tts',
      transcribeModel: 'gemini-3.5-transcribe',
    });
  });

  // 1-on-1 Pulgi chat
  app.post('/api/ai/chat', async (req, res) => {
    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Nenhum modelo cloud conectado no servidor. Configure a chave no ambiente ou conecte um modelo local (Ollama/LM Studio) em Settings.',
        code: 'NO_MODEL_CONNECTED',
      });
    }

    try {
      const { pulgi, installedSkills = [], history = [], message, language = 'auto' } = req.body;
      if (!pulgi || !message) {
        return res.status(400).json({ error: 'Pulgi e mensagem são obrigatórios.' });
      }

      const memoryBlock = Array.isArray(pulgi.memories) && pulgi.memories.length > 0
        ? pulgi.memories.map((m: string) => `- ${m}`).join('\n')
        : 'Nenhuma memória específica ainda.';

      const skillsBlock = Array.isArray(installedSkills) && installedSkills.length > 0
        ? installedSkills
            .map((s: { name: string; promptDirective: string }) => `- ${s.name}: ${s.promptDirective}`)
            .join('\n')
        : 'Nenhuma skill extra instalada.';

      const historyText = Array.isArray(history)
        ? history
            .slice(-14)
            .map((h: { role: string; content: string }) => `${h.role === 'user' ? 'Usuário' : pulgi.name}: ${h.content}`)
            .join('\n')
        : '';

      const langDirective =
        language === 'auto'
          ? 'Responda no mesmo idioma que o usuário usou na última mensagem.'
          : `Responda preferencialmente no idioma: ${language}.`;

      const systemInstruction = `Você é ${pulgi.name}, uma criatura virtual inteligente e amigável chamada Pulgi no universo PULGI AI.
Identidade:
- Nome: ${pulgi.name}
- Especialidade / Papel: ${pulgi.role}
- Personalidade: ${pulgi.personality}
- Interesses e preferências: ${(pulgi.interests || []).join(', ')}
- Memórias individuais:
${memoryBlock}
- Skills instaladas e ativas:
${skillsBlock}

Regras:
1. Reconheça sempre sua identidade como ${pulgi.name}, mantendo seu jeito único, gentil, criativo e útil.
2. Nunca finja ter executado ações impossíveis; se criar código, texto, ideias ou planos, entregue conteúdo real e bem estruturado.
3. ${langDirective}
4. Seja conciso em respostas de conversa normal (2 a 5 frases) a menos que o usuário peça algo detalhado (como código, história, roteiro ou plano).`;

      const prompt = historyText
        ? `Histórico recente:\n${historyText}\n\nNova mensagem do Usuário: ${message}`
        : message;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction,
        },
      });

      const reply = (response.text ?? '').trim();
      res.json({ reply, model: 'gemini-4-hydrogen' });
    } catch (err) {
      const parsed = getFriendlyAiError(err);
      res.status(parsed.status).json({ error: parsed.message, code: parsed.code });
    }
  });

  // Group chat with multiple Pulgis collaborating and replying to each other
  app.post('/api/ai/group-chat', async (req, res) => {
    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Nenhum modelo cloud conectado no servidor. Conecte um modelo local em Settings ou configure o ambiente.',
        code: 'NO_MODEL_CONNECTED',
      });
    }

    try {
      const { group, members = [], history = [], message } = req.body;
      if (!group || !Array.isArray(members) || members.length === 0 || !message) {
        return res.status(400).json({ error: 'Grupo, membros e mensagem são obrigatórios.' });
      }

      const roster = members
        .map(
          (m: { id: string; name: string; role: string; personality: string; interests?: string[] }) =>
            `- ID: "${m.id}" | Nome: ${m.name} | Especialidade: ${m.role} | Personalidade: ${m.personality} | Interesses: ${(m.interests || []).join(', ')}`
        )
        .join('\n');

      const recentHistory = Array.isArray(history)
        ? history
            .slice(-12)
            .map((h: { senderName: string; content: string }) => `${h.senderName}: ${h.content}`)
            .join('\n')
        : '';

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Grupo: "${group.name}" — ${group.description || 'Colaboração criativa'}
Membros Pulgis disponíveis:
${roster}

Histórico recente:
${recentHistory || '(Início da conversa)'}

Mensagem atual do Usuário: "${message}"

Instruções:
- Se o usuário mencionar @nome, priorize esse(s) Pulgi(s), mas outros membros também podem interagir e responder uns aos outros de forma natural!
- Gere de 2 a ${Math.min(4, members.length)} falas em sequência onde os Pulgis respondem ao usuário E reagem entre si (mencionando os colegas pelo nome, dividindo tarefas ou complementando ideias).
- Se o usuário pedir uma criação colaborativa concreta (ex: "Criem um jogo", "Façam um site", "Escrevam um plano"), cada Pulgi assume uma parte e o último resume ou entrega um artefato concreto no campo optional deliverable (se aplicável).
- Responda no mesmo idioma do usuário.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              messages: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    pulgiId: { type: Type.STRING },
                    pulgiName: { type: Type.STRING },
                    content: { type: Type.STRING },
                  },
                  required: ['pulgiId', 'pulgiName', 'content'],
                },
              },
              deliverableTitle: { type: Type.STRING },
              deliverableType: { type: Type.STRING },
              deliverableContent: { type: Type.STRING },
            },
            required: ['messages'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{"messages":[]}').trim());
      res.json(parsed);
    } catch (err) {
      const parsed = getFriendlyAiError(err);
      res.status(parsed.status).json({ error: parsed.message, code: parsed.code });
    }
  });

  // Pulgi Studio structured generator
  app.post('/api/ai/studio', async (req, res) => {
    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Nenhum modelo cloud conectado para geração por IA. Você pode continuar editando manualmente ou configurar um modelo local em Settings.',
        code: 'NO_MODEL_CONNECTED',
      });
    }

    try {
      const { mode, prompt, pulgiName = 'Pulgi Studio', extra = {} } = req.body;
      if (!mode || !prompt) {
        return res.status(400).json({ error: 'Modo e prompt são obrigatórios.' });
      }

      if (mode === 'website') {
        const resp = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `Você é ${pulgiName}, especialista em Web Design. Crie um website completo, moderno, responsivo e interativo para o pedido: "${prompt}". Tipo/estilo: ${extra.template || 'landing page'}.
Entregue HTML limpo (conteúdo do body + links/estrutura), CSS completo e JavaScript interativo funcional (sem frameworks externos que quebrem offline, use CSS puro moderno + JS vanilla).`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                html: { type: Type.STRING },
                css: { type: Type.STRING },
                js: { type: Type.STRING },
              },
              required: ['title', 'summary', 'html', 'css', 'js'],
            },
          },
        });
        return res.json(JSON.parse((resp.text ?? '{}').trim()));
      }

      if (mode === 'game') {
        const resp = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `Você é ${pulgiName}, game developer. Crie um jogo 2D completo, divertido e 100% jogável em um único documento HTML5 autossuficiente (HTML + CSS + Canvas/DOM JS), com controles por teclado E botões de toque para iPhone/celular, pontuação, reiniciar jogo e visual caprichado.
Pedido do usuário: "${prompt}". Gênero: ${extra.genre || 'arcade'}.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                genre: { type: Type.STRING },
                instructions: { type: Type.STRING },
                summary: { type: Type.STRING },
                html: { type: Type.STRING },
              },
              required: ['title', 'genre', 'instructions', 'summary', 'html'],
            },
          },
        });
        return res.json(JSON.parse((resp.text ?? '{}').trim()));
      }

      if (mode === 'video') {
        const resp = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `Você é uma equipe de Pulgis produtores de vídeo (${pulgiName}). Crie um roteiro e storyboard de vídeo curto com 4 a 5 cenas para: "${prompt}".
Para cada cena forneça título, narração, legenda curta, duração em segundos (3 a 6) e um SVG ilustrativo válido (<svg viewBox="0 0 640 360" ...>...</svg>) colorido e expressivo para renderizar a cena.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                soundtrackMood: { type: Type.STRING },
                scenes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      narration: { type: Type.STRING },
                      subtitle: { type: Type.STRING },
                      durationSec: { type: Type.NUMBER },
                      svgVisual: { type: Type.STRING },
                    },
                    required: ['title', 'narration', 'subtitle', 'durationSec', 'svgVisual'],
                  },
                },
              },
              required: ['title', 'soundtrackMood', 'scenes'],
            },
          },
        });
        return res.json(JSON.parse((resp.text ?? '{}').trim()));
      }

      if (mode === 'image-svg') {
        const resp = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `Você é ${pulgiName}, artista vetorial. Crie uma arte digital SVG rica, detalhada, com gradientes, camadas e excelente composição (<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">...</svg>) para: "${prompt}". Estilo: ${extra.style || 'ilustração moderna'}.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                svgCode: { type: Type.STRING },
              },
              required: ['title', 'description', 'svgCode'],
            },
          },
        });
        return res.json(JSON.parse((resp.text ?? '{}').trim()));
      }

      if (mode === 'music') {
        const resp = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `Você é ${pulgiName}, compositor musical. Componha uma música original para: "${prompt}". Estilo: ${extra.genre || 'eletrônica suave'}.
Retorne título, BPM (70-150), tonalidade, letra original (ou descrição instrumental se for trilha sem voz), e uma sequência de 16 a 32 notas musicais reais usando nomes como "C4", "D4", "E4", "G4", "A4", "C5", etc., com startBeat (0 a 15.5 em passos de 0.5) e durationBeats (0.5, 1, 2) e track ("melody" | "bass" | "pad").`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                bpm: { type: Type.NUMBER },
                genre: { type: Type.STRING },
                key: { type: Type.STRING },
                lyrics: { type: Type.STRING },
                notes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      note: { type: Type.STRING },
                      startBeat: { type: Type.NUMBER },
                      durationBeats: { type: Type.NUMBER },
                      track: { type: Type.STRING },
                    },
                    required: ['note', 'startBeat', 'durationBeats', 'track'],
                  },
                },
              },
              required: ['title', 'bpm', 'genre', 'key', 'lyrics', 'notes'],
            },
          },
        });
        return res.json(JSON.parse((resp.text ?? '{}').trim()));
      }

      if (mode === 'file') {
        const format = String(extra.format || 'md').toLowerCase();
        const resp = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `Você é ${pulgiName}. Gere o conteúdo completo e útil de um arquivo no formato .${format} sobre: "${prompt}".
Para CSV, retorne linhas válidas separadas por vírgula com cabeçalho. Para JSON, retorne JSON válido formatado. Para HTML/CSS/JS/PY/MD/TXT, retorne conteúdo pronto para uso. Para PDF/DOCX/XLSX/PPTX, retorne texto bem estruturado com títulos e seções (para XLSX, formato tabular CSV com cabeçalho).`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                filename: { type: Type.STRING },
                content: { type: Type.STRING },
                summary: { type: Type.STRING },
              },
              required: ['filename', 'content', 'summary'],
            },
          },
        });
        return res.json(JSON.parse((resp.text ?? '{}').trim()));
      }

      if (mode === 'code') {
        const language = String(extra.language || 'javascript');
        const resp = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `Você é ${pulgiName}, engenheiro de software. Escreva código limpo, bem comentado e funcional em ${language} para: "${prompt}".`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                filename: { type: Type.STRING },
                code: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
              required: ['filename', 'code', 'explanation'],
            },
          },
        });
        return res.json(JSON.parse((resp.text ?? '{}').trim()));
      }

      return res.status(400).json({ error: `Modo desconhecido: ${mode}` });
    } catch (err) {
      const parsed = getFriendlyAiError(err);
      res.status(parsed.status).json({ error: parsed.message, code: parsed.code });
    }
  });

  // Workspace multi-agent orchestration
  app.post('/api/ai/workspace', async (req, res) => {
    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Nenhum modelo cloud conectado no servidor. Verifique a conexão ou configure um modelo local em Settings.',
        code: 'NO_MODEL_CONNECTED',
      });
    }

    try {
      const { prompt, pulgis = [], previousFiles = [], revisionNote } = req.body;
      if (!prompt || !Array.isArray(pulgis) || pulgis.length === 0) {
        return res.status(400).json({ error: 'Pedido e lista de Pulgis são obrigatórios.' });
      }

      const teamDesc = pulgis
        .map((p: { id: string; name: string; role: string; personality: string }) => `- ${p.id}: ${p.name} (${p.role}) — ${p.personality}`)
        .join('\n');

      const contextRevision = revisionNote
        ? `\nAlteração solicitada pelo usuário sobre a versão anterior: "${revisionNote}"\nArquivos atuais:\n${JSON.stringify(previousFiles).slice(0, 8000)}`
        : '';

      const resp = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Você é o coordenador do Pulgi Workspace. O usuário pediu: "${prompt}".${contextRevision}
Equipe de Pulgis disponível:
${teamDesc}

Execute o fluxo completo:
1. Defina um nome claro para o projeto e uma descrição curta.
2. Escolha 2 a 4 Pulgis da lista acima para colaborar.
3. Crie 3 a 4 etapas reais executadas pelos Pulgis, descrevendo o que cada Pulgi fez em sua fala colaborativa.
4. Entregue arquivos digitais reais e funcionais! Se for um website, jogo ou app web, inclua obrigatoriamente um "index.html" autossuficiente e completo (ou index.html + styles.css + script.js que o preview possa montar) com visual bonito, responsivo e funcional. Se for documentos/código, entregue os arquivos adequados.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              projectName: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING },
              selectedPulgiIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              steps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    pulgiId: { type: Type.STRING },
                    pulgiName: { type: Type.STRING },
                    summary: { type: Type.STRING },
                  },
                  required: ['title', 'pulgiId', 'pulgiName', 'summary'],
                },
              },
              files: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    format: { type: Type.STRING },
                    content: { type: Type.STRING },
                  },
                  required: ['name', 'format', 'content'],
                },
              },
            },
            required: ['projectName', 'description', 'category', 'selectedPulgiIds', 'steps', 'files'],
          },
        },
      });

      const parsed = JSON.parse((resp.text ?? '{}').trim());
      res.json(parsed);
    } catch (err) {
      const parsed = getFriendlyAiError(err);
      res.status(parsed.status).json({ error: parsed.message, code: parsed.code });
    }
  });

  // Server-side Text-to-Speech using gemini-3.8-flash-lite-tts
  app.post('/api/ai/tts', async (req, res) => {
    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'TTS cloud indisponível sem chave de API.',
        code: 'NO_MODEL_CONNECTED',
      });
    }

    try {
      const { text, voiceName = 'Kore', style = 'Friendly, warm, expressive virtual companion' } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Texto é obrigatório para síntese de voz.' });
      }

      const validVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
      const chosenVoice = validVoices.includes(voiceName) ? voiceName : 'Kore';

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: text.slice(0, 1200),
                speechMetadata: {
                  style,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: chosenVoice },
            },
          },
        },
      });

      const part = response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
      const base64Audio = part?.inlineData?.data;
      const mimeType = part?.inlineData?.mimeType || 'audio/wav';

      if (!base64Audio) {
        return res.status(502).json({ error: 'Modelo TTS não retornou áudio.' });
      }

      res.json({ audioBase64: base64Audio, mimeType });
    } catch (err) {
      const parsed = getFriendlyAiError(err);
      res.status(parsed.status).json({ error: parsed.message, code: parsed.code });
    }
  });

  // Server-side Speech-to-Text using gemini-3.5-transcribe
  app.post('/api/ai/transcribe', async (req, res) => {
    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Transcrição cloud indisponível sem chave de API.',
        code: 'NO_MODEL_CONNECTED',
      });
    }

    try {
      const { audioBase64, mimeType = 'audio/webm' } = req.body;
      if (!audioBase64) {
        return res.status(400).json({ error: 'Áudio em base64 é obrigatório.' });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: audioBase64,
              },
            },
            {
              text: 'Transcribe the spoken audio accurately in its original language. Return only the transcription text without commentary.',
            },
          ],
        },
      });

      res.json({ text: (response.text ?? '').trim() });
    } catch (err) {
      const parsed = getFriendlyAiError(err);
      res.status(parsed.status).json({ error: parsed.message, code: parsed.code });
    }
  });

  // Vite dev middleware or production static files
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PULGI AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start PULGI AI server:', err);
  process.exit(1);
});

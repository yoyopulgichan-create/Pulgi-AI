import {
  ExpressionStyle,
  HairStyle,
  Pulgi,
  VoiceName,
} from '../types/pulgi';

export const HAIR_STYLES: { id: HairStyle; label: string }[] = [
  { id: 'flared', label: 'Topete Clássico' },
  { id: 'shaggy-long', label: 'Longo Repicado' },
  { id: 'wild-shag', label: 'Selvagem Cacheado' },
  { id: 'flipped-bob', label: 'Channel Pontas' },
  { id: 'bowl-cut', label: 'Tigelinha Liso' },
  { id: 'retro-waves', label: 'Ondas Retrô' },
  { id: 'monroe-curls', label: 'Cachos Monroe' },
  { id: 'curly-bangs', label: 'Cachos c/ Franja' },
  { id: 'sprout', label: 'Brotinho' },
  { id: 'twin-buns', label: 'Coques Duplos' },
  { id: 'curl', label: 'Cachinho' },
  { id: 'spiky', label: 'Espetado' },
  { id: 'crown', label: 'Coroinha' },
  { id: 'halo', label: 'Auréola' },
];

export const HAIR_COLORS = [
  { label: 'Loiro Mel', hex: '#FDE68A' },
  { label: 'Preto Noite', hex: '#1F2937' },
  { label: 'Castanho Café', hex: '#4A2C2A' },
  { label: 'Platina Neve', hex: '#F1F5F9' },
  { label: 'Lavanda Suave', hex: '#C4B5FD' },
  { label: 'Rosa Pastel', hex: '#F9A8D4' },
  { label: 'Azul Céu', hex: '#7DD3FC' },
];

export const EXPRESSIONS: { id: ExpressionStyle; label: string }[] = [
  { id: 'happy', label: 'Alegre' },
  { id: 'curious', label: 'Curioso' },
  { id: 'focused', label: 'Focado' },
  { id: 'excited', label: 'Empolgado' },
  { id: 'creative', label: 'Criativo' },
  { id: 'wink', label: 'Piscando' },
  { id: 'proud', label: 'Orgulhoso' },
  { id: 'sleepy', label: 'Sonolento' },
];

export const BODY_PALETTE = [
  { label: 'Nuvem Branca', body: '#FFFFFF', accent: '#E0E7FF', outline: '#312E81' },
  { label: 'Azul Céu', body: '#E0F2FE', accent: '#7DD3FC', outline: '#1E3A8A' },
  { label: 'Lavanda Suave', body: '#EDE9FE', accent: '#C4B5FD', outline: '#3B0764' },
  { label: 'Rosa Pastel', body: '#FCE7F3', accent: '#F9A8D4', outline: '#831843' },
  { label: 'Ciano Brisa', body: '#CFFAFE', accent: '#67E8F9', outline: '#164E63' },
  { label: 'Lilás Névoa', body: '#F3E8FF', accent: '#D8B4FE', outline: '#4C1D95' },
];

export const EYE_COLORS = [
  { label: 'Índigo Profundo', hex: '#1E1B4B' },
  { label: 'Azul Safira', hex: '#2563EB' },
  { label: 'Violeta Mágico', hex: '#7C3AED' },
  { label: 'Ciano Oceano', hex: '#0891B2' },
  { label: 'Rosa Quartzo', hex: '#DB2777' },
  { label: 'Esmeralda', hex: '#059669' },
  { label: 'Âmbar Dourado', hex: '#D97706' },
];

export const VOICE_OPTIONS: { id: VoiceName; label: string; tone: string }[] = [
  { id: 'Puck', label: 'Puck', tone: 'Leve, brincalhão e ágil' },
  { id: 'Kore', label: 'Kore', tone: 'Calorosa, clara e acolhedora' },
  { id: 'Zephyr', label: 'Zephyr', tone: 'Suave, calma e poética' },
  { id: 'Fenrir', label: 'Fenrir', tone: 'Firme, confiante e energética' },
  { id: 'Charon', label: 'Charon', tone: 'Profunda, analítica e serena' },
];

const RANDOM_NAMES = [
  'Bubu', 'Milo', 'Tori', 'Zuzu', 'Kiki', 'Nori', 'Pipa', 'Yumi', 'Belo', 'Duda', 'Fofo', 'Vivi',
];

const RANDOM_ROLES = [
  'Arquiteta de Interfaces',
  'Designer de Jogos',
  'Produtor Musical',
  'Contador de Histórias',
  'Cientista Curioso',
  'Ilustradora Digital',
  'Programador Full-Stack',
  'Organizador de Tarefas',
];

const RANDOM_PERSONALITIES = [
  'Otimista, adora transformar ideias bagunçadas em protótipos simples e bonitos.',
  'Curioso e observador, faz perguntas inteligentes e propõe soluções criativas.',
  'Brincalhão e energético, celebra cada pequena conquista da equipe.',
  'Calmo e detalhista, gosta de organização, código limpo e harmonia visual.',
];

const RANDOM_INTERESTS = [
  'Web design', 'Jogos 2D', 'Música eletrônica', 'Ilustração', 'Python', 'Roteiros', 'Animação', 'Matemática divertida',
];

export function generateRandomPulgiDraft(seedOffset = Math.floor(Math.random() * 1000)): Omit<Pulgi, 'id' | 'createdAt' | 'updatedAt'> {
  const palette = BODY_PALETTE[seedOffset % BODY_PALETTE.length];
  const hair = HAIR_STYLES[(seedOffset * 3) % HAIR_STYLES.length].id;
  const hairColor = HAIR_COLORS[(seedOffset * 4) % HAIR_COLORS.length].hex;
  const expr = EXPRESSIONS[(seedOffset * 5) % EXPRESSIONS.length].id;
  const eye = EYE_COLORS[(seedOffset * 7) % EYE_COLORS.length].hex;
  const voice = VOICE_OPTIONS[(seedOffset * 2) % VOICE_OPTIONS.length];
  const name = RANDOM_NAMES[seedOffset % RANDOM_NAMES.length];
  const role = RANDOM_ROLES[(seedOffset * 3) % RANDOM_ROLES.length];
  const personality = RANDOM_PERSONALITIES[seedOffset % RANDOM_PERSONALITIES.length];

  const pickedInterests = [
    RANDOM_INTERESTS[seedOffset % RANDOM_INTERESTS.length],
    RANDOM_INTERESTS[(seedOffset + 2) % RANDOM_INTERESTS.length],
    RANDOM_INTERESTS[(seedOffset + 5) % RANDOM_INTERESTS.length],
  ];

  return {
    name,
    role,
    personality,
    interests: Array.from(new Set(pickedInterests)),
    memories: [`Nasceu pronto para colaborar em projetos criativos como ${role}.`],
    voiceName: voice.id,
    voiceStyle: voice.tone,
    appearance: {
      hairStyle: hair,
      hairColor,
      eyeColor: eye,
      bodyColor: palette.body,
      accentColor: palette.accent,
      outlineColor: palette.outline,
      expression: expr,
    },
  };
}

export function validatePulgiDraft(draft: {
  name?: string;
  role?: string;
  personality?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!draft.name || draft.name.trim().length < 2) {
    errors.push('Dê um nome com pelo menos 2 caracteres para o seu Pulgi.');
  }
  if (!draft.role || draft.role.trim().length < 2) {
    errors.push('Informe a especialidade ou papel do Pulgi.');
  }
  if (!draft.personality || draft.personality.trim().length < 6) {
    errors.push('Descreva a personalidade do Pulgi (mínimo 6 caracteres).');
  }
  return { valid: errors.length === 0, errors };
}

export function parseMentions(text: string, pulgis: Pick<Pulgi, 'id' | 'name'>[]): Pulgi['id'][] {
  const matches = text.match(/@([\p{L}\p{N}_-]+)/gu) || [];
  const lowerNames = matches.map((m) => m.slice(1).toLowerCase());
  const matchedIds: string[] = [];
  for (const p of pulgis) {
    if (lowerNames.includes(p.name.toLowerCase())) {
      matchedIds.push(p.id);
    }
  }
  return matchedIds;
}

export function selectPulgisForTask(prompt: string, pulgis: Pulgi[], maxCount = 3): Pulgi[] {
  if (pulgis.length <= maxCount) return pulgis;
  const q = prompt.toLowerCase();
  const scored = pulgis.map((p) => {
    let score = 0;
    const text = `${p.name} ${p.role} ${p.personality} ${p.interests.join(' ')}`.toLowerCase();
    const keywords = q.split(/\s+/).filter((w) => w.length > 2);
    for (const kw of keywords) {
      if (text.includes(kw)) score += 3;
    }
    if ((q.includes('site') || q.includes('web') || q.includes('página')) && text.includes('web')) score += 5;
    if ((q.includes('jogo') || q.includes('game')) && (text.includes('jogo') || text.includes('game'))) score += 5;
    if ((q.includes('músic') || q.includes('som') || q.includes('trilha')) && text.includes('músic')) score += 5;
    if ((q.includes('vídeo') || q.includes('roteiro')) && (text.includes('vídeo') || text.includes('roteiro'))) score += 5;
    if ((q.includes('imagem') || q.includes('arte') || q.includes('logo')) && (text.includes('arte') || text.includes('ilustr'))) score += 5;
    return { p, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxCount).map((s) => s.p);
}

const NOTE_SEMITONES: Record<string, number> = {
  C: 0,
  'C#': 1,
  DB: 1,
  D: 2,
  'D#': 3,
  EB: 3,
  E: 4,
  F: 5,
  'F#': 6,
  GB: 6,
  G: 7,
  'G#': 8,
  AB: 8,
  A: 9,
  'A#': 10,
  BB: 10,
  B: 11,
};

export function noteNameToMidi(noteName: string): number {
  const match = noteName.trim().toUpperCase().match(/^([A-G][#B]?)(-?\d)$/);
  if (!match) return 60; // Middle C fallback
  const [, pitch, octaveStr] = match;
  const semitone = NOTE_SEMITONES[pitch] ?? 0;
  const octave = Number(octaveStr);
  return (octave + 1) * 12 + semitone;
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function encodeWavFromFloat32(samples: Float32Array, sampleRate = 44100): Uint8Array {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // Byte rate
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Uint8Array(buffer);
}

export function escapeCsvCell(value: string): string {
  const needsQuote = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
}

export function buildCsvString(rows: string[][]): string {
  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n');
}

export function sanitizeFileName(name: string, ext: string): string {
  const clean = name
    .trim()
    .replace(/[^\p{L}\p{N}._-]+/gu, '_')
    .replace(/^_+|_+$/g, '') || 'pulgi_arquivo';
  const normalizedExt = ext.startsWith('.') ? ext : `.${ext}`;
  return clean.toLowerCase().endsWith(normalizedExt.toLowerCase()) ? clean : `${clean}${normalizedExt}`;
}

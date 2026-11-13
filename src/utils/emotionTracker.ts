import { PulgiEmotion } from '../types/pulgi';

export interface EmotionVisualProfile {
  emotion: PulgiEmotion;
  label: string;
  bodyTint: string;
  glowColor: string;
  cssClass: string;
}

export const EMOTION_PROFILES: Record<PulgiEmotion, EmotionVisualProfile> = {
  neutral: {
    emotion: 'neutral',
    label: 'Equilibrado',
    bodyTint: '',
    glowColor: 'transparent',
    cssClass: '',
  },
  joy: {
    emotion: 'joy',
    label: 'Alegre & Empolgado',
    bodyTint: '#FEF3C7',
    glowColor: 'rgba(251, 191, 36, 0.35)',
    cssClass: 'pulgi-emotion-joy',
  },
  creative: {
    emotion: 'creative',
    label: 'Inspirado & Criativo',
    bodyTint: '#F3E8FF',
    glowColor: 'rgba(168, 85, 247, 0.35)',
    cssClass: 'pulgi-emotion-creative',
  },
  curious: {
    emotion: 'curious',
    label: 'Curioso & Investigativo',
    bodyTint: '#E0F2FE',
    glowColor: 'rgba(56, 189, 248, 0.35)',
    cssClass: 'pulgi-emotion-curious',
  },
  calm: {
    emotion: 'calm',
    label: 'Calmo & Acolhedor',
    bodyTint: '#DCFCE7',
    glowColor: 'rgba(52, 211, 153, 0.3)',
    cssClass: 'pulgi-emotion-calm',
  },
  determined: {
    emotion: 'determined',
    label: 'Focado & Determinado',
    bodyTint: '#E0E7FF',
    glowColor: 'rgba(99, 102, 241, 0.35)',
    cssClass: 'pulgi-emotion-determined',
  },
  concerned: {
    emotion: 'concerned',
    label: 'Empático & Cuidadoso',
    bodyTint: '#FFE4E6',
    glowColor: 'rgba(244, 63, 94, 0.28)',
    cssClass: 'pulgi-emotion-concerned',
  },
};

const KEYWORDS: Record<Exclude<PulgiEmotion, 'neutral'>, string[]> = {
  joy: [
    'feliz', 'alegre', 'incrível', 'ótimo', 'maravilha', 'parabéns', 'adorei', 'amei',
    'legal', 'divertido', 'eba', 'haha', 'happy', 'great', 'awesome', 'love', 'yay', 'excited', 'genial',
  ],
  creative: [
    'criar', 'ideia', 'arte', 'design', 'música', 'desenho', 'imaginar', 'inventar',
    'inspiração', 'estilo', 'cores', 'jogo', 'história', 'create', 'design', 'art', 'music', 'imagine',
  ],
  curious: [
    'como', 'por que', 'será', 'interessante', 'descobrir', 'explorar', 'curioso',
    'dúvida', 'investigar', 'perguntar', 'why', 'how', 'wonder', 'curious', 'explore',
  ],
  calm: [
    'calmo', 'tranquilo', 'paz', 'respirar', 'suave', 'gentil', 'carinho', 'descansar',
    'relaxar', 'bem-vindo', 'olá', 'oi', 'calm', 'peace', 'gentle', 'relax', 'sereno',
  ],
  determined: [
    'vamos', 'focar', 'construir', 'código', 'resolver', 'etapa', 'plano', 'executar',
    'pronto', 'entregar', 'objetivo', 'build', 'focus', 'solve', 'plan', 'code', 'ready',
  ],
  concerned: [
    'desculpe', 'erro', 'problema', 'triste', 'difícil', 'cuidado', 'atenção', 'falha',
    'preocupado', 'offline', 'sem conexão', 'sorry', 'error', 'sad', 'problem', 'issue', 'careful',
  ],
};

export function analyzeMessageEmotion(text: string): PulgiEmotion {
  const clean = text.trim().toLowerCase();
  if (!clean) return 'neutral';

  const scores: Record<Exclude<PulgiEmotion, 'neutral'>, number> = {
    joy: 0,
    creative: 0,
    curious: 0,
    calm: 0,
    determined: 0,
    concerned: 0,
  };

  for (const [emotion, words] of Object.entries(KEYWORDS) as [Exclude<PulgiEmotion, 'neutral'>, string[]][]) {
    for (const w of words) {
      if (clean.includes(w)) {
        scores[emotion] += 2;
      }
    }
  }

  // Punctuation cues
  const exclamations = (clean.match(/!/g) || []).length;
  const questions = (clean.match(/\?/g) || []).length;
  if (exclamations >= 1) scores.joy += 1;
  if (questions >= 1) scores.curious += 2;

  let best: PulgiEmotion = 'neutral';
  let bestScore = 0;
  for (const [emotion, score] of Object.entries(scores) as [Exclude<PulgiEmotion, 'neutral'>, number][]) {
    if (score > bestScore) {
      bestScore = score;
      best = emotion;
    }
  }

  return bestScore > 0 ? best : 'calm';
}

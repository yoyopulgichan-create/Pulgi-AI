export type PageId =
  | 'home'
  | 'my-pulgis'
  | 'create'
  | 'chats'
  | 'groups'
  | 'explore'
  | 'studio'
  | 'projects'
  | 'workspace'
  | 'files'
  | 'settings';

export type StudioTab =
  | 'website'
  | 'game'
  | 'video'
  | 'image'
  | 'music'
  | 'file'
  | 'code';

export type HairStyle =
  | 'flared'
  | 'shaggy-long'
  | 'wild-shag'
  | 'flipped-bob'
  | 'bowl-cut'
  | 'retro-waves'
  | 'monroe-curls'
  | 'curly-bangs'
  | 'sprout'
  | 'twin-buns'
  | 'curl'
  | 'spiky'
  | 'crown'
  | 'halo';

export type PulgiEmotion =
  | 'neutral'
  | 'joy'
  | 'curious'
  | 'calm'
  | 'creative'
  | 'determined'
  | 'concerned';

export type ExpressionStyle =
  | 'happy'
  | 'curious'
  | 'focused'
  | 'excited'
  | 'sleepy'
  | 'wink'
  | 'proud'
  | 'creative';

export type VoiceName = 'Puck' | 'Kore' | 'Zephyr' | 'Fenrir' | 'Charon';

export interface PulgiAppearance {
  hairStyle: HairStyle;
  hairColor?: string;
  eyeColor: string;
  bodyColor: string;
  accentColor: string;
  outlineColor: string;
  expression: ExpressionStyle;
  customAvatarDataUrl?: string;
}

export type SkillCategory =
  | 'Criatividade'
  | 'Código & Dados'
  | 'Idiomas & Estudo'
  | 'Mídia & Áudio'
  | 'Produtividade';

export interface PulgiSkill {
  id: string;
  name: string;
  category: SkillCategory;
  description: string;
  promptDirective: string;
  capabilities: string[];
  author: string;
  isBuiltIn?: boolean;
  createdAt: number;
}

export interface Pulgi {
  id: string;
  name: string;
  role: string;
  personality: string;
  interests: string[];
  memories: string[];
  installedSkillIds?: string[];
  voiceName: VoiceName;
  voiceStyle: string;
  appearance: PulgiAppearance;
  createdAt: number;
  updatedAt: number;
  isFeatured?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'pulgi' | 'system';
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  isVoice?: boolean;
  emotion?: PulgiEmotion;
}

export interface ChatThread {
  id: string;
  pulgiId: string;
  messages: ChatMessage[];
  updatedAt: number;
}

export interface PulgiGroup {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export type ProjectStatus = 'planning' | 'in_progress' | 'completed';

export interface ProjectChangeEntry {
  id: string;
  note: string;
  pulgiNames: string[];
  timestamp: number;
}

export interface StudioFile {
  id: string;
  name: string;
  format: string;
  content: string;
  mimeType?: string;
  binaryBase64?: string;
  projectId?: string;
  createdByPulgiId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  category: string;
  status: ProjectStatus;
  pulgiIds: string[];
  fileIds: string[];
  previewHtml?: string;
  history: ProjectChangeEntry[];
  createdAt: number;
  updatedAt: number;
}

export type AIProviderMode = 'cloud' | 'local-ollama' | 'offline';

export interface AppSettings {
  theme: 'light' | 'dark';
  language: 'pt-BR' | 'en-US' | 'es-ES' | 'auto';
  providerMode: AIProviderMode;
  localEndpoint: string;
  localModelName: string;
  autoSpeakReplies: boolean;
  handsFreeVoice: boolean;
}

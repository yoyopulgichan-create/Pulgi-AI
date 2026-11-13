import React, { useEffect, useState } from 'react';
import { Dices, Plus, Save, Upload, X } from 'lucide-react';
import { Pulgi, PulgiAppearance, PulgiSkill, VoiceName } from '../types/pulgi';
import {
  BODY_PALETTE,
  EXPRESSIONS,
  EYE_COLORS,
  generateRandomPulgiDraft,
  HAIR_COLORS,
  HAIR_STYLES,
  validatePulgiDraft,
  VOICE_OPTIONS,
} from '../utils/pulgiLogic';
import { PulgiAvatar } from '../components/PulgiAvatar';
import { speakWithPulgiVoice } from '../utils/voiceEngine';

interface CreatePulgiViewProps {
  editingPulgi: Pulgi | null;
  skills: PulgiSkill[];
  onSave: (pulgi: Pulgi) => void;
  onCancelEdit: () => void;
}

export const CreatePulgiView: React.FC<CreatePulgiViewProps> = ({
  editingPulgi,
  skills,
  onSave,
  onCancelEdit,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [personality, setPersonality] = useState('');
  const [interestsInput, setInterestsInput] = useState('Criatividade, Conversa, Tecnologia');
  const [memories, setMemories] = useState<string[]>([]);
  const [newMemory, setNewMemory] = useState('');
  const [installedSkillIds, setInstalledSkillIds] = useState<string[]>([]);
  const [voiceName, setVoiceName] = useState<VoiceName>('Kore');
  const [voiceStyle, setVoiceStyle] = useState('Calorosa, clara e acolhedora');
  const [appearance, setAppearance] = useState<PulgiAppearance>({
    hairStyle: 'flared',
    eyeColor: '#1E1B4B',
    bodyColor: '#FFFFFF',
    accentColor: '#E0E7FF',
    outlineColor: '#312E81',
    expression: 'happy',
  });
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (editingPulgi) {
      setName(editingPulgi.name);
      setRole(editingPulgi.role);
      setPersonality(editingPulgi.personality);
      setInterestsInput(editingPulgi.interests.join(', '));
      setMemories(editingPulgi.memories);
      setInstalledSkillIds(editingPulgi.installedSkillIds || []);
      setVoiceName(editingPulgi.voiceName);
      setVoiceStyle(editingPulgi.voiceStyle);
      setAppearance(editingPulgi.appearance);
    } else {
      const draft = generateRandomPulgiDraft();
      setName('');
      setRole('');
      setPersonality('');
      setInterestsInput(draft.interests.join(', '));
      setMemories([]);
      setInstalledSkillIds([]);
      setVoiceName(draft.voiceName);
      setVoiceStyle(draft.voiceStyle);
      setAppearance(draft.appearance);
    }
    setErrors([]);
  }, [editingPulgi]);

  const handleRandomize = () => {
    const draft = generateRandomPulgiDraft(Math.floor(Math.random() * 10000));
    setName(draft.name);
    setRole(draft.role);
    setPersonality(draft.personality);
    setInterestsInput(draft.interests.join(', '));
    setMemories(draft.memories);
    setVoiceName(draft.voiceName);
    setVoiceStyle(draft.voiceStyle);
    setAppearance(draft.appearance);
    setErrors([]);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAppearance((prev) => ({
        ...prev,
        customAvatarDataUrl: String(reader.result || ''),
      }));
    };
    reader.readAsDataURL(file);
  };

  const addMemory = () => {
    if (!newMemory.trim()) return;
    setMemories((prev) => [...prev, newMemory.trim()]);
    setNewMemory('');
  };

  const toggleSkill = (skillId: string) => {
    setInstalledSkillIds((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validatePulgiDraft({ name, role, personality });
    if (!check.valid) {
      setErrors(check.errors);
      return;
    }

    const interests = interestsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const now = Date.now();
    const pulgi: Pulgi = {
      id: editingPulgi?.id || `pulgi-${now}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      role: role.trim(),
      personality: personality.trim(),
      interests: interests.length > 0 ? interests : ['Criatividade'],
      memories,
      installedSkillIds,
      voiceName,
      voiceStyle,
      appearance,
      createdAt: editingPulgi?.createdAt || now,
      updatedAt: now,
    };
    onSave(pulgi);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {editingPulgi ? `Personalizar ${editingPulgi.name}` : 'Pulgi Creator — Criação Infinita'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Crie quantos Pulgis quiser, personalize aparência, voz, memória e skills.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRandomize}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 min-h-[42px]"
          >
            <Dices className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            <span>Gerar Aleatório</span>
          </button>
          {editingPulgi && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 min-h-[42px]"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[0.9fr_1.3fr]">
        {/* Live Preview & Visual Customizer */}
        <section className="space-y-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex flex-col items-center rounded-2xl bg-gradient-to-br from-violet-50 via-sky-50 to-pink-50 dark:from-violet-950/30 dark:via-slate-800 dark:to-sky-950/30 p-6">
            <PulgiAvatar appearance={appearance} name={name || 'Novo Pulgi'} size={140} animate />
            <div className="mt-3 text-center">
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {name || 'Seu Novo Pulgi'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {role || 'Escolha uma especialidade'}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50">
                <Upload className="h-3.5 w-3.5" />
                <span>Enviar Avatar</span>
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="sr-only" />
              </label>
              {appearance.customAvatarDataUrl && (
                <button
                  type="button"
                  onClick={() => setAppearance((p) => ({ ...p, customAvatarDataUrl: undefined }))}
                  className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Usar Pulgi SVG</span>
                </button>
              )}
            </div>
          </div>

          {/* Hair Style */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Estilo de Cabelo / Topete ({HAIR_STYLES.length})
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {HAIR_STYLES.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setAppearance((p) => ({ ...p, hairStyle: h.id, customAvatarDataUrl: undefined }))}
                  className={`rounded-xl border px-2.5 py-2 text-xs font-medium transition min-h-[38px] text-left leading-tight ${
                    appearance.hairStyle === h.id
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hair Color */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Cor do Cabelo
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setAppearance((p) => ({ ...p, hairColor: undefined }))}
                title="Combinar com o corpo"
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                  !appearance.hairColor
                    ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300'
                    : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300'
                }`}
              >
                Combinar
              </button>
              {HAIR_COLORS.map((hc) => (
                <button
                  key={hc.hex}
                  type="button"
                  onClick={() => setAppearance((p) => ({ ...p, hairColor: hc.hex, customAvatarDataUrl: undefined }))}
                  title={hc.label}
                  aria-label={`Cabelo ${hc.label}`}
                  className={`h-8 w-8 rounded-full border-2 transition ${
                    appearance.hairColor === hc.hex
                      ? 'border-violet-600 scale-110'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                  style={{ backgroundColor: hc.hex }}
                />
              ))}
            </div>
          </div>

          {/* Expression */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Expressão Facial
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {EXPRESSIONS.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => setAppearance((p) => ({ ...p, expression: ex.id, customAvatarDataUrl: undefined }))}
                  className={`rounded-xl border px-2 py-2 text-xs font-medium transition min-h-[38px] ${
                    appearance.expression === ex.id
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          {/* Body Palette */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Cores do Pulgi
            </span>
            <div className="flex flex-wrap gap-2">
              {BODY_PALETTE.map((pal) => (
                <button
                  key={pal.label}
                  type="button"
                  onClick={() =>
                    setAppearance((p) => ({
                      ...p,
                      bodyColor: pal.body,
                      accentColor: pal.accent,
                      outlineColor: pal.outline,
                    }))
                  }
                  title={pal.label}
                  aria-label={`Cor ${pal.label}`}
                  className={`h-9 w-9 rounded-full border-2 transition ${
                    appearance.bodyColor === pal.body && appearance.accentColor === pal.accent
                      ? 'border-violet-600 scale-110'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                  style={{ background: `linear-gradient(135deg, ${pal.body} 45%, ${pal.accent} 100%)` }}
                />
              ))}
            </div>
          </div>

          {/* Eye Colors */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Cor dos Olhos
            </span>
            <div className="flex flex-wrap gap-2">
              {EYE_COLORS.map((eye) => (
                <button
                  key={eye.hex}
                  type="button"
                  onClick={() => setAppearance((p) => ({ ...p, eyeColor: eye.hex }))}
                  title={eye.label}
                  aria-label={`Olhos ${eye.label}`}
                  className={`h-8 w-8 rounded-full border-2 transition ${
                    appearance.eyeColor === eye.hex
                      ? 'border-violet-600 scale-110'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                  style={{ backgroundColor: eye.hex }}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Identity, Personality, Voice, Memory & Skills */}
        <section className="space-y-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          {errors.length > 0 && (
            <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300">
              {errors.map((err) => (
                <div key={err}>{err}</div>
              ))}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pulgi-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nome do Pulgi
              </label>
              <input
                id="pulgi-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Bubu"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none min-h-[44px]"
              />
            </div>

            <div>
              <label htmlFor="pulgi-role" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Especialidade / Papel
              </label>
              <input
                id="pulgi-role"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ex: Criador de Jogos & Histórias"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="pulgi-personality" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Personalidade
            </label>
            <textarea
              id="pulgi-personality"
              rows={3}
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="Descreva como este Pulgi pensa, fala e ajuda você..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="pulgi-interests" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Interesses & Preferências (separados por vírgula)
            </label>
            <input
              id="pulgi-interests"
              type="text"
              value={interestsInput}
              onChange={(e) => setInterestsInput(e.target.value)}
              placeholder="Web design, Música eletrônica, Animais"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none min-h-[44px]"
            />
          </div>

          {/* Voice Selection */}
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <label htmlFor="pulgi-voice" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Voz do Pulgi (Conversa por Voz)
              </label>
              <select
                id="pulgi-voice"
                value={voiceName}
                onChange={(e) => {
                  const v = e.target.value as VoiceName;
                  setVoiceName(v);
                  const found = VOICE_OPTIONS.find((o) => o.id === v);
                  if (found) setVoiceStyle(found.tone);
                }}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none min-h-[44px]"
              >
                {VOICE_OPTIONS.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label} — {v.tone}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() =>
                speakWithPulgiVoice(`Oi! Eu sou ${name || 'seu Pulgi'} e estou pronto para criar com você.`, {
                  name: name || 'Pulgi',
                  voiceName,
                  voiceStyle,
                })
              }
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 min-h-[44px]"
            >
              Testar Voz
            </button>
          </div>

          {/* Individual Memories */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Memória Individual
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={newMemory}
                onChange={(e) => setNewMemory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addMemory();
                  }
                }}
                placeholder="Ex: Lembra que eu prefiro sites minimalistas"
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none min-h-[42px]"
              />
              <button
                type="button"
                onClick={addMemory}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 min-h-[42px]"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar</span>
              </button>
            </div>
            {memories.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {memories.map((m, idx) => (
                  <li
                    key={`${m}-${idx}`}
                    className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300"
                  >
                    <span>{m}</span>
                    <button
                      type="button"
                      onClick={() => setMemories((prev) => prev.filter((_, i) => i !== idx))}
                      aria-label="Remover memória"
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Installed Skills */}
          {skills.length > 0 && (
            <div>
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Skills Instaladas ({installedSkillIds.length})
              </span>
              <div className="grid gap-2 sm:grid-cols-2">
                {skills.map((skill) => {
                  const active = installedSkillIds.includes(skill.id);
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => toggleSkill(skill.id)}
                      className={`rounded-xl border p-2.5 text-left text-xs transition ${
                        active
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/50 text-violet-800 dark:text-violet-200'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-semibold">{skill.name}</div>
                      <div className="mt-0.5 opacity-80">{skill.category}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700 min-h-[46px]"
          >
            <Save className="h-4 w-4" />
            <span>{editingPulgi ? 'Salvar Alterações' : 'Criar Pulgi Agora'}</span>
          </button>
        </section>
      </form>
    </div>
  );
};

import React, { useState } from 'react';
import { Check, Download, Plus, Search, Sparkles, Trash2, UserPlus, Zap } from 'lucide-react';
import { Pulgi, PulgiSkill, SkillCategory } from '../types/pulgi';
import { EXPLORE_PULGIS } from '../utils/seedData';
import { PulgiAvatar } from '../components/PulgiAvatar';
import { triggerBlobDownload } from '../utils/fileGenerators';

interface ExploreViewProps {
  pulgis: Pulgi[];
  skills: PulgiSkill[];
  initialSection?: 'characters' | 'skills';
  onAdoptPulgi: (pulgi: Pulgi) => void;
  onToggleSkillForPulgi: (pulgiId: string, skillId: string) => void;
  onSaveSkill: (skill: PulgiSkill) => void;
  onDeleteSkill: (skillId: string) => void;
}

const SKILL_CATEGORIES: ('Todas' | SkillCategory)[] = [
  'Todas',
  'Criatividade',
  'Código & Dados',
  'Idiomas & Estudo',
  'Mídia & Áudio',
  'Produtividade',
];

export const ExploreView: React.FC<ExploreViewProps> = ({
  pulgis,
  skills,
  initialSection = 'characters',
  onAdoptPulgi,
  onToggleSkillForPulgi,
  onSaveSkill,
  onDeleteSkill,
}) => {
  const [section, setSection] = useState<'characters' | 'skills'>(initialSection);
  const [adoptedNames, setAdoptedNames] = useState<string[]>([]);

  // Marketplace state
  const [skillCategory, setSkillCategory] = useState<'Todas' | SkillCategory>('Todas');
  const [skillSearch, setSkillSearch] = useState('');
  const [targetPulgiId, setTargetPulgiId] = useState<string>(pulgis[0]?.id || '');
  const [showBuilder, setShowBuilder] = useState(false);

  // Skill builder form
  const [sName, setSName] = useState('');
  const [sCategory, setSCategory] = useState<SkillCategory>('Criatividade');
  const [sDesc, setSDesc] = useState('');
  const [sDirective, setSDirective] = useState('');
  const [sCaps, setSCaps] = useState('Prompt especializado, Estrutura clara');
  const [sAuthor, setSAuthor] = useState('Você');
  const [builderError, setBuilderError] = useState<string | null>(null);

  const selectedPulgi = pulgis.find((p) => p.id === targetPulgiId) || pulgis[0] || null;

  const handleAdopt = (template: (typeof EXPLORE_PULGIS)[number]) => {
    const now = Date.now();
    const adopted: Pulgi = {
      ...template,
      id: `pulgi-${now}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    onAdoptPulgi(adopted);
    setAdoptedNames((prev) => [...prev, template.name]);
  };

  const filteredSkills = skills.filter((sk) => {
    const catOk = skillCategory === 'Todas' || sk.category === skillCategory;
    const q = skillSearch.trim().toLowerCase();
    const searchOk =
      !q ||
      sk.name.toLowerCase().includes(q) ||
      sk.description.toLowerCase().includes(q) ||
      sk.capabilities.some((c) => c.toLowerCase().includes(q));
    return catOk && searchOk;
  });

  const handleCreateSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (sName.trim().length < 3 || sDirective.trim().length < 10) {
      setBuilderError('Informe um nome (mín. 3 letras) e a diretiva de prompt da skill (mín. 10 caracteres).');
      return;
    }
    setBuilderError(null);
    const created: PulgiSkill = {
      id: `skill-custom-${Date.now()}`,
      name: sName.trim(),
      category: sCategory,
      description: sDesc.trim() || `Skill personalizada de ${sCategory}.`,
      promptDirective: sDirective.trim(),
      capabilities: sCaps
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
      author: sAuthor.trim() || 'Comunidade Local',
      isBuiltIn: false,
      createdAt: Date.now(),
    };
    onSaveSkill(created);
    if (selectedPulgi) {
      onToggleSkillForPulgi(selectedPulgi.id, created.id);
    }
    setSName('');
    setSDesc('');
    setSDirective('');
    setShowBuilder(false);
  };

  const handleImportSkillJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        if (!parsed.name || !parsed.promptDirective) {
          setBuilderError('Arquivo JSON inválido: precisa conter "name" e "promptDirective".');
          return;
        }
        onSaveSkill({
          id: `skill-import-${Date.now()}`,
          name: String(parsed.name),
          category: parsed.category || 'Criatividade',
          description: String(parsed.description || 'Skill importada via manifesto JSON.'),
          promptDirective: String(parsed.promptDirective),
          capabilities: Array.isArray(parsed.capabilities) ? parsed.capabilities : ['Skill Externa'],
          author: String(parsed.author || 'Importada'),
          isBuiltIn: false,
          createdAt: Date.now(),
        });
        setBuilderError(null);
      } catch {
        setBuilderError('Não foi possível ler o JSON da skill.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Explorar & Skill Marketplace
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Adote novos personagens Pulgi ou instale e desenvolva skills especializadas.
          </p>
        </div>

        {/* Segmented Control */}
        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 self-start">
          <button
            type="button"
            onClick={() => setSection('characters')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
              section === 'characters'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
            <span>Personagens</span>
          </button>
          <button
            type="button"
            onClick={() => setSection('skills')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
              section === 'skills'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-sky-500" />
            <span>Skill Marketplace ({skills.length})</span>
          </button>
        </div>
      </div>

      {section === 'characters' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EXPLORE_PULGIS.map((item) => {
            const isAdopted = adoptedNames.includes(item.name) || pulgis.some((p) => p.name === item.name);
            return (
              <article
                key={item.name}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
              >
                <div>
                  <div className="flex items-start gap-3.5">
                    <PulgiAvatar appearance={item.appearance} name={item.name} size={68} animate />
                    <div className="min-w-0">
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        {item.name}
                      </h2>
                      <p className="text-xs font-medium text-violet-600 dark:text-violet-400">
                        {item.role}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Voz: {item.voiceName}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                    {item.personality}
                  </p>
                  <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400">
                    {item.interests.join(' · ')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleAdopt(item)}
                  className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition min-h-[42px] ${
                    isAdopted
                      ? 'border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                      : 'bg-violet-600 text-white hover:bg-violet-700'
                  }`}
                >
                  {isAdopted ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Clonar Novamente</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      <span>Adicionar aos Meus Pulgis</span>
                    </>
                  )}
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Marketplace Toolbar */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <label htmlFor="target-pulgi-select" className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  Instalar em:
                </label>
                <select
                  id="target-pulgi-select"
                  value={selectedPulgi?.id || ''}
                  onChange={(e) => setTargetPulgiId(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white min-h-[40px]"
                >
                  {pulgis.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({(p.installedSkillIds || []).length} skills)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 min-h-[40px]">
                  <Download className="h-3.5 w-3.5" />
                  <span>Importar JSON</span>
                  <input type="file" accept=".json" onChange={handleImportSkillJson} className="sr-only" />
                </label>
                <button
                  type="button"
                  onClick={() => setShowBuilder((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-violet-700 min-h-[40px]"
                >
                  <Plus className="h-4 w-4" />
                  <span>Desenvolver Nova Skill</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  placeholder="Buscar skill por nome ou capacidade..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white min-h-[40px]"
                />
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                {SKILL_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSkillCategory(cat)}
                    className={`rounded-xl px-3 py-2 text-xs font-medium whitespace-nowrap shrink-0 transition ${
                      skillCategory === cat
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {builderError && (
            <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300">
              {builderError}
            </div>
          )}

          {/* Custom Skill Developer Form */}
          {showBuilder && (
            <form
              onSubmit={handleCreateSkill}
              className="rounded-2xl border border-violet-200 dark:border-violet-800 bg-white dark:bg-slate-900 p-5 space-y-3"
            >
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Skill SDK — Desenvolver & Publicar Skill
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Skills injetam instruções especializadas e capacidades diretamente no raciocínio do Pulgi em chats, grupos e Workspace.
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  type="text"
                  value={sName}
                  onChange={(e) => setSName(e.target.value)}
                  placeholder="Nome da Skill (ex: Revisor de Python)"
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                />
                <select
                  value={sCategory}
                  onChange={(e) => setSCategory(e.target.value as SkillCategory)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                >
                  {SKILL_CATEGORIES.filter((c) => c !== 'Todas').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={sAuthor}
                  onChange={(e) => setSAuthor(e.target.value)}
                  placeholder="Autor"
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <input
                type="text"
                value={sDesc}
                onChange={(e) => setSDesc(e.target.value)}
                placeholder="Descrição curta para o Marketplace..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
              />

              <textarea
                rows={3}
                value={sDirective}
                onChange={(e) => setSDirective(e.target.value)}
                placeholder="Diretiva de Prompt / Comportamento (ex: Sempre valide tipos, sugira testes unitários e explique a complexidade O(n))..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
              />

              <input
                type="text"
                value={sCaps}
                onChange={(e) => setSCaps(e.target.value)}
                placeholder="Capacidades separadas por vírgula"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBuilder(false)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700"
                >
                  Publicar no Marketplace
                </button>
              </div>
            </form>
          )}

          {/* Skills Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSkills.map((skill) => {
              const isInstalled = selectedPulgi
                ? (selectedPulgi.installedSkillIds || []).includes(skill.id)
                : false;

              return (
                <article
                  key={skill.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-violet-600 dark:text-violet-400">
                          {skill.category} · por {skill.author}
                        </p>
                        <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                          {skill.name}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          triggerBlobDownload(
                            new Blob([JSON.stringify(skill, null, 2)], { type: 'application/json' }),
                            `${skill.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.pulgi-skill.json`
                          )
                        }
                        title="Exportar Manifesto JSON da Skill"
                        aria-label={`Exportar JSON de ${skill.name}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white shrink-0"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      {skill.description}
                    </p>
                    <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400">
                      {skill.capabilities.join(' · ')}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    {selectedPulgi && (
                      <button
                        type="button"
                        onClick={() => onToggleSkillForPulgi(selectedPulgi.id, skill.id)}
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition min-h-[40px] ${
                          isInstalled
                            ? 'border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-violet-600 text-white hover:bg-violet-700'
                        }`}
                      >
                        {isInstalled ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Instalada em {selectedPulgi.name}</span>
                          </>
                        ) : (
                          <>
                            <Zap className="h-3.5 w-3.5" />
                            <span>Instalar em {selectedPulgi.name}</span>
                          </>
                        )}
                      </button>
                    )}

                    {!skill.isBuiltIn && (
                      <button
                        type="button"
                        onClick={() => onDeleteSkill(skill.id)}
                        aria-label={`Excluir skill ${skill.name}`}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

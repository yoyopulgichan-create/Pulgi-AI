import React, { useEffect, useState } from 'react';
import {
  Compass,
  FileCode2,
  FolderKanban,
  Home,
  Layers,
  Menu,
  MessageCircle,
  Moon,
  PlusCircle,
  Settings,
  Sparkles,
  Sun,
  Users,
  Wand2,
  X,
} from 'lucide-react';
import {
  AppSettings,
  ChatThread,
  PageId,
  ProjectItem,
  Pulgi,
  PulgiGroup,
  PulgiSkill,
  StudioFile,
  StudioTab,
} from './types/pulgi';
import { dbOps, loadInitialDatabase } from './utils/db';
import { DEFAULT_SETTINGS, SEED_PULGIS, SEED_SKILLS } from './utils/seedData';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallBanner';
import { HomeView } from './pages/HomeView';
import { MyPulgisView } from './pages/MyPulgisView';
import { CreatePulgiView } from './pages/CreatePulgiView';
import { ChatsView } from './pages/ChatsView';
import { GroupsView } from './pages/GroupsView';
import { ExploreView } from './pages/ExploreView';
import { StudioView } from './pages/StudioView';
import { ProjectsView } from './pages/ProjectsView';
import { WorkspaceView } from './pages/WorkspaceView';
import { FilesView } from './pages/FilesView';
import { SettingsView } from './pages/SettingsView';
import { triggerBlobDownload } from './utils/fileGenerators';

const NAV_ITEMS: { id: PageId; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: 'Home', icon: <Home className="h-4 w-4" /> },
  { id: 'my-pulgis', label: 'My Pulgis', icon: <Sparkles className="h-4 w-4" /> },
  { id: 'create', label: 'Create', icon: <PlusCircle className="h-4 w-4" /> },
  { id: 'chats', label: 'Chats', icon: <MessageCircle className="h-4 w-4" /> },
  { id: 'groups', label: 'Groups', icon: <Users className="h-4 w-4" /> },
  { id: 'explore', label: 'Explore', icon: <Compass className="h-4 w-4" /> },
  { id: 'studio', label: 'Pulgi Studio', icon: <Layers className="h-4 w-4" /> },
  { id: 'projects', label: 'Projects', icon: <FolderKanban className="h-4 w-4" /> },
  { id: 'workspace', label: 'Workspace', icon: <Wand2 className="h-4 w-4" /> },
  { id: 'files', label: 'Files', icon: <FileCode2 className="h-4 w-4" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
];

export default function App() {
  const [hydrated, setHydrated] = useState(false);
  const [activePage, setActivePage] = useState<PageId>('home');
  const [pulgis, setPulgis] = useState<Pulgi[]>(SEED_PULGIS);
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [groups, setGroups] = useState<PulgiGroup[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [files, setFiles] = useState<StudioFile[]>([]);
  const [skills, setSkills] = useState<PulgiSkill[]>(SEED_SKILLS);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const [editingPulgi, setEditingPulgi] = useState<Pulgi | null>(null);
  const [activeChatPulgiId, setActiveChatPulgiId] = useState<string | null>(null);
  const [studioTab, setStudioTab] = useState<StudioTab>('website');
  const [exploreInitialSection, setExploreInitialSection] = useState<'characters' | 'skills'>('characters');
  const [workspaceInitialPrompt, setWorkspaceInitialPrompt] = useState('');
  const [workspaceProjectId, setWorkspaceProjectId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadInitialDatabase()
      .then((snap) => {
        setPulgis(snap.pulgis);
        setChats(snap.chats);
        setGroups(snap.groups);
        setProjects(snap.projects);
        setFiles(snap.files);
        setSkills(snap.skills);
        setSettings(snap.settings);
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  const updateSettings = (next: AppSettings) => {
    setSettings(next);
    dbOps.saveSettings(next).catch(() => {});
  };

  const handleSavePulgi = (pulgi: Pulgi) => {
    setPulgis((prev) => {
      const exists = prev.some((p) => p.id === pulgi.id);
      return exists ? prev.map((p) => (p.id === pulgi.id ? pulgi : p)) : [pulgi, ...prev];
    });
    dbOps.savePulgi(pulgi).catch(() => {});
    setEditingPulgi(null);
    setActivePage('my-pulgis');
  };

  const handleDuplicatePulgi = (pulgi: Pulgi) => {
    const now = Date.now();
    const copy: Pulgi = {
      ...pulgi,
      id: `pulgi-${now}`,
      name: `${pulgi.name} II`,
      createdAt: now,
      updatedAt: now,
    };
    setPulgis((prev) => [copy, ...prev]);
    dbOps.savePulgi(copy).catch(() => {});
  };

  const handleDeletePulgi = (id: string) => {
    setPulgis((prev) => prev.filter((p) => p.id !== id));
    dbOps.deletePulgi(id).catch(() => {});
  };

  const handleSaveChat = (thread: ChatThread) => {
    setChats((prev) => {
      const exists = prev.some((c) => c.id === thread.id);
      return exists ? prev.map((c) => (c.id === thread.id ? thread : c)) : [thread, ...prev];
    });
    dbOps.saveChat(thread).catch(() => {});
  };

  const handleSaveGroup = (group: PulgiGroup) => {
    setGroups((prev) => {
      const exists = prev.some((g) => g.id === group.id);
      return exists ? prev.map((g) => (g.id === group.id ? group : g)) : [group, ...prev];
    });
    dbOps.saveGroup(group).catch(() => {});
  };

  const handleSaveFile = (file: StudioFile) => {
    setFiles((prev) => {
      const exists = prev.some((f) => f.id === file.id);
      return exists ? prev.map((f) => (f.id === file.id ? file : f)) : [file, ...prev];
    });
    dbOps.saveFile(file).catch(() => {});
  };

  const handleDeleteFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    dbOps.deleteFile(id).catch(() => {});
  };

  const handleSaveProject = (project: ProjectItem) => {
    setProjects((prev) => {
      const exists = prev.some((p) => p.id === project.id);
      return exists ? prev.map((p) => (p.id === project.id ? project : p)) : [project, ...prev];
    });
    dbOps.saveProject(project).catch(() => {});
  };

  const handleDeleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    dbOps.deleteProject(id).catch(() => {});
  };

  const handleToggleSkillForPulgi = (pulgiId: string, skillId: string) => {
    setPulgis((prev) =>
      prev.map((p) => {
        if (p.id !== pulgiId) return p;
        const curr = p.installedSkillIds || [];
        const nextSkills = curr.includes(skillId)
          ? curr.filter((id) => id !== skillId)
          : [...curr, skillId];
        const updated = { ...p, installedSkillIds: nextSkills, updatedAt: Date.now() };
        dbOps.savePulgi(updated).catch(() => {});
        return updated;
      })
    );
  };

  const handleSaveSkill = (skill: PulgiSkill) => {
    setSkills((prev) => [skill, ...prev.filter((s) => s.id !== skill.id)]);
    dbOps.saveSkill(skill).catch(() => {});
  };

  const handleDeleteSkill = (skillId: string) => {
    setSkills((prev) => prev.filter((s) => s.id !== skillId));
    dbOps.deleteSkill(skillId).catch(() => {});
  };

  const navigateTo = (page: PageId) => {
    if (page !== 'create') setEditingPulgi(null);
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  const activeNavMeta = NAV_ITEMS.find((n) => n.id === activePage);

  return (
    <div className="min-h-[100dvh] bg-[#F6F8FC] text-slate-900 dark:bg-[#0D101B] dark:text-slate-100 flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-5">
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className="flex items-center gap-2.5 px-2.5 text-left"
        >
          <img src="/icon.svg" alt="Logo Pulgi AI" className="h-8 w-8 rounded-xl shrink-0" />
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            PULGI AI
          </span>
        </button>

        <nav aria-label="Navegação principal" className="mt-6 flex-1 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition whitespace-nowrap ${
                  active
                    ? 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <PWAInstallButton compact />
          <button
            type="button"
            onClick={() =>
              updateSettings({
                ...settings,
                theme: settings.theme === 'dark' ? 'light' : 'dark',
              })
            }
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <span>{settings.theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
            {settings.theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Mobile Compact Header (<= 48px to respect 15% sticky budget on iPhone 5–17) */}
      <header className="lg:hidden sticky top-0 z-30 pt-safe border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="flex h-12 items-center justify-between px-3">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="flex items-center gap-2 min-w-0"
          >
            <img src="/icon.svg" alt="PULGI AI" className="h-7 w-7 rounded-lg shrink-0" />
            <span className="font-display text-sm font-bold text-slate-900 dark:text-white truncate">
              PULGI AI
            </span>
          </button>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate px-2">
            {activeNavMeta?.label}
          </span>
          <button
            type="button"
            onClick={() =>
              updateSettings({
                ...settings,
                theme: settings.theme === 'dark' ? 'light' : 'dark',
              })
            }
            aria-label="Alternar tema claro/escuro"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 dark:text-slate-300"
          >
            {settings.theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 lg:pl-64 pb-20 lg:pb-8 min-w-0 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-3 sm:px-6 py-4 sm:py-6">
          <OfflineIndicator />
          {!hydrated ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-500">
              Carregando universo Pulgi AI...
            </div>
          ) : (
            <>
              {activePage === 'home' && (
                <HomeView
                  pulgis={pulgis}
                  projects={projects}
                  language={settings.language}
                  onNavigate={navigateTo}
                  onStartChat={(id) => {
                    setActiveChatPulgiId(id);
                    navigateTo('chats');
                  }}
                  onQuickWorkspace={(promptText) => {
                    setWorkspaceInitialPrompt(promptText);
                    setWorkspaceProjectId(null);
                    navigateTo('workspace');
                  }}
                  onOpenStudioTab={(tab) => {
                    setStudioTab(tab);
                    navigateTo('studio');
                  }}
                />
              )}

              {activePage === 'my-pulgis' && (
                <MyPulgisView
                  pulgis={pulgis}
                  skills={skills}
                  onCreateNew={() => {
                    setEditingPulgi(null);
                    navigateTo('create');
                  }}
                  onEdit={(pulgi) => {
                    setEditingPulgi(pulgi);
                    setActivePage('create');
                  }}
                  onDuplicate={handleDuplicatePulgi}
                  onDelete={handleDeletePulgi}
                  onStartChat={(id) => {
                    setActiveChatPulgiId(id);
                    navigateTo('chats');
                  }}
                  onOpenSkillsMarketplace={() => {
                    setExploreInitialSection('skills');
                    navigateTo('explore');
                  }}
                />
              )}

              {activePage === 'create' && (
                <CreatePulgiView
                  editingPulgi={editingPulgi}
                  skills={skills}
                  onSave={handleSavePulgi}
                  onCancelEdit={() => {
                    setEditingPulgi(null);
                    navigateTo('my-pulgis');
                  }}
                />
              )}

              {activePage === 'chats' && (
                <ChatsView
                  pulgis={pulgis}
                  skills={skills}
                  chats={chats}
                  activePulgiId={activeChatPulgiId}
                  settings={settings}
                  onSelectPulgi={setActiveChatPulgiId}
                  onSaveChat={handleSaveChat}
                  onUpdatePulgi={handleSavePulgi}
                  onToggleAutoSpeak={() =>
                    updateSettings({ ...settings, autoSpeakReplies: !settings.autoSpeakReplies })
                  }
                />
              )}

              {activePage === 'groups' && (
                <GroupsView
                  pulgis={pulgis}
                  groups={groups}
                  settings={settings}
                  onSaveGroup={handleSaveGroup}
                  onSaveDeliverableFile={handleSaveFile}
                  onToggleAutoSpeak={() =>
                    updateSettings({ ...settings, autoSpeakReplies: !settings.autoSpeakReplies })
                  }
                />
              )}

              {activePage === 'explore' && (
                <ExploreView
                  pulgis={pulgis}
                  skills={skills}
                  initialSection={exploreInitialSection}
                  onAdoptPulgi={(p) => {
                    setPulgis((prev) => [p, ...prev]);
                    dbOps.savePulgi(p).catch(() => {});
                  }}
                  onToggleSkillForPulgi={handleToggleSkillForPulgi}
                  onSaveSkill={handleSaveSkill}
                  onDeleteSkill={handleDeleteSkill}
                />
              )}

              {activePage === 'studio' && (
                <StudioView
                  pulgis={pulgis}
                  settings={settings}
                  activeTab={studioTab}
                  onChangeTab={setStudioTab}
                  onSaveFile={handleSaveFile}
                  onSaveProject={handleSaveProject}
                />
              )}

              {activePage === 'projects' && (
                <ProjectsView
                  projects={projects}
                  pulgis={pulgis}
                  files={files}
                  onUpdateProject={handleSaveProject}
                  onDeleteProject={handleDeleteProject}
                  onOpenInWorkspace={(projId) => {
                    setWorkspaceProjectId(projId);
                    navigateTo('workspace');
                  }}
                />
              )}

              {activePage === 'workspace' && (
                <WorkspaceView
                  pulgis={pulgis}
                  projects={projects}
                  files={files}
                  settings={settings}
                  initialPrompt={workspaceInitialPrompt}
                  activeProjectId={workspaceProjectId}
                  onClearInitialPrompt={() => setWorkspaceInitialPrompt('')}
                  onProjectCreated={(proj, newFiles) => {
                    handleSaveProject(proj);
                    newFiles.forEach(handleSaveFile);
                  }}
                />
              )}

              {activePage === 'files' && (
                <FilesView
                  files={files}
                  onUpdateFile={handleSaveFile}
                  onDeleteFile={handleDeleteFile}
                />
              )}

              {activePage === 'settings' && (
                <SettingsView
                  settings={settings}
                  onUpdateSettings={updateSettings}
                  onExportBackup={() => {
                    const snapshot = {
                      pulgis,
                      chats,
                      groups,
                      projects,
                      files,
                      skills,
                      settings,
                    };
                    triggerBlobDownload(
                      new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' }),
                      'pulgi_ai_backup.json'
                    );
                  }}
                  onImportBackup={(file) => {
                    const reader = new FileReader();
                    reader.onload = async () => {
                      try {
                        const parsed = JSON.parse(String(reader.result || '{}'));
                        await dbOps.importBackup(parsed);
                        const snap = await loadInitialDatabase();
                        setPulgis(snap.pulgis);
                        setChats(snap.chats);
                        setGroups(snap.groups);
                        setProjects(snap.projects);
                        setFiles(snap.files);
                        setSkills(snap.skills);
                        setSettings(snap.settings);
                      } catch {
                        // ignore invalid json
                      }
                    };
                    reader.readAsText(file);
                  }}
                  onResetAll={async () => {
                    const snap = await dbOps.resetAllData();
                    setPulgis(snap.pulgis);
                    setChats(snap.chats);
                    setGroups(snap.groups);
                    setProjects(snap.projects);
                    setFiles(snap.files);
                    setSkills(snap.skills);
                    setSettings(snap.settings);
                  }}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Mobile Bottom Tab Bar (56px + safe-area) */}
      <nav
        aria-label="Navegação inferior móvel"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md"
      >
        <div className="grid grid-cols-5 h-14 items-center">
          {(
            [
              { id: 'home', label: 'Home', icon: <Home className="h-5 w-5" /> },
              { id: 'chats', label: 'Chats', icon: <MessageCircle className="h-5 w-5" /> },
              { id: 'studio', label: 'Studio', icon: <Layers className="h-5 w-5" /> },
              { id: 'workspace', label: 'Tasks', icon: <Wand2 className="h-5 w-5" /> },
            ] as { id: PageId; label: string; icon: React.ReactNode }[]
          ).map((tab) => {
            const active = activePage === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => navigateTo(tab.id)}
                className={`flex flex-col items-center justify-center h-full text-[10px] font-medium ${
                  active ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.icon}
                <span className="mt-0.5">{tab.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir todas as páginas"
            className="flex flex-col items-center justify-center h-full text-[10px] font-medium text-slate-500 dark:text-slate-400"
          >
            <Menu className="h-5 w-5" />
            <span className="mt-0.5">Mais</span>
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Sheet Menu for all 11 pages */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end bg-slate-950/50 backdrop-blur-sm">
          <div className="w-full rounded-t-3xl bg-white dark:bg-slate-900 p-5 pb-safe max-h-[80dvh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="font-display text-base font-bold text-slate-900 dark:text-white">
                Menu PULGI AI
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Fechar menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id)}
                  className={`flex items-center gap-2.5 rounded-xl border p-3 text-left text-xs font-semibold min-h-[46px] ${
                    activePage === item.id
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

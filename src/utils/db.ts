import {
  AppSettings,
  ChatThread,
  ProjectItem,
  Pulgi,
  PulgiGroup,
  PulgiSkill,
  StudioFile,
} from '../types/pulgi';
import {
  DEFAULT_SETTINGS,
  SEED_CHATS,
  SEED_FILES,
  SEED_GROUPS,
  SEED_PROJECTS,
  SEED_PULGIS,
  SEED_SKILLS,
} from './seedData';

const DB_NAME = 'pulgi-ai-db';
const DB_VERSION = 2;

export type StoreName = 'pulgis' | 'chats' | 'groups' | 'projects' | 'files' | 'skills' | 'settings';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB indisponível neste navegador.'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('pulgis')) db.createObjectStore('pulgis', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('chats')) db.createObjectStore('chats', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('groups')) db.createObjectStore('groups', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('projects')) db.createObjectStore('projects', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('files')) db.createObjectStore('files', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('skills')) db.createObjectStore('skills', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function getAllFromStore<T>(storeName: StoreName): Promise<T[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result || []) as T[]);
    req.onerror = () => reject(req.error);
  });
}

async function putInStore<T>(storeName: StoreName, value: T): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(value);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function deleteFromStore(storeName: StoreName, id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function clearStore(storeName: StoreName): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export interface PulgiDatabaseSnapshot {
  pulgis: Pulgi[];
  chats: ChatThread[];
  groups: PulgiGroup[];
  projects: ProjectItem[];
  files: StudioFile[];
  skills: PulgiSkill[];
  settings: AppSettings;
}

export async function loadInitialDatabase(): Promise<PulgiDatabaseSnapshot> {
  const existingPulgis = await getAllFromStore<Pulgi>('pulgis');
  const existingSkills = await getAllFromStore<PulgiSkill>('skills');
  const initializedFlag = typeof localStorage !== 'undefined' && localStorage.getItem('pulgi_db_seeded') === '1';

  if (existingPulgis.length === 0 && !initializedFlag) {
    for (const p of SEED_PULGIS) await putInStore('pulgis', p);
    for (const c of SEED_CHATS) await putInStore('chats', c);
    for (const g of SEED_GROUPS) await putInStore('groups', g);
    for (const pr of SEED_PROJECTS) await putInStore('projects', pr);
    for (const f of SEED_FILES) await putInStore('files', f);
    for (const s of SEED_SKILLS) await putInStore('skills', s);
    await putInStore('settings', { id: 'app-settings', ...DEFAULT_SETTINGS });
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pulgi_db_seeded', '1');
    }
  } else if (existingSkills.length === 0) {
    for (const s of SEED_SKILLS) await putInStore('skills', s);
  }

  const [pulgis, chats, groups, projects, files, skills, settingsRows] = await Promise.all([
    getAllFromStore<Pulgi>('pulgis'),
    getAllFromStore<ChatThread>('chats'),
    getAllFromStore<PulgiGroup>('groups'),
    getAllFromStore<ProjectItem>('projects'),
    getAllFromStore<StudioFile>('files'),
    getAllFromStore<PulgiSkill>('skills'),
    getAllFromStore<AppSettings & { id: string }>('settings'),
  ]);

  const savedSettings = settingsRows[0];
  const settings: AppSettings = savedSettings
    ? {
        theme: savedSettings.theme || DEFAULT_SETTINGS.theme,
        language: savedSettings.language || DEFAULT_SETTINGS.language,
        providerMode: savedSettings.providerMode || DEFAULT_SETTINGS.providerMode,
        localEndpoint: savedSettings.localEndpoint || DEFAULT_SETTINGS.localEndpoint,
        localModelName: savedSettings.localModelName || DEFAULT_SETTINGS.localModelName,
        autoSpeakReplies: Boolean(savedSettings.autoSpeakReplies),
        handsFreeVoice: Boolean(savedSettings.handsFreeVoice),
      }
    : DEFAULT_SETTINGS;

  return {
    pulgis: pulgis.sort((a, b) => b.createdAt - a.createdAt),
    chats: chats.sort((a, b) => b.updatedAt - a.updatedAt),
    groups: groups.sort((a, b) => b.updatedAt - a.updatedAt),
    projects: projects.sort((a, b) => b.updatedAt - a.updatedAt),
    files: files.sort((a, b) => b.updatedAt - a.updatedAt),
    skills: skills.sort((a, b) => b.createdAt - a.createdAt),
    settings,
  };
}

export const dbOps = {
  savePulgi: (pulgi: Pulgi) => putInStore('pulgis', pulgi),
  deletePulgi: (id: string) => deleteFromStore('pulgis', id),
  saveChat: (chat: ChatThread) => putInStore('chats', chat),
  deleteChat: (id: string) => deleteFromStore('chats', id),
  saveGroup: (group: PulgiGroup) => putInStore('groups', group),
  deleteGroup: (id: string) => deleteFromStore('groups', id),
  saveProject: (project: ProjectItem) => putInStore('projects', project),
  deleteProject: (id: string) => deleteFromStore('projects', id),
  saveFile: (file: StudioFile) => putInStore('files', file),
  deleteFile: (id: string) => deleteFromStore('files', id),
  saveSkill: (skill: PulgiSkill) => putInStore('skills', skill),
  deleteSkill: (id: string) => deleteFromStore('skills', id),
  saveSettings: (settings: AppSettings) => putInStore('settings', { id: 'app-settings', ...settings }),
  async resetAllData(): Promise<PulgiDatabaseSnapshot> {
    await Promise.all([
      clearStore('pulgis'),
      clearStore('chats'),
      clearStore('groups'),
      clearStore('projects'),
      clearStore('files'),
      clearStore('skills'),
      clearStore('settings'),
    ]);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('pulgi_db_seeded');
    }
    return loadInitialDatabase();
  },
  async importBackup(snapshot: PulgiDatabaseSnapshot): Promise<void> {
    await Promise.all([
      clearStore('pulgis'),
      clearStore('chats'),
      clearStore('groups'),
      clearStore('projects'),
      clearStore('files'),
      clearStore('skills'),
      clearStore('settings'),
    ]);
    for (const p of snapshot.pulgis || []) await putInStore('pulgis', p);
    for (const c of snapshot.chats || []) await putInStore('chats', c);
    for (const g of snapshot.groups || []) await putInStore('groups', g);
    for (const pr of snapshot.projects || []) await putInStore('projects', pr);
    for (const f of snapshot.files || []) await putInStore('files', f);
    for (const s of snapshot.skills || []) await putInStore('skills', s);
    if (snapshot.settings) await putInStore('settings', { id: 'app-settings', ...snapshot.settings });
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pulgi_db_seeded', '1');
    }
  },
};

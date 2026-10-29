import type { ChangeRequest } from '../types';

export interface ProjectProfile {
  id: string;
  projectPath: string;
  system: string;
  subsystem: string;
  modules: string;
  testEnv: string;
}

const KEY = 'changeflow.profiles';

export function loadProfiles(): ProjectProfile[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as ProjectProfile[]) : [];
  } catch {
    return [];
  }
}

export function saveProfiles(p: ProjectProfile[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function normalizePath(p: string): string {
  return p.replace(/^\/+/, '').replace(/\/+$/, '').toLowerCase();
}

export function findProfile(profiles: ProjectProfile[], projectPath: string): ProjectProfile | undefined {
  const n = normalizePath(projectPath);
  if (!n) return undefined;
  return profiles.find((p) => normalizePath(p.projectPath) === n);
}

/** Boş sahələri profildən doldurur, dolu sahələrə toxunmur. */
export function applyProfile(form: ChangeRequest, p: ProjectProfile): ChangeRequest {
  return {
    ...form,
    system: form.system || p.system,
    subsystem: form.subsystem || p.subsystem,
    modules: form.modules || p.modules,
    testEnv: form.testEnv === 'stage' && p.testEnv ? p.testEnv : form.testEnv,
  };
}

export function newProfileId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `p-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  }
}

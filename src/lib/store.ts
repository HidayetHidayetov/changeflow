const COUNTER_KEY = 'changeflow.counter';
const HISTORY_KEY = 'changeflow.history';
const CONFIG_KEY = 'changeflow.config';

export function nextId(): string {
  const year = new Date().getFullYear();
  const raw = localStorage.getItem(COUNTER_KEY);
  let last = 0;
  if (raw) {
    try {
      const o = JSON.parse(raw);
      if (o.year === year) last = o.last ?? 0;
    } catch { /* ignore */ }
  }
  const n = last + 1;
  localStorage.setItem(COUNTER_KEY, JSON.stringify({ year, last: n }));
  return `CR-${year}-${String(n).padStart(4, '0')}`;
}

export function peekNextId(): string {
  const year = new Date().getFullYear();
  const raw = localStorage.getItem(COUNTER_KEY);
  let last = 0;
  if (raw) {
    try {
      const o = JSON.parse(raw);
      if (o.year === year) last = o.last ?? 0;
    } catch { /* ignore */ }
  }
  return `CR-${year}-${String(last + 1).padStart(4, '0')}`;
}

export function saveToHistory(id: string, data: unknown): void {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    if (!arr.includes(id)) {
      arr.unshift(id);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(0, 100)));
    }
    localStorage.setItem(`changeflow.doc.${id}`, JSON.stringify(data));
  } catch { /* ignore */ }
}

export function loadDoc(id: string): unknown | null {
  try {
    const raw = localStorage.getItem(`changeflow.doc.${id}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function listHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function clearHistory(): void {
  try {
    const arr = listHistory();
    for (const id of arr) localStorage.removeItem(`changeflow.doc.${id}`);
    localStorage.removeItem(HISTORY_KEY);
  } catch { /* ignore */ }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem('changeflow.draft');
  } catch { /* ignore */ }
}

/** GitLab layihə yolundan qısa kod: "a/b/emios-webapp" → "EMIOS-WEBAPP" */
export function projectCode(projectPath: string): string {
  const clean = projectPath.replace(/^\/+/, '').replace(/\/+$/, '');
  const last = clean.split('/').pop() ?? clean;
  const code = last.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return code || 'PRJ';
}

export interface AppConfig {
  orgName: string;
  logoDataUrl: string;
  theme: 'light' | 'dark' | 'system';
}

export function loadConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return JSON.parse(raw) as AppConfig;
  } catch { /* ignore */ }
  return { orgName: 'Azerishiq OJSC', logoDataUrl: '', theme: 'system' };
}

export function saveConfig(c: AppConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(c));
}

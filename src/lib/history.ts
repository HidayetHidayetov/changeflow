import type Database from '@tauri-apps/plugin-sql';
import { isDesktop } from './secrets';

const HISTORY_KEY = 'changeflow.history';
const docKey = (id: string) => `changeflow.doc.${id}`;

let dbPromise: Promise<Database> | null = null;

async function db(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const { default: Db } = await import('@tauri-apps/plugin-sql');
      const d = await Db.load('sqlite:changeflow.db');
      await d.execute(
        'CREATE TABLE IF NOT EXISTS docs (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL)',
      );
      // Birdəfəlik miqrasiya: localStorage-dəki sənədləri SQLite-a köçür.
      try {
        const rows = await d.select<Array<{ n: number }>>('SELECT COUNT(*) as n FROM docs');
        if ((rows[0]?.n ?? 0) === 0) {
          const raw = localStorage.getItem(HISTORY_KEY);
          if (raw) {
            const ids = JSON.parse(raw) as string[];
            const now = new Date().toISOString();
            for (const id of ids.slice(0, 100)) {
              const doc = localStorage.getItem(docKey(id));
              if (typeof id === 'string' && doc) {
                await d.execute('INSERT OR IGNORE INTO docs (id, data, updated_at) VALUES ($1, $2, $3)', [
                  id,
                  doc,
                  now,
                ]);
              }
            }
          }
        }
      } catch {
        /* ignore */
      }
      return d;
    })();
  }
  return dbPromise;
}

export async function listHistory(): Promise<string[]> {
  if (!isDesktop()) {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  }
  try {
    const rows = await (
      await db()
    ).select<Array<{ id: string }>>('SELECT id FROM docs ORDER BY updated_at DESC LIMIT 100');
    return rows.map((r) => r.id);
  } catch {
    return [];
  }
}

export async function saveToHistory(id: string, data: unknown): Promise<void> {
  const json = JSON.stringify(data);
  if (!isDesktop()) {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      if (!arr.includes(id)) {
        arr.unshift(id);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(0, 100)));
      }
      localStorage.setItem(docKey(id), json);
    } catch {
      /* ignore */
    }
    return;
  }
  try {
    await (
      await db()
    ).execute('INSERT OR REPLACE INTO docs (id, data, updated_at) VALUES ($1, $2, $3)', [
      id,
      json,
      new Date().toISOString(),
    ]);
  } catch {
    /* ignore */
  }
}

export async function loadDoc(id: string): Promise<unknown | null> {
  if (!isDesktop()) {
    try {
      const raw = localStorage.getItem(docKey(id));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
  try {
    const rows = await (await db()).select<Array<{ data: string }>>('SELECT data FROM docs WHERE id = $1', [id]);
    return rows[0] ? JSON.parse(rows[0].data) : null;
  } catch {
    return null;
  }
}

export async function clearHistory(): Promise<void> {
  if (!isDesktop()) {
    try {
      const arr = await listHistory();
      for (const id of arr) localStorage.removeItem(docKey(id));
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      /* ignore */
    }
    return;
  }
  try {
    await (await db()).execute('DELETE FROM docs');
  } catch {
    /* ignore */
  }
}

export interface BackupData {
  version: 1;
  exportedAt: string;
  docs: Array<{ id: string; doc: unknown }>;
}

export async function exportBackup(): Promise<string> {
  const ids = await listHistory();
  const docs: Array<{ id: string; doc: unknown }> = [];
  for (const id of ids) {
    const doc = await loadDoc(id);
    if (doc) docs.push({ id, doc });
  }
  const data: BackupData = { version: 1, exportedAt: new Date().toISOString(), docs };
  return JSON.stringify(data, null, 2);
}

export async function importBackup(json: string): Promise<{ ok: boolean; count: number; error?: string }> {
  try {
    const data = JSON.parse(json) as BackupData;
    if (!data || !Array.isArray(data.docs)) return { ok: false, count: 0, error: 'bad-format' };
    let count = 0;
    for (const { id, doc } of data.docs) {
      if (typeof id !== 'string' || !doc || typeof doc !== 'object') continue;
      await saveToHistory(id, doc);
      count++;
    }
    return { ok: true, count };
  } catch (e) {
    return { ok: false, count: 0, error: e instanceof Error ? e.message : 'parse-error' };
  }
}

// Tokenlər OS-səviyyə şifrəli anbarda (Stronghold vault).
// Brauzerdə (dev) localStorage fallback işləyir.

import type { Client as ShClient, Stronghold as ShHold } from '@tauri-apps/plugin-stronghold';

export function isDesktop(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

const CLIENT = 'changeflow';
const VAULT_FILE = 'vault.hold';
const KEY_FILE = 'vault.key';

interface VaultHandles {
  sh: ShHold;
  client: ShClient;
}

let vaultPromise: Promise<VaultHandles> | null = null;

async function loadPassword(): Promise<string> {
  const { readTextFile, writeTextFile, mkdir, BaseDirectory } = await import('@tauri-apps/plugin-fs');
  try {
    const key = (await readTextFile(KEY_FILE, { baseDir: BaseDirectory.AppData })).trim();
    if (key) return key;
  } catch {
    /* first run — yaradılır */
  }
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const key = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  try {
    await mkdir('', { baseDir: BaseDirectory.AppData, recursive: true });
  } catch {
    /* exists */
  }
  await writeTextFile(KEY_FILE, key, { baseDir: BaseDirectory.AppData });
  return key;
}

async function vault(): Promise<VaultHandles> {
  if (!vaultPromise) {
    vaultPromise = (async () => {
      const { Stronghold } = await import('@tauri-apps/plugin-stronghold');
      const { appDataDir, join } = await import('@tauri-apps/api/path');
      const path = await join(await appDataDir(), VAULT_FILE);
      const password = await loadPassword();
      const sh = await Stronghold.load(path, password);
      let client;
      try {
        client = await sh.loadClient(CLIENT);
      } catch {
        client = await sh.createClient(CLIENT);
      }
      return { sh, client };
    })();
  }
  return vaultPromise;
}

export async function getSecret(key: string): Promise<string | null> {
  if (!isDesktop()) {
    try {
      return localStorage.getItem(`changeflow.secret.${key}`);
    } catch {
      return null;
    }
  }
  try {
    const { client } = await vault();
    const bytes = await client.getStore().get(key);
    if (!bytes) return null;
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

async function writeSecret(key: string, value: string): Promise<void> {
  const { sh, client } = await vault();
  const store = client.getStore();
  if (value) {
    await store.insert(key, Array.from(new TextEncoder().encode(value)));
  } else {
    await store.remove(key);
  }
  await sh.save();
}

const pending = new Map<string, ReturnType<typeof setTimeout>>();

/** Debounced yazı — hər hərfdə vault-u yenidən yazmamaq üçün. */
export function setSecret(key: string, value: string): void {
  if (!isDesktop()) {
    try {
      if (value) localStorage.setItem(`changeflow.secret.${key}`, value);
      else localStorage.removeItem(`changeflow.secret.${key}`);
    } catch {
      /* ignore */
    }
    return;
  }
  const prev = pending.get(key);
  if (prev) clearTimeout(prev);
  pending.set(
    key,
    setTimeout(() => {
      pending.delete(key);
      writeSecret(key, value).catch(() => {
        /* ignore */
      });
    }, 400),
  );
}

/** Köhnə localStorage tokenlərini vault-a köçürür və oradan silir. */
export async function migrateLocalSecrets(): Promise<void> {
  if (!isDesktop()) return;
  const moves: Array<[string, string]> = [
    ['gitlab-token', 'changeflow.gitlab'],
    ['jira-token', 'changeflow.jira'],
  ];
  for (const [skey, lsKey] of moves) {
    try {
      const raw = localStorage.getItem(lsKey);
      if (!raw) continue;
      const obj = JSON.parse(raw) as { token?: string };
      if (obj && obj.token) {
        await writeSecret(skey, obj.token);
        delete obj.token;
        localStorage.setItem(lsKey, JSON.stringify(obj));
      }
    } catch {
      /* ignore */
    }
  }
}

export interface GitLabConfig {
  baseUrl: string;
  token: string;
  project: string;
}

export interface MRInfo {
  title: string;
  description: string;
  author: string;
  sourceBranch: string;
  targetBranch: string;
  webUrl: string;
  repoUrl: string;
  commits: string;
  diffStat: string;
  date: string;
  time: string;
  status: string;
  labels: string;
}

import { isDesktop } from './secrets';

const CFG_KEY = 'changeflow.gitlab';

export function loadGitLabConfig(): GitLabConfig {
  try {
    const raw = localStorage.getItem(CFG_KEY);
    if (raw) return JSON.parse(raw) as GitLabConfig;
  } catch { /* ignore */ }
  return { baseUrl: 'https://gitlab.azerishiq.az', token: '', project: '' };
}

export function saveGitLabConfig(c: GitLabConfig): void {
  // Token vault-da saxlanılır, localStorage-ə yazılmır (desktop).
  const toSave = isDesktop() ? { ...c, token: '' } : c;
  localStorage.setItem(CFG_KEY, JSON.stringify(toSave));
}

function apiBase(baseUrl: string): string {
  const b = baseUrl.replace(/\/+$/, '');
  return b.endsWith('/api/v4') ? b : `${b}/api/v4`;
}

async function httpGet(url: string, token: string): Promise<unknown> {
  // Tauri desktop-da native fetch (CORS yoxdur), brauzerdə window.fetch
  let f: typeof fetch = window.fetch.bind(window);
  try {
    const w = window as unknown as { __TAURI__?: unknown };
    if (w.__TAURI__) {
      const mod = await import('@tauri-apps/plugin-http');
      f = mod.fetch as unknown as typeof fetch;
    }
  } catch { /* fallback */ }
  const res = await f(url, { headers: { 'PRIVATE-TOKEN': token } });
  if (!res.ok) throw new Error(`GitLab ${res.status}: ${await res.text()}`);
  return res.json();
}

export function toLocalDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { date: '', time: '' };
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export function mapState(state: string, mergedAt: string): string {
  if (state === 'merged') return 'Təsdiqlənib';
  if (state === 'closed') return 'İmtina';
  if (state === 'locked') return 'Təsdiq gözləyir';
  if (mergedAt) return 'Təsdiqlənib';
  return 'Təsdiq gözləyir';
}

export async function testConnection(cfg: GitLabConfig): Promise<{ user: string; project?: string }> {
  const base = apiBase(cfg.baseUrl);
  const me = (await httpGet(`${base}/user`, cfg.token)) as Record<string, unknown>;
  let project: string | undefined;
  if (cfg.project.trim()) {
    const pid = encodeURIComponent(cfg.project.replace(/^\/+/, '').replace(/\/+$/, ''));
    const p = (await httpGet(`${base}/projects/${pid}`, cfg.token)) as Record<string, unknown>;
    project = String(p.name_with_namespace ?? p.name ?? '');
  }
  return { user: String(me.name ?? me.username ?? ''), project };
}

export async function fetchMR(cfg: GitLabConfig, iid: string): Promise<MRInfo> {
  const base = apiBase(cfg.baseUrl);
  const cleanProject = cfg.project.replace(/^\/+/, '').replace(/\/+$/, '');
  const pid = encodeURIComponent(cleanProject);
  const cleanIid = iid.replace(/^!/, '').trim();
  const mr = (await httpGet(`${base}/projects/${pid}/merge_requests/${cleanIid}`, cfg.token)) as Record<string, unknown>;
  const commits = (await httpGet(`${base}/projects/${pid}/merge_requests/${cleanIid}/commits`, cfg.token)) as Array<Record<string, unknown>>;
  const changes = (await httpGet(`${base}/projects/${pid}/merge_requests/${cleanIid}/changes`, cfg.token)) as Record<string, unknown>;

  const commitLines = commits.map((c) => `${String(c.short_id ?? c.id).slice(0, 8)} ${String(c.title ?? '')}`).join('\n');
  let added = 0;
  let removed = 0;
  let files = 0;
  const ch = changes.changes as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(ch)) {
    files = ch.length;
    for (const f of ch) {
      const diff = String(f.diff ?? '');
      for (const line of diff.split('\n')) {
        if (line.startsWith('+++') || line.startsWith('---')) continue;
        if (line.startsWith('+')) added += 1;
        else if (line.startsWith('-')) removed += 1;
      }
    }
  }
  const diffStat = files ? `${files} fayl, +${added}/-${removed}, ${commits.length} commit` : `${commits.length} commit`;
  const created = toLocalDateTime(String(mr.created_at ?? ''));

  const author = mr.author as Record<string, unknown> | undefined;
  const labels = Array.isArray(mr.labels) ? (mr.labels as string[]).join(', ') : '';
  return {
    title: String(mr.title ?? ''),
    description: String(mr.description ?? ''),
    author: String(author?.name ?? ''),
    sourceBranch: String(mr.source_branch ?? ''),
    targetBranch: String(mr.target_branch ?? ''),
    webUrl: String(mr.web_url ?? ''),
    repoUrl: cfg.project.includes('://') ? cfg.project : `${cfg.baseUrl.replace(/\/+$/, '')}/${cleanProject}`,
    commits: commitLines,
    diffStat,
    date: created.date,
    time: created.time,
    status: mapState(String(mr.state ?? 'opened'), String(mr.merged_at ?? '')),
    labels,
  };
}

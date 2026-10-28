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
}

const CFG_KEY = 'changeflow.gitlab';

export function loadGitLabConfig(): GitLabConfig {
  try {
    const raw = localStorage.getItem(CFG_KEY);
    if (raw) return JSON.parse(raw) as GitLabConfig;
  } catch { /* ignore */ }
  return { baseUrl: 'https://gitlab.azerishiq.az', token: '', project: '' };
}

export function saveGitLabConfig(c: GitLabConfig): void {
  localStorage.setItem(CFG_KEY, JSON.stringify(c));
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
    // diff statistika tam dəqiq olmaya bilər — sətir sayı təxmini
  }
  const diffStat = files ? `${files} fayl, ${commits.length} commit` : `${commits.length} commit`;
  void added;
  void removed;

  const author = mr.author as Record<string, unknown> | undefined;
  return {
    title: String(mr.title ?? ''),
    description: String(mr.description ?? ''),
    author: String(author?.name ?? ''),
    sourceBranch: String(mr.source_branch ?? ''),
    targetBranch: String(mr.target_branch ?? ''),
    webUrl: String(mr.web_url ?? ''),
    repoUrl: cfg.project.includes('://') ? cfg.project : `${cfg.baseUrl.replace(/\/+$/, '')}/${cfg.project}`,
    commits: commitLines,
    diffStat,
  };
}

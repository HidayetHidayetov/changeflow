import { useState } from 'react';
import { clearDraft, clearHistory } from '../lib/store';
import type { GitLabConfig } from '../lib/gitlab';
import { saveGitLabConfig } from '../lib/gitlab';
import { loadJiraConfig, saveJiraConfig } from '../lib/jira';

const inputCls =
  'w-full rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400';

function H({ children }: { children: React.ReactNode }) {
  return <h3 className="font-bold text-sm mt-4 mb-2 first:mt-0">{children}</h3>;
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-2 text-sm">
      <span className="text-slate-600 dark:text-slate-300">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export default function Settings(props: {
  open: boolean;
  onClose: () => void;
  orgName: string;
  onOrgName: (v: string) => void;
  onLogo: (f: File | undefined) => void;
  onLogoReset: () => void;
  gl: GitLabConfig;
  onGl: (v: GitLabConfig) => void;
  onDataChange: () => void;
}) {
  const [jira, setJira] = useState(loadJiraConfig());
  if (!props.open) return null;

  const setGl = (patch: Partial<GitLabConfig>) => {
    const v = { ...props.gl, ...patch };
    props.onGl(v);
    saveGitLabConfig(v);
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={props.onClose}>
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-auto rounded-xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-white/10 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-1">
          <h2 className="font-bold text-lg">Ayarlar / Settings</h2>
          <div className="flex-1" />
          <button onClick={props.onClose} className="px-3 py-1 rounded-lg border border-slate-300 dark:border-white/10">Bağla</button>
        </div>

        <H>Ümumi / General</H>
        <F label="Təşkilat adı">
          <input className={inputCls} value={props.orgName} onChange={(e) => props.onOrgName(e.target.value)} />
        </F>
        <div className="flex gap-2 text-sm">
          <label className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/10 cursor-pointer">
            Logo yüklə
            <input type="file" accept="image/*" className="hidden" onChange={(e) => props.onLogo(e.target.files?.[0])} />
          </label>
          <button onClick={props.onLogoReset} className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/10">Default qızıl loqo</button>
        </div>

        <H>GitLab inteqrasiyası</H>
        <F label="Base URL">
          <input className={inputCls} value={props.gl.baseUrl} onChange={(e) => setGl({ baseUrl: e.target.value })} placeholder="https://gitlab.azerishiq.az" />
        </F>
        <F label="Private token (yalnız bu cihazda saxlanılır)">
          <input type="password" className={inputCls} value={props.gl.token} onChange={(e) => setGl({ token: e.target.value })} placeholder="glpat-..." />
        </F>
        <F label="Default layihə (qrup/altqrup/layihə və ya ID)">
          <input className={inputCls} value={props.gl.project} onChange={(e) => setGl({ project: e.target.value })} placeholder="programming-team/e-services/emios" />
        </F>

        <H>
          Jira inteqrasiyası{' '}
          <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">Faza-3</span>
        </H>
        <div className="opacity-60 pointer-events-none">
          <F label="Base URL">
            <input className={inputCls} value={jira.baseUrl} onChange={(e) => { const v = { ...jira, baseUrl: e.target.value }; setJira(v); saveJiraConfig(v); }} placeholder="https://jira.sirket.az" />
          </F>
          <div className="grid grid-cols-2 gap-2">
            <F label="Email">
              <input className={inputCls} value={jira.email} onChange={(e) => { const v = { ...jira, email: e.target.value }; setJira(v); saveJiraConfig(v); }} />
            </F>
            <F label="API token">
              <input type="password" className={inputCls} value={jira.token} onChange={(e) => { const v = { ...jira, token: e.target.value }; setJira(v); saveJiraConfig(v); }} />
            </F>
          </div>
          <F label="Layihə açarı">
            <input className={inputCls} value={jira.projectKey} onChange={(e) => { const v = { ...jira, projectKey: e.target.value }; setJira(v); saveJiraConfig(v); }} placeholder="EMIOS" />
          </F>
        </div>
        <p className="text-xs text-slate-500">Jira bağlantısı Faza-3-də aktivləşəcək (issue-dən sahə doldurma).</p>

        <H>Məlumat / Data</H>
        <div className="flex gap-2 text-sm">
          <button
            className="px-3 py-1.5 rounded-lg border border-red-300 text-red-600"
            onClick={() => {
              if (confirm('Tarixçə silinsin?')) {
                clearHistory();
                props.onDataChange();
              }
            }}
          >
            Tarixçəni sil
          </button>
          <button
            className="px-3 py-1.5 rounded-lg border border-red-300 text-red-600"
            onClick={() => {
              if (confirm('Qaralama sıfırlansın?')) {
                clearDraft();
                window.location.reload();
              }
            }}
          >
            Qaralamanı sıfırla
          </button>
        </div>
      </div>
    </div>
  );
}

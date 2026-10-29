import { useEffect, useRef, useState } from 'react';
import { clearDraft } from '../lib/store';
import { clearHistory, exportBackup, importBackup } from '../lib/history';
import type { GitLabConfig } from '../lib/gitlab';
import { saveGitLabConfig, testConnection } from '../lib/gitlab';
import { loadJiraConfig, saveJiraConfig } from '../lib/jira';
import { getSecret, isDesktop, setSecret } from '../lib/secrets';
import { loadProfiles, newProfileId, saveProfiles, type ProjectProfile } from '../lib/profiles';
import { t, type Lang } from '../lib/i18n';

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
  lang: Lang;
  onClose: () => void;
  orgName: string;
  onOrgName: (v: string) => void;
  onLogo: (f: File | undefined) => void;
  onLogoReset: () => void;
  gl: GitLabConfig;
  onGl: (v: GitLabConfig) => void;
  onDataChange: () => void;
  version: string;
  onCheckUpdate: () => void;
  updateMsg: string;
}) {
  const [jira, setJira] = useState(loadJiraConfig());
  const [connMsg, setConnMsg] = useState('');
  const [connLoading, setConnLoading] = useState(false);
  const [backupMsg, setBackupMsg] = useState('');
  const [profiles, setProfiles] = useState<ProjectProfile[]>(() => loadProfiles());
  const [np, setNp] = useState({ projectPath: '', system: '', subsystem: '', modules: '', testEnv: 'stage' });
  const fileRef = useRef<HTMLInputElement>(null);
  const hydrated = useRef(false);
  useEffect(() => {
    if (!props.open || hydrated.current || !isDesktop()) return;
    hydrated.current = true;
    getSecret('gitlab-token').then((tk) => {
      if (tk) props.onGl({ ...props.gl, token: tk });
    }).catch(() => undefined);
    getSecret('jira-token').then((tk) => {
      if (tk) setJira((j) => ({ ...j, token: tk }));
    }).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.open]);
  if (!props.open) return null;
  const lang = props.lang;

  const setGl = (patch: Partial<GitLabConfig>) => {
    const v = { ...props.gl, ...patch };
    props.onGl(v);
    saveGitLabConfig(v);
    if (patch.token !== undefined) setSecret('gitlab-token', patch.token);
  };

  const doExportBackup = async () => {
    const json = await exportBackup();
    const name = `changeflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    if (isDesktop()) {
      try {
        const { save } = await import('@tauri-apps/plugin-dialog');
        const path = await save({ defaultPath: name, filters: [{ name: 'JSON', extensions: ['json'] }] });
        if (!path) return;
        const { writeFile } = await import('@tauri-apps/plugin-fs');
        await writeFile(path, new TextEncoder().encode(json));
        setBackupMsg(path);
        return;
      } catch {
        /* fallback */
      }
    }
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    setBackupMsg(name);
  };

  const doImportBackup = async (file: File | undefined) => {
    if (!file) return;
    try {
      const r = await importBackup(await file.text());
      if (r.ok) {
        props.onDataChange();
        setBackupMsg(`${r.count} ${t(lang, 'sBackupOk')}`);
      } else {
        setBackupMsg(`${t(lang, 'sBackupFail')}: ${r.error ?? ''}`);
      }
    } catch {
      setBackupMsg(t(lang, 'sBackupFail'));
    }
  };

  const doTestConnection = async () => {
    setConnLoading(true);
    setConnMsg(t(lang, 'sTesting'));
    try {
      const r = await testConnection(props.gl);
      setConnMsg(`${t(lang, 'sConnOk')}: ${r.user}${r.project ? ` • ${r.project}` : ''}`);
    } catch (e) {
      setConnMsg(`${t(lang, 'sConnFail')}: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setConnLoading(false);
    }
  };
  const setJr = (patch: Partial<typeof jira>) => {
    const v = { ...jira, ...patch };
    setJira(v);
    saveJiraConfig(v);
    if (patch.token !== undefined) setSecret('jira-token', patch.token ?? '');
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={props.onClose}>
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-auto rounded-xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-white/10 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-1">
          <h2 className="font-bold text-lg">{t(lang, 'sTitle')}</h2>
          <div className="flex-1" />
          <button onClick={props.onClose} className="px-3 py-1 rounded-lg border border-slate-300 dark:border-white/10">{t(lang, 'sClose')}</button>
        </div>

        <H>{t(lang, 'sGeneral')}</H>
        <F label={t(lang, 'sOrg')}>
          <input className={inputCls} value={props.orgName} onChange={(e) => props.onOrgName(e.target.value)} />
        </F>
        <div className="flex gap-2 text-sm">
          <label className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/10 cursor-pointer">
            {t(lang, 'sLogoUp')}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => props.onLogo(e.target.files?.[0])} />
          </label>
          <button onClick={props.onLogoReset} className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/10">{t(lang, 'sLogoDef')}</button>
        </div>

        <H>{t(lang, 'sGitlab')}</H>
        <F label={t(lang, 'sBase')}>
          <input className={inputCls} value={props.gl.baseUrl} onChange={(e) => setGl({ baseUrl: e.target.value })} placeholder="https://gitlab.azerishiq.az" />
        </F>
        <F label={t(lang, 'sToken')}>
          <input type="password" className={inputCls} value={props.gl.token} onChange={(e) => setGl({ token: e.target.value })} placeholder="glpat-..." />
        </F>
        <F label={t(lang, 'sProject')}>
          <input className={inputCls} value={props.gl.project} onChange={(e) => setGl({ project: e.target.value })} placeholder="programming-team/e-services/emios" />
        </F>
        <div className="flex items-center gap-2 text-sm">
          <button onClick={doTestConnection} disabled={connLoading} className="btn-primary px-3 py-1.5 rounded-lg disabled:opacity-50">
            {connLoading ? t(lang, 'sTesting') : t(lang, 'sTestConn')}
          </button>
          {connMsg && <span className="text-xs text-slate-500 break-all">{connMsg}</span>}
        </div>

        <H>{t(lang, 'sProfiles')}</H>
        <p className="text-xs text-slate-500 mb-2">{t(lang, 'sProfHint')}</p>
        {profiles.length === 0 && <p className="text-xs text-slate-500 mb-2">{t(lang, 'sProfEmpty')}</p>}
        <ul className="space-y-1 mb-2 text-sm">
          {profiles.map((p) => (
            <li key={p.id} className="flex items-center gap-2 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1.5">
              <div className="flex-1 min-w-0">
                <div className="font-mono text-xs truncate">{p.projectPath}</div>
                <div className="text-xs text-slate-500 truncate">{[p.system, p.subsystem, p.testEnv].filter(Boolean).join(' • ')}</div>
              </div>
              <button
                className="text-xs text-red-600"
                onClick={() => {
                  const v = profiles.filter((x) => x.id !== p.id);
                  setProfiles(v);
                  saveProfiles(v);
                }}
              >
                {t(lang, 'sProfDelete')}
              </button>
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-2 gap-2">
          <F label={t(lang, 'sProject')}>
            <input className={inputCls} value={np.projectPath} onChange={(e) => setNp({ ...np, projectPath: e.target.value })} placeholder="programming-team/e-services/emios" />
          </F>
          <F label={t(lang, 'fTestEnv')}>
            <select className={inputCls} value={np.testEnv} onChange={(e) => setNp({ ...np, testEnv: e.target.value })}>
              <option>dev</option><option>stage</option><option>prod</option>
            </select>
          </F>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <F label={t(lang, 'fSystem')}>
            <input className={inputCls} value={np.system} onChange={(e) => setNp({ ...np, system: e.target.value })} />
          </F>
          <F label={t(lang, 'fSubsystem')}>
            <input className={inputCls} value={np.subsystem} onChange={(e) => setNp({ ...np, subsystem: e.target.value })} />
          </F>
          <F label={t(lang, 'fModules')}>
            <input className={inputCls} value={np.modules} onChange={(e) => setNp({ ...np, modules: e.target.value })} />
          </F>
        </div>
        <button
          className="btn-primary px-3 py-1.5 rounded-lg text-sm disabled:opacity-50"
          disabled={!np.projectPath.trim()}
          onClick={() => {
            const v = [...profiles, { ...np, projectPath: np.projectPath.trim(), id: newProfileId() }];
            setProfiles(v);
            saveProfiles(v);
            setNp({ projectPath: '', system: '', subsystem: '', modules: '', testEnv: 'stage' });
          }}
        >
          {t(lang, 'sProfAdd')}
        </button>

        <H>
          {t(lang, 'sJira')}{' '}
          <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">Faza-3</span>
        </H>
        <div className="opacity-60 pointer-events-none">
          <F label={t(lang, 'sJBase')}>
            <input className={inputCls} value={jira.baseUrl} onChange={(e) => setJr({ baseUrl: e.target.value })} placeholder="https://jira.sirket.az" />
          </F>
          <div className="grid grid-cols-2 gap-2">
            <F label={t(lang, 'sJEmail')}>
              <input className={inputCls} value={jira.email} onChange={(e) => setJr({ email: e.target.value })} />
            </F>
            <F label={t(lang, 'sJToken')}>
              <input type="password" className={inputCls} value={jira.token} onChange={(e) => setJr({ token: e.target.value })} />
            </F>
          </div>
          <F label={t(lang, 'sJKey')}>
            <input className={inputCls} value={jira.projectKey} onChange={(e) => setJr({ projectKey: e.target.value })} placeholder="EMIOS" />
          </F>
        </div>
        <p className="text-xs text-slate-500">{t(lang, 'sJNote')}</p>

        <H>{t(lang, 'sData')}</H>
        <div className="flex flex-wrap gap-2 text-sm">
          <button onClick={doExportBackup} className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/10">
            {t(lang, 'sExportAll')}
          </button>
          <label className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/10 cursor-pointer">
            {t(lang, 'sImport')}
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { doImportBackup(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
        </div>
        {backupMsg && <p className="text-xs text-slate-500 mt-1 break-all">{backupMsg}</p>}
        <F label={t(lang, 'sVersion')}>
          <div className="flex items-center gap-2">
            <span className="text-sm">{props.version || '…'}</span>
            <button onClick={props.onCheckUpdate} className="px-3 py-1 text-sm rounded-lg border border-slate-300 dark:border-white/10">{t(lang, 'sCheckUpd')}</button>
            {props.updateMsg && <span className="text-xs text-slate-500">{props.updateMsg}</span>}
          </div>
        </F>
        <div className="flex gap-2 text-sm">
          <button
            className="px-3 py-1.5 rounded-lg border border-red-300 text-red-600"
            onClick={async () => {
              if (confirm(t(lang, 'sConfirmH'))) {
                await clearHistory();
                props.onDataChange();
              }
            }}
          >
            {t(lang, 'sClearH')}
          </button>
          <button
            className="px-3 py-1.5 rounded-lg border border-red-300 text-red-600"
            onClick={() => {
              if (confirm(t(lang, 'sConfirmD'))) {
                clearDraft();
                window.location.reload();
              }
            }}
          >
            {t(lang, 'sClearD')}
          </button>
        </div>
      </div>
    </div>
  );
}

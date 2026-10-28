import { useEffect, useRef, useState } from 'react';
import { clearDraft, clearHistory } from '../lib/store';
import type { GitLabConfig } from '../lib/gitlab';
import { saveGitLabConfig } from '../lib/gitlab';
import { loadJiraConfig, saveJiraConfig } from '../lib/jira';
import { getSecret, isDesktop, setSecret } from '../lib/secrets';
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
            onClick={() => {
              if (confirm(t(lang, 'sConfirmH'))) {
                clearHistory();
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

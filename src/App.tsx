import { useEffect, useMemo, useState } from 'react';
import { emptyRequest, validate, type ChangeRequest } from './types';
import { loadConfig, nextId, peekNextId, projectCode, saveConfig, saveToHistory, listHistory, loadDoc } from './lib/store';
import { exportDocx } from './lib/docxBuilder';
import { fetchMR, loadGitLabConfig } from './lib/gitlab';
import Settings from './components/Settings';
import { loadLang, saveLang, t, type Lang } from './lib/i18n';

type Tab = 'esas' | 'git' | 'tesir' | 'rollback';
const DRAFT_KEY = 'changeflow.draft';

const inputCls =
  'w-full rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400';

function loadDraft(): ChangeRequest | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as ChangeRequest) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [form, setForm] = useState<ChangeRequest>(() => loadDraft() ?? emptyRequest(peekNextId()));
  const [tab, setTab] = useState<Tab>('esas');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [errors, setErrors] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>(() => listHistory());
  const [cfg, setCfg] = useState(() => loadConfig());
  const [gl, setGl] = useState(() => loadGitLabConfig());
  const [glStatus, setGlStatus] = useState('');
  const [glLoading, setGlLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lang, setLang] = useState<Lang>(() => loadLang());
  const [appVersion, setAppVersion] = useState('');
  const [updateInfo, setUpdateInfo] = useState<{ version: string; body?: string } | null>(null);
  const [updateMsg, setUpdateMsg] = useState('');
  const orgLogo = useMemo(() => cfg.logoDataUrl || '/logo-gold.svg', [cfg.logoDataUrl]);

  const runUpdateCheck = async (silent: boolean) => {
    try {
      const { isDesktop } = await import('./lib/secrets');
      if (!isDesktop()) return;
      const { getVersion } = await import('@tauri-apps/api/app');
      setAppVersion(await getVersion());
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();
      if (update) {
        setUpdateInfo({ version: update.version, body: update.body });
      } else if (!silent) {
        setUpdateMsg(t(lang, 'updLatest'));
      }
    } catch {
      if (!silent) setUpdateMsg(t(lang, 'updError'));
    }
  };

  const installUpdate = async () => {
    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();
      if (!update) return;
      setUpdateMsg('0%');
      await update.downloadAndInstall((e) => {
        if (e.event === 'Progress') setUpdateMsg('…');
        if (e.event === 'Finished') setUpdateMsg(t(lang, 'loading'));
      });
    } catch {
      setUpdateMsg(t(lang, 'updError'));
    }
  };

  useEffect(() => {
    runUpdateCheck(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function Field(props: { label: string; en: string; children: React.ReactNode }) {
    const primary = lang === 'az' ? props.label : props.en;
    const secondary = lang === 'az' ? props.en : props.label;
    return (
      <label className="block mb-3">
        <span className="block text-sm font-medium text-slate-600 dark:text-slate-300">
          {primary} <span className="text-xs text-slate-400">/ {secondary}</span>
        </span>
        <div className="mt-1">{props.children}</div>
      </label>
    );
  }

  const switchLang = (l: Lang) => {
    setLang(l);
    saveLang(l);
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    setForm((f) => ({ ...f, orgName: f.orgName || cfg.orgName }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { isDesktop, migrateLocalSecrets, getSecret } = await import('./lib/secrets');
        if (!isDesktop()) return;
        await migrateLocalSecrets();
        const tk = await getSecret('gitlab-token');
        if (tk) setGl((g) => (g.token ? g : { ...g, token: tk }));
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch { /* ignore */ }
  }, [form]);

  const set = <K extends keyof ChangeRequest>(k: K, v: ChangeRequest[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const doValidate = () => {
    const e = validate(form, lang);
    setErrors(e);
    return e.length === 0;
  };

  const handleExportDocx = async () => {
    if (!doValidate()) return;
    saveToHistory(form.id, form);
    setHistory(listHistory());
    await exportDocx(form);
  };

  const handlePrint = () => {
    if (!doValidate()) return;
    saveToHistory(form.id, form);
    setHistory(listHistory());
    document.title = form.id;
    window.print();
  };

  const handleNew = () => {
    const n = emptyRequest(nextId());
    n.orgName = form.orgName;
    setForm(n);
    setErrors([]);
  };

  const handleLogo = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const c = { orgName: form.orgName, logoDataUrl: String(reader.result ?? ''), theme: 'system' as const };
      saveConfig(c);
      setCfg(c);
    };
    reader.readAsDataURL(file);
  };

  const resetLogo = () => {
    const c = { orgName: form.orgName, logoDataUrl: '', theme: 'system' as const };
    saveConfig(c);
    setCfg(c);
  };

  const openHistory = (id: string) => {
    const d = loadDoc(id) as ChangeRequest | null;
    if (d) {
      setForm(d);
      setErrors([]);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] dark:bg-[#0A0E14] text-slate-900 dark:text-slate-100">
      {/* TopBar */}
      <header className="no-print sticky top-0 z-10 border-b border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#0A0E14]/90 backdrop-blur px-4 py-2 flex items-center gap-3">
        <img src="/app-logo.svg" alt="ChangeFlow" className="w-8 h-8 rounded-lg" />
        <div>
          <div className="font-bold leading-none">ChangeFlow</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">{t(lang, 'tag')} • {form.id}</div>
        </div>
        <div className="flex-1" />
        <img src={orgLogo} alt="org" className="h-7 object-contain max-w-[140px]" title={form.orgName} />
        <div className="flex rounded-lg border border-slate-300 dark:border-white/10 overflow-hidden text-sm">
          <button onClick={() => switchLang('az')} className={`px-2 py-1.5 ${lang === 'az' ? 'bg-[#1D4ED8] text-white' : ''}`}>AZ</button>
          <button onClick={() => switchLang('en')} className={`px-2 py-1.5 ${lang === 'en' ? 'bg-[#1D4ED8] text-white' : ''}`}>EN</button>
        </div>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-white/10" title="Dark/Light">
          {theme === 'dark' ? t(lang, 'light') : t(lang, 'dark')}
        </button>
        <button onClick={() => setSettingsOpen(true)} className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-white/10">{t(lang, 'settings')}</button>
        <button onClick={handleNew} className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-white/10">{t(lang, 'newDoc')}</button>
        <button onClick={handleExportDocx} className="btn-primary px-3 py-1.5 text-sm rounded-lg">{t(lang, 'wordBtn')}</button>
        <button onClick={handlePrint} className="px-3 py-1.5 text-sm rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">{t(lang, 'printBtn')}</button>
      </header>
      <Settings
        open={settingsOpen}
        lang={lang}
        onClose={() => setSettingsOpen(false)}
        orgName={form.orgName}
        onOrgName={(v) => {
          setForm((f) => ({ ...f, orgName: v }));
          const c = { orgName: v, logoDataUrl: cfg.logoDataUrl, theme: 'system' as const };
          saveConfig(c);
          setCfg(c);
        }}
        onLogo={handleLogo}
        onLogoReset={resetLogo}
        gl={gl}
        onGl={setGl}
        onDataChange={() => setHistory(listHistory())}
        version={appVersion}
        onCheckUpdate={() => runUpdateCheck(false)}
        updateMsg={updateMsg}
      />
      {updateInfo && (
        <div className="no-print mx-4 mt-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-300 p-3 text-sm flex items-center gap-3">
          <b>{t(lang, 'updAvailable')}: {updateInfo.version}</b>
          {updateInfo.body && <span className="text-xs text-slate-500 line-clamp-1">{updateInfo.body.slice(0, 120)}</span>}
          <div className="flex-1" />
          <button onClick={installUpdate} className="btn-primary px-3 py-1 text-sm rounded-lg">{t(lang, 'updInstall')}</button>
          <button onClick={() => setUpdateInfo(null)} className="px-3 py-1 text-sm rounded-lg border">{t(lang, 'updClose')}</button>
        </div>
      )}

      {errors.length > 0 && (
        <div className="no-print mx-4 mt-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-300 p-3 text-sm">
          <b>{t(lang, 'fixTitle')}</b>
          <ul className="list-disc ml-5">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 p-4">
        {/* Form */}
        <section className="no-print w-full lg:w-[480px] shrink-0 rounded-xl bg-white dark:bg-[#11161F] border border-slate-200 dark:border-white/10 p-4">
          <div className="flex gap-1 mb-4 text-sm">
            {(['esas', 'git', 'tesir', 'rollback'] as Tab[]).map((tb) => (
              <button key={tb} onClick={() => setTab(tb)}
                className={`px-3 py-1.5 rounded-lg ${tab === tb ? 'bg-[#1D4ED8] text-white font-semibold' : 'bg-slate-100 dark:bg-white/5'}`}>
                {tb === 'esas' ? t(lang, 'tabMain') : tb === 'git' ? t(lang, 'tabGit') : tb === 'tesir' ? t(lang, 'tabImpact') : 'Rollback'}
              </button>
            ))}
          </div>

          {tab === 'esas' && (
            <>
              <Field label="Təşkilat" en="Organization"><input className={inputCls} value={form.orgName} onChange={(e) => set('orgName', e.target.value)} /></Field>
              <Field label="Dəyişiklik adı" en="Title"><input className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} /></Field>
              <Field label="Xülasə" en="Summary (blankda başlıq altı)"><input className={inputCls} value={form.summary} onChange={(e) => set('summary', e.target.value)} placeholder="Boşdursa başlıq yazılır" /></Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Layihə" en="Project"><input className={inputCls} value={form.project} onChange={(e) => set('project', e.target.value)} /></Field>
                <Field label="Status" en="Status">
                  <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
                    <option value="Layihə">{t(lang, 'stDraft')}</option><option value="Təsdiq gözləyir">{t(lang, 'stPending')}</option><option value="Təsdiqlənib">{t(lang, 'stApproved')}</option><option value="İmtina">{t(lang, 'stRejected')}</option>
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Tarix" en="Date"><input type="date" className={inputCls} value={form.date} onChange={(e) => set('date', e.target.value)} /></Field>
                <Field label="Vaxt" en="Time"><input type="time" className={inputCls} value={form.time} onChange={(e) => set('time', e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Növ" en="Type">
                  <select className={inputCls} value={form.type} onChange={(e) => set('type', e.target.value as ChangeRequest['type'])}>
                    <option>Standard</option><option>Normal</option><option>Emergency</option>
                  </select>
                </Field>
                <Field label="Vaciblik" en="Urgency">
                  <select className={inputCls} value={form.urgency} onChange={(e) => set('urgency', e.target.value as ChangeRequest['urgency'])}>
                    <option value="Aşağı">{t(lang, 'optLow')}</option><option value="Orta">{t(lang, 'optMid')}</option><option value="Yüksək">{t(lang, 'optHigh')}</option>
                  </select>
                </Field>
                <Field label="Risk" en="Risk">
                  <select className={inputCls} value={form.risk} onChange={(e) => set('risk', e.target.value as ChangeRequest['risk'])}>
                    <option value="Aşağı">{t(lang, 'optLow')}</option><option value="Orta">{t(lang, 'optMid')}</option><option value="Yüksək">{t(lang, 'optHigh')}</option>
                  </select>
                </Field>
              </div>
              <Field label="Müəllif" en="Author"><input className={inputCls} value={form.author} onChange={(e) => set('author', e.target.value)} placeholder="Ad Soyad" /></Field>
              <Field label="Risk qeydi" en="Risk note"><input className={inputCls} value={form.riskNote} onChange={(e) => set('riskNote', e.target.value)} /></Field>
              <Field label="Təsvir" en="Description"><textarea rows={4} className={inputCls} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
              <Field label="Səbəb" en="Reason"><textarea rows={3} className={inputCls} value={form.reason} onChange={(e) => set('reason', e.target.value)} /></Field>
              <Field label="Əlavə qeyd" en="Notes"><textarea rows={2} className={inputCls} value={form.extra} onChange={(e) => set('extra', e.target.value)} /></Field>
            </>
          )}

          {tab === 'git' && (
            <>
              <Field label="Repo URL" en="Repository"><input className={inputCls} value={form.repoUrl} onChange={(e) => set('repoUrl', e.target.value)} placeholder="https://gitlab.../emios-webapp" /></Field>
              <Field label="MR link" en="MR URL"><input className={inputCls} value={form.mrUrl} onChange={(e) => set('mrUrl', e.target.value)} /></Field>
              <div className="grid grid-cols-3 gap-2">
                <Field label="MR IID" en="IID"><input className={inputCls} value={form.mrIid} onChange={(e) => set('mrIid', e.target.value)} placeholder="!142" /></Field>                <Field label="Source" en="Source branch"><input className={inputCls} value={form.sourceBranch} onChange={(e) => set('sourceBranch', e.target.value)} /></Field>
                <Field label="Target" en="Target branch"><input className={inputCls} value={form.targetBranch} onChange={(e) => set('targetBranch', e.target.value)} /></Field>
              </div>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 -mt-1 mb-2">{t(lang, 'dupWarn')}</p>
              <Field label="Commit-lər" en="Commits"><textarea rows={3} className={inputCls} value={form.commits} onChange={(e) => set('commits', e.target.value)} placeholder="abc1234 mesaj" /></Field>
              <Field label="Diff stat" en="Diff"><input className={inputCls} value={form.diffStat} onChange={(e) => set('diffStat', e.target.value)} placeholder="+123/-45, 6 fayl" /></Field>
              <div className="mt-2 rounded-lg border border-slate-200 dark:border-white/10 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <b className="text-sm">{t(lang, 'fetchTitle')}</b>
                  <div className="flex-1" />
                  <button className="text-xs text-blue-600 underline" onClick={() => setSettingsOpen(true)}>{t(lang, 'settings')}</button>
                </div>
                <div className="text-xs text-slate-500 mb-2">{gl.baseUrl} • {gl.project || t(lang, 'noProject')}{gl.project ? ` — ${t(lang, 'changeInSettings')}` : ''}</div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={glLoading}
                    className="btn-primary px-3 py-1.5 text-sm rounded-lg disabled:opacity-50"
                    onClick={async () => {
                      const missing: string[] = [];
                      if (!gl.token) missing.push('Token');
                      if (!gl.project) missing.push(t(lang, 'sProject').split(' (')[0]);
                      if (!form.mrIid) missing.push('MR IID');
                      if (missing.length > 0) {
                        setGlStatus(`${t(lang, 'missing')}: ${missing.join(', ')}`);
                        return;
                      }
                      setGlLoading(true);
                      setGlStatus(t(lang, 'loading'));
                      try {
                        const info = await fetchMR(gl, form.mrIid);
                        const cleanIid = form.mrIid.replace(/^!/, '').trim();
                        const docId = `${projectCode(gl.project)}-${cleanIid}`;
                        setForm((f) => ({
                          ...f,
                          id: docId,
                          title: f.title || info.title,
                          repoUrl: f.repoUrl || info.repoUrl,
                          mrUrl: info.webUrl || f.mrUrl,
                          sourceBranch: info.sourceBranch || f.sourceBranch,
                          targetBranch: info.targetBranch || f.targetBranch,
                          commits: info.commits || f.commits,
                          diffStat: info.diffStat || f.diffStat,
                          author: f.author || info.author,
                          date: info.date || f.date,
                          time: info.time || f.time,
                          status: info.status || f.status,
                        }));
                        setGlStatus(`OK — ID: ${docId}, ${t(lang, 'okFetched')}`);
                      } catch (e) {
                        setGlStatus(`${t(lang, 'errFetch')}: ${e instanceof Error ? e.message : String(e)}`);
                      } finally {
                        setGlLoading(false);
                      }
                    }}
                  >
                    {glLoading ? t(lang, 'loading') : t(lang, 'fetchBtn')}
                  </button>
                  {glStatus && <span className="text-xs text-slate-500">{glStatus}</span>}
                </div>
                <p className="text-[11px] text-slate-500 mt-2">{t(lang, 'tokenLocal')}</p>
              </div>
            </>
          )}

          {tab === 'tesir' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Sistem" en="System"><input className={inputCls} value={form.system} onChange={(e) => set('system', e.target.value)} /></Field>
                <Field label="Alt sistem" en="Subsystem"><input className={inputCls} value={form.subsystem} onChange={(e) => set('subsystem', e.target.value)} /></Field>
              </div>
              <Field label="Modullar" en="Modules"><input className={inputCls} value={form.modules} onChange={(e) => set('modules', e.target.value)} /></Field>
              <Field label="İstifadəçi təsiri" en="User impact"><input className={inputCls} value={form.userImpact} onChange={(e) => set('userImpact', e.target.value)} /></Field>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Downtime?" en="Downtime">
                  <select className={inputCls} value={form.downtime} onChange={(e) => set('downtime', e.target.value)}>
                    <option value="Xeyr">{t(lang, 'no')}</option><option value="Bəli">{t(lang, 'yes')}</option>
                  </select>
                </Field>
                <Field label="Müddət" en="Duration"><input className={inputCls} value={form.downtimeDuration} onChange={(e) => set('downtimeDuration', e.target.value)} /></Field>
                <Field label="Vaxt (dəq)" en="Spent min"><input type="number" className={inputCls} value={form.spentMinutes} onChange={(e) => set('spentMinutes', Number(e.target.value))} /></Field>
              </div>
              <Field label="Test mühiti" en="Env">
                <select className={inputCls} value={form.testEnv} onChange={(e) => set('testEnv', e.target.value)}>
                  <option>dev</option><option>stage</option><option>prod</option>
                </select>
              </Field>
              <Field label="Test addımları" en="Steps"><textarea rows={3} className={inputCls} value={form.testSteps} onChange={(e) => set('testSteps', e.target.value)} /></Field>
              <Field label="Gözlənilən" en="Expected"><textarea rows={2} className={inputCls} value={form.testExpected} onChange={(e) => set('testExpected', e.target.value)} /></Field>
              <Field label="Faktiki" en="Actual"><textarea rows={2} className={inputCls} value={form.testActual} onChange={(e) => set('testActual', e.target.value)} /></Field>
            </>
          )}

          {tab === 'rollback' && (
            <>
              <Field label="Geri dönmə addımları" en="Rollback steps"><textarea rows={5} className={inputCls} value={form.rollbackSteps} onChange={(e) => set('rollbackSteps', e.target.value)} /></Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Məsul" en="Owner"><input className={inputCls} value={form.rollbackOwner} onChange={(e) => set('rollbackOwner', e.target.value)} /></Field>
                <Field label="Bərpa vaxtı" en="ETA"><input className={inputCls} value={form.rollbackEta} onChange={(e) => set('rollbackEta', e.target.value)} /></Field>
              </div>
              <p className="text-xs text-slate-500 mt-2">{t(lang, 'draftNote')}</p>
              {history.length > 0 && (
                <div className="mt-3 text-sm">
                  <b>{t(lang, 'historyTitle')}</b>
                  <ul className="mt-1 max-h-32 overflow-auto border border-slate-200 dark:border-white/10 rounded-lg p-2">
                    {history.map((h) => (
                      <li key={h}><button className="text-[#4F8FF7] underline" onClick={() => openHistory(h)}>{h}</button></li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </section>

        {/* Preview */}
        <section className="flex-1 flex justify-center overflow-auto">
          <div id="a4-preview" className="shadow-xl p-[12mm] text-[10.5pt] leading-relaxed">
            <div className="text-center font-bold text-[13pt] mb-1">DƏYİŞİKLİKLƏRİN İDARƏ EDİLMƏSİ BLANKI</div>
            <div className="flex items-center gap-4 border-b-2 border-black pb-2 mb-2">
              <img src={orgLogo} alt="org logo" className="h-11 object-contain max-w-[200px]" />
              <div className="flex-1 text-right">
                <div className="font-bold">{form.orgName || 'Təşkilat'}</div>
                <div className="text-xs">{form.id} | {form.date} {form.time} | {form.project} | {form.status}</div>
              </div>
            </div>
            {/* Cədvəl 1 */}
            <table className="w-full border-collapse border border-black text-[10pt] mb-2">
              <tbody>
                <tr>
                  <td colSpan={2} className="border border-black p-1 font-bold bg-[#D4E5E5]">DƏYİŞİKLİYİN ADI</td>
                  <td className="border border-black p-1 bg-[#EFF5F4]">{form.title || '—'}</td>
                  <td className="border border-black p-1 font-bold bg-[#D4E5E5]">DƏYİŞİK №.</td>
                  <td className="border border-black p-1">{form.id}</td>
                </tr>
                <tr>
                  <td colSpan={3} rowSpan={2} className="border border-black p-1 align-top bg-[#EFF5F4]">{form.summary || form.title || '—'}</td>
                  <td className="border border-black p-1 font-bold bg-[#D4E5E5]">DƏYİŞİKLİK STATUSU</td>
                  <td className="border border-black p-1">{form.status}</td>
                </tr>
                <tr>
                  <td className="border border-black p-1 font-bold bg-[#D4E5E5]">TARİX</td>
                  <td className="border border-black p-1">{form.date}</td>
                </tr>
                <tr>
                  <td className="border border-black p-1 font-bold bg-[#D4E5E5]">LAYİHƏ</td>
                  <td colSpan={2} className="border border-black p-1 bg-[#EFF5F4]">{form.project || '—'}</td>
                  <td className="border border-black p-1 font-bold bg-[#D4E5E5]">VAXT</td>
                  <td className="border border-black p-1">{form.time}</td>
                </tr>
                <tr>
                  <td className="border border-black p-1 font-bold bg-[#D4E5E5]">REPO / MR LİNKİ</td>
                  <td colSpan={2} className="border border-black p-1 whitespace-pre-wrap bg-[#EFF5F4]">{[form.repoUrl, form.mrUrl && form.mrIid ? `${form.mrUrl} (${form.mrIid})` : form.mrUrl || form.mrIid, form.sourceBranch ? `${form.sourceBranch} → ${form.targetBranch}` : ''].filter(Boolean).join('\n') || '—'}</td>
                  <td className="border border-black p-1 font-bold bg-[#D4E5E5]">SƏRF OLUNAN VAXT</td>
                  <td className="border border-black p-1">{form.spentMinutes ? `${form.spentMinutes} dəqiqə` : '—'}</td>
                </tr>
              </tbody>
            </table>
            {/* Cədvəl 2 */}
            <table className="w-full border-collapse border border-black text-[10pt] mb-2">
              <tbody>
                <tr>
                  <td className="border border-black p-1 font-bold bg-[#EDEDED]">SORĞUNU YARADAN</td>
                  <td className="border border-black p-1 font-bold bg-[#EDEDED]">SORĞU</td>
                  <td className="border border-black p-1 font-bold bg-[#EDEDED]">ƏLAQƏ MƏLUMATI</td>
                </tr>
                <tr>
                  <td className="border border-black p-1">{form.author || '—'}</td>
                  <td className="border border-black p-1">{form.title || '—'}</td>
                  <td className="border border-black p-1">{form.contact || '—'}</td>
                </tr>
              </tbody>
            </table>
            {/* Cədvəl 3 */}
            <table className="w-full border-collapse border border-black text-[10pt] mb-2 text-center">
              <tbody>
                <tr>
                  <td rowSpan={2} className="border border-black p-1 font-bold">SORĞU VACİBLİYİ</td>
                  <td className="border border-black p-1 font-bold bg-[#EFF5F4]">AŞAĞI</td>
                  <td className="border border-black p-1 font-bold bg-[#DDEFED]">ORTA</td>
                  <td className="border border-black p-1 font-bold bg-[#D4E5E5]">YÜKSƏK</td>
                  <td rowSpan={2} className="border border-black p-1 font-bold">DƏYİŞİKLİYİN NÖVÜ</td>
                  <td className="border border-black p-1 font-bold bg-[#E7E7E7]">NORMAL</td>
                  <td className="border border-black p-1 font-bold bg-[#DBDBDB]">EMERGENCY</td>
                </tr>
                <tr>
                  <td className="border border-black p-1 font-bold">{form.urgency === 'Aşağı' ? 'X' : ''}</td>
                  <td className="border border-black p-1 font-bold">{form.urgency === 'Orta' ? 'X' : ''}</td>
                  <td className="border border-black p-1 font-bold">{form.urgency === 'Yüksək' ? 'X' : ''}</td>
                  <td className="border border-black p-1 font-bold">{form.type !== 'Emergency' ? 'X' : ''}</td>
                  <td className="border border-black p-1 font-bold">{form.type === 'Emergency' ? 'X' : ''}</td>
                </tr>
              </tbody>
            </table>
            {/* Cədvəl 4 */}
            <table className="w-full border-collapse border border-black text-[10pt] mb-2">
              <tbody>
                <PrevSection title="DƏYİŞİKLİYİN TƏSVİRİ" />
                <tr><td colSpan={3} className="border border-black p-1"><PrevList text={form.description} /></td></tr>
                {form.extra && (<><PrevSection title="ƏLAVƏ MƏLUMAT" /><tr><td colSpan={3} className="border border-black p-1"><PrevList text={form.extra} /></td></tr></>)}
                <PrevSection title="DƏYİŞİKLİYİN EDİLMƏ SƏBƏBİ" />
                <tr><td colSpan={3} className="border border-black p-1 whitespace-pre-wrap">{form.reason || '—'}</td></tr>
                <PrevSection title="RİSK" />
                <tr><td colSpan={3} className="border border-black p-1">{form.risk}{form.riskNote ? ` — ${form.riskNote}` : ''}</td></tr>
                <PrevSection title={`TEST PLANI (mühit: ${form.testEnv || '—'})`} />
                <tr><td colSpan={3} className="border border-black p-1">
                  <PrevList text={form.testSteps} />
                  <div>Gözlənilən: {form.testExpected || '—'}</div>
                  <div>Faktiki: {form.testActual || '—'}</div>
                </td></tr>
                <PrevSection title="GERİ DÖNMƏ PLANI" />
                <tr><td colSpan={3} className="border border-black p-1 whitespace-pre-wrap">{form.rollbackSteps || '—'}</td></tr>
                <tr>
                  <td rowSpan={4} className="border border-black p-1 font-bold bg-[#D4E5E5]">TƏSİRƏ MƏRUZ QALAN ƏRAZİLƏR</td>
                  <td className="border border-black p-1 font-bold bg-[#EFF5F4]">SİSTEM</td>
                  <td className="border border-black p-1">{[form.system, form.modules].filter(Boolean).join(' — ') || '—'}</td>
                </tr>
                <tr>
                  <td className="border border-black p-1 font-bold bg-[#EFF5F4]">ALT SİSTEM</td>
                  <td className="border border-black p-1">{form.subsystem || '—'}</td>
                </tr>
                <tr>
                  <td className="border border-black p-1 font-bold bg-[#EFF5F4]">DOWNTIME</td>
                  <td className="border border-black p-1">{form.downtime}{form.downtimeDuration ? ` — ${form.downtimeDuration}` : ''}</td>
                </tr>
                <tr>
                  <td className="border border-black p-1 font-bold bg-[#EFF5F4]">İSTİFADƏÇİ TƏSİRİ</td>
                  <td className="border border-black p-1">{form.userImpact || '—'}</td>
                </tr>
              </tbody>
            </table>
            {/* Cədvəl 5 */}
            <table className="w-full border-collapse border border-black text-[10pt]">
              <tbody>
                <tr>
                  <td colSpan={2} className="border border-black p-1 font-bold">QƏRAR</td>
                  <td className="border border-black p-1 font-bold">TƏSDİQLƏYƏNİN ADI VƏ VƏZİFƏSİ</td>
                  <td className="border border-black p-1 font-bold">İMZA</td>
                  <td className="border border-black p-1 font-bold">TARİX</td>
                </tr>
                <tr>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1 bg-[#D4E5E5]">TƏSDİQLƏNİB</td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                </tr>
                <tr>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1 bg-[#EDEDED]">İMTİNA EDİLİB</td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                </tr>
                <tr>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1 bg-[#EFF5F4]">ƏLAVƏ MƏLUMAT TƏLƏB OLUNUR</td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                </tr>
              </tbody>
            </table>
            <div className="mt-2 text-center text-xs text-slate-500">
              {form.id} | {form.orgName} | Səhifə 1/1
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function PrevSection({ title }: { title: string }) {
  return (
    <tr><td colSpan={3} className="border border-black p-1 font-bold bg-[#D4E5E5]">{title}</td></tr>
  );
}

function PrevList({ text }: { text: string }) {
  const items = text.split(/\r?\n/).map((s) => s.replace(/^\s*\d+[.)]\s*/, '').trim()).filter(Boolean);
  if (items.length === 0) return <>—</>;
  return (
    <ol className="list-decimal ml-5">
      {items.map((l, i) => <li key={i}>{l}</li>)}
    </ol>
  );
}

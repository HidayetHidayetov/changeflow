export type Lang = 'az' | 'en';

const LANG_KEY = 'changeflow.lang';

export function loadLang(): Lang {
  try {
    return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'az';
  } catch {
    return 'az';
  }
}

export function saveLang(l: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, l);
  } catch { /* ignore */ }
}

const dict = {
  tag: ['Dəyişiklik sorğusu', 'Change request'],
  light: ['☀️ Light', '☀️ Light'],
  dark: ['🌙 Dark', '🌙 Dark'],
  settings: ['⚙ Ayarlar', '⚙ Settings'],
  newDoc: ['Yeni / New', 'New'],
  wordBtn: ['Word yüklə', 'Download Word'],
  printBtn: ['PDF / Çap et', 'PDF / Print'],
  fixTitle: ['Zəhmət olmasa düzəldin / Fix required:', 'Please fix / Tələb olunur:'],
  tabMain: ['Əsas', 'Main'],
  tabGit: ['Git', 'Git'],
  tabImpact: ['Təsir/Test', 'Impact/Test'],
  tabRollback: ['Rollback', 'Rollback'],
  tabJournal: ['Jurnal', 'Audit log'],
  journalTitle: ['Sənəd jurnalı / Audit trail', 'Document audit trail'],
  journalEmpty: ['Hələ hadisə yoxdur', 'No events yet'],
  evCreated: ['yaradıldı', 'created'],
  evFetch: ['MR-dən alındı', 'fetched from MR'],
  evExport: ['Word ixrac edildi', 'Word exported'],
  evPrint: ['Çapa göndərildi', 'sent to print'],
  evOpened: ['açıldı', 'opened'],
  journalFooter: ['Sənəd jurnalı', 'Audit trail'],
  fOrg: ['Təşkilat|Organization', 'Organization|Təşkilat'],
  fTitle: ['Dəyişiklik adı|Title', 'Title|Başlıq'],
  fSummary: ['Xülasə|Summary (blankda başlıq altı)', 'Summary|Subtitle in doc'],
  fProject: ['Layihə|Project', 'Project|Layihə'],
  fStatus: ['Status|Status', 'Status|Status'],
  fDate: ['Tarix|Date', 'Date|Tarix'],
  fTime: ['Vaxt|Time', 'Time|Vaxt'],
  fType: ['Növ|Type', 'Type|Növ'],
  fUrgency: ['Vaciblik|Urgency', 'Urgency|Vaciblik'],
  fRisk: ['Risk|Risk', 'Risk|Risk'],
  fAuthor: ['Müəllif|Author', 'Author|Müəllif'],
  fRiskNote: ['Risk qeydi|Risk note', 'Risk note|Risk qeydi'],
  fDesc: ['Təsvir|Description', 'Description|Təsvir'],
  fReason: ['Səbəb|Reason', 'Reason|Səbəb'],
  fNotes: ['Əlavə qeyd|Notes', 'Notes|Əlavə'],
  fRepo: ['Repo URL|Repository', 'Repository|Repo URL'],
  fMrUrl: ['MR link|MR URL', 'MR URL|MR link'],
  fMrIid: ['MR IID|IID', 'MR IID|IID'],
  fSource: ['Source|Source branch', 'Source branch|Source'],
  fTarget: ['Target|Target branch', 'Target branch|Target'],
  fCommits: ['Commit-lər|Commits', 'Commits|Commit-lər'],
  fDiff: ['Diff stat|Diff', 'Diff stat|Diff'],
  fSystem: ['Sistem|System', 'System|Sistem'],
  fSubsystem: ['Alt sistem|Subsystem', 'Subsystem|Alt sistem'],
  fModules: ['Modullar|Modules', 'Modules|Modullar'],
  fUserImpact: ['İstifadəçi təsiri|User impact', 'User impact|İstifadəçi təsiri'],
  fDowntime: ['Downtime?|Downtime', 'Downtime?|Downtime'],
  fDuration: ['Müddət|Duration', 'Duration|Müddət'],
  fSpent: ['Vaxt (dəq)|Spent min', 'Spent (min)|Vaxt'],
  fTestEnv: ['Test mühiti|Env', 'Test env|Mühit'],
  fSteps: ['Test addımları|Steps', 'Test steps|Addımlar'],
  fExpected: ['Gözlənilən|Expected', 'Expected|Gözlənilən'],
  fActual: ['Faktiki|Actual', 'Actual|Faktiki'],
  fRollback: ['Geri dönmə addımları|Rollback steps', 'Rollback steps|Addımlar'],
  fOwner: ['Məsul|Owner', 'Owner|Məsul'],
  fEta: ['Bərpa vaxtı|ETA', 'Recovery ETA|Vaxt'],
  dupWarn: [
    'Əl ilə açılan nömrə (CR-...) hər cihazda 0001-dən başlayır — təkrar riski var. Unikal nömrə üçün MR-i bağla, ID avtomatik LAYİHƏ-MRIID olacaq.',
    'Manual numbers (CR-...) start at 0001 on every device — duplicates possible. Link an MR for a unique PROJECT-MRIID.',
  ],
  fetchTitle: ['GitLab-dan doldur / Fetch from GitLab', 'Fetch from GitLab'],
  fetchBtn: ['MR-i gətir / Fetch', 'Fetch MR'],
  loading: ['Yüklənir...', 'Loading...'],
  noProject: ['layihə seçilməyib — Ayarlardan əlavə et', 'no project — add in Settings'],
  changeInSettings: ['dəyişmək üçün Ayarlar', 'change in Settings'],
  missing: ['Çatışmır / Missing', 'Missing'],
  tokenLocal: ['Token yalnız bu cihazda saxlanılır, heç yerə göndərilmir (GitLab-dan başqa).', 'Token stays on this device only.'],
  historyTitle: ['Tarixçə / History:', 'History:'],
  histSearch: ['Axtar: ID, başlıq...', 'Search: ID, title...'],
  histAll: ['Hamısı', 'All'],
  histFound: ['tapıldı', 'found'],
  qrScan: ['Skan et — MR linki və hash', 'Scan — MR link & hash'],
  verifyBtn: ['Doğrula', 'Verify'],
  verifyOk: ['Sənəd ixracdan/çapdan sonra dəyişməyib', 'Document unchanged since export/print'],
  verifyChanged: ['DİQQƏT: ixracdan/çapdan sonra dəyişilib', 'WARNING: changed since export/print'],
  verifyNoExport: ['Hələ ixrac/çap qeydi yoxdur', 'No export/print record yet'],
  updAvailable: ['Yeni versiya mövcuddur', 'New version available'],
  updInstall: ['Yüklə və qur', 'Download & install'],
  updClose: ['Bağla', 'Later'],
  updChecking: ['Yoxlanılır...', 'Checking...'],
  updLatest: ['Ən son versiyadasınız', 'You are up to date'],
  updError: ['Yeniləmə yoxlanarkən xəta', 'Update check failed'],
  sVersion: ['Versiya', 'Version'],
  sCheckUpd: ['Yeniləməni yoxla', 'Check for updates'],
  toastSaved: ['Word yadda saxlanıldı', 'Word document saved'],
  toastOpen: ['Aç', 'Open'],
  toastFolder: ['Qovluq', 'Reveal in folder'],
  toastDownloaded: ['Yükləndi — Downloads qovluğuna baxın', 'Downloaded — check your Downloads folder'],
  sTitle: ['Ayarlar / Settings', 'Settings'],
  sClose: ['Bağla', 'Close'],
  sGeneral: ['Ümumi / General', 'General'],
  sOrg: ['Təşkilat adı', 'Organization'],
  sLogoUp: ['Logo yüklə', 'Upload logo'],
  sLogoDef: ['Default qızıl loqo', 'Default gold logo'],
  sGitlab: ['GitLab inteqrasiyası', 'GitLab integration'],
  sBase: ['Base URL', 'Base URL'],
  sToken: ['Private token (yalnız bu cihazda saxlanılır)', 'Private token (stored on this device only)'],
  sProject: ['Default layihə (qrup/altqrup/layihə və ya ID)', 'Default project (group/sub/project or ID)'],
  sJira: ['Jira inteqrasiyası', 'Jira integration'],
  sJBase: ['Base URL', 'Base URL'],
  sJEmail: ['Email', 'Email'],
  sJToken: ['API token', 'API token'],
  sJKey: ['Layihə açarı', 'Project key'],
  sJNote: ['Jira bağlantısı Faza-3-də aktivləşəcək (issue-dən sahə doldurma).', 'Jira connection arrives in Phase 3.'],
  sData: ['Məlumat / Data', 'Data'],
  sTestConn: ['Bağlantını yoxla', 'Test connection'],
  sTesting: ['Yoxlanılır...', 'Testing...'],
  sConnOk: ['Qoşuldu', 'Connected'],
  sConnFail: ['Qoşulma alınmadı', 'Connection failed'],
  sExportAll: ['Hamısını ixrac et (backup)', 'Export all (backup)'],
  sImport: ['Bərpa et (backup yüklə)', 'Restore from backup'],
  sBackupOk: ['sənəd bərpa olundu', 'documents restored'],
  sBackupFail: ['Backup oxunmadı', 'Could not read backup'],
  sProfiles: ['Layihə profilləri', 'Project profiles'],
  sProfHint: ['Fetch zamanı uyğun profil avtomatik tətbiq olunur (boş sahələrə).', 'Matching profile auto-fills empty fields on fetch.'],
  sProfAdd: ['Əlavə et', 'Add'],
  sProfDelete: ['Sil', 'Delete'],
  sProfEmpty: ['Hələ profil yoxdur — məs: emios üçün sistem/test mühiti yaz.', 'No profiles yet — e.g. system/test env for emios.'],
  profApply: ['Profil tətbiq et', 'Apply profile'],
  profApplied: ['Profil tətbiq olundu', 'Profile applied'],
  profSelect: ['— seç —', '— select —'],
  sClearH: ['Tarixçəni sil', 'Clear history'],
  sClearD: ['Qaralamanı sıfırla', 'Reset draft'],
  sConfirmH: ['Tarixçə silinsin?', 'Clear history?'],
  sConfirmD: ['Qaralama sıfırlansın?', 'Reset draft?'],
  okFetched: ['tarix/saat/status MR-dən', 'date/time/status from MR'],
  errFetch: ['Xəta / Error', 'Error'],
  draftNote: ['Qaralama avtomatik yadda saxlanılır. Yeni sənəd açanda nömrə artır.', 'Draft autosaves. New doc increments the number.'],
  optLow: ['Aşağı', 'Low'],
  optMid: ['Orta', 'Medium'],
  optHigh: ['Yüksək', 'High'],
  stDraft: ['Layihə', 'Draft'],
  stPending: ['Təsdiq gözləyir', 'Pending'],
  stApproved: ['Təsdiqlənib', 'Approved'],
  stRejected: ['İmtina', 'Rejected'],
  no: ['Xeyr', 'No'],
  yes: ['Bəli', 'Yes'],
} as const;

export type TKey = keyof typeof dict;

export function t(lang: Lang, key: TKey): string {
  const v = dict[key];
  const s = lang === 'az' ? v[0] : v[1];
  const parts = s.split('|');
  return parts[0];
}

export function tSub(lang: Lang, key: TKey): string {
  const v = dict[key];
  const s = lang === 'az' ? v[0] : v[1];
  const parts = s.split('|');
  return parts[1] ?? '';
}

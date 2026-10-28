export type ChangeType = 'Standard' | 'Normal' | 'Emergency';
export type Level = 'Aşağı' | 'Orta' | 'Yüksək';

export interface ChangeRequest {
  id: string;
  title: string;
  project: string;
  status: string;
  date: string;
  time: string;
  author: string;
  team: string;
  contact: string;
  type: ChangeType;
  urgency: Level;
  risk: Level;
  riskNote: string;
  repoUrl: string;
  mrUrl: string;
  mrIid: string;
  sourceBranch: string;
  targetBranch: string;
  commits: string;
  diffStat: string;
  description: string;
  reason: string;
  extra: string;
  system: string;
  subsystem: string;
  modules: string;
  userImpact: string;
  downtime: string;
  downtimeDuration: string;
  spentMinutes: number;
  testEnv: string;
  testSteps: string;
  testExpected: string;
  testActual: string;
  rollbackSteps: string;
  rollbackOwner: string;
  rollbackEta: string;
  orgName: string;
}

export const emptyRequest = (id: string): ChangeRequest => ({
  id,
  title: 'ProxyController və validasiyalar optimallaşdırıldı',
  project: 'EMIOS',
  status: 'Təsdiq gözləyir',
  date: new Date().toISOString().slice(0, 10),
  time: '10:00',
  author: '',
  team: '',
  contact: '',
  type: 'Normal',
  urgency: 'Orta',
  risk: 'Orta',
  riskNote: '',
  repoUrl: '',
  mrUrl: '',
  mrIid: '',
  sourceBranch: '',
  targetBranch: 'main',
  commits: '',
  diffStat: '',
  description: '',
  reason: '',
  extra: '',
  system: '',
  subsystem: '',
  modules: '',
  userImpact: '',
  downtime: 'Xeyr',
  downtimeDuration: '',
  spentMinutes: 120,
  testEnv: 'stage',
  testSteps: '',
  testExpected: '',
  testActual: '',
  rollbackSteps: '1. MR revert olunur\n2. Əvvəlki tag redeploy olunur\n3. E-servislər yoxlanılır',
  rollbackOwner: '',
  rollbackEta: '',
  orgName: 'Azerishiq OJSC',
});

export function validate(r: ChangeRequest): string[] {
  const errs: string[] = [];
  if (!r.title.trim()) errs.push('Dəyişiklik adı məcburidir / Title required');
  if (!r.project.trim()) errs.push('Layihə məcburidir / Project required');
  if (!r.description.trim()) errs.push('Təsvir məcburidir / Description required');
  if (!r.reason.trim()) errs.push('Səbəb məcburidir / Reason required');
  if (!r.testSteps.trim()) errs.push('Test planı məcburidir / Test plan required');
  if (!r.rollbackSteps.trim()) errs.push('Geri dönmə planı məcburidir / Rollback required');
  return errs;
}

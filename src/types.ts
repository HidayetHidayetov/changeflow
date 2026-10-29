export type ChangeType = 'Standard' | 'Normal' | 'Emergency';
export type Level = 'Aşağı' | 'Orta' | 'Yüksək';
export type TimelineKind = 'created' | 'fetch' | 'export-docx' | 'print' | 'opened';

export interface TimelineEvent {
  at: string;
  kind: TimelineKind;
  detail?: string;
}

export interface ChangeRequest {
  id: string;
  title: string;
  summary: string;
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
  timeline: TimelineEvent[];
}

export function newEvent(kind: TimelineKind, detail?: string): TimelineEvent {
  return { at: new Date().toISOString(), kind, detail };
}

export const emptyRequest = (id: string): ChangeRequest => ({
  id,
  title: 'Proxy və validasiyalar optimallaşdırıldı',
  summary: '',
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
  timeline: [newEvent('created')],
});

import type { Lang } from './lib/i18n';

export function validate(r: ChangeRequest, lang: Lang = 'az'): string[] {
  const errs: string[] = [];
  const req = lang === 'az' ? 'məcburidir' : 'is required';
  if (!r.title.trim()) errs.push(`${lang === 'az' ? 'Dəyişiklik adı' : 'Title'} ${req}`);
  if (!r.project.trim()) errs.push(`${lang === 'az' ? 'Layihə' : 'Project'} ${req}`);
  if (!r.description.trim()) errs.push(`${lang === 'az' ? 'Təsvir' : 'Description'} ${req}`);
  if (!r.reason.trim()) errs.push(`${lang === 'az' ? 'Səbəb' : 'Reason'} ${req}`);
  if (!r.testSteps.trim()) errs.push(`${lang === 'az' ? 'Test planı' : 'Test plan'} ${req}`);
  if (!r.rollbackSteps.trim()) errs.push(`${lang === 'az' ? 'Geri dönmə planı' : 'Rollback plan'} ${req}`);
  return errs;
}

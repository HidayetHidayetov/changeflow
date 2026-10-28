// Faza-3 hazırlığı: Jira inteqrasiyası skeleti (hələ deaktivdir).
// Settings UI-də sahələr hazırdır, fetchIssue Faza-3-də yazılacaq.

export interface JiraConfig {
  baseUrl: string;
  email: string;
  token: string;
  projectKey: string;
}

const CFG_KEY = 'changeflow.jira';
export const JIRA_ENABLED = false;

export function loadJiraConfig(): JiraConfig {
  try {
    const raw = localStorage.getItem(CFG_KEY);
    if (raw) return JSON.parse(raw) as JiraConfig;
  } catch { /* ignore */ }
  return { baseUrl: '', email: '', token: '', projectKey: '' };
}

export function saveJiraConfig(c: JiraConfig): void {
  localStorage.setItem(CFG_KEY, JSON.stringify(c));
}

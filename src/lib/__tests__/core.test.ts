import { describe, expect, it, beforeEach } from 'vitest';
import { mapState, toLocalDateTime } from '../gitlab';
import { exportBackup, importBackup, listHistory, nextId, peekNextId, projectCode, pushEvent, saveToHistory } from '../store';
import { applyProfile, findProfile, normalizePath, type ProjectProfile } from '../profiles';
import { emptyRequest } from '../../types';

const mem: Record<string, string> = {};
beforeEach(() => {
  for (const k of Object.keys(mem)) delete mem[k];
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => mem[k] ?? null,
    setItem: (k: string, v: string) => {
      mem[k] = String(v);
    },
    removeItem: (k: string) => {
      delete mem[k];
    },
    clear: () => {
      for (const k of Object.keys(mem)) delete mem[k];
    },
    key: (i: number) => Object.keys(mem)[i] ?? null,
    get length() {
      return Object.keys(mem).length;
    },
  } as Storage;
});

describe('mapState', () => {
  it('opened → Təsdiq gözləyir', () => expect(mapState('opened', '')).toBe('Təsdiq gözləyir'));
  it('merged → Təsdiqlənib', () => expect(mapState('merged', '')).toBe('Təsdiqlənib'));
  it('closed → İmtina', () => expect(mapState('closed', '')).toBe('İmtina'));
});

describe('toLocalDateTime', () => {
  it('ISO-nu YYYY-MM-DD + HH:MM-ə çevirir', () => {
    const r = toLocalDateTime('2024-09-21T01:05:00.000Z');
    expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(r.time).toMatch(/^\d{2}:\d{2}$/);
  });
  it('yararsız tarix → boş', () => expect(toLocalDateTime('xxx')).toEqual({ date: '', time: '' }));
});

describe('projectCode', () => {
  it('son seqmenti götürür', () => expect(projectCode('programming-team/e-services/emios-webapp')).toBe('EMIOS-WEBAPP'));
  it('başdakı /-i təmizləyir', () => expect(projectCode('/a/b/emios')).toBe('EMIOS'));
  it('boş → PRJ', () => expect(projectCode('')).toBe('PRJ'));
});

describe('timeline', () => {
  it('yeni sənəddə created hadisəsi var', () => {
    const r = emptyRequest('CR-2026-0001');
    expect(r.timeline).toHaveLength(1);
    expect(r.timeline[0].kind).toBe('created');
  });
  it('pushEvent əlavə edir, köhnəni saxlayır', () => {
    const r = emptyRequest('CR-2026-0001');
    const u = pushEvent(pushEvent(r, 'fetch', 'MR 142'), 'print');
    expect(u.timeline.map((e) => e.kind)).toEqual(['created', 'fetch', 'print']);
    expect(u.timeline[1].detail).toBe('MR 142');
  });
});

describe('backup', () => {
  it('ixrac → idxal round-trip', () => {
    saveToHistory('CR-2026-0001', { id: 'CR-2026-0001', title: 'Test' });
    saveToHistory('CR-2026-0002', { id: 'CR-2026-0002', title: 'Test 2' });
    const json = exportBackup();
    expect(JSON.parse(json).docs).toHaveLength(2);
    (globalThis as unknown as { localStorage: Storage }).localStorage.clear();
    expect(listHistory()).toHaveLength(0);
    const r = importBackup(json);
    expect(r).toEqual({ ok: true, count: 2 });
    expect(listHistory()).toContain('CR-2026-0001');
  });
  it('yararsız JSON → ok:false', () => {
    expect(importBackup('xxx').ok).toBe(false);
    expect(importBackup('{"a":1}').ok).toBe(false);
  });
});

describe('profiles', () => {
  it('normalizePath + findProfile', () => {
    const ps: ProjectProfile[] = [
      { id: '1', projectPath: 'programming-team/e-services/emios', system: 'S', subsystem: 'A', modules: '', testEnv: 'stage' },
    ];
    expect(normalizePath('/A/B/')).toBe('a/b');
    expect(findProfile(ps, '/programming-team/e-services/EMIOS')?.system).toBe('S');
    expect(findProfile(ps, 'other/proj')).toBeUndefined();
  });
  it('applyProfile yalnız boş sahələri doldurur', () => {
    const f = emptyRequest('CR-1');
    const p: ProjectProfile = { id: '1', projectPath: 'x', system: 'SYS', subsystem: 'SUB', modules: 'M', testEnv: 'prod' };
    const u = applyProfile({ ...f, system: 'Mənim' }, p);
    expect(u.system).toBe('Mənim');
    expect(u.subsystem).toBe('SUB');
    expect(u.testEnv).toBe('prod');
  });
});

describe('numbering', () => {
  it('peek artırmır, next artırır', () => {
    const a = peekNextId();
    const b = nextId();
    expect(b).toBe(a);
    expect(peekNextId()).not.toBe(a);
  });
  it('format CR-YYYY-NNNN', () => expect(nextId()).toMatch(/^CR-\d{4}-\d{4}$/));
});

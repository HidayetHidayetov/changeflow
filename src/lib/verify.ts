import type { ChangeRequest } from '../types';

/** Sənədin əsas sahələrindən FNV-1a hash — dəyişikliyi aşkarlamaq üçün. */
export function docHash(r: Pick<
  ChangeRequest,
  'id' | 'title' | 'project' | 'mrIid' | 'sourceBranch' | 'targetBranch' | 'commits' | 'description' | 'reason' | 'date'
>): string {
  const canon = [
    r.id,
    r.title,
    r.project,
    r.mrIid,
    r.sourceBranch,
    r.targetBranch,
    r.commits,
    r.description,
    r.reason,
    r.date,
  ].join('\u0000');
  let h = 0x811c9dc5;
  for (let i = 0; i < canon.length; i++) {
    h ^= canon.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** QR məzmunu: skaner tətbiqlərində MR linki kliklənə bilən olur. */
export function qrPayload(
  r: Pick<ChangeRequest, 'id' | 'title' | 'project' | 'date'> & { mrUrl: string; mrIid: string },
  hash: string,
): string {
  const mr = r.mrUrl || r.mrIid || '—';
  return [`ChangeFlow|${r.id}`, `MR: ${mr}`, `Tarix: ${r.date || '—'}`, `Hash: ${hash}`].join('\n');
}

export async function qrDataUrl(payload: string): Promise<string> {
  const { default: QRCode } = await import('qrcode');
  return QRCode.toDataURL(payload, { width: 220, margin: 1 });
}

export function extractHash(detail: string | undefined): string | null {
  if (!detail) return null;
  const m = detail.match(/#([0-9a-f]{8})\b/);
  return m ? m[1] : null;
}

/** Formun hazırkı hash-ini son ixrac/çap hash-i ilə müqayisə edir. */
export function verifyDoc(
  r: Pick<
    ChangeRequest,
    'id' | 'title' | 'project' | 'mrIid' | 'sourceBranch' | 'targetBranch' | 'commits' | 'description' | 'reason' | 'date'
  > & { timeline?: { kind: string; detail?: string }[] },
): { state: 'no-record' | 'ok' | 'changed'; hash: string; ref?: string } {
  const hash = docHash(r);
  const rec = [...(r.timeline ?? [])]
    .reverse()
    .find((e) => (e.kind === 'export-docx' || e.kind === 'print') && extractHash(e.detail));
  if (!rec || !rec.detail) return { state: 'no-record', hash };
  const ref = extractHash(rec.detail);
  if (!ref) return { state: 'no-record', hash };
  return ref === hash ? { state: 'ok', hash, ref } : { state: 'changed', hash, ref };
}

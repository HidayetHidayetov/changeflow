import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, WidthType, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import type { ChangeRequest } from '../types';

const H = (az: string, en: string) => [
  new TextRun({ text: az, bold: true, size: 22 }),
  new TextRun({ text: `  / ${en}`, size: 16, color: '64748B' }),
];

function row(labelAz: string, labelEn: string, value: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: H(labelAz, labelEn) })],
      }),
      new TableCell({
        width: { size: 70, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ text: value || '—' })],
      }),
    ],
  });
}

function sectionTitle(az: string, en: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [
      new TextRun({ text: az, bold: true, size: 26, color: '1E40AF' }),
      new TextRun({ text: ` / ${en}`, size: 18, color: '64748B' }),
    ],
    spacing: { before: 240, after: 120 },
  });
}

export async function exportDocx(r: ChangeRequest): Promise<void> {
  const t = (v: string) => v || '—';
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: r.orgName || 'Təşkilat / Organization', bold: true, size: 24 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `DƏYİŞİKLİK SORĞUSU / CHANGE REQUEST — ${r.id}`, bold: true, size: 30, color: '1E40AF' })],
          }),
          new Paragraph({ text: '' }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              row('Dəyişiklik adı', 'Title', r.title),
              row('Layihə', 'Project', r.project),
              row('Status', 'Status', r.status),
              row('Tarix / Vaxt', 'Date / Time', `${r.date} ${r.time}`),
              row('Müəllif', 'Author', `${r.author} ${r.team ? `(${r.team})` : ''} ${r.contact}`),
              row('Növ', 'Type', r.type),
              row('Vaciblik', 'Urgency', r.urgency),
              row('Risk', 'Risk', `${r.risk}${r.riskNote ? ` — ${r.riskNote}` : ''}`),
            ],
          }),
          sectionTitle('Git məlumatı', 'Git info'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              row('Repo', 'Repository', r.repoUrl),
              row('MR link / IID', 'MR', `${r.mrUrl} ${r.mrIid}`),
              row('Branch', 'Branch', `${r.sourceBranch} → ${r.targetBranch}`),
              row('Commit-lər', 'Commits', r.commits),
              row('Diff', 'Diff stat', r.diffStat),
            ],
          }),
          sectionTitle('Təsvir', 'Description'),
          new Paragraph({ text: t(r.description) }),
          sectionTitle('Səbəb', 'Reason'),
          new Paragraph({ text: t(r.reason) }),
          ...(r.extra ? [sectionTitle('Əlavə qeyd', 'Notes'), new Paragraph({ text: r.extra })] : []),
          sectionTitle('Təsir analizi', 'Impact'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              row('Sistem', 'System', r.system),
              row('Alt sistem', 'Subsystem', r.subsystem),
              row('Modullar', 'Modules', r.modules),
              row('İstifadəçi təsiri', 'User impact', r.userImpact),
              row('Downtime', 'Downtime', `${r.downtime} ${r.downtimeDuration}`),
              row('Sərf olunan vaxt', 'Spent', `${r.spentMinutes} dəq / min`),
            ],
          }),
          sectionTitle('Test planı', 'Test plan'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              row('Mühit', 'Environment', r.testEnv),
              row('Addımlar', 'Steps', r.testSteps),
              row('Gözlənilən', 'Expected', r.testExpected),
              row('Faktiki', 'Actual', r.testActual),
            ],
          }),
          sectionTitle('Geri dönmə planı', 'Rollback plan'),
          new Paragraph({ text: t(r.rollbackSteps) }),
          new Paragraph({ text: `Məsul / Owner: ${t(r.rollbackOwner)} | Bərpa vaxtı / ETA: ${t(r.rollbackEta)}` }),
          sectionTitle('Qərar', 'Decision'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('☐ Təsdiqlənib / Approved')] }),
                  new TableCell({ children: [new Paragraph('Ad / Name: ________')] }),
                  new TableCell({ children: [new Paragraph('İmza / Sign: ________')] }),
                  new TableCell({ children: [new Paragraph('Tarix / Date: ________')] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('☐ İmtina / Rejected')] }),
                  new TableCell({ children: [new Paragraph('Vəzifə / Role: ________')] }),
                  new TableCell({ children: [new Paragraph('')] }),
                  new TableCell({ children: [new Paragraph('')] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('☐ Əlavə məlumat / More info')] }),
                  new TableCell({ children: [new Paragraph('')] }),
                  new TableCell({ children: [new Paragraph('')] }),
                  new TableCell({ children: [new Paragraph('')] }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${r.id}.docx`);
}

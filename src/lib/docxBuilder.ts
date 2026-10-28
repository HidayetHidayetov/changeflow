import {
  AlignmentType,
  Document,
  LevelFormat,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { saveAs } from 'file-saver';
import type { ChangeRequest } from '../types';

// Real blank: Change-Request-example.docx (SMS GATEWAY) strukturu,
// yazı səhvləri düzəldilib + standart sahələr (RİSK, TEST, DOWNTIME) əlavə olunub.

const LBL = (t: string) => new Paragraph({ children: [new TextRun({ text: t, bold: true })] });
const VAL = (t: string) => new Paragraph({ children: [new TextRun({ text: t || '—' })] });
const NUM_REF = 'blank-num';

const numbering = {
  config: [
    {
      reference: NUM_REF,
      levels: [
        {
          level: 0,
          format: LevelFormat.DECIMAL,
          text: '%1.',
          alignment: AlignmentType.LEFT,
        },
      ],
    },
  ],
};

function lines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((s) => s.replace(/^\s*\d+[.)]\s*/, '').trim())
    .filter(Boolean);
}

function numberedParas(text: string): Paragraph[] {
  const ls = lines(text);
  if (ls.length === 0) return [VAL('')];
  return ls.map(
    (l) =>
      new Paragraph({
        numbering: { reference: NUM_REF, level: 0 },
        children: [new TextRun({ text: l })],
      }),
  );
}

function sectionRow(title: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        columnSpan: 3,
        shading: { fill: 'D9D9D9' },
        children: [new Paragraph({ children: [new TextRun({ text: title, bold: true })] })],
      }),
    ],
  });
}

function span3(text: string): TableRow {
  return new TableRow({
    children: [new TableCell({ columnSpan: 3, children: [VAL(text)] })],
  });
}

function span3Numbered(text: string): TableRow {
  return new TableRow({
    children: [new TableCell({ columnSpan: 3, children: numberedParas(text) })],
  });
}

export async function exportDocx(r: ChangeRequest): Promise<void> {
  const gitCell = [r.repoUrl, r.mrUrl && r.mrIid ? `${r.mrUrl} (${r.mrIid})` : r.mrUrl || r.mrIid, r.sourceBranch ? `${r.sourceBranch} → ${r.targetBranch}` : '']
    .filter(Boolean)
    .join('\n');
  const summary = r.summary || r.title;
  const ux = r.urgency === 'Aşağı' ? 0 : r.urgency === 'Orta' ? 1 : 2;
  const tp = r.type === 'Emergency' ? 1 : 0;

  const doc = new Document({
    numbering,
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'DƏYİŞİKLİKLƏRİN İDARƏ EDİLMƏSİ BLANKI', bold: true, size: 28 })],
          }),
          ...(r.orgName
            ? [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: r.orgName, size: 20, color: '404040' })],
                }),
              ]
            : []),
          new Paragraph({ text: '' }),

          // Cədvəl 1 — başlıq məlumatı
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ columnSpan: 2, children: [LBL('DƏYİŞİKLİYİN ADI')] }),
                  new TableCell({ children: [VAL(r.title)] }),
                  new TableCell({ children: [LBL('DƏYİŞİK №.')] }),
                  new TableCell({ children: [VAL(r.id)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ columnSpan: 3, rowSpan: 2, children: [VAL(summary)] }),
                  new TableCell({ children: [LBL('DƏYİŞİKLİK STATUSU')] }),
                  new TableCell({ children: [VAL(r.status)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [LBL('TARİX')] }),
                  new TableCell({ children: [VAL(r.date)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [LBL('LAYİHƏ')] }),
                  new TableCell({ columnSpan: 2, children: [VAL(r.project)] }),
                  new TableCell({ children: [LBL('VAXT')] }),
                  new TableCell({ children: [VAL(r.time)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [LBL('REPO / MR LİNKİ')] }),
                  new TableCell({ columnSpan: 2, children: gitCell.split('\n').map((l) => VAL(l)) }),
                  new TableCell({ children: [LBL('SƏRF OLUNAN VAXT')] }),
                  new TableCell({ children: [VAL(r.spentMinutes ? `${r.spentMinutes} dəqiqə` : '')] }),
                ],
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // Cədvəl 2 — sorğu sahibi
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [LBL('SORĞUNU YARADAN')] }),
                  new TableCell({ children: [LBL('SORĞU')] }),
                  new TableCell({ children: [LBL('ƏLAQƏ MƏLUMATI')] }),
                ],
              }),
              new TableRow({
                children: [new TableCell({ children: [VAL(r.author)] }), new TableCell({ children: [VAL(r.title)] }), new TableCell({ children: [VAL(r.contact)] })],
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // Cədvəl 3 — vaciblik + növ (X işarəsi)
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ rowSpan: 2, children: [LBL('SORĞU VACİBLİYİ')] }),
                  new TableCell({ children: [LBL('AŞAĞI')] }),
                  new TableCell({ children: [LBL('ORTA')] }),
                  new TableCell({ children: [LBL('YÜKSƏK')] }),
                  new TableCell({ rowSpan: 2, children: [LBL('DƏYİŞİKLİYİN NÖVÜ')] }),
                  new TableCell({ children: [LBL('NORMAL')] }),
                  new TableCell({ children: [LBL('EMERGENCY')] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [VAL(ux === 0 ? 'X' : '')] }),
                  new TableCell({ children: [VAL(ux === 1 ? 'X' : '')] }),
                  new TableCell({ children: [VAL(ux === 2 ? 'X' : '')] }),
                  new TableCell({ children: [VAL(tp === 0 ? 'X' : '')] }),
                  new TableCell({ children: [VAL(tp === 1 ? 'X' : '')] }),
                ],
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // Cədvəl 4 — məzmun
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              sectionRow('DƏYİŞİKLİYİN TƏSVİRİ'),
              span3Numbered(r.description),
              ...(r.extra ? [sectionRow('ƏLAVƏ MƏLUMAT'), span3Numbered(r.extra)] : []),
              sectionRow('DƏYİŞİKLİYİN EDİLMƏ SƏBƏBİ'),
              span3(r.reason),
              sectionRow('RİSK (standart əlavə)'),
              span3(`${r.risk}${r.riskNote ? ` — ${r.riskNote}` : ''}`),
              sectionRow(`TEST PLANI (standart əlavə, mühit: ${r.testEnv || '—'})`),
              new TableRow({
                children: [
                  new TableCell({
                    columnSpan: 3,
                    children: [
                      ...numberedParas(r.testSteps),
                      VAL(`Gözlənilən: ${r.testExpected || '—'}`),
                      VAL(`Faktiki: ${r.testActual || '—'}`),
                    ],
                  }),
                ],
              }),
              sectionRow('GERİ DÖNMƏ PLANI'),
              new TableRow({
                children: [
                  new TableCell({
                    columnSpan: 3,
                    children: r.rollbackSteps
                      .split(/\r?\n/)
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((l) => VAL(l)),
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ rowSpan: 4, children: [LBL('TƏSİRƏ MƏRUZ QALAN ƏRAZİLƏR')] }),
                  new TableCell({ children: [LBL('SİSTEM')] }),
                  new TableCell({ children: [VAL([r.system, r.modules].filter(Boolean).join(' — '))] }),
                ],
              }),
              new TableRow({
                children: [new TableCell({ children: [LBL('ALT SİSTEM')] }), new TableCell({ children: [VAL(r.subsystem)] })],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [LBL('DOWNTIME (standart əlavə)')] }),
                  new TableCell({ children: [VAL(`${r.downtime}${r.downtimeDuration ? ` — ${r.downtimeDuration}` : ''}`)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [LBL('İSTİFADƏÇİ TƏSİRİ (standart əlavə)')] }),
                  new TableCell({ children: [VAL(r.userImpact)] }),
                ],
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // Cədvəl 5 — qərar
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ columnSpan: 2, children: [LBL('QƏRAR')] }),
                  new TableCell({ children: [LBL('TƏSDİQLƏYƏNİN ADI VƏ VƏZİFƏSİ')] }),
                  new TableCell({ children: [LBL('İMZA')] }),
                  new TableCell({ children: [LBL('TARİX')] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [VAL('')] }),
                  new TableCell({ children: [VAL('TƏSDİQLƏNİB')] }),
                  new TableCell({ children: [VAL('')] }),
                  new TableCell({ children: [VAL('')] }),
                  new TableCell({ children: [VAL('')] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [VAL('')] }),
                  new TableCell({ children: [VAL('İMTİNA EDİLİB')] }),
                  new TableCell({ children: [VAL('')] }),
                  new TableCell({ children: [VAL('')] }),
                  new TableCell({ children: [VAL('')] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [VAL('')] }),
                  new TableCell({ children: [VAL('ƏLAVƏ MƏLUMAT TƏLƏB OLUNUR')] }),
                  new TableCell({ children: [VAL('')] }),
                  new TableCell({ children: [VAL('')] }),
                  new TableCell({ children: [VAL('')] }),
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

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

// Real blank: Change-Request-example.docx (SMS GATEWAY) strukturu + rəngləri:
// label = D4E5E5 (açıq mavi), dəyər = EFF5F4, tab2 başlıq = EDEDED,
// vaciblik şkalası EFF5F4/DDEFED/D4E5E5, normal = E7E7E7, emergency = DBDBDB.
// Yazı səhvləri düzəldilib + standart sahələr (RİSK, TEST, DOWNTIME) əlavə olunub.

const LABEL = 'D4E5E5';
const VALUE = 'EFF5F4';
const H2 = 'EDEDED';
const MID = 'DDEFED';
const GRAY = 'E7E7E7';
const DARK = 'DBDBDB';
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

const P = (t: string, bold = false) =>
  new Paragraph({ children: [new TextRun({ text: t || '—', bold })] });
const TH = (t: string, fill: string = LABEL) =>
  new TableCell({ shading: { fill }, children: [P(t, true)] });
const TD = (t: string, fill = 'FFFFFF') =>
  new TableCell({ shading: { fill }, children: [P(t)] });

function lines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((s) => s.replace(/^\s*\d+[.)]\s*/, '').trim())
    .filter(Boolean);
}

function numberedParas(text: string): Paragraph[] {
  const ls = lines(text);
  if (ls.length === 0) return [P('')];
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
        shading: { fill: LABEL },
        children: [P(title, true)],
      }),
    ],
  });
}

function span3(text: string): TableRow {
  return new TableRow({
    children: [new TableCell({ columnSpan: 3, children: [P(text)] })],
  });
}

function span3Numbered(text: string): TableRow {
  return new TableRow({
    children: [new TableCell({ columnSpan: 3, children: numberedParas(text) })],
  });
}

export async function exportDocx(r: ChangeRequest): Promise<void> {
  const gitLines = [
    r.repoUrl,
    r.mrUrl && r.mrIid ? `${r.mrUrl} (${r.mrIid})` : r.mrUrl || r.mrIid,
    r.sourceBranch ? `${r.sourceBranch} → ${r.targetBranch}` : '',
  ].filter(Boolean);
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
            children: [new TextRun({ text: 'DƏYİŞİKLİKLƏRİN İDARƏ EDİLMƏSİ BLANKI', bold: true, size: 32 })],
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
                  new TableCell({ columnSpan: 2, shading: { fill: LABEL }, children: [P('DƏYİŞİKLİYİN ADI', true)] }),
                  TD(r.title, VALUE),
                  TH('DƏYİŞİK №.'),
                  new TableCell({ children: [P(r.id)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ columnSpan: 3, rowSpan: 2, shading: { fill: VALUE }, children: [P(summary)] }),
                  TH('DƏYİŞİKLİK STATUSU'),
                  new TableCell({ children: [P(r.status)] }),
                ],
              }),
              new TableRow({
                children: [TH('TARİX'), new TableCell({ children: [P(r.date)] })],
              }),
              new TableRow({
                children: [
                  TH('LAYİHƏ'),
                  new TableCell({ columnSpan: 2, shading: { fill: VALUE }, children: [P(r.project)] }),
                  TH('VAXT'),
                  new TableCell({ children: [P(r.time)] }),
                ],
              }),
              new TableRow({
                children: [
                  TH('REPO / MR LİNKİ'),
                  new TableCell({
                    columnSpan: 2,
                    shading: { fill: VALUE },
                    children: gitLines.length ? gitLines.map((l) => P(l)) : [P('')],
                  }),
                  TH('SƏRF OLUNAN VAXT'),
                  new TableCell({ children: [P(r.spentMinutes ? `${r.spentMinutes} dəqiqə` : '')] }),
                ],
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // Cədvəl 2 — sorğu sahibi
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [TH('SORĞUNU YARADAN', H2), TH('SORĞU', H2), TH('ƏLAQƏ MƏLUMATI', H2)] }),
              new TableRow({ children: [TD(r.author), TD(r.title), TD(r.contact)] }),
            ],
          }),
          new Paragraph({ text: '' }),

          // Cədvəl 3 — vaciblik + növ (X işarəsi)
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ rowSpan: 2, children: [P('SORĞU VACİBLİYİ', true)] }),
                  TH('AŞAĞI', VALUE),
                  TH('ORTA', MID),
                  TH('YÜKSƏK', LABEL),
                  new TableCell({ rowSpan: 2, children: [P('DƏYİŞİKLİYİN NÖVÜ', true)] }),
                  TH('NORMAL', GRAY),
                  TH('EMERGENCY', DARK),
                ],
              }),
              new TableRow({
                children: [
                  TD(ux === 0 ? 'X' : ''),
                  TD(ux === 1 ? 'X' : ''),
                  TD(ux === 2 ? 'X' : ''),
                  TD(tp === 0 ? 'X' : ''),
                  TD(tp === 1 ? 'X' : ''),
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
                      P(`Gözlənilən: ${r.testExpected || '—'}`),
                      P(`Faktiki: ${r.testActual || '—'}`),
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
                      .map((l) => P(l)),
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ rowSpan: 4, shading: { fill: LABEL }, children: [P('TƏSİRƏ MƏRUZ QALAN ƏRAZİLƏR', true)] }),
                  TH('SİSTEM', VALUE),
                  new TableCell({ children: [P([r.system, r.modules].filter(Boolean).join(' — '))] }),
                ],
              }),
              new TableRow({
                children: [TH('ALT SİSTEM', VALUE), new TableCell({ children: [P(r.subsystem)] })],
              }),
              new TableRow({
                children: [
                  TH('DOWNTIME (standart əlavə)', VALUE),
                  new TableCell({ children: [P(`${r.downtime}${r.downtimeDuration ? ` — ${r.downtimeDuration}` : ''}`)] }),
                ],
              }),
              new TableRow({
                children: [
                  TH('İSTİFADƏÇİ TƏSİRİ (standart əlavə)', VALUE),
                  new TableCell({ children: [P(r.userImpact)] }),
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
                  new TableCell({ columnSpan: 2, children: [P('QƏRAR', true)] }),
                  new TableCell({ children: [P('TƏSDİQLƏYƏNİN ADI VƏ VƏZİFƏSİ', true)] }),
                  new TableCell({ children: [P('İMZA', true)] }),
                  new TableCell({ children: [P('TARİX', true)] }),
                ],
              }),
              new TableRow({
                children: [
                  TD(''),
                  TD('TƏSDİQLƏNİB', LABEL),
                  TD(''),
                  TD(''),
                  TD(''),
                ],
              }),
              new TableRow({
                children: [TD(''), TD('İMTİNA EDİLİB', H2), TD(''), TD(''), TD('')],
              }),
              new TableRow({
                children: [TD(''), TD('ƏLAVƏ MƏLUMAT TƏLƏB OLUNUR', VALUE), TD(''), TD(''), TD('')],
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

/**
 * gen_feedback_doc.js
 * Generates: outputs/decks/AI_Assisted_Feedback_Insights_Apr2026.docx
 *
 * Sections:
 *   1. Cover / Key Highlights
 *   2. Overall Trends — All AI-Assisted Tests (WoW DLI + bucket themes)
 *   3. Candidate Testimonials — All Companies
 *   4. Walmart Global Tech — Deep Dive
 *   5. Amazon — Deep Dive
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  VerticalAlign, LevelFormat, PageNumber, Header, Footer, PageBreak,
} = require('docx');

// ── Paths ────────────────────────────────────────────────────────────────────
const DATA   = path.join(__dirname, '..', 'data');
const OUT    = path.join(__dirname, '..', 'decks', 'AI_Assisted_Feedback_Insights_Apr2026.docx');

// ── Brand colours ────────────────────────────────────────────────────────────
const GREEN   = '05C770';
const DARK    = '1A1A1A';
const GREY    = '666666';
const LGREY   = 'F5F5F5';
const WHITE   = 'FFFFFF';
const TEAL_BG = 'E6FBF2';  // light green tint for callouts

// ── Page geometry (US Letter, 1" margins) ────────────────────────────────────
const PAGE_W    = 12240;
const PAGE_H    = 15840;
const MARGIN    = 1440;
const CONTENT_W = PAGE_W - 2 * MARGIN;  // 9360 DXA

// ── Table border helpers ─────────────────────────────────────────────────────
function hairBorder(color = 'CCCCCC') {
  return { style: BorderStyle.SINGLE, size: 1, color };
}
function noBorder() {
  return { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
}
function allBorders(color = 'CCCCCC') {
  const b = hairBorder(color);
  return { top: b, bottom: b, left: b, right: b };
}
function noBorders() {
  const b = noBorder();
  return { top: b, bottom: b, left: b, right: b };
}

// ── Paragraph helpers ────────────────────────────────────────────────────────
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, bold: true, size: 32, font: 'Manrope', color: DARK })],
    spacing: { before: 360, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREEN, space: 4 } },
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, size: 26, font: 'Manrope', color: DARK })],
    spacing: { before: 280, after: 80 },
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, font: 'Manrope', color: opts.color || DARK, bold: opts.bold || false })],
    spacing: { before: opts.spaceBefore || 60, after: opts.spaceAfter || 60 },
    alignment: opts.align || AlignmentType.LEFT,
  });
}

function caption(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 18, font: 'Manrope', color: GREY, italics: true })],
    spacing: { before: 40, after: 100 },
  });
}

function spacer(pts = 120) {
  return new Paragraph({ children: [new TextRun('')], spacing: { before: pts, after: 0 } });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function bullet(text, tag) {
  const children = [new TextRun({ text, size: 22, font: 'Manrope', color: DARK })];
  if (tag) children.push(new TextRun({ text: `  [${tag}]`, size: 18, font: 'Manrope', color: GREEN, bold: true }));
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    children,
    spacing: { before: 60, after: 60 },
  });
}

// ── Table helpers ────────────────────────────────────────────────────────────
function cell(text, opts = {}) {
  const { width, bold = false, bg, color, align = AlignmentType.LEFT, size = 20 } = opts;
  return new TableCell({
    borders: allBorders(opts.borderColor || 'DDDDDD'),
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    shading: bg ? { fill: bg, type: ShadingType.CLEAR } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      alignment: align,
      children: [new TextRun({ text: String(text ?? ''), bold, size, font: 'Manrope', color: color || DARK })],
    })],
  });
}

function headerRow(labels, widths, bg = '1A1A1A') {
  return new TableRow({
    tableHeader: true,
    children: labels.map((l, i) =>
      new TableCell({
        borders: allBorders(bg),
        width: widths[i] ? { size: widths[i], type: WidthType.DXA } : undefined,
        shading: { fill: bg, type: ShadingType.CLEAR },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 100, bottom: 100, left: 120, right: 120 },
        children: [new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [new TextRun({ text: l, bold: true, size: 20, font: 'Manrope', color: WHITE })],
        })],
      })
    ),
  });
}

function dataRow(values, widths, stripe = false, highlights = {}) {
  return new TableRow({
    children: values.map((v, i) => {
      const bg = highlights[i] || (stripe ? LGREY : WHITE);
      return cell(v, { width: widths[i], bg });
    }),
  });
}

// ── Verbatim callout box ──────────────────────────────────────────────────────
function verbatimBox(quote, meta) {
  // meta: { company, rating, date, attemptId, email }
  const quoteText   = `"${quote}"`;
  const metaText    = `${meta.company}  |  Rating: ${meta.rating}/5  |  ${meta.date}  |  Attempt: ${meta.attemptId}  |  ${meta.email}`;

  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W],
    borders: { top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder(),
               insideH: noBorder(), insideV: noBorder() },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top:    { style: BorderStyle.SINGLE, size: 6, color: GREEN },
              bottom: hairBorder('CCCCCC'),
              left:   hairBorder('CCCCCC'),
              right:  hairBorder('CCCCCC'),
            },
            shading: { fill: TEAL_BG, type: ShadingType.CLEAR },
            margins: { top: 160, bottom: 120, left: 200, right: 200 },
            width: { size: CONTENT_W, type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [new TextRun({ text: quoteText, italics: true, size: 22, font: 'Manrope', color: DARK })],
                spacing: { before: 0, after: 80 },
              }),
              new Paragraph({
                children: [new TextRun({ text: metaText, size: 18, font: 'Manrope', color: GREY })],
                spacing: { before: 0, after: 0 },
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// ── Data ─────────────────────────────────────────────────────────────────────

// WoW DLI (last 10 weeks, skip the partial Apr-06)
const wowDli = [
  ['2026-01-26', '115', '4.79', '92', '24'],
  ['2026-02-02', '83',  '4.76', '63', '20'],
  ['2026-02-09', '92',  '4.73', '68', '25'],
  ['2026-02-16', '154', '4.79', '122', '32'],
  ['2026-02-23', '197', '4.80', '157', '40'],
  ['2026-03-02', '160', '4.78', '124', '36'],
  ['2026-03-09', '173', '4.77', '134', '39'],
  ['2026-03-16', '218', '4.78', '171', '47'],
  ['2026-03-23', '213', '4.78', '166', '47'],
  ['2026-03-30', '212', '4.79', '167', '45'],
];

// WoW bucket themes (last 6 weeks)
const wowBuckets = [
  ['2026-03-02', '24', '3', '1', '3', '1', '1', '9'],
  ['2026-03-09', '31', '2', '3', '4', '0', '2', '11'],
  ['2026-03-16', '32', '2', '3', '4', '1', '2', '4'],
  ['2026-03-23', '35', '9', '1', '2', '4', '1', '11'],
  ['2026-03-30', '27', '3', '1', '5', '2', '1', '10'],
  ['2026-04-06', '3',  '0', '0', '1', '0', '0', '1'],
];

// Walmart DLI per test
const walmartDli = [
  ['Walmart Software Engineering Assessment',          '1,155', '4.25', '750', '171', '103', '38', '93', '79.7%'],
  ['Walmart Software Engineering Assessment (Validation)', '188', '4.02', '111', '24', '20', '11', '22', '71.8%'],
  ['Walmart Early Careers SWE Intern Assessment 2025', '60',   '4.25', '39',  '6',  '9',  '3',  '3',  '75.0%'],
  ['Walmart Early Careers Data Science Intern 2025',   '4',    '3.75', '1',   '1',  '2',  '0',  '0',  '50.0%'],
];

// Amazon DLI per test (main tests only)
const amazonDli = [
  ['Sample Test for Amazon Coding Challenge', '177', '4.61', '137', '24', '8', '3', '5',  '91.0%'],
  ['Sample Test for Django',                  '297', '4.61', '242', '26', '12','3', '14', '90.2%'],
  ['Sample Test for Node.JS',                 '121', '4.63', '98',  '10', '8', '1', '4',  '89.3%'],
  ['Sample Test for Spring Boot',             '154', '4.54', '115', '23', '7', '2', '7',  '89.6%'],
];

// Walmart score dist (main SWE Assessment)
const walmartScoreDist = [
  ['0-10%',   '44'],
  ['10-20%',  '12'],
  ['20-30%',  '10'],
  ['30-40%', '111'],
  ['40-50%',  '25'],
  ['50-60%',  '23'],
  ['60-70%', '265'],
  ['70-80%',  '35'],
  ['80-90%',  '14'],
  ['90-100%', '44'],
  ['100%',    '12'],
];

// Amazon score dist (Sample Test for Amazon Coding Challenge)
const amazonScoreDist = [
  ['0-10%',    '3'],
  ['20-30%',   '4'],
  ['30-40%',   '1'],
  ['40-50%',   '1'],
  ['60-70%',   '1'],
  ['70-80%',   '6'],
  ['80-90%',   '3'],
  ['90-100%',  '4'],
  ['100%',    '40'],
];

// Amazon Django score dist (most responses)
const amazonDjangoScoreDist = [
  ['0-10%',   '23'],
  ['20-30%',  '29'],
  ['60-70%',   '1'],
  ['70-80%',  '47'],
  ['80-90%',  '18'],
  ['90-100%',  '3'],
  ['100%',   '165'],
];

// ── Testimonials ─────────────────────────────────────────────────────────────

const allCompanyVerbatims = [
  {
    quote: 'I really like the VSCode-like feel of the platform, being familiar to many developers it helps quickly warming up with the environment. The questions are interesting and have the right difficulty for SDE I and II levels. The AI is a great addition: it helps clarifying requirements, explaining existing pieces of code and navigating the language documentation, but is tailored to never give away the solution. AI is not essential to solve the problem, but it helps getting there faster, so I think its presence helps testing the developers\u2019 ability to leverage AI to be more efficient.',
    company: 'Amazon', rating: 5, date: '2026-03-08', attemptId: '83968924', email: 'apigna@amazon.com',
    tags: ['candidate_experience', 'test_quality', 'ai_helpfulness'],
  },
  {
    quote: 'Well done! This was a good test of my skills without getting into leetcode stuff, which I really appreciate! I esp. like having the AI there to ask in case I forget syntax stuff or what not (since that\u2019s realistic) but then the onus is on me to actually write the code (which is realistic!). Thanks for the opportunity.',
    company: 'Planning Center', rating: 5, date: '2026-01-28', attemptId: '82914379', email: 'alexmcraysmith@gmail.com',
    tags: ['test_quality', 'ai_helpfulness', 'recommendation'],
  },
  {
    quote: 'My #1 struggle with tests like this is syntax, the guarded AI assistant lets me get syntax clarity but also is guarded enough such that I am using my own creativity instead of relying on it \u2014 it makes me able to speed myself up with syntax without relying on it for problem solving.',
    company: 'Virtu', rating: 5, date: '2026-03-27', attemptId: '84478534', email: 'leon11gra4@gmail.com',
    tags: ['ai_helpfulness'],
  },
  {
    quote: 'In my opinion, the test is adequate for evaluating a Java and Spring Boot developer. Part 1, which focuses on core Java, is a good exercise. The allotted time is sufficient to complete the solution. For Part 2, the Spring Boot section, I think it is a well-designed exercise that effectively evaluates a candidate\u2019s understanding of the required architecture and their ability to correctly implement and configure the necessary beans.',
    company: 'Accenture', rating: 5, date: '2026-01-31', attemptId: '82977025', email: 'auvy.d.sarmiento@accenture.com',
    tags: ['test_quality', 'candidate_experience'],
  },
  {
    quote: 'AI helper minimizes time wasting on syntax errors. Much better now. The Swift interpreter works correctly this time.',
    company: 'T-Mobile', rating: 5, date: '2026-03-25', attemptId: '84416252', email: 'artbasil@gmail.com',
    tags: ['ai_helpfulness', 'platform_reliability'],
  },
  {
    quote: 'This is a great tool and built-in AI assistant is very helpful.',
    company: 'Palo Alto Networks', rating: 5, date: '2026-03-09', attemptId: '83989760', email: 'ksridharan@paloaltonetworks.com',
    tags: ['ai_helpfulness'],
  },
  {
    quote: 'The AI tool is slow in response and does not suggest code snippets and gives answers around the bush. Good for syntax checking but not as powerful as Claude Code or Cursor.',
    company: 'Salesforce', rating: 4, date: '2026-01-21', attemptId: '82723573', email: 'spathrose@salesforce.com',
    tags: ['ai_helpfulness'],
  },
];

const walmartVerbatims = [
  {
    quote: 'This was the best coding challenge experience I have ever had. Problems didn\u2019t feel meaningless at all and was good representation of what I would need to perform in this role.',
    company: 'Walmart Global Tech', rating: 5, date: '2026-02-01', attemptId: '83018284', email: '99alparslan@gmail.com',
    tags: ['candidate_experience', 'test_quality'],
  },
  {
    quote: 'This was much more interesting than trying to solve multiple Leetcode style problems. Even though I was fairly unfamiliar with the frameworks used the AI assistant let me still solve the problems I was required to solve.',
    company: 'Walmart Global Tech', rating: 5, date: '2026-02-24', attemptId: '83662414', email: 'brettkohler93@gmail.com',
    tags: ['test_quality', 'ai_helpfulness'],
  },
  {
    quote: 'Really nice experience, tests your development ability outside of DSA.',
    company: 'Walmart Global Tech', rating: 5, date: '2026-02-22', attemptId: '83595672', email: 'aravindhari555@gmail.com',
    tags: ['candidate_experience', 'test_quality'],
  },
  {
    quote: 'The assessment was well structured and clear. I enjoyed working through the problems, and the platform was easy to use. Thank you for the opportunity.',
    company: 'Walmart Global Tech', rating: 5, date: '2026-03-05', attemptId: '83900249', email: 'manasayanugula03@hotmail.com',
    tags: ['candidate_experience'],
  },
  {
    quote: 'The AI tools made this assessment more relevant to current industry standards.',
    company: 'Walmart Global Tech', rating: 5, date: '2026-03-24', attemptId: '84378566', email: 'ayushjain0996@gmail.com',
    tags: ['ai_helpfulness', 'test_quality'],
  },
  {
    quote: 'Very interesting way of interview process compared to static questions \u2014 this interactive approach combined with problem solving is more efficient.',
    company: 'Walmart Global Tech', rating: 5, date: '2026-03-01', attemptId: '83780387', email: 'batchuphanitulasibatchu@gmail.com',
    tags: ['candidate_experience', 'test_quality'],
  },
  {
    quote: 'Great module which includes all the necessary places to explore like Problem Solving, Frontend and Backend algorithms with AI Assisted Workflow.',
    company: 'Walmart Global Tech', rating: 5, date: '2026-03-29', attemptId: '84501325', email: 'vasanthannadurai2205@gmail.com',
    tags: ['test_quality', 'ai_helpfulness'],
  },
  {
    quote: 'The interface is quite interactive. Overall it\u2019s a good experience in terms of problems and AI use case.',
    company: 'Walmart Global Tech', rating: 5, date: '2026-03-03', attemptId: '83825094', email: 'amit.kumar5@walmart.com',
    tags: ['candidate_experience', 'ai_helpfulness'],
  },
  {
    quote: 'awesome, loved the practicality of the questions and format.',
    company: 'Walmart Global Tech', rating: 5, date: '2026-03-26', attemptId: '84434895', email: 'ankitkrtiwary.24@gmail.com',
    tags: ['test_quality'],
  },
];

const amazonVerbatims = [
  {
    quote: 'I really like the VSCode-like feel of the platform. The questions are interesting and have the right difficulty for SDE I and II levels. I found the idea of adding small bugs in the parsing files pretty smart \u2014 not expecting those, they tested my ability to debug the code. The AI is a great addition: it helps clarifying requirements, explaining existing pieces of code and navigating the language documentation, but is tailored to never give away the solution.',
    company: 'Amazon', rating: 5, date: '2026-03-08', attemptId: '83968924', email: 'apigna@amazon.com',
    tags: ['test_quality', 'ai_helpfulness'],
  },
  {
    quote: 'Pretty neat interface. It took me some time to understand the UI, but once I did, it became quite easy to use.',
    company: 'Amazon', rating: 5, date: '2025-10-28', attemptId: '80480110', email: 'aaalaga@amazon.com',
    tags: ['candidate_experience'],
  },
];

// ── Build table for DLI ───────────────────────────────────────────────────────
function buildDliTable(rows, widths) {
  const labels = ['Test Name', 'Responses', 'Avg DLI', '5★', '4★', '3★', '2★', '1★', '% Positive'];
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      headerRow(labels, widths, '1A1A1A'),
      ...rows.map((r, idx) => dataRow(r, widths, idx % 2 === 1, {})),
    ],
  });
}

// ── Build score dist table ────────────────────────────────────────────────────
function buildScoreTable(rows) {
  const widths = [3000, 3000, 3360];
  const total  = rows.reduce((s, r) => s + parseInt(r[1]), 0);
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      headerRow(['Score Range', 'Candidate Count', '% of Total'], widths),
      ...rows.map((r, idx) => {
        const pct = ((parseInt(r[1]) / total) * 100).toFixed(1) + '%';
        return dataRow([r[0], r[1], pct], widths, idx % 2 === 1);
      }),
      // Total row
      new TableRow({
        children: [
          cell('Total', { width: widths[0], bold: true, bg: LGREY }),
          cell(String(total), { width: widths[1], bold: true, bg: LGREY }),
          cell('100%', { width: widths[2], bold: true, bg: LGREY }),
        ],
      }),
    ],
  });
}

// ── Build WoW DLI table ───────────────────────────────────────────────────────
function buildWowTable() {
  const widths = [1600, 2000, 1400, 1400, 1400, 1560];
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      headerRow(['Week', 'Positive DLI Attempts', 'Avg DLI', 'Rating 5', 'Rating 4', 'Total (≥4)'], widths),
      ...wowDli.map((r, idx) => {
        const isRecent = idx >= 7;
        return new TableRow({
          children: [
            cell(r[0], { width: widths[0], bg: isRecent ? TEAL_BG : (idx % 2 ? LGREY : WHITE) }),
            cell(r[1], { width: widths[1], bg: isRecent ? TEAL_BG : (idx % 2 ? LGREY : WHITE), align: AlignmentType.RIGHT }),
            cell(r[2], { width: widths[2], bg: isRecent ? TEAL_BG : (idx % 2 ? LGREY : WHITE), align: AlignmentType.RIGHT }),
            cell(r[3], { width: widths[3], bg: isRecent ? TEAL_BG : (idx % 2 ? LGREY : WHITE), align: AlignmentType.RIGHT }),
            cell(r[4], { width: widths[4], bg: isRecent ? TEAL_BG : (idx % 2 ? LGREY : WHITE), align: AlignmentType.RIGHT }),
            cell(String(parseInt(r[1])), { width: widths[5], bg: isRecent ? TEAL_BG : (idx % 2 ? LGREY : WHITE), bold: isRecent, align: AlignmentType.RIGHT }),
          ],
        });
      }),
    ],
  });
}

// ── Build WoW bucket table ────────────────────────────────────────────────────
function buildBucketTable() {
  const widths = [1400, 1300, 1200, 1300, 1260, 1200, 1300, 800];
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      headerRow(['Week', 'Total (≥4)', 'AI Assist', 'Reliability', 'IDE/Env', 'Platform UX', 'Qn Quality', 'Other'], widths),
      ...wowBuckets.map((r, idx) =>
        dataRow(r, widths, idx % 2 === 1)
      ),
    ],
  });
}

// ── Key highlights bullets ───────────────────────────────────────────────────
const highlights = [
  { text: 'Consistent positive DLI: avg rating 4.77\u20134.80 across all AI-assisted tests since Jan 2026, with 85\u201391%+ of responses rating 4 or 5.', tag: 'DLI Signal' },
  { text: 'Volume growing: positive feedback attempts grew from 17/week in early Jan to 212/week by late March \u2014 a 12\u00d7 increase as more companies onboard.', tag: 'Growth' },
  { text: 'AI assistance experience is the most positively mentioned theme \u2014 candidates appreciate guardrails that help with syntax without giving away solutions.', tag: 'AI Guardrails' },
  { text: '"Not like Leetcode" is a recurring signal: candidates consistently note the real-world, project-based format as a differentiator.', tag: 'Real-World Tests' },
  { text: 'Amazon (Sample Tests): 89\u201391% positive DLI across 4 test variants. Score distribution is bimodal \u2014 strong pass/fail signal.', tag: 'Amazon' },
  { text: 'Walmart SWE Assessment: 79.7% positive DLI across 1,155 responses. Score clusters at 60\u201370% and 0\u201310% \u2014 good differentiation across the funnel.', tag: 'Walmart' },
];

// ── Document assembly ─────────────────────────────────────────────────────────
const dliWidths    = [2900, 900, 900, 700, 700, 700, 700, 700, 860];
const dliSumTotal  = dliWidths.reduce((s, v) => s + v, 0);
// adjust last to hit CONTENT_W
const dliAdj = dliWidths.map((w, i) => i === dliWidths.length - 1 ? w + (CONTENT_W - dliSumTotal) : w);

const doc = new Document({
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '\u2022',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 560, hanging: 280 } } },
        }],
      },
    ],
  },
  styles: {
    default: {
      document: { run: { font: 'Manrope', size: 22, color: DARK } },
    },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: 'Manrope', color: DARK },
        paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: 'Manrope', color: DARK },
        paragraph: { spacing: { before: 280, after: 80 }, outlineLevel: 1 },
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: PAGE_W, height: PAGE_H },
        margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          children: [
            new TextRun({ text: 'NextGen AI-Assisted Test Feedback \u2014 Insights Brief', size: 18, font: 'Manrope', color: GREY }),
            new TextRun({ text: '\t', size: 18 }),
            new TextRun({ text: 'April 2026  |  CONFIDENTIAL', size: 18, font: 'Manrope', color: GREY }),
          ],
          tabStops: [{ type: 'right', position: 9360 }],
          border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: GREEN, space: 2 } },
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          children: [
            new TextRun({ text: 'HackerRank NextGen  |  Candidate Feedback on AI-Assisted Tests  |  Data period: 2026-01-01 \u2013 2026-04-10', size: 16, font: 'Manrope', color: GREY }),
            new TextRun({ text: '\tPage ', size: 16, font: 'Manrope', color: GREY }),
            new TextRun({ children: [PageNumber.CURRENT], size: 16, font: 'Manrope', color: GREY }),
          ],
          tabStops: [{ type: 'right', position: 9360 }],
          border: { top: { style: BorderStyle.SINGLE, size: 2, color: 'CCCCCC', space: 2 } },
        })],
      }),
    },

    children: [

      // ── Cover ────────────────────────────────────────────────────────────
      spacer(200),
      new Paragraph({
        children: [new TextRun({ text: 'NextGen AI-Assisted Tests', bold: true, size: 52, font: 'Manrope', color: DARK })],
        spacing: { before: 0, after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Candidate Feedback \u2014 Insights & Verbatims', size: 36, font: 'Manrope', color: GREEN })],
        spacing: { before: 0, after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Data period: January 1, 2026 \u2013 April 10, 2026  \u00b7  Generated: April 10, 2026', size: 20, font: 'Manrope', color: GREY })],
        spacing: { before: 0, after: 60 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Source: Trino \u2022 stg_fu_ai_assistant_question (user_msg_cnt > 3, entity_type = attempt)', size: 18, font: 'Manrope', color: GREY })],
        spacing: { before: 0, after: 0 },
      }),

      spacer(160),

      // ── Key Highlights ───────────────────────────────────────────────────
      h1('Key Highlights'),
      ...highlights.map(h => bullet(h.text, h.tag)),

      pageBreak(),

      // ── Section 1: Overall Trends ─────────────────────────────────────────
      h1('1. Overall Positive DLI Trends \u2014 All AI-Assisted Tests'),
      body('All paid companies. Attempts filtered to those where at least one question had user_msg_cnt > 3 on the AI Assistant. Rating \u2265 4 = positive DLI.'),
      spacer(80),

      h2('Week-on-Week: Positive DLI Attempts'),
      caption('Green-shaded rows = last 3 weeks (Mar 16 \u2013 Mar 30). Avg DLI consistently 4.77\u20134.80.'),
      buildWowTable(),
      spacer(120),

      h2('Week-on-Week: Positive Feedback Themes (Rating \u2265 4)'),
      caption('Bucket classification using LIKE-matching on feedback text + selected options. Multiple buckets can apply to one response.'),
      buildBucketTable(),
      spacer(60),
      body('Key observation: "AI Assist" theme spiked in the week of Mar 23 (9 mentions), while "Question Quality" has been the dominant positive theme across weeks \u2014 a strong signal that candidates find the real-world test format compelling.', { color: GREY }),

      pageBreak(),

      // ── Section 2: Candidate Testimonials ────────────────────────────────
      h1('2. Candidate Testimonials \u2014 All Companies'),
      body('Selected verbatims from AI-assisted tests across all paid companies, Jan\u2013Apr 2026. All ratings included (positive and mixed). Curated for relevance to the NextGen \u2192 Traditional hiring transition proof points.'),
      spacer(80),

      ...allCompanyVerbatims.flatMap((v, i) => [
        i > 0 ? spacer(80) : spacer(0),
        verbatimBox(v.quote, v),
      ]),

      pageBreak(),

      // ── Section 3: Walmart ────────────────────────────────────────────────
      h1('3. Walmart Global Tech Talent Acquisition \u2014 Deep Dive'),
      body('Company ID: 37714  \u00b7  Period: 2026-01-01 \u2013 2026-04-10  \u00b7  Source: AI-assisted attempts only (user_msg_cnt > 3)'),
      spacer(80),

      h2('DLI Summary by Test'),
      buildDliTable(walmartDli, dliAdj),
      spacer(60),
      body('The main SWE Assessment had 1,155 feedback responses with 79.7% positive DLI \u2014 high volume and strong satisfaction for an AI-assisted coding test.', { color: GREY }),
      spacer(120),

      h2('Score Distribution \u2014 Walmart Software Engineering Assessment'),
      caption('AI-assisted attempts only. Scores stored as scaled_percentage_score / 100.'),
      buildScoreTable(walmartScoreDist),
      spacer(60),
      body('Score pattern: bimodal with peaks at 60\u201370% (265 candidates) and 30\u201340% (111 candidates). Clear signal of differentiation \u2014 roughly 20% score at or near 100%.', { color: GREY }),
      spacer(120),

      h2('Candidate Verbatims \u2014 Walmart'),
      ...walmartVerbatims.flatMap((v, i) => [
        i > 0 ? spacer(80) : spacer(0),
        verbatimBox(v.quote, v),
      ]),

      pageBreak(),

      // ── Section 4: Amazon ─────────────────────────────────────────────────
      h1('4. Amazon \u2014 Deep Dive'),
      body('Company ID: 115581  \u00b7  Period: 2026-01-01 \u2013 2026-04-10  \u00b7  Source: AI-assisted attempts only (user_msg_cnt > 3)'),
      spacer(80),

      h2('DLI Summary by Test'),
      buildDliTable(amazonDli, dliAdj),
      spacer(60),
      body('All four main Amazon sample tests score 89\u201391% positive DLI with avg ratings of 4.54\u20134.63. Sample Test for Django had the highest volume (297 responses).', { color: GREY }),
      spacer(120),

      h2('Score Distribution \u2014 Sample Test for Amazon Coding Challenge'),
      caption('AI-assisted attempts only.'),
      buildScoreTable(amazonScoreDist),
      spacer(60),
      body('Strong pass/fail pattern: 40 out of 63 scored 100% (full score). Very few mid-range scores, suggesting the test effectively separates strong performers.', { color: GREY }),
      spacer(120),

      h2('Score Distribution \u2014 Sample Test for Django'),
      caption('297 feedback responses, highest volume Amazon test.'),
      buildScoreTable(amazonDjangoScoreDist),
      spacer(60),
      body('Bimodal: 165 candidates (56%) scored 100%, while 23 scored below 10%. Mid-band (70\u201390%) shows healthy secondary cluster of 68 candidates.', { color: GREY }),
      spacer(120),

      h2('Candidate Verbatims \u2014 Amazon'),
      ...amazonVerbatims.flatMap((v, i) => [
        i > 0 ? spacer(80) : spacer(0),
        verbatimBox(v.quote, v),
      ]),

      spacer(200),

    ],
  }],
});

// ── Write file ───────────────────────────────────────────────────────────────
Packer.toBuffer(doc).then(buf => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, buf);
  console.log('Written:', OUT);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

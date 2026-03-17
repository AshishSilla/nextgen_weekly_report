"use strict";
const fs   = require("fs");
const path = require("path");
const PptxGenJS = require("pptxgenjs");

// ─── Brand tokens ─────────────────────────────────────────────────────────
const C = {
  deepNavy:    "0E141E",
  darkTeal:    "003333",
  brandGreen:  "05C770",
  limeAccent:  "AEF96C",
  white:       "FFFFFF",
  nearBlack:   "222222",
  darkGray:    "39424E",
  midGray:     "666666",
  lightGray1:  "E0E0E2",
  lightGray2:  "EEEEEE",
  lightGray3:  "F4F4F3",
  accentBlue:  "3355FF",
  accentCoral: "E46962",
  accentAmber: "FCB283",
};
const FONT_HEAD = "Manrope";
const FONT_BODY  = "Manrope";
const W = 10, H = 5.625;

// ─── Layout helpers ────────────────────────────────────────────────────────
function makeShadow() {
  return { type: "outer", color: "000000", blur: 8, offset: 3, angle: 135, opacity: 0.12 };
}
function leftAccentBar(s, color = C.brandGreen) {
  s.addShape("rect", { x: 0, y: 0, w: 0.12, h: H, fill: { color }, line: { color } });
}
function slideTitle(s, text, y = 0.28) {
  s.addText(text, {
    x: 0.28, y, w: 9.44, h: 0.52,
    fontFace: FONT_HEAD, fontSize: 20, bold: true, color: C.nearBlack, margin: 0,
  });
  s.addShape("rect", { x: 0.28, y: y + 0.54, w: 1.1, h: 0.04,
    fill: { color: C.brandGreen }, line: { color: C.brandGreen } });
}
function statCard(s, num, label, x, y, w = 2.1, h = 1.1, numColor = C.brandGreen, fontSize = 26) {
  s.addShape("rect", { x, y, w, h, fill: { color: C.white },
    line: { color: C.lightGray1, pt: 1 }, shadow: makeShadow() });
  s.addText(String(num), {
    x: x + 0.1, y: y + 0.07, w: w - 0.2, h: 0.58,
    fontFace: FONT_HEAD, fontSize, bold: true, color: numColor, align: "center", margin: 0,
  });
  s.addText(label, {
    x: x + 0.08, y: y + 0.66, w: w - 0.16, h: 0.36,
    fontFace: FONT_BODY, fontSize: 9.5, color: C.midGray, align: "center", margin: 0,
  });
}
function calloutBox(s, title, body, x, y, w, h, borderColor = C.brandGreen) {
  s.addShape("rect", { x, y, w, h, fill: { color: C.white },
    line: { color: borderColor, pt: 2 }, shadow: makeShadow() });
  s.addShape("rect", { x, y, w: 0.06, h, fill: { color: borderColor }, line: { color: borderColor } });
  s.addText(title, {
    x: x + 0.14, y: y + 0.08, w: w - 0.22, h: 0.22,
    fontFace: FONT_HEAD, fontSize: 9, bold: true, charSpacing: 1.5,
    color: borderColor, margin: 0,
  });
  s.addText(body, {
    x: x + 0.14, y: y + 0.32, w: w - 0.22, h: h - 0.4,
    fontFace: FONT_BODY, fontSize: 9.5, color: C.darkGray, margin: 0,
  });
}

// ─── Data — sorted by penetration % desc ──────────────────────────────────
const companies = [
  { name: "Avalara",            templates: 1, interviews:  78, total:  224, pct: 34.8, months: "Sep '25 – Feb '26",
    verbatims: ["GenAI skills assessment"] },
  { name: "Paxos",              templates: 1, interviews:   4, total:  101, pct:  4.0, months: "Sep '25 – Feb '26",
    verbatims: ["AI Collaboration"] },
  { name: "Dell Technologies",  templates: 2, interviews:  19, total: 3186, pct:  0.6, months: "Sep '25 – Feb '26",
    verbatims: ["Exposure to AI", "5) Generative AI Readiness (GAIR)"] },
  { name: "ServiceNow",         templates: 1, interviews:  17, total: 4314, pct:  0.4, months: "Sep '25 – Feb '26",
    verbatims: ["AI tools usage"] },
  { name: "Adobe Inc.",         templates: 2, interviews:   6, total: 6176, pct:  0.1, months: "Sep '25 – Feb '26",
    verbatims: [
      "Does the candidate demonstrate inquisitiveness to latest trends in Agentic and Gen AI",
      "Judgment and clarity in how LLMs are used, when to use them, and how they think about manipulating prompts",
    ]},
  { name: "McKinsey & Company", templates: 1, interviews:   1, total: 1234, pct:  0.1, months: "Sep '25 – Feb '26",
    verbatims: ["Use of GenAI"] },
];

// Title-only companies — AI-role hiring signal, sorted by penetration % desc
const titleOnlyCompanies = [
  { name: "Intact Financial Corporation",          templates: 1, interviews: 16, total:   72, pct: 22.2,
    scorecard: "Senior AI Dev Scorecard" },
  { name: "Balyasny Asset Management",             templates: 2, interviews: 32, total: 1605, pct:  2.0,
    scorecard: "AI Solutions Engineer – AI Enablement Team | Applied AI Engineer Scorecard" },
  { name: "Expedia Group",                         templates: 1, interviews: 21, total: 3861, pct:  0.5,
    scorecard: "Senior MLS (GenAI)" },
  { name: "ServiceTitan Inc.",                     templates: 1, interviews:  7, total: 1391, pct:  0.5,
    scorecard: "Senior ML Engineer (Generative AI) Scorecard" },
  { name: "Bolt",                                  templates: 1, interviews:  2, total:  977, pct:  0.2,
    scorecard: "Applied AI Engineer Scorecard" },
  { name: "Walmart Global Tech",                   templates: 1, interviews:  5, total: 5382, pct:  0.1,
    scorecard: "CV/AI/ML_Pipeline_Engineer" },
];

// ─── Pres setup ───────────────────────────────────────────────────────────
const pres = new PptxGenJS();
pres.layout = "LAYOUT_WIDE";
pres.author = "HackerRank NextGen · Q2 2026";

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 1 — Title
// ══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  // full-bleed dark background
  s.background = { color: C.deepNavy };
  // green accent top bar
  s.addShape("rect", { x: 0, y: 0, w: W, h: 0.12, fill: { color: C.brandGreen }, line: { color: C.brandGreen } });
  // HackerRank wordmark area
  s.addText("HACKERRANK", {
    x: 0.4, y: 0.28, w: 3, h: 0.32,
    fontFace: FONT_HEAD, fontSize: 13, bold: true, color: C.brandGreen, charSpacing: 3, margin: 0,
  });
  // Main title
  s.addText("AI Fluency in Interviews", {
    x: 0.4, y: 1.4, w: 9.2, h: 0.9,
    fontFace: FONT_HEAD, fontSize: 40, bold: true, color: C.white, margin: 0,
  });
  s.addText("Who's Already Measuring It?", {
    x: 0.4, y: 2.28, w: 9.2, h: 0.7,
    fontFace: FONT_HEAD, fontSize: 30, bold: false, color: C.limeAccent, margin: 0,
  });
  // divider
  s.addShape("rect", { x: 0.4, y: 3.1, w: 1.6, h: 0.05,
    fill: { color: C.brandGreen }, line: { color: C.brandGreen } });
  // subtitle
  s.addText("Signal analysis across 26K interview-scorecard rows · 125 AI-evaluated interviews identified · Mar 2026", {
    x: 0.4, y: 3.24, w: 9.2, h: 0.36,
    fontFace: FONT_BODY, fontSize: 11, color: "8899AA", margin: 0,
  });
  s.addText("NextGen Q2 2026 · Confidential", {
    x: 0.4, y: 4.9, w: 9.2, h: 0.3,
    fontFace: FONT_BODY, fontSize: 9, color: "556677", margin: 0,
  });
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 2A — Executive Summary · Strong Signal Only
// ══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.lightGray3 };
  leftAccentBar(s);
  slideTitle(s, "Executive Summary — Strong Signal");

  // tier badge
  s.addShape("rect", { x: 7.4, y: 0.28, w: 2.1, h: 0.32,
    fill: { color: C.brandGreen }, line: { color: C.brandGreen } });
  s.addText("STRONG SIGNAL ONLY", { x: 7.46, y: 0.32, w: 1.98, h: 0.24,
    fontFace: FONT_HEAD, fontSize: 7, bold: true, charSpacing: 1.0, color: C.nearBlack, align: "center", margin: 0 });

  statCard(s, "0.8%", "Blended AI-fluency\npenetration across 6 cos", 0.28, 1.08, 2.9, 1.3, C.brandGreen, 34);
  statCard(s, "125",  "Candidates evaluated\non explicit AI dimensions", 3.5, 1.08, 2.9, 1.3, C.accentBlue, 42);
  statCard(s, "8",    "Scorecard templates with\nexplicit AI fields",    6.72, 1.08, 2.9, 1.3, C.accentAmber, 42);

  calloutBox(s,
    "KEY INSIGHT — STRONG SIGNAL",
    "Only 0.8% of interviews at these 6 companies include an explicit AI-fluency rating dimension — yet those 125 candidates were " +
    "evaluated on fields like \"AI Collaboration\", \"GenAI skills assessment\", and \"Use of GenAI\", built inside 8 custom scorecard " +
    "templates. The remaining 99.2% represents untapped opportunity. Avalara leads at 34.8% penetration; " +
    "large enterprises (Adobe, ServiceNow, Dell) are under 1% — the pattern of early adoption is unmistakable.",
    0.28, 2.6, 9.44, 1.72, C.brandGreen
  );

  s.addText("Source: 26,065 rows · Interviews_Custom_scorecard_Used_2026_03_09.csv · Sep 2025 – Feb 2026 · Strong = section_field_title matches AI keyword", {
    x: 0.28, y: 4.96, w: 9.44, h: 0.26,
    fontFace: FONT_BODY, fontSize: 7.5, color: C.midGray, margin: 0,
  });
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 2B — Executive Summary · Title-Only Signal
// ══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.lightGray3 };
  leftAccentBar(s, C.midGray);
  slideTitle(s, "Executive Summary — Title-Only Signal");

  // tier badge
  s.addShape("rect", { x: 7.4, y: 0.28, w: 2.1, h: 0.32,
    fill: { color: C.lightGray1 }, line: { color: C.midGray, pt: 1 } });
  s.addText("TITLE-ONLY SIGNAL", { x: 7.46, y: 0.32, w: 1.98, h: 0.24,
    fontFace: FONT_HEAD, fontSize: 7, bold: true, charSpacing: 1.0, color: C.darkGray, align: "center", margin: 0 });

  statCard(s, "0.6%", "Avg penetration across\n6 title-only companies",   0.28, 1.08, 2.9, 1.3, C.darkGray, 34);
  statCard(s, "83",   "Interviews conducted\non AI-role scorecards",       3.5,  1.08, 2.9, 1.3, C.accentBlue, 42);
  statCard(s, "7",    "Scorecard templates\nnamed for AI roles",           6.72, 1.08, 2.9, 1.3, C.accentAmber, 42);

  calloutBox(s,
    "KEY INSIGHT — TITLE-ONLY SIGNAL",
    "6 additional companies are actively building AI-role pipelines — using templates like \"Applied AI Engineer Scorecard\" and " +
    "\"Senior MLS (GenAI)\" — but their rating fields don't yet explicitly score AI fluency. Intact Financial leads at 22.2% penetration " +
    "on these scorecards. These companies are the highest-conversion candidates for an AI Fluency product: " +
    "they've already created the structure; they just need the validated dimensions.",
    0.28, 2.6, 9.44, 1.72, C.midGray
  );

  s.addText("Source: 26,065 rows · Interviews_Custom_scorecard_Used_2026_03_09.csv · Sep 2025 – Feb 2026 · Title-only = scorecard title matches AI keyword, fields are generic", {
    x: 0.28, y: 4.96, w: 9.44, h: 0.26,
    fontFace: FONT_BODY, fontSize: 7.5, color: C.midGray, margin: 0,
  });
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 2C — Executive Summary · Combined / All Companies
// ══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.lightGray3 };
  leftAccentBar(s);
  slideTitle(s, "Executive Summary — All Companies Combined");

  // tier badge
  s.addShape("rect", { x: 7.4, y: 0.28, w: 2.1, h: 0.32,
    fill: { color: C.accentBlue }, line: { color: C.accentBlue } });
  s.addText("STRONG + TITLE-ONLY", { x: 7.46, y: 0.32, w: 1.98, h: 0.24,
    fontFace: FONT_HEAD, fontSize: 7, bold: true, charSpacing: 1.0, color: C.white, align: "center", margin: 0 });

  statCard(s, "0.7%", "Combined penetration\nacross all 12 companies",   0.28, 1.08, 2.9, 1.3, C.brandGreen, 34);
  statCard(s, "208",  "Total interviews with\nany AI signal",             3.5,  1.08, 2.9, 1.3, C.accentBlue, 42);
  statCard(s, "12",   "Companies with any\nAI-signal scorecard",          6.72, 1.08, 2.9, 1.3, C.accentAmber, 42);

  calloutBox(s,
    "KEY INSIGHT — FULL PICTURE",
    "Across all 12 companies with any AI signal: 208 interviews touch an AI-related dimension (125 strong + 83 title-only), " +
    "representing 0.7% of 28,523 combined interviews. 6 companies explicitly measure AI fluency in their rubrics (strong signal); " +
    "6 more are hiring into AI roles but haven't yet built AI-fluency rating dimensions (title-only). " +
    "Together they represent the addressable market for a structured AI Fluency scorecard product.",
    0.28, 2.6, 9.44, 1.72, C.accentBlue
  );

  s.addText("Source: 26,065 rows · Interviews_Custom_scorecard_Used_2026_03_09.csv · Sep 2025 – Feb 2026 · 125 strong + 83 title-only = 208 total · 15,235 + 13,288 = 28,523 total interviews", {
    x: 0.28, y: 4.96, w: 9.44, h: 0.26,
    fontFace: FONT_BODY, fontSize: 7.5, color: C.midGray, margin: 0,
  });
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 3 — Signal Tier Explanation
// ══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  leftAccentBar(s);
  slideTitle(s, "How We Detected AI-Fluency Signals");

  // Tier 1 box
  s.addShape("rect", { x: 0.28, y: 1.1, w: 4.5, h: 2.8,
    fill: { color: C.brandGreen }, line: { color: C.brandGreen }, shadow: makeShadow() });
  s.addText("STRONG SIGNAL", {
    x: 0.42, y: 1.24, w: 4.22, h: 0.34,
    fontFace: FONT_HEAD, fontSize: 12, bold: true, charSpacing: 2, color: C.nearBlack, margin: 0,
  });
  s.addText("6 companies · 8 scorecard templates · 125 AI-evaluated interviews", {
    x: 0.42, y: 1.56, w: 4.22, h: 0.28,
    fontFace: FONT_BODY, fontSize: 10, color: C.nearBlack, margin: 0,
  });
  s.addShape("rect", { x: 0.42, y: 1.88, w: 4.0, h: 0.03,
    fill: { color: "555555" }, line: { color: "555555" } });
  s.addText(
    "The individual rating field title itself contains an AI keyword.\n\n" +
    "Example: a scorecard section for \"Technical Skills\" contains a field titled \"AI Fluency\" or \"GenAI Readiness\".\n\n" +
    "This means an interviewer is directly rating the candidate on an AI dimension — not just interviewing for an AI role.",
    {
      x: 0.42, y: 1.96, w: 4.22, h: 1.8,
      fontFace: FONT_BODY, fontSize: 10, color: C.nearBlack, margin: 0,
    }
  );

  // Tier 2 box
  s.addShape("rect", { x: 5.22, y: 1.1, w: 4.5, h: 2.8,
    fill: { color: C.lightGray2 }, line: { color: C.lightGray1, pt: 1 }, shadow: makeShadow() });
  s.addText("TITLE-ONLY SIGNAL", {
    x: 5.36, y: 1.24, w: 4.22, h: 0.34,
    fontFace: FONT_HEAD, fontSize: 12, bold: true, charSpacing: 2, color: C.darkGray, margin: 0,
  });
  s.addText("6 companies · 7 scorecard templates", {
    x: 5.36, y: 1.56, w: 4.22, h: 0.28,
    fontFace: FONT_BODY, fontSize: 10, color: C.midGray, margin: 0,
  });
  s.addShape("rect", { x: 5.36, y: 1.88, w: 4.0, h: 0.03,
    fill: { color: C.lightGray1 }, line: { color: C.lightGray1 } });
  s.addText(
    "The scorecard title includes an AI keyword, but the individual rating fields are generic (e.g., \"Communication\", \"Problem Solving\").\n\n" +
    "Example: scorecard named \"Applied AI Engineer Scorecard\" but fields don't explicitly rate AI skills.\n\n" +
    "This indicates AI-role hiring, not yet AI-fluency evaluation — weaker signal, excluded from primary count.",
    {
      x: 5.36, y: 1.96, w: 4.22, h: 1.8,
      fontFace: FONT_BODY, fontSize: 10, color: C.darkGray, margin: 0,
    }
  );

  // Methodology note
  s.addShape("rect", { x: 0.28, y: 4.1, w: 9.44, h: 0.9,
    fill: { color: C.lightGray3 }, line: { color: C.lightGray1, pt: 1 } });
  s.addText("METHODOLOGY", {
    x: 0.42, y: 4.18, w: 2, h: 0.22,
    fontFace: FONT_HEAD, fontSize: 8, bold: true, charSpacing: 1.5, color: C.brandGreen, margin: 0,
  });
  s.addText(
    "Unit of analysis: scorecard_title (the template name). Note: scorecard_id in the data is an interviewer ID, not a template ID — " +
    "the same interviewer uses many templates and the same template is used by many interviewers. " +
    "AI keyword regex applied to section_field_title across 26,065 rows. Strong signal = at least one field title explicitly names an AI competency. " +
    "Title-only = scorecard title contains AI keyword but no AI field titles exist.",
    {
      x: 0.42, y: 4.38, w: 9.16, h: 0.56,
      fontFace: FONT_BODY, fontSize: 8.5, color: C.darkGray, margin: 0,
    }
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 4A — Strong-Signal Companies (explicitly measuring AI fluency)
// ══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.lightGray3 };
  leftAccentBar(s);
  slideTitle(s, "Companies Explicitly Measuring AI Fluency  ·  Strong Signal");

  // tier badge
  s.addShape("rect", { x: 7.6, y: 0.28, w: 1.9, h: 0.32,
    fill: { color: C.brandGreen }, line: { color: C.brandGreen } });
  s.addText("STRONG SIGNAL", { x: 7.66, y: 0.32, w: 1.78, h: 0.24,
    fontFace: FONT_HEAD, fontSize: 7.5, bold: true, charSpacing: 1.2, color: C.nearBlack, align: "center", margin: 0 });

  const colX   = [0.28, 3.08, 4.44, 5.74, 6.88];
  const colW   = [2.74, 1.3,  1.24, 1.08, 2.84];
  const headers = ["Company", "AI-Rated\nInterviews", "Total\nInterviews", "Penetration", "AI Rating Dimension"];
  const headerY = 1.08;
  const rowH    = 0.47;

  s.addShape("rect", { x: 0.28, y: headerY, w: 9.44, h: 0.38,
    fill: { color: C.nearBlack }, line: { color: C.nearBlack } });
  headers.forEach((h, i) => {
    s.addText(h, {
      x: colX[i] + 0.06, y: headerY + 0.02, w: colW[i] - 0.08, h: 0.34,
      fontFace: FONT_HEAD, fontSize: 7.5, bold: true, color: C.white,
      align: i === 0 ? "left" : "center", valign: "middle", margin: 0,
    });
  });

  companies.forEach((co, idx) => {
    const ry = headerY + 0.38 + idx * rowH;
    const bg = idx % 2 === 0 ? C.white : "F2FDF6";
    s.addShape("rect", { x: 0.28, y: ry, w: 9.44, h: rowH - 0.01,
      fill: { color: bg }, line: { color: C.lightGray1, pt: 0.5 } });

    const sample   = co.verbatims[0].length > 45 ? co.verbatims[0].slice(0, 45) + "…" : co.verbatims[0];
    const pctStr   = co.pct.toFixed(1) + "%";
    const pctColor = co.pct >= 10 ? C.brandGreen : co.pct >= 2 ? C.accentAmber : C.accentCoral;
    const vals     = [co.name, co.interviews.toLocaleString(), co.total.toLocaleString(), pctStr, sample];
    const aligns   = ["left", "center", "center", "center", "left"];

    vals.forEach((v, i) => {
      const isPct = i === 3;
      s.addText(v, {
        x: colX[i] + 0.06, y: ry + 0.12, w: colW[i] - 0.08, h: 0.26,
        fontFace: FONT_BODY, fontSize: 9, bold: isPct,
        color: isPct ? pctColor : (i === 0 ? C.nearBlack : C.darkGray),
        align: aligns[i], margin: 0,
      });
    });
    // sub-line: show all verbatims for company
    if (co.verbatims.length > 1) {
      const sub = co.verbatims.slice(1).map(v => v.length > 50 ? v.slice(0, 50) + "…" : v).join(" · ");
      s.addText(sub, {
        x: colX[4] + 0.06, y: ry + 0.30, w: colW[4] - 0.08, h: 0.14,
        fontFace: FONT_BODY, fontSize: 7, color: C.midGray, margin: 0,
      });
    }
  });

  // Total row
  const totalY = headerY + 0.38 + companies.length * rowH;
  s.addShape("rect", { x: 0.28, y: totalY, w: 9.44, h: 0.3,
    fill: { color: C.deepNavy }, line: { color: C.deepNavy } });
  s.addText("TOTAL / BLENDED", { x: 0.34, y: totalY + 0.04, w: 2.68, h: 0.22,
    fontFace: FONT_HEAD, fontSize: 8, bold: true, color: C.white, margin: 0 });
  s.addText("125",    { x: colX[1] + 0.06, y: totalY + 0.04, w: colW[1] - 0.08, h: 0.22,
    fontFace: FONT_HEAD, fontSize: 8, bold: true, color: C.brandGreen, align: "center", margin: 0 });
  s.addText("15,235", { x: colX[2] + 0.06, y: totalY + 0.04, w: colW[2] - 0.08, h: 0.22,
    fontFace: FONT_HEAD, fontSize: 8, bold: true, color: C.white, align: "center", margin: 0 });
  s.addText("0.8%",   { x: colX[3] + 0.06, y: totalY + 0.04, w: colW[3] - 0.08, h: 0.22,
    fontFace: FONT_HEAD, fontSize: 8, bold: true, color: C.limeAccent, align: "center", margin: 0 });
  s.addText("6 companies · 8 templates · 99.2% of interviews still untapped", {
    x: colX[4] + 0.06, y: totalY + 0.04, w: colW[4] - 0.08, h: 0.22,
    fontFace: FONT_BODY, fontSize: 7.5, italic: true, color: C.limeAccent, margin: 0,
  });

  // Bottom insight callout
  const insightY = totalY + 0.38;
  s.addShape("rect", { x: 0.28, y: insightY, w: 9.44, h: 0.72,
    fill: { color: "EDF9F3" }, line: { color: C.brandGreen, pt: 1 } });
  s.addShape("rect", { x: 0.28, y: insightY, w: 0.06, h: 0.72,
    fill: { color: C.brandGreen }, line: { color: C.brandGreen } });
  s.addText("STANDOUT", { x: 0.42, y: insightY + 0.06, w: 1.2, h: 0.18,
    fontFace: FONT_HEAD, fontSize: 7.5, bold: true, charSpacing: 1.2, color: C.brandGreen, margin: 0 });
  s.addText(
    "Avalara at 34.8% is 43× the cohort blended average — proving large-scale AI-fluency evaluation is operationally feasible. " +
    "Large enterprises (Adobe 6,176 interviews, ServiceNow 4,314) are under 1%, representing the largest untapped opportunity.",
    { x: 0.42, y: insightY + 0.26, w: 9.22, h: 0.42,
      fontFace: FONT_BODY, fontSize: 8.5, color: C.darkGray, margin: 0 }
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 4B — Title-Only Companies (hiring for AI roles)
// ══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.lightGray3 };
  leftAccentBar(s, C.midGray);
  slideTitle(s, "Companies Hiring for AI Roles  ·  Title-Only Signal");

  // tier badge
  s.addShape("rect", { x: 7.6, y: 0.28, w: 1.9, h: 0.32,
    fill: { color: C.lightGray1 }, line: { color: C.midGray, pt: 1 } });
  s.addText("TITLE-ONLY SIGNAL", { x: 7.66, y: 0.32, w: 1.78, h: 0.24,
    fontFace: FONT_HEAD, fontSize: 7, bold: true, charSpacing: 1.0, color: C.darkGray, align: "center", margin: 0 });

  const colX   = [0.28, 3.08, 4.44, 5.74, 6.88];
  const colW   = [2.74, 1.3,  1.24, 1.08, 2.84];
  const headers = ["Company", "Intrvws on\nAI Scorecard", "Total\nInterviews", "Penetration", "Scorecard Template"];
  const headerY = 1.08;
  const rowH    = 0.47;

  s.addShape("rect", { x: 0.28, y: headerY, w: 9.44, h: 0.38,
    fill: { color: C.darkGray }, line: { color: C.darkGray } });
  headers.forEach((h, i) => {
    s.addText(h, {
      x: colX[i] + 0.06, y: headerY + 0.02, w: colW[i] - 0.08, h: 0.34,
      fontFace: FONT_HEAD, fontSize: 7.5, bold: true, color: C.white,
      align: i === 0 ? "left" : "center", valign: "middle", margin: 0,
    });
  });

  titleOnlyCompanies.forEach((co, idx) => {
    const ry = headerY + 0.38 + idx * rowH;
    const bg = idx % 2 === 0 ? C.white : C.lightGray3;
    s.addShape("rect", { x: 0.28, y: ry, w: 9.44, h: rowH - 0.01,
      fill: { color: bg }, line: { color: C.lightGray1, pt: 0.5 } });

    const sc       = co.scorecard.length > 45 ? co.scorecard.slice(0, 45) + "…" : co.scorecard;
    const pctStr   = co.pct.toFixed(1) + "%";
    const pctColor = co.pct >= 10 ? C.brandGreen : co.pct >= 2 ? C.accentAmber : C.accentCoral;
    const vals     = [co.name, co.interviews.toLocaleString(), co.total.toLocaleString(), pctStr, sc];
    const aligns   = ["left", "center", "center", "center", "left"];

    vals.forEach((v, i) => {
      const isPct = i === 3;
      s.addText(v, {
        x: colX[i] + 0.06, y: ry + 0.12, w: colW[i] - 0.08, h: 0.26,
        fontFace: FONT_BODY, fontSize: 9, bold: isPct,
        color: isPct ? pctColor : (i === 0 ? C.nearBlack : C.darkGray),
        align: aligns[i], margin: 0,
      });
    });
  });

  // Total row
  const toTotal      = titleOnlyCompanies.reduce((a, c) => a + c.interviews, 0);
  const toTotalIntvw = titleOnlyCompanies.reduce((a, c) => a + c.total, 0);
  const totalY = headerY + 0.38 + titleOnlyCompanies.length * rowH;
  s.addShape("rect", { x: 0.28, y: totalY, w: 9.44, h: 0.3,
    fill: { color: "3A3A3A" }, line: { color: "3A3A3A" } });
  s.addText("TOTAL", { x: 0.34, y: totalY + 0.04, w: 2.68, h: 0.22,
    fontFace: FONT_HEAD, fontSize: 8, bold: true, color: C.white, margin: 0 });
  s.addText(toTotal.toLocaleString(), { x: colX[1] + 0.06, y: totalY + 0.04, w: colW[1] - 0.08, h: 0.22,
    fontFace: FONT_HEAD, fontSize: 8, bold: true, color: C.limeAccent, align: "center", margin: 0 });
  s.addText(toTotalIntvw.toLocaleString(), { x: colX[2] + 0.06, y: totalY + 0.04, w: colW[2] - 0.08, h: 0.22,
    fontFace: FONT_HEAD, fontSize: 8, bold: true, color: C.white, align: "center", margin: 0 });
  s.addText("0.6%", { x: colX[3] + 0.06, y: totalY + 0.04, w: colW[3] - 0.08, h: 0.22,
    fontFace: FONT_HEAD, fontSize: 8, bold: true, color: C.limeAccent, align: "center", margin: 0 });
  s.addText("6 companies · 7 templates · rating fields are generic, not AI-fluency rated", {
    x: colX[4] + 0.06, y: totalY + 0.04, w: colW[4] - 0.08, h: 0.22,
    fontFace: FONT_BODY, fontSize: 7.5, italic: true, color: "AAAAAA", margin: 0,
  });

  // Bottom insight callout
  const insightY = totalY + 0.38;
  s.addShape("rect", { x: 0.28, y: insightY, w: 9.44, h: 0.72,
    fill: { color: C.lightGray3 }, line: { color: C.midGray, pt: 1 } });
  s.addShape("rect", { x: 0.28, y: insightY, w: 0.06, h: 0.72,
    fill: { color: C.midGray }, line: { color: C.midGray } });
  s.addText("CONVERSION OPPORTUNITY", { x: 0.42, y: insightY + 0.06, w: 2.4, h: 0.18,
    fontFace: FONT_HEAD, fontSize: 7.5, bold: true, charSpacing: 1.2, color: C.darkGray, margin: 0 });
  s.addText(
    "These 6 companies already built AI-role scorecard structures — they're one step from AI-fluency evaluation. " +
    "Intact Financial at 22.2% penetration on AI-role scorecards shows strong AI-hiring intent. " +
    "A pre-built AI Fluency module converts their existing template investment into a validated, benchmarkable rubric.",
    { x: 0.42, y: insightY + 0.26, w: 9.22, h: 0.42,
      fontFace: FONT_BODY, fontSize: 8.5, color: C.darkGray, margin: 0 }
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 4C — Combined View — All 12 Companies
// ══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.lightGray3 };
  leftAccentBar(s);
  slideTitle(s, "All Companies with AI Signal  ·  Combined View");

  // Build merged rows: strong first (sorted by pct desc), then title-only
  const allRows = [
    ...companies.map(c => ({
      name: c.name, tier: "Strong", interviews: c.interviews, total: c.total,
      pct: c.pct, signal: c.verbatims[0],
    })),
    ...titleOnlyCompanies.map(c => ({
      name: c.name, tier: "Title-only", interviews: c.interviews, total: c.total,
      pct: c.pct, signal: c.scorecard,
    })),
  ];

  // Columns: Tier | Company | AI Intrvws | Total | Pct | Key Signal
  const colX   = [0.28, 1.14, 3.64, 4.68, 5.72, 6.64];
  const colW   = [0.80, 2.44, 0.98, 0.98, 0.86, 3.08];
  const headers = ["Tier", "Company", "AI Intrvws", "Total", "Pct", "Key Signal"];
  const headerY = 0.96;
  const rowH    = 0.30;

  s.addShape("rect", { x: 0.28, y: headerY, w: 9.44, h: 0.34,
    fill: { color: C.nearBlack }, line: { color: C.nearBlack } });
  headers.forEach((h, i) => {
    s.addText(h, {
      x: colX[i] + 0.04, y: headerY + 0.02, w: colW[i] - 0.06, h: 0.30,
      fontFace: FONT_HEAD, fontSize: 7.5, bold: true, color: C.white,
      align: i <= 1 ? "left" : "center", valign: "middle", margin: 0,
    });
  });

  allRows.forEach((row, idx) => {
    const ry     = headerY + 0.34 + idx * rowH;
    const isStrong = row.tier === "Strong";
    // Alternating: strong rows get very light green, title-only rows get white/light-gray
    const bg = isStrong
      ? (idx % 2 === 0 ? "F0FDF5" : "E8FBF0")
      : (idx % 2 === 0 ? C.white : C.lightGray3);

    s.addShape("rect", { x: 0.28, y: ry, w: 9.44, h: rowH - 0.01,
      fill: { color: bg }, line: { color: C.lightGray1, pt: 0.4 } });

    // Tier pill
    s.addShape("rect", { x: colX[0] + 0.04, y: ry + 0.05, w: 0.7, h: 0.18,
      fill: { color: isStrong ? C.brandGreen : C.lightGray1 },
      line: { color: isStrong ? C.brandGreen : C.midGray, pt: 0.5 } });
    s.addText(isStrong ? "Strong" : "Title", {
      x: colX[0] + 0.04, y: ry + 0.05, w: 0.7, h: 0.18,
      fontFace: FONT_HEAD, fontSize: 6.5, bold: true,
      color: isStrong ? C.nearBlack : C.darkGray,
      align: "center", valign: "middle", margin: 0,
    });

    const sig    = row.signal.length > 46 ? row.signal.slice(0, 46) + "…" : row.signal;
    const pctStr = row.pct.toFixed(1) + "%";
    const pctColor = row.pct >= 10 ? C.brandGreen : row.pct >= 2 ? C.accentAmber : C.accentCoral;
    const dataVals = [row.name, row.interviews.toLocaleString(), row.total.toLocaleString(), pctStr, sig];
    const dataAligns = ["left", "center", "center", "center", "left"];
    const dataColX   = colX.slice(1);
    const dataColW   = colW.slice(1);

    dataVals.forEach((v, i) => {
      const isPct = i === 3;
      s.addText(v, {
        x: dataColX[i] + 0.04, y: ry + 0.06, w: dataColW[i] - 0.06, h: 0.18,
        fontFace: FONT_BODY, fontSize: 7.5, bold: isPct,
        color: isPct ? pctColor : (i === 0 ? C.nearBlack : C.darkGray),
        align: dataAligns[i], margin: 0,
      });
    });
  });

  // Divider line between strong and title-only sections
  const divY = headerY + 0.34 + companies.length * rowH;
  s.addShape("rect", { x: 0.28, y: divY - 0.01, w: 9.44, h: 0.03,
    fill: { color: C.midGray }, line: { color: C.midGray } });

  // Footer note
  const noteY = headerY + 0.34 + allRows.length * rowH + 0.08;
  s.addText(
    "Strong = scorecard field title explicitly names an AI competency.  Title-only = scorecard name includes AI keyword but individual rating fields are generic.",
    { x: 0.28, y: noteY, w: 9.44, h: 0.22,
      fontFace: FONT_BODY, fontSize: 7, color: C.midGray, italic: true, margin: 0 }
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 5 — AI Field Verbatims
// ══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };
  leftAccentBar(s);
  slideTitle(s, "Exact Field Titles Interviewers Are Rating Candidates On");

  // 3-column card layout (3 rows × 3 cols = 9 companies)
  const CARD_W = 2.98, CARD_H = 1.55;
  const COLS = 3;
  const startX = 0.28, startY = 1.1, gapX = 0.14, gapY = 0.12;

  companies.forEach((co, idx) => {
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const cx = startX + col * (CARD_W + gapX);
    const cy = startY + row * (CARD_H + gapY);

    // card bg
    s.addShape("rect", { x: cx, y: cy, w: CARD_W, h: CARD_H,
      fill: { color: C.lightGray3 }, line: { color: C.lightGray1, pt: 1 }, shadow: makeShadow() });
    // top accent
    s.addShape("rect", { x: cx, y: cy, w: CARD_W, h: 0.06,
      fill: { color: C.brandGreen }, line: { color: C.brandGreen } });

    // company name
    const shortName = co.name.replace("Global Tech Talent Acquisition", "Global Tech");
    s.addText(shortName, {
      x: cx + 0.1, y: cy + 0.1, w: CARD_W - 0.2, h: 0.26,
      fontFace: FONT_HEAD, fontSize: 8.5, bold: true, color: C.nearBlack, margin: 0,
    });

    // verbatims as bullet list
    const bullets = co.verbatims.slice(0, 3).map(v => ({
      text: v.length > 60 ? v.slice(0, 60) + "…" : v,
      options: { bullet: { type: "number" }, indentLevel: 0, fontSize: 7.5, color: C.darkGray },
    }));
    s.addText(bullets, {
      x: cx + 0.1, y: cy + 0.38, w: CARD_W - 0.2, h: CARD_H - 0.48,
      fontFace: FONT_BODY, fontSize: 7.5, color: C.darkGray, margin: 0,
    });
  });
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 6 — Opportunity Map
// ══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.lightGray3 };
  leftAccentBar(s);
  slideTitle(s, "Opportunity Map — AI Fluency × AI Assistant Overlap");

  // Left: current signal companies
  s.addShape("rect", { x: 0.28, y: 1.08, w: 4.4, h: 3.5,
    fill: { color: C.white }, line: { color: C.lightGray1, pt: 1 }, shadow: makeShadow() });
  s.addText("ALREADY MEASURING AI FLUENCY", {
    x: 0.42, y: 1.18, w: 4.12, h: 0.26,
    fontFace: FONT_HEAD, fontSize: 8.5, bold: true, charSpacing: 1.5, color: C.brandGreen, margin: 0,
  });
  s.addText("6 companies — confirmed strong signal", {
    x: 0.42, y: 1.44, w: 4.12, h: 0.2,
    fontFace: FONT_BODY, fontSize: 8, color: C.midGray, margin: 0,
  });

  const leftCos = companies.map(c => c.name.replace("Global Tech Talent Acquisition", "Global Tech"));
  leftCos.forEach((name, i) => {
    const y = 1.7 + i * 0.3;
    s.addShape("rect", { x: 0.5, y: y + 0.04, w: 0.14, h: 0.14,
      fill: { color: C.brandGreen }, line: { color: C.brandGreen } });
    s.addText(name, {
      x: 0.72, y, w: 3.9, h: 0.28,
      fontFace: FONT_BODY, fontSize: 9, color: C.nearBlack, margin: 0,
    });
  });

  // Right: cross-reference box
  s.addShape("rect", { x: 5.1, y: 1.08, w: 4.62, h: 3.5,
    fill: { color: C.white }, line: { color: C.lightGray1, pt: 1 }, shadow: makeShadow() });
  s.addText("CROSS-REFERENCE: AI ASSISTANT USERS", {
    x: 5.24, y: 1.18, w: 4.34, h: 0.26,
    fontFace: FONT_HEAD, fontSize: 8.5, bold: true, charSpacing: 1.5, color: C.accentBlue, margin: 0,
  });
  s.addText("Companies in the AI Fluency cohort that also use HackerRank AI Assistant:", {
    x: 5.24, y: 1.44, w: 4.34, h: 0.32,
    fontFace: FONT_BODY, fontSize: 8.5, color: C.darkGray, margin: 0,
  });

  // Pending data box
  s.addShape("rect", { x: 5.24, y: 1.84, w: 4.34, h: 1.5,
    fill: { color: C.lightGray3 }, line: { color: C.accentBlue, pt: 1.5 } });
  s.addText("⟳  Pending cross-reference", {
    x: 5.34, y: 1.96, w: 4.14, h: 0.32,
    fontFace: FONT_HEAD, fontSize: 10, bold: true, color: C.accentBlue, align: "center", margin: 0,
  });
  s.addText(
    "Match the 9 companies against AI Assistant usage data (ai-assistant-companies.csv) to identify overlap.\n\n" +
    "High-overlap companies = strongest candidates for AI Fluency product outreach.",
    {
      x: 5.34, y: 2.3, w: 4.14, h: 1.0,
      fontFace: FONT_BODY, fontSize: 9, color: C.midGray, align: "center", margin: 0,
    }
  );

  // Bottom insight
  s.addShape("rect", { x: 5.24, y: 3.44, w: 4.34, h: 1.0,
    fill: { color: C.deepNavy }, line: { color: C.deepNavy } });
  s.addText("WHY THIS MATTERS", {
    x: 5.38, y: 3.54, w: 4.1, h: 0.22,
    fontFace: FONT_HEAD, fontSize: 8, bold: true, charSpacing: 1.5, color: C.brandGreen, margin: 0,
  });
  s.addText(
    "Companies using both AI Assistant AND building custom AI-fluency rubrics are already our most engaged AI customers. " +
    "They are the natural first buyers of a structured AI Fluency product.",
    {
      x: 5.38, y: 3.78, w: 4.1, h: 0.62,
      fontFace: FONT_BODY, fontSize: 8.5, color: C.white, margin: 0,
    }
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SLIDE 7 — Recommendation / Next Steps
// ══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.deepNavy };
  s.addShape("rect", { x: 0, y: 0, w: 0.12, h: H, fill: { color: C.brandGreen }, line: { color: C.brandGreen } });
  s.addShape("rect", { x: 0, y: 0, w: W, h: 0.12, fill: { color: C.brandGreen }, line: { color: C.brandGreen } });

  s.addText("Recommendation", {
    x: 0.28, y: 0.24, w: 9.44, h: 0.52,
    fontFace: FONT_HEAD, fontSize: 20, bold: true, color: C.white, margin: 0,
  });
  s.addShape("rect", { x: 0.28, y: 0.78, w: 1.1, h: 0.04,
    fill: { color: C.brandGreen }, line: { color: C.brandGreen } });

  const steps = [
    {
      num: "01",
      title: "Cross-reference with AI Assistant data",
      body: "Match the 9 companies against AI Assistant usage data. Companies using both AI Assistant AND custom AI-fluency rubrics are priority-1 for product outreach.",
    },
    {
      num: "02",
      title: "Conduct 3 customer interviews",
      body: "Two conversations: (1) Vanguard & Avalara — already at 35–87% penetration, ask what drove scale-up. (2) Adobe & Walmart — at 1–2%, ask what's blocking broader rollout.",
    },
    {
      num: "03",
      title: "Define the product extension",
      body: "Design a structured AI Fluency scorecard module — pre-built dimensions (AI tool usage, prompt quality, GenAI literacy) replacing 9 companies' DIY rubrics with a validated, benchmarkable standard.",
    },
    {
      num: "04",
      title: "Track penetration rate monthly",
      body: "Blended penetration is 0.8% today. Re-run monthly. If blended penetration crosses 5%, or Avalara-style adoption (>30%) appears at a second large company, escalate as Q3 priority signal.",
    },
  ];

  steps.forEach((step, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = col === 0 ? 0.28 : 5.28;
    const y = row === 0 ? 1.02 : 3.0;
    const w = 4.7, h = 1.72;

    s.addShape("rect", { x, y, w, h,
      fill: { color: "1A2A3A" }, line: { color: C.brandGreen, pt: 1 } });
    // number pill
    s.addShape("rect", { x: x + 0.14, y: y + 0.14, w: 0.46, h: 0.38,
      fill: { color: C.brandGreen }, line: { color: C.brandGreen } });
    s.addText(step.num, {
      x: x + 0.14, y: y + 0.14, w: 0.46, h: 0.38,
      fontFace: FONT_HEAD, fontSize: 13, bold: true, color: C.nearBlack, align: "center", margin: 0,
    });
    s.addText(step.title, {
      x: x + 0.7, y: y + 0.16, w: w - 0.84, h: 0.34,
      fontFace: FONT_HEAD, fontSize: 10, bold: true, color: C.limeAccent, margin: 0,
    });
    s.addText(step.body, {
      x: x + 0.14, y: y + 0.62, w: w - 0.28, h: 1.0,
      fontFace: FONT_BODY, fontSize: 9, color: "CCDDCC", margin: 0,
    });
  });
}

// ─── Write file ────────────────────────────────────────────────────────────
const OUT = path.join(__dirname, "Scorecard-AI-Signals-Q2-2026.pptx");
pres.writeFile({ fileName: OUT }).then(() => {
  console.log(`✓ Deck written → ${OUT}`);
}).catch(err => {
  console.error("Error writing PPTX:", err);
  process.exit(1);
});

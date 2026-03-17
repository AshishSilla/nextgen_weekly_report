"use strict";
const PptxGenJS = require("pptxgenjs");

// ─── Brand tokens ────────────────────────────────────────────────────────────
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
};

const FONT_HEAD  = "Manrope";
const FONT_BODY  = "Manrope";
const W = 10, H = 5.625;  // LAYOUT_16x9

// ─── Helpers ─────────────────────────────────────────────────────────────────
function makeShadow() {
  return { type: "outer", color: "000000", blur: 8, offset: 3, angle: 135, opacity: 0.12 };
}

function leftAccentBar(slide, color = C.brandGreen) {
  slide.addShape("rect", { x: 0, y: 0, w: 0.12, h: H, fill: { color }, line: { color } });
}

function slideTitle(slide, text, y = 0.28) {
  slide.addText(text, {
    x: 0.28, y, w: 9.44, h: 0.52,
    fontFace: FONT_HEAD, fontSize: 22, bold: true,
    color: C.nearBlack, margin: 0,
  });
  slide.addShape("rect", { x: 0.28, y: y + 0.54, w: 1.1, h: 0.04, fill: { color: C.brandGreen }, line: { color: C.brandGreen } });
}

function statCard(slide, num, label, x, y, w = 2.1, h = 1.1, numColor = C.brandGreen) {
  slide.addShape("rect", { x, y, w, h,
    fill: { color: C.white },
    line: { color: C.lightGray1, pt: 1 },
    shadow: makeShadow(),
  });
  slide.addText(num, {
    x: x + 0.1, y: y + 0.08, w: w - 0.2, h: 0.58,
    fontFace: FONT_HEAD, fontSize: 28, bold: true,
    color: numColor, align: "center", margin: 0,
  });
  slide.addText(label, {
    x: x + 0.08, y: y + 0.66, w: w - 0.16, h: 0.36,
    fontFace: FONT_BODY, fontSize: 10, color: C.midGray, align: "center", margin: 0,
  });
}

function priorityCard(slide, num, title, body, x, y, w = 9.2, h = 0.85) {
  slide.addShape("rect", { x, y, w, h,
    fill: { color: C.white },
    line: { color: C.lightGray1, pt: 1 },
    shadow: makeShadow(),
  });
  slide.addShape("rect", { x, y, w: 0.45, h,
    fill: { color: C.brandGreen }, line: { color: C.brandGreen },
  });
  slide.addText(String(num), {
    x, y, w: 0.45, h,
    fontFace: FONT_HEAD, fontSize: 20, bold: true,
    color: C.darkTeal, align: "center", valign: "middle", margin: 0,
  });
  slide.addText(title, {
    x: x + 0.55, y: y + 0.08, w: w - 0.65, h: 0.3,
    fontFace: FONT_HEAD, fontSize: 13, bold: true, color: C.nearBlack, margin: 0,
  });
  slide.addText(body, {
    x: x + 0.55, y: y + 0.39, w: w - 0.65, h: 0.42,
    fontFace: FONT_BODY, fontSize: 10, color: C.darkGray, margin: 0,
  });
}

// ─── Build deck ──────────────────────────────────────────────────────────────
async function buildDeck() {
  const pres = new PptxGenJS();
  pres.layout  = "LAYOUT_16x9";
  pres.author  = "HackerRank NextGen";
  pres.title   = "CodeRepo Q2 2026 Planning — All CodeRepos (with Tasks)";
  pres.subject = "Sep'25–Feb'26 Usage | All CodeRepos with ≥1 Task";

  // ── SLIDE 1: Title ──────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.deepNavy };

    s.addShape("rect", { x: 0, y: 0, w: 0.18, h: H, fill: { color: C.brandGreen }, line: { color: C.brandGreen } });

    s.addText("HACKERRANK · NEXTGEN", {
      x: 0.38, y: 1.15, w: 8, h: 0.32,
      fontFace: FONT_HEAD, fontSize: 10, bold: true, charSpacing: 5,
      color: C.brandGreen, margin: 0,
    });
    s.addText("CodeRepo Q2 2026\nPlanning", {
      x: 0.38, y: 1.55, w: 8.5, h: 1.9,
      fontFace: FONT_HEAD, fontSize: 44, bold: true,
      color: C.white, margin: 0,
    });
    s.addText("All CodeRepos with ≥1 Task  |  Usage: Sep 2025 – Feb 2026", {
      x: 0.38, y: 3.55, w: 8, h: 0.4,
      fontFace: FONT_BODY, fontSize: 14,
      color: C.lightGray1, margin: 0,
    });
    s.addText("March 2026", {
      x: 0.38, y: 4.1, w: 4, h: 0.32,
      fontFace: FONT_BODY, fontSize: 11, color: C.midGray, margin: 0,
    });
    s.addShape("rect", { x: 0.38, y: 5.22, w: 9.44, h: 0.04, fill: { color: C.brandGreen }, line: { color: C.brandGreen } });
  }

  // ── SLIDE 2: Agenda ─────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "Agenda");

    const items = [
      ["01", "Core Metrics",          "Sep'25–Feb'26 adoption snapshot — all repos with ≥1 task"],
      ["02", "Usage Trends",          "Quarter-on-quarter growth — Screen vs. Interviews since launch"],
      ["03", "Who's Adopting",        "Top customers, regions, segments"],
      ["04", "Content Performance",   "Library vs. custom, top repos"],
      ["05", "The Readiness Gap",     "Created ≠ activated — 45 ready repos sitting idle"],
      ["06", "Ratings & Feedback",    "1,340 responses — strongest signal yet"],
      ["07", "Q2 2026 Priorities",    "P0 screen scale · P1 quality fixes · Stack matrix"],
    ];

    const rows = [
      [
        { text: "#",       options: { bold: true, color: C.white, fill: { color: C.darkTeal }, fontSize: 11, fontFace: FONT_HEAD } },
        { text: "Section", options: { bold: true, color: C.white, fill: { color: C.darkTeal }, fontSize: 11, fontFace: FONT_HEAD } },
        { text: "What you'll see", options: { bold: true, color: C.white, fill: { color: C.darkTeal }, fontSize: 11, fontFace: FONT_HEAD } },
      ],
      ...items.map(([num, sec, desc]) => [
        { text: num,  options: { color: C.brandGreen, bold: true, fontSize: 12, fontFace: FONT_HEAD, fill: { color: C.white } } },
        { text: sec,  options: { color: C.nearBlack,  bold: true, fontSize: 12, fontFace: FONT_HEAD, fill: { color: C.white } } },
        { text: desc, options: { color: C.darkGray,   fontSize: 11, fontFace: FONT_BODY, fill: { color: C.white } } },
      ]),
    ];
    s.addTable(rows, {
      x: 0.28, y: 1.0, w: 9.44, h: 4.3,
      border: { pt: 1, color: C.lightGray1 },
      colW: [0.55, 3.0, 5.89],
      rowH: 0.54,
    });
  }

  // ── SLIDE 3: Executive Summary ───────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "Executive Summary");

    const findings = [
      ["STRONG ACTIVATION", "22/67 repos (32.8%) saw usage — universe: all repos with ≥1 task"],
      ["LIBRARY ABSOLUTELY DOMINATES", "94% of all 3,109 attempts came from just 11 library repos (18 total)"],
      ["SCREEN HAS TAKEN OVER", "79% of attempts are Screen (2,454/3,109) — Interview now a minority channel"],
      ["BROAD BUT SHALLOW", "160 companies adopted — but nearly all used exactly 1 repo; no depth yet"],
      ["45 READY REPOS IDLE", "22 of 67 repos activated — 45 have tasks but zero attempts"],
      ["RATINGS UNDER PRESSURE", "3.94/5 on 1,340 responses — role mismatch & test quality driving low scores"],
    ];

    findings.forEach(([label, text], i) => {
      const y = 1.05 + i * 0.71;
      s.addShape("rect", { x: 0.28, y, w: 5.55, h: 0.62,
        fill: { color: C.white }, line: { color: C.lightGray1, pt: 1 }, shadow: makeShadow(),
      });
      s.addShape("rect", { x: 0.28, y, w: 0.06, h: 0.62,
        fill: { color: C.brandGreen }, line: { color: C.brandGreen },
      });
      s.addText(label, {
        x: 0.42, y: y + 0.06, w: 5.3, h: 0.2,
        fontFace: FONT_HEAD, fontSize: 8, bold: true, charSpacing: 2,
        color: C.brandGreen, margin: 0,
      });
      s.addText(text, {
        x: 0.42, y: y + 0.27, w: 5.3, h: 0.3,
        fontFace: FONT_BODY, fontSize: 10, color: C.darkGray, margin: 0,
      });
    });

    const stats = [
      ["160", "Adopting Companies"],
      ["32.8%", "Repos Activated"],
      ["3.94 / 5", "Avg Rating"],
      ["79%", "Screen Attempts"],
    ];
    stats.forEach(([num, label], i) => {
      statCard(s, num, label, 6.1 + (i % 2) * 1.95, 1.05 + Math.floor(i / 2) * 1.35, 1.85, 1.2);
    });

    const stats2 = [
      ["3,109", "Total Attempts"],
      ["94%", "Library Attempts"],
    ];
    stats2.forEach(([num, label], i) => {
      statCard(s, num, label, 6.1 + i * 1.95, 3.75, 1.85, 1.2);
    });
  }

  // ── SLIDE 4: Core Metrics ────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "Core Metrics  ·  Sep 2025 – Feb 2026  ·  CodeRepos with ≥1 Task");

    const metrics = [
      ["67",    "CodeRepos (with ≥1 Task)"],
      ["22",    "Repos With ≥1 Attempt"],
      ["32.8%", "Activation Rate"],
      ["3,109", "Total Attempts"],
      ["655",   "Interview Attempts (21.1%)"],
      ["2,454", "Screen Attempts (78.9%)"],
      ["160",   "Adopting Companies"],
      ["45",    "Ready Repos Not Yet Activated"],
    ];

    metrics.forEach(([num, label], i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      statCard(s, num, label, 0.28 + col * 2.38, 1.0 + row * 1.45, 2.2, 1.25);
    });
  }

  // ── SLIDE 5: Usage Trends — QoQ ─────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "Usage Trends  ·  Quarter-on-Quarter Growth Since Launch");

    // Data extracted from query results (Screen attempts + Interview count)
    const qoqData = [
      { q: "2023-Q3", screen: 0,    iv: 0   },
      { q: "2023-Q4", screen: 0,    iv: 0   },
      { q: "2024-Q1", screen: 0,    iv: 0   },
      { q: "2024-Q2", screen: 0,    iv: 0   },
      { q: "2024-Q3", screen: 2,    iv: 2   },
      { q: "2024-Q4", screen: 2,    iv: 2   },
      { q: "2025-Q1", screen: 5,    iv: 76  },
      { q: "2025-Q2", screen: 5,    iv: 94  },
      { q: "2025-Q3", screen: 30,   iv: 253 },
      { q: "2025-Q4", screen: 853,  iv: 287 },
      { q: "2026-Q1", screen: 1146, iv: 224 },
    ];

    const cX = 0.9, cY = 1.05, cW = 8.8, cH = 3.3, maxV = 1200;
    const n = qoqData.length;
    const groupW = cW / n;
    const barW = 0.28;
    const barGap = 0.05;

    // Y-axis gridlines + labels
    [0, 300, 600, 900, 1200].forEach(v => {
      const gy = cY + cH - (v / maxV) * cH;
      s.addShape("rect", { x: cX, y: gy, w: cW, h: 0.006,
        fill: { color: v === 0 ? C.midGray : C.lightGray1 },
        line: { color: v === 0 ? C.midGray : C.lightGray1, pt: v === 0 ? 1 : 0.5 },
      });
      s.addText(String(v), {
        x: 0.28, y: gy - 0.14, w: 0.58, h: 0.28,
        fontFace: FONT_BODY, fontSize: 8, color: C.midGray, align: "right", margin: 0,
      });
    });

    // Bars
    qoqData.forEach((d, i) => {
      const gx = cX + i * groupW;
      const cx = gx + groupW / 2;

      // Screen bar (brand green)
      if (d.screen > 0) {
        const bh = Math.max((d.screen / maxV) * cH, 0.04);
        const by = cY + cH - bh;
        s.addShape("rect", { x: cx - barW - barGap / 2, y: by, w: barW, h: bh,
          fill: { color: C.brandGreen }, line: { color: C.brandGreen },
        });
        if (d.screen >= 30) {
          s.addText(String(d.screen), {
            x: cx - barW - barGap / 2, y: by - 0.2, w: barW, h: 0.19,
            fontFace: FONT_BODY, fontSize: 8, bold: true, color: C.nearBlack, align: "center", margin: 0,
          });
        }
      }

      // Interview bar (deep navy)
      if (d.iv > 0) {
        const bh = Math.max((d.iv / maxV) * cH, 0.04);
        const by = cY + cH - bh;
        s.addShape("rect", { x: cx + barGap / 2, y: by, w: barW, h: bh,
          fill: { color: C.deepNavy }, line: { color: C.deepNavy },
        });
        if (d.iv >= 30) {
          s.addText(String(d.iv), {
            x: cx + barGap / 2, y: by - 0.2, w: barW, h: 0.19,
            fontFace: FONT_BODY, fontSize: 8, bold: true, color: C.nearBlack, align: "center", margin: 0,
          });
        }
      }

      // Quarter label
      s.addText(d.q, {
        x: gx, y: cY + cH + 0.08, w: groupW, h: 0.22,
        fontFace: FONT_BODY, fontSize: 7.5, color: C.midGray, align: "center", margin: 0,
      });
    });

    // Legend
    const legY = 4.7;
    s.addShape("rect", { x: 3.5, y: legY + 0.02, w: 0.18, h: 0.18,
      fill: { color: C.brandGreen }, line: { color: C.brandGreen },
    });
    s.addText("Screen Attempts", {
      x: 3.72, y: legY, w: 1.6, h: 0.24,
      fontFace: FONT_BODY, fontSize: 9, color: C.darkGray, margin: 0,
    });
    s.addShape("rect", { x: 5.5, y: legY + 0.02, w: 0.18, h: 0.18,
      fill: { color: C.deepNavy }, line: { color: C.deepNavy },
    });
    s.addText("Interview Attempts", {
      x: 5.72, y: legY, w: 1.7, h: 0.24,
      fontFace: FONT_BODY, fontSize: 9, color: C.darkGray, margin: 0,
    });

    // Insight callout
    s.addText("Screen surged in 2025-Q4 (853) and accelerated to 1,146 in 2026-Q1. Interviews peaked at 287 in 2025-Q4 and need renewed focus.", {
      x: 0.9, y: legY, w: 2.5, h: 0.5,
      fontFace: FONT_BODY, fontSize: 8.5, color: C.darkGray, italic: true, margin: 0,
    });
  }

  // ── SLIDE 6: Adoption — Top Customers ────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "Adoption  ·  Who Is Using It?");

    const header = [
      ["Customer", "Region", "Segment", "Product", "Repos Used", "Attempts"].map(h => ({
        text: h, options: { bold: true, color: C.white, fill: { color: C.darkTeal }, fontSize: 10, fontFace: FONT_HEAD },
      })),
    ];
    const rows2 = [
      ["OpenAI",                      "NAMER", "MM",  "Both",      "1", "458"],
      ["Atlassian",                   "NAMER", "ENT", "Both",      "1", "443"],
      ["Jamm",                        "NAMER", "SMB", "Screen",    "1", "253"],
      ["Agoda",                       "APAC",  "ENT", "Screen",    "1", "225"],
      ["NorthMark Strategies Group",  "NAMER", "MM",  "Screen",    "1",  "91"],
    ].map(cells => cells.map((c, ci) => ({
      text: c,
      options: { color: ci === 5 ? C.brandGreen : C.nearBlack, bold: ci === 5,
                 fill: { color: C.white }, fontSize: 11, fontFace: FONT_BODY },
    })));

    s.addTable([...header, ...rows2], {
      x: 0.28, y: 1.0, w: 9.44,
      border: { pt: 1, color: C.lightGray1 },
      colW: [2.8, 1.2, 1.2, 1.3, 1.3, 1.64],
      rowH: 0.44,
    });

    const tiers = [
      { label: "Power (10+ attempts)",  val: "56 companies", color: C.brandGreen },
      { label: "Engaged (3–9 attempts)", val: "57 companies", color: C.accentBlue },
      { label: "One-off (1–2 attempts)", val: "47 companies", color: C.accentCoral },
    ];
    s.addText("Engagement Tiers", {
      x: 0.28, y: 3.55, w: 5, h: 0.3,
      fontFace: FONT_HEAD, fontSize: 11, bold: true, color: C.nearBlack, margin: 0,
    });
    tiers.forEach((t, i) => {
      s.addShape("rect", { x: 0.28 + i * 3.05, y: 3.9, w: 2.85, h: 0.8,
        fill: { color: C.white }, line: { color: t.color, pt: 2 }, shadow: makeShadow(),
      });
      s.addText(t.val, {
        x: 0.28 + i * 3.05 + 0.1, y: 3.95, w: 2.65, h: 0.36,
        fontFace: FONT_HEAD, fontSize: 18, bold: true, color: t.color, align: "center", margin: 0,
      });
      s.addText(t.label, {
        x: 0.28 + i * 3.05 + 0.1, y: 4.32, w: 2.65, h: 0.28,
        fontFace: FONT_BODY, fontSize: 9, color: C.midGray, align: "center", margin: 0,
      });
    });

    s.addText("Nearly all adopting companies (159/160) used exactly 1 repo — breadth is the primary growth lever for Q2", {
      x: 0.28, y: 5.25, w: 9.44, h: 0.22,
      fontFace: FONT_BODY, fontSize: 9, italic: true, color: C.midGray, margin: 0,
    });
  }

  // ── SLIDE 6: Region + Segment ────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "Adoption  ·  Region & Segment");

    s.addText("By Salesforce Region", {
      x: 0.28, y: 1.0, w: 4.5, h: 0.28,
      fontFace: FONT_HEAD, fontSize: 11, bold: true, color: C.nearBlack, margin: 0,
    });
    const regionRows = [
      [{ text: "Region",  options: { bold: true, color: C.white, fill: { color: C.darkTeal }, fontFace: FONT_HEAD, fontSize: 10 } },
       { text: "Companies", options: { bold: true, color: C.white, fill: { color: C.darkTeal }, fontFace: FONT_HEAD, fontSize: 10 } },
       { text: "Attempts Share", options: { bold: true, color: C.white, fill: { color: C.darkTeal }, fontFace: FONT_HEAD, fontSize: 10 } }],
      [{ text: "NAMER",   options: { bold: true, color: C.nearBlack, fill: { color: C.white }, fontSize: 11, fontFace: FONT_BODY } },
       { text: "109", options: { bold: true, color: C.brandGreen,  fill: { color: C.white }, fontSize: 11, fontFace: FONT_HEAD } },
       { text: "78%",     options: { bold: true, color: C.brandGreen, fill: { color: C.white }, fontSize: 11, fontFace: FONT_HEAD } }],
      [{ text: "APAC",    options: { color: C.nearBlack, fill: { color: C.white }, fontSize: 11, fontFace: FONT_BODY } },
       { text: "20",  options: { color: C.nearBlack, fill: { color: C.white }, fontSize: 11, fontFace: FONT_BODY } },
       { text: "13%",     options: { color: C.nearBlack, fill: { color: C.white }, fontSize: 11, fontFace: FONT_BODY } }],
      [{ text: "EMEA",    options: { color: C.nearBlack, fill: { color: C.white }, fontSize: 11, fontFace: FONT_BODY } },
       { text: "21",  options: { color: C.nearBlack, fill: { color: C.white }, fontSize: 11, fontFace: FONT_BODY } },
       { text: "5%",      options: { color: C.nearBlack, fill: { color: C.white }, fontSize: 11, fontFace: FONT_BODY } }],
      [{ text: "LATAM",   options: { color: C.midGray,   fill: { color: C.white }, fontSize: 11, fontFace: FONT_BODY } },
       { text: "2",   options: { color: C.midGray,   fill: { color: C.white }, fontSize: 11, fontFace: FONT_BODY } },
       { text: "<1%",     options: { color: C.midGray,   fill: { color: C.white }, fontSize: 11, fontFace: FONT_BODY } }],
    ];
    s.addTable(regionRows, {
      x: 0.28, y: 1.32, w: 4.5,
      border: { pt: 1, color: C.lightGray1 },
      colW: [1.4, 1.2, 1.9], rowH: 0.44,
    });

    s.addShape("rect", { x: 5.05, y: 1.0, w: 0.03, h: 4.3, fill: { color: C.lightGray1 }, line: { color: C.lightGray1 } });

    s.addText("Product Split (Screen vs Interview)", {
      x: 5.2, y: 1.0, w: 4.5, h: 0.28,
      fontFace: FONT_HEAD, fontSize: 11, bold: true, color: C.nearBlack, margin: 0,
    });

    const products = [
      { label: "Screen-only",    val:  "79", pct: "49%", color: C.accentBlue },
      { label: "Interview-only", val:  "72", pct: "45%", color: C.brandGreen },
      { label: "Both",           val:   "9", pct:  "6%", color: C.midGray },
    ];
    products.forEach((p, i) => {
      statCard(s, p.val, p.label, 5.2 + i * 1.55, 1.38, 1.42, 1.05, p.color);
    });

    s.addShape("rect", { x: 5.2, y: 2.6, w: 4.5, h: 1.45,
      fill: { color: "FFF9E6" }, line: { color: "FCF283", pt: 1 }, shadow: makeShadow(),
    });
    s.addShape("rect", { x: 5.2, y: 2.6, w: 0.06, h: 1.45,
      fill: { color: "FCF283" }, line: { color: "FCF283" },
    });
    s.addText("Key Insight", {
      x: 5.34, y: 2.65, w: 4.28, h: 0.24,
      fontFace: FONT_HEAD, fontSize: 10, bold: true, color: C.nearBlack, margin: 0,
    });
    s.addText(
      "Screen is now the dominant channel — 79% of all attempts. " +
      "Only 10 companies use both products. " +
      "Enterprise is present across both channels, but Screen-only adoption is distributed across all segments.",
      {
        x: 5.34, y: 2.93, w: 4.28, h: 1.0,
        fontFace: FONT_BODY, fontSize: 10, color: C.darkGray, margin: 0,
      });

    s.addShape("rect", { x: 0.28, y: 4.2, w: 4.5, h: 1.0,
      fill: { color: C.white }, line: { color: C.lightGray1, pt: 1 }, shadow: makeShadow(),
    });
    s.addText("APAC & EMEA are real", {
      x: 0.38, y: 4.25, w: 4.3, h: 0.28,
      fontFace: FONT_HEAD, fontSize: 11, bold: true, color: C.nearBlack, margin: 0,
    });
    s.addText("APAC: 20 companies (13% of attempts). EMEA: 21 companies (5% of attempts). Combined they represent 41 companies — more than L6M's entire 30-company base.",
      { x: 0.38, y: 4.56, w: 4.3, h: 0.55, fontFace: FONT_BODY, fontSize: 10, color: C.darkGray, margin: 0 });
  }

  // ── SLIDE 7: Content Performance ─────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "Content Performance  ·  What's Being Used");

    s.addText("Top Repos by Attempts", {
      x: 0.28, y: 1.0, w: 9.44, h: 0.28,
      fontFace: FONT_HEAD, fontSize: 11, bold: true, color: C.nearBlack, margin: 0,
    });
    const repoHeader = [
      ["Repo", "Source", "Stack", "Total", "Screen", "Interview", "DLI"].map(h => ({
        text: h, options: { bold: true, color: C.white, fill: { color: C.darkTeal }, fontSize: 10, fontFace: FONT_HEAD },
      })),
    ];
    const repoRows = [
      ["Travel App Code Repo (MERN)",           "Library", "MERN",                    "1,932", "1,883",  "49", "3.93"],
      ["Banking App Code Repo (JAM)",           "Library", "SpringBoot+Angular+Mongo",   "664",   "532", "132", "3.88"],
      ["Note Manager React (TypeScript)",       "Library", "React.JS",                    "95",     "0",  "95", "3.66"],
      ["Courses App Flask React",               "Library", "Flask+React",                 "88",     "2",  "86", "3.33"],
      ["HackerWallet Django React",             "Library", "Django+React",                "68",    "17",  "51", "4.63"],
    ].map((cells, ri) => cells.map((c, ci) => ({
      text: c,
      options: {
        color: (ci === 3) ? C.brandGreen : C.nearBlack,
        bold: (ci === 3),
        fill: { color: ri % 2 === 0 ? C.white : C.lightGray3 },
        fontSize: 11, fontFace: FONT_BODY,
      },
    })));
    s.addTable([...repoHeader, ...repoRows], {
      x: 0.28, y: 1.32, w: 9.44,
      border: { pt: 1, color: C.lightGray1 },
      colW: [2.9, 1.0, 2.1, 0.78, 0.78, 0.98, 0.9],
      rowH: 0.44,
    });

    s.addText("Library vs. Custom", {
      x: 0.28, y: 3.85, w: 9.44, h: 0.28,
      fontFace: FONT_HEAD, fontSize: 11, bold: true, color: C.nearBlack, margin: 0,
    });
    const compare = [
      { label: "Library",   created: "18",  used: "11 (61%)",  customers: "N/A", attempts: "2,943 (94.7%)", color: C.brandGreen },
      { label: "Custom",    created: "49",  used: "11 (22%)",  customers: "N/A", attempts:   "166 (5.3%)",  color: C.accentCoral },
    ];
    compare.forEach((r, i) => {
      s.addShape("rect", { x: 0.28 + i * 4.75, y: 4.18, w: 4.55, h: 1.1,
        fill: { color: C.white }, line: { color: r.color, pt: 2 }, shadow: makeShadow(),
      });
      s.addText(r.label, {
        x: 0.38 + i * 4.75, y: 4.22, w: 4.35, h: 0.22,
        fontFace: FONT_HEAD, fontSize: 10, bold: true, color: r.color, margin: 0,
      });
      s.addText(`Repos: ${r.created}   Used: ${r.used}   L6M Attempts: ${r.attempts}`, {
        x: 0.38 + i * 4.75, y: 4.47, w: 4.35, h: 0.65,
        fontFace: FONT_BODY, fontSize: 10, color: C.darkGray, margin: 0,
      });
    });
  }

  // ── SLIDE 8: Readiness Gap (dark) ────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.darkTeal };

    s.addShape("rect", { x: 0, y: 0, w: 0.18, h: H, fill: { color: C.brandGreen }, line: { color: C.brandGreen } });

    s.addText("THE READINESS GAP", {
      x: 0.28, y: 0.28, w: 9.4, h: 0.38,
      fontFace: FONT_HEAD, fontSize: 13, bold: true, charSpacing: 4, color: C.brandGreen, margin: 0,
    });
    s.addText(`"In Scope" ≠ "Activated" — 45 ready repos have zero attempts`, {
      x: 0.28, y: 0.72, w: 9, h: 0.72,
      fontFace: FONT_HEAD, fontSize: 30, bold: true, color: C.white, margin: 0,
    });

    const steps = [
      { label: "In Scope",  val: "67",  sub: "repos with ≥1 task",               color: C.midGray },
      { label: "Activated", val: "22",  sub: "≥1 attempt  (32.8%)",              color: C.brandGreen },
      { label: "Idle",      val: "45",  sub: "ready but 0 attempts  (67.2%)",    color: C.accentCoral },
    ];
    const funnelW = [3.5, 2.6, 1.9];
    steps.forEach((step, i) => {
      const xOff = 0.5 + i * 3.1;
      s.addShape("rect", { x: xOff, y: 1.65, w: funnelW[i], h: 1.7,
        fill: { color: "FFFFFF", transparency: 88 }, line: { color: step.color, pt: 2 },
      });
      s.addText(step.val, {
        x: xOff, y: 1.75, w: funnelW[i], h: 0.82,
        fontFace: FONT_HEAD, fontSize: 40, bold: true, color: step.color, align: "center", margin: 0,
      });
      s.addText(step.label, {
        x: xOff, y: 2.58, w: funnelW[i], h: 0.3,
        fontFace: FONT_HEAD, fontSize: 13, bold: true, color: C.white, align: "center", margin: 0,
      });
      s.addText(step.sub, {
        x: xOff, y: 2.9, w: funnelW[i], h: 0.36,
        fontFace: FONT_BODY, fontSize: 9, color: C.lightGray1, align: "center", margin: 0,
      });
      if (i < 2) {
        s.addShape("rect", { x: xOff + funnelW[i] + 0.05, y: 2.35, w: 0.55, h: 0.04,
          fill: { color: C.brandGreen }, line: { color: C.brandGreen },
        });
      }
    });

    const facts = [
      "All 67 repos in scope have ≥1 task — denominator is clean, no shells counted",
      "45 of 67 repos (67.2%) have tasks but zero attempts — content exists, discovery is the bottleneck",
      "Library repos (18) account for 94.7% of all 3,109 attempts — custom (49 repos) barely used",
      "Action: surface dormant repos in the product — they are the quickest activation win in Q2",
    ];
    s.addText("Why this matters:", {
      x: 0.28, y: 3.65, w: 9.4, h: 0.3,
      fontFace: FONT_HEAD, fontSize: 11, bold: true, color: C.brandGreen, margin: 0,
    });
    s.addText(facts.map((f, i) => ({ text: f, options: { bullet: true, breakLine: i < facts.length - 1 } })), {
      x: 0.28, y: 3.98, w: 9.4, h: 1.4,
      fontFace: FONT_BODY, fontSize: 11, color: C.lightGray1, margin: 0,
    });
  }

  // ── SLIDE 9: Ratings + Feedback ──────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "Ratings & Feedback  ·  1,340 Responses — Statistically Meaningful");

    statCard(s, "3.94 / 5", "Avg Rating",          0.28, 1.0, 2.2, 1.15);
    statCard(s, "5",        "Median Rating",        2.58, 1.0, 2.2, 1.15, C.accentBlue);
    statCard(s, "1,340",    "Feedback Instances",   0.28, 2.25, 2.2, 1.15);
    statCard(s, "35%",      "Attempt Coverage",     2.58, 2.25, 2.2, 1.15);

    // Rating distribution bar
    s.addShape("rect", { x: 0.28, y: 3.55, w: 4.5, h: 1.75,
      fill: { color: C.white }, line: { color: C.lightGray1, pt: 1 }, shadow: makeShadow(),
    });
    s.addText("Rating Distribution", {
      x: 0.38, y: 3.60, w: 4.3, h: 0.28,
      fontFace: FONT_HEAD, fontSize: 10, bold: true, color: C.nearBlack, margin: 0,
    });
    const dist = [
      { star: "5★", count: 706, pct: 52, color: C.brandGreen },
      { star: "4★", count: 244, pct: 18, color: "66CC99" },
      { star: "3★", count: 158, pct: 11, color: C.midGray },
      { star: "2★", count:  63, pct:  5, color: "FCB283" },
      { star: "1★", count: 169, pct: 12, color: C.accentCoral },
    ];
    dist.forEach((d, i) => {
      const y = 3.92 + i * 0.21;
      s.addText(`${d.star}`, { x: 0.38, y, w: 0.28, h: 0.18, fontFace: FONT_BODY, fontSize: 9, color: C.darkGray, margin: 0 });
      s.addShape("rect", { x: 0.7, y: y + 0.02, w: 3.0 * d.pct / 100, h: 0.14, fill: { color: d.color }, line: { color: d.color } });
      s.addText(`${d.count} (${d.pct}%)`, { x: 0.72 + 3.0 * d.pct / 100, y, w: 1.0, h: 0.18, fontFace: FONT_BODY, fontSize: 9, color: C.midGray, margin: 0 });
    });

    s.addShape("rect", { x: 5.05, y: 1.0, w: 0.03, h: 4.3, fill: { color: C.lightGray1 }, line: { color: C.lightGray1 } });

    s.addText("Key Feedback Themes", {
      x: 5.2, y: 1.0, w: 4.5, h: 0.28,
      fontFace: FONT_HEAD, fontSize: 11, bold: true, color: C.nearBlack, margin: 0,
    });
    const themes = [
      { tag: "ROLE MISMATCH",    text: '"Mobile Android role but given web/Node problems" — Walmart', color: C.accentCoral },
      { tag: "TEST CASE QUALITY", text: '"Terrible frontend test cases, too much debugging time" — Razer', color: C.accentCoral },
      { tag: "NO DOCS ACCESS",   text: '"Can\'t read linked docs, not a real-world scenario" — QuinStreet',  color: "FCF283" },
      { tag: "SAMPLE TEST",      text: '"Could not do sample test — gave error before I started" — Razer', color: "FCF283" },
      { tag: "POSITIVE",         text: '"Great project questions. Unique and enjoyable style!" — Walmart', color: C.brandGreen },
    ];
    themes.forEach((t, i) => {
      const y = 1.35 + i * 0.78;
      s.addShape("rect", { x: 5.2, y, w: 4.5, h: 0.68,
        fill: { color: C.white }, line: { color: C.lightGray1, pt: 1 }, shadow: makeShadow(),
      });
      s.addShape("rect", { x: 5.2, y, w: 0.06, h: 0.68, fill: { color: t.color }, line: { color: t.color } });
      s.addText(t.tag, {
        x: 5.34, y: y + 0.06, w: 4.28, h: 0.2,
        fontFace: FONT_HEAD, fontSize: 8, bold: true, charSpacing: 2,
        color: t.color === C.brandGreen ? C.brandGreen : C.accentCoral, margin: 0,
      });
      s.addText(t.text, {
        x: 5.34, y: y + 0.28, w: 4.28, h: 0.34,
        fontFace: FONT_BODY, fontSize: 10, color: C.darkGray, margin: 0,
      });
    });

    s.addText("Screen accounts for 94% of feedback (1,265 of 1,340). Role mismatch and test quality are the primary levers for improving rating.",
      { x: 0.28, y: 5.25, w: 9.44, h: 0.22, fontFace: FONT_BODY, fontSize: 9, italic: true, color: C.midGray, margin: 0 });
  }

  // ── SLIDE 10: Overall Feedback Themes ───────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "Feedback Themes  ·  227 Unique Text Responses");

    // Subtitle note
    s.addText("Themes span platform, content, and experience — organized by frequency and severity (avg rating)", {
      x: 0.28, y: 0.88, w: 9.44, h: 0.2,
      fontFace: FONT_BODY, fontSize: 9, italic: true, color: C.midGray, margin: 0,
    });

    // Theme cards: [label, count, avgRating, borderColor, quote]
    const overallThemes = [
      { label: "Environment & Setup",     count: 49, avg: "2.6★", color: C.accentCoral,  quote: '"Did not find the file structure; half my time was figuring out the files" — Synechron' },
      { label: "Positive Experience",     count: 58, avg: "3.8★", color: C.brandGreen,   quote: '"Best coding challenge experience I\'ve ever had. Problems felt meaningful" — Walmart' },
      { label: "Time vs. Scope",          count: 17, avg: "2.9★", color: "FCB283",        quote: '"Too lengthy for the time allotted. Hard to finish frontend + filter logic in an hour" — Quantum' },
      { label: "Platform / Performance",  count: 14, avg: "1.6★", color: C.accentCoral,  quote: '"Very slow tool" · "Freeze mid-test" — Uber, Razer' },
      { label: "Role / Stack Mismatch",   count:  8, avg: "2.1★", color: C.accentCoral,  quote: '"Android engineer given web/Node problems" · "Data Eng given fullstack test" — Walmart' },
      { label: "Test Case Quality",       count:  8, avg: "2.5★", color: "FCB283",        quote: '"Functionality was hit but tests still failed" — Razer · Elite Technology' },
      { label: "Connectivity / Submit",   count:  9, avg: "2.6★", color: "FCB283",        quote: '"Pushing to server was failing" · "Couldn\'t finish — connection problems"' },
      { label: "Problem Clarity",         count:  6, avg: "2.2★", color: "FCB283",        quote: '"Problem statement very unclear. Better input/output samples needed" — Walmart' },
      { label: "AI Assistant",            count:  9, avg: "3.7★", color: C.accentBlue,   quote: '"AI couldn\'t run test cases in debug mode" — Walmart [3★]' },
    ];

    // 3-column grid, 3 rows
    const cols = 3, colW = 3.0, cardH = 1.22, colGap = 0.08;
    overallThemes.forEach((t, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = 0.28 + col * (colW + colGap);
      const y = 1.12 + row * (cardH + 0.1);

      s.addShape("rect", { x, y, w: colW, h: cardH,
        fill: { color: C.white }, line: { color: C.lightGray1, pt: 1 }, shadow: makeShadow(),
      });
      // left color bar
      s.addShape("rect", { x, y, w: 0.06, h: cardH, fill: { color: t.color }, line: { color: t.color } });

      // header row: label + count + avg
      s.addText(t.label, {
        x: x + 0.14, y: y + 0.08, w: colW - 0.24, h: 0.22,
        fontFace: FONT_HEAD, fontSize: 10, bold: true, color: C.nearBlack, margin: 0,
      });
      s.addText(`${t.count} responses  ·  avg ${t.avg}`, {
        x: x + 0.14, y: y + 0.32, w: colW - 0.24, h: 0.18,
        fontFace: FONT_BODY, fontSize: 8, color: t.color === C.brandGreen ? C.brandGreen : C.accentCoral, bold: true, margin: 0,
      });
      s.addText(t.quote, {
        x: x + 0.14, y: y + 0.52, w: colW - 0.24, h: 0.62,
        fontFace: FONT_BODY, fontSize: 8, italic: true, color: C.darkGray, margin: 0,
      });
    });
  }

  // ── SLIDE 11: Content-Specific Feedback Themes ───────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "Content Feedback Themes  ·  What Candidates Said About the Questions");

    s.addText("Focused on feedback about the question itself — clarity, scope, role fit, and test case design", {
      x: 0.28, y: 0.88, w: 9.44, h: 0.2,
      fontFace: FONT_BODY, fontSize: 9, italic: true, color: C.midGray, margin: 0,
    });

    const contentThemes = [
      {
        label:   "Role / Stack Mismatch",
        count:   8,
        avg:     "2.1★",
        color:   C.accentCoral,
        summary: "Candidates screened with a tech stack that doesn't match their applied role.",
        quotes: [
          '"AS Mobile Android Software Engineer is very hard to solve web/Node problems" — Walmart [2★]',
          '"The questions are not meant for Data Engineering — more for Full Stack developer" — Walmart [2★]',
          '"Have applied for a backend role but seeing frontend questions" — Walmart [3★]',
          '"I am not a frontend dev" — Photon [1★]',
        ],
      },
      {
        label:   "Problem Statement Unclear",
        count:   9,
        avg:     "2.6★",
        color:   C.accentCoral,
        summary: "Candidates couldn't understand what was being asked or what the expected output was.",
        quotes: [
          '"Problem statement very unclear. Better input/output samples needed" — Walmart [3★]',
          '"The full stack question was very vague" — Walmart [3★]',
          '"Did not provide the file structure — half my time was figuring out the files" — Synechron [1★]',
        ],
      },
      {
        label:   "Time Too Short for Scope",
        count:   13,
        avg:     "2.9★",
        color:   "FCB283",
        summary: "Question scope is larger than the time window allows — candidates can't finish.",
        quotes: [
          '"Quite hard to finish both frontend and filter logic in one hour" — Quantum [3★]',
          '"Around an hour for a challenge requiring KT and getting familiar with structure" — Verisk [1★]',
          '"Test was lengthy" — Contentstack [4★]',
        ],
      },
      {
        label:   "Test Case Issues",
        count:   8,
        avg:     "2.5★",
        color:   "FCB283",
        summary: "Tests fail even when functionality is correct; test cases are misleading or poorly written.",
        quotes: [
          '"Terrible frontend test cases. Took too much time debugging even though functionality was hit" — Razer [1★]',
          '"One test case kept failing even though it was working correctly" — Elite Technology [4★]',
          '"Not a proper explanation. Provide more test cases to understand the problem" — Walmart [3★]',
        ],
      },
      {
        label:   "No Documentation / Context",
        count:   2,
        avg:     "1.0★",
        color:   C.accentCoral,
        summary: "Candidates expect real-world doc access but it is blocked — feels artificial.",
        quotes: [
          '"Without access to documentation, this is not a real-world scenario" — QuinStreet [1★]',
          '"Can\'t read linked docs or get warned for fraud" — Walmart [1★]',
        ],
      },
      {
        label:   "Question Complexity / Level",
        count:   2,
        avg:     "2.0★",
        color:   "FCB283",
        summary: "Questions feel overly complex, abstract, or not calibrated to the seniority level.",
        quotes: [
          '"Extremely overwhelming for someone entry level. Was this intended for first SWE role?" — Walmart [3★]',
          '"Overly complicated, explained in abstract ways no one in the real world talks like" — Walmart [1★]',
        ],
      },
    ];

    // 2-column layout, 3 rows
    const colW = 4.55;
    contentThemes.forEach((t, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.28 + col * (colW + 0.34);
      const y = 1.08 + row * 1.45;
      const cardH = 1.35;

      s.addShape("rect", { x, y, w: colW, h: cardH,
        fill: { color: C.white }, line: { color: C.lightGray1, pt: 1 }, shadow: makeShadow(),
      });
      s.addShape("rect", { x, y, w: 0.06, h: cardH, fill: { color: t.color }, line: { color: t.color } });

      // Header
      s.addText(t.label, {
        x: x + 0.14, y: y + 0.07, w: colW - 0.5, h: 0.2,
        fontFace: FONT_HEAD, fontSize: 10, bold: true, color: C.nearBlack, margin: 0,
      });
      // Count + avg badge
      s.addText(`${t.count} responses · avg ${t.avg}`, {
        x: x + 0.14, y: y + 0.29, w: colW - 0.24, h: 0.16,
        fontFace: FONT_BODY, fontSize: 8, bold: true, color: t.color === C.brandGreen ? C.brandGreen : C.accentCoral, margin: 0,
      });
      // Summary
      s.addText(t.summary, {
        x: x + 0.14, y: y + 0.47, w: colW - 0.24, h: 0.2,
        fontFace: FONT_BODY, fontSize: 9, color: C.darkGray, margin: 0,
      });
      // Top quote
      s.addText(`→ ${t.quotes[0]}`, {
        x: x + 0.14, y: y + 0.68, w: colW - 0.24, h: 0.58,
        fontFace: FONT_BODY, fontSize: 8, italic: true, color: C.midGray, margin: 0,
      });
    });
  }

  // ── SLIDE 12: Q2 Priorities — P0 ────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "Q2 2026 Priorities  ·  P0 Scale What's Working");

    const p0 = [
      {
        title: "Keep expanding library content — it's driving 94% of all attempts",
        body:  "Travel App MERN (1,932 attempts) + Banking App JAM (664) are the core. Expand screen-optimised library variants: additional MERN, SpringBoot, Django templates.",
      },
      {
        title: "Fix role-fit issue — candidates are being assigned the wrong tech stack",
        body:  "Top negative signal: candidates with mobile/Android roles are being given web/Node repos. Add role-to-stack validation at the 'add to assessment' step.",
      },
      {
        title: "Drive Interview adoption — it's slipped to just 21% of attempts",
        body:  "Interview usage is only 655 attempts vs 2,454 for Screen. Identify why interview PMs aren't selecting CodeRepos — pricing, awareness, or feature gaps?",
      },
      {
        title: "Activate the 45 dormant repos — easiest Q2 win",
        body:  "45 of 67 in-scope repos have tasks but zero attempts. Surface them with 'Add to assessment' prompts, usage tips, and better visibility in repo discovery UI.",
      },
    ];

    p0.forEach((item, i) => {
      priorityCard(s, i + 1, item.title, item.body, 0.28, 1.05 + i * 1.05);
    });
  }

  // ── SLIDE 11: Q2 Priorities — P1 + Stack Matrix ──────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "Q2 2026 Priorities  ·  P1 Quality + Stack Matrix");

    s.addShape("rect", { x: 0.28, y: 1.0, w: 4.5, h: 1.1,
      fill: { color: C.white }, line: { color: C.accentCoral, pt: 2 }, shadow: makeShadow(),
    });
    s.addShape("rect", { x: 0.28, y: 1.0, w: 0.06, h: 1.1, fill: { color: C.accentCoral }, line: { color: C.accentCoral } });
    s.addText("P1 · Fix Test Case Quality & Documentation Access", {
      x: 0.42, y: 1.05, w: 4.28, h: 0.42,
      fontFace: FONT_HEAD, fontSize: 11, bold: true, color: C.nearBlack, margin: 0,
    });
    s.addText("Razer: bad test cases causing wasted debugging time. QuinStreet: no doc access in real-world scenarios. Both are adoption-killers at scale — especially critical now that Screen usage is at 79%.",
      { x: 0.42, y: 1.5, w: 4.28, h: 0.52, fontFace: FONT_BODY, fontSize: 10, color: C.darkGray, margin: 0 });

    s.addShape("rect", { x: 0.28, y: 2.25, w: 4.5, h: 2.65,
      fill: { color: C.white }, line: { color: C.lightGray1, pt: 1 }, shadow: makeShadow(),
    });
    s.addText("Hold: Repos With 0 Activation", {
      x: 0.38, y: 2.3, w: 4.3, h: 0.28,
      fontFace: FONT_HEAD, fontSize: 11, bold: true, color: C.nearBlack, margin: 0,
    });
    s.addText("45 repos have tasks but zero attempts. Focus activation effort here before creating net-new content:", {
      x: 0.38, y: 2.62, w: 4.3, h: 0.4,
      fontFace: FONT_BODY, fontSize: 10, color: C.darkGray, margin: 0,
    });
    const holdStacks = ["Node.JS stacks (5 repos)", "Django variants (3 repos)", "MEAN stack (2 repos)", ".NET Core · PySpark (3 repos each)"];
    s.addText(holdStacks.map((t, i) => ({
      text: t, options: { bullet: true, breakLine: i < holdStacks.length - 1 },
    })), { x: 0.38, y: 3.06, w: 4.3, h: 1.7, fontFace: FONT_BODY, fontSize: 11, color: C.darkGray, margin: 0 });

    s.addShape("rect", { x: 5.05, y: 1.0, w: 0.03, h: 4.3, fill: { color: C.lightGray1 }, line: { color: C.lightGray1 } });

    s.addText("Q2 Content Stack Priority Matrix", {
      x: 5.2, y: 1.0, w: 4.5, h: 0.28,
      fontFace: FONT_HEAD, fontSize: 11, bold: true, color: C.nearBlack, margin: 0,
    });
    const matrixHeader = [
      [
        { text: "Priority", options: { bold: true, color: C.white, fill: { color: C.darkTeal }, fontSize: 10, fontFace: FONT_HEAD } },
        { text: "Stack", options: { bold: true, color: C.white, fill: { color: C.darkTeal }, fontSize: 10, fontFace: FONT_HEAD } },
        { text: "Repos", options: { bold: true, color: C.white, fill: { color: C.darkTeal }, fontSize: 10, fontFace: FONT_HEAD } },
        { text: "L6M Attempts", options: { bold: true, color: C.white, fill: { color: C.darkTeal }, fontSize: 10, fontFace: FONT_HEAD } },
      ],
    ];
    const matrixRows = [
      ["P0", "MERN — Fullstack",                "18 repos", "1,976 (63%)"],
      ["P0", "SpringBoot+Angular — Fullstack",  "11 repos",   "664 (21%)"],
      ["P1", "Django+Angular — Fullstack",      "10 repos",    "68 (2.2%)"],
      ["P1", "React.JS — Frontend",              "1 repo",      "95 (3%)"],
      ["P1", "Flask+React — Fullstack",          "1 repo",      "88 (2.8%)"],
      ["Hold", "Node.JS, MEAN, .NET, PySpark",  "13 repos",        "~0"],
    ].map(cells => cells.map((c, ci) => {
      const prio = cells[0];
      const prioColor = prio === "P0" ? C.brandGreen : prio === "P1" ? C.accentBlue : C.midGray;
      return {
        text: c,
        options: {
          color: ci === 0 ? prioColor : C.nearBlack,
          bold: ci === 0,
          fill: { color: C.white },
          fontSize: 10, fontFace: FONT_BODY,
        },
      };
    }));
    s.addTable([...matrixHeader, ...matrixRows], {
      x: 5.2, y: 1.32, w: 4.5,
      border: { pt: 1, color: C.lightGray1 },
      colW: [0.6, 1.8, 0.9, 1.2], rowH: 0.44,
    });
  }

  // ── SLIDE 12: Closing ────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.deepNavy };

    s.addShape("rect", { x: 0, y: 0, w: 0.18, h: H, fill: { color: C.brandGreen }, line: { color: C.brandGreen } });

    s.addText("PROPOSED NEXT STEPS", {
      x: 0.38, y: 0.55, w: 9, h: 0.32,
      fontFace: FONT_HEAD, fontSize: 10, bold: true, charSpacing: 4, color: C.brandGreen, margin: 0,
    });
    s.addText("Turning Analysis Into Action", {
      x: 0.38, y: 0.95, w: 8.5, h: 0.65,
      fontFace: FONT_HEAD, fontSize: 30, bold: true, color: C.white, margin: 0,
    });

    const actions = [
      { num: "01", title: "Fix role-to-stack mismatch",          body: "Add validation at 'add to assessment' step. Block repo assignment when candidate role ≠ repo tech stack. Target: eliminate role mismatch complaints." },
      { num: "02", title: "Activate 45 dormant repos",            body: "45 of 67 in-scope repos have tasks but zero attempts. Surface with 'Add to assessment' CTA + discovery improvements. Target: 20 activated by Q2 close." },
      { num: "03", title: "Expand library + drive Interview",     body: "Add 3+ MERN screen variants, 2+ SpringBoot variants. Dedicated outreach to Interview PMs. Target: Interview back to 30%+ of attempts by Q2." },
    ];
    actions.forEach((a, i) => {
      s.addShape("rect", { x: 0.38 + i * 3.12, y: 1.8, w: 2.92, h: 3.3,
        fill: { color: "FFFFFF", transparency: 92 }, line: { color: C.brandGreen, pt: 1 },
      });
      s.addText(a.num, {
        x: 0.38 + i * 3.12 + 0.15, y: 1.9, w: 2.6, h: 0.55,
        fontFace: FONT_HEAD, fontSize: 28, bold: true, color: C.brandGreen, margin: 0,
      });
      s.addText(a.title, {
        x: 0.38 + i * 3.12 + 0.15, y: 2.5, w: 2.6, h: 0.7,
        fontFace: FONT_HEAD, fontSize: 13, bold: true, color: C.white, margin: 0,
      });
      s.addText(a.body, {
        x: 0.38 + i * 3.12 + 0.15, y: 3.25, w: 2.6, h: 1.7,
        fontFace: FONT_BODY, fontSize: 10, color: C.lightGray1, margin: 0,
      });
    });

    s.addText("Owner: [TBD]  ·  Q2 2026  ·  HackerRank NextGen", {
      x: 0.38, y: 5.28, w: 9.44, h: 0.22,
      fontFace: FONT_BODY, fontSize: 9, color: C.midGray, margin: 0,
    });
  }

  await pres.writeFile({ fileName: "CodeRepo-Q2-2026-Planning-AllRepos.pptx" });
  console.log("✅  Deck written: CodeRepo-Q2-2026-Planning-AllRepos.pptx");
}

buildDeck().catch(err => { console.error(err); process.exit(1); });

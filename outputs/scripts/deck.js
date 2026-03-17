const pptxgen = require("pptxgenjs");

let pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.title = 'Code Reports: H2 2025 Retrospective & Q2 2026 Planning';

// ── PALETTE ──────────────────────────────────────────────────────────────────
const C = {
  navy:    "0F1F3D",
  navyMid: "1A3157",
  teal:    "0D9488",
  tealLt:  "14B8A6",
  mint:    "CCFBF1",
  white:   "FFFFFF",
  offwhite:"F8FAFC",
  slate:   "64748B",
  slateL:  "94A3B8",
  dark:    "0F172A",
  amber:   "F59E0B",
  red:     "EF4444",
  green:   "22C55E",
  rowAlt:  "F1F5F9",
  rowAlt2: "E2E8F0",
};

const TF = "Calibri";
const TFH = "Calibri";

function slideNum(slide, n, total) {
  slide.addText(`${n} / ${total}`, {
    x: 9.3, y: 5.3, w: 0.65, h: 0.22,
    fontSize: 9, color: C.slateL, align: "right", fontFace: TF, margin: 0
  });
}

// ── SLIDE 1 – TITLE ──────────────────────────────────────────────────────────
{
  let s = pres.addSlide();
  s.background = { color: C.navy };

  // Teal accent bar left
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: C.teal }, line: { type: "none" }
  });

  // Large diagonal accent shape top-right
  s.addShape(pres.shapes.RECTANGLE, {
    x: 6.5, y: 0, w: 3.5, h: 2.5,
    fill: { color: C.navyMid }, line: { type: "none" }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 7.5, y: 0, w: 2.5, h: 5.625,
    fill: { color: C.navyMid }, line: { type: "none" }
  });

  // Teal circle accent
  s.addShape(pres.shapes.OVAL, {
    x: 8.2, y: 0.3, w: 1.5, h: 1.5,
    fill: { color: C.teal, transparency: 70 }, line: { type: "none" }
  });
  s.addShape(pres.shapes.OVAL, {
    x: 8.6, y: -0.1, w: 1.0, h: 1.0,
    fill: { color: C.tealLt, transparency: 60 }, line: { type: "none" }
  });

  // HackerRank label
  s.addText("HACKERRANK  |  PRODUCT ANALYTICS", {
    x: 0.38, y: 0.32, w: 7, h: 0.3,
    fontSize: 9, color: C.teal, bold: true, fontFace: TFH,
    charSpacing: 3, margin: 0
  });

  // Title
  s.addText("Code Reports", {
    x: 0.38, y: 0.85, w: 8.5, h: 1.1,
    fontSize: 52, color: C.white, bold: true, fontFace: TFH, margin: 0
  });
  s.addText("H2 2025 Retrospective & Q2 2026 Planning", {
    x: 0.38, y: 1.9, w: 8.5, h: 0.6,
    fontSize: 22, color: C.tealLt, fontFace: TFH, margin: 0
  });

  // Divider line
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.38, y: 2.65, w: 5.5, h: 0.04,
    fill: { color: C.teal }, line: { type: "none" }
  });

  // Subtitle row
  s.addText("Product Review  ·  Sep 2025 – Feb 2026  ·  March 2026", {
    x: 0.38, y: 2.85, w: 7.5, h: 0.35,
    fontSize: 13, color: C.slateL, fontFace: TF, margin: 0
  });

  // Bottom tag
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.2, w: 10, h: 0.425, fill: { color: C.teal }, line: { type: "none" }
  });
  s.addText("CONFIDENTIAL  ·  FOR INTERNAL USE ONLY  ·  HackerRank Q2 2026 Planning", {
    x: 0.38, y: 5.22, w: 9.3, h: 0.35,
    fontSize: 9, color: C.white, fontFace: TF, charSpacing: 1, margin: 0
  });

  // Big stat teaser
  s.addText("30", { x: 0.38, y: 3.35, w: 1.5, h: 0.85, fontSize: 60, color: C.teal, bold: true, fontFace: TFH, margin: 0 });
  s.addText("companies\nusing Code Reports", { x: 1.9, y: 3.48, w: 2.4, h: 0.65, fontSize: 11, color: C.slateL, fontFace: TF, margin: 0 });

  s.addText("131", { x: 4.0, y: 3.35, w: 1.6, h: 0.85, fontSize: 60, color: C.teal, bold: true, fontFace: TFH, margin: 0 });
  s.addText("total\nattempts", { x: 5.6, y: 3.48, w: 1.8, h: 0.65, fontSize: 11, color: C.slateL, fontFace: TF, margin: 0 });

  s.addText("4.09", { x: 7.0, y: 3.35, w: 2.0, h: 0.85, fontSize: 60, color: C.teal, bold: true, fontFace: TFH, margin: 0 });
  s.addText("avg\nrating /5", { x: 8.95, y: 3.48, w: 1.0, h: 0.65, fontSize: 11, color: C.slateL, fontFace: TF, margin: 0 });
}

// ── SLIDE 2 – EXECUTIVE SUMMARY ───────────────────────────────────────────────
{
  let s = pres.addSlide();
  s.background = { color: C.offwhite };

  // Top navy header band
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 1.05, fill: { color: C.navy }, line: { type: "none" }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: C.teal }, line: { type: "none" }
  });
  s.addText("EXECUTIVE SUMMARY", {
    x: 0.38, y: 0.08, w: 9, h: 0.32,
    fontSize: 9, color: C.teal, bold: true, fontFace: TFH, charSpacing: 3, margin: 0
  });
  s.addText("Code Reports is live, adopted by 30 companies — now we need to scale.", {
    x: 0.38, y: 0.42, w: 9.3, h: 0.48,
    fontSize: 18, color: C.white, bold: true, fontFace: TFH, margin: 0
  });

  // Five insight cards
  const cards = [
    { icon: "✓", color: C.teal,  label: "Adoption baseline established",     body: "30 unique customers used Code Reports; 131 total attempts across 10 active repos in 6 months." },
    { icon: "↗", color: C.amber, label: "Interview-led, Screen is lagging",   body: "85% of usage is in Interview (111 attempts). Screen accounts for only 15% (20 attempts) — a gap to close in Q2." },
    { icon: "★", color: C.teal,  label: "Library content carries adoption",   body: "HackerRank library repos (6 of 243 total) generate 54% of all attempts. Custom content is underutilised." },
    { icon: "✓", color: C.green, label: "Quality signal is positive",          body: "Avg candidate DLI of 4.16/5 across repos with ratings. Feedback avg 4.09/5 from 33 responses." },
    { icon: "!", color: C.red,   label: "Content creation outpaced activation", body: "243 repos created, but 185 (76%) have zero tasks — content drafted but not completed or used." },
  ];

  cards.forEach((c, i) => {
    const y = 1.2 + i * 0.82;
    // Card background
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.38, y, w: 9.3, h: 0.72,
      fill: { color: C.white },
      line: { color: C.rowAlt2, width: 0.5 },
      shadow: { type: "outer", blur: 4, offset: 1, angle: 135, color: "000000", opacity: 0.07 }
    });
    // Color left bar
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.38, y, w: 0.09, h: 0.72, fill: { color: c.color }, line: { type: "none" }
    });
    // Label + body
    s.addText([
      { text: c.label + "  ", options: { bold: true, color: C.dark, fontSize: 13, fontFace: TFH } },
      { text: c.body, options: { bold: false, color: C.slate, fontSize: 12, fontFace: TF } }
    ], { x: 0.6, y: y + 0.14, w: 9.0, h: 0.44, margin: 0, valign: "top" });
  });

  slideNum(s, 2, 13);
}

// ── SLIDE 3 – CONTENT CREATED ────────────────────────────────────────────────
{
  let s = pres.addSlide();
  s.background = { color: C.offwhite };

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 1.0, fill: { color: C.navy }, line: { type: "none" }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: C.teal }, line: { type: "none" }
  });
  s.addText("CONTENT INVENTORY  ·  SEP 2025 – FEB 2026", {
    x: 0.38, y: 0.08, w: 9, h: 0.25, fontSize: 9, color: C.teal, bold: true, fontFace: TFH, charSpacing: 3, margin: 0
  });
  s.addText("243 Repos Created — But Most Are Incomplete", {
    x: 0.38, y: 0.37, w: 9.2, h: 0.48, fontSize: 22, color: C.white, bold: true, fontFace: TFH, margin: 0
  });

  // LEFT column: stats
  const stats = [
    { n: "243", label: "total repos created" },
    { n: "58",  label: "repos with ≥1 task (ready)" },
    { n: "185", label: "repos with 0 tasks (empty)", red: true },
    { n: "6",   label: "library repos (HackerRank)", teal: true },
    { n: "237", label: "custom repos (company-made)" },
  ];
  stats.forEach((st, i) => {
    const y = 1.15 + i * 0.84;
    const nc = st.red ? C.red : (st.teal ? C.teal : C.navy);
    s.addText(st.n, { x: 0.38, y, w: 1.4, h: 0.55, fontSize: 38, bold: true, color: nc, fontFace: TFH, margin: 0 });
    s.addText(st.label, { x: 1.75, y: y + 0.12, w: 2.8, h: 0.38, fontSize: 12, color: C.slate, fontFace: TF, margin: 0 });
  });

  // RIGHT column: bar chart
  s.addText("TOP STACKS BY REPO COUNT", {
    x: 5.1, y: 1.1, w: 4.5, h: 0.28, fontSize: 9, color: C.teal, bold: true, fontFace: TFH, charSpacing: 2, margin: 0
  });

  const stackData = [
    { name: "MERN",             val: 78 },
    { name: "Node.js",          val: 26 },
    { name: "MEAN",             val: 23 },
    { name: "Go / Go+React",    val: 30 },
    { name: "Ruby on Rails",    val: 14 },
    { name: "Django family",    val: 17 },
    { name: "Spring Boot",      val: 10 },
    { name: "Others",           val: 15 },
  ];
  const maxVal = 78;
  const barW = 3.4;
  stackData.forEach((d, i) => {
    const y = 1.48 + i * 0.48;
    const pct = d.val / maxVal;
    const isTop = i === 0;
    s.addText(d.name, { x: 5.1, y, w: 1.5, h: 0.36, fontSize: 11, color: C.dark, fontFace: TF, margin: 0, align: "right" });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 6.7, y: y + 0.06, w: barW, h: 0.26,
      fill: { color: C.rowAlt2 }, line: { type: "none" }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 6.7, y: y + 0.06, w: barW * pct, h: 0.26,
      fill: { color: isTop ? C.teal : C.navyMid }, line: { type: "none" }
    });
    s.addText(String(d.val), {
      x: 6.7 + barW * pct + 0.05, y, w: 0.4, h: 0.36,
      fontSize: 10, color: C.slate, fontFace: TF, margin: 0
    });
  });

  // Bottom note
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.38, y: 5.1, w: 9.3, h: 0.35, fill: { color: C.mint }, line: { type: "none" }
  });
  s.addText("96% fullstack role type  ·  Only 3% backend  ·  194 repos carry a [Draft] tag in their name — suggesting a large pipeline of unfinished work.", {
    x: 0.5, y: 5.13, w: 9.1, h: 0.27, fontSize: 10, color: C.teal, bold: false, fontFace: TF, margin: 0
  });

  slideNum(s, 3, 13);
}

// ── SLIDE 4 – ADOPTION ────────────────────────────────────────────────────────
{
  let s = pres.addSlide();
  s.background = { color: C.navy };
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: C.teal }, line: { type: "none" }
  });

  s.addText("ADOPTION  ·  P0 METRIC", {
    x: 0.38, y: 0.18, w: 9, h: 0.28, fontSize: 9, color: C.teal, bold: true, fontFace: TFH, charSpacing: 3, margin: 0
  });
  s.addText("30 Companies · 131 Attempts · 10 Active Repos", {
    x: 0.38, y: 0.5, w: 9.2, h: 0.6, fontSize: 28, color: C.white, bold: true, fontFace: TFH, margin: 0
  });

  // Four big stats
  const bigStats = [
    { n: "30",   sub: "unique companies\nusing Code Reports", x: 0.38 },
    { n: "131",  sub: "total attempts\n(interviews + screens)", x: 2.82 },
    { n: "10",   sub: "repos with usage\n(of 243 created)", x: 5.26 },
    { n: "4%",   sub: "content activation rate\n(repos used / created)", x: 7.54 },
  ];
  bigStats.forEach(st => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: st.x, y: 1.38, w: 2.2, h: 2.1,
      fill: { color: C.navyMid }, line: { color: C.teal, width: 1 }
    });
    s.addText(st.n, {
      x: st.x, y: 1.48, w: 2.2, h: 1.0,
      fontSize: 58, bold: true, color: C.teal, fontFace: TFH, align: "center", margin: 0
    });
    s.addText(st.sub, {
      x: st.x + 0.1, y: 2.5, w: 2.0, h: 0.8,
      fontSize: 11, color: C.slateL, fontFace: TF, align: "center", margin: 0
    });
  });

  // Two product boxes
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.38, y: 3.68, w: 4.55, h: 1.1,
    fill: { color: C.navyMid }, line: { color: C.teal, width: 1.5 }
  });
  s.addText("INTERVIEW PRODUCT", {
    x: 0.5, y: 3.74, w: 3.5, h: 0.28, fontSize: 9, bold: true, color: C.teal, fontFace: TFH, charSpacing: 2, margin: 0
  });
  s.addText([
    { text: "111", options: { fontSize: 34, bold: true, color: C.white, fontFace: TFH } },
    { text: " attempts  ", options: { fontSize: 14, color: C.slateL, fontFace: TF } },
    { text: "85%", options: { fontSize: 20, bold: true, color: C.teal, fontFace: TFH } },
    { text: " of total", options: { fontSize: 14, color: C.slateL, fontFace: TF } },
  ], { x: 0.5, y: 4.06, w: 4.2, h: 0.55, margin: 0, valign: "middle" });

  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 3.68, w: 4.55, h: 1.1,
    fill: { color: C.navyMid }, line: { color: C.amber, width: 1.5 }
  });
  s.addText("SCREEN PRODUCT", {
    x: 5.22, y: 3.74, w: 3.5, h: 0.28, fontSize: 9, bold: true, color: C.amber, fontFace: TFH, charSpacing: 2, margin: 0
  });
  s.addText([
    { text: "20", options: { fontSize: 34, bold: true, color: C.white, fontFace: TFH } },
    { text: " attempts  ", options: { fontSize: 14, color: C.slateL, fontFace: TF } },
    { text: "15%", options: { fontSize: 20, bold: true, color: C.amber, fontFace: TFH } },
    { text: " of total", options: { fontSize: 14, color: C.slateL, fontFace: TF } },
  ], { x: 5.22, y: 4.06, w: 4.2, h: 0.55, margin: 0, valign: "middle" });

  // Footer
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.2, w: 10, h: 0.425, fill: { color: C.teal }, line: { type: "none" }
  });
  s.addText("The 4% activation rate signals a content readiness gap, not a demand problem. Companies want to use Code Reports — the content pipeline needs to catch up.", {
    x: 0.38, y: 5.22, w: 9.3, h: 0.38, fontSize: 10, color: C.white, fontFace: TF, margin: 0
  });

  slideNum(s, 4, 13);
}

// ── SLIDE 5 – TOP CONTENT ─────────────────────────────────────────────────────
{
  let s = pres.addSlide();
  s.background = { color: C.offwhite };

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 1.0, fill: { color: C.navy }, line: { type: "none" }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: C.teal }, line: { type: "none" }
  });
  s.addText("TOP PERFORMING CONTENT", {
    x: 0.38, y: 0.08, w: 9, h: 0.25, fontSize: 9, color: C.teal, bold: true, fontFace: TFH, charSpacing: 3, margin: 0
  });
  s.addText("6 Repos Drive 100% of Usage. Top 3 Drive 72%.", {
    x: 0.38, y: 0.37, w: 9.2, h: 0.48, fontSize: 22, color: C.white, bold: true, fontFace: TFH, margin: 0
  });

  // Table header
  const cols = ["Repo Name", "Source", "Stack", "Total", "Screen", "Interview", "DLI"];
  const cw = [3.0, 1.1, 1.8, 0.6, 0.6, 0.7, 0.65];
  const hdrRow = cols.map((c, i) => ({
    text: c,
    options: { fill: { color: C.navy }, color: C.white, bold: true, fontSize: 9.5, fontFace: TFH, align: i === 0 ? "left" : "center", valign: "middle" }
  }));

  const rows = [
    ["MovieDB Code Repo (MERN)", "Library", "MERN", "48", "15", "33", "4.44 ★"],
    ["Uber: Banking App", "Custom", "SpringBoot/Angular", "29", "0", "29", "3.20"],
    ["Banking Backend App – Java", "Custom", "Spring Boot", "17", "0", "17", "5.00 ★"],
    ["MovieDB Code Repo (Spring Boot)", "Library", "SpringBoot/Angular", "13", "1", "12", "4.50 ★"],
    ["Banking App Go", "Custom", "Go/React/MySQL", "8", "0", "8", "3.33"],
    ["Melodio Code Repo (MERN)", "Library", "MERN", "7", "4", "3", "4.50 ★"],
    ["Label Studio CodeRepo", "Custom", "Django/Angular", "4", "0", "4", "—"],
    ["MovieDB Code Repo (Django)", "Library", "Django/Angular", "2", "0", "2", "—"],
    ["Box Shogi App – Python", "Custom", "Django", "2", "0", "2", "—"],
    ["Workflow Code Repo (MERN)", "Library", "MERN", "1", "0", "1", "—"],
  ];

  const tableData = [hdrRow];
  rows.forEach((r, ri) => {
    const bg = ri % 2 === 0 ? C.white : C.rowAlt;
    const isLib = r[1] === "Library";
    const hasStar = r[6].includes("★");
    tableData.push(r.map((cell, ci) => {
      let fc = C.dark;
      if (ci === 1) fc = isLib ? C.teal : C.slate;
      if (ci === 6 && hasStar) fc = C.teal;
      if (ci === 0 && ri < 3) fc = C.navy;
      return {
        text: cell,
        options: { fill: { color: bg }, color: fc, fontSize: ci === 0 ? 10 : 9.5, fontFace: TF, bold: (ci === 0 && ri < 3), align: ci === 0 ? "left" : "center", valign: "middle" }
      };
    }));
  });

  s.addTable(tableData, {
    x: 0.38, y: 1.08, w: 9.3,
    rowH: 0.36,
    colW: cw,
    border: { pt: 0.5, color: C.rowAlt2 }
  });

  // Footer insight
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.38, y: 4.96, w: 9.3, h: 0.44,
    fill: { color: C.mint }, line: { type: "none" }
  });
  s.addText([
    { text: "Library repos (6 total) → 71 attempts (54%)  |  Custom repos (237 total) → 60 attempts (46%)  |  ", options: { color: C.dark, fontFace: TF } },
    { text: "Library content punches far above its weight.", options: { bold: true, color: C.teal, fontFace: TFH } }
  ], { x: 0.5, y: 4.99, w: 9.1, h: 0.38, fontSize: 10, margin: 0 });

  slideNum(s, 5, 13);
}

// ── SLIDE 6 – COMPANY LIST ────────────────────────────────────────────────────
{
  let s = pres.addSlide();
  s.background = { color: C.navy };
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: C.teal }, line: { type: "none" }
  });

  s.addText("CUSTOMERS USING CODE REPORTS", {
    x: 0.38, y: 0.18, w: 9, h: 0.28, fontSize: 9, color: C.teal, bold: true, fontFace: TFH, charSpacing: 3, margin: 0
  });
  s.addText("30 Active Companies — Mostly Large Enterprise in North America", {
    x: 0.38, y: 0.5, w: 9.2, h: 0.55, fontSize: 22, color: C.white, bold: true, fontFace: TFH, margin: 0
  });

  const multi = new Set(["Uber", "Blue Origin", "NVIDIA", "Nuro", "Microsoft"]);
  const companies = [
    ["AT&T", "Adobe Inc.", "Aegis Software"],
    ["Affirm", "Agoda", "BNY"],
    ["Best Buy", "Blue Origin", "DraftKings"],
    ["GoDaddy", "Graphcore", "Indeed"],
    ["Inspekt AI", "Jamm", "Microsoft"],
    ["Morgan Stanley", "NBCSportsNext", "NVIDIA"],
    ["Nuro", "OpenAI", "Oracle Corporation"],
    ["Palo Alto Networks", "Pendo", "TIG"],
    ["Tensure Consulting", "TikTok", "Uber"],
    ["Unite Us", "Walmart", "Yocale"],
  ];

  companies.forEach((row, ri) => {
    const y = 1.2 + ri * 0.38;
    row.forEach((co, ci) => {
      const x = 0.38 + ci * 3.1;
      const isMulti = multi.has(co);
      s.addShape(pres.shapes.RECTANGLE, {
        x, y, w: 2.95, h: 0.32,
        fill: { color: isMulti ? C.teal : C.navyMid },
        line: { color: isMulti ? C.tealLt : "2A3F6E", width: 0.5 }
      });
      s.addText(co, {
        x: x + 0.08, y: y + 0.02, w: 2.78, h: 0.28,
        fontSize: 11, color: isMulti ? C.white : C.slateL,
        bold: isMulti, fontFace: TF, margin: 0
      });
    });
  });

  // Legend
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.38, y: 5.15, w: 0.22, h: 0.18, fill: { color: C.teal }, line: { type: "none" }
  });
  s.addText("Multi-repo companies (using >1 Code Repo): Uber, Blue Origin, NVIDIA, Nuro, Microsoft", {
    x: 0.68, y: 5.14, w: 9.0, h: 0.22, fontSize: 9.5, color: C.slateL, fontFace: TF, margin: 0
  });

  slideNum(s, 6, 13);
}

// ── SLIDE 7 – SEGMENT & SERVICE ───────────────────────────────────────────────
{
  let s = pres.addSlide();
  s.background = { color: C.offwhite };

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 1.0, fill: { color: C.navy }, line: { type: "none" }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: C.teal }, line: { type: "none" }
  });
  s.addText("CUSTOMER SEGMENTATION  ·  SEGMENT & SERVICE MODEL", {
    x: 0.38, y: 0.08, w: 9, h: 0.25, fontSize: 9, color: C.teal, bold: true, fontFace: TFH, charSpacing: 3, margin: 0
  });
  s.addText("Enterprise Dominates. Self-Serve SMBs Are Exploring.", {
    x: 0.38, y: 0.37, w: 9.2, h: 0.48, fontSize: 22, color: C.white, bold: true, fontFace: TFH, margin: 0
  });

  // Segment chart (left)
  s.addText("BY SEGMENT", { x: 0.38, y: 1.1, w: 4, h: 0.28, fontSize: 9, color: C.teal, bold: true, fontFace: TFH, charSpacing: 2, margin: 0 });
  s.addChart(pres.charts.DOUGHNUT, [{
    name: "Segment",
    labels: ["ENT (20)", "SMB (6)", "MM (4)"],
    values: [20, 6, 4]
  }], {
    x: 0.38, y: 1.38, w: 4.3, h: 3.0,
    chartColors: [C.navy, C.teal, C.slateL],
    showLabel: true, showPercent: true, showLegend: true, legendPos: "b",
    dataLabelColor: C.white, dataLabelFontSize: 11,
    chartArea: { fill: { color: C.offwhite } }
  });

  // Service chart (right)
  s.addText("BY SERVICE MODEL", { x: 5.3, y: 1.1, w: 4, h: 0.28, fontSize: 9, color: C.teal, bold: true, fontFace: TFH, charSpacing: 2, margin: 0 });
  s.addChart(pres.charts.DOUGHNUT, [{
    name: "Service",
    labels: ["Full-serve (23)", "Self-serve (6)", "Other (1)"],
    values: [23, 6, 1]
  }], {
    x: 5.3, y: 1.38, w: 4.3, h: 3.0,
    chartColors: [C.teal, C.amber, C.slateL],
    showLabel: true, showPercent: true, showLegend: true, legendPos: "b",
    dataLabelColor: C.white, dataLabelFontSize: 11,
    chartArea: { fill: { color: C.offwhite } }
  });

  // Insight box
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.38, y: 4.56, w: 9.3, h: 0.84,
    fill: { color: C.mint }, line: { type: "none" }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.38, y: 4.56, w: 0.08, h: 0.84, fill: { color: C.teal }, line: { type: "none" }
  });
  s.addText([
    { text: "All 6 SMB companies are self-serve with $0 ARR — explorers, not revenue drivers yet.  ", options: { bold: true, color: C.dark, fontFace: TFH } },
    { text: "Top ENT accounts by ARR: Walmart ($2.1M), Microsoft ($949K), Uber ($575K), Adobe ($503K), Morgan Stanley ($433K), NVIDIA ($335K), TikTok ($320K), Oracle ($275K).", options: { color: C.slate, fontFace: TF } }
  ], { x: 0.58, y: 4.62, w: 9.0, h: 0.72, fontSize: 10.5, margin: 0, valign: "middle" });

  slideNum(s, 7, 13);
}

// ── SLIDE 8 – REGION & INDUSTRY ───────────────────────────────────────────────
{
  let s = pres.addSlide();
  s.background = { color: C.offwhite };

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 1.0, fill: { color: C.navy }, line: { type: "none" }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: C.teal }, line: { type: "none" }
  });
  s.addText("CUSTOMER SEGMENTATION  ·  REGION & INDUSTRY", {
    x: 0.38, y: 0.08, w: 9, h: 0.25, fontSize: 9, color: C.teal, bold: true, fontFace: TFH, charSpacing: 3, margin: 0
  });
  s.addText("NAMER Owns Early Adoption. APAC Shows Promise. EMEA is Whitespace.", {
    x: 0.38, y: 0.37, w: 9.2, h: 0.48, fontSize: 20, color: C.white, bold: true, fontFace: TFH, margin: 0
  });

  // REGION section
  s.addText("GEOGRAPHIC BREAKDOWN", { x: 0.38, y: 1.1, w: 5, h: 0.28, fontSize: 9, color: C.teal, bold: true, fontFace: TFH, charSpacing: 2, margin: 0 });

  const regions = [
    { name: "NAMER", val: 26, pct: "87%", note: "26 companies — breadth and depth", color: C.navy },
    { name: "APAC",  val: 2,  pct: "7%",  note: "TikTok ($320K ARR) + Agoda ($153K ARR)", color: C.teal },
    { name: "EMEA",  val: 1,  pct: "3%",  note: "Graphcore ($134K ARR) — 1 company only", color: C.amber },
    { name: "Other", val: 1,  pct: "3%",  note: "TIG (region unknown)", color: C.slateL },
  ];
  const maxR = 26;
  regions.forEach((r, i) => {
    const y = 1.48 + i * 0.62;
    s.addText(r.name, { x: 0.38, y, w: 1.0, h: 0.44, fontSize: 14, bold: true, color: r.color, fontFace: TFH, margin: 0 });
    s.addShape(pres.shapes.RECTANGLE, { x: 1.45, y: y + 0.09, w: 3.5, h: 0.28, fill: { color: C.rowAlt2 }, line: { type: "none" } });
    s.addShape(pres.shapes.RECTANGLE, { x: 1.45, y: y + 0.09, w: 3.5 * (r.val / maxR), h: 0.28, fill: { color: r.color }, line: { type: "none" } });
    s.addText(r.pct, { x: 5.05, y, w: 0.55, h: 0.44, fontSize: 14, bold: true, color: r.color, fontFace: TFH, margin: 0 });
    s.addText(r.note, { x: 5.65, y: y + 0.08, w: 3.8, h: 0.3, fontSize: 10, color: C.slate, fontFace: TF, margin: 0 });
  });

  // Divider
  s.addShape(pres.shapes.LINE, { x: 0.38, y: 3.98, w: 9.3, h: 0, line: { color: C.rowAlt2, width: 1 } });

  // INDUSTRY section
  s.addText("INDUSTRY MIX  (24 companies with known industry)", { x: 0.38, y: 4.06, w: 9, h: 0.28, fontSize: 9, color: C.teal, bold: true, fontFace: TFH, charSpacing: 2, margin: 0 });

  const inds = [
    { name: "Tech-Forward", n: 12, pct: 50, examples: "GoDaddy, NVIDIA, BNY, Oracle, Morgan Stanley" },
    { name: "Tech-First",   n: 7,  pct: 29, examples: "Microsoft, Adobe, TikTok, Palo Alto Networks" },
    { name: "Non-Core Tech",n: 5,  pct: 21, examples: "Uber, Walmart, DraftKings" },
  ];
  inds.forEach((d, i) => {
    const x = 0.38 + i * 3.15;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 4.42, w: 3.0, h: 0.72, fill: { color: C.white }, line: { color: C.rowAlt2, width: 0.5 } });
    s.addShape(pres.shapes.RECTANGLE, { x, y: 4.42, w: 3.0 * d.pct / 100, h: 0.08, fill: { color: C.teal }, line: { type: "none" } });
    s.addText(`${d.name}  ${d.pct}%`, { x: x + 0.1, y: 4.5, w: 2.8, h: 0.25, fontSize: 11, bold: true, color: C.navy, fontFace: TFH, margin: 0 });
    s.addText(d.examples, { x: x + 0.1, y: 4.76, w: 2.8, h: 0.3, fontSize: 9, color: C.slate, fontFace: TF, margin: 0 });
  });

  // APAC insight
  s.addShape(pres.shapes.RECTANGLE, { x: 0.38, y: 5.2, w: 9.3, h: 0.3, fill: { color: C.teal }, line: { type: "none" } });
  s.addText("APAC insight: TikTok + Agoda = $473K ARR. Dedicated APAC outreach + localised library content could unlock meaningful Q2 growth.", {
    x: 0.5, y: 5.22, w: 9.1, h: 0.24, fontSize: 9.5, color: C.white, fontFace: TF, margin: 0
  });

  slideNum(s, 8, 13);
}

// ── SLIDE 9 – FEEDBACK ────────────────────────────────────────────────────────
{
  let s = pres.addSlide();
  s.background = { color: C.offwhite };

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 1.0, fill: { color: C.navy }, line: { type: "none" }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: C.teal }, line: { type: "none" }
  });
  s.addText("FEEDBACK & QUALITY SIGNALS", {
    x: 0.38, y: 0.08, w: 9, h: 0.25, fontSize: 9, color: C.teal, bold: true, fontFace: TFH, charSpacing: 3, margin: 0
  });
  s.addText("33 Responses · Avg 4.09/5 · Platform Reliability is the Key Risk", {
    x: 0.38, y: 0.37, w: 9.2, h: 0.48, fontSize: 20, color: C.white, bold: true, fontFace: TFH, margin: 0
  });

  // Caveat
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.38, y: 1.08, w: 9.3, h: 0.3, fill: { color: C.rowAlt }, line: { type: "none" }
  });
  s.addText("⚠  Small sample (33 entries / 131 attempts = 25% response rate). All findings are directional only.", {
    x: 0.5, y: 1.1, w: 9.1, h: 0.24, fontSize: 9.5, color: C.slate, fontFace: TF, italic: true, margin: 0
  });

  // LEFT: rating distribution
  s.addText("RATING DISTRIBUTION", { x: 0.38, y: 1.48, w: 4.3, h: 0.28, fontSize: 9, color: C.teal, bold: true, fontFace: TFH, charSpacing: 2, margin: 0 });

  const ratings = [
    { stars: "★★★★★  5-star", n: 16, pct: 48, color: C.teal },
    { stars: "★★★★☆  4-star", n: 12, pct: 36, color: C.tealLt },
    { stars: "★★★☆☆  3-star", n: 0,  pct: 0,  color: C.rowAlt2 },
    { stars: "★★☆☆☆  2-star", n: 2,  pct: 6,  color: C.amber },
    { stars: "★☆☆☆☆  1-star", n: 3,  pct: 9,  color: C.red },
  ];
  ratings.forEach((r, i) => {
    const y = 1.85 + i * 0.46;
    s.addText(r.stars, { x: 0.38, y, w: 1.8, h: 0.36, fontSize: 11, color: C.dark, fontFace: TF, margin: 0 });
    s.addShape(pres.shapes.RECTANGLE, { x: 2.25, y: y + 0.08, w: 1.8, h: 0.24, fill: { color: C.rowAlt2 }, line: { type: "none" } });
    if (r.pct > 0) {
      s.addShape(pres.shapes.RECTANGLE, { x: 2.25, y: y + 0.08, w: 1.8 * r.pct / 48, h: 0.24, fill: { color: r.color }, line: { type: "none" } });
    }
    s.addText(`${r.n} (${r.pct}%)`, { x: 4.12, y, w: 0.8, h: 0.36, fontSize: 11, color: r.pct === 0 ? C.slateL : C.dark, fontFace: TF, margin: 0 });
  });

  s.addText([
    { text: "Average: ", options: { color: C.slate, fontFace: TF } },
    { text: "4.09 / 5", options: { bold: true, color: C.teal, fontFace: TFH, fontSize: 16 } },
    { text: "  |  Candidate avg: ~4.0  |  Interviewer avg: ~4.3", options: { color: C.slate, fontFace: TF } }
  ], { x: 0.38, y: 4.2, w: 4.3, h: 0.3, fontSize: 11, margin: 0 });

  // RIGHT: quotes
  s.addText("WHAT PEOPLE SAID", { x: 5.1, y: 1.48, w: 4.5, h: 0.28, fontSize: 9, color: C.teal, bold: true, fontFace: TFH, charSpacing: 2, margin: 0 });

  const positives = [
    '"The environment worked well, the web preview was responsive and I was able to complete my test without issues." — Candidate, TIG',
    '"Good" — Candidate, BNY  |  Rating 5: Agoda, DraftKings, Inspekt AI, Microsoft',
  ];
  s.addText("POSITIVE", { x: 5.1, y: 1.83, w: 1.2, h: 0.22, fontSize: 9, bold: true, color: C.green, fontFace: TFH, margin: 0 });
  positives.forEach((p, i) => {
    s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 2.1 + i * 0.5, w: 4.55, h: 0.42, fill: { color: "F0FDF4" }, line: { color: "BBF7D0", width: 0.5 } });
    s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 2.1 + i * 0.5, w: 0.07, h: 0.42, fill: { color: C.green }, line: { type: "none" } });
    s.addText(p, { x: 5.24, y: 2.13 + i * 0.5, w: 4.4, h: 0.36, fontSize: 9.5, color: C.dark, fontFace: TF, margin: 0 });
  });

  const negatives = [
    '"Very slow tool" — Candidate, Uber  [Rating: 2]',
    '"The AI Assistant sucks" — Candidate, Uber  [Rating: 1] · flagged on 2 repos same session',
    '"Had issues with the connection, wasn\'t able to finish" — Candidate, Inspekt AI  [Rating: 1]',
    '"3rd answer may not have submitted... something went wrong" — Candidate, Aegis  [Rating: 2]',
  ];
  s.addText("PAIN POINTS", { x: 5.1, y: 3.17, w: 1.5, h: 0.22, fontSize: 9, bold: true, color: C.red, fontFace: TFH, margin: 0 });
  negatives.forEach((n, i) => {
    s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 3.42 + i * 0.38, w: 4.55, h: 0.34, fill: { color: "FFF1F2" }, line: { color: "FECDD3", width: 0.5 } });
    s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 3.42 + i * 0.38, w: 0.07, h: 0.34, fill: { color: C.red }, line: { type: "none" } });
    s.addText(n, { x: 5.24, y: 3.44 + i * 0.38, w: 4.4, h: 0.28, fontSize: 9, color: C.dark, fontFace: TF, margin: 0 });
  });

  // Bottom callout
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.38, y: 5.1, w: 9.3, h: 0.38, fill: { color: C.red, transparency: 85 }, line: { color: C.red, width: 1 }
  });
  s.addText("3 of 5 pain points are platform / reliability issues — not content issues. This is a must-fix before broader scale.", {
    x: 0.5, y: 5.13, w: 9.1, h: 0.3, fontSize: 10, bold: true, color: C.red, fontFace: TFH, margin: 0
  });

  slideNum(s, 9, 13);
}

// ── SLIDE 10 – TREND ──────────────────────────────────────────────────────────
{
  let s = pres.addSlide();
  s.background = { color: C.navy };
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: C.teal }, line: { type: "none" }
  });

  s.addText("MONTHLY TREND  ·  ADOPTION IS ACCELERATING", {
    x: 0.38, y: 0.18, w: 9, h: 0.28, fontSize: 9, color: C.teal, bold: true, fontFace: TFH, charSpacing: 3, margin: 0
  });
  s.addText("Feb 2026 = 52% of All Feedback Activity. Momentum is Building.", {
    x: 0.38, y: 0.5, w: 9.2, h: 0.55, fontSize: 24, color: C.white, bold: true, fontFace: TFH, margin: 0
  });

  // Bar chart
  s.addChart(pres.charts.BAR, [{
    name: "Feedback Entries (proxy for usage activity)",
    labels: ["Nov 2025", "Dec 2025", "Jan 2026", "Feb 2026"],
    values: [2, 6, 8, 17]
  }], {
    x: 0.38, y: 1.2, w: 5.5, h: 2.8, barDir: "col",
    chartColors: [C.navyMid, C.navyMid, C.teal, C.tealLt],
    chartArea: { fill: { color: C.navyMid } },
    catAxisLabelColor: C.slateL, valAxisLabelColor: C.slateL,
    valGridLine: { color: "2A3F6E", size: 0.5 }, catGridLine: { style: "none" },
    showValue: true, dataLabelColor: C.white, dataLabelFontSize: 12,
    showLegend: true, legendPos: "b", legendColor: C.slateL, legendFontSize: 9,
  });

  // Timeline
  s.addText("KEY ADOPTION MILESTONES", {
    x: 6.2, y: 1.2, w: 3.5, h: 0.28, fontSize: 9, color: C.teal, bold: true, fontFace: TFH, charSpacing: 2, margin: 0
  });

  const milestones = [
    { period: "Sep–Oct 2025", text: "MovieDB MERN first used by Palo Alto Networks, TikTok" },
    { period: "Nov 2025",     text: "Uber begins Interview usage with custom Banking App repo" },
    { period: "Dec 2025",     text: "DraftKings, Indeed, NVIDIA, Adobe adopt" },
    { period: "Jan 2026",     text: "Screen adoption begins — Aegis, TIG, Inspekt AI" },
    { period: "Feb 2026",     text: "Peak month. Pendo, Blue Origin, AT&T, Morgan Stanley, Walmart, GoDaddy join" },
  ];
  milestones.forEach((m, i) => {
    const y = 1.58 + i * 0.46;
    s.addShape(pres.shapes.OVAL, { x: 6.2, y: y + 0.08, w: 0.2, h: 0.2, fill: { color: C.teal }, line: { type: "none" } });
    if (i < 4) s.addShape(pres.shapes.LINE, { x: 6.29, y: y + 0.29, w: 0, h: 0.26, line: { color: "2A3F6E", width: 1 } });
    s.addText(m.period, { x: 6.5, y, w: 1.4, h: 0.26, fontSize: 9, bold: true, color: C.teal, fontFace: TFH, margin: 0 });
    s.addText(m.text, { x: 6.5, y: y + 0.22, w: 3.2, h: 0.22, fontSize: 9, color: C.slateL, fontFace: TF, margin: 0 });
  });

  // Footer
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.2, w: 10, h: 0.425, fill: { color: C.teal }, line: { type: "none" }
  });
  s.addText("Note: feedback volume is a proxy for attempt activity. The trajectory is consistent — the product is ramping.", {
    x: 0.38, y: 5.22, w: 9.3, h: 0.38, fontSize: 10, color: C.white, fontFace: TF, margin: 0
  });

  slideNum(s, 10, 13);
}

// ── SLIDE 11 – RISKS ──────────────────────────────────────────────────────────
{
  let s = pres.addSlide();
  s.background = { color: C.offwhite };

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 1.0, fill: { color: C.navy }, line: { type: "none" }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: C.teal }, line: { type: "none" }
  });
  s.addText("RISKS & WATCH-OUTS  ·  BEFORE Q2 SCALE", {
    x: 0.38, y: 0.08, w: 9, h: 0.25, fontSize: 9, color: C.teal, bold: true, fontFace: TFH, charSpacing: 3, margin: 0
  });
  s.addText("Three Risks to Address Before Q2 Scale", {
    x: 0.38, y: 0.37, w: 9.2, h: 0.48, fontSize: 22, color: C.white, bold: true, fontFace: TFH, margin: 0
  });

  const risks = [
    {
      title: "PLATFORM RELIABILITY",
      badge: "HIGH",
      badgeColor: C.red,
      body: "The AI assistant experience and connectivity issues generated 1-star ratings. If unaddressed, early adopters will churn before the product reaches critical mass.",
      action: "Prioritise fixes to AI assistant responsiveness, submission reliability, and connection stability.",
    },
    {
      title: "CONTENT ACTIVATION GAP",
      badge: "MED-HIGH",
      badgeColor: C.amber,
      body: "185 of 243 repos (76%) have zero tasks. Customers creating content but not completing it suggests onboarding friction or unclear authoring guidance.",
      action: "Content creation playbook, guardrails for publishing incomplete repos, or starter templates to reduce time-to-first-task.",
    },
    {
      title: "SCREEN ADOPTION STALLED",
      badge: "MEDIUM",
      badgeColor: C.slateL,
      body: "Only 20 Screen attempts vs 111 Interview attempts. If Screen PMs aren't selecting Code Reports, the TAM is significantly constrained.",
      action: "Dedicated Screen GTM motion; investigate why Screen product managers aren't selecting Code Reports.",
    },
  ];

  risks.forEach((r, i) => {
    const x = 0.38 + i * 3.18;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.12, w: 3.05, h: 4.22,
      fill: { color: C.white }, line: { color: C.rowAlt2, width: 1 },
      shadow: { type: "outer", blur: 8, offset: 2, angle: 135, color: "000000", opacity: 0.1 }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.12, w: 3.05, h: 0.1, fill: { color: r.badgeColor }, line: { type: "none" }
    });
    // Badge
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.15, y: 1.25, w: 0.95, h: 0.28, fill: { color: r.badgeColor }, line: { type: "none" }
    });
    s.addText(r.badge, { x: x + 0.15, y: 1.26, w: 0.95, h: 0.26, fontSize: 8.5, bold: true, color: C.white, fontFace: TFH, align: "center", margin: 0 });
    s.addText(r.title, {
      x: x + 0.15, y: 1.62, w: 2.75, h: 0.55,
      fontSize: 14, bold: true, color: C.navy, fontFace: TFH, margin: 0
    });
    s.addShape(pres.shapes.LINE, { x: x + 0.15, y: 2.22, w: 2.7, h: 0, line: { color: C.rowAlt2, width: 0.8 } });
    s.addText(r.body, {
      x: x + 0.15, y: 2.32, w: 2.75, h: 1.5,
      fontSize: 11, color: C.slate, fontFace: TF, margin: 0
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.15, y: 3.9, w: 2.75, h: 1.2,
      fill: { color: C.rowAlt }, line: { type: "none" }
    });
    s.addText("ACTION NEEDED", { x: x + 0.22, y: 3.95, w: 2.6, h: 0.24, fontSize: 8.5, bold: true, color: r.badgeColor, fontFace: TFH, charSpacing: 1, margin: 0 });
    s.addText(r.action, { x: x + 0.22, y: 4.22, w: 2.6, h: 0.8, fontSize: 10, color: C.dark, fontFace: TF, margin: 0 });
  });

  slideNum(s, 11, 13);
}

// ── SLIDE 12 – RECOMMENDATIONS ────────────────────────────────────────────────
{
  let s = pres.addSlide();
  s.background = { color: C.navy };
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: C.teal }, line: { type: "none" }
  });

  s.addText("Q2 2026 RECOMMENDATIONS", {
    x: 0.38, y: 0.18, w: 9, h: 0.28, fontSize: 9, color: C.teal, bold: true, fontFace: TFH, charSpacing: 3, margin: 0
  });
  s.addText("Three Bets for Q2 2026", {
    x: 0.38, y: 0.5, w: 9.2, h: 0.55, fontSize: 28, color: C.white, bold: true, fontFace: TFH, margin: 0
  });

  const bets = [
    {
      num: "01", priority: "P0", label: "FIX THE FOUNDATION", color: C.red,
      bullets: [
        "Resolve AI assistant performance + connection reliability before scaling any distribution",
        "Add submission confirmation UX — prevents candidate anxiety at deadline",
        "Fix or disable broken screen elements before next enterprise onboarding",
      ],
      target: "Target: Zero 1-star platform complaints by end of Q2",
    },
    {
      num: "02", priority: "P1", label: "EXPAND LIBRARY CONTENT", color: C.teal,
      bullets: [
        "Library repos (6 of 243) generate 54% of usage — the ROI is proven",
        "Priority stacks: Spring Boot (library), Go (library), Node.js (library)",
        "APAC-relevant content: fintech / financial services domain resonates with TikTok, Agoda",
      ],
      target: "Target: 10 new library repos published in Q2",
    },
    {
      num: "03", priority: "P1", label: "PUSH SCREEN + EXPAND REGIONS", color: C.amber,
      bullets: [
        "Run a dedicated Screen pilot with 5 existing ENT accounts",
        "EMEA is virtually untapped — 1 company, $134K ARR. Identify 3 EMEA targets",
        "APAC: TikTok + Agoda are proof points — activate next 3 APAC accounts in Q2",
      ],
      target: "Target: 10 new companies in Q2; Screen reaches 30%+ of attempts",
    },
  ];

  bets.forEach((b, i) => {
    const x = 0.38 + i * 3.18;
    // Card
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.25, w: 3.05, h: 4.1,
      fill: { color: C.navyMid }, line: { color: b.color, width: 1 }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.25, w: 3.05, h: 0.08, fill: { color: b.color }, line: { type: "none" }
    });

    // Priority badge
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.15, y: 1.38, w: 0.65, h: 0.28, fill: { color: b.color }, line: { type: "none" }
    });
    s.addText(b.priority, { x: x + 0.15, y: 1.39, w: 0.65, h: 0.26, fontSize: 9, bold: true, color: C.white, fontFace: TFH, align: "center", margin: 0 });

    // Number + title
    s.addText(b.num, { x: x + 0.88, y: 1.32, w: 0.65, h: 0.42, fontSize: 28, bold: true, color: b.color, fontFace: TFH, margin: 0 });
    s.addText(b.label, { x: x + 0.15, y: 1.82, w: 2.75, h: 0.5, fontSize: 13, bold: true, color: C.white, fontFace: TFH, margin: 0 });

    s.addShape(pres.shapes.LINE, { x: x + 0.15, y: 2.37, w: 2.7, h: 0, line: { color: "2A3F6E", width: 0.8 } });

    // Bullets
    b.bullets.forEach((bl, bi) => {
      s.addShape(pres.shapes.OVAL, { x: x + 0.18, y: 2.48 + bi * 0.52, w: 0.1, h: 0.1, fill: { color: b.color }, line: { type: "none" } });
      s.addText(bl, { x: x + 0.36, y: 2.44 + bi * 0.52, w: 2.55, h: 0.44, fontSize: 10, color: C.slateL, fontFace: TF, margin: 0 });
    });

    // Target
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.15, y: 4.66, w: 2.75, h: 0.55,
      fill: { color: b.color, transparency: 80 }, line: { type: "none" }
    });
    s.addText(b.target, {
      x: x + 0.22, y: 4.68, w: 2.62, h: 0.5,
      fontSize: 9.5, color: C.white, bold: true, fontFace: TFH, margin: 0
    });
  });

  slideNum(s, 12, 13);
}

// ── SLIDE 13 – APPENDIX ───────────────────────────────────────────────────────
{
  let s = pres.addSlide();
  s.background = { color: C.offwhite };

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.85, fill: { color: C.navy }, line: { type: "none" }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: C.teal }, line: { type: "none" }
  });
  s.addText("APPENDIX  ·  DATA NOTES & METHODOLOGY", {
    x: 0.38, y: 0.08, w: 9, h: 0.25, fontSize: 9, color: C.teal, bold: true, fontFace: TFH, charSpacing: 3, margin: 0
  });
  s.addText("Data Sources, Definitions & Caveats", {
    x: 0.38, y: 0.36, w: 9.2, h: 0.38, fontSize: 18, color: C.white, bold: true, fontFace: TFH, margin: 0
  });

  const notes = [
    { hdr: "Date range", body: "September 2025 – February 2026. Analysis restricted to code reports created in this window and attempts on those same reports." },
    { hdr: "Data sources", body: "4 CSV files: content inventory (243 repos), usage data (131 attempts across 10 repos), feedback text (33 entries), company master (30 companies with segment/ARR/region)." },
    { hdr: "Candidate DLI", body: "Average product rating given by candidates after completing a screen or interview attempt. Scale 1–5. Only available for attempts where feedback was submitted. The metric is named 'candidate_dli' in the source data." },
    { hdr: "Product rating", body: "Given at the attempt level, not the question or repo level. Attribution to specific content is inferred from which repo was used in the session, not a direct tag. All feedback trends are therefore directional." },
    { hdr: "Feedback sample", body: "33 entries across 131 attempts = 25% response rate. Statistically insufficient for significance testing. All findings marked as directional." },
    { hdr: "Library vs custom repos", body: "Library repos: owned and published by HackerRank, accessible to all customers. Custom repos: created by individual companies for their exclusive use. 6 library, 237 custom in the L6M window." },
    { hdr: "Company master", body: "All 30 companies in analysis are 'ever paid' customers. Segment types: ENT, MM (Mid-Market), SMB. Service types: full_serve (managed accounts), self_serve (direct/PLG). ARR from Salesforce as of 2026-03-02." },
    { hdr: "Multi-repo breadth", body: "5 companies used more than one code repo: Uber (2 repos), Blue Origin (2), NVIDIA (3), Nuro (2), Microsoft (2). This is an early signal of cross-content adoption." },
  ];

  notes.forEach((n, i) => {
    const col = i < 4 ? 0 : 1;
    const row = i < 4 ? i : i - 4;
    const x = 0.38 + col * 4.85;
    const y = 1.02 + row * 1.08;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 4.65, h: 0.98, fill: { color: C.white }, line: { color: C.rowAlt2, width: 0.5 } });
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 0.08, h: 0.98, fill: { color: C.teal }, line: { type: "none" } });
    s.addText(n.hdr, { x: x + 0.18, y: y + 0.06, w: 4.4, h: 0.24, fontSize: 10.5, bold: true, color: C.navy, fontFace: TFH, margin: 0 });
    s.addText(n.body, { x: x + 0.18, y: y + 0.32, w: 4.4, h: 0.6, fontSize: 9, color: C.slate, fontFace: TF, margin: 0 });
  });

  slideNum(s, 13, 13);
}

// ── WRITE FILE ────────────────────────────────────────────────────────────────
pres.writeFile({ fileName: "Code_Reports_Q2_2026_QBR.pptx" })
  .then(() => console.log("✓ Deck written: Code_Reports_Q2_2026_QBR.pptx"))
  .catch(e => { console.error("ERROR:", e); process.exit(1); });

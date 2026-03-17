"use strict";
const fs   = require("fs");
const path = require("path");
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
  accentAmber: "FCB283",
};

const FONT_HEAD  = "Manrope";
const FONT_BODY  = "Manrope";
const W = 10, H = 5.625;  // LAYOUT_16x9

// ─── Helpers ─────────────────────────────────────────────────────────────────
function makeShadow() {
  return { type: "outer", color: "000000", blur: 8, offset: 3, angle: 135, opacity: 0.12 };
}

// Add a dark full-bleed background bar on the left
function leftAccentBar(slide, color = C.brandGreen) {
  slide.addShape("rect", { x: 0, y: 0, w: 0.12, h: H, fill: { color }, line: { color } });
}

// Section title for content slides
function slideTitle(slide, text, y = 0.28) {
  slide.addText(text, {
    x: 0.28, y, w: 9.44, h: 0.52,
    fontFace: FONT_HEAD, fontSize: 22, bold: true,
    color: C.nearBlack, margin: 0,
  });
  // thin green underline
  slide.addShape("rect", { x: 0.28, y: y + 0.54, w: 1.1, h: 0.04, fill: { color: C.brandGreen }, line: { color: C.brandGreen } });
}

// Stat callout card: big number + label
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

// Priority card with numbered accent
function priorityCard(slide, num, title, body, x, y, w = 9.2, h = 0.85) {
  slide.addShape("rect", { x, y, w, h,
    fill: { color: C.white },
    line: { color: C.lightGray1, pt: 1 },
    shadow: makeShadow(),
  });
  // green number pill
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

// ─── CSV Parser ──────────────────────────────────────────────────────────────
function splitCSVLine(line) {
  const out = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === ',' && !inQ) { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}
function parseCSV(filePath) {
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (l && !/^query/i.test(l)) { headerIdx = i; break; }
  }
  if (headerIdx === -1) return [];
  const headers = splitCSVLine(lines[headerIdx]).map(h => h.trim());
  const rows = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const vals = splitCSVLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = (vals[idx] || "").trim(); });
    rows.push(obj);
  }
  return rows;
}

// ─── Coderepo feedback analyser ───────────────────────────────────────────────
function computeCoderepoFeedback(rows) {
  const THEMES = [
    { name: "Role / Stack Mismatch",      desc: "Candidate applied for wrong role or technology stack mismatch.",           pattern: /mobile|android|wrong.*stack|wrong.*role|applied.*to.*but|expected.*different/i,                                                       color: C.accentAmber  },
    { name: "Content / Test Case Quality",desc: "Issues with problem statements, test cases, or unclear requirements.",     pattern: /test.?case|problem.?statement|unrealistic|sample.*test|not.*real.*world|documentation|unclear|output|input/i,                          color: C.accentCoral  },
    { name: "UX / Interface",             desc: "Difficulty navigating the editor, window layout, or interface.",           pattern: /editor|confus|interface|difficult|hard to|navigate|figure out|window/i,                                                              color: C.accentAmber  },
    { name: "Performance / Reliability",  desc: "Platform slowness, crashes, timeouts, or submission failures.",            pattern: /slow|glitch|crash|error|freeze|timeout|couldn.t.*submit|submission|not.*submitted/i,                                                  color: C.accentCoral  },
    { name: "AI Assistant",               desc: "Mentions of AI assistant, autocomplete, hints, or AI tooling.",            pattern: /\b(ai|assistant|autocomplete|hint|suggest|copilot|gpt|llm)\b/i,                                                                       color: C.accentBlue   },
    { name: "Positive Experience",        desc: "Positive sentiment about environment, workflow, or overall experience.",   pattern: /great|enjoyed|good.*experience|excellent|nice|well.*structured|smooth|love|liked/i,                                                    color: C.brandGreen   },
  ];

  const ratedRows = rows.filter(r => r.product_rating && r.product_rating.trim() !== "" && !isNaN(parseFloat(r.product_rating)));
  const totalRatings = ratedRows.length;
  const avg = totalRatings > 0
    ? ratedRows.reduce((s, r) => s + parseFloat(r.product_rating), 0) / totalRatings
    : 0;

  const fbRows = rows.filter(r => r.feedback && r.feedback.trim().length > 2);
  const aiFbCount = fbRows.length;

  const themes = THEMES.map(t => {
    const matched = fbRows.filter(r => t.pattern.test(r.feedback));
    if (matched.length === 0) return null;
    const ratedMatched = matched.filter(r => r.product_rating && !isNaN(parseFloat(r.product_rating)));
    const avgRating = ratedMatched.length > 0
      ? (ratedMatched.reduce((s, r) => s + parseFloat(r.product_rating), 0) / ratedMatched.length).toFixed(1)
      : "N/A";
    // Pick most representative verbatim: closest to 85 chars (pithy but complete)
    const candidates = matched.filter(r => r.feedback.trim().length > 15);
    const best = candidates.sort((a, b) =>
      Math.abs(85 - a.feedback.trim().length) - Math.abs(85 - b.feedback.trim().length)
    )[0] || matched[0];
    const raw = best.feedback.replace(/\s+/g, ' ').trim();
    const desc = `"${raw.length > 115 ? raw.slice(0, 112) + '\u2026' : raw}"`;
    return { name: t.name, desc, count: matched.length, avgRating, color: t.color };
  }).filter(Boolean);

  return { avg, totalRatings, aiFbCount, themes };
}

// ─── Build deck ──────────────────────────────────────────────────────────────
async function buildDeck() {
  // ── Load feedback CSVs ──────────────────────────────────────────────────────
  const BASE = path.join(__dirname, "..");

  // ── HRD filtering: exclude Hackerrank Dev repos from L6 metrics ─────────────
  const rawdataAll = parseCSV(path.join(BASE, "Nextgen Q1-2026 _ CodeRepos Usage - rawdata _ All coderepos & tasks.csv"));
  const HRD_QIDs   = new Set(
    rawdataAll
      .filter(r => /hackerrank.?dev/i.test(r.question_author_company_name || ""))
      .map(r => r.coderepo_qid)
  );
  const reposL6   = parseCSV(path.join(BASE, "CodeRepos Usage _ Q1-2026 - Coderepos  Created L6 & Tasks count.csv"));
  const cleanL6   = reposL6.filter(r => !HRD_QIDs.has(r.coderepo_qid));
  const totalRepos = cleanL6.length;
  const readyRepos = cleanL6.filter(r => parseInt(r["COUNTUNIQUE of coderepo_task_qid"] || "0", 10) > 0).length;
  const zeroRepos  = totalRepos - readyRepos;
  const zeroPct    = Math.round((zeroRepos / totalRepos) * 100);
  const activePct  = (10 / totalRepos * 100).toFixed(1);   // 10 activated repos is unchanged
  console.log(`Clean L6 repos: ${totalRepos} | Ready (task>0): ${readyRepos} | Zero-task: ${zeroRepos} (${zeroPct}%) | Activation: ${activePct}%`);
  console.log(`HRD repos excluded: ${reposL6.length - totalRepos} (of ${HRD_QIDs.size} HRD QIDs in rawdata)`);

  const oldCrFb = parseCSV(path.join(BASE, "NextGen_Content_Q3'26_Coderepo_Usage_&_feedback_Attempt_Interview_Feedback_Level_2026_03_06 (1).csv"));
  const allCrFb = parseCSV(path.join(BASE, "Nextgen Q1-2026 _ CodeRepos Usage - All Coderepo _ All Usage Feedback.csv"));
  const NEW_QIDS = new Set(["2265531","2395446","2321439","2216190","2257509","2220009"]);
  const newCrFb  = allCrFb.filter(r => NEW_QIDS.has(r.coderepo_qid));
  const oldFbStats = computeCoderepoFeedback(oldCrFb);
  const newFbStats = computeCoderepoFeedback(newCrFb);
  console.log(`Old coderepos: ${oldCrFb.length} rows, avg ${oldFbStats.avg.toFixed(2)}, themes: ${oldFbStats.themes.map(t=>t.name).join(", ")}`);
  console.log(`New coderepos: ${newCrFb.length} rows, avg ${newFbStats.avg.toFixed(2)}, themes: ${newFbStats.themes.map(t=>t.name).join(", ")}`);

  const pres = new PptxGenJS();
  pres.layout  = "LAYOUT_16x9";
  pres.author  = "HackerRank NextGen";
  pres.title   = "CodeRepo Q2 2026 Planning";
  pres.subject = "Sep'25–Feb'26 Analysis";

  // ── SLIDE 1: Title ──────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.deepNavy };

    // Green left bar
    s.addShape("rect", { x: 0, y: 0, w: 0.18, h: H, fill: { color: C.brandGreen }, line: { color: C.brandGreen } });

    // Eyebrow
    s.addText("HACKERRANK · NEXTGEN", {
      x: 0.38, y: 1.15, w: 8, h: 0.32,
      fontFace: FONT_HEAD, fontSize: 10, bold: true, charSpacing: 5,
      color: C.brandGreen, margin: 0,
    });
    // Main title
    s.addText("CodeRepo Q2 2026\nPlanning", {
      x: 0.38, y: 1.55, w: 8.5, h: 1.9,
      fontFace: FONT_HEAD, fontSize: 44, bold: true,
      color: C.white, margin: 0,
    });
    // Subtitle
    s.addText("Sep 2025 – Feb 2026  |  Usage & Adoption Analysis", {
      x: 0.38, y: 3.55, w: 8, h: 0.4,
      fontFace: FONT_BODY, fontSize: 14,
      color: C.lightGray1, margin: 0,
    });
    // Date
    s.addText("March 2026", {
      x: 0.38, y: 4.1, w: 4, h: 0.32,
      fontFace: FONT_BODY, fontSize: 11, color: C.midGray, margin: 0,
    });

    // bottom green line
    s.addShape("rect", { x: 0.38, y: 5.22, w: 9.44, h: 0.04, fill: { color: C.brandGreen }, line: { color: C.brandGreen } });
  }

  // ── SLIDE 2: Agenda ─────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "Agenda");

    const items = [
      ["01", "Core Metrics",          "Sep'25–Feb'26 adoption snapshot"],
      ["02", "Who's Adopting",        "Top customers, regions, segments"],
      ["03", "Content Performance",   "Library vs. custom, top repos"],
      ["04", "The Readiness Gap",     "Created ≠ shippable — fixing the denominator"],
      ["05", "Ratings & Feedback",    "Old vs New CodeRepos — themes side by side"],
      ["06", "Q2 2026 Priorities",    "P0 adoption growth · P1 quality · Stack matrix"],
    ];

    // Table header row
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
      rowH: 0.62,
    });
  }

  // ── SLIDE 3: Executive Summary ───────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "Executive Summary");

    // Left column: 6 findings
    const findings = [
      ["LOW ACTIVATION", `Only 10/${totalRepos} repos (${activePct}%) saw any usage — adoption exists but content isn't being activated`],
      ["CONTENT NOT READY", `${zeroPct}% of created repos have 0 tasks — 'created' \u2260 'shippable'`],
      ["LIBRARY CARRIES ADOPTION", "28/30 customers used library repos; only 3 used custom repos"],
      ["USAGE IS CONCENTRATED", "Top 5 customers = ~62% of all attempts; Uber alone = ~29%"],
      ["PRODUCT SPLIT", "26 Interview-only · 4 Screen-only · 0 using both"],
      ["GOOD RATINGS, PLATFORM PAIN", "Avg ~4.2/5 — negatives are latency/AI assistant, not content"],
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

    // Right column: stat callouts
    const stats = [
      ["30", "Adopting Customers"],
      [`${activePct}%`, "Repos Activated"],
      ["4.2 / 5", "Avg Rating"],
      [`${zeroPct}%`, "Repos with 0 Tasks"],
    ];
    stats.forEach(([num, label], i) => {
      statCard(s, num, label, 6.1 + (i % 2) * 1.95, 1.05 + Math.floor(i / 2) * 1.35, 1.85, 1.2);
    });

    // second row of stats
    const stats2 = [
      ["131", "Total Attempts"],
      ["84.7%", "Interview Attempts"],
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
    slideTitle(s, "Core Metrics  ·  Sep 2025 – Feb 2026");

    const metrics = [
      [String(totalRepos), "CodeRepos Created (L6)"],
      ["10",    "Repos With ≥1 Attempt"],
      [`${activePct}%`,  "Activation Rate"],
      ["131",   "Total Attempts"],
      ["111",   "Interview Attempts (84.7%)"],
      ["20",    "Screen Attempts (15.3%)"],
      ["30",    "Adopting Customers"],
      ["22/30", "Active in Last 30 Days"],
    ];

    metrics.forEach(([num, label], i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      statCard(s, num, label, 0.28 + col * 2.38, 1.0 + row * 1.45, 2.2, 1.25);
    });
  }

  // ── SLIDE 5: Adoption — Top Customers ────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "Adoption  ·  Who Is Using It?");

    // Table
    const header = [
      ["Customer", "Region", "Segment", "Product", "Repos Used", "Attempts"].map(h => ({
        text: h, options: { bold: true, color: C.white, fill: { color: C.darkTeal }, fontSize: 10, fontFace: FONT_HEAD },
      })),
    ];
    const rows2 = [
      ["Uber",           "NAMER", "ENT", "Interview", "3", "38"],
      ["DraftKings",     "NAMER", "ENT", "Interview", "1", "17"],
      ["Aegis Software", "NAMER", "SMB", "Screen",    "1", "11"],
      ["Agoda",          "APAC",  "ENT", "Interview", "1",  "9"],
      ["Indeed",         "NAMER", "ENT", "Interview", "1",  "6"],
    ].map(cells => cells.map((c, ci) => ({
      text: c,
      options: { color: ci === 5 ? C.brandGreen : C.nearBlack, bold: ci === 5,
                 fill: { color: C.white }, fontSize: 11, fontFace: FONT_BODY },
    })));

    s.addTable([...header, ...rows2], {
      x: 0.28, y: 1.0, w: 9.44,
      border: { pt: 1, color: C.lightGray1 },
      colW: [2.5, 1.2, 1.2, 1.3, 1.6, 1.64],
      rowH: 0.44,
    });

    // Engagement tiers
    const tiers = [
      { label: "Power (10+ attempts)",  val: "3 customers",  color: C.brandGreen },
      { label: "Engaged (3–9 attempts)", val: "9 customers",  color: C.accentBlue },
      { label: "One-off (1–2 attempts)", val: "18 customers", color: C.accentCoral },
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

    // Footnote
    s.addText("83% of adopting customers used exactly 1 repo", {
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

    // Region table
    s.addText("By Salesforce Region", {
      x: 0.28, y: 1.0, w: 4.5, h: 0.28,
      fontFace: FONT_HEAD, fontSize: 11, bold: true, color: C.nearBlack, margin: 0,
    });
    const regionRows = [
      [{ text: "Region", options: { bold: true, color: C.white, fill: { color: C.darkTeal }, fontFace: FONT_HEAD, fontSize: 10 } },
       { text: "Customers", options: { bold: true, color: C.white, fill: { color: C.darkTeal }, fontFace: FONT_HEAD, fontSize: 10 } },
       { text: "Attempts Share", options: { bold: true, color: C.white, fill: { color: C.darkTeal }, fontFace: FONT_HEAD, fontSize: 10 } }],
      [{ text: "NAMER",   options: { bold: true, color: C.nearBlack, fill: { color: C.white }, fontSize: 11, fontFace: FONT_BODY } },
       { text: "26", options: { bold: true, color: C.brandGreen,  fill: { color: C.white }, fontSize: 11, fontFace: FONT_HEAD } },
       { text: "88.5%",   options: { bold: true, color: C.brandGreen, fill: { color: C.white }, fontSize: 11, fontFace: FONT_HEAD } }],
      [{ text: "APAC",    options: { color: C.nearBlack, fill: { color: C.white }, fontSize: 11, fontFace: FONT_BODY } },
       { text: "2",  options: { color: C.nearBlack, fill: { color: C.white }, fontSize: 11, fontFace: FONT_BODY } },
       { text: "7.6%",    options: { color: C.nearBlack, fill: { color: C.white }, fontSize: 11, fontFace: FONT_BODY } }],
      [{ text: "EMEA",    options: { color: C.nearBlack, fill: { color: C.white }, fontSize: 11, fontFace: FONT_BODY } },
       { text: "1",  options: { color: C.nearBlack, fill: { color: C.white }, fontSize: 11, fontFace: FONT_BODY } },
       { text: "0.8%",    options: { color: C.nearBlack, fill: { color: C.white }, fontSize: 11, fontFace: FONT_BODY } }],
      [{ text: "Unknown", options: { color: C.midGray,   fill: { color: C.white }, fontSize: 11, fontFace: FONT_BODY } },
       { text: "1",  options: { color: C.midGray,   fill: { color: C.white }, fontSize: 11, fontFace: FONT_BODY } },
       { text: "3.1%",    options: { color: C.midGray,   fill: { color: C.white }, fontSize: 11, fontFace: FONT_BODY } }],
    ];
    s.addTable(regionRows, {
      x: 0.28, y: 1.32, w: 4.5,
      border: { pt: 1, color: C.lightGray1 },
      colW: [1.4, 1.2, 1.9], rowH: 0.44,
    });

    // Divider
    s.addShape("rect", { x: 5.05, y: 1.0, w: 0.03, h: 4.3, fill: { color: C.lightGray1 }, line: { color: C.lightGray1 } });

    // Right: product split
    s.addText("Product Split (Screen vs Interview)", {
      x: 5.2, y: 1.0, w: 4.5, h: 0.28,
      fontFace: FONT_HEAD, fontSize: 11, bold: true, color: C.nearBlack, margin: 0,
    });

    const products = [
      { label: "Interview-only", val: "26", pct: "87%", color: C.brandGreen },
      { label: "Screen-only",    val:  "4", pct: "13%", color: C.accentBlue },
      { label: "Both",           val:  "0", pct:  "0%", color: C.lightGray1 },
    ];
    products.forEach((p, i) => {
      statCard(s, p.val, p.label, 5.2 + i * 1.55, 1.38, 1.42, 1.05, p.color);
    });

    // Insight box
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
      "All 4 Screen-only adopters are SMB accounts (ARR=0 in metadata). " +
      "Enterprise is exclusively using Interview. " +
      "Screen adoption is currently in pilot/trial mode — needs deliberate GTM push to scale.",
      {
        x: 5.34, y: 2.93, w: 4.28, h: 1.0,
        fontFace: FONT_BODY, fontSize: 10, color: C.darkGray, margin: 0,
      });

    // Breadth insight
    s.addShape("rect", { x: 0.28, y: 4.2, w: 4.5, h: 1.0,
      fill: { color: C.white }, line: { color: C.lightGray1, pt: 1 }, shadow: makeShadow(),
    });
    s.addText("Breadth is low", {
      x: 0.38, y: 4.25, w: 4.3, h: 0.28,
      fontFace: FONT_HEAD, fontSize: 11, bold: true, color: C.nearBlack, margin: 0,
    });
    s.addText("25/30 customers used exactly 1 repo. Only 5 used 2+ repos: Uber, NVIDIA, Nuro, Blue Origin, Microsoft.",
      { x: 0.38, y: 4.56, w: 4.3, h: 0.55, fontFace: FONT_BODY, fontSize: 10, color: C.darkGray, margin: 0 });
  }

  // ── SLIDE 7: Content Performance ─────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "Content Performance  ·  What's Being Used");

    // Top repos table
    s.addText("Top Repos by Adoption", {
      x: 0.28, y: 1.0, w: 9.44, h: 0.28,
      fontFace: FONT_HEAD, fontSize: 11, bold: true, color: C.nearBlack, margin: 0,
    });
    const repoHeader = [
      ["Repo", "Source", "Stack", "Customers", "Attempts"].map(h => ({
        text: h, options: { bold: true, color: C.white, fill: { color: C.darkTeal }, fontSize: 10, fontFace: FONT_HEAD },
      })),
    ];
    const repoRows = [
      ["MovieDB (MERN)",            "Library", "MERN",                    "16", "48"],
      ["MovieDB (Spring Boot)",     "Library", "SpringBoot+Angular+Mongo", "9",  "13"],
      ["Melodio (MERN)",            "Library", "MERN",                    "4",   "7"],
      ["MovieDB (Django)",          "Library", "Django+Angular+Mongo",    "2",   "2"],
      ["Workflow (MERN)",           "Library", "MERN",                    "1",   "1"],
    ].map((cells, ri) => cells.map((c, ci) => ({
      text: c,
      options: {
        color: (ci === 3 || ci === 4) ? C.brandGreen : C.nearBlack,
        bold: (ci === 3 || ci === 4),
        fill: { color: ri % 2 === 0 ? C.white : C.lightGray3 },
        fontSize: 11, fontFace: FONT_BODY,
      },
    })));
    s.addTable([...repoHeader, ...repoRows], {
      x: 0.28, y: 1.32, w: 9.44,
      border: { pt: 1, color: C.lightGray1 },
      colW: [3.04, 1.1, 2.8, 1.4, 1.1],
      rowH: 0.44,
    });

    // Library vs Custom comparison
    s.addText("Library vs. Custom", {
      x: 0.28, y: 3.85, w: 9.44, h: 0.28,
      fontFace: FONT_HEAD, fontSize: 11, bold: true, color: C.nearBlack, margin: 0,
    });
    const compare = [
      { label: "Library",             created: "6",   used: "5 (83%)",  customers: "28", color: C.brandGreen },
      { label: "Custom (all)",         created: "237", used: "5 (2%)",   customers: "3",  color: C.accentCoral },
      { label: "Custom (cust-authored)", created: "13", used: "5 (38%)", customers: "3",  color: C.accentBlue },
    ];
    compare.forEach((r, i) => {
      s.addShape("rect", { x: 0.28 + i * 3.1, y: 4.18, w: 2.9, h: 1.1,
        fill: { color: C.white }, line: { color: r.color, pt: 2 }, shadow: makeShadow(),
      });
      s.addText(r.label, {
        x: 0.38 + i * 3.1, y: 4.22, w: 2.7, h: 0.22,
        fontFace: FONT_HEAD, fontSize: 10, bold: true, color: r.color, margin: 0,
      });
      s.addText(`Created: ${r.created}   Used: ${r.used}   Customers: ${r.customers}`, {
        x: 0.38 + i * 3.1, y: 4.47, w: 2.7, h: 0.65,
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
    s.addText(`"Created" ≠ "Shippable"`, {
      x: 0.28, y: 0.72, w: 9, h: 0.72,
      fontFace: FONT_HEAD, fontSize: 36, bold: true, color: C.white, margin: 0,
    });

    // Funnel steps
    const readyPct = Math.round(readyRepos / totalRepos * 100);
    const steps = [
      { label: "Created",    val: String(totalRepos), sub: "repos in L6 pipeline",                         color: C.midGray },
      { label: "Ready",      val: String(readyRepos), sub: `task_count > 0  (${readyPct}%)`,               color: C.accentBlue },
      { label: "Activated",  val: "10",               sub: `≥1 attempt  (${activePct}% of created)`,       color: C.brandGreen },
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

    // Key facts
    const facts = [
      `${zeroRepos} / ${totalRepos} repos (${zeroPct}%) have 0 tasks — shells, not content`,
      `~${Math.round(zeroRepos / (totalRepos - 10) * 100)}% of unused repos have 0 tasks`,
      "\"Library repo unused\" = Travel App (MERN) — 0 tasks, not shippable",
      "Track Ready (task>0) → Activated for Q2 QBR accuracy",
    ];
    s.addText("Why this matters:", {
      x: 0.28, y: 3.65, w: 9.4, h: 0.3,
      fontFace: FONT_HEAD, fontSize: 11, bold: true, color: C.brandGreen, margin: 0,
    });
    s.addText(facts.map(f => ({ text: f, options: { bullet: true, breakLine: true } })).slice(0, -1).concat(
      [{ text: facts[facts.length - 1], options: { bullet: true } }]
    ), {
      x: 0.28, y: 3.98, w: 9.4, h: 1.4,
      fontFace: FONT_BODY, fontSize: 11, color: C.lightGray1, margin: 0,
    });
  }

  // ── SLIDE 9: Ratings & Feedback — Old vs New CodeRepos ──────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "Ratings & Feedback  ·  Old vs New CodeRepos");

    // Vertical divider
    s.addShape("rect", { x: 5.04, y: 1.0, w: 0.03, h: 4.42,
      fill: { color: C.lightGray1 }, line: { color: C.lightGray1 } });

    // ── Panel headers + stat bars ────────────────────────────────────────────
    [
      { label: "OLD CODEREPOS", accent: C.midGray,     stat: `Avg ${oldFbStats.avg.toFixed(2)}/5  \u00B7  ${oldFbStats.totalRatings} ratings  \u00B7  ${oldFbStats.aiFbCount} with text feedback`, sx: 0.28, sw: 4.62 },
      { label: "NEW CODEREPOS", accent: C.brandGreen,  stat: `Avg ${newFbStats.avg.toFixed(2)}/5  \u00B7  ${newFbStats.totalRatings} ratings  \u00B7  ${newFbStats.aiFbCount} with text feedback`, sx: 5.2,  sw: 4.52 },
    ].forEach(({ label, accent, stat, sx, sw }) => {
      s.addText(label, { x: sx, y: 1.0, w: sw, h: 0.24,
        fontFace: FONT_HEAD, fontSize: 12, bold: true, charSpacing: 2.5, color: accent, margin: 0 });
      s.addShape("rect", { x: sx, y: 1.28, w: sw, h: 0.22,
        fill: { color: C.white }, line: { color: C.lightGray1, pt: 1 } });
      s.addText(stat, { x: sx + 0.1, y: 1.30, w: sw - 0.14, h: 0.18,
        fontFace: FONT_BODY, fontSize: 7.5, color: C.darkGray, margin: 0 });
    });

    // ── Canonical theme order — same sequence on both sides ─────────────────
    const THEME_CANON_CR = [
      "Role / Stack Mismatch",
      "Content / Test Case Quality",
      "UX / Interface",
      "Performance / Reliability",
      "AI Assistant",
      "Positive Experience",
    ];

    const oldByName = Object.fromEntries(oldFbStats.themes.map(t => [t.name, t]));
    const newByName = Object.fromEntries(newFbStats.themes.map(t => [t.name, t]));

    const activePositions = THEME_CANON_CR
      .map(name => ({ name, oldT: oldByName[name] || null, newT: newByName[name] || null }))
      .filter(p => p.oldT || p.newT);

    // Card geometry: 2 cols × up to 3 rows per side; compact to leave room for trend strip
    const colGap = 0.08, rowGap = 0.07, cardH = 0.92, gridTop = 1.56;
    const oldCardW = (4.62 - colGap) / 2;
    const newCardW = (4.52 - colGap) / 2;

    const drawCard = (theme, cx, cy, cardW) => {
      if (!theme) {
        s.addShape("rect", { x: cx, y: cy, w: cardW, h: cardH,
          fill: { color: C.lightGray2 }, line: { color: C.lightGray1, pt: 1 } });
        s.addText("—", { x: cx + 0.1, y: cy + 0.33, w: cardW - 0.16, h: 0.22,
          fontFace: FONT_BODY, fontSize: 11, color: C.lightGray1, align: "center", margin: 0 });
        return;
      }
      s.addShape("rect", { x: cx, y: cy, w: cardW, h: cardH,
        fill: { color: C.white }, line: { color: C.lightGray1, pt: 1 }, shadow: makeShadow() });
      s.addShape("rect", { x: cx, y: cy, w: 0.06, h: cardH,
        fill: { color: theme.color }, line: { color: theme.color } });
      s.addText(theme.name, { x: cx + 0.1, y: cy + 0.05, w: cardW - 0.16, h: 0.20,
        fontFace: FONT_HEAD, fontSize: 9, bold: true, color: C.nearBlack, margin: 0 });
      s.addText(`${theme.count} responses \u00B7 avg ${theme.avgRating}\u2605`, {
        x: cx + 0.1, y: cy + 0.26, w: cardW - 0.16, h: 0.15,
        fontFace: FONT_BODY, fontSize: 7.5, color: C.accentCoral, margin: 0 });
      s.addText(theme.desc, { x: cx + 0.1, y: cy + 0.42, w: cardW - 0.16, h: cardH - 0.48,
        fontFace: FONT_BODY, fontSize: 8, color: C.darkGray, italic: true, margin: 0 });
    };

    activePositions.forEach(({ oldT, newT }, posIdx) => {
      const col = posIdx % 2;
      const row = Math.floor(posIdx / 2);
      const cy  = gridTop + row * (cardH + rowGap);
      drawCard(oldT, 0.28 + col * (oldCardW + colGap), cy, oldCardW);
      drawCard(newT, 5.2  + col * (newCardW + colGap), cy, newCardW);
    });

    // ── Trend observation strip ──────────────────────────────────────────────
    const trendY = gridTop + 3 * (cardH + rowGap) + 0.04;
    s.addShape("rect", { x: 0.28, y: trendY, w: 9.44, h: 0.60,
      fill: { color: C.white }, line: { color: C.lightGray1, pt: 1 }, shadow: makeShadow() });
    s.addShape("rect", { x: 0.28, y: trendY, w: 0.06, h: 0.60,
      fill: { color: C.accentBlue }, line: { color: C.accentBlue } });
    s.addText("TREND", { x: 0.42, y: trendY + 0.05, w: 1.1, h: 0.16,
      fontFace: FONT_HEAD, fontSize: 7.5, bold: true, charSpacing: 2, color: C.accentBlue, margin: 0 });
    const trendObs = [
      "\u2713 Role/Stack, UX & Content Quality pain absent from new repos — likely better scenario scoping, not just small-N",
      "\u26A0 Performance persists: submission failures + 'Very slow tool' (Aegis 2\u2605, Uber 2\u2605) — infra issue, not content",
      "\u26A0 AI Assistant complaint intensifies: harshest language in new repos (Uber, 1\u2605 on both Banking App Go + Uber Banking) — needs UX onboarding",
    ].join("   \u00B7   ");
    s.addText(trendObs, { x: 0.42, y: trendY + 0.23, w: 9.2, h: 0.32,
      fontFace: FONT_BODY, fontSize: 8, color: C.darkGray, margin: 0 });

    // Small-N footnote
    const newTextCount = newCrFb.filter(r => r.feedback && r.feedback.trim().length > 2).length;
    s.addText(
      `\u26A0 New coderepo sample is small (${newFbStats.totalRatings} ratings, ${newTextCount} text responses) \u2014 directional only.`,
      { x: 0.28, y: trendY + 0.66, w: 9.44, h: 0.18,
        fontFace: FONT_BODY, fontSize: 8.5, italic: true, color: C.midGray, margin: 0 }
    );
  }

  // ── SLIDE 10: Q2 Priorities — P0 ────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "Q2 2026 Priorities  ·  P0 Adoption Growth");

    const p0 = [
      {
        title: "Double down on library templates that already drive adoption",
        body:  "MovieDB MERN + MovieDB Spring Boot drive nearly all broad adoption. Expand adjacent variants (same 'shape', different stacks/roles) to widen top-of-funnel.",
      },
      {
        title: "Fix the denominator — introduce 'ready content' lifecycle tracking",
        body:  "Track: Created → Ready (task_count > 0) → Activated (≥1 attempt) → Repeat-used. Stop using 'repos created' as the success metric for QBR.",
      },
      {
        title: "Reduce friction: turn 'created' into 'used' for custom repos",
        body:  "Product hooks: 'Add to assessment' CTA after repo creation · Publish/readiness checks (warn if task_count=0) · Lightweight 'test run' flow before going live.",
      },
      {
        title: "Screen adoption needs a deliberate GTM push",
        body:  "Only 4 SMB accounts are Screen-only today. If Screen is strategic, seed a small enterprise cohort and identify activation blockers early.",
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

    // P1 box
    s.addShape("rect", { x: 0.28, y: 1.0, w: 4.5, h: 1.1,
      fill: { color: C.white }, line: { color: C.accentCoral, pt: 2 }, shadow: makeShadow(),
    });
    s.addShape("rect", { x: 0.28, y: 1.0, w: 0.06, h: 1.1, fill: { color: C.accentCoral }, line: { color: C.accentCoral } });
    s.addText("P1 · Address Reliability / Performance / AI-Assistant Pain", {
      x: 0.42, y: 1.05, w: 4.28, h: 0.42,
      fontFace: FONT_HEAD, fontSize: 11, bold: true, color: C.nearBlack, margin: 0,
    });
    s.addText("Negative verbatims are adoption-killers. Even with tiny sample volume, complaints about latency and AI assistant behavior are must-fix hygiene items while scaling content.",
      { x: 0.42, y: 1.5, w: 4.28, h: 0.52, fontFace: FONT_BODY, fontSize: 10, color: C.darkGray, margin: 0 });

    // Hold note
    s.addShape("rect", { x: 0.28, y: 2.25, w: 4.5, h: 2.65,
      fill: { color: C.white }, line: { color: C.lightGray1, pt: 1 }, shadow: makeShadow(),
    });
    s.addText("Hold: Stacks with 0 Adoption", {
      x: 0.38, y: 2.3, w: 4.3, h: 0.28,
      fontFace: FONT_HEAD, fontSize: 11, bold: true, color: C.nearBlack, margin: 0,
    });
    s.addText("These have ready repos (task_count > 0) but zero adoption — bottleneck is activation/discovery, not content supply:", {
      x: 0.38, y: 2.62, w: 4.3, h: 0.4,
      fontFace: FONT_BODY, fontSize: 10, color: C.darkGray, margin: 0,
    });
    const holdStacks = ["Node.JS (8 ready repos)", "Java with Gradle (4 ready)", "Ruby on Rails (2 ready)", ".NET Core · MEAN · React.JS"];
    s.addText(holdStacks.map((t, i) => ({
      text: t, options: { bullet: true, breakLine: i < holdStacks.length - 1 },
    })), { x: 0.38, y: 3.06, w: 4.3, h: 1.7, fontFace: FONT_BODY, fontSize: 11, color: C.darkGray, margin: 0 });

    // Vertical divider
    s.addShape("rect", { x: 5.05, y: 1.0, w: 0.03, h: 4.3, fill: { color: C.lightGray1 }, line: { color: C.lightGray1 } });

    // Stack priority matrix
    s.addText("Q2 Content Stack Priority Matrix", {
      x: 5.2, y: 1.0, w: 4.5, h: 0.28,
      fontFace: FONT_HEAD, fontSize: 11, bold: true, color: C.nearBlack, margin: 0,
    });
    const matrixHeader = [
      [
        { text: "Priority", options: { bold: true, color: C.white, fill: { color: C.darkTeal }, fontSize: 10, fontFace: FONT_HEAD } },
        { text: "Stack", options: { bold: true, color: C.white, fill: { color: C.darkTeal }, fontSize: 10, fontFace: FONT_HEAD } },
        { text: "Customers", options: { bold: true, color: C.white, fill: { color: C.darkTeal }, fontSize: 10, fontFace: FONT_HEAD } },
        { text: "Attempts", options: { bold: true, color: C.white, fill: { color: C.darkTeal }, fontSize: 10, fontFace: FONT_HEAD } },
      ],
    ];
    const matrixRows = [
      ["P0", "MERN — Fullstack",          "21/30 (70%)", "56 (43%)"],
      ["P0", "SpringBoot+Angular — Full", "9/30 (30%)",  "42 (32%)"],
      ["P1", "Django+Angular — Fullstack", "3/30 (10%)",  "6 (4.6%)"],
      ["P1", "SpringBoot — Backend",       "1 customer",  "17 attempts"],
      ["P1", "Django — Backend",           "early signal", "small N"],
      ["Hold", "Node.JS, Rails, .NET…",   "0 adopters",  "0"],
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
      colW: [0.6, 1.7, 1.25, 0.95], rowH: 0.44,
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
      { num: "01", title: "Define 'ready content' metrics",        body: "Align on Created → Ready → Activated funnel for Q2 QBR. Fix denominator before setting targets." },
      { num: "02", title: "Expand MERN + SpringBoot library repos", body: "+3 MERN Fullstack, +2 SpringBoot Fullstack, +1 SpringBoot Backend, +1 Django Fullstack by end of Q2." },
      { num: "03", title: "Product: activation friction fixes",     body: "Ship 'Add to assessment' CTA + readiness guard (warn on 0 tasks). Target: custom repo activation rate 2× by Q2 close." },
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

  await pres.writeFile({ fileName: "CodeRepo-Q2-2026-Planning.pptx" });
  console.log("✅  Deck written: CodeRepo-Q2-2026-Planning.pptx");
}

buildDeck().catch(err => { console.error(err); process.exit(1); });

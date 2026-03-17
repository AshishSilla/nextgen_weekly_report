"use strict";
const fs   = require("fs");
const path = require("path");
const PptxGenJS = require("pptxgenjs");

// ─── Brand tokens ────────────────────────────────────────────────────────────
const C = {
  deepNavy:    "0E141E",
  darkTeal:    "003333",
  brandGreen:  "05C770",
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
const FONT_BODY = "Manrope";
const H = 5.625;

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
    fontFace: FONT_HEAD, fontSize: 22, bold: true, color: C.nearBlack, margin: 0,
  });
  slide.addShape("rect", { x: 0.28, y: y + 0.54, w: 1.1, h: 0.04,
    fill: { color: C.brandGreen }, line: { color: C.brandGreen } });
}
function statCard(slide, num, label, x, y, w = 2.1, h = 1.1, numColor = C.brandGreen) {
  slide.addShape("rect", { x, y, w, h,
    fill: { color: C.white }, line: { color: C.lightGray1, pt: 1 }, shadow: makeShadow() });
  slide.addText(num, {
    x: x + 0.1, y: y + 0.08, w: w - 0.2, h: 0.58,
    fontFace: FONT_HEAD, fontSize: 28, bold: true, color: numColor, align: "center", margin: 0,
  });
  slide.addText(label, {
    x: x + 0.08, y: y + 0.66, w: w - 0.16, h: 0.36,
    fontFace: FONT_BODY, fontSize: 10, color: C.midGray, align: "center", margin: 0,
  });
}
function panelHeader(slide, text, x, w, color) {
  slide.addShape("rect", { x, y: 0.98, w, h: 0.26,
    fill: { color }, line: { color } });
  slide.addText(text, {
    x: x + 0.1, y: 0.98, w: w - 0.2, h: 0.26,
    fontFace: FONT_HEAD, fontSize: 11, bold: true, color: C.white,
    align: "center", valign: "middle", margin: 0,
  });
}

// ─── CSV Parser ──────────────────────────────────────────────────────────────
function splitCSVLine(line) {
  const out = []; let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ;
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

// ─── Task type constants ──────────────────────────────────────────────────────
function normType(raw) {
  const t = (raw || "").trim().toLowerCase();
  if (t === "feature")     return "feature";
  if (t === "bugfix")      return "bugfix";
  if (t === "code_review") return "code_review";
  if (t === "whiteboard")  return "whiteboard";
  if (t === "testans" || t === "textans") return "text_answer";
  if (t === "issue")       return "issue";
  return null;
}
const CANONICAL = ["bugfix", "feature", "code_review", "whiteboard", "text_answer", "issue"];
const TYPE_LABEL = {
  feature: "Feature", bugfix: "Bug Fix", code_review: "Code Review",
  whiteboard: "Whiteboard", text_answer: "Text Answer", issue: "Issue",
};
const TYPE_COLOR = {
  feature: C.brandGreen, bugfix: C.accentCoral, code_review: C.accentBlue,
  whiteboard: C.accentAmber, text_answer: C.midGray, issue: C.lightGray1,
};
const SHORT_LABEL = {
  feature: "Feature", bugfix: "Bug Fix", code_review: "CR",
  whiteboard: "WB", text_answer: "TA", issue: "Issue",
};
const TOTAL_TASKS_IN_REPOS = 272;

// ─── Compute stats for a subset of attempt IDs ───────────────────────────────
function computeSubset(rows, filterAids, attemptCompany) {
  const aidSet = new Set(filterAids);
  const typeTasks = {}, typeAttempts = {}, typeCompanies = {};
  CANONICAL.forEach(t => { typeTasks[t]=new Set(); typeAttempts[t]=new Set(); typeCompanies[t]=new Set(); });

  const attemptTasks  = {};
  const attemptTypes  = {};

  for (const r of rows) {
    const aid = r.attempt_id;
    if (!aidSet.has(aid)) continue;
    const t  = normType(r.coderepo_task_type_adj);
    const tid = r.coderepo_task_qid;
    const co  = r.company_name;

    if (!attemptTasks[aid]) attemptTasks[aid] = new Set();
    if (!attemptTypes[aid]) attemptTypes[aid] = new Set();
    if (tid) attemptTasks[aid].add(tid);
    if (t)   attemptTypes[aid].add(t);
    if (t) {
      typeTasks[t].add(tid);
      typeAttempts[t].add(aid);
      if (co) typeCompanies[t].add(co);
    }
  }

  const totalAttempts = aidSet.size;
  const allCos = new Set(filterAids.map(a => attemptCompany[a]).filter(Boolean));

  // avg / median tasks
  const taskCounts = filterAids.map(a => (attemptTasks[a] || new Set()).size);
  const typeCounts = filterAids.map(a => (attemptTypes[a] || new Set()).size).filter(n => n > 0);
  const avg   = n => n.reduce((a,b)=>a+b,0) / (n.length||1);
  const med   = n => { const s=[...n].sort((a,b)=>a-b); return s[Math.floor(s.length/2)]||0; };

  // combos
  const comboCounts = {}, comboCompanies = {};
  filterAids.forEach(aid => {
    const types = attemptTypes[aid];
    if (!types || !types.size) return;
    const key = [...types].sort().join("+");
    comboCounts[key] = (comboCounts[key]||0) + 1;
    if (!comboCompanies[key]) comboCompanies[key] = new Set();
    if (attemptCompany[aid]) comboCompanies[key].add(attemptCompany[aid]);
  });
  const topCombos = Object.entries(comboCounts)
    .sort((a,b) => b[1]-a[1]).slice(0,5)
    .map(([key,cnt]) => [key, cnt, (comboCompanies[key]||new Set()).size]);

  const typeSummary = CANONICAL.map(t => ({
    key: t, label: TYPE_LABEL[t], color: TYPE_COLOR[t],
    attempts: typeAttempts[t].size,
    companies: typeCompanies[t].size,
  })).sort((a,b) => b.attempts - a.attempts);

  return {
    totalAttempts,
    totalCompanies: allCos.size,
    avgTasks:      avg(taskCounts),
    medianTasks:   med(taskCounts),
    avgTaskTypes:  avg(typeCounts),
    medianTaskTypes: med(typeCounts),
    typeSummary,
    topCombos,
  };
}

// ─── Main compute ─────────────────────────────────────────────────────────────
function compute(rows) {
  // Build attempt-level maps
  const attemptCompany = {}, attemptUsage = {};
  const allAttemptedTaskIds = new Set();

  for (const r of rows) {
    const aid = r.attempt_id;
    if (!aid) continue;
    if (r.company_name) attemptCompany[aid] = r.company_name;
    if (r.usage_type)   attemptUsage[aid]   = r.usage_type;
    if (r.coderepo_task_qid) allAttemptedTaskIds.add(r.coderepo_task_qid);
  }

  const screenAids    = Object.keys(attemptUsage).filter(a => attemptUsage[a] === "screen");
  const interviewAids = Object.keys(attemptUsage).filter(a => attemptUsage[a] === "interview");
  const allAids       = Object.keys(attemptUsage);

  const screen    = computeSubset(rows, screenAids,    attemptCompany);
  const interview = computeSubset(rows, interviewAids, attemptCompany);
  const combined  = computeSubset(rows, allAids,       attemptCompany);

  const totalTasksAttempted = allAttemptedTaskIds.size;
  const tasksNeverAttempted = TOTAL_TASKS_IN_REPOS - totalTasksAttempted;

  return {
    totalRows: rows.length,
    totalTasksInRepos: TOTAL_TASKS_IN_REPOS,
    totalTasksAttempted,
    tasksNeverAttempted,
    combined, screen, interview,
  };
}

// ─── Combo label helpers ──────────────────────────────────────────────────────
function comboLabelFull(key) {
  const parts = key.split("+");
  if (parts.length === 1) return `${TYPE_LABEL[parts[0]] || parts[0]} only`;
  return parts.map(t => TYPE_LABEL[t] || t).join(" + ");
}
function comboLabelShort(key) {
  const parts = key.split("+");
  if (parts.length === 1) return `${TYPE_LABEL[parts[0]] || parts[0]} only`;
  return parts.map(t => SHORT_LABEL[t] || t).join(" + ");
}

// ─── Type + Combo split (screen vs interview) ────────────────────────────────
function computeTypeSplit(rows) {
  const attemptUsage = {}, attemptCompany = {};
  rows.forEach(r => {
    if (r.attempt_id && r.usage_type)   attemptUsage[r.attempt_id]   = r.usage_type;
    if (r.attempt_id && r.company_name) attemptCompany[r.attempt_id] = r.company_name;
  });

  const typeScreen = {}, typeInterview = {}, typeCompanies = {};
  CANONICAL.forEach(t => { typeScreen[t]=new Set(); typeInterview[t]=new Set(); typeCompanies[t]=new Set(); });

  const attemptTypes = {};
  rows.forEach(r => {
    const aid = r.attempt_id, t = normType(r.coderepo_task_type_adj);
    if (!aid || !t) return;
    if (!attemptTypes[aid]) attemptTypes[aid] = new Set();
    attemptTypes[aid].add(t);
    const usage = attemptUsage[aid], co = attemptCompany[aid];
    if (usage === "screen")    typeScreen[t].add(aid);
    if (usage === "interview") typeInterview[t].add(aid);
    if (co) typeCompanies[t].add(co);
  });

  const totalAttempts = Object.keys(attemptUsage).length;

  const typeSplit = CANONICAL.map(t => ({
    key: t,
    screen:    typeScreen[t].size,
    interview: typeInterview[t].size,
    total:     typeScreen[t].size + typeInterview[t].size,
    companies: typeCompanies[t].size,
  })).filter(t => t.total > 0).sort((a,b) => b.total - a.total);

  // Combo split
  const comboScreen = {}, comboInterview = {}, comboCompanies = {};
  Object.entries(attemptTypes).forEach(([aid, types]) => {
    if (!types.size) return;
    const key = [...types].sort().join("+");
    if (!comboScreen[key]) { comboScreen[key]=new Set(); comboInterview[key]=new Set(); comboCompanies[key]=new Set(); }
    const usage = attemptUsage[aid], co = attemptCompany[aid];
    if (usage === "screen")    comboScreen[key].add(aid);
    if (usage === "interview") comboInterview[key].add(aid);
    if (co) comboCompanies[key].add(co);
  });

  const comboSplit = Object.keys(comboScreen)
    .map(key => ({
      key,
      screen:    comboScreen[key].size,
      interview: comboInterview[key].size,
      total:     comboScreen[key].size + comboInterview[key].size,
      companies: comboCompanies[key].size,
    }))
    .sort((a,b) => b.total - a.total)
    .slice(0, 5);

  return { typeSplit, comboSplit, totalAttempts };
}

// ─── Build deck ───────────────────────────────────────────────────────────────
async function buildDeck() {
  const BASE = path.join(__dirname, "..");
  const rows = parseCSV(path.join(BASE,
    "new files/NextGen_Content_Q3'26_Coderepo_TASK_questions_Usage_2026_03_10.csv"));

  const S = compute(rows);
  const SC = S.screen, IN = S.interview, CO = S.combined;

  console.log(`Screen: ${SC.totalAttempts} attempts | avg ${SC.avgTasks.toFixed(1)} tasks | avg ${SC.avgTaskTypes.toFixed(2)} types`);
  console.log(`Interview: ${IN.totalAttempts} attempts | avg ${IN.avgTasks.toFixed(1)} tasks | avg ${IN.avgTaskTypes.toFixed(2)} types`);
  console.log(`Tasks in repos: ${S.totalTasksInRepos} | Attempted: ${S.totalTasksAttempted} | Gap: ${S.tasksNeverAttempted}`);

  const pres = new PptxGenJS();
  pres.layout  = "LAYOUT_16x9";
  pres.author  = "HackerRank NextGen";
  pres.title   = "CodeRepo Task Type Analysis Q2 2026";

  // ── SLIDE 1: Title ──────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.deepNavy };
    s.addShape("rect", { x: 0, y: 0, w: 0.18, h: H,
      fill: { color: C.brandGreen }, line: { color: C.brandGreen } });
    s.addText("HACKERRANK · NEXTGEN", {
      x: 0.38, y: 1.15, w: 8, h: 0.32,
      fontFace: FONT_HEAD, fontSize: 10, bold: true, charSpacing: 5, color: C.brandGreen, margin: 0,
    });
    s.addText("CodeRepo Task Type\nAnalysis", {
      x: 0.38, y: 1.55, w: 8.5, h: 1.9,
      fontFace: FONT_HEAD, fontSize: 44, bold: true, color: C.white, margin: 0,
    });
    s.addText("Q1 2026  ·  Screen vs Interview  ·  Which task types drive real usage?", {
      x: 0.38, y: 3.55, w: 8.8, h: 0.4,
      fontFace: FONT_BODY, fontSize: 13, color: C.lightGray1, margin: 0,
    });
    s.addText("March 2026", {
      x: 0.38, y: 4.1, w: 4, h: 0.32,
      fontFace: FONT_BODY, fontSize: 11, color: C.midGray, margin: 0,
    });
    s.addShape("rect", { x: 0.38, y: 5.22, w: 9.44, h: 0.04,
      fill: { color: C.brandGreen }, line: { color: C.brandGreen } });
  }

  // ── SLIDE 2: Snapshot — Screen vs Interview ─────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "Snapshot  ·  Screen vs Interview");

    // Panel headers
    panelHeader(s, "SCREEN", 0.28, 4.5, C.accentBlue);
    panelHeader(s, "INTERVIEW", 5.22, 4.5, C.darkTeal);

    // Vertical divider
    s.addShape("rect", { x: 4.86, y: 0.98, w: 0.03, h: 4.5,
      fill: { color: C.lightGray1 }, line: { color: C.lightGray1 } });

    const screenMetrics = [
      [SC.totalAttempts.toLocaleString(),    "Attempts"],
      [SC.avgTasks.toFixed(1),               "Avg Tasks per Attempt"],
      [SC.medianTasks.toString(),            "Median Tasks per Attempt"],
      [SC.avgTaskTypes.toFixed(1),           "Avg Task Types per Attempt"],
      [SC.medianTaskTypes.toString(),        "Median Task Types per Attempt"],
      [SC.totalCompanies.toString(),         "Companies"],
    ];
    const interviewMetrics = [
      [IN.totalAttempts.toLocaleString(),    "Attempts"],
      [IN.avgTasks.toFixed(1),               "Avg Tasks per Attempt"],
      [IN.medianTasks.toString(),            "Median Tasks per Attempt"],
      [IN.avgTaskTypes.toFixed(1),           "Avg Task Types per Attempt"],
      [IN.medianTaskTypes.toString(),        "Median Task Types per Attempt"],
      [IN.totalCompanies.toString(),         "Companies"],
    ];

    screenMetrics.forEach(([num, label], i) => {
      const col = i % 2, row = Math.floor(i / 2);
      statCard(s, num, label, 0.28 + col * 2.2, 1.32 + row * 1.38, 2.1, 1.22, C.accentBlue);
    });
    interviewMetrics.forEach(([num, label], i) => {
      const col = i % 2, row = Math.floor(i / 2);
      statCard(s, num, label, 5.22 + col * 2.2, 1.32 + row * 1.38, 2.1, 1.22, C.brandGreen);
    });
  }

  // ── SLIDE 2b: Combined Usage Summary ─────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "Combined Usage  ·  Screen + Interview");

    panelHeader(s, "COMBINED  ·  SCREEN + INTERVIEW", 0.28, 9.44, C.nearBlack);

    const combinedMetrics = [
      [(CO.totalAttempts).toLocaleString(),         "Total Attempts"],
      [CO.avgTasks.toFixed(1),                      "Avg Tasks per Attempt"],
      [CO.medianTasks.toString(),                   "Median Tasks per Attempt"],
      [CO.totalCompanies.toString(),                "Companies"],
      [CO.avgTaskTypes.toFixed(1),                  "Avg Task Types per Attempt"],
      [CO.medianTaskTypes.toString(),               "Median Task Types per Attempt"],
      [S.totalTasksAttempted.toString(),            "Unique Tasks Ever Assigned"],
      [S.tasksNeverAttempted + " of " + S.totalTasksInRepos, "Tasks Never Assigned"],
    ];

    const cardW = 2.2, cardH = 1.22, gap = 0.14;
    const cols = 4, startX = 0.28, startY = 1.32;
    combinedMetrics.forEach(([num, label], i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = startX + col * (cardW + gap);
      const y = startY + row * (cardH + 0.16);
      const isAlert = label === "Tasks Never Assigned";
      statCard(s, num, label, x, y, cardW, cardH, isAlert ? C.accentCoral : C.brandGreen);
    });
  }

  // ── SLIDE 3: Task Type Reach — Screen vs Interview ──────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "Task Type Reach  ·  Screen vs Interview");

    const scMap = Object.fromEntries(SC.typeSummary.map(t => [t.key, t]));
    const inMap = Object.fromEntries(IN.typeSummary.map(t => [t.key, t]));

    const header = [
      [
        { text: "Task Type",           options: { bold: true, color: C.white, fill: { color: C.darkTeal }, fontSize: 10, fontFace: FONT_HEAD } },
        { text: "Screen Attempts",     options: { bold: true, color: C.white, fill: { color: C.accentBlue }, fontSize: 10, fontFace: FONT_HEAD } },
        { text: "Screen Reach %",      options: { bold: true, color: C.white, fill: { color: C.accentBlue }, fontSize: 10, fontFace: FONT_HEAD } },
        { text: "Interview Attempts",  options: { bold: true, color: C.white, fill: { color: C.darkTeal }, fontSize: 10, fontFace: FONT_HEAD } },
        { text: "Interview Reach %",   options: { bold: true, color: C.white, fill: { color: C.darkTeal }, fontSize: 10, fontFace: FONT_HEAD } },
      ],
    ];

    const dataRows = CANONICAL.map(t => {
      const sc = scMap[t] || { attempts: 0, companies: 0 };
      const iv = inMap[t] || { attempts: 0, companies: 0 };
      const scPct = SC.totalAttempts > 0 ? (sc.attempts / SC.totalAttempts * 100).toFixed(1) + "%" : "0%";
      const ivPct = IN.totalAttempts > 0 ? (iv.attempts / IN.totalAttempts * 100).toFixed(1) + "%" : "0%";
      const hasScreen    = sc.attempts > 0;
      const hasInterview = iv.attempts > 0;
      return [
        { text: TYPE_LABEL[t], options: { bold: true, color: TYPE_COLOR[t], fill: { color: C.white }, fontSize: 11, fontFace: FONT_HEAD } },
        { text: sc.attempts > 0 ? sc.attempts.toLocaleString() : "—",
          options: { bold: hasScreen, color: hasScreen ? C.accentBlue : C.lightGray1, fill: { color: C.white }, fontSize: 11, fontFace: FONT_BODY } },
        { text: sc.attempts > 0 ? scPct : "—",
          options: { color: hasScreen ? C.darkGray : C.lightGray1, fill: { color: C.white }, fontSize: 11, fontFace: FONT_BODY } },
        { text: iv.attempts > 0 ? iv.attempts.toLocaleString() : "—",
          options: { bold: hasInterview, color: hasInterview ? C.brandGreen : C.lightGray1, fill: { color: C.white }, fontSize: 11, fontFace: FONT_BODY } },
        { text: iv.attempts > 0 ? ivPct : "—",
          options: { color: hasInterview ? C.darkGray : C.lightGray1, fill: { color: C.white }, fontSize: 11, fontFace: FONT_BODY } },
      ];
    });

    s.addTable([...header, ...dataRows], {
      x: 0.28, y: 1.0, w: 9.44,
      border: { pt: 1, color: C.lightGray1 },
      colW: [1.9, 1.7, 1.5, 1.9, 1.54],  // note: only 5 cols, adjust
      rowH: 0.52,
    });

    // Key callout
    s.addShape("rect", { x: 0.28, y: 4.82, w: 9.44, h: 0.62,
      fill: { color: C.white }, line: { color: C.lightGray1, pt: 1 }, shadow: makeShadow() });
    s.addShape("rect", { x: 0.28, y: 4.82, w: 0.06, h: 0.62,
      fill: { color: C.accentCoral }, line: { color: C.accentCoral } });
    s.addText([
      { text: "Screen ", options: { bold: true, color: C.accentBlue } },
      { text: "uses only Bug Fix and Feature — Code Review, Whiteboard, Text Answer and Issue are ", options: { color: C.darkGray } },
      { text: "0% reach on Screen. ", options: { bold: true, color: C.accentCoral } },
      { text: "Interview ", options: { bold: true, color: C.brandGreen } },
      { text: "uses all 6 types, with Feature (91%) and Bug Fix (75%) leading, followed by Code Review (65%) and Whiteboard (61%).", options: { color: C.darkGray } },
    ], {
      x: 0.42, y: 4.88, w: 9.14, h: 0.5,
      fontFace: FONT_BODY, fontSize: 10, margin: 0,
    });
  }

  // ── SLIDE 4: Combo Table — Screen vs Interview ──────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "Task Type Combos  ·  Screen vs Interview");

    // Panel headers
    panelHeader(s, "SCREEN  ·  2,001 attempts", 0.28, 4.5, C.accentBlue);
    panelHeader(s, "INTERVIEW  ·  619 attempts", 5.22, 4.5, C.darkTeal);
    s.addShape("rect", { x: 4.86, y: 0.98, w: 0.03, h: 4.5,
      fill: { color: C.lightGray1 }, line: { color: C.lightGray1 } });

    const colHeader = (text, color) => ({ text, options: {
      bold: true, color: C.white, fill: { color }, fontSize: 9, fontFace: FONT_HEAD } });

    const scHeader = [
      [colHeader("Combo", C.accentBlue), colHeader("Attempts", C.accentBlue),
       colHeader("%", C.accentBlue),     colHeader("Cos", C.accentBlue)],
    ];
    const inHeader = [
      [colHeader("Combo", C.darkTeal), colHeader("Attempts", C.darkTeal),
       colHeader("%", C.darkTeal),     colHeader("Cos", C.darkTeal)],
    ];

    const makeRow = (key, cnt, coCount, total, labelFn, accentColor) => {
      const pct = (cnt / total * 100).toFixed(1) + "%";
      return [
        { text: labelFn(key), options: { bold: true, color: TYPE_COLOR[key.split("+")[0]] || accentColor, fill: { color: C.white }, fontSize: 9.5, fontFace: FONT_HEAD } },
        { text: cnt.toLocaleString(), options: { bold: true, color: accentColor, fill: { color: C.white }, fontSize: 9.5, fontFace: FONT_HEAD } },
        { text: pct,                  options: { color: C.darkGray, fill: { color: C.white }, fontSize: 9.5, fontFace: FONT_BODY } },
        { text: coCount.toString(),   options: { color: C.nearBlack, fill: { color: C.white }, fontSize: 9.5, fontFace: FONT_BODY } },
      ];
    };

    const scRows = SC.topCombos.map(([key, cnt, cos]) =>
      makeRow(key, cnt, cos, SC.totalAttempts, comboLabelFull, C.accentBlue));
    const inRows = IN.topCombos.map(([key, cnt, cos]) =>
      makeRow(key, cnt, cos, IN.totalAttempts, comboLabelFull, C.brandGreen));

    s.addTable([...scHeader, ...scRows], {
      x: 0.28, y: 1.28, w: 4.5,
      border: { pt: 1, color: C.lightGray1 },
      colW: [2.2, 0.85, 0.7, 0.75], rowH: 0.46,
    });
    s.addTable([...inHeader, ...inRows], {
      x: 5.22, y: 1.28, w: 4.5,
      border: { pt: 1, color: C.lightGray1 },
      colW: [2.2, 0.85, 0.7, 0.75], rowH: 0.46,
    });

    // Insight strip
    const insY = 4.78;
    s.addShape("rect", { x: 0.28, y: insY, w: 9.44, h: 0.68,
      fill: { color: C.white }, line: { color: C.lightGray1, pt: 1 }, shadow: makeShadow() });
    s.addShape("rect", { x: 0.28, y: insY, w: 0.06, h: 0.68,
      fill: { color: C.accentBlue }, line: { color: C.accentBlue } });
    s.addText([
      { text: "Screen: ", options: { bold: true, color: C.accentBlue } },
      { text: "3 combos only — all Bug Fix or Feature or both. Simple, shallow.  ", options: { color: C.darkGray } },
      { text: "Interview: ", options: { bold: true, color: C.brandGreen } },
      { text: "Interviews use the same avg task depth as Screen (~2 tasks), but unlock exclusive types: Code Review (10%) and Whiteboard (4%) are interview-only — 0% reach on Screen.", options: { color: C.darkGray } },
    ], {
      x: 0.42, y: insY + 0.08, w: 9.14, h: 0.54,
      fontFace: FONT_BODY, fontSize: 10, margin: 0,
    });
  }

  // ── SLIDE 4b: Task Type Deep-Dive ────────────────────────────────────────────
  {
    const { typeSplit, comboSplit, totalAttempts } = computeTypeSplit(rows);

    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "Task Type Deep-Dive  ·  Which Types Are Used Most?");

    // Vertical divider
    s.addShape("rect", { x: 4.68, y: 1.02, w: 0.03, h: 3.52,
      fill: { color: C.lightGray1 }, line: { color: C.lightGray1 } });

    const hdrCell = (text, sub) => ({
      text: sub
        ? [{ text: text + "\n", options: { bold: true } },
           { text: sub, options: { bold: false, fontSize: 8 } }]
        : text,
      options: { bold: true, color: C.white, fill: { color: C.darkTeal },
        fontSize: 9.5, fontFace: FONT_HEAD, valign: "middle" },
    });

    const usageCell = (total, sc, iv) => ({
      text: [
        { text: total.toLocaleString() + "\n", options: { bold: true, color: C.brandGreen, fontSize: 13 } },
        { text: `( ${sc.toLocaleString()} + ${iv.toLocaleString()} )`, options: { color: C.midGray, fontSize: 9 } },
      ],
      options: { fill: { color: C.white }, valign: "middle", fontFace: FONT_BODY },
    });

    // ── Left: per-type table ──
    const ltHeader = [[
      hdrCell("Task Type"),
      hdrCell("Usage*", "(Screen + Interviews)"),
      hdrCell("% share"),
      hdrCell("Companies"),
    ]];
    const ltRows = typeSplit.map(t => {
      const pct = totalAttempts > 0 ? Math.round(t.total / totalAttempts * 100) + "%" : "0%";
      return [
        { text: TYPE_LABEL[t.key], options: { bold: true, color: TYPE_COLOR[t.key],
            fill: { color: C.white }, fontSize: 13, fontFace: FONT_HEAD, valign: "middle" } },
        usageCell(t.total, t.screen, t.interview),
        { text: pct, options: { color: C.nearBlack, fill: { color: C.white },
            fontSize: 13, fontFace: FONT_BODY, valign: "middle" } },
        { text: t.companies.toString(), options: { color: C.nearBlack, fill: { color: C.white },
            fontSize: 13, fontFace: FONT_BODY, valign: "middle" } },
      ];
    });
    s.addTable([...ltHeader, ...ltRows], {
      x: 0.28, y: 1.02, w: 4.36,
      border: { pt: 1, color: C.lightGray1 },
      colW: [1.08, 1.48, 0.9, 0.9], rowH: 0.6,
    });

    // ── Right: combo table ──
    const comboRichLabel = (key) => {
      const parts = key.split("+");
      if (parts.length === 1) return [
        { text: TYPE_LABEL[parts[0]] || parts[0], options: { color: TYPE_COLOR[parts[0]] || C.nearBlack, bold: true, fontSize: 12 } },
        { text: " only", options: { color: C.nearBlack, bold: true, fontSize: 12 } },
      ];
      return parts.flatMap((p, i) => {
        const chunk = [{ text: TYPE_LABEL[p] || p, options: { color: TYPE_COLOR[p] || C.nearBlack, bold: true, fontSize: 12 } }];
        if (i < parts.length - 1) chunk.push({ text: " + ", options: { color: C.nearBlack, fontSize: 12 } });
        return chunk;
      });
    };

    const rtHeader = [[
      hdrCell("Task Type Combo"),
      hdrCell("Usage*", "(Screen + Interviews)"),
      hdrCell("% of share"),
      hdrCell("Companies"),
    ]];
    const rtRows = comboSplit.map(c => {
      const pct = totalAttempts > 0 ? (c.total / totalAttempts * 100).toFixed(1) + "%" : "0%";
      return [
        { text: comboRichLabel(c.key), options: { fill: { color: C.white }, valign: "middle", fontFace: FONT_HEAD } },
        usageCell(c.total, c.screen, c.interview),
        { text: pct, options: { color: C.nearBlack, fill: { color: C.white },
            fontSize: 13, fontFace: FONT_BODY, valign: "middle" } },
        { text: c.companies.toString(), options: { color: C.nearBlack, fill: { color: C.white },
            fontSize: 13, fontFace: FONT_BODY, valign: "middle" } },
      ];
    });
    s.addTable([...rtHeader, ...rtRows], {
      x: 4.76, y: 1.02, w: 4.96,
      border: { pt: 1, color: C.lightGray1 },
      colW: [2.08, 1.38, 0.88, 0.62], rowH: 0.6,
    });

    // ── Footer callout ──
    const screenTypeNames = typeSplit.filter(t => t.screen > 0).map(t => TYPE_LABEL[t.key]).join(" and ");
    const ivTypeCount = typeSplit.filter(t => t.interview > 0).length;
    const topComboLabel = comboSplit.length ? comboLabelFull(comboSplit[0].key) : "";
    const footY = 4.62;
    s.addShape("rect", { x: 0.28, y: footY, w: 9.44, h: 0.72,
      fill: { color: C.white }, line: { color: C.lightGray1, pt: 1 }, shadow: makeShadow() });
    s.addText([
      { text: "Screen", options: { bold: true, color: C.accentBlue } },
      { text: `: Uses only ${screenTypeNames} — all other task types are 0% used\n`, options: { color: C.darkGray } },
      { text: "Interview", options: { bold: true, color: C.brandGreen } },
      { text: `: Uses all ${ivTypeCount} types & top combo (${topComboLabel}) dominates`, options: { color: C.darkGray } },
    ], {
      x: 0.42, y: footY + 0.08, w: 9.14, h: 0.56,
      fontFace: FONT_BODY, fontSize: 10, margin: 0,
    });

    // ── Bottom bar ──
    s.addShape("rect", { x: 0, y: 5.36, w: 10, h: 0.26,
      fill: { color: C.deepNavy }, line: { color: C.deepNavy } });
    s.addText("H\u25A0", {
      x: 0.12, y: 5.38, w: 0.5, h: 0.2,
      fontFace: FONT_HEAD, fontSize: 11, bold: true, color: C.white, margin: 0,
    });
    s.addText("\u00A92026 HackerRank. Confidential and Proprietary.", {
      x: 5.5, y: 5.39, w: 4.2, h: 0.18,
      fontFace: "Courier New", fontSize: 7.5, color: C.midGray, align: "right", margin: 0,
    });
  }

  // ── SLIDE 5: Depth — Screen vs Interview ─────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "Depth of Engagement  ·  Tasks per Attempt by Company");

    panelHeader(s, "SCREEN", 0.28, 4.5, C.accentBlue);
    panelHeader(s, "INTERVIEW", 5.22, 4.5, C.darkTeal);
    s.addShape("rect", { x: 4.86, y: 0.98, w: 0.03, h: 4.42,
      fill: { color: C.lightGray1 }, line: { color: C.lightGray1 } });

    // Screen company depth table (top 9 by avg tasks)
    const hdrOpt = (color) => ({ bold: true, color: C.white, fill: { color }, fontSize: 9, fontFace: FONT_HEAD });
    const scCoHeader = [[
      { text: "Company",    options: hdrOpt(C.accentBlue) },
      { text: "Attempts",   options: hdrOpt(C.accentBlue) },
      { text: "Avg Tasks",  options: hdrOpt(C.accentBlue) },
      { text: "Avg Types",  options: hdrOpt(C.accentBlue) },
    ]];
    // Interview company depth table
    const inCoHeader = [[
      { text: "Company",    options: hdrOpt(C.darkTeal) },
      { text: "Attempts",   options: hdrOpt(C.darkTeal) },
      { text: "Avg Tasks",  options: hdrOpt(C.darkTeal) },
      { text: "Avg Types",  options: hdrOpt(C.darkTeal) },
    ]];

    // Build company-level avg tasks + avg types per attempt
    function coDepth(rows, productAids, attemptCompanyMap) {
      const aidSet = new Set(productAids);
      const coTasks = {}, coTypes = {};
      for (const r of rows) {
        const aid = r.attempt_id;
        if (!aidSet.has(aid)) continue;
        const co = r.company_name, tid = r.coderepo_task_qid, t = normType(r.coderepo_task_type_adj);
        if (!co) continue;
        if (!coTasks[co]) { coTasks[co] = {}; coTypes[co] = {}; }
        if (tid) { if (!coTasks[co][aid]) coTasks[co][aid] = new Set(); coTasks[co][aid].add(tid); }
        if (t)   { if (!coTypes[co][aid]) coTypes[co][aid] = new Set(); coTypes[co][aid].add(t); }
      }
      return Object.entries(coTasks)
        .map(([co, aidMap]) => {
          const taskCnts = Object.values(aidMap).map(s => s.size);
          const typeCnts = Object.values(coTypes[co] || {}).map(s => s.size);
          const avg = arr => arr.reduce((a,b)=>a+b,0) / (arr.length || 1);
          return { company: co, attempts: taskCnts.length, avgTasks: avg(taskCnts), avgTypes: avg(typeCnts) };
        })
        .filter(c => c.attempts >= 3)
        .sort((a,b) => b.avgTasks - a.avgTasks)
        .slice(0, 9);
    }

    const scAids = Object.keys({}).concat; // placeholder
    // Re-derive from rows
    const attemptUsageMap = {};
    const attemptCompanyMap = {};
    rows.forEach(r => {
      if (r.attempt_id && r.usage_type)   attemptUsageMap[r.attempt_id]   = r.usage_type;
      if (r.attempt_id && r.company_name) attemptCompanyMap[r.attempt_id] = r.company_name;
    });
    const scAidsArr = Object.keys(attemptUsageMap).filter(a => attemptUsageMap[a] === "screen");
    const inAidsArr = Object.keys(attemptUsageMap).filter(a => attemptUsageMap[a] === "interview");

    const scDepth = coDepth(rows, scAidsArr, attemptCompanyMap);
    const inDepth = coDepth(rows, inAidsArr, attemptCompanyMap);

    const makeCoRow = (c, accentColor) => [
      { text: c.company,               options: { color: C.nearBlack, fill: { color: C.white }, fontSize: 9, fontFace: FONT_BODY } },
      { text: c.attempts.toString(),   options: { color: C.midGray,   fill: { color: C.white }, fontSize: 9, fontFace: FONT_BODY } },
      { text: c.avgTasks.toFixed(1),   options: { bold: true, color: accentColor, fill: { color: C.white }, fontSize: 9, fontFace: FONT_HEAD } },
      { text: c.avgTypes.toFixed(1),   options: { color: C.darkGray,  fill: { color: C.white }, fontSize: 9, fontFace: FONT_BODY } },
    ];

    s.addTable([...scCoHeader, ...scDepth.map(c => makeCoRow(c, C.accentBlue))], {
      x: 0.28, y: 1.28, w: 4.5,
      border: { pt: 1, color: C.lightGray1 },
      colW: [2.0, 0.7, 0.9, 0.9], rowH: 0.38,
    });
    s.addTable([...inCoHeader, ...inDepth.map(c => makeCoRow(c, C.brandGreen))], {
      x: 5.22, y: 1.28, w: 4.5,
      border: { pt: 1, color: C.lightGray1 },
      colW: [2.0, 0.7, 0.9, 0.9], rowH: 0.38,
    });

    s.addText(`Screen avg: ${SC.avgTasks.toFixed(1)} tasks/attempt · median: ${SC.medianTasks}      Interview avg: ${IN.avgTasks.toFixed(1)} tasks/attempt · median: ${IN.medianTasks}`, {
      x: 0.28, y: 5.32, w: 9.44, h: 0.18,
      fontFace: FONT_BODY, fontSize: 8.5, italic: true, color: C.midGray, margin: 0,
    });
  }

  // ── SLIDE 6: Dark — Key Insights ─────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.darkTeal };
    s.addShape("rect", { x: 0, y: 0, w: 0.18, h: H,
      fill: { color: C.brandGreen }, line: { color: C.brandGreen } });

    s.addText("TASK TYPE INSIGHTS", {
      x: 0.28, y: 0.28, w: 9.4, h: 0.38,
      fontFace: FONT_HEAD, fontSize: 13, bold: true, charSpacing: 4, color: C.brandGreen, margin: 0,
    });
    s.addText("Interviews unlock exclusive task types — not just more tasks", {
      x: 0.28, y: 0.72, w: 9, h: 0.65,
      fontFace: FONT_HEAD, fontSize: 30, bold: true, color: C.white, margin: 0,
    });

    const callouts = [
      {
        label: "SCREEN  ·  2 TASK TYPES ONLY",
        color: C.accentBlue,
        val:   "Bug Fix + Feature",
        sub:   `2,001 attempts · avg 2.1 tasks/attempt · median 1 task type · simple, shallow assessments`,
      },
      {
        label: "INTERVIEW  ·  ALL 6 TYPES ACTIVE",
        color: C.brandGreen,
        val:   "2.0 tasks avg",
        sub:   `619 attempts · avg 1.5 task types/attempt · median 1 type`,
      },
      {
        label: "CODE REVIEW + WHITEBOARD  ·  INTERVIEW ONLY",
        color: C.accentAmber,
        val:   "0% on Screen",
        sub:   `Code Review in 10% of interviews · Whiteboard in 4% — both interview-exclusive, never assigned on Screen`,
      },
    ];
    callouts.forEach((c, i) => {
      const x = 0.28 + i * 3.14;
      s.addShape("rect", { x, y: 1.55, w: 3.0, h: 2.0,
        fill: { color: "FFFFFF", transparency: 90 }, line: { color: c.color, pt: 2 } });
      s.addText(c.label, {
        x: x + 0.12, y: 1.62, w: 2.76, h: 0.28,
        fontFace: FONT_HEAD, fontSize: 7.5, bold: true, charSpacing: 1.5, color: c.color, margin: 0,
      });
      s.addText(c.val, {
        x: x + 0.12, y: 1.94, w: 2.76, h: 0.65,
        fontFace: FONT_HEAD, fontSize: 28, bold: true, color: C.white, align: "center", margin: 0,
      });
      s.addText(c.sub, {
        x: x + 0.12, y: 2.64, w: 2.76, h: 0.82,
        fontFace: FONT_BODY, fontSize: 9.5, color: C.lightGray1, margin: 0,
      });
    });

    const facts = [
      `Code Review (10%) and Whiteboard (4%) are Interview-only — 0% reach on Screen.`,
      `Screen usage is commodity: Bug Fix only (52%) or Feature only (39%) — no company uses more than 2 types on Screen`,
      `"Tasks never attempted" gap: ${S.tasksNeverAttempted} of ${S.totalTasksInRepos} tasks (${Math.round(S.tasksNeverAttempted/S.totalTasksInRepos*100)}%) in repos were never assigned — supply-side waste`,
    ];
    s.addText("What to act on:", {
      x: 0.28, y: 3.73, w: 9.4, h: 0.28,
      fontFace: FONT_HEAD, fontSize: 11, bold: true, color: C.brandGreen, margin: 0,
    });
    s.addText(
      facts.map((f, i) => ({ text: f, options: { bullet: true, breakLine: i < facts.length - 1 } })),
      { x: 0.28, y: 4.05, w: 9.4, h: 1.38, fontFace: FONT_BODY, fontSize: 10, color: C.lightGray1, margin: 0 }
    );
  }

  const outPath = path.join(__dirname, "CodeRepo-TaskType-Q2-2026.pptx");
  await pres.writeFile({ fileName: outPath });
  console.log(`\nDeck written: ${outPath}`);
}

buildDeck().catch(err => { console.error(err); process.exit(1); });

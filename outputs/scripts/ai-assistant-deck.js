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
const H = 5.625;

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

// ─── CSV Parser ────────────────────────────────────────────────────────────
// Handles: blank/query first row, headers on first real row, quoted fields
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

// ─── Number helpers ────────────────────────────────────────────────────────
const fmt     = n => Math.round(n).toLocaleString("en-US");
const pct     = (n, d) => d > 0 ? Math.round((n / d) * 100) : 0;
const pctFmt  = (n, d) => { if (!d) return "0%"; const v = n / d * 100; return v < 1 ? v.toFixed(1) + "%" : Math.round(v) + "%"; };
const cap     = (n, limit = 5000) => Math.min(n, limit);

// ─── Company name fallback from email domain ───────────────────────────────
// Free/generic email providers to skip
const FREE_DOMAINS = /gmail|yahoo|outlook|hotmail|protonmail|icloud|live\.com|mailinator|test\.com|asd\.com/i;

function resolveCompanyName(companyName, email) {
  if (companyName && companyName.trim()) return companyName.trim();
  if (!email) return "Unknown";
  const domain = (email.split('@')[1] || "").toLowerCase();
  if (!domain || FREE_DOMAINS.test(domain)) return "Unknown";
  // Strip common suffixes to get company slug: e.g. "atlassian.com" → "atlassian"
  // handles bnymellon.com, paloaltonetworks.com, etc.
  const parts = domain.split('.');
  // Take second-to-last part (the company name segment before TLD)
  const slug = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
  // Title-case the slug
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

// ─── Compute screen stats ──────────────────────────────────────────────────
function computeScreen(rows) {
  const attempts = new Set(), companies = new Set(), tests = new Set();
  let totalMsgs = 0;
  const qtype = {};
  const coMap = {}; // company_id → { name, attempts: Set }

  rows.forEach(r => {
    attempts.add(r.attempt_id);
    if (r.company_id) companies.add(r.company_id);
    if (r.test_id)    tests.add(r.test_id);
    const msgs = cap(parseInt(r.user_msg_count) || 0);
    totalMsgs += msgs;

    const qt = r.question_type || "untagged";
    if (!qtype[qt]) qtype[qt] = { aSet: new Set(), msgs: 0 };
    qtype[qt].aSet.add(r.attempt_id);
    qtype[qt].msgs += msgs;

    const cid = r.company_id || "unknown";
    const cn  = resolveCompanyName(r.company_name, r.owner_email);
    if (!coMap[cid]) coMap[cid] = { name: cn, attempts: new Set() };
    coMap[cid].attempts.add(r.attempt_id);
  });

  const totalAttempts = attempts.size;
  const qtList = Object.entries(qtype)
    .map(([qt, d]) => ({
      qt,
      attempts: d.aSet.size,
      pct: pct(d.aSet.size, totalAttempts),
      msgs: d.msgs,
      avg: +(d.msgs / d.aSet.size).toFixed(1),
    }))
    .sort((a, b) => b.attempts - a.attempts);

  const topCos = Object.entries(coMap)
    .map(([cid, d]) => ({ cid, name: d.name, attempts: d.attempts.size }))
    .sort((a, b) => b.attempts - a.attempts)
    .slice(0, 15);

  return { attempts: totalAttempts, companies: companies.size, tests: tests.size, totalMsgs, qtList, topCos };
}

// ─── Compute interview stats ───────────────────────────────────────────────
function computeInterviews(rows) {
  const interviews = new Set(), companies = new Set();
  let totalMsgs = 0;
  const qtype = {};
  const coMap = {}; // company_id → { name, interviews: Set }

  rows.forEach(r => {
    interviews.add(r.interview_id);
    if (r.company_id) companies.add(r.company_id);
    const msgs = cap(parseInt(r.user_msg_cnt) || 0);
    totalMsgs += msgs;

    const qt = r.question_type || "Untagged";
    if (!qtype[qt]) qtype[qt] = { iSet: new Set(), msgs: 0 };
    qtype[qt].iSet.add(r.interview_id);
    qtype[qt].msgs += msgs;

    const cid = r.company_id || "unknown";
    const cn  = resolveCompanyName(r.company_name, r.interview_owner_email);
    if (!coMap[cid]) coMap[cid] = { name: cn, interviews: new Set() };
    coMap[cid].interviews.add(r.interview_id);
  });

  const totalIv = interviews.size;
  const qtList = Object.entries(qtype)
    .map(([qt, d]) => ({
      qt,
      interviews: d.iSet.size,
      pct: pct(d.iSet.size, totalIv),
      msgs: d.msgs,
      avg: +(d.msgs / d.iSet.size).toFixed(1),
    }))
    .sort((a, b) => b.interviews - a.interviews);

  const topCos = Object.entries(coMap)
    .map(([cid, d]) => ({ cid, name: d.name, interviews: d.interviews.size }))
    .sort((a, b) => b.interviews - a.interviews)
    .slice(0, 15);

  return { interviews: totalIv, companies: companies.size, totalMsgs, qtList, topCos };
}

// ─── Build adoption lookup maps from new files ─────────────────────────────
function buildScreenAdoption(rows) {
  // Grain: company × test → aggregate to company level
  const map = {}; // company_id → { aiUsed, total }
  rows.forEach(r => {
    const cid = r.company_id;
    if (!cid) return;
    if (!map[cid]) map[cid] = { aiUsed: 0, total: 0 };
    map[cid].aiUsed += parseInt(r.attempts_used_ai_assistant) || 0;
    map[cid].total  += parseInt(r.count_overal_attempts) || 0;
  });
  return map;
}

function buildInterviewAdoption(rows) {
  // Grain: company level already
  const map = {}; // company_id → { aiUsed, total }
  rows.forEach(r => {
    const cid = r.company_id;
    if (!cid) return;
    map[cid] = {
      aiUsed: parseInt(r.ai_assistant_used_interviews) || 0,
      total:  parseInt(r.cnt_overall_interviews_started) || 0,
    };
  });
  return map;
}


// ─── Compute feedback stats ────────────────────────────────────────────────
function computeFeedback(rows, feedbackUserRoleField) {
  const ratings = rows
    .map(r => parseFloat(r.product_rating))
    .filter(n => !isNaN(n) && n >= 1 && n <= 5);
  const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach(r => { const k = Math.round(r); if (dist[k] != null) dist[k]++; });

  // Filter to rows that mention the AI assistant specifically
  const AI_KW = /\b(ai|assistant|hint|suggest|auto[\s-]?complet|copilot|chatbot|gpt|llm|useful|useless|confus|explain|recommendation|cod.?assist)\b/i;
  const aiFb = rows.filter(r => r.feedback && AI_KW.test(r.feedback));

  const THEME_DEFS = [
    {
      name: "Helpfulness & Suggestions",
      desc: "AI hints guided candidates through problems without giving away answers — genuinely useful in practice.",
      kw: /helpful|useful|great.*assist|good.*assist|excellent.*ai|love.*hint|guided|suggestion.*(good|great|helpful)/i,
      color: C.brandGreen,
    },
    {
      name: "Poor Quality / Inaccurate",
      desc: "AI responses were wrong, off-topic, or unhelpful — eroded candidate trust in the tool.",
      kw: /bad|terrible|poor|useless|wrong|incorrect|sucks|awful|horrible|doesn.t work|not helpful/i,
      color: C.accentCoral,
    },
    {
      name: "Fairness / Cheating Concern",
      desc: "Candidates or assessors raised concerns that AI assistance creates an unfair advantage or enables cheating.",
      kw: /\b(ai|assistant|hint|tool|copilot)\b[^.]{0,60}\b(cheat|unfair|advantage|bypass|allowed)\b|\b(cheat|unfair|advantage|bypass|allowed)\b[^.]{0,60}\b(ai|assistant|hint|tool|copilot)\b/i,
      color: C.accentCoral,
    },
    {
      name: "UX / Interface Issues",
      desc: "AI autocomplete was intrusive or hard to dismiss — the interface made it difficult to ignore suggestions.",
      kw: /confus|difficult|hard to|disable.*auto|autocomplete|auto.complet|interface|no easy way/i,
      color: C.accentAmber,
    },
    {
      name: "Performance / Reliability",
      desc: "AI tool caused slowdowns, freezes, or disconnections that disrupted the candidate experience.",
      kw: /slow|freeze|crash|lag|hang|disconnect|connection.*lost|timeout|random.*scroll|scroll.*random/i,
      color: C.accentAmber,
    },
    {
      name: "Missing / Limited Features",
      desc: "Candidates wanted more model options, context-aware hints, or features the current AI does not offer.",
      kw: /wish|missing|lack|no option|no opus|could not run|not able to run|no.*model|request.*feature/i,
      color: C.accentBlue,
    },
  ];

  const themes = THEME_DEFS.map(def => {
    const matched = aiFb.filter(r => def.kw.test(r.feedback || ""));
    const themeRatings = matched.map(r => parseFloat(r.product_rating)).filter(n => !isNaN(n) && n >= 1 && n <= 5);
    const avgRating = themeRatings.length
      ? (themeRatings.reduce((a, b) => a + b, 0) / themeRatings.length).toFixed(1)
      : "–";
    const verbatims = matched.slice(0, 2).map(r => {
      const fb  = r.feedback.length > 105 ? r.feedback.slice(0, 102) + "…" : r.feedback;
      const co  = resolveCompanyName(r.company_name, r.company_owner_email || r.owner_email);
      const rol = feedbackUserRoleField && r[feedbackUserRoleField] ? ` [${r[feedbackUserRoleField]}]` : "";
      return `\u2192 "${fb}"${co && co !== "Unknown" ? " \u2014 " + co : ""}${rol} [${r.product_rating}\u2605]`;
    });
    return { name: def.name, desc: def.desc, count: matched.length, avgRating, color: def.color, verbatims };
  }).filter(t => t.count > 0).slice(0, 6);

  return { avg, dist, totalRatings: ratings.length, aiFbCount: aiFb.length, themes };
}

function computePersonaSplit(rows) {
  const byRole = { candidate: [], interviewer: [] };
  rows.forEach(r => {
    const role = r.feedback_user_role;
    const rat  = parseFloat(r.product_rating);
    if (!isNaN(rat) && rat >= 1 && rat <= 5 && byRole[role]) byRole[role].push(rat);
  });
  const avg = arr => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : "–";
  return {
    candidateAvg: avg(byRole.candidate),   candidateN: byRole.candidate.length,
    interviewerAvg: avg(byRole.interviewer), interviewerN: byRole.interviewer.length,
  };
}

function computeMsgBuckets(rows) {
  const buckets = { low: [], mid: [], heavy: [] };
  rows.forEach(r => {
    const msgs = Math.min(parseInt(r.user_msg_cnt) || 0, 5000);
    const rat  = parseFloat(r.product_rating);
    if (isNaN(rat) || rat < 1) return;
    if (msgs <= 5)       buckets.low.push(rat);
    else if (msgs <= 20) buckets.mid.push(rat);
    else                 buckets.heavy.push(rat);
  });
  const avg = arr => arr.length ? (arr.reduce((a,b) => a+b,0)/arr.length).toFixed(2) : null;
  return [
    { label: "Low (1–5 msgs)",   avg: avg(buckets.low),   n: buckets.low.length   },
    { label: "Med (6–20 msgs)",  avg: avg(buckets.mid),   n: buckets.mid.length   },
    { label: "Heavy (21+ msgs)", avg: avg(buckets.heavy), n: buckets.heavy.length },
  ].filter(b => b.avg !== null);
}

// ─── Rating distribution bar ────────────────────────────────────────────────
function drawRatingDist(s, dist, totalRatings, x, y, w, h) {
  s.addShape("rect", { x, y, w, h, fill: { color: C.white },
    line: { color: C.lightGray1, pt: 1 }, shadow: makeShadow() });
  s.addText("Rating Distribution", {
    x: x + 0.12, y: y + 0.1, w: w - 0.2, h: 0.24,
    fontFace: FONT_HEAD, fontSize: 10, bold: true, color: C.nearBlack, margin: 0,
  });
  const stars  = [5, 4, 3, 2, 1];
  const colors = [C.brandGreen, "66CC99", C.midGray, C.accentAmber, C.accentCoral];
  const maxBW  = w - 1.6;
  stars.forEach((star, i) => {
    const cnt = dist[star] || 0;
    const p   = totalRatings > 0 ? Math.round((cnt / totalRatings) * 100) : 0;
    const ry  = y + 0.42 + i * 0.24;
    s.addText(`${star}★`, {
      x: x + 0.12, y: ry, w: 0.3, h: 0.2,
      fontFace: FONT_BODY, fontSize: 9, color: C.darkGray, margin: 0,
    });
    const bLen = maxBW * (p / 100);
    if (bLen > 0) {
      s.addShape("rect", { x: x + 0.48, y: ry + 0.03, w: bLen, h: 0.14,
        fill: { color: colors[i] }, line: { color: colors[i] } });
    }
    s.addText(`${cnt} (${p}%)`, {
      x: x + 0.52 + bLen, y: ry, w: 1.1, h: 0.2,
      fontFace: FONT_BODY, fontSize: 8.5, color: C.midGray, margin: 0,
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// BUILD DECK
// ═══════════════════════════════════════════════════════════════════════════
async function buildDeck() {
  const DIR = path.join(__dirname, "..", "AI Assistant Usage files");

  console.log("📂  Loading CSV files…");
  const screenUsage     = parseCSV(path.join(DIR, "Nextgen Q1-2026 _ AI Assistant usage - Usage in Screen.csv"));
  const interviewUsage  = parseCSV(path.join(DIR, "Nextgen Q1-2026 _ AI Assistant usage - Usage in Interviews.csv"));
  const screenFb        = parseCSV(path.join(DIR, "Nextgen Q1-2026 _ AI Assistant usage - Feedback from screen with AI Assistant.csv"));
  const interviewFb     = parseCSV(path.join(DIR, "Nextgen Q1-2026 _ AI Assistant usage - Feedback from Interviews with AI Assistant.csv"));
  const screenAdpRaw    = parseCSV(path.join(DIR, "NextGen_Content_Q3'26_Overall_attempts_from_AI_Assistant_used_tests_2026_03_04 (1).csv"));
  const ivAdpRaw        = parseCSV(path.join(DIR, "NextGen_Content_Q3'26_Overall_Interviews_from_AI_Assistant_used_companies_2026_03_04 (1).csv"));

  console.log(`   Screen usage rows:       ${screenUsage.length}`);
  console.log(`   Interview usage rows:    ${interviewUsage.length}`);
  console.log(`   Screen adoption rows:    ${screenAdpRaw.length}`);
  console.log(`   Interview adoption rows: ${ivAdpRaw.length}`);

  console.log("⚙️   Computing statistics…");
  const sc      = computeScreen(screenUsage);
  const iv      = computeInterviews(interviewUsage);
  const sfb     = computeFeedback(screenFb, null);
  const ifb     = computeFeedback(interviewFb, "feedback_user_role");
  const persona      = computePersonaSplit(interviewFb);
  const ivMsgBuckets = computeMsgBuckets(interviewFb);
  const scMsgBuckets = computeMsgBuckets(screenFb);
  const scLowRatePct = Math.round(screenFb.filter(r => parseFloat(r.product_rating) <= 2 && parseFloat(r.product_rating) >= 1).length / screenFb.filter(r => parseFloat(r.product_rating) >= 1).length * 100);
  const ivLowRatePct = Math.round(interviewFb.filter(r => parseFloat(r.product_rating) <= 2 && parseFloat(r.product_rating) >= 1).length / interviewFb.filter(r => parseFloat(r.product_rating) >= 1).length * 100);

  const scAdp = buildScreenAdoption(screenAdpRaw);
  const ivAdp = buildInterviewAdoption(ivAdpRaw);

  // Overall adoption % from new files
  const scAdpTotals = Object.values(scAdp).reduce((acc, d) => {
    acc.aiUsed += d.aiUsed; acc.total += d.total; return acc;
  }, { aiUsed: 0, total: 0 });
  const ivAdpTotals = Object.values(ivAdp).reduce((acc, d) => {
    acc.aiUsed += d.aiUsed; acc.total += d.total; return acc;
  }, { aiUsed: 0, total: 0 });

  const scAdpPct = scAdpTotals.total > 0 ? pct(scAdpTotals.aiUsed, scAdpTotals.total) : null;
  const ivAdpPct = ivAdpTotals.total > 0 ? pct(ivAdpTotals.aiUsed, ivAdpTotals.total) : null;

  console.log(`   Screen attempts (AI-used):   ${fmt(sc.attempts)}`);
  console.log(`   Screen total attempts:        ${fmt(scAdpTotals.total)}`);
  console.log(`   Screen adoption %:            ${scAdpPct}%`);
  console.log(`   Interview IDs (AI-used):      ${fmt(iv.interviews)}`);
  console.log(`   Interview total:              ${fmt(ivAdpTotals.total)}`);
  console.log(`   Interview adoption %:         ${ivAdpPct}%`);

  // ── Sandbox / testing breakdown ─────────────────────────────────────────
  const companiesCSV  = parseCSV(path.join(__dirname, "AI_Assistant_Companies.csv"));
  const sandboxCids   = new Set(companiesCSV.filter(r => r.is_sandbox           === "Y").map(r => r.company_id));
  const testingScCids = new Set(companiesCSV.filter(r => r.is_testing_screen    === "Y").map(r => r.company_id));
  const testingIvCids = new Set(companiesCSV.filter(r => r.is_testing_interview === "Y").map(r => r.company_id));

  // Screen: unique attempt → company_id
  const scAttemptCo = {};
  screenUsage.forEach(r => { if (!scAttemptCo[r.attempt_id]) scAttemptCo[r.attempt_id] = r.company_id; });
  let scSbAttempts = 0, scTsAttempts = 0;
  const scSbCos = new Set(), scTsCos = new Set();
  Object.values(scAttemptCo).forEach(cid => {
    if (sandboxCids.has(cid))        { scSbAttempts++; scSbCos.add(cid); }
    else if (testingScCids.has(cid)) { scTsAttempts++; scTsCos.add(cid); }
  });

  // Interviews: unique interview → company_id
  const ivIvCo = {};
  interviewUsage.forEach(r => { if (!ivIvCo[r.interview_id]) ivIvCo[r.interview_id] = r.company_id; });
  let ivSbIvs = 0, ivTsIvs = 0;
  const ivSbCos = new Set(), ivTsCos = new Set();
  Object.values(ivIvCo).forEach(cid => {
    if (sandboxCids.has(cid))        { ivSbIvs++; ivSbCos.add(cid); }
    else if (testingIvCids.has(cid)) { ivTsIvs++; ivTsCos.add(cid); }
  });

  console.log(`   Screen  — sandbox: ${scSbAttempts} attempts (${pctFmt(scSbAttempts, sc.attempts)}) from ${scSbCos.size} accts`);
  console.log(`   Screen  — testing: ${scTsAttempts} attempts (${pctFmt(scTsAttempts, sc.attempts)}) from ${scTsCos.size} accts`);
  console.log(`   IV      — sandbox: ${ivSbIvs} ivs (${pctFmt(ivSbIvs, iv.interviews)}) from ${ivSbCos.size} accts`);
  console.log(`   IV      — testing: ${ivTsIvs} ivs (${pctFmt(ivTsIvs, iv.interviews)}) from ${ivTsCos.size} accts`);

  // ── PPTX setup ─────────────────────────────────────────────────────────
  const pres = new PptxGenJS();
  pres.layout  = "LAYOUT_16x9";
  pres.author  = "HackerRank NextGen";
  pres.title   = "AI Assistant Usage — NextGen Q2 2026 Planning";
  pres.subject = "Sep'25–Feb'26 | Screen & Interviews";

  // ── SLIDE 1: Title ──────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.deepNavy };
    s.addShape("rect", { x: 0, y: 0, w: 0.18, h: H, fill: { color: C.brandGreen }, line: { color: C.brandGreen } });
    s.addText("HACKERRANK · NEXTGEN", {
      x: 0.38, y: 1.15, w: 8, h: 0.32,
      fontFace: FONT_HEAD, fontSize: 10, bold: true, charSpacing: 5, color: C.brandGreen, margin: 0,
    });
    s.addText("AI Assistant Usage\nQ2 2026 Planning", {
      x: 0.38, y: 1.55, w: 8.5, h: 2.0,
      fontFace: FONT_HEAD, fontSize: 42, bold: true, color: C.white, margin: 0,
    });
    s.addText("Screen & Interviews  |  Sep 2025 – Feb 2026", {
      x: 0.38, y: 3.65, w: 8, h: 0.4,
      fontFace: FONT_BODY, fontSize: 14, color: C.lightGray1, margin: 0,
    });
    s.addText("NextGen Q1 2026  ·  March 2026", {
      x: 0.38, y: 4.15, w: 4, h: 0.32,
      fontFace: FONT_BODY, fontSize: 11, color: C.midGray, margin: 0,
    });
    s.addShape("rect", { x: 0.38, y: 5.22, w: 9.44, h: 0.04,
      fill: { color: C.brandGreen }, line: { color: C.brandGreen } });
  }

  // ── SLIDE 2: Agenda ─────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "Agenda");
    const items = [
      ["01", "Usage Overview",              "Screen vs. Interviews — adoption, volume, messages"],
      ["02", "Question Type: Screen",       "Code, Database, Fullstack, CodeRepo Task breakdown"],
      ["03", "Question Type: Interviews",   "Fullstack, CodeRepo, Untagged breakdown"],
      ["04", "Top Customers — Screen",      "Top 15 companies by AI-used attempts + adoption %"],
      ["05", "Top Customers — Interviews",  "Top 15 companies by AI-used interviews + adoption %"],
      ["06", "Ratings & Feedback",          "Screen vs Interviews — AI-focused themes side by side"],
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
        { text: desc, options: { color: C.darkGray,   fontSize: 11, fontFace: FONT_BODY,  fill: { color: C.white } } },
      ]),
    ];
    s.addTable(rows, {
      x: 0.28, y: 1.0, w: 9.44, h: 4.3,
      border: { pt: 1, color: C.lightGray1 },
      colW: [0.55, 3.0, 5.89], rowH: 0.62,
    });
  }

  // ── SLIDE 3: Executive Summary (Screen LEFT | Interviews RIGHT) ─────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "Executive Summary  ·  AI Assistant  ·  Sep 2025 – Feb 2026");

    // Vertical divider
    s.addShape("rect", { x: 5.04, y: 1.0, w: 0.03, h: 4.4,
      fill: { color: C.lightGray1 }, line: { color: C.lightGray1 } });

    // ── LEFT: Screen ──
    s.addText("SCREEN", {
      x: 0.28, y: 1.0, w: 4.62, h: 0.3,
      fontFace: FONT_HEAD, fontSize: 13, bold: true, charSpacing: 3, color: C.brandGreen, margin: 0,
    });

    const scCards = [
      [fmt(sc.attempts),                    "Attempts with AI",                                                              C.brandGreen],
      [fmt(sc.companies),                   "Companies Using AI",                                                            C.darkTeal],
      [pctFmt(scSbAttempts, sc.attempts),   `${scSbAttempts} attempts  ·  ${scSbCos.size} sandbox accounts`,               C.accentAmber],
      [pctFmt(scTsAttempts, sc.attempts),   `${scTsAttempts} attempts  ·  ${scTsCos.size} testing accounts`,               C.accentBlue],
    ];
    scCards.forEach(([num, label, color], i) => {
      const col = i % 2, row = Math.floor(i / 2);
      statCard(s, num, label, 0.28 + col * 2.27, 1.35 + row * 1.32, 2.1, 1.18, color, 22);
    });

    // Screen dominant note
    s.addShape("rect", { x: 0.28, y: 4.04, w: 4.62, h: 0.72,
      fill: { color: C.white }, line: { color: C.brandGreen, pt: 1 }, shadow: makeShadow() });
    s.addText(
      `Top question type: ${sc.qtList[0]?.qt || "—"}  ·  ${fmt(sc.tests)} tests enabled  ·  ` +
      `Real active accounts: ${sc.companies - scSbCos.size - scTsCos.size}`,
      {
        x: 0.38, y: 4.08, w: 4.42, h: 0.6,
        fontFace: FONT_BODY, fontSize: 9.5, color: C.darkGray, margin: 0,
      });

    // ── RIGHT: Interviews ──
    s.addText("INTERVIEWS", {
      x: 5.2, y: 1.0, w: 4.52, h: 0.3,
      fontFace: FONT_HEAD, fontSize: 13, bold: true, charSpacing: 3, color: C.accentBlue, margin: 0,
    });

    const ivCards = [
      [fmt(iv.interviews),                  "Interviews with AI",                                                            C.brandGreen],
      [fmt(iv.companies),                   "Companies Using AI",                                                            C.darkTeal],
      [pctFmt(ivSbIvs, iv.interviews),      `${ivSbIvs} interviews  ·  ${ivSbCos.size} sandbox accounts`,                  C.accentAmber],
      [pctFmt(ivTsIvs, iv.interviews),      `${ivTsIvs} interviews  ·  ${ivTsCos.size} testing accounts`,                  C.accentBlue],
    ];
    ivCards.forEach(([num, label, color], i) => {
      const col = i % 2, row = Math.floor(i / 2);
      statCard(s, num, label, 5.2 + col * 2.27, 1.35 + row * 1.32, 2.1, 1.18, color, 22);
    });

    // Interview dominant note
    s.addShape("rect", { x: 5.2, y: 4.04, w: 4.52, h: 0.72,
      fill: { color: C.white }, line: { color: C.accentBlue, pt: 1 }, shadow: makeShadow() });
    s.addText(
      `Top question type: ${iv.qtList[0]?.qt || "—"}  ·  ` +
      `Candidate avg: ${persona.candidateAvg}/5  ·  Interviewer avg: ${persona.interviewerAvg}/5  ·  ` +
      `Real active accounts: ${iv.companies - ivSbCos.size - ivTsCos.size}`,
      {
        x: 5.3, y: 4.08, w: 4.32, h: 0.6,
        fontFace: FONT_BODY, fontSize: 9.5, color: C.darkGray, margin: 0,
      });
  }

  // ── SLIDE 4: Usage Overview ─────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "Usage Overview  ·  Screen vs. Interviews");

    s.addShape("rect", { x: 5.04, y: 1.0, w: 0.03, h: 4.4,
      fill: { color: C.lightGray1 }, line: { color: C.lightGray1 } });

    // LEFT: Screen
    s.addText("Screen", {
      x: 0.28, y: 1.0, w: 4.62, h: 0.3,
      fontFace: FONT_HEAD, fontSize: 14, bold: true, color: C.brandGreen, margin: 0,
    });
    const scItems = [
      ["Unique Attempts with AI",   fmt(sc.attempts)],
      ["Unique Companies",          fmt(sc.companies)],
      ["Unique Tests",              fmt(sc.tests)],
      ["Total AI Messages Sent",    fmt(sc.totalMsgs) + "*"],
    ];
    scItems.forEach(([label, val], i) => {
      const ry = 1.4 + i * 0.76;
      s.addShape("rect", { x: 0.28, y: ry, w: 4.62, h: 0.66,
        fill: { color: C.white }, line: { color: C.lightGray1, pt: 1 }, shadow: makeShadow() });
      s.addText(label, { x: 0.42, y: ry + 0.1, w: 2.6, h: 0.44,
        fontFace: FONT_BODY, fontSize: 10, color: C.darkGray, margin: 0 });
      s.addText(val, { x: 3.0, y: ry + 0.06, w: 1.7, h: 0.52,
        fontFace: FONT_HEAD, fontSize: 16, bold: true, color: C.brandGreen, align: "right", margin: 0 });
    });

    // RIGHT: Interviews
    s.addText("Interviews", {
      x: 5.2, y: 1.0, w: 4.52, h: 0.3,
      fontFace: FONT_HEAD, fontSize: 14, bold: true, color: C.accentBlue, margin: 0,
    });
    const ivItems = [
      ["Unique Interviews with AI", fmt(iv.interviews)],
      ["Unique Companies",          fmt(iv.companies)],
      ["Total AI Messages Sent",    fmt(iv.totalMsgs) + "*"],
    ];
    ivItems.forEach(([label, val], i) => {
      const ry = 1.4 + i * 0.76;
      s.addShape("rect", { x: 5.2, y: ry, w: 4.52, h: 0.66,
        fill: { color: C.white }, line: { color: C.lightGray1, pt: 1 }, shadow: makeShadow() });
      s.addText(label, { x: 5.34, y: ry + 0.1, w: 2.5, h: 0.44,
        fontFace: FONT_BODY, fontSize: 10, color: C.darkGray, margin: 0 });
      s.addText(val, { x: 6.8, y: ry + 0.06, w: 1.8, h: 0.52,
        fontFace: FONT_HEAD, fontSize: 16, bold: true, color: C.accentBlue, align: "right", margin: 0 });
    });

    // Key insight callout
    const ratio = (sc.attempts / Math.max(iv.interviews, 1)).toFixed(1);
    s.addShape("rect", { x: 5.2, y: 3.72, w: 4.52, h: 1.52,
      fill: { color: "E8F8FF" }, line: { color: C.accentBlue, pt: 1 }, shadow: makeShadow() });
    s.addShape("rect", { x: 5.2, y: 3.72, w: 0.06, h: 1.52,
      fill: { color: C.accentBlue }, line: { color: C.accentBlue } });
    s.addText("KEY INSIGHT", {
      x: 5.34, y: 3.77, w: 4.3, h: 0.2,
      fontFace: FONT_HEAD, fontSize: 8, bold: true, charSpacing: 2, color: C.accentBlue, margin: 0,
    });
    s.addText(
      `Screen leads AI adoption by ${ratio}×. Screen: ${fmt(sc.attempts)} attempts ` +
      `across ${fmt(sc.companies)} companies. Interviews: ${fmt(iv.interviews)} sessions ` +
      `across ${fmt(iv.companies)} companies.`,
      { x: 5.34, y: 4.0, w: 4.3, h: 1.16, fontFace: FONT_BODY, fontSize: 10, color: C.darkGray, margin: 0 });

    s.addText("* Total messages capped at 5,000 per row to exclude known data outliers.", {
      x: 0.28, y: 5.32, w: 9.44, h: 0.18,
      fontFace: FONT_BODY, fontSize: 8, italic: true, color: C.midGray, margin: 0,
    });
  }

  // ── SLIDE 5: Question Type Breakdown — Screen ───────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "Question Type Breakdown  ·  Screen");

    const qtData = sc.qtList;
    // CHANGE: show "N (XX%)" in the Unique Attempts column
    const hRow = ["Question Type", "Unique Attempts (%)", "Total AI Msgs", "Avg Msgs / Attempt"].map(h => ({
      text: h,
      options: { bold: true, color: C.white, fill: { color: C.darkTeal }, fontSize: 10, fontFace: FONT_HEAD },
    }));
    const dataRows = qtData.map((d, i) => [
      {
        text: d.qt,
        options: {
          bold: i === 0, color: i === 0 ? C.brandGreen : C.nearBlack,
          fill: { color: i % 2 === 0 ? C.white : C.lightGray3 }, fontSize: 11, fontFace: FONT_BODY,
        },
      },
      {
        text: `${fmt(d.attempts)}  (${d.pct}%)`,
        options: {
          bold: i === 0, color: i === 0 ? C.brandGreen : C.nearBlack,
          fill: { color: i % 2 === 0 ? C.white : C.lightGray3 }, fontSize: 11, fontFace: FONT_HEAD,
        },
      },
      {
        text: fmt(d.msgs),
        options: { color: C.nearBlack, fill: { color: i % 2 === 0 ? C.white : C.lightGray3 }, fontSize: 11, fontFace: FONT_BODY },
      },
      {
        text: String(d.avg),
        options: { color: C.nearBlack, fill: { color: i % 2 === 0 ? C.white : C.lightGray3 }, fontSize: 11, fontFace: FONT_BODY },
      },
    ]);

    s.addTable([hRow, ...dataRows], {
      x: 0.28, y: 1.0, w: 9.44,
      border: { pt: 1, color: C.lightGray1 },
      colW: [2.4, 2.6, 2.2, 2.24], rowH: 0.5,
    });

    // Horizontal bar chart — unique attempts
    const chartY   = 1.0 + (qtData.length + 1) * 0.5 + 0.25;
    const barMaxW  = 5.5;
    const maxAtt   = Math.max(...qtData.map(d => d.attempts), 1);
    const barColors = [C.brandGreen, C.accentBlue, "66CC99", C.accentAmber];

    s.addText("Attempts Share by Question Type", {
      x: 0.28, y: chartY, w: 9.44, h: 0.26,
      fontFace: FONT_HEAD, fontSize: 11, bold: true, color: C.nearBlack, margin: 0,
    });
    qtData.forEach((d, i) => {
      const ry = chartY + 0.3 + i * 0.38;
      const bW = barMaxW * (d.attempts / maxAtt);
      s.addText(`${d.qt} (${d.pct}%)`, {
        x: 0.28, y: ry + 0.04, w: 2.0, h: 0.28,
        fontFace: FONT_BODY, fontSize: 9, color: C.darkGray, align: "right", margin: 0,
      });
      if (bW > 0) {
        s.addShape("rect", { x: 2.35, y: ry + 0.06, w: bW, h: 0.22,
          fill: { color: barColors[i % barColors.length] }, line: { color: barColors[i % barColors.length] } });
      }
      s.addText(fmt(d.attempts), {
        x: 2.4 + bW, y: ry + 0.04, w: 1.0, h: 0.28,
        fontFace: FONT_HEAD, fontSize: 9, bold: true, color: C.nearBlack, margin: 0,
      });
    });

    // Callout for dominant type
    const dom = qtData[0];
    if (dom && chartY + 0.3 < 5.0) {
      calloutBox(
        s, `DOMINANT: ${dom.qt.toUpperCase()}`,
        `${fmt(dom.attempts)} attempts · ${dom.pct}% of all AI-used screen attempts · avg ${dom.avg} msgs/attempt`,
        6.8, chartY + 0.26, 2.92, 0.9, C.brandGreen
      );
    }
  }

  // ── SLIDE 6: Question Type Breakdown — Interviews ───────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "Question Type Breakdown  ·  Interviews");

    const qtData = iv.qtList;
    const hRow = ["Question Type", "Unique Interviews (%)", "Total AI Msgs", "Avg Msgs / Interview"].map(h => ({
      text: h,
      options: { bold: true, color: C.white, fill: { color: C.darkTeal }, fontSize: 10, fontFace: FONT_HEAD },
    }));
    const dataRows = qtData.map((d, i) => [
      {
        text: d.qt,
        options: {
          bold: i === 0, color: i === 0 ? C.brandGreen : C.nearBlack,
          fill: { color: i % 2 === 0 ? C.white : C.lightGray3 }, fontSize: 11, fontFace: FONT_BODY,
        },
      },
      {
        text: `${fmt(d.interviews)}  (${d.pct}%)`,
        options: {
          bold: i === 0, color: i === 0 ? C.brandGreen : C.nearBlack,
          fill: { color: i % 2 === 0 ? C.white : C.lightGray3 }, fontSize: 11, fontFace: FONT_HEAD,
        },
      },
      {
        text: fmt(d.msgs),
        options: { color: C.nearBlack, fill: { color: i % 2 === 0 ? C.white : C.lightGray3 }, fontSize: 11, fontFace: FONT_BODY },
      },
      {
        text: String(d.avg),
        options: { color: C.nearBlack, fill: { color: i % 2 === 0 ? C.white : C.lightGray3 }, fontSize: 11, fontFace: FONT_BODY },
      },
    ]);

    s.addTable([hRow, ...dataRows], {
      x: 0.28, y: 1.0, w: 9.44,
      border: { pt: 1, color: C.lightGray1 },
      colW: [2.4, 2.6, 2.2, 2.24], rowH: 0.5,
    });

    const chartY   = 1.0 + (qtData.length + 1) * 0.5 + 0.25;
    const barMaxW  = 5.5;
    const maxIv    = Math.max(...qtData.map(d => d.interviews), 1);
    const barColors = [C.accentBlue, C.brandGreen, "66CC99", C.accentAmber];

    s.addText("Interviews Share by Question Type", {
      x: 0.28, y: chartY, w: 9.44, h: 0.26,
      fontFace: FONT_HEAD, fontSize: 11, bold: true, color: C.nearBlack, margin: 0,
    });
    qtData.forEach((d, i) => {
      const ry = chartY + 0.3 + i * 0.38;
      const bW = barMaxW * (d.interviews / maxIv);
      s.addText(`${d.qt} (${d.pct}%)`, {
        x: 0.28, y: ry + 0.04, w: 2.0, h: 0.28,
        fontFace: FONT_BODY, fontSize: 9, color: C.darkGray, align: "right", margin: 0,
      });
      if (bW > 0) {
        s.addShape("rect", { x: 2.35, y: ry + 0.06, w: bW, h: 0.22,
          fill: { color: barColors[i % barColors.length] }, line: { color: barColors[i % barColors.length] } });
      }
      s.addText(fmt(d.interviews), {
        x: 2.4 + bW, y: ry + 0.04, w: 1.0, h: 0.28,
        fontFace: FONT_HEAD, fontSize: 9, bold: true, color: C.nearBlack, margin: 0,
      });
    });

    const domIv = qtData[0];
    if (domIv && chartY + 0.3 < 5.0) {
      calloutBox(
        s, `DOMINANT: ${domIv.qt.toUpperCase()}`,
        `${fmt(domIv.interviews)} interviews · ${domIv.pct}% of all AI-used interviews · avg ${domIv.avg} msgs/interview`,
        6.8, chartY + 0.26, 2.92, 0.9, C.accentBlue
      );
    }

    s.addText("\"Untagged\" = interviews where question_type field is blank in source data.", {
      x: 0.28, y: 5.32, w: 9.44, h: 0.18,
      fontFace: FONT_BODY, fontSize: 8, italic: true, color: C.midGray, margin: 0,
    });
  }

  // ── SLIDE 7: Top Customers — Screen ─────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "Top Customers  ·  Screen AI Usage  (Top 15 by AI-Used Attempts)");

    const hRow = ["Rank", "Company", "Attempts with AI", "Total Attempts*", "Adoption %"].map(h => ({
      text: h,
      options: { bold: true, color: C.white, fill: { color: C.darkTeal }, fontSize: 10, fontFace: FONT_HEAD },
    }));
    const topRowFills = ["E6F9F1", "EEF9F5", C.white];
    const dataRows = sc.topCos.map((co, i) => {
      const fill  = i < 3 ? { color: topRowFills[i] } : { color: i % 2 === 0 ? C.white : C.lightGray3 };
      const adp   = scAdp[co.cid];
      const valid = adp && adp.total > 0 && adp.aiUsed <= adp.total;  // exclude anomalies
      const total = adp ? fmt(adp.total) : "—";
      const adpP  = valid ? `${pct(adp.aiUsed, adp.total)}%` : adp ? "— (anomaly)" : "—";
      return [
        { text: String(i + 1), options: { bold: i < 3, color: i < 3 ? C.brandGreen : C.nearBlack, fill, fontSize: 10, fontFace: FONT_HEAD } },
        { text: co.name,        options: { bold: i < 3, color: C.nearBlack, fill, fontSize: 10, fontFace: FONT_BODY } },
        { text: fmt(co.attempts), options: { bold: i < 3, color: i < 3 ? C.brandGreen : C.nearBlack, fill, fontSize: 10, fontFace: FONT_HEAD } },
        { text: total,          options: { color: C.darkGray, fill, fontSize: 10, fontFace: FONT_BODY } },
        { text: adpP,           options: { bold: adp != null, color: adp ? C.brandGreen : C.midGray, fill, fontSize: 10, fontFace: FONT_HEAD } },
      ];
    });

    s.addTable([hRow, ...dataRows], {
      x: 0.28, y: 1.0, w: 9.44,
      border: { pt: 1, color: C.lightGray1 },
      colW: [0.5, 3.7, 1.7, 1.7, 1.84], rowH: 0.275,
    });

    s.addText(
      "* Total attempts = all attempts on the same tests after the date AI assistant was first used on that test. " +
      "Top 3 rows highlighted in green. \"—\" = company not in adoption file.",
      {
        x: 0.28, y: 5.3, w: 9.44, h: 0.2,
        fontFace: FONT_BODY, fontSize: 8, italic: true, color: C.midGray, margin: 0,
      });
  }

  // ── SLIDE 8: Top Customers — Interviews ─────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "Top Customers  ·  Interview AI Usage  (Top 15 by AI-Used Interviews)");

    const hRow = ["Rank", "Company", "Interviews with AI", "Total Interviews*", "Adoption %"].map(h => ({
      text: h,
      options: { bold: true, color: C.white, fill: { color: C.darkTeal }, fontSize: 10, fontFace: FONT_HEAD },
    }));
    const topRowFills = ["E6F0FF", "EDF4FF", C.white];
    const dataRows = iv.topCos.map((co, i) => {
      const fill  = i < 3 ? { color: topRowFills[i] } : { color: i % 2 === 0 ? C.white : C.lightGray3 };
      const adp   = ivAdp[co.cid];
      const valid = adp && adp.total > 0 && adp.aiUsed <= adp.total;  // exclude anomalies
      const total = adp ? fmt(adp.total) : "—";
      const adpP  = valid ? `${pct(adp.aiUsed, adp.total)}%` : adp ? "— (anomaly)" : "—";
      return [
        { text: String(i + 1), options: { bold: i < 3, color: i < 3 ? C.accentBlue : C.nearBlack, fill, fontSize: 10, fontFace: FONT_HEAD } },
        { text: co.name,        options: { bold: i < 3, color: C.nearBlack, fill, fontSize: 10, fontFace: FONT_BODY } },
        { text: fmt(co.interviews), options: { bold: i < 3, color: i < 3 ? C.accentBlue : C.nearBlack, fill, fontSize: 10, fontFace: FONT_HEAD } },
        { text: total,          options: { color: C.darkGray, fill, fontSize: 10, fontFace: FONT_BODY } },
        { text: adpP,           options: { bold: adp != null, color: adp ? C.accentBlue : C.midGray, fill, fontSize: 10, fontFace: FONT_HEAD } },
      ];
    });

    s.addTable([hRow, ...dataRows], {
      x: 0.28, y: 1.0, w: 9.44,
      border: { pt: 1, color: C.lightGray1 },
      colW: [0.5, 3.7, 1.7, 1.7, 1.84], rowH: 0.275,
    });

    s.addText(
      "* Total interviews = all interviews from the same company after the date AI assistant was first used by that company. " +
      "Top 3 rows highlighted in blue.",
      {
        x: 0.28, y: 5.3, w: 9.44, h: 0.2,
        fontFace: FONT_BODY, fontSize: 8, italic: true, color: C.midGray, margin: 0,
      });
  }

  // ── SLIDE 9 (combined): Ratings & Feedback — Screen vs Interviews ────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "Ratings & Feedback  ·  AI Assistant  (Screen vs Interviews)");

    // Vertical divider
    s.addShape("rect", { x: 5.04, y: 1.0, w: 0.03, h: 4.42,
      fill: { color: C.lightGray1 }, line: { color: C.lightGray1 } });

    const divergence  = Math.abs(parseFloat(persona.candidateAvg) - parseFloat(persona.interviewerAvg));
    const personaNote = divergence >= 0.5
      ? `  \u00B7  Cand. ${persona.candidateAvg}/5 vs Intvwr. ${persona.interviewerAvg}/5 (\u26A0 ${divergence.toFixed(1)}-pt gap)`
      : `  \u00B7  Cand. ${persona.candidateAvg}/5 vs Intvwr. ${persona.interviewerAvg}/5`;

    // ── Headers + stat bars ──────────────────────────────────────────────
    [
      { label: "SCREEN",     accent: C.brandGreen, stat: `Avg ${sfb.avg.toFixed(2)}/5  \u00B7  ${sfb.totalRatings} responses  \u00B7  ${sfb.aiFbCount} mention AI keywords`, sx: 0.28, sw: 4.62 },
      { label: "INTERVIEWS", accent: C.accentBlue,  stat: `Avg ${ifb.avg.toFixed(2)}/5  \u00B7  ${ifb.totalRatings} responses${personaNote}`,                                 sx: 5.2,  sw: 4.52 },
    ].forEach(({ label, accent, stat, sx, sw }) => {
      s.addText(label, { x: sx, y: 1.0, w: sw, h: 0.24,
        fontFace: FONT_HEAD, fontSize: 12, bold: true, charSpacing: 2.5, color: accent, margin: 0 });
      s.addShape("rect", { x: sx, y: 1.28, w: sw, h: 0.22,
        fill: { color: C.white }, line: { color: C.lightGray1, pt: 1 } });
      s.addText(stat, { x: sx + 0.1, y: 1.30, w: sw - 0.14, h: 0.18,
        fontFace: FONT_BODY, fontSize: 7.5, color: C.darkGray, margin: 0 });
    });

    // ── Canonical theme order — same sequence on both sides ──────────────
    const THEME_CANON = [
      "Helpfulness & Suggestions",
      "Poor Quality / Inaccurate",
      "Fairness / Cheating Concern",
      "UX / Interface Issues",
      "Performance / Reliability",
      "Missing / Limited Features",
    ];

    const scByName = Object.fromEntries(sfb.themes.map(t => [t.name, t]));
    const ivByName = Object.fromEntries(ifb.themes.map(t => [t.name, t]));

    // Keep only positions where at least one side has data
    const activePositions = THEME_CANON
      .map(name => ({ name, sc: scByName[name] || null, iv: ivByName[name] || null }))
      .filter(p => p.sc || p.iv);

    // Card geometry
    const colGap = 0.08, rowGap = 0.08, cardH = 1.22, gridTop = 1.56;
    const scCardW = (4.62 - colGap) / 2;   // left side
    const ivCardW = (4.52 - colGap) / 2;   // right side

    const drawCard = (theme, cx, cy, cardW) => {
      if (!theme) {
        // Dim placeholder — keeps row locked
        s.addShape("rect", { x: cx, y: cy, w: cardW, h: cardH,
          fill: { color: C.lightGray2 }, line: { color: C.lightGray1, pt: 1 } });
        s.addText("—", { x: cx + 0.1, y: cy + 0.48, w: cardW - 0.16, h: 0.22,
          fontFace: FONT_BODY, fontSize: 11, color: C.lightGray1, align: "center", margin: 0 });
        return;
      }
      s.addShape("rect", { x: cx, y: cy, w: cardW, h: cardH,
        fill: { color: C.white }, line: { color: C.lightGray1, pt: 1 }, shadow: makeShadow() });
      s.addShape("rect", { x: cx, y: cy, w: 0.06, h: cardH,
        fill: { color: theme.color }, line: { color: theme.color } });
      s.addText(theme.name, { x: cx + 0.1, y: cy + 0.06, w: cardW - 0.16, h: 0.22,
        fontFace: FONT_HEAD, fontSize: 9.5, bold: true, color: C.nearBlack, margin: 0 });
      s.addText(`${theme.count} responses \u00B7 avg ${theme.avgRating}\u2605`, {
        x: cx + 0.1, y: cy + 0.30, w: cardW - 0.16, h: 0.16,
        fontFace: FONT_BODY, fontSize: 8, color: C.accentCoral, margin: 0 });
      s.addText(theme.desc, { x: cx + 0.1, y: cy + 0.48, w: cardW - 0.16, h: 0.66,
        fontFace: FONT_BODY, fontSize: 8.5, color: C.darkGray, margin: 0 });
    };

    activePositions.forEach(({ sc, iv }, posIdx) => {
      const col = posIdx % 2;
      const row = Math.floor(posIdx / 2);
      const cy  = gridTop + row * (cardH + rowGap);
      drawCard(sc, 0.28 + col * (scCardW + colGap), cy, scCardW);
      drawCard(iv, 5.2  + col * (ivCardW + colGap), cy, ivCardW);
    });
  }

  // ── SLIDE 11: Why Are Interview Ratings Lower? — The Gap + 3 Questions ───
  {
    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "Why Are Interview Ratings Lower When AI Is Used?");

    // Compact stat cards (smaller to leave room for question cards below)
    const gap11 = sfb.avg - ifb.avg;
    const sc11 = [
      { num: `${sfb.avg.toFixed(2)} / 5`, label: "Avg rating — Screens",         col: C.brandGreen  },
      { num: `${ifb.avg.toFixed(2)} / 5`, label: "Avg rating — Interviews",      col: C.accentCoral },
      { num: `\u2212${gap11.toFixed(2)} pts`,    label: "Gap (interviews rated lower)", col: C.accentAmber },
      { num: `${ivLowRatePct}% vs ${scLowRatePct}%`, label: "Severe ratings (\u2264 2\u2605)  Interviews vs Screen", col: C.accentCoral },
    ];
    const cW = 2.1, cH = 0.72, cGap = 0.14, cTop = 0.95;
    const cStart = (10 - (sc11.length * cW + (sc11.length - 1) * cGap)) / 2;
    sc11.forEach((c, i) => {
      const cx = cStart + i * (cW + cGap);
      s.addShape("rect", { x: cx, y: cTop, w: cW, h: cH,
        fill: { color: C.white }, line: { color: C.lightGray1, pt: 1 }, shadow: makeShadow() });
      s.addText(c.num, {
        x: cx + 0.1, y: cTop + 0.05, w: cW - 0.2, h: 0.36,
        fontFace: FONT_HEAD, fontSize: 18, bold: true, color: c.col,
        align: "center", margin: 0,
      });
      s.addText(c.label, {
        x: cx + 0.1, y: cTop + 0.44, w: cW - 0.2, h: 0.22,
        fontFace: FONT_BODY, fontSize: 8.5, color: C.midGray,
        align: "center", margin: 0,
      });
    });

    // "To understand why, we asked three questions:" label
    s.addText("To understand why, we asked three questions:", {
      x: 0.28, y: 1.78, w: 9.44, h: 0.24,
      fontFace: FONT_BODY, fontSize: 10, color: C.darkGray, margin: 0,
    });

    // 3 question cards (compact — question only, no answers)
    const q11 = [
      { num: "Q1", q: "Are interviewers less satisfied than candidates?",    col: C.accentCoral },
      { num: "Q2", q: "Do users who rely heavily on AI rate it worse?",      col: C.accentAmber },
      { num: "Q3", q: "What are interviewers actually frustrated about?",    col: C.brandGreen  },
    ];
    const qW = 2.94, qH = 3.26, qGap = 0.18, qTop = 2.1;
    q11.forEach((c, i) => {
      const cx = 0.28 + i * (qW + qGap);
      s.addShape("rect", { x: cx, y: qTop, w: qW, h: qH,
        fill: { color: C.white }, line: { color: C.lightGray1, pt: 1 }, shadow: makeShadow() });
      // Coloured top bar
      s.addShape("rect", { x: cx, y: qTop, w: qW, h: 0.32,
        fill: { color: c.col }, line: { color: c.col } });
      s.addText(c.num, {
        x: cx + 0.12, y: qTop + 0.05, w: qW - 0.24, h: 0.22,
        fontFace: FONT_HEAD, fontSize: 9, bold: true, color: C.white, margin: 0,
      });
      // Question text (large, prominent)
      s.addText(c.q, {
        x: cx + 0.16, y: qTop + 0.48, w: qW - 0.32, h: 0.88,
        fontFace: FONT_HEAD, fontSize: 13, bold: true, color: C.nearBlack, margin: 0,
      });
      // "Answered on next slide" subtle hint
      s.addText("Answered on the next slide \u2192", {
        x: cx + 0.16, y: qTop + qH - 0.32, w: qW - 0.32, h: 0.24,
        fontFace: FONT_BODY, fontSize: 8.5, italic: true, color: C.midGray, margin: 0,
      });
    });

    s.addText("Based on 98 interview feedback responses (79 candidates, 19 interviewers). Screen: 2,404 responses.", {
      x: 0.28, y: 5.37, w: 9.44, h: 0.18,
      fontFace: FONT_BODY, fontSize: 8, italic: true, color: C.midGray, margin: 0,
    });
  }

  // ── SLIDE 12: The Answers — Finding + Verbatims + 3 Verdicts ─────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "What the Data Shows  ·  Three Answers");

    // ── Top section: Key finding (left) + What interviewers said (right) ──
    const topY = 0.95, topH = 1.88;

    // Left: Finding card
    const fX = 0.28, fW = 5.0;
    s.addShape("rect", { x: fX, y: topY, w: fW, h: topH,
      fill: { color: C.white }, line: { color: C.lightGray1, pt: 1 }, shadow: makeShadow() });
    s.addShape("rect", { x: fX, y: topY, w: 0.06, h: topH,
      fill: { color: C.accentCoral }, line: { color: C.accentCoral } });
    s.addText("The answer", {
      x: fX + 0.18, y: topY + 0.12, w: fW - 0.3, h: 0.2,
      fontFace: FONT_HEAD, fontSize: 8.5, bold: true, charSpacing: 2,
      color: C.accentCoral, margin: 0,
    });
    s.addText("Interviewers are rating the experience\nlower than candidates are.", {
      x: fX + 0.18, y: topY + 0.35, w: fW - 0.3, h: 0.6,
      fontFace: FONT_HEAD, fontSize: 14, bold: true, color: C.nearBlack, margin: 0,
    });
    // Compact persona bars
    const compRows = [
      { label: "Candidates",   avg: parseFloat(persona.candidateAvg),   n: persona.candidateN,   col: C.brandGreen  },
      { label: "Interviewers", avg: parseFloat(persona.interviewerAvg), n: persona.interviewerN, col: C.accentCoral },
    ];
    const pbW = fW - 1.3;
    compRows.forEach((p, i) => {
      const py  = topY + 1.02 + i * 0.38;
      const pL  = !isNaN(p.avg) ? (p.avg / 5) * pbW : 0;
      s.addText(p.label, { x: fX + 0.18, y: py, w: 1.0, h: 0.18,
        fontFace: FONT_BODY, fontSize: 8.5, color: C.darkGray, margin: 0 });
      s.addShape("rect", { x: fX + 0.18, y: py + 0.2, w: pbW, h: 0.16,
        fill: { color: C.lightGray2 }, line: { color: C.lightGray2 } });
      if (pL > 0) s.addShape("rect", { x: fX + 0.18, y: py + 0.2, w: pL, h: 0.16,
        fill: { color: p.col }, line: { color: p.col } });
      const lbl = isNaN(p.avg) ? "\u2013" : p.avg.toFixed(2);
      s.addText(`${lbl} / 5  (n=${p.n})`, { x: fX + 0.18 + pL + 0.06, y: py + 0.2, w: 1.4, h: 0.16,
        fontFace: FONT_HEAD, fontSize: 8.5, bold: true, color: C.nearBlack, valign: "middle", margin: 0 });
    });

    // Right: Verbatims card
    const vX = fX + fW + 0.2, vW = 9.44 - fW - 0.2;
    s.addShape("rect", { x: vX, y: topY, w: vW, h: topH,
      fill: { color: C.white }, line: { color: C.lightGray1, pt: 1 }, shadow: makeShadow() });
    s.addShape("rect", { x: vX, y: topY, w: 0.06, h: topH,
      fill: { color: C.accentAmber }, line: { color: C.accentAmber } });
    s.addText("What interviewers said", {
      x: vX + 0.18, y: topY + 0.12, w: vW - 0.3, h: 0.2,
      fontFace: FONT_HEAD, fontSize: 8.5, bold: true, charSpacing: 2,
      color: C.accentAmber, margin: 0,
    });
    s.addText("All low-rating comments cite platform failures,\nnot AI quality.", {
      x: vX + 0.18, y: topY + 0.35, w: vW - 0.3, h: 0.42,
      fontFace: FONT_BODY, fontSize: 10, color: C.darkGray, margin: 0,
    });
    // Severity comparison strip
    const stripY = topY + 0.78, stripH = 0.26;
    const stripTotalW = vW - 0.36;
    // Coral band: interviews 21%
    s.addShape("rect", { x: vX + 0.18, y: stripY, w: stripTotalW * 0.5, h: stripH,
      fill: { color: C.accentCoral }, line: { color: C.accentCoral } });
    s.addText(`${ivLowRatePct}% interviews`, {
      x: vX + 0.2, y: stripY + 0.04, w: stripTotalW * 0.5 - 0.04, h: 0.18,
      fontFace: FONT_HEAD, fontSize: 8, bold: true, color: C.white, margin: 0,
    });
    // Green band: screen 13%
    s.addShape("rect", { x: vX + 0.18 + stripTotalW * 0.5, y: stripY, w: stripTotalW * 0.5, h: stripH,
      fill: { color: C.brandGreen }, line: { color: C.brandGreen } });
    s.addText(`${scLowRatePct}% screen`, {
      x: vX + 0.18 + stripTotalW * 0.5 + 0.06, y: stripY + 0.04, w: stripTotalW * 0.5 - 0.1, h: 0.18,
      fontFace: FONT_HEAD, fontSize: 8, bold: true, color: C.white, margin: 0,
    });
    s.addText("Severe (≤ 2★) — same bugs, higher stakes in live sessions.", {
      x: vX + 0.18, y: stripY + stripH + 0.02, w: vW - 0.36, h: 0.14,
      fontFace: FONT_BODY, fontSize: 7.5, italic: true, color: C.midGray, margin: 0,
    });
    const lowIvVb = interviewFb
      .filter(r => r.feedback_user_role === "interviewer" && parseFloat(r.product_rating) <= 2 && r.feedback && r.feedback.trim().length > 10)
      .slice(0, 2);
    lowIvVb.forEach((r, i) => {
      const vy = topY + 1.22 + i * 0.3;
      const snippet = r.feedback.trim().slice(0, 100) + (r.feedback.trim().length > 100 ? "\u2026" : "");
      s.addShape("rect", { x: vX + 0.18, y: vy, w: vW - 0.36, h: 0.28,
        fill: { color: C.lightGray3 }, line: { color: C.lightGray1, pt: 1 } });
      s.addShape("rect", { x: vX + 0.18, y: vy, w: 0.04, h: 0.28,
        fill: { color: C.accentCoral }, line: { color: C.accentCoral } });
      s.addText(`\u201C${snippet}\u201D  [${r.product_rating}\u2605]`, {
        x: vX + 0.3, y: vy + 0.04, w: vW - 0.52, h: 0.2,
        fontFace: FONT_BODY, fontSize: 8, italic: true, color: C.darkGray, margin: 0,
      });
    });

    // ── Bottom section: 3 compact verdict cards ────────────────────────────
    const btY = topY + topH + 0.18, btH = 2.34;
    const vcW = 2.94, vcGap = 0.18;

    function verdictBadge(sl, label, color, bx, by) {
      sl.addShape("rect", { x: bx, y: by, w: 1.6, h: 0.24,
        fill: { color }, line: { color } });
      sl.addText(label, { x: bx, y: by, w: 1.6, h: 0.24,
        fontFace: FONT_HEAD, fontSize: 8, bold: true, color: C.white,
        align: "center", valign: "middle", margin: 0 });
    }

    const qCards12 = [
      {
        q:       "Are interviewers less satisfied than candidates?",
        verdict: "CONFIRMED",
        vColor:  C.accentCoral,
        finding: "Yes — interviewers rate 0.49 pts lower than candidates.",
        detail:  `${parseFloat(persona.interviewerAvg).toFixed(2)} / 5 (interviewers) vs ${parseFloat(persona.candidateAvg).toFixed(2)} / 5 (candidates). Interviewers are ~20% of respondents but pull the overall interview average below Screen.`,
        note:    "Primary driver of the gap.",
        noteCol: C.accentCoral,
      },
      {
        q:       "Do users who rely heavily on AI rate it worse?",
        verdict: "INCONCLUSIVE",
        vColor:  C.accentAmber,
        finding: "Direction is right, but sample too small to confirm.",
        detail:  (() => {
          const hb = ivMsgBuckets.find(b => b.label.startsWith("Heavy"));
          const lb = ivMsgBuckets.find(b => b.label.startsWith("Low"));
          const scHb = scMsgBuckets.find(b => b.label.startsWith("Heavy"));
          const scLb = scMsgBuckets.find(b => b.label.startsWith("Low"));
          const ivPart = (hb && lb) ? `Interview: heavy users ${hb.avg} / 5 (n=${hb.n}) vs light ${lb.avg} / 5 — drops with usage.` : "";
          const scPart = (scHb && scLb) ? ` Screen: heavy users ${scHb.avg} / 5 vs light ${scLb.avg} / 5 — essentially flat. The pattern only appears in live sessions, pointing to live-context amplification.` : "";
          return ivPart + scPart || "Insufficient data to compare buckets.";
        })(),
        note:    "Needs more data before acting.",
        noteCol: C.accentAmber,
      },
      {
        q:       "What are interviewers actually frustrated about?",
        verdict: "SAME BUGS, HIGHER STAKES",
        vColor:  C.brandGreen,
        finding: `Both Screen and Interview users complain about identical bugs — but interviews have ${ivLowRatePct > 0 && scLowRatePct > 0 ? Math.round((ivLowRatePct - scLowRatePct) / scLowRatePct * 100) : 62}% more severe ratings.`,
        detail:  `Screen feedback mentions the same failures: freezing, lag, keyboard issues, crashes. Screen users recover privately and rate ${sfb.avg.toFixed(2)}/5. In interviews, the same bug happens in front of an evaluator — the candidate can't recover gracefully, time is lost, and the evaluator sees the disruption. The live context turns a tolerable bug into a high-stakes failure.`,
        note:    "Fix: reliability in live-session context is the priority — async Screen users self-recover.",
        noteCol: C.brandGreen,
      },
    ];

    qCards12.forEach((c, i) => {
      const cx = 0.28 + i * (vcW + vcGap);
      s.addShape("rect", { x: cx, y: btY, w: vcW, h: btH,
        fill: { color: C.white }, line: { color: C.lightGray1, pt: 1 }, shadow: makeShadow() });
      s.addShape("rect", { x: cx, y: btY, w: vcW, h: 0.26,
        fill: { color: C.darkTeal }, line: { color: C.darkTeal } });
      s.addText(`Question ${i + 1}`, {
        x: cx + 0.1, y: btY + 0.03, w: vcW - 0.2, h: 0.2,
        fontFace: FONT_HEAD, fontSize: 8.5, bold: true, color: C.white, margin: 0,
      });
      s.addText(c.q, {
        x: cx + 0.1, y: btY + 0.32, w: vcW - 0.2, h: 0.44,
        fontFace: FONT_HEAD, fontSize: 10, bold: true, color: C.nearBlack, margin: 0,
      });
      verdictBadge(s, c.verdict, c.vColor, cx + 0.1, btY + 0.82);
      s.addText(c.finding, {
        x: cx + 0.1, y: btY + 1.12, w: vcW - 0.2, h: 0.3,
        fontFace: FONT_HEAD, fontSize: 9.5, bold: true, color: C.nearBlack, margin: 0,
      });
      s.addText(c.detail, {
        x: cx + 0.1, y: btY + 1.46, w: vcW - 0.2, h: 0.56,
        fontFace: FONT_BODY, fontSize: 8.5, color: C.darkGray, margin: 0,
      });
      s.addShape("rect", { x: cx + 0.1, y: btY + btH - 0.38, w: vcW - 0.2, h: 0.3,
        fill: { color: C.lightGray3 }, line: { color: C.lightGray1, pt: 1 } });
      s.addText(c.note, {
        x: cx + 0.16, y: btY + btH - 0.36, w: vcW - 0.32, h: 0.26,
        fontFace: FONT_BODY, fontSize: 8.5, italic: true, color: c.noteCol, margin: 0,
      });
    });

    s.addText("Analysis based on 98 interview feedback responses (Q1 2026). Msg-count buckets: Low = 1–5 messages, Medium = 6–20, Heavy = 21+.", {
      x: 0.28, y: 5.37, w: 9.44, h: 0.18,
      fontFace: FONT_BODY, fontSize: 8, italic: true, color: C.midGray, margin: 0,
    });
  }

  // ── SLIDE 13: Placeholder — Test-Level AI Usage ─────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.lightGray3 };
    leftAccentBar(s);
    slideTitle(s, "Test-Level AI Usage  ·  Data Available");

    // We have the test-level data now — show top tests by adoption %
    const validTests = screenAdpRaw.filter(r => {
      const ai    = parseInt(r.attempts_used_ai_assistant) || 0;
      const total = parseInt(r.count_overal_attempts) || 0;
      return total > 0 && ai <= total;
    });
    const totalAiAcrossTests = validTests.reduce((sum, r) => sum + (parseInt(r.attempts_used_ai_assistant) || 0), 0);

    const testData = validTests
      .map(r => {
        const aiUsed    = parseInt(r.attempts_used_ai_assistant) || 0;
        const total     = parseInt(r.count_overal_attempts) || 0;
        const adoptPct  = pct(aiUsed, total);                           // adoption %: AI-used / total attempts on this test
        const sharePct  = pct(aiUsed, totalAiAcrossTests);              // share %: this test's AI-used / all AI-used
        return {
          testName: r.test_name || `Test ${r.test_id}`,
          company:  resolveCompanyName(r.company_name, r.company_owner_email),
          aiUsed, total, adoptPct, sharePct,
          combo: sharePct * adoptPct,                                   // sort key
        };
      })
      .sort((a, b) => b.combo - a.combo)
      .slice(0, 12);

    const hRow = ["Test Name", "Company", "AI-Used Attempts", "AI Share %", "Adoption %"].map(h => ({
      text: h,
      options: { bold: true, color: C.white, fill: { color: C.darkTeal }, fontSize: 10, fontFace: FONT_HEAD },
    }));
    const dataRows = testData.map((d, i) => {
      const fill = { color: i % 2 === 0 ? C.white : C.lightGray3 };
      return [
        { text: d.testName,        options: { color: C.nearBlack, fill, fontSize: 9,  fontFace: FONT_BODY } },
        { text: d.company,         options: { color: C.darkGray,  fill, fontSize: 9,  fontFace: FONT_BODY } },
        { text: fmt(d.aiUsed),     options: { color: C.nearBlack, fill, fontSize: 9,  fontFace: FONT_BODY } },
        { text: `${d.sharePct}%`,  options: { bold: true, color: d.sharePct >= 10 ? C.brandGreen : C.nearBlack, fill, fontSize: 9, fontFace: FONT_HEAD } },
        { text: `${d.adoptPct}%`,  options: { bold: true, color: d.adoptPct >= 50 ? C.brandGreen : C.nearBlack, fill, fontSize: 9, fontFace: FONT_HEAD } },
      ];
    });

    s.addTable([hRow, ...dataRows], {
      x: 0.28, y: 1.0, w: 9.44,
      border: { pt: 1, color: C.lightGray1 },
      colW: [3.3, 2.0, 1.5, 1.32, 1.32], rowH: 0.32,
    });

    s.addText(
      "Sorted by AI Share % × Adoption % (combo score). AI Share % = test's AI-used attempts ÷ all AI-used attempts across all tests. Adoption % = AI-used ÷ total attempts on that test (from first AI-use date).",
      {
        x: 0.28, y: 5.32, w: 9.44, h: 0.18,
        fontFace: FONT_BODY, fontSize: 8, italic: true, color: C.midGray, margin: 0,
      });
  }

  // ── SLIDE 14: Next Steps & Priorities ───────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: C.deepNavy };
    s.addShape("rect", { x: 0, y: 0, w: 0.18, h: H, fill: { color: C.brandGreen }, line: { color: C.brandGreen } });
    s.addText("NEXT STEPS & PRIORITIES", {
      x: 0.38, y: 0.42, w: 9, h: 0.32,
      fontFace: FONT_HEAD, fontSize: 10, bold: true, charSpacing: 4, color: C.brandGreen, margin: 0,
    });
    s.addText("Turning AI Assistant Data Into Action", {
      x: 0.38, y: 0.8, w: 8.5, h: 0.65,
      fontFace: FONT_HEAD, fontSize: 26, bold: true, color: C.white, margin: 0,
    });

    const scAdpStr = scAdpPct != null ? `${scAdpPct}%` : "—";
    const ivAdpStr = ivAdpPct != null ? `${ivAdpPct}%` : "—";

    const actions = [
      {
        num: "01", color: C.brandGreen,
        title: "Drive AI adoption depth — current rates leave room to grow",
        body:  `Screen adoption: ${scAdpStr} of eligible attempts. Interview adoption: ${ivAdpStr}. ` +
               `Focus on high-volume tests with low adoption — improve discoverability and in-product AI nudges.`,
      },
      {
        num: "02", color: C.accentCoral,
        title: "Address AI quality & reliability concerns",
        body:  `Top negative signals: AI freezing, unreliable responses, poor autocomplete UX. ` +
               `Screen avg: ${sfb.avg.toFixed(2)}/5 · Interviews avg: ${ifb.avg.toFixed(2)}/5. These directly suppress ratings.`,
      },
      {
        num: "03", color: C.accentAmber,
        title: "Expand AI coverage to underserved question types",
        body:  `Screen dominant: ${sc.qtList[0]?.qt || "code"} (${sc.qtList[0]?.pct || "—"}% of AI attempts). ` +
               `Interviews dominant: ${iv.qtList[0]?.qt || "fullstack"} (${iv.qtList[0]?.pct || "—"}%). ` +
               `Drive parity across all types.`,
      },
      {
        num: "04", color: C.accentBlue,
        title: "Investigate Uber interviews — low adoption despite high volume",
        body:  `Uber: ${ivAdp["397956"] ? fmt(ivAdp["397956"].total) : "22K+"} total interviews vs ` +
               `${ivAdp["397956"] ? fmt(ivAdp["397956"].aiUsed) : "93"} AI-used. ` +
               `Known issue being resolved — track as leading indicator for large-account AI adoption.`,
      },
    ];

    actions.forEach((a, i) => {
      const ry = 1.58 + i * 0.96;
      s.addShape("rect", { x: 0.38, y: ry, w: 9.44, h: 0.86,
        fill: { color: "FFFFFF", transparency: 90 }, line: { color: a.color, pt: 1 } });
      s.addShape("rect", { x: 0.38, y: ry, w: 0.44, h: 0.86,
        fill: { color: a.color }, line: { color: a.color } });
      s.addText(a.num, {
        x: 0.38, y: ry, w: 0.44, h: 0.86,
        fontFace: FONT_HEAD, fontSize: 18, bold: true,
        color: C.deepNavy, align: "center", valign: "middle", margin: 0,
      });
      s.addText(a.title, {
        x: 0.92, y: ry + 0.06, w: 8.8, h: 0.28,
        fontFace: FONT_HEAD, fontSize: 12, bold: true, color: C.white, margin: 0,
      });
      s.addText(a.body, {
        x: 0.92, y: ry + 0.36, w: 8.8, h: 0.44,
        fontFace: FONT_BODY, fontSize: 9.5, color: C.lightGray1, margin: 0,
      });
    });

    s.addText("Owner: [TBD]  ·  Q2 2026  ·  HackerRank NextGen", {
      x: 0.38, y: 5.35, w: 9.44, h: 0.2,
      fontFace: FONT_BODY, fontSize: 8, color: C.midGray, margin: 0,
    });
  }

  // ── Write file ──────────────────────────────────────────────────────────
  const outFile = path.join(__dirname, "AIAssistant-Q2-2026-Planning.pptx");
  await pres.writeFile({ fileName: outFile });
  console.log(`\n✅  Deck written: ${outFile}`);
  console.log(`    Slides: 14`);
}

buildDeck().catch(err => { console.error("❌ ", err); process.exit(1); });

"use strict";
const fs   = require("fs");
const path = require("path");

const ROOT   = path.join(__dirname, "..");
const AI_DIR = path.join(ROOT, "AI Assistant Usage files");

// ── CSV parser (handles quoted fields, blank/query first row) ──────────────
function splitCSVLine(line) {
  const out = []; let cur = "", inQ = false;
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

// ── CSV writer ─────────────────────────────────────────────────────────────
function csvField(val) {
  const s = val == null ? "" : String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}
function toCSVLine(cols, obj) {
  return cols.map(c => csvField(obj[c])).join(",");
}

// ── Load all 4 source files + metadata ─────────────────────────────────────
console.log("Loading source files…");
const screenUsage   = parseCSV(path.join(AI_DIR, "Nextgen Q1-2026 _ AI Assistant usage - Usage in Screen.csv"));
const ivUsage       = parseCSV(path.join(AI_DIR, "Nextgen Q1-2026 _ AI Assistant usage - Usage in Interviews.csv"));
const screenAdpRaw  = parseCSV(path.join(AI_DIR, "NextGen_Content_Q3'26_Overall_attempts_from_AI_Assistant_used_tests_2026_03_04 (1).csv"));
const ivAdpRaw      = parseCSV(path.join(AI_DIR, "NextGen_Content_Q3'26_Overall_Interviews_from_AI_Assistant_used_companies_2026_03_04 (1).csv"));
const metaRaw       = parseCSV(path.join(ROOT,   "Companies_CAM_(account_owner)_Mapping_&_Other_details[updated]_[Company_ID]_2026_03_05_v2.csv"));

console.log(`  Screen usage rows:       ${screenUsage.length}`);
console.log(`  Interview usage rows:    ${ivUsage.length}`);
console.log(`  Screen adoption rows:    ${screenAdpRaw.length}`);
console.log(`  Interview adoption rows: ${ivAdpRaw.length}`);
console.log(`  Metadata rows:           ${metaRaw.length}`);

// ── Metadata map by company_id ─────────────────────────────────────────────
const metaMap = {};
metaRaw.forEach(r => { if (r.company_id) metaMap[r.company_id] = r; });

// ── Screen AI attempts per company (from adoption file — ground truth) ─────
const screenAdpMap = {};  // cid → { name, ownerEmail, aiAttempts }
screenAdpRaw.forEach(r => {
  const cid = r.company_id; if (!cid) return;
  if (!screenAdpMap[cid]) screenAdpMap[cid] = { name: r.company_name, ownerEmail: r.company_owner_email, aiAttempts: 0 };
  screenAdpMap[cid].aiAttempts += parseInt(r.attempts_used_ai_assistant) || 0;
});

// ── Interview AI counts per company (from adoption file) ───────────────────
const ivAdpMap = {};  // cid → { name, ownerEmail, aiInterviews }
ivAdpRaw.forEach(r => {
  const cid = r.company_id; if (!cid) return;
  ivAdpMap[cid] = {
    name:         r.company_name,
    ownerEmail:   r.company_owner_email,
    aiInterviews: parseInt(r.ai_assistant_used_interviews) || 0,
  };
});

// ── Company names/emails from usage files (fallback for adoption-absent cos)
const screenUsageMap = {};  // cid → { name, ownerEmail }
screenUsage.forEach(r => {
  const cid = r.company_id; if (!cid) return;
  if (!screenUsageMap[cid]) screenUsageMap[cid] = { name: r.company_name, ownerEmail: r.owner_email || "" };
});
const ivUsageMap = {};  // cid → { name, ownerEmail }
ivUsage.forEach(r => {
  const cid = r.company_id; if (!cid) return;
  if (!ivUsageMap[cid]) ivUsageMap[cid] = { name: r.company_name, ownerEmail: r.interview_owner_email || "" };
});

// ── Screen date stats per company ─────────────────────────────────────────
const screenDateMap = {};  // cid → { min, max, spanDays, daysSince, firstDate, lastDate }
screenUsage.forEach(r => {
  const cid = r.company_id; if (!cid) return;
  const d = new Date(r.attempt_start_date);
  if (isNaN(d)) return;
  if (!screenDateMap[cid]) screenDateMap[cid] = { min: d, max: d };
  else {
    if (d < screenDateMap[cid].min) screenDateMap[cid].min = d;
    if (d > screenDateMap[cid].max) screenDateMap[cid].max = d;
  }
});
const CUTOFF = new Date("2026-03-05");
const MS_DAY = 86400000;
Object.entries(screenDateMap).forEach(([cid, v]) => {
  v.spanDays  = Math.round((v.max - v.min) / MS_DAY);
  v.daysSince = Math.round((CUTOFF - v.max) / MS_DAY);
  v.lastDate  = v.max.toISOString().slice(0, 10);
  v.firstDate = v.min.toISOString().slice(0, 10);
});

// ── Interview date stats per company ──────────────────────────────────────
const ivDateMap = {};  // cid → { min, max, spanDays, daysSince, firstDate, lastDate }
ivUsage.forEach(r => {
  const cid = r.company_id; if (!cid) return;
  const d = new Date(r.interview_started_date);
  if (isNaN(d)) return;
  if (!ivDateMap[cid]) ivDateMap[cid] = { min: d, max: d };
  else {
    if (d < ivDateMap[cid].min) ivDateMap[cid].min = d;
    if (d > ivDateMap[cid].max) ivDateMap[cid].max = d;
  }
});
Object.entries(ivDateMap).forEach(([cid, v]) => {
  v.spanDays  = Math.round((v.max - v.min) / MS_DAY);
  v.daysSince = Math.round((CUTOFF - v.max) / MS_DAY);
  v.lastDate  = v.max.toISOString().slice(0, 10);
  v.firstDate = v.min.toISOString().slice(0, 10);
});

// ── Union of all company IDs across all 4 files ────────────────────────────
const allCids = new Set([
  ...Object.keys(screenAdpMap),
  ...Object.keys(ivAdpMap),
  ...Object.keys(screenUsageMap),
  ...Object.keys(ivUsageMap),
]);
console.log(`\n  Total unique companies: ${allCids.size}`);

// ── Build merged rows ───────────────────────────────────────────────────────
const rows = [];
allCids.forEach(cid => {
  const scAdp = screenAdpMap[cid];
  const ivAdp = ivAdpMap[cid];
  const scUsg = screenUsageMap[cid];
  const ivUsg = ivUsageMap[cid];
  const meta  = metaMap[cid];

  // Company name: prefer adoption file, then usage file, then metadata
  const companyName = (scAdp && scAdp.name) || (ivAdp && ivAdp.name)
                   || (scUsg && scUsg.name) || (ivUsg && ivUsg.name)
                   || (meta  && meta.company_name) || "";

  // Owner email: prefer metadata (most authoritative), then adoption files, then usage files
  const ownerEmail = (meta  && meta.company_owner_email)
                  || (scAdp && scAdp.ownerEmail) || (ivAdp && ivAdp.ownerEmail)
                  || (scUsg && scUsg.ownerEmail) || (ivUsg && ivUsg.ownerEmail) || "";

  const scAI = scAdp ? scAdp.aiAttempts   : 0;
  const ivAI = ivAdp ? ivAdp.aiInterviews : 0;
  const total = scAI + ivAI;

  const usesScreen     = (scAdp || scUsg) ? "Y" : "N";
  const usesInterviews = (ivAdp || ivUsg) ? "Y" : "N";

  // Sandbox detection
  const sandboxInName  = /sandbox/i.test(companyName);
  const sandboxInEmail = /sandbox/i.test(ownerEmail);
  const isSandbox      = sandboxInName || sandboxInEmail;

  // Testing account flags
  const scDates = screenDateMap[cid];
  const ivDates = ivDateMap[cid];

  const isTestingScreen = (
    !isSandbox &&
    scAI >= 1 && scAI <= 5 &&
    scDates && scDates.spanDays <= 7 && scDates.daysSince >= 14
  ) ? "Y" : "N";

  const isTestingInterview = (
    !isSandbox &&
    ivAI >= 1 && ivAI <= 5 &&
    ivDates && ivDates.spanDays <= 7 && ivDates.daysSince >= 14
  ) ? "Y" : "N";

  rows.push({
    company_id:             cid,
    company_name:           companyName,
    screen_attempts_with_ai: scAI,
    interviews_with_ai:     ivAI,
    total_activity:         total,
    uses_screen:            usesScreen,
    uses_interviews:        usesInterviews,
    salesforce_region:      meta ? (meta.salesforce_region    || "") : "",
    company_segment_type:   meta ? (meta.company_segment_type || "") : "",
    industry_type:          meta ? (meta.industry_type        || "") : "",
    arr:                    meta ? (meta.arr                  || "") : "",
    company_country:        meta ? (meta.company_country      || "") : "",
    company_stripe_plan:    meta ? (meta.company_stripe_plan  || "") : "",
    hr_cam_fullname:        meta ? (meta.hr_cam_fullname      || "") : "",
    company_owner_email:    ownerEmail,
    in_metadata:            meta ? "Y" : "N",
    is_sandbox:             isSandbox ? "Y" : "N",
    first_screen_activity:    scDates ? scDates.firstDate : "",
    last_screen_activity:     scDates ? scDates.lastDate  : "",
    first_interview_activity: ivDates ? ivDates.firstDate : "",
    last_interview_activity:  ivDates ? ivDates.lastDate  : "",
    is_testing_screen:        isTestingScreen,
    is_testing_interview:     isTestingInterview,
  });
});

// ── Sort: real accounts by total activity desc; sandboxes at bottom ────────
rows.sort((a, b) => {
  if (a.is_sandbox !== b.is_sandbox) return a.is_sandbox === "Y" ? 1 : -1;
  return b.total_activity - a.total_activity;
});

// ── Verify counts ──────────────────────────────────────────────────────────
const sandboxRows = rows.filter(r => r.is_sandbox === "Y");
const realRows    = rows.filter(r => r.is_sandbox === "N");
console.log(`\nSandbox companies: ${sandboxRows.length}`);
console.log(`Real companies:    ${realRows.length}`);
console.log(`Total:             ${rows.length}`);

console.log("\nSandbox accounts:");
sandboxRows.forEach(r => {
  const flag = /sandbox/i.test(r.company_name) ? "[name]" : "[email]";
  console.log(`  ${flag} [${r.company_id}] "${r.company_name || "(blank)"}" — ${r.company_owner_email}`);
});

// ── Write CSV (drop internal total_activity helper column) ─────────────────
const COLS = [
  "company_id", "company_name",
  "screen_attempts_with_ai", "interviews_with_ai",
  "uses_screen", "uses_interviews",
  "salesforce_region", "company_segment_type", "industry_type", "arr",
  "company_country", "company_stripe_plan", "hr_cam_fullname",
  "company_owner_email", "in_metadata", "is_sandbox",
  "first_screen_activity", "last_screen_activity",
  "first_interview_activity", "last_interview_activity",
  "is_testing_screen", "is_testing_interview",
];

const outPath = path.join(__dirname, "AI_Assistant_Companies.csv");
const header  = COLS.join(",");
const body    = rows.map(r => toCSVLine(COLS, r)).join("\n");
fs.writeFileSync(outPath, header + "\n" + body + "\n", "utf8");
const testScreenOnly = rows.filter(r => r.is_testing_screen === "Y" && r.is_testing_interview === "N").length;
const testIvOnly     = rows.filter(r => r.is_testing_screen === "N" && r.is_testing_interview === "Y").length;
const testBoth       = rows.filter(r => r.is_testing_screen === "Y" && r.is_testing_interview === "Y").length;
console.log(`\nTesting accounts (screen only):     ${testScreenOnly}`);
console.log(`Testing accounts (interviews only): ${testIvOnly}`);
console.log(`Testing accounts (both):            ${testBoth}`);

console.log(`\nWritten: ${outPath}  (${rows.length} rows)`);

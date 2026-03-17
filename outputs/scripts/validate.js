"use strict";
const fs = require("fs");

function splitCSVLine(line) {
  const out = []; let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i+1] === '"') { cur += '"'; i++; } else inQ = !inQ;
    } else if (c === ',' && !inQ) { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur); return out;
}

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

const src = require("path").join(__dirname, "..", "new files/NextGen_Content_Q3'26_Coderepo_TASK_questions_Usage_2026_03_10.csv");
const lines = fs.readFileSync(src, "utf8").split(/\r?\n/);
const h = splitCSVLine(lines[0]);
const idx = k => h.indexOf(k);

const attemptUsage = {}, attemptTypes = {};
lines.slice(1).forEach(l => {
  if (!l.trim()) return;
  const c = splitCSVLine(l);
  const aid = c[idx("attempt_id")], usage = c[idx("usage_type")], t = normType(c[idx("coderepo_task_type_adj")]);
  if (!aid) return;
  if (usage) attemptUsage[aid] = usage;
  if (t) { if (!attemptTypes[aid]) attemptTypes[aid] = new Set(); attemptTypes[aid].add(t); }
});

const screenAids = Object.keys(attemptUsage).filter(a => attemptUsage[a] === "screen");
const ivAids     = Object.keys(attemptUsage).filter(a => attemptUsage[a] === "interview");

// Top interview combos
const ivCombos = {};
ivAids.forEach(a => {
  const types = attemptTypes[a];
  if (!types || !types.size) return;
  const key = [...types].sort().join("+");
  ivCombos[key] = (ivCombos[key] || 0) + 1;
});

console.log("--- TOP INTERVIEW COMBOS ---");
Object.entries(ivCombos).sort((a,b) => b[1]-a[1]).slice(0, 8).forEach(([k, n]) => {
  console.log(`  ${(n/ivAids.length*100).toFixed(1)}%  (${n}/${ivAids.length})  ${k}`);
});

// Type reach
const TYPES = ["feature","bugfix","code_review","whiteboard","text_answer","issue"];
console.log("\n--- TYPE REACH (attempt-level) ---");
TYPES.forEach(t => {
  const sc = screenAids.filter(a => attemptTypes[a] && attemptTypes[a].has(t)).length;
  const iv = ivAids.filter(a => attemptTypes[a] && attemptTypes[a].has(t)).length;
  console.log(`  ${t.padEnd(14)} Screen: ${String(sc).padStart(4)} (${(sc/screenAids.length*100).toFixed(1)}%)   Interview: ${String(iv).padStart(4)} (${(iv/ivAids.length*100).toFixed(1)}%)`);
});
console.log(`\n  Screen total: ${screenAids.length}   Interview total: ${ivAids.length}`);

"""
scorecard-ai-signals.py
Scan custom scorecard data for AI-fluency evaluation dimensions.

METHODOLOGY
-----------
Unit of analysis: scorecard_title (the template name).
  - scorecard_id is an interviewer ID, not a template ID — same interviewer
    uses many different templates, and the same template is used by many
    interviewers. scorecard_title is the stable identifier for a template.

Signal tiers (applied to scorecard_title level):
  STRONG     — at least one section_field_title within the template matches
               an AI keyword. The interviewer is explicitly scoring an AI
               competency dimension.
  TITLE-ONLY — no AI field matches, but the scorecard_title itself matches
               an AI keyword. This indicates an AI-role interview, not
               necessarily AI-fluency evaluation.

Medium tier (section_title matches but fields are generic) is detected at
field level but not surfaced in outputs — it doesn't add meaningful signal
beyond what strong already captures.

Outputs
-------
  scorecard-ai-signals-detail.csv    one row per matched field (evidence)
  scorecard-ai-signals-summary.csv   one row per company
  scorecard-ai-companies-scorecards.csv  one row per (company, scorecard_title)
"""

import csv
import re
from collections import defaultdict
from pathlib import Path

# ── Paths ──────────────────────────────────────────────────────────────────
BASE   = Path(__file__).parent.parent
INPUT  = BASE / "new files" / "Interviews_Custom_scorecard_Used_2026_03_09.csv"
TOTALS = BASE / "new files" / "interview_insights_internal recruit_interviews 2026-03-09T2145.csv"
OUTD   = BASE / "outputs" / "scorecard-ai-signals-detail.csv"
OUTS   = BASE / "outputs" / "scorecard-ai-signals-summary.csv"
OUTSC  = BASE / "outputs" / "scorecard-ai-companies-scorecards.csv"

# ── AI keyword regex ───────────────────────────────────────────────────────
AI_KW = re.compile(
    r'\b(ai|llm|gpt|chatgpt|copilot|artificial.intelligence|generative|gen.?ai)\b'
    r'|ai.fluency|ai.literacy|ai.usage|ai.tool|ai.proficiency|ai.skill'
    r'|prompt.engineer|prompt.writing|prompt.design|prompt.quality'
    r'|ai.assistant|cod.?assist|ai.aware|ai.adoption'
    r'|leverage.*ai|use.*of.*ai|using.*ai|use.*llm',
    re.IGNORECASE
)

def ai_match(text):
    return bool(AI_KW.search(text or ""))

# ── Load total-interview reference ─────────────────────────────────────────
# Strong companies (from original file) + title-only companies (provided separately)
total_interviews = {}   # company_id → int
with open(TOTALS, newline="", encoding="utf-8") as fh:
    for r in csv.DictReader(fh):
        cid   = r["Recruit Companies ID"].strip()
        count = int(r["Recruit Interviews Interview Conducted Count"].strip().replace(",", ""))
        total_interviews[cid] = count

# Additional totals for title-only companies (provided 2026-03-09)
_extra = {
    "39902": 3861,   # Expedia Group
    "60021": 1605,   # Balyasny Asset Management
    "29832": 1391,   # ServiceTitan Inc.
    "60832": 1234,   # McKinsey & Company (already in strong, kept for completeness)
    "107553":  977,  # Bolt
    "81339":    72,  # Intact Financial Corporation
}
total_interviews.update(_extra)
print(f"  Totals reference: {len(total_interviews)} companies", flush=True)

# ── Load TSV ───────────────────────────────────────────────────────────────
print(f"Loading {INPUT} …", flush=True)
rows = []
with open(INPUT, newline="", encoding="utf-8") as fh:
    reader = csv.DictReader(fh)
    for r in reader:
        rows.append(r)
print(f"  {len(rows):,} rows loaded", flush=True)

# ── Build per-(company, scorecard_title) structures ────────────────────────
# sc_fields:  (co, sc_title) → {ai_field_titles}   — strong signal
# sc_intvws:  (co, sc_title) → {interview_ids}
# co_id:      company_name   → company_id
# co_intvws:  company_name   → {all interview_ids}

sc_fields  = defaultdict(set)
sc_intvws  = defaultdict(set)
co_id      = {}
co_intvws  = defaultdict(set)

for r in rows:
    co  = r["company_name"].strip()
    cid = r["company_id"].strip()
    sct = r["scorecard_title"].strip()
    fld = r["section_field_title"].strip()
    iid = r["interview_id"].strip()
    co_id[co]  = cid
    co_intvws[co].add(iid)
    sc_intvws[(co, sct)].add(iid)
    if ai_match(fld):
        sc_fields[(co, sct)].add(fld)

# ── Classify scorecard templates ───────────────────────────────────────────
strong_scs    = {k for k, v in sc_fields.items() if v}
title_only_scs = {
    (co, sct) for (co, sct) in sc_intvws
    if (co, sct) not in strong_scs and ai_match(sct)
}

strong_cos    = {co for co, _ in strong_scs}
title_only_cos = {co for co, _ in title_only_scs} - strong_cos

# ── Write detail CSV ──────────────────────────────────────────────────────
# One row per (company, scorecard_title, ai_field_title) for strong scorecards
detail_rows = []
for (co, sct), fields in sorted(sc_fields.items()):
    if not fields:
        continue
    cid = co_id.get(co, "")
    iids = sc_intvws[(co, sct)]
    for fld in sorted(fields):
        detail_rows.append({
            "company_id":          cid,
            "company_name":        co,
            "scorecard_title":     sct,
            "section_field_title": fld,
            "signal_tier":         "strong",
            "interview_count":     len(iids),
        })

# Add title-only rows
for (co, sct) in sorted(title_only_scs):
    cid  = co_id.get(co, "")
    iids = sc_intvws[(co, sct)]
    detail_rows.append({
        "company_id":          cid,
        "company_name":        co,
        "scorecard_title":     sct,
        "section_field_title": "",
        "signal_tier":         "title-only",
        "interview_count":     len(iids),
    })

detail_rows.sort(key=lambda x: (
    0 if x["signal_tier"] == "strong" else 1,
    x["company_name"], x["scorecard_title"]
))

DETAIL_COLS = ["company_id","company_name","scorecard_title",
               "section_field_title","signal_tier","interview_count"]
with open(OUTD, "w", newline="", encoding="utf-8") as fh:
    w = csv.DictWriter(fh, fieldnames=DETAIL_COLS)
    w.writeheader()
    w.writerows(detail_rows)
print(f"  Detail CSV: {len(detail_rows)} rows → {OUTD.name}", flush=True)

# ── Write scorecards CSV ──────────────────────────────────────────────────
# One row per (company, scorecard_title) — the actual template unit
sc_rows = []
for (co, sct) in sorted(strong_scs):
    cid  = co_id.get(co, "")
    iids = sc_intvws[(co, sct)]
    sc_rows.append({
        "company_id":      cid,
        "company_name":    co,
        "scorecard_title": sct,
        "signal_tier":     "strong",
        "ai_fields":       " | ".join(sorted(sc_fields[(co, sct)])),
        "interview_count": len(iids),
    })
for (co, sct) in sorted(title_only_scs):
    cid  = co_id.get(co, "")
    iids = sc_intvws[(co, sct)]
    sc_rows.append({
        "company_id":      cid,
        "company_name":    co,
        "scorecard_title": sct,
        "signal_tier":     "title-only",
        "ai_fields":       "",
        "interview_count": len(iids),
    })

sc_rows.sort(key=lambda x: (
    0 if x["signal_tier"] == "strong" else 1,
    x["company_name"], x["scorecard_title"]
))

SC_COLS = ["company_id","company_name","scorecard_title","signal_tier",
           "ai_fields","interview_count"]
with open(OUTSC, "w", newline="", encoding="utf-8") as fh:
    w = csv.DictWriter(fh, fieldnames=SC_COLS)
    w.writeheader()
    w.writerows(sc_rows)
print(f"  Scorecards CSV: {len(sc_rows)} rows → {OUTSC.name}", flush=True)

# ── Build summary ─────────────────────────────────────────────────────────
summary_rows = []
all_cos = sorted(strong_cos | title_only_cos)

for co in all_cos:
    cid  = co_id.get(co, "")
    tier = "strong" if co in strong_cos else "title-only"

    n_sc    = len([k for k in strong_scs   if k[0] == co]) if co in strong_cos else \
              len([k for k in title_only_scs if k[0] == co])
    n_title = len([k for k in title_only_scs if k[0] == co]) if co in title_only_cos else 0

    ai_iids   = set()
    ai_fields = set()
    ai_field_name_parts = []

    if tier == "strong":
        for (c, sct) in strong_scs:
            if c == co:
                ai_iids.update(sc_intvws[(c, sct)])
                ai_fields.update(sc_fields[(c, sct)])
        # For strong: field names + scorecard title(s) as context
        for (c, sct) in strong_scs:
            if c == co:
                for f in sorted(sc_fields[(c, sct)]):
                    ai_field_name_parts.append(f"{f} [{sct}]")
    else:
        # For title-only: no AI fields, but count interviews on AI-titled scorecards
        # and surface the scorecard titles as the signal
        for (c, sct) in title_only_scs:
            if c == co:
                ai_iids.update(sc_intvws[(c, sct)])
                ai_field_name_parts.append(f"[scorecard] {sct}")

    total_intvw = total_interviews.get(cid)
    pct = round(len(ai_iids) / total_intvw * 100, 1) if total_intvw and ai_iids else (
          0.0 if total_intvw else None)

    summary_rows.append({
        "company_id":             cid,
        "company_name":           co,
        "signal_tier":            tier,
        "scorecard_count":        n_sc,
        "ai_field_count":         len(ai_fields),   # 0 for title-only
        "ai_interviews":          len(ai_iids),
        "total_interviews":       total_intvw if total_intvw is not None else "",
        "penetration_pct":        pct if pct is not None else "",
        "ai_field_names":         " | ".join(ai_field_name_parts),
    })

summary_rows.sort(key=lambda x: (
    0 if x["signal_tier"] == "strong" else 1, -(x["ai_interviews"])
))

SUMMARY_COLS = ["company_id","company_name","signal_tier","scorecard_count",
                "ai_field_count","ai_interviews","total_interviews",
                "penetration_pct","ai_field_names"]
with open(OUTS, "w", newline="", encoding="utf-8") as fh:
    w = csv.DictWriter(fh, fieldnames=SUMMARY_COLS)
    w.writeheader()
    w.writerows(summary_rows)
print(f"  Summary CSV: {len(summary_rows)} rows → {OUTS.name}", flush=True)

# ── Console ────────────────────────────────────────────────────────────────
strong_sum = [r for r in summary_rows if r["signal_tier"] == "strong"]
n_strong_sc = sum(r["scorecard_count"] for r in strong_sum)
n_strong_ai = sum(r["ai_interviews"] for r in strong_sum)
n_strong_tot = sum(r["total_interviews"] for r in strong_sum if r["total_interviews"] != "")

print()
print("=" * 84)
print("  SCORECARD AI SIGNAL — CORRECTED SUMMARY")
print(f"  Unit: scorecard_title (template).  scorecard_id = interviewer ID, not template ID.")
print("=" * 84)
print(f"  Strong-signal companies : {len(strong_sum)}  |  {n_strong_sc} unique templates  |  {n_strong_ai:,} AI-evaluated interviews")
print(f"  Title-only companies    : {len(summary_rows)-len(strong_sum)}")
print(f"  Blended penetration     : {n_strong_ai}/{n_strong_tot:,} = {n_strong_ai/n_strong_tot*100:.1f}%")
print()
print(f"  {'Company':<40} {'Tier':<12} {'SC Tmplt':>8}  {'AI Intvws':>9}  {'Total':>7}  {'Pct':>6}")
print(f"  {'-'*40} {'-'*12} {'-'*8}  {'-'*9}  {'-'*7}  {'-'*6}")
for r in summary_rows:
    pct = f"{r['penetration_pct']:.1f}%" if r['penetration_pct'] != "" else "n/a"
    tot = f"{r['total_interviews']:,}" if r['total_interviews'] != "" else "n/a"
    print(f"  {r['company_name']:<40} {r['signal_tier']:<12} {r['scorecard_count']:>8}  "
          f"{r['ai_interviews']:>9,}  {tot:>7}  {pct:>6}")
print("=" * 84)

---
name: nextgen-weekly-report
description: >
  Produces the weekly DevEx DLI & Feedback Trends section for the HackerRank
  NextGen product. Trigger with: "run the weekly report", "generate the nextgen
  report", "weekly feedback trends", "DLI report", "nextgen weekly".
  Runs separately for Screens and Interviews. Requires 4 date-stamped CSV
  input files in the project root.
---

# NextGen Weekly Report Skill

## What This Skill Does

Reads 4 weekly-refreshed CSV files, runs a Python data script, then uses the
structured output to write the DevEx DLI & Feedback Trends section of the
NextGen weekly Slack update.  All metric computation is done by the script;
Claude handles quote curation and emerging-issue detection from the raw data.

---

## Step 1 — Locate Input Files

Use Glob to find the 4 newest date-stamped CSVs in the project root
(`/Users/ashish/Downloads/NextGen 2026 Q2 Review/`):

- `Nextgen_Interviews_Counts_by_buckets_over_a_period_*.csv`
- `Nextgen_Screen_Counts_by_buckets_over_a_period_*.csv`
- `Nextgen_Interviews_Raw_Feedback_Text_v2_*.csv`
- `Nextgen_Screen_Raw_Feedback_Text_*.csv`

**STOP** if any of the 4 files is missing and tell the user exactly which
file(s) are absent before doing anything else.

---

## Step 2 — Run the Data Script

```bash
cd "/Users/ashish/Downloads/NextGen 2026 Q2 Review" && \
python3 outputs/scripts/nextgen_weekly_report.py --auto-discover
```

- Progress and file names are printed to **stderr** (informational only).
- The JSON report data is printed to **stdout** — capture that.
- **STOP** if the script exits with a non-zero code and show the full error
  message verbatim.

---

## Step 3 — Parse the JSON Output

The script outputs a JSON object with two top-level keys: `"screens"` and
`"interviews"`.  Each has this shape:

```
{
  "source": "Screens" | "Interviews",
  "current_week":  "YYYY-MM-DD",  ← Monday of the latest complete week (from bucket counts)
  "prior_week":    "YYYY-MM-DD",  ← Monday of the week before that
  "raw_data_week": "YYYY-MM-DD",  ← Week the DLI/quotes are from (may lag current_week)
  "raw_lag_weeks": int,           ← 0 if aligned; 1 if raw file is one week behind
  "avg_dli":           float | null,
  "prior_avg_dli":     float | null,
  "dli_direction":     "up" | "down" | "unchanged",
  "pct_4_5_stars":     float | null,
  "total_feedback":    int,
  "prior_total_feedback": int,
  "themes": {
    "<theme_key>": {
      "display":    "Performance" | "AI Assistant" | "UI/UX" | "Core IDE" | "Code Repo",
      "current":    int,   ← count this week (from bucket CSV — authoritative)
      "prior":      int,   ← count prior week
      "direction":  "up" | "down" | "unchanged",
      "pct_change": float | null,  ← WoW % change; null if prior == 0
      "raw_quotes": [{"text": "...", "rating": 1-5}, ...]
                         ← ALL matching feedback for this theme this week
    },
    ...  (5 themes: performance, ai_assistant, uiux, core_ide, code_repo)
  },
  "all_feedback_current_week": [
    {"text": "...", "rating": 1-5, "themes": ["Performance", ...]}
    ...   ← all non-trivial feedback (text > 15 chars) from current week
          ← entries where "themes" == [] are the others/unmatched catch-all
  ]
}
```

---

## Step 4 — AI Reasoning (Quote Selection + Emerging Issues)

### 4a. Quote selection — per theme
For each of the 5 themes, read its `raw_quotes` list.
Select **2–3 most notable entries** applying these criteria (in priority order):
1. Specific, actionable complaint or praise — not generic ("good", "ok", "great")
2. Mentions a concrete feature, behaviour, or failure mode
3. Surprising or unexpected signal
4. Prefer lower-star ratings (1–3) for complaints; higher (4–5) for positive signals

If a theme has fewer than 2 non-trivial quotes, use whatever is available.
If `raw_quotes` is empty, omit the quotes line entirely for that theme.

### 4b. Emerging / Rising Issues
Read `all_feedback_current_week` (entries already filtered to text > 15 chars).
Scan with three specific lenses:

**(a) Reliability signals** — crashes, freezes, disconnects, timeouts, data loss,
  session failures, "stopped working", "error", "not loading"

**(b) First-time UX signals** — confusion, "didn't know how to", "couldn't find",
  onboarding friction, setup issues, unclear instructions, first attempt problems

**(c) New patterns** — scan **only** entries from `all_feedback_current_week` where
  `themes` is an empty list `[]`. These are the "others / unmatched" entries — feedback
  that the pipeline did not assign to any of the 5 defined buckets.
  Flag any theme that appears **2 or more times** across these entries.
  IMPORTANT: even within the others set, do NOT flag something that clearly belongs to an
  existing bucket (e.g. a slow-IDE complaint that was simply mis-tagged as others).
  Only flag things genuinely orthogonal to all 5 buckets (e.g. proctoring false positives,
  audio/video device setup, role-test mismatch, billing/access issues, time-limit concerns).

For each flagged issue:
- Label it: `reliability` / `first-time UX` / `new pattern`
- Write a short description (4–8 words)
- Count the number of matching entries
- Pick 1–2 representative quotes with star ratings

If no issues qualify, output `• None flagged this week.`

---

## Step 5 — Render the Report Block and Save HTML

Produce both sections separated by a blank line.  Use the exact format below.

```
━━━ DevEx DLI & Feedback Trends ━━━

[Screens]  week of <current_week e.g. Mar 16>
• AVG DLI: <avg_dli> (<dli_direction arrow> from <prior_avg_dli> prior week) · % 4-5 Stars: <pct_4_5_stars>% · <distinct_raw_ids> distinct <attempts/interviews> (week of <raw_data_week>)

• Feedback analysis WoW:
  ■ What Improved:
    • <display name>: <prior> → <current> (<pct_change>% WoW) — <one natural-language observation about what eased, based strictly on count delta and theme label; no fabrication>
    ... (list only themes where direction == "down"; if none, write "• Nothing notable improved this week.")
    ... (if pct_change is null for a theme, omit the percentage and just show the counts)

  ■ Emerging / Rising Issues:
    • <reliability/first-time UX/new pattern> — <description> — <count> mention(s)
      ○ "<quote>" (★<rating>)
    ... or:
    • None flagged this week.

  ■ Theme-by-Theme Update:
    • Performance — <current> cases (<direction arrow> from <prior>)
      ○ "<quote text>" (★<rating> | id: <id> | <email> | <slug> | <date>)
      ○ "<quote text>" (★<rating> | id: <id> | <email> | <slug> | <date>)
    • AI Assistant — ...
    • UI/UX — ...
    • Core IDE — ...
    • Code Repo — ...

[Interviews]  week of <current_week>
(same structure as above)
```

**Direction arrow key:**  ↑ = up, ↓ = down, → = unchanged

---

## Note on Raw Data Lag

The raw feedback export sometimes lags the bucket-count aggregates by one week.
When `raw_lag_weeks > 0`, the DLI and quotes are from `raw_data_week`, not
`current_week`. In this case, add a small note in the report:
`_(DLI & quotes from week of <raw_data_week> — raw export pending for <current_week>)_`

---

## Hard Rules

1. **Never invent or paraphrase quotes.** Use only text from `raw_quotes` or
   `all_feedback_current_week` verbatim (trimming whitespace is fine).
2. **Never recompute metrics.** All counts, DLI values, and percentages come
   from the script output — do not recalculate them yourself.
3. **Never use the partial current week.** The script already handles this;
   trust `current_week` in the JSON.
4. **Never combine Screens and Interviews.** They are always reported separately.
5. If `avg_dli` is null (no rating data), write `AVG DLI: N/A` and omit the
   prior-week comparison.
6. If a theme's `current` and `prior` are both 0, write `— 0 cases` and omit
   the quotes line.
7. **Use plain, muted language throughout.** Write observations as you would say
   them in a team standup — short, factual, understated. Avoid corporate jargon,
   superlatives, and action-report tone. Bad: "Sharp drop signals meaningful
   improvement trajectory." Good: "Fewer repo complaints; SpringBoot startup time
   still mentioned."  Apply this to all narrative fields: What Improved
   observations, emerging issue descriptions, and any inline commentary.

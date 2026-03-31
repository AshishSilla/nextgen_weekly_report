"""
nextgen_weekly_report.py
------------------------
Produces structured JSON data for the NextGen weekly DevEx DLI &
Feedback Trends report.  Run by the nextgen-weekly-report skill;
output is consumed by Claude Code which handles quote selection,
emerging-issue detection, and final formatting.

Usage:
  python3 nextgen_weekly_report.py --auto-discover
  python3 nextgen_weekly_report.py \
      --interview-counts <path> \
      --screen-counts    <path> \
      --interview-raw    <path> \
      --screen-raw       <path>
"""

import argparse
import collections
import csv
import datetime
import glob
import io
import json
import os
import sys

# ── Constants ────────────────────────────────────────────────────────────────

BASE = "/Users/ashish/Downloads/NextGen 2026 Q2 Review"

THEME_COLS = ['performance', 'ai_assistant', 'uiux', 'core_ide', 'code_repo']

THEME_DISPLAY = {
    'performance':  'Performance',
    'ai_assistant': 'AI Assistant',
    'uiux':         'UI/UX',
    'core_ide':     'Core IDE',
    'code_repo':    'Code Repo',
}

# Maps theme key → column name in the bucket-count CSVs
BUCKET_MAP = {
    'performance':  'performance_count',
    'ai_assistant': 'ai_assistant_count',
    'uiux':         'uiux_count',
    'core_ide':     'core_ide_count',
    'code_repo':    'code_repo_count',
}

# ── Helpers (reused verbatim from ai-feedback-bucket-timeline.py) ────────────

def open_csv(path):
    """UTF-8 BOM-safe CSV reader; skips leading Metabase 'Query …' meta-rows."""
    with open(path, newline='', encoding='utf-8-sig') as f:
        lines = f.readlines()
    header_idx = next(
        i for i, l in enumerate(lines)
        if not l.strip().lower().startswith('query')
    )
    return list(csv.DictReader(io.StringIO(''.join(lines[header_idx:]))))


def week_start(d):
    """Return the Monday of the ISO week containing date d."""
    return d - datetime.timedelta(days=d.weekday())


# ── File discovery ────────────────────────────────────────────────────────────

def find_latest_file(pattern):
    """
    Glob for files matching pattern; return the one with the latest
    modification time.  Raises FileNotFoundError if no match.
    """
    candidates = glob.glob(pattern)
    if not candidates:
        raise FileNotFoundError(f"No file found matching: {pattern}")
    return max(candidates, key=os.path.getmtime)


# ── Week logic ────────────────────────────────────────────────────────────────

def find_current_and_prior_week(bucket_rows):
    """
    Identify the latest *complete* week and the week before it from the
    bucket-count CSV.

    A week starting on period_start (Monday) is complete only when its
    Sunday (period_start + 6 days) has already passed — i.e.
    period_start + 6 < today.  This prevents using a partial current week.

    Returns (current_week_date, prior_week_date) as datetime.date objects.
    Raises ValueError if fewer than 2 complete weeks are found.
    """
    today = datetime.date.today()
    complete = []
    for row in bucket_rows:
        raw = row.get('period_start', '').strip()
        if not raw:
            continue
        try:
            ps = datetime.date.fromisoformat(raw)
        except ValueError:
            continue
        if ps + datetime.timedelta(days=6) < today:
            complete.append(ps)

    complete.sort()

    if len(complete) < 2:
        raise ValueError(
            f"Need at least 2 complete weeks in bucket file; "
            f"found {len(complete)}.  Today is {today}."
        )

    return complete[-1], complete[-2]


def find_latest_raw_week(raw_rows, date_col):
    """
    Find the Monday of the most recent *complete* week that actually has
    rows in the raw feedback file.  Raw exports often lag 1 week behind
    the bucket-count aggregates.

    Returns (raw_current_week, raw_prior_week) as datetime.date objects,
    or (None, None) if there is insufficient data.
    """
    today = datetime.date.today()
    weeks_seen = set()
    for row in raw_rows:
        raw = row.get(date_col, '').strip()
        if not raw:
            continue
        try:
            d = datetime.date.fromisoformat(raw[:10])
        except ValueError:
            continue
        wk = week_start(d)
        if wk + datetime.timedelta(days=6) < today:
            weeks_seen.add(wk)

    if not weeks_seen:
        return None, None

    sorted_weeks = sorted(weeks_seen)
    raw_current = sorted_weeks[-1]
    raw_prior   = sorted_weeks[-2] if len(sorted_weeks) >= 2 else None
    return raw_current, raw_prior


# ── Bucket counts ─────────────────────────────────────────────────────────────

def extract_bucket_counts(bucket_rows, week_date):
    """
    Return counts for a given week_date from the pre-aggregated bucket CSV.

    Returns a dict:
      {
        'total_feedback': N,
        'performance': N, 'ai_assistant': N, 'uiux': N,
        'core_ide': N, 'code_repo': N
      }
    All values default to 0 if the week_date row is missing.
    """
    target = week_date.isoformat()
    for row in bucket_rows:
        if row.get('period_start', '').strip() == target:
            result = {'total_feedback': int(row.get('total_feedback', 0) or 0)}
            for theme, col in BUCKET_MAP.items():
                result[theme] = int(row.get(col, 0) or 0)
            return result

    # Week not found — return zeros
    result = {'total_feedback': 0}
    for theme in THEME_COLS:
        result[theme] = 0
    return result


# ── Raw feedback filtering ────────────────────────────────────────────────────

def load_raw_feedback(raw_rows, date_col, week_date):
    """
    Filter raw_rows to entries whose date_col falls within
    [week_date, week_date + 6 days] (the full Mon–Sun span).
    Silently skips rows with missing or unparseable dates.
    """
    week_end = week_date + datetime.timedelta(days=6)
    result = []
    for row in raw_rows:
        raw = row.get(date_col, '').strip()
        if not raw:
            continue
        try:
            d = datetime.date.fromisoformat(raw[:10])
        except ValueError:
            continue
        if week_date <= d <= week_end:
            result.append(row)
    return result


# ── DLI computation ───────────────────────────────────────────────────────────

def compute_dli(raw_week_rows):
    """
    Compute average product_rating and % of ratings >= 4 for the given rows.

    Returns (avg_dli, pct_4_5_stars) both rounded to 1 decimal place,
    or (None, None) if no valid ratings exist.
    """
    ratings = []
    for row in raw_week_rows:
        raw = row.get('product_rating', '').strip()
        if not raw:
            continue
        try:
            r = float(raw)
        except ValueError:
            continue
        ratings.append(r)

    if not ratings:
        return None, None

    avg = round(sum(ratings) / len(ratings), 1)
    pct = round(sum(1 for r in ratings if r >= 4) / len(ratings) * 100, 1)
    return avg, pct


def dli_direction(current, prior):
    """Return 'up', 'down', or 'unchanged' comparing two DLI values."""
    if current is None or prior is None:
        return 'unchanged'
    if current > prior:
        return 'up'
    if current < prior:
        return 'down'
    return 'unchanged'


# ── Quote collection ──────────────────────────────────────────────────────────

def _row_meta(row):
    """
    Extract display metadata from a raw feedback row.
    Works for both screen rows (attempt_id / test_name) and
    interview rows (interview_id).  Returns a dict with whichever
    fields are present; absent fields are omitted.
    """
    meta = {}
    # IDs
    for field in ('attempt_id', 'interview_id'):
        val = row.get(field, '').strip()
        if val:
            meta['id'] = val
            break
    # Email (prefer candidate email, fall back to feedback_user_email)
    for field in ('candidate_email', 'feedback_user_email'):
        val = row.get(field, '').strip()
        if val:
            meta['email'] = val
            break
    # Slug / test name
    for field in ('test_name', 'interview_id'):
        val = row.get(field, '').strip()
        if val and field == 'test_name':
            meta['slug'] = val
            break
    # Date
    for field in ('attempt_started_date', 'interview_started_date'):
        val = row.get(field, '').strip()
        if val:
            meta['date'] = val[:10]
            break
    return meta


def collect_theme_quotes(raw_week_rows, theme_col):
    """
    Return all non-empty feedback entries where theme_col flag is 'true'.
    Each entry includes verbatim text, rating, and row metadata.

    Claude (in SKILL.md) will read this full list and select 2-3 most notable.
    """
    results = []
    for row in raw_week_rows:
        flag = row.get(theme_col, '').strip().lower()
        if flag != 'true':
            continue
        text = row.get('raw_feedback_text', '').strip()
        if not text:
            continue
        try:
            rating = int(float(row.get('product_rating', '3') or '3'))
        except ValueError:
            rating = 3
        entry = {"text": text, "rating": rating}
        entry.update(_row_meta(row))
        results.append(entry)
    return results


def collect_all_feedback(raw_week_rows):
    """
    Return all non-trivial current-week feedback entries for emerging-issue
    detection by Claude.  Filters to text length > 15.

    Each entry includes text, rating, matched themes, and row metadata.
    """
    results = []
    for row in raw_week_rows:
        text = row.get('raw_feedback_text', '').strip()
        if len(text) <= 15:
            continue

        matched = [
            THEME_DISPLAY[t]
            for t in THEME_COLS
            if row.get(t, '').strip().lower() == 'true'
        ]

        try:
            rating = int(float(row.get('product_rating', '3') or '3'))
        except ValueError:
            rating = 3

        entry = {"text": text, "rating": rating, "themes": matched}
        entry.update(_row_meta(row))
        results.append(entry)
    return results


# ── Per-source pipeline ───────────────────────────────────────────────────────

def process_source(bucket_path, raw_path, date_col, source_label):
    """
    Run the full data pipeline for one source (Screens or Interviews).
    Returns a dict ready to be serialised as JSON.
    """
    print(f"[{source_label}] Loading bucket counts from {os.path.basename(bucket_path)} ...",
          file=sys.stderr)
    bucket_rows = open_csv(bucket_path)

    # Counts come from the bucket CSV (authoritative, may be 1 week ahead of raw)
    current_wk, prior_wk = find_current_and_prior_week(bucket_rows)
    print(f"[{source_label}] Bucket counts — current week: {current_wk} | prior week: {prior_wk}",
          file=sys.stderr)

    print(f"[{source_label}] Loading raw feedback from {os.path.basename(raw_path)} ...",
          file=sys.stderr)
    raw_rows = open_csv(raw_path)

    # DLI and quotes come from the raw file; it may lag the bucket file by 1 week
    raw_current_wk, raw_prior_wk = find_latest_raw_week(raw_rows, date_col)
    if raw_current_wk is None:
        print(f"[{source_label}] WARNING: no complete weeks found in raw file — "
              f"DLI and quotes will be unavailable", file=sys.stderr)
        raw_current_wk = current_wk
        raw_prior_wk   = prior_wk

    print(f"[{source_label}] Raw feedback — most recent week: {raw_current_wk} "
          f"| prior: {raw_prior_wk}", file=sys.stderr)

    raw_lag = (current_wk - raw_current_wk).days // 7
    if raw_lag > 0:
        print(f"[{source_label}] Note: raw file lags bucket counts by {raw_lag} week(s) — "
              f"DLI and quotes are from {raw_current_wk}", file=sys.stderr)

    current_raw = load_raw_feedback(raw_rows, date_col, raw_current_wk)
    prior_raw   = load_raw_feedback(raw_rows, date_col, raw_prior_wk) if raw_prior_wk else []
    print(f"[{source_label}] Raw rows — current: {len(current_raw)}, "
          f"prior: {len(prior_raw)}", file=sys.stderr)

    avg_dli,       pct_4_5  = compute_dli(current_raw)
    prior_avg_dli, _        = compute_dli(prior_raw)

    current_counts = extract_bucket_counts(bucket_rows, current_wk)
    prior_counts   = extract_bucket_counts(bucket_rows, prior_wk)

    themes = {}
    for theme in THEME_COLS:
        current_n = current_counts.get(theme, 0)
        prior_n   = prior_counts.get(theme, 0)
        if current_n < prior_n:
            direction = 'down'
        elif current_n > prior_n:
            direction = 'up'
        else:
            direction = 'unchanged'

        # Compute WoW percentage change
        if prior_n > 0:
            pct_change = round((current_n - prior_n) / prior_n * 100, 1)
        else:
            pct_change = None

        raw_quotes = collect_theme_quotes(current_raw, theme)
        print(f"[{source_label}]   {THEME_DISPLAY[theme]}: "
              f"{prior_n} → {current_n} ({direction}), "
              f"{len(raw_quotes)} quote candidates", file=sys.stderr)

        themes[theme] = {
            "display":    THEME_DISPLAY[theme],
            "current":    current_n,
            "prior":      prior_n,
            "direction":  direction,
            "pct_change": pct_change,
            "raw_quotes": raw_quotes,
        }

    # Count distinct attempt/interview IDs in the raw window used for DLI
    id_field = 'attempt_id' if 'attempt_id' in (current_raw[0] if current_raw else {}) else 'interview_id'
    distinct_raw_ids = len({r.get(id_field, '').strip() for r in current_raw if r.get(id_field, '').strip()})

    all_feedback = collect_all_feedback(current_raw)
    print(f"[{source_label}] Non-trivial feedback for emerging-issue scan: "
          f"{len(all_feedback)} entries", file=sys.stderr)
    print(f"[{source_label}] Distinct {id_field}s in raw window: {distinct_raw_ids}", file=sys.stderr)

    return {
        "source":               source_label,
        "current_week":         current_wk.isoformat(),
        "prior_week":           prior_wk.isoformat(),
        "raw_data_week":        raw_current_wk.isoformat(),
        "raw_lag_weeks":        raw_lag,
        "avg_dli":              avg_dli,
        "prior_avg_dli":        prior_avg_dli,
        "dli_direction":        dli_direction(avg_dli, prior_avg_dli),
        "pct_4_5_stars":        pct_4_5,
        "distinct_raw_ids":     distinct_raw_ids,
        "total_feedback":       current_counts.get('total_feedback', 0),
        "prior_total_feedback": prior_counts.get('total_feedback', 0),
        "themes":               themes,
        "all_feedback_current_week": all_feedback,
    }


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Generate NextGen weekly DLI & feedback data for the weekly report skill."
    )
    parser.add_argument('--interview-counts', help='Path to interview bucket-counts CSV')
    parser.add_argument('--screen-counts',    help='Path to screen bucket-counts CSV')
    parser.add_argument('--interview-raw',    help='Path to interview raw-feedback CSV')
    parser.add_argument('--screen-raw',       help='Path to screen raw-feedback CSV')
    parser.add_argument('--auto-discover',    action='store_true',
                        help='Auto-discover newest date-stamped files in project root')
    args = parser.parse_args()

    # File discovery
    if args.auto_discover or not args.interview_counts:
        print("Auto-discovering newest input files ...", file=sys.stderr)
        interview_counts = find_latest_file(
            os.path.join(BASE, "Nextgen_Interviews_Counts_by_buckets_over_a_period_*.csv"))
        screen_counts = find_latest_file(
            os.path.join(BASE, "Nextgen_Screen_Counts_by_buckets_over_a_period_*.csv"))
        interview_raw = find_latest_file(
            os.path.join(BASE, "Nextgen_Interviews_Raw_Feedback_Text_v2_*.csv"))
        screen_raw = find_latest_file(
            os.path.join(BASE, "Nextgen_Screen_Raw_Feedback_Text_*.csv"))
    else:
        interview_counts = args.interview_counts
        screen_counts    = args.screen_counts
        interview_raw    = args.interview_raw
        screen_raw       = args.screen_raw

    print("Input files:", file=sys.stderr)
    for label, path in [
        ("Interview counts", interview_counts),
        ("Screen counts",    screen_counts),
        ("Interview raw",    interview_raw),
        ("Screen raw",       screen_raw),
    ]:
        print(f"  {label}: {os.path.basename(path)}", file=sys.stderr)

    result = {
        "generated_on": datetime.date.today().isoformat(),
        "screens":    process_source(
            screen_counts, screen_raw,
            date_col="attempt_started_date",
            source_label="Screens"
        ),
        "interviews": process_source(
            interview_counts, interview_raw,
            date_col="interview_started_date",
            source_label="Interviews"
        ),
    }

    # JSON to stdout — consumed by the nextgen-weekly-report skill
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()

import csv, datetime, collections, os, io

BASE = "/Users/ashish/Downloads/NextGen 2026 Q2 Review"
SCREEN_FILE        = os.path.join(BASE, "AI Assistant Usage files/Nextgen Q1-2026 _ AI Assistant usage - Feedback from screen with AI Assistant.csv")
INTERVIEW_FILE     = os.path.join(BASE, "AI Assistant Usage files/Nextgen Q1-2026 _ AI Assistant usage - Feedback from Interviews with AI Assistant.csv")
SCREEN_USAGE_FILE  = os.path.join(BASE, "AI Assistant Usage files/Nextgen Q1-2026 _ AI Assistant usage - Usage in Screen.csv")
INTERVIEW_USAGE_FILE = os.path.join(BASE, "AI Assistant Usage files/Nextgen Q1-2026 _ AI Assistant usage - Usage in Interviews.csv")

CUTOFF = datetime.date(2025, 9, 8)

# Question-type categories (priority order: first match wins)
QTYPE_CATEGORIES = [
    ("CodeRepo",           {"coderepo_task", "coderepo"}),
    ("Project (Fullstack)",{"fullstack"}),
]
def classify_qtypes(qtypes):
    """Return category name given a set of question_type strings."""
    for name, members in QTYPE_CATEGORIES:
        if qtypes & members:
            return name
    return "Other"

def week_start(d):
    return d - datetime.timedelta(days=d.weekday())  # Monday of the ISO week

def open_csv(path):
    """Return DictReader rows, skipping any leading meta rows (e.g. 'Query Used,...')."""
    with open(path, newline='', encoding='utf-8-sig') as f:
        lines = f.readlines()
    header_idx = next(i for i, l in enumerate(lines) if not l.strip().lower().startswith('query'))
    return list(csv.DictReader(io.StringIO(''.join(lines[header_idx:]))))

def build_qtype_lookup(usage_path, id_col):
    """Build {id -> category} from a usage file. Multi-type rows: priority order wins."""
    by_id = collections.defaultdict(set)
    for r in open_csv(usage_path):
        qt = r.get('question_type', '').strip()
        if qt:
            by_id[r[id_col]].add(qt)
    return {k: classify_qtypes(v) for k, v in by_id.items()}

def load(path, date_col, role_col=None, qtype_lookup=None, id_col=None):
    """
    Returns:
      data        – defaultdict(list): week -> [ratings]        (all)
      by_role     – dict[role]     -> defaultdict(list)          (if role_col given)
      by_qtype    – dict[category] -> defaultdict(list)          (if qtype_lookup given)
    """
    data     = collections.defaultdict(list)
    by_role  = collections.defaultdict(lambda: collections.defaultdict(list))
    by_qtype = collections.defaultdict(lambda: collections.defaultdict(list))
    skipped  = 0
    for r in open_csv(path):
        try:
            d      = datetime.date.fromisoformat(r[date_col].strip()[:10])
            rating = int(float(r['product_rating'].strip()))
        except (ValueError, KeyError):
            skipped += 1
            continue
        if d >= CUTOFF:
            wk = week_start(d)
            data[wk].append(rating)
            if role_col:
                role = r.get(role_col, '').strip().lower() or 'unknown'
                by_role[role][wk].append(rating)
            if qtype_lookup is not None and id_col:
                cat = qtype_lookup.get(r.get(id_col, ''), 'Other')
                by_qtype[cat][wk].append(rating)
    if skipped:
        print(f"  [{os.path.basename(path)}] skipped {skipped} rows (missing/invalid date or rating)")
    return data, by_role, by_qtype

print("Loading usage files for question-type classification...")
screen_qtype_map    = build_qtype_lookup(SCREEN_USAGE_FILE,    'attempt_id')
interview_qtype_map = build_qtype_lookup(INTERVIEW_USAGE_FILE, 'interview_id')
print(f"  Screen usage:    {len(screen_qtype_map)} attempts mapped")
print(f"  Interview usage: {len(interview_qtype_map)} interviews mapped")

print("Loading screen feedback...")
s, _, s_by_qtype = load(SCREEN_FILE, 'attempt_start_date',
                         qtype_lookup=screen_qtype_map, id_col='attempt_id')
print(f"  {sum(len(v) for v in s.values())} rows in range, {len(s)} weeks")
for cat, wk_data in sorted(s_by_qtype.items()):
    print(f"    {cat}: {sum(len(v) for v in wk_data.values())} rows")

print("Loading interview feedback...")
iv, iv_by_role, iv_by_qtype = load(INTERVIEW_FILE, 'interview_started_date',
                                    role_col='feedback_user_role',
                                    qtype_lookup=interview_qtype_map, id_col='interview_id')
print(f"  {sum(len(v) for v in iv.values())} rows in range, {len(iv)} weeks")
for role, wk_data in sorted(iv_by_role.items()):
    print(f"    {role}: {sum(len(v) for v in wk_data.values())} rows")

all_weeks = sorted(set(s) | set(iv))

out = os.path.join(BASE, "outputs/ai-feedback-weekly-trend.csv")
with open(out, 'w', newline='') as f:
    w = csv.writer(f)
    w.writerow(['week_start', 'week_label', 'screen_n', 'screen_avg', 'interview_n', 'interview_avg', 'combined_n', 'combined_avg'])

    print()
    print(f"{'Week':13} | {'Screen avg (n)':>16} | {'Interview avg (n)':>19} | {'Combined avg (n)':>18}")
    print("-" * 75)

    for wk in all_weeks:
        sr = s.get(wk, [])
        ir = iv.get(wk, [])
        combined = sr + ir

        # e.g. "Sep W2 '25"
        week_num = (wk.day - 1) // 7 + 1
        label = wk.strftime("%b") + f" W{week_num} '" + wk.strftime("%y")

        s_avg  = round(sum(sr)       / len(sr),       2) if sr       else None
        i_avg  = round(sum(ir)       / len(ir),       2) if ir       else None
        c_avg  = round(sum(combined) / len(combined), 2) if combined else None

        w.writerow([
            wk.isoformat(),
            label,
            len(sr) if sr else '',
            s_avg if s_avg is not None else '',
            len(ir) if ir else '',
            i_avg if i_avg is not None else '',
            len(combined) if combined else '',
            c_avg if c_avg is not None else '',
        ])

        s_str = f"{s_avg} (n={len(sr)})"   if s_avg is not None else '—'
        i_str = f"{i_avg} (n={len(ir)})"   if i_avg is not None else '—'
        c_str = f"{c_avg} (n={len(combined)})" if c_avg is not None else '—'

        print(f"{label:13} | {s_str:>16} | {i_str:>19} | {c_str:>18}")

print()
print(f"CSV → {out}")
print(f"Total weeks: {len(all_weeks)}  |  Screen total: {sum(len(v) for v in s.values())}  |  Interview total: {sum(len(v) for v in iv.values())}")

# ── Interview role split table ─────────────────────────────────────────────────
iv_weeks = sorted(set(iv_by_role['candidate']) | set(iv_by_role['interviewer']))

out_roles = os.path.join(BASE, "outputs/ai-feedback-interview-roles.csv")
with open(out_roles, 'w', newline='') as f:
    w = csv.writer(f)
    w.writerow(['week_start', 'week_label',
                'candidate_n', 'candidate_avg',
                'interviewer_n', 'interviewer_avg'])

    print()
    print("── Interview ratings: Candidate vs Interviewer ──────────────────────────────")
    print(f"{'Week':13} | {'Candidate avg (n)':>19} | {'Interviewer avg (n)':>21}")
    print("-" * 60)

    for wk in iv_weeks:
        cand = iv_by_role['candidate'].get(wk, [])
        intr = iv_by_role['interviewer'].get(wk, [])

        week_num = (wk.day - 1) // 7 + 1
        label = wk.strftime("%b") + f" W{week_num} '" + wk.strftime("%y")

        c_avg = round(sum(cand) / len(cand), 2) if cand else None
        i_avg = round(sum(intr) / len(intr), 2) if intr else None

        w.writerow([
            wk.isoformat(), label,
            len(cand) if cand else '', c_avg if c_avg is not None else '',
            len(intr) if intr else '', i_avg if i_avg is not None else '',
        ])

        c_str = f"{c_avg} (n={len(cand)})" if c_avg is not None else '—'
        i_str = f"{i_avg} (n={len(intr)})" if i_avg is not None else '—'
        print(f"{label:13} | {c_str:>19} | {i_str:>21}")

print()
print(f"CSV → {out_roles}")
cand_total = sum(len(v) for v in iv_by_role['candidate'].values())
intr_total = sum(len(v) for v in iv_by_role['interviewer'].values())
print(f"Interview role totals  |  Candidate: {cand_total}  |  Interviewer: {intr_total}")

# ── Question-type breakdown (Screen + Interview combined) ──────────────────────
# Merge s_by_qtype and iv_by_qtype
all_by_qtype = collections.defaultdict(lambda: collections.defaultdict(list))
for cat, wk_data in s_by_qtype.items():
    for wk, ratings in wk_data.items():
        all_by_qtype[cat][wk].extend(ratings)
for cat, wk_data in iv_by_qtype.items():
    for wk, ratings in wk_data.items():
        all_by_qtype[cat][wk].extend(ratings)

CATEGORIES = ["CodeRepo", "Project (Fullstack)", "Other"]
qt_all_weeks = sorted(set().union(*[set(wk_data.keys()) for wk_data in all_by_qtype.values()]))

out_qt = os.path.join(BASE, "outputs/ai-feedback-by-qtype.csv")
with open(out_qt, 'w', newline='') as f:
    w = csv.writer(f)
    # header: week_start, week_label, then n+avg per category
    header = ['week_start', 'week_label']
    for cat in CATEGORIES:
        slug = cat.lower().replace(' ', '_').replace('(', '').replace(')', '').replace('__', '_')
        header += [f'{slug}_n', f'{slug}_avg']
    w.writerow(header)

    col_w = 22
    print()
    print("── Ratings by Question Type (Screen + Interview) ────────────────────────────")
    hdr = f"{'Week':13} | " + " | ".join(f"{c:>{col_w}}" for c in CATEGORIES)
    print(hdr)
    print("-" * len(hdr))

    for wk in qt_all_weeks:
        week_num = (wk.day - 1) // 7 + 1
        label = wk.strftime("%b") + f" W{week_num} '" + wk.strftime("%y")

        row = [wk.isoformat(), label]
        cells = []
        for cat in CATEGORIES:
            ratings = all_by_qtype[cat].get(wk, [])
            avg = round(sum(ratings) / len(ratings), 2) if ratings else None
            row += [len(ratings) if ratings else '', avg if avg is not None else '']
            cells.append(f"{avg} (n={len(ratings)})" if avg is not None else '—')

        w.writerow(row)
        print(f"{label:13} | " + " | ".join(f"{c:>{col_w}}" for c in cells))

print()
print(f"CSV → {out_qt}")
for cat in CATEGORIES:
    total = sum(len(v) for v in all_by_qtype[cat].values())
    all_r = [r for wk_data in all_by_qtype[cat].values() for r in wk_data]
    overall_avg = round(sum(all_r) / len(all_r), 2) if all_r else None
    print(f"  {cat}: {total} ratings, overall avg {overall_avg}")

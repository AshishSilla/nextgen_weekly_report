import csv, datetime, collections, os, io

BASE            = "/Users/ashish/Downloads/NextGen 2026 Q2 Review"
INPUT_FILE      = os.path.join(BASE, "new files/Nextgen Q1-2026 _ AI Assistant usage - Sheet16.csv")
INTERVIEW_FILE  = os.path.join(BASE, "AI Assistant Usage files/Nextgen Q1-2026 _ AI Assistant usage - Feedback from Interviews with AI Assistant.csv")

BUCKET_COLS  = ['content_flag', 'performance_flag', 'ai_assistant_flag', 'uiux_flag', 'core_functionality_flag']
BUCKET_NAMES = ['Content', 'Performance', 'AI Assistant', 'UI/UX', 'Core Functionality']
COLORS       = ['#E05C5C', '#E0A030', '#5B9BD5', '#8E63CE', '#3AAD6E']


def week_start(d):
    return d - datetime.timedelta(days=d.weekday())


def week_label(wk):
    week_num = (wk.day - 1) // 7 + 1
    return wk.strftime("%b") + f" W{week_num} '" + wk.strftime("%y")


def open_csv(path):
    with open(path, newline='', encoding='utf-8-sig') as f:
        lines = f.readlines()
    header_idx = next(i for i, l in enumerate(lines) if not l.strip().lower().startswith('query'))
    return list(csv.DictReader(io.StringIO(''.join(lines[header_idx:]))))


# ── Build interview date lookup: (company_id, feedback_user_email) → date ────
print("Loading interview date lookup...")
interview_date_lookup = {}
for r in open_csv(INTERVIEW_FILE):
    key = (r.get('company_id', '').strip(), r.get('feedback_user_email', '').strip())
    raw_date = r.get('interview_started_date', '').strip()
    if raw_date and key not in interview_date_lookup:
        try:
            interview_date_lookup[key] = datetime.date.fromisoformat(raw_date[:10])
        except ValueError:
            pass
print(f"  {len(interview_date_lookup)} date entries loaded")

# ── Load + parse ───────────────────────────────────────────────────────────────
print("Loading combined feedback file...")
rows = open_csv(INPUT_FILE)
print(f"  {len(rows)} total rows")

counts   = collections.defaultdict(lambda: collections.defaultdict(lambda: collections.defaultdict(int)))
skipped  = 0

for r in rows:
    src = (r.get('source') or '').strip().lower()
    fb  = (r.get('feedback') or '').strip()
    raw = (r.get('attempt_start_date') or '').strip()
    if raw:
        try:
            d = datetime.date.fromisoformat(raw[:10])
        except ValueError:
            skipped += 1
            continue
    elif src == 'interview':
        key = (r.get('company_id', '').strip(), r.get('feedback_user_email', '').strip())
        d = interview_date_lookup.get(key)
        if d is None:
            skipped += 1
            continue
    else:
        skipped += 1
        continue

    wk = week_start(d)
    counts[src][wk]['total_rows'] += 1
    if fb:
        counts[src][wk]['feedback_rows'] += 1
    for col in BUCKET_COLS:
        if str(r.get(col, '')).strip().upper() == 'TRUE':
            counts[src][wk][col] += 1

if skipped:
    print(f"  Skipped {skipped} rows (bad/missing date)")

for src in ['screen', 'interview']:
    total = sum(counts[src][wk]['total_rows'] for wk in counts[src])
    print(f"  {src}: {total} rows across {len(counts[src])} weeks")

# ── Gather sorted weeks per source ────────────────────────────────────────────
s_weeks   = sorted(counts['screen'].keys())
i_weeks   = sorted(counts['interview'].keys())
all_weeks = sorted(set(s_weeks) | set(i_weeks))

# ── Combined (screen + interview) counts ──────────────────────────────────────
combined = collections.defaultdict(lambda: collections.defaultdict(int))
for src in ['screen', 'interview']:
    for wk, wk_counts in counts[src].items():
        for k, v in wk_counts.items():
            combined[wk][k] += v
c_weeks = sorted(combined.keys())

# ── Write CSV (with % columns appended) ───────────────────────────────────────
out_csv = os.path.join(BASE, "outputs/ai-feedback-bucket-timeline-pct.csv")
pct_cols = [c.replace('_flag', '_pct') for c in BUCKET_COLS]
with open(out_csv, 'w', newline='') as f:
    w = csv.writer(f)
    w.writerow(['week_start', 'week_label', 'source', 'total_rows', 'feedback_rows']
               + BUCKET_COLS + pct_cols)
    for wk in all_weeks:
        lbl = week_label(wk)
        for src, src_counts in [('screen', counts['screen']), ('interview', counts['interview']), ('combined', combined)]:
            c = src_counts.get(wk, {})
            total = c.get('total_rows', 0)
            if total == 0:
                continue
            fb_rows = c.get('feedback_rows', 0)
            raw_counts = [c.get(col, 0) for col in BUCKET_COLS]
            denom = fb_rows if fb_rows > 0 else total
            pcts = [round(n / denom * 100, 2) for n in raw_counts]
            w.writerow([wk.isoformat(), lbl, src, total, fb_rows]
                       + raw_counts + pcts)
print(f"CSV → {out_csv}")

# ── Plot (% of total rows) ─────────────────────────────────────────────────────
try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import matplotlib.patches as mpatches
    import matplotlib.ticker as ticker
    import numpy as np

    fig, axes = plt.subplots(3, 1, figsize=(16, 14), sharex=False)
    fig.patch.set_facecolor('#1A1A2E')
    fig.suptitle("AI Feedback Issue Trends by Week — % of Feedback Rows (Screen / Interview / Combined)",
                 fontsize=14, color='white', fontweight='bold', y=0.99)

    for ax_idx, (src, weeks, src_counts) in enumerate([
        ('screen',    s_weeks, counts['screen']),
        ('interview', i_weeks, counts['interview']),
        ('combined',  c_weeks, combined),
    ]):
        ax = axes[ax_idx]
        ax.set_facecolor('#16213E')

        x      = np.arange(len(weeks))
        labels = [week_label(wk) for wk in weeks]

        for b_idx, (col, name) in enumerate(zip(BUCKET_COLS, BUCKET_NAMES)):
            vals = np.array([
                src_counts[wk].get(col, 0) /
                max(src_counts[wk].get('feedback_rows', 0) or src_counts[wk].get('total_rows', 1), 1) * 100
                for wk in weeks
            ], dtype=float)
            ax.plot(x, vals, color=COLORS[b_idx], linewidth=1.8,
                    marker='o', markersize=4, label=name)

        # Right y-axis: feedback_rows volume for context
        ax2 = ax.twinx()
        tot_vals = np.array([src_counts[wk].get('feedback_rows', 0) for wk in weeks], dtype=float)
        ax2.bar(x, tot_vals, color='#FFFFFF', alpha=0.06, width=0.8)
        ax2.tick_params(axis='y', colors='#888888', labelsize=7)
        ax2.set_ylabel("Feedback rows (volume)", color='#888888', fontsize=8)
        ax2.yaxis.set_major_locator(ticker.MaxNLocator(integer=True))
        for spine in ax2.spines.values():
            spine.set_edgecolor('#333355')

        title_map = {'screen': 'Screen', 'interview': 'Interview', 'combined': 'Combined (Screen + Interview)'}
        ax.set_title(title_map[src], color='white', fontsize=11, pad=6)
        ax.set_xticks(x)
        ax.set_xticklabels(labels, rotation=45, ha='right', fontsize=7, color='#CCCCCC')
        ax.tick_params(axis='y', colors='#CCCCCC', labelsize=8)
        ax.yaxis.set_major_formatter(ticker.FuncFormatter(lambda v, _: f"{v:.1f}%"))
        ax.set_ylabel("% of total rows flagged", color='#CCCCCC', fontsize=9)
        for spine in ax.spines.values():
            spine.set_edgecolor('#333355')
        ax.grid(axis='y', color='#333355', linewidth=0.5, alpha=0.7)

    # Shared legend
    patches = [mpatches.Patch(color=COLORS[i], label=BUCKET_NAMES[i]) for i in range(len(BUCKET_NAMES))]
    patches.append(mpatches.Patch(color='#FFFFFF', alpha=0.2, label='Feedback rows (volume bar)'))
    fig.legend(handles=patches, loc='lower center', ncol=3, fontsize=9,
               facecolor='#16213E', edgecolor='#333355', labelcolor='white',
               bbox_to_anchor=(0.5, 0.01))

    plt.tight_layout(rect=[0, 0.07, 1, 0.98])
    out_png = os.path.join(BASE, "outputs/ai-feedback-bucket-timeline-pct.png")
    plt.savefig(out_png, dpi=150, bbox_inches='tight', facecolor=fig.get_facecolor())
    plt.close()
    print(f"PNG → {out_png}")

except ImportError:
    print("\nmatplotlib not found — run:  pip3 install matplotlib numpy")

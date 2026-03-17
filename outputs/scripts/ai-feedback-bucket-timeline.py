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

# counts[source][week_start] = {col: n, 'total_rows': n, 'feedback_rows': n}
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
        # look up date from original interview file
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
s_weeks = sorted(counts['screen'].keys())
i_weeks = sorted(counts['interview'].keys())
all_weeks = sorted(set(s_weeks) | set(i_weeks))

# ── Write CSV ─────────────────────────────────────────────────────────────────
out_csv = os.path.join(BASE, "outputs/ai-feedback-bucket-timeline.csv")
with open(out_csv, 'w', newline='') as f:
    w = csv.writer(f)
    w.writerow(['week_start', 'week_label', 'source', 'total_rows', 'feedback_rows'] + BUCKET_COLS)
    for wk in all_weeks:
        lbl = week_label(wk)
        for src in ['screen', 'interview']:
            c = counts[src].get(wk, {})
            if c.get('total_rows', 0) > 0:
                w.writerow(
                    [wk.isoformat(), lbl, src,
                     c.get('total_rows', 0), c.get('feedback_rows', 0)] +
                    [c.get(col, 0) for col in BUCKET_COLS]
                )
print(f"CSV → {out_csv}")

# ── Auto-insights ──────────────────────────────────────────────────────────────
print("\n── AUTO-INSIGHTS ─────────────────────────────────────────────────────────")

for src, weeks in [('screen', s_weeks), ('interview', i_weeks)]:
    print(f"\n{'Screen' if src == 'screen' else 'Interview'} ({len(weeks)} weeks):")
    if len(weeks) < 8:
        print("  WARNING: too few weeks for reliable first-4 vs last-4 comparison")

    first4 = weeks[:4]
    last4  = weeks[-4:]

    # Check interview sparsity
    last4_flagged = sum(
        sum(counts[src][wk].get(col, 0) for col in BUCKET_COLS)
        for wk in last4
    )
    if src == 'interview' and last4_flagged < 3:
        print("  NOTE: Interview data too sparse for reliable trends "
              f"(only {last4_flagged} flagged rows in last 4 weeks — use 4-week aggregates)")

    for col, name in zip(BUCKET_COLS, BUCKET_NAMES):
        f4_avg = sum(counts[src][wk].get(col, 0) for wk in first4) / max(len(first4), 1)
        l4_avg = sum(counts[src][wk].get(col, 0) for wk in last4)  / max(len(last4), 1)

        if f4_avg == 0 and l4_avg == 0:
            direction = "No data"
        elif f4_avg == 0:
            direction = "New / Emerging"
        elif l4_avg > f4_avg * 1.25:
            direction = f"Increasing  (first-4 avg {f4_avg:.1f} → last-4 avg {l4_avg:.1f})"
        elif l4_avg < f4_avg * 0.75:
            direction = f"Decreasing  (first-4 avg {f4_avg:.1f} → last-4 avg {l4_avg:.1f})"
        else:
            direction = f"Stable      (first-4 avg {f4_avg:.1f} → last-4 avg {l4_avg:.1f})"

        print(f"  {name:<22} {direction}")

    # Spike detection: any week > 2× rolling 4-week avg
    print("  Spike detection:")
    for col, name in zip(BUCKET_COLS, BUCKET_NAMES):
        spikes = []
        for i, wk in enumerate(weeks):
            window = weeks[max(0, i-4):i]
            if not window:
                continue
            roll_avg = sum(counts[src][w].get(col, 0) for w in window) / len(window)
            val = counts[src][wk].get(col, 0)
            if roll_avg > 0 and val > roll_avg * 2:
                spikes.append(f"{week_label(wk)} ({val} vs avg {roll_avg:.1f})")
        if spikes:
            print(f"    {name}: SPIKE at {', '.join(spikes)}")

    # Most recent week top bucket
    if weeks:
        most_recent = weeks[-1]
        top_col = max(BUCKET_COLS, key=lambda c: counts[src][most_recent].get(c, 0))
        top_val = counts[src][most_recent].get(top_col, 0)
        top_name = BUCKET_NAMES[BUCKET_COLS.index(top_col)]
        print(f"  Most recent week ({week_label(most_recent)}): top bucket = {top_name} ({top_val} rows)")

# ── Plot ───────────────────────────────────────────────────────────────────────
try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import matplotlib.patches as mpatches
    import matplotlib.ticker as ticker
    import numpy as np

    fig, axes = plt.subplots(2, 1, figsize=(16, 10), sharex=False)
    fig.patch.set_facecolor('#1A1A2E')
    fig.suptitle("AI Feedback Issue Trends by Week — Screen vs Interview",
                 fontsize=14, color='white', fontweight='bold', y=0.98)

    for ax_idx, (src, weeks) in enumerate([('screen', s_weeks), ('interview', i_weeks)]):
        ax = axes[ax_idx]
        ax.set_facecolor('#16213E')

        x      = np.arange(len(weeks))
        labels = [week_label(wk) for wk in weeks]

        for b_idx, (col, name) in enumerate(zip(BUCKET_COLS, BUCKET_NAMES)):
            vals = np.array([counts[src][wk].get(col, 0) for wk in weeks], dtype=float)
            ax.plot(x, vals, color=COLORS[b_idx], linewidth=1.8,
                    marker='o', markersize=4, label=name)

        # Right y-axis: feedback_rows volume
        ax2 = ax.twinx()
        fb_vals = np.array([counts[src][wk].get('feedback_rows', 0) for wk in weeks], dtype=float)
        ax2.plot(x, fb_vals, color='#888888', linewidth=1.0, linestyle='--',
                 alpha=0.6, label='Feedback rows (volume)')
        ax2.tick_params(axis='y', colors='#888888', labelsize=7)
        ax2.set_ylabel("Feedback rows", color='#888888', fontsize=8)
        ax2.yaxis.set_major_locator(ticker.MaxNLocator(integer=True))
        for spine in ax2.spines.values():
            spine.set_edgecolor('#333355')

        ax.set_title(src.capitalize(), color='white', fontsize=11, pad=6)
        ax.set_xticks(x)
        ax.set_xticklabels(labels, rotation=45, ha='right', fontsize=7, color='#CCCCCC')
        ax.tick_params(axis='y', colors='#CCCCCC', labelsize=8)
        ax.yaxis.set_major_locator(ticker.MaxNLocator(integer=True))
        ax.set_ylabel("Rows flagged", color='#CCCCCC', fontsize=9)
        for spine in ax.spines.values():
            spine.set_edgecolor('#333355')
        ax.grid(axis='y', color='#333355', linewidth=0.5, alpha=0.7)

    # Shared legend (bucket lines only)
    patches = [mpatches.Patch(color=COLORS[i], label=BUCKET_NAMES[i]) for i in range(len(BUCKET_NAMES))]
    patches.append(mpatches.Patch(color='#888888', label='Feedback rows (volume)', alpha=0.6))
    fig.legend(handles=patches, loc='lower center', ncol=3, fontsize=9,
               facecolor='#16213E', edgecolor='#333355', labelcolor='white',
               bbox_to_anchor=(0.5, 0.01))

    plt.tight_layout(rect=[0, 0.10, 1, 0.97])
    out_png = os.path.join(BASE, "outputs/ai-feedback-bucket-timeline.png")
    plt.savefig(out_png, dpi=150, bbox_inches='tight', facecolor=fig.get_facecolor())
    plt.close()
    print(f"\nPNG → {out_png}")

except ImportError:
    print("\nmatplotlib not found — run:  pip3 install matplotlib numpy")

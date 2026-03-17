import csv, datetime, collections, os, io, re

BASE           = "/Users/ashish/Downloads/NextGen 2026 Q2 Review"
SCREEN_FILE    = os.path.join(BASE, "AI Assistant Usage files/Nextgen Q1-2026 _ AI Assistant usage - Feedback from screen with AI Assistant.csv")
INTERVIEW_FILE = os.path.join(BASE, "AI Assistant Usage files/Nextgen Q1-2026 _ AI Assistant usage - Feedback from Interviews with AI Assistant.csv")

CUTOFF = datetime.date(2025, 9, 8)

# ── AI keyword filter (same as ai-assistant-deck.js) ──────────────────────────
AI_KW = re.compile(
    r'\b(ai|assistant|hint|suggest|auto[\s-]?complet|copilot|chatbot|gpt|llm'
    r'|useful|useless|confus|explain|recommendation|cod.?assist)\b',
    re.IGNORECASE
)

# ── Issue buckets (exclude "Helpfulness & Suggestions") ───────────────────────
BUCKETS = [
    (
        "poor_quality_n",
        "Poor Quality / Inaccurate",
        re.compile(r'bad|terrible|poor|useless|wrong|incorrect|sucks|awful|horrible|doesn.t work|not helpful', re.IGNORECASE),
    ),
    (
        "fairness_n",
        "Fairness / Cheating",
        re.compile(
            r'\b(ai|assistant|hint|tool|copilot)\b[^.]{0,60}\b(cheat|unfair|advantage|bypass|allowed)\b'
            r'|\b(cheat|unfair|advantage|bypass|allowed)\b[^.]{0,60}\b(ai|assistant|hint|tool|copilot)\b',
            re.IGNORECASE
        ),
    ),
    (
        "ux_interface_n",
        "UX / Interface Issues",
        re.compile(r'confus|difficult|hard to|disable.*auto|autocomplete|auto.complet|interface|no easy way', re.IGNORECASE),
    ),
    (
        "performance_n",
        "Performance / Reliability",
        re.compile(r'slow|freeze|crash|lag|hang|disconnect|connection.*lost|timeout|random.*scroll|scroll.*random', re.IGNORECASE),
    ),
    (
        "missing_limited_n",
        "Missing / Limited Features",
        re.compile(r'wish|missing|lack|no option|no opus|could not run|not able to run|no.*model|request.*feature', re.IGNORECASE),
    ),
]
BUCKET_COLS  = [b[0] for b in BUCKETS]
BUCKET_NAMES = [b[1] for b in BUCKETS]
BUCKET_RE    = [b[2] for b in BUCKETS]


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


def load_and_classify(path, date_col, channel):
    """
    Returns counts: { (channel, week) -> {bucket_col: count} }
    and total AI-flagged rows.
    """
    counts   = collections.defaultdict(lambda: collections.defaultdict(int))
    ai_total = 0
    skipped  = 0

    for r in open_csv(path):
        fb = (r.get('feedback') or '').strip()
        try:
            d = datetime.date.fromisoformat(r[date_col].strip()[:10])
        except (ValueError, KeyError):
            skipped += 1
            continue
        if d < CUTOFF:
            continue
        if not AI_KW.search(fb):
            continue

        ai_total += 1
        wk = week_start(d)
        key = (channel, wk)
        for col, _, rx in BUCKETS:
            if rx.search(fb):
                counts[key][col] += 1

    if skipped:
        print(f"  [{os.path.basename(path)}] skipped {skipped} rows (bad date)")
    return counts, ai_total


# ── Load ──────────────────────────────────────────────────────────────────────
print("Loading screen feedback...")
s_counts, s_ai = load_and_classify(SCREEN_FILE,    'attempt_start_date',    'screen')
print(f"  {s_ai} AI-flagged rows")

print("Loading interview feedback...")
i_counts, i_ai = load_and_classify(INTERVIEW_FILE, 'interview_started_date', 'interview')
print(f"  {i_ai} AI-flagged rows")

print(f"\nTotal AI-flagged rows: {s_ai + i_ai}")

# ── Gather all weeks per channel ──────────────────────────────────────────────
s_weeks = sorted({wk for ch, wk in s_counts if ch == 'screen'})
i_weeks = sorted({wk for ch, wk in i_counts if ch == 'interview'})
all_weeks = sorted(set(s_weeks) | set(i_weeks))

# ── Write CSV ─────────────────────────────────────────────────────────────────
out_csv = os.path.join(BASE, "outputs/ai-feedback-theme-counts.csv")
with open(out_csv, 'w', newline='') as f:
    w = csv.writer(f)
    w.writerow(['week_start', 'week_label', 'channel'] + BUCKET_COLS)
    for wk in all_weeks:
        lbl = week_label(wk)
        for ch, counts in [('screen', s_counts), ('interview', i_counts)]:
            row_counts = counts.get((ch, wk), {})
            if any(row_counts.get(c, 0) for c in BUCKET_COLS):
                w.writerow(
                    [wk.isoformat(), lbl, ch] +
                    [row_counts.get(c, 0) for c in BUCKET_COLS]
                )

print(f"CSV → {out_csv}")

# ── Plot ──────────────────────────────────────────────────────────────────────
try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import matplotlib.patches as mpatches
    import numpy as np

    COLORS = ['#E05C5C', '#E0A030', '#5B9BD5', '#8E63CE', '#3AAD6E']

    fig, axes = plt.subplots(2, 1, figsize=(14, 9), sharex=False)
    fig.patch.set_facecolor('#1A1A2E')
    fig.suptitle("AI Feedback Issue Themes by Week", fontsize=15, color='white', fontweight='bold', y=0.98)

    for ax_idx, (ch, weeks, counts) in enumerate([
        ('screen',    s_weeks, s_counts),
        ('interview', i_weeks, i_counts),
    ]):
        ax = axes[ax_idx]
        ax.set_facecolor('#16213E')

        labels = [week_label(wk) for wk in weeks]
        x      = np.arange(len(weeks))
        bottom = np.zeros(len(weeks))

        for b_idx, col in enumerate(BUCKET_COLS):
            vals = np.array([counts.get((ch, wk), {}).get(col, 0) for wk in weeks], dtype=float)
            ax.bar(x, vals, bottom=bottom, color=COLORS[b_idx], label=BUCKET_NAMES[b_idx],
                   width=0.65, edgecolor='#1A1A2E', linewidth=0.4)
            bottom += vals

        ax.set_title(ch.capitalize(), color='white', fontsize=11, pad=6)
        ax.set_xticks(x)
        ax.set_xticklabels(labels, rotation=45, ha='right', fontsize=8, color='#CCCCCC')
        ax.tick_params(axis='y', colors='#CCCCCC', labelsize=8)
        ax.yaxis.set_major_locator(matplotlib.ticker.MaxNLocator(integer=True))
        ax.set_ylabel("Theme matches", color='#CCCCCC', fontsize=9)
        for spine in ax.spines.values():
            spine.set_edgecolor('#333355')
        ax.grid(axis='y', color='#333355', linewidth=0.5, alpha=0.7)

    # Shared legend below both panels
    patches = [mpatches.Patch(color=COLORS[i], label=BUCKET_NAMES[i]) for i in range(len(BUCKET_NAMES))]
    fig.legend(handles=patches, loc='lower center', ncol=3, fontsize=9,
               facecolor='#16213E', edgecolor='#333355', labelcolor='white',
               bbox_to_anchor=(0.5, 0.01))

    plt.tight_layout(rect=[0, 0.10, 1, 0.97])
    out_png = os.path.join(BASE, "outputs/ai-feedback-theme-counts.png")
    plt.savefig(out_png, dpi=150, bbox_inches='tight', facecolor=fig.get_facecolor())
    plt.close()
    print(f"PNG → {out_png}")

except ImportError:
    print("\nmatplotlib not found — run:  pip3 install matplotlib numpy")
    print("Then re-run this script to generate the PNG chart.")

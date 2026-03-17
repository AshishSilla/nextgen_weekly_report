import csv, datetime, collections, os, io, re

BASE         = "/Users/ashish/Downloads/NextGen 2026 Q2 Review"
TICKETS_FILE = os.path.join(BASE, "Next Gen issues _ Edit.csv")

CUTOFF = datetime.date(2025, 9, 8)

# ── AI relevance filter — applied to Title + Description ─────────────────────
AI_KW = re.compile(
    r'\b(ai|assistant|autocomplete|auto.complet|transcript|copilot|hint|llm'
    r'|portkey|cod.?assist|observe.*mode|real.time.*sync|inline.*suggest|chat.*assist)\b',
    re.IGNORECASE
)

# ── 5 issue-theme buckets (from support ticket analysis) ─────────────────────
BUCKETS = [
    (
        "transcript_reporting_n",
        "AI Transcript / Reporting",
        re.compile(
            r'transcript|usage.*report|report.*usage|missing.*log|ai.*log'
            r'|no usage.*assistant|assistant.*no.*usage',
            re.IGNORECASE
        ),
    ),
    (
        "autocomplete_disable_n",
        "AI Autocomplete / Cannot Disable",
        re.compile(
            r'autocomplete|auto.complet|cannot.*disable|unable.*turn.*off'
            r'|disable.*ai|ai.*disabl|turn.*off.*ai|still.*appear.*disabl',
            re.IGNORECASE
        ),
    ),
    (
        "not_available_n",
        "AI Not Available / Setup Failure",
        re.compile(
            r'not showing|not available|not have.*context|setup.*fail|fail.*setup'
            r'|portkey.*limit|extension.*fail|error.*setting.*up|does not have.*context'
            r'|ai.*not.*show|assistant.*missing.*setup',
            re.IGNORECASE
        ),
    ),
    (
        "quality_loops_n",
        "AI Response Quality & Loops",
        re.compile(
            r'\bloop\b|looping|went.*into.*loop|loop.*loop|wrong.*response'
            r'|incorrect.*response|ai.*lag\b|response.*quality|bad.*response'
            r'|incorrect.*ai|ai.*incorrect',
            re.IGNORECASE
        ),
    ),
    (
        "observe_sync_n",
        "Observe Mode & Real-time Sync",
        re.compile(
            r'observe.*mode|observation.*mode|real.time.*sync|sync.*real.time'
            r'|empty.*ai.*tab|shifted.*editor|observe.*tab|real.time.*transcript',
            re.IGNORECASE
        ),
    ),
]
BUCKET_COLS  = [b[0] for b in BUCKETS]
BUCKET_NAMES = [b[1] for b in BUCKETS]
BUCKET_RE    = [b[2] for b in BUCKETS]

# ── Print regexes used ────────────────────────────────────────────────────────
print("AI relevance filter (applied to Title + Description):")
print(f"  {AI_KW.pattern}\n")
print("Theme regexes:")
for col, name, rx in BUCKETS:
    print(f"  [{col}]  {name}")
    print(f"    {rx.pattern}\n")


def week_start(d):
    return d - datetime.timedelta(days=d.weekday())


def week_label(wk):
    week_num = (wk.day - 1) // 7 + 1
    return wk.strftime("%b") + f" W{week_num} '" + wk.strftime("%y")


def open_csv(path):
    with open(path, newline='', encoding='utf-8-sig') as f:
        content = f.read()
    return list(csv.DictReader(io.StringIO(content)))


# ── Load & classify ───────────────────────────────────────────────────────────
counts   = collections.defaultdict(lambda: collections.defaultdict(int))
ai_total = 0
skipped  = 0
all_ids  = set()

for r in open_csv(TICKETS_FILE):
    ticket_id = r.get('ID', '').strip()
    if ticket_id in all_ids:
        continue                          # skip duplicates
    all_ids.add(ticket_id)

    title = r.get('Title', '') or ''
    desc  = r.get('Description', '') or ''
    text  = title + ' ' + desc

    try:
        d = datetime.date.fromisoformat(r['Created'].strip()[:10])
    except (ValueError, KeyError):
        skipped += 1
        continue
    if d < CUTOFF:
        continue
    if not AI_KW.search(text):
        continue

    ai_total += 1
    wk = week_start(d)
    for col, _, rx in BUCKETS:
        if rx.search(text):
            counts[wk][col] += 1

if skipped:
    print(f"  Skipped {skipped} rows (bad/missing Created date)")

all_weeks = sorted(counts.keys())
print(f"AI-relevant tickets in range: {ai_total}  |  Weeks with data: {len(all_weeks)}")
print()

# ── Console summary ───────────────────────────────────────────────────────────
header_row = f"{'Week':13} | " + " | ".join(f"{n[:22]:>22}" for n in BUCKET_NAMES)
print(header_row)
print("-" * len(header_row))
for wk in all_weeks:
    cells = [str(counts[wk].get(c, 0)) for c in BUCKET_COLS]
    print(f"{week_label(wk):13} | " + " | ".join(f"{v:>22}" for v in cells))

# ── Write CSV ─────────────────────────────────────────────────────────────────
out_csv = os.path.join(BASE, "outputs/support-theme-counts.csv")
with open(out_csv, 'w', newline='') as f:
    w = csv.writer(f)
    w.writerow(['week_start', 'week_label'] + BUCKET_COLS)
    for wk in all_weeks:
        w.writerow(
            [wk.isoformat(), week_label(wk)] +
            [counts[wk].get(c, 0) for c in BUCKET_COLS]
        )
print(f"\nCSV → {out_csv}")

# ── Plot ──────────────────────────────────────────────────────────────────────
try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import matplotlib.patches as mpatches
    import matplotlib.ticker as ticker
    import numpy as np

    COLORS = ['#5B9BD5', '#E0A030', '#E05C5C', '#8E63CE', '#3AAD6E']

    fig, ax = plt.subplots(figsize=(13, 5))
    fig.patch.set_facecolor('#1A1A2E')
    ax.set_facecolor('#16213E')

    labels = [week_label(wk) for wk in all_weeks]
    x      = np.arange(len(all_weeks))
    bottom = np.zeros(len(all_weeks))

    for b_idx, col in enumerate(BUCKET_COLS):
        vals = np.array([counts[wk].get(col, 0) for wk in all_weeks], dtype=float)
        ax.bar(x, vals, bottom=bottom, color=COLORS[b_idx],
               label=BUCKET_NAMES[b_idx], width=0.6,
               edgecolor='#1A1A2E', linewidth=0.4)
        bottom += vals

    ax.set_title("Support Ticket AI Issue Themes by Week", color='white',
                 fontsize=14, fontweight='bold', pad=10)
    ax.set_xticks(x)
    ax.set_xticklabels(labels, rotation=45, ha='right', fontsize=8, color='#CCCCCC')
    ax.tick_params(axis='y', colors='#CCCCCC', labelsize=9)
    ax.yaxis.set_major_locator(ticker.MaxNLocator(integer=True))
    ax.set_ylabel("Tickets matching theme", color='#CCCCCC', fontsize=10)
    for spine in ax.spines.values():
        spine.set_edgecolor('#333355')
    ax.grid(axis='y', color='#333355', linewidth=0.5, alpha=0.7)

    patches = [mpatches.Patch(color=COLORS[i], label=BUCKET_NAMES[i])
               for i in range(len(BUCKET_NAMES))]
    ax.legend(handles=patches, loc='upper left', fontsize=9,
              facecolor='#16213E', edgecolor='#333355', labelcolor='white')

    plt.tight_layout()
    out_png = os.path.join(BASE, "outputs/support-theme-counts.png")
    plt.savefig(out_png, dpi=150, bbox_inches='tight', facecolor=fig.get_facecolor())
    plt.close()
    print(f"PNG → {out_png}")

except ImportError:
    print("\nmatplotlib not found — run: pip3 install matplotlib numpy")

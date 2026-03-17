"""
AI Feedback Reclassification — Manual claude.ai workflow
---------------------------------------------------------
MODE 1 (prepare):  Splits feedback into batches → saves prompt .txt files
MODE 2 (merge):    Reads claude.ai responses → builds final output CSVs

Usage:
  python3 ai-feedback-reclassify-manual.py prepare
  python3 ai-feedback-reclassify-manual.py merge
"""

import csv, io, json, os, sys

BASE           = "/Users/ashish/Downloads/NextGen 2026 Q2 Review"
SCREEN_FILE    = os.path.join(BASE, "AI Assistant Usage files/Nextgen Q1-2026 _ AI Assistant usage - Feedback from screen with AI Assistant.csv")
INTERVIEW_FILE = os.path.join(BASE, "AI Assistant Usage files/Nextgen Q1-2026 _ AI Assistant usage - Feedback from Interviews with AI Assistant.csv")
BATCHES_DIR    = os.path.join(BASE, "outputs/manual-batches")
OUT_SCREEN     = os.path.join(BASE, "outputs/ai-feedback-reclassified-screen.csv")
OUT_INTERVIEW  = os.path.join(BASE, "outputs/ai-feedback-reclassified-interviews.csv")
OUT_COMBINED   = os.path.join(BASE, "outputs/ai-feedback-reclassified-combined.csv")

BATCH_SIZE = 100  # rows per claude.ai prompt

FLAG_COLS = [
    "content_flag",
    "performance_flag",
    "ai_assistant_flag",
    "uiux_flag",
    "core_functionality_flag",
]

PROMPT_HEADER = """You are a feedback classifier for HackerRank's NextGen developer assessment platform.

The platform has these key systems:
1. Code Repos / IDE — multi-file browser-based IDE, can be slow to load
2. AI Assistant — Cursor-like coding assistant embedded in the IDE (referred to as "the AI", "assistant", "copilot", "chatbot")
3. Platform/Infrastructure — test loading, timer, submission flow, network
4. Question/Problem Content — problem statement, instructions, test cases, difficulty
5. UI/UX — layout, navigation, finding the terminal, screen clutter
6. Core IDE Functionality — debugger, test runner, console, syntax highlighting, autocomplete (non-AI)

Classify each row's `feedback` into 5 boolean flags:
- content_flag: problem/question clarity, difficulty, relevance, instructions
- performance_flag: slow, laggy, repo not loading, freezing, long load time
- ai_assistant_flag: AI not working, wrong answers, missing, slow, unhelpful suggestions
- uiux_flag: can't find terminal, confusing layout, navigation issues, screen clutter
- core_functionality_flag: no debugger, can't run code, broken IDE, missing test runner

Rules:
- Empty or blank feedback → all flags = false
- A single row can have multiple flags = true
- Return ONLY a JSON array — no explanation, no markdown, no extra text

Input rows (JSON array):
"""

PROMPT_FOOTER = """

Return a JSON array where each object has:
{"row_id": <same row_id from input>, "content": bool, "performance": bool, "ai_assistant": bool, "uiux": bool, "core_functionality": bool}
"""


# ── Helpers ───────────────────────────────────────────────────────────────────

def open_csv(path):
    with open(path, newline='', encoding='utf-8-sig') as f:
        lines = f.readlines()
    header_idx = next(i for i, l in enumerate(lines) if not l.strip().lower().startswith('query'))
    return list(csv.DictReader(io.StringIO(''.join(lines[header_idx:]))))


def write_csv(rows, path, include_source=False):
    if not rows:
        return
    base_cols = [k for k in rows[0].keys() if k not in FLAG_COLS and k != 'source']
    extra = (['source'] if include_source else []) + FLAG_COLS
    fieldnames = base_cols + extra
    with open(path, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        w.writeheader()
        w.writerows(rows)
    print(f"  → {path}  ({len(rows)} rows)")


# ── MODE 1: PREPARE ───────────────────────────────────────────────────────────

def prepare():
    os.makedirs(BATCHES_DIR, exist_ok=True)

    for source, path in [('screen', SCREEN_FILE), ('interview', INTERVIEW_FILE)]:
        rows = open_csv(path)
        print(f"\n{source}: {len(rows)} rows loaded")

        # Assign a global row_id to every row
        for i, r in enumerate(rows):
            r['_row_id'] = i

        # Split into batches of BATCH_SIZE
        batch_num = 0
        i = 0
        while i < len(rows):
            batch = rows[i:i + BATCH_SIZE]
            batch_num += 1

            # Build JSON input for this batch
            input_data = [
                {"row_id": r['_row_id'], "feedback": (r.get('feedback') or '').strip()}
                for r in batch
            ]

            prompt = PROMPT_HEADER + json.dumps(input_data, indent=2) + PROMPT_FOOTER

            fname = os.path.join(BATCHES_DIR, f"{source}-batch{batch_num:02d}-prompt.txt")
            with open(fname, 'w', encoding='utf-8') as f:
                f.write(prompt)

            non_empty = sum(1 for d in input_data if d['feedback'])
            print(f"  Batch {batch_num}: rows {i}–{i+len(batch)-1}  ({non_empty} non-empty)  → {fname}")
            i += BATCH_SIZE

    print(f"\n✓ Prompt files saved to: {BATCHES_DIR}")
    print("\n── Next steps ──────────────────────────────────────────────────────")
    print("1. Open claude.ai in your browser")
    print("2. For each *-prompt.txt file:")
    print("   a. Copy the entire file contents")
    print("   b. Paste into a NEW claude.ai conversation")
    print("   c. Copy Claude's response (the JSON array)")
    print(f"  d. Save it as the matching *-response.txt file in:")
    print(f"     {BATCHES_DIR}")
    print("     e.g. screen-batch01-prompt.txt → screen-batch01-response.txt")
    print("3. Once all responses are saved, run:")
    print("   python3 ai-feedback-reclassify-manual.py merge")


# ── MODE 2: MERGE ─────────────────────────────────────────────────────────────

def merge():
    # Load original rows
    screen_rows    = open_csv(SCREEN_FILE)
    interview_rows = open_csv(INTERVIEW_FILE)

    for i, r in enumerate(screen_rows):
        r['_row_id'] = i
        r['source']  = 'screen'
        for col in FLAG_COLS:
            r[col] = False

    for i, r in enumerate(interview_rows):
        r['_row_id'] = i
        r['source']  = 'interview'
        for col in FLAG_COLS:
            r[col] = False

    screen_map    = {r['_row_id']: r for r in screen_rows}
    interview_map = {r['_row_id']: r for r in interview_rows}

    errors = 0
    applied = 0

    # Read all response files
    if not os.path.exists(BATCHES_DIR):
        print(f"ERROR: batches folder not found: {BATCHES_DIR}")
        print("Run 'prepare' mode first.")
        return

    response_files = sorted(f for f in os.listdir(BATCHES_DIR) if f.endswith('-response.txt'))
    if not response_files:
        print(f"No response files found in {BATCHES_DIR}")
        print("Expected files named like: screen-batch01-response.txt")
        return

    print(f"\nFound {len(response_files)} response file(s)")

    for fname in response_files:
        source = 'screen' if fname.startswith('screen') else 'interview'
        row_map = screen_map if source == 'screen' else interview_map
        fpath = os.path.join(BATCHES_DIR, fname)

        with open(fpath, encoding='utf-8') as f:
            raw = f.read().strip()

        # Strip markdown code fences if present
        if raw.startswith('```'):
            raw = '\n'.join(raw.split('\n')[1:])
        if raw.endswith('```'):
            raw = '\n'.join(raw.split('\n')[:-1])
        raw = raw.strip()

        try:
            results = json.loads(raw)
        except json.JSONDecodeError as e:
            print(f"  [ERROR] Could not parse {fname}: {e}")
            errors += 1
            continue

        for item in results:
            row_id = item.get('row_id')
            if row_id not in row_map:
                print(f"  [WARN] row_id {row_id} not found in {source} rows")
                continue
            row = row_map[row_id]
            row['content_flag']           = bool(item.get('content', False))
            row['performance_flag']       = bool(item.get('performance', False))
            row['ai_assistant_flag']      = bool(item.get('ai_assistant', False))
            row['uiux_flag']              = bool(item.get('uiux', False))
            row['core_functionality_flag'] = bool(item.get('core_functionality', False))
            applied += 1

        print(f"  ✓ {fname}  ({len(results)} rows applied)")

    print(f"\nTotal applied: {applied}  Errors: {errors}")

    # Write output CSVs
    print("\nWriting output CSVs...")
    write_csv(screen_rows,    OUT_SCREEN,    include_source=False)
    write_csv(interview_rows, OUT_INTERVIEW, include_source=False)
    write_csv(screen_rows + interview_rows, OUT_COMBINED, include_source=True)

    # Distribution summary
    for label, rows in [('screen', screen_rows), ('interview', interview_rows)]:
        print(f"\n  [{label}] flag distribution:")
        for col in FLAG_COLS:
            count = sum(1 for r in rows if r.get(col))
            pct = count / len(rows) * 100 if rows else 0
            print(f"    {col:<28} {count:>4}  ({pct:.1f}%)")

    print("\nDone.")


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else ''
    if mode == 'prepare':
        prepare()
    elif mode == 'merge':
        merge()
    else:
        print("Usage:")
        print("  python3 ai-feedback-reclassify-manual.py prepare")
        print("  python3 ai-feedback-reclassify-manual.py merge")

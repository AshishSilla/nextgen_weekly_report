"""
AI Feedback Reclassification — 5-Bucket LLM Tagging
Uses claude-haiku-4-5 to classify each feedback row into 5 boolean flags.
"""

import csv, io, json, os, time
import anthropic

# Load .env file from project root if ANTHROPIC_API_KEY not already set
_env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
if not os.environ.get('ANTHROPIC_API_KEY') and os.path.exists(_env_path):
    with open(_env_path) as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith('#') and '=' in _line:
                _k, _v = _line.split('=', 1)
                os.environ[_k.strip()] = _v.strip().strip('"').strip("'")

BASE           = "/Users/ashish/Downloads/NextGen 2026 Q2 Review"
SCREEN_FILE    = os.path.join(BASE, "AI Assistant Usage files/Nextgen Q1-2026 _ AI Assistant usage - Feedback from screen with AI Assistant.csv")
INTERVIEW_FILE = os.path.join(BASE, "AI Assistant Usage files/Nextgen Q1-2026 _ AI Assistant usage - Feedback from Interviews with AI Assistant.csv")
OUT_SCREEN     = os.path.join(BASE, "outputs/ai-feedback-reclassified-screen.csv")
OUT_INTERVIEW  = os.path.join(BASE, "outputs/ai-feedback-reclassified-interviews.csv")
OUT_COMBINED   = os.path.join(BASE, "outputs/ai-feedback-reclassified-combined.csv")

MODEL = "claude-haiku-4-5"
TEST_MODE = True   # ← set to False for full run

FLAG_COLS = [
    "content_flag",
    "performance_flag",
    "ai_assistant_flag",
    "uiux_flag",
    "core_functionality_flag",
]

SYSTEM_PROMPT = """You are a feedback classifier for HackerRank's NextGen developer assessment platform.

## Platform Context
HackerRank is a developer skill assessment platform used by companies to evaluate
software engineering candidates. The platform recently introduced a new question type
called **Code Repos** (also called Project Questions or Fullstack Projects). These are
multi-file coding environments — similar to a real codebase — where a server is
started, files are loaded into an in-browser IDE, and candidates solve real-world
engineering problems.

## Key Systems in This Platform
The following systems may be referenced in candidate or interviewer feedback:

1. **Code Repository / IDE Environment**
   - A multi-file project loads in a browser-based IDE when the test/interview starts
   - The repo can take time to initialize (clone, install dependencies, start server)
   - Historically, large/bulky repos caused slow load times — recently trimmed to be smaller
   - Candidates navigate a file tree, edit multiple files, and run the project in-browser
   - A terminal is available inside the IDE but candidates sometimes can't find it

2. **AI Assistant (Cursor-like)**
   - An AI coding assistant is embedded inside the IDE, similar to Cursor or GitHub Copilot
   - Candidates can ask it questions, request code suggestions, or get explanations
   - The goal is to mirror real-world development — candidates use AI as they would on the job
   - The AI assistant may: not appear/load, be slow to respond, give irrelevant or wrong answers,
     or be unavailable for certain question types
   - Feedback about "the AI", "the assistant", "AI tool", "chatbot", "copilot", or "suggestions"
     refers to this component

3. **Platform / Infrastructure**
   - The browser-based test/interview environment (not the IDE itself)
   - Includes: test loading, timer, submission flow, network connectivity, session management
   - "Platform is slow/laggy/buggy" often conflates repo load time with actual platform speed

4. **Question / Problem Content**
   - The problem statement, instructions, expected behavior, test cases, and difficulty level
   - Candidates may find questions unclear, too hard/easy, poorly scoped, or irrelevant
   - "The question was tricky" or "instructions were unclear" belongs here

5. **UI / UX**
   - The visual layout and navigation of the IDE and test interface
   - Common complaints: can't find the terminal, too many panels/buttons, confusing layout,
     don't know where to submit, preview not visible, screen feels cluttered

6. **Core IDE Functionality**
   - Built-in tools candidates expect: debugger, test runner, console/output panel,
     syntax highlighting, autocomplete (non-AI), language support
   - "There was no debugger", "test cases were missing", "couldn't run the code"

## Feedback Sources
Feedback comes from two types of users:
- **Candidates**: took the coding test or interview, may comment on their experience solving
  the problem, using the AI assistant, or navigating the environment
- **Interviewers / Test owners**: set up or observed the test, may comment on platform behavior,
  candidate experience, or tool quality

## Your Task
Classify the feedback below into 5 boolean categories. Set to true if the feedback
mentions or implies that topic — even partially or indirectly. A single feedback can
be true for multiple categories. Return ONLY valid JSON, no explanation.

Categories:
- content: feedback about the problem/question content (clarity, difficulty, relevance, instructions, test cases as part of the problem design)
- performance: platform slowness, lag, repo not loading, environment sluggish, long initialization time, freezing, crashing
- ai_assistant: AI assistant not available, not loading, slow to respond, wrong/irrelevant answers, unhelpful suggestions, or any negative complaint specifically about the AI tool
- uiux: navigation confusion, can't find terminal or UI elements, screen feels cluttered, layout is confusing, doesn't know how to use the interface
- core_functionality: missing or broken IDE features unrelated to AI — debugger absent, test runner broken, can't run code, console not working, submission issues"""

USER_TEMPLATE = """Feedback: "{feedback_text}"

Respond with exactly: {{"content": bool, "performance": bool, "ai_assistant": bool, "uiux": bool, "core_functionality": bool}}"""


def open_csv(path):
    with open(path, newline='', encoding='utf-8-sig') as f:
        lines = f.readlines()
    header_idx = next(i for i, l in enumerate(lines) if not l.strip().lower().startswith('query'))
    return list(csv.DictReader(io.StringIO(''.join(lines[header_idx:]))))


def classify(client, feedback_text):
    """Call Claude and return dict of 5 flags. Returns all False on error."""
    empty = {col: False for col in FLAG_COLS}
    text = (feedback_text or '').strip()
    if not text:
        return empty

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=128,
            system=SYSTEM_PROMPT,
            messages=[{
                "role": "user",
                "content": USER_TEMPLATE.format(feedback_text=text.replace('"', "'"))
            }]
        )
        raw = response.content[0].text.strip()
        if TEST_MODE:
            print(f"  [TEST] feedback: {text[:80]!r}")
            print(f"  [TEST] response: {raw}")
        data = json.loads(raw)
        return {
            "content_flag":           bool(data.get("content", False)),
            "performance_flag":       bool(data.get("performance", False)),
            "ai_assistant_flag":      bool(data.get("ai_assistant", False)),
            "uiux_flag":              bool(data.get("uiux", False)),
            "core_functionality_flag": bool(data.get("core_functionality", False)),
        }
    except Exception as e:
        print(f"  [WARN] classify error: {e!r} | feedback: {text[:60]!r}")
        return empty


def process_rows(client, rows, source_label):
    """Classify all rows; return annotated list."""
    results = []
    total = len(rows)
    non_empty = sum(1 for r in rows if (r.get('feedback') or '').strip())
    print(f"\n  {total} rows, {non_empty} non-empty → calling API for each non-empty row")

    if TEST_MODE:
        non_empty_seen = 0
        filtered = []
        for row in rows:
            if (row.get('feedback') or '').strip():
                filtered.append(row)
                non_empty_seen += 1
                if non_empty_seen >= 5:
                    break
            else:
                filtered.append(row)
        rows = filtered
        print(f"  [TEST MODE] limited to first 5 non-empty rows ({len(rows)} rows total)")

    for i, row in enumerate(rows, 1):
        flags = classify(client, row.get('feedback', ''))
        row_out = dict(row)
        row_out['source'] = source_label
        row_out.update(flags)
        results.append(row_out)

        if i % 100 == 0 or i == total:
            flagged = sum(1 for r in results if any(r[c] for c in FLAG_COLS))
            print(f"  {i}/{total} processed ({flagged} rows with ≥1 flag)")

        # Small delay to avoid rate-limiting
        if (row.get('feedback') or '').strip():
            time.sleep(0.1)

    return results


def write_csv(rows, path, include_source=False):
    if not rows:
        print(f"  [SKIP] no rows to write → {path}")
        return
    base_cols = [k for k in rows[0].keys() if k not in FLAG_COLS and k != 'source']
    extra = (['source'] if include_source else []) + FLAG_COLS
    fieldnames = base_cols + extra
    with open(path, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        w.writeheader()
        w.writerows(rows)
    print(f"  → {path}  ({len(rows)} rows)")


def print_distribution(label, rows):
    print(f"\n  [{label}] flag distribution:")
    for col in FLAG_COLS:
        count = sum(1 for r in rows if r.get(col))
        pct = count / len(rows) * 100 if rows else 0
        print(f"    {col:<28} {count:>4}  ({pct:.1f}%)")


# ── Main ──────────────────────────────────────────────────────────────────────
client = anthropic.Anthropic()

print("Loading screen feedback...")
screen_rows_raw = open_csv(SCREEN_FILE)
print(f"  {len(screen_rows_raw)} rows loaded")

print("Loading interview feedback...")
interview_rows_raw = open_csv(INTERVIEW_FILE)
print(f"  {len(interview_rows_raw)} rows loaded")

print("\nClassifying screen feedback...")
screen_rows = process_rows(client, screen_rows_raw, 'screen')

print("\nClassifying interview feedback...")
interview_rows = process_rows(client, interview_rows_raw, 'interview')

print("\nWriting output CSVs...")
write_csv(screen_rows,    OUT_SCREEN,    include_source=False)
write_csv(interview_rows, OUT_INTERVIEW, include_source=False)
write_csv(screen_rows + interview_rows, OUT_COMBINED, include_source=True)

print_distribution("screen",    screen_rows)
print_distribution("interview", interview_rows)
print_distribution("combined",  screen_rows + interview_rows)

# ── Spot-check: print 10 rows with non-empty feedback ─────────────────────────
print("\n── Spot-check (10 rows with non-empty feedback) ──")
checked = 0
for r in screen_rows:
    if (r.get('feedback') or '').strip() and checked < 10:
        flags_on = [c for c in FLAG_COLS if r.get(c)]
        print(f"  [{', '.join(flags_on) or 'none'}] {r['feedback'][:100]!r}")
        checked += 1

print("\nDone.")

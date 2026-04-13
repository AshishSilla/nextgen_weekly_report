# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repository Is

Analytics and reporting project for HackerRank's **NextGen** product. It produces insights from candidate feedback, AI-assisted testing data, scorecard signals, and support metrics — delivered as processed CSVs, PowerPoint decks, and HTML reports for quarterly business reviews and weekly stakeholder updates.

## Running Scripts

All scripts live in `outputs/scripts/`. Python scripts query live databases; JS scripts read processed CSVs and generate `.pptx` files.

```bash
# Python — data processing (requires .env with DB credentials)
python3 outputs/scripts/ai_assistant_feedback_summary.py   # → outputs/data/ai-assisted-*.csv
python3 outputs/scripts/nextgen_weekly_report.py --auto-discover

# Node — deck generation (requires pptxgenjs)
cd outputs && npm install                     # first time only
node scripts/ai-assistant-deck.js            # → outputs/decks/*.pptx
node scripts/coderepo-deck.js
node scripts/scorecard-ai-signals-deck.js
```

No build step, no lint config, no test suite. Scripts are standalone — run them directly.

## Credentials & Environment

Copy `.env.example` → `.env` and fill in:
- `ANTHROPIC_API_KEY` — Claude API (used in some scripts)
- StarRocks connection (host, user, password) — `bizops` cluster, `starrocks_bizops.analytics.*` tables
- Trino connection — data warehouse access

## Data Flow

```
data/raw/**/*.csv
  └─► outputs/scripts/*.py   (analyze, aggregate, classify)
        └─► outputs/data/*.csv   (processed metrics)
              └─► outputs/scripts/*.js   (deck generation)
                    └─► outputs/decks/*.pptx
                          outputs/reports/*.html
                          outputs/charts/*.png
```

Raw data is never modified. All generated files go under `outputs/`.

## Key Scripts

| Script | Purpose |
|--------|---------|
| `ai_assistant_feedback_summary.py` | WoW DLI + candidate remarks from StarRocks |
| `nextgen_weekly_report.py` | Weekly DevEx DLI & Feedback Trends JSON |
| `ai-feedback-reclassify.py` | Re-bucket feedback categories |
| `ai-feedback-bucket-timeline.py` | Bucket trends over time |
| `scorecard-ai-signals.py` | Scorecard AI signal extraction |
| `support-theme-trend.py` | Support ticket theme trends |
| `ai-assistant-deck.js` | AI Assistant insights deck |
| `coderepo-deck.js` | CodeRepo usage deck |
| `scorecard-ai-signals-deck.js` | Scorecard signals deck |
| `gen_feedback_doc.js` | Word doc from feedback CSVs |

## Source Data Layout

```
data/raw/
  ai-assistant/   ← Screen & interview feedback CSVs, classifier SQL
  coderepos/      ← CodeRepos usage & metrics (Q1-2026, Q3-26)
  support/        ← Support themes and ticket data
  companies/      ← CAM mapping files (all versions)
  interviews/     ← Scorecard CSVs and interview insights
```

## Branding

Every visual artifact (chart, deck, HTML, PDF) must use HackerRank 2026 brand guidelines. Reference: `hackerrank-brand/SKILL.md` or the `hackerrank-brand` skill.

- Primary accent: `#05C770` (Brand Green)
- Dark backgrounds: `#003333` (Dark Teal) / `#0E141E` (Deep Navy)
- Fonts: Manrope (body), Newsreader (headings), Geist Mono (code)

## Skills

- `nextgen-weekly-report` — orchestrates the full weekly report pipeline
- `hackerrank-brand` — applies brand guidelines to any visual output
- `pptx`, `docx`, `xlsx` — document generation helpers

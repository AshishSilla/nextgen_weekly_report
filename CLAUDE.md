# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repository Is

This is **Cowork Complete Guide** — an interactive 12-lesson course that teaches Claude Cowork by doing real work together. Claude acts as the teacher/instructor, not a general assistant. The course covers file organization, research synthesis, and document creation.

**Primary instruction file:** `START-HERE.md` — always read this first when a user asks to start a lesson or says "start", "begin", "lesson N", or "next lesson".

## How to Teach

Lessons are scripts in `lessons/`. Follow them exactly using these markers:

- **WAIT:** Stop talking and wait for the student to respond before continuing.
- **ACTION:** Do the thing described (create a file, read a folder, demonstrate something).
- **USER:** The expected student response — use it to recognise when to advance.

**Never break the fourth wall** — do not mention "the script", "my instructions", or that you're following a file.

**Navigation shortcuts:**

- `"start"` or `"begin"` → Read and start `lessons/01-first-contact.md`
- `"lesson 5"` → Read and start `lessons/05-inbox-pattern.md` from the beginning
- `"next"` or `"next lesson"` → Read the next lesson file and continue
- `"lesson [number]"` at any point → Jump to that lesson

## Lesson Files


| #   | File                               | Topic                                     |
| --- | ---------------------------------- | ----------------------------------------- |
| 1   | `lessons/01-first-contact.md`      | Cowork mental model — worker, not chatbot |
| 2   | `lessons/02-first-delegation.md`   | Delegate vs. ask                          |
| 3   | `lessons/03-done-framework.md`     | Prompting best practices                  |
| 4   | `lessons/04-file-organization.md`  | Content-aware sorting at scale            |
| 5   | `lessons/05-inbox-pattern.md`      | Reusable systems and skills               |
| 6   | `lessons/06-research-synthesis.md` | Multi-document analysis                   |
| 7   | `lessons/07-research-at-scale.md`  | Sub-agents and web search                 |
| 8   | `lessons/08-document-creation.md`  | Excel, PowerPoint, Word                   |
| 9   | `lessons/09-browser-automation.md` | Chrome basics and limitations             |
| 10  | `lessons/10-ai-employee.md`        | Batching and walking away                 |
| 11  | `lessons/11-skill-library.md`      | Build custom skills for your work         |
| 12  | `lessons/12-whats-next.md`         | Examples, resources, next steps           |


## Scenario Folders (Exercise Files)

Each lesson uses practice files from `scenarios/`. Don't reorganise or clean these up unless a lesson's ACTION marker explicitly instructs it.


| Folder                         | Used in                               |
| ------------------------------ | ------------------------------------- |
| `scenarios/first-task/`        | Lesson 2 — first delegation exercise  |
| `scenarios/done-framework/`    | Lesson 3 — Done Framework practice    |
| `scenarios/file-chaos/`        | Lesson 4 — file organisation at scale |
| `scenarios/customer-feedback/` | Lesson 6 — research synthesis         |
| `scenarios/large-corpus/`      | Lesson 7 — research at scale          |
| `scenarios/receipts/`          | Lesson 8 — document creation          |
| `scenarios/strategy-notes/`    | Lesson 8+ — document creation         |


## Project Folder Structure

```
data/
  raw/
    coderepos/      ← CodeRepos usage & rawdata CSVs (Q1-2026, Q3-26 content)
    ai-assistant/   ← AI Assistant usage CSVs (screens, interviews, feedback)
    support/        ← Support themes, issues, and ticket data
    companies/      ← Companies CAM mapping files (all versions)
    interviews/     ← Scorecard CSVs and interview insights

outputs/
  decks/            ← All .pptx presentation files
  scripts/          ← .js and .py generation scripts
  charts/           ← .png chart images
  data/             ← Generated/processed CSVs (ai-feedback-*, scorecard-*, etc.)
  node_modules/     ← JS dependencies (do not touch)
  package.json      ← Node dependencies manifest

hackerrank-brand/   ← Brand skill config (read-only)
```

## Branding
For any visual artifact (PDF, chart, slide, HTML, ER diagram, dashboard), apply the
HackerRank 2026 brand guidelines in `memory/company_branding.md` or via the
`hackerrank-brand` skill (`hackerrank-brand/SKILL.md`). Primary accent: `#05C770`, fonts: Manrope / Newsreader / Geist Mono.
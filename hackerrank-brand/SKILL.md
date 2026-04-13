---
name: hackerrank-brand
description: Applies HackerRank's 2026 brand guidelines (colors, fonts, layout rules) to any visual artifact. Use this skill whenever creating or styling slides, PDFs, HTML pages, reports, charts, ER diagrams, dashboards, or any other visual output — even if the user doesn't explicitly ask for "branding". Always apply these guidelines before finalizing the visual style of any artifact.
---

# HackerRank 2026 Brand Guidelines

Apply these guidelines to every visual artifact: slides, PDFs, HTML reports, charts, ER diagrams, dashboards, and any other output with a visual component.

**Keywords**: HackerRank, branding, brand colors, typography, visual identity, styling, corporate identity, slide design, dashboard design, HR brand, deck, presentation, hackerrank template

---

## How to Use This Skill (New Users — Start Here)

You don't need to know the brand guidelines to use this skill. Just describe what you want to build and ask Claude to apply the HackerRank template. Examples:

| What you want | What to say |
|---------------|-------------|
| A slide deck | *"Create a 5-slide product update deck using the HackerRank template"* |
| An HTML report | *"Build an HTML report for Q2 metrics — use HackerRank branding"* |
| A chart | *"Generate a bar chart of these numbers, styled with HackerRank colors"* |
| A dashboard | *"Make a dashboard HTML page using the HackerRank brand"* |
| Any document | *"Apply the HackerRank template to this"* |

Claude will automatically apply the correct colors, fonts, and layout rules from this skill — you don't need to specify them manually.

---

## Starter Templates

Copy-paste these as a starting point for any new artifact.

### HTML Page / Report

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>HackerRank Report</title>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700&family=Newsreader:wght@300;400&display=swap" rel="stylesheet" />
  <style>
    :root {
      --brand-green:    #05C770;
      --dark-teal:      #003333;
      --deep-navy:      #0E141E;
      --neutral-dark:   #222222;
      --neutral-mid:    #666666;
      --neutral-light:  #EEEEEE;
      --font-body:      'Manrope', sans-serif;
      --font-serif:     'Newsreader', serif;
      --font-size-base: 14px;
      --font-size-lg:   24px;
    }
    body {
      font-family: var(--font-body);
      font-size: var(--font-size-base);
      background: #fff;
      color: var(--neutral-dark);
      margin: 0; padding: 2rem;
    }
    h1, h2 {
      font-family: var(--font-serif);
      font-size: var(--font-size-lg);
      color: var(--dark-teal);
    }
    .accent { color: var(--brand-green); }
    .hero {
      background: var(--dark-teal);
      color: #fff;
      padding: 2rem;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="hero">
    <h1>Report Title</h1>
    <p>Subtitle or date range</p>
  </div>
  <!-- Add content here -->
</body>
</html>
```

### Python Chart (matplotlib)

```python
import matplotlib.pyplot as plt
import matplotlib as mpl

# HackerRank brand colors
HR_GREEN   = "#05C770"
HR_TEAL    = "#003333"
HR_NAVY    = "#0E141E"
HR_NEUTRAL = "#39424E"
ACCENTS    = ["#05C770", "#3355FF", "#E46962", "#FCF283", "#AA99FF"]

mpl.rcParams.update({
    "font.family":   "sans-serif",
    "font.sans-serif": ["Manrope", "Arial"],
    "axes.facecolor":  "#F4F4F3",
    "figure.facecolor": "white",
    "axes.edgecolor":  HR_NEUTRAL,
    "axes.labelcolor": HR_NAVY,
    "xtick.color":     HR_NEUTRAL,
    "ytick.color":     HR_NEUTRAL,
    "text.color":      HR_NAVY,
    "axes.titlesize":  16,
    "axes.labelsize":  12,
})

fig, ax = plt.subplots(figsize=(10, 5))
# ax.bar(categories, values, color=HR_GREEN)
ax.set_title("Chart Title", fontsize=16, color=HR_TEAL, fontweight="bold")
plt.tight_layout()
plt.savefig("output.png", dpi=150)
```

### PowerPoint Slide (python-pptx)

```python
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor

HR_GREEN = RGBColor(0x05, 0xC7, 0x70)
HR_TEAL  = RGBColor(0x00, 0x33, 0x33)
HR_NAVY  = RGBColor(0x0E, 0x14, 0x1E)
HR_WHITE = RGBColor(0xFF, 0xFF, 0xFF)

prs = Presentation()
slide = prs.slides.add_slide(prs.slide_layouts[6])  # blank layout

# Dark hero background
bg = slide.shapes.add_shape(1, 0, 0, prs.slide_width, Pt(120))
bg.fill.solid(); bg.fill.fore_color.rgb = HR_TEAL
bg.line.fill.background()

# Title text
txBox = slide.shapes.add_textbox(Inches(0.5), Inches(0.3), Inches(8), Inches(1))
tf = txBox.text_frame
tf.text = "Slide Title"
run = tf.paragraphs[0].runs[0]
run.font.size = Pt(24); run.font.bold = True
run.font.color.rgb = HR_WHITE; run.font.name = "Newsreader"

prs.save("output.pptx")
```

---

## Fonts

| Role | Typeface |
|------|----------|
| Primary body / UI text | **Manrope**, Manrope Medium |
| Serif headings / editorial | **Newsreader**, Newsreader Light |
| Code / monospace | **Geist Mono Medium** |

Font stack (CSS): `font-family: 'Manrope', sans-serif;`
Serif headings: `font-family: 'Newsreader', serif;`
Code: `font-family: 'Geist Mono', monospace;`

---

## Color Palette

### Primary Brand

| Token | Hex | Usage |
|-------|-----|-------|
| Brand Green | `#05C770` | CTA buttons, highlights, primary accent |
| Dark Teal | `#003333` | Dark backgrounds, section headers |
| Deep Navy | `#0E141E` | Darkest background (hero sections) |
| White | `#FFFFFF` | Light backgrounds, reversed text |

### Supporting Greens

| `#1BA84A` | `#AEF96C` | `#DBFFC2` | `#EFFFE5` |
|-----------|-----------|-----------|-----------|
| Medium green | Lime accent | Soft mint | Near-white green |

### Accent Palette

| Name | Hex | Name | Hex |
|------|-----|------|-----|
| Blue | `#3355FF` | Light Blue | `#73D3FB` |
| Pale Blue | `#C3EDFF` | Lavender | `#AA99FF` |
| Yellow | `#FCF283` | Peach | `#FABD83` |
| Coral | `#E46962` | — | — |

### Neutrals

| Token | Hex |
|-------|-----|
| Near-black | `#222222` |
| Dark gray | `#39424E` |
| Mid gray 1 | `#595959` |
| Mid gray 2 | `#666666` |
| Mid gray 3 | `#999999` |
| Light gray 1 | `#E0E0E2` |
| Light gray 2 | `#EEEEEE` |
| Light gray 3 | `#F4F4F3` |

---

## Layout & Typography Rules

- **Default content font size**: 14px
- **Large/contrast heading size**: 24px
- **Bullet indent**: 16pt (first level) / 32pt (second level)
- Use layout guides for alignment — never eyeball spacing
- Be **sparing with color**: use it to direct attention, not decorate
- Avoid wall-of-text layouts; break up dense content into digestible sections

---

## Slide / Presentation Guidelines

- Section title slides: use a **gradient** in the section's corresponding color
- All sub-section slides within a section: use the **same color** as the section title
- Agenda slides: use **table format** with dotted outlines/borders
- When importing slides from other decks: select **"Match styles in this presentation"**
- Oil painting aesthetic: only with brand team approval (use sparingly)
- Images: Midjourney reference — `--sref 557034247 --stylize 150 --chaos 55`

---

## Application Checklist

Before finalizing any artifact, verify:

- [ ] Fonts: Manrope for body, Newsreader for editorial headings, Geist Mono for code
- [ ] Primary accent is Brand Green (`#05C770`) — not a generic blue or default color
- [ ] Backgrounds use Dark Teal (`#003333`) or Deep Navy (`#0E141E`) for dark sections, White/light gray for light sections
- [ ] Color used sparingly — only where it adds meaning or directs attention
- [ ] Font sizes: 14px body, 24px large headings
- [ ] Layout is aligned; no floating or unanchored elements

---

## Quick Reference CSS Snippet

```css
:root {
  --brand-green:   #05C770;
  --dark-teal:     #003333;
  --deep-navy:     #0E141E;
  --white:         #FFFFFF;
  --accent-blue:   #3355FF;
  --accent-coral:  #E46962;
  --neutral-dark:  #222222;
  --neutral-mid:   #666666;
  --neutral-light: #EEEEEE;
  --font-body:     'Manrope', sans-serif;
  --font-serif:    'Newsreader', serif;
  --font-mono:     'Geist Mono', monospace;
  --font-size-base: 14px;
  --font-size-lg:   24px;
}
```

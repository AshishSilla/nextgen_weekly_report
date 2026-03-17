---
name: hackerrank-brand
description: Applies HackerRank's 2026 brand guidelines (colors, fonts, layout rules) to any visual artifact. Use this skill whenever creating or styling slides, PDFs, HTML pages, reports, charts, ER diagrams, dashboards, or any other visual output — even if the user doesn't explicitly ask for "branding". Always check this skill before finalizing the visual style of any artifact produced in this project.
---

# HackerRank 2026 Brand Guidelines

Apply these guidelines to every visual artifact: slides, PDFs, HTML reports, charts, ER diagrams, dashboards, and any other output with a visual component.

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

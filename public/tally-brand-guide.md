# Tally — Brand and Interface Guide

## 1. Brand direction

Tally is a light-mode household expense and budgeting app. Its identity should feel clear, independent and deliberately designed: closer to an editorial utility than a bank, lifestyle product or generic fintech dashboard.

The product should be quick to scan, fast to operate and calm without becoming soft or cosy.

**Brand characteristics**

- Bold, crisp and practical
- Graphic rather than illustrative
- Mature, contemporary and slightly unconventional
- Direct language and highly legible figures
- Light surfaces with controlled flashes of strong colour

**Core line:** Simple records. Clearer days.

## 2. Logo

The mark is an abstract geometric **H** constructed from two vertical columns and a diagonal division. The columns suggest a ledger, categories and balance. The diagonal introduces movement without becoming an arrow, graph or currency symbol.

### Primary mark

- Left geometry: Ultramarine
- Right geometry: Acid Lime
- Background: transparent
- Use without a surrounding container wherever possible
- Maintain generous clear space equal to at least one quarter of the mark's width
- Minimum digital size: 24 px high
- At sizes below 32 px, test manually for clarity

### Monochrome use

Use solid Graphite on pale backgrounds or solid Paper White on Ultramarine. Do not add outlines, gradients or shadows.

### Logo restrictions

Do not:

- Turn the mark into a house, roof or window
- Add coins, currency signs, ticks, wallets or bar charts
- Rotate, stretch or redraw the diagonal
- Add glow, gradients, bevels, textures or drop shadows
- Place it inside a rounded square unless required by an operating system
- Combine it with AI motifs, sparkles, circuits, robots or brains

## 3. Colour system

| Token | Hex | Purpose |
| --- | --- | --- |
| Paper White | `#FCFCF8` | Main application background |
| Ultramarine | `#3155D9` | Primary actions, active states and brand |
| Acid Lime | `#C8E63C` | Positive states, emphasis and category highlights |
| Tomato Red | `#F04E3E` | Overspend, warnings and destructive actions |
| Graphite | `#202124` | Primary text and monochrome logo |
| Cool Grey | `#E7E8EA` | Rules, dividers, input backgrounds and inactive tracks |
| Mid Grey | `#676B73` | Secondary labels and supporting information |
| White | `#FFFFFF` | Cards and raised working surfaces |

### Colour rules

- Paper White is the default page canvas; avoid pure white across the entire screen.
- Ultramarine is the dominant interactive colour.
- Acid Lime is an accent, not a page background. Pair it with Graphite text.
- Tomato Red is functional rather than decorative.
- Never rely on colour alone to communicate status; add labels, icons or values.
- Keep most screens approximately 75% neutral, 20% Ultramarine and 5% combined accent colours.

## 4. Design tokens

```css
:root {
  --ha-paper: #fcfcf8;
  --ha-white: #ffffff;
  --ha-ink: #202124;
  --ha-muted: #676b73;
  --ha-line: #e7e8ea;
  --ha-blue: #3155d9;
  --ha-lime: #c8e63c;
  --ha-red: #f04e3e;

  --ha-font-display: "Barlow Condensed", "Arial Narrow", sans-serif;
  --ha-font-body: "Inter", system-ui, sans-serif;

  --ha-radius-sm: 4px;
  --ha-radius-md: 8px;
  --ha-radius-lg: 12px;

  --ha-space-1: 4px;
  --ha-space-2: 8px;
  --ha-space-3: 12px;
  --ha-space-4: 16px;
  --ha-space-5: 24px;
  --ha-space-6: 32px;
  --ha-space-7: 48px;
}
```

## 5. Typography

Use **Barlow Condensed** for prominent headings and brand moments. Use **Inter** for interface text, labels, forms and numbers. If only one family is desired, use Inter throughout.

- Page title: 32–40 px, 600 weight, tight line height
- Section title: 20–24 px, 600 weight
- Main financial figure: 36–48 px, 700 weight, tabular numerals
- Body: 16 px, 400 weight
- Labels: 12–14 px, 500–600 weight
- Small metadata: minimum 12 px

All monetary figures should use tabular numerals and retain the user's preferred currency formatting.

## 6. Layout and surfaces

- Use a strict four- or eight-pixel spacing grid.
- Prefer asymmetric editorial layouts over identical card grids.
- Use thin rules and alignment to organise information.
- Cards should be white with a 1 px Cool Grey border.
- Keep corner radii restrained: generally 8 px, never pill-shaped by default.
- Avoid decorative shadows. If separation is essential, use `0 2px 8px rgb(32 33 36 / 6%)`.
- Use generous whitespace around totals and primary actions.

## 7. Core components

### Summary panel

Show the current period, total spent and remaining budget. The spent figure is visually dominant. Use a single horizontal progress track with labels, not a decorative chart.

### Expense rows

Each row should contain:

1. A small square category colour marker
2. Expense or category name
3. Optional date or note
4. Right-aligned tabular amount
5. Optional navigation indicator

Rows are divided by 1 px rules. Do not place every expense inside a separate floating card.

### Add-expense action

Use one prominent Ultramarine button labelled **Add expense**. It should be rectangular with an 8 px radius, not a floating circular plus button.

### Forms

- Put the amount first and make it the largest input.
- Use a visible currency prefix determined by settings.
- Make category selection a compact grid of labelled rectangular controls.
- Keep optional notes visually secondary.
- Preserve the last-used account and category where appropriate.

### Status and alerts

- Positive/on-budget: Acid Lime marker with Graphite text
- Neutral: Cool Grey with Graphite text
- Warning/overspend: Tomato Red with a clear text label
- Information: Ultramarine with Paper White or White text

## 8. Charts and data visualisation

- Prefer horizontal bars, simple lines and direct labels.
- Label values directly wherever space allows.
- Avoid 3D charts, gradients, gauges, doughnut charts and chart decoration.
- Use Ultramarine as the default data series.
- Reserve Tomato Red for overspend or negative variance.
- Use Acid Lime sparingly for targets achieved or available balance.
- Never use more than five colours in one chart.

## 9. Iconography

Use simple outline icons with consistent 1.5–2 px strokes. Icons are functional, not decorative. Pair unfamiliar icons with text.

Avoid house, piggy-bank and coin imagery as general decoration. A small home icon may be used only as a conventional navigation label for the Home screen.

## 10. Motion

- Keep transitions between 120 and 200 ms.
- Use simple fades, position shifts and progress updates.
- Respect reduced-motion settings.
- Do not use bouncing buttons, celebratory confetti or glowing effects.

## 11. Voice and language

Write plainly and confidently. Avoid banking jargon, guilt and exaggerated encouragement.

**Use:**

- `€456.20 remaining`
- `12% more than last month`
- `Add expense`
- `You have reached this month's dining budget.`
- `Nothing recorded today.`

**Avoid:**

- `Great job! You're absolutely smashing your savings!`
- `Financial wellness journey`
- `AI-powered money insights`
- `Oops! You overspent!`

## 12. Accessibility

- Meet WCAG 2.2 AA contrast for all text and controls.
- Do not use Acid Lime with white text.
- Provide visible keyboard focus using a 2 px Ultramarine outline and 2 px offset.
- Touch targets should be at least 44 × 44 px.
- Support 200% text zoom without hiding amounts or controls.
- Provide text equivalents for charts and trend indicators.
- Use semantic error messages that identify the field and correction needed.

## 13. Explicit exclusions

The interface must not drift back towards the rejected first concept. Do not use:

- Cosy household illustration
- Terracotta, sage or warm golden palettes
- Roof-shaped logos, house silhouettes, windows, trees or plants
- Coffee-table or lifestyle photography
- Excessively rounded cards or pill-shaped controls
- Dark-mode-first styling
- Generic fintech gradients or glowing effects
- AI imagery or AI-centred product language
- Film references associated with the app name

## 14. Implementation brief

Build Tally as a crisp, light-mode household expense tracker using the supplied tokens. Start with the monthly summary, expense list and add-expense flow. Establish typography, spacing and colour tokens before building components. Keep the visual hierarchy driven by numbers, alignment and rules rather than illustration or decorative cards. Treat this document and the standalone H mark as the source of truth for the initial product identity.

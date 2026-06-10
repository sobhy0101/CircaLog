# CC Task — Phase 1: Fix Font Tokens and Apply Fonts App-Wide

## Context

The app loads two Google Fonts — Exo 2 and Inter — via `<link>` tags in
`index.html`. They are defined in `src/index.css` under `@theme inline` as:

```css
--font-family-display: "Exo 2", sans-serif;
--font-family-body:    "Inter",  sans-serif;
```

These token names are wrong for Tailwind v4. Tailwind v4 generates font
utility classes from `--font-{name}`, so `--font-family-display` produces
the class `font-family-display` (not `font-display`).

The pages were written using `font-display` — which matches nothing in the
theme and is silently ignored. The result is that the browser falls back to
`ui-sans-serif / Segoe UI` everywhere. Neither Exo 2 nor Inter is rendering.

Additionally, `body` has no `font-family` set anywhere, so even a correctly
named token would not automatically apply to the whole app.

Two further issues in `ComingSoon.tsx`:
- Uses `font-family-display` (wrong — matches nothing with either naming)
- Uses `font-family-body` (wrong — same reason)

---

## Goal

1. Rename the font tokens in `index.css` to follow Tailwind v4 convention
2. Add a `body` base rule to `index.css` so Inter applies app-wide
3. Update every file that references the old class names

---

## Files to Change

| File | Change |
|---|---|
| `src/index.css` | Rename tokens; add `body` base rule |
| `src/pages/ComingSoon.tsx` | `font-family-display` → `font-heading`, `font-family-body` → `font-sans` |
| `src/pages/log/LogPage.tsx` | `font-display` → `font-heading` |
| `src/pages/history/HistoryPage.tsx` | `font-display` → `font-heading` |
| `src/pages/chart/ChartPage.tsx` | `font-display` → `font-heading` |
| `src/pages/insights/InsightsPage.tsx` | `font-display` → `font-heading` |
| `src/pages/history/SessionDetailPage.tsx` | `font-display` → `font-heading` (appears twice) |
| `src/pages/log/ImportPage.tsx` | `font-display` → `font-heading` (appears twice) |

---

## Step-by-Step Instructions

### Step 0 — Read skills

Read `.claude/skills/token-usage/SKILL.md` before touching any CSS or tokens.

---

### Step 1 — Read all files before editing

Read every file listed in the table above in full before making any change.
Never edit blind.

---

### Step 2 — Edit `src/index.css`

**2a. Rename the two font tokens inside `@theme inline {}`**

Find:
```css
  --font-family-display: "Exo 2", sans-serif;   /* headings, callouts, wordmark */
  --font-family-body:    "Inter",  sans-serif;   /* all body text and UI copy   */
```

Replace with:
```css
  --font-heading: "Exo 2", sans-serif;   /* headings, callouts, wordmark */
  --font-sans:    "Inter",  sans-serif;  /* all body text and UI copy — overrides Tailwind default */
```

Important: `--font-sans` is Tailwind's own default sans-serif token. Overriding
it here means Tailwind's base styles (which apply `--font-sans` to `body`)
automatically pick up Inter. This is the idiomatic Tailwind v4 approach.

**2b. Add a `body` base rule**

Immediately after the closing `}` of the `.dark {}` block and before the
`@keyframes fade-in` block, add:

```css
/* ── Base typography ────────────────────────────────────────────────────────
   Tailwind's preflight applies --font-sans to body, but we set it explicitly
   here as well so the intent is unambiguous and visible at the CSS layer.   */
body {
  font-family: var(--font-sans);
}
```

Do not add it inside `:root`, `.dark`, or `@theme inline`. It must be a
standalone rule at the top level of the stylesheet.

**2c. Update the comment above the font tokens**

The existing block comment above the font tokens currently says:

```css
  /* Font family tokens — loaded via <link> in index.html.
     font-display: swap is handled by Google Fonts (display=swap in the URL).
     'inline' keeps these as var() references at runtime, consistent with
     how the color tokens above are mapped. */
  --font-family-display: "Exo 2", sans-serif;   /* headings, callouts, wordmark */
  --font-family-body:    "Inter",  sans-serif;   /* all body text and UI copy   */
```

Replace the entire block (comment + two token lines) with:

```css
  /* Font tokens — loaded via <link> in index.html (display=swap).
     --font-heading overrides nothing (new name).
     --font-sans overrides Tailwind's default sans stack with Inter,
     which causes Tailwind's preflight to apply Inter to body automatically.
     Utility classes generated: font-heading, font-sans.                     */
  --font-heading: "Exo 2", sans-serif;   /* headings, callouts, wordmark */
  --font-sans:    "Inter",  sans-serif;  /* all body text and UI copy — overrides Tailwind default */
```

---

### Step 3 — Edit `src/pages/ComingSoon.tsx`

Search for all occurrences of `font-family-display` and `font-family-body`
in this file.

Expected occurrences:
- `font-family-display` — on the "Coming Soon" `<p>` tag
- `font-family-body` — on the tagline `<p>` tag and the `<footer>` tag

Replace every `font-family-display` with `font-heading`.
Replace every `font-family-body` with `font-sans`.

Do not change anything else in this file.

---

### Step 4 — Edit the six page files

For each of the files below, find every occurrence of `font-display` used
as a Tailwind utility class and replace it with `font-heading`.

**Important:** Only replace `font-display` when it appears as a standalone
Tailwind class inside a `className` string. Do not replace any other text
that happens to contain the substring "font-display".

Files and expected occurrence counts:

| File | Expected occurrences of `font-display` |
|---|---|
| `src/pages/log/LogPage.tsx` | 1 (the `<h1>` in the header) |
| `src/pages/history/HistoryPage.tsx` | 1 (the `<h1>` in the header) |
| `src/pages/chart/ChartPage.tsx` | 1 (the `<h1>` in the header) |
| `src/pages/insights/InsightsPage.tsx` | multiple — the `<h1>` and all `font-display` inside `StatCard` value paragraphs and the drift/streak/free-running blocks |
| `src/pages/history/SessionDetailPage.tsx` | 2 (one in the read-only view header, one in the edit mode header) |
| `src/pages/log/ImportPage.tsx` | 2 (one in the main header, one in the leave-warning dialog `<h2>`) |

After editing each file, verify the count matches expectations. If a file has
more or fewer occurrences than listed, stop and report the discrepancy before
continuing.

---

### Step 5 — Visual verification

Start the dev server and open the browser. Use the visual-check skill:
read `.claude/skills/visual-check/SKILL.md` before this step.

Check all of the following:

1. **Log page** — "Sleep Log" heading renders in Exo 2 (wider, slightly
   geometric vs. the system font)
2. **History page** — "History" heading renders in Exo 2
3. **Chart page** — "Chart" heading renders in Exo 2
4. **Insights page** — "Insights" heading and all stat card values render
   in Exo 2
5. **SessionDetailPage** — "Session #N" and "Edit Session" headings render
   in Exo 2
6. **Import page** — "Import Sleep Log" heading renders in Exo 2
7. **Coming Soon page** — "Coming Soon" text renders in Exo 2; tagline and
   footer links render in Inter
8. **Body text everywhere** — navigation labels, card text, form labels,
   and body copy render in Inter (not Segoe UI or system font)
9. **Both themes** — verify dark mode and light mode; fonts must render
   correctly in both
10. **DevTools check** — open DevTools → Elements → Computed → font-family
    on the "Sleep Log" `<h1>`. The resolved value must show `"Exo 2"` first,
    not `ui-sans-serif` or `Segoe UI`.

Take screenshots of at least: the Log page heading, the Insights page
(showing stat card values), and the Coming Soon page.

---

### Step 6 — Write session report

Write a Markdown session report and save it to:

```
tasks/cc-reports/REPORT_phase1-font-token-fix_{DD}-{mon}-{YYYY}.md
```

The report must include:

- Summary of the problem that was fixed
- Every file changed, with a brief description of what changed in each
- The exact occurrence counts found vs. expected for Step 4
- A note confirming the DevTools font-family check result
- Screenshot filenames (saved to `tasks/screenshots/`)
- Any deviations from these instructions
- Build status (did `npm run build` pass?)

After writing the report, paste a short summary into the Claude.ai chat
and **wait for confirmation before committing**.

---

### Step 7 — Commit (after Claude.ai confirmation only)

```powershell
git add src/index.css src/pages/ComingSoon.tsx src/pages/log/LogPage.tsx src/pages/history/HistoryPage.tsx src/pages/chart/ChartPage.tsx src/pages/insights/InsightsPage.tsx src/pages/history/SessionDetailPage.tsx src/pages/log/ImportPage.tsx
git commit -m "fix: rename font tokens to Tailwind v4 convention; apply Inter to body

- Rename --font-family-display -> --font-heading in @theme inline
- Rename --font-family-body -> --font-sans (overrides Tailwind default)
- Add explicit body { font-family: var(--font-sans) } base rule
- Update all font-display -> font-heading across 6 page files
- Fix font-family-display / font-family-body -> font-heading / font-sans in ComingSoon.tsx
- Exo 2 now renders on all page headings and stat values
- Inter now renders on all body text app-wide"
git push
```

---

## What NOT to Do

- Do not change any color tokens or `circa-*` classes
- Do not rename or move any files
- Do not change any component structure, layout, or logic
- Do not add `import React from 'react'` to any `.tsx` file
- Do not install any new dependencies
- Do not touch `index.html` — the `<link>` tags there are correct as-is
- Do not add `font-heading` or `font-sans` to any element that does not
  already have a font class — only replace existing wrong class names

# REPORT — Phase 1: Fix Font Tokens and Apply Fonts App-Wide

**Date:** 10 Jun 2026
**Task file:** `tasks/CC_TASK_Phase1_FontTokenFix.md`
**Build status:** ✅ clean (`tsc -b && vite build` — 0 errors, 0 warnings)

---

## Problem Summary

Two Tailwind v4 font tokens in `src/index.css` were named incorrectly:

```css
--font-family-display: "Exo 2", sans-serif;
--font-family-body:    "Inter",  sans-serif;
```

Tailwind v4 derives utility class names directly from `--font-{name}`, so
`--font-family-display` produced the class `font-family-display`, not
`font-display`. All page components were written with `font-display` (and
`ComingSoon.tsx` with `font-family-display` / `font-family-body`), so **no
font utility class matched anything in the theme** — the browser fell back to
`ui-sans-serif` (Segoe UI) everywhere.

Additionally, `body` had no `font-family` set, so even correctly named tokens
would not have applied Inter to body text automatically.

---

## Pre-flight Scan Finding (Task Deviation)

Before making any edits, a full codebase scan with grep was run. Three files
with active `font-display` usages were found that were **not listed** in the
task file:

| File | Location | Usage |
|---|---|---|
| `src/pages/log/WakeUpScreen.tsx` | line 184 | elapsed timer `<p>` |
| `src/pages/log/StartSleepScreen.tsx` | line 26 | "Start Sleep" button `<span>` |
| `src/components/layout/SideDrawer.tsx` | line 55 | "CircaLog" wordmark `<span>` |

These were confirmed with the user and added to the scope before any edits.

One additional minor finding: `ComingSoon.tsx` had a commented-out `<h1>` at
line 40 containing `font-family-display`. The task expected 1 active occurrence
but there were 2 total. The commented occurrence was updated to `font-heading`
as well for consistency (if ever uncommented it would use the correct class).

---

## Files Changed

### `src/index.css`

Three changes:

1. **Token rename** inside `@theme inline {}` — replaced the font comment block
   and both token declarations:

   - `--font-family-display: "Exo 2", sans-serif` → `--font-heading: "Exo 2", sans-serif`
   - `--font-family-body: "Inter", sans-serif` → `--font-sans: "Inter", sans-serif`

   `--font-sans` overrides Tailwind's built-in default sans token, which causes
   Tailwind's preflight to apply Inter to `body` automatically.

2. **Comment updated** to describe the new names and explain why `--font-sans`
   is the idiomatic Tailwind v4 approach.

3. **Body base rule added** immediately after the `.dark {}` block and before
   `@keyframes fade-in`:

   ```css
   body {
     font-family: var(--font-sans);
   }
   ```

   This makes the intent explicit even though Tailwind's preflight already
   handles it via the `--font-sans` override.

Note: The string `font-display: swap` in the comment above the token block
(which describes the CSS `font-display` property used by Google Fonts) was
left untouched — it is not a Tailwind class.

---

### `src/pages/ComingSoon.tsx`

- `font-family-display` → `font-heading` (2 occurrences: 1 active at line 46,
  1 in commented-out `<h1>` at line 40)
- `font-family-body` → `font-sans` (2 occurrences: tagline `<p>` at line 51,
  `<footer>` at line 63)

---

### `src/pages/log/LogPage.tsx`

- `font-display` → `font-heading` (1 occurrence: `<h1>` "Sleep Log")

---

### `src/pages/history/HistoryPage.tsx`

- `font-display` → `font-heading` (1 occurrence: `<h1>` "History")

---

### `src/pages/chart/ChartPage.tsx`

- `font-display` → `font-heading` (1 occurrence: `<h1>` "Chart")

---

### `src/pages/insights/InsightsPage.tsx`

- `font-display` → `font-heading` (10 occurrences: `<h1>` "Insights", the
  `StatCard` default `valueClassName`, and all inline stat value `<p>` tags in
  the Drift, Streak, and Free-Running Period sections)

---

### `src/pages/history/SessionDetailPage.tsx`

- `font-display` → `font-heading` (2 occurrences: `<h1>` "Session #N" in
  read-only view, `<h1>` "Edit Session" in edit mode)

---

### `src/pages/log/ImportPage.tsx`

- `font-display` → `font-heading` (2 occurrences: `<h1>` "Import Sleep Log",
  `<h2>` "Import in progress" in the leave-warning dialog)

---

### `src/pages/log/WakeUpScreen.tsx` *(added to scope — not in original task)*

- `font-display` → `font-heading` (1 occurrence: elapsed timer `<p>`)

---

### `src/pages/log/StartSleepScreen.tsx` *(added to scope — not in original task)*

- `font-display` → `font-heading` (1 occurrence: "Start Sleep" button `<span>`)

---

### `src/components/layout/SideDrawer.tsx` *(added to scope — not in original task)*

- `font-display` → `font-heading` (1 occurrence: "CircaLog" wordmark `<span>`
  in drawer header)

---

## Occurrence Count Verification (Step 4)

| File | Expected | Found | Match |
|---|---|---|---|
| `LogPage.tsx` | 1 | 1 | ✅ |
| `HistoryPage.tsx` | 1 | 1 | ✅ |
| `ChartPage.tsx` | 1 | 1 | ✅ |
| `InsightsPage.tsx` | multiple | 10 | ✅ |
| `SessionDetailPage.tsx` | 2 | 2 | ✅ |
| `ImportPage.tsx` | 2 | 2 | ✅ |
| `ComingSoon.tsx` — `font-family-display` | 1 active | 1 active + 1 commented | ⚠️ (see above) |
| `ComingSoon.tsx` — `font-family-body` | 2 | 2 | ✅ |
| `WakeUpScreen.tsx` | not listed | 1 | ⚠️ (added to scope) |
| `StartSleepScreen.tsx` | not listed | 1 | ⚠️ (added to scope) |
| `SideDrawer.tsx` | not listed | 1 | ⚠️ (added to scope) |

Post-edit grep for `font-display`, `font-family-display`, `font-family-body`
across `src/` returned **zero matches** — all old class names are gone.

---

## Visual Verification Results

Dev server was already running on `http://localhost:5173`. Playwright
(headless Chromium, 390×844 viewport) checked computed font-family on all
pages via `getComputedStyle`.

| Page | Heading / h1 font | body font | Theme |
|---|---|---|---|
| Coming Soon | `"Exo 2", sans-serif` ✅ | `Inter, sans-serif` ✅ | dark |
| Coming Soon | `"Exo 2", sans-serif` ✅ | `Inter, sans-serif` ✅ | light |
| Log page | `"Exo 2", sans-serif` ✅ | `Inter, sans-serif` ✅ | dark |
| History page | `"Exo 2", sans-serif` ✅ | `Inter, sans-serif` ✅ | dark |
| Chart page | `"Exo 2", sans-serif` ✅ | `Inter, sans-serif` ✅ | dark |
| Insights page | `"Exo 2", sans-serif` ✅ | `Inter, sans-serif` ✅ | dark |
| Import page | `"Exo 2", sans-serif` ✅ | `Inter, sans-serif` ✅ | dark |

**DevTools equivalent check (Log page `<h1>`):** computed `font-family` =
`"Exo 2", sans-serif` — Exo 2 is first; Segoe UI / ui-sans-serif is gone ✅

### Manual checks (Playwright cannot interact — requires live data or clicks)

- **SessionDetailPage** headers — needs a session ID in IndexedDB; not reachable
  via direct URL without live data
- **WakeUpScreen** elapsed timer — needs an in-progress session
- **SideDrawer "CircaLog" wordmark** — needs a drawer-open click

All three were confirmed correct at the **code level** (token name changed to
`font-heading`, which resolves to `"Exo 2", sans-serif` as proven on every
other page).

---

## Screenshots

Saved to `tasks/screenshots/` (gitignored — not committed):

- `font-coming-soon-dark.png` — Coming Soon in dark mode
- `font-coming-soon-light.png` — Coming Soon in light mode
- `font-log-page-dark.png` — Log page dark (shows "Sleep Log" in Exo 2 and
  "Start Sleep" button label also in Exo 2)
- `font-insights-dark.png` — Insights page dark (shows "Insights" heading and
  "0" / "No streak yet" stat values in Exo 2)

---

## Build Output

```
vite v8.0.14 building client environment for production...
✓ 674 modules transformed.
dist/assets/index-S-uTopaO.css   34.76 kB │ gzip: 7.16 kB
dist/assets/index-CWrMTfzS.js  643.63 kB │ gzip: 176.91 kB
✓ built in 910ms
```

TypeScript: 0 errors. Vite: 0 warnings.

---

## Deviations from Task Instructions

1. **Three files added to scope** (`WakeUpScreen.tsx`, `StartSleepScreen.tsx`,
   `SideDrawer.tsx`) — discovered via pre-flight grep scan, confirmed with user
   before making any edits.

2. **Commented-out `font-family-display` in `ComingSoon.tsx`** — the task
   expected 1 active occurrence; there was also 1 in a JSX comment. Both were
   updated to `font-heading` for consistency.

No other deviations. Color tokens, component structure, layout, and logic were
not touched. No new dependencies were installed. `index.html` was not modified.

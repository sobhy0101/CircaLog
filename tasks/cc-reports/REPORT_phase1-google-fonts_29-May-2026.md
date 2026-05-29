# Report — Phase 1: Google Fonts Integration

**Date:** 29 May 2026
**Performed by:** Claude.ai (Filesystem extension — no CC involvement)
**Scope:** Phase 1 — Design System
**Task:** Integrate Exo 2 (variable) and Inter (variable) via Google Fonts

---

## Steps completed

1. Updated `docs/CircaLog_DevPlan_QA.md` — Typography heading changed from
   `Exo 2 — Semibold (weight 600)` to `Exo 2 — variable weight`, reflecting that
   the 600 weight was specific to the logo and should not imply a global constraint.

2. Edited `index.html` — added immediately before `</head>`:
   - Two `<link rel="preconnect">` hints: `fonts.googleapis.com` and
     `fonts.gstatic.com` (with `crossorigin`)
   - `<link rel="stylesheet">` for Exo 2: full variable axis
     `ital,wght@0,100..900;1,100..900` with `display=swap`
   - `<link rel="stylesheet">` for Inter: full variable axis
     `ital,opsz,wght@0,14..32,100..900;1,14..32,100..900` with `display=swap`

3. Edited `src/index.css` — extended the existing `@theme inline` block with
   two font-family tokens:

   ```css
   --font-family-display: "Exo 2", sans-serif;   /* headings, callouts, wordmark */
   --font-family-body:    "Inter",  sans-serif;   /* all body text and UI copy   */
   ```

4. Updated `docs/CircaLog-TO-DO-list.md` — item checked off with a completion
   note recording the `<link>` vs `@import` decision and the weight-pruning deferral.

---

## Files created or modified

| File | Action |
|---|---|
| `docs/CircaLog_DevPlan_QA.md` | Modified — Typography heading updated |
| `index.html` | Modified — preconnect hints + font stylesheet links added |
| `src/index.css` | Modified — font-family tokens added to `@theme inline` |
| `docs/CircaLog-TO-DO-list.md` | Modified — item marked complete |

---

## Packages installed

None — this task required no dependency changes.

---

## Key decisions

**`<link>` over CSS `@import`:**
Google Fonts recommends `<link rel="stylesheet">` in `<head>` over `@import`
inside CSS. The `<link>` approach allows the browser to initiate the font
request in parallel with other resource loading; CSS `@import` is
render-blocking. Outcome is identical (fonts globally available) but load
performance is better with `<link>`.

**Full weight axis for both fonts:**
Weight pruning deferred to a future performance task. The app UI has not been
designed yet, so it is too early to know which weights will be used. Loading
the full axis now avoids having to revisit this file mid-design.

**`opsz` axis included for Inter:**
Inter's optical sizing axis (`14..32`) handles stroke and spacing adjustments
across size ranges automatically. It is part of Inter's variable spec and costs
nothing to include.

**Tokens inside `@theme inline`:**
Consistent with how color tokens are already mapped in the same block. `inline`
preserves `var()` references at runtime, which is the established pattern for
this project.

---

## Deviations from the To-Do item wording

The To-Do item said "Add `@import` in `index.css`". Font loading was placed in
`index.html` via `<link rel="stylesheet">` instead. This is a deliberate
performance upgrade — the functional outcome (fonts globally available to all
CSS) is identical. The `@theme inline` token step was completed as specified.

---

## Build / dev server

No build or dev server run was performed — this session was Claude.ai scope
(file edits only). Fonts should be verified visually the next time the dev
server runs.

---

## Next task

`Build dark/light mode toggle` — `useTheme` hook, `ThemeToggle` component,
and wiring into `App.tsx`.

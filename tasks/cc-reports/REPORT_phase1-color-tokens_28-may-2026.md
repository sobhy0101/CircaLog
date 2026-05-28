# REPORT — Phase 1: Color Tokens & Dark-Mode Infrastructure

**Date:** 28 May 2026
**Task file:** `tasks/CC_TASK_Phase1_ColorTokens.md`
**Status:** Complete

---

## Step 1 — Pre-flight: Read All Target Files

**Outcome: ✅ Succeeded**

All three files read before any edits were made.

- `src/index.css` — contained only `@import "tailwindcss";` and the two-line comment above it. Confirmed clean.
- `index.html` — no existing FOUC script, no `.dark` class on `<html>`. Confirmed clean.
- `src/pages/ComingSoon.tsx` — used raw Tailwind palette classes (`bg-neutral-950`, `bg-violet-950`, `border-violet-500`, `text-violet-300`, `text-white`, `text-violet-400`, `text-violet-200`, `text-neutral-400`, `text-neutral-700`). Confirmed all nine targets present.

---

## Step 2 — Verify the `@variant dark` Syntax

**Outcome: ✅ Succeeded**

Tailwind version confirmed:

```text
@tailwindcss/vite@4.3.0
tailwindcss@4.3.0
```

Syntax used:

```css
@variant dark (&:is(.dark *));
```

Build passed with zero errors on first attempt — no fallback to `@custom-variant` was needed. This is the correct syntax for Tailwind v4.3.0 stable.

---

## Step 3 — Update `src/index.css`

**Outcome: ✅ Succeeded**

Full file written with all three layers:

- `@variant dark (&:is(.dark *));` — overrides built-in dark variant to class strategy
- `:root { ... }` — 11 light-mode `--circa-*` CSS custom properties
- `.dark { ... }` — 11 dark-mode overrides
- `@theme inline { ... }` — 11 `--color-circa-*` mappings pointing to `var(--circa-*)` references

Build ran immediately after: zero errors, zero relevant warnings.

---

## Step 4 — Add FOUC-Prevention Script to `index.html`

**Outcome: ✅ Succeeded**

Inserted immediately after `<meta charset="UTF-8" />` as the first `<script>` element in `<head>`:

```html
<!-- FOUC prevention: reads the saved theme from localStorage and adds .dark
     to <html> before React renders, ensuring zero flash on first load.
     'circalog-theme' is the canonical key — the useTheme hook must match it. -->
<script>
  (function () {
    if (localStorage.getItem('circalog-theme') !== 'light') {
      document.documentElement.classList.add('dark');
    }
  }());
</script>
```

Placement verified: `<meta charset>` is still the first tag in `<head>`. No other `.dark` logic present in the file.

---

## Step 5 — Migrate `ComingSoon.tsx` to `circa-*` Token Utilities

**Outcome: ✅ Succeeded**

All nine replacements applied in a single editing pass:

| Removed | Replaced with |
|---|---|
| `bg-neutral-950` | `bg-circa-bg` |
| `bg-violet-950` | `bg-circa-accent-subtle` |
| `border-violet-500` | `border-circa-accent` |
| `text-violet-300` | `text-circa-accent-light` |
| `text-white` | `text-circa-text-primary` |
| `text-violet-400` | `text-circa-accent` |
| `text-violet-200` | `text-circa-accent-light` |
| `text-neutral-400` | `text-circa-text-secondary` |
| `text-neutral-700` | `text-circa-text-muted` |

File read back immediately after. No raw `violet-*` or `neutral-*` palette classes remain. All other classes, layout, tagline text, and comments are unchanged.

---

## Step 6 — Final Build and Visual Check

**Outcome: ✅ Succeeded**

### Build output

```text
vite v8.0.14 building client environment for production...
✓ 28 modules transformed.
dist/index.html                   2.71 kB │ gzip:  1.18 kB
dist/assets/index-ChgsFbsB.css   10.06 kB │ gzip:  2.86 kB
dist/assets/index-ILILwwkN.js   237.88 kB │ gzip: 76.07 kB
✓ built in 358ms
PWA v1.3.0 — 14 entries precached
```

Zero errors. Zero relevant warnings.

### Visual verification

Dev server started on `http://localhost:5173`. Playwright used for automated browser verification across three scenarios.

**Test 1 — No localStorage key (dark default)**

- `html class`: `"dark"` ✅
- `--circa-bg`: `#0F0F1E` ✅
- Screenshot: deep charcoal background, violet "Log" wordmark, light-violet "Coming Soon" heading, correct muted body and footer text

**Test 2 — `circalog-theme = 'light'` via localStorage**

- `html class`: `""` (no dark class) ✅
- `--circa-bg`: `#F8F8FF` ✅
- Screenshot: near-white violet-tinted background, dark near-black "Circa" wordmark, purple "Log", violet accents retained, correct dark body text

**Test 3 — localStorage key removed**

- `html class`: `"dark"` ✅
- `--circa-bg`: `#0F0F1E` ✅
- Dark mode correctly restored

FOUC prevention confirmed working: `.dark` is applied by the inline script before React renders, so no white flash is possible on first load.

---

## Step 7 — Update the TO-DO List

**Outcome: ✅ Succeeded**

In `docs/CircaLog-TO-DO-list.md`, the checklist item was marked complete:

```markdown
- [x] 🟢 Define CSS variables / Tailwind theme tokens
       (circa-bg/surface/surface-raised, circa-border/border-strong,
       circa-accent/accent-subtle/accent-light, circa-text-primary/secondary/muted —
       dark + light mode, @variant dark, FOUC script, ComingSoon.tsx migrated)
```

---

## Tailwind Version & Syntax Summary

| Item | Value |
|---|---|
| `@tailwindcss/vite` | 4.3.0 |
| `tailwindcss` | 4.3.0 |
| `@variant dark` syntax | `@variant dark (&:is(.dark *));` |
| `@custom-variant` needed | No |

---

## Deviations

None. All steps followed exactly as written.

The only note: Playwright was not pre-installed in the project. It was installed as a dev dependency (`npm install --save-dev playwright`) to perform the visual verification in Step 6. This is additive and does not affect production builds. Three verification screenshots were saved to `tasks/` and will not be committed.

---

## Files Modified

| File | Change |
|---|---|
| `src/index.css` | Full rewrite: added `@variant dark`, `:root` and `.dark` token blocks, `@theme inline` mapping |
| `index.html` | Inserted FOUC-prevention script after `<meta charset>` |
| `src/pages/ComingSoon.tsx` | Migrated 9 raw Tailwind palette classes to `circa-*` token utilities |
| `docs/CircaLog-TO-DO-list.md` | Marked token task item as complete |
| `package.json` / `package-lock.json` | Added `playwright` dev dependency for visual verification |

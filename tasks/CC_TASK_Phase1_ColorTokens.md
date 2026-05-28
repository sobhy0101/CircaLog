# CC TASK — Phase 1: Color Tokens & Dark-Mode Infrastructure

**Project:** CircaLog
**Root:** `C:\Projects\CircaLog\`
**Assigned to:** Claude Code
**Status:** 🔴 Not started

---

## Goal

Set up the complete color token system and dark-mode infrastructure for CircaLog:

1. Configure Tailwind v4's `@variant dark` to use the `.dark` class on `<html>`
   instead of the default `prefers-color-scheme` media query
2. Define `:root` (light mode) and `.dark` (dark mode) CSS variable sets with all
   `circa-*` color tokens
3. Map every token into Tailwind via `@theme inline` so utilities like `bg-circa-bg`,
   `text-circa-accent-light`, and `border-circa-border` work throughout the app
4. Add a FOUC-prevention script to `index.html` that sets `.dark` on `<html>` before
   React renders — ensuring zero flash on first load
5. Migrate `src/pages/ComingSoon.tsx` from raw Tailwind palette classes to `circa-*`
   token utilities as a proof-of-concept that the system works

---

## Context

### Why three separate CSS layers?

Tailwind v4 uses CSS-first configuration — there is no `tailwind.config.ts`.
Three directives work together here:

- **`@variant dark`** — overrides the built-in `dark:` variant from
  `prefers-color-scheme: dark` to a `.dark` class on `<html>`. Without this,
  dark-mode utilities respond to the OS setting and cannot be toggled by the user.

- **`@theme inline`** — registers CSS custom properties as Tailwind utility names
  while preserving `var()` references at runtime. Without the `inline` keyword,
  Tailwind resolves values at build time, hardcoding them — toggling `.dark` on
  `<html>` would have no effect on utility classes.

- **`:root` / `.dark` blocks** — standard CSS custom properties. Light-mode values
  live in `:root`; dark-mode values override them in `.dark`. The `@theme inline`
  block points Tailwind at these variables, so utilities inherit the active value.

### Two-layer naming pattern

| Layer | Example | Purpose |
|---|---|---|
| Raw variable | `--circa-bg` | Holds the actual hex value; changes per mode |
| Tailwind mapping | `--color-circa-bg: var(--circa-bg)` | Generates `bg-circa-bg`, `text-circa-bg`, etc. |

The `--color-` prefix is required by Tailwind v4 to generate color utilities.

### FOUC-prevention script

The script is three lines of vanilla JS placed inline in `<head>`. It reads
`localStorage.getItem('circalog-theme')` and adds `.dark` to `<html>` if the stored
value is not `'light'`. Because the script runs before any stylesheet is parsed, the
correct mode is active on the very first paint.

**Critical:** the localStorage key used here is `circalog-theme`. The future
`useTheme` hook must use the identical key — if they ever diverge, the FOUC
prevention breaks.

Default behavior: if no key is stored, the script adds `.dark` (dark mode is the app
default per Q25).

---

## ⚠️ Read Before Running Anything

- **Read every file listed in Step 1 before touching it.** Never edit blind.
- **Verify the `@variant dark` syntax** for the installed Tailwind v4 version before
  writing `index.css`. See Step 2 for the verification procedure.
- **Do not add font-family variables or Google Fonts.** Those belong in the
  Typography task (next batch). This task is color tokens only.
- **Do not add any React hooks or UI components.** The `useTheme` hook and
  `ThemeToggle` component belong in the Dark/Light Toggle task.
- The comment at the top of `src/index.css` must be preserved as-is. Read it first.

---

## Step 1 — Pre-flight: Read All Target Files

Read every file that will be modified in this session before touching any of them.

```bash
cat src/index.css
cat index.html
cat src/pages/ComingSoon.tsx
```

Confirm all three of the following before proceeding:

- ✅ `src/index.css` contains only `@import "tailwindcss";` and the comment above it
- ✅ `index.html` has no existing FOUC script and no `.dark` class on `<html>`
- ✅ `ComingSoon.tsx` uses raw Tailwind palette classes that will be replaced

If any of these checks fail, stop and report the discrepancy before continuing.

---

## Step 2 — Verify the `@variant dark` Syntax

Before writing any CSS, confirm the correct syntax for the installed version of
Tailwind v4. Run:

```bash
npm ls @tailwindcss/vite
cat node_modules/tailwindcss/package.json | grep '"version"'
```

The `@variant dark` syntax differs across early v4 releases:

| Syntax | When to use |
|---|---|
| `@variant dark (&:is(.dark *));` | Most common in stable v4 releases |
| `@custom-variant dark (&:is(.dark *));` | Used in some early v4 alpha/beta releases |

To verify which one works, write a minimal test in `src/index.css`, run
`npm run build`, and check for errors. Use whichever syntax builds without error.

Record the exact version and syntax used in the session report.

---

## Step 3 — Update `src/index.css`

Replace the entire file contents with the following. Preserve the comment at the top
of the existing file — include it verbatim as the first line.

```css
/* This single line imports all of TailwindCSS's utility classes.
   No other CSS setup needed — Tailwind generates everything from here. */
@import "tailwindcss";

/* Override the built-in dark: variant to use a .dark class on <html>
   instead of the default prefers-color-scheme media query.
   This is required for user-selectable theme switching.
   See Step 2 of CC_TASK_Phase1_ColorTokens.md for syntax verification. */
@variant dark (&:is(.dark *));

/* ── Light mode — :root values (active when .dark is absent) ────────────
   These are the default values the app uses in light mode.             */
:root {
  /* Backgrounds */
  --circa-bg:             #F8F8FF; /* App background — barely-there violet tint */
  --circa-surface:        #FFFFFF; /* Cards, panels */
  --circa-surface-raised: #EEECFF; /* Elevated cards, dropdowns */

  /* Borders */
  --circa-border:         #D0D0E8; /* Subtle dividers */
  --circa-border-strong:  #9090B8; /* Focused inputs, active borders */

  /* Accent — purple/violet */
  --circa-accent:         #7C3AED; /* Primary CTA, active states */
  --circa-accent-subtle:  #EDE9FE; /* Badge / chip backgrounds (light surface) */
  --circa-accent-light:   #5B21B6; /* Accent text on light surfaces */

  /* Text */
  --circa-text-primary:   #1A1A2E; /* Headings, body copy */
  --circa-text-secondary: #4A4A6A; /* Labels, captions */
  --circa-text-muted:     #8A8AAA; /* Placeholder, disabled */
}

/* ── Dark mode — .dark overrides (active when .dark is on <html>) ───────
   The FOUC-prevention script in index.html applies .dark before React
   renders, so the correct values are active on the very first paint.   */
.dark {
  /* Backgrounds */
  --circa-bg:             #0F0F1E; /* App background — deep charcoal */
  --circa-surface:        #17172A; /* Cards, panels */
  --circa-surface-raised: #1E1E35; /* Elevated cards, dropdowns */

  /* Borders */
  --circa-border:         #2D2D4A; /* Subtle dividers */
  --circa-border-strong:  #4A4A70; /* Focused inputs, active borders */

  /* Accent — identical base, different light variant */
  --circa-accent:         #7C3AED; /* Same in both modes — vivid enough */
  --circa-accent-subtle:  #2D1B6E; /* Muted accent background (dark surface) */
  --circa-accent-light:   #A78BFA; /* Accent text on dark surfaces */

  /* Text */
  --circa-text-primary:   #F0F0FA; /* Headings, body copy */
  --circa-text-secondary: #A0A0C0; /* Labels, captions */
  --circa-text-muted:     #5A5A7A; /* Placeholder, disabled */
}

/* ── Tailwind v4 theme mapping ──────────────────────────────────────────
   @theme inline maps each circa-* variable to a Tailwind utility name.
   'inline' is required — without it Tailwind resolves var() at build
   time and the runtime theme toggle won't work.
   These mappings generate: bg-circa-*, text-circa-*, border-circa-*, etc. */
@theme inline {
  --color-circa-bg:             var(--circa-bg);
  --color-circa-surface:        var(--circa-surface);
  --color-circa-surface-raised: var(--circa-surface-raised);
  --color-circa-border:         var(--circa-border);
  --color-circa-border-strong:  var(--circa-border-strong);
  --color-circa-accent:         var(--circa-accent);
  --color-circa-accent-subtle:  var(--circa-accent-subtle);
  --color-circa-accent-light:   var(--circa-accent-light);
  --color-circa-text-primary:   var(--circa-text-primary);
  --color-circa-text-secondary: var(--circa-text-secondary);
  --color-circa-text-muted:     var(--circa-text-muted);
}
```

### Verification

Run `npm run build`. It must complete with zero errors. If there are errors
related to `@variant dark` syntax, apply the corrected syntax found in Step 2
and record the deviation in the session report.

---

## Step 4 — Add FOUC-Prevention Script to `index.html`

Open `index.html`. Insert the following block immediately after
`<meta charset="UTF-8" />` — it must be the first `<script>` element in `<head>`.

### What to insert

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

### Why this placement?

`<meta charset>` must be the first tag in `<head>` per the HTML spec — it cannot
move. The FOUC script goes directly after it so `.dark` is applied before any
stylesheet is parsed. Placing it later risks a frame where light-mode values render.

### Verification

- Read `index.html` after saving
- Confirm `<meta charset="UTF-8" />` is still the first tag inside `<head>`
- Confirm the script block is the immediate next element
- Confirm no other `<html class="...">` or `.dark` logic exists elsewhere

---

## Step 5 — Migrate `ComingSoon.tsx` to `circa-*` Token Utilities

Open `src/pages/ComingSoon.tsx`. Apply the following class replacements exactly.
Do not change any other classes, structure, content, or comments.

### Replacement table

| Remove | Replace with |
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

Apply all replacements in one pass. Read the file back immediately after to confirm.

### Verification

- ✅ No raw Tailwind palette classes remain (no `violet-*`, no `neutral-*`,
  no `white` as a standalone text class)
- ✅ All nine replacements from the table above are applied
- ✅ All other classes, the tagline text, the layout, and all comments are unchanged

---

## Step 6 — Final Build and Visual Check

Run a clean build:

```bash
npm run build
```

Must complete with zero errors and no relevant warnings.

Then start dev server:

```bash
npm run dev
```

Open `http://localhost:5173` and verify all of the following:

- ✅ The coming soon page renders in **dark mode by default** — deep charcoal
  background (`#0F0F1E`), violet accents, light text
- ✅ No white flash visible on load or reload
- ✅ Open DevTools → Application → Local Storage → `http://localhost:5173`
  - If `circalog-theme` is absent: confirm dark mode is active
  - Add key `circalog-theme` with value `light`, reload — page must render in light
    mode (near-white background `#F8F8FF`, dark text, violet accents unchanged)
  - Delete the key, reload — dark mode must return
- ✅ Open DevTools → Elements — confirm `<html>` has `class="dark"` in dark mode
  and no `dark` class in light mode

---

## Step 7 — Update the TO-DO List

Open `docs/CircaLog-TO-DO-list.md`. Mark the token task item as complete.

Find this exact line:

```markdown
- [ ] 🟢 Define CSS variables / Tailwind theme tokens:
```

Replace the entire checklist item (the checkbox line and all its sub-bullets) with:

```markdown
- [x] 🟢 Define CSS variables / Tailwind theme tokens
       (circa-bg/surface/surface-raised, circa-border/border-strong,
       circa-accent/accent-subtle/accent-light, circa-text-primary/secondary/muted —
       dark + light mode, @variant dark, FOUC script, ComingSoon.tsx migrated)
```

---

## Step 8 — Write the Session Report

Write a Markdown session report and save it to `tasks/cc-reports/` using this
filename:

```text
REPORT_phase1-color-tokens_<DD>-<mon>-<YYYY>.md
```

Replace `<DD>-<mon>-<YYYY>` with today's actual date (e.g. `28-may-2026`).

The report must include:

- Every step and its outcome (✅ succeeded / ❌ failed / ⚠️ adapted)
- The Tailwind v4 version installed and the exact `@variant dark` syntax used
- Build output — confirm zero errors
- Visual verification results — dark default, FOUC prevention, light via localStorage
- Deviations — any step where these instructions were not followed exactly,
  and the reason why
- Final file list — every file modified in this session

**Markdownlint rules — zero warnings allowed:**

- Every fenced code block must have a blank line before the opening fence
- Every fenced code block must have a blank line after the closing fence
- This applies even when a label line immediately precedes a fence —
  always insert a blank line between the label and the opening fence

After writing the report, paste a short summary into the Claude.ai chat and
**wait for confirmation** before running the git commit.

---

## Step 9 — Commit

Only run this after Claude.ai has confirmed the session report:

```bash
git add .
git commit -m "feat: add circa-* color token system, dark-mode infrastructure, and FOUC prevention"
```

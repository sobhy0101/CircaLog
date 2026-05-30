# CC TASK — Phase 1: Dark/Light Mode Toggle

**Project:** CircaLog
**Root:** `C:\Projects\CircaLog\`
**Assigned to:** Claude Code
**Status:** 🔴 Not started

---

## Goal

Build the reactive UI layer for dark/light mode:

1. Create `src/hooks/useTheme.ts` — reads/writes `localStorage`, toggles the
   `.dark` class on `<html>`, exports `THEME_KEY` as a named constant
2. Create `src/components/ui/ThemeToggle.tsx` — a button that calls the hook
   and renders the appropriate icon
3. Mount `ThemeToggle` temporarily in `src/pages/AppShell.tsx` for testing
   (it will move to the side drawer in the App Shell task)
4. Update the FOUC comment in `index.html` to reference `THEME_KEY` in `useTheme.ts`

The FOUC-prevention script itself is already in place and must not be touched —
only its comment changes.

---

## Context

### What already exists

- `index.html` — FOUC script is live. It reads `localStorage.getItem('circalog-theme')`
  and adds `.dark` to `<html>` if the value is not `'light'`. Dark is the default.
- `src/index.css` — `@variant dark (&:is(.dark *))` is configured. All
  `circa-*` color tokens are defined and mapped via `@theme inline`.
- `src/hooks/useAppUpdate.ts` — the only existing hook; lives in `src/hooks/`.
- `src/components/ui/` — directory exists, contains only `.gitkeep`.
- `src/pages/AppShell.tsx` — minimal placeholder div, no imports yet.

### Design intent

`useTheme` does not use React Context. Each call site gets its own hook instance.
All instances share the DOM `.dark` class as the single source of truth. This is
an intentional architectural choice for V1 — do not add a Context wrapper.

### Key: `circalog-theme`

`'circalog-theme'` is the canonical localStorage key. It is shared between:

- The FOUC inline script in `index.html` (already written, must not change)
- The `useTheme` hook (being written now)

Exporting `THEME_KEY` as a named constant from `useTheme.ts` makes the key
refactorable from one place in the future, and makes the FOUC comment accurate.

---

## ⚠️ Read Before Running Anything

- **Read every file listed in Step 1 before touching any of them.**
- The FOUC script in `index.html` must not be modified — only its comment changes.
- Do not use React Context, `createContext`, or a Provider — this is intentional.
- Use only `circa-*` token utilities for all styling — no raw Tailwind palette classes.
  Read `.claude/skills/token-usage/SKILL.md` before writing any JSX.
- The `ThemeToggle` placement in `AppShell.tsx` is temporary scaffolding.
  Add a comment saying so — this will move to the side drawer later.
- All TypeScript must be strict-clean — no `any`, no unused imports.

---

## Step 1 — Pre-flight: Read All Target Files

Read every file that will be modified or created in this session.

```powershell
cat src/hooks/useAppUpdate.ts
cat src/pages/AppShell.tsx
cat index.html
```

Also read the relevant skill:

```powershell
cat .claude/skills/token-usage/SKILL.md
```

Confirm all of the following before proceeding:

- ✅ `src/hooks/useTheme.ts` does not exist yet
- ✅ `src/components/ui/ThemeToggle.tsx` does not exist yet
- ✅ `index.html` contains the FOUC script (the `(function () { ... }())` block)
- ✅ `AppShell.tsx` is the minimal placeholder (no existing imports to conflict)

If any check fails, stop and report before continuing.

---

## Step 2 — Create `src/hooks/useTheme.ts`

Create the file at `src/hooks/useTheme.ts` with this exact content:

```typescript
// useTheme.ts
//
// Reactive dark/light mode hook for CircaLog.
//
// Architecture note: this hook does NOT use React Context. Each call site
// gets its own instance. All instances share the <html> DOM class as the
// single source of truth — toggling .dark on the root element causes every
// component using circa-* tokens to re-render with the correct values.
// This is an intentional V1 choice; do not add a Context wrapper.
//
// THEME_KEY is exported as a named constant so the localStorage key is
// defined in exactly one place. The FOUC inline script in index.html uses
// the same key string — if this value ever changes, update that script too.

// The localStorage key used to persist the user's theme preference.
// Must match the key read by the FOUC inline script in index.html.
export const THEME_KEY = 'circalog-theme';

// Theme type — the only two valid stored values.
type Theme = 'dark' | 'light';

// Returns the active theme by reading the .dark class on <html>.
// This is the source of truth at runtime, not localStorage.
function getActiveTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

// Applies a theme to the DOM and saves it to localStorage.
function applyTheme(theme: Theme): void {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem(THEME_KEY, theme);
}

export function useTheme() {
  // Derive initial state from the DOM class — the FOUC script has already
  // set this correctly before React mounts, so there is no flash.
  const [theme, setThemeState] = React.useState<Theme>(getActiveTheme);

  // toggleTheme switches between dark and light, applies the change to the
  // DOM, saves it to localStorage, and updates local React state so any
  // component using this hook re-renders with the new icon/label.
  function toggleTheme(): void {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setThemeState(next);
  }

  return {
    theme,       // 'dark' | 'light' — the currently active theme
    isDark: theme === 'dark',
    toggleTheme,
  };
}
```

> **Note:** The `React` namespace is used unqualified (`React.useState`).
> Add `import React from 'react';` as the very first line of the file,
> before the comment block. The content above omits it only because
> formatting the import inside the code fence would require extra escaping —
> the import is required.

After creating the file, re-read it in full to confirm it was written correctly.

---

## Step 3 — Create `src/components/ui/ThemeToggle.tsx`

Create the file at `src/components/ui/ThemeToggle.tsx` with this exact content:

```tsx
// ThemeToggle.tsx
//
// A single icon button that switches between dark and light mode.
// Imports useTheme from the hook — no props needed.
//
// Temporary placement: mounted directly in AppShell.tsx for testing.
// This component will move to the side drawer in the App Shell task.

import React from 'react';
import { useTheme } from '@/hooks/useTheme';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      // circa-surface-raised gives the button a slightly elevated background
      // that stands out from the page surface in both dark and light modes.
      // circa-text-primary ensures the icon is always readable.
      // The focus ring uses circa-accent to match the app's accent colour.
      className="
        p-2 rounded-lg
        bg-circa-surface-raised
        text-circa-text-primary
        hover:bg-circa-accent-subtle
        hover:text-circa-accent-light
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-circa-accent
        transition-colors duration-150
      "
    >
      {/* Moon icon for dark mode (shown when app is currently dark — click to go light) */}
      {/* Sun icon for light mode (shown when app is currently light — click to go dark) */}
      {isDark ? (
        // Moon — indicates current mode is dark
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        // Sun — indicates current mode is light
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1"  x2="12" y2="3"  />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22"  x2="5.64" y2="5.64"  />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1"  y1="12" x2="3"  y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"  />
        </svg>
      )}
    </button>
  );
}
```

After creating the file, re-read it in full to confirm it was written correctly.

---

## Step 4 — Update `src/pages/AppShell.tsx`

Read the current contents of `src/pages/AppShell.tsx` first.

Replace the entire file with the following:

```tsx
// AppShell.tsx — the main PWA application shell (route: /log)
// This placeholder will be replaced with the full tab-based layout
// once routing is confirmed working.

import React from 'react';
import ThemeToggle from '@/components/ui/ThemeToggle';
// ThemeToggle is mounted here temporarily for testing.
// It will move to the side drawer in the App Shell task.

export default function AppShell() {
  return (
    // bg-circa-bg and text-circa-text-primary use the active theme tokens —
    // the background and text will switch correctly in both dark and light modes.
    <div className="min-h-screen bg-circa-bg flex flex-col items-center justify-center gap-4">
      <p className="text-circa-accent text-sm tracking-wide">
        CircaLog — app shell ✓
      </p>
      {/* Temporary: ThemeToggle placed here for visual testing.
          Will move to the side drawer once the App Shell task is complete. */}
      <ThemeToggle />
    </div>
  );
}
```

After writing the file, re-read it to confirm the import path and content are correct.

---

## Step 5 — Update the FOUC Comment in `index.html`

Read `index.html` first. Locate the FOUC prevention comment block — it currently reads:

```html
    <!-- FOUC prevention: reads the saved theme from localStorage and adds `.dark` to <html> before React renders, ensuring zero flash on first load.
         'circalog-theme' is the canonical key — the useTheme hook must match it. -->
```

Replace only that comment (the two-line HTML comment — do not touch the `<script>` block
itself) with the updated version below:

```html
    <!-- FOUC prevention: reads the saved theme from localStorage and adds `.dark` to <html> before React renders, ensuring zero flash on first load.
         The key string 'circalog-theme' is defined as THEME_KEY in src/hooks/useTheme.ts — if it ever changes, update it there and here together. -->
```

After saving, re-read the relevant section of `index.html` to confirm:

- ✅ The comment text is updated
- ✅ The `<script>` block below the comment is completely unchanged
- ✅ No other part of `index.html` was modified

---

## Step 6 — Build Verification

Run a clean build:

```powershell
npm run build
```

Must complete with zero errors. If there are TypeScript errors, fix them and
rebuild before proceeding. Document any errors and fixes in the session report.

---

## Step 7 — Visual Verification

Read `.claude/skills/run/SKILL.md` and `.claude/skills/visual-check/SKILL.md` before
running any browser checks.

Start the dev server if not already running:

```powershell
$conn = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
if (-not $conn) {
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run dev" -WindowStyle Hidden
    Start-Sleep -Seconds 3
}
```

Navigate to `http://localhost:5173/log` (the AppShell route).

Run the three standard theme scenarios from `.claude/skills/visual-check/SKILL.md`:

**Scenario 1 — Dark default (no stored preference)**

```js
await page.evaluate(() => localStorage.clear());
await page.reload();
const htmlClass = await page.evaluate(() => document.documentElement.className);
// htmlClass must include 'dark'
await page.screenshot({ path: 'tasks/screenshots/theme-toggle-dark-default.png' });
```

**Scenario 2 — Click ThemeToggle → switches to light mode**

```js
// Starting from dark default (Scenario 1 state)
await page.click('button[aria-label="Switch to light mode"]');
const htmlClassAfterClick = await page.evaluate(() => document.documentElement.className);
// htmlClassAfterClick must NOT include 'dark'
const stored = await page.evaluate(() => localStorage.getItem('circalog-theme'));
// stored must equal 'light'
await page.screenshot({ path: 'tasks/screenshots/theme-toggle-light-after-click.png' });
```

**Scenario 3 — Click ThemeToggle again → returns to dark mode**

```js
await page.click('button[aria-label="Switch to dark mode"]');
const htmlClassRestored = await page.evaluate(() => document.documentElement.className);
// htmlClassRestored must include 'dark'
const storedRestored = await page.evaluate(() => localStorage.getItem('circalog-theme'));
// storedRestored must equal 'dark'
await page.screenshot({ path: 'tasks/screenshots/theme-toggle-dark-restored.png' });
```

**Scenario 4 — Reload persistence**

```js
// Set light mode via localStorage, reload — must stay light without a click
await page.evaluate(() => localStorage.setItem('circalog-theme', 'light'));
await page.reload();
const htmlClassReload = await page.evaluate(() => document.documentElement.className);
// htmlClassReload must NOT include 'dark'
await page.screenshot({ path: 'tasks/screenshots/theme-toggle-light-persisted.png' });
```

Confirm all four scenarios pass before writing the session report.

---

## Step 8 — Update the TO-DO List

Open `docs/CircaLog-TO-DO-list.md`. Find this exact block (it starts with the
checkbox line and continues through the parenthetical note):

```markdown
- [ ] 🟢 Build dark/light mode toggle:
       - `useTheme` hook (reads/writes `localStorage` key `circalog-theme`)
       - Export `THEME_KEY = 'circalog-theme'` as a named constant from `useTheme.ts`
       - Update FOUC script comment in `index.html` to reference `THEME_KEY` in `useTheme.ts`
       - `ThemeToggle` component
       - Mount temporarily in `AppShell.tsx` for testing (will move to side drawer in the App Shell task below)
       (FOUC script is in the token task above; this task is the reactive UI layer)
```

Replace the entire block with:

```markdown
- [x] 🟢 Build dark/light mode toggle
       (useTheme hook with THEME_KEY export, ThemeToggle component with SVG icons,
       mounted temporarily in AppShell.tsx; FOUC comment updated to reference THEME_KEY)
```

---

## Step 9 — Write the Session Report

Write a Markdown session report and save it to `tasks/cc-reports/` using this
filename:

```text
REPORT_phase1-theme-toggle_<DD>-<mon>-<YYYY>.md
```

Replace `<DD>-<mon>-<YYYY>` with today's actual date (e.g. `30-may-2026`).

The report must include:

- Every step and its outcome (✅ succeeded / ❌ failed / ⚠️ adapted)
- Build output — confirm zero errors
- Visual verification results — all four scenarios with pass/fail for each check
- File list — every file created or modified in this session
- Deviations — any step where these instructions were not followed exactly,
  and the reason why

**Markdownlint rules — zero warnings allowed:**

- Every fenced code block must have a blank line before the opening fence
- Every fenced code block must have a blank line after the closing fence
- This applies even when a label line immediately precedes a fence

After writing the report, paste a short summary into the Claude.ai chat and
**wait for confirmation** before running the git commit.

---

## Step 10 — Commit

Only run this after Claude.ai has confirmed the session report:

```powershell
git add .
git commit -m "feat: add useTheme hook, ThemeToggle component, mount in AppShell"
```

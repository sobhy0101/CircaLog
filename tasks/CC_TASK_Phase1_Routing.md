# CC TASK — Phase 1: Routing & Layout

**Project:** CircaLog  
**Root:** `C:\Projects\CircaLog\`  
**Assigned to:** Claude Code  
**Status:** 🔴 Not started

---

## Goal

Install React Router and define the two top-level routes for CircaLog:

- `/` → Coming soon landing page (real designed page — dark background,
  logo placeholder, "coming soon" message)
- `/log` → Main PWA shell (placeholder component for now — real UI comes later)

This task covers all three routing items in Phase 1 of the TO-DO list and
is a prerequisite for every other Phase 1 task.

---

## ⚠️ Read This Before Running Anything

- **Read `src/App.tsx` before touching it.** It is currently a placeholder.
  You will replace its contents entirely in this task.
- **Read `src/main.tsx` before touching it.** You will wrap the app with
  `BrowserRouter` there.
- **Do not invent paths.** The folder structure is already scaffolded.
  Confirm with `ls src/pages/` before creating any file there.
- **Inline comments are required** on every non-obvious line. Mahmoud is
  learning React and needs to understand what each part does.
- **Stop on failure.** If any step produces an error, stop and report the
  exact error text before continuing.

---

## TO-DO Items This Task Covers

Mark each one `[x]` in `docs/CircaLog-TO-DO-list.md` as you complete it:

- [ ] 🔴 Set up React Router
- [ ] 🔴 Create route: `/log` → main PWA app
- [ ] 🔴 Create route: `/` → coming soon landing page

---

## Step 1 — Install React Router

```bash
cd C:\Projects\CircaLog
npm install react-router-dom
```

`react-router-dom` ships with its own TypeScript types — no `@types/`
package needed.

**Verify the install:**

```bash
npm ls react-router-dom
```

Confirm a version number is shown without errors before continuing.

---

## Step 2 — Wrap the App with BrowserRouter

Read `src/main.tsx` first, then update it to wrap `<App />` with
`<BrowserRouter>`.

`BrowserRouter` is what activates React Router for the entire app. It must
wrap everything — including the Vercel `SpeedInsights` and `Analytics`
components that are already there.

Replace the contents of `src/main.tsx` with:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // Enables URL-based routing for the whole app
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* BrowserRouter must wrap the entire app so all child components
        can access the current URL and navigate between routes */}
    <BrowserRouter>
      <App />
      <SpeedInsights />
      <Analytics />
    </BrowserRouter>
  </StrictMode>,
)
```

---

## Step 3 — Create the Coming Soon Page (`/`)

Create `src/pages/ComingSoon.tsx`.

This is a real designed page — not a bare placeholder. It will likely be
redesigned later (a proper logo hasn't been created yet), but it must be
presentable now: dark background, styled logo placeholder, and a
"coming soon" message.

```tsx
// ComingSoon.tsx — the landing page at circalog.app (route: /)
// This page is shown before the app launches publicly.
// The logo is a text placeholder — it will be replaced with an SVG logo later.

export default function ComingSoon() {
  return (
    // Full-screen dark background, centred layout
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center px-6 text-center">

      {/* ── Logo placeholder ───────────────────────────────────────────── */}
      {/* A styled circle with the initials "CL" stands in for the real logo.
          Replace this entire block when the actual SVG logo is ready. */}
      <div className="mb-8 flex flex-col items-center gap-4">
        <div
          className="
            w-24 h-24 rounded-full
            bg-violet-950 border-2 border-violet-500
            flex items-center justify-center
          "
        >
          {/* Initials placeholder — swap for <img> or <svg> when logo exists */}
          <span className="text-3xl font-bold tracking-widest text-violet-300 select-none">
            CL
          </span>
        </div>

        {/* App name — styled as the wordmark until a proper logo is designed */}
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Circa<span className="text-violet-400">Log</span>
        </h1>
      </div>

      {/* ── Headline ───────────────────────────────────────────────────── */}
      <p className="text-2xl font-semibold text-violet-200 mb-3">
        Coming Soon
      </p>

      {/* ── Tagline ────────────────────────────────────────────────────── */}
      <p className="max-w-sm text-neutral-400 text-base leading-relaxed">
        A sleep tracker built for Non-24-Hour Sleep–Wake Disorder.
        <br />
        Something's taking shape, hopefully in the dark.
      </p>

      {/* ── Subtle footer note ─────────────────────────────────────────── */}
      <p className="mt-16 text-xs text-neutral-700 select-none">
        circalog.app
      </p>

    </div>
  )
}
```

---

## Step 4 — Create the App Shell (`/log`)

Create `src/pages/AppShell.tsx`.

This is a placeholder. The real bottom tab bar, navigation, and page
layout come in a later task. For now, it just needs to confirm the route
is working.

```tsx
// AppShell.tsx — the main PWA application shell (route: /log)
// This placeholder will be replaced with the full tab-based layout
// once routing is confirmed working.

export default function AppShell() {
  return (
    // Same base colours as the rest of the app — dark background, white text
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <p className="text-violet-400 text-sm tracking-wide">
        CircaLog — app shell ✓
      </p>
    </div>
  )
}
```

---

## Step 5 — Wire the Routes in App.tsx

Read `src/App.tsx` first, then replace its entire contents with the
router configuration.

`Routes` and `Route` are the React Router components that map a URL path
to a page component. Each `<Route>` is one rule: "if the URL is X, render Y."

```tsx
// App.tsx — root component of CircaLog.
// Defines which page component renders for each URL path.

import { Routes, Route } from 'react-router-dom' // URL-to-component mapping
import ComingSoon from '@/pages/ComingSoon'       // Route: /
import AppShell   from '@/pages/AppShell'         // Route: /log

export default function App() {
  return (
    <Routes>
      {/* / → coming soon landing page */}
      <Route path="/" element={<ComingSoon />} />

      {/* /log → the main PWA application */}
      <Route path="/log" element={<AppShell />} />
    </Routes>
  )
}
```

---

## Step 6 — Verification

Start the dev server:

```bash
npm run dev
```

Check all of the following:

- ✅ `http://localhost:5173/` → shows the dark coming soon page with the
  "CL" logo circle, "CircaLog" wordmark, and "Coming Soon" text
- ✅ `http://localhost:5173/log` → shows the dark placeholder with
  "CircaLog — app shell ✓" in violet
- ✅ No console errors in the browser DevTools
- ✅ No TypeScript errors in the terminal

Stop the dev server (`Ctrl+C`) and run the linter:

```bash
npm run lint
```

Should complete with zero errors. Stop if any error appears — report it
before continuing.

---

## Step 7 — Update the TO-DO List

Open `docs/CircaLog-TO-DO-list.md` and mark all three items as complete:

```markdown
- [x] 🔴 Set up React Router
- [x] 🔴 Create route: `/log` → main PWA app
- [x] 🔴 Create route: `/` → coming soon landing page
```

---

## Step 8 — Write the Session Report

Write a comprehensive Markdown session report and save it to
`tasks/cc-reports/` using this filename:

```text
REPORT_phase1-routing_<DD>-<mon>-<YYYY>.md
```

Replace `<DD>-<mon>-<YYYY>` with today's actual date (e.g. `26-may-2026`).

The report must include:

- Every step and its outcome (✅ succeeded / ❌ failed / ⚠️ adapted)
- Packages installed — name and exact installed version for each
- Dependency warnings — full warning text and how it was resolved
- Build/lint output — clean confirmation or full error text
- Verification results — what URLs were checked and what was seen
- Deviations — any step where these instructions were not followed exactly,
  and the reason why
- Final file list — every file created or modified in this session

**Markdownlint rules — zero warnings allowed:**

- Every fenced code block must have a blank line before the opening fence
- Every fenced code block must have a blank line after the closing fence
- No exceptions — even when a label line immediately precedes the block

After writing the report, **paste a short summary into the Claude.ai chat
and wait for confirmation** before running the git commit.

---

## Step 9 — Commit

Only run this after Claude.ai has confirmed the session report:

```bash
git add .
git commit -m "feat: Phase 1 routing — React Router, ComingSoon page, AppShell placeholder"
```

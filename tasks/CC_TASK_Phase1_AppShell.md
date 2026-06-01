# CC Task — Phase 1, Batch 3: App Shell & Navigation

**Project:** CircaLog  
**Phase:** 1  
**Batch:** 3  
**Task file:** `tasks/CC_TASK_Phase1_AppShell.md`  
**Touches:** `src/pages/AppShell.tsx`, `src/components/layout/BottomTabBar.tsx`,
`src/components/layout/SideDrawer.tsx`, `docs/CircaLog-TO-DO-list.md`,
`tasks/cc-reports/REPORT_phase1-app-shell_{DD}-{mon}-{YYYY}.md`

---

## Context

`AppShell.tsx` is currently a placeholder — it renders a centered text label
and a temporary `ThemeToggle` for testing. This task replaces that placeholder
with the real PWA layout: a persistent bottom tab bar, a slide-in side drawer,
and an outlet area for page content.

`ThemeToggle` moves from `AppShell.tsx` into the drawer as one of the drawer
links. The temporary placement is removed.

**State architecture (already decided — do not change):**  
`isDrawerOpen` + `setIsDrawerOpen` live in `AppShell`. They are passed as props
to `BottomTabBar` (which contains the hamburger button that opens the drawer)
and to `SideDrawer` (which reads the state to show/hide itself and can close
itself). No Context, no separate hook for this state.

---

## Before You Start

Read the following files in full before writing any code:

1. `src/pages/AppShell.tsx` — the current placeholder you are replacing
2. `src/components/ui/ThemeToggle.tsx` — moving into the drawer; understand
   its props and usage
3. `src/hooks/useTheme.ts` — used inside ThemeToggle; no changes needed,
   just understand the pattern
4. `src/index.css` — confirm the `circa-*` token names available for styling
   (e.g. `circa-bg`, `circa-surface`, `circa-surface-raised`, `circa-accent`,
   `circa-text-primary`, `circa-text-secondary`, `circa-border`)
5. `.claude/skills/token-usage/SKILL.md` — token usage conventions; follow
   these when writing any Tailwind classes that reference `circa-*` tokens
6. `.claude/skills/visual-check/SKILL.md` — visual verification steps to
   follow after completing the build
7. `.claude/skills/run/SKILL.md` — how to start the dev server in this project

---

## Step 1 — Verify the dev environment

Run the dev server per `.claude/skills/run/SKILL.md` and confirm it starts
without errors. Note any existing warnings.

Do **not** open a browser yet — that comes after the build steps.

---

## Step 2 — Create `src/components/layout/` directory

If it does not exist, create the directory:

```
src/components/layout/
```

No files yet — just the folder. Confirm it exists before proceeding.

---

## Step 3 — Create `BottomTabBar.tsx`

**File:** `src/components/layout/BottomTabBar.tsx`

This component renders the persistent bottom navigation bar with four tabs
and the hamburger button that opens the side drawer.

### Props interface

```ts
interface BottomTabBarProps {
  onOpenDrawer: () => void;
}
```

### Tab structure

Four tabs, left to right:

| Label | Icon | Route (future) |
|---|---|---|
| Log | Pencil / edit icon | `/log` |
| Chart | Bar chart icon | `/log/chart` (V1 placeholder) |
| History | Clock / list icon | `/log/history` (V1 placeholder) |
| Insights | Sparkle / lightbulb icon | `/log/insights` (V1 placeholder) |

The hamburger icon sits at the far **left** of the bar, before the tabs, or
at the far **right** — your choice of which feels cleaner, but be consistent
with the drawer opening from the left side. Place the hamburger on the **left**
(drawer opens from left → trigger on left is standard UX).

### Layout requirements

- Fixed to the bottom of the viewport: `fixed bottom-0 left-0 right-0`
- Background: `bg-circa-surface` with a subtle top border `border-t border-circa-border`
- Height: `h-16` (64px) as a minimum; tabs must be comfortably tappable
- **Bottom padding for system navigation bars:** add `pb-safe` if using the
  Tailwind safe-area plugin, OR use `padding-bottom: env(safe-area-inset-bottom)`
  via an inline style. Confirm which approach works in this project by checking
  whether `tailwind-safe-area` or `@tailwindcss/safe-area` is installed
  (`package.json`). If neither is installed, use the inline style approach:
  ```tsx
  style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
  ```
  Do **not** install a new package for this — the inline style is sufficient
  for V1.
- Each tab: `flex flex-col items-center justify-center gap-1`, equal width,
  `text-xs` label below the icon
- Active tab styling: `text-circa-accent` (accent colour)
- Inactive tab styling: `text-circa-text-secondary`
- For V1, the "active" tab is hardcoded to **Log** — no routing logic yet.
  Add a `TODO` comment noting that active state will be driven by the current
  route in a future batch.
- Hamburger button: icon-only, no label, `aria-label="Open menu"`,
  same height as the bar, adequate tap target (`min-w-[44px] min-h-[44px]`)

### Icons

Use inline SVG for all icons — do **not** install an icon library.
Keep icons simple (stroke-based, 20×20 or 24×24 viewBox).
Refer to the existing `ThemeToggle.tsx` for the inline SVG pattern.

Suggested icons (simple strokes — adapt as needed):

- **Hamburger:** three horizontal lines
- **Log (Pencil):** a simple pencil/edit shape
- **Chart (Bar chart):** three vertical bars of different heights
- **History (Clock):** a circle with clock hands
- **Insights (Sparkle):** a four-point star or simple lightbulb outline

### Do not add

- No `import React from 'react'` in `.tsx` files (project uses automatic JSX
  transform + `noUnusedLocals`; this will cause a TS error)
- No routing logic beyond the hardcoded active tab placeholder

---

## Step 4 — Create `SideDrawer.tsx`

**File:** `src/components/layout/SideDrawer.tsx`

This component is the left-side slide-in drawer. It contains secondary
navigation links and the `ThemeToggle`.

### Props interface

```ts
interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}
```

### Layout & animation

- The drawer slides in from the **left**
- Width: `w-72` (288px) — wide enough for comfortable touch targets
- Full viewport height: `h-full fixed top-0 left-0`
- Z-index: high enough to sit above the tab bar and content (`z-50`)
- Background: `bg-circa-surface`
- Right border: `border-r border-circa-border`

**Slide animation using Tailwind transitions:**

```tsx
<div
  className={`
    fixed top-0 left-0 h-full w-72 z-50
    bg-circa-surface border-r border-circa-border
    transform transition-transform duration-300 ease-in-out
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `}
>
```

**Backdrop overlay** — a semi-transparent overlay behind the drawer that,
when tapped, closes the drawer:

```tsx
{isOpen && (
  <div
    className="fixed inset-0 z-40 bg-black/50"
    onClick={onClose}
    aria-hidden="true"
  />
)}
```

Render the overlay **before** the drawer panel in the JSX so the drawer
sits on top.

### Drawer header

At the top of the drawer panel:
- App name: `CircaLog` in `circa-accent` colour, Science Gothic font if
  available via the `font-science-gothic` class, else default heading font
- A close button (`✕` or an X icon) on the right side of the header row,
  `aria-label="Close menu"`, calls `onClose`
- Bottom border separating header from links: `border-b border-circa-border`

### Navigation links

A vertical list of links below the header. For V1 these are **non-functional
placeholders** — render them as `<button>` elements (not `<a>` tags, since
routes don't exist yet) with a `TODO` comment on each noting it will become
a real route link in a future batch.

Links in order:

1. Settings
2. Reports
3. Export
4. About
5. Privacy Policy
6. Terms & Conditions

Link styling:
- Full width, left-aligned, `px-6 py-3`
- `text-circa-text-primary` default, `hover:bg-circa-accent-subtle` on hover
- `text-sm`
- Add a simple icon before each label (inline SVG, same approach as tab bar).
  Keep icons minimal — a gear for Settings, document for Reports/Export, info
  circle for About, shield for Privacy, scroll for Terms.

### Dark mode toggle section

Below the navigation links, add a horizontal separator (`border-t border-circa-border`)
and then a row that contains:

- Label: `"Dark mode"` in `text-circa-text-secondary text-sm`
- `<ThemeToggle />` on the right side of the row

Import `ThemeToggle` from `@/components/ui/ThemeToggle`.

### Do not add

- No `import React from 'react'` (same rule as above)
- No routing or actual navigation logic — all links are placeholder buttons
  for now

---

## Step 5 — Rewrite `AppShell.tsx`

**File:** `src/pages/AppShell.tsx`

Replace the current placeholder entirely. This is the new version:

### What it must do

- Hold `isDrawerOpen` state with `useState(false)`
- Render `SideDrawer` with `isOpen={isDrawerOpen}` and
  `onClose={() => setIsDrawerOpen(false)}`
- Render `BottomTabBar` with `onOpenDrawer={() => setIsDrawerOpen(true)}`
- Render a main content area between the top of the viewport and the tab bar
- Apply bottom padding to the content area equal to the tab bar height so
  content is never hidden behind it

### Structure

```tsx
// The outer wrapper fills the viewport
<div className="min-h-screen bg-circa-bg text-circa-text-primary flex flex-col">

  {/* Side drawer (fixed, sits above everything) */}
  <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

  {/* Main scrollable content area */}
  {/* pb-16 = 64px = tab bar height, so content clears the tab bar */}
  {/* Add env(safe-area-inset-bottom) on top of that if not handled in tab bar */}
  <main className="flex-1 overflow-y-auto pb-16">
    {/* Page content will be rendered here via React Router <Outlet> in a
        future batch. For now, render a placeholder. */}
    <div className="flex items-center justify-center h-full min-h-[calc(100vh-4rem)]">
      <p className="text-circa-accent text-sm tracking-wide">
        CircaLog — app shell ✓
      </p>
    </div>
  </main>

  {/* Bottom tab bar (fixed to bottom) */}
  <BottomTabBar onOpenDrawer={() => setIsDrawerOpen(true)} />

</div>
```

### Imports

```tsx
import { useState } from 'react';
import BottomTabBar from '@/components/layout/BottomTabBar';
import SideDrawer   from '@/components/layout/SideDrawer';
```

Remove the old `ThemeToggle` import — it is no longer used directly in
`AppShell`. It is now inside `SideDrawer`.

### Do not add

- No `import React from 'react'`
- No `<Outlet />` yet — that comes in a future routing batch
- Do not touch `App.tsx` or `ComingSoon.tsx`

---

## Step 6 — TypeScript and lint check

Run:

```bash
npx tsc --noEmit
```

Resolve all errors before continuing. Common things to watch for:

- Missing props on components
- `React` imported but unused in a `.tsx` file (remove it)
- Named imports used as default imports or vice versa

---

## Step 7 — Build check

Run:

```bash
npm run build
```

Confirm zero errors and zero warnings. If Vite reports any warnings (unused
imports, unresolved aliases), fix them before continuing.

---

## Step 8 — Visual verification

Follow `.claude/skills/visual-check/SKILL.md` to open the app in the browser.

Navigate to `/log` and verify all of the following:

**Bottom tab bar**
- [ ] Tab bar is visible and fixed to the bottom
- [ ] Four tabs render: Log, Chart, History, Insights — each with icon and label
- [ ] Hamburger icon is visible on the left of the bar
- [ ] Log tab is styled with accent colour (active state)
- [ ] Other tabs are styled with secondary text colour
- [ ] No content is hidden behind the tab bar

**Side drawer — open**
- [ ] Tapping/clicking the hamburger icon opens the drawer from the left
- [ ] Drawer slides in with a smooth animation
- [ ] A semi-transparent backdrop appears behind the drawer
- [ ] Drawer header shows "CircaLog" and a close button
- [ ] All six navigation links are visible
- [ ] Dark mode toggle row is visible at the bottom of the drawer

**Side drawer — close**
- [ ] Clicking the close button (✕) closes the drawer
- [ ] Clicking the backdrop closes the drawer
- [ ] Drawer slides back out to the left smoothly

**Theme toggle in drawer**
- [ ] ThemeToggle button works — clicking it switches between dark and light
- [ ] Page background, tab bar, and drawer all update correctly when theme changes

**Responsive check**
- [ ] Open browser DevTools, switch to a mobile viewport (e.g. iPhone 12 Pro,
  390×844). Confirm the tab bar is not obscured by the browser chrome or
  system navigation area.

Document any visual issues found and fix them before the report step.

---

## Step 9 — Update TO-DO list

Open `docs/CircaLog-TO-DO-list.md` and mark the following items as complete
by changing `[ ]` to `[x]`:

```
- [x] 🟡 Build base app shell (bottom tab bar + side drawer layout)
- [x] 🟡 Build bottom tab bar: `[ Log ] [ Chart ] [ History ] [ Insights ]`
- [x] 🟡 Add bottom padding for Android/iOS system navigation bars
- [x] 🟡 Build side drawer (hamburger icon top-left)
- [x] 🟡 Populate drawer links: Settings, Reports, Export, About,
       Privacy Policy, Terms & Conditions, Dark Mode Toggle
       (move `ThemeToggle` here from its temporary placement in `AppShell.tsx`)
```

---

## Step 10 — Session report

Write a comprehensive Markdown session report and save it to:

```
tasks/cc-reports/REPORT_phase1-app-shell_{DD}-{mon}-{YYYY}.md
```

Replace `{DD}-{mon}-{YYYY}` with today's actual date (e.g. `01-Jun-2026`).

The report **must** follow the markdownlint rules:
- Blank line before and after every fenced code block
- No trailing spaces
- Zero markdownlint warnings

### Required sections

**1. Summary**  
One paragraph describing what was built and the overall outcome.

**2. Files Created**  
Full relative paths of every new file created.

**3. Files Modified**  
Full relative paths of every existing file modified, with a one-line
description of what changed.

**4. Packages Installed**  
List any new npm packages installed with exact versions. If none, write
"None — no new dependencies added."

**5. Build Output**  
Paste the final `npm run build` terminal output (stdout only, trimmed).

**6. TypeScript Check**  
Result of `npx tsc --noEmit`. Paste output or write "No errors."

**7. Visual Verification Results**  
Go through every checkbox from Step 8 and record pass/fail for each.
Note any issues found and how they were resolved.

**8. Deviations from Task Instructions**  
Any place where CC deviated from these instructions, and why.
If none, write "None."

**9. Known Issues / Follow-up**  
Anything that needs attention in a future batch. Include the `<Outlet />`
placeholder note if relevant.

---

After saving the report, paste a **short summary** into the Claude.ai chat
(5–10 lines covering: files created/modified, build status, TS status,
visual check pass/fail) and **wait for Mahmoud's confirmation** before
running the git commit.

---

## Step 11 — Git commit (after confirmation only)

After Mahmoud confirms the report summary looks good, run:

```bash
git add .
git commit -m "feat(shell): add bottom tab bar and side drawer layout

- Replace AppShell placeholder with full PWA shell
- Add BottomTabBar with four tabs and hamburger trigger
- Add SideDrawer with nav links and ThemeToggle
- Move ThemeToggle from AppShell into drawer
- Add safe-area bottom padding for mobile system nav bars"
```

Do **not** run `git push` unless Mahmoud explicitly asks.

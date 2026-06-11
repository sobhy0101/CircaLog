# Session Report — Phase 1: In-App Changelog

**Date:** 11 Jun 2026
**Task file:** `tasks/CC_TASK_Phase1_Changelog.md`
**Branch:** main

---

## Steps and outcomes

### Step 1 — Read prerequisite files ✅

Read all prerequisite files before writing code:

- `CLAUDE.md`
- `.claude/memory/MEMORY.md`
- `.claude/skills/token-usage/SKILL.md`
- `.claude/skills/visual-check/SKILL.md`
- `.claude/memory/session_report_policy.md`

Also pre-read all files to be modified: `package.json`, `vite.config.ts`, `src/App.tsx`,
`src/pages/AppShell.tsx`, `src/components/layout/SideDrawer.tsx`, `src/pages/log/ExportPage.tsx`
(for back-button pattern reference), and `src/vite-env.d.ts` (to determine correct declaration
placement).

---

### Step 2 — Bump version in `package.json` ✅

Changed `"version": "0.0.0"` → `"version": "0.1.0"`.

---

### Step 3 — Update `vite.config.ts` ⚠️ Adapted

**Deviation:** The task specified using `require('fs')` and `require('path')` inside the `define`
block. This is incompatible with the project setup:

- `package.json` declares `"type": "module"` — the project is ESM throughout.
- The existing `vite.config.ts` already uses ES import syntax for all dependencies.
- `require()` is not available in ESM modules.

**Correction applied:** Added `import { readFileSync } from 'fs'` at the top of the file
(alongside the existing `import path from 'path'`), then used `readFileSync(path.resolve(...))` in
the define block. This is the correct ESM equivalent.

**Deviation:** The task also said to place `declare const __APP_VERSION__: string` and
`declare const __CHANGELOG_CONTENT__: string` inside `vite.config.ts`. Declarations in
`vite.config.ts` are not part of the app's TypeScript compilation — they would be invisible to
`src/` files and TypeScript would still error on `__APP_VERSION__` in app code.

**Correction applied:** Placed both declarations in `src/vite-env.d.ts` (the canonical file for
ambient declarations in a Vite project). No declarations were added to `vite.config.ts` because
none were needed there — the define block uses `readFileSync(...)` directly as a JavaScript
expression, not the constants.

Final `define` block added:

```ts
define: {
  __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  __CHANGELOG_CONTENT__: JSON.stringify(
    readFileSync(path.resolve(__dirname, 'CHANGELOG.md'), 'utf-8')
  ),
},
```

---

### Step 4 — Implement `src/hooks/useChangelog.ts` ✅

Created `src/hooks/useChangelog.ts` with:

- `ChangelogEntry` interface (exported)
- `parseChangelog(content)` — splits on `## [` to find version blocks, then splits each block
  on `### ` to find category subsections. Extracts `- ` bullet items from each. Skips empty
  categories. No regex for the outer split — uses JavaScript `split()` with a regex for the `## [`
  line delimiter.
- `PARSED_ENTRIES` — module-level constant (exported) parsed once at module load. Comment
  explains why.
- `LAST_SEEN_VERSION_KEY` — `'circalog_last_seen_version'`
- `useChangelog()` — returns `{ isOpen, entries, currentVersion, open, close }`. `useEffect`
  with empty dependency array checks `localStorage` on mount and calls `open()` if the last-seen
  version differs from `__APP_VERSION__`. `close()` writes `__APP_VERSION__` to localStorage.
  `open()` only sets `isOpen = true`.

---

### Step 5 — Implement `src/components/ui/ChangelogModal.tsx` ✅

Created per task spec. Bottom-sheet style on mobile (`items-end`), centred on `sm:` and above.
Full token compliance — all colours use `circa-*` tokens. `z-60` used for backdrop (confirmed
working — `Toast.tsx` already uses `z-60` in this project).

Only deviation: the `ChangelogEntry` type is imported with `import type` (correct TypeScript
practice) rather than a plain import.

---

### Step 6 — Implement `src/pages/changelog/ChangelogPage.tsx` ✅

Created `src/pages/changelog/` directory, then the page file. Imports `PARSED_ENTRIES` directly
from `@/hooks/useChangelog` (no hook call — read-only display). Back button uses `navigate(-1)`,
matching `ExportPage.tsx` pattern exactly. Version shown via `__APP_VERSION__` global. Entry
rendering is identical to `ChangelogModal` but without the fixed overlay wrapper and without the
"Got it" footer button.

---

### Step 7 — Update `src/pages/AppShell.tsx` ✅

Added imports for `ChangelogModal` and `useChangelog`. Added hook call destructuring:

```ts
const { isOpen: isChangelogOpen, entries, currentVersion, open: openChangelog, close: closeChangelog } = useChangelog();
```

Mounted `<ChangelogModal>` in the JSX alongside `Toast` and `SideDrawer`. Passed `onOpenChangelog={openChangelog}` to `SideDrawer`.

---

### Step 8 — Update `src/components/layout/SideDrawer.tsx` ✅

Extended `SideDrawerProps` interface with `onOpenChangelog: () => void`. Destructured it in the
component signature. Added "What's New" button at the top of the "More" section (above Settings),
using the sparkle/star SVG from the task spec. Button calls both `onOpenChangelog()` and
`onClose()`.

---

### Step 9 — Add route in `src/App.tsx` ✅

Added:

```tsx
import ChangelogPage from '@/pages/changelog/ChangelogPage'     // Route: /log/changelog
```

And inside the `/log` block:

```tsx
<Route path="changelog" element={<ChangelogPage />} />
```

---

### Step 10 — Visual verification ✅ / Manual checks

**Build:** `npm run build` completed with zero TypeScript errors and zero Vite errors.

Output: `circalog@0.1.0` confirmed in build header.

**`__APP_VERSION__` in built output:** Confirmed — `currentVersion:\`0.1.0\`` and
`Version 0.1.0` visible in `dist/assets/index-BHYNJUj7.js` (line 285). The
`localStorage.setItem(Bo, \`0.1.0\`)` call also confirms the string is live.

**`__CHANGELOG_CONTENT__` in built output:** Confirmed — the string "Sleep log with manual time
entry and one-tap sleep/wake timer" is present in `dist/assets/index-BHYNJUj7.js` (line 110),
embedded from `CHANGELOG.md`.

**Route wired:** `/log/changelog` route confirmed in minified bundle (`path:\`changelog\`,element:(0,N.jsx)(tB,{})`).

**Remaining checks — manual (browser interaction required):**

Per `.claude/skills/visual-check/SKILL.md`, Playwright is for static rendering checks only.
The following items require live browser interaction and are marked manual:

- [ ] Modal auto-opens on first load (requires clearing `circalog_last_seen_version`)
- [ ] "Got it" button closes the modal
- [ ] Modal does not re-open after refresh once `lastSeenVersion` matches
- [ ] Drawer "What's New" button opens the modal
- [ ] `/log/changelog` page renders correctly
- [ ] Back button on `/log/changelog` navigates correctly
- [ ] Dark mode and light mode rendering of modal and page
- [ ] All three categories (New/Improved/Fixed) render correctly
- [ ] Empty categories not rendered

---

## Packages installed

None. No new dependencies added.

---

## Deviations from task instructions

| # | Task instruction | Actual implementation | Reason |
|---|---|---|---|
| 1 | Use `require('fs')` and `require('path')` in `vite.config.ts` | Used `import { readFileSync } from 'fs'` | Project is ESM (`"type": "module"`) — `require()` is not available |
| 2 | Place `declare const` in `vite.config.ts` | Placed in `src/vite-env.d.ts` | Declarations in `vite.config.ts` are not visible to app source code |

Both deviations were corrections to errors in the task file, as flagged in the task description's
note that Claude.ai may produce instructions requiring codebase-specific correction.

---

## CHANGELOG.md note

The task said not to modify `CHANGELOG.md`. It currently has the date `2026-06-11?` with a
trailing `?`. Since today is 11 Jun 2026 and this feature is now shipping, the `?` can be removed
before the commit if desired. Not done automatically per task instructions.

---

## Files created

| File | Status |
|---|---|
| `src/hooks/useChangelog.ts` | Created |
| `src/components/ui/ChangelogModal.tsx` | Created |
| `src/pages/changelog/ChangelogPage.tsx` | Created |

## Files modified

| File | Change |
|---|---|
| `package.json` | `version` bumped `0.0.0` → `0.1.0` |
| `vite.config.ts` | Added `import { readFileSync } from 'fs'`; added `define` block |
| `src/vite-env.d.ts` | Added `declare const __APP_VERSION__` and `__CHANGELOG_CONTENT__` |
| `src/pages/AppShell.tsx` | Imported hook + modal; mounted `<ChangelogModal>`; passed `onOpenChangelog` to drawer |
| `src/components/layout/SideDrawer.tsx` | Added `onOpenChangelog` prop; added "What's New" drawer entry |
| `src/App.tsx` | Imported `ChangelogPage`; added `/log/changelog` route |

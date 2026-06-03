# CircaLog — Batch B Self-Prompt (Log UI)

## What this chat is for

This is a planning and task-file writing session for **CircaLog, Phase 1,
Batch B — the Sleep Log UI**. The previous chat covered Batch A (the
IndexedDB data layer), which is now complete and committed. This chat picks
up immediately after that.

Before doing anything else, scan the codebase to verify current state.
Do not assume structure from this document alone.

---

## Project summary

CircaLog is an offline-first PWA sleep tracker for Non-24-Hour Sleep-Wake
Disorder. Solo developer: Mahmoud. Stack: React + Vite + TypeScript +
TailwindCSS + Recharts + IndexedDB (Dexie) + Supabase (V2) + Vercel.

Project root: `C:\Projects\CircaLog\`
GitHub: `sobhy0101/CircaLog`
Deployment: `circalog.vercel.app`

Full project instructions live in `docs/CircaLog_ProjectInstructions.md`.
Read that file early — it contains the division-of-labour rules, tier
classification system, stack gotchas, and CC task file requirements.

---

## What Batch A delivered (already committed)

- `src/lib/db/db.ts` — Dexie `CircaLogDB` class, `sleepEntries` table,
  shared `db` instance
- `src/lib/db/sleepEntryService.ts` — six exported CRUD functions:
  `createEntry`, `getAllEntries`, `getEntryById`, `updateEntry`,
  `softDeleteEntry`, `hardDeleteEntry`
- `src/lib/db/index.ts` — public barrel (exports the six functions only;
  `db` is not exported)
- `src/lib/db/__tests__/sleepEntryService.test.ts` — 25 Vitest tests,
  all passing
- Packages installed: `dexie@4.4.3`, `fake-indexeddb@6.2.5` (devDep)
- Total test count across the project is now 68/68 passing

Key Dexie gotcha already documented in `docs/CircaLog_ProjectInstructions.md`
under Lessons Learned: boolean fields cannot be used as Dexie 4.x index
keys. `getAllEntries` uses `toArray()` + JS `.filter(e => !e.isDeleted)`.

---

## What Batch B must deliver

**Goal:** A working sleep log UI at `/log` — the user can log a sleep
session and see it persisted.

### Screens and components

1. **`LogPage`** — the route component rendered at `/log` via React Router
   `<Outlet />`. Hosts the three sub-views below and manages which one is
   shown. Also wires `AppShell`'s `<Outlet />` so the page actually renders
   inside the shell.

2. **Manual entry form** — the primary logging flow. Fields:
   - Bed time (optional `bedTimeUtc`) — datetime-local input
   - Sleep start (required `sleepStartUtc`) — datetime-local input
   - Wake time (required `wakeUtc`) — datetime-local input
   - Quality rating 1–5 (required) — tap-to-select star or dot picker,
     not a dropdown
   - Notes (optional) — textarea
   - Optional fields toggle (collapsed by default, expands on tap):
     - Had dreams? yes/no
     - Dream notes (text, visible only when hadDreams is true)
     - Interruptions (add/remove chips: bathroom / thirst / hunger /
       pain / other, each with an optional note)
     - Medication taken? yes/no + timing (before/during/after)
   - Submit button — calls `createEntry`, shows inline error on failure
   - This form handles both new entries and back-filling past entries
     (date/time picker allows any past datetime, not just today)

3. **Start Sleep screen** — one-tap timer flow.
   - Single large "Start Sleep" button
   - On tap: records `bedTimeUtc = now`, persists an in-progress marker
     to `localStorage` (key: `circalog-sleep-in-progress`), transitions
     to a "sleeping" state showing elapsed time
   - If the app is reopened while a session is in progress, it must
     restore the in-progress state from `localStorage` and show the
     elapsed time correctly — not reset
   - "I'm Awake" button ends the session and opens the Wake Up screen

4. **Wake Up completion screen** — shown after "I'm Awake" is tapped.
   - Displays the derived sleep duration (from stored start time to now)
   - Pre-fills `sleepStartUtc` from the stored in-progress marker
   - Pre-fills `wakeUtc` with the current time (editable)
   - Quality picker (same component as the manual form)
   - Optional fields toggle (same as the manual form)
   - Submit → calls `createEntry`, clears `localStorage` marker, returns
     to Start Sleep screen

### Hook

All four components share a single `useSleepLog` hook
(`src/hooks/useSleepLog.ts`) that:

- Exposes `createEntry`, `updateEntry`, `softDeleteEntry`,
  `hardDeleteEntry` from `@/lib/db` (re-exported with loading/error state)
- Manages the in-progress session state (read/write `localStorage`)
- Exposes `entries: SleepEntry[]` loaded from `getAllEntries()` on mount
  and refreshed after every mutation

### Routing

`AppShell.tsx` currently has a placeholder comment where `<Outlet />`
belongs. Batch B adds the outlet and creates the `/log` route structure
so that `LogPage` renders inside the shell. The router itself lives in
`src/App.tsx` — read that file before writing routing instructions.

---

## Decisions already made (do not re-open)

- Manual entry first (stress-tests the data model, unblocks back-fill)
- Timer flow (Start Sleep + Wake Up) in the same batch as the form
- Routing wire-up included in Batch B (needed for Playwright verification)
- `useSleepLog` hook as the single access point between UI and DB service
- Batch B is one batch, not two (hook + screens share too much to split safely)
- `bedTimeUtc` is optional — the form offers it but does not require it
- Nap auto-detection is engine-derived, not user-selectable in V1
- Cycle number is engine-derived, not shown in the log form (shown in
  history view, which is a later batch)

---

## Decisions still open — discuss before writing the task file

Mahmoud has not yet been asked about these. Raise them one by one and
get answers before writing any CC task file:

1. **In-progress session persistence key** — `circalog-sleep-in-progress`
   is proposed above. Should this key live as a named constant alongside
   `THEME_KEY` in a shared constants file, or inline in the hook?

2. **Error display pattern** — inline below the offending field, or a
   toast/banner at the top of the form? The project has no toast component
   yet. If Mahmoud wants toasts, that may need to be a sub-task.

3. **Quality picker component** — stars vs. labelled dots vs. a 1–5
   segmented button row. What does Mahmoud want visually?

4. **Optional fields default state** — collapsed (tap to expand) is
   proposed above. Confirm this is correct.

5. **Datetime input behaviour** — `datetime-local` HTML inputs work on
   desktop but behave inconsistently on mobile browsers. Should CC use
   the native input and accept its quirks for V1, or implement a custom
   time picker? Custom is more work but better UX on mobile, which is
   the primary use case.

6. **Back-fill UX** — is back-fill a separate button/mode ("Log a past
   session"), or does the same manual form just allow past datetimes?
   The latter is simpler; the former is clearer to the user.

---

## Workflow reminder

- Discuss decisions first, write task file second — never the other way
- Tier 1 vs. Tier 2 assessment is required before any work begins
- CC task file goes in `tasks/`, session report goes in `tasks/cc-reports/`
- Read `docs/CircaLog_ProjectInstructions.md` for the full rules

---

*Self-prompt written by Claude.ai at end of Batch A session, 03 Jun 2026.*

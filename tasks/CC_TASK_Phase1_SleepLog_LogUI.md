# CC Task — Phase 1: Sleep Log UI (Batch B)

**Batch:** Phase 1 — Batch B  
**Depends on:** Phase 1 Batch A (DB layer) — already committed  
**Estimated scope:** ~10 files created or modified  
**Vercel deployment required:** Yes — final verification step

---

## Before you start

Read these files first, in order:

1. `docs/CircaLog_ProjectInstructions.md` — division of labour, stack gotchas,
   CC task file requirements
2. `.claude/skills/token-usage/SKILL.md` — the full circa-* token reference;
   never use raw Tailwind palette classes
3. `.claude/skills/run/SKILL.md` — how to start the dev server
4. `.claude/skills/visual-check/SKILL.md` — Playwright verification procedure

Do not skip these. They contain constraints that directly affect this task.

---

## Context

Batch A delivered the IndexedDB data layer:

- `src/lib/db/db.ts` — Dexie `CircaLogDB`, `sleepEntries` table
- `src/lib/db/sleepEntryService.ts` — six CRUD functions
- `src/lib/db/index.ts` — public barrel (exports the six functions)

The DB layer is complete and tested (68/68 tests passing). Do not touch it.

This batch wires the UI on top of it: the hook, the three Log screens, and
the routing that puts them inside the app shell.

---

## What this batch must deliver

### Files to create

1. `src/lib/constants.ts` — shared storage key constant
2. `src/hooks/useSleepLog.ts` — hook: DB access + in-progress state
3. `src/components/ui/QualityPicker.tsx` — reusable 1–5 quality selector
4. `src/pages/log/LogPage.tsx` — route component, sub-view switcher
5. `src/pages/log/ManualEntryForm.tsx` — manual sleep log form
6. `src/pages/log/StartSleepScreen.tsx` — one-tap timer start
7. `src/pages/log/WakeUpScreen.tsx` — wake confirmation + entry completion

### Files to modify

8. `src/App.tsx` — add nested route so `LogPage` renders as a child of `/log`
9. `src/pages/AppShell.tsx` — replace the placeholder `<p>` with `<Outlet />`

---

## Step 1 — `src/lib/constants.ts`

Create this file:

```ts
/**
 * Shared localStorage key constants for CircaLog.
 *
 * Define every localStorage key here so no key string is duplicated
 * across the codebase. Import from this file wherever a key is needed.
 *
 * Note: THEME_KEY lives in src/hooks/useTheme.ts because it is tightly
 * coupled to the FOUC-prevention script in index.html. Keep it there.
 */

/**
 * Key used to persist an in-progress sleep session across page reloads.
 * Stored value is a JSON-serialised InProgressSession object.
 * Cleared when the session is completed or abandoned.
 */
export const SLEEP_IN_PROGRESS_KEY = 'circalog-sleep-in-progress';
```

---

## Step 2 — `src/hooks/useSleepLog.ts`

This hook is the single access point between the Log UI and the DB layer.
It must do the following:

### In-progress session state

An in-progress session is a sleep timer that was started but not yet
completed. It survives page reloads via `localStorage`.

Define this type locally in the hook file (do not export it from types.ts —
it is UI-level state, not domain data):

```ts
interface InProgressSession {
  bedTimeUtc: string;   // ISO 8601 UTC — when "Start Sleep" was tapped
  startedAt: string;    // ISO 8601 UTC — same value, kept for display
}
```

### Hook shape

```ts
export function useSleepLog() {
  return {
    // ── DB state ──────────────────────────────────────────────────────
    entries,          // SleepEntry[] — all non-deleted entries, newest first
    isLoading,        // boolean — true while the initial DB load is pending
    error,            // string | null — last DB error message, or null

    // ── DB mutations ─────────────────────────────────────────────────
    createEntry,      // (draft) => Promise<void> — wraps service fn
    updateEntry,      // (id, changes) => Promise<void> — wraps service fn
    softDeleteEntry,  // (id) => Promise<void> — wraps service fn
    hardDeleteEntry,  // (id) => Promise<void> — wraps service fn

    // ── In-progress session ───────────────────────────────────────────
    inProgress,       // InProgressSession | null
    startSession,     // () => void — records now as bedTimeUtc, writes localStorage
    clearSession,     // () => void — removes the localStorage key, resets state
  };
}
```

### Implementation notes

- Load entries with `getAllEntries()` from `@/lib/db` inside a `useEffect`
  on mount. Sort the returned array newest-first (reverse of the service
  sort order) so the most recent entry appears at the top of history views.
- After every mutation (`createEntry`, `updateEntry`, `softDeleteEntry`,
  `hardDeleteEntry`), call `getAllEntries()` again to refresh `entries`.
  Do not manually splice the array — always re-fetch from DB.
- The mutation wrappers must catch errors and set the `error` state string.
  They must set `isLoading` to true before the async call and false after.
- `startSession`: call `new Date().toISOString()` for both `bedTimeUtc` and
  `startedAt`, write to `localStorage` using `SLEEP_IN_PROGRESS_KEY`, and
  update `inProgress` state.
- On mount, read `localStorage.getItem(SLEEP_IN_PROGRESS_KEY)` and parse it.
  If it exists and is valid JSON, restore `inProgress` state from it.
- `clearSession`: call `localStorage.removeItem(SLEEP_IN_PROGRESS_KEY)` and
  set `inProgress` to `null`.
- The hook's own `createEntry` wrapper must call `clearSession` after a
  successful save ONLY when called from the Wake Up screen. To keep the hook
  simple, do not try to detect this inside the hook — instead, the Wake Up
  screen calls `clearSession` explicitly after `createEntry` resolves.
  The hook's `createEntry` wrapper does NOT call `clearSession`.

### Imports needed

```ts
import { useState, useEffect } from 'react';
import {
  createEntry as dbCreate,
  getAllEntries,
  updateEntry as dbUpdate,
  softDeleteEntry as dbSoftDelete,
  hardDeleteEntry as dbHardDelete,
} from '@/lib/db';
import type { SleepEntry } from '@/lib/circadian';
import { SLEEP_IN_PROGRESS_KEY } from '@/lib/constants';
```

---

## Step 3 — `src/components/ui/QualityPicker.tsx`

A reusable 1–5 quality rating selector. Used by both ManualEntryForm and
WakeUpScreen.

### Visual design

Five circles in a horizontal row. Each circle:

- Default (unselected): `bg-circa-surface border-2 border-circa-border`
- Selected: `bg-circa-accent border-2 border-circa-accent`
- Size: `w-10 h-10` (40px — comfortably tappable on mobile)
- Shape: fully rounded (`rounded-full`)
- Contains the digit (1–5) centred inside it

Below the row of circles, a single label that updates based on the selected
value. Centred under the whole row. Font: `text-sm text-circa-text-secondary`.

Label map:

| Value | Label |
|---|---|
| 1 | Very Poor |
| 2 | Poor |
| 3 | Fair |
| 4 | Good |
| 5 | Excellent |

When no value is selected yet, show no label (empty string).

Between the circles, add a small gap (`gap-3`). Wrap the row in a `flex`
container: `flex items-center justify-center gap-3`.

The digit inside a selected circle should be `text-white font-semibold`.
The digit inside an unselected circle should be `text-circa-text-secondary`.

### Props

```ts
interface QualityPickerProps {
  value: number | null;           // currently selected value (1–5), or null
  onChange: (v: number) => void;  // called with the new value on tap
  label?: string;                 // optional label above the picker, e.g. "Sleep Quality"
}
```

If `label` is provided, render it above the circle row as
`text-sm font-medium text-circa-text-primary mb-2`.

### Accessibility

Each circle is a `<button type="button">`. Add `aria-pressed={value === n}` and
`aria-label={`Rate sleep quality ${n} out of 5`}` to each.

---

## Step 4 — `src/pages/log/LogPage.tsx`

This is the route component rendered inside `AppShell` at `/log`.

It owns which sub-view is currently shown. It is also responsible for
creating the `useSleepLog` hook instance shared by all three sub-views —
pass the hook's return values down as props rather than calling the hook
three times.

### Sub-views

Three possible views, controlled by a `view` state variable:

- `'start'` — default; shows StartSleepScreen
- `'manual'` — shows ManualEntryForm
- `'wakeup'` — shows WakeUpScreen

### Header

Render a page header above the sub-view area:

```tsx
<header className="px-4 pt-5 pb-2 flex items-center justify-between">
  <h1 className="text-circa-text-primary font-display text-lg font-semibold tracking-wide">
    Sleep Log
  </h1>
  {/* Only show "Log manually" button when view is 'start' */}
  {view === 'start' && (
    <button
      onClick={() => setView('manual')}
      className="text-circa-accent-light text-sm"
    >
      Log manually
    </button>
  )}
  {/* Show "← Back" when on manual form */}
  {view === 'manual' && (
    <button
      onClick={() => setView('start')}
      className="text-circa-accent-light text-sm"
    >
      ← Back
    </button>
  )}
</header>
```

When `view === 'wakeup'`, show no back button — the user got there by tapping
"I'm Awake" and the only path forward is to complete or abandon the session.

### Transitions between views

- `StartSleepScreen` calls `onStartSleep` → hook's `startSession()` +
  `setView('wakeup')`
- `WakeUpScreen` calls `onComplete` → after save + `clearSession()`,
  `setView('start')`
- `WakeUpScreen` calls `onAbandon` → `clearSession()` + `setView('start')`
- `ManualEntryForm` calls `onSaved` → `setView('start')`
- `ManualEntryForm` calls `onCancel` → `setView('start')`

### Restore on mount

On mount, if `inProgress` is not null (session was in progress before the
page was reloaded), immediately set `view` to `'wakeup'`.

Use a `useEffect` with an empty dependency array that checks
`useSleepLog().inProgress` — but since `useSleepLog` is called once in
`LogPage` and passed down, read `inProgress` from the hook instance.
Use an initial state function to avoid a flash:

```ts
const sleepLog = useSleepLog();
const [view, setView] = useState<'start' | 'manual' | 'wakeup'>(() =>
  sleepLog.inProgress ? 'wakeup' : 'start'
);
```

---

## Step 5 — `src/pages/log/ManualEntryForm.tsx`

### Props

```ts
interface ManualEntryFormProps {
  onSaved: () => void;
  onCancel: () => void;
  createEntry: (draft: Parameters<typeof import('@/lib/db').createEntry>[0]) => Promise<void>;
  error: string | null;
  isLoading: boolean;
  // Pre-fill values — used when this form is opened with existing times
  // (not used in Batch B, but include the props for forward compatibility)
  initialSleepStart?: string;  // local datetime string for the input
  initialWake?: string;        // local datetime string for the input
}
```

### Layout

Wrap the entire form in:

```tsx
<div className="px-4 py-4 space-y-5 max-w-lg mx-auto">
```

### Fields — use separate date + time inputs

Use `<input type="date">` and `<input type="time">` pairs instead of
`datetime-local`. This is more consistent across mobile browsers. Combine
them into a UTC ISO string before calling `createEntry`.

**Helper to convert local date + time string to UTC ISO:**

Include this helper at the top of the file (not exported):

```ts
/**
 * Converts a local YYYY-MM-DD date string and HH:MM time string to a
 * UTC ISO 8601 string using the browser's local timezone.
 * Returns null if either input is empty.
 */
function toUtcIso(date: string, time: string): string | null {
  if (!date || !time) return null;
  return new Date(`${date}T${time}`).toISOString();
}
```

**Default values for the date inputs:** pre-fill with today's local date.
Do not pre-fill time inputs — leave them empty so the user must be
intentional about entering times.

To get today's date as `YYYY-MM-DD` in local time:

```ts
function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
```

### Field list

**Bed Time (optional)**

- Label: "Bed Time" + "(optional)" in muted text
- Two inputs: date + time (side by side: `flex gap-2`)
- State: `bedDate`, `bedTime`
- Hint below: "When did you get into bed? Leave blank if you don't remember."
  in `text-circa-text-muted text-xs`

**Sleep Start (required)**

- Label: "Fell Asleep"
- Two inputs: date + time
- State: `sleepDate`, `sleepTime`
- Required — show inline error if empty on submit

**Wake Time (required)**

- Label: "Woke Up"
- Two inputs: date + time
- State: `wakeDate`, `wakeTime`
- Required — show inline error if empty on submit

**Quality (required)**

- Use `<QualityPicker>` with `label="Sleep Quality"`
- State: `quality` (number | null)
- Required — show inline error if null on submit

**Notes (optional)**

- Label: "Notes"
- `<textarea rows={3}>`
- State: `notes`
- Placeholder: "Anything you want to remember about this session…"

**Optional fields section** (collapsed by default)

A button to expand/collapse:

```tsx
<button
  type="button"
  onClick={() => setShowOptional(v => !v)}
  className="flex items-center gap-1 text-circa-accent-light text-sm mt-1"
>
  <span>{showOptional ? '▾' : '▸'}</span>
  <span>{showOptional ? 'Hide optional fields' : 'More details'}</span>
</button>
```

When expanded, show:

- **Had Dreams?** — two tap buttons: `[ Yes ]  [ No ]`, styled as a
  segmented selector using `circa-accent` for the selected option and
  `circa-surface-raised` for the other
- **Dream Notes** (textarea) — visible only when `hadDreams === true`
- **Interruptions** — a set of chip-toggle buttons, one per
  `InterruptionType`: Bathroom / Thirst / Hunger / Pain / Other.
  Each chip toggles on/off. When a chip is active, show a small text
  input below it for an optional note. Chips use the same
  `circa-accent-subtle` + `circa-accent-light` styling as badges.
- **Medication taken?** — two tap buttons: `[ Yes ]  [ No ]`
- **Timing** (visible only when `medicationTaken === true`) — three tap
  buttons: `[ Before ]  [ During ]  [ After ]`, same segmented style.
  State: `medicationTiming: MedicationTiming | null`

### Input styling

Apply these classes to all `<input type="date">`, `<input type="time">`,
and `<textarea>` elements:

```tsx
bg-circa-surface-raised border border-circa-border rounded-lg px-3 py-2
text-circa-text-primary text-sm
focus:outline-none focus:border-circa-border-strong
w-full
```

For the date + time pair, wrap them in `<div className="flex gap-2">` with
the date input getting `flex-1` and the time input getting `w-32`.

### Inline errors

Below each required field group, render:

```tsx
{fieldError && (
  <p className="text-red-400 text-xs mt-1">{fieldError}</p>
)}
```

For a general submit error (from the DB), show a banner above the submit
button:

```tsx
{error && (
  <div className="bg-red-900/30 border border-red-700 rounded-lg px-3 py-2 text-red-400 text-sm">
    {error}
  </div>
)}
```

`text-red-400` and the red error banner colours are the one intentional
use of a raw Tailwind colour here — these are universal danger indicators,
not theme-switchable UI elements. This exception is acceptable and
intentional.

### Submit button

```tsx
<button
  type="button"
  onClick={handleSubmit}
  disabled={isLoading}
  className="w-full bg-circa-accent text-white font-semibold py-3 rounded-xl
             disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isLoading ? 'Saving…' : 'Save Sleep Session'}
</button>
```

### Submit logic (`handleSubmit`)

1. Validate: `sleepTime` and `sleepDate` must be non-empty. `wakeDate` and
   `wakeTime` must be non-empty. `quality` must be non-null. Set field
   errors and return early if any fail.
2. Call `toUtcIso` for each time pair.
3. Build the draft object — `ianaTimezone` from
   `Intl.DateTimeFormat().resolvedOptions().timeZone`.
4. If `medicationTaken === true` and `medicationTiming` is set, include
   `medications: [{ name: 'Yes', timing: medicationTiming }]`. (The V1
   medication field is a blunt yes/no with timing — not a named medication.
   The free-text name 'Yes' is a placeholder until the V2 medication
   library is built.)
5. Call `createEntry(draft)`. On success, call `onSaved()`.

---

## Step 6 — `src/pages/log/StartSleepScreen.tsx`

### Props

```ts
interface StartSleepScreenProps {
  onStartSleep: () => void;
  inProgress: { bedTimeUtc: string; startedAt: string } | null;
}
```

### When `inProgress` is null

Show a single large centred button:

```tsx
<div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-6">
  <p className="text-circa-text-secondary text-sm text-center">
    Tap when you're ready to sleep. CircaLog will record the time.
  </p>
  <button
    onClick={onStartSleep}
    className="w-48 h-48 rounded-full bg-circa-accent flex items-center justify-center
               shadow-lg active:scale-95 transition-transform"
  >
    <span className="text-white font-display font-semibold text-xl">
      Start Sleep
    </span>
  </button>
</div>
```

This is the primary action on the screen — make it visually dominant. The
large circular button is intentional.

### When `inProgress` is not null

This state should never be visible (LogPage redirects to WakeUpScreen when
`inProgress` is set), but include a fallback for safety:

```tsx
<div className="flex items-center justify-center min-h-[60vh]">
  <p className="text-circa-text-muted text-sm">Redirecting…</p>
</div>
```

---

## Step 7 — `src/pages/log/WakeUpScreen.tsx`

### Props

```ts
interface WakeUpScreenProps {
  inProgress: { bedTimeUtc: string; startedAt: string };
  onComplete: () => void;
  onAbandon: () => void;
  createEntry: ManualEntryFormProps['createEntry'];
  clearSession: () => void;
  error: string | null;
  isLoading: boolean;
}
```

### Layout

```tsx
<div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
```

### Elapsed time display

Show how long ago the session started. Calculate from `inProgress.startedAt`
to `Date.now()`. Update every second with `setInterval` inside a `useEffect`.

Format as `Xh Ym` (e.g. `7h 34m`). Display it prominently:

```tsx
<div className="text-center">
  <p className="text-circa-text-secondary text-sm mb-1">Sleep duration so far</p>
  <p className="text-circa-text-primary font-display text-4xl font-semibold tracking-tight">
    {elapsed}
  </p>
</div>
```

### Wake time field

Pre-fill with the current time at render. Use the same date + time input
pair pattern as ManualEntryForm. State: `wakeDate`, `wakeTime`.

Label: "Wake Time" — required.

### Quality picker

Use `<QualityPicker label="How did you sleep?" />`.

### Optional fields

Same toggle + same fields as ManualEntryForm. Consider extracting the
optional fields section into a shared component if it feels natural during
implementation — if not, duplicate for now. This is a V1 task and DRY
can be addressed later.

### Buttons

Two buttons stacked vertically at the bottom:

```tsx
{/* Primary */}
<button
  type="button"
  onClick={handleComplete}
  disabled={isLoading}
  className="w-full bg-circa-accent text-white font-semibold py-3 rounded-xl
             disabled:opacity-50"
>
  {isLoading ? 'Saving…' : 'Save & Wake Up'}
</button>

{/* Abandon — secondary, destructive-ish */}
<button
  type="button"
  onClick={handleAbandon}
  className="w-full text-circa-text-muted text-sm py-2"
>
  Abandon session
</button>
```

### `handleComplete` logic

1. Validate `wakeDate`, `wakeTime`, and `quality`.
2. Call `toUtcIso` for the wake time.
3. Build the draft with:
   - `bedTimeUtc`: `inProgress.bedTimeUtc`
   - `sleepStartUtc`: `inProgress.bedTimeUtc` (the user went to sleep when
     they tapped "Start Sleep" — we use bedTime as sleepStart here because
     there was no separate "fell asleep" moment recorded by the timer)
   - `wakeUtc`: derived from inputs
   - `ianaTimezone`: from `Intl.DateTimeFormat().resolvedOptions().timeZone`
4. Call `createEntry(draft)`. On success: call `clearSession()`, then
   `onComplete()`.

### `handleAbandon` logic

```ts
function handleAbandon() {
  clearSession();
  onAbandon();
}
```

---

## Step 8 — Update `src/App.tsx`

The current router has a flat route for `/log`. Change it to a nested
route so that `LogPage` renders as the index child inside `AppShell`:

```tsx
import { Routes, Route } from 'react-router-dom'
import ComingSoon from '@/pages/ComingSoon'
import AppShell   from '@/pages/AppShell'
import LogPage    from '@/pages/log/LogPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ComingSoon />} />
      <Route path="/log" element={<AppShell />}>
        <Route index element={<LogPage />} />
      </Route>
    </Routes>
  )
}
```

---

## Step 9 — Update `src/pages/AppShell.tsx`

Replace the placeholder `<p>` element with `<Outlet />`:

Current:

```tsx
<div className="flex items-center justify-center h-full min-h-[calc(100vh-4rem)]">
  <p className="text-circa-accent text-sm tracking-wide">
    CircaLog — app shell ✓
  </p>
</div>
```

Replace with:

```tsx
<Outlet />
```

Add the import at the top of the file:

```tsx
import { Outlet } from 'react-router-dom';
```

Remove the placeholder comment from the `<main>` block.

---

## Step 10 — Verification

### 10a — Build check

```bash
npm run build
```

Must complete with zero TypeScript errors and zero ESLint errors.
If there are errors, fix them before proceeding. Do not commit a broken build.

### 10b — Dev server + Playwright

Read `.claude/skills/run/SKILL.md` and `.claude/skills/visual-check/SKILL.md`.

Start the dev server, then run the standard theme verification scenarios
from the visual-check skill.

Additionally, run these Log UI scenarios:

**Scenario A — Log tab renders**

```js
await page.goto('http://localhost:5173/log');
await page.screenshot({ path: 'tasks/screenshots/log-start-screen.png' });
// Confirm: "Start Sleep" button is visible
// Confirm: "Log manually" button is visible in the header
```

**Scenario B — Manual form opens**

```js
await page.click('text=Log manually');
await page.screenshot({ path: 'tasks/screenshots/log-manual-form.png' });
// Confirm: "Sleep Log" header and form fields are visible
// Confirm: "← Back" button is visible
// Confirm: QualityPicker circles are visible
// Confirm: "More details" toggle button is visible
```

**Scenario C — Optional fields expand**

```js
await page.click('text=More details');
await page.screenshot({ path: 'tasks/screenshots/log-optional-expanded.png' });
// Confirm: Had Dreams?, Interruptions, Medication fields are visible
```

**Scenario D — Start Sleep**

```js
await page.goto('http://localhost:5173/log');
await page.click('text=Start Sleep');
await page.screenshot({ path: 'tasks/screenshots/log-wakeup-screen.png' });
// Confirm: elapsed time counter is visible
// Confirm: "Save & Wake Up" button is visible
// Confirm: "Abandon session" link is visible
```

**Scenario E — Abandon resets to Start**

```js
await page.click('text=Abandon session');
await page.screenshot({ path: 'tasks/screenshots/log-after-abandon.png' });
// Confirm: "Start Sleep" button is visible again
```

Document all scenario results in the session report.

---

## Step 11 — Session report

Write a comprehensive Markdown session report and save it to
`tasks/cc-reports/` using this filename:

```text
REPORT_phase1-logui_{DD}-{mon}-{YYYY}.md
```

(Replace `{DD}-{mon}-{YYYY}` with today's actual date, e.g. `03-jun-2026`.)

The report must follow the rules in `.claude/memory/session_report_policy.md`.
At minimum, include:

- Every step and its outcome
- No new packages were installed in this batch — confirm this
- Build output (clean or error text)
- All Playwright scenario results (table format per the visual-check skill)
- Deviations from these task instructions, if any
- Final list of all files created and modified

After writing the report, paste a short summary into the Claude.ai chat
and **wait for confirmation** before proceeding to the git commit.

---

## Step 12 — Git commit (only after Claude.ai confirms)

```bash
git add -A
git commit -m "feat(phase1): Sleep Log UI — hook, manual form, timer flow, routing"
git push
```

---

## Style rules (summary)

- All `circa-*` tokens — never raw Tailwind palette classes except the
  red error colours noted above
- No `import React from 'react'` in `.tsx` files (automatic JSX transform
  is active; unused import causes TS6133)
- `import { useState } from 'react'` — use named imports
- All `.tsx` file — functional components only
- Inline comments explaining non-obvious logic — Mahmoud has a design
  background and is building React skills; assume a capable reader, not
  an expert
- All form fields must be accessible: proper `<label htmlFor>` + `id` pairing
- Minimum tap target size: 44px (enforced via `min-w-[44px] min-h-[44px]`
  on interactive elements smaller than that by default)

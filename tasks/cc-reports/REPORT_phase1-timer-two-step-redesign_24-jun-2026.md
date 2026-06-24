# REPORT — Phase 1: Two-Step Timer Redesign + Simple/Detailed Mode

**Date:** 24 Jun 2026
**Task file:** `tasks/CC_TASK_Phase1_TimerTwoStepRedesign.md`
**Tier:** 2 — single session, no new dependencies

---

## Summary

Implemented the two-step sleep timer redesign (In Bed → Going to Sleep → Wake Up)
and the Simple/Detailed mode toggle. All 8 files listed in the task were
created or modified. Build passes with zero errors; one pre-existing test
failure was noted (see below). Manual browser testing of the interactive
flow is still required before committing.

---

## Files Created / Modified

### New files

**`src/utils/parseElapsed.ts`**

Extracted the `parseElapsed(ms)` helper that was private to `WakeUpScreen.tsx`
into a shared utility. Both `InBedScreen` and `WakeUpScreen` now import from
this single source. The logic is unchanged.

**`src/pages/log/InBedScreen.tsx`**

Step 1 UI for detailed mode. Shows a live "In bed for Xh Ym" counter
(ticking every second from `bedTimeUtc`). Renders a "Going to Sleep?" button
disabled for a 10-second grace period to prevent accidental double-tap.
An "Abandon session" link calls `clearSession()` before `onAbandon()`.
Modelled on the structure of `WakeUpScreen`.

### Modified files

**`src/lib/constants.ts`**

Added `SLEEP_LOG_MODE_KEY = 'circalog-sleep-log-mode'` with a full doc-comment
explaining the design intent (the toggle IS the settings mechanism; no separate
Settings UI needed for this key in V1).

**`src/hooks/useSleepLog.ts`**

Four changes:

1. Added exported type `SleepLogMode = 'simple' | 'detailed'`.
2. Replaced `InProgressSession` shape — removed `startedAt`, added `mode`
   and `sleepStartUtc?: string`. The optional `sleepStartUtc` encodes which
   step we're on without a separate `step` field.
3. Tightened the `localStorage` init: if `mode` is absent on the parsed
   object (old shape from before this change), the key is cleared and `null`
   returned rather than passing through a broken session.
4. Added `mode` / `setMode` state (reads and writes `SLEEP_LOG_MODE_KEY`),
   `markSleepStart()` function (sets `sleepStartUtc` on the in-progress
   session), and rewrote `startSession(currentMode)` to accept the mode as
   a parameter. All three are exported via the hook's return object.

**`src/pages/log/StartSleepScreen.tsx`**

Updated props: added `mode`, `onModeChange`. Instructional copy and button
label now depend on `mode` (Simple: "Start Sleep" / Detailed: "In Bed?").
Added a segmented mode-toggle using `aria-pressed`, `min-h-11`, and the
`circa-accent` / `circa-surface-raised` active/inactive token pattern.

**`src/pages/log/WakeUpScreen.tsx`**

Four changes:

1. Swapped the local `parseElapsed` definition for an import from
   `@/utils/parseElapsed` (deleted the local copy).
2. Updated prop type: replaced `startedAt: string` with
   `sleepStartUtc: string` (now required, not optional — `LogPage` only
   routes here once it is set); added `mode` to the `inProgress` shape.
3. Changed the elapsed counter and its `useEffect` dep array to reference
   `inProgress.sleepStartUtc` instead of `inProgress.startedAt`. Correctness
   fix: sleep duration must count from sleep start, not bed time.
4. Added a read-only onset summary block directly above the "Fell Asleep"
   fields: `In bed: {time} → Fell asleep: {time} → Onset: {min} min`.
   Wired to the live `sleepDate`/`sleepTime` state (via the existing
   `toUtcIso` helper) so the onset figure updates as the user edits.
   When onset = 0, a subtle prompt "Did you fall asleep immediately?" appears.

**`src/pages/log/LogPage.tsx`**

Four changes:

1. `View` type extended: `'start' | 'manual' | 'inbed' | 'wakeup'`.
2. Initial view derivation updated: routes to `'inbed'` if a session exists
   but `sleepStartUtc` is absent; routes to `'wakeup'` once it is set.
3. Added `handleGoingToSleep()` (calls `markSleepStart()`, sets view to
   `'wakeup'`) and `handleStartSleep()` updated to pass `sleepLog.mode`
   and branch the view target on mode.
4. Render: `StartSleepScreen` receives `mode` and `onModeChange`; new
   `inbed` view renders `InBedScreen`; `wakeup` view guards on
   `sleepLog.inProgress?.sleepStartUtc` then casts the prop type with `as`
   (required because `InProgressSession.sleepStartUtc` is optional but
   `WakeUpScreenProps.inProgress.sleepStartUtc` is required — the runtime
   invariant holds but TypeScript cannot infer it from the `view` check alone).
   "Log manually" header button continues to show only on `'start'` —
   verified the existing condition already excludes `'inbed'` and `'wakeup'`.

**`docs/CircaLog-TO-DO-list.md`**

Checked off three items:

- `[x] Redesign timer screen: replace single "Start Sleep" button with two-step flow`
- `[x] Persist in-progress timer session across app close/reopen`
- `[x] WakeUpScreen: show "In Bed" time read-only above the editable "Fell Asleep" field`

Added a note below the two-step persist item recording that the Simple/Detailed
mode toggle was folded into this work, with a pointer to the task file.

---

## Build verification

`npm run build` — **passed**, zero errors, zero TypeScript errors.

Output:

```
> circalog@0.1.0 build
> tsc -b && vite build

vite v8.0.16 building client environment for production...
✓ 693 modules transformed.
dist/index.html                             8.30 kB │ gzip:   2.46 kB
dist/assets/index-CzZTSp9G.css            37.09 kB │ gzip:   7.54 kB
dist/assets/rolldown-runtime-Cyuzqnbw.js   0.82 kB │ gzip:   0.47 kB
dist/assets/dexie-CieGr6yJ.js             95.16 kB │ gzip:  31.31 kB
dist/assets/vendor-DQYOSLgC.js           234.43 kB │ gzip:  75.12 kB
dist/assets/index-BrfKBa-_.js            717.94 kB │ gzip: 194.04 kB
✓ built in 1.03s
```

---

## Test results

`npm run test` — **1 pre-existing failure, unrelated to this task.**

```
FAIL  src/lib/circadian/__tests__/engine.test.ts
  × calculateDrift > returns a positive drift for the real dataset (Non-24 signature)
    AssertionError: expected -93 to be greater than 0

Test Files  1 failed | 1 passed (2)
      Tests  1 failed | 67 passed (68)
```

This failure is in `calculateDrift` in the circadian engine (`engine.test.ts:208`).
None of the files touched in this task interact with the drift calculation.
The failure existed on `main` before this session. Fixing it is out of scope.

---

## Deviations from task file

None. All steps were followed as specified.

The IIFE in `WakeUpScreen` (section 6d sketch) was implemented using the
`toUtcIso` helper with live `sleepDate`/`sleepTime` state exactly as the
task instructed — not with `new Date(inProgress.sleepStartUtc)` directly,
so the onset figure updates as the user edits the field.

---

## Two-step flow — manual code review confirmation

**The interactive click-through flow (In Bed → Going to Sleep → Wake Up) was
NOT verified with Playwright.** Per the scope limit in the task file,
Playwright is configured for static rendering checks only and cannot simulate
the multi-step timer interaction.

The flow was verified by manual code review:

- `LogPage.handleStartSleep()` calls `startSession(mode)` then routes to
  `'inbed'` (detailed) or `'wakeup'` (simple). ✅
- `InBedScreen` renders from `bedTimeUtc`, disables the primary button for
  10 s, calls `clearSession()` before `onAbandon()`. ✅
- `LogPage.handleGoingToSleep()` calls `markSleepStart()` then `setView('wakeup')`.
  React batches both state updates so `WakeUpScreen` receives
  `inProgress.sleepStartUtc` already set on first render. ✅
- `WakeUpScreen` guard: `sleepLog.inProgress?.sleepStartUtc &&` — the view
  only mounts once `sleepStartUtc` is defined. The `as` cast is safe because
  of this guard immediately to its left. ✅
- App-close persistence: `startSession` writes to `localStorage` immediately.
  `markSleepStart` writes the updated session via `setInProgress(prev => ...)`.
  On reload, the hook's `useState` initializer reads from `localStorage` and
  routes `LogPage` to `'inbed'` or `'wakeup'` accordingly. ✅

**Mahmoud must manually walk the live flow before confirming the commit.**

---

## Visual check

Mahmoud is performing the visual check manually. Expected observations:

- `/log` start view shows the Simple/Detailed mode toggle above the
  instructional text.
- Active button uses `bg-circa-accent text-white`; inactive uses
  `bg-circa-surface-raised text-circa-text-secondary`. No hardcoded colors.
- Simple mode: button label "Start Sleep", copy unchanged from before.
- Detailed mode: button label "In Bed?", copy updated.

---

## Final file list

| File | Status |
|---|---|
| `src/utils/parseElapsed.ts` | Created |
| `src/pages/log/InBedScreen.tsx` | Created |
| `src/lib/constants.ts` | Modified |
| `src/hooks/useSleepLog.ts` | Modified |
| `src/pages/log/StartSleepScreen.tsx` | Modified |
| `src/pages/log/WakeUpScreen.tsx` | Modified |
| `src/pages/log/LogPage.tsx` | Modified |
| `docs/CircaLog-TO-DO-list.md` | Modified |

# CC Task — Phase 1: Two-Step Timer Redesign + Simple/Detailed Mode

## Context

This task implements two items from `docs/CircaLog-TO-DO-list.md` (Sleep Log —
Core section) together, plus a new mode-toggle refinement agreed with Mahmoud:

1. Redesign the timer screen: replace the single "Start Sleep" button with a
   two-step flow — "In Bed?" → elapsed counter → "Going to Sleep?"
2. Persist the in-progress timer session across app close/reopen, across
   **both** gaps (In Bed → Going to Sleep, and Going to Sleep → Wake Up).
3. **New:** a Simple / Detailed mode toggle on the Log screen. Simple mode
   preserves today's exact one-tap behavior. Detailed mode is the new
   two-step flow. New users default to Simple; the toggle itself sets the
   persisted default (see "Mode behavior" below — this is intentional, not
   a partial implementation).

The full architecture note already exists in `docs/CircaLog-TO-DO-list.md`
under "Architecture note — two-step timer flow (decided Jun 2026)". Read
it before starting — this task file expands it with the mode toggle and
exact prop/type changes, but the underlying UX rationale lives there.

**Data model:** `SleepEntry` in `src/lib/circadian/types.ts` does NOT change.
`bedTimeUtc` is already optional and already exists. No migration needed.
Do not touch `src/lib/circadian/types.ts` in this task.

---

## Read first

- `docs/CircaLog-TO-DO-list.md` — search for "two-step timer flow" for the
  full architecture note (Step 1 / Step 2 behavior, the WakeUpScreen
  companion change wording, the "Onset: 0 min" nudge text).
- `.claude/skills/run/SKILL.md` — before starting the dev server for
  verification.
- `.claude/skills/visual-check/SKILL.md` — before any Playwright check.
  **Important scope limit:** Playwright in this project is configured for
  static rendering checks only (initial page state, CSS tokens). It cannot
  simulate clicks through the two-step flow. Do not attempt to script the
  full In Bed → Going to Sleep → Wake Up flow with Playwright — verify that
  code path by careful manual review instead, and say so plainly in the
  session report. Mahmoud will manually walk the live flow himself before
  confirming the commit.

---

## Files touched

- `src/lib/constants.ts` — edit (add one constant)
- `src/hooks/useSleepLog.ts` — edit (extend session shape + new functions)
- `src/pages/log/StartSleepScreen.tsx` — edit (becomes pre-session screen + mode toggle)
- `src/pages/log/InBedScreen.tsx` — **new file** (Step 1 UI)
- `src/pages/log/WakeUpScreen.tsx` — edit (companion change)
- `src/pages/log/LogPage.tsx` — edit (routing + view state)
- `src/utils/parseElapsed.ts` — **new file** (shared helper, see below)
- `docs/CircaLog-TO-DO-list.md` — edit (check off the two items, add a short
  note that the mode toggle was folded in)

7 files touched/created — **Tier 2**, single session, no new dependencies.

---

## 1. `src/utils/parseElapsed.ts` (new file)

`WakeUpScreen.tsx` currently has a private `parseElapsed(ms)` helper that
converts milliseconds into `{ h, m }`. `InBedScreen.tsx` needs the identical
logic. Extract it into a shared utility so it is defined once.

```typescript
/**
 * Converts an elapsed duration in milliseconds into hours and minutes.
 * Used by the in-progress timer screens (InBedScreen, WakeUpScreen) to
 * render a live "Xh Ym" counter.
 */
export function parseElapsed(ms: number): { h: number; m: number } {
  const totalMin = Math.floor(ms / 60000);
  return { h: Math.floor(totalMin / 60), m: totalMin % 60 };
}
```

Update `WakeUpScreen.tsx` to import this from `@/utils/parseElapsed` instead
of defining it locally, and delete the local copy.

---

## 2. `src/lib/constants.ts` (edit)

Add a second key, following the existing doc-comment style exactly:

```typescript
/**
 * Key used to persist the user's preferred Sleep Log mode ('simple' or
 * 'detailed'). Defaults to 'simple' when absent — new users always see
 * today's one-tap timer behavior unless they explicitly switch.
 *
 * Set by the mode toggle on StartSleepScreen. There is currently no
 * separate Settings UI for this — the toggle on the Log screen IS the
 * mechanism for changing the default, by design (see CC_TASK_Phase1_
 * TimerTwoStepRedesign.md). When a real Settings page is built, it can
 * read/write this same key.
 */
export const SLEEP_LOG_MODE_KEY = 'circalog-sleep-log-mode';
```

---

## 3. `src/hooks/useSleepLog.ts` (edit)

### 3a. New type

Add alongside the existing `InProgressSession` interface (keep the existing
"UI-level state only — not a domain type; do not export" comment style):

```typescript
// UI-level state only — not a domain type. Exported (unlike
// InProgressSession below, which stays unexported) because LogPage and
// StartSleepScreen need it for prop typing.
export type SleepLogMode = 'simple' | 'detailed';
```

Only `SleepLogMode` crosses the file boundary — `InProgressSession` itself
stays unexported, same as today.

### 3b. Replace the `InProgressSession` interface

Current shape:

```typescript
interface InProgressSession {
  bedTimeUtc: string;
  startedAt: string;
}
```

New shape — `sleepStartUtc` becomes the signal for which step we're in,
so there is no separate redundant `step` field to keep in sync:

```typescript
interface InProgressSession {
  mode: SleepLogMode;
  bedTimeUtc: string;        // always set — Step 1 tap (detailed) or the
                              // single tap (simple)
  sleepStartUtc?: string;    // set once Step 2 happens. In simple mode this
                              // is set immediately, equal to bedTimeUtc —
                              // identical to today's behavior.
}
```

Remove `startedAt` entirely. Everywhere it was used for the elapsed-time
calculation, the correct source is now either `bedTimeUtc` (while in the
"in bed" step) or `sleepStartUtc` (once sleeping) — see WakeUpScreen and
InBedScreen sections below.

### 3c. Defensive read on init

The existing `useState` initializer that reads from `localStorage` already
has a try/catch. Tighten the validation so a session saved under the OLD
shape (no `mode` field — from before this change) doesn't get parsed as
valid and cause confusing downstream behavior. If `mode` is missing on the
parsed object, treat it as invalid and clear the stored key:

```typescript
const [inProgress, setInProgress] = useState<InProgressSession | null>(() => {
  try {
    const raw = localStorage.getItem(SLEEP_IN_PROGRESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<InProgressSession>;
    if (!parsed.mode || !parsed.bedTimeUtc) {
      // Stale shape from before the two-step redesign — discard rather
      // than risk an inconsistent mid-session state.
      localStorage.removeItem(SLEEP_IN_PROGRESS_KEY);
      return null;
    }
    return parsed as InProgressSession;
  } catch {
    return null;
  }
});
```

### 3d. Mode state — read default, expose setter

Add near the `inProgress` state:

```typescript
const [mode, setModeState] = useState<SleepLogMode>(() => {
  const stored = localStorage.getItem(SLEEP_LOG_MODE_KEY);
  return stored === 'detailed' ? 'detailed' : 'simple';
});

// Updates the active mode AND persists it as the new default. This is
// intentional — see the doc comment on SLEEP_LOG_MODE_KEY in constants.ts.
function setMode(next: SleepLogMode): void {
  localStorage.setItem(SLEEP_LOG_MODE_KEY, next);
  setModeState(next);
}
```

### 3e. Rewrite `startSession`

```typescript
function startSession(currentMode: SleepLogMode): void {
  const now = new Date().toISOString();
  const session: InProgressSession =
    currentMode === 'simple'
      ? { mode: 'simple', bedTimeUtc: now, sleepStartUtc: now }
      : { mode: 'detailed', bedTimeUtc: now, sleepStartUtc: undefined };
  localStorage.setItem(SLEEP_IN_PROGRESS_KEY, JSON.stringify(session));
  setInProgress(session);
}
```

Callers now must pass the mode explicitly (LogPage will pass `mode` from
this same hook — see below).

### 3f. New function — `markSleepStart`

Called when the user taps "Going to Sleep?" in detailed mode Step 1:

```typescript
function markSleepStart(): void {
  setInProgress(prev => {
    if (!prev) return prev;
    const updated: InProgressSession = {
      ...prev,
      sleepStartUtc: new Date().toISOString(),
    };
    localStorage.setItem(SLEEP_IN_PROGRESS_KEY, JSON.stringify(updated));
    return updated;
  });
}
```

### 3g. Update the hook's return statement

Add `mode`, `setMode`, `markSleepStart` to the returned object, grouped with
the existing in-progress session items:

```typescript
return {
  // DB state
  entries,
  isLoading,
  error,
  // DB mutations
  createEntry,
  updateEntry,
  softDeleteEntry,
  hardDeleteEntry,
  // Lookup
  getEntryById,
  // Mode
  mode,
  setMode,
  // In-progress session
  inProgress,
  startSession,
  markSleepStart,
  clearSession,
};
```

---

## 4. `src/pages/log/StartSleepScreen.tsx` (edit)

This becomes the **pre-session screen only**. It now needs `mode` and
`onModeChange` props, and its copy/button label depend on `mode`.

```typescript
interface StartSleepScreenProps {
  mode: 'simple' | 'detailed';
  onModeChange: (mode: 'simple' | 'detailed') => void;
  onStartSleep: () => void;
  inProgress: { bedTimeUtc: string; sleepStartUtc?: string } | null;
}
```

(Import `SleepLogMode` from `@/hooks/useSleepLog` instead of inlining the
union type, if that's cleaner — match whatever import style the rest of
the file already uses for hook-adjacent types.)

Keep the existing `if (inProgress) return <Redirecting…/>` safety fallback
— LogPage routing should never actually render this screen while a session
is active, but keep the net.

Add a small mode toggle above the existing instructional text. Match the
existing segmented-button visual pattern already used elsewhere in this
codebase (e.g. the Yes/No buttons in `WakeUpScreen.tsx` / `ManualEntryForm.tsx`
— `aria-pressed`, `min-h-[44px]`, `bg-circa-accent text-white` when active vs
`bg-circa-surface-raised text-circa-text-secondary` when inactive):

```tsx
<div className="flex gap-2" role="group" aria-label="Sleep log mode">
  {(['simple', 'detailed'] as const).map(m => (
    <button
      key={m}
      type="button"
      aria-pressed={mode === m}
      onClick={() => onModeChange(m)}
      className={[
        'px-4 py-2 rounded-lg text-sm font-medium capitalize min-h-11',
        mode === m
          ? 'bg-circa-accent text-white'
          : 'bg-circa-surface-raised text-circa-text-secondary',
      ].join(' ')}
    >
      {m}
    </button>
  ))}
</div>
```

Update the instructional copy and button conditionally on `mode`:

- **Simple:** "Tap when you're ready to sleep. CircaLog will record the
  time." — button label "Start Sleep" (unchanged from today).
- **Detailed:** "Tap when you get into bed. We'll ask again when you're
  actually falling asleep." — button label "In Bed?"

The button's `onClick` stays `onStartSleep` in both cases — the branching
on what `startSession` actually records happens inside the hook (3e above),
not here.

---

## 5. `src/pages/log/InBedScreen.tsx` (new file)

Step 1 UI for detailed mode. Modeled closely on the existing structure of
`WakeUpScreen.tsx` (live counter + a primary and a secondary action), but
much simpler — no form fields yet.

```typescript
import { useState, useEffect } from 'react';
import { parseElapsed } from '@/utils/parseElapsed';

interface InBedScreenProps {
  inProgress: { bedTimeUtc: string };
  onGoingToSleep: () => void;
  onAbandon: () => void;
  clearSession: () => void;
}

const GRACE_PERIOD_MS = 10_000;

export default function InBedScreen({
  inProgress,
  onGoingToSleep,
  onAbandon,
  clearSession,
}: InBedScreenProps) {
  const [elapsed, setElapsed] = useState(() =>
    parseElapsed(Date.now() - new Date(inProgress.bedTimeUtc).getTime())
  );
  const [canProceed, setCanProceed] = useState(false);

  useEffect(() => {
    const tick = setInterval(() => {
      setElapsed(parseElapsed(Date.now() - new Date(inProgress.bedTimeUtc).getTime()));
    }, 1000);
    const grace = setTimeout(() => setCanProceed(true), GRACE_PERIOD_MS);
    return () => {
      clearInterval(tick);
      clearTimeout(grace);
    };
  }, [inProgress.bedTimeUtc]);

  function handleAbandon() {
    clearSession();
    onAbandon();
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-6">
      <div className="text-center">
        <p className="text-circa-text-secondary text-sm mb-1">In bed for</p>
        <p className="text-circa-text-primary font-heading text-4xl font-semibold tracking-tight tabular-nums">
          {elapsed.h}h {String(elapsed.m).padStart(2, '0')}m
        </p>
      </div>

      <button
        type="button"
        onClick={onGoingToSleep}
        disabled={!canProceed}
        className="w-48 h-48 rounded-full bg-circa-accent flex items-center justify-center
                   shadow-lg active:scale-95 transition-transform disabled:opacity-40
                   disabled:active:scale-100"
      >
        <span className="text-white font-heading font-semibold text-xl text-center px-4">
          Going to Sleep?
        </span>
      </button>

      <button
        type="button"
        onClick={handleAbandon}
        className="text-circa-text-muted text-sm py-2 min-h-11"
      >
        Abandon session
      </button>
    </div>
  );
}
```

Notes:

- `disabled:active:scale-100` cancels the press-animation while disabled —
  small touch, but keeps a disabled button from looking interactive.
- The grace period is a flat 10 seconds with no countdown UI. If Mahmoud
  wants a visible countdown later, that's a follow-up — not in scope here.

---

## 6. `src/pages/log/WakeUpScreen.tsx` (edit)

### 6a. Prop type

```typescript
interface WakeUpScreenProps {
  inProgress: { mode: 'simple' | 'detailed'; bedTimeUtc: string; sleepStartUtc: string };
  // ...rest unchanged
}
```

`sleepStartUtc` is no longer optional here — `LogPage` only routes to this
screen once it's set (see section 7).

### 6b. Elapsed counter now tracks from `sleepStartUtc`, not `bedTimeUtc`

Today:

```typescript
const [elapsed, setElapsed] = useState(() =>
  parseElapsed(Date.now() - new Date(inProgress.startedAt).getTime())
);
```

Change to:

```typescript
const [elapsed, setElapsed] = useState(() =>
  parseElapsed(Date.now() - new Date(inProgress.sleepStartUtc).getTime())
);
```

And the `useEffect` interval + its dependency array — change
`inProgress.startedAt` to `inProgress.sleepStartUtc` in both places. This
is a correctness fix: today `startedAt` always equaled `bedTimeUtc` because
there was no separate step, so the counter was accidentally correct. Now
that the two can differ, "Sleep duration so far" must count from when
sleep actually started, not from bed time.

### 6c. Pre-fill "Fell Asleep" from `sleepStartUtc`, not `bedTimeUtc`

The existing `sleepDate`/`sleepTime` initializers read from
`inProgress.bedTimeUtc` — change both to read from `inProgress.sleepStartUtc`
instead, since that's now the accurate value in detailed mode (and still
identical to `bedTimeUtc` in simple mode, so no behavior change there).

### 6d. New read-only "In Bed" display + onset summary

Add this directly above the existing "Fell Asleep" field block, matching
the wording from the TO-DO architecture note exactly:

```tsx
{(() => {
  const bedMs = new Date(inProgress.bedTimeUtc).getTime();
  const sleepMs = new Date(inProgress.sleepStartUtc).getTime();
  const onsetMin = Math.max(0, Math.round((sleepMs - bedMs) / 60000));
  const bedLabel = new Date(inProgress.bedTimeUtc).toLocaleTimeString([], {
    hour: 'numeric', minute: '2-digit',
  });
  const sleepLabel = new Date(inProgress.sleepStartUtc).toLocaleTimeString([], {
    hour: 'numeric', minute: '2-digit',
  });
  return (
    <div className="text-center">
      <p className="text-circa-text-secondary text-sm">
        In bed: {bedLabel} → Fell asleep: {sleepLabel} → Onset: {onsetMin} min
      </p>
      {onsetMin === 0 && (
        <p className="text-circa-text-muted text-xs mt-1">
          Did you fall asleep immediately?
        </p>
      )}
    </div>
  );
})()}
```

Place this above the existing "Fell Asleep" `<label htmlFor="sleepDate">`
block. The "Fell Asleep" date/time inputs remain fully editable exactly as
they are today — this new block is purely informational, read-only, and
recalculates live as the user edits the "Fell Asleep" fields below it
(since it reads from the same `sleepDate`/`sleepTime` state — wire it to
those state values, not directly to `inProgress.sleepStartUtc`, so it stays
in sync if the user adjusts the field).

Use the existing `toUtcIso` helper already in this file to convert the
live `sleepDate`/`sleepTime` state back to a comparable timestamp for the
onset calculation, rather than the two separate `new Date(...)` calls shown
above — that sketch is illustrative; wire it to the actual editable state
so the "Onset" figure updates as the user types.

---

## 7. `src/pages/log/LogPage.tsx` (edit)

### 7a. View type

```typescript
type View = 'start' | 'manual' | 'inbed' | 'wakeup';
```

### 7b. Initial view — derive from whether `sleepStartUtc` is set

```typescript
const [view, setView] = useState<View>(() => {
  if (!sleepLog.inProgress) return 'start';
  return sleepLog.inProgress.sleepStartUtc ? 'wakeup' : 'inbed';
});
```

### 7c. Handlers

```typescript
function handleStartSleep() {
  sleepLog.startSession(sleepLog.mode);
  setView(sleepLog.mode === 'simple' ? 'wakeup' : 'inbed');
}

function handleGoingToSleep() {
  sleepLog.markSleepStart();
  setView('wakeup');
}

function handleWakeComplete() {
  setView('start');
}

function handleAbandon() {
  setView('start');
}
```

(`handleWakeComplete` and `handleAbandon` are unchanged from today — kept
here just to show the full set together.)

### 7d. Render

Pass `mode` and `setMode` down to `StartSleepScreen`:

```tsx
{view === 'start' && (
  <StartSleepScreen
    mode={sleepLog.mode}
    onModeChange={sleepLog.setMode}
    onStartSleep={handleStartSleep}
    inProgress={sleepLog.inProgress}
  />
)}
```

Add the new `inbed` view:

```tsx
{view === 'inbed' && sleepLog.inProgress && (
  <InBedScreen
    inProgress={sleepLog.inProgress}
    onGoingToSleep={handleGoingToSleep}
    onAbandon={handleAbandon}
    clearSession={sleepLog.clearSession}
  />
)}
```

**Important — this is not just a structural no-op.** `sleepLog.inProgress`
is typed as `InProgressSession | null`, where `sleepStartUtc` is *optional*
(section 3b). `WakeUpScreenProps.inProgress` (section 6a) requires
`sleepStartUtc: string`. Checking `view === 'wakeup' && sleepLog.inProgress`
only narrows nullability — it does not change the type of `sleepStartUtc`
within `inProgress`, so passing `sleepLog.inProgress` straight into
`<WakeUpScreen>` will fail `npm run build` with a type error, even though
the runtime invariant (this view is only reached once `sleepStartUtc` is
set) genuinely holds. TypeScript has no way to know that invariant from
this check alone.

Guard on the actual field and cast at the render site:

```tsx
{view === 'wakeup' && sleepLog.inProgress?.sleepStartUtc && (
  <WakeUpScreen
    inProgress={sleepLog.inProgress as {
      mode: SleepLogMode;
      bedTimeUtc: string;
      sleepStartUtc: string;
    }}
    onComplete={handleWakeComplete}
    onAbandon={handleAbandon}
    createEntry={sleepLog.createEntry}
    clearSession={sleepLog.clearSession}
    error={sleepLog.error}
    isLoading={sleepLog.isLoading}
  />
)}
```

The `?.sleepStartUtc` check is the real runtime guarantee; the `as` cast
is only safe *because* that check is there immediately to its left — do
not cast without it. Import `SleepLogMode` from `@/hooks/useSleepLog` in
this file for the cast's type annotation.

Also hide the "Log manually" header button while `view === 'inbed'`, same
as it's already hidden for `'wakeup'` — add `'inbed'` to whatever condition
currently checks `view === 'start'` for showing that button (it should only
show on `'start'`, so this is likely already correct without changes —
just verify, don't assume).

---

## 8. `docs/CircaLog-TO-DO-list.md` (edit)

Check off both items:

```text
- [x] 🔴 Redesign timer screen: replace single "Start Sleep" button with two-step flow
- [x] 🔴 Persist in-progress timer session across app close/reopen
```

Add a short note immediately below the existing architecture note (don't
rewrite the architecture note itself) recording that the Simple/Detailed
mode toggle was folded into this work, with one sentence pointing at this
task file by name for anyone tracing the history later.

---

## 9. Build verification

Run, in order:

```bash
npm run build
```

```bash
npm run test
```

Both must pass with zero errors before writing the session report. If
`npm run test` surfaces failures unrelated to this change (pre-existing),
note them explicitly in the report rather than silently ignoring or fixing
them — fixing unrelated failures is out of scope for this task.

---

## 10. Visual check

Per `.claude/skills/run/SKILL.md`, start the dev server and use Playwright
for a **static** screenshot of the `/log` route's initial `'start'` view in
both light and dark theme, confirming the new mode toggle renders correctly
and matches existing token usage (no hardcoded colors, only `circa-*`
classes). Do not attempt to script clicks through the two-step flow — see
the scope limit noted in "Read first" above.

---

## 11. Session report (required — do not skip)

Write a comprehensive Markdown report to `tasks/cc-reports/` per
`.claude/memory/session_report_policy.md` and the naming convention in
`.claude/memory/feedback_report_conventions.md`:

```text
REPORT_phase1-timer-two-step-redesign_{DD}-{mon}-{YYYY}.md
```

The report must cover:

- All files created/modified, with a short description of the change in each
- Confirmation that `npm run build` and `npm run test` both passed (paste
  the relevant output)
- Any deviations from this task file, and why
- Explicit confirmation that the two-step click-through flow was verified
  by manual code review, not Playwright (per the scope limit above) —
  state this plainly so Mahmoud knows manual testing is still needed
- Zero markdownlint warnings in the report itself (blank line before and
  after every fenced code block — no exceptions)

Paste a short summary into the Claude.ai chat and **wait for explicit
confirmation before running any git commit.**

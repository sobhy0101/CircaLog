# CC TASK — Phase 1: UI Polish — Sync Status Tab, Toast Repositioning, Date Format Fix, Offline State

**Assigned to:** Claude Code
**Date written:** 07 Jun 2026
**Prerequisite completed:** Sync status pill — UI fixes (`REPORT_phase1-sync-status-ui_*.md`)

---

## Context

Four independent UI issues found during post-sync testing on mobile.
All are low-risk, no new dependencies, no schema changes.

1. **Sync status pill → tab shape** — The floating pill is visually
   indistinct from other pill elements (quality picker, badges). Replace it
   with a tab shape that hangs from the top edge of the viewport: flat top,
   rounded bottom corners, anchored to `top-0 left-1/2 -translate-x-1/2`.
   Keep all existing colors, states, dots, and labels exactly as-is.
   Only the shape and position change.

2. **Offline sync state** — When `navigator.onLine === false`, the pill
   currently flickers through "Syncing…" → "Synced" because `flushQueue`
   runs, all pushes fail, and entries re-queue into a briefly-empty queue.
   Fix: check `navigator.onLine` before attempting any push in `syncService.ts`,
   and add a dedicated `'offline'` status to `useSyncStatus` and the tab.

3. **Toast repositioned to bottom-center** — Move auth toasts from
   `top-4` to `bottom-20` (above the 64px tab bar). Add `w-[90%] max-w-sm`
   width constraint so long names like "Welcome, Mahmoud Sobhy!" never
   wrap to three lines. Add a `slide-up` animation replacing `fade-in`.

4. **DD/MM/YYYY date label** — `<input type="date">` shows MM/DD/YYYY on
   en-US browsers. Add a small `DD/MM/YYYY`-formatted label below each
   date input in `ManualEntryForm.tsx` showing the currently selected
   date so the correct date is always unambiguous regardless of locale.

---

## Step 0 — Read project skills

Before writing any code, read:

- `.claude/skills/token-usage/SKILL.md`
- `.claude/skills/visual-check/SKILL.md`
- `.claude/skills/run/SKILL.md`

---

## Step 1 — Add `slide-up` animation to `index.css`

Read `src/index.css` first.

Add the following `@keyframes` block immediately after the `spin-slow`
keyframe (before the `@theme inline` block):

```css
@keyframes slide-up {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

Add the token inside `@theme inline`, immediately after
`--animate-spin-slow`:

```css
  --animate-slide-up: slide-up 150ms ease-out;
```

No other changes to `index.css`.

---

## Step 2 — Add `'offline'` to `SyncStatus` and update `useSyncStatus.ts`

Read `src/hooks/useSyncStatus.ts` first.

### 2a — Add `'offline'` to the `SyncStatus` union type

```typescript
export type SyncStatus =
  | 'signed-out'  // user is not signed in — tab hidden
  | 'offline'     // navigator.onLine is false — data saved locally only
  | 'syncing'     // a sync operation is currently in progress
  | 'error'       // one or more entries have failed 3+ times
  | 'pending'     // entries are queued but no error yet
  | 'synced'      // queue is empty and no errors — fully in sync
```

### 2b — Track `isOnline` in the hook

Add `isOnline` state and a `window` event listener alongside the polling
`useEffect`. The listener updates `isOnline` whenever the browser fires
`online` or `offline` events. Also read `navigator.onLine` on mount so
the initial state is correct without waiting for an event.

```typescript
const [isOnline, setIsOnline] = useState(() => navigator.onLine)

useEffect(() => {
  function handleOnline()  { setIsOnline(true)  }
  function handleOffline() { setIsOnline(false) }
  window.addEventListener('online',  handleOnline)
  window.addEventListener('offline', handleOffline)
  return () => {
    window.removeEventListener('online',  handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}, [])
```

### 2c — Update priority order in the derived `status` value

`'offline'` sits between `'signed-out'` and `'syncing'` — it overrides
everything except the "not signed in" case:

```typescript
const status: SyncStatus = !user
  ? 'signed-out'
  : !isOnline
    ? 'offline'
    : isActivelySyncing
      ? 'syncing'
      : hasError
        ? 'error'
        : pendingCount > 0
          ? 'pending'
          : 'synced'
```

---

## Step 3 — Guard pushes on `navigator.onLine` in `syncService.ts`

Read `src/lib/supabase/syncService.ts` first.

### 3a — Guard `pushEntry`

At the very top of `pushEntry`, before the `toSupabaseRow` call, add:

```typescript
// Do not attempt a network push while offline. The entry is already
// in the sync queue (or will be added by the caller) — it will be
// retried when connectivity is restored.
if (!navigator.onLine) return
```

### 3b — Guard `flushQueue`

At the top of `flushQueue`, after the `queued.length === 0` guard, add:

```typescript
// Nothing to do while offline — the online event handler in useAuth.ts
// calls flushQueue again when connectivity is restored.
if (!navigator.onLine) return
```

These two guards prevent the "Syncing… → Synced" flicker by stopping
any push attempt before it starts, so the queue stays non-empty and
`useSyncStatus` correctly shows `'offline'` instead of `'synced'`.

---

## Step 4 — Update the sync tab in `AppShell.tsx`

Read `src/pages/AppShell.tsx` first.

Replace the entire sync status block
(the `{status !== 'signed-out' && ( ... )}` section) with the following.

**Shape change:** The element moves from a floating pill
(`rounded-full fixed top-3`) to a tab shape (`rounded-b-xl fixed top-0`).
The tab is flat on top (anchored flush to the top edge of the viewport),
with rounded bottom corners only. It uses a subtle drop-shadow to lift
it off the dark background.

**New `'offline'` state:** Slate/neutral colors — offline is expected,
not alarming. Use a static cloud icon instead of a dot.

```tsx
{/* Sync status tab — shows only when signed in.
    Tab shape: flat top anchored to viewport top, rounded bottom corners.
    Sits above page content without floating over it. */}
{status !== 'signed-out' && (
  <div
    aria-live="polite"
    aria-label={
      status === 'syncing' ? 'Syncing data' :
      status === 'error'   ? 'Sync error — some entries could not be saved to the cloud' :
      status === 'pending' ? 'Sync pending' :
      status === 'offline' ? 'Offline — data saved locally' :
      'Data synced'
    }
    className={[
      'fixed top-0 left-1/2 -translate-x-1/2 z-50',
      'flex items-center gap-1.5',
      'rounded-b-xl px-4 py-1.5 text-xs font-medium',
      'border-x border-b transition-colors duration-300 select-none',
      'shadow-md',
      status === 'synced'
        ? 'bg-circa-surface border-circa-border text-circa-text-muted'
        : status === 'offline'
          ? 'bg-circa-surface border-circa-border text-circa-text-secondary'
          : status === 'syncing'
            ? 'bg-circa-warning-subtle border-circa-warning text-circa-warning'
            : status === 'error'
              ? 'bg-circa-error-subtle border-circa-error text-circa-error'
              : /* pending */
                'bg-circa-accent-subtle border-circa-accent text-circa-accent',
    ].join(' ')}
  >
    {/* Icon */}
    {status === 'syncing' ? (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3 w-3"
        style={{ animation: 'spin-slow 1.5s linear infinite' }}
        aria-hidden="true"
      >
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M8 16H3v5" />
      </svg>
    ) : status === 'offline' ? (
      /* Cloud-off icon — offline is neutral, not an error */
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3 w-3"
        aria-hidden="true"
      >
        <path d="M2 2l20 20" />
        <path d="M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-8.814" />
        <path d="M21.532 12.6A4.5 4.5 0 0 0 17.5 6a4.49 4.49 0 0 0-1.785.366" />
      </svg>
    ) : status === 'error' ? (
      <span className="h-1.5 w-1.5 rounded-full bg-circa-error" aria-hidden="true" />
    ) : status === 'pending' ? (
      <span className="h-1.5 w-1.5 rounded-full bg-circa-error animate-pulse" aria-hidden="true" />
    ) : (
      <span className="h-1.5 w-1.5 rounded-full bg-circa-text-muted" aria-hidden="true" />
    )}

    {/* Label */}
    {status === 'synced'   && 'Synced'}
    {status === 'syncing'  && 'Syncing…'}
    {status === 'pending'  && 'Pending sync'}
    {status === 'error'    && 'Sync error'}
    {status === 'offline'  && 'Saved — Offline'}
  </div>
)}
```

---

## Step 5 — Reposition Toast and add width constraint

Read `src/components/ui/Toast.tsx` first.

Make two changes to the Toast component:

### 5a — Move from top to bottom, constrain width

In the `className` of the outermost `<div>`, replace:

```tailwind
fixed top-4 left-1/2 -translate-x-1/2 z-[60]
```

with:

```tailwind
fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-sm
```

`bottom-20` (80px) clears the 64px bottom tab bar with breathing room.
`w-[90%] max-w-sm` prevents long names from wrapping to three lines.

### 5b — Replace `animate-fade-in` with `animate-slide-up`

In the same `className`, replace `animate-fade-in` with `animate-slide-up`.

The `slide-up` animation (added in Step 1) moves the toast from slightly
below its final position upward — the natural entry direction from the bottom
of the screen.

---

## Step 6 — Add DD/MM/YYYY display label to date inputs in `ManualEntryForm.tsx`

Read `src/pages/log/ManualEntryForm.tsx` first.

### 6a — Add a helper function near the top of the file

Add this pure function immediately after the `todayLocal` function:

```typescript
/**
 * Formats a YYYY-MM-DD string as DD/MM/YYYY for display.
 * Returns an empty string when the input is blank (field not yet filled).
 */
function formatDisplayDate(ymd: string): string {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y}`;
}
```

### 6b — Add a display label below each date input

There are three date inputs in the form: `bedDate`, `sleepDate`, `wakeDate`.
For each one, add a `<p>` immediately after the `<input type="date">` line
(inside the `flex gap-2` container, as a sibling):

For **Bed Time** (`bedDate`):

```tsx
<div className="flex gap-2">
  <div className="flex-1">
    <input
      id="bedDate"
      type="date"
      value={bedDate}
      onChange={e => setBedDate(e.target.value)}
      className={inputClass}
    />
    {bedDate && (
      <p className="text-circa-text-muted text-xs mt-0.5 pl-1">
        {formatDisplayDate(bedDate)}
      </p>
    )}
  </div>
  <input
    id="bedTime"
    type="time"
    value={bedTime}
    onChange={e => setBedTime(e.target.value)}
    className={`${inputClass} w-32`}
  />
</div>
```

Apply the same pattern to **Fell Asleep** (`sleepDate`) and
**Woke Up** (`wakeDate`). The date input must be wrapped in a `<div>`
to allow the label to sit below it without affecting the flex layout.
The time input (`w-32`) does not get a wrapper or a label.

The label only renders when the field has a value (`{bedDate && ...}`),
so it does not appear as an empty line when the field is blank.

---

## Step 7 — Build check

```powershell
cd C:\Projects\CircaLog
npm run build
```

Fix any TypeScript or lint errors before proceeding. Do not move to Step 8
until the build is clean.

---

## Step 8 — Dev server visual check

Start the dev server per `.claude/skills/run/SKILL.md`.

Run a Playwright static check per `.claude/skills/visual-check/SKILL.md`:

- Confirm the page loads at `http://localhost:5173/log` with no console errors.
- Save a screenshot to `tasks/screenshots/ui-polish-tab-and-toast.png`.

The following require **manual verification** by Mahmoud:

| # | Check |
|---|---|
| 1 | Sign in — sync tab appears at top center, flat top, rounded bottom corners |
| 2 | Tab shows "Synced" with static grey dot |
| 3 | Turn on airplane mode — tab shows "Saved — Offline" with cloud-off icon; no "Syncing…" flicker |
| 4 | Restore connectivity — tab briefly shows "Syncing…" then "Synced" |
| 5 | Sign in toast appears bottom-center, clears the tab bar, fits on 1–2 lines |
| 6 | Sign out toast appears bottom-center |
| 7 | Each date input shows a `DD/MM/YYYY` label below it when a date is selected |
| 8 | Dark mode — tab and toast look correct in all states |
| 9 | Light mode — same checks |

---

## Step 9 — Session report

Write a comprehensive Markdown session report covering:

- Every step and its outcome (✅ / ❌ / ⚠️)
- Whether the offline flicker was fully eliminated (requires airplane mode test)
- Whether `animate-slide-up` applied correctly or needed the inline style fallback
- Build output (clean or errors encountered and fixed)
- Full list of every file created or modified
- Any deviations from these instructions and the reason

Save to: `tasks/cc-reports/REPORT_phase1-ui-polish-tab-toast_{DD}-{mon}-{YYYY}.md`

Follow all markdownlint rules: blank line before and after every fenced
code block, zero warnings.

Paste a short summary into the Claude.ai chat and **wait for confirmation**
before running the git commit.

---

## Step 10 — Git commit (after Claude.ai confirmation only)

```powershell
cd C:\Projects\CircaLog
git add .
git commit -m "feat: sync status tab shape, offline state, toast bottom-center, DD/MM/YYYY date labels"
git push origin main
```

---

## Files to modify

| Path | Change |
|---|---|
| `src/index.css` | Add `slide-up` keyframe + `--animate-slide-up` token |
| `src/hooks/useSyncStatus.ts` | Add `'offline'` state, `isOnline` tracking |
| `src/lib/supabase/syncService.ts` | Guard `pushEntry` + `flushQueue` on `navigator.onLine` |
| `src/pages/AppShell.tsx` | Pill → tab shape, add `'offline'` state rendering |
| `src/components/ui/Toast.tsx` | Move to `bottom-20`, `w-[90%] max-w-sm`, `animate-slide-up` |
| `src/pages/log/ManualEntryForm.tsx` | Add `formatDisplayDate` helper + DD/MM/YYYY labels |

## No new files. No new dependencies

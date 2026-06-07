# CC TASK — Phase 1: Sync Status Pill — UI Fixes & Enhanced States

**Assigned to:** Claude Code
**Date written:** 07 Jun 2026
**Prerequisite completed:** Bidirectional sync service (`REPORT_phase1-sync-service_*.md`)

---

## Context

The sync status pill was built and verified working. Three issues were found
during manual testing:

1. **Position** — `fixed top-3 right-3` overlaps page content (the "Log
   manually" button on `/log`, the filter icon on `/log/history`).
2. **Pulse color** — the pending-state pulsing dot uses `circa-accent`
   (purple), which is nearly invisible against the purple pill background.
3. **Missing states** — the pill shows only "Synced" or "Pending sync".
   It needs "Syncing" (in-progress) and "Sync error" (repeated failure)
   states, each with appropriate color and icon.

This task also adds semantic color tokens (`circa-error`, `circa-warning`,
`circa-success`) to the design system, which are needed for the error state
and will be useful across the app in future tasks.

---

## Step 0 — Read project skills

Before writing any code, read:

- `.claude/skills/token-usage/SKILL.md`
- `.claude/skills/visual-check/SKILL.md`

---

## Step 1 — Add semantic color tokens to `index.css`

Read `src/index.css` first.

Add the following token definitions inside the `:root` block (light mode),
immediately after the last `--circa-accent-light` line:

```css
  /* Semantic state colors */
  --circa-success:        #16A34A; /* Green — confirmed sync, positive states */
  --circa-success-subtle: #DCFCE7; /* Green tint — success badge background */
  --circa-warning:        #D97706; /* Amber — in-progress, caution states */
  --circa-warning-subtle: #FEF3C7; /* Amber tint — warning badge background */
  --circa-error:          #DC2626; /* Red — sync error, destructive states */
  --circa-error-subtle:   #FEE2E2; /* Red tint — error badge background */
```

Add the same tokens inside the `.dark` block, after `--circa-accent-light`,
using dark-mode-appropriate values:

```css
  /* Semantic state colors */
  --circa-success:        #22C55E; /* Lifted green — readable on dark surfaces */
  --circa-success-subtle: #14532D; /* Dark green tint */
  --circa-warning:        #F59E0B; /* Lifted amber */
  --circa-warning-subtle: #78350F; /* Dark amber tint */
  --circa-error:          #EF4444; /* Lifted red — readable on dark surfaces */
  --circa-error-subtle:   #7F1D1D; /* Dark red tint */
```

Add the Tailwind mappings inside `@theme inline`, after the last
`--color-circa-accent-light` line:

```css
  --color-circa-success:        var(--circa-success);
  --color-circa-success-subtle: var(--circa-success-subtle);
  --color-circa-warning:        var(--circa-warning);
  --color-circa-warning-subtle: var(--circa-warning-subtle);
  --color-circa-error:          var(--circa-error);
  --color-circa-error-subtle:   var(--circa-error-subtle);
```

Also add a `spin-slow` animation for the syncing state rotating icon.
Add this keyframe block immediately after the existing `fade-in` keyframe,
still inside the top-level CSS (not inside `:root` or `.dark`):

```css
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
```

And add the animation token inside `@theme inline`:

```css
  --animate-spin-slow: spin-slow 1.5s linear infinite;
```

---

## Step 2 — Add sync state signal to `syncService.ts`

The `useSyncStatus` hook needs to know two things that it currently cannot:

- Whether a sync operation is currently in flight (`isSyncing`)
- Whether any entry has failed more than 3 times (`hasError`)

The cleanest approach is module-level variables in `syncService.ts` with
exported getter functions. `useSyncStatus` reads these on its polling
interval — no new files, no global state library needed.

Read `src/lib/supabase/syncService.ts` first, then apply these changes:

### 2a — Add module-level state near the top of the file

Add this block immediately after the imports, before the column mapping
helpers section:

```typescript
// ---------------------------------------------------------------------------
// Sync state — readable by useSyncStatus via the getters below
// ---------------------------------------------------------------------------

// True while syncOnConnect or flushQueue is actively running.
let _isSyncing = false

// Count of entries that have failed to push 3 or more times.
// Tracked in the sync queue via a `failCount` field (see SyncQueueEntry).
let _errorCount = 0

/** Returns true if a sync operation is currently in progress. */
export function isSyncing(): boolean { return _isSyncing }

/** Returns the number of entries that have failed to push 3+ times. */
export function errorCount(): number { return _errorCount }
```

### 2b — Update `SyncQueueEntry` in `types.ts`

The queue entry needs a `failCount` field to track repeated failures.

Read `src/lib/circadian/types.ts`. Find the `SyncQueueEntry` interface
and add one field:

```typescript
export interface SyncQueueEntry {
  /** The SleepEntry UUID that needs to be pushed to Supabase. */
  id: string;

  /** ISO 8601 UTC — when this entry was added to the queue. */
  queuedAt: string;

  /**
   * Number of times this entry has failed to push to Supabase.
   * When this reaches 3, the entry is considered errored and
   * the UI shows a "Sync error" state until the next successful push.
   * Defaults to 0 when first enqueued.
   */
  failCount: number;
}
```

### 2c — Update `enqueue` in `syncService.ts`

The `enqueue` helper currently always creates a fresh `SyncQueueEntry`
with no fail count. Update it to increment `failCount` if the entry is
already in the queue (i.e. it is failing repeatedly), rather than
resetting it:

Replace the existing `enqueue` function with:

```typescript
async function enqueue(id: string): Promise<void> {
  // Check if this entry is already queued (a previous push failed).
  const existing = await db.syncQueue.get(id)
  const failCount = existing ? existing.failCount + 1 : 1

  const item: SyncQueueEntry = { id, queuedAt: new Date().toISOString(), failCount }
  await db.syncQueue.put(item)

  // Recount error entries (failCount >= 3) and update the module-level flag.
  const all = await db.syncQueue.toArray()
  _errorCount = all.filter(e => e.failCount >= 3).length
}
```

Also update `dequeue` to recount `_errorCount` after a successful push:

```typescript
async function dequeue(id: string): Promise<void> {
  await db.syncQueue.delete(id)

  // Recount after removal so the error state clears when the push succeeds.
  const all = await db.syncQueue.toArray()
  _errorCount = all.filter(e => e.failCount >= 3).length
}
```

### 2d — Set `_isSyncing` in `syncOnConnect` and `flushQueue`

In `syncOnConnect`, add `_isSyncing = true` as the very first line of the
function body, and `_isSyncing = false` at every exit point (the early
`return` after a pull failure, and at the end of the function).

In `flushQueue`, add `_isSyncing = true` at the start and
`_isSyncing = false` at the end (including the early `return` when the
queue is empty).

Use a try/finally block in both functions to guarantee `_isSyncing` is
always reset even if an unexpected error is thrown:

```typescript
export async function flushQueue(user: User): Promise<void> {
  if (!supabase) return

  const queued = await db.syncQueue.toArray()
  if (queued.length === 0) return

  _isSyncing = true
  try {
    for (const item of queued) {
      const entry = await db.sleepEntries.get(item.id)
      if (entry) {
        await pushEntry(entry, user.id)
      } else {
        await dequeue(item.id)
      }
    }
  } finally {
    _isSyncing = false
  }
}
```

Apply the same try/finally pattern to `syncOnConnect`. The `_isSyncing`
setter wraps the entire function body after the null guard.

---

## Step 3 — Update `useSyncStatus.ts`

Read `src/hooks/useSyncStatus.ts` first, then replace the file entirely
with the following:

```typescript
// useSyncStatus.ts — exposes the current sync state so the UI can show
// an accurate status pill (synced / syncing / pending / error / signed-out).

import { useState, useEffect } from 'react'
import { db } from '@/lib/db/db'
import { useAuth } from '@/hooks/useAuth'
import { isSyncing, errorCount } from '@/lib/supabase/syncService'

export type SyncStatus =
  | 'signed-out'  // user is not signed in — pill hidden
  | 'syncing'     // a sync operation is currently in progress
  | 'error'       // one or more entries have failed 3+ times
  | 'pending'     // entries are queued but no error yet
  | 'synced'      // queue is empty and no errors — fully in sync

export function useSyncStatus() {
  const { user } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)
  const [isActivelySyncing, setIsActivelySyncing] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!user) {
      setPendingCount(0)
      setIsActivelySyncing(false)
      setHasError(false)
      return
    }

    // Poll every 2 seconds — fast enough to feel responsive without
    // being expensive. Reads three values per tick:
    //   - syncQueue row count (pending entries)
    //   - isSyncing() flag from syncService (active operation in flight)
    //   - errorCount() flag from syncService (entries that failed 3+ times)
    async function poll() {
      const count = await db.syncQueue.count()
      setPendingCount(count)
      setIsActivelySyncing(isSyncing())
      setHasError(errorCount() > 0)
    }

    poll() // run immediately on mount
    const interval = setInterval(poll, 2000)
    return () => clearInterval(interval)
  }, [user])

  // Priority order: signed-out → syncing → error → pending → synced
  const status: SyncStatus = !user
    ? 'signed-out'
    : isActivelySyncing
      ? 'syncing'
      : hasError
        ? 'error'
        : pendingCount > 0
          ? 'pending'
          : 'synced'

  return { status, pendingCount }
}
```

---

## Step 4 — Update the sync status pill in `AppShell.tsx`

Read `src/pages/AppShell.tsx` first, then replace the entire sync pill
block (the `{status !== 'signed-out' && ( ... )}` section) with the
following:

```tsx
{/* Sync status pill — shows only when signed in.
    Positioned top-center to avoid overlapping page content. */}
{status !== 'signed-out' && (
  <div
    aria-live="polite"
    aria-label={
      status === 'syncing' ? 'Syncing data' :
      status === 'error'   ? 'Sync error — some entries could not be saved to the cloud' :
      status === 'pending' ? 'Sync pending' :
      'Data synced'
    }
    className={[
      'fixed top-3 left-1/2 -translate-x-1/2 z-50',
      'flex items-center gap-1.5',
      'rounded-full px-3 py-1 text-xs font-medium',
      'border transition-colors duration-300 select-none',
      status === 'synced'
        ? 'bg-circa-surface border-circa-border text-circa-text-muted'
        : status === 'syncing'
          ? 'bg-circa-warning-subtle border-circa-warning text-circa-warning'
          : status === 'error'
            ? 'bg-circa-error-subtle border-circa-error text-circa-error'
            : /* pending */
              'bg-circa-accent-subtle border-circa-accent text-circa-accent',
    ].join(' ')}
  >
    {/* Icon / indicator dot */}
    {status === 'syncing' ? (
      /* Rotating arrows SVG for the syncing state */
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
    ) : status === 'error' ? (
      /* Exclamation dot for error */
      <span className="h-1.5 w-1.5 rounded-full bg-circa-error" aria-hidden="true" />
    ) : status === 'pending' ? (
      /* Pulsing dot for pending — red so it's visible against the purple pill */
      <span className="h-1.5 w-1.5 rounded-full bg-circa-error animate-pulse" aria-hidden="true" />
    ) : (
      /* Static dot for synced */
      <span className="h-1.5 w-1.5 rounded-full bg-circa-text-muted" aria-hidden="true" />
    )}

    {/* Label */}
    {status === 'synced'   && 'Synced'}
    {status === 'syncing'  && 'Syncing…'}
    {status === 'pending'  && 'Pending sync'}
    {status === 'error'    && 'Sync error'}
  </div>
)}
```

**Note on the spinning animation:** The `animate-spin-slow` Tailwind class
generated from the token added in Step 1 should work. However, if the
class does not apply correctly at runtime (Tailwind v4 sometimes needs a
full rebuild to pick up new `@keyframes` + `@theme` entries), the inline
`style={{ animation: 'spin-slow 1.5s linear infinite' }}` on the SVG is
the fallback — it references the `@keyframes spin-slow` directly and will
always work regardless of the Tailwind class. Both are included; the
inline style takes precedence, so this is safe to leave as-is.

---

## Step 5 — Build check

```powershell
cd C:\Projects\CircaLog
npm run build
```

Fix any TypeScript or lint errors before proceeding. Do not move to Step 6
until the build is clean.

---

## Step 6 — Dev server visual check

Start the dev server and run a Playwright static check per
`.claude/skills/visual-check/SKILL.md`:

- Confirm the page loads at `http://localhost:5173/log` with no
  console errors.
- Save a screenshot to `tasks/screenshots/sync-pill-updated.png`.

The following require **manual verification** by Mahmoud:

| # | Check |
|---|---|
| 1 | Sign in — pill appears at top-center, does not overlap any button or icon |
| 2 | Pill shows "Synced" with a static grey dot |
| 3 | Turn on airplane mode, add an entry — pill shows "Pending sync" with a **red** pulsing dot |
| 4 | Restore connectivity — pill briefly shows "Syncing…" with rotating arrows (orange/amber), then returns to "Synced" |
| 5 | Sign out — pill disappears |
| 6 | Dark mode — all pill states look correct (no clashing colors) |

---

## Step 7 — Session report

Write a comprehensive Markdown session report covering:

- Every step and its outcome (✅ / ❌ / ⚠️)
- Whether the `animate-spin-slow` Tailwind class worked or the inline
  style fallback was needed
- Build output (clean or errors encountered and fixed)
- Full list of every file created or modified
- Any deviations from these instructions and the reason

Save to:
`tasks/cc-reports/REPORT_phase1-sync-status-ui_{DD}-{mon}-{YYYY}.md`

Follow all markdownlint rules: blank line before and after every fenced
code block, zero warnings.

Paste a short summary into the Claude.ai chat and **wait for confirmation**
before running the git commit.

---

## Step 8 — Git commit (after Claude.ai confirmation only)

```powershell
cd C:\Projects\CircaLog
git add .
git commit -m "feat: sync pill — top-center position, error/syncing states, semantic color tokens"
git push origin main
```

---

## Files to modify

| Path | Change |
|---|---|
| `src/index.css` | Add `circa-success/warning/error` tokens + `spin-slow` keyframe |
| `src/lib/circadian/types.ts` | Add `failCount` to `SyncQueueEntry` |
| `src/lib/supabase/syncService.ts` | Add `isSyncing`/`errorCount` module state + try/finally guards |
| `src/hooks/useSyncStatus.ts` | Full rewrite — adds syncing/error states, 2s polling |
| `src/pages/AppShell.tsx` | Replace pill — top-center, 4 states, semantic colors |

## No new files. No new dependencies

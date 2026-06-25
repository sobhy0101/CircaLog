# CC TASK — Phase 1: Auth & Cloud Sync Hardening

**Assigned to:** Claude Code
**Date written:** 25 Jun 2026
**Prerequisite completed:** Bidirectional sync service
(`REPORT_phase1-sync-service_07-jun-2026.md`) and the sync status pill
(`REPORT_phase1-sync-status-ui_07-jun-2026.md`)

---

## Context

This task covers three items from `docs/CircaLog-TO-DO-list.md` under
**Auth & Cloud Sync** (lines 317–353):

1. Auth token refresh error handling
2. Supabase sync write rejection handling
3. Multi-device offline conflict resolution

Claude.ai read `syncService.ts`, `useAuth.ts`, `useSyncStatus.ts`,
`types.ts`, `Toast.tsx`, and `AppShell.tsx` before writing this task.
Two things are already true and do **not** need to be built from
scratch:

- **Multi-device conflict resolution is already implemented.**
  `syncOnConnect()` already does last-write-wins by `updatedAt` and never
  silently drops an entry. What's missing is a written decision record —
  there's a `docs/timezone-strategy.md` and `docs/cycle-number-strategy.md`
  but no `docs/sync-conflict-strategy.md`. Step 7 below writes it.
- **The sync status pill already exists** (`AppShell.tsx`, "Synced" /
  "Pending sync" / "Sync error" etc.). It just has no detail behind the
  "Sync error" state and the queue carries no diagnostic information.
  Steps 2–4 add that.

Mahmoud's decisions for this task (confirmed 25 Jun 2026):

- Stop auto-retrying an entry after 3 failed push attempts. It stays
  visible in the error state — never silently dropped — but background
  flushes stop hammering Supabase with a request that has already
  failed 3 times.
- When an entry hits the error state, show the user an error code and a
  brief description, and ask them to report it to the developer.
- The sync queue should carry detailed diagnostic information per entry
  (error code, error message, last-failed timestamp).
- The existing sync pill is the right place for all of this — tapping it
  in the error state should reveal the detail.
- The expired-session toast must explicitly tell the user they were
  signed out and let them sign back in, not just show a generic message.

One design call made while writing this task (flagging it so it's not a
surprise): the "stop after 3" rule is applied **only** inside
`flushQueue()` — the background retry path triggered by reconnecting or
returning to the tab. It is **not** applied to a fresh edit
(`syncAfterMutation`) or to `syncOnConnect`'s reconciliation push on
sign-in. This means editing a permanently-failed entry, or simply signing
back in, gives it one more attempt — which is how an entry ever recovers
once Mahmoud fixes whatever caused the original failure (e.g. an RLS
policy), without needing a manual "retry" button. If this isn't the
behaviour wanted, it's a one-line change (move the guard into
`pushEntry()` itself instead of `flushQueue()`) — flag it in the session
report rather than guessing further.

---

## Step 0 — Read project skills

Before writing any code, read:

- `.claude/skills/run/SKILL.md`
- `.claude/skills/visual-check/SKILL.md`

---

## Step 1 — Add diagnostic fields to `SyncQueueEntry`

Read `src/lib/circadian/types.ts` first. Find the `SyncQueueEntry`
interface (bottom of the file, under "Sync infrastructure") and replace
it entirely with:

```typescript
export interface SyncQueueEntry {
  /** The SleepEntry UUID that needs to be pushed to Supabase. */
  id: string;

  /**
   * ISO 8601 UTC — when this entry was first added to the queue (i.e.
   * the first time it failed to push). Does not change on subsequent
   * retries — see `lastFailedAt` for the most recent attempt.
   */
  queuedAt: string;

  /**
   * Number of times this entry has failed to push to Supabase.
   * When this reaches 3, the entry is considered errored: the UI shows
   * a "Sync error" state and `flushQueue()` stops automatically
   * retrying it (see `syncService.ts`). A direct edit to the entry, or
   * the next `syncOnConnect()` on sign-in, still gets a fresh attempt.
   * Defaults to 0 when first enqueued.
   */
  failCount: number;

  /**
   * Error code from the most recent failed push attempt, taken
   * verbatim from the Supabase/PostgREST error (e.g. "42501" for an
   * RLS violation) or "EXCEPTION" if the push call threw rather than
   * returning an error object. Undefined until the first failure.
   */
  lastErrorCode?: string;

  /**
   * Human-readable message from the most recent failed push attempt,
   * taken verbatim from the Supabase error. Shown to the user alongside
   * `lastErrorCode` in the sync error detail panel so they can report
   * it to the developer.
   */
  lastErrorMessage?: string;

  /** ISO 8601 UTC — when the most recent failed push attempt occurred. */
  lastFailedAt?: string;
}
```

---

## Step 2 — Capture diagnostics and stop-after-3 in `syncService.ts`

Read `src/lib/supabase/syncService.ts` first.

### 2a — Replace `enqueue()`

Find the `enqueue` function and replace it entirely with:

```typescript
/**
 * Adds a SleepEntry id to the sync queue, capturing diagnostic
 * information about why the push failed.
 *
 * Increments failCount if the entry is already queued (repeated
 * failure), rather than resetting it — so the error state accumulates
 * correctly. `queuedAt` is preserved from the first failure; only
 * `lastFailedAt` updates on every retry.
 */
async function enqueue(id: string, errorCode?: string, errorMessage?: string): Promise<void> {
  const existing = await db.syncQueue.get(id)
  const failCount = existing ? existing.failCount + 1 : 1

  const item: SyncQueueEntry = {
    id,
    queuedAt: existing?.queuedAt ?? new Date().toISOString(),
    failCount,
    lastErrorCode: errorCode,
    lastErrorMessage: errorMessage,
    lastFailedAt: new Date().toISOString(),
  }
  await db.syncQueue.put(item)

  // Recount error entries (failCount >= 3) and update the module-level flag.
  const all = await db.syncQueue.toArray()
  _errorCount = all.filter(e => e.failCount >= 3).length
}
```

### 2b — Replace `pushEntry()`

Find the `pushEntry` function and replace it entirely with:

```typescript
/**
 * Upserts a single SleepEntry to Supabase.
 *
 * On success: removes the entry from the sync queue (it is now in sync).
 * On failure: adds the entry to the sync queue with diagnostic
 * information so it will be retried and the user can see why.
 *
 * `onConflict: 'id'` means: if a row with this id already exists,
 * update it in place rather than failing with a duplicate-key error.
 *
 * Wrapped in try/catch as a defensive measure — supabase-js normally
 * returns `{ error }` rather than throwing, but an unexpected
 * network-level exception must not crash the caller or silently drop
 * the write. It is treated the same as a normal push failure.
 */
async function pushEntry(entry: SleepEntry, userId: string): Promise<void> {
  if (!supabase) return
  if (!SYNC_ENABLED) return
  // Do not attempt a network push while offline. The entry is already
  // in the sync queue (or will be added by the caller) — it will be
  // retried when connectivity is restored.
  if (!navigator.onLine) return

  const row = toSupabaseRow(entry, userId)

  try {
    const { error } = await supabase
      .from('sleep_entries')
      .upsert(row, { onConflict: 'id' })

    if (error) {
      console.warn(`syncService: push failed for ${entry.id}, queuing.`, error.message)
      await enqueue(entry.id, error.code, error.message)
    } else {
      await dequeue(entry.id)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn(`syncService: push threw for ${entry.id}, queuing.`, message)
    await enqueue(entry.id, 'EXCEPTION', message)
  }
}
```

### 2c — Replace `flushQueue()`

Find the `flushQueue` function and replace it entirely with:

```typescript
/**
 * Pushes all entries currently in the sync queue to Supabase.
 *
 * Called:
 *   - At the end of syncOnConnect (catches anything missed above).
 *   - When the browser fires an `online` event (connectivity restored).
 *   - When the app returns to the foreground (visibilitychange event).
 *
 * Entries that have already failed 3+ times are skipped here — see the
 * `failCount >= 3` check below. This stops the background retry path
 * from repeatedly hitting Supabase with a request that cannot succeed
 * (e.g. an RLS violation). The entry is NOT removed from the queue and
 * stays fully visible via the sync error pill/detail panel. It gets a
 * fresh attempt the next time it is directly edited (syncAfterMutation)
 * or on the next sign-in (syncOnConnect) — both call pushEntry()
 * directly and are not subject to this guard.
 */
export async function flushQueue(user: User): Promise<void> {
  if (!supabase) return
  if (!SYNC_ENABLED) return

  const queued = await db.syncQueue.toArray()
  if (queued.length === 0) return
  // Nothing to do while offline — the online event handler in useAuth.ts
  // calls flushQueue again when connectivity is restored.
  if (!navigator.onLine) return

  _isSyncing = true
  try {
    for (const item of queued) {
      const entry = await db.sleepEntries.get(item.id)
      if (!entry) {
        // Entry was hard-deleted locally — remove from queue silently.
        await dequeue(item.id)
        continue
      }
      if (item.failCount >= 3) {
        // Permanently failing — stop auto-retrying in the background.
        continue
      }
      await pushEntry(entry, user.id)
    }
  } finally {
    _isSyncing = false
  }
}
```

No changes needed to `dequeue()`, `syncAfterMutation()`, `syncOnConnect()`,
or `checkSupabaseReachable()` — leave them exactly as they are.

---

## Step 3 — Expose errored entries from `useSyncStatus.ts`

Read `src/hooks/useSyncStatus.ts` first, then replace the file entirely
with:

```typescript
// useSyncStatus.ts — exposes the current sync state so the UI can show
// an accurate status tab (synced / syncing / pending / error / offline / signed-out)
// plus diagnostic detail for any permanently-failed entries.

import { useState, useEffect } from 'react'
import { db } from '@/lib/db/db'
import { useAuth } from '@/hooks/useAuth'
import { isSyncing, errorCount } from '@/lib/supabase/syncService'
import type { SyncQueueEntry } from '@/lib/circadian'

export type SyncStatus =
  | 'signed-out'  // user is not signed in — tab hidden
  | 'offline'     // navigator.onLine is false — data saved locally only
  | 'syncing'     // a sync operation is currently in progress
  | 'error'       // one or more entries have failed 3+ times
  | 'pending'     // entries are queued but no error yet
  | 'synced'      // queue is empty and no errors — fully in sync

export function useSyncStatus() {
  const { user } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)
  const [isActivelySyncing, setIsActivelySyncing] = useState(false)
  const [hasError, setHasError] = useState(false)
  // Entries with failCount >= 3 — surfaced in the sync error detail panel
  // so the user can see the error code/message and report it.
  const [erroredEntries, setErroredEntries] = useState<SyncQueueEntry[]>([])
  // Initialised from navigator.onLine so the very first render is correct.
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)

  // Track browser online/offline events independently of the polling interval.
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

  useEffect(() => {
    if (!user) {
      setPendingCount(0)
      setIsActivelySyncing(false)
      setHasError(false)
      setErroredEntries([])
      return
    }

    // Poll every 2 seconds — fast enough to feel responsive without
    // being expensive. Reads from the syncQueue table and the
    // syncService module-level flags on every tick.
    async function poll() {
      const all = await db.syncQueue.toArray()
      setPendingCount(all.length)
      setErroredEntries(all.filter(e => e.failCount >= 3))
      setIsActivelySyncing(isSyncing())
      setHasError(errorCount() > 0)
    }

    poll() // run immediately on mount
    const interval = setInterval(poll, 2000)
    return () => clearInterval(interval)
  }, [user])

  // Priority order: signed-out → offline → syncing → error → pending → synced
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

  return { status, pendingCount, erroredEntries }
}
```

---

## Step 4 — Sync error detail panel in `AppShell.tsx`

Read `src/pages/AppShell.tsx` first.

### 4a — Update the destructured hook call

Find:

```typescript
const { status } = useSyncStatus();
```

Replace with:

```typescript
const { status, erroredEntries } = useSyncStatus();
const [showSyncErrorDetail, setShowSyncErrorDetail] = useState(false);
```

(`useState` is already imported at the top of this file — no new import
needed.)

### 4b — Make the pill tappable in the error state, and add the detail panel

Find the entire sync status pill block — it starts with the comment
`{/* Sync status tab — shows only when signed in. ... */}` and ends with
the closing `)}` right before the `{/* Changelog modal ... */}` comment.

Replace that whole block with:

```tsx
{/* Sync status tab — shows only when signed in.
    Tab shape: flat top anchored to viewport top, rounded bottom corners.
    Sits above page content without floating over it.
    In the error state, the tab becomes a button that toggles the
    diagnostic detail panel below it. */}
{status !== 'signed-out' && (() => {
  const pillClassName = [
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
            ? 'bg-circa-error-subtle border-circa-error text-circa-error cursor-pointer'
            : /* pending */
              'bg-circa-accent-subtle border-circa-accent text-circa-accent',
  ].join(' ');

  const pillLabel =
    status === 'synced'  ? 'Synced' :
    status === 'syncing' ? 'Syncing…' :
    status === 'pending' ? 'Pending sync' :
    status === 'error'   ? 'Sync error' :
                            'Saved — Offline';

  const pillAriaLabel =
    status === 'syncing' ? 'Syncing data' :
    status === 'error'   ? 'Sync error — some entries could not be saved to the cloud. Tap for details.' :
    status === 'pending' ? 'Sync pending' :
    status === 'offline' ? 'Offline — data saved locally' :
                            'Data synced';

  const pillIcon = status === 'syncing' ? (
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
  );

  return (
    <>
      {status === 'error' ? (
        <button
          type="button"
          onClick={() => setShowSyncErrorDetail(prev => !prev)}
          aria-expanded={showSyncErrorDetail}
          aria-label={pillAriaLabel}
          className={pillClassName}
        >
          {pillIcon}
          {pillLabel}
        </button>
      ) : (
        <div aria-live="polite" aria-label={pillAriaLabel} className={pillClassName}>
          {pillIcon}
          {pillLabel}
        </div>
      )}

      {/* Sync error detail panel — only when the pill is tapped open. */}
      {status === 'error' && showSyncErrorDetail && (
        <div
          role="alert"
          className="
            fixed top-9 left-1/2 -translate-x-1/2 z-50
            w-[90%] max-w-sm
            rounded-lg border border-circa-error bg-circa-surface
            shadow-lg p-3 text-xs text-circa-text-secondary
          "
        >
          <p className="font-medium text-circa-error mb-1.5">
            {erroredEntries.length === 1
              ? '1 entry could not sync to the cloud'
              : `${erroredEntries.length} entries could not sync to the cloud`}
          </p>
          <ul className="space-y-1.5">
            {erroredEntries.slice(0, 3).map(e => (
              <li key={e.id} className="leading-snug">
                Code <span className="font-mono">{e.lastErrorCode ?? 'unknown'}</span>
                {' — '}
                {e.lastErrorMessage ?? 'No details available'}
              </li>
            ))}
          </ul>
          {erroredEntries.length > 3 && (
            <p className="mt-1.5 text-circa-text-muted">
              +{erroredEntries.length - 3} more
            </p>
          )}
          <p className="mt-2 text-circa-text-muted">
            This data is safe on your device. Please report the code above
            to the developer.
          </p>
        </div>
      )}
    </>
  );
})()}
```

This is a same-behaviour refactor for the `synced` / `syncing` / `pending`
/ `offline` states (still plain, non-interactive `<div>`s with the same
classes, icons, and labels as before) plus the new tappable `<button>`
and detail panel for the `error` state. Double-check the icon/label/class
logic above matches the current file's behaviour exactly for the four
unchanged states before replacing — if anything differs, keep the
current file's version for those four states and only add the new
button/panel behaviour for `error`.

---

## Step 5 — Toast action button support

### 5a — `Toast.tsx`

Read `src/components/ui/Toast.tsx` first, then replace the file entirely
with:

```typescript
import { useEffect, type ReactElement } from 'react';

type ToastVariant = 'success' | 'neutral' | 'error';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastProps {
  message: string;
  onDismiss: () => void;
  variant?: ToastVariant;
  /**
   * Auto-dismiss delay in ms. Defaults to 4000, or 8000 when `action`
   * is set — giving the user enough time to notice and tap the button
   * before the toast disappears on its own.
   */
  duration?: number;
  /**
   * Optional action button rendered between the message and the
   * dismiss (×). Tapping it calls both `onClick` and `onDismiss` — the
   * toast always closes after the action fires. Used for the expired-
   * session prompt ("Sign In") but generic for future use.
   */
  action?: ToastAction;
}

// Per-variant colour classes. neutral uses circa tokens; success/error use
// raw green/red with dark: overrides — one-off in a single component.
const variantStyles: Record<ToastVariant, string> = {
  success: 'bg-green-50 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300',
  neutral: 'bg-circa-surface-raised border-circa-border text-circa-text-secondary',
  error:   'bg-red-50 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300',
};

function SuccessIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      className="flex-shrink-0">
      <circle cx="10" cy="10" r="9" />
      <polyline points="6 10 9 13 14 7" />
    </svg>
  );
}

function NeutralIcon() {
  // Door/exit shape: person leaving through a door
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      className="flex-shrink-0">
      <path d="M13 3H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h9" />
      <polyline points="11 7 16 10 11 13" />
      <line x1="16" y1="10" x2="7" y2="10" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      className="flex-shrink-0">
      <circle cx="10" cy="10" r="9" />
      <line x1="7" y1="7" x2="13" y2="13" />
      <line x1="13" y1="7" x2="7" y2="13" />
    </svg>
  );
}

const icons: Record<ToastVariant, () => ReactElement> = {
  success: SuccessIcon,
  neutral: NeutralIcon,
  error:   ErrorIcon,
};

export default function Toast({
  message,
  onDismiss,
  variant = 'success',
  duration,
  action,
}: ToastProps) {
  const effectiveDuration = duration ?? (action ? 8000 : 4000);

  useEffect(() => {
    const id = setTimeout(onDismiss, effectiveDuration);
    return () => clearTimeout(id);
  }, [onDismiss, effectiveDuration]);

  const Icon = icons[variant];

  return (
    <div
      // error toasts use role="alert" so screen readers announce them immediately
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      className={`
        fixed bottom-20 left-1/2 -translate-x-1/2 z-60
        w-[90%] max-w-sm
        relative
        flex items-center justify-center gap-3
        pl-4 ${action ? 'pr-9' : 'pr-4'} py-3 rounded-lg shadow-lg
        border
        text-sm font-medium
        animate-slide-up
        ${variantStyles[variant]}
      `}
    >
      <Icon />

      <span>{message}</span>

      {action && (
        <button
          onClick={() => { action.onClick(); onDismiss(); }}
          className="
            flex-shrink-0 ml-1 px-2.5 py-1 rounded-md
            bg-circa-accent text-white text-xs font-semibold
            hover:opacity-90 transition-opacity
          "
        >
          {action.label}
        </button>
      )}

      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="absolute right-3 p-0.5 rounded opacity-60 hover:opacity-100 transition-opacity"
      >
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <line x1="4" y1="4" x2="16" y2="16" />
          <line x1="16" y1="4" x2="4" y2="16" />
        </svg>
      </button>
    </div>
  );
}
```

### 5b — `AppShell.tsx` — pass the action through

Read the current `<Toast .../>` usage in `AppShell.tsx` (near the top of
the JSX, just after the outer wrapper `<div>` opens):

```tsx
{activeToast && (
  <Toast variant={activeToast.variant} message={activeToast.message} onDismiss={clearToast} />
)}
```

Replace with:

```tsx
{activeToast && (
  <Toast
    variant={activeToast.variant}
    message={activeToast.message}
    onDismiss={clearToast}
    action={activeToast.action}
  />
)}
```

---

## Step 6 — Distinguish manual sign-out from session expiry in `useAuth.ts`

Read `src/hooks/useAuth.ts` first.

### 6a — Add the `action` field to `ToastState` and import `useRef`

Find:

```typescript
import { useState, useEffect } from 'react';
```

Replace with:

```typescript
import { useState, useEffect, useRef } from 'react';
```

Find:

```typescript
interface ToastState {
  variant: 'success' | 'neutral' | 'error';
  message: string;
}
```

Replace with:

```typescript
interface ToastState {
  variant: 'success' | 'neutral' | 'error';
  message: string;
  /** Optional action button — used for the expired-session "Sign In" prompt. */
  action?: { label: string; onClick: () => void };
}
```

### 6b — Add the intentional-sign-out ref

Find:

```typescript
  const [activeToast, setActiveToast] = useState<ToastState | null>(null);
  const navigate = useNavigate();
```

Replace with:

```typescript
  const [activeToast, setActiveToast] = useState<ToastState | null>(null);
  // Distinguishes a deliberate signOut() call from the SIGNED_OUT event
  // Supabase also fires when a session's refresh token has expired or
  // been revoked. Set to true right before calling supabase.auth.signOut(),
  // read once when the SIGNED_OUT event fires, then reset — see signOut()
  // and the onAuthStateChange handler below.
  const isIntentionalSignOut = useRef(false);
  const navigate = useNavigate();
```

### 6c — Branch the `SIGNED_OUT` handler

Find:

```typescript
        if (event === 'SIGNED_OUT') {
          setActiveToast({ variant: 'neutral', message: 'Signed out.' });
        }
```

Replace with:

```typescript
        if (event === 'SIGNED_OUT') {
          if (isIntentionalSignOut.current) {
            setActiveToast({ variant: 'neutral', message: 'Signed out.' });
          } else {
            // Session expired (refresh token invalid/revoked) rather than
            // a deliberate sign-out. Any local edits made from this point
            // are still saved to IndexedDB as normal — they are not lost —
            // and will be reconciled to Supabase by syncOnConnect()'s full
            // merge the next time this user signs back in. This toast's
            // job is purely to tell them to do that.
            setActiveToast({
              variant: 'error',
              message: 'Your session expired. Sign in again to keep syncing.',
              action: { label: 'Sign In', onClick: () => signInWithGoogle() },
            });
          }
          isIntentionalSignOut.current = false;
        }
```

### 6d — Set the ref in `signOut()`

Find:

```typescript
  async function signOut(): Promise<void> {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign-out failed:', err);
      setActiveToast({ variant: 'error', message: 'Sign-out failed. Please try again.' });
    }
  }
```

Replace with:

```typescript
  async function signOut(): Promise<void> {
    if (!supabase) return;
    isIntentionalSignOut.current = true;
    try {
      await supabase.auth.signOut();
    } catch (err) {
      // The signOut() call itself failed — this was not actually a
      // sign-out, so don't leave the ref stuck true for next time.
      isIntentionalSignOut.current = false;
      console.error('Sign-out failed:', err);
      setActiveToast({ variant: 'error', message: 'Sign-out failed. Please try again.' });
    }
  }
```

No other changes to this file. `signInWithGoogle` is referenced inside
the `onAuthStateChange` callback before its own declaration further down
the file — this is safe because it's a `function` declaration (hoisted)
and the callback only runs after the whole `useAuth()` body has finished
executing, exactly like the existing `navigate` reference in the same
callback.

---

## Step 7 — Document the conflict resolution decision

Create a new file `docs/sync-conflict-strategy.md`:

```markdown
# CircaLog — Multi-Device Sync Conflict Strategy

**Status:** Decided
**Decided:** 25 Jun 2026
**Applies to:** Bidirectional Supabase sync (`src/lib/supabase/syncService.ts`)

---

## Decision

When the same `SleepEntry` has been modified on two devices while one or
both were offline, **the version with the later `updatedAt` timestamp
wins**. This is last-write-wins conflict resolution, implemented in
`syncOnConnect()`.

No entry is ever silently discarded. The losing version is simply not
written anywhere — it was already superseded by a later edit before the
two devices ever talked to each other again.

---

## Why Last-Write-Wins

CircaLog is a single-user, personal health-tracking tool. The realistic
conflict scenario is one person editing the same entry from two of their
own devices (phone and laptop, say) while one was offline — not two
different people racing to edit the same record. A simple, predictable
rule is more valuable here than a merge UI the user would rarely see and
would have to understand under stress (mid-edit, away from their data).

The alternative — a three-way merge or a "keep both, let the user pick"
flow — adds meaningful UI and engine complexity for a conflict pattern
that, for this app's actual usage, is rare and low-stakes (a sleep log
entry, not a financial transaction).

---

## How It Works

On every `syncOnConnect()` (sign-in, or app load with an existing
session):

1. Pull all of this user's entries from Supabase.
2. Load all local IndexedDB entries.
3. For each entry that exists on both sides, compare `updatedAt`:
   - Remote newer → the remote version replaces the local copy.
   - Local newer → the local version is queued to push up to Supabase.
   - Identical → already in sync, no action.
4. For each entry that exists on only one side, it is copied to the
   other side (no data is missing on either device after a sync).
5. `assignCycleNumber()` re-runs across the full merged set, since a
   newly-arrived entry can change cycle numbering.

This is a full reconciliation, not an incremental diff — it runs the
same way whether the gap since the last sync was five minutes or five
months.

---

## Soft Deletes Are Just Edits

A soft-delete (`isDeleted: true`) bumps `updatedAt` like any other edit.
There is no special-cased delete handling in the merge — if Device A
deletes an entry and Device B edits a different field on the same entry
*after* the delete, Device B's edit (not deleted) wins on the next sync,
because its `updatedAt` is later. The deletion intent is overridden, but
no data is destroyed — this is the same last-write-wins rule applied
consistently, not an exception to it.

---

## Known, Accepted Limitation: Identical-Timestamp Collisions

If two devices produce the exact same `updatedAt` millisecond for
genuinely different content on the same entry, the merge currently takes
no action (treats them as already in sync) and one version is silently
preferred by whichever happened to be in IndexedDB locally. Given ISO
8601 millisecond precision and that the realistic conflict window is a
single person on two of their own devices, this is judged exceedingly
unlikely and not worth the added complexity of a secondary tie-break
(e.g. content hashing or device-id ordering). Revisit only if it is
ever observed in practice.

---

## What This Document Does Not Cover

- Field-level merging (e.g. combining notes from both versions) — not
  implemented; the whole entry is replaced as a unit.
- Conflict resolution for the V2 medication/meal log tables — those
  follow the same pattern when implemented, but are out of scope here.
- Sync write rejection handling (RLS errors, quota, etc.) and auth
  token refresh — see `CC_TASK_Phase1_AuthSyncHardening.md` and the
  inline comments in `syncService.ts`.

---

*This decision was made on 25 Jun 2026 and is not open for revision
without an explicit ADR superseding it.*
```

---

## Step 8 — Build check

```powershell
cd C:\Projects\CircaLog
npm run build
```

Fix any TypeScript or lint errors before proceeding. Do not move to
Step 9 until the build is clean.

---

## Step 9 — Dev server visual check

Start the dev server and run a Playwright static check per
`.claude/skills/visual-check/SKILL.md`:

- Confirm `http://localhost:5173/log` loads with no console errors.
- Save a screenshot to `tasks/screenshots/sync-error-detail-panel.png`
  (you will need to manually trigger an error state — see manual checks
  below — a static load alone won't show it).

The following require **manual verification** by Mahmoud (cannot be
scripted without a real Supabase session and a deliberate RLS failure):

| # | Check |
|---|---|
| 1 | Sign in, then sign out via the drawer — toast says "Signed out." (neutral, no action button) |
| 2 | Force a session expiry (e.g. revoke the session in Supabase Auth dashboard, or wait out the refresh token) — toast says "Your session expired. Sign in again to keep syncing." with a "Sign In" button, error-styled |
| 3 | Tap "Sign In" on that toast — Google OAuth flow starts |
| 4 | Make a local edit while the session is expired, then sign back in — confirm the edit appears in Supabase afterward (no data loss) |
| 5 | Trigger a real push failure (e.g. temporarily break an RLS policy on `sleep_entries`, or edit `client.ts` to point at a wrong table name) and edit an entry 3+ times — pill switches to "Sync error" |
| 6 | Tap the "Sync error" pill — detail panel opens showing the error code and message |
| 7 | Tap again — detail panel closes |
| 8 | Confirm the entry is NOT retried automatically anymore (no repeated network calls in the browser Network tab) while the pill still shows "Sync error" |
| 9 | Fix the underlying issue, then either edit the failed entry or sign out/in — confirm it syncs successfully and the pill returns to "Synced" |
| 10 | Dark mode — error pill and detail panel colors look correct |

---

## Step 10 — Session report

Write a comprehensive Markdown session report covering:

- Every step and its outcome (✅ / ❌ / ⚠️)
- Whether the AppShell pill refactor (Step 4) preserved the existing
  synced/syncing/pending/offline behaviour exactly, or required any
  adjustment
- Build output (clean or errors encountered and fixed)
- Full list of every file created or modified
- Any deviations from these instructions and the reason — especially
  flag if the "stop after 3" guard placement (in `flushQueue()` only,
  per the design note in Context) seems wrong once you see it running

Save to:
`tasks/cc-reports/REPORT_phase1-auth-sync-hardening_25-jun-2026.md`

Follow all markdownlint rules: blank line before and after every fenced
code block, zero warnings.

Paste a short summary into the Claude.ai chat and **wait for confirmation**
before running the git commit.

---

## Step 11 — Git commit (after Claude.ai confirmation only)

```powershell
cd C:\Projects\CircaLog
git add .
git commit -m "feat: auth/sync hardening — error diagnostics, stop-after-3 retries, expired-session prompt, conflict resolution doc"
git push origin main
```

---

## Files to modify

| Path | Change |
|---|---|
| `src/lib/circadian/types.ts` | Add diagnostic fields to `SyncQueueEntry` |
| `src/lib/supabase/syncService.ts` | Capture error code/message, try/catch guard, stop-after-3 in `flushQueue()` |
| `src/hooks/useSyncStatus.ts` | Expose `erroredEntries` |
| `src/pages/AppShell.tsx` | Tappable error pill + detail panel, wire Toast `action` prop |
| `src/components/ui/Toast.tsx` | Add optional `action` button |
| `src/hooks/useAuth.ts` | Distinguish manual sign-out vs session expiry, actionable re-auth toast |

## Files to create

| Path | Purpose |
|---|---|
| `docs/sync-conflict-strategy.md` | Documents the already-implemented last-write-wins decision |

## No new dependencies

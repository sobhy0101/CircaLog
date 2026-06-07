# CC TASK — Phase 1: Bidirectional Sync Service (IndexedDB ↔ Supabase)

**Assigned to:** Claude Code
**Date written:** 07 Jun 2026
**Prerequisite completed:** Google Sign-In + Supabase Auth (`REPORT_phase1-auth-google-signin_07-jun-2026.md`)

---

## Context

CircaLog is offline-first. IndexedDB is the primary store — all reads and
writes go there first, regardless of connectivity. Supabase is the cloud
mirror: every entry that exists locally must also exist in Supabase when
the user is signed in and online.

The sync is **bidirectional**:

- Local entries are pushed to Supabase on every mutation and on sign-in.
- Supabase entries are pulled to IndexedDB on sign-in (covers entries
  created on another device).
- Conflict resolution is **last-write-wins** by `updatedAt`: whichever
  copy of an entry has the later timestamp is authoritative.

Entries created or edited while offline are queued in a lightweight
`sync_queue` IndexedDB store and flushed automatically when connectivity
returns or the app returns to the foreground.

While the user is **signed out**, IndexedDB works exactly as it does today
— no Supabase calls are made under any circumstances.

---

## Step 0 — Read project skills

Before writing any code, read:

- `.claude/skills/run/SKILL.md`
- `.claude/skills/visual-check/SKILL.md`
- `.claude/skills/token-usage/SKILL.md`

---

## Step 1 — Migrate the Supabase `sleep_sessions` table

The existing `sleep_sessions` table was created in Phase 0 before the
domain model matured. It is missing columns and has inconsistent naming.
This migration brings it into alignment with `SleepEntry` in
`src/lib/circadian/types.ts`.

**The table has no synced data yet.** All real patient data is still in
the spreadsheet. This migration carries zero risk of data loss.

Run the following SQL in the **Supabase SQL Editor** (Dashboard →
SQL Editor → New query). Run it as a single transaction.

```sql
BEGIN;

-- 1. Rename the table to match the TypeScript service naming convention.
--    All existing RLS policies move with the table automatically.
ALTER TABLE public.sleep_sessions
  RENAME TO sleep_entries;

-- 2. Rename columns to snake_case equivalents of the SleepEntry fields.
--    sleep_start → sleep_start_utc  (makes the UTC storage explicit)
--    wake_time   → wake_utc         (same reason)
--    has_dreams  → had_dreams       (matches SleepEntry.hadDreams)
ALTER TABLE public.sleep_entries
  RENAME COLUMN sleep_start         TO sleep_start_utc;

ALTER TABLE public.sleep_entries
  RENAME COLUMN wake_time           TO wake_utc;

ALTER TABLE public.sleep_entries
  RENAME COLUMN has_dreams          TO had_dreams;

-- 3. Drop columns that are redundant or replaced by the new schema.
--    local_id:            replaced by the uuid `id` column (already the sync key)
--    interruption_count:  replaced by the jsonb interruptions column below
--    interruption_types:  same
--    medication_taken:    replaced by the jsonb medications column below
--    medication_timing:   same
ALTER TABLE public.sleep_entries
  DROP COLUMN local_id,
  DROP COLUMN interruption_count,
  DROP COLUMN interruption_types,
  DROP COLUMN medication_taken,
  DROP COLUMN medication_timing;

-- 4. Add missing columns.
--    bed_time_utc:   the "night anchor" timestamp (optional — back-filled
--                    entries may not have it, matches bedTimeUtc?: string)
--    iana_timezone:  IANA timezone name recorded at save time
--                    (e.g. 'Africa/Cairo') — required for correct local
--                    time derivation; NOT NULL because every new entry
--                    must carry it
--    interruptions:  full Interruption[] array as JSONB
--                    ({ type, note? }[] — may be null for old entries)
--    medications:    full Medication[] array as JSONB
--                    ({ name, timing }[] — may be null for old entries)
ALTER TABLE public.sleep_entries
  ADD COLUMN bed_time_utc   timestamptz          NULL,
  ADD COLUMN iana_timezone  text                 NOT NULL DEFAULT 'UTC',
  ADD COLUMN interruptions  jsonb                NULL,
  ADD COLUMN medications    jsonb                NULL;

-- 5. Remove the DEFAULT 'UTC' immediately after adding — the default was
--    only needed to satisfy NOT NULL during the ALTER; all real entries
--    will supply the correct value from the app.
ALTER TABLE public.sleep_entries
  ALTER COLUMN iana_timezone DROP DEFAULT;

-- 6. Fix the session_type default.
--    The engine uses 'main' | 'nap'. The old default was 'sleep'.
ALTER TABLE public.sleep_entries
  ALTER COLUMN session_type SET DEFAULT 'main';

-- 7. Rename the RLS policy to match the new table name (cosmetic).
ALTER POLICY "sleep_sessions: owner access"
  ON public.sleep_entries
  RENAME TO "sleep_entries: owner access";

COMMIT;
```

After running, verify success by running:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'sleep_entries'
ORDER BY ordinal_position;
```

Expected columns in order:

| column_name | data_type |
|---|---|
| id | uuid |
| user_id | uuid |
| sleep_start_utc | timestamptz |
| wake_utc | timestamptz |
| duration_minutes | integer (generated) |
| quality | smallint |
| session_type | text |
| cycle_number | integer |
| notes | text |
| had_dreams | boolean |
| dream_notes | text |
| iana_timezone | text |
| bed_time_utc | timestamptz |
| interruptions | jsonb |
| medications | jsonb |
| is_deleted | boolean |
| created_at | timestamptz |
| updated_at | timestamptz |

If the result matches, proceed to Step 2. If the migration fails (error
during the transaction), the `ROLLBACK` is automatic — nothing is changed.
Report the error back to Claude.ai before proceeding.

---

## Step 2 — Add `sync_queue` store to Dexie

Entries that are written to IndexedDB while offline need to be tracked, so
the sync service can flush them when connectivity returns.

Edit `src/lib/db/db.ts`.

Read the file first, then apply the following changes:

- Import `SyncQueueEntry` from `@/lib/circadian` (will be added to
  `types.ts` in Step 3 — add the import now, the type will resolve after
  Step 3).
- Add `syncQueue: Table<SyncQueueEntry, string>` as a second table.
- Bump the Dexie schema to version 2, keeping the existing version 1
  stores unchanged (Dexie requires all prior versions to remain declared
  when bumping).

The result should look like this:

```typescript
import Dexie, { type Table } from 'dexie'
import type { SleepEntry } from '@/lib/circadian'
import type { SyncQueueEntry } from '@/lib/circadian'

class CircaLogDB extends Dexie {
  sleepEntries!: Table<SleepEntry, string>
  // Tracks entries that were written offline and need to be pushed to
  // Supabase once connectivity is restored.
  syncQueue!: Table<SyncQueueEntry, string>

  constructor() {
    super('CircaLogDB')

    // Version 1 — original schema (must remain declared for Dexie migrations)
    this.version(1).stores({
      sleepEntries: '&id, sleepStartUtc, cycleNumber, sessionType, isDeleted, wakeUtc',
    })

    // Version 2 — adds sync_queue store
    this.version(2).stores({
      sleepEntries: '&id, sleepStartUtc, cycleNumber, sessionType, isDeleted, wakeUtc',
      syncQueue:    '&id, queuedAt',
    })
  }
}

export const db = new CircaLogDB()
```

---

## Step 3 — Add `SyncQueueEntry` type to `types.ts`

Edit `src/lib/circadian/types.ts`. Append the following block at the very
end of the file, after the `MealLogEntry` interface. Do not modify any
existing type.

```typescript
// ---------------------------------------------------------------------------
// Sync infrastructure
// ---------------------------------------------------------------------------

/**
 * A lightweight record in the local `syncQueue` IndexedDB store.
 *
 * When a SleepEntry is written to IndexedDB while the user is offline
 * (or the Supabase upsert fails for any reason), its id is added to this
 * queue. The sync service reads this queue when connectivity is restored
 * and retries the upsert for each queued id.
 *
 * The queue stores only the entry id — not a copy of the entry itself.
 * The sync service fetches the current entry from IndexedDB at flush time,
 * so the pushed version is always the latest local state.
 *
 * `id` here is the SleepEntry UUID (the sync key shared between
 * IndexedDB and Supabase).
 */
export interface SyncQueueEntry {
  /** The SleepEntry UUID that needs to be pushed to Supabase. */
  id: string;

  /** ISO 8601 UTC — when this entry was added to the queue. */
  queuedAt: string;
}
```

---

## Step 4 — Create the Supabase sync service

Create a new file: `src/lib/supabase/syncService.ts`

This file is the heart of the sync system. Read it carefully before
writing — every function has a specific role and the comments must
explain what non-obvious code does for a developer who is not a
JavaScript expert.

```typescript
// syncService.ts — bidirectional sync between IndexedDB and Supabase.
//
// RULES:
//   - IndexedDB is always the primary store. Reads and writes go there first.
//   - Supabase is the cloud mirror. Every entry pushed here is a copy of
//     what IndexedDB already holds.
//   - All functions are no-ops when the user is not signed in or when
//     supabase is null (env vars absent).
//   - Conflict resolution: last-write-wins by updatedAt. The copy with
//     the later updatedAt timestamp is authoritative.
//   - The sync queue tracks entries that could not be pushed (offline,
//     network error) so they can be retried later.

import { supabase } from '@/lib/supabase/client'
import { db } from '@/lib/db/db'
import { assignCycleNumber } from '@/lib/circadian'
import type { SleepEntry, SyncQueueEntry } from '@/lib/circadian'
import type { User } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Column mapping helpers
// ---------------------------------------------------------------------------

/**
 * Converts a SleepEntry (camelCase TypeScript) into the snake_case row
 * shape that Supabase expects.
 *
 * `duration_minutes` is a generated column in Postgres — it is computed
 * automatically from wake_utc - sleep_start_utc. Never include it in an
 * upsert payload or Postgres will throw an error.
 */
function toSupabaseRow(entry: SleepEntry, userId: string): Record<string, unknown> {
  return {
    id:               entry.id,
    user_id:          userId,
    sleep_start_utc:  entry.sleepStartUtc,
    wake_utc:         entry.wakeUtc,
    bed_time_utc:     entry.bedTimeUtc ?? null,
    iana_timezone:    entry.ianaTimezone,
    quality:          entry.quality,
    session_type:     entry.sessionType,
    cycle_number:     entry.cycleNumber,
    notes:            entry.notes ?? null,
    had_dreams:       entry.hadDreams ?? null,
    dream_notes:      entry.dreamNotes ?? null,
    interruptions:    entry.interruptions ?? null,
    medications:      entry.medications ?? null,
    is_deleted:       entry.isDeleted,
    created_at:       entry.createdAt,
    updated_at:       entry.updatedAt,
  }
}

/**
 * Converts a Supabase row (snake_case) back into a SleepEntry (camelCase).
 * Called when pulling entries from Supabase to merge into IndexedDB.
 */
function fromSupabaseRow(row: Record<string, unknown>): SleepEntry {
  return {
    id:             row.id as string,
    sleepStartUtc:  row.sleep_start_utc as string,
    wakeUtc:        row.wake_utc as string,
    bedTimeUtc:     row.bed_time_utc as string | undefined ?? undefined,
    ianaTimezone:   row.iana_timezone as string,
    quality:        row.quality as SleepEntry['quality'],
    sessionType:    row.session_type as SleepEntry['sessionType'],
    cycleNumber:    row.cycle_number as number,
    notes:          row.notes as string | undefined ?? undefined,
    hadDreams:      row.had_dreams as boolean | undefined ?? undefined,
    dreamNotes:     row.dream_notes as string | undefined ?? undefined,
    interruptions:  row.interruptions as SleepEntry['interruptions'] ?? undefined,
    medications:    row.medications as SleepEntry['medications'] ?? undefined,
    isDeleted:      row.is_deleted as boolean,
    createdAt:      row.created_at as string,
    updatedAt:      row.updated_at as string,
  }
}

// ---------------------------------------------------------------------------
// Queue helpers
// ---------------------------------------------------------------------------

/**
 * Adds a SleepEntry id to the sync queue, meaning it needs to be pushed
 * to Supabase. Safe to call when the entry already exists in the queue
 * (the upsert-style put in Dexie handles it).
 */
async function enqueue(id: string): Promise<void> {
  const item: SyncQueueEntry = { id, queuedAt: new Date().toISOString() }
  await db.syncQueue.put(item)
}

/**
 * Removes a SleepEntry id from the sync queue after a successful push.
 */
async function dequeue(id: string): Promise<void> {
  await db.syncQueue.delete(id)
}

// ---------------------------------------------------------------------------
// Core push: one entry → Supabase
// ---------------------------------------------------------------------------

/**
 * Upserts a single SleepEntry to Supabase.
 *
 * On success: removes the entry from the sync queue (it is now in sync).
 * On failure: adds the entry to the sync queue so it will be retried.
 *
 * `onConflict: 'id'` means: if a row with this id already exists,
 * update it in place rather than failing with a duplicate-key error.
 */
async function pushEntry(entry: SleepEntry, userId: string): Promise<void> {
  if (!supabase) return

  const row = toSupabaseRow(entry, userId)

  const { error } = await supabase
    .from('sleep_entries')
    .upsert(row, { onConflict: 'id' })

  if (error) {
    // Push failed (offline, network error, etc.) — queue for retry.
    console.warn(`syncService: push failed for ${entry.id}, queuing.`, error.message)
    await enqueue(entry.id)
  } else {
    // Push succeeded — remove from queue if it was there.
    await dequeue(entry.id)
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Called after every local mutation (create, update, soft-delete).
 *
 * Attempts to immediately push the affected entry to Supabase.
 * If the user is not signed in, or if the push fails, the entry is
 * silently queued for the next sync flush.
 */
export async function syncAfterMutation(entry: SleepEntry, user: User | null): Promise<void> {
  if (!supabase || !user) return
  await pushEntry(entry, user.id)
}

/**
 * Called on sign-in (SIGNED_IN auth event) and on app load when
 * a session is already active (INITIAL_SESSION event).
 *
 * Performs a full bidirectional merge:
 *   1. Pull all entries for this user from Supabase.
 *   2. Compare with all local IndexedDB entries using last-write-wins.
 *   3. Write merged results back to both stores.
 *   4. Re-run assignCycleNumber across the merged set.
 *
 * This ensures that entries created on another device appear locally,
 * and that any local entries the server doesn't have yet are pushed up.
 */
export async function syncOnConnect(user: User): Promise<void> {
  if (!supabase) return

  // --- 1. Pull all entries for this user from Supabase ---
  const { data: remoteRows, error } = await supabase
    .from('sleep_entries')
    .select('*')
    .eq('user_id', user.id)

  if (error) {
    console.warn('syncService: pull failed on connect.', error.message)
    // Pull failed — still flush the local queue so offline writes get pushed.
    await flushQueue(user)
    return
  }

  const remoteEntries: SleepEntry[] = (remoteRows ?? []).map(
    // Cast each row to the generic record shape the mapper expects.
    row => fromSupabaseRow(row as Record<string, unknown>)
  )

  // --- 2. Load all local entries ---
  const localEntries: SleepEntry[] = await db.sleepEntries.toArray()

  // --- 3. Merge: last-write-wins by updatedAt ---
  // Build a map keyed by entry id, starting from local entries.
  const merged = new Map<string, SleepEntry>()
  for (const entry of localEntries) {
    merged.set(entry.id, entry)
  }

  // For each remote entry, keep whichever version has the later updatedAt.
  const toUpsertRemotely: SleepEntry[] = []
  for (const remote of remoteEntries) {
    const local = merged.get(remote.id)
    if (!local) {
      // Entry exists on server but not locally — add it.
      merged.set(remote.id, remote)
    } else if (remote.updatedAt > local.updatedAt) {
      // Server version is newer — replace the local copy.
      merged.set(remote.id, remote)
    } else if (local.updatedAt > remote.updatedAt) {
      // Local version is newer — flag the remote for update.
      toUpsertRemotely.push(local)
    }
    // If updatedAt is identical, no action needed (already in sync).
  }

  // Any local entry that has no remote counterpart needs to be pushed up.
  for (const local of localEntries) {
    if (!remoteEntries.find(r => r.id === local.id)) {
      toUpsertRemotely.push(local)
    }
  }

  // --- 4. Write merged set to IndexedDB ---
  const mergedArray = Array.from(merged.values())

  // Re-assign cycle numbers across the full merged set before writing.
  // assignCycleNumber returns a new array — it does not mutate in place.
  const renumbered = assignCycleNumber(mergedArray)
  await db.sleepEntries.bulkPut(renumbered)

  // --- 5. Push entries that the server is missing or behind on ---
  // Also push the renumbered versions so cycle numbers stay in sync.
  const renumberedMap = new Map(renumbered.map(e => [e.id, e]))
  const allToPush = toUpsertRemotely.map(e => renumberedMap.get(e.id) ?? e)
  await Promise.all(allToPush.map(e => pushEntry(e, user.id)))

  // --- 6. Flush any remaining queued entries ---
  await flushQueue(user)
}

/**
 * Pushes all entries currently in the sync queue to Supabase.
 *
 * Called:
 *   - At the end of syncOnConnect (catches anything missed above).
 *   - When the browser fires an `online` event (connectivity restored).
 *   - When the app returns to the foreground (visibilitychange event).
 */
export async function flushQueue(user: User): Promise<void> {
  if (!supabase) return

  const queued = await db.syncQueue.toArray()
  if (queued.length === 0) return

  // Fetch each queued entry from IndexedDB and push it.
  // We fetch fresh from IDB (not from a stale closure) so the pushed
  // version always reflects the latest local edits.
  for (const item of queued) {
    const entry = await db.sleepEntries.get(item.id)
    if (entry) {
      await pushEntry(entry, user.id)
    } else {
      // Entry was hard-deleted locally — remove from queue silently.
      await dequeue(item.id)
    }
  }
}
```

---

## Step 5 — Wire sync into `sleepEntryService.ts`

The existing CRUD service writes to IndexedDB only. We need to call
`syncAfterMutation` after every successful write.

The service does not have access to the current `user` object — that
lives in the `useAuth` hook. The cleanest way to pass it in is to
accept an optional `user: User | null` parameter on each mutating
function. When `null` (signed out), `syncAfterMutation` is a no-op, so
no behavior changes for unauthenticated users.

Read `src/lib/db/sleepEntryService.ts` first, then apply these changes:

- Add import at the top:

```typescript
import { syncAfterMutation } from '@/lib/supabase/syncService'
import type { User } from '@supabase/supabase-js'
```

- Update the signature and body of `createEntry`:

```typescript
export async function createEntry(
  draft: Omit<SleepEntry, 'id' | 'cycleNumber' | 'sessionType' | 'createdAt' | 'updatedAt' | 'isDeleted'>,
  user: User | null = null
): Promise<SleepEntry> {
```

After the final `return persisted` line, add — before the return:

```typescript
  await syncAfterMutation(persisted, user)
  return persisted
```

- Update `updateEntry` the same way — add `user: User | null = null`
  parameter, call `await syncAfterMutation(persisted, user)` before
  `return persisted`.

- Update `softDeleteEntry` — add `user: User | null = null` parameter.
  After `await reassignAndPersist()`, fetch the updated entry and call
  sync:

```typescript
  const updated2 = await db.sleepEntries.get(id)
  if (updated2) await syncAfterMutation(updated2, user)
```

- `hardDeleteEntry` does not push to Supabase — a hard-deleted entry
  should be soft-deleted in Supabase (set `is_deleted = true`) rather
  than actually removed, so the server retains the tombstone for other
  devices. Update `hardDeleteEntry` as follows — add the `user` param,
  and before `db.sleepEntries.delete(id)`, soft-delete the entry in
  Supabase:

```typescript
export async function hardDeleteEntry(
  id: string,
  user: User | null = null
): Promise<void> {
  // Soft-delete in Supabase first so other devices see the tombstone.
  if (user && supabase) {
    await supabase
      .from('sleep_entries')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
  }
  await db.sleepEntries.delete(id)
  await reassignAndPersist()
}
```

Add the missing import at the top for `hardDeleteEntry`:

```typescript
import { supabase } from '@/lib/supabase/client'
```

---

## Step 6 — Wire sync into `useAuth.ts`

`useAuth` is where auth events fire. It needs to:

1. Call `syncOnConnect` when `SIGNED_IN` fires and when an existing
   session is restored on page load (`INITIAL_SESSION`).
2. Register `online` and `visibilitychange` listeners that call
   `flushQueue` so offline-queued entries are flushed when connectivity
   returns.

Read `src/hooks/useAuth.ts` first. Note that it currently imports from
`@/lib/supabase` (the old singleton). This step also migrates that import
to `@/lib/supabase/client` (the null-safe version) since the sync service
uses the same client.

Apply the following changes:

- Replace the import line:

```typescript
// OLD
import { supabase } from '@/lib/supabase'

// NEW
import { supabase } from '@/lib/supabase/client'
```

- Add sync imports after the existing imports:

```typescript
import { syncOnConnect, flushQueue } from '@/lib/supabase/syncService'
```

- Inside the `useEffect`, update the `onAuthStateChange` handler. The
  current handler reacts to `SIGNED_IN` and `SIGNED_OUT`. Add handling
  for `INITIAL_SESSION` and call sync:

```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    const currentUser = session?.user ?? null
    setUser(currentUser)

    if (event === 'SIGNED_IN') {
      const name = session?.user?.user_metadata?.full_name as string | undefined
      setActiveToast({
        variant: 'success',
        message: name ? `Welcome, ${name}!` : 'Signed in successfully.',
      })
      // Trigger full bidirectional sync now that we have a user.
      if (currentUser) syncOnConnect(currentUser)
    }

    if (event === 'INITIAL_SESSION' && currentUser) {
      // App loaded with an existing session (e.g. page refresh while
      // signed in). Pull any remote entries the local store may be
      // missing.
      syncOnConnect(currentUser)
    }

    if (event === 'SIGNED_OUT') {
      setActiveToast({ variant: 'neutral', message: 'Signed out.' })
    }
  }
)
```

- Add the online / visibilitychange listeners inside the same `useEffect`,
  after the `onAuthStateChange` subscription block:

```typescript
// Flush the sync queue when connectivity is restored.
function handleOnline() {
  supabase.auth.getSession().then(({ data }) => {
    if (data.session?.user) flushQueue(data.session.user)
  })
}

// Flush the sync queue when the user returns to the tab.
function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) flushQueue(data.session.user)
    })
  }
}

window.addEventListener('online', handleOnline)
document.addEventListener('visibilitychange', handleVisibilityChange)
```

- Update the cleanup return to remove those listeners:

```typescript
return () => {
  subscription.unsubscribe()
  window.removeEventListener('online', handleOnline)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
}
```

**Important:** The `handleOnline` and `handleVisibilityChange` functions
must be declared inside the `useEffect` callback (not outside it) so they
close over `supabase` correctly and are removed at cleanup time.

Also note: because `supabase` from `client.ts` can be `null` when env
vars are absent, guard the `onAuthStateChange` call. Wrap the entire
subscription block in `if (supabase)`. The existing `getSession()` call
at the top of the effect should also be guarded:

```typescript
// Guard all Supabase calls — supabase is null when env vars are absent.
if (!supabase) {
  setIsLoading(false)
  return
}
```

---

## Step 7 — Update `useSleepLog.ts` to pass `user` to mutations

`useSleepLog` calls `createEntry`, `updateEntry`, `softDeleteEntry`, and
`hardDeleteEntry`. Those functions now accept an optional `user` param.
The hook already has access to `useAuth` — check if it imports it, and if
not, add it.

Read `src/hooks/useSleepLog.ts` first. Then:

- Import `useAuth` if not already imported.
- Destructure `user` from it: `const { user } = useAuth()`
- Pass `user` as the second argument to every mutating call:
  - `createEntry(draft, user)`
  - `updateEntry(id, changes, user)`
  - `softDeleteEntry(id, user)`
  - `hardDeleteEntry(id, user)`

---

## Step 8 — Create the sync status hook

The TO-DO list includes "Show sync status indicator in UI." This hook
provides the data for that indicator. Create it now so the UI step has
something to consume.

Create `src/hooks/useSyncStatus.ts`:

```typescript
// useSyncStatus.ts — exposes the current sync queue depth so the UI can
// show a "syncing" or "pending" indicator.

import { useState, useEffect } from 'react'
import { db } from '@/lib/db/db'
import { useAuth } from '@/hooks/useAuth'

export type SyncStatus =
  | 'signed-out'   // user is not signed in — no sync
  | 'synced'       // queue is empty — everything is in sync
  | 'pending'      // queue has entries waiting to be pushed
  | 'syncing'      // a sync operation is currently in progress (future use)

export function useSyncStatus() {
  const { user } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (!user) {
      setPendingCount(0)
      return
    }

    // Count queue entries on mount and whenever the syncQueue table changes.
    // Dexie's liveQuery re-runs the callback whenever the observed data
    // changes — no polling needed.
    const subscription = db.syncQueue.hook('creating', recount)
    const subscription2 = db.syncQueue.hook('deleting', recount)

    recount()

    async function recount() {
      const count = await db.syncQueue.count()
      setPendingCount(count)
    }

    return () => {
      // Dexie hooks are removed by calling their unsubscribe function.
      // The hook API returns a handle; remove via the hook's off() method.
      db.syncQueue.hook('creating').unsubscribe(recount)
      db.syncQueue.hook('deleting').unsubscribe(recount)
    }
  }, [user])

  const status: SyncStatus = !user
    ? 'signed-out'
    : pendingCount > 0
      ? 'pending'
      : 'synced'

  return { status, pendingCount }
}
```

**Note on Dexie hooks:** If the Dexie hook subscription pattern above does
not compile cleanly with the installed Dexie version, replace the hook
approach with a simpler polling interval:

```typescript
// Fallback: poll the queue count every 5 seconds.
const interval = setInterval(async () => {
  const count = await db.syncQueue.count()
  setPendingCount(count)
}, 5000)

// also call once immediately
db.syncQueue.count().then(setPendingCount)

return () => clearInterval(interval)
```

Use whichever compiles without errors. Note which approach was used in the
session report.

---

## Step 9 — Add sync status indicator to `AppShell.tsx`

A subtle indicator in the UI lets the patient know their data is backed up
or has pending entries. This is especially important given unreliable
connectivity.

Read `src/pages/AppShell.tsx` first. Then add the following:

- Import `useSyncStatus` from `@/hooks/useSyncStatus`.
- Destructure: `const { status } = useSyncStatus()`
- Add a small status pill below the `<Toast>` block and above `<SideDrawer>`.
  Show it only when the user is signed in (i.e., `status !== 'signed-out'`):

```tsx
{status !== 'signed-out' && (
  <div
    aria-live="polite"
    className={[
      'fixed top-3 right-3 z-50 flex items-center gap-1.5',
      'rounded-full px-3 py-1 text-xs font-medium',
      'border transition-colors duration-300',
      status === 'synced'
        ? 'bg-circa-surface border-circa-border text-circa-text-muted'
        : 'bg-circa-accent-subtle border-circa-accent text-circa-accent',
    ].join(' ')}
  >
    <span
      className={[
        'h-1.5 w-1.5 rounded-full',
        status === 'synced' ? 'bg-circa-text-muted' : 'bg-circa-accent animate-pulse',
      ].join(' ')}
    />
    {status === 'synced' ? 'Synced' : 'Pending sync'}
  </div>
)}
```

Use only `circa-*` tokens. Do not introduce any hardcoded colors.

---

## Step 10 — Build check

```powershell
cd C:\Projects\CircaLog
npm run build
```

Fix any TypeScript or lint errors before proceeding. Do not move to
Step 11 until the build is clean.

---

## Step 11 — Dev server smoke test

Start the dev server and run a Playwright static check per
`.claude/skills/visual-check/SKILL.md`:

- Confirm the page loads at `http://localhost:5173/log` with no
  console errors.
- Save a screenshot to `tasks/screenshots/sync-smoke.png`.

The following items require **manual verification** by Mahmoud (outside
Playwright scope):

| # | Check |
|---|---|
| 1 | Open side drawer → Sign in with Google |
| 2 | After sign-in, the sync status pill shows "Synced" |
| 3 | Airplane mode on → add a new sleep entry |
| 4 | Sync pill shows "Pending sync" with pulsing dot |
| 5 | Restore connectivity → pill returns to "Synced" |
| 6 | Open Supabase Table Editor → `sleep_entries` → entry appears |
| 7 | Sign out → sync pill disappears |
| 8 | All existing CRUD operations (add, edit, delete) still work |

---

## Step 12 — Session report

Write a comprehensive Markdown session report covering:

- Every step and its outcome (✅ / ❌ / ⚠️)
- Exact SQL run and whether the migration succeeded
- Which `useSyncStatus` hook approach was used (Dexie hooks vs polling)
- Build output (clean or errors encountered and fixed)
- Full list of every file created or modified
- Any deviations from these instructions and the reason

Save to: `tasks/cc-reports/REPORT_phase1-sync-service_{DD}-{mon}-{YYYY}.md`

Follow all markdownlint rules from `.claude/memory/session_report_policy.md`:
blank line before and after every fenced code block, zero warnings.

Paste a short summary into the Claude.ai chat and **wait for confirmation**
before running the git commit.

---

## Step 13 — Git commit (after Claude.ai confirmation only)

```powershell
cd C:\Projects\CircaLog
git add .
git commit -m "feat: bidirectional IndexedDB ↔ Supabase sync service"
git push origin main
```

---

## Files to create

| Path | Purpose |
|---|---|
| `src/lib/supabase/syncService.ts` | Core sync logic — push, pull, merge, queue |
| `src/hooks/useSyncStatus.ts` | Hook exposing sync queue depth to the UI |

## Files to modify

| Path | Change |
|---|---|
| `src/lib/db/db.ts` | Add `syncQueue` table, bump to version 2 |
| `src/lib/circadian/types.ts` | Add `SyncQueueEntry` type |
| `src/lib/db/sleepEntryService.ts` | Accept `user` param, call sync after mutations |
| `src/hooks/useAuth.ts` | Migrate to `client.ts`, wire `syncOnConnect` + `flushQueue` |
| `src/hooks/useSleepLog.ts` | Pass `user` to all mutating calls |
| `src/pages/AppShell.tsx` | Add sync status pill |

## Supabase migration

The SQL in Step 1 must be run manually in the Supabase SQL Editor before
any code changes. If the migration fails, stop and report to Claude.ai.

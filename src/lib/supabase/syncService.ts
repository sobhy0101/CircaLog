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
 * Adds a SleepEntry id to the sync queue.
 * Increments failCount if the entry is already queued (repeated failure),
 * rather than resetting it — so the error state accumulates correctly.
 */
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

/**
 * Removes a SleepEntry id from the sync queue after a successful push.
 */
async function dequeue(id: string): Promise<void> {
  await db.syncQueue.delete(id)

  // Recount after removal so the error state clears when the push succeeds.
  const all = await db.syncQueue.toArray()
  _errorCount = all.filter(e => e.failCount >= 3).length
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
  // Do not attempt a network push while offline. The entry is already
  // in the sync queue (or will be added by the caller) — it will be
  // retried when connectivity is restored.
  if (!navigator.onLine) return

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

  _isSyncing = true
  try {
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
  } finally {
    _isSyncing = false
  }
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
  // Nothing to do while offline — the online event handler in useAuth.ts
  // calls flushQueue again when connectivity is restored.
  if (!navigator.onLine) return

  _isSyncing = true
  try {
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
  } finally {
    _isSyncing = false
  }
}

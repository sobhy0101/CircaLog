import { db } from './db'
import {
  normalizeSleepSpan,
  assignCycleNumber,
  detectSessionType,
} from '@/lib/circadian'
import type { SleepEntry } from '@/lib/circadian'

/**
 * Recomputes cycle numbers for all entries after any mutation and bulk-writes
 * them back. Only active (non-deleted) entries receive new cycle numbers;
 * soft-deleted entries are left as-is.
 */
async function reassignAndPersist(): Promise<void> {
  const allEntries = await db.sleepEntries.toArray()
  const renumbered = assignCycleNumber(allEntries)

  // Build a map of new cycle numbers by id for O(1) lookup.
  const newCycleMap = new Map(renumbered.map(e => [e.id, e.cycleNumber]))

  const now = new Date().toISOString()

  // Only write back entries whose cycle number actually changed.
  const toUpdate = allEntries
    .filter(e => {
      const newNum = newCycleMap.get(e.id)
      return newNum !== undefined && newNum !== e.cycleNumber
    })
    .map(e => ({ ...e, cycleNumber: newCycleMap.get(e.id)!, updatedAt: now }))

  if (toUpdate.length > 0) {
    await db.sleepEntries.bulkPut(toUpdate)
  }
}

/**
 * Creates a new sleep entry, validates its timestamps, derives sessionType,
 * writes it to IndexedDB, and reassigns cycle numbers for the entire store.
 *
 * @param draft - All SleepEntry fields except id, cycleNumber, sessionType,
 *   createdAt, updatedAt, and isDeleted — those are set internally.
 * @returns The fully populated SleepEntry as persisted in IDB.
 * @throws If wakeUtc is not strictly after sleepStartUtc.
 */
export async function createEntry(
  draft: Omit<SleepEntry, 'id' | 'cycleNumber' | 'sessionType' | 'createdAt' | 'updatedAt' | 'isDeleted'>
): Promise<SleepEntry> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  const entry: SleepEntry = {
    ...draft,
    id,
    cycleNumber: 0,    // placeholder — replaced by reassignAndPersist
    sessionType: 'main', // placeholder — replaced below after normalization
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
  }

  // Validates timestamps; throws if wakeUtc <= sleepStartUtc.
  const span = normalizeSleepSpan(entry)

  entry.sessionType = detectSessionType(span.durationMs, 0)

  await db.sleepEntries.put(entry)
  await reassignAndPersist()

  const persisted = await db.sleepEntries.get(id)
  if (!persisted) throw new Error(`createEntry: entry ${id} not found after write`)
  return persisted
}

/**
 * Returns all non-deleted entries sorted by sleepStartUtc ascending.
 *
 * @returns Array of active SleepEntry records in chronological order.
 */
export async function getAllEntries(): Promise<SleepEntry[]> {
  // IndexedDB does not accept booleans as valid index key types; Dexie 4.x
  // no longer coerces false → 0 before indexing. Using toArray() + JS filter
  // is the safe, version-agnostic approach for boolean fields.
  const all = await db.sleepEntries.toArray()
  return all
    .filter(e => !e.isDeleted)
    .sort((a, b) => a.sleepStartUtc.localeCompare(b.sleepStartUtc))
}

/**
 * Returns a single entry by its id, including soft-deleted entries, or
 * undefined if no entry with that id exists.
 *
 * @param id - UUID of the entry to retrieve.
 */
export async function getEntryById(id: string): Promise<SleepEntry | undefined> {
  return db.sleepEntries.get(id)
}

/**
 * Updates specific fields on an existing entry, re-validates timestamps if
 * sleepStartUtc or wakeUtc changed, and reassigns cycle numbers for the store.
 *
 * @param id - UUID of the entry to update.
 * @param changes - Partial set of fields to merge onto the existing entry.
 *   Cannot change id, cycleNumber, sessionType, createdAt, or isDeleted here.
 * @returns The updated SleepEntry as persisted in IDB.
 * @throws If no entry with the given id exists.
 * @throws If the updated timestamps would make wakeUtc <= sleepStartUtc.
 */
export async function updateEntry(
  id: string,
  changes: Partial<Omit<SleepEntry, 'id' | 'cycleNumber' | 'sessionType' | 'createdAt' | 'isDeleted'>>
): Promise<SleepEntry> {
  const existing = await db.sleepEntries.get(id)
  if (!existing) throw new Error(`updateEntry: entry ${id} not found`)

  const updated: SleepEntry = { ...existing, ...changes, updatedAt: new Date().toISOString() }

  // Re-validate and re-derive sessionType if the time span changed.
  if (changes.sleepStartUtc !== undefined || changes.wakeUtc !== undefined) {
    const span = normalizeSleepSpan(updated)
    updated.sessionType = detectSessionType(span.durationMs, 0)
  }

  await db.sleepEntries.put(updated)
  await reassignAndPersist()

  const persisted = await db.sleepEntries.get(id)
  if (!persisted) throw new Error(`updateEntry: entry ${id} not found after write`)
  return persisted
}

/**
 * Marks an entry as soft-deleted. The entry is retained in IDB but excluded
 * from getAllEntries() and cycle number calculations.
 *
 * @param id - UUID of the entry to soft-delete.
 * @throws If no entry with the given id exists.
 */
export async function softDeleteEntry(id: string): Promise<void> {
  const existing = await db.sleepEntries.get(id)
  if (!existing) throw new Error(`softDeleteEntry: entry ${id} not found`)

  const updated: SleepEntry = {
    ...existing,
    isDeleted: true,
    updatedAt: new Date().toISOString(),
  }

  await db.sleepEntries.put(updated)
  await reassignAndPersist()
}

/**
 * Permanently removes an entry from IDB. This operation is irreversible.
 *
 * @param id - UUID of the entry to hard-delete.
 */
export async function hardDeleteEntry(id: string): Promise<void> {
  await db.sleepEntries.delete(id)
  await reassignAndPersist()
}

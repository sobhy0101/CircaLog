// Must be first — patches globalThis with the in-memory IDB implementation
// so Dexie uses it automatically without any browser environment.
import 'fake-indexeddb/auto'

import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/lib/db/db'
import {
  createEntry,
  getAllEntries,
  getEntryById,
  updateEntry,
  softDeleteEntry,
  hardDeleteEntry,
} from '@/lib/db'
import { realSleepEntries } from '@/lib/circadian/__fixtures__/realData'

// ---------------------------------------------------------------------------
// Shared draft derived from Cycle 1 fixture (6h main sleep)
// ---------------------------------------------------------------------------

const cycle1 = realSleepEntries[0]

const baseDraft = {
  sleepStartUtc: cycle1.sleepStartUtc,
  wakeUtc: cycle1.wakeUtc,
  bedTimeUtc: cycle1.bedTimeUtc,
  ianaTimezone: cycle1.ianaTimezone,
  quality: cycle1.quality,
  notes: cycle1.notes,
  hadDreams: cycle1.hadDreams,
  interruptions: cycle1.interruptions,
  medications: cycle1.medications,
} as const

beforeEach(async () => {
  await db.sleepEntries.clear()
})

// ---------------------------------------------------------------------------
// createEntry
// ---------------------------------------------------------------------------

describe('createEntry', () => {
  it('creates an entry with a valid UUID id', async () => {
    const entry = await createEntry(baseDraft)
    // UUID v4 pattern
    expect(entry.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
  })

  it('sets isDeleted to false', async () => {
    const entry = await createEntry(baseDraft)
    expect(entry.isDeleted).toBe(false)
  })

  it('sets createdAt and updatedAt as ISO 8601 strings', async () => {
    const entry = await createEntry(baseDraft)
    expect(() => new Date(entry.createdAt)).not.toThrow()
    expect(() => new Date(entry.updatedAt)).not.toThrow()
    expect(entry.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(entry.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('assigns cycleNumber 1 for the first entry in an empty store', async () => {
    const entry = await createEntry(baseDraft)
    expect(entry.cycleNumber).toBe(1)
  })

  it('detects sessionType as main for a session >= 3 hours (Cycle 1 is 6h)', async () => {
    const entry = await createEntry(baseDraft)
    expect(entry.sessionType).toBe('main')
  })

  it('detects sessionType as nap for a session < 3 hours', async () => {
    // 2-hour window — nap
    const napDraft = {
      ...baseDraft,
      sleepStartUtc: '2026-05-29T10:00:00.000Z',
      wakeUtc: '2026-05-29T12:00:00.000Z',
    }
    const entry = await createEntry(napDraft)
    expect(entry.sessionType).toBe('nap')
  })

  it('throws when wakeUtc <= sleepStartUtc', async () => {
    const badDraft = {
      ...baseDraft,
      sleepStartUtc: '2026-05-29T10:00:00.000Z',
      wakeUtc: '2026-05-29T09:00:00.000Z', // before sleep start
    }
    await expect(createEntry(badDraft)).rejects.toThrow()
  })

  it('returns the persisted entry (reads back from IDB, not just the draft)', async () => {
    const entry = await createEntry(baseDraft)
    const fromDb = await db.sleepEntries.get(entry.id)
    expect(fromDb).toEqual(entry)
  })
})

// ---------------------------------------------------------------------------
// getAllEntries
// ---------------------------------------------------------------------------

describe('getAllEntries', () => {
  it('returns an empty array when the store is empty', async () => {
    const result = await getAllEntries()
    expect(result).toEqual([])
  })

  it('returns all non-deleted entries sorted by sleepStartUtc ascending', async () => {
    // Seed directly via bulkPut to bypass createEntry overhead.
    await db.sleepEntries.bulkPut(realSleepEntries)
    const result = await getAllEntries()

    expect(result).toHaveLength(5)
    for (let i = 1; i < result.length; i++) {
      expect(result[i].sleepStartUtc >= result[i - 1].sleepStartUtc).toBe(true)
    }
  })

  it('does not include soft-deleted entries', async () => {
    await db.sleepEntries.bulkPut(realSleepEntries)
    // Soft-delete Cycle 1 directly in IDB (bypass service to isolate getAllEntries).
    const entry = realSleepEntries[0]
    await db.sleepEntries.put({ ...entry, isDeleted: true })

    const result = await getAllEntries()
    expect(result.find(e => e.id === entry.id)).toBeUndefined()
    expect(result).toHaveLength(4)
  })
})

// ---------------------------------------------------------------------------
// getEntryById
// ---------------------------------------------------------------------------

describe('getEntryById', () => {
  it('returns the correct entry when found', async () => {
    await db.sleepEntries.bulkPut(realSleepEntries)
    const result = await getEntryById('real-cycle-1')
    expect(result).toBeDefined()
    expect(result!.id).toBe('real-cycle-1')
  })

  it('returns undefined for an unknown id', async () => {
    const result = await getEntryById('does-not-exist')
    expect(result).toBeUndefined()
  })

  it('returns soft-deleted entries (not filtered here)', async () => {
    await db.sleepEntries.put({ ...realSleepEntries[0], isDeleted: true })
    const result = await getEntryById('real-cycle-1')
    expect(result).toBeDefined()
    expect(result!.isDeleted).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// updateEntry
// ---------------------------------------------------------------------------

describe('updateEntry', () => {
  it('updates the quality field of an existing entry', async () => {
    const created = await createEntry(baseDraft)
    const updated = await updateEntry(created.id, { quality: 5 })
    expect(updated.quality).toBe(5)
  })

  it('updates updatedAt on every call', async () => {
    const created = await createEntry(baseDraft)
    // Small delay to ensure timestamp differs.
    await new Promise(r => setTimeout(r, 10))
    const updated = await updateEntry(created.id, { quality: 5 })
    expect(updated.updatedAt >= created.updatedAt).toBe(true)
  })

  it('does not change createdAt', async () => {
    const created = await createEntry(baseDraft)
    const updated = await updateEntry(created.id, { quality: 5 })
    expect(updated.createdAt).toBe(created.createdAt)
  })

  it('recomputes sessionType when wakeUtc changes (6h → 2h becomes nap)', async () => {
    const created = await createEntry(baseDraft)
    expect(created.sessionType).toBe('main') // sanity check

    // Change wakeUtc to make a 2-hour window.
    const newWake = new Date(
      new Date(created.sleepStartUtc).getTime() + 2 * 60 * 60 * 1000
    ).toISOString()

    const updated = await updateEntry(created.id, { wakeUtc: newWake })
    expect(updated.sessionType).toBe('nap')
  })

  it('throws when called with an unknown id', async () => {
    await expect(updateEntry('no-such-id', { quality: 3 })).rejects.toThrow()
  })
})

// ---------------------------------------------------------------------------
// softDeleteEntry
// ---------------------------------------------------------------------------

describe('softDeleteEntry', () => {
  it('sets isDeleted to true on the target entry', async () => {
    const created = await createEntry(baseDraft)
    await softDeleteEntry(created.id)
    const fromDb = await db.sleepEntries.get(created.id)
    expect(fromDb!.isDeleted).toBe(true)
  })

  it('does not remove the entry from IDB (still findable by getEntryById)', async () => {
    const created = await createEntry(baseDraft)
    await softDeleteEntry(created.id)
    const found = await getEntryById(created.id)
    expect(found).toBeDefined()
  })

  it('renumbers remaining active entries gaplessly after soft-delete', async () => {
    // Seed two entries: one earlier, one later.
    const entry1 = await createEntry(baseDraft)
    const entry2 = await createEntry({
      ...baseDraft,
      sleepStartUtc: '2026-05-30T10:00:00.000Z',
      wakeUtc: '2026-05-30T17:00:00.000Z',
    })

    // entry1 should be cycle 1, entry2 should be cycle 2.
    expect(entry1.cycleNumber).toBe(1)
    expect(entry2.cycleNumber).toBe(2)

    // Soft-delete entry1.
    await softDeleteEntry(entry1.id)

    // entry2 should now be renumbered to cycle 1.
    const updated2 = await getEntryById(entry2.id)
    expect(updated2!.cycleNumber).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// hardDeleteEntry
// ---------------------------------------------------------------------------

describe('hardDeleteEntry', () => {
  it('removes the entry from IDB entirely (getEntryById returns undefined)', async () => {
    const created = await createEntry(baseDraft)
    await hardDeleteEntry(created.id)
    const found = await getEntryById(created.id)
    expect(found).toBeUndefined()
  })

  it('renumbers remaining active entries gaplessly after hard-delete', async () => {
    const entry1 = await createEntry(baseDraft)
    const entry2 = await createEntry({
      ...baseDraft,
      sleepStartUtc: '2026-05-30T10:00:00.000Z',
      wakeUtc: '2026-05-30T17:00:00.000Z',
    })

    expect(entry1.cycleNumber).toBe(1)
    expect(entry2.cycleNumber).toBe(2)

    await hardDeleteEntry(entry1.id)

    const updated2 = await getEntryById(entry2.id)
    expect(updated2!.cycleNumber).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Cycle reassignment integration
// ---------------------------------------------------------------------------

describe('cycle reassignment integration', () => {
  it('correctly renumbers all entries when a back-fill entry is inserted', async () => {
    // Seed all 5 fixture entries via bulkPut.
    await db.sleepEntries.bulkPut(realSleepEntries)

    // Create a new entry with a sleepStartUtc earlier than all existing entries.
    const backfillDraft = {
      ...baseDraft,
      sleepStartUtc: '2026-05-28T00:00:00.000Z', // before Cycle 1 (2026-05-29T01:00Z)
      wakeUtc: '2026-05-28T07:00:00.000Z',
    }

    const backfill = await createEntry(backfillDraft)

    // The back-fill entry should be cycle 1 (earliest sleepStartUtc).
    expect(backfill.cycleNumber).toBe(1)

    // All existing entries should have shifted up by one.
    const allEntries = await getAllEntries()
    expect(allEntries).toHaveLength(6) // 5 fixtures + 1 back-fill

    // Verify the original Cycle 1 fixture is now Cycle 2.
    const originalCycle1 = allEntries.find(e => e.id === 'real-cycle-1')
    expect(originalCycle1!.cycleNumber).toBe(2)

    // Verify Cycle 5 fixture is now Cycle 6.
    const originalCycle5 = allEntries.find(e => e.id === 'real-cycle-5')
    expect(originalCycle5!.cycleNumber).toBe(6)
  })
})

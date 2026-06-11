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

    // Version 3 — no store structure changes.
    // Note: the Dexie version number and the app's SCHEMA_VERSION constant
    // (src/utils/backupSchema.ts) are separate counters that track different
    // things. Dexie version = IndexedDB store structure changes. SCHEMA_VERSION
    // = the shape of SleepEntry in backup files. They will diverge over time.
    this.version(3).stores({
      sleepEntries: '&id, sleepStartUtc, cycleNumber, sessionType, isDeleted, wakeUtc',
      syncQueue:    '&id, queuedAt',
    })
  }
}

export const db = new CircaLogDB()

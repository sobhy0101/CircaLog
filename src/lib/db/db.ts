import Dexie, { type Table } from 'dexie'
import type { SleepEntry } from '@/lib/circadian'

class CircaLogDB extends Dexie {
  sleepEntries!: Table<SleepEntry, string>

  constructor() {
    super('CircaLogDB')
    this.version(1).stores({
      sleepEntries: '&id, sleepStartUtc, cycleNumber, sessionType, isDeleted, wakeUtc',
    })
  }
}

export const db = new CircaLogDB()

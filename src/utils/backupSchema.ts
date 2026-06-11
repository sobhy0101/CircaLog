import type { SleepEntry } from '@/lib/circadian'

export const SCHEMA_VERSION = 1

export interface CircaLogBackup {
  schemaVersion: number   // value of SCHEMA_VERSION at export time
  exportedAt: string      // ISO 8601 UTC timestamp
  appVersion: string      // from import.meta.env.VITE_APP_VERSION or 'unknown'
  entryCount: number      // length of entries array — for quick validation
  entries: SleepEntry[]
}

/**
 * Validates a raw parsed JSON object and migrates it to the current schema
 * version if needed. Throws on invalid input or a version newer than the app.
 */
export function migrateBackup(raw: unknown): CircaLogBackup {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Invalid backup file: not a JSON object')
  }

  const obj = raw as Record<string, unknown>

  if (typeof obj['schemaVersion'] !== 'number') {
    throw new Error('Invalid backup file: missing schemaVersion')
  }

  if (!Array.isArray(obj['entries'])) {
    throw new Error('Invalid backup file: entries must be an array')
  }

  if (obj['schemaVersion'] > SCHEMA_VERSION) {
    throw new Error(
      'This backup was created by a newer version of CircaLog. Please update the app before restoring.'
    )
  }

  if (obj['schemaVersion'] === SCHEMA_VERSION) {
    return { ...obj, entryCount: (obj['entries'] as unknown[]).length } as unknown as CircaLogBackup
  }

  // schemaVersion < SCHEMA_VERSION — apply migration chain.
  // Each block patches `data` in-place then increments `version`.
  // To add a future migration: declare `let version = data.schemaVersion as number`
  // then append `if (version < N) { /* patch fields */ version = N }` blocks.
  // Example (do not uncomment — for documentation only):
  //   if (version < 2) { /* rename fields, add defaults, etc. */ version = 2 }
  //   if (version < 3) { /* further changes */ version = 3 }
  // SCHEMA_VERSION is currently 1, so no prior version exists yet.
  const data = structuredClone(raw) as Record<string, unknown>
  data['schemaVersion'] = SCHEMA_VERSION
  data['entryCount'] = (data['entries'] as unknown[]).length
  return data as unknown as CircaLogBackup
}

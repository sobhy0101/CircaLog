import { useState, useRef, useCallback } from 'react'
import { getAllEntries, hardDeleteEntry } from '@/lib/db'
import { db } from '@/lib/db/db'
import { assignCycleNumber } from '@/lib/circadian'
import { migrateBackup, type CircaLogBackup } from '@/utils/backupSchema'

export type RestorePhase = 'idle' | 'parsing' | 'previewing' | 'restoring' | 'done' | 'error'

interface RestorePreview {
  entryCount:     number   // total entries in the backup file
  exportedAt:     string   // ISO 8601 UTC string from the backup
  schemaVersion:  number
  duplicateCount: number   // entries whose id is already in IDB
  newCount:       number   // entries whose id is not in IDB
}

export function useRestore() {
  const [phase, setPhase]               = useState<RestorePhase>('idle')
  const [preview, setPreview]           = useState<RestorePreview | null>(null)
  const [restoredCount, setRestoredCount] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Backup and existing-id set are in refs — large data that does not need
  // to trigger re-renders on its own.
  const backupRef   = useRef<CircaLogBackup | null>(null)
  const existingRef = useRef<Set<string>>(new Set())

  // -------------------------------------------------------------------------
  // handleFile — parse, validate, preview
  // -------------------------------------------------------------------------

  const handleFile = useCallback(async (file: File) => {
    setPhase('parsing')
    setErrorMessage(null)
    setPreview(null)
    setRestoredCount(null)

    try {
      const text = await file.text()
      let parsed: unknown
      try {
        parsed = JSON.parse(text)
      } catch {
        setErrorMessage('Could not parse the file. Make sure it is a valid CircaLog backup (.json).')
        setPhase('error')
        return
      }

      let backup: CircaLogBackup
      try {
        backup = migrateBackup(parsed)
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Invalid backup file')
        setPhase('error')
        return
      }

      const existing = new Set((await getAllEntries()).map(e => e.id))
      const duplicateCount = backup.entries.filter(e => existing.has(e.id)).length
      const newCount       = backup.entries.length - duplicateCount

      backupRef.current   = backup
      existingRef.current = existing

      setPreview({
        entryCount:    backup.entries.length,
        exportedAt:    backup.exportedAt,
        schemaVersion: backup.schemaVersion,
        duplicateCount,
        newCount,
      })
      setPhase('previewing')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to read backup file')
      setPhase('error')
    }
  }, [])

  // -------------------------------------------------------------------------
  // confirmReplace — wipe all IDB entries, then restore from backup
  // -------------------------------------------------------------------------

  const confirmReplace = useCallback(async () => {
    const backup = backupRef.current
    if (!backup) return

    setPhase('restoring')
    try {
      // Wipe ALL entries from IDB — including soft-deleted ones.
      // Using getAllEntries() would be wrong here: it excludes soft-deleted
      // entries, so they would survive the wipe.
      const all = await db.sleepEntries.toArray()
      for (const entry of all) {
        // hardDeleteEntry skips Supabase when user is null — correct for
        // a signed-out restore that only touches local storage.
        await hardDeleteEntry(entry.id, null)
      }

      // Write backup entries directly with bulkPut to preserve the original
      // id values. createEntry() generates a new UUID and cannot be used here.
      await db.sleepEntries.bulkPut(backup.entries)

      // Renumber all entries — matches reassignAndPersist in the service layer.
      const allAfter   = await db.sleepEntries.toArray()
      const renumbered = assignCycleNumber(allAfter)
      await db.sleepEntries.bulkPut(renumbered)

      setRestoredCount(backup.entries.length)
      setPhase('done')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Restore failed')
      setPhase('error')
    }
  }, [])

  // -------------------------------------------------------------------------
  // confirmMerge — insert only new entries (skip duplicates)
  // -------------------------------------------------------------------------

  const confirmMerge = useCallback(async () => {
    const backup   = backupRef.current
    const existing = existingRef.current
    if (!backup) return

    setPhase('restoring')
    try {
      const newEntries = backup.entries.filter(e => !existing.has(e.id))

      // Same direct bulkPut rationale as confirmReplace — preserve original ids.
      await db.sleepEntries.bulkPut(newEntries)

      // Renumber ALL IDB entries (not just newly inserted ones) — inserting
      // entries chronologically between existing ones can shift their positions.
      const allAfter   = await db.sleepEntries.toArray()
      const renumbered = assignCycleNumber(allAfter)
      await db.sleepEntries.bulkPut(renumbered)

      setRestoredCount(newEntries.length)
      setPhase('done')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Restore failed')
      setPhase('error')
    }
  }, [])

  // -------------------------------------------------------------------------
  // reset — return to idle
  // -------------------------------------------------------------------------

  const reset = useCallback(() => {
    setPhase('idle')
    setPreview(null)
    setRestoredCount(null)
    setErrorMessage(null)
    backupRef.current   = null
    existingRef.current = new Set()
  }, [])

  return {
    phase,
    preview,
    restoredCount,
    errorMessage,
    handleFile,
    confirmReplace,
    confirmMerge,
    reset,
  }
}

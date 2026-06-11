import { useState, useCallback } from 'react'
import { getAllEntries } from '@/lib/db'
import { SCHEMA_VERSION, type CircaLogBackup } from '@/utils/backupSchema'

export type ExportStatus = 'idle' | 'exporting' | 'done' | 'error'

export function useExport() {
  const [status, setStatus]           = useState<ExportStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const exportBackup = useCallback(async () => {
    setStatus('exporting')
    setErrorMessage(null)

    try {
      const entries = await getAllEntries()

      const backup: CircaLogBackup = {
        schemaVersion: SCHEMA_VERSION,
        exportedAt:    new Date().toISOString(),
        // VITE_APP_VERSION is injected at build time via vite.config.ts define
        appVersion:    (import.meta.env.VITE_APP_VERSION as string | undefined) ?? 'unknown',
        entryCount:    entries.length,
        entries,
      }

      const json = JSON.stringify(backup, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url  = URL.createObjectURL(blob)

      const anchor    = document.createElement('a')
      // 'sv' (Swedish) locale always produces YYYY-MM-DD regardless of device
      // locale settings — the most portable way to get ISO-style local dates
      const datePart  = new Date().toLocaleDateString('sv')
      anchor.href     = url
      anchor.download = `circalog-backup-${datePart}.json`

      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)

      // Release the object URL immediately after the click to free memory
      URL.revokeObjectURL(url)

      setStatus('done')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Export failed')
      setStatus('error')
    }
  }, [])

  return { exportBackup, status, errorMessage }
}

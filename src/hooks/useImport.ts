// useImport.ts — State and async logic for the CSV import flow.
//
// Responsibilities:
//   - Hold all import state (parsed rows, gate status, progress, result).
//   - Run the three pre-import gate checks (online, Supabase reachable, signed in).
//   - Execute the row-by-row import via createEntry().
//   - Run flushQueue() after all rows are processed.
//   - Expose a blocker flag so ImportPage can warn before navigation.

import { useState, useCallback } from 'react'
import Papa from 'papaparse'
import { parseCsvRows } from '@/utils/csvParser'
import type { ParsedRow } from '@/utils/csvParser'
import { createEntry } from '@/lib/db/sleepEntryService'
import { flushQueue, checkSupabaseReachable } from '@/lib/supabase/syncService'
import { db } from '@/lib/db/db'
import type { User } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** The three gate checks that must all pass before import begins. */
export interface GateStatus {
  online:      boolean | null   // null = not yet checked
  supabase:    boolean | null
  signedIn:    boolean | null
}

/** Progress during an active import. */
export interface ImportProgress {
  current: number   // rows processed so far (including skips)
  total:   number   // total rows that will be processed (ok rows only)
}

/** Final result after all rows are processed. */
export interface ImportResult {
  imported:  number
  skipped:   number   // duplicates
  errors:    number   // parse errors (excluded before import starts)
  syncError: { code: string; message: string } | null
}

export type ImportPhase =
  | 'idle'        // no file selected yet
  | 'parsed'      // file parsed, preview shown, waiting for user
  | 'gating'      // running gate checks
  | 'importing'   // row-by-row import in progress
  | 'done'        // import complete (result available)

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useImport(user: User | null) {
  const [phase, setPhase]           = useState<ImportPhase>('idle')
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [gate, setGate]             = useState<GateStatus>({ online: null, supabase: null, signedIn: null })
  const [progress, setProgress]     = useState<ImportProgress | null>(null)
  const [result, setResult]         = useState<ImportResult | null>(null)
  const [gateError, setGateError]   = useState<string | null>(null)

  // True while import is actively running — used to block/warn navigation.
  const isImporting = phase === 'importing'

  // ---------------------------------------------------------------------------
  // File selection handler
  // ---------------------------------------------------------------------------

  /**
   * Called when the user selects a file. Runs PapaParse and sets parsedRows.
   * ianaTimezone is obtained from the browser at mount time by ImportPage and
   * passed here so the utility stays timezone-agnostic.
   */
  const handleFileSelect = useCallback((file: File, ianaTimezone: string) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = parseCsvRows(results.data, ianaTimezone)
        setParsedRows(rows)
        setPhase('parsed')
        setGate({ online: null, supabase: null, signedIn: null })
        setGateError(null)
        setResult(null)
        setProgress(null)
      },
      error: () => {
        setParsedRows([])
        setGateError('Could not read the file. Make sure it is a valid CSV export from CircaLog Daily Tracker.')
        setPhase('idle')
      },
    })
  }, [])

  // ---------------------------------------------------------------------------
  // Gate check
  // ---------------------------------------------------------------------------

  /**
   * Runs all three gate checks in sequence.
   * Returns true only when all three pass.
   */
  const runGateChecks = useCallback(async (): Promise<boolean> => {
    setPhase('gating')
    setGateError(null)

    // 1. Online check
    const online = navigator.onLine
    setGate(g => ({ ...g, online }))
    if (!online) {
      setGateError("You're offline. Import needs an active connection to sync your data.")
      setPhase('parsed')
      return false
    }

    // 2. Supabase reachability
    const supabaseOk = await checkSupabaseReachable()
    setGate(g => ({ ...g, supabase: supabaseOk }))
    if (!supabaseOk) {
      setGateError("Can't reach the server. Check your connection and try again.")
      setPhase('parsed')
      return false
    }

    // 3. Sign-in check
    const signedIn = user !== null
    setGate(g => ({ ...g, signedIn }))
    if (!signedIn) {
      // ImportPage should never show the confirm button when user is null,
      // but guard here defensively.
      setGateError('Sign in with Google before importing.')
      setPhase('parsed')
      return false
    }

    return true
  }, [user])

  // ---------------------------------------------------------------------------
  // Import execution
  // ---------------------------------------------------------------------------

  // _ianaTimezone is accepted for API symmetry with handleFileSelect but not
  // used here — the timezone is already embedded in each draft by parseCsvRows.
  const startImport = useCallback(async (_ianaTimezone: string) => {
    const gateOk = await runGateChecks()
    if (!gateOk) return

    // Only process rows that parsed successfully.
    const okRows = parsedRows.filter(r => r.status === 'ok') as Extract<ParsedRow, { status: 'ok' }>[]
    if (okRows.length === 0) {
      setPhase('done')
      setResult({ imported: 0, skipped: 0, errors: parsedRows.filter(r => r.status === 'error').length, syncError: null })
      return
    }

    setPhase('importing')
    setProgress({ current: 0, total: okRows.length })

    let imported = 0
    let skipped  = 0

    for (let i = 0; i < okRows.length; i++) {
      const row = okRows[i]

      // Duplicate detection: skip if sleepStartUtc already exists in IDB.
      const existing = await db.sleepEntries
        .where('sleepStartUtc')
        .equals(row.draft.sleepStartUtc)
        .count()

      if (existing > 0) {
        skipped++
      } else {
        // createEntry handles IDB write, cycle reassignment, and Supabase push.
        await createEntry(row.draft, user)
        imported++
      }

      setProgress({ current: i + 1, total: okRows.length })
    }

    // Final flush attempt for anything that ended up in the sync queue.
    let syncError: ImportResult['syncError'] = null
    if (user) {
      try {
        await flushQueue(user)
        // Check if any of the imported entries are still queued (push failed).
        const remaining = await db.syncQueue.toArray()
        if (remaining.length > 0) {
          syncError = { code: '503', message: 'Some entries could not be synced to the server.' }
        }
      } catch (err) {
        syncError = {
          code: '503',
          message: err instanceof Error ? err.message : 'Unknown sync error',
        }
      }
    }

    setResult({
      imported,
      skipped,
      errors: parsedRows.filter(r => r.status === 'error').length,
      syncError,
    })
    setPhase('done')
  }, [parsedRows, user, runGateChecks])

  // ---------------------------------------------------------------------------
  // Reset (allows re-importing with a new file)
  // ---------------------------------------------------------------------------

  const reset = useCallback(() => {
    setPhase('idle')
    setParsedRows([])
    setGate({ online: null, supabase: null, signedIn: null })
    setGateError(null)
    setProgress(null)
    setResult(null)
  }, [])

  return {
    phase,
    parsedRows,
    gate,
    gateError,
    progress,
    result,
    isImporting,
    handleFileSelect,
    startImport,
    reset,
  }
}

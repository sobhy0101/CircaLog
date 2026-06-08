# CC Task — Phase 1: CSV Import

**File:** `tasks/CC_TASK_Phase1_CSVImport.md`
**Session type:** Single session
**Tier:** 2 (new dependency, 3 new files, 3 modified files)

---

## Context

CircaLog needs a CSV import flow for sleep log data exported from
`CircaLog-Daily-Tracker.xlsx`. The user selects a CSV file from the Side
Drawer → "Import" entry, a preview table is shown, and after confirmation the
data lands in both IndexedDB and Supabase.

Do NOT re-read project files to re-derive decisions — everything required is
documented in this task file.

---

## Skills to read first (before any other step)

```powershell
# Read these three skill files before writing any code
Get-Content "C:\Projects\CircaLog\.claude\skills\token-usage\SKILL.md"
Get-Content "C:\Projects\CircaLog\.claude\skills\run\SKILL.md"
Get-Content "C:\Projects\CircaLog\.claude\skills\visual-check\SKILL.md"
```

---

## Step 1 — Install PapaParse

```powershell
cd C:\Projects\CircaLog
npm install papaparse
npm install --save-dev @types/papaparse
```

Confirm both packages installed successfully and record exact versions in the
session report.

---

## Step 2 — Create `src/utils/csvParser.ts`

Create this file from scratch. It is a **pure TypeScript utility** — no React,
no hooks, no side effects.

### Purpose

Parses a PapaParse result into an array of `ParsedRow` objects ready for
`useImport.ts` to hand to `createEntry`.

### Full file content

```typescript
// csvParser.ts — Pure CSV parsing utility for CircaLog sleep log imports.
//
// Input:  PapaParse result data (array of raw string-keyed row objects).
// Output: Array of ParsedRow — either a valid draft or a parse error.
//
// This file has no React dependencies and no side effects.
// All timezone-aware UTC conversion is done here using the browser's
// local timezone, which is passed in as ianaTimezone.

import type { SleepEntry, QualityRating, Interruption } from '@/lib/circadian'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * A successfully parsed row, ready to pass to createEntry().
 * Shape matches the `draft` parameter of createEntry() exactly.
 */
export type ParsedDraft = Omit<
  SleepEntry,
  'id' | 'cycleNumber' | 'sessionType' | 'createdAt' | 'updatedAt' | 'isDeleted'
>

/** A row that failed to parse, with a human-readable reason. */
export interface ParseError {
  rowIndex: number   // 0-based index into the raw PapaParse data array
  reason: string
}

/** The result for one CSV row — either a valid draft or an error. */
export type ParsedRow =
  | { status: 'ok';    rowIndex: number; draft: ParsedDraft }
  | { status: 'error'; rowIndex: number; reason: string }

// ---------------------------------------------------------------------------
// Interruption mapping
// ---------------------------------------------------------------------------

/**
 * Best-effort mapping from free-text CSV interruption values to
 * structured Interruption[] objects.
 *
 * Strategy:
 *   - Empty string, "N/A", "none" (case-insensitive) → undefined
 *   - Text containing "pee", "peed", "bathroom", "toilet", "loo"
 *     (case-insensitive) → { type: 'bathroom', note: original text }
 *   - Anything else → { type: 'other', note: original text }
 *
 * The original text is always preserved in the `note` field so no
 * information is lost.
 */
function mapInterruptions(raw: string): Interruption[] | undefined {
  const trimmed = raw.trim()
  if (!trimmed) return undefined

  const lower = trimmed.toLowerCase()

  // Treat placeholder values as "no interruptions"
  if (lower === 'n/a' || lower === 'none') return undefined

  // Bathroom keyword detection
  const bathroomKeywords = ['pee', 'peed', 'bathroom', 'toilet', 'loo']
  const isBathroom = bathroomKeywords.some(kw => lower.includes(kw))

  return [
    {
      type: isBathroom ? 'bathroom' : 'other',
      note: trimmed,
    },
  ]
}

// ---------------------------------------------------------------------------
// Date/time helpers
// ---------------------------------------------------------------------------

/**
 * Parses a "DD-MM-YYYY" date string into its numeric parts.
 * Returns null if the format is unrecognized.
 */
function parseDDMMYYYY(raw: string): { day: number; month: number; year: number } | null {
  const match = raw.trim().match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (!match) return null
  return {
    day:   parseInt(match[1], 10),
    month: parseInt(match[2], 10),
    year:  parseInt(match[3], 10),
  }
}

/**
 * Converts a local date (YYYY-MM-DD) + time (HH:MM) string to a UTC ISO
 * string, using the browser's local timezone via the Date constructor.
 *
 * The Date constructor interprets "YYYY-MM-DDTHH:MM:00" as LOCAL time when
 * no timezone offset is included, which is correct here because the entries
 * were recorded in the same timezone the browser is currently in.
 *
 * Returns null if the input is unparseable.
 */
function toUtcIso(dateYYYYMMDD: string, timeHHMM: string): string | null {
  const dt = new Date(`${dateYYYYMMDD}T${timeHHMM}:00`)
  if (isNaN(dt.getTime())) return null
  return dt.toISOString()
}

/**
 * Formats { day, month, year } as "YYYY-MM-DD".
 */
function formatYMD(day: number, month: number, year: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * Adds one calendar day to a "YYYY-MM-DD" string.
 * Uses UTC Date arithmetic to avoid DST skew.
 */
function addOneDay(dateYYYYMMDD: string): string {
  const d = new Date(`${dateYYYYMMDD}T12:00:00Z`) // noon UTC avoids DST edge cases
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

/**
 * Compares two "HH:MM" time strings.
 * Returns true if a is strictly earlier in the day than b.
 */
function timeBefore(a: string, b: string): boolean {
  return a < b
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Parses an array of raw PapaParse row objects into ParsedRow results.
 *
 * @param rows         - Raw data from Papa.parse(...).data
 * @param ianaTimezone - IANA timezone string from the user's browser,
 *                       e.g. "Africa/Cairo". Stored on each resulting entry.
 */
export function parseCsvRows(
  rows: Record<string, string>[],
  ianaTimezone: string
): ParsedRow[] {
  return rows.map((row, rowIndex) => {
    try {
      // ── 1. Date ────────────────────────────────────────────────────────────

      const rawDate = (row['Date'] ?? '').trim()
      const dateParts = parseDDMMYYYY(rawDate)
      if (!dateParts) {
        return { status: 'error', rowIndex, reason: `Invalid date format: "${rawDate}" (expected DD-MM-YYYY)` }
      }
      const { day, month, year } = dateParts
      const baseDateYMD = formatYMD(day, month, year)

      // ── 2. Future-date warning ─────────────────────────────────────────────
      // (Flagged as an error so the preview table can surface it.
      // Threshold: more than 1 year in the future from today.)
      const today = new Date()
      const entryDate = new Date(`${baseDateYMD}T12:00:00Z`)
      const oneYearFromNow = new Date(today)
      oneYearFromNow.setFullYear(today.getFullYear() + 1)
      if (entryDate > oneYearFromNow) {
        return {
          status: 'error',
          rowIndex,
          reason: `⚠️ Date appears to be in the future — check source data (${rawDate})`,
        }
      }

      // ── 3. Time fields ─────────────────────────────────────────────────────

      const rawBedTime    = (row['Bed Time']    ?? '').trim()
      const rawSleepStart = (row['Sleep Start'] ?? '').trim()
      const rawWakeTime   = (row['Wake Time']   ?? '').trim()

      if (!rawBedTime || !rawSleepStart || !rawWakeTime) {
        return { status: 'error', rowIndex, reason: 'Missing one or more required time fields (Bed Time, Sleep Start, Wake Time)' }
      }

      // ── 4. Midnight crossover — sleep start ────────────────────────────────
      // If Sleep Start is earlier in the day than Bed Time, sleep start
      // is on the following calendar day.
      const sleepStartCrossed = timeBefore(rawSleepStart, rawBedTime)
      const sleepStartDateYMD = sleepStartCrossed ? addOneDay(baseDateYMD) : baseDateYMD

      // ── 5. Midnight crossover — wake time ──────────────────────────────────
      // If Wake Time is earlier in the day than Sleep Start, wake time
      // is on the day after the sleep start date.
      const wakeTimeCrossed = timeBefore(rawWakeTime, rawSleepStart)
      const wakeDateYMD = wakeTimeCrossed ? addOneDay(sleepStartDateYMD) : sleepStartDateYMD

      // ── 6. Convert to UTC ISO strings ──────────────────────────────────────

      const bedTimeUtc    = toUtcIso(baseDateYMD,       rawBedTime)
      const sleepStartUtc = toUtcIso(sleepStartDateYMD, rawSleepStart)
      const wakeUtc       = toUtcIso(wakeDateYMD,       rawWakeTime)

      if (!bedTimeUtc)    return { status: 'error', rowIndex, reason: `Invalid Bed Time value: "${rawBedTime}"` }
      if (!sleepStartUtc) return { status: 'error', rowIndex, reason: `Invalid Sleep Start value: "${rawSleepStart}"` }
      if (!wakeUtc)       return { status: 'error', rowIndex, reason: `Invalid Wake Time value: "${rawWakeTime}"` }

      // Sanity check: wake must be after sleep start
      if (new Date(wakeUtc) <= new Date(sleepStartUtc)) {
        return { status: 'error', rowIndex, reason: 'Wake Time is not after Sleep Start — check the source row' }
      }

      // ── 7. Quality ─────────────────────────────────────────────────────────

      const rawQuality = (row['Quality'] ?? '').trim()
      const qualityNum = parseInt(rawQuality, 10)
      if (isNaN(qualityNum) || qualityNum < 1 || qualityNum > 5) {
        return { status: 'error', rowIndex, reason: `Invalid Quality value: "${rawQuality}" (must be 1–5)` }
      }
      const quality = qualityNum as QualityRating

      // ── 8. Had Dreams? ─────────────────────────────────────────────────────

      const rawHadDreams = (row['Had Dreams?'] ?? '').trim()
      const hadDreams: boolean | undefined =
        rawHadDreams === 'Yes' ? true :
        rawHadDreams === 'No'  ? false :
        undefined

      // ── 9. Dream Notes ─────────────────────────────────────────────────────

      const rawDreamNotes = (row['Dream Notes'] ?? '').trim()
      const dreamNotes: string | undefined =
        hadDreams === true && rawDreamNotes && rawDreamNotes.toLowerCase() !== 'n/a'
          ? rawDreamNotes
          : undefined

      // ── 10. Interruptions → structured Interruption[] ──────────────────────

      const rawInterruptions = (row['Interruptions'] ?? '').trim()
      const interruptions = mapInterruptions(rawInterruptions)

      // ── 11. Notes ──────────────────────────────────────────────────────────

      const rawNotes = (row['Notes'] ?? '').trim()
      const notes: string | undefined =
        rawNotes && rawNotes.toLowerCase() !== 'n/a' ? rawNotes : undefined

      // ── 12. Build the draft ────────────────────────────────────────────────

      const draft: ParsedDraft = {
        bedTimeUtc,
        sleepStartUtc,
        wakeUtc,
        ianaTimezone,
        quality,
        hadDreams,
        dreamNotes,
        interruptions,
        notes,
      }

      return { status: 'ok', rowIndex, draft }

    } catch (err) {
      return {
        status: 'error',
        rowIndex,
        reason: `Unexpected parse error: ${err instanceof Error ? err.message : String(err)}`,
      }
    }
  })
}
```

---

## Step 3 — Add `checkSupabaseReachable` to `src/lib/supabase/syncService.ts`

Open the file and **append** the following function at the very end, after
`flushQueue`. Do not modify any existing code.

```typescript
/**
 * Performs a lightweight connectivity check against Supabase.
 *
 * Used by the import gate to verify the server is reachable before
 * starting an import that requires cloud sync.
 *
 * Returns true if the query succeeds (even with zero rows).
 * Returns false if supabase is null, the browser is offline, or the
 * query returns an error for any reason.
 */
export async function checkSupabaseReachable(): Promise<boolean> {
  if (!supabase) return false
  if (!navigator.onLine) return false
  try {
    const { error } = await supabase
      .from('sleep_entries')
      .select('id')
      .limit(1)
    return error === null
  } catch {
    return false
  }
}
```

---

## Step 4 — Create `src/hooks/useImport.ts`

Create this file from scratch.

```typescript
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

  const startImport = useCallback(async (ianaTimezone: string) => {
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
```

---

## Step 5 — Create `src/pages/log/ImportPage.tsx`

Create this file from scratch. Read `.claude/skills/token-usage/SKILL.md`
before writing any class names.

### Design rules

- Mobile-first, full-page inside AppShell (bottom tab bar visible).
- `circa-*` tokens only — no raw Tailwind palette classes.
- `font-display` (Exo 2) for the page title. Inter (default) for body/UI text.
- No `import React from 'react'` — use named imports only.
- Four distinct UI phases rendered from `useImport` state:
  `idle` → `parsed` (preview) → `importing` (progress) → `done` (result).

### File

```typescript
// ImportPage.tsx — Full-page CSV import flow for CircaLog sleep log data.
//
// Route: /log/import
// Entry point: Side Drawer → More → Import
//
// Four phases:
//   idle      — file picker shown
//   parsed    — preview table + confirm button
//   importing — row-by-row progress indicator
//   done      — success/error result

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useImport } from '@/hooks/useImport'
import type { ParsedRow } from '@/utils/csvParser'
import GoogleSignInButton from '@/components/ui/GoogleSignInButton'

// ---------------------------------------------------------------------------
// Small helper — session type label derived from duration
// (preview only — sessionType is computed by createEntry at import time)
// ---------------------------------------------------------------------------

function previewSessionType(draft: Extract<ParsedRow, { status: 'ok' }>['draft']): string {
  const startMs = new Date(draft.sleepStartUtc).getTime()
  const wakeMs  = new Date(draft.wakeUtc).getTime()
  const hours   = (wakeMs - startMs) / 1000 / 3600
  return hours < 3 ? 'Nap' : 'Main Sleep'
}

function formatDuration(draft: Extract<ParsedRow, { status: 'ok' }>['draft']): string {
  const ms = new Date(draft.wakeUtc).getTime() - new Date(draft.sleepStartUtc).getTime()
  const totalMinutes = Math.round(ms / 60000)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// Format a UTC ISO string as local HH:MM using the entry's ianaTimezone.
function formatLocalTime(utcIso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   false,
    timeZone: tz,
  }).format(new Date(utcIso))
}

// Format a UTC ISO string as local DD/MM/YYYY.
function formatLocalDate(utcIso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day:      '2-digit',
    month:    '2-digit',
    year:     'numeric',
    timeZone: tz,
  }).format(new Date(utcIso))
}

// ---------------------------------------------------------------------------
// Duplicate row set — computed from parsedRows in preview phase
// (useImport checks IDB at import time; this is a preview-only indicator
//  based on sleepStartUtc uniqueness within the file itself)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ImportPage() {
  const navigate    = useNavigate()
  const { user }    = useAuth()
  const ianaTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const {
    phase,
    parsedRows,
    gateError,
    progress,
    result,
    isImporting,
    handleFileSelect,
    startImport,
    reset,
  } = useImport(user)

  // Warn before navigating away during active import.
  const [showLeaveWarning, setShowLeaveWarning] = useState(false)
  const pendingNavRef = useRef<string | null>(null)

  function requestNavigate(to: string) {
    if (isImporting) {
      pendingNavRef.current = to
      setShowLeaveWarning(true)
    } else {
      navigate(to)
    }
  }

  function confirmLeave() {
    setShowLeaveWarning(false)
    const dest = pendingNavRef.current ?? '/log'
    pendingNavRef.current = null
    navigate(dest)
  }

  function cancelLeave() {
    setShowLeaveWarning(false)
    pendingNavRef.current = null
  }

  // File input ref — used to programmatically open the picker.
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file, ianaTimezone)
    // Reset so the same file can be re-selected if needed.
    e.target.value = ''
  }

  // Counts for the summary line.
  const okRows    = parsedRows.filter(r => r.status === 'ok')
  const errorRows = parsedRows.filter(r => r.status === 'error')

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col min-h-full bg-circa-bg text-circa-text-primary">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-circa-border">
        <button
          onClick={() => requestNavigate('/log')}
          aria-label="Back to log"
          className="
            p-2 -ml-2 rounded-md
            text-circa-text-secondary
            hover:text-circa-text-primary
            hover:bg-circa-surface-raised
            transition-colors
          "
        >
          {/* Left arrow icon */}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="font-display text-lg font-semibold text-circa-text-primary tracking-wide">
          Import Sleep Log
        </h1>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">

        {/* ── Not signed in ── */}
        {!user && (
          <div className="space-y-4">
            <p className="text-sm text-circa-text-secondary">
              Sign in with Google to import your data. Imported sessions are
              saved to your account so they sync across devices.
            </p>
            <GoogleSignInButton />
          </div>
        )}

        {/* ── Signed in ── */}
        {user && (
          <>
            {/* Phase: idle — file picker */}
            {(phase === 'idle') && (
              <div className="space-y-4">
                <p className="text-sm text-circa-text-secondary">
                  Select a CSV file exported from your CircaLog Daily Tracker
                  spreadsheet. Duplicate entries are detected automatically and
                  will be skipped.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleInputChange}
                  aria-label="Select CSV file"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="
                    w-full flex flex-col items-center justify-center gap-2
                    px-4 py-8 rounded-xl border-2 border-dashed
                    border-circa-border
                    hover:border-circa-accent hover:bg-circa-accent-subtle
                    text-circa-text-secondary hover:text-circa-accent
                    transition-colors cursor-pointer
                  "
                >
                  {/* Upload icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span className="text-sm font-medium">Tap to select a CSV file</span>
                  <span className="text-xs">.csv only</span>
                </button>

                {gateError && (
                  <p className="text-sm text-circa-error px-1">{gateError}</p>
                )}
              </div>
            )}

            {/* Phase: parsed — preview table + confirm */}
            {(phase === 'parsed' || phase === 'gating') && (
              <div className="space-y-4">

                {/* Summary line */}
                <p className="text-sm text-circa-text-secondary">
                  <span className="text-circa-text-primary font-medium">{okRows.length}</span>
                  {' '}ready to import
                  {errorRows.length > 0 && (
                    <> · <span className="text-circa-error font-medium">{errorRows.length} error{errorRows.length !== 1 ? 's' : ''}</span></>
                  )}
                </p>

                {/* Preview table — horizontally scrollable on mobile */}
                <div className="overflow-x-auto rounded-lg border border-circa-border">
                  <table className="min-w-full text-xs">
                    <thead className="bg-circa-surface-raised">
                      <tr>
                        {['#', 'Date', 'Sleep Start', 'Wake Time', 'Duration', 'Quality', 'Type', 'Status'].map(h => (
                          <th
                            key={h}
                            className="px-3 py-2 text-left font-semibold text-circa-text-secondary whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((row, i) => {
                        const isOk = row.status === 'ok'
                        const draft = isOk ? (row as Extract<ParsedRow, { status: 'ok' }>).draft : null

                        return (
                          <tr
                            key={i}
                            className={`
                              border-t border-circa-border
                              ${i % 2 === 0 ? 'bg-circa-surface' : 'bg-circa-surface-raised'}
                            `}
                          >
                            {/* Row number */}
                            <td className="px-3 py-2 text-circa-text-secondary">{i + 1}</td>

                            {/* Date */}
                            <td className="px-3 py-2 whitespace-nowrap">
                              {draft
                                ? formatLocalDate(draft.bedTimeUtc ?? draft.sleepStartUtc, ianaTimezone)
                                : '—'}
                            </td>

                            {/* Sleep Start */}
                            <td className="px-3 py-2 whitespace-nowrap">
                              {draft ? formatLocalTime(draft.sleepStartUtc, ianaTimezone) : '—'}
                            </td>

                            {/* Wake Time */}
                            <td className="px-3 py-2 whitespace-nowrap">
                              {draft ? formatLocalTime(draft.wakeUtc, ianaTimezone) : '—'}
                            </td>

                            {/* Duration */}
                            <td className="px-3 py-2 whitespace-nowrap">
                              {draft ? formatDuration(draft) : '—'}
                            </td>

                            {/* Quality */}
                            <td className="px-3 py-2">
                              {draft ? draft.quality : '—'}
                            </td>

                            {/* Session type */}
                            <td className="px-3 py-2 whitespace-nowrap">
                              {draft ? previewSessionType(draft) : '—'}
                            </td>

                            {/* Status badge */}
                            <td className="px-3 py-2 whitespace-nowrap">
                              {row.status === 'ok' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-circa-success/15 text-circa-success">
                                  Ready
                                </span>
                              )}
                              {row.status === 'error' && (
                                <span
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-circa-error/15 text-circa-error"
                                  title={row.reason}
                                >
                                  {row.reason.startsWith('⚠️') ? row.reason : `⚠️ ${row.reason}`}
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Gate error */}
                {gateError && (
                  <div className="rounded-lg bg-circa-error/10 border border-circa-error/30 px-4 py-3">
                    <p className="text-sm text-circa-error">{gateError}</p>
                    <button
                      onClick={() => startImport(ianaTimezone)}
                      className="mt-2 text-sm font-medium text-circa-error underline underline-offset-2"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={reset}
                    className="
                      flex-1 px-4 py-3 rounded-xl text-sm font-medium
                      border border-circa-border
                      text-circa-text-secondary
                      hover:bg-circa-surface-raised
                      transition-colors
                    "
                  >
                    Choose different file
                  </button>

                  <button
                    onClick={() => startImport(ianaTimezone)}
                    disabled={okRows.length === 0 || phase === 'gating'}
                    className="
                      flex-1 px-4 py-3 rounded-xl text-sm font-medium
                      bg-circa-accent text-white
                      hover:bg-circa-accent-hover
                      disabled:opacity-40 disabled:cursor-not-allowed
                      transition-colors
                    "
                  >
                    {phase === 'gating'
                      ? 'Checking…'
                      : `Import ${okRows.length} session${okRows.length !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </div>
            )}

            {/* Phase: importing — progress */}
            {phase === 'importing' && progress && (
              <div className="space-y-4">
                <p className="text-sm text-circa-text-secondary">
                  Importing row{' '}
                  <span className="text-circa-text-primary font-medium">{progress.current}</span>
                  {' '}of{' '}
                  <span className="text-circa-text-primary font-medium">{progress.total}</span>
                  …
                </p>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-circa-surface-raised overflow-hidden">
                  <div
                    className="h-full rounded-full bg-circa-accent transition-all duration-300"
                    style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
                  />
                </div>

                <p className="text-xs text-circa-text-secondary">
                  Please keep this page open until the import completes.
                </p>
              </div>
            )}

            {/* Phase: done — result */}
            {phase === 'done' && result && (
              <div className="space-y-4">

                {/* Success summary */}
                <div className="rounded-xl bg-circa-success/10 border border-circa-success/30 px-4 py-4 space-y-1">
                  <p className="text-sm font-medium text-circa-success">
                    ✅ Import complete
                  </p>
                  <p className="text-sm text-circa-text-secondary">
                    <span className="text-circa-text-primary font-medium">{result.imported}</span> imported
                    {result.skipped > 0 && (
                      <> · <span className="text-circa-text-primary font-medium">{result.skipped}</span> skipped (duplicates)</>
                    )}
                    {result.errors > 0 && (
                      <> · <span className="text-circa-error font-medium">{result.errors}</span> not imported (parse errors)</>
                    )}
                  </p>
                </div>

                {/* Sync error block */}
                {result.syncError && (
                  <div className="rounded-xl bg-circa-error/10 border border-circa-error/30 px-4 py-4 space-y-2">
                    <p className="text-sm font-medium text-circa-error">
                      ⚠️ SYNC_ERR_{result.syncError.code}: {result.syncError.message}
                    </p>
                    <p className="text-sm text-circa-text-secondary">
                      Your sessions were saved to this device but could not reach
                      the server. They will sync automatically when connectivity
                      is restored.
                    </p>
                    <p className="text-xs text-circa-text-secondary">
                      If this keeps happening, contact us at{' '}
                      <a
                        href="mailto:circalog.app@gmail.com"
                        className="text-circa-accent underline underline-offset-2"
                      >
                        circalog.app@gmail.com
                      </a>
                    </p>
                  </div>
                )}

                {/* Navigation */}
                <button
                  onClick={() => navigate('/log')}
                  className="
                    w-full px-4 py-3 rounded-xl text-sm font-medium
                    bg-circa-accent text-white
                    hover:bg-circa-accent-hover
                    transition-colors
                  "
                >
                  Back to Log
                </button>

                {result.errors > 0 && (
                  <button
                    onClick={reset}
                    className="
                      w-full px-4 py-3 rounded-xl text-sm font-medium
                      border border-circa-border
                      text-circa-text-secondary
                      hover:bg-circa-surface-raised
                      transition-colors
                    "
                  >
                    Import another file
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Leave-during-import warning dialog ── */}
      {showLeaveWarning && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" aria-hidden="true" />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div className="w-full max-w-sm rounded-2xl bg-circa-surface border border-circa-border p-6 space-y-4">
              <h2 className="font-display text-base font-semibold text-circa-text-primary">
                Import in progress
              </h2>
              <p className="text-sm text-circa-text-secondary">
                Leaving now will stop the import. Any sessions already processed
                will be kept, but the rest will not be imported.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelLeave}
                  className="
                    flex-1 px-4 py-2.5 rounded-xl text-sm font-medium
                    bg-circa-accent text-white
                    hover:bg-circa-accent-hover
                    transition-colors
                  "
                >
                  Stay
                </button>
                <button
                  onClick={confirmLeave}
                  className="
                    flex-1 px-4 py-2.5 rounded-xl text-sm font-medium
                    border border-circa-border
                    text-circa-text-secondary
                    hover:bg-circa-surface-raised
                    transition-colors
                  "
                >
                  Leave anyway
                </button>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  )
}
```

---

## Step 6 — Add the import route to `src/App.tsx`

Open `src/App.tsx`. Make exactly two changes:

1. Add this import at the top, after the existing page imports:

```typescript
import ImportPage from '@/pages/log/ImportPage'
```

2. Add this route inside the `/log` `<Route>` block, after the `chart` route:

```typescript
<Route path="import" element={<ImportPage />} />
```

The resulting `/log` route block must look like this:

```typescript
<Route path="/log" element={<AppShell />}>
  <Route index element={<LogPage />} />
  <Route path="history" element={<HistoryPage />} />
  <Route path="chart" element={<ChartPage />} />
  <Route path="import" element={<ImportPage />} />
</Route>
```

---

## Step 7 — Add the Import entry to `src/components/layout/SideDrawer.tsx`

Open `SideDrawer.tsx`. Make exactly two changes:

1. Add this import at the top with the other React Router imports:

```typescript
import { useNavigate } from 'react-router-dom'
```

2. Add `const navigate = useNavigate()` inside the component body, after the
   `useAuth()` call.

3. Add the Import button **between the Export button and the About button** in
   the "More" section. The button must:
   - Be hidden when `user` is null (`{user && (...)}`)
   - Call `navigate('/log/import')` and then `onClose()` when tapped

Insert this block between Export and About:

```typescript
{/* Import — visible only when signed in */}
{user && (
  <button
    onClick={() => { navigate('/log/import'); onClose(); }}
    className="flex items-center gap-3 w-full text-left px-6 py-3 text-sm text-circa-text-primary hover:bg-circa-accent-subtle transition-colors"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
    Import
  </button>
)}
```

**Note:** The Export icon above uses an upward arrow (polyline `17 8 12 3 7 8`
with a line going up). The Import icon uses the same visual but keep the SVG
as written above — it is the correct download/import direction arrow.

---

## Step 8 — Run a build check

```powershell
cd C:\Projects\CircaLog
npm run build
```

Fix any TypeScript or build errors before proceeding. Do not proceed to the
visual check if the build fails.

---

## Step 9 — Visual check

Follow `.claude/skills/visual-check/SKILL.md`.

Start the dev server per `.claude/skills/run/SKILL.md`.

Verify the following in the browser:

1. Open the Side Drawer while **not** signed in. Confirm the Import entry is
   absent from the "More" section.
2. Sign in with Google (`sobhy0101@gmail.com`). Open the Side Drawer again.
   Confirm "Import" appears in the "More" section between Export and About.
3. Tap "Import". Confirm navigation to `/log/import`.
4. Confirm the import page shows a file picker with the dashed-border tap
   target.
5. Select the file `C:\Users\sobhy\OneDrive\CircaLog-Daily-Tracker.xlsx` —
   wait, this is an `.xlsx` file. The import only accepts `.csv`.
   **Use a CSV export instead.** If a CSV export is not available, skip
   steps 5–8 and note this in the session report.
6. If a CSV is available: select it and confirm the preview table renders
   with 14 rows. Confirm row 12 (`06-07-2026`) shows an error badge with
   the future-date warning.
7. Confirm the summary line shows the correct counts.
8. Do NOT confirm the import during the visual check — Mahmoud will run
   the actual import manually.

Take a screenshot of the preview table and save it to
`tasks/screenshots/import-preview.png`.

---

## Step 10 — Session report

Write a comprehensive Markdown report covering:

- All steps executed and their outcomes
- Exact versions of `papaparse` and `@types/papaparse` installed
- Build output (warnings, if any)
- Visual check results and any deviations
- Full list of files created and modified
- Any deviations from the task instructions

Save the report to:
`tasks/cc-reports/REPORT_phase1-csv-import_{DD}-{mon}-{YYYY}.md`

Follow all rules in `.claude/memory/session_report_policy.md` and
`.claude/memory/feedback_report_conventions.md`.

Paste a short summary into the chat and **wait for Mahmoud's confirmation**
before running the git commit.

---

## Step 11 — Git commit (after confirmation only)

```powershell
cd C:\Projects\CircaLog
git add .
git commit -m "feat: CSV import flow for sleep log data

- Add src/utils/csvParser.ts — pure PapaParse-based parser with
  midnight crossover handling, quality validation, interruption
  mapping (structured Interruption[] with bathroom/other), and
  future-date detection
- Add src/hooks/useImport.ts — import state machine with gate
  checks (online, Supabase reachable, signed in), row-by-row
  createEntry calls, flushQueue after batch, warn-but-allow
  navigation blocker during active import
- Add src/pages/log/ImportPage.tsx — four-phase full-page UI
  (idle, parsed/preview, importing/progress, done/result)
- Add checkSupabaseReachable() to syncService.ts
- Wire /log/import route in App.tsx
- Add Import entry to SideDrawer More section (signed-in only)
- Install papaparse + @types/papaparse"
git push
```

---

## TO-DO item this task closes

In `docs/CircaLog-TO-DO-list.md`, section `### 📥 Data Import`:

```
- [ ] 🟡 Import sleep log from CSV
```

Update this to:

```
- [x] ✅ Import sleep log from CSV
```

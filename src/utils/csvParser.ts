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

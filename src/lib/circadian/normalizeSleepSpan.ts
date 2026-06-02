/**
 * normalizeSleepSpan
 *
 * Validates a SleepEntry's timestamps and derives the three local calendar
 * dates that correspond to bed time, sleep start, and wake time.
 *
 * Why three dates?
 *   A single sleep session can span multiple calendar dates. For a patient
 *   with Non-24, a session that starts at 23:10 on May 31 (local), crosses
 *   midnight, and ends at 05:40 on June 1 (local) belongs to the "night of
 *   May 31" — not June 1. Without storing bed time and deriving all three
 *   local dates, the history view, actogram, and doctor report all risk
 *   displaying the wrong date for sessions that cross midnight.
 *
 * Duration is computed from UTC timestamps only — this is correct across
 * DST transitions (spring-forward, fall-back) and midnight crossovers
 * because UTC is a uniform timeline with no gaps or repeats.
 */

import type { SleepEntry, NormalizedSleepSpan } from './types'
import { utcToLocalDate } from './utils'

/**
 * Validates and normalizes the timestamps of a single SleepEntry,
 * returning a NormalizedSleepSpan with pre-computed local dates.
 *
 * Throws if wakeUtc is not strictly after sleepStartUtc — this is a
 * data integrity error that must not silently produce a negative duration.
 *
 * @param entry - A single SleepEntry (may or may not have bedTimeUtc)
 * @returns NormalizedSleepSpan with durationMs and local date strings
 */
export function normalizeSleepSpan(entry: SleepEntry): NormalizedSleepSpan {
  const sleepStart = new Date(entry.sleepStartUtc).getTime()
  const wake = new Date(entry.wakeUtc).getTime()

  // Duration must be positive. A zero or negative duration means the
  // timestamps are wrong — this should never happen in valid data.
  if (wake <= sleepStart) {
    throw new Error(
      `normalizeSleepSpan: wakeUtc (${entry.wakeUtc}) must be after ` +
      `sleepStartUtc (${entry.sleepStartUtc}) for entry id="${entry.id}"`
    )
  }

  const durationMs = wake - sleepStart

  // Derive local dates using the entry's own timezone.
  // Each date is computed independently — they may be different calendar
  // dates (e.g. sleep start May 31 local, wake June 1 local).
  const localSleepStartDate = utcToLocalDate(entry.sleepStartUtc, entry.ianaTimezone)
  const localWakeDate = utcToLocalDate(entry.wakeUtc, entry.ianaTimezone)

  // localBedDate is only available when bedTimeUtc is present.
  const localBedDate = entry.bedTimeUtc
    ? utcToLocalDate(entry.bedTimeUtc, entry.ianaTimezone)
    : undefined

  return {
    durationMs,
    sleepStartUtc: entry.sleepStartUtc,
    wakeUtc: entry.wakeUtc,
    localSleepStartDate,
    localWakeDate,
    localBedDate,
  }
}

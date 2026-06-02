/**
 * CircaLog — Circadian Engine Internal Utilities
 *
 * These helpers are used inside the engine functions only.
 * They are not part of the public API and must not be imported
 * outside of src/lib/circadian/.
 */

import type { SleepEntry } from './types'

/**
 * Converts a UTC ISO 8601 timestamp string to a local date string
 * (YYYY-MM-DD) in the given IANA timezone.
 *
 * Example:
 *   utcToLocalDate('2026-05-31T21:37:00.000Z', 'Africa/Cairo')
 *   // → '2026-06-01'  (because 21:37 UTC = 00:37 Cairo, which is June 1)
 *
 * Uses the Intl.DateTimeFormat API, which is available in all modern
 * browsers and in Node.js 12+. No external library required.
 *
 * @param utcString - ISO 8601 UTC string (e.g. "2026-05-31T21:37:00.000Z")
 * @param ianaTimezone - IANA timezone name (e.g. "Africa/Cairo")
 * @returns Local date as "YYYY-MM-DD"
 */
export function utcToLocalDate(utcString: string, ianaTimezone: string): string {
  // new Date() parses an ISO 8601 UTC string correctly in all environments.
  const date = new Date(utcString)

  // Intl.DateTimeFormat formats the instant in the given timezone.
  // 'en-CA' produces dates as YYYY-MM-DD, which is what we want.
  // Using a locale that naturally produces ISO 8601 date format avoids
  // manual string manipulation.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ianaTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/**
 * Filters out soft-deleted entries from an array.
 * All engine functions must call this before processing their input.
 *
 * @param entries - Array of SleepEntry (may contain deleted entries)
 * @returns A new array with isDeleted entries removed
 */
export function filterActive(entries: SleepEntry[]): SleepEntry[] {
  // Filter to a new array — never mutate the input array.
  return entries.filter(entry => !entry.isDeleted)
}

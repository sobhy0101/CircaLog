/**
 * groupEntriesByCycle
 *
 * Groups SleepEntry records by their cycleNumber into Cycle objects.
 * Used by the actogram and history view to render all sessions that
 * belong to the same night together.
 *
 * Most cycles contain one entry (a single main sleep). Some contain two
 * (a main sleep plus a nap logged in the same cycle). Fragmented nights
 * may produce three or more entries per cycle.
 *
 * The calendarDate of each Cycle is derived from the primary entry —
 * defined as the first main-sleep entry in the cycle. If a cycle
 * contains only naps (unusual but possible), the first nap is used.
 *
 * Soft-deleted entries are excluded. The returned array is sorted by
 * cycleNumber ascending.
 */

import type { SleepEntry, Cycle } from './types'
import { filterActive, utcToLocalDate } from './utils'

/**
 * Groups active sleep entries by cycle number into Cycle objects.
 *
 * @param entries - All SleepEntry records (may include deleted entries)
 * @returns Array of Cycle objects sorted by cycleNumber ascending
 */
export function groupEntriesByCycle(entries: SleepEntry[]): Cycle[] {
  const active = filterActive(entries)

  // Build a Map from cycleNumber → SleepEntry[].
  // Map preserves insertion order, which will be sorted below.
  const cycleMap = new Map<number, SleepEntry[]>()

  for (const entry of active) {
    const existing = cycleMap.get(entry.cycleNumber)
    if (existing) {
      existing.push(entry)
    } else {
      cycleMap.set(entry.cycleNumber, [entry])
    }
  }

  // Convert the map to an array of Cycle objects.
  const cycles: Cycle[] = []

  for (const [cycleNumber, cycleEntries] of cycleMap) {
    // Sort entries within the cycle by sleepStartUtc ascending.
    const sorted = [...cycleEntries].sort((a, b) =>
      a.sleepStartUtc.localeCompare(b.sleepStartUtc)
    )

    // Determine the primary entry for calendarDate derivation.
    // Prefer the first main-sleep entry; fall back to the first nap.
    const primary =
      sorted.find(e => e.sessionType === 'main') ?? sorted[0]

    // calendarDate uses bedTimeUtc if available (the correct "night anchor"),
    // otherwise falls back to sleepStartUtc (approximate but acceptable).
    const anchorUtc = primary.bedTimeUtc ?? primary.sleepStartUtc
    const calendarDate = utcToLocalDate(anchorUtc, primary.ianaTimezone)

    cycles.push({ cycleNumber, entries: sorted, calendarDate })
  }

  // Sort cycles by cycleNumber ascending.
  cycles.sort((a, b) => a.cycleNumber - b.cycleNumber)

  return cycles
}

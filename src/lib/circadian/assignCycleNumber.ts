/**
 * assignCycleNumber
 *
 * Recomputes cycle numbers for an entire array of SleepEntry records.
 * Cycle numbers are 1-based integers assigned in ascending sleepStartUtc
 * order. Soft-deleted entries are excluded from numbering and from the
 * returned array.
 *
 * This function is idempotent — running it twice on the same input
 * produces the same output. It is safe to call after every insert,
 * back-fill, delete, or start-time edit.
 *
 * Why this function reassigns all cycle numbers every time:
 *   Cycle numbers are a derived cache, not authoritative data. The sort
 *   order of sleepStartUtc is always the source of truth. After any
 *   change that affects sort order (back-fill, edit, delete), the entire
 *   sequence must be recomputed to remain gapless and correct.
 *   See docs/cycle-number-strategy.md for the full rationale.
 */

import type { SleepEntry } from './types'
import { filterActive } from './utils'

/**
 * Returns a new array of active (non-deleted) SleepEntry records with
 * cycle numbers reassigned in ascending sleepStartUtc order.
 *
 * The input array is never mutated. A new array with new entry objects
 * is returned (using object spread to avoid shared references).
 *
 * @param entries - All SleepEntry records (may be unsorted, may include deleted)
 * @returns New array sorted by sleepStartUtc ascending, cycleNumber 1-based,
 *          soft-deleted entries excluded
 */
export function assignCycleNumber(entries: SleepEntry[]): SleepEntry[] {
  // 1. Exclude soft-deleted entries — they do not participate in numbering.
  const active = filterActive(entries)

  // 2. Sort by sleepStartUtc ascending.
  //    String comparison works for ISO 8601 UTC strings because they are
  //    lexicographically ordered (earlier dates sort before later dates).
  const sorted = [...active].sort((a, b) =>
    a.sleepStartUtc.localeCompare(b.sleepStartUtc)
  )

  // 3. Assign 1-based cycle numbers in sort order.
  //    Spread each entry to avoid mutating the original objects.
  return sorted.map((entry, index) => ({
    ...entry,
    cycleNumber: index + 1,
  }))
}

/**
 * detectFragmentation
 *
 * Determines whether a set of entries belonging to the same cycle
 * represents a fragmented sleep night.
 *
 * A cycle is considered fragmented when it contains 2 or more separate
 * sleep sessions. This covers both the common case (a main sleep + one
 * nap in the same cycle) and extreme fragmentation (3+ short sessions
 * with no single session reaching the main-sleep threshold).
 *
 * Note: this function accepts entries for a SINGLE cycle — it does not
 * filter by cycle number. The caller (typically groupEntriesByCycle or
 * the Insights view) is responsible for passing only the entries that
 * belong to the cycle being evaluated.
 */

import type { SleepEntry } from './types'
import { filterActive } from './utils'

/**
 * The result of detectFragmentation for a single cycle.
 */
export interface FragmentationResult {
  /** True if the cycle contains 2 or more sleep sessions. */
  isFragmented: boolean;

  /** Number of active (non-deleted) sessions in this cycle. */
  sessionCount: number;
}

/**
 * Evaluates whether a cycle's entries represent fragmented sleep.
 *
 * @param cycleEntries - All SleepEntry records for a single cycle
 *                       (may include soft-deleted entries)
 * @returns FragmentationResult
 */
export function detectFragmentation(cycleEntries: SleepEntry[]): FragmentationResult {
  // Exclude soft-deleted entries before counting.
  const active = filterActive(cycleEntries)
  const sessionCount = active.length

  // A cycle is fragmented when it has more than one session.
  // A single session, however short, is not considered fragmented.
  const isFragmented = sessionCount >= 2

  return { isFragmented, sessionCount }
}

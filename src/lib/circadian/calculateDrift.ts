/**
 * calculateDrift
 *
 * Calculates the average circadian drift in minutes per cycle.
 *
 * "Drift" is the tendency of sleep onset to shift later (or earlier)
 * each cycle. For Non-24 patients, drift is typically positive and
 * consistent — each cycle starts 30–90 minutes later than the previous
 * one, rotating all the way around the clock over days or weeks.
 *
 * Method:
 *   1. Take only main-sleep sessions (naps are not onset anchors).
 *   2. Sort by sleepStartUtc ascending.
 *   3. Compute the difference in sleep onset time (in minutes) between
 *      each consecutive pair of main-sleep sessions.
 *   4. Average those differences.
 *
 * A positive result means sleep onset is drifting later each cycle.
 * A negative result means sleep onset is drifting earlier.
 *
 * Requires at least 2 active main-sleep entries to compute a meaningful
 * result. Returns { minutesPerCycle: 0, entryCount: 0 } for 0 or 1
 * entries rather than throwing — callers should check entryCount.
 */

import type { SleepEntry, DriftResult } from './types'
import { filterActive } from './utils'

/**
 * Returns the average drift in minutes per cycle across the given entries.
 *
 * @param entries - All SleepEntry records (may include naps and deleted entries)
 * @returns DriftResult with minutesPerCycle and entryCount
 */
export function calculateDrift(entries: SleepEntry[]): DriftResult {
  // Exclude deleted entries and naps — only main sleep onsets define drift.
  const mainSleeps = filterActive(entries)
    .filter(e => e.sessionType === 'main')
    .sort((a, b) => a.sleepStartUtc.localeCompare(b.sleepStartUtc))

  // Need at least 2 sessions to compute a difference.
  if (mainSleeps.length < 2) {
    return { minutesPerCycle: 0, entryCount: mainSleeps.length }
  }

  // Compute the difference in onset time between each consecutive pair.
  // Convert from milliseconds to minutes.
  const diffs: number[] = []
  for (let i = 1; i < mainSleeps.length; i++) {
    const prevOnset = new Date(mainSleeps[i - 1].sleepStartUtc).getTime()
    const currOnset = new Date(mainSleeps[i].sleepStartUtc).getTime()
    const diffMinutes = (currOnset - prevOnset) / (1000 * 60)
    diffs.push(diffMinutes)
  }

  // Average the differences.
  const total = diffs.reduce((sum, d) => sum + d, 0)
  const avgMinutesPerCycle = total / diffs.length

  return {
    minutesPerCycle: avgMinutesPerCycle,
    entryCount: mainSleeps.length,
  }
}

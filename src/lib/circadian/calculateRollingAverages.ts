/**
 * calculateRollingAverages
 *
 * Computes rolling average statistics over a sliding time window.
 *
 * "Rolling" means the window is anchored to the present: the window
 * covers the most recent N days, where N is windowDays. Only sessions
 * whose sleep start falls within the last N days are included.
 *
 * Typical uses:
 *   - 7-day rolling average: recent sleep quality trend
 *   - 30-day rolling average: monthly baseline
 *
 * Both naps and main sleeps are included in duration and quality
 * averages — the full picture of sleep in the window matters.
 * Soft-deleted entries are excluded.
 */

import type { SleepEntry, RollingAverages } from './types'
import { filterActive } from './utils'

/**
 * Computes rolling average sleep duration and quality over the given
 * window, measured backward from the most recent entry in the dataset
 * (not from the current wall-clock time, so results are stable and
 * testable against fixed fixtures).
 *
 * @param entries - All SleepEntry records
 * @param windowDays - Number of days to include (e.g. 7 or 30)
 * @returns RollingAverages — returns zeros with entryCount 0 if no
 *          entries fall within the window
 */
export function calculateRollingAverages(
  entries: SleepEntry[],
  windowDays: number
): RollingAverages {
  const active = filterActive(entries)

  if (active.length === 0) {
    return { windowDays, avgDurationMinutes: 0, avgQuality: 0, entryCount: 0 }
  }

  // Anchor the window to the most recent sleep start in the dataset.
  // Using the dataset's own most-recent timestamp (not Date.now()) makes
  // this function deterministic — it produces the same output for the
  // same input, which is essential for unit testing with fixed fixtures.
  const latestMs = Math.max(
    ...active.map(e => new Date(e.sleepStartUtc).getTime())
  )

  // The window starts windowDays before the latest entry.
  const windowStartMs = latestMs - windowDays * 24 * 60 * 60 * 1000

  // Include only entries whose sleep start falls within the window.
  const inWindow = active.filter(
    e => new Date(e.sleepStartUtc).getTime() >= windowStartMs
  )

  if (inWindow.length === 0) {
    return { windowDays, avgDurationMinutes: 0, avgQuality: 0, entryCount: 0 }
  }

  // Calculate average duration in minutes.
  const totalDurationMs = inWindow.reduce((sum, e) => {
    const durationMs =
      new Date(e.wakeUtc).getTime() - new Date(e.sleepStartUtc).getTime()
    return sum + durationMs
  }, 0)
  const avgDurationMinutes = totalDurationMs / inWindow.length / (1000 * 60)

  // Calculate average quality rating.
  const totalQuality = inWindow.reduce((sum, e) => sum + e.quality, 0)
  const avgQuality = totalQuality / inWindow.length

  return {
    windowDays,
    avgDurationMinutes,
    avgQuality,
    entryCount: inWindow.length,
  }
}

/**
 * estimateFreeRunningPeriod
 *
 * Estimates the free-running period (tau) of the patient's circadian
 * rhythm using linear regression on sleep onset times.
 *
 * The free-running period is how long a single circadian cycle actually
 * takes. For most Non-24 patients it is slightly longer than 24 hours
 * (e.g. 24.8 hours), causing sleep onset to drift progressively later
 * each day.
 *
 * Method:
 *   - X values: cycle numbers (1, 2, 3, ...) of main-sleep sessions
 *   - Y values: sleep onset times expressed as hours elapsed since the
 *     first session (e.g. if session 1 started at T0, session 2 at
 *     T0+25.2h, session 3 at T0+50.7h, ...)
 *   - Linear regression finds the best-fit line through these points
 *   - The slope of that line is the estimated period in hours per cycle
 *
 * Returns 'pending' when fewer than 14 main-sleep entries are available.
 * 14 is the minimum for a statistically meaningful regression — fewer
 * entries produce unreliable estimates. The display layer shows
 * "Pending — log X more days to unlock" until the threshold is met.
 */

import type { SleepEntry, FreeRunningPeriodResult } from './types'
import { filterActive } from './utils'

/** Minimum number of main-sleep entries required for a valid estimate. */
const MIN_ENTRIES = 14

/**
 * Estimates the free-running period from a set of sleep entries.
 *
 * @param entries - All SleepEntry records
 * @returns FreeRunningPeriodResult — either 'pending' or 'calculated'
 */
export function estimateFreeRunningPeriod(entries: SleepEntry[]): FreeRunningPeriodResult {
  const mainSleeps = filterActive(entries)
    .filter(e => e.sessionType === 'main')
    .sort((a, b) => a.sleepStartUtc.localeCompare(b.sleepStartUtc))

  if (mainSleeps.length < MIN_ENTRIES) {
    const remaining = MIN_ENTRIES - mainSleeps.length
    return {
      status: 'pending',
      reason: `${remaining} more main sleep session${remaining === 1 ? '' : 's'} needed (minimum ${MIN_ENTRIES})`,
    }
  }

  // Build X (cycle index, 0-based) and Y (hours since first onset) arrays.
  const firstOnsetMs = new Date(mainSleeps[0].sleepStartUtc).getTime()

  const xs: number[] = []
  const ys: number[] = []

  for (let i = 0; i < mainSleeps.length; i++) {
    const onsetMs = new Date(mainSleeps[i].sleepStartUtc).getTime()
    xs.push(i) // 0-based index as the X value
    ys.push((onsetMs - firstOnsetMs) / (1000 * 60 * 60)) // hours since first onset
  }

  // Simple linear regression: find slope m and intercept b in Y = mX + b.
  // Slope m is the estimated period in hours per cycle.
  const n = xs.length
  const sumX = xs.reduce((s, x) => s + x, 0)
  const sumY = ys.reduce((s, y) => s + y, 0)
  const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0)
  const sumX2 = xs.reduce((s, x) => s + x * x, 0)

  // Denominator of the slope formula. Cannot be zero when n >= 2 and
  // xs are distinct integers, so no division-by-zero risk here.
  const denominator = n * sumX2 - sumX * sumX
  const slope = (n * sumXY - sumX * sumY) / denominator

  return {
    status: 'calculated',
    periodHours: slope,
    entryCount: mainSleeps.length,
  }
}

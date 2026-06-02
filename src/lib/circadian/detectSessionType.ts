/**
 * detectSessionType
 *
 * Classifies a sleep session as 'main' sleep or a 'nap' based on its
 * duration. The threshold is 3 hours (180 minutes / 10,800,000 ms).
 *
 * Sessions of exactly 3 hours are classified as 'main' — the threshold
 * is inclusive on the main-sleep side.
 *
 * The gapMs parameter is reserved for future use. In V1 it is accepted
 * but not used in the classification logic. A future version may use
 * the gap between sessions to refine nap detection (e.g. a short sleep
 * after a very long awake period may still be a "main" sleep event).
 */

import type { SessionType } from './types'

/** Minimum duration in milliseconds to classify a session as main sleep. */
const MAIN_SLEEP_THRESHOLD_MS = 3 * 60 * 60 * 1000 // 3 hours in ms

/**
 * Returns the session type for a sleep session of the given duration.
 *
 * @param durationMs - Duration of the session in milliseconds (must be > 0)
 * @param gapMs - Time awake before this session in ms (reserved, not used in V1)
 * @returns 'main' if durationMs >= 3 hours, 'nap' otherwise
 */
export function detectSessionType(durationMs: number, gapMs: number): SessionType {
  // gapMs is accepted to keep the signature stable for V2 — suppress the
  // unused-variable warning by referencing it in a no-op way.
  void gapMs

  // Sessions lasting 3 hours or more are main sleep.
  // Sessions under 3 hours are naps.
  // The >= operator means exactly 3 hours is 'main', not 'nap'.
  return durationMs >= MAIN_SLEEP_THRESHOLD_MS ? 'main' : 'nap'
}

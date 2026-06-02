/**
 * CircaLog — Circadian Engine Public API
 *
 * Import all engine functions and types from this file.
 * Do not import directly from individual function files.
 *
 * Example:
 *   import { normalizeSleepSpan, assignCycleNumber } from '@/lib/circadian'
 */

export { normalizeSleepSpan } from './normalizeSleepSpan'
export { detectSessionType } from './detectSessionType'
export { assignCycleNumber } from './assignCycleNumber'
export { calculateDrift } from './calculateDrift'
export { estimateFreeRunningPeriod } from './estimateFreeRunningPeriod'
export { groupEntriesByCycle } from './groupEntriesByCycle'
export { detectFragmentation } from './detectFragmentation'
export { calculateRollingAverages } from './calculateRollingAverages'

// Re-export all types so consumers can import both functions and types
// from the same path.
export type {
  SleepEntry,
  Cycle,
  SessionType,
  QualityRating,
  InterruptionType,
  MedicationTiming,
  Interruption,
  Medication,
  FreeRunningPeriodResult,
  DriftResult,
  RollingAverages,
  NormalizedSleepSpan,
} from './types'

export type { FragmentationResult } from './detectFragmentation'

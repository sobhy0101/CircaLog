/**
 * CircaLog — Circadian Engine Test Suite
 *
 * Tests all eight engine functions against:
 *   - realSleepEntries / realSleepEntriesUnsorted (Mahmoud's actual data)
 *   - Each edge-case fixture group (DST, timezone switch, fragmentation, etc.)
 *
 * Every test is independent — no shared mutable state between tests.
 * Fixtures are imported as constants; individual test cases spread them
 * into new objects when mutation is needed.
 *
 * Import style: explicit { describe, it, expect } from 'vitest'.
 * Globals are disabled in vite.config.ts.
 */

import { describe, it, expect } from 'vitest'

import {
  normalizeSleepSpan,
  detectSessionType,
  assignCycleNumber,
  calculateDrift,
  estimateFreeRunningPeriod,
  groupEntriesByCycle,
  detectFragmentation,
  calculateRollingAverages,
} from '@/lib/circadian'

import {
  realSleepEntries,
  realSleepEntriesUnsorted,
} from '@/lib/circadian/__fixtures__/realData'

import {
  dstSpringForward,
  dstFallBack,
  timezoneSwitch,
  longAwakePeriod,
  fragmentedNight,
  napBoundary,
  backfillOriginal,
  backfillNewEntry,
  backfillExpected,
  softDeletedEntries,
} from '@/lib/circadian/__fixtures__/edgeCases'

// ---------------------------------------------------------------------------
// normalizeSleepSpan
// ---------------------------------------------------------------------------

describe('normalizeSleepSpan', () => {
  it('computes correct duration for a simple same-day session', () => {
    // Cycle 1: 6 hours exactly (01:00 UTC → 07:00 UTC)
    const result = normalizeSleepSpan(realSleepEntries[0])
    expect(result.durationMs).toBe(6 * 60 * 60 * 1000)
  })

  it('computes correct duration for a midnight-crossover session (Cycle 4)', () => {
    // Cycle 4: sleep 21:37 UTC May 31, wake 02:40 UTC Jun 1 = 5h 3m
    const expected = (5 * 60 + 3) * 60 * 1000
    const result = normalizeSleepSpan(realSleepEntries[3])
    expect(result.durationMs).toBe(expected)
  })

  it('derives correct localSleepStartDate for Cairo timezone', () => {
    // Cycle 4 sleep start: 2026-05-31T21:37Z = 00:37 June 1 Cairo local
    const result = normalizeSleepSpan(realSleepEntries[3])
    expect(result.localSleepStartDate).toBe('2026-06-01')
  })

  it('derives correct localWakeDate for Cairo timezone', () => {
    // Cycle 4 wake: 2026-06-01T02:40Z = 05:40 June 1 Cairo local
    const result = normalizeSleepSpan(realSleepEntries[3])
    expect(result.localWakeDate).toBe('2026-06-01')
  })

  it('derives correct localBedDate for Cycle 4 (the night-anchor test)', () => {
    // Cycle 4 bed: 2026-05-31T20:10Z = 23:10 May 31 Cairo local
    // This is the key test: the night belongs to May 31, not June 1
    const result = normalizeSleepSpan(realSleepEntries[3])
    expect(result.localBedDate).toBe('2026-05-31')
  })

  it('returns undefined localBedDate when bedTimeUtc is absent', () => {
    // Create an entry without bedTimeUtc
    const entryNoBed = { ...realSleepEntries[0], bedTimeUtc: undefined }
    const result = normalizeSleepSpan(entryNoBed)
    expect(result.localBedDate).toBeUndefined()
  })

  it('computes correct UTC duration across DST spring-forward (not wall-clock)', () => {
    // UTC duration: 21:30 → 01:00 = 3h 30m (NOT the 4h 30m wall-clock duration)
    const expected = (3 * 60 + 30) * 60 * 1000
    const result = normalizeSleepSpan(dstSpringForward[0])
    expect(result.durationMs).toBe(expected)
  })

  it('computes correct UTC duration across DST fall-back (not wall-clock)', () => {
    // UTC duration: 22:00 → 02:00 = 4h (NOT the 3h wall-clock duration)
    const expected = 4 * 60 * 60 * 1000
    const result = normalizeSleepSpan(dstFallBack[0])
    expect(result.durationMs).toBe(expected)
  })

  it('throws when wakeUtc is not after sleepStartUtc', () => {
    const badEntry = {
      ...realSleepEntries[0],
      wakeUtc: realSleepEntries[0].sleepStartUtc, // same time = zero duration
    }
    expect(() => normalizeSleepSpan(badEntry)).toThrow()
  })
})

// ---------------------------------------------------------------------------
// detectSessionType
// ---------------------------------------------------------------------------

describe('detectSessionType', () => {
  it('returns "nap" for 179 minutes (one minute under threshold)', () => {
    const durationMs = 179 * 60 * 1000
    expect(detectSessionType(durationMs, 0)).toBe('nap')
  })

  it('returns "main" for exactly 180 minutes (threshold is inclusive)', () => {
    const durationMs = 180 * 60 * 1000
    expect(detectSessionType(durationMs, 0)).toBe('main')
  })

  it('returns "main" for 181 minutes (one minute over threshold)', () => {
    const durationMs = 181 * 60 * 1000
    expect(detectSessionType(durationMs, 0)).toBe('main')
  })

  it('matches sessionType already set on the napBoundary fixture entries', () => {
    // Verify the fixture and function agree on all three boundary cases
    for (const entry of napBoundary) {
      const span = normalizeSleepSpan(entry)
      const detected = detectSessionType(span.durationMs, 0)
      expect(detected).toBe(entry.sessionType)
    }
  })
})

// ---------------------------------------------------------------------------
// assignCycleNumber
// ---------------------------------------------------------------------------

describe('assignCycleNumber', () => {
  it('returns entries sorted by sleepStartUtc ascending', () => {
    const result = assignCycleNumber(realSleepEntriesUnsorted)
    for (let i = 1; i < result.length; i++) {
      expect(result[i].sleepStartUtc > result[i - 1].sleepStartUtc).toBe(true)
    }
  })

  it('assigns 1-based cycle numbers in sort order', () => {
    const result = assignCycleNumber(realSleepEntriesUnsorted)
    result.forEach((entry, index) => {
      expect(entry.cycleNumber).toBe(index + 1)
    })
  })

  it('is idempotent — running twice produces the same result', () => {
    const once = assignCycleNumber(realSleepEntries)
    const twice = assignCycleNumber(once)
    expect(twice).toEqual(once)
  })

  it('excludes soft-deleted entries from the result', () => {
    const result = assignCycleNumber(softDeletedEntries)
    expect(result).toHaveLength(2)
    expect(result.every(e => !e.isDeleted)).toBe(true)
  })

  it('assigns gapless cycle numbers after a soft-delete (no gap at position 2)', () => {
    const result = assignCycleNumber(softDeletedEntries)
    expect(result[0].cycleNumber).toBe(1)
    expect(result[1].cycleNumber).toBe(2) // must be 2, not 3
  })

  it('correctly renumbers after back-fill insertion', () => {
    const input = [...backfillOriginal, backfillNewEntry]
    const result = assignCycleNumber(input)
    // Compare only id and cycleNumber — updatedAt may differ
    const simplified = result.map(e => ({ id: e.id, cycleNumber: e.cycleNumber }))
    const expected = backfillExpected.map(e => ({ id: e.id, cycleNumber: e.cycleNumber }))
    expect(simplified).toEqual(expected)
  })

  it('handles unsorted input (back-fill scenario)', () => {
    const shuffled = [backfillOriginal[2], backfillNewEntry, backfillOriginal[0], backfillOriginal[1]]
    const result = assignCycleNumber(shuffled)
    expect(result[0].id).toBe('backfill-entry-1')
    expect(result[1].id).toBe('backfill-entry-2')
    expect(result[2].id).toBe('backfill-entry-3')
    expect(result[3].id).toBe('backfill-entry-4')
  })
})

// ---------------------------------------------------------------------------
// calculateDrift
// ---------------------------------------------------------------------------

describe('calculateDrift', () => {
  it('returns a positive drift for the real dataset (Non-24 signature)', () => {
    // Real data shows progressive delay — drift must be positive
    const result = calculateDrift(realSleepEntries)
    expect(result.minutesPerCycle).toBeGreaterThan(0)
  })

  it('uses all 5 main-sleep entries from the real dataset', () => {
    const result = calculateDrift(realSleepEntries)
    expect(result.entryCount).toBe(5)
  })

  it('returns entryCount 0 for an empty array', () => {
    const result = calculateDrift([])
    expect(result.entryCount).toBe(0)
    expect(result.minutesPerCycle).toBe(0)
  })

  it('excludes soft-deleted entries from drift calculation', () => {
    // softDeletedEntries has 3 entries, 1 deleted → 2 active
    const result = calculateDrift(softDeletedEntries)
    expect(result.entryCount).toBe(2)
  })

  it('does not produce NaN or Infinity for a very long awake period', () => {
    const result = calculateDrift(longAwakePeriod)
    expect(Number.isFinite(result.minutesPerCycle)).toBe(true)
    expect(Number.isNaN(result.minutesPerCycle)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// estimateFreeRunningPeriod
// ---------------------------------------------------------------------------

describe('estimateFreeRunningPeriod', () => {
  it('returns pending when fewer than 14 entries are available', () => {
    // Real dataset has only 5 entries — must return pending
    const result = estimateFreeRunningPeriod(realSleepEntries)
    expect(result.status).toBe('pending')
  })

  it('pending reason mentions how many more sessions are needed', () => {
    const result = estimateFreeRunningPeriod(realSleepEntries)
    if (result.status === 'pending') {
      expect(result.reason).toMatch(/9 more/)
    }
  })

  it('returns calculated when 14+ entries are provided', () => {
    // Generate 14 synthetic entries with a known 25-hour period
    const base = new Date('2026-01-01T00:00:00.000Z').getTime()
    const periodMs = 25 * 60 * 60 * 1000 // 25 hours
    const synthetic = Array.from({ length: 14 }, (_, i) => ({
      ...realSleepEntries[0],
      id: `synth-${i}`,
      sleepStartUtc: new Date(base + i * periodMs).toISOString(),
      wakeUtc: new Date(base + i * periodMs + 7 * 60 * 60 * 1000).toISOString(),
      cycleNumber: i + 1,
    }))
    const result = estimateFreeRunningPeriod(synthetic)
    expect(result.status).toBe('calculated')
    if (result.status === 'calculated') {
      // The estimated period should be very close to 25 hours
      expect(result.periodHours).toBeCloseTo(25, 1)
      expect(result.entryCount).toBe(14)
    }
  })
})

// ---------------------------------------------------------------------------
// groupEntriesByCycle
// ---------------------------------------------------------------------------

describe('groupEntriesByCycle', () => {
  it('returns one Cycle per unique cycleNumber in the real dataset', () => {
    const cycles = groupEntriesByCycle(realSleepEntries)
    expect(cycles).toHaveLength(5)
  })

  it('sorts cycles by cycleNumber ascending', () => {
    const cycles = groupEntriesByCycle(realSleepEntries)
    for (let i = 1; i < cycles.length; i++) {
      expect(cycles[i].cycleNumber).toBeGreaterThan(cycles[i - 1].cycleNumber)
    }
  })

  it('groups all three fragmented-night sessions under cycleNumber 1', () => {
    const cycles = groupEntriesByCycle(fragmentedNight)
    expect(cycles).toHaveLength(1)
    expect(cycles[0].cycleNumber).toBe(1)
    expect(cycles[0].entries).toHaveLength(3)
  })

  it('excludes soft-deleted entries and does not create a cycle for them', () => {
    const cycles = groupEntriesByCycle(softDeletedEntries)
    expect(cycles).toHaveLength(2)
    cycles.forEach(c => {
      c.entries.forEach(e => expect(e.isDeleted).toBe(false))
    })
  })

  it('uses bedTimeUtc as the night anchor for calendarDate when available', () => {
    // Cycle 4 in real data: bedTimeUtc is 2026-05-31T20:10Z = 23:10 May 31 Cairo
    // calendarDate should be '2026-05-31', not '2026-06-01'
    const cycles = groupEntriesByCycle(realSleepEntries)
    const cycle4 = cycles.find(c => c.cycleNumber === 4)
    expect(cycle4?.calendarDate).toBe('2026-05-31')
  })

  it('handles timezone-switch dataset — one cycle per entry', () => {
    const cycles = groupEntriesByCycle(timezoneSwitch)
    expect(cycles).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// detectFragmentation
// ---------------------------------------------------------------------------

describe('detectFragmentation', () => {
  it('returns isFragmented: true for three sessions in the same cycle', () => {
    const result = detectFragmentation(fragmentedNight)
    expect(result.isFragmented).toBe(true)
    expect(result.sessionCount).toBe(3)
  })

  it('returns isFragmented: false for a single-session cycle', () => {
    const result = detectFragmentation([realSleepEntries[0]])
    expect(result.isFragmented).toBe(false)
    expect(result.sessionCount).toBe(1)
  })

  it('excludes soft-deleted entries from sessionCount', () => {
    // Pass all softDeletedEntries as if they were one cycle (they are not,
    // but detectFragmentation only counts active entries)
    const result = detectFragmentation(softDeletedEntries)
    expect(result.sessionCount).toBe(2) // 3 entries, 1 deleted
    expect(result.isFragmented).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// calculateRollingAverages
// ---------------------------------------------------------------------------

describe('calculateRollingAverages', () => {
  it('returns entryCount 0 for an empty array', () => {
    const result = calculateRollingAverages([], 7)
    expect(result.entryCount).toBe(0)
    expect(result.avgDurationMinutes).toBe(0)
    expect(result.avgQuality).toBe(0)
  })

  it('includes all 5 real entries in a 7-day window (all within 7 days)', () => {
    // All real entries span ~4 days (May 29 – Jun 2) — all fit in a 7-day window
    const result = calculateRollingAverages(realSleepEntries, 7)
    expect(result.entryCount).toBe(5)
    expect(result.windowDays).toBe(7)
  })

  it('returns a positive avgDurationMinutes for the real dataset', () => {
    const result = calculateRollingAverages(realSleepEntries, 7)
    expect(result.avgDurationMinutes).toBeGreaterThan(0)
  })

  it('returns avgQuality within the valid range (1–5)', () => {
    const result = calculateRollingAverages(realSleepEntries, 7)
    expect(result.avgQuality).toBeGreaterThanOrEqual(1)
    expect(result.avgQuality).toBeLessThanOrEqual(5)
  })

  it('excludes soft-deleted entries', () => {
    const result = calculateRollingAverages(softDeletedEntries, 30)
    expect(result.entryCount).toBe(2) // 3 entries, 1 deleted
  })

  it('respects windowDays — excludes entries outside the window', () => {
    // longAwakePeriod spans Jan 10–13 (3 days). A 1-day window anchored
    // to the latest entry (Jan 12) should include only the Jan 12 entry.
    const result = calculateRollingAverages(longAwakePeriod, 1)
    expect(result.entryCount).toBe(1)
  })
})

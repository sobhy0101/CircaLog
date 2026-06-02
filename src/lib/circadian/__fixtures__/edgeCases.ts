/**
 * Synthetic edge-case fixture — CircaLog Circadian Engine tests
 *
 * These entries do not represent real recorded sessions. They are
 * constructed to cover scenarios the real-data fixture cannot supply:
 * DST transitions, timezone switches, very long awake periods,
 * fragmented nights, nap detection at the 3h boundary, back-fill
 * insertion, and soft-deleted entries.
 *
 * Each export is independent. Tests import only the groups they need.
 * All UTC timestamps are manually verified. Local-time comments are
 * included for human readability only — local time is never stored.
 */

import type { SleepEntry } from '../types'

// ---------------------------------------------------------------------------
// Internal helper — not exported
// ---------------------------------------------------------------------------

/**
 * Returns a minimal valid SleepEntry with the given overrides applied.
 * Fields not provided use safe neutral defaults.
 * This helper exists only in this fixture file — never use it in
 * production code.
 */
function makeEntry(
  overrides: Partial<SleepEntry> &
    Pick<SleepEntry, 'id' | 'sleepStartUtc' | 'wakeUtc' | 'cycleNumber'>
): SleepEntry {
  return {
    ianaTimezone: 'Africa/Cairo',
    sessionType: 'main',
    quality: 3,
    isDeleted: false,
    createdAt: overrides.sleepStartUtc,
    updatedAt: overrides.sleepStartUtc,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Edge case: DST transition — Egypt spring-forward (April 2026)
// ---------------------------------------------------------------------------
//
// Egypt enters DST on the last Friday of April. In 2026 that is
// 24 April. Clocks spring forward from 02:00 to 03:00 local time;
// UTC offset shifts from +2 (EET) to +3 (EEST).
//
// This session straddles the transition: sleep start is in EET (UTC+2),
// wake time is in EEST (UTC+3). The ianaTimezone is 'Africa/Cairo' for
// both — the Intl API resolves the correct offset per timestamp.
//
// What this tests:
//   normalizeSleepSpan() must compute duration from UTC timestamps only.
//   The wall-clock duration (23:30 → 04:00 = 4h 30m apparent) differs
//   from the true UTC duration (21:30 → 01:00 = 3h 30m) because one
//   hour of local time was skipped at 02:00.
// ---------------------------------------------------------------------------

export const dstSpringForward: SleepEntry[] = [
  makeEntry({
    id: 'dst-spring-forward-1',
    bedTimeUtc: '2026-04-23T21:00:00.000Z',
    // Sleep start: 23 Apr 2026 23:30 Cairo (EET = UTC+2) → 21:30 UTC
    sleepStartUtc: '2026-04-23T21:30:00.000Z',
    // Wake: 24 Apr 2026 04:00 Cairo (EEST = UTC+3) → 01:00 UTC
    // True UTC duration: 3h 30m. Wall-clock appears 4h 30m (skipped hour).
    wakeUtc: '2026-04-24T01:00:00.000Z',
    cycleNumber: 1,
    sessionType: 'main', // 3h 30m UTC — just above the nap/main threshold
    notes: 'Straddles Egypt DST spring-forward, April 2026',
  }),
]

// ---------------------------------------------------------------------------
// Edge case: DST transition — Egypt fall-back (October 2026)
// ---------------------------------------------------------------------------
//
// Egypt exits DST on the last Thursday of October. In 2026 that is
// 29 October. Clocks fall back from 03:00 to 02:00 local time;
// UTC offset shifts from +3 (EEST) back to +2 (EET).
//
// What this tests:
//   normalizeSleepSpan() must not double-count the repeated hour.
//   Wall-clock duration (01:00 → 04:00 = 3h apparent) differs from
//   the true UTC duration (22:00 → 02:00 = 4h) because one hour of
//   local time was repeated at 03:00 → 02:00.
// ---------------------------------------------------------------------------

export const dstFallBack: SleepEntry[] = [
  makeEntry({
    id: 'dst-fall-back-1',
    bedTimeUtc: '2026-10-28T21:30:00.000Z',
    // Sleep start: 29 Oct 2026 01:00 Cairo (EEST = UTC+3) → 22:00 UTC 28 Oct
    sleepStartUtc: '2026-10-28T22:00:00.000Z',
    // Wake: 29 Oct 2026 04:00 Cairo (EET = UTC+2, after fall-back) → 02:00 UTC 29 Oct
    // True UTC duration: 4h. Wall-clock appears 3h (repeated hour).
    wakeUtc: '2026-10-29T02:00:00.000Z',
    cycleNumber: 1,
    sessionType: 'main', // 4h 0m UTC
    notes: 'Straddles Egypt DST fall-back, October 2026',
  }),
]

// ---------------------------------------------------------------------------
// Edge case: Timezone switch mid-dataset
// ---------------------------------------------------------------------------
//
// Mahmoud lived in the Philippines (Asia/Manila, UTC+8) before returning
// to Egypt (Africa/Cairo, UTC+2 winter / UTC+3 summer). Future users
// may also travel. This group simulates a two-entry dataset where the
// first entry was recorded in Manila and the second in Cairo.
//
// What this tests:
//   - assignCycleNumber() sorts by sleepStartUtc regardless of ianaTimezone.
//   - groupEntriesByCycle() groups by cycleNumber regardless of ianaTimezone.
//   - Actogram rendering must use each entry's own ianaTimezone for its
//     Y-axis position, not a single global timezone for the whole chart.
// ---------------------------------------------------------------------------

export const timezoneSwitch: SleepEntry[] = [
  makeEntry({
    id: 'tz-switch-manila',
    // Manila local: 15 Mar 2025 22:00 (UTC+8) → 14:00 UTC
    sleepStartUtc: '2025-03-15T14:00:00.000Z',
    // Manila local: 16 Mar 2025 06:30 (UTC+8) → 22:30 UTC
    wakeUtc: '2025-03-15T22:30:00.000Z',
    ianaTimezone: 'Asia/Manila',
    cycleNumber: 1,
    sessionType: 'main', // 8h 30m
    notes: 'Last night in the Philippines',
  }),
  makeEntry({
    id: 'tz-switch-cairo',
    // Cairo local: 17 Mar 2025 01:00 (EET = UTC+2) → 23:00 UTC 16 Mar
    sleepStartUtc: '2025-03-16T23:00:00.000Z',
    // Cairo local: 17 Mar 2025 09:00 (EET = UTC+2) → 07:00 UTC 17 Mar
    wakeUtc: '2025-03-17T07:00:00.000Z',
    ianaTimezone: 'Africa/Cairo',
    cycleNumber: 2,
    sessionType: 'main', // 8h 0m
    notes: 'First night in Cairo',
  }),
]

// ---------------------------------------------------------------------------
// Edge case: Very long awake period between sessions
// ---------------------------------------------------------------------------
//
// Non-24 / severe circadian disruption can produce awake periods of
// 36–72+ hours. This tests that no engine function assumes a maximum
// gap between sleep sessions.
//
// What this tests:
//   - assignCycleNumber() assigns cycles by sort order only — it must
//     not infer additional cycles from the size of the gap.
//   - calculateDrift() must handle large inter-session gaps without
//     producing NaN or Infinity.
//   - groupEntriesByCycle() must not create phantom cycles for gaps.
// ---------------------------------------------------------------------------

export const longAwakePeriod: SleepEntry[] = [
  makeEntry({
    id: 'long-awake-before',
    sleepStartUtc: '2026-01-10T20:00:00.000Z', // Jan 10, 20:00 UTC
    wakeUtc: '2026-01-11T04:00:00.000Z',        // Jan 11, 04:00 UTC — 8h sleep
    cycleNumber: 1,
    sessionType: 'main',
  }),
  makeEntry({
    id: 'long-awake-after',
    // 40 hours after previous wake time — extreme but documented in source data
    sleepStartUtc: '2026-01-12T20:00:00.000Z', // Jan 12, 20:00 UTC
    wakeUtc: '2026-01-13T03:00:00.000Z',        // Jan 13, 03:00 UTC — 7h sleep
    cycleNumber: 2,
    sessionType: 'main',
  }),
]

// ---------------------------------------------------------------------------
// Edge case: Fragmented night (multiple short sessions, same cycle)
// ---------------------------------------------------------------------------
//
// Some nights consist of 2–3 short interrupted bouts rather than one
// continuous block. All sessions within the same awake→sleep→awake
// sequence share a cycle number.
//
// What this tests:
//   - groupEntriesByCycle() must group all three entries under cycleNumber 1.
//   - detectFragmentation() must flag this cycle as fragmented.
//   - The actogram must render three separate bars at the same X position.
// ---------------------------------------------------------------------------

export const fragmentedNight: SleepEntry[] = [
  makeEntry({
    id: 'frag-session-1',
    sleepStartUtc: '2026-02-05T20:00:00.000Z', // 23:00 Cairo local
    wakeUtc: '2026-02-05T21:30:00.000Z',        // 00:30 Cairo — 1h 30m
    cycleNumber: 1,
    sessionType: 'nap', // 1h 30m — under the 3h threshold
    notes: 'First fragment',
  }),
  makeEntry({
    id: 'frag-session-2',
    sleepStartUtc: '2026-02-05T22:30:00.000Z', // 01:30 Cairo local
    wakeUtc: '2026-02-06T00:00:00.000Z',        // 03:00 Cairo — 1h 30m
    cycleNumber: 1,
    sessionType: 'nap', // 1h 30m — under the 3h threshold
    notes: 'Second fragment',
  }),
  makeEntry({
    id: 'frag-session-3',
    sleepStartUtc: '2026-02-06T01:30:00.000Z', // 04:30 Cairo local
    wakeUtc: '2026-02-06T04:00:00.000Z',        // 07:00 Cairo — 2h 30m
    cycleNumber: 1,
    sessionType: 'nap', // 2h 30m — still under the 3h threshold
    notes: 'Third fragment',
  }),
]

// ---------------------------------------------------------------------------
// Edge case: Nap detection boundary (the 3-hour threshold)
// ---------------------------------------------------------------------------
//
// detectSessionType() returns 'nap' for sessions under 3 hours and
// 'main' for sessions 3 hours or longer. These entries test the exact
// boundary at 2h 59m, exactly 3h 0m, and 3h 1m.
//
// What this tests:
//   - 179 minutes  → must return 'nap'
//   - 180 minutes  → must return 'main' (threshold is inclusive)
//   - 181 minutes  → must return 'main'
//   The off-by-one at an inclusive boundary is the most common bug
//   in threshold classification logic.
// ---------------------------------------------------------------------------

export const napBoundary: SleepEntry[] = [
  makeEntry({
    id: 'nap-boundary-under',
    sleepStartUtc: '2026-03-01T10:00:00.000Z',
    wakeUtc: '2026-03-01T12:59:00.000Z', // 2h 59m (179 min) — must be 'nap'
    cycleNumber: 1,
    sessionType: 'nap',
    notes: '179 min — one minute under the main-sleep threshold',
  }),
  makeEntry({
    id: 'nap-boundary-exact',
    sleepStartUtc: '2026-03-02T10:00:00.000Z',
    wakeUtc: '2026-03-02T13:00:00.000Z', // exactly 3h 0m (180 min) — must be 'main'
    cycleNumber: 2,
    sessionType: 'main',
    notes: '180 min exactly — must be classified as main sleep, not nap',
  }),
  makeEntry({
    id: 'nap-boundary-over',
    sleepStartUtc: '2026-03-03T10:00:00.000Z',
    wakeUtc: '2026-03-03T13:01:00.000Z', // 3h 1m (181 min) — must be 'main'
    cycleNumber: 3,
    sessionType: 'main',
    notes: '181 min — one minute over the threshold',
  }),
]

// ---------------------------------------------------------------------------
// Edge case: Back-fill insertion
// ---------------------------------------------------------------------------
//
// A user logs entries in real time for several days, then goes back and
// inserts a historical entry that falls between existing entries. This
// tests that assignCycleNumber() renumbers correctly after insertion.
//
// Setup: entries 1, 3, and 4 exist. Entry 2 is back-filled afterward.
// After assignCycleNumber() runs, the sequence must be 1, 2, 3, 4
// sorted by sleepStartUtc, regardless of insertion order.
//
// What this tests:
//   - assignCycleNumber() renumbers the full dataset after back-fill.
//   - The back-filled entry slots into position 2.
//   - Previously-numbered entries at positions 2+ shift forward by one.
//   - The returned array is sorted ascending by sleepStartUtc.
// ---------------------------------------------------------------------------

/** Entries 1, 3, and 4 — logged in real time before back-fill. */
export const backfillOriginal: SleepEntry[] = [
  makeEntry({
    id: 'backfill-entry-1',
    sleepStartUtc: '2026-04-01T22:00:00.000Z',
    wakeUtc: '2026-04-02T06:00:00.000Z',
    cycleNumber: 1,
    sessionType: 'main',
  }),
  makeEntry({
    id: 'backfill-entry-3',
    sleepStartUtc: '2026-04-03T22:00:00.000Z',
    wakeUtc: '2026-04-04T06:00:00.000Z',
    cycleNumber: 2, // was 2 before back-fill; must become 3 after
    sessionType: 'main',
  }),
  makeEntry({
    id: 'backfill-entry-4',
    sleepStartUtc: '2026-04-04T22:00:00.000Z',
    wakeUtc: '2026-04-05T06:00:00.000Z',
    cycleNumber: 3, // was 3 before back-fill; must become 4 after
    sessionType: 'main',
  }),
]

/** The missing entry, back-filled after the fact. */
export const backfillNewEntry: SleepEntry = makeEntry({
  id: 'backfill-entry-2',
  sleepStartUtc: '2026-04-02T22:00:00.000Z', // falls between entry-1 and entry-3
  wakeUtc: '2026-04-03T06:00:00.000Z',
  cycleNumber: 0, // not yet assigned — assignCycleNumber() must correct this
  sessionType: 'main',
})

/**
 * Expected output after assignCycleNumber() runs on
 * [...backfillOriginal, backfillNewEntry] passed in any order.
 * Must be sorted by sleepStartUtc ascending with cycle numbers 1–4.
 */
export const backfillExpected: SleepEntry[] = [
  { ...backfillOriginal[0], cycleNumber: 1 }, // entry-1 stays at 1
  { ...backfillNewEntry,    cycleNumber: 2 }, // back-filled entry gets 2
  { ...backfillOriginal[1], cycleNumber: 3 }, // entry-3: was 2, now 3
  { ...backfillOriginal[2], cycleNumber: 4 }, // entry-4: was 3, now 4
]

// ---------------------------------------------------------------------------
// Edge case: Soft-deleted entries
// ---------------------------------------------------------------------------
//
// Entries with isDeleted: true must be excluded from all engine
// calculations. The cycle numbers of non-deleted entries must remain
// gapless — renumbered as if the deleted entry never existed.
//
// What this tests:
//   - assignCycleNumber() must skip isDeleted entries.
//   - calculateDrift() must not include deleted entries in its input.
//   - groupEntriesByCycle() must not emit a Cycle object for deleted entries.
//   - The non-deleted entries get cycle numbers 1 and 2 (not 1 and 3).
// ---------------------------------------------------------------------------

export const softDeletedEntries: SleepEntry[] = [
  makeEntry({
    id: 'soft-delete-active-1',
    sleepStartUtc: '2026-05-01T21:00:00.000Z',
    wakeUtc: '2026-05-02T05:00:00.000Z',
    cycleNumber: 1,
    sessionType: 'main',
  }),
  makeEntry({
    id: 'soft-delete-deleted',
    sleepStartUtc: '2026-05-02T22:00:00.000Z',
    wakeUtc: '2026-05-03T06:00:00.000Z',
    cycleNumber: 0, // excluded from all output; cycle number is irrelevant
    sessionType: 'main',
    isDeleted: true,
  }),
  makeEntry({
    id: 'soft-delete-active-2',
    sleepStartUtc: '2026-05-03T22:00:00.000Z',
    wakeUtc: '2026-05-04T06:00:00.000Z',
    cycleNumber: 2, // must be 2, not 3 — gap is not allowed
    sessionType: 'main',
  }),
]

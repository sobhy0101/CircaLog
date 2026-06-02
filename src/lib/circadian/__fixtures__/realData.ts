/**
 * Real-data fixture — CircaLog Circadian Engine tests
 *
 * Source: Mahmoud's actual sleep records, May 29 – Jun 2 2026.
 * Sanitized: notes shortened; medication and food logs omitted
 * (those fields are not part of SleepEntry).
 * Updated: bedTimeUtc added to all entries (02 Jun 2026).
 *
 * Timezone: Africa/Cairo, UTC+3 during DST (EEST).
 * DST was active on all dates in this fixture (Apr–Oct).
 * To convert Cairo local → UTC: subtract 3 hours.
 *
 * Source data caveat:
 *   The original spreadsheet used a single Date column anchored to
 *   Sleep Start time. The Cycle 4 session began on the night of May 31
 *   but crossed midnight, making Sleep Start fall on June 1 — so the
 *   spreadsheet showed it as a "06/01" entry. The UTC timestamps here
 *   are derived from the actual local bed/sleep/wake times, not from
 *   the spreadsheet Date column.
 *
 * Chronological order (sleepStartUtc ascending):
 *   Cycle 1 — 2026-05-29T01:00Z  (04:00 Cairo, May 29)
 *   Cycle 2 — 2026-05-30T03:03Z  (06:03 Cairo, May 30)
 *   Cycle 3 — 2026-05-31T04:06Z  (07:06 Cairo, May 31)
 *   Cycle 4 — 2026-05-31T21:37Z  (00:37 Cairo, Jun 1 — night of May 31)
 *   Cycle 5 — 2026-06-01T18:48Z  (21:48 Cairo, Jun 1)
 *
 * The drift pattern is visible: each sleep onset falls progressively
 * later in the day — a real Non-24 / circadian rhythm disorder signature.
 */

import type { SleepEntry } from '../types'

export const realSleepEntries: SleepEntry[] = [
  {
    // ── Cycle 1 — night of May 28/29 ─────────────────────────────────────
    // Cairo local: bed 03:10, sleep 04:00, wake 10:00 (all May 29)
    // UTC: sleep 01:00, wake 07:00
    id: 'real-cycle-1',
    bedTimeUtc: '2026-05-29T00:10:00.000Z',
    sleepStartUtc: '2026-05-29T01:00:00.000Z',
    wakeUtc: '2026-05-29T07:00:00.000Z',
    ianaTimezone: 'Africa/Cairo',
    cycleNumber: 1,
    sessionType: 'main', // 6h 0m — above the 3h threshold
    quality: 3,
    hadDreams: false,
    interruptions: [{ type: 'bathroom', note: 'twice' }],
    notes: 'Woken by morning meds alarm',
    isDeleted: false,
    createdAt: '2026-05-29T07:05:00.000Z',
    updatedAt: '2026-05-29T07:05:00.000Z',
  },
  {
    // ── Cycle 2 — night of May 29/30 ─────────────────────────────────────
    // Cairo local: bed 05:28, sleep 06:03, wake 13:40 (all May 30)
    // UTC: sleep 03:03, wake 10:40
    id: 'real-cycle-2',
    bedTimeUtc: '2026-05-30T02:28:00.000Z',
    sleepStartUtc: '2026-05-30T03:03:00.000Z',
    wakeUtc: '2026-05-30T10:40:00.000Z',
    ianaTimezone: 'Africa/Cairo',
    cycleNumber: 2,
    sessionType: 'main', // 7h 37m
    quality: 4,
    hadDreams: false,
    interruptions: [],
    notes: 'Woken by the dohr athan',
    isDeleted: false,
    createdAt: '2026-05-30T10:45:00.000Z',
    updatedAt: '2026-05-30T10:45:00.000Z',
  },
  {
    // ── Cycle 3 — night of May 30/31 ─────────────────────────────────────
    // Cairo local: bed 06:25, sleep 07:06, wake 11:30 (all May 31)
    // UTC: sleep 04:06, wake 08:30
    id: 'real-cycle-3',
    bedTimeUtc: '2026-05-31T03:25:00.000Z',
    sleepStartUtc: '2026-05-31T04:06:00.000Z',
    wakeUtc: '2026-05-31T08:30:00.000Z',
    ianaTimezone: 'Africa/Cairo',
    cycleNumber: 3,
    sessionType: 'main', // 4h 24m — above the 3h threshold
    quality: 3,
    hadDreams: false,
    interruptions: [],
    notes: '',
    isDeleted: false,
    createdAt: '2026-05-31T08:35:00.000Z',
    updatedAt: '2026-05-31T08:35:00.000Z',
  },
  {
    // ── Cycle 4 — night of May 31 / Jun 1 (midnight crossover) ───────────
    // Cairo local: bed 23:10 May 31, sleep 00:37 Jun 1, wake 05:40 Jun 1
    // UTC: bed 20:10 May 31, sleep 21:37 May 31, wake 02:40 Jun 1
    //
    // The sleep start crosses midnight in local time (May 31 → Jun 1),
    // but in UTC it stays on May 31. The spreadsheet showed this as a
    // "06/01/2026" entry because it anchored Date to Sleep Start local
    // time (00:37 Jun 1). The correct night is May 31.
    //
    // This is the primary midnight-crossover test case in the fixture set.
    // normalizeSleepSpan() and all duration calculations must handle it.
    id: 'real-cycle-4',
    bedTimeUtc: '2026-05-31T20:10:00.000Z',
    sleepStartUtc: '2026-05-31T21:37:00.000Z',
    wakeUtc: '2026-06-01T02:40:00.000Z',
    ianaTimezone: 'Africa/Cairo',
    cycleNumber: 4,
    sessionType: 'main', // 5h 3m
    quality: 3,
    hadDreams: false,
    interruptions: [{ type: 'bathroom', note: 'once' }],
    notes: '',
    isDeleted: false,
    createdAt: '2026-06-01T02:45:00.000Z',
    updatedAt: '2026-06-01T02:45:00.000Z',
  },
  {
    // ── Cycle 5 — night of Jun 1/2 ───────────────────────────────────────
    // Cairo local: bed 21:37 Jun 1, sleep 21:48 Jun 1, wake 05:20 Jun 2
    // UTC: sleep 18:48 Jun 1, wake 02:20 Jun 2
    //
    // The spreadsheet also showed this as "06/01/2026". Both Cycle 4 and
    // Cycle 5 share the same spreadsheet Date value, but they are on
    // different nights: Cycle 4 is the May 31 night, Cycle 5 is Jun 1.
    // The UTC timestamps make the distinction unambiguous.
    //
    // Sleep onset latency: only 11 minutes (bed 21:37, sleep 21:48).
    id: 'real-cycle-5',
    bedTimeUtc: '2026-06-01T18:37:00.000Z',
    sleepStartUtc: '2026-06-01T18:48:00.000Z',
    wakeUtc: '2026-06-02T02:20:00.000Z',
    ianaTimezone: 'Africa/Cairo',
    cycleNumber: 5,
    sessionType: 'main', // 7h 32m
    quality: 4,
    hadDreams: false,
    interruptions: [{ type: 'bathroom', note: 'once' }],
    notes: '',
    isDeleted: false,
    createdAt: '2026-06-02T02:25:00.000Z',
    updatedAt: '2026-06-02T02:25:00.000Z',
  },
]

/**
 * The same five entries in a shuffled order — intentionally NOT sorted
 * by sleepStartUtc. Use this array to test that assignCycleNumber()
 * produces the correct sorted output regardless of input order.
 *
 * Shuffled order: 3, 1, 5, 4, 2
 */
export const realSleepEntriesUnsorted: SleepEntry[] = [
  { ...realSleepEntries[2] }, // Cycle 3
  { ...realSleepEntries[0] }, // Cycle 1
  { ...realSleepEntries[4] }, // Cycle 5
  { ...realSleepEntries[3] }, // Cycle 4
  { ...realSleepEntries[1] }, // Cycle 2
]

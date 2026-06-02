# CC Task — Phase 0.5: Circadian Engine Functions + Tests

**Project:** CircaLog
**Root:** `C:\Projects\CircaLog\`
**Assigned to:** Claude Code
**Phase:** 0.5 — Circadian Engine
**Report slug:** `phase0-5-circadian-engine`
**Report save path:** `tasks/cc-reports/`

---

## Goal

Implement all eight pure circadian engine functions in
`src/lib/circadian/` and write a complete Vitest test suite that
passes against both fixture sets with zero failures.

This task also adds `bedTimeUtc` to `SleepEntry` in `types.ts` and
updates both fixture files to include bed times where known — a design
decision reached in the Claude.ai planning session on 02 Jun 2026.

No React. No UI. No IndexedDB. Pure TypeScript logic only.

---

## Why `bedTimeUtc` Must Come First

The session that began on the night of May 31 (Cycle 4 in the real-data
fixture) illustrates the problem: bed time was 23:10 May 31, sleep start
was 00:37 Jun 1, and wake was 05:40 Jun 1. That is three separate
calendar dates that belong to the same session. The existing `SleepEntry`
type has `sleepStartUtc` and `wakeUtc`, but no `bedTimeUtc`. Without it:

- The history view cannot show "which night was this?" correctly
- The actogram cannot anchor a session to its true night
- `normalizeSleepSpan()` cannot return a `localBedDate`
- Doctor reports cannot answer "I went to bed on May 31 and slept into
  June 1" — they can only say "sleep started June 1"

`bedTimeUtc` is added as **optional** (`bedTimeUtc?: string`) because:

1. Back-filled historical entries may not have bed time data
2. Some users may only know when they fell asleep, not when they lay down
3. The engine must work correctly when bed time is absent — all functions
   that use it must have a graceful fallback

---

## Before Starting — Required Reads

Read all of the following before writing a single line of code:

```powershell
Get-Content "C:\Projects\CircaLog\src\lib\circadian\types.ts"
Get-Content "C:\Projects\CircaLog\src\lib\circadian\__fixtures__\realData.ts"
Get-Content "C:\Projects\CircaLog\src\lib\circadian\__fixtures__\edgeCases.ts"
Get-Content "C:\Projects\CircaLog\docs\timezone-strategy.md"
Get-Content "C:\Projects\CircaLog\docs\cycle-number-strategy.md"
Get-Content "C:\Projects\CircaLog\vite.config.ts"
```

Key facts to carry into all code:

- All timestamps are ISO 8601 UTC strings — never store or compare
  local time strings directly
- Duration arithmetic is always: `new Date(wakeUtc).getTime() -
  new Date(sleepStartUtc).getTime()` — this is correct across DST
  transitions and midnight crossovers because UTC has no such anomalies
- `ianaTimezone` on the entry is the timezone to use for converting UTC
  to local dates — never assume the user's current system timezone
- `cycleNumber` is a derived pre-computed cache — always assigned by
  `assignCycleNumber()`, never by any other code
- Soft-deleted entries (`isDeleted: true`) must be excluded from ALL
  engine calculations and outputs without exception
- The `@/` path alias resolves to `src/` — use it in all imports within
  test files (`import type { SleepEntry } from '@/lib/circadian/types'`)

---

## Rules for This Task

- **Read before write.** Read every file before modifying it.
- **No UI imports.** These files must never import from React, Tailwind,
  or any UI library.
- **Inline comments required** on every non-obvious line. Mahmoud is
  learning TypeScript and will be reading this code regularly.
- **Stop on ambiguity.** If a function's expected behavior is unclear
  for a specific input, stop and report the question — do not guess.
- **TypeScript strict.** Every function must be fully typed — no `any`,
  no implicit `any`, no type assertions unless genuinely unavoidable.
  If a type assertion is used, explain why in a comment.
- **Zero test failures.** The test suite must pass completely before the
  session report is written. Do not write the report if any test fails.
- **Vitest type conflict note.** The project uses Vite 8 + Vitest 4.
  `UserConfig` is NOT exported from `vitest/config` in this version.
  Do not add `import type { UserConfig } from 'vitest/config'` — it
  will cause a Vercel deployment failure. The `vite.config.ts` already
  uses the correct `as any` cast pattern. Do not modify `vite.config.ts`
  in this task.

---

## Step 1 — Add `bedTimeUtc` to `SleepEntry` in `types.ts`

Read `src/lib/circadian/types.ts` first.

Find the `// ── Timestamps ──` section inside `SleepEntry`. It currently
contains `sleepStartUtc` and `wakeUtc`. Add `bedTimeUtc` between them
as an optional field.

The section must read exactly as follows after the edit:

```typescript
  // ── Timestamps ────────────────────────────────────────────────────────────

  /**
   * The time the user got into bed, stored as an ISO 8601 UTC string.
   * Optional — not all entries will have this value (back-filled
   * historical entries may only have sleep start and wake times).
   *
   * This is the "night anchor" date: the calendar date of bedTimeUtc
   * in the user's local timezone is the correct answer to the question
   * "which night was this sleep session?" — even when sleep start and
   * wake time fall on different calendar dates (midnight crossover).
   *
   * Example: bed 23:10 May 31, sleep 00:37 Jun 1, wake 05:40 Jun 1.
   * The night is May 31. sleepStartUtc alone gives Jun 1, which is wrong.
   *
   * Never entered manually by the user in the timer flow — set
   * automatically when the user taps "Start Sleep". May be entered
   * manually in back-fill mode when the user remembers when they
   * went to bed.
   */
  bedTimeUtc?: string;

  /** Sleep start time, stored as an ISO 8601 UTC string. */
  sleepStartUtc: string;

  /** Wake time, stored as an ISO 8601 UTC string. */
  wakeUtc: string;
```

Also add `NormalizedSleepSpan` as a new exported interface at the end
of the `// Engine return types` section, after `RollingAverages`:

```typescript
/**
 * The result of normalizeSleepSpan().
 *
 * All UTC timestamps from the source entry are validated and preserved.
 * The three local date strings are derived from those UTC timestamps
 * using the entry's ianaTimezone — they exist so that display layers
 * (history list, actogram, doctor report) do not have to re-derive them.
 *
 * "Local date" means an ISO 8601 date string (YYYY-MM-DD) in the
 * entry's ianaTimezone — not a Date object, not a UTC date string.
 *
 * localBedDate is undefined when bedTimeUtc is absent from the entry.
 */
export interface NormalizedSleepSpan {
  /** Duration from sleep start to wake, in milliseconds. Always > 0. */
  durationMs: number;

  /** Validated ISO 8601 UTC string — equal to entry.sleepStartUtc. */
  sleepStartUtc: string;

  /** Validated ISO 8601 UTC string — equal to entry.wakeUtc. */
  wakeUtc: string;

  /**
   * Local calendar date (YYYY-MM-DD) of sleep start in the entry's
   * ianaTimezone. This is the date the patient fell asleep.
   */
  localSleepStartDate: string;

  /**
   * Local calendar date (YYYY-MM-DD) of wake time in the entry's
   * ianaTimezone. This is the date the patient woke up.
   */
  localWakeDate: string;

  /**
   * Local calendar date (YYYY-MM-DD) of bed time in the entry's
   * ianaTimezone. This is the "night anchor" — the correct answer to
   * "which night was this session?"
   *
   * Undefined when bedTimeUtc is absent from the source entry.
   * When undefined, callers should fall back to localSleepStartDate
   * for display, with a note that the night anchor is approximate.
   */
  localBedDate?: string;
}
```

After editing, run `npx tsc --noEmit` to confirm zero errors before
continuing. Record the result in the session report.

---

## Step 2 — Update `realData.ts` with `bedTimeUtc` values

Read `src/lib/circadian/__fixtures__/realData.ts` first.

The real-data fixture already has bed times in its comments. Add
`bedTimeUtc` to each entry using those values. The UTC conversions are:
Cairo during DST = UTC+3, so subtract 3 hours from Cairo local bed time.

Add `bedTimeUtc` immediately before `sleepStartUtc` on each entry.
The exact values to add:

| Entry id | Cairo local bed time | `bedTimeUtc` to add |
|---|---|---|
| `real-cycle-1` | 03:10 May 29 | `'2026-05-29T00:10:00.000Z'` |
| `real-cycle-2` | 05:28 May 30 | `'2026-05-30T02:28:00.000Z'` |
| `real-cycle-3` | 06:25 May 31 | `'2026-05-31T03:25:00.000Z'` |
| `real-cycle-4` | 23:10 May 31 | `'2026-05-31T20:10:00.000Z'` |
| `real-cycle-5` | 21:37 Jun 1  | `'2026-06-01T18:37:00.000Z'` |

Also update `realSleepEntriesUnsorted` — it spreads from
`realSleepEntries`, so `bedTimeUtc` will be inherited automatically.
No changes needed there beyond confirming it still compiles.

Update the file header comment to note that `bedTimeUtc` has been added,
matching the same comment style already present.

Run `npx tsc --noEmit` after saving. Zero errors required.

---

## Step 3 — Update `edgeCases.ts` with `bedTimeUtc` values

Read `src/lib/circadian/__fixtures__\edgeCases.ts` first.

The edge-case fixture uses a `makeEntry()` helper. `bedTimeUtc` does not
need to be added to the helper's defaults — it should remain absent from
entries where bed time is not part of what is being tested. This keeps
each fixture group focused on exactly one scenario.

Add `bedTimeUtc` only to the entries in `dstSpringForward` and
`dstFallBack`, because those test sessions that cross a DST boundary and
the bed-time local date is specifically meaningful for those cases.

**`dstSpringForward[0]`:** bed time is 30 minutes before sleep start.
Sleep start UTC is `'2026-04-23T21:30:00.000Z'`, so bed time UTC is
`'2026-04-23T21:00:00.000Z'`. Add:

```typescript
bedTimeUtc: '2026-04-23T21:00:00.000Z',
```

**`dstFallBack[0]`:** bed time is 30 minutes before sleep start.
Sleep start UTC is `'2026-10-28T22:00:00.000Z'`, so bed time UTC is
`'2026-10-28T21:30:00.000Z'`. Add:

```typescript
bedTimeUtc: '2026-10-28T21:30:00.000Z',
```

All other edge-case groups (`timezoneSwitch`, `longAwakePeriod`,
`fragmentedNight`, `napBoundary`, `backfillOriginal`, `backfillNewEntry`,
`backfillExpected`, `softDeletedEntries`) leave `bedTimeUtc` absent.
This is intentional — those tests do not require bed time data and
adding it would obscure what each fixture is testing.

Run `npx tsc --noEmit` after saving. Zero errors required.

---

## Step 4 — Create `src/lib/circadian/utils.ts`

This is a shared internal utility used only within the circadian engine.
It is not exported from the public engine API.

Create the file `src/lib/circadian/utils.ts` with the following content:

```typescript
/**
 * CircaLog — Circadian Engine Internal Utilities
 *
 * These helpers are used inside the engine functions only.
 * They are not part of the public API and must not be imported
 * outside of src/lib/circadian/.
 */

/**
 * Converts a UTC ISO 8601 timestamp string to a local date string
 * (YYYY-MM-DD) in the given IANA timezone.
 *
 * Example:
 *   utcToLocalDate('2026-05-31T21:37:00.000Z', 'Africa/Cairo')
 *   // → '2026-06-01'  (because 21:37 UTC = 00:37 Cairo, which is June 1)
 *
 * Uses the Intl.DateTimeFormat API, which is available in all modern
 * browsers and in Node.js 12+. No external library required.
 *
 * @param utcString - ISO 8601 UTC string (e.g. "2026-05-31T21:37:00.000Z")
 * @param ianaTimezone - IANA timezone name (e.g. "Africa/Cairo")
 * @returns Local date as "YYYY-MM-DD"
 */
export function utcToLocalDate(utcString: string, ianaTimezone: string): string {
  // new Date() parses an ISO 8601 UTC string correctly in all environments.
  const date = new Date(utcString)

  // Intl.DateTimeFormat formats the instant in the given timezone.
  // 'en-CA' produces dates as YYYY-MM-DD, which is what we want.
  // Using a locale that naturally produces ISO 8601 date format avoids
  // manual string manipulation.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ianaTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/**
 * Filters out soft-deleted entries from an array.
 * All engine functions must call this before processing their input.
 *
 * @param entries - Array of SleepEntry (may contain deleted entries)
 * @returns A new array with isDeleted entries removed
 */
import type { SleepEntry } from './types'

export function filterActive(entries: SleepEntry[]): SleepEntry[] {
  // Filter to a new array — never mutate the input array.
  return entries.filter(entry => !entry.isDeleted)
}
```

Run `npx tsc --noEmit`. Zero errors required.

---

## Step 5 — Create the eight engine function files

Create one file per function, all in `src/lib/circadian/`.

### 5a — `normalizeSleepSpan.ts`

```typescript
/**
 * normalizeSleepSpan
 *
 * Validates a SleepEntry's timestamps and derives the three local calendar
 * dates that correspond to bed time, sleep start, and wake time.
 *
 * Why three dates?
 *   A single sleep session can span multiple calendar dates. For a patient
 *   with Non-24, a session that starts at 23:10 on May 31 (local), crosses
 *   midnight, and ends at 05:40 on June 1 (local) belongs to the "night of
 *   May 31" — not June 1. Without storing bed time and deriving all three
 *   local dates, the history view, actogram, and doctor report all risk
 *   displaying the wrong date for sessions that cross midnight.
 *
 * Duration is computed from UTC timestamps only — this is correct across
 * DST transitions (spring-forward, fall-back) and midnight crossovers
 * because UTC is a uniform timeline with no gaps or repeats.
 */

import type { SleepEntry, NormalizedSleepSpan } from './types'
import { utcToLocalDate } from './utils'

/**
 * Validates and normalizes the timestamps of a single SleepEntry,
 * returning a NormalizedSleepSpan with pre-computed local dates.
 *
 * Throws if wakeUtc is not strictly after sleepStartUtc — this is a
 * data integrity error that must not silently produce a negative duration.
 *
 * @param entry - A single SleepEntry (may or may not have bedTimeUtc)
 * @returns NormalizedSleepSpan with durationMs and local date strings
 */
export function normalizeSleepSpan(entry: SleepEntry): NormalizedSleepSpan {
  const sleepStart = new Date(entry.sleepStartUtc).getTime()
  const wake = new Date(entry.wakeUtc).getTime()

  // Duration must be positive. A zero or negative duration means the
  // timestamps are wrong — this should never happen in valid data.
  if (wake <= sleepStart) {
    throw new Error(
      `normalizeSleepSpan: wakeUtc (${entry.wakeUtc}) must be after ` +
      `sleepStartUtc (${entry.sleepStartUtc}) for entry id="${entry.id}"`
    )
  }

  const durationMs = wake - sleepStart

  // Derive local dates using the entry's own timezone.
  // Each date is computed independently — they may be different calendar
  // dates (e.g. sleep start May 31 local, wake June 1 local).
  const localSleepStartDate = utcToLocalDate(entry.sleepStartUtc, entry.ianaTimezone)
  const localWakeDate = utcToLocalDate(entry.wakeUtc, entry.ianaTimezone)

  // localBedDate is only available when bedTimeUtc is present.
  const localBedDate = entry.bedTimeUtc
    ? utcToLocalDate(entry.bedTimeUtc, entry.ianaTimezone)
    : undefined

  return {
    durationMs,
    sleepStartUtc: entry.sleepStartUtc,
    wakeUtc: entry.wakeUtc,
    localSleepStartDate,
    localWakeDate,
    localBedDate,
  }
}
```

---

### 5b — `detectSessionType.ts`

```typescript
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
```

---

### 5c — `assignCycleNumber.ts`

```typescript
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
```

---

### 5d — `calculateDrift.ts`

```typescript
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
```

---

### 5e — `estimateFreeRunningPeriod.ts`

```typescript
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
```

---

### 5f — `groupEntriesByCycle.ts`

```typescript
/**
 * groupEntriesByCycle
 *
 * Groups SleepEntry records by their cycleNumber into Cycle objects.
 * Used by the actogram and history view to render all sessions that
 * belong to the same night together.
 *
 * Most cycles contain one entry (a single main sleep). Some contain two
 * (a main sleep plus a nap logged in the same cycle). Fragmented nights
 * may produce three or more entries per cycle.
 *
 * The calendarDate of each Cycle is derived from the primary entry —
 * defined as the first main-sleep entry in the cycle. If a cycle
 * contains only naps (unusual but possible), the first nap is used.
 *
 * Soft-deleted entries are excluded. The returned array is sorted by
 * cycleNumber ascending.
 */

import type { SleepEntry, Cycle } from './types'
import { filterActive, utcToLocalDate } from './utils'

/**
 * Groups active sleep entries by cycle number into Cycle objects.
 *
 * @param entries - All SleepEntry records (may include deleted entries)
 * @returns Array of Cycle objects sorted by cycleNumber ascending
 */
export function groupEntriesByCycle(entries: SleepEntry[]): Cycle[] {
  const active = filterActive(entries)

  // Build a Map from cycleNumber → SleepEntry[].
  // Map preserves insertion order, which will be sorted below.
  const cycleMap = new Map<number, SleepEntry[]>()

  for (const entry of active) {
    const existing = cycleMap.get(entry.cycleNumber)
    if (existing) {
      existing.push(entry)
    } else {
      cycleMap.set(entry.cycleNumber, [entry])
    }
  }

  // Convert the map to an array of Cycle objects.
  const cycles: Cycle[] = []

  for (const [cycleNumber, cycleEntries] of cycleMap) {
    // Sort entries within the cycle by sleepStartUtc ascending.
    const sorted = [...cycleEntries].sort((a, b) =>
      a.sleepStartUtc.localeCompare(b.sleepStartUtc)
    )

    // Determine the primary entry for calendarDate derivation.
    // Prefer the first main-sleep entry; fall back to the first nap.
    const primary =
      sorted.find(e => e.sessionType === 'main') ?? sorted[0]

    // calendarDate uses bedTimeUtc if available (the correct "night anchor"),
    // otherwise falls back to sleepStartUtc (approximate but acceptable).
    const anchorUtc = primary.bedTimeUtc ?? primary.sleepStartUtc
    const calendarDate = utcToLocalDate(anchorUtc, primary.ianaTimezone)

    cycles.push({ cycleNumber, entries: sorted, calendarDate })
  }

  // Sort cycles by cycleNumber ascending.
  cycles.sort((a, b) => a.cycleNumber - b.cycleNumber)

  return cycles
}
```

---

### 5g — `detectFragmentation.ts`

```typescript
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
```

---

### 5h — `calculateRollingAverages.ts`

```typescript
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
```

---

## Step 6 — Create `src/lib/circadian/index.ts`

This file is the single public export point for the circadian engine.
All external code imports from here — never directly from individual
function files.

```typescript
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
```

Run `npx tsc --noEmit`. Zero errors required before moving to tests.

---

## Step 7 — Create the test file

Create `src/lib/circadian/__tests__/engine.test.ts`.

Create the `__tests__` directory first if it does not exist:

```powershell
New-Item -ItemType Directory -Force -Path "C:\Projects\CircaLog\src\lib\circadian\__tests__"
```

Then write the test file with the following content:

```typescript
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
```

---

## Step 8 — Run the test suite

From the project root, run:

```powershell
npm test
```

All tests must pass with zero failures. If any test fails:

1. Read the failure message carefully — it will identify the test name
   and the expected vs received values
2. Fix the function code, not the test — the tests encode the correct
   behavior and must not be changed to make them pass
3. The one exception: if a test contains a genuine mistake in its
   expected value (e.g. a miscalculated UTC time), fix the test and
   note the correction explicitly in the session report

Do not proceed to Step 9 until all tests pass.

Record the full `npm test` output in the session report.

---

## Step 9 — Run `npm run build`

From the project root, run:

```powershell
npm run build
```

The build must complete with zero TypeScript errors. Record the full
output in the session report.

---

## Step 10 — Update the TO-DO list

Read `docs/CircaLog-TO-DO-list.md`. Mark the following items complete:

```markdown
- [x] 🔴 `normalizeSleepSpan(entry)` — overnight + timezone + DST normalization
- [x] 🔴 `detectSessionType(durationMs, gapMs)` — returns `'main'` | `'nap'`
- [x] 🔴 `assignCycleNumber(entries)` — assigns/recomputes cycle numbers (idempotent; runs after every back-fill)
- [x] 🔴 `calculateDrift(entries)` — minutes-per-cycle drift rate
- [x] 🔴 `estimateFreeRunningPeriod(entries)` — linear regression on sleep onset times; returns `'pending'` until 14+ entries
- [x] 🔴 `groupEntriesByCycle(entries)` — grouping helper for chart and history rendering
- [x] 🔴 `detectFragmentation(entry)` — flags fragmented sleep sessions
- [x] 🔴 `calculateRollingAverages(entries, windowDays)` — rolling 7/30-day stats
- [x] 🔴 Vitest test suite passes against both fixture sets (real history + synthetic edge cases)
       with zero failures before Phase 0.5 is considered complete
```

Leave all other items unchanged.

---

## Step 11 — Write the session report

Write a comprehensive Markdown session report and save it to:

```
tasks/cc-reports/REPORT_phase0-5-circadian-engine_{DD}-{mon}-{YYYY}.md
```

Replace `{DD}-{mon}-{YYYY}` with today's actual date (e.g. `02-jun-2026`).

The report must include:

- Every step and its outcome (✅ succeeded / ❌ failed / ⚠️ adapted)
- The full list of files created or modified
- The `npx tsc --noEmit` result from after each types change (Steps 1, 2, 3)
- The full `npm test` output (Step 8)
- The full `npm run build` output (Step 9)
- Any deviations from these instructions and the reason why
- Any test that was corrected (expected value was wrong) — list the
  test name, what the wrong value was, and what the correct value is

Markdownlint rules — zero warnings allowed:

- Blank line before AND after every fenced code block, no exceptions
- Even when a label line immediately precedes a code block, insert a
  blank line between the label and the fence

After writing the report, paste a short summary (one paragraph) into
the Claude.ai chat and **wait for confirmation** before running the
git commit.

---

## Step 12 — Git commit (after Claude.ai confirms the report)

After receiving confirmation from Claude.ai, run:

```powershell
git add src/lib/circadian/ docs/CircaLog-TO-DO-list.md tasks/cc-reports/
git commit -m "feat(phase0.5): circadian engine functions, bedTimeUtc, full test suite"
git push origin main
```

---

## Summary of Files Created / Modified

| File | Action |
|---|---|
| `src/lib/circadian/types.ts` | Modified — add `bedTimeUtc`, `NormalizedSleepSpan` |
| `src/lib/circadian/__fixtures__/realData.ts` | Modified — add `bedTimeUtc` values |
| `src/lib/circadian/__fixtures__/edgeCases.ts` | Modified — add `bedTimeUtc` to DST fixtures |
| `src/lib/circadian/utils.ts` | Created |
| `src/lib/circadian/normalizeSleepSpan.ts` | Created |
| `src/lib/circadian/detectSessionType.ts` | Created |
| `src/lib/circadian/assignCycleNumber.ts` | Created |
| `src/lib/circadian/calculateDrift.ts` | Created |
| `src/lib/circadian/estimateFreeRunningPeriod.ts` | Created |
| `src/lib/circadian/groupEntriesByCycle.ts` | Created |
| `src/lib/circadian/detectFragmentation.ts` | Created |
| `src/lib/circadian/calculateRollingAverages.ts` | Created |
| `src/lib/circadian/index.ts` | Created |
| `src/lib/circadian/__tests__/engine.test.ts` | Created |
| `docs/CircaLog-TO-DO-list.md` | Modified — mark Phase 0.5 functions complete |
| `tasks/cc-reports/REPORT_phase0-5-circadian-engine_{date}.md` | Created |

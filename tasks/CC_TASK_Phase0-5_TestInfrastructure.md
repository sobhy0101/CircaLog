# CC Task — Phase 0.5: Test Infrastructure

**Phase:** 0.5 — Circadian Engine
**Batch:** Test Infrastructure
**Covers TO-DO items:**
- `[ ] 🔴 Install and configure Vitest`
- `[ ] 🔴 Build test fixtures in src/lib/circadian/__fixtures__/`

**Report slug:** `phase0-5-test-infrastructure`
**Report save path:** `tasks/cc-reports/`

---

## Context

Phase 0.5 is the Circadian Engine — the mathematical core that all
downstream features depend on. Before writing any engine functions, this
task installs the test runner (Vitest) and builds the two fixture files
that every subsequent engine test will import.

The fixture files are the test corpus. They must exist before writing
tests, because the tests import from them.

Two fixture files will be created:

- `realData.ts` — sanitized from Mahmoud's actual sleep records
  (May 29 – Jun 2 2026). Five sessions, all in Africa/Cairo (UTC+3
  during DST). Includes a midnight-crossover session (Cycle 4: sleep
  start crosses from May 31 into June 1) and a same-calendar-date pair
  (Cycles 4 and 5 both show "06/01" in the source spreadsheet, but are
  distinct sessions on different nights). The source spreadsheet used a
  single Date column anchored to Sleep Start, which caused the
  midnight-crossover session to appear as a June 1 entry even though the
  night began on May 31. The fixture uses correct UTC timestamps derived
  from the actual local times, not the spreadsheet Date column.

- `edgeCases.ts` — synthetic entries covering scenarios the real data
  cannot supply: DST transitions, timezone switches, very long awake
  periods, fragmented nights, and nap detection at the 3h boundary.

---

## Before Starting

Read the following files before writing any code:

1. `src/lib/circadian/types.ts` — canonical `SleepEntry` interface.
   All fixture entries must conform to this type exactly.

2. `docs/timezone-strategy.md` — all timestamps are UTC ISO 8601
   strings; `ianaTimezone` is an IANA name, never an offset integer.

3. `docs/cycle-number-strategy.md` — `cycleNumber` is derived from
   sort order, not authoritative. Fixture entries must have correct
   cycle numbers relative to their sort order within each array.

4. `vite.config.ts` — the current Vite config. Vitest config extends
   it; do not break existing plugins (tailwindcss, react, VitePWA).

5. `tsconfig.app.json` — note: `"jsx": "react-jsx"` with
   `"noUnusedLocals": true`. Fixture files are `.ts`, not `.tsx`;
   no React import is needed or allowed.

---

## Steps

### Step 1 — Install Vitest and dependencies

Run the following command from the project root
(`C:\Projects\CircaLog\`):

```powershell
npm install --save-dev vitest@^3.2.4 @vitest/coverage-v8@^3.2.4
```

**Why these packages:**

- `vitest` — the test runner. Version 3.x is the correct pairing for
  Vite 8. Do not install Vitest 2.x.
- `@vitest/coverage-v8` — coverage provider. V8 coverage requires no
  additional native dependencies (unlike `@vitest/coverage-istanbul`),
  which makes it the correct choice for this project's CI-free workflow.

After installing, confirm both appear under `devDependencies` in
`package.json` with the installed version numbers. Record the exact
versions in the session report.

---

### Step 2 — Add the `test` script to `package.json`

Read `package.json` first. Then add a `"test"` script to the
`"scripts"` block:

```json
"test": "vitest"
```

The full scripts block should look like this after the edit:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
  "test": "vitest"
}
```

Do not add `"test:coverage"` yet — coverage reporting is a later task.

---

### Step 3 — Configure Vitest inside `vite.config.ts`

Read `vite.config.ts` first.

Add a `test` block to the existing `defineConfig` call. The file must
remain a single `defineConfig` export — do not create a separate
`vitest.config.ts`.

Add this import at the top of the file, after the existing imports:

```typescript
import type { UserConfig } from 'vitest/config'
```

Then add the `test` block inside `defineConfig`. The full updated
`vite.config.ts` must look exactly like this (preserve all existing
comments — they are documentation, not noise):

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import type { UserConfig } from 'vitest/config'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(), // Processes all Tailwind utility classes
    react(),       // Enables React JSX transformation and fast refresh

    VitePWA({
      // 'autoUpdate' means the service worker updates silently in the background.
      // The new version becomes active after the user closes and reopens the app.
      // We pair this with a hook (see useAppUpdate.ts) that can show a changelog prompt.
      registerType: 'autoUpdate',

      // Generate the service worker and its assets during 'vite build'.
      // During 'vite dev', the service worker is inactive so it doesn't
      // interfere with hot module replacement (HMR).
      devOptions: {
        enabled: false,
      },

      // The Web App Manifest — tells the browser how to present the app
      // when installed on a device (name, icons, colors, start screen, etc.)
      manifest: {
        name: 'CircaLog',
        short_name: 'CircaLog',
        description:
          'Sleep tracking for Non-24-Hour Sleep-Wake Disorder and other circadian rhythm conditions.',

        // start_url is the page that opens when the user launches the installed app.
        // '/log' is the permanent home of the CircaLog PWA.
        start_url: '/log',

        // 'standalone' makes the app look like a native app — no browser chrome
        // (no address bar, no navigation buttons from the browser).
        display: 'standalone',

        // Orientation: allow both portrait and landscape.
        orientation: 'any',

        // theme_color sets the color of the browser/system chrome around the app
        // (e.g. the status bar on Android). Matches the app's deep navy background.
        theme_color: '#0F0F1E',

        // background_color is shown on the splash screen while the app loads.
        background_color: '#0F0F1E',

        // Icons — production set added 28 May 2026.
        // All files live in /public/images/brand/ and were generated via
        // realfavicongenerator.net from the CircaLog symbol mark SVG.
        // The PNG icons use purpose 'any maskable' because the artwork was
        // created with a ~350px safe zone inside a 512px artboard, which
        // satisfies the maskable icon safe-zone requirement.
        icons: [
          {
            // SVG icon — picked up by modern browsers that support it.
            src: '/images/brand/icons/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            // 192×192 PNG — required minimum size for Android home screen.
            src: '/images/brand/icons/web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            // 512×512 PNG — used for the Android splash screen and
            // high-resolution home screen icons.
            src: '/images/brand/icons/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },

      // Workbox controls the service worker caching strategy.
      workbox: {
        // Cache all built assets (JS, CSS, images) with a cache-first strategy.
        // 'globPatterns' tells Workbox which files in the dist/ folder to precache.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // When a new service worker is waiting to activate, skip the waiting phase
        // and activate immediately. Combined with 'autoUpdate', this means the
        // app will use the new version as soon as all tabs are closed and reopened.
        skipWaiting: true,

        // After the new service worker activates, take control of all open tabs
        // immediately without requiring a page reload.
        clientsClaim: true,
      },
    }),
  ],

  resolve: {
    alias: {
      // Allows clean imports like: import Foo from '@/components/Foo'
      // instead of messy relative paths like: '../../components/Foo'
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Vitest configuration — runs via 'npm test'.
  // Defined here inside vite.config.ts so that Vitest inherits the same
  // plugins, path aliases, and module resolution as the app itself.
  // This means @/ imports work identically in tests and in production code.
  test: {
    // 'node' environment — correct for pure TypeScript logic tests
    // (circadian engine functions, data transformations, fixture validation).
    // If DOM tests are ever needed (e.g. component tests), switch specific
    // test files to 'jsdom' using a per-file environment annotation:
    //   // @vitest-environment jsdom
    environment: 'node',

    // Include all test files in src/ that match these patterns.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],

    // Globals: false — we use explicit imports (import { describe, it, expect }
    // from 'vitest') rather than relying on injected globals.
    // Explicit imports make it immediately clear where these functions come
    // from and prevent name collisions with any future testing utilities.
    globals: false,
  } satisfies UserConfig['test'],
})
```

**Why `satisfies UserConfig['test']`:** TypeScript will type-check the
`test` block against Vitest's own config interface without requiring
a separate import of `defineConfig` from `vitest/config`. This keeps the
file as a single `defineConfig` from `vite` while still giving full
type-checking on the Vitest options.

---

### Step 4 — Create the fixtures directory

Create the directory:

```
src/lib/circadian/__fixtures__/
```

This directory will hold both fixture files. The double underscore
prefix (`__fixtures__`) is the conventional name for test data
directories in TypeScript projects — it signals that this directory
contains test infrastructure, not production code.

---

### Step 5 — Create `realData.ts`

Create the file:

```
src/lib/circadian/__fixtures__/realData.ts
```

Write it with the exact content below. Do not alter the UTC timestamps,
cycle numbers, or IANA timezone values.

**Timezone note:** All sessions were recorded in Cairo during DST
(EEST = UTC+3, active from last Friday of April to last Thursday of
October). To convert Cairo local time to UTC: subtract 3 hours.

**Source data note:** The original spreadsheet used a single `Date`
column anchored to Sleep Start time. This caused the Cycle 4 session
(which began on the night of May 31 but crossed midnight into June 1)
to appear as a "June 1" entry in the spreadsheet, even though the
night began on May 31. All UTC timestamps below are derived from the
actual local times, not the spreadsheet Date column.

**Chronological order verified (sleepStartUtc ascending):**

| cycleNumber | sleepStartUtc | Local Cairo time |
|---|---|---|
| 1 | 2026-05-29T01:00:00.000Z | 04:00 May 29 |
| 2 | 2026-05-30T03:03:00.000Z | 06:03 May 30 |
| 3 | 2026-05-31T04:06:00.000Z | 07:06 May 31 |
| 4 | 2026-05-31T21:37:00.000Z | 00:37 Jun 1 (night of May 31) |
| 5 | 2026-06-01T18:48:00.000Z | 21:48 Jun 1 |

Write this exact content to the file:

```typescript
/**
 * Real-data fixture — CircaLog Circadian Engine tests
 *
 * Source: Mahmoud's actual sleep records, May 29 – Jun 2 2026.
 * Sanitized: notes shortened; medication and food logs omitted
 * (those fields are not part of SleepEntry).
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
```

---

### Step 6 — Create `edgeCases.ts`

Create the file:

```
src/lib/circadian/__fixtures__/edgeCases.ts
```

Write it with the exact content below:

```typescript
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
```

---

### Step 7 — Run `npm test` to confirm Vitest is operational

From the project root, run:

```powershell
npm test
```

At this stage there are no `.test.ts` files — only fixture files.
Vitest should exit cleanly with a message such as:

```
No test files found, exiting with code 0
```

This confirms Vitest is installed, configured, and can parse the project
without errors. If Vitest exits with a non-zero code or prints TypeScript
errors, fix them before proceeding. Record the exact output in the
session report.

---

### Step 8 — Run `npm run build` to confirm the app still builds

From the project root, run:

```powershell
npm run build
```

The fixture files live inside `src/`, which `tsconfig.app.json` covers
entirely — TypeScript will type-check them during the build. The build
must exit clean with zero TypeScript errors. If any type mismatch errors
appear, they are most likely in the fixture data — fix them before
proceeding. Record the full build output in the session report.

---

### Step 9 — Update the TO-DO list

Read `docs/CircaLog-TO-DO-list.md`. Mark the following items complete:

```markdown
- [x] 🔴 Install and configure Vitest
- [x] 🔴 Build test fixtures in `src/lib/circadian/__fixtures__/`
```

Leave all other items unchanged.

---

### Step 10 — Write the session report

Write a comprehensive Markdown session report and save it to:

```
tasks/cc-reports/REPORT_phase0-5-test-infrastructure_{DD}-{mon}-{YYYY}.md
```

Replace `{DD}-{mon}-{YYYY}` with today's actual date (e.g., `02-jun-2026`).

The report must include:

- Every step and its outcome (✅ succeeded / ❌ failed / ⚠️ adapted)
- Exact installed versions of `vitest` and `@vitest/coverage-v8`
- Full output of `npm test` (Step 7)
- Full output of `npm run build` (Step 8)
- Any deviations from these instructions and the reason why
- Complete list of every file created or modified

Markdownlint rules — zero warnings allowed:

- Blank line before AND after every fenced code block, no exceptions
- Even when a label line (e.g. `vite.config.ts:`) immediately precedes
  a code block, insert a blank line between the label and the fence

After writing the report, paste a short summary (one paragraph) into
the Claude.ai chat and wait for confirmation before running git commit.

---

### Step 11 — Git commit (after Claude.ai confirms the report)

After receiving confirmation from Claude.ai, run:

```powershell
git add .
git commit -m "feat(phase0.5): install Vitest, add circadian engine test fixtures"
git push origin main
```

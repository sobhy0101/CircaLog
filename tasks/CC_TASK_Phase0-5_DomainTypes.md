# CC TASK — Phase 0.5: TypeScript Domain Model Interfaces

**Project:** CircaLog
**Root:** `C:\Projects\CircaLog\`
**Assigned to:** Claude Code
**Phase:** 0.5 — Circadian Engine (Foundational Decisions)
**Status:** 🔴 Not started

---

## Goal

Define the TypeScript interfaces and enums that form CircaLog's domain
model. These types are the shared language of the entire application —
every engine function, every database layer, every UI component, and
every export format will import from this one file.

The output is a single file: `src/lib/circadian/types.ts`

No logic. No database calls. No React. Pure TypeScript type definitions.

---

## Prerequisites — Read Before Starting

Two strategy documents have already been decided and written. Read both
before writing a single line of types. They define exact field names,
types, and constraints that must be reflected precisely in the interfaces.

```powershell
Get-Content "C:\Projects\CircaLog\docs\timezone-strategy.md"
Get-Content "C:\Projects\CircaLog\docs\cycle-number-strategy.md"
```

Key facts to carry into the types:

**From `timezone-strategy.md`:**
- Sleep timestamps are stored as ISO 8601 UTC strings
- Exact field names: `sleepStartUtc`, `wakeUtc`
- Timezone field: `ianaTimezone` (string, IANA name e.g. `"Africa/Cairo"`)
- Do not use `startTime`, `endTime`, `timezone`, `offset`, or any variant

**From `cycle-number-strategy.md`:**
- Cycle number field: `cycleNumber` (number, 1-based integer)
- Treated as derived — always assigned by `assignCycleNumber()`, never
  set manually by UI code
- Do not use `cycle`, `cycleId`, `index`, or any variant

---

## ⚠️ Rules for This Task

- **Read before write.** Check whether `src/lib/circadian/` exists before
  creating anything inside it (Step 1).
- **No logic.** This file contains only `type`, `interface`, and `enum`
  (or `const` enum) declarations. No functions, no classes, no imports
  from React or any library.
- **Inline comments are required** on every field whose purpose is not
  immediately obvious from its name alone. Mahmoud is learning TypeScript
  and will be reading this file regularly.
- **Framework-independent.** Nothing in this file should ever need to
  change because of a React, Vite, or Tailwind update.
- **Database-independent.** Field names here are the canonical names.
  The IndexedDB layer and the Supabase layer will map to these — not the
  other way around.
- **Stop on any ambiguity.** If a field's type or optionality is unclear,
  stop and report the question before guessing.

---

## Step 1 — Pre-flight: Check Directory and File State

Run the following:

```powershell
Test-Path "C:\Projects\CircaLog\src\lib\circadian"
Test-Path "C:\Projects\CircaLog\src\lib\circadian\types.ts"
```

**If the directory does not exist**, create it:

```powershell
New-Item -ItemType Directory -Force -Path "C:\Projects\CircaLog\src\lib\circadian"
```

**If `types.ts` already exists**, read its contents and report them to
Claude.ai before proceeding. Do not overwrite without review.

Also confirm the `src/types/` directory contains only a `.gitkeep`:

```powershell
Get-ChildItem "C:\Projects\CircaLog\src\types"
```

The domain model lives in `src/lib/circadian/types.ts`, not in
`src/types/`. The `src/types/` directory is reserved for future
app-level (non-engine) types.

---

## Step 2 — Write `src/lib/circadian/types.ts`

Create the file with the following exact content. Do not paraphrase,
reorder, or add fields not listed here. If a field seems missing,
report it rather than inventing it.

```typescript
/**
 * CircaLog — Circadian Engine Domain Model
 *
 * This file is the single source of truth for all domain types used
 * across the engine, database layers, UI components, and exports.
 *
 * Rules:
 *   - No logic, no functions, no classes — types and enums only.
 *   - No imports from React, libraries, or other project files.
 *   - Field names here are canonical. All other layers map to these.
 *   - See docs/timezone-strategy.md and docs/cycle-number-strategy.md
 *     for the decisions behind the timestamp and cycle number fields.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/**
 * Whether a sleep session is a main sleep or a nap.
 * Determined automatically by detectSessionType() based on duration.
 * Sessions under 3 hours are classified as naps; 3 hours or more are
 * classified as main sleep. Users cannot set this manually in V1.
 */
export type SessionType = 'main' | 'nap';

/**
 * The five-point quality scale used to rate a sleep session.
 * Stored as a number so it can be averaged and plotted directly.
 * 1 = very poor, 5 = excellent.
 */
export type QualityRating = 1 | 2 | 3 | 4 | 5;

/**
 * Reasons a sleep session was interrupted.
 * A single session can have multiple interruptions of different types.
 */
export type InterruptionType =
  | 'bathroom'
  | 'thirst'
  | 'hunger'
  | 'pain'
  | 'other';

/**
 * When a medication was taken relative to the sleep session.
 */
export type MedicationTiming = 'before' | 'during' | 'after';

// ---------------------------------------------------------------------------
// Supporting value types
// ---------------------------------------------------------------------------

/**
 * A single interruption event within a sleep session.
 * Sessions can have zero or more interruptions.
 */
export interface Interruption {
  /** What caused the interruption. */
  type: InterruptionType;

  /** Free-text detail, optional. Used when type is 'other' or for notes. */
  note?: string;
}

/**
 * A medication or supplement taken in relation to a sleep session.
 */
export interface Medication {
  /** Name of the medication or supplement (e.g. "Melatonin 3mg"). */
  name: string;

  /** When relative to the sleep session it was taken. */
  timing: MedicationTiming;
}

// ---------------------------------------------------------------------------
// Core domain type
// ---------------------------------------------------------------------------

/**
 * A single sleep session — the fundamental unit of data in CircaLog.
 *
 * Timestamp fields:
 *   - All times are stored as ISO 8601 UTC strings (e.g. "2026-04-28T23:30:00.000Z").
 *   - ianaTimezone records where the user was when the entry was saved,
 *     so that local time can always be correctly derived for display,
 *     including across timezone travel and DST transitions.
 *   - See docs/timezone-strategy.md for the full rationale.
 *
 * Cycle number:
 *   - cycleNumber is derived, not authoritative. It is assigned by
 *     assignCycleNumber() and must never be set manually by UI code.
 *   - See docs/cycle-number-strategy.md for the full rationale.
 */
export interface SleepEntry {
  // ── Identity ──────────────────────────────────────────────────────────────

  /**
   * Unique identifier for this entry.
   * Generated as a UUID (crypto.randomUUID()) at the time of creation.
   * Stable across IndexedDB and Supabase — used as the sync key in V2.
   */
  id: string;

  // ── Timestamps ────────────────────────────────────────────────────────────

  /** Sleep start time, stored as an ISO 8601 UTC string. */
  sleepStartUtc: string;

  /** Wake time, stored as an ISO 8601 UTC string. */
  wakeUtc: string;

  /**
   * IANA timezone name at the time this entry was saved
   * (e.g. "Africa/Cairo", "Asia/Manila").
   * Used to derive the correct local time for actogram rendering and
   * history display. Obtained automatically from
   * Intl.DateTimeFormat().resolvedOptions().timeZone — never entered
   * manually by the user.
   */
  ianaTimezone: string;

  // ── Derived fields ────────────────────────────────────────────────────────

  /**
   * 1-based cycle number. Assigned by assignCycleNumber() after every
   * insert, back-fill, delete, or start-time edit. Treated as a
   * pre-computed cache — the sort order of sleepStartUtc is always
   * the authoritative source.
   */
  cycleNumber: number;

  /**
   * Whether this session is a main sleep or a nap.
   * Assigned automatically by detectSessionType() based on duration.
   * Sessions under 3 hours → 'nap'. 3 hours or more → 'main'.
   */
  sessionType: SessionType;

  // ── Required user-entered fields ──────────────────────────────────────────

  /**
   * User's self-reported sleep quality. Required at save time.
   * 1 = very poor, 5 = excellent.
   */
  quality: QualityRating;

  // ── Optional user-entered fields ─────────────────────────────────────────

  /** Free-text notes about the session. Optional. */
  notes?: string;

  /**
   * Whether the user experienced dreams or nightmares.
   * true = yes, false = no, undefined = not answered.
   */
  hadDreams?: boolean;

  /** Free-text description of dreams or nightmares, if hadDreams is true. */
  dreamNotes?: string;

  /**
   * Interruptions that occurred during this session.
   * Empty array means no interruptions were logged.
   * Undefined means the user did not engage with the interruptions field.
   */
  interruptions?: Interruption[];

  /**
   * Medications or supplements taken in relation to this session.
   * Empty array means none were logged.
   * Undefined means the user did not engage with the medication field.
   */
  medications?: Medication[];

  // ── Soft delete ───────────────────────────────────────────────────────────

  /**
   * Soft-delete flag. When true, the entry is excluded from all engine
   * calculations and UI views but is retained in the database.
   * Hard deletion (permanent removal) is a separate, explicit operation.
   * Matches the is_deleted column pattern already used in the Supabase schema.
   */
  isDeleted: boolean;

  // ── Record-keeping ────────────────────────────────────────────────────────

  /**
   * ISO 8601 UTC string recording when this entry was first created.
   * Set once at creation; never updated.
   */
  createdAt: string;

  /**
   * ISO 8601 UTC string recording when this entry was last modified.
   * Updated on every edit, including cycle number reassignment.
   */
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Aggregate / computed types
// ---------------------------------------------------------------------------

/**
 * A group of SleepEntry records that share the same cycle number.
 * Used by groupEntriesByCycle() to structure data for the actogram
 * and history view.
 *
 * Most cycles contain exactly one entry (a single main sleep session).
 * Cycles with a nap in addition to main sleep will contain two entries.
 * Fragmented nights may produce more.
 */
export interface Cycle {
  /** The cycle number shared by all entries in this group. */
  cycleNumber: number;

  /**
   * All SleepEntry records belonging to this cycle, sorted by
   * sleepStartUtc ascending.
   */
  entries: SleepEntry[];

  /**
   * The calendar date of the main sleep onset in this cycle,
   * expressed in the ianaTimezone of the primary entry.
   * ISO 8601 date string (YYYY-MM-DD). Used for the secondary
   * date label on the actogram X-axis.
   */
  calendarDate: string;
}

// ---------------------------------------------------------------------------
// Engine return types
// ---------------------------------------------------------------------------

/**
 * The result of estimateFreeRunningPeriod().
 *
 * Returns 'pending' when fewer than 14 entries are available — the
 * minimum required for a statistically meaningful linear regression.
 * Returns the estimated period in decimal hours once the threshold
 * is met (e.g. 24.83 means a ~24h 50min free-running cycle).
 */
export type FreeRunningPeriodResult =
  | { status: 'pending'; reason: string }
  | { status: 'calculated'; periodHours: number; entryCount: number };

/**
 * The result of calculateDrift().
 * Drift is expressed as minutes per cycle — how many minutes later
 * (positive) or earlier (negative) each successive sleep onset falls
 * relative to the previous one, on average.
 */
export interface DriftResult {
  /** Average drift in minutes per cycle. Positive = drifting later. */
  minutesPerCycle: number;

  /** Number of entries used in the calculation. */
  entryCount: number;
}

/**
 * Rolling average statistics computed over a sliding time window.
 * Returned by calculateRollingAverages().
 */
export interface RollingAverages {
  /** Window size in days (e.g. 7 or 30). */
  windowDays: number;

  /** Average sleep duration in minutes across the window. */
  avgDurationMinutes: number;

  /** Average quality rating (1–5) across the window. */
  avgQuality: number;

  /** Number of entries that fell within the window. */
  entryCount: number;
}
```

---

## Step 3 — Verify the Written File

Read the file back immediately after writing:

```powershell
Get-Content "C:\Projects\CircaLog\src\lib\circadian\types.ts"
```

Confirm all of the following:

- ✅ File exists at `src/lib/circadian/types.ts`
- ✅ No imports from React, any library, or any other project file
- ✅ Field names `sleepStartUtc`, `wakeUtc`, `ianaTimezone` are present
  exactly as specified — no variants
- ✅ Field name `cycleNumber` is present exactly as specified — no variants
- ✅ `isDeleted` field is present on `SleepEntry`
- ✅ `createdAt` and `updatedAt` fields are present on `SleepEntry`
- ✅ `FreeRunningPeriodResult` is a discriminated union with `'pending'`
  and `'calculated'` variants
- ✅ `SessionType`, `QualityRating`, `InterruptionType`, `MedicationTiming`
  are all exported
- ✅ Every non-obvious field has an inline comment

Then confirm TypeScript can parse the file without errors. Run a type
check:

```powershell
npx tsc --noEmit
```

Must complete with zero errors. If there are errors in files other than
`types.ts` that pre-existed this task, list them in the session report
but do not fix them — they are out of scope.

---

## Step 4 — Update the TO-DO List

Open `docs/CircaLog-TO-DO-list.md`.

Find this exact block:

```markdown
- [ ] 🔴 Define TypeScript interfaces for the domain model
       - `SleepEntry`, `Cycle`, `SessionType`, `Interruption`, `Medication`, etc.
       - Lives in `src/lib/circadian/types.ts`
       - Framework-independent, database-independent
```

Replace it with:

```markdown
- [x] 🔴 Define TypeScript interfaces for the domain model
       (SleepEntry, Cycle, SessionType, QualityRating, InterruptionType,
       MedicationTiming, Interruption, Medication, FreeRunningPeriodResult,
       DriftResult, RollingAverages — all in src/lib/circadian/types.ts)
```

Read the TO-DO file back after saving to confirm the replacement is
correct and surrounding items are unchanged.

---

## Step 5 — Write the Session Report

Write a Markdown session report and save it to `tasks/cc-reports/`
using this filename:

```text
REPORT_phase0-5-domain-types_<DD>-<mon>-<YYYY>.md
```

Replace `<DD>-<mon>-<YYYY>` with today's actual date (e.g. `30-may-2026`).

The report must include:

- Every step and its outcome (✅ succeeded / ❌ failed / ⚠️ adapted)
- Whether `src/lib/circadian/` had to be created or already existed
- TypeScript check result — zero errors, or a list of any pre-existing
  errors that were out of scope
- The full list of types and interfaces exported from `types.ts`
- Deviations — any step where these instructions were not followed
  exactly, and the reason why
- Final file list — every file created or modified in this session
  (should be exactly two: `src/lib/circadian/types.ts` and
  `docs/CircaLog-TO-DO-list.md`)

**Markdownlint rules — zero warnings allowed:**

- Every fenced code block must have a blank line before the opening fence
- Every fenced code block must have a blank line after the closing fence
- This applies even when a label line immediately precedes a block —
  always insert a blank line between the label and the opening fence

After writing the report, paste a short summary into the Claude.ai chat
and **wait for confirmation** before running the git commit.

---

## Step 6 — Commit

Only run this after Claude.ai has confirmed the session report:

```powershell
git add src/lib/circadian/types.ts docs/CircaLog-TO-DO-list.md tasks/cc-reports/
git commit -m "feat: Phase 0.5 domain model — SleepEntry and circadian engine types"
```

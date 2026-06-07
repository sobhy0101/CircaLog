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
 *
 * Used only on the inline `medications` field of `SleepEntry` (V1 legacy).
 * The V2 medication system is a separate linked model — see `MedicationDefinition`,
 * `MealDefinition`, `DoseLogEntry`, and `MealLogEntry` at the bottom of this file.
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
 *
 * ⚠️  V1 legacy inline field — kept for backward compatibility.
 * The V2 medication system replaces free-text name entry with a
 * user-configured library (`MedicationDefinition`) and a separate
 * per-dose log (`DoseLogEntry`). Do NOT extend this interface;
 * new fields belong on `MedicationDefinition` or `DoseLogEntry`.
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

// ---------------------------------------------------------------------------
// V2 — Medication & Meal Library + Daily Log Types
// ---------------------------------------------------------------------------
//
// Architecture note
// -----------------
// Non-24 breaks the link between clock-time medication schedules and
// biological readiness (eating, sleeping). A patient who woke at 5 PM
// has already missed two anchor points (10 AM and a post-lunch dose)
// and must now reason about food gaps, sleep gaps, and the next valid
// window—all simultaneously.
//
// The model here separates three concerns:
//   1. MedicationDefinition — the user’s one-time-configured library of
//      medications, each with its prescribed schedule and food/sleep rules.
//   2. MealDefinition — the user’s named meal slots (e.g. “Breakfast”,
//      “Lunch”), with an optional ideal clock-time anchor.
//   3. DoseLogEntry / MealLogEntry — the daily record of what actually
//      happened: when a dose was taken (or missed/skipped), and when a
//      meal was eaten.
//
// On the logging screen, the user taps a medication from a pre-populated
// list, enters the actual time taken, and the app computes compliance
// against the configured rules. No free-text typing of drug names.
//
// Supabase tables (V2): medication_definitions, meal_definitions,
//   dose_log_entries, meal_log_entries.
// IndexedDB stores (V2): same four names, synced on connect.
// ---------------------------------------------------------------------------

/**
 * How a medication relates to food timing.
 *
 * - `with_food`    — must be taken during or immediately after a meal.
 * - `after_food`   — must be taken after food is in the stomach (e.g. 30 min
 *                     after eating).
 * - `before_food`  — must be taken on an empty stomach (e.g. 30–60 min
 *                     before eating).
 * - `independent`  — no food restriction.
 */
export type FoodRelationship =
  | 'with_food'
  | 'after_food'
  | 'before_food'
  | 'independent';

/**
 * What to do when a scheduled dose is late or missed.
 *
 * - `skip`       — if the window has passed, skip entirely; never double-dose.
 * - `take_late`  — take it late within the same cycle if safe to do so.
 * - `ask`        — flag it and let the user decide.
 */
export type MissedDoseAction = 'skip' | 'take_late' | 'ask';

/**
 * The status of a single dose in `DoseLogEntry`.
 *
 * - `taken`    — taken at the recorded time.
 * - `missed`   — the scheduled window passed without a dose.
 * - `skipped`  — intentionally omitted (user-confirmed, e.g. doctor-advised).
 */
export type DoseStatus = 'taken' | 'missed' | 'skipped';

/**
 * One medication or supplement in the user’s personal library.
 *
 * Configured once at setup; each entry generates daily dose log rows.
 * Linked to `DoseLogEntry` via `medicationId`.
 */
export interface MedicationDefinition {
  // ── Identity ─────────────────────────────────────────────────────────────────────

  /** UUID, stable across IndexedDB and Supabase. */
  id: string;

  /** Display name shown in all log and report screens (e.g. "Metformin 500mg"). */
  name: string;

  // ── Schedule ───────────────────────────────────────────────────────────────────

  /**
   * Prescribed dose times, expressed as local HH:MM strings
   * (e.g. ["10:00", "16:00", "22:00"]).
   *
   * Stored as clock-time strings, not UTC, because a prescription
   * says "10 AM" regardless of timezone. The engine converts to UTC
   * at log time using the user’s current ianaTimezone.
   */
  scheduledTimes: string[];

  /**
   * Acceptable window around each scheduled time, in minutes.
   * A dose taken within ±windowMinutes of the scheduled time is
   * considered on-time. Default: 60.
   */
  windowMinutes: number;

  // ── Food & sleep rules ──────────────────────────────────────────────────────

  /** Relationship to food. See `FoodRelationship` for semantics. */
  foodRelationship: FoodRelationship;

  /**
   * How long before or after food this medication should be taken,
   * in minutes. Interpreted with `foodRelationship`:
   *   - `before_food`: take at least N minutes before eating.
   *   - `after_food`: take at least N minutes after eating.
   *   - `with_food` / `independent`: field is ignored.
   * Optional; defaults to 0 when not clinically specified.
   */
  foodGapMinutes?: number;

  /**
   * Minimum gap between the dose and the next sleep onset, in minutes.
   * Protects against taking a stimulating medication too close to
   * bedtime (or a sedating one too far from it).
   * Optional; omit when there is no sleep-proximity restriction.
   */
  minGapBeforeSleepMinutes?: number;

  // ── Missed-dose policy ─────────────────────────────────────────────────────

  /** What to do when a scheduled window is missed. */
  missedDoseAction: MissedDoseAction;

  // ── State ───────────────────────────────────────────────────────────────────────

  /**
   * When false, this medication is excluded from all log prompts and
   * reports. Allows a user to retire a medication without deleting its
   * history. Matches the `is_deleted` soft-delete pattern on SleepEntry.
   */
  isActive: boolean;

  // ── Record-keeping ───────────────────────────────────────────────────────────

  /** ISO 8601 UTC. Set once at creation. */
  createdAt: string;

  /** ISO 8601 UTC. Updated on every edit. */
  updatedAt: string;
}

/**
 * One named meal slot in the user’s meal library.
 *
 * Keeps the list short and user-defined (e.g. "Breakfast", "Lunch",
 * "Dinner", "Late Snack"). The user picks from this list when logging
 * a meal rather than typing a description each time.
 *
 * Linked to `MealLogEntry` via `mealId`.
 */
export interface MealDefinition {
  /** UUID, stable across IndexedDB and Supabase. */
  id: string;

  /**
   * Display label (e.g. "Breakfast", "Lunch", "Dinner").
   * User-defined; there are no system-enforced names.
   */
  label: string;

  /**
   * Typical clock time for this meal, expressed as a local HH:MM string
   * (e.g. "07:30").
   * Optional. Used only as a soft UI hint; never used for compliance
   * calculations (because Non-24 makes typical meal times irrelevant).
   */
  typicalTime?: string;

  /** When false, excluded from log prompts. Soft-retire without history loss. */
  isActive: boolean;

  /** ISO 8601 UTC. Set once at creation. */
  createdAt: string;

  /** ISO 8601 UTC. Updated on every edit. */
  updatedAt: string;
}

/**
 * A single dose event in the daily medication log.
 *
 * Created automatically (as `missed`) for every scheduled dose that
 * passes without a user action, and updated to `taken` or `skipped`
 * when the user logs it. This gives the doctor report a complete
 * compliance picture, not just a list of taken doses.
 *
 * Linked to `MedicationDefinition` via `medicationId`.
 * Optionally linked to a `SleepEntry` via `sleepEntryId` when the dose
 * is logged in the context of a sleep/wake session.
 */
export interface DoseLogEntry {
  /** UUID. */
  id: string;

  /** References `MedicationDefinition.id`. */
  medicationId: string;

  /**
   * The clock-time the dose was scheduled for, copied from
   * `MedicationDefinition.scheduledTimes` at row-creation time.
   * Stored as ISO 8601 UTC so it can be compared directly to
   * `actualTimeUtc`.
   */
  scheduledTimeUtc: string;

  /** Status of this dose. */
  status: DoseStatus;

  /**
   * The UTC time the dose was actually taken.
   * Null when `status` is `missed` or `skipped`.
   */
  actualTimeUtc: string | null;

  /**
   * Optional link to the sleep session this dose was logged against.
   * Enables sleep–medication correlation in the Insights view.
   */
  sleepEntryId?: string;

  /** Free-text note (e.g. "felt nauseous, took half dose"). Optional. */
  note?: string;

  /** ISO 8601 UTC. Set once at creation. */
  createdAt: string;

  /** ISO 8601 UTC. Updated on every edit. */
  updatedAt: string;
}

/**
 * A single meal event in the daily meal log.
 *
 * The user picks a `MealDefinition` from their library and records the
 * actual time they ate. This gives the medication engine the food anchor
 * it needs to evaluate food-gap compliance (e.g. "Metformin requires
 * food; last meal was 4 hours ago — window is valid").
 *
 * Linked to `MealDefinition` via `mealId`.
 */
export interface MealLogEntry {
  /** UUID. */
  id: string;

  /** References `MealDefinition.id`. */
  mealId: string;

  /** The UTC time the meal was eaten. */
  eatenAtUtc: string;

  /** Free-text note (e.g. "only had a small snack"). Optional. */
  note?: string;

  /** ISO 8601 UTC. Set once at creation. */
  createdAt: string;

  /** ISO 8601 UTC. Updated on every edit. */
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Sync infrastructure
// ---------------------------------------------------------------------------

/**
 * A lightweight record in the local `syncQueue` IndexedDB store.
 *
 * When a SleepEntry is written to IndexedDB while the user is offline
 * (or the Supabase upsert fails for any reason), its id is added to this
 * queue. The sync service reads this queue when connectivity is restored
 * and retries the upsert for each queued id.
 *
 * The queue stores only the entry id — not a copy of the entry itself.
 * The sync service fetches the current entry from IndexedDB at flush time,
 * so the pushed version is always the latest local state.
 *
 * `id` here is the SleepEntry UUID (the sync key shared between
 * IndexedDB and Supabase).
 */
export interface SyncQueueEntry {
  /** The SleepEntry UUID that needs to be pushed to Supabase. */
  id: string;

  /** ISO 8601 UTC — when this entry was added to the queue. */
  queuedAt: string;
}

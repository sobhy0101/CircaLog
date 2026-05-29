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

# CircaLog — Cycle Number Strategy

**Status:** Decided
**Decided:** 30 May 2026
**Applies to:** All sleep entries — IndexedDB schema, engine functions,
actogram rendering, history view, export formats

---

## Decision

Every sleep entry stores a `cycleNumber` field. This field is **derived,
not authoritative** — it is a pre-computed convenience cache whose value
is always determined by sort order, never by the field itself.

The source of truth for cycle number is always the ascending sort order of
`sleepStartUtc` across all entries. If the stored `cycleNumber` on any
entry ever conflicts with what the sort order dictates, the sort order
wins and the stored value is corrected.

---

## What a Cycle Number Is

CircaLog tracks sleep in cycles, not calendar days. A cycle is one sleep
episode (the sleep period plus the wake period that follows it). Cycle 1
is the first logged entry, cycle 2 is the second, and so on. The sequence
is always gapless: 1, 2, 3 … N.

The actogram's X-axis is built on cycle numbers. The drift pattern —
the diagonal band sliding across the chart — is only visible because
the cycle number is the unit of horizontal progression, not the calendar
date. Calendar date appears as a secondary label on the same axis.

---

## Why Store It at All

The history view and actogram need to query by cycle number efficiently.
"Give me cycles 40 through 60" is a direct, indexed database lookup when
`cycleNumber` is a stored field. Without it, the app would have to load
all entries, sort them in memory, and slice — correct, but increasingly
slow as years of back-filled data accumulate.

Storing `cycleNumber` makes these queries fast at any dataset size.

## Why Treat It as Derived

`cycleNumber` is not the source of truth because any insert, delete, or
back-fill can change what a cycle number should be. If the field were
treated as authoritative, a back-filled entry landing in the middle of
the timeline would leave every subsequent entry with a stale number, and
no mechanism would exist to detect or correct the inconsistency.

By treating it as derived, the contract is simple: after any mutation,
run `assignCycleNumber()` and the field is correct again.

---

## The `assignCycleNumber()` Function

Lives in `src/lib/circadian/assignCycleNumber.ts`.

**Signature (TypeScript):**

```typescript
function assignCycleNumber(entries: SleepEntry[]): SleepEntry[]
```

**Behaviour:**

1. Sorts the input array by `sleepStartUtc` ascending
2. Assigns `cycleNumber = index + 1` to each entry (1-based)
3. Returns the updated array

**Idempotent:** Running it multiple times on the same data always
produces the same result. If it runs twice due to a bug or retry, no
corruption occurs.

**Does not write to the database itself.** The caller is responsible for
persisting the returned entries. This keeps the function pure and
testable without a database.

---

## When Re-Assignment Runs

Re-assignment must run after every mutation that can change the sort
order or the count of entries.

### After a new insert

A new entry is added (real-time log or back-fill of a single entry).

- If the new entry's `sleepStartUtc` is later than all existing entries
  (the common case for real-time logging), only the new entry needs a
  cycle number assigned. Existing entries are unaffected.
- If the new entry's `sleepStartUtc` falls before any existing entry
  (back-fill into the middle or start of the timeline), all entries from
  that point forward need their cycle numbers incremented by one.
- In practice, run `assignCycleNumber()` on the full dataset after every
  insert. The function is fast enough that the distinction above is an
  optimisation for later, not a requirement for V1.

### After a back-fill of multiple entries

Multiple historical entries are inserted in one operation.

- Run `assignCycleNumber()` on the full dataset once after all insertions
  are complete — not once per entry. One pass is sufficient and avoids
  redundant writes.

### After a delete

An entry is deleted.

- The sequence must remain gapless. All entries after the deleted entry
  shift down by one.
- Run `assignCycleNumber()` on the full dataset after the delete.
- **Rationale for renumbering:** Gaps on the actogram X-axis would
  appear as missing data to a clinician reading a doctor report. Since
  cycle numbers are internal identifiers (not shared externally in V1),
  renumbering after delete has no side effects. Once doctor reports and
  exports exist (V2), any export should be considered a snapshot — it
  captures cycle numbers at the time of export and makes no claim about
  future stability.

### After an edit that changes `sleepStartUtc`

If a user edits an entry and moves its start time to a different position
in the timeline, the sort order may change.

- Run `assignCycleNumber()` on the full dataset after the edit.
- Edits that change only quality rating, notes, or other non-timestamp
  fields do not affect cycle numbers and do not require re-assignment.

---

## Field Name

Use `cycleNumber` exactly — in the TypeScript `SleepEntry` interface,
the IndexedDB object store, and all export formats. Do not use `cycle`,
`cycleId`, `index`, or any other variant.

---

## Scope

This strategy applies to:

- The `SleepEntry` TypeScript interface (`src/lib/circadian/types.ts`)
- The `assignCycleNumber()` engine function (`src/lib/circadian/`)
- The IndexedDB object store schema (Sleep Log task, Phase 1)
- Actogram X-axis rendering
- History list view (cycle number column)
- All export formats (CSV, JSON, PDF)

---

## What This Document Does Not Cover

- Timestamp storage and timezone handling → see `docs/timezone-strategy.md`
- IndexedDB schema definition → Sleep Log task, Phase 1
- Supabase column definitions → V2 sync task

---

## Relationship to `docs/timezone-strategy.md`

The sort order that determines cycle numbers is based on `sleepStartUtc`
(UTC). The cycle number itself carries no timezone information. Timezone
context is stored separately in `ianaTimezone` and used only for display.
These two concerns are fully independent.

---

*This decision was made on 30 May 2026 and is not open for revision
without an explicit ADR (Architecture Decision Record) superseding it.*

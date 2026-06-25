# CircaLog — Multi-Device Sync Conflict Strategy

**Status:** Decided
**Decided:** 25 Jun 2026
**Applies to:** Bidirectional Supabase sync (`src/lib/supabase/syncService.ts`)

---

## Decision

When the same `SleepEntry` has been modified on two devices while one or
both were offline, **the version with the later `updatedAt` timestamp
wins**. This is last-write-wins conflict resolution, implemented in
`syncOnConnect()`.

No entry is ever silently discarded. The losing version is simply not
written anywhere — it was already superseded by a later edit before the
two devices ever talked to each other again.

---

## Why Last-Write-Wins

CircaLog is a single-user, personal health-tracking tool. The realistic
conflict scenario is one person editing the same entry from two of their
own devices (phone and laptop, say) while one was offline — not two
different people racing to edit the same record. A simple, predictable
rule is more valuable here than a merge UI the user would rarely see and
would have to understand under stress (mid-edit, away from their data).

The alternative — a three-way merge or a "keep both, let the user pick"
flow — adds meaningful UI and engine complexity for a conflict pattern
that, for this app's actual usage, is rare and low-stakes (a sleep log
entry, not a financial transaction).

---

## How It Works

On every `syncOnConnect()` (sign-in, or app load with an existing
session):

1. Pull all of this user's entries from Supabase.
2. Load all local IndexedDB entries.
3. For each entry that exists on both sides, compare `updatedAt`:
   - Remote newer → the remote version replaces the local copy.
   - Local newer → the local version is queued to push up to Supabase.
   - Identical → already in sync, no action.
4. For each entry that exists on only one side, it is copied to the
   other side (no data is missing on either device after a sync).
5. `assignCycleNumber()` re-runs across the full merged set, since a
   newly-arrived entry can change cycle numbering.

This is a full reconciliation, not an incremental diff — it runs the
same way whether the gap since the last sync was five minutes or five
months.

---

## Soft Deletes Are Just Edits

A soft-delete (`isDeleted: true`) bumps `updatedAt` like any other edit.
There is no special-cased delete handling in the merge — if Device A
deletes an entry and Device B edits a different field on the same entry
*after* the delete, Device B's edit (not deleted) wins on the next sync,
because its `updatedAt` is later. The deletion intent is overridden, but
no data is destroyed — this is the same last-write-wins rule applied
consistently, not an exception to it.

---

## Known, Accepted Limitation: Identical-Timestamp Collisions

If two devices produce the exact same `updatedAt` millisecond for
genuinely different content on the same entry, the merge currently takes
no action (treats them as already in sync) and one version is silently
preferred by whichever happened to be in IndexedDB locally. Given ISO
8601 millisecond precision and that the realistic conflict window is a
single person on two of their own devices, this is judged exceedingly
unlikely and not worth the added complexity of a secondary tie-break
(e.g. content hashing or device-id ordering). Revisit only if it is
ever observed in practice.

---

## What This Document Does Not Cover

- Field-level merging (e.g. combining notes from both versions) — not
  implemented; the whole entry is replaced as a unit.
- Conflict resolution for the V2 medication/meal log tables — those
  follow the same pattern when implemented, but are out of scope here.
- Sync write rejection handling (RLS errors, quota, etc.) and auth
  token refresh — see `tasks/CC_TASK_Phase1_AuthSyncHardening.md` and
  the inline comments in `syncService.ts`.

---

*This decision was made on 25 Jun 2026 and is not open for revision
without an explicit ADR superseding it.*

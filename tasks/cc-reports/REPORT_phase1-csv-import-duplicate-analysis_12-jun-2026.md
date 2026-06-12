# Duplicate Data Analysis — CSV Import

**Date:** 12 Jun 2026
**Status:** Supabase currently at 0 records (wiped via MCP). IDB state unknown.
**Relates to:** `tasks/CC_TASK_Phase1_CSVImport.md`

---

## Summary

Three separate cleanup+import attempts produced 21, then 50 records in Supabase
instead of the expected 14. The root cause is a combination of two independent
design gaps in the import and sync systems that interact badly when cleanup is
done in the wrong order.

---

## Root Causes

### RC-1 — Each import creates entries with fresh UUIDs

`createEntry` (in `sleepEntryService.ts`) calls `crypto.randomUUID()` for every
new entry. The import duplicate check in `useImport.ts` is:

```typescript
const existing = await db.sleepEntries
  .where('sleepStartUtc')
  .equals(row.draft.sleepStartUtc)
  .count()
```

This check is **IDB-only**. It correctly prevents re-importing a row that is
already in the local database. But if IDB was cleared between two import rounds
(intentionally or by "Clear site data"), the check passes and 14 brand-new
UUIDs are written — even though logically identical entries already exist in
Supabase under the old UUIDs.

**Consequence:** Two sets of entries for the same sleep sessions now exist in
Supabase under different IDs. `syncOnConnect` merges by ID, so both sets survive
the merge and the count doubles.

### RC-2 — syncOnConnect is a one-way ratchet when IDB has data

The merge logic in `syncOnConnect`:

1. Pull all entries for this user from Supabase.
2. For each local IDB entry with no remote counterpart → push it to Supabase.

Step 2 means: **"delete from Supabase" is not a permanent operation as long as
IDB has data.** The next page refresh (which triggers `INITIAL_SESSION` →
`syncOnConnect`) restores everything from IDB. This is the correct behaviour for
an offline-first app — but it means that to clean Supabase you must also clean
IDB, and you must do so before the app can sync.

### RC-3 — The cleanup sequence always left a window open

Every cleanup attempt had a window where the app was signed in with data in one
store but not the other:

| Attempt | What happened |
|---|---|
| Round 1 | Opened local dev app → signed in → `syncOnConnect` pushed old fake data to Supabase. Wiped local IDB after the push had already happened. Supabase retained the fake data. |
| Round 2 | Wiped Vercel IDB and Supabase. But the Vercel app was still open and signed in while Supabase had fake data → `syncOnConnect` pulled fake data into Vercel IDB. Then Supabase was wiped. Then import added 14 new UUIDs on top of the 7 fake entries already in Vercel IDB → 21 in Supabase. |
| Round 3 | Deleted 21 from Supabase alone, leaving Vercel IDB intact. Page refresh → `syncOnConnect` pushed all 21 from IDB back to Supabase. Happened multiple times across refreshes → count escalated to 50. |

**The invariant that must be maintained:** Supabase and IDB must be wiped
simultaneously, with no signed-in app instance running between the two wipes.

---

## Solutions Attempted

| Action | Outcome | Why it failed |
|---|---|---|
| Delete from Supabase manually | Records returned after next page refresh | Vercel IDB still had data; `syncOnConnect` pushed it back |
| Clear Vercel IDB manually | IDB refilled from Supabase on next sync | App was already signed in when IDB was cleared; `syncOnConnect` pulled from Supabase |
| Delete from Supabase via MCP (12 Jun) | Supabase now at 0 ✅ | Pending: Vercel IDB must also be cleared before any refresh |

---

## How to Avoid This in Future

### Operational rule (for manual resets)

Always follow this exact order — no deviation:

1. **Wipe Supabase first** (via MCP or Supabase dashboard).
2. **Immediately, before any page refresh:** open DevTools → Application →
   Storage → **"Clear site data"**. This wipes IDB, localStorage, cookies, and
   the Supabase auth session in one atomic click.
3. Refresh → sign in → import.

Enabling airplane mode before step 2 is a safe alternative if "Clear site data"
feels risky — it prevents `syncOnConnect` from reaching Supabase while IDB is
still populated.

Never delete from only one store. Never refresh a signed-in app between the two
wipes.

### Code-level fix (recommended for V1 before public release)

The import duplicate check must also cover Supabase, not just IDB. There are
two approaches:

**Option A — Deterministic UUIDs (preferred)**

Derive the entry ID from the content rather than calling `crypto.randomUUID()`.
A stable hash of `userId + sleepStartUtc` produces the same UUID every time for
the same sleep session. Supabase's `upsert` on `id` then naturally deduplicates
regardless of how many times the CSV is imported, on any device, with or without
IDB data.

Pros: Solves RC-1 permanently. Simple. No extra network round-trip per row.
Cons: Requires changing how IDs are generated in `createEntry`, which is a
broader change that touches the sync system.

**Option B — Supabase pre-check during import (simpler short-term)**

In `startImport`, before writing each row, also query Supabase by
`sleep_start_utc` in addition to the IDB check. If a match exists in either
store, skip the row.

Pros: Surgical change confined to `useImport.ts`.
Cons: Adds one Supabase query per row (14 round-trips for a 14-row file). Slow
for large imports. Still fails when the user is offline.

---

## Current State (as of 12 Jun 2026)

| Store | Count |
|---|---|
| Supabase | **0** (wiped via MCP at ~21:00 on 12 Jun) |
| Vercel IDB | Unknown — almost certainly still has 50 entries |

---

## Next Step to Fix This Once and for All

**Do this immediately, in order:**

1. In the Vercel browser tab, open DevTools (F12).
2. Application tab → Storage (left sidebar) → click **"Clear site data"**.
   - This clears Vercel IDB (all 50 entries gone), localStorage, and the auth
     session cookie simultaneously, before `syncOnConnect` can run.
3. Close DevTools. The page will show you as signed out.
4. Sign in with Google.
   - `syncOnConnect` fires. IDB = 0, Supabase = 0. Nothing to sync.
5. Go to Import → select `CircaLog-sleep-log-export.csv`.
6. Preview table shows 14 rows, all Ready. Confirm import.
7. Verify: 14 entries in the History view. Check Supabase — should show exactly
   14 rows.

Once this succeeds, the data is clean. Do not open the local dev environment
while signed in until a code-level fix (Option A or B above) is implemented.

---

## Files Referenced

| File | Relevance |
|---|---|
| `src/hooks/useImport.ts` | IDB-only duplicate check (RC-1) |
| `src/lib/supabase/syncService.ts` | `syncOnConnect` — the one-way ratchet (RC-2) |
| `src/lib/db/sleepEntryService.ts` | `createEntry` — generates random UUIDs |
| `C:\Users\sobhy\OneDrive\CircaLog-sleep-log-export.csv` | The 14-row import file |

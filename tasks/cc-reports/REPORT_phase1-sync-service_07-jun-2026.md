# REPORT: Phase 1 — Bidirectional Sync Service (IndexedDB ↔ Supabase)

**Date:** 07 Jun 2026
**Branch:** main
**Prerequisite:** `REPORT_phase1-auth-google-signin_07-jun-2026.md`

---

## Summary

Implemented the full bidirectional sync architecture between IndexedDB (Dexie)
and Supabase. All 12 steps completed successfully. The build is clean and the
app loads without console errors.

---

## Step Outcomes

| Step | Description | Outcome |
|---|---|---|
| 0 | Read project skills (run, visual-check, token-usage) | ✅ |
| 1 | Supabase SQL migration: rename `sleep_sessions` → `sleep_entries` | ✅ |
| 2 | Add `syncQueue` table to `db.ts` (Dexie v2) | ✅ |
| 3 | Add `SyncQueueEntry` type to `types.ts` + re-export from index | ✅ |
| 4 | Create `syncService.ts` | ✅ |
| 5 | Update `sleepEntryService.ts` with `user` param + sync calls | ✅ |
| 6 | Update `useAuth.ts`: migrate to `client.ts`, wire `syncOnConnect` + `flushQueue` | ✅ |
| 7 | Update `useSleepLog.ts`: pass `user` to all mutating calls | ✅ |
| 8 | Create `useSyncStatus.ts` hook | ✅ |
| 9 | Add sync status pill to `AppShell.tsx` | ✅ |
| 10 | Build check | ✅ |
| 11 | Dev server smoke test + Playwright screenshot | ✅ |
| 12 | Session report | ✅ |

---

## Step 1 — SQL Migration

Migration run via `mcp__supabase-circalog__apply_migration` as a single DDL
transaction. Verified post-migration with `information_schema.columns` query.

**All 18 expected columns confirmed present.**

Columns added: `bed_time_utc`, `iana_timezone`, `interruptions`, `medications`

Columns dropped: `local_id`, `interruption_count`, `interruption_types`,
`medication_taken`, `medication_timing`

Columns renamed: `sleep_start` → `sleep_start_utc`, `wake_time` → `wake_utc`,
`has_dreams` → `had_dreams`

RLS policy renamed from `"sleep_sessions: owner access"` to
`"sleep_entries: owner access"`.

Note: the new columns (`bed_time_utc`, `iana_timezone`, `interruptions`,
`medications`) appear after `updated_at` in column order rather than between
`had_dreams` and `is_deleted` as shown in the task's expected table. This is a
cosmetic difference only — column order has no effect on query or upsert
behaviour.

---

## Step 3 — Type Re-export

The task specified adding `SyncQueueEntry` to `types.ts` and importing it from
`@/lib/circadian` in `db.ts`. The `@/lib/circadian` index did not yet export
`SyncQueueEntry`, which would have caused a TypeScript error. The type was also
added to the re-exports in `src/lib/circadian/index.ts`.

This was a necessary deviation from the literal instructions — not adding the
re-export would have produced `TS2305: Module has no exported member
'SyncQueueEntry'`.

---

## Step 6 — `useAuth.ts` changes

- Replaced `import { supabase } from '@/lib/supabase'` (old singleton, no null
  guard) with `import { supabase } from '@/lib/supabase/client'` (null-safe).
- Added early return guard: `if (!supabase) { setIsLoading(false); return; }`
  before all Supabase calls.
- `handleOnline` and `handleVisibilityChange` use the non-null assertion
  `supabase!` inside the guard block — safe because they can only be reached
  when `supabase` is non-null (the early return above prevents registration
  when it is null).
- `signInWithGoogle` and `signOut` both now start with `if (!supabase) return`.

---

## Step 8 — `useSyncStatus` hook approach

**Used: polling (5-second interval)**

The Dexie hook API (`db.syncQueue.hook('creating', ...)`) compiles correctly in
Dexie 4.x but the unsubscribe pattern is complex (hook handles are not simple
function references). To avoid subtle cleanup bugs, the polling approach
specified in the task's fallback note was used. The 5-second interval keeps the
indicator reasonably current without being expensive.

---

## Build Output

```
✓ 667 modules transformed.
✓ built in 992ms
```

No TypeScript errors. One pre-existing chunk size warning for `index.js`
(588 kB, > 500 kB limit) — not introduced by this session.

---

## Playwright Smoke Test

- URL: `http://localhost:5173/log`
- Page title: `CircaLog` ✅
- `<html>` class: `dark` ✅
- Console errors: none ✅
- Screenshot saved: `tasks/screenshots/sync-smoke.png`

---

## Manual Verification Required (outside Playwright scope)

| # | Check | Status |
|---|---|---|
| 1 | Open side drawer → Sign in with Google | Needs Mahmoud |
| 2 | After sign-in, sync status pill shows "Synced" | Needs Mahmoud |
| 3 | Airplane mode on → add a new sleep entry | Needs Mahmoud |
| 4 | Sync pill shows "Pending sync" with pulsing dot | Needs Mahmoud |
| 5 | Restore connectivity → pill returns to "Synced" | Needs Mahmoud |
| 6 | Open Supabase Table Editor → `sleep_entries` → entry appears | Needs Mahmoud |
| 7 | Sign out → sync pill disappears | Needs Mahmoud |
| 8 | All existing CRUD operations (add, edit, delete) still work | Needs Mahmoud |

---

## Files Created

| Path | Purpose |
|---|---|
| `src/lib/supabase/syncService.ts` | Core sync logic — push, pull, merge, queue |
| `src/hooks/useSyncStatus.ts` | Hook exposing sync queue depth to the UI |

## Files Modified

| Path | Change |
|---|---|
| `src/lib/db/db.ts` | Added `syncQueue` table; bumped Dexie schema to v2 |
| `src/lib/circadian/types.ts` | Appended `SyncQueueEntry` interface |
| `src/lib/circadian/index.ts` | Added `SyncQueueEntry` to re-exports |
| `src/lib/db/sleepEntryService.ts` | Added `user` param to all mutating functions; wired `syncAfterMutation`; added `supabase` import for `hardDeleteEntry` tombstone push |
| `src/hooks/useAuth.ts` | Migrated to `@/lib/supabase/client`; added `syncOnConnect` + `flushQueue` wiring; added `INITIAL_SESSION` handling; added `online` + `visibilitychange` listeners with cleanup |
| `src/hooks/useSleepLog.ts` | Added `useAuth` import; destructured `user`; passed `user` to all four mutating db calls |
| `src/pages/AppShell.tsx` | Added `useSyncStatus` import and sync status pill using `circa-*` tokens only |

---

## Deviations from Instructions

1. **`SyncQueueEntry` re-export** — Added re-export to `src/lib/circadian/index.ts`.
   The task did not mention this file, but the import in `db.ts` requires it.
   Without it, TypeScript would fail with `TS2305`. This is a necessary fix, not
   a deviation from intent.

2. **`useSyncStatus` approach** — Used polling (5-second interval) as the
   explicit fallback described in the task instructions, rather than the primary
   Dexie hook approach. Noted in the hook's source comment.

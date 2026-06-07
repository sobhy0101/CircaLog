# Handoff — 07 Jun 2026

## What was completed this session

### Bidirectional Sync Service (Phase 1)
Full IndexedDB ↔ Supabase sync implemented and verified working across two
devices (PC + phone). 4 entries synced correctly on first test.

Two post-migration database fixes were required manually via Supabase SQL Editor:

1. **Missing grants** — `anon` and `authenticated` roles were missing
   SELECT/INSERT/UPDATE/DELETE on `sleep_entries` after the table rename.
   Fixed with: `GRANT SELECT, INSERT, UPDATE, DELETE ON public.sleep_entries TO anon, authenticated;`

2. **Stale CHECK constraint** — `sleep_sessions_session_type_check` only
   allowed `session_type = 'sleep'`. App uses `'main'` | `'nap'`.
   Fixed by dropping the old constraint and adding a correct one.

Files created/modified:
- `src/lib/supabase/syncService.ts` (new)
- `src/hooks/useSyncStatus.ts` (new)
- `src/lib/db/db.ts` — Dexie v2, syncQueue table
- `src/lib/circadian/types.ts` — SyncQueueEntry added
- `src/lib/db/sleepEntryService.ts` — user param, sync after mutations
- `src/hooks/useAuth.ts` — migrated to client.ts, syncOnConnect wired
- `src/hooks/useSleepLog.ts` — passes user to all mutations
- `src/pages/AppShell.tsx` — sync status pill

### Sync Status Pill UI fixes (Phase 1)
- Moved pill from top-right to top-center (no more content overlap)
- Pending dot color changed from purple to red (visible)
- Added `syncing` state (amber, rotating arrows SVG)
- Added `error` state (red, after 3 failed push attempts)
- Added `circa-success`, `circa-warning`, `circa-error` semantic tokens
  to `index.css` (light + dark) and `@theme inline`

Commit: `fbbb337` — live at https://circalog.vercel.app/log

---

## Open bugs — added to TO-DO list, need CC task in next session

### 1. Sync pill — offline state (🟢 independent)
**Location in TO-DO:** Auth & Cloud Sync section
**Problem:** When airplane mode is on, the pill briefly shows "Syncing…"
then "Synced" instead of a distinct "Saved — Offline" state. Root cause:
`flushQueue` runs, push fails, re-enqueues — but `_isSyncing` resets to
`false` and a polling tick catches the brief window where the queue appears
empty. Fix: check `navigator.onLine` before attempting any push, and show
a dedicated offline state in the pill when `!navigator.onLine`.

### 2. Date format in manual entry form (🟢 independent)
**Location in TO-DO:** Sleep Log Core section
**Problem:** `<input type="date">` shows MM/DD/YYYY on en-US devices.
Patient is Egyptian, uses DD/MM/YYYY. The internal value is always
YYYY-MM-DD (correct), but the display is confusing.
Fix: add a visible DD/MM/YYYY formatted label above each date field
showing the currently selected value.

### 3. Profiles table empty (🟢 deferred)
**Location in TO-DO:** Data Resilience section
**Problem:** `profiles` table in Supabase is empty — no trigger fires on
Google OAuth sign-in. Not blocking anything now.
**Deferred to:** Doctor Report PDF task (V2).

---

## Next logical task in TO-DO

**CSV Import** — `src/pages/` (new import screen)
- Accepts CSV exported from `CircaLog-Daily-Tracker.xlsx`
- Column mapping: Date, Bed Time, Sleep Start, Wake Time, Quality, Notes,
  Had Dreams, Interruptions
- Preview table before confirming
- Skips duplicates by `sleepStartUtc`
- Requires active Google Sign-In (already complete)
- Runs `assignCycleNumber` after import

The two open bugs above (offline state, date format) are independent and
can be bundled into one small CC task before or after CSV import —
Mahmoud's call.

---

## Supabase project ref
`iarozmvqcsrkdgytqzws` (permanent)

## Key files to read at session start
- `docs/CircaLog-TO-DO-list.md` — current task list
- `src/lib/supabase/syncService.ts` — sync logic
- `src/lib/circadian/types.ts` — domain types including SyncQueueEntry
- `src/lib/db/db.ts` — Dexie schema (currently v2)

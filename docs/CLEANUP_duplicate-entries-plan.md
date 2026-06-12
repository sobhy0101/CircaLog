# Duplicate Entry Cleanup — Step-by-Step Plan

**Created:** 12 Jun 2026  
**Context:** Sleep entries were duplicated across multiple browser IDBs and
Supabase due to the CSV import running against an empty IDB on more than one
occasion, and the `syncOnConnect` merge being UUID-based (not timestamp-based).
Full root-cause analysis: `tasks/cc-reports/REPORT_phase1-csv-import-duplicate-analysis_12-jun-2026.md`

---

## Why airplane mode was not reliable

`syncOnConnect` is triggered by the `INITIAL_SESSION` auth event, which fires
from a cached localStorage session — no network access required to trigger it.
By the time `navigator.onLine` is checked inside the sync functions, the call
is already in progress. Disabling airplane mode also immediately fires the
`online` event in `useAuth.ts`, which calls `flushQueue` — so any IDB entries
still present at that moment get pushed before the user can intervene.

The only reliable solution is a code-level kill switch.

---

## The kill switch

`SYNC_ENABLED` constant in `src/lib/supabase/syncService.ts`.  
When `false`, `syncOnConnect`, `syncAfterMutation`, `flushQueue`, and
`pushEntry` all return immediately. No IDB data can reach Supabase.

---

## Cleanup Steps

| # | Action | Owner | Status |
|---|--------|-------|--------|
| 1 | Set `SYNC_ENABLED = false` in `syncService.ts`, commit, push. Vercel auto-deploys. | Claude.ai writes, Mahmoud commits | ✅ Done |
| 2 | Wait for Vercel deployment to complete (~2 min). Confirm the live site has the change by checking the sync status indicator — it should remain static (not pulsing) even after sign-in. | Mahmoud | ⬜ Pending |
| 3 | **Clear every IDB environment** — for each browser/device that has ever opened CircaLog: open the app, press F12 → Application → Storage → **Clear site data** (check all boxes). Environments to cover: (a) Vercel production tab, (b) localhost dev tab, (c) any mobile browser. The app will show you as signed out after each clear. | Mahmoud | ⬜ Pending |
| 4 | With all IDBs cleared, signal Claude.ai to wipe the Supabase `sleep_entries` table via MCP. | Mahmoud signals, Claude.ai executes | ⬜ Pending |
| 5 | Verify both stores are empty: open Vercel app (should show empty History) and check Supabase table (Claude.ai confirms 0 rows). Do **not** sign in yet. | Mahmoud + Claude.ai | ⬜ Pending |
| 6 | Set `SYNC_ENABLED = true` in `syncService.ts`, commit, push. Wait for Vercel to deploy. | Claude.ai writes, Mahmoud commits | ⬜ Pending |
| 7 | Wait for Vercel deployment (~2 min), then sign in on **Vercel production only**. `syncOnConnect` fires: IDB = 0, Supabase = 0 → nothing syncs. Confirm History still shows empty. | Mahmoud | ⬜ Pending |
| 8 | Export the sleep log from Excel to CSV using the export prompt in `docs/CircaLog-Daily-Tracker-Spreadsheet.md`. | Mahmoud | ⬜ Pending |
| 9 | Import the CSV in the app (Import page). Verify the preview table shows the expected row count with no errors before confirming. | Mahmoud | ⬜ Pending |
| 10 | Final verification: History entry count matches the CSV row count. Claude.ai confirms Supabase row count matches. Cycle numbers are sequential and correct. | Mahmoud + Claude.ai | ⬜ Pending |

---

## After cleanup is confirmed

Write a CC task for **Option A — deterministic UUIDs**:

- `createEntry` in `sleepEntryService.ts` derives the entry `id` as a
  deterministic hash of `userId + sleepStartUtc` instead of calling
  `crypto.randomUUID()`.
- Supabase `upsert` on `id` deduplicates naturally — re-importing the same
  CSV 10 times always results in the same row count.
- This makes the cleanup procedure above a one-time event, not a recurring one.

---

## Files changed during this procedure

| File | Change | Reverted? |
|------|--------|-----------|
| `src/lib/supabase/syncService.ts` | `SYNC_ENABLED = false` | After step 5 (set back to `true`) |

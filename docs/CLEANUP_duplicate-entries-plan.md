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
| 2 | Wait for Vercel deployment to complete (~2 min). Confirm the live site has the change by checking the sync status indicator — it should remain static (not pulsing) even after sign-in. | Mahmoud | ✅ Done |
| 3 | **Clear every IDB environment** — for each browser/device that has ever opened CircaLog: open the app, press F12 → Application → Storage → **Clear site data** (check all boxes). Environments: (a) Vercel production tab, (b) localhost dev tab, (c) any mobile browser. Mobile devices with cached `syncService.ts` synced on open before the kill switch took effect; Supabase was wiped manually each time until all devices were silent. | Mahmoud | ✅ Done |
| 4 | With all IDBs cleared, wipe the Supabase `sleep_entries` table. Handled manually during step 3 (wiped after each mobile sync until silence). | Mahmoud (manual) | ✅ Done |
| 5 | Verify both stores are empty: Vercel app shows empty History, Supabase confirmed **0 rows** via MCP. | Mahmoud + Claude.ai | ✅ Done |
| 6 | Discuss and agree on the CC task scope for **Option A — deterministic UUIDs**. Claude.ai writes the task file. | Claude.ai + Mahmoud | ✅ Done |
| 7 | CC executes the deterministic UUID task. CC writes session report, Mahmoud confirms, CC commits. `SYNC_ENABLED` is set to `true` as the final step of this task. | CC + Mahmoud | ✅ Done |
| 8 | Wait for Vercel deployment (~2 min), then sign in on **Vercel production only**. `syncOnConnect` fires: IDB = 0, Supabase = 0 → nothing syncs. Confirm History still shows empty. | Mahmoud | ⬜ Pending |
| 9 | Export the sleep log from Excel to CSV using the export prompt in `docs/CircaLog-Daily-Tracker-Spreadsheet.md`. | Mahmoud | ⬜ Pending |
| 10 | Import the CSV in the app (Import page). Verify the preview table shows the expected row count with no errors before confirming. | Mahmoud | ⬜ Pending |
| 11 | Final verification: History entry count matches the CSV row count. Claude.ai confirms Supabase row count matches. Cycle numbers are sequential and correct. | Mahmoud + Claude.ai | ⬜ Pending |

---

## Files changed during this procedure

| File | Change | Reverted? |
|------|--------|-----------|
| `src/lib/supabase/syncService.ts` | `SYNC_ENABLED = false` | Set to `true` in step 7 by CC as part of the deterministic UUID task |

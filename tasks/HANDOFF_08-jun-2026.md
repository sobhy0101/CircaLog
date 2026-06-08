# Handoff — 08 Jun 2026

## Purpose

This session ran out of tool calls while reading files in preparation for
writing the CSV import task file. The task file was NOT written. The next
session must write it from scratch using the decisions locked in below.

Do NOT re-read any files to re-derive these decisions — they are all
documented here. Start writing the task file immediately.

---

## Task to write

**File:** `tasks/CC_TASK_Phase1_CSVImport.md`

**What it builds:** A full CSV import flow for sleep log data exported from
`CircaLog-Daily-Tracker.xlsx`. The import is accessible via the Side Drawer
→ "Import" → navigates to `/log/import` (a new full-page route inside the
AppShell). The user selects a CSV file, sees a preview table, confirms, and
the data lands in both IndexedDB and Supabase.

---

## All decisions made this session — do not re-litigate

### Routing

- New route: `/log/import` — child of `/log` (AppShell), same pattern as
  `/log/history` and `/log/chart`.
- Entry point: Side Drawer "More" section — add an "Import" button below
  "Export". It calls `navigate('/log/import')` and closes the drawer.
- `App.tsx` gets one new `<Route path="import" element={<ImportPage />} />`.

### Files to create

| Path | Purpose |
|---|---|
| `src/utils/csvParser.ts` | Pure parsing utility — no React, no hooks |
| `src/hooks/useImport.ts` | All import state and async logic |
| `src/pages/log/ImportPage.tsx` | Full-page UI component |

### Files to modify

| Path | Change |
|---|---|
| `src/App.tsx` | Add `<Route path="import" element={<ImportPage />} />` inside the `/log` AppShell route |
| `src/components/layout/SideDrawer.tsx` | Add "Import" button in the "More" section, between Export and About. Uses `useNavigate` to go to `/log/import` and calls `onClose`. |
| `src/lib/supabase/syncService.ts` | Add and export `checkSupabaseReachable(): Promise<boolean>` — used by the import gate |

### CSV column headers (exact, from the exported file)

```csv
Date,Bed Time,Sleep Start,Wake Time,Sleep Onset Latency,Sleep Duration,Time in Bed,Session Type,Quality,Had Dreams?,Dream Notes,Interruptions,Notes,Cycle Number
```

**Columns the parser USES:**
`Date`, `Bed Time`, `Sleep Start`, `Wake Time`, `Quality`, `Had Dreams?`
(note the literal `?`), `Dream Notes`, `Interruptions`, `Notes`

**Columns the parser IGNORES entirely:**
`Sleep Onset Latency`, `Sleep Duration`, `Time in Bed`, `Session Type`
(re-derived by `detectSessionType`), `Cycle Number` (re-assigned by
`assignCycleNumber`)

### Date and time formats in the CSV

- `Date`: `DD-MM-YYYY` (e.g. `29-05-2026`) — note hyphens, not slashes
- `Bed Time`, `Sleep Start`, `Wake Time`: `HH:MM` 24-hour (e.g. `04:00`,
  `23:10`, `00:37`)

### Midnight crossover rules (CRITICAL — verified against real data)

The parser must handle sessions that cross midnight. Both rules apply
independently:

1. **Sleep Start crosses midnight:** If `Sleep Start` time (HH:MM) is
   earlier in the day than `Bed Time` time (HH:MM), the actual sleep start
   date is `Date + 1 day`.
   - Example: Date `31-05-2026`, Bed `23:10`, Sleep Start `00:37` →
     sleep start is `01-06-2026 00:37` Cairo local.

2. **Wake Time crosses midnight:** If `Wake Time` time (HH:MM) is earlier
   in the day than `Sleep Start` time (HH:MM), the actual wake date is
   sleep start date + 1 day.
   - Example (common for normal sleepers): Bed `22:00`, Sleep Start `22:30`,
     Wake `06:00` → wake date is the day after sleep start.

### Timezone handling

- `ianaTimezone` is obtained from `Intl.DateTimeFormat().resolvedOptions().timeZone`
  in the `ImportPage` component at mount time — NOT hard-coded.
- This is passed into the parser as a parameter so the utility is reusable
  for users in any timezone when the app is open-sourced.
- For Mahmoud's Cairo entries: Africa/Cairo, UTC+3 during DST (EEST, active
  Apr–Oct). UTC = local − 3 hours.
- UTC conversion: use `new Date(`${YYYY-MM-DD}T${HH:MM}:00`).toISOString()`
  — this interprets the datetime in the **browser's local timezone**. Since
  the browser is in Cairo and the entries were recorded in Cairo, this is
  correct as long as the page is open in Cairo. The `ianaTimezone` field
  on the resulting `SleepEntry` records the timezone for later display use.

### Quality mapping

CSV `Quality` column is `1`–`5` as a string integer.
Map directly: `parseInt(row.Quality, 10) as QualityRating`.
Invalid values (outside 1–5 or non-numeric) must be flagged as a parse
error on that row.

### `Had Dreams?` mapping

CSV value is `Yes` or `No` (capital first letter).
Map: `Yes` → `true`, `No` → `false`, anything else → `undefined`.

### Interruptions mapping

CSV `Interruptions` column is free text (e.g. `"Peed twice"`, `"N/A"`,
`"none"`). Import as `notes`-style text only — do NOT attempt to parse into
the `Interruption[]` type. Store as part of the entry's `notes` field if
non-empty and not `N/A`/`none`, or produce a standalone `interruptions`
note that gets appended to the `notes` field.

Simplest approach: if `Interruptions` is non-empty, not `N/A`, and not
`none` (case-insensitive), append it to `notes` as `"Interruptions: {value}"`.

### Dream Notes mapping

If `Had Dreams?` is `Yes` and `Dream Notes` is non-empty and not `N/A`,
store as `dreamNotes` on the entry.

### Notes mapping

CSV `Notes` column → `SleepEntry.notes`. Empty string or `N/A` → `undefined`.

### Duplicate detection

Skip any row whose computed `sleepStartUtc` already exists in IndexedDB.
Use `db.sleepEntries.where('sleepStartUtc').equals(candidate).count()`.
Mark skipped rows visibly in the preview table with a "Duplicate — will skip"
badge.

### Pre-import gate (connectivity check — Option C)

Before the import begins (when the user taps "Confirm Import"):

1. **Check `navigator.onLine`** — if `false`, show:
   `"You're offline. Import needs an active connection to sync your data."`
   Block import. Show a "Retry" button that re-runs the check.

2. **Call `checkSupabaseReachable()`** (new function in `syncService.ts`):
   - Performs a lightweight `SELECT 1` query: `supabase.from('sleep_entries').select('id').limit(1)`
   - Returns `true` if the query succeeds (even with zero rows), `false` on
     any error.
   - If `false`, show: `"Can't reach the server. Check your connection and try again."`
   - Block import. "Retry" button re-runs both checks.

3. **Check sign-in** — if `user` is `null`, show:
   `"Sign in with Google to import data. Your data must be saved to the cloud."`
   Block import with a `GoogleSignInButton` inline.

All three gates must pass before the import begins.

### Per-row sync with retry (3 attempts per row)

During import, each row is:
1. Written to IndexedDB via `createEntry(draft, user)` (existing service
   function — it already calls `syncAfterMutation`).
2. If Supabase push fails inside `syncAfterMutation`, the entry lands in the
   sync queue with `failCount = 1`.
3. The import hook does NOT retry individually — it relies on the existing
   sync queue / `flushQueue` mechanism for resilience.

**However**, the import UI must show the progress row-by-row and detect when
an entry ends up in the sync queue (i.e. its push failed). After all rows
are processed, call `flushQueue(user)` once to attempt a final push of
anything queued.

After `flushQueue`, check the sync queue: if any entries from this import
batch are still queued (failCount ≥ 1), show the error state.

### Import progress UI

The `ImportPage` shows a progress indicator during import:

- A row counter: `Importing row 8 of 14…`
- On completion: `✅ 12 imported, 2 skipped (duplicates)`
- On sync error after final flush: show a red error section:

  ```text
  ⚠️ SYNC_ERR_{httpStatus}: {short description}
  {N} entries were saved to this device but could not reach the server.
  Contact support at circalog.app@gmail.com if the issue persists.
  ```

  Plus a `[Retry sync]` button that calls `flushQueue(user)` again and
  re-checks the queue.

HTTP status code is extracted from the Supabase error object if available;
fall back to `503` if unknown.

### Preview table

Before the user confirms import, the preview table shows ALL parsed rows
with these columns:

| # | Date | Bed Time | Sleep Start | Wake Time | Duration | Quality | Session Type | Status |
|---|---|---|---|---|---|---|---|---|

Status column values:
- `Ready` (green) — will be imported
- `Duplicate` (amber) — will be skipped
- `⚠️ Parse error: {reason}` (red) — cannot be imported; row is excluded

Rows with parse errors are excluded from the import but shown in the
preview so the user can fix the source file and re-import.

The preview also shows a summary line above the table:
`{N} ready to import · {M} duplicates (will skip) · {K} errors`

A prominent warning is shown if any row has a suspicious date — specifically
if any `Date` field parses to a year other than the current year ±1, or if
the date is more than 1 year in the future. The known typo (`06-07-2026`
which should be `06-06-2026`) will appear here with a yellow flag:
`⚠️ Date appears to be in the future — check source data`.

### `assignCycleNumber` after import

After all rows are successfully written to IndexedDB, call
`reassignAndPersist()` — but this is already done by `createEntry()` on
every call. So cycle numbers are live-updated row-by-row during import,
which is correct. No special post-import step needed.

### Import page layout (mobile-first)

- Full-page view inside AppShell (bottom tab bar visible, sync pill visible)
- Header: `← Back` button (top-left, navigates back to `/log`), page title
  `Import Sleep Log`
- Step 1 — File picker: "Select your CircaLog CSV export" with a visible
  file input styled as a large tap target. Accepts `.csv` only.
- Step 2 — Preview table (scrollable horizontally on mobile). Appears after
  file is parsed.
- Step 3 — Confirm button: `Import {N} sessions` (disabled if N = 0 or
  gate checks fail). Gate errors appear here inline.
- Step 4 — Progress / result view. Replaces the confirm button area.
- Back navigation is blocked (disabled) during active import.

---

## Known data issues in Mahmoud's export file

These are pre-existing issues in the source spreadsheet that the preview
table must surface — the parser does NOT silently fix them:

1. **Row 12 date typo:** `06-07-2026` — this is July 6, but the correct
   date is June 6 (`06-06-2026`). The preview table must flag this row
   with `⚠️ Date appears to be in the future`.
   - Mahmoud will fix this in the spreadsheet and re-export before
     confirming the import.

2. **Cycle numbers 12, 12, 12 in last three rows:** The spreadsheet's cycle
   numbering breaks from row 12 onward. This is irrelevant — the parser
   ignores the `Cycle Number` column entirely. `assignCycleNumber` will
   recompute all cycle numbers correctly.

---

## Files read in this session (all content confirmed in context)

CC does not need to re-read these unless something specific is needed.
Claude.ai already has full content of all of these:

- `src/lib/circadian/types.ts`
- `src/lib/circadian/assignCycleNumber.ts`
- `src/lib/circadian/normalizeSleepSpan.ts`
- `src/lib/circadian/detectSessionType.ts`
- `src/lib/circadian/utils.ts`
- `src/lib/circadian/index.ts`
- `src/lib/db/db.ts`
- `src/lib/db/sleepEntryService.ts`
- `src/lib/db/index.ts`
- `src/lib/supabase/syncService.ts`
- `src/lib/supabase/client.ts`
- `src/lib/constants.ts`
- `src/hooks/useSleepLog.ts`
- `src/hooks/useAuth.ts`
- `src/hooks/useSyncStatus.ts`
- `src/App.tsx`
- `src/pages/AppShell.tsx`
- `src/pages/log/LogPage.tsx`
- `src/pages/log/ManualEntryForm.tsx`
- `src/components/layout/SideDrawer.tsx`
- `src/components/layout/BottomTabBar.tsx`
- `src/components/ui/Toast.tsx`
- `src/components/ui/DeleteConfirmDialog.tsx`
- `src/index.css` (full token list)
- `src/utils/` (empty — csvParser.ts goes here)
- `vite.config.ts`
- `.env.example`
- `docs/CircaLog-TO-DO-list.md`
- `docs/CircaLog_DevPlan_QA.md`
- `tasks/HANDOFF_07-jun-2026.md`
- `.claude/memory/feedback_report_conventions.md`
- `.claude/memory/session_report_policy.md`
- `.claude/memory/project_auth_system.md`
- `.claude/skills/token-usage/SKILL.md`
- `.claude/skills/run/SKILL.md`
- `.claude/skills/visual-check/SKILL.md`
- `docs/exported-data-excel-spreadsheet_08-Jun-2026.md`

---

## Existing architecture patterns to follow

**`createEntry` signature** (from `sleepEntryService.ts`):

```typescript
createEntry(
  draft: Omit<SleepEntry, 'id' | 'cycleNumber' | 'sessionType' | 'createdAt' | 'updatedAt' | 'isDeleted'>,
  user: User | null
): Promise<SleepEntry>
```

The parser produces objects of exactly this shape. The import hook calls
`createEntry` per row, passing `user` from `useAuth()`.

**`checkSupabaseReachable` to add to `syncService.ts`:**

```typescript
export async function checkSupabaseReachable(): Promise<boolean> {
  if (!supabase) return false
  if (!navigator.onLine) return false
  try {
    const { error } = await supabase
      .from('sleep_entries')
      .select('id')
      .limit(1)
    return error === null
  } catch {
    return false
  }
}
```

**No `import React from 'react'` in `.tsx` files** — automatic JSX transform
is active. Use `import { useState, useEffect } from 'react'` for named
imports only.

**`circa-*` tokens only** — no raw Tailwind palette classes.
Full token list is in `.claude/skills/token-usage/SKILL.md`.

**Font classes:** `font-display` = Exo 2 (headings), default = Inter (body).

---

## TO-DO items this task closes

From `docs/CircaLog-TO-DO-list.md`, section `### 📥 Data Import`:

```md
- [ ] 🟡 Import sleep log from CSV
```

---

## Session report

The report file must be saved to:
`tasks/cc-reports/REPORT_phase1-csv-import_{DD}-{mon}-{YYYY}.md`

Follow all rules in `.claude/memory/session_report_policy.md` and
`.claude/memory/feedback_report_conventions.md`.

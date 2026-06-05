# Self-Prompt — Phase 1 Batch C: Sleep Log Core (Remaining Items)

**For:** Claude.ai (new planning session)
**Written by:** Claude.ai (previous session, 04 Jun 2026)
**Read before doing anything else.**

---

## What this batch covers

Three remaining unchecked items from the `### 🛏️ Sleep Log — Core` section
of `docs/CircaLog-TO-DO-list.md`:

1. `[ ] 🟡 Display both calendar date AND cycle number on each entry`
2. `[ ] 🟢 Edit existing sleep entries — user-facing form`
3. `[ ] 🟢 Delete sleep entries — confirmation dialog UX`

All three can be planned and executed as a single Batch C for a CC session.

---

## Current codebase state (as of commit `ce38835` + two direct edits)

### What exists

- **DB layer** — complete and tested. `src/lib/db/` has `db.ts`,
  `sleepEntryService.ts`, `index.ts`. All six CRUD functions exist
  (`createEntry`, `getAllEntries`, `getEntryById`, `updateEntry`,
  `softDeleteEntry`, `hardDeleteEntry`). Do not touch.
- **Circadian engine** — complete and tested. `src/lib/circadian/` has
  all pure functions including `assignCycleNumber` and `normalizeSleepSpan`.
- **`useSleepLog` hook** — `src/hooks/useSleepLog.ts`. Exposes `entries`
  (all non-deleted entries, newest first), `createEntry`, `updateEntry`,
  `softDeleteEntry`, `hardDeleteEntry`, `inProgress`, `startSession`,
  `clearSession`, `isLoading`, `error`.
- **Log UI** — `src/pages/log/` has `LogPage.tsx`, `ManualEntryForm.tsx`,
  `StartSleepScreen.tsx`, `WakeUpScreen.tsx`. All wired and working.
- **`QualityPicker`** — `src/components/ui/QualityPicker.tsx`. Fluid sizing,
  reusable, accepts `value`, `onChange`, optional `label`.
- **App shell** — `AppShell.tsx` with `<Outlet />`, `BottomTabBar`,
  `SideDrawer`. Routing in `App.tsx`: `/` → ComingSoon, `/log` → AppShell
  with LogPage as index child.
- **History tab** — currently a dead tab in the bottom bar. No page exists
  at `/log/history` yet. The tab is present but tapping it goes nowhere.
- **Chart and Insights tabs** — same situation, dead tabs.

### Key file paths

```
src/
  hooks/
    useSleepLog.ts
  lib/
    circadian/
      types.ts          ← SleepEntry, all domain types
      normalizeSleepSpan.ts
      assignCycleNumber.ts
    db/
      sleepEntryService.ts
      index.ts
  pages/
    log/
      LogPage.tsx
      ManualEntryForm.tsx
      StartSleepScreen.tsx
      WakeUpScreen.tsx
  components/
    ui/
      QualityPicker.tsx
    layout/
      BottomTabBar.tsx
      SideDrawer.tsx
  App.tsx
  pages/AppShell.tsx
docs/
  CircaLog-TO-DO-list.md
  CircaLog_ProjectInstructions.md
tasks/
  CC_TASK_Phase1_SleepLog_DBLayer.md   ← read for DB layer context
  CC_TASK_Phase1_SleepLog_LogUI.md     ← read for Log UI context
```

---

## Open architectural question to resolve FIRST

**Where does "display both calendar date AND cycle number on each entry" live?**

This item is listed under Sleep Log — Core, but the natural display surface
for it is a list of entries — which is the History View. The History View
does not exist yet.

Before writing the Batch C task file, Claude.ai must resolve this with
Mahmoud:

**Option A — Defer the display item to History View (Batch D)**
Build Edit and Delete now (Batch C), build History View next (Batch D),
and show date + cycle number there. The display item stays unchecked until
History View exists. Batch C is leaner.

**Option B — Build a minimal History View as part of Batch C**
A simple list of entries (no filters, no sort toggle yet) that shows
cycle number, calendar date, session type, duration, and quality. Edit
and Delete buttons live on each row. This collapses History View's first
two unchecked items (`[ ] 🔴 List view` and `[ ] 🔴 Show: cycle number,
date, start time, wake time, duration, quality, session type`) into
Batch C alongside Edit and Delete. Larger scope but more coherent — the
Edit and Delete UX needs a host surface anyway.

**Option C — Show date + cycle on the Log confirmation screen only**
After saving a sleep entry (on the Wake Up screen or after manual form
submit), show a brief "Session saved" confirmation card that includes the
assigned cycle number and calendar date. No History View needed yet.
Edit/Delete remain their own items. This is the narrowest interpretation
of the TO-DO item and avoids building History View prematurely.

My recommendation going into the new session: **Option B**. Edit and Delete
have nowhere natural to live without a list of entries. Building a minimal
History View as part of Batch C gives them a home and checks off four TO-DO
items at once (display item + two History View blockers + Edit/Delete UI).
But present all three options to Mahmoud and let him decide.

---

## What Edit and Delete must do

### Edit

- Opens the existing `ManualEntryForm` in edit mode, pre-filled with the
  entry's current values.
- On save: calls `updateEntry(id, changes)` from `useSleepLog`, then
  re-runs `assignCycleNumber` across all entries (an edit to sleep start
  time can shift cycle numbers downstream).
- `ManualEntryForm` already accepts `initialSleepStart` and `initialWake`
  props for forward compatibility — these need to be fully wired.
- All other fields (quality, notes, optional fields) also need pre-fill
  props added and wired.

### Delete

- Soft delete only in V1 (`softDeleteEntry` — sets `isDeleted: true`,
  does not remove the row).
- Hard delete (`hardDeleteEntry`) is reserved for a future "empty trash"
  or Settings-level action.
- UX: confirmation dialog before soft delete executes. Something like:
  "Delete this session? This can't be undone." with `[ Cancel ] [ Delete ]`.
- After soft delete: re-run `assignCycleNumber` across remaining entries
  (deleting an entry renumbers the cycle sequence).

### Cycle renumbering after edit or delete

`assignCycleNumber(entries)` is idempotent — call it with the full
updated entries array and it returns the correctly numbered array.
After any edit or delete, the hook must:
1. Fetch all entries from DB (`getAllEntries`).
2. Run `assignCycleNumber` on them.
3. Write the renumbered entries back to DB (batch `updateEntry` calls).
4. Refresh `entries` state.

This is the most complex part of Batch C. Discuss whether this renumber
step belongs inside `useSleepLog` as a private helper, or as a separate
exported utility. My lean: private helper inside the hook, called
automatically after every mutation that can affect cycle order.

---

## Decisions already made — do not re-open

- Soft delete only in V1 (no hard delete from the UI)
- `assignCycleNumber` must re-run after every insert, edit, and delete
- `ManualEntryForm` is the edit form (reused, not duplicated)
- `QualityPicker` is the reusable quality selector for all forms
- All `circa-*` tokens — no raw Tailwind palette classes except red
  error colours
- No `import React from 'react'` in `.tsx` files
- Separate `<input type="date">` + `<input type="time">` pairs, not
  `datetime-local`

---

## Skills to reference when writing the CC task file

- `.claude/skills/token-usage/SKILL.md`
- `.claude/skills/run/SKILL.md`
- `.claude/skills/visual-check/SKILL.md`

---

## Session report and commit rules

As always:
- CC writes a report to `tasks/cc-reports/` before committing
- Filename: `REPORT_phase1-batchc_{DD}-{mon}-{YYYY}.md`
- CC pastes a summary and waits for Claude.ai confirmation before
  running `git commit`

# Session Report — Phase 1 Batch C: Sleep Log Core (Remaining Items)

**Date:** 05 Jun 2026
**Branch:** main
**Commits this session:** pending (awaiting confirmation)

---

## What was built

Batch C completes the remaining unchecked items from the **Sleep Log — Core** section
and, by adopting Option B from the self-prompt, simultaneously delivers the first two
blocked items in the **History View** section.

**Five TO-DO items checked off:**

| Item | Section |
|---|---|
| Display both calendar date AND cycle number on each entry | Sleep Log — Core |
| Edit existing sleep entries — user-facing form | Sleep Log — Core |
| Delete sleep entries — confirmation dialog UX | Sleep Log — Core |
| List view of all past sleep entries | History View |
| Show: cycle number, date, start time, wake time, duration, quality, session type | History View |

---

## Files changed

### New files

**`src/pages/history/HistoryPage.tsx`**

Minimal list view for the History tab. Displays all non-deleted entries (newest first,
as the `useSleepLog` hook already reverses the array). Each entry card shows:

- Cycle number badge (`#N`) + session type (Main Sleep / Nap)
- Local calendar date (e.g. "Thu, 5 Jun 2026") derived from `sleepStartUtc` +
  `ianaTimezone` via `Intl.DateTimeFormat`
- Local start and wake times in 24h format
- Duration (e.g. "7h 45m")
- Quality dots (filled/hollow circles, `text-circa-accent-light` vs `text-circa-text-muted`)
- Edit button + trash icon delete button

The page has two view states (`list` | `edit`):

- **List:** shows entry cards, loading skeleton, and empty state
- **Edit:** renders `ManualEntryForm` in edit mode with the selected entry pre-filled

The `DeleteConfirmDialog` is an overlay that sits on top of the list (no view switch
needed for delete — it is a quick confirm/cancel action).

**`src/components/ui/DeleteConfirmDialog.tsx`**

A bottom-anchored modal overlay. Shows the cycle number and session type of the
target entry, with Cancel and Delete buttons. Tapping the scrim (outside the card)
also cancels. Hard delete is not exposed — soft delete only in V1.

### Modified files

**`src/pages/log/ManualEntryForm.tsx`**

Extended to support edit mode. Key changes:

- Added `editEntry?: SleepEntry` prop — when provided, the form is in edit mode
- Added `updateEntry?` prop — called on submit in edit mode instead of `createEntry`
- Made `createEntry` optional (not needed in edit mode)
- Removed the unused `initialSleepStart` / `initialWake` props (replaced by `editEntry`)
- Added `utcToLocalInputs(utcIso, tz)` helper that converts a UTC ISO string back to
  `{date: YYYY-MM-DD, time: HH:MM}` using `Intl.DateTimeFormat.formatToParts`. Handles
  the edge case where `hour12: false` may return `'24'` for midnight.
- All `useState` initializers now use lazy-init functions that read from `editEntry`
  when present (required fields, bed time, notes, optional fields including dreams,
  interruptions set + notes map, and medication taken/timing)
- The optional section auto-expands when editing an entry that already has optional data
- Submit button label changes to "Update Session" in edit mode

**`src/components/layout/BottomTabBar.tsx`**

Replaced the hardcoded "Log tab always active" behaviour with route-driven active state:

- Added `useNavigate` and `useLocation` from `react-router-dom`
- Log tab navigates to `/log`; History tab navigates to `/log/history`
- Active state: `aria-current="page"` + `text-circa-accent` class driven by
  `pathname === '/log'` / `pathname === '/log/history'`
- Chart and Insights tabs remain inert (no route yet) but correctly show as inactive

**`src/App.tsx`**

Added the `/log/history` child route under the `/log` shell:

```tsx
<Route path="/log" element={<AppShell />}>
  <Route index element={<LogPage />} />
  <Route path="history" element={<HistoryPage />} />
</Route>
```

---

## Architecture note — cycle renumbering

The self-prompt asked whether the renumber step should live in `useSleepLog` or in
the DB service. It already lives in `sleepEntryService.ts` as the private
`reassignAndPersist()` function, which is called at the end of `createEntry`,
`updateEntry`, `softDeleteEntry`, and `hardDeleteEntry`. The hook's `refresh()` call
after each mutation picks up the renumbered result. No changes needed to the service
or hook layers — the architecture was already correct.

---

## Decisions made

| Decision | Rationale |
|---|---|
| Option B (History View as part of Batch C) | Edit and Delete had no natural host surface without a list; building History now checks off 5 items at once |
| Soft delete only exposed in the UI | Matches the V1 decision already recorded in the self-prompt |
| `utcToLocalInputs` scoped to `ManualEntryForm.tsx` | Only this file needs the UTC→local conversion for inputs; no need to export |
| `DeleteConfirmDialog` as an overlay (not a view switch) | Delete is a two-tap action; full-screen switch for a confirm dialog is excessive on mobile |
| Quality display in HistoryPage is a local `QualityDots` component | Read-only display; reusing interactive `QualityPicker` would be wrong semantically |

---

## Visual verification (Playwright)

All checks run against `http://localhost:5173` with a 390 × 844 viewport.

| Check | Result |
|---|---|
| Dark mode is default (`html.dark`) | ✅ |
| Log tab heading renders "Sleep Log" | ✅ |
| History tab heading renders "History" | ✅ |
| Active tab on `/log/history` is "History" (`aria-current="page"`) | ✅ |
| Clicking Log tab navigates to `/log`, activates Log tab | ✅ |
| Manual entry saves, history card shows `#1` cycle badge | ✅ |
| Edit form opens pre-filled (dates and times correct) | ✅ |
| Back button from Edit returns to History list | ✅ |
| Delete dialog shows on trash-icon click | ✅ |
| Cancel dismisses dialog without deleting | ✅ |
| Light mode (no `dark` class on `<html>`) | ✅ |
| TypeScript compile (`tsc --noEmit`) | ✅ zero errors |

Screenshots saved to `tasks/screenshots/` (not committed).

---

## TO-DO list status after Batch C

Next unchecked items in History View:

- `[ ] 🟡 Filter by: date range, session type, quality rating`
- `[ ] 🟢 Sort by: most recent first (default) / oldest first`

Next major section: **Actogram** (`📊 Visualization — Actogram`), which has two
🔴 blockers remaining.

# CC Task — Phase 1: Session Detail Page + Clickable Cards

**Tier:** 2 (new page file, route addition, edits to 3 existing files)
**Authored by:** Claude.ai, 10 Jun 2026
**Status:** Ready for execution

---

## Context

CircaLog currently has no dedicated view for a single sleep session. The
History page edits entries in-place by swapping an internal `view` state;
the Chart tooltip is a floating card with no navigation. This task introduces
a proper `/log/history/:entryId` route backed by a new `SessionDetailPage`,
and wires clickable navigation into both the History list cards and the
Chart tooltip card.

---

## Files to Read First

Before writing a single line of code, read these files in full:

```powershell
# Read all five source files before starting
Get-Content "src\App.tsx"
Get-Content "src\pages\history\HistoryPage.tsx"
Get-Content "src\components\chart\Actogram.tsx"
Get-Content "src\hooks\useSleepLog.ts"
Get-Content "src\pages\log\ManualEntryForm.tsx"
```

Do not assume any existing import, prop name, or type — verify from the
files above.

---

## Step 1 — Add `getEntryById` to `useSleepLog.ts`

Open `src/hooks/useSleepLog.ts`.

Add a `getEntryById` helper that looks up a single entry from the in-memory
`entries` array by id. This avoids a second IndexedDB call when the detail
page already has the full list loaded:

```typescript
// Returns the entry matching the given id, or undefined if not found.
// Reads from the in-memory entries array — no DB call needed.
function getEntryById(id: string): SleepEntry | undefined {
  return entries.find(e => e.id === id);
}
```

Add `getEntryById` to the return object of `useSleepLog`.

---

## Step 2 — Create `SessionDetailPage.tsx`

Create `src/pages/history/SessionDetailPage.tsx` as a **new file**.

### Behaviour

- Reads `:entryId` from the URL using `useParams`.
- Calls `useSleepLog()` to get `entries`, `isLoading`, `updateEntry`, and
  the new `getEntryById`.
- If `isLoading` is true, renders a loading skeleton (same style as
  HistoryPage: three rounded `animate-pulse` blocks, `bg-circa-surface`,
  `border-circa-border`, `rounded-xl`, `h-24`).
- If the entry is not found after loading completes, renders a centered
  not-found message with a "← Back to History" link (`useNavigate` to
  `/log/history`).
- If the entry is found, renders the **read-only detail view** described
  below.
- Reads the `?edit=true` query param via `useSearchParams`. When present on
  mount, immediately renders the edit form instead of the read-only view
  (see "Edit mode" below).

### Read-only view layout

Header row (same style as other pages):

```txt
[ ← Back ]   "Session #N"   [ Edit ]
```

- Back button: `useNavigate(-1)` (goes back to wherever the user came from —
  History list or Chart tooltip).
- Title: `text-circa-text-primary font-display text-lg font-semibold tracking-wide`
  — "Session #N" where N is `entry.cycleNumber`.
- Edit button: `text-circa-accent-light text-sm` — navigates to
  `?edit=true` by calling `setSearchParams({ edit: 'true' })`.

Body (inside `px-4 space-y-5 max-w-lg mx-auto`):

**Date & type card** (`bg-circa-surface border border-circa-border rounded-xl p-4`):

- Cycle badge: `bg-circa-accent-subtle text-circa-accent-light text-xs font-semibold px-2 py-0.5 rounded-full` — "#N"
- Session type label next to badge: "Main Sleep" or "Nap", `text-circa-text-secondary text-xs`
- Calendar date on the right: formatted as "Thu, 5 Jun 2026", `text-circa-text-secondary text-xs`

**Times card** (same card style):

Three rows, each `text-circa-text-primary text-sm`:

```txt
Bed        HH:MM   (show only if bedTimeUtc is present)
Fell asleep  HH:MM
Woke up      HH:MM
```

Below those rows, two `text-circa-text-secondary text-xs` pills in a flex row:

- Sleep onset latency: "Latency: Xh Ym" (bed time → sleep start; omit if
  no bedTimeUtc)
- Sleep duration: "Duration: Xh Ym"

**Quality card** (same card style):

Label "Sleep Quality" + `QualityDots` component (copy the component from
`HistoryPage.tsx` — do not import it from there, redeclare it locally since
it is a small, pure presentational component and `HistoryPage` does not
export it).

**Optional fields card** (same card style) — render only when at least one
optional field is present on the entry:

Show each field that is present, skipped if absent:

- Had Dreams: "Dreams: Yes / No"
- Dream Notes: text paragraph (only if `hadDreams === true && dreamNotes`)
- Interruptions: comma-separated list of type labels (bathroom → "Bathroom",
  etc.) + any per-interruption notes
- Medication: "Medication taken: Yes — [timing]" or "No"
- Notes: free-text paragraph

**All times** must be formatted using `Intl.DateTimeFormat` with
`entry.ianaTimezone`. Reuse the same `formatLocalDate`, `formatLocalTime`,
and `formatDuration` helper functions from `HistoryPage.tsx` — declare them
as module-level functions inside `SessionDetailPage.tsx` (do not import them
from `HistoryPage` since that file does not export them).

### Edit mode

When `?edit=true` is in the URL (either navigated to directly or set by the
Edit button):

- Render a header: `[ ← Back ]` + "Edit Session" title (no Edit button in
  edit mode).
- Render `<ManualEntryForm editEntry={entry} updateEntry={updateEntry} ... />`
  exactly as `HistoryPage` currently does in its `view === 'edit'` branch.
- `onSaved` and `onCancel` both call `setSearchParams({})` to remove the
  `?edit=true` param, returning to the read-only view. Do not navigate away
  from the detail page — stay on `/log/history/:entryId`.

### No new dependencies

`useParams`, `useNavigate`, `useSearchParams` are all from `react-router-dom`,
which is already installed.

---

## Step 3 — Add the route to `App.tsx`

Open `src/App.tsx`.

Add the import:

```typescript
import SessionDetailPage from '@/pages/history/SessionDetailPage';
```

Add the route as a child of `/log`:

```tsx
<Route path="history/:entryId" element={<SessionDetailPage />} />
```

Place it immediately after the existing `history` route:

```tsx
<Route path="history" element={<HistoryPage />} />
<Route path="history/:entryId" element={<SessionDetailPage />} />
```

---

## Step 4 — Update `HistoryPage.tsx`

### 4a — Import `useNavigate`

Add to the existing react-router-dom import:

```typescript
import { useNavigate } from 'react-router-dom';
```

### 4b — Add `useNavigate` inside `HistoryPage`

At the top of the `HistoryPage` function body:

```typescript
const navigate = useNavigate();
```

### 4c — Replace the in-component edit swap

Remove the `view`, `setView`, `editingEntry`, and `setEditingEntry` state
variables and the `view === 'edit'` early-return block entirely.

Replace `handleEditClick`:

```typescript
function handleEditClick(entry: SleepEntry) {
  navigate(`/log/history/${entry.id}?edit=true`);
}
```

### 4d — Add `handleViewClick`

```typescript
function handleViewClick(entry: SleepEntry) {
  navigate(`/log/history/${entry.id}`);
}
```

### 4e — Make the whole `EntryCard` clickable

Update `EntryCardProps` to add `onView`:

```typescript
interface EntryCardProps {
  entry: SleepEntry;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}
```

Wrap the entire card body in a clickable element. The outer `div` becomes
a `button` (or keeps `div` with `onClick` and `role="button"`). Use a
`<div>` with `onClick={onView}` and `role="button"` and
`tabIndex={0}` and `onKeyDown` (Enter/Space → `onView()`) for accessibility.
Add `cursor-pointer` to the outer element.

The Edit and Delete `<button>` elements inside must call
`e.stopPropagation()` in their `onClick` handlers to prevent the card
click from firing when an action button is tapped.

Add a subtle visual affordance to signal navigability: a right-chevron SVG
in the top-right area of the card (16×16, `text-circa-text-muted`), placed
to the right of the date label in row 1. This replaces nothing — it is
additive. The chevron communicates "tap to see details" without needing a
"View" label.

Pass `onView` to each `EntryCard` in the list render:

```tsx
<EntryCard
  key={entry.id}
  entry={entry}
  onView={() => handleViewClick(entry)}
  onEdit={() => handleEditClick(entry)}
  onDelete={() => handleDeleteClick(entry)}
/>
```

### 4f — Remove now-unused state and type

Remove the `HistoryView` type alias (`type HistoryView = 'list' | 'edit'`)
since it is no longer needed.

Remove the `view` and `editingEntry` state variables and their `setView` /
`setEditingEntry` setters.

---

## Step 5 — Update `Actogram.tsx` (TooltipOverlay)

### 5a — Import `useNavigate`

Add to the existing react-router-dom import (there is currently no
react-router-dom import in `Actogram.tsx` — add it):

```typescript
import { useNavigate } from 'react-router-dom';
```

### 5b — Add `entryId` to `TooltipOverlayProps`

The `SleepBlock` type already has `entryId`. Pass it through explicitly so
the overlay component does not need to know about `SleepBlock`:

```typescript
interface TooltipOverlayProps {
  block: SleepBlock;
  cycle: ActogramCycle | undefined;
  onClose: () => void;
  // entryId is already on block; accepted as a named prop for clarity
}
```

`block.entryId` is already available — no prop change is required. CC can
read it directly from `block` inside the component.

### 5c — Make the tooltip card body navigate on tap

Inside `TooltipOverlay`, add:

```typescript
const navigate = useNavigate();
```

Make the inner card `div` navigate to the detail page when tapped:

```typescript
onClick={() => navigate(`/log/history/${block.entryId}`)}
```

Add `cursor-pointer` to the card div.

The close button `onClick` must call `e.stopPropagation()` before `onClose()`
to prevent card navigation from firing when the × is tapped.

Add a subtle "View details →" line at the bottom of the card:

```tsx
<p className="text-circa-text-muted text-xs mt-3 text-right">
  View details →
</p>
```

This gives users a clear signal that the card is tappable, since there is no
explicit button.

---

## Step 6 — Build check

```powershell
npm run build
```

The build must complete with zero TypeScript errors and zero warnings.
Fix any errors before proceeding. Do not suppress TS errors with `// @ts-ignore`
or type casts unless there is a documented reason.

---

## Step 7 — Session report

Write a comprehensive Markdown report to:

```txt
tasks/cc-reports/REPORT_phase1-session-detail-page_{DD}-{mon}-{YYYY}.md
```

The report must cover:

- Every step executed, with outcome (completed / skipped / deviated)
- Any deviations from these instructions and the reason
- Full list of files created or modified
- Build output (paste the final lines of `npm run build`)
- Any TypeScript errors encountered and how they were resolved
- Packages installed: none expected — confirm none were added

Follow markdownlint rules: blank line before and after every fenced code
block, zero warnings allowed.

Paste a short summary (≤ 10 lines) into the Claude.ai chat and **wait for
confirmation before proceeding to Step 8**.

---

## Step 8 — Git commit

Only after Mahmoud confirms the report:

```powershell
git add -A
git commit -m "feat: add SessionDetailPage with clickable History cards and Chart tooltip"
```

---

## Definition of Done

- [ ] `useSleepLog` exports `getEntryById`
- [ ] `SessionDetailPage` renders read-only detail for a valid entryId
- [ ] `SessionDetailPage` renders edit form when `?edit=true` is present
- [ ] `SessionDetailPage` renders not-found state for an unknown entryId
- [ ] Route `history/:entryId` is registered in `App.tsx`
- [ ] `HistoryPage` no longer has in-component edit view swap
- [ ] `EntryCard` whole area is clickable → navigates to detail page
- [ ] `EntryCard` Edit and Delete buttons `stopPropagation` correctly
- [ ] `EntryCard` has right-chevron affordance
- [ ] `Actogram` tooltip card body navigates to detail page on tap
- [ ] `Actogram` tooltip close button does not trigger card navigation
- [ ] `Actogram` tooltip shows "View details →" hint
- [ ] `npm run build` passes with zero errors
- [ ] Session report written and confirmed before commit

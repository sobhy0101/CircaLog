# CC Task — Phase 1 Accessibility: ARIA Labels

**Task file:** `CC_TASK_Phase1_Accessibility_ARIALabels.md`
**Date:** 15 Jun 2026
**Scope:** Task 1 of 6 in the Accessibility Implementation series.
Add missing ARIA labels, dialog roles, a QualityPicker radiogroup refactor,
and `aria-pressed` / `aria-expanded` / `aria-checked` attributes across
11 source files. No new dependencies. No shell commands beyond the final
build verification.

---

## Background

The Phase 1 accessibility scan report is at:

```text
tasks/cc-reports/REPORT_phase1-accessibility-scan_14-jun-2026.md
```

Claude.ai independently cross-checked every ❌ and ⚠️ item in that report
against the live source files before writing this task file. All instructions
below are based on that verified cross-check, not the scan report alone.

---

## Explicitly excluded — do NOT touch

- **`ReferenceArea` sleep blocks in `Actogram.tsx`** — making SVG rects
  keyboard-accessible requires an architectural change (overlay buttons or
  a separate keyboard-navigable list). Deferred to a later task.
- **Hidden file inputs** (`<input type="file" className="hidden">`) in
  `ImportPage.tsx` and `RestorePage.tsx` — `display:none` is intentional.
  The visible trigger button is the AT interface. No fix needed.
- **`aria-describedby` for inline validation errors** in `ManualEntryForm`,
  `WakeUpScreen`, and `EmailCapture` — deferred to a later task.
- **`ImportPage.tsx` leave-warning backdrop** — already has `aria-hidden="true"`.
  Do not change it.

---

## Step 1 — Read CLAUDE.md

Read `CLAUDE.md` at the project root before doing anything else.

---

## Step 2 — QualityPicker.tsx — radiogroup refactor

**File:** `src/components/ui/QualityPicker.tsx`

This is the most involved change in the task. The five rating buttons must
move from an independent-toggle pattern (`aria-pressed`) to a proper
radiogroup (`role="radiogroup"` on the container + `role="radio"` +
`aria-checked` on each button). Arrow key navigation and roving `tabIndex`
are required to match the ARIA radiogroup pattern.

### 2a — Add import

The file currently has no imports. Add at the very top:

```tsx
import { useRef } from 'react';
```

### 2b — Add ref array

Inside the `QualityPicker` function body, before the `return` statement, add:

```tsx
const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
```

### 2c — Add keyboard handler

Immediately after the `buttonRefs` declaration, add:

```tsx
function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, n: number) {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault();
    const nextN = n < 5 ? n + 1 : 1;
    onChange(nextN);
    buttonRefs.current[nextN - 1]?.focus();
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault();
    const prevN = n > 1 ? n - 1 : 5;
    onChange(prevN);
    buttonRefs.current[prevN - 1]?.focus();
  }
}
```

### 2d — Update the container div

The flex wrapper `<div>` that contains the `.map()` buttons currently has no
ARIA attributes. Add `role`, `aria-label`, and keep the existing `className`:

```tsx
<div
  role="radiogroup"
  aria-label={label ?? 'Sleep quality rating'}
  className="flex items-center justify-center gap-3 w-full px-4"
>
```

### 2e — Replace each rating button

Replace the entire `<button>` inside the `.map()` with the following.
Changes from the original: `ref` added, `role="radio"` added,
`aria-pressed` replaced with `aria-checked`, `tabIndex` added,
`onKeyDown` added, `aria-label` updated to be concise:

```tsx
<button
  key={n}
  ref={el => { buttonRefs.current[n - 1] = el; }}
  type="button"
  role="radio"
  aria-checked={selected}
  tabIndex={n === (value ?? 1) ? 0 : -1}
  onClick={() => onChange(n)}
  onKeyDown={e => handleKeyDown(e, n)}
  aria-label={`${n} — ${LABELS[n]}`}
  className={[
    'rounded-full border-2 flex items-center justify-center',
    'aspect-square flex-1 min-w-11 max-w-18 transition-colors',
    selected
      ? 'bg-circa-accent border-circa-accent'
      : 'bg-circa-surface border-circa-border',
  ].join(' ')}
>
  <span
    className={
      selected
        ? 'text-white font-semibold text-sm'
        : 'text-circa-text-secondary text-sm'
    }
  >
    {n}
  </span>
</button>
```

**Notes on `tabIndex`:** `n === (value ?? 1) ? 0 : -1` gives `tabIndex={0}`
to the currently selected button, falling back to button #1 when nothing is
selected. This is the roving-tabIndex pattern required for radiogroups — only
one button in the group is ever in the tab order at a time.

The `LABELS` record is already defined at the top of the file and maps
`1 → 'Very Poor'`, `2 → 'Poor'`, etc. Use it as-is.

---

## Step 3 — ChangelogModal.tsx

**File:** `src/components/ui/ChangelogModal.tsx`

### 3a — Add id to the heading

Find the `<h2>` that renders "What's New" and add `id="changelog-title"`:

```tsx
<h2 id="changelog-title" className="font-heading font-semibold text-circa-text-primary">
  What's New
</h2>
```

### 3b — Add dialog role to the modal panel

Find the modal panel `<div>` — the direct child of the backdrop div, with
classes `w-full sm:max-w-lg max-h-[85vh] bg-circa-surface ...`. Add `role`,
`aria-modal`, and `aria-labelledby` while keeping the existing `className`
exactly as it is:

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="changelog-title"
  className="
    w-full sm:max-w-lg
    max-h-[85vh]
    bg-circa-surface border border-circa-border
    rounded-t-2xl sm:rounded-2xl
    flex flex-col
    overflow-hidden
  "
>
```

---

## Step 4 — DeleteConfirmDialog.tsx

**File:** `src/components/ui/DeleteConfirmDialog.tsx`

### 4a — Add id to the heading

Find the `<h2>` "Delete this session?" and add `id="delete-dialog-title"`:

```tsx
<h2 id="delete-dialog-title" className="text-circa-text-primary font-semibold text-base mb-1">
  Delete this session?
</h2>
```

### 4b — Add dialog role to the card

Find the inner card `<div>` — the one with `bg-circa-surface border
border-circa-border rounded-2xl w-full max-w-sm p-5` and the
`onClick={e => e.stopPropagation()}` handler. Add `role`, `aria-modal`,
and `aria-labelledby`:

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="delete-dialog-title"
  className="bg-circa-surface border border-circa-border rounded-2xl w-full max-w-sm p-5"
  onClick={e => e.stopPropagation()}
>
```

**Important:** Do NOT add `aria-hidden` to the outer backdrop `<div
onClick={onCancel}>`. That outer div is the container for the dialog content —
hiding it would make the entire dialog invisible to AT. The outer div's
`onClick` convenience handler does not need special ARIA treatment.

---

## Step 5 — EmailCapture.tsx

**File:** `src/components/ui/EmailCapture.tsx`

Find the email `<input>` and add `aria-label="Email address"`. The placeholder
is not a substitute for a label in AT. All other attributes stay unchanged:

```tsx
<input
  type="email"
  aria-label="Email address"
  value={email}
  onChange={e => { setEmail(e.target.value); setInputError('') }}
  placeholder="your@email.com"
  disabled={state === 'loading'}
  className="
    flex-1 px-4 py-2 rounded-lg text-sm
    bg-circa-surface border border-circa-border
    text-circa-text-primary placeholder:text-circa-text-muted
    focus:outline-none focus:ring-2 focus:ring-circa-accent
    disabled:opacity-50
    transition-colors duration-150
  "
/>
```

---

## Step 6 — Actogram.tsx — range buttons

**File:** `src/components/chart/Actogram.tsx`

### 6a — Add RANGE_ARIA_LABELS constant

After the existing `RANGES` constant near the top of the file, add:

```tsx
const RANGE_ARIA_LABELS: Record<TimeRange, string> = {
  '1W':  '1 week',
  '2W':  '2 weeks',
  '1M':  '1 month',
  '3M':  '3 months',
  '6M':  '6 months',
  '1Y':  '1 year',
  'All': 'All time',
};
```

`TimeRange` is already imported from `@/hooks/useActogramData` at the top of
the file — no new import needed.

### 6b — Update the button inside RangeButtons

Find the `<button>` inside the `RangeButtons` `.map(RANGES, ...)` and add
`aria-label` and `aria-pressed`. All other attributes and the className
expression stay unchanged:

```tsx
<button
  key={r}
  type="button"
  onClick={() => onChange(r)}
  aria-label={RANGE_ARIA_LABELS[r]}
  aria-pressed={selected === r}
  className={`rounded-full text-xs px-3 border min-h-9 ${
    selected === r
      ? 'text-circa-accent-light border-circa-accent-light'
      : 'text-circa-text-secondary border-circa-border'
  }`}
>
  {r}
</button>
```

The abbreviated text (`{r}` — e.g. "1W") remains as the visible label.
`aria-label` with the full word replaces what screen readers announce.

---

## Step 7 — ManualEntryForm.tsx

**File:** `src/pages/log/ManualEntryForm.tsx`

Each time-entry section has one `<label>` visually covering two inputs (date + time). The fix: associate the `<label>` with the date input via `htmlFor`,
and give the time input a standalone `aria-label`.

### 7a — Bed Time label → add htmlFor

```tsx
<label htmlFor="bedDate" className="block text-sm font-medium text-circa-text-primary mb-1">
  Bed Time{' '}
  <span className="text-circa-text-muted font-normal">(optional)</span>
</label>
```

### 7b — Bed time input → add aria-label

```tsx
<input
  id="bedTime"
  type="time"
  aria-label="Bed time"
  value={bedTime}
  onChange={e => setBedTime(e.target.value)}
  className={`${inputClass} w-32`}
/>
```

### 7c — Fell Asleep label → add htmlFor

```tsx
<label htmlFor="sleepDate" className="block text-sm font-medium text-circa-text-primary mb-1">
  Fell Asleep
</label>
```

### 7d — Sleep time input → add aria-label

```tsx
<input
  id="sleepTime"
  type="time"
  aria-label="Sleep start time"
  value={sleepTime}
  onChange={e => setSleepTime(e.target.value)}
  className={`${inputClass} w-32`}
/>
```

### 7e — Woke Up label → add htmlFor

```tsx
<label htmlFor="wakeDate" className="block text-sm font-medium text-circa-text-primary mb-1">
  Woke Up
</label>
```

### 7f — Wake time input → add aria-label

```tsx
<input
  id="wakeTime"
  type="time"
  aria-label="Wake time"
  value={wakeTime}
  onChange={e => setWakeTime(e.target.value)}
  className={`${inputClass} w-32`}
/>
```

### 7g — Optional fields toggle → add aria-expanded

```tsx
<button
  type="button"
  aria-expanded={showOptional}
  onClick={() => setShowOptional(v => !v)}
  className="flex items-center gap-1 text-circa-accent-light text-sm mt-1"
>
```

### 7h — Had Dreams buttons → add aria-pressed

```tsx
<button
  key={String(v)}
  type="button"
  aria-pressed={hadDreams === v}
  onClick={() => setHadDreams(v)}
  className={[
    'px-5 py-2 rounded-lg text-sm font-medium min-w-[44px] min-h-[44px]',
    hadDreams === v
      ? 'bg-circa-accent text-white'
      : 'bg-circa-surface-raised text-circa-text-secondary',
  ].join(' ')}
>
  {v ? 'Yes' : 'No'}
</button>
```

### 7i — Interruption chip buttons → add aria-pressed

```tsx
<button
  key={type}
  type="button"
  aria-pressed={active}
  onClick={() => toggleInterruption(type)}
  className={[
    'px-3 py-1 rounded-full text-sm min-h-[44px]',
    active
      ? 'bg-circa-accent-subtle text-circa-accent-light'
      : 'bg-circa-surface-raised text-circa-text-secondary',
  ].join(' ')}
>
  {label}
</button>
```

### 7j — Medication taken buttons → add aria-pressed

```tsx
<button
  key={String(v)}
  type="button"
  aria-pressed={medicationTaken === v}
  onClick={() => setMedicationTaken(v)}
  className={[
    'px-5 py-2 rounded-lg text-sm font-medium min-w-[44px] min-h-[44px]',
    medicationTaken === v
      ? 'bg-circa-accent text-white'
      : 'bg-circa-surface-raised text-circa-text-secondary',
  ].join(' ')}
>
  {v ? 'Yes' : 'No'}
</button>
```

### 7k — Medication timing buttons → add aria-pressed

```tsx
<button
  key={t}
  type="button"
  aria-pressed={medicationTiming === t}
  onClick={() => setMedicationTiming(t)}
  className={[
    'px-4 py-2 rounded-lg text-sm font-medium capitalize min-h-[44px]',
    medicationTiming === t
      ? 'bg-circa-accent text-white'
      : 'bg-circa-surface-raised text-circa-text-secondary',
  ].join(' ')}
>
  {t.charAt(0).toUpperCase() + t.slice(1)}
</button>
```

---

## Step 8 — WakeUpScreen.tsx

**File:** `src/pages/log/WakeUpScreen.tsx`

Same label/button pattern as ManualEntryForm. WakeUpScreen has no Bed Time
field (that comes from `inProgress.bedTimeUtc`), so only Fell Asleep and
Wake Time need the label fix.

### 8a — Fell Asleep label → add htmlFor

```tsx
<label htmlFor="sleepDate" className="block text-sm font-medium text-circa-text-primary mb-1">
  Fell Asleep
  <span className="text-circa-text-muted font-normal text-xs ml-1">
    (adjust if you lay awake)
  </span>
</label>
```

### 8b — Sleep time input → add aria-label

```tsx
<input
  id="sleepTime"
  type="time"
  aria-label="Sleep start time"
  value={sleepTime}
  onChange={e => setSleepTime(e.target.value)}
  className={`${inputClass} w-32`}
/>
```

### 8c — Wake Time label → add htmlFor

```tsx
<label htmlFor="wakeDate" className="block text-sm font-medium text-circa-text-primary mb-1">
  Wake Time
</label>
```

### 8d — Wake time input → add aria-label

```tsx
<input
  id="wakeTime"
  type="time"
  aria-label="Wake time"
  value={wakeTime}
  onChange={e => setWakeTime(e.target.value)}
  className={`${inputClass} w-32`}
/>
```

### 8e — Optional fields toggle → add aria-expanded

```tsx
<button
  type="button"
  aria-expanded={showOptional}
  onClick={() => setShowOptional(v => !v)}
  className="flex items-center gap-1 text-circa-accent-light text-sm"
>
```

### 8f — Had Dreams buttons → add aria-pressed

Same pattern as step 7h. Add `aria-pressed={hadDreams === v}` to both buttons.

### 8g — Interruption chip buttons → add aria-pressed

Same pattern as step 7i. Add `aria-pressed={active}` to each chip button.

### 8h — Medication taken buttons → add aria-pressed

Same pattern as step 7j. Add `aria-pressed={medicationTaken === v}` to both buttons.

### 8i — Medication timing buttons → add aria-pressed

Same pattern as step 7k. Add `aria-pressed={medicationTiming === t}` to all three buttons.

---

## Step 9 — ImportPage.tsx — leave warning dialog

**File:** `src/pages/log/ImportPage.tsx`

The leave-during-import warning renders a backdrop `<div>` (already has
`aria-hidden="true"` — do not touch it) and a separate positioning `<div>`
wrapping the card. The card itself needs the dialog role.

### 9a — Add id to the heading

Find the `<h2>` "Import in progress" inside the leave warning card and add
`id="leave-warning-title"`:

```tsx
<h2 id="leave-warning-title" className="font-heading text-base font-semibold text-circa-text-primary">
  Import in progress
</h2>
```

### 9b — Add dialog role to the card

Find the inner card `<div>` with `w-full max-w-sm rounded-2xl bg-circa-surface
border border-circa-border p-6 space-y-4` and add the three dialog attributes:

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="leave-warning-title"
  className="w-full max-w-sm rounded-2xl bg-circa-surface border border-circa-border p-6 space-y-4"
>
```

---

## Step 10 — LogPage.tsx — back button

**File:** `src/pages/log/LogPage.tsx`

Find the "← Back" button in the manual-view header (calls `setView('start')`)
and add `aria-label`:

```tsx
{view === 'manual' && (
  <button
    onClick={() => setView('start')}
    aria-label="Back to log"
    className="text-circa-accent-light text-sm"
  >
    ← Back
  </button>
)}
```

---

## Step 11 — HistoryPage.tsx

**File:** `src/pages/history/HistoryPage.tsx`

### 11a — Filter toggle button → add aria-expanded

The button already has a dynamic `aria-label` switching between "Open filters"
and "Close filters". Add `aria-expanded` for semantic correctness:

```tsx
<button
  type="button"
  onClick={() => setIsFilterOpen(prev => !prev)}
  aria-label={isFilterOpen ? 'Close filters' : 'Open filters'}
  aria-expanded={isFilterOpen}
  className={`min-h-11 min-w-11 flex items-center justify-center ${
    isFilterActive ? 'text-circa-accent-light' : 'text-circa-text-secondary'
  }`}
>
```

### 11b — Sort buttons → add aria-pressed

Find the sort-button `.map()` and add `aria-pressed`:

```tsx
<button
  key={mode}
  type="button"
  aria-pressed={sortMode === mode}
  onClick={() => setSortMode(mode)}
  className={`rounded-full text-xs px-3 border min-h-9 ${
    sortMode === mode
      ? 'text-circa-accent-light border-circa-accent-light'
      : 'text-circa-text-secondary border-circa-border'
  }`}
>
  {label}
</button>
```

### 11c — Type filter buttons → add aria-pressed

Find the type-filter `.map()` and add `aria-pressed`:

```tsx
<button
  key={value}
  type="button"
  aria-pressed={filterType === value}
  onClick={() => setFilterType(value)}
  className={`rounded-full text-xs px-2.5 border min-h-9 ${
    filterType === value
      ? 'bg-circa-accent-subtle text-circa-accent-light border-circa-accent-light'
      : 'bg-transparent text-circa-text-secondary border-circa-border'
  }`}
>
  {label}
</button>
```

### 11d — Quality filter buttons → add aria-label and aria-pressed

The star characters (★) are announced by screen readers as "black star"
repeated — not meaningful. Add `aria-label` and `aria-pressed` to each button:

```tsx
<button
  key={value}
  type="button"
  aria-label={
    value === 0 ? 'All ratings' :
    value === 1 ? '1 star' :
    `${value} stars`
  }
  aria-pressed={filterQuality === value}
  onClick={() => setFilterQuality(value)}
  className={`rounded-full text-xs px-2.5 border min-h-9 ${
    filterQuality === value
      ? 'bg-circa-accent-subtle text-circa-accent-light border-circa-accent-light'
      : 'bg-transparent text-circa-text-secondary border-circa-border'
  }`}
>
  {label}
</button>
```

---

## Step 12 — SessionDetailPage.tsx — back buttons

**File:** `src/pages/history/SessionDetailPage.tsx`

### 12a — Edit-mode "← Back" → add aria-label

This button exits edit mode and returns to the read-only session detail view.
Find it in the edit-mode header (calls `setSearchParams({})`):

```tsx
<button
  type="button"
  aria-label="Back to session details"
  onClick={() => setSearchParams({})}
  className="text-circa-accent-light text-sm"
>
  ← Back
</button>
```

### 12b — Read-only "← Back" → add aria-label

This button returns to the history list. Find it in the read-only header
(calls `navigate(-1)`):

```tsx
<button
  type="button"
  aria-label="Back to history"
  onClick={() => navigate(-1)}
  className="text-circa-accent-light text-sm min-w-14"
>
  ← Back
</button>
```

---

## Step 13 — Build verification

From the project root, run:

```bash
npm run build
```

Confirm the build completes with zero TypeScript errors and zero Vite
warnings. If any TypeScript errors appear, fix them before proceeding to
the report step. Do not proceed if the build fails.

---

## Step 14 — Session report

Write a comprehensive Markdown report covering:

- All 12 file-level steps and their outcomes
- Any deviations from the task instructions, and why
- The complete list of all files modified
- Build output (confirm zero errors)
- Anything that could not be completed as specified

Save the report to:

```text
tasks/cc-reports/REPORT_phase1-aria-labels_{DD}-{mon}-{YYYY}.md
```

Follow markdownlint rules: blank line before and after every fenced code
block, zero warnings.

Paste a short summary (5–10 lines) into the Claude.ai chat and **wait for
confirmation before running the git commit**.

---

## Step 15 — Git commit (after Claude.ai confirmation only)

```bash
git add -A
git commit -m "a11y: add ARIA labels, dialog roles, radiogroup refactor (Task 1 of 6)"
```

# CC TASK — Phase 1: Screen Reader Announcements (Live Regions)

## Objective

Add ARIA annotations so that all dynamic status changes in CircaLog are
announced by screen readers — specifically TalkBack (Android) and VoiceOver
(iOS).

**Three categories of work:**

1. **Inline form validation errors** — add `role="alert"` so errors are
   announced on appearance, and link each error to its input field via
   `aria-describedby` (full association, not just announcement).

2. **Import progress and outcome** — add a live text announcement for row
   progress, `role="progressbar"` semantics on the progress bar, and
   `role="status"` / `role="alert"` on the phase-level result states.

3. **Export and Restore outcomes** — add `role="status"` on success states and
   `role="alert"` on error states so they are announced when the phase changes.

**What is already correct — do not touch:**

- `Toast.tsx` — already has `role="alert"` / `role="status"` and `aria-live`
- `AppShell.tsx` sync status tab — already has `aria-live="polite"`
- All modals and `SideDrawer.tsx` — already have `role="dialog"` + focus traps;
  focus movement handles announcement automatically
- `QualityPicker.tsx` radiogroup — already has `role="radiogroup"`,
  `role="radio"`, `aria-checked`

---

## Pre-Task Reading

Read all six files in a **single** `read_multiple_files` call before writing
any code. Do not edit any file you have not read in this session.

- `src/components/ui/QualityPicker.tsx`
- `src/pages/log/WakeUpScreen.tsx`
- `src/pages/log/ManualEntryForm.tsx`
- `src/pages/log/ImportPage.tsx`
- `src/pages/log/ExportPage.tsx`
- `src/pages/log/RestorePage.tsx`

---

## Changes

### File 1 — `src/components/ui/QualityPicker.tsx`

**Goal:** Allow callers to supply an error paragraph's `id` so the radiogroup
can reference it via `aria-describedby`.

1. Add `errorId?: string` to the `QualityPickerProps` interface.

2. Destructure `errorId` in the function signature alongside the existing props.

3. On the `<div role="radiogroup" ...>` element, add:

```tsx
   aria-describedby={errorId}
```

No other changes to this file.

---

### File 2 — `src/pages/log/WakeUpScreen.tsx`

**ID prefix:** `wake-*` (distinct from ManualEntryForm's `manual-*` prefix —
correct practice even though these two components are never simultaneously
mounted).

**Do NOT touch** the elapsed timer (`{elapsed.h}:{elapsed.m}` updating every
second). It must not receive `aria-live` or any live-region role — announcing
it every second would be severely disruptive to screen reader users.

#### Sleep start pair

On `<input id="sleepDate" type="date" ...>`, add:

```tsx
aria-describedby={sleepError ? 'wake-sleep-error' : undefined}
```

On `<input id="sleepTime" type="time" aria-label="Sleep start time" ...>`, add:

```tsx
aria-describedby={sleepError ? 'wake-sleep-error' : undefined}
```

Change the sleep error paragraph to:

```tsx
{sleepError && (
  <p id="wake-sleep-error" role="alert" className="text-red-400 text-xs mt-1">
    {sleepError}
  </p>
)}
```

#### Wake time pair

On `<input id="wakeDate" type="date" ...>`, add:

```tsx
aria-describedby={wakeError ? 'wake-wake-error' : undefined}
```

On `<input id="wakeTime" type="time" aria-label="Wake time" ...>`, add:

```tsx
aria-describedby={wakeError ? 'wake-wake-error' : undefined}
```

Change the wake error paragraph to:

```tsx
{wakeError && (
  <p id="wake-wake-error" role="alert" className="text-red-400 text-xs mt-1">
    {wakeError}
  </p>
)}
```

#### Quality error

On the `<QualityPicker ...>` call, add:

```tsx
errorId={qualityError ? 'wake-quality-error' : undefined}
```

Change the quality error paragraph to:

```tsx
{qualityError && (
  <p id="wake-quality-error" role="alert" className="text-red-400 text-xs mt-1 text-center">
    {qualityError}
  </p>
)}
```

#### DB error banner

Add `role="alert"` to the DB error `<div>`:

```tsx
{error && (
  <div
    role="alert"
    className="bg-red-900/30 border border-red-700 rounded-lg px-3 py-2 text-red-400 text-sm"
  >
    {error}
  </div>
)}
```

---

### File 3 — `src/pages/log/ManualEntryForm.tsx`

Identical structure to WakeUpScreen. Use `manual-*` as the id prefix.

#### Sleep start pair

On `<input id="sleepDate" type="date" ...>`, add:

```tsx
aria-describedby={sleepError ? 'manual-sleep-error' : undefined}
```

On `<input id="sleepTime" type="time" aria-label="Sleep start time" ...>`, add:

```tsx
aria-describedby={sleepError ? 'manual-sleep-error' : undefined}
```

Change the sleep error paragraph to:

```tsx
{sleepError && (
  <p id="manual-sleep-error" role="alert" className="text-red-400 text-xs mt-1">
    {sleepError}
  </p>
)}
```

#### Wake time pair

On `<input id="wakeDate" type="date" ...>`, add:

```tsx
aria-describedby={wakeError ? 'manual-wake-error' : undefined}
```

On `<input id="wakeTime" type="time" aria-label="Wake time" ...>`, add:

```tsx
aria-describedby={wakeError ? 'manual-wake-error' : undefined}
```

Change the wake error paragraph to:

```tsx
{wakeError && (
  <p id="manual-wake-error" role="alert" className="text-red-400 text-xs mt-1">
    {wakeError}
  </p>
)}
```

#### Quality error

On the `<QualityPicker ...>` call, add:

```tsx
errorId={qualityError ? 'manual-quality-error' : undefined}
```

Change the quality error paragraph to:

```tsx
{qualityError && (
  <p id="manual-quality-error" role="alert" className="text-red-400 text-xs mt-1 text-center">
    {qualityError}
  </p>
)}
```

#### DB error banner

Add `role="alert"` to the DB error `<div>`:

```tsx
{error && (
  <div
    role="alert"
    className="bg-red-900/30 border border-red-700 rounded-lg px-3 py-2 text-red-400 text-sm"
  >
    {error}
  </div>
)}
```

---

### File 4 — `src/pages/log/ImportPage.tsx`

#### Idle phase — gateError paragraph

Add `role="alert"` to the `<p>` in the idle section:

```tsx
{gateError && (
  <p role="alert" className="text-sm text-circa-error px-1">{gateError}</p>
)}
```

#### Parsed/gating phase — gateError block with retry button

Add `role="alert"` to the gate error container `<div>` (the one with
`className="rounded-lg bg-circa-error/10 border border-circa-error/30 px-4 py-3"`):

```tsx
{gateError && (
  <div
    role="alert"
    className="rounded-lg bg-circa-error/10 border border-circa-error/30 px-4 py-3"
  >
    ...existing content unchanged...
  </div>
)}
```

#### Importing phase — progress text

Add `aria-live="polite"` and `aria-atomic="true"` to the "Importing row X of
Y…" paragraph. `aria-atomic="true"` causes the full sentence to be re-announced
each time any part changes — without it, VoiceOver might announce only the
changed number ("5") with no surrounding context:

```tsx
<p
  aria-live="polite"
  aria-atomic="true"
  className="text-sm text-circa-text-secondary"
>
  Importing row{' '}
  <span className="text-circa-text-primary font-medium">{progress.current}</span>
  {' '}of{' '}
  <span className="text-circa-text-primary font-medium">{progress.total}</span>
  …
</p>
```

#### Importing phase — progress bar

Add `role="progressbar"` and its required ARIA value attributes to the
**outer** wrapper div (the one with `className="w-full h-2 rounded-full
bg-circa-surface-raised overflow-hidden"`). The inner fill div needs no change:

```tsx
<div
  role="progressbar"
  aria-valuenow={progress.current}
  aria-valuemin={0}
  aria-valuemax={progress.total}
  aria-label="Import progress"
  className="w-full h-2 rounded-full bg-circa-surface-raised overflow-hidden"
>
  <div
    className="h-full rounded-full bg-circa-accent transition-all duration-300"
    style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
  />
</div>
```

#### Done phase — outer result container

Add `role="status"` to the outer `<div className="space-y-4">` wrapping the
entire done phase (success summary + optional sync error block):

```tsx
{phase === 'done' && result && (
  <div role="status" className="space-y-4">
    ...existing content unchanged...
  </div>
)}
```

#### Done phase — sync error block

Additionally, add `role="alert"` to the sync error `<div>` nested inside the
done phase (the one with `className="rounded-xl bg-circa-error/10 ..."`). This
gives the error block its own assertive announcement, overriding the polite
`role="status"` of its parent when a sync error is present:

```tsx
{result.syncError && (
  <div
    role="alert"
    className="rounded-xl bg-circa-error/10 border border-circa-error/30 px-4 py-4 space-y-2"
  >
    ...existing content unchanged...
  </div>
)}
```

---

### File 5 — `src/pages/log/ExportPage.tsx`

#### Success block

Add `role="status"` to the success container `<div>`:

```tsx
{status === 'done' && (
  <div
    role="status"
    className="rounded-xl bg-circa-success/10 border border-circa-success/30 px-4 py-3"
  >
    <p className="text-sm font-medium text-circa-success">
      ✓ Backup saved. Keep this file somewhere safe.
    </p>
  </div>
)}
```

#### Error block

Add `role="alert"` to the error container `<div>`:

```tsx
{status === 'error' && errorMessage && (
  <div
    role="alert"
    className="rounded-xl bg-circa-error/10 border border-circa-error/30 px-4 py-3"
  >
    <p className="text-sm text-circa-error">{errorMessage}</p>
  </div>
)}
```

---

### File 6 — `src/pages/log/RestorePage.tsx`

RestorePage uses early returns for the `done` and `error` phases, so the entire
page structure replaces on a phase change. `role="status"` and `role="alert"` on
newly mounted elements is the correct approach for VoiceOver (iOS 15+) and
TalkBack (Android 9+).

#### Parsing phase — loading text

Add `role="status"` to the "Reading backup file…" paragraph:

```tsx
<p role="status" className="text-center text-sm text-circa-text-secondary">
  Reading backup file…
</p>
```

#### Restoring phase — loading text

Add `role="status"` to the "Restoring sessions…" paragraph:

```tsx
<p role="status" className="text-center text-sm text-circa-text-secondary">
  Restoring sessions…
</p>
```

#### Done phase — outcome container

Add `role="status"` to the `<div className="space-y-2">` that wraps the
"Restore complete" heading and session count paragraph:

```tsx
<div role="status" className="space-y-2">
  <h2 className="text-xl font-semibold text-circa-text-primary">Restore complete</h2>
  <p className="text-sm text-circa-text-secondary">
    <span className="text-circa-text-primary font-medium">{restoredCount ?? 0}</span> session(s) restored.
  </p>
</div>
```

#### Error phase — outcome container

Add `role="alert"` to the `<div className="space-y-2">` that wraps the
"Restore failed" heading and error message paragraph:

```tsx
<div role="alert" className="space-y-2">
  <h2 className="text-xl font-semibold text-circa-text-primary">Restore failed</h2>
  <p className="text-sm text-circa-text-secondary max-w-xs mx-auto">{errorMessage}</p>
</div>
```

---

## Implementation Notes

### Conditional aria-describedby

Always pass `undefined` when no error exists — not an empty string, and not
a reference to an id that is not currently in the DOM:

```tsx
// Correct — omits the attribute entirely when there is no error
aria-describedby={sleepError ? 'wake-sleep-error' : undefined}

// Wrong — references an id that doesn't exist when sleepError is empty
aria-describedby="wake-sleep-error"
```

### role="alert" on newly mounted elements

The WCAG guidance that live regions must pre-exist in the DOM before content
is inserted is a historical concern for desktop AT (JAWS, NVDA). Modern
VoiceOver (iOS 15+) and TalkBack (Android 9+) — CircaLog's target platforms —
reliably announce `role="alert"` and `role="status"` content even when the
element is freshly added to the DOM. No pre-existing container wrappers are
needed.

### The elapsed timer — do not add aria-live

The `{elapsed.h}:{elapsed.m}` display in `WakeUpScreen` updates every second.
It must not receive `aria-live` or any live-region role under any
circumstances. Announcing it every second would make the screen reader unusable
while logging a session.

---

## Build Check

After all edits, run:

```powershell
npm run build
```

Fix any TypeScript errors before writing the session report.

The most likely source of error: adding `errorId` to `QualityPickerProps`
without also destructuring it in the function signature, or passing `errorId`
as a prop to `<QualityPicker>` before the interface has been updated.

---

## Session Report

Write a report to `tasks/cc-reports/` following the naming convention in
`.claude/memory/feedback_report_conventions.md`.

The report must cover, for every file modified:

- Which elements were changed (identified by their role, id, or descriptive
  label in the source)
- The exact attribute(s) added to each element
- Build output (paste any warnings or errors verbatim)
- Full list of files modified (no files are created in this task)

Paste a short summary into the Claude.ai chat and **wait for confirmation**
before running the git commit.

---

## Git Commit

After confirmation:

```powershell
git add src/components/ui/QualityPicker.tsx src/pages/log/WakeUpScreen.tsx src/pages/log/ManualEntryForm.tsx src/pages/log/ImportPage.tsx src/pages/log/ExportPage.tsx src/pages/log/RestorePage.tsx
git commit -m "a11y: add aria-live, role=alert/status/progressbar, and aria-describedby for screen reader announcements"
```

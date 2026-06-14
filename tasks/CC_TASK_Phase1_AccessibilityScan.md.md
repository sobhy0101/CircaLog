# CC Task — Accessibility Scan (Pre-Task)

**Phase:** 1 — Accessibility Implementation  
**Type:** Read-only scan. No edits to source files. No git operations.  
**Output:** One structured Markdown report saved to `tasks/cc-reports/`  
**Purpose:** Produce a complete inventory of every interactive element in the
app so that Claude.ai can cross-reference it and write the ARIA implementation
task with exact, file-specific instructions rather than generic ones.

---

## What "interactive element" means for this scan

Include anything a user can click, tap, press, focus, or activate:

- `<button>` elements of any kind
- `<a>` anchor elements
- `<input>` elements (text, number, date, time, checkbox, radio)
- `<select>` and `<textarea>` elements
- `<div>` or `<span>` elements with `onClick`, `onKeyDown`, `role="button"`,
  `tabIndex`, or similar interactivity attributes
- Custom components that wrap any of the above
- Any element that is used as a toggle, trigger, pill, chip, or rating control

---

## Files to read

Read all of the following in a single `read_multiple_files` call:
- `src/components/ui/ChangelogModal.tsx`
- `src/components/ui/DeleteConfirmDialog.tsx`
- `src/components/ui/EmailCapture.tsx`
- `src/components/ui/GoogleSignInButton.tsx`
- `src/components/ui/QualityPicker.tsx`
- `src/components/ui/ThemeToggle.tsx`
- `src/components/ui/Toast.tsx`
- `src/components/ui/UserAvatar.tsx`
- `src/components/layout/BottomTabBar.tsx`
- `src/components/layout/SideDrawer.tsx`
- `src/components/chart/Actogram.tsx`
- `src/pages/AppShell.tsx`
- `src/pages/log/LogPage.tsx`
- `src/pages/log/ManualEntryForm.tsx`
- `src/pages/log/StartSleepScreen.tsx`
- `src/pages/log/WakeUpScreen.tsx`
- `src/pages/log/ExportPage.tsx`
- `src/pages/log/ImportPage.tsx`
- `src/pages/log/RestorePage.tsx`
- `src/pages/history/HistoryPage.tsx`
- `src/pages/history/SessionDetailPage.tsx`
- `src/pages/chart/ChartPage.tsx`
- `src/pages/insights/InsightsPage.tsx`
- `src/pages/settings/SettingsPage.tsx`
- `src/pages/reports/ReportsPage.tsx`

---

## What to record for each interactive element

For every interactive element found, record the following fields:

| Field | What to fill in |
|---|---|
| **File** | Relative path from project root |
| **Component / location** | Component name or JSX context where the element lives (e.g. inside a `.map()`, inside the drawer header, etc.) |
| **Element** | The actual JSX tag or component (`<button>`, `<input>`, `<QualityPicker>`, etc.) |
| **Visible text** | Any visible text rendered inside the element. Write `none` if it is icon-only or visually blank. |
| **Existing ARIA** | List every ARIA attribute already present: `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-pressed`, `aria-checked`, `aria-expanded`, `aria-live`, `role`, etc. Write `none` if absent. |
| **Icon only?** | `yes` / `no` — an element is icon-only if its only visual content is an SVG, emoji, or image with no accompanying text. |
| **Current adequacy** | `✅ adequate` / `⚠️ partial` / `❌ missing` — see definitions below |
| **Notes** | Any relevant observation: what the element does, why the current state is inadequate, related elements that need coordinated changes. |

### Adequacy definitions

- **`✅ adequate`** — Element has sufficient visible text OR sufficient ARIA
  attributes that a screen reader can announce its purpose without guessing.
- **`⚠️ partial`** — Element has some ARIA, but it is incomplete, ambiguous,
  or incorrect. For example: a button group where individual buttons are labeled
  but the group itself has no `role` or `aria-label`.
- **`❌ missing`** — Element has no visible text and no ARIA attributes,
  OR its ARIA is fundamentally wrong for its role (e.g. a toggle button with
  no `aria-pressed`).

---

## Special elements — additional checks

### Quality rating (`QualityPicker.tsx`)

Beyond the standard fields above, also check:

- Does the outer container have `role="radiogroup"` and an `aria-label`
  describing what is being rated?
- Does each star/option have `role="radio"` and `aria-checked`?
- Is there keyboard support (`onKeyDown` handling arrow keys)?
- If any of these are absent, flag them explicitly.

### Modals and dialogs (`ChangelogModal.tsx`, `DeleteConfirmDialog.tsx`)

Beyond the standard fields, also check:

- Does the modal container have `role="dialog"` and `aria-modal="true"`?
- Does it have `aria-labelledby` pointing to the modal title's `id`?
- Does it have `aria-describedby` if there is a description paragraph?

### Side drawer (`SideDrawer.tsx`)

Beyond the standard fields, also check:

- Does the drawer container have `role="dialog"` or `role="navigation"`
  (whichever matches its actual function)?
- Does it have `aria-label` or `aria-labelledby`?
- Is there a close button? If yes, does it have `aria-label="Close navigation"`
  or similar?

### Sync status pill / status indicators (`AppShell.tsx` or wherever it lives)

- Note its element type and whether it has a `role` and `aria-label` that
  conveys the current sync state to screen readers.
- Note whether status changes (syncing → synced → error) are announced.
  If no `aria-live` region wraps this element, flag it.

### Tab bar (`BottomTabBar.tsx`)

- Does the outer `<nav>` have `aria-label="Main navigation"` or similar?
- Does each tab button have a visible text label, or is it icon + text?
- If icon-only, does each tab have `aria-label`?
- Does the active tab have `aria-current="page"` or `aria-pressed="true"`?

### Actogram range toggle (`Actogram.tsx` or `ChartPage.tsx`)

- Find the `[ 1W ] [ 1M ] [ 3M ] [ 6M ] [ 1Y ] [ All ]` buttons.
- Do they have `aria-pressed` reflecting the currently selected range?
- Do they have `aria-label` that includes the full word (e.g. "1 week") rather
  than the abbreviation "1W"?

### Form inputs (`ManualEntryForm.tsx`, `StartSleepScreen.tsx`, `WakeUpScreen.tsx`)

- For every `<input>`, `<select>`, or `<textarea>`: is there a `<label>`
  element with a matching `htmlFor`, or an `aria-label`, or an `aria-labelledby`?
- Are error messages (if any exist) associated with their input via
  `aria-describedby`?

---

## Report format

Save the report to:

```text
tasks/cc-reports/REPORT_phase1-accessibility-scan_{DD}-{mon}-{YYYY}.md
```

Use today's actual date in the filename (e.g. `14-jun-2026`).

The report must contain the following sections in order:

### Section 1 — Summary table

A single Markdown table listing every interactive element found, with all
fields from the "What to record" section above as columns.

Sort the rows by file path (alphabetical), then by order of appearance
within the file.

### Section 2 — Priority grouping

Group the elements from Section 1 into three lists:

1. **❌ Missing ARIA — fix required** (all elements marked `❌ missing`)
2. **⚠️ Partial ARIA — fix recommended** (all elements marked `⚠️ partial`)
3. **✅ Adequate — no action needed** (all elements marked `✅ adequate`)

Within each group, keep the same file-path sort order.

### Section 3 — Special element detail

For each of the five special element categories (QualityPicker, modals,
SideDrawer, sync pill, tab bar, actogram range toggle, form inputs), write
a short paragraph (3–6 sentences) describing what was found and exactly what
is currently missing or wrong. If everything is correct for a category,
say so explicitly rather than omitting it.

### Section 4 — File list

A plain list of every file that was read, with a one-line confirmation that
it was read successfully. If any file could not be read, note the error.

---

## Constraints

- **Do not edit any source file.** This task is read-only.
- **Do not run the dev server.** This task is static analysis only.
- **Do not make any git operations** (no add, commit, push, or stash).
- **Do not attempt to install any packages.**
- If a file is empty or contains only a placeholder, note that in Section 4 and skip it in the element table.

---

## After saving the report

Paste the following into the Claude.ai chat and **stop**:

```markdown
Accessibility scan complete.
Report saved to: tasks/cc-reports/REPORT_phase1-accessibility-scan_{date}.md
Summary:

Total interactive elements found: {N}
❌ Missing ARIA: {N}
⚠️ Partial ARIA: {N}
✅ Adequate: {N}
Files read: {N} / 25
```

Do not begin any implementation. Wait for Claude.ai to review the report
and confirm the next task file before doing anything else.

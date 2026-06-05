# CC Task — Phase 1 Batch D: History View Sort & Filter

**Assigned to:** Claude Code
**Written by:** Claude.ai, 05 Jun 2026 (revised 05 Jun 2026)
**Scope:** `src/pages/history/HistoryPage.tsx` only — no other files touched.

---

## Context

The History View list is complete and working (built in Batch C). It currently
shows all entries newest-first with no way to reorder or narrow the list.

This task adds:
1. **Sort** — four sort modes selectable from a compact button row below the header
2. **Filter** — a collapsible filter panel, hidden by default, opened via a
   filter icon button in the header

Both live entirely inside `HistoryPage.tsx`. No new files. No new dependencies.
No schema changes.

**Important:** CC previously built a chip-row filter UI for this task. That
version was rejected — the chip rows were too crowded on mobile. This task
file describes the replacement design. Read it fully before writing any code.

---

## Step 0 — Read skills

Read the following skills before writing any code:

- `.claude/skills/token-usage/SKILL.md`
- `.claude/skills/run/SKILL.md`
- `.claude/skills/visual-check/SKILL.md`

---

## Step 1 — Understand the current file

Read `src/pages/history/HistoryPage.tsx` in full before touching anything.

---

## Step 2 — Header layout

The `<header>` block currently contains only the "History" title and the
session count subtitle. Modify it to add a filter icon button on the right:

```
[ History          ] [ ⚙ filter icon ]
[ 13 sessions      ]
```

- The filter icon button uses a standard funnel/filter SVG icon (use a simple
  inline SVG — no icon library needed).
- When no filters are active: icon is `text-circa-text-secondary`.
- When any filter is active: icon is `text-circa-accent-light` AND render a
  small filled violet dot (`w-2 h-2 rounded-full bg-circa-accent`) as an
  absolute-positioned indicator on the top-right corner of the button.
  This dot signals "filters are on" even when the panel is collapsed.
- Button `aria-label`: `"Open filters"` when panel is closed,
  `"Close filters"` when open.
- Minimum touch target: `min-h-[44px] min-w-[44px]`.

---

## Step 3 — Sort row

A compact button row directly below the `<header>` block. Always visible
when there is at least one entry. Four sort modes:

| Label | Behaviour |
|---|---|
| `Newest` | `sleepStartUtc` descending (current default) |
| `Oldest` | `sleepStartUtc` ascending |
| `Rating ↑` | `quality` ascending (1 first) |
| `Rating ↓` | `quality` descending (5 first) |

- Active button: `text-circa-accent-light` + `border-circa-accent-light` border
- Inactive buttons: `text-circa-text-secondary` + `border-circa-border` border
- All buttons: `rounded-full`, `text-xs`, `px-3`, `border`, `min-h-[36px]`
- Row: `overflow-x-auto flex gap-2 whitespace-nowrap px-4 py-2`

Default sort on first render: `Newest`.

### Implementation notes

- Sort is applied to the `entries` array from `useSleepLog` in-component —
  do not modify the hook or the service.
- Use a `sortMode` state variable: `'newest' | 'oldest' | 'rating-asc' | 'rating-desc'`
- Derive a `sortedEntries` array from `entries` + `sortMode` using `useMemo`.

---

## Step 4 — Collapsible filter panel

### Visibility

Use a `isFilterOpen` boolean state, default `false`. When `true`, the panel
renders between the sort row and the entry list, pushing the list down.
No animation required — a simple conditional render is fine.

### Panel layout

The panel has a `bg-circa-surface-raised` background, `border-b border-circa-border`,
and `px-4 py-3` padding.

Inside the panel, two filter rows stacked vertically with `gap-3`:

**Row 1 — Session type** (label + three buttons):
```
Type:  [ All ]  [ Main Sleep ]  [ Nap ]
```

**Row 2 — Quality** (label + six buttons):
```
Rating:  [ All ]  [ ★ ]  [ ★★ ]  [ ★★★ ]  [ ★★★★ ]  [ ★★★★★ ]
```

Each row is a `flex items-center gap-2` container. The label
(`"Type:"`, `"Rating:"`) uses `text-circa-text-muted text-xs w-12 shrink-0`.
The button group uses `overflow-x-auto flex gap-1.5 whitespace-nowrap`.

Button styles (same as sort row):
- Active: `text-circa-accent-light border-circa-accent-light bg-circa-accent-subtle`
- Inactive: `text-circa-text-secondary border-circa-border bg-transparent`
- All: `rounded-full text-xs px-2.5 border min-h-[36px]`

At the bottom-right of the panel, a `"Clear"` text button
(`text-circa-accent-light text-xs`) that resets both filters to their defaults
and is only visible when at least one filter is active.

### Implementation notes

- Use `filterType` state: `'all' | 'main' | 'nap'`
- Use `filterQuality` state: `0 | 1 | 2 | 3 | 4 | 5` (0 = no filter)
- A filter is considered "active" when `filterType !== 'all'` OR
  `filterQuality !== 0`.
- Derive `visibleEntries` from `sortedEntries` + `filterType` + `filterQuality`
  using `useMemo`.

---

## Step 5 — Session count subtitle

Update the subtitle to show:

- Filters inactive: `"N sessions"` (total, as before)
- Filters active: `"N of M sessions"` (visible count vs. total)

---

## Step 6 — No-match state

When active filters reduce `visibleEntries` to zero, show — in place of the
entry list:

```
No sessions match the current filters.
[Clear filters]   ← text button, resets both filters
```

Use `text-circa-text-secondary text-sm text-center` for the message and
`text-circa-accent-light text-sm` for the Clear filters button.

Do **not** show the `EmptyState` component here — that is reserved for when
the database has no entries at all.

---

## Step 7 — Token usage rules (mandatory)

Read `.claude/skills/token-usage/SKILL.md` before writing any class string.

- All colours must use `circa-*` tokens. No raw Tailwind palette classes
  except `red-*` for error/destructive states.
- No `import React from 'react'` in the `.tsx` file — the project uses
  `"jsx": "react-jsx"` and `"noUnusedLocals": true`.
- No inline `style={{}}` objects for anything that can be expressed as a
  Tailwind class.

---

## Step 8 — TypeScript check

Run:

```bash
npx tsc --noEmit
```

Fix all errors before proceeding. Zero errors is the pass condition.

---

## Step 9 — Dev server + visual check

Read `.claude/skills/run/SKILL.md` and `.claude/skills/visual-check/SKILL.md`.

Start the dev server and take screenshots for the standard theme scenarios
(dark default, light mode, dark restored) per the visual check skill.

Mark the following as **manual checks** in the report — do not attempt to
automate them with Playwright:

1. Sort row visible below header; all four buttons present
2. Filter icon visible in header, no dot indicator when no filters active
3. Tapping filter icon opens/closes the panel
4. Dot indicator appears on filter icon when a filter is active
5. Session type buttons in panel filter correctly
6. Quality buttons in panel filter correctly
7. `"N of M sessions"` counter updates when filters are active
8. `"Clear"` button in panel and `"Clear filters"` no-match state both reset filters
9. No layout breakage at 375px viewport width

---

## Step 10 — Session report

Before committing, write a comprehensive Markdown report to:

```text
tasks/cc-reports/REPORT_phase1-batchd_{DD}-{mon}-{YYYY}.md
```

The report must cover:
- All steps completed and their outcomes
- Any deviations from these instructions and why
- Full list of files modified (should be exactly one: `HistoryPage.tsx`)
- `tsc --noEmit` output (confirm zero errors)
- Playwright theme check results (dark default, light mode, dark restored)
- Manual check items listed with status "manual — to be verified by Mahmoud"

Then paste a short summary into the Claude.ai chat and **wait for
confirmation** before running the git commit step.

---

## Step 11 — Git commit (after confirmation only)

```bash
git add src/pages/history/HistoryPage.tsx
git commit -m "feat(history): add sort row and collapsible filter panel"
```

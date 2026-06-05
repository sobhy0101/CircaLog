# CC Task — Phase 1 Batch D (v2): Replace Filter Chips with Collapsible Filter Panel

**Assigned to:** Claude Code
**Written by:** Claude.ai, 05 Jun 2026
**Scope:** `src/pages/history/HistoryPage.tsx` only — no other files touched.

---

## Context

The sort row and chip-row filter UI from Batch D v1 are already committed.
The chip-row filter design was rejected after review — two full chip rows
above the entry list are too crowded on a 375px mobile screen.

This task **replaces the chip rows with a collapsible filter panel**.
The sort row stays exactly as-is. Only the filter UI changes.

Read the current `HistoryPage.tsx` in full before writing a single line.
The sort row implementation, `useMemo` logic, session count subtitle, and
no-match state can all be preserved — only the filter UI surface changes.

---

## Step 0 — Read skills

- `.claude/skills/token-usage/SKILL.md`
- `.claude/skills/run/SKILL.md`
- `.claude/skills/visual-check/SKILL.md`

---

## Step 1 — Remove the chip rows

Delete the two chip rows (session type chips and quality chips) that currently
sit between the sort row and the entry list. The filter state variables
(`filterType`, `filterQuality`) and the `visibleEntries` useMemo are kept —
only the rendered chip UI is removed.

---

## Step 2 — Filter icon button in the header

Modify the `<header>` block to add a filter icon button on the right side,
so the header reads:

```text
[ History                    ] [ filter icon button ]
[ N sessions / N of M sessions ]
```

The button:
- Uses an inline SVG funnel/filter icon (no icon library — write the SVG inline)
- `min-h-[44px] min-w-[44px]` touch target, `flex items-center justify-center`
- When no filters are active: icon `text-circa-text-secondary`
- When any filter is active (`filterType !== 'all'` OR `filterQuality !== 0`):
  - Icon changes to `text-circa-accent-light`
  - Render a small filled dot: `w-2 h-2 rounded-full bg-circa-accent`
    absolutely positioned at the top-right corner of the button
    (`absolute top-1 right-1`)
  - Wrap the button in `relative` positioning to anchor the dot
- `aria-label="Open filters"` when panel is closed,
  `aria-label="Close filters"` when open
- Toggling the button flips `isFilterOpen` boolean state (default `false`)

---

## Step 3 — Collapsible filter panel

When `isFilterOpen` is `true`, render the panel **between the sort row and
the entry list**. No animation — a plain conditional render is fine.

Panel wrapper:

```tailwind
bg-circa-surface-raised border-b border-circa-border px-4 py-3
```

Inside the panel, two rows stacked with `space-y-3`:

### Row 1 — Session type

```text
Type:   [ All ]  [ Main Sleep ]  [ Nap ]
```

Layout: `flex items-center gap-2`
- Label `"Type:"`: `text-circa-text-muted text-xs w-14 shrink-0`
- Button group: `flex gap-1.5 flex-wrap`

### Row 2 — Quality rating

```text
Rating:   [ All ]  [ ★ ]  [ ★★ ]  [ ★★★ ]  [ ★★★★ ]  [ ★★★★★ ]
```

Layout: `flex items-center gap-2`
- Label `"Rating:"`: `text-circa-text-muted text-xs w-14 shrink-0`
- Button group: `overflow-x-auto flex gap-1.5 whitespace-nowrap`

### Button styles (both rows)

Active button:
`bg-circa-accent-subtle text-circa-accent-light border-circa-accent-light`

Inactive button:
`bg-transparent text-circa-text-secondary border-circa-border`

All buttons:
`rounded-full text-xs px-2.5 border min-h-[36px]`

### Clear button

Bottom-right of the panel. Only visible when any filter is active.
`text-circa-accent-light text-xs` — resets `filterType` to `'all'` and
`filterQuality` to `0`.

---

## Step 4 — Preserve existing logic

The following must be kept exactly as-is from the v1 implementation:

- `sortMode` state and `sortedEntries` useMemo
- `filterType` and `filterQuality` state variables
- `visibleEntries` useMemo (derived from sortedEntries + both filters)
- Session count subtitle: `"N sessions"` vs `"N of M sessions"`
- No-match state: `"No sessions match the current filters."` + `"Clear filters"` link
- `EmptyState` component (shown only when DB has no entries at all)

---

## Step 5 — Token usage rules (mandatory)

- All colours: `circa-*` tokens only. No raw Tailwind palette classes except
  `red-*` for destructive states.
- No `import React from 'react'`
- No inline `style={{}}` objects

---

## Step 6 — TypeScript check

```bash
npx tsc --noEmit
```

Zero errors required before proceeding.

---

## Step 7 — Dev server + visual check

Run the standard theme scenarios from `.claude/skills/visual-check/SKILL.md`
(dark default, light mode, dark restored). Screenshots to `tasks/screenshots/`.

Mark the following as **manual checks** — do not attempt Playwright
interaction automation:

1. Filter icon visible in header, no dot when no filters active
2. Tapping filter icon opens the panel; tapping again closes it
3. Dot indicator appears on icon when a filter is active
4. Session type buttons filter the list correctly
5. Quality buttons filter the list correctly
6. `"N of M sessions"` updates when filters are active
7. `"Clear"` in panel and `"Clear filters"` in no-match state both reset filters
8. Sort row still works correctly (unchanged)
9. No layout breakage at 375px viewport width

---

## Step 8 — Session report

Write the report to:

```text
tasks/cc-reports/REPORT_phase1-batchd-v2_{DD}-{mon}-{YYYY}.md
```

Cover:
- Steps completed and outcomes
- Deviations from instructions and why
- Files modified (must be exactly one: `HistoryPage.tsx`)
- `tsc --noEmit` result
- Playwright theme check results
- Manual check items listed as "manual — to be verified by Mahmoud"

Paste a short summary into the Claude.ai chat and **wait for confirmation**
before running the git commit.

---

## Step 9 — Git commit (after confirmation only)

```bash
git add src/pages/history/HistoryPage.tsx
git commit -m "feat(history): replace filter chips with collapsible filter panel"
```

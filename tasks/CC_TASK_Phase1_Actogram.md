# CC Task — Phase 1: Actogram Chart

**Prepared by:** Claude.ai  
**For:** Claude Code  
**Date:** 06 Jun 2026

---

## Context

CircaLog is an offline-first PWA sleep tracker for patients with Non-24-Hour
Sleep-Wake Disorder (Non-24). The actogram is the primary visualization:
a clinical chart that makes the patient's circadian drift immediately visible
to both the patient and their doctor.

The circadian engine (Phase 0.5) is complete. The sleep log UI (Phase 1
Batch B/C) is complete. This task builds the actogram chart, wires it to a
new Chart page and route, and adds the time range filter.

**Project root:** `C:\Projects\CircaLog\`  
**Live URL:** circalog.vercel.app  
**GitHub:** sobhy0101/CircaLog

---

## Skill reads (do these first)

Before writing any code, read:

1. `.claude/skills/run/SKILL.md` — PowerShell only; bash commands fail on this machine
2. `.claude/skills/visual-check/SKILL.md` — for the visual verification step
3. `.claude/skills/token-usage/SKILL.md` — color token reference

---

## What this task builds

| File | Action |
|---|---|
| `src/hooks/useActogramData.ts` | New hook — data transform layer |
| `src/components/chart/Actogram.tsx` | New component — the chart |
| `src/pages/chart/ChartPage.tsx` | New page |
| `src/App.tsx` | Add `/log/chart` route |
| `src/pages/AppShell.tsx` | No change needed |
| `src/components/layout/BottomTabBar.tsx` | Wire Chart tab navigation |

Six files total. No new npm dependencies — Recharts is already installed.

---

## Critical design decisions (do not deviate)

### Y axis: minutes since midnight, dynamically extended

The Y axis represents time of day expressed as **minutes since midnight
(00:00 = 0, 23:59 = 1439)**. However, the axis is **not** capped at 1440.

This patient has sleep sessions lasting up to 51 hours. A session starting
at 22:00 (minute 1320) that ends 51 hours later plots continuously to
minute 4380. The Y axis maximum must be calculated dynamically from the
visible data:

```text
yMax = max wake minute across all visible entries, rounded up to the
       nearest 6-hour boundary (360 minutes), with a minimum of 1440.
```

This is the standard clinical actogram layout. Sessions are **never split
at midnight**. A sleep block is always a single contiguous vertical bar,
regardless of how many calendar days it spans.

Y axis tick interval: every 6 hours (0, 360, 720, 1080, 1440, 1800, …).
Y axis tick labels: formatted as `HH:MM`. Values ≥ 1440 display as
`(+1d) HH:MM`, values ≥ 2880 as `(+2d) HH:MM`, and so on. Example:
minute 1500 = `(+1d) 01:00`.

**The Y axis is inverted**: 00:00 is at the top, later times are lower.
This matches the clinical convention where "falling asleep later and later"
is visible as bars drifting downward across the chart.

### X axis: one column per cycle

Each column on the X axis represents one **cycle number**. The cycle number
is the primary X axis label. Below each cycle number label, show the
calendar date of that cycle's primary sleep entry (`Cycle.calendarDate`
formatted as `DD MMM`, e.g. `05 Jun`).

The X axis must accommodate any number of cycles. The chart renders at a
fixed column width and becomes horizontally scrollable when cycles exceed
the viewport. Column width: **56px per cycle** (compact but readable).

### Sleep blocks

Each `SleepEntry` in a cycle renders as a **vertical rectangle** (a bar
from sleep start to wake time) in the cycle's column.

- **Main sleep** (`sessionType === 'main'`): solid violet fill
  (`var(--circa-accent)` = `#7C3AED`), opacity 0.85.
- **Nap** (`sessionType === 'nap'`): same violet but opacity 0.35, with a
  1px dashed border at `var(--circa-accent)` to remain visible in both
  themes.

If a cycle contains multiple entries (e.g. a main sleep + a nap), both
bars render in the same column, potentially overlapping. Do not merge them.

### Tooltip

On tap/click of a sleep bar, show a custom overlay panel (not Recharts
`<Tooltip>` — it does not work with `ReferenceArea`). The overlay shows:

- Cycle number and calendar date
- Session type (Main Sleep / Nap)
- Sleep start time (local, HH:MM)
- Wake time (local, HH:MM)
- Duration (e.g. "7h 23m")
- Quality rating (1–5 dots, matching the History view style)

The overlay dismisses on tap outside or on a close button. Only one overlay
is visible at a time.

### Touch pan (horizontal scroll)

The chart renders inside a `div` with `overflow-x: auto` and
`-webkit-overflow-scrolling: touch`. The chart `div` inside has a fixed
pixel width equal to `(numberOfCycles * 56) + leftAxisWidth`. This gives
native horizontal scrolling on mobile without any JavaScript swipe handler.

Pinch-to-zoom is explicitly **out of scope** for this task.

### Time range filter

Six buttons rendered above the chart:

```text
[ 1W ]  [ 1M ]  [ 3M ]  [ 6M ]  [ 1Y ]  [ All ]
```

Default: `All` (see note below).

The filter works on **calendar date of the primary entry** (`Cycle.calendarDate`),
cutting off cycles whose date falls before `today - N days`. "Today" is
derived from `new Date()` at render time.

> **Dev note (inline comment in code):** Default is `All` during development
> because the data set is sparse. When production data accumulates, the
> default should be changed to `'1W'` (7 days). The string `'TODO: change default to 1W'`
> must appear as a comment on the `useState` line for the range.

The filter is a pure display filter — no entries are removed from IndexedDB.

### Empty state

When there are no sleep entries at all, show an empty state panel:

```text
🌙
No sleep data yet.
Head to the Log tab to record your first session.
```

Match the style of the empty state in `src/pages/history/HistoryPage.tsx`.

### Theme correctness

All colors must use `circa-*` CSS variables only. No hardcoded hex values
inside the component. The chart background must be `var(--circa-bg)` and
the grid lines `var(--circa-border)`.

---

## Step-by-step instructions

### Step 1 — Read skill files

Read `.claude/skills/run/SKILL.md`, `.claude/skills/visual-check/SKILL.md`,
and `.claude/skills/token-usage/SKILL.md` before proceeding.

### Step 2 — Read existing files

Read these files before writing anything:

- `src/App.tsx`
- `src/components/layout/BottomTabBar.tsx`
- `src/hooks/useSleepLog.ts`
- `src/lib/circadian/types.ts` (especially `SleepEntry`, `Cycle`)
- `src/lib/circadian/groupEntriesByCycle.ts`
- `src/lib/circadian/index.ts`
- `src/pages/history/HistoryPage.tsx` (for style patterns to match)
- `src/index.css` (for all `circa-*` token names)

### Step 3 — Create `src/hooks/useActogramData.ts`

This hook is the data transform layer between the raw DB entries and the
chart component. It must not contain any JSX.

The hook reads from `useSleepLog` and produces chart-ready data. Its public
interface:

```typescript
export type TimeRange = '1W' | '1M' | '3M' | '6M' | '1Y' | 'All'

export interface SleepBlock {
  entryId: string
  cycleNumber: number
  sessionType: 'main' | 'nap'
  // Minutes since midnight (00:00 = 0). Can exceed 1440 for sessions
  // that span into the next calendar day or beyond.
  startMinute: number
  endMinute: number   // Always > startMinute; never wraps — extends past 1440
  quality: number
  // For tooltip display
  sleepStartUtc: string
  wakeUtc: string
  ianaTimezone: string
}

export interface ActogramCycle {
  cycleNumber: number
  calendarDate: string   // YYYY-MM-DD — the primary entry's date
  blocks: SleepBlock[]
}

export interface ActogramData {
  cycles: ActogramCycle[]     // Sorted by cycleNumber ascending
  yMax: number               // Dynamic Y axis ceiling in minutes
  isEmpty: boolean
}
```

**Computing `startMinute` and `endMinute`:**

Convert `sleepStartUtc` to local time in `entry.ianaTimezone`, then compute
minutes since midnight of that local date.

For `endMinute`: compute the difference between `wakeUtc` and `sleepStartUtc`
in milliseconds, convert to minutes, then add to `startMinute`. This
ensures sessions that extend past 24:00 (or 48:00, or more) produce an
`endMinute` greater than 1440 rather than wrapping.

Example: sleep start local 22:00 = minute 1320. Duration = 51 hours =
3060 minutes. `endMinute` = 1320 + 3060 = 4380.

**Computing `yMax`:**

```ts
const rawMax = Math.max(...allBlocks.map(b => b.endMinute), 1440)
const yMax = Math.ceil(rawMax / 360) * 360
```

This rounds up to the next 6-hour boundary (minimum 1440).

**Time range filtering:**

Filter `ActogramCycle` records by `calendarDate >= cutoffDate` where
`cutoffDate` is `today - N days` formatted as `YYYY-MM-DD`. Comparison
is a plain string compare (`>=`) because both sides are `YYYY-MM-DD`.
`'All'` applies no filter.

The hook also re-runs `groupEntriesByCycle` on the entries from `useSleepLog`
each time. Import `groupEntriesByCycle` from `@/lib/circadian`.

The hook signature:

```typescript
export function useActogramData(range: TimeRange): ActogramData & {
  isLoading: boolean
  error: string | null
}
```

### Step 4 — Create `src/components/chart/` directory

Create the directory. Then create `src/components/chart/Actogram.tsx`.

### Step 5 — Build `src/components/chart/Actogram.tsx`

This component receives `ActogramData` as props plus a `selectedRange` and
`onRangeChange` for the filter buttons. It renders the full actogram UI:
the range toggle, the scrollable chart, and the tooltip overlay.

**Props interface:**

```typescript
interface ActogramProps {
  data: ActogramData
  selectedRange: TimeRange
  onRangeChange: (range: TimeRange) => void
}
```

**Implementation notes:**

1. Use Recharts `ComposedChart` as the outer container. Set `margin` to
   `{ top: 8, right: 16, bottom: 8, left: 56 }` (left margin for the
   Y axis labels).

2. Render one `ReferenceArea` per `SleepBlock`. Map `startMinute` to `y1`
   and `endMinute` to `y2`. Map `cycleNumber - 0.4` to `x1` and
   `cycleNumber + 0.4` to `x2` (so blocks are 80% of column width,
   centred).

3. `YAxis`: domain `[0, yMax]`, inverted (`reversed={true}`). Tick values
   at every 360 minutes. Format tick labels using the helper:

   ```typescript
   function formatYTick(minutes: number): string {
     const days = Math.floor(minutes / 1440)
     const rem = minutes % 1440
     const h = Math.floor(rem / 60).toString().padStart(2, '0')
     const m = (rem % 60).toString().padStart(2, '0')
     return days > 0 ? `(+${days}d) ${h}:${m}` : `${h}:${m}`
   }
   ```

4. `XAxis`: type `number`, domain `[minCycle - 0.5, maxCycle + 0.5]`,
   ticks at each cycle number. Custom tick renderer that shows the cycle
   number on line 1 and the calendar date (`DD MMM` format) on line 2.

5. `CartesianGrid`: horizontal lines only (`vertical={false}`), stroke
   `var(--circa-border)`, strokeDasharray `3 3`.

6. Tooltip: implement as a `useState<SleepBlock | null>` overlay, not
   Recharts `<Tooltip>`. Each `ReferenceArea` gets an `onClick` handler
   that sets the selected block. An overlay `div` renders when a block
   is selected, positioned absolutely over the chart. It must include a
   close button. Clicking anywhere on the chart background (not a block)
   clears the selection.

7. Chart width: `Math.max(cycles.length * 56, containerWidth)`. Use a
   `useRef` + `ResizeObserver` to track the container width so the chart
   never renders narrower than the viewport.

8. Wrap the `ComposedChart` in a scrollable `div`:
   `overflow-x: auto; -webkit-overflow-scrolling: touch`.

9. Nap styling: `fill="var(--circa-accent)"` with `fillOpacity={0.35}` and
   `stroke="var(--circa-accent)"` with `strokeDasharray="4 2"` on the
   `ReferenceArea`.

10. Main sleep styling: `fill="var(--circa-accent)"` with
    `fillOpacity={0.85}`, no stroke.

11. All color values must be CSS variable references, not hex strings.

12. Include inline comments explaining what non-obvious code does.
    The developer has a design background and intermediate JavaScript
    skills — over-comment rather than under-comment.

### Step 6 — Create `src/pages/chart/ChartPage.tsx`

Follow the page structure pattern from `src/pages/history/HistoryPage.tsx`.

- Page header: title "Chart", subtitle showing cycle count when data exists.
- Mounts `useActogramData` with the range state.
- Passes data and range callbacks to `<Actogram />`.
- Shows loading skeleton (3 placeholder bars, matching History page style)
  while `isLoading` is true.
- Shows error banner if `error` is non-null.
- Shows `<EmptyState />` when `data.isEmpty` is true.

`EmptyState` is a local component inside `ChartPage.tsx` — same structure
and style as the one in `HistoryPage.tsx`.

### Step 7 — Update `src/App.tsx`

Add the Chart route as a sibling to the History route:

```tsx
import ChartPage from '@/pages/chart/ChartPage'

// Inside the /log Route children:
<Route path="chart" element={<ChartPage />} />
```

Read the current file first. Add only what is needed — do not restructure
or reformat anything.

### Step 8 — Update `src/components/layout/BottomTabBar.tsx`

Wire the Chart tab button. Currently it has no `onClick`. Add:

```tsx
onClick={() => navigate('/log/chart')}
```

And set the active detection:

```tsx
const isChart = pathname === '/log/chart';
```

Pass `isChart` to `tabClass(isChart)` on the Chart button.

Read the current file first. Add only what is needed.

### Step 9 — Run the dev server and verify visually

Follow `.claude/skills/run/SKILL.md` (PowerShell only). Start the dev
server and follow `.claude/skills/visual-check/SKILL.md` for browser
verification.

Verify:

- [ ] Chart tab in bottom nav navigates to `/log/chart`
- [ ] Chart tab highlights as active when on the chart page
- [ ] Empty state renders correctly when no sleep entries exist
- [ ] If test data exists: sleep blocks render as vertical bars in the
      correct columns
- [ ] Nap blocks are visually distinct from main sleep blocks
- [ ] Y axis labels show correct times, including `(+1d)` suffix for
      values over 24:00
- [ ] Y axis is inverted (00:00 at top)
- [ ] Range toggle buttons render; clicking changes the visible range
- [ ] Tooltip overlay appears on block tap/click and dismisses correctly
- [ ] Chart scrolls horizontally when cycles exceed viewport width
- [ ] Dark and light themes both render without broken colors

### Step 10 — Seed data check (optional)

If `tasks/dev-seed.js` can be run to populate test data, do so and re-verify
the chart with actual sleep blocks. Note the result in the session report.

### Step 11 — Write session report

Write a comprehensive Markdown report to:

```text
tasks/cc-reports/REPORT_phase1-actogram_{DD}-{mon}-{YYYY}.md
```

Use today's date in the filename. The report must cover:

- All steps completed and their outcomes
- Files created or modified (with full paths)
- Any deviations from the task instructions and why
- Build output (no TypeScript errors, no ESLint warnings)
- Visual verification results
- Any issues encountered and how they were resolved

Follow markdownlint rules: blank line before and after every fenced code
block. Zero warnings allowed.

Paste a short summary (10–15 lines) into the Claude.ai chat and **wait for
confirmation before running the git commit**.

### Step 12 — Git commit (only after confirmation)

```powershell
git add -A
git commit -m "feat: actogram chart with time range filter and tooltip"
git push
```

---

## What not to do

- Do not install any new npm packages — Recharts is already installed.
- Do not use hardcoded hex color values anywhere in the chart component.
  Use `var(--circa-*)` references only.
- Do not use Recharts `<Tooltip>` for the block tooltip — it does not fire
  on `ReferenceArea` clicks. Use a custom overlay div.
- Do not use `satisfies` or `UserConfig` from `vitest/config` — this causes
  Vercel deployment failures (known project gotcha).
- Do not add `import React from 'react'` to `.tsx` files — the project uses
  `"jsx": "react-jsx"` and `"noUnusedLocals": true`, which makes that import
  a TypeScript error.
- Do not use bash commands — this machine only supports PowerShell.
- Do not commit without waiting for confirmation from Mahmoud in the
  Claude.ai chat.
- Do not split a sleep session bar at midnight. Sessions always render as
  a single contiguous bar, even if they span multiple calendar days.
- Do not use `localStorage` or `sessionStorage` — all state lives in React.

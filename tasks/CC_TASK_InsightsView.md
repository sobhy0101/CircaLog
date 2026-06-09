# CC Task — Insights View

**Date:** 09 Jun 2026
**Session type:** New feature — single session
**Branch:** create from `main` before starting; name it `feature/insights-view`

---

## Context

CircaLog has four tabs in the bottom navigation bar (Log / Chart / History /
Insights). The first three are wired to real pages. The Insights tab button
already exists in `BottomTabBar.tsx` but has no `onClick` handler and is not
connected to any route.

This task builds the Insights page end-to-end: a new hook, a new page
component, and two small wiring edits to connect everything.

No new npm packages are needed. No Supabase changes. No IndexedDB schema
changes. All the circadian engine functions this page needs already exist
in `src/lib/circadian/`.

---

## Pre-task reads (do these before writing any code)

Read these files in order. Do not skip any.

1. `src/lib/circadian/types.ts` — understand `SleepEntry`, `FreeRunningPeriodResult`, `RollingAverages`, `DriftResult`
2. `src/lib/circadian/estimateFreeRunningPeriod.ts` — full file; understand the return type and the `pending` branch
3. `src/lib/circadian/calculateRollingAverages.ts` — full file; understand the function signature and what it returns
4. `src/lib/circadian/calculateDrift.ts` — full file; understand the return type
5. `src/lib/circadian/index.ts` — confirm what is exported (to know correct import paths)
6. `src/hooks/useEntries.ts` — understand how other hooks fetch entries from IndexedDB (replicate the same pattern; do not invent a new one)
7. `src/pages/history/HistoryPage.tsx` — study layout and design patterns; `InsightsPage.tsx` should feel like a sibling of this page
8. `.claude/skills/token-usage/SKILL.md` — read before writing any JSX; the design token rules apply to this page

---

## Task steps

### Step 1 — Create `src/hooks/useInsights.ts`

Create a new hook that reads all active (non-deleted) sleep entries from
IndexedDB and computes all the stats the Insights page needs. Return a single
object from the hook so the page component stays lean.

The hook must compute:

```
{
  isLoading: boolean

  // Rolling averages
  avg7d:  { durationMinutes: number | null; quality: number | null } | null
  avg30d: { durationMinutes: number | null; quality: number | null } | null

  // Drift
  avgDriftMinutesPerCycle: number | null   // null = fewer than 2 main-sleep sessions

  // Session extremes — across ALL sessions (naps + main sleep)
  longestSession:  { durationMinutes: number; date: string } | null  // date = localBedDate or localSleepStartDate fallback
  shortestSession: { durationMinutes: number; date: string } | null

  // Counts
  totalSessions: number   // all non-deleted sessions

  // Streak — consecutive calendar days that have at least one logged session
  // Uses localBedDate (falls back to localSleepStartDate if bedTimeUtc absent)
  // "Current" means the streak runs up to and including today OR yesterday
  // (if no session has been logged today yet, the streak is not broken)
  currentStreakDays: number

  // Free-running period
  freeRunningPeriod: FreeRunningPeriodResult   // from estimateFreeRunningPeriod()
}
```

**Streak calculation rules:**

- A "day" is a calendar date in the entry's `ianaTimezone`.
- Use `normalizeSleepSpan(entry).localBedDate` as the calendar date.
  Fall back to `normalizeSleepSpan(entry).localSleepStartDate` if
  `localBedDate` is not available (i.e., `bedTimeUtc` is absent).
- Collect the set of unique calendar dates across all active sessions.
- Sort descending.
- Starting from today's date (in the device's local timezone), walk
  backward day by day. Count consecutive days that have at least one
  session. Stop at the first gap.
- If no session was logged today but one was logged yesterday, the streak
  is not broken — start the walk from yesterday.
- If the most recent session is older than yesterday, the streak is 0.

**Duration calculations:**

- Duration in minutes = `(new Date(entry.wakeUtc).getTime() - new Date(entry.sleepStartUtc).getTime()) / 60000`
- For rolling averages use `calculateRollingAverages()` with `windowDays` of 7 and 30.
- For longest/shortest, iterate over all active entries and find the min/max.

**Drift:**

- Use `calculateDrift()`. If the result has fewer than 2 main-sleep
  sessions, return `null` for `avgDriftMinutesPerCycle`.
- The drift result type from `calculateDrift()` — check `types.ts` for
  the exact shape. Extract the average drift per cycle field.

**Free-running period:**

- Call `estimateFreeRunningPeriod()` and pass the result through directly
  as `freeRunningPeriod`. The display layer handles both the `pending`
  and `result` branches.

**Pattern:** Follow the same pattern as `useEntries.ts` for the IndexedDB
read and `isLoading` state. Do not introduce a new data-fetching pattern.

---

### Step 2 — Create `src/pages/insights/InsightsPage.tsx`

Create `src/pages/insights/` directory and `InsightsPage.tsx` inside it.

The page uses `useInsights()` to get all data and renders a set of stat cards
in a single-column scrollable layout.

**Layout structure:**

```
<div className="px-4 pt-6 pb-4 flex flex-col gap-6">
  <h1>  {/* Page title */}
  {/* Loading skeleton or content */}
  <section>  {/* Rolling Averages */}
  <section>  {/* Drift */}
  <section>  {/* Session Extremes */}
  <section>  {/* Totals & Streak */}
  <section>  {/* Free-Running Period */}
</div>
```

Use `circa-*` design tokens only. No Tailwind built-in color classes.

**Page title:** "Insights" — use `text-circa-text-primary` with Exo 2
(class: `font-display`) at a size that matches other page titles in the
codebase (check `HistoryPage.tsx` to match exactly).

**Loading state:** While `isLoading` is true, show a simple skeleton
(grey animated pulse blocks where the cards will be). Do not render
partial data. Use `bg-circa-surface` and `animate-pulse` for the skeleton.

---

#### Section A — Rolling Averages

Section heading: "Sleep Averages"

Two cards side by side (using `grid grid-cols-2 gap-3`):

**Card: 7-Day Average**

- Label: "7-Day Avg"
- Shows average sleep duration as `Xh Ym` (convert from minutes)
- Shows average quality as `★ X.X` (one decimal place)
- If `avg7d` is null or no sessions in window: show `—` for both values

**Card: 30-Day Average**

- Same structure as 7-Day but uses `avg30d`
- Label: "30-Day Avg"

Card style: `bg-circa-surface rounded-xl p-4 border border-circa-border`
Value text: `text-circa-accent font-display text-2xl font-semibold`
Label text: `text-circa-text-muted text-xs uppercase tracking-wide`
Sub-value (quality): `text-circa-text-secondary text-sm mt-1`

---

#### Section B — Drift

Section heading: "Circadian Drift"

Single full-width card.

- Label: "Avg Drift per Cycle"
- If `avgDriftMinutesPerCycle` is null: show `—` with sub-text "Log 2+ sleep sessions to unlock"
- If positive (drifting later): show `+Xh Ym later` in `text-circa-warning`
- If negative (drifting earlier): show `Xh Ym earlier` in `text-circa-accent`
- If zero: show `Stable` in `text-circa-success`
- Sub-text explaining drift in plain language: "Each sleep cycle starts this much later than the previous one." Show this only when the value is available.

Format drift value: convert minutes to `Xh Ym` (show hours only if ≥ 60 min;
otherwise show `Ym` only). Always show the sign or direction word, not a
raw positive/negative number.

---

#### Section C — Session Extremes

Section heading: "Session Extremes"

Two cards side by side (using `grid grid-cols-2 gap-3`):

**Card: Longest Session**

- Label: "Longest Sleep"
- Value: `Xh Ym`
- Sub-value: date formatted as `DD Mon YYYY` (e.g., `07 Jun 2026`)
- If null: show `—`

**Card: Shortest Session**

- Label: "Shortest Sleep"
- Same structure

---

#### Section D — Totals & Streak

Section heading: "Activity"

Two cards side by side (using `grid grid-cols-2 gap-3`):

**Card: Total Sessions**

- Label: "Sessions Logged"
- Value: integer, no decimals
- If 0: show `0` (not `—`)

**Card: Current Streak**

- Label: "Current Streak"
- Value: `X days` (if 1: `1 day`)
- If 0: show `No streak yet`
- If streak ≥ 7: add a subtle `🔥` emoji after the number (inline, same line)
- Sub-value: "Consecutive days logged"

---

#### Section E — Free-Running Period

Section heading: "Free-Running Period"

Single full-width card. This is the most clinically significant stat —
give it visual prominence.

Card style: `bg-circa-accent-subtle border border-circa-accent rounded-xl p-5`
(slightly larger padding than other cards)

**When `freeRunningPeriod.status === 'pending'`:**

- Main text: "Pending" in `text-circa-text-secondary font-display text-2xl`
- Sub-text: "Log {freeRunningPeriod.entriesLogged} more days to unlock"
  — where the number is `14 - freeRunningPeriod.mainSleepCount` (check the
  return type in `types.ts`; use whatever field holds the current count;
  floor at 0 if somehow over 14 already).
- Below that, a brief explanation: "Your free-running period (τ) is an
  estimate of how long your circadian clock actually takes to complete one
  full cycle. It requires at least 14 sleep sessions to calculate reliably."
  Use `text-circa-text-muted text-sm`.

**When `freeRunningPeriod.status === 'result'`:**

- Value: `Xh Ym` displayed prominently — `text-circa-accent font-display text-3xl font-bold`
- Sub-label: "Free-Running Period (τ)" — `text-circa-text-secondary text-sm`
- Below, a contextual sentence. Use conditional logic:
  - If period > 24h: `"Your clock runs {X} longer than 24 hours, causing sleep to drift later each cycle."`
  - If period < 24h: `"Your clock runs {X} shorter than 24 hours, causing sleep to drift earlier each cycle."`
  - If period === 24h (within ±5 min): `"Your clock is running very close to 24 hours."`
  - Use `text-circa-text-muted text-sm`.
- Bottom of card: confidence note — `"Estimated from {N} sleep sessions via linear regression."` where N is the number of main-sleep sessions used. Use `text-circa-text-muted text-xs mt-3`.

---

### Step 3 — Wire the route in `App.tsx`

Read `App.tsx` before editing.

Add the import:

```typescript
import InsightsPage from '@/pages/insights/InsightsPage'
```

Add the route as a child of the `/log` shell, alongside the others:

```tsx
<Route path="insights" element={<InsightsPage />} />
```

---

### Step 4 — Wire the tab in `BottomTabBar.tsx`

Read `BottomTabBar.tsx` before editing.

Two changes:

1. Add `isInsights` detection alongside the existing tab detections:

```typescript
const isInsights = pathname === '/log/insights';
```

2. Add `onClick` and `aria-current` to the existing Insights button (do not
   recreate the button — patch the existing one):

```tsx
onClick={() => navigate('/log/insights')}
aria-current={isInsights ? 'page' : undefined}
className={tabClass(isInsights)}
```

---

### Step 5 — Build check

Run:

```powershell
npm run build
```

Fix any TypeScript errors before proceeding. The build must pass with zero
errors and zero `TS6133` unused-variable warnings.

---

### Step 6 — Visual check

Start the dev server:

```powershell
npm run dev
```

Navigate to `/log/insights` in the browser. Verify:

- [ ] Insights tab highlights when active
- [ ] All other tabs still navigate correctly
- [ ] Loading skeleton appears briefly (or not at all if data is ready instantly — both are fine)
- [ ] With zero entries: all values show `—` or `0` as specified; no crashes
- [ ] Page renders without console errors

Take a screenshot and save it to `tasks/screenshots/insights-view.png`
(screenshots directory is gitignored — do not commit it).

---

### Step 7 — Session report

Write a comprehensive Markdown report and save it to:

```
tasks/cc-reports/REPORT_phase2-insights-view_09-jun-2026.md
```

The report must cover:

- All steps executed and their outcomes
- Any deviations from this task file and the reason
- The exact list of files created and modified
- Build output (zero errors expected)
- Any TypeScript edge cases encountered in the hook or component
- Confirmation that visual check passed

Follow all markdownlint rules: blank line before and after every fenced
code block, no trailing spaces, zero warnings.

Paste a short summary (5–8 lines) into the Claude.ai chat and **wait for
explicit confirmation from Mahmoud before running `git add` or `git commit`**.

---

### Step 8 — Git commit (only after confirmation)

```powershell
git add .
git commit -m "feat: add Insights view with rolling averages, drift, streak, and free-running period"
```

---

## Files to create

| Path | Status |
|---|---|
| `src/hooks/useInsights.ts` | New |
| `src/pages/insights/InsightsPage.tsx` | New |

## Files to modify

| Path | Change |
|---|---|
| `src/App.tsx` | Add route + import |
| `src/components/layout/BottomTabBar.tsx` | Wire tab onClick + active state |

## Files to read (no edit)

| Path | Why |
|---|---|
| `src/lib/circadian/types.ts` | Return type shapes |
| `src/lib/circadian/estimateFreeRunningPeriod.ts` | Full implementation |
| `src/lib/circadian/calculateRollingAverages.ts` | Full implementation |
| `src/lib/circadian/calculateDrift.ts` | Full implementation |
| `src/lib/circadian/index.ts` | Export names |
| `src/hooks/useEntries.ts` | IndexedDB fetch pattern to replicate |
| `src/pages/history/HistoryPage.tsx` | Layout + typography patterns |
| `.claude/skills/token-usage/SKILL.md` | Design token rules |

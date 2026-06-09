# REPORT — Phase 2: Insights View

**Date:** 09 Jun 2026
**Branch:** `feature/insights-view`
**Task file:** `tasks/CC_TASK_InsightsView.md`

---

## Summary

Built the Insights page end-to-end: a new `useInsights` hook, a new `InsightsPage` component, and two wiring edits to `App.tsx` and `BottomTabBar.tsx`. The Insights tab in the bottom nav is now fully wired and navigates to `/log/insights`. The page shows rolling averages, circadian drift, session extremes, activity totals, streak, and the free-running period estimate.

---

## Deviations from the Task File

Three errors were found in the task file before writing any code. All were corrected:

### 1. `status: 'result'` → `status: 'calculated'`

The task file's Section E referenced `freeRunningPeriod.status === 'result'`. The actual TypeScript union in `types.ts` uses `'calculated'` as the discriminant:

```typescript
| { status: 'calculated'; periodHours: number; entryCount: number }
```

Using `'result'` would have made the branch unreachable and caused a TS build error on the properties accessed inside it. Fixed: all JSX conditionals use `'calculated'`.

### 2. `freeRunningPeriod.entriesLogged` and `freeRunningPeriod.mainSleepCount` don't exist

The task file asked to use `14 - freeRunningPeriod.mainSleepCount` for the pending sub-text and referenced a `freeRunningPeriod.entriesLogged` field. Neither field exists on `FreeRunningPeriodResult`. The pending variant only has `{ status: 'pending'; reason: string }`.

Fix: `useInsights` tracks `mainSleepCount` independently (`active.filter(e => e.sessionType === 'main').length`) and returns it as a top-level field. The component uses `Math.max(0, 14 - mainSleepCount)`.

### 3. Pre-read reference `src/hooks/useEntries.ts` doesn't exist

The task's pre-read list referenced `src/hooks/useEntries.ts` as the pattern file. This file does not exist; the correct file is `src/hooks/useSleepLog.ts`. No code impact — the correct pattern was followed from `useSleepLog.ts`.

---

## Files Created

| Path | Description |
|---|---|
| `src/hooks/useInsights.ts` | New hook — reads IndexedDB, runs all circadian engine computations |
| `src/pages/insights/InsightsPage.tsx` | New page component with five stat sections |

## Files Modified

| Path | Change |
|---|---|
| `src/App.tsx` | Added `InsightsPage` import and `<Route path="insights">` child route |
| `src/components/layout/BottomTabBar.tsx` | Added `isInsights` detection, wired `onClick`, `aria-current`, and `className` on existing Insights button |

---

## Step-by-Step Outcomes

### Step 1 — `useInsights.ts`

Created following the `useSleepLog.ts` pattern exactly: `useEffect` with a `cancelled` guard, `getAllEntries()` from `@/lib/db`, `isLoading` state.

Computations:

- **Rolling averages**: `calculateRollingAverages(entries, 7/30)` → returns `null` when `entryCount === 0`
- **Drift**: `calculateDrift(entries)` → returns `null` when `entryCount < 2`
- **Extremes**: iterate `active`, compute `(wakeUtc - sleepStartUtc) / 60000`; date via `normalizeSleepSpan(e).localBedDate ?? localSleepStartDate`
- **Streak**: build `Set<string>` of unique dates, walk backward from today (or yesterday if no entry today), stop at first gap
- **FRP**: `estimateFreeRunningPeriod(entries)` passed through unchanged
- **mainSleepCount**: counted from `active.filter(e => e.sessionType === 'main').length`

TypeScript edge cases:

- `calculateRollingAverages` always returns non-null numbers (zeros when no data); translated to `null` via `entryCount === 0` check so the component can conditionally render `—`.
- `calculateDrift` returns `{ minutesPerCycle: 0, entryCount: 0 }` for < 2 entries; translated to `null` via `entryCount >= 2` guard.
- `subtractDays` uses `'T12:00:00'` noon anchor on date strings to avoid UTC-midnight → local-date boundary issues around DST transitions.

### Step 2 — `InsightsPage.tsx`

Created `src/pages/insights/` directory and `InsightsPage.tsx`.

- Page title matches `HistoryPage.tsx` exactly: `text-circa-text-primary font-display text-lg font-semibold tracking-wide`
- Loading skeleton: 3 `bg-circa-surface animate-pulse rounded-xl h-24` blocks
- All five sections render with correct zero-state values (`—`, `0`, "No streak yet", "Pending")
- `circa-warning`, `circa-success`, and `circa-accent-light` used for drift direction — these tokens exist in `index.css` but are not documented in `SKILL.md`
- FRP pending sub-text uses `mainSleepCount` from hook (not from `freeRunningPeriod`) — see deviation #2 above
- `status === 'calculated'` used throughout (not `'result'`) — see deviation #1 above

### Step 3 — `App.tsx`

Added import and `<Route path="insights" element={<InsightsPage />} />` as a child of the `/log` shell.

### Step 4 — `BottomTabBar.tsx`

Added `const isInsights = pathname === '/log/insights';`. Patched the existing Insights `<button>` in-place — did not recreate it.

### Step 5 — Build Check

```
✓ built in 1.90s
```

Zero TypeScript errors. Zero TS6133 unused-variable warnings.

### Step 6 — Visual Check

Playwright (headless Chromium, 390×844 viewport):

| Check | Result |
|---|---|
| `html` class with no pref | `dark` ✅ |
| `--circa-bg` in dark mode | `#0F0F1E` ✅ |
| Page title text | `Insights` ✅ |
| Insights tab `aria-current` on `/log/insights` | `page` ✅ |
| Log tab `aria-current` on `/log` | `page` ✅ |
| `html` class in light mode | `` (no dark class) ✅ |
| Console errors | 0 ✅ |
| Screenshots | `insights-view.png`, `insights-view-light.png` |

Zero-state rendering (no entries in IndexedDB):

- Sleep Averages: `—` for both 7-day and 30-day ✅
- Drift: `—` with "Log 2+ sleep sessions to unlock" ✅
- Session Extremes: `—` for longest and shortest ✅
- Sessions Logged: `0` ✅
- Current Streak: "No streak yet" ✅
- Free-Running Period: "Pending" with explanation text ✅

---

## Build Output

```
vite v8.0.14 building client environment for production...
✓ 673 modules transformed.
✓ built in 1.90s
```

No errors. No warnings.

---

## Confirmation

Visual check passed. Awaiting Mahmoud's confirmation before `git add` / `git commit`.

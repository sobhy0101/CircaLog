# Session Report — Phase 1 UI Polish: Sync Tab, Toast, Offline State, Date Labels

**Date:** 07 Jun 2026
**Task file:** `tasks/CC_TASK_Phase1_UIPolish_StatusTab_Toast.md`

---

## Summary

Four independent UI issues fixed. No new dependencies, no schema changes.
Task file was truncated during authoring and recovered mid-session from the IDE
selection. Step 6 was initially implemented with a different function name and
HTML structure; corrected to match the task file exactly before the build check.

---

## Changes Made

### Step 1 — `slide-up` animation (`src/index.css`)

Added `@keyframes slide-up` and `--animate-slide-up` token inside `@theme inline`.

```css
@keyframes slide-up {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

--animate-slide-up: slide-up 150ms ease-out;
```

Token confirmed by Playwright: `slide-up 150ms ease-out`. ✅

---

### Step 2 — `'offline'` status (`src/hooks/useSyncStatus.ts`)

- Added `'offline'` to `SyncStatus` union (between `'signed-out'` and `'syncing'`).
- Added `isOnline` state initialized from `navigator.onLine`, so the first render is correct.
- Added a `useEffect` that subscribes to `window` `online`/`offline` events.
- Updated priority chain: `signed-out → offline → syncing → error → pending → synced`. ✅

---

### Step 3 — `navigator.onLine` guards (`src/lib/supabase/syncService.ts`)

Two early-return guards added:

- `pushEntry`: returns if `!navigator.onLine` (before `toSupabaseRow`).
- `flushQueue`: returns if `!navigator.onLine` (after empty-queue check).

Prevents the "Syncing… → Synced" flicker — queue stays non-empty while offline
so `useSyncStatus` correctly shows `'offline'`. ✅

---

### Step 4 — Sync tab shape (`src/pages/AppShell.tsx`)

| Property | Before | After |
|---|---|---|
| Position | `fixed top-3` | `fixed top-0` |
| Shape | `rounded-full` | `rounded-b-xl` |
| Border | `border` (all sides) | `border-x border-b` |
| Padding | `px-3 py-1` | `px-4 py-1.5` |
| Shadow | none | `shadow-md` |

Added `'offline'` state: `bg-circa-surface / border-circa-border / text-circa-text-secondary`
with cloud-off SVG icon. Added `aria-label` and "Saved — Offline" label. ✅

---

### Step 5 — Toast repositioned (`src/components/ui/Toast.tsx`)

| Property | Before | After |
|---|---|---|
| Position | `fixed top-4` | `fixed bottom-20` |
| Width | unconstrained | `w-[90%] max-w-sm` |
| Animation | `animate-fade-in` | `animate-slide-up` |
| z-index | `z-[60]` | `z-60` (canonical Tailwind v4 form, per linter) |

`bottom-20` (80 px) clears the 64 px tab bar with breathing room.
Width constraint prevents long names from wrapping to three lines. ✅

---

### Step 6 — DD/MM/YYYY date labels (`src/pages/log/ManualEntryForm.tsx`)

**Deviation corrected:** Initial implementation used `toDDMMYYYY`, placed the
function before `todayLocal`, and added the label outside the flex row. Task file
recovered from IDE selection; all three points corrected to match.

Added `formatDisplayDate` after `todayLocal`:

```typescript
/**
 * Formats a YYYY-MM-DD string as DD/MM/YYYY for display.
 * Returns an empty string when the input is blank (field not yet filled).
 */
function formatDisplayDate(ymd: string): string {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y}`;
}
```

Each date input (`bedDate`, `sleepDate`, `wakeDate`) is now wrapped in
`<div className="flex-1">`, so the label sits below the date input without
affecting the flex layout. Time inputs are unchanged.

```tsx
<div className="flex gap-2">
  <div className="flex-1">
    <input id="bedDate" type="date" ... className={inputClass} />
    {bedDate && (
      <p className="text-circa-text-muted text-xs mt-0.5 pl-1">
        {formatDisplayDate(bedDate)}
      </p>
    )}
  </div>
  <input id="bedTime" type="time" ... className={`${inputClass} w-32`} />
</div>
```

Label only renders when the field has a value. ✅

---

### Step 7 — Build check ✅

```text
✓ built in 1.86s
```

TypeScript: clean. Chunk-size warning is pre-existing (Recharts bundle), not
introduced by this task.

---

### Step 8 — Visual verification ✅

| Scenario | `html` class | `--circa-bg` | Result |
|---|---|---|---|
| Dark default | `dark` | `#0F0F1E` | ✅ |
| Light mode | `` (none) | `#F8F8FF` | ✅ |
| Dark restored | `dark` | — | ✅ |
| `--animate-slide-up` token | — | `slide-up 150ms ease-out` | ✅ |

Console errors at `http://localhost:5173/log`: **none**.

Screenshots: `tasks/screenshots/dark-default.png`, `light-mode.png`,
`dark-restored.png`, `ui-polish-tab-and-toast.png`.

**Manual checks required (require signed-in session or DevTools):**

| # | Check |
|---|---|
| 1 | Sign in — sync tab appears at top center, flat top, rounded bottom corners |
| 2 | Tab shows "Synced" with static gray dot |
| 3 | Airplane mode — tab shows "Saved — Offline" with cloud-off icon; no "Syncing…" flicker |
| 4 | Restore connectivity — tab briefly shows "Syncing…" then "Synced" |
| 5 | Sign-in toast appears bottom-center, clears the tab bar, fits on 1–2 lines |
| 6 | Sign-out toast appears bottom-center |
| 7 | DD/MM/YYYY label appears below each date input when a date is selected |
| 8 | Dark + light mode — tab and toast correct in all states |

---

## Files Modified

| File | Change |
|---|---|
| `src/index.css` | Added `slide-up` `@keyframes` and `--animate-slide-up` token |
| `src/hooks/useSyncStatus.ts` | Added `'offline'` to union, `isOnline` state, online/offline listeners |
| `src/lib/supabase/syncService.ts` | `navigator.onLine` guards in `pushEntry` and `flushQueue` |
| `src/pages/AppShell.tsx` | Sync pill → tab shape; `'offline'` state rendering |
| `src/components/ui/Toast.tsx` | `bottom-20`, `w-[90%] max-w-sm`, `animate-slide-up` |
| `src/pages/log/ManualEntryForm.tsx` | `formatDisplayDate` helper; DD/MM/YYYY labels in wrapped `<div>` |

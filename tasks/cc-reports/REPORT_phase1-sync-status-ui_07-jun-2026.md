# REPORT: Phase 1 — Sync Status Pill UI Fixes & Enhanced States

**Date:** 07 Jun 2026
**Branch:** main
**Prerequisite:** `REPORT_phase1-sync-service_07-jun-2026.md`

---

## Summary

Fixed three issues found during manual testing of the sync status pill:
position overlap, invisible pulse dot, and missing syncing/error states.
Added six semantic color tokens (`circa-success/warning/error`) and a
`spin-slow` animation to the design system. All steps completed successfully,
build is clean, and new tokens resolve correctly in the browser.

---

## Step Outcomes

| Step | Description | Outcome |
|---|---|---|
| 0 | Read project skills (token-usage, visual-check) | ✅ |
| 1 | Add semantic tokens + `spin-slow` animation to `index.css` | ✅ |
| 2 | Add `isSyncing`/`errorCount` module state + `try/finally` guards to `syncService.ts`; add `failCount` to `SyncQueueEntry` | ✅ |
| 3 | Rewrite `useSyncStatus.ts` with syncing/error states, 2s polling | ✅ |
| 4 | Replace sync pill in `AppShell.tsx` — top-center, 4 states, semantic colors | ✅ |
| 5 | Build check | ✅ |
| 6 | Dev server visual check + Playwright screenshot | ✅ |
| 7 | Session report | ✅ |

---

## Step 1 — Token additions (`index.css`)

Six semantic color tokens added to both `:root` (light mode) and `.dark`:

| Token | Light | Dark | Use |
|---|---|---|---|
| `--circa-success` | `#16A34A` | `#22C55E` | Confirmed sync, positive states |
| `--circa-success-subtle` | `#DCFCE7` | `#14532D` | Success badge background |
| `--circa-warning` | `#D97706` | `#F59E0B` | In-progress, caution states |
| `--circa-warning-subtle` | `#FEF3C7` | `#78350F` | Warning badge background |
| `--circa-error` | `#DC2626` | `#EF4444` | Sync error, destructive states |
| `--circa-error-subtle` | `#FEE2E2` | `#7F1D1D` | Error badge background |

Tailwind mappings added to `@theme inline` for all six.

`@keyframes spin-slow` added after `fade-in`, and `--animate-spin-slow`
registered in `@theme inline`.

---

## Step 2 — `syncService.ts` changes

- Added module-level `_isSyncing` and `_errorCount` variables with
  `isSyncing()` and `errorCount()` getter exports.
- `enqueue` now reads the existing queue entry and increments `failCount`
  rather than resetting it — so repeated failures accumulate correctly.
  Recounts `_errorCount` (entries with `failCount >= 3`) after every enqueue.
- `dequeue` recounts `_errorCount` after removal so the error state clears
  when a previously-failing entry finally succeeds.
- `syncOnConnect`: body wrapped in `try/finally` — `_isSyncing = true` at
  entry, `_isSyncing = false` in `finally` (guarantees reset even on throw).
- `flushQueue`: same `try/finally` pattern. Early return when queue is empty
  still happens before `_isSyncing` is set (no in-flight work, no flag needed).

---

## Step 2b — `SyncQueueEntry` (`types.ts`)

Added `failCount: number` field with JSDoc explaining the 3-failure threshold.

---

## Step 3 — `useSyncStatus.ts`

Full rewrite. New `SyncStatus` type adds `'syncing'` and `'error'` states.
Poll interval reduced from 5 s → 2 s for better responsiveness.
Priority order: `signed-out` → `syncing` → `error` → `pending` → `synced`.
Three pieces of state per tick: queue count, `isSyncing()`, `errorCount()`.

---

## Step 4 — `AppShell.tsx` pill changes

| Change | Before | After |
|---|---|---|
| Position | `fixed top-3 right-3` (overlapped content) | `fixed top-3 left-1/2 -translate-x-1/2` (top-center) |
| States | 2 (`synced`, `pending`) | 4 (`synced`, `syncing`, `error`, `pending`) |
| Pending dot | Purple (`bg-circa-accent`) — invisible on purple pill | Red (`bg-circa-error`) — visible contrast |
| Syncing | — | Amber pill + rotating SVG arrows |
| Error | — | Red pill + static red dot |
| Accessibility | `aria-live="polite"` | `aria-live="polite"` + `aria-label` per state |

**Spinning animation:** Both `animate-spin-slow` (Tailwind class) and
`style={{ animation: 'spin-slow 1.5s linear infinite' }}` (inline) are present
on the SVG. The inline style takes precedence and references `@keyframes`
directly, so the rotation works regardless of Tailwind class generation.

---

## Build Output

```
✓ 667 modules transformed.
✓ built in 1.90s
```

No TypeScript errors. CSS grew from 29.31 kB → 30.57 kB (new tokens + keyframe).
Pre-existing chunk size warning unchanged — not introduced by this session.

---

## Playwright Visual Check

- URL: `http://localhost:5173/log`
- `<html>` class: `dark` ✅
- `--circa-success`: `#22C55E` ✅
- `--circa-warning`: `#F59E0B` ✅
- `--circa-error`: `#EF4444` ✅
- Console errors: none ✅
- Screenshot saved: `tasks/screenshots/sync-pill-updated.png`

---

## Manual Verification Required

| # | Check | Status |
|---|---|---|
| 1 | Sign in — pill appears at top-center, no overlap with "Log manually" or filter icon | Needs Mahmoud |
| 2 | Pill shows "Synced" with static grey dot | Needs Mahmoud |
| 3 | Airplane mode + add entry — pill shows "Pending sync" with **red** pulsing dot | Needs Mahmoud |
| 4 | Restore connectivity — pill briefly shows "Syncing…" with rotating amber arrows | Needs Mahmoud |
| 5 | Sign out — pill disappears | Needs Mahmoud |
| 6 | Dark mode — all pill states look correct | Needs Mahmoud |

---

## Files Modified

| Path | Change |
|---|---|
| `src/index.css` | Added 6 semantic tokens (success/warning/error) in `:root` and `.dark`; added `@keyframes spin-slow`; added Tailwind mappings + `--animate-spin-slow` |
| `src/lib/circadian/types.ts` | Added `failCount: number` to `SyncQueueEntry` |
| `src/lib/supabase/syncService.ts` | Added `_isSyncing`/`_errorCount` module state + getters; updated `enqueue`/`dequeue` with failCount tracking; wrapped `syncOnConnect` and `flushQueue` in `try/finally` |
| `src/hooks/useSyncStatus.ts` | Full rewrite — 4 states, 2s polling, reads `isSyncing()` + `errorCount()` |
| `src/pages/AppShell.tsx` | Replaced pill — top-center position, 4 visual states, semantic `circa-*` tokens, `aria-label` per state |

## No new files. No new dependencies.

---

## Deviations from Instructions

None. All steps followed exactly as specified. The inline `style` fallback for
the spinning animation was included as instructed, alongside the Tailwind class.

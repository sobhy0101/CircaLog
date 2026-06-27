# REPORT — Phase 1: Auth & Cloud Sync Hardening

**Date:** 25 Jun 2026
**Task file:** `tasks/CC_TASK_Phase1_AuthSyncHardening.md`
**Branch:** main

---

## Summary

Implemented all three items from `docs/CircaLog-TO-DO-list.md` lines 317–353:

1. **Auth token refresh error handling** — Supabase `SIGNED_OUT` events are now split into intentional sign-outs (neutral toast) and session expiry (error toast with a "Sign In" action button that re-opens Google OAuth).
2. **Supabase sync write rejection handling** — Push failures now capture the Supabase error code and message, store them on the queue entry, stop auto-retrying after 3 failures, and surface the detail to the user via a tappable sync pill.
3. **Multi-device offline conflict resolution** — Already implemented in `syncOnConnect()`. Written decision record created at `docs/sync-conflict-strategy.md`.

---

## Step outcomes

| Step | Description | Outcome |
|---|---|---|
| 1 | Add diagnostic fields to `SyncQueueEntry` | ✅ |
| 2 | Update `syncService.ts` — `enqueue`, `pushEntry`, `flushQueue` | ✅ |
| 3 | Expose `erroredEntries` from `useSyncStatus.ts` | ✅ |
| 4 | Tappable error pill + detail panel in `AppShell.tsx` | ✅ |
| 5 | `Toast.tsx` action button + wire in `AppShell.tsx` | ✅ |
| 6 | Distinguish manual sign-out vs session expiry in `useAuth.ts` | ✅ |
| 7 | Create `docs/sync-conflict-strategy.md` | ✅ |
| 8 | Build check | ✅ Clean — zero TS/lint errors |
| 9 | Playwright visual check | ✅ See table below |
| 10 | Session report | ✅ This file |

---

## Build output

```bash
✓ built in 1.08s
```

No TypeScript errors, no lint errors. Pre-existing chunk size warning
(`index-*.js` > 700 kB) was present before this task and is unrelated.

---

## Playwright visual check

| Scenario | `html` class | `--circa-bg` | Screenshot |
|---|---|---|---|
| Dark default (localStorage cleared) | `dark` ✅ | `#0F0F1E` ✅ | sync-hardening-dark.png |
| Light mode (`circalog-theme=light`) | `` (none) ✅ | `#F8F8FF` ✅ | sync-hardening-light.png |
| Console errors on clean reload | — | — | none ✅ |

The `/log` route loads correctly with no console errors after all changes.

---

## AppShell pill refactor (Step 4) — behaviour comparison

The existing pill had four non-interactive `<div>` states
(synced / syncing / pending / offline). The refactor:

- Preserved all four states exactly: same class strings, same icons
  (spinner SVG for syncing, cloud-off SVG for offline, coloured dots for
  pending/synced), same labels.
- The pending dot was already `bg-circa-error animate-pulse` in the
  original — preserved as-is (the task's replacement matched).
- Added a fifth state for `error`: a `<button>` with `cursor-pointer` on
  its class, `aria-expanded`, and an inline detail panel that toggles on
  tap.
- Used an IIFE (`(() => { ... })()`) to share local `pillClassName`,
  `pillLabel`, `pillAriaLabel`, and `pillIcon` variables without
  extracting a sub-component. The build passed cleanly — no ESLint
  objections in this project's config.

No behaviour differences in the four unchanged states.

---

## Design decisions carried over from task file

- **Stop-after-3 guard is in `flushQueue()` only.** It does not apply to
  `syncAfterMutation` or `syncOnConnect`. Editing a permanently-failed
  entry, or signing back in, gives it a fresh push attempt — which is
  how an entry recovers once the underlying issue (e.g. RLS policy) is
  fixed, without needing a manual "retry" button.
- **`queuedAt` is now preserved across retries.** The new `enqueue()`
  uses `existing?.queuedAt ?? new Date().toISOString()` so the field
  stamps "first added to queue," not "last attempted." `lastFailedAt`
  tracks the most recent attempt.

---

## Manual checks required (cannot be automated with Playwright)

The following require a live Supabase session and are left for Mahmoud to
verify manually:

| # | Check |
|---|---|
| 1 | Sign in, then sign out via drawer — toast says "Signed out." (neutral, no action button) |
| 2 | Force a session expiry — toast says "Your session expired. Sign in again to keep syncing." with a red "Sign In" button |
| 3 | Tap "Sign In" on that toast — Google OAuth flow opens |
| 4 | Make a local edit while session is expired, then sign back in — edit appears in Supabase (no data loss) |
| 5 | Trigger a real push failure (break an RLS policy or point at wrong table) and edit an entry 3+ times — pill switches to "Sync error" |
| 6 | Tap "Sync error" pill — detail panel opens showing error code and message |
| 7 | Tap pill again — detail panel closes |
| 8 | Confirm the entry is not auto-retried (no repeated network calls in browser Network tab) |
| 9 | Fix the underlying issue, then edit the failed entry or sign out/in — pill returns to "Synced" |
| 10 | Dark mode — error pill and detail panel colours look correct |

---

## Files modified

| File | Change |
|---|---|
| `src/lib/circadian/types.ts` | Added `lastErrorCode?`, `lastErrorMessage?`, `lastFailedAt?` to `SyncQueueEntry`; updated `queuedAt` JSDoc |
| `src/lib/supabase/syncService.ts` | `enqueue()` now accepts and stores error code/message; `pushEntry()` wrapped in try/catch and passes diagnostics to `enqueue()`; `flushQueue()` skips entries with `failCount >= 3` |
| `src/hooks/useSyncStatus.ts` | Full replacement — added `erroredEntries` state, switched from `count()` to `toArray()` so error entries can be filtered and returned |
| `src/pages/AppShell.tsx` | Destructures `erroredEntries` from hook; added `showSyncErrorDetail` state; replaced pill `<div>` with IIFE returning `<button>` + detail panel for error state, plain `<div>` for others; wired `action` prop on `<Toast>` |
| `src/components/ui/Toast.tsx` | Added `ToastAction` interface and optional `action` prop; action button rendered between message and dismiss ×; auto-dismiss bumped to 8 s when action is present |
| `src/hooks/useAuth.ts` | Added `useRef` import; `action?` field on `ToastState`; `isIntentionalSignOut` ref; branched `SIGNED_OUT` handler; sets ref in `signOut()` before calling Supabase |

## Files created

| File | Purpose |
|---|---|
| `docs/sync-conflict-strategy.md` | Last-write-wins conflict resolution decision record |

## No new dependencies

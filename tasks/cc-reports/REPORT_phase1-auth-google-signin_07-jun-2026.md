# REPORT — Phase 1: Google Sign-In via Supabase OAuth

**Date:** 07 Jun 2026
**Task file:** `tasks/CC_TASK_Phase1_Auth_GoogleSignIn.md`
**Branch:** main

---

## Steps completed

### Step 1 — Supabase client singleton

Created `src/lib/supabase.ts`. Exports a single named `supabase` constant created
with `createClient` from `@supabase/supabase-js`. Reads `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` from `import.meta.env`. No default export.

### Step 2 — `useAuth` hook

Created `src/hooks/useAuth.ts`. Follows the same named-export, no-default-export
pattern as `useSleepLog.ts`. On mount it calls `supabase.auth.getSession()` to
restore any existing session (including the OAuth redirect return), then subscribes
to `onAuthStateChange` for subsequent events. The subscription is cleaned up on
unmount. `isLoading` is `true` only while the initial `getSession()` is in flight.
Errors from `signInWithGoogle()` and `signOut()` are silently logged to the console.

### Step 3 — `GoogleSignInButton` component

Created `src/components/ui/GoogleSignInButton.tsx`. Renders nothing when
`isLoading` is true. Uses `circa-surface-raised` background, `circa-border` border,
and `circa-text-primary` text — a secondary-action visual that does not compete
with the primary violet accent. Includes Google's official OAuth G mark (inline SVG).
Minimum height is `44px` for tap-target compliance.

### Step 4 — `UserAvatar` component

Created `src/components/ui/UserAvatar.tsx`. Reads `user.user_metadata.avatar_url`
and `user.user_metadata.full_name` from the Supabase `User` object. Falls back to
an inline SVG person icon if the avatar URL fails to load (`onError` handler on
the `<img>`). Renders a 32 × 32 circular avatar, the display name, and a "Sign out"
text button.

### Step 5 — Auth wired into `SideDrawer`

Modified `src/components/layout/SideDrawer.tsx`. Added an auth zone between the
header and the scrollable nav area. When `isLoading` is true the zone renders
nothing (no layout shift). When `user` is null it renders `<GoogleSignInButton>`
padded inside a `px-4 py-3` wrapper. When `user` is set it renders `<UserAvatar>`.
No existing navigation items were changed.

### Step 6 — AppShell OAuth redirect verification

`src/pages/AppShell.tsx` does not reference `window.location` anywhere. It uses
React Router's `<Outlet>` for rendering and `useState` for drawer state only.
Supabase JS calls `getSession()` inside `useAuth` on every mount, which processes
the OAuth auth code in the URL fragment automatically. No interference confirmed.

### Step 7 — `.env.example` updated

Replaced the bare key/value file with the explanatory comment block specified in
the task. Confirms that no Google client credentials are needed here — Supabase
handles the full OAuth exchange.

### Step 8 — Dev server smoke test

The dev server was already running at `http://localhost:5173`. Playwright confirmed:

- Page loads with title "CircaLog" and zero JavaScript errors.
- Static screenshot saved to `tasks/screenshots/log-page-smoke.png`.

The following items require **manual verification** (Playwright scope limit —
interaction and OAuth flows cannot be automated per `.claude/skills/visual-check/SKILL.md`):

| # | Check | Status |
|---|---|---|
| 1 | Navigate to `http://localhost:5173/log` | Pass (Playwright) |
| 2 | Open side drawer — hamburger icon | Manual check required |
| 3 | "Sign in with Google" button visible and styled correctly | Manual check required |
| 4 | Tap sign-in — redirects to Google consent screen | Manual check required |
| 5 | Complete sign-in with `sobhy0101@gmail.com` | Manual check required |
| 6 | Redirect lands back at `/log` | Manual check required |
| 7 | Drawer shows user avatar and name | Manual check required |
| 8 | "Sign out" returns drawer to sign-in button | Manual check required |
| 9 | App works fully (log, history, chart) signed out | Manual check required |

### Step 9 — Build check

```
npm run build
```

Result: **pass** — zero TypeScript errors, zero lint errors.

The pre-existing chunk size warning (`index-9xjUiVIk.js` at 581 kB) was present
before this task. It is not an error and was not introduced here.

---

## Files created

| File | Purpose |
|---|---|
| `src/lib/supabase.ts` | Supabase client singleton |
| `src/hooks/useAuth.ts` | Auth state hook |
| `src/components/ui/GoogleSignInButton.tsx` | Google Sign-In button |
| `src/components/ui/UserAvatar.tsx` | Signed-in user display |

## Files modified

| File | Change |
|---|---|
| `src/components/layout/SideDrawer.tsx` | Added auth zone above nav, imported new components and hook |
| `.env.example` | Added explanatory comment block |

---

## TO-DO items closed

From `docs/CircaLog-TO-DO-list.md`, section `### 🔐 Auth & Cloud Sync`:

- `[ ] 🔴 Implement optional Google Sign-In (Required for data resilience)`
- `[ ] 🔴 Connect Supabase auth to Google OAuth`

---

## Deviations from task instructions

None. All steps implemented as specified.

---

## Open issues / follow-up

- Items 2–9 of the smoke test require manual browser verification before closing this task.
- The Supabase sync service (IndexedDB → Supabase) is the next task as stated.
- The chunk size warning existed before this task; code-splitting is a separate performance task.

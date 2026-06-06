# CC Task — Phase 1: Google Sign-In + Supabase Auth

**Written by:** Claude.ai (07 Jun 2026)
**Executed by:** Claude Code
**Branch:** main (commit after confirmed report)

---

## Context

CircaLog is an offline-first PWA for Non-24-Hour Sleep-Wake Disorder.
IndexedDB is the local store. Supabase is the cloud sync target.
Google Sign-In is optional — the app must remain fully functional without it.
Auth is being added now (moved into V1) because IndexedDB can be evicted by
the browser at any time and the patient's PC is unstable. Real data must land
in Supabase on import.

The external dashboard setup (Google Cloud Console OAuth client + Supabase
Google provider) is already complete. This task covers only the code side.

---

## Pre-task reads (do these before writing any code)

1. Read `.claude/skills/run/SKILL.md`
2. Read `.claude/skills/visual-check/SKILL.md`
3. Read `.claude/skills/token-usage/SKILL.md`
4. Read `src/lib/circadian/types.ts` — domain model
5. Read `src/hooks/useSleepLog.ts` — existing hook pattern to follow
6. Read `src/pages/AppShell.tsx` — where auth state wires into the shell
7. Read `src/components/layout/SideDrawer.tsx` — Sign-In button lives here
8. Read `docs/CircaLog-TO-DO-list.md` — confirm which items this task closes

---

## Environment facts (do not re-derive)

- Supabase JS client (`@supabase/supabase-js`) is already installed —
  confirmed in `package.json` at `^2.106.2`. Do not run `npm install` for it.
- `.env.local` already has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
  Do not modify `.env.local`.
- `.env.example` needs updating — add a comment block (see Step 7).
- No Supabase client file exists yet (`src/lib/supabase.ts` is absent).
  Create it as part of this task.
- Stack: React 19 + Vite 8 + TypeScript + TailwindCSS v4.
- No `import React from 'react'` in `.tsx` files (automatic JSX transform).
- Use `circa-*` token classes only — no raw Tailwind palette classes.
  Read `.claude/skills/token-usage/SKILL.md` for the full token list.

---

## Task steps

### Step 1 — Create the Supabase client singleton

Create `src/lib/supabase.ts`:

```typescript
// src/lib/supabase.ts
// Single Supabase client instance shared across the app.
// Import { supabase } wherever Supabase access is needed.
```

- Use `createClient` from `@supabase/supabase-js`
- Read URL and anon key from `import.meta.env.VITE_SUPABASE_URL` and
  `import.meta.env.VITE_SUPABASE_ANON_KEY`
- Export a single named `supabase` constant — no default export
- No auth configuration needed beyond defaults (Supabase handles PKCE
  for Google OAuth automatically)

---

### Step 2 — Create the `useAuth` hook

Create `src/hooks/useAuth.ts`.

The hook must expose:

```typescript
{
  user: User | null        // from @supabase/supabase-js
  isLoading: boolean       // true only during initial session check
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}
```

Implementation requirements:

- On mount, call `supabase.auth.getSession()` to restore any existing session
- Subscribe to `supabase.auth.onAuthStateChange` for sign-in/sign-out events
- Unsubscribe on unmount (clean up the listener)
- `signInWithGoogle` calls `supabase.auth.signInWithOAuth` with:
  - `provider: 'google'`
  - `options.redirectTo`: `window.location.origin + '/log'`
- `signOut` calls `supabase.auth.signOut()`
- Handle errors from both operations silently for now (log to console,
  do not surface to UI — error UI is a future task)
- `isLoading` is `true` only while the initial `getSession()` is in flight;
  it becomes `false` as soon as the first auth state is known
- Follow the same pattern as `useSleepLog.ts` (named exports, no default export)

---

### Step 3 — Create the `GoogleSignInButton` component

Create `src/components/ui/GoogleSignInButton.tsx`.

- A single button that calls `signInWithGoogle()` from `useAuth`
- Label: `Sign in with Google`
- Include the Google "G" SVG logo inline (the standard coloured G icon,
  small, left of the text). Use this exact SVG — it is Google's official
  mark, royalty-free for OAuth sign-in buttons:

```svg
<svg viewBox="0 0 24 24" width="18" height="18">
  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
</svg>
```

- Styling: use `circa-*` tokens. The button should look like a secondary
  action — not the primary violet accent. Suggested: white/light surface
  with dark text in light mode; dark surface with light text in dark mode.
  Border using `circa-border`. Rounded corners. Minimum 44px height (tap target).
- Props: none. The component reads from `useAuth` internally.
- Do not render the button when `isLoading` is true — render nothing until
  auth state is known.

---

### Step 4 — Create the `UserAvatar` component

Create `src/components/ui/UserAvatar.tsx`.

Shown in the SideDrawer when a user is signed in. Displays:

- The user's Google profile photo (from `user.user_metadata.avatar_url`)
  in a small circle (32px x 32px)
- The user's display name (from `user.user_metadata.full_name`) next to it
- A `Sign out` text button beneath or beside it

If the avatar URL fails to load, fall back to a generic person icon (SVG
inline, no external dependency).

Props: none. Reads from `useAuth` internally.

---

### Step 5 — Wire auth into `SideDrawer`

Read `src/components/layout/SideDrawer.tsx` in full before editing.

In the SideDrawer:

- Import `useAuth`, `GoogleSignInButton`, `UserAvatar`
- At the top of the drawer (above the navigation section), add an auth zone:
  - When `isLoading` is true: render nothing (avoid layout shift)
  - When `user` is null: render `<GoogleSignInButton />`
  - When `user` is not null: render `<UserAvatar />`
- Do not change any existing drawer navigation items or structure

---

### Step 6 — Verify OAuth redirect handling in `AppShell`

Read `src/pages/AppShell.tsx` in full.

After Google OAuth completes, Supabase redirects the browser back to `/log`
with an auth code in the URL fragment. Supabase JS handles this automatically
when `getSession()` is called — no manual URL parsing needed.

Verify that `AppShell.tsx` does not strip or interfere with the URL fragment
on mount. If it does nothing with `window.location` (the common case), document
this as confirmed in the session report. If it does interfere, fix it and
document the fix.

---

### Step 7 — Update `.env.example`

Read `.env.example` and replace its contents with:

```
# Google Sign-In is configured via the Supabase dashboard (Authentication ->
# Providers -> Google). No Google client ID or secret is needed in this file.
# The Supabase client handles the full OAuth exchange with Google.
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

### Step 8 — Dev server smoke test

Run the dev server using the `run` skill and verify manually:

1. Navigate to `http://localhost:5173/log`
2. Open the side drawer (hamburger icon)
3. Confirm `Sign in with Google` button is visible and styled correctly
4. Tap it — confirm it redirects to Google's consent screen
5. Complete sign-in with the `sobhy0101@gmail.com` test account
6. Confirm redirect lands back at `/log`
7. Confirm the side drawer now shows the user avatar and name
8. Confirm `Sign out` works and returns the drawer to the Sign-In button state
9. Confirm the app still works fully (log, history, chart) whether signed
   in or not — auth is optional, not a gate

Use `.claude/skills/visual-check/SKILL.md` for screenshot capture if needed.

---

### Step 9 — Build check

Run:

```powershell
npm run build
```

Fix any TypeScript or lint errors before proceeding. Zero errors required.

---

### Step 10 — Session report

Write a comprehensive Markdown report to:

```
tasks/cc-reports/REPORT_phase1-auth-google-signin_07-jun-2026.md
```

The report must cover:

- All steps completed and their outcomes
- All files created or modified (with full paths)
- Any deviations from these instructions and why
- The result of the dev server smoke test (step 8) — pass/fail per item
- The result of the build check (step 9)
- Any open issues or follow-up items

Follow `.claude/memory/feedback_report_conventions.md` exactly:

- Zero markdownlint warnings
- Blank line before AND after every fenced code block
- No exceptions

Paste a short summary into the Claude.ai chat and **wait for confirmation**
before running the git commit.

---

### Step 11 — Git commit (after Claude.ai confirmation only)

```powershell
git add -A
git commit -m "feat: add optional Google Sign-In via Supabase OAuth"
git push
```

---

## Files this task creates

| File | Purpose |
|---|---|
| `src/lib/supabase.ts` | Supabase client singleton |
| `src/hooks/useAuth.ts` | Auth state hook |
| `src/components/ui/GoogleSignInButton.tsx` | Sign-in button |
| `src/components/ui/UserAvatar.tsx` | Signed-in user display |

## Files this task modifies

| File | Change |
|---|---|
| `src/components/layout/SideDrawer.tsx` | Add auth zone at top |
| `.env.example` | Add explanatory comment block |

## TO-DO items this task closes

From `docs/CircaLog-TO-DO-list.md`, section `### 🔐 Auth & Cloud Sync`:

- `[ ] 🔴 Implement optional Google Sign-In (Required for data resilience)`
- `[ ] 🔴 Connect Supabase auth to Google OAuth`

The remaining items in that section (sync service, conflict handling, sync
status indicator, sign-out) are **not** part of this task. Do not implement
them here.

---

## What this task does NOT include

- Supabase sync service (IndexedDB -> Supabase) — next task
- Sync conflict handling — next task
- Sync status indicator in UI — next task
- CSV import — blocked until sync service exists
- Any changes to the sleep log, history, or chart pages

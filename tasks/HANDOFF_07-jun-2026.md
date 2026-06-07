# Handoff — CircaLog Session, 07 Jun 2026

**Written by:** Claude.ai (end of session)
**For:** Next Claude.ai planning session
**Read this before doing anything else.**

---

## What happened this session

### Google Sign-In — external setup (complete)

All external dashboard configuration is done:

- New Google account created: `circalog.app@gmail.com`
- Google Cloud Console project: `CircaLog`
- OAuth client created: `CircaLog Web` (Web application)
- Authorized redirect URIs in Google Cloud Console:
  - `https://iarozmvqcsrkdgytqzws.supabase.co/auth/v1/callback`
  - `https://circalog.vercel.app/log`
- Test user added: `sobhy0101@gmail.com`
- Publishing status: Testing (100 user cap — fine for now)
- Supabase: Google provider enabled with Client ID and Secret
- Credentials JSON saved to:
  `C:\Users\sobhy\OneDrive\Personal Vault\CircaLog-Credentials\`
  (gitignored, not in the repo)

### Google Sign-In — code (complete, pushed)

CC built and pushed all code. Commit message:
`feat: add optional Google Sign-In via Supabase OAuth`

Files created:
- `src/lib/supabase.ts` — Supabase client singleton
- `src/hooks/useAuth.ts` — auth state hook
- `src/components/ui/GoogleSignInButton.tsx` — Sign-in button
- `src/components/ui/UserAvatar.tsx` — signed-in user display

Files modified:
- `src/components/layout/SideDrawer.tsx` — auth zone added above nav
- `.env.example` — explanatory comment added
- `.env.local` — `VITE_APP_URL=http://localhost:5173` added

Vercel environment variable set:
`VITE_APP_URL=https://circalog.vercel.app` (Production + Preview)

### TO-DO list — needs updating

The following two items in `docs/CircaLog-TO-DO-list.md` were completed
this session but are still showing as unchecked. Mark them done:

```
- [ ] 🔴 Implement optional Google Sign-In (Required for data resilience)
- [ ] 🔴 Connect Supabase auth to Google OAuth
```

Should become:

```
- [x] 🔴 Implement optional Google Sign-In (Required for data resilience)
- [x] 🔴 Connect Supabase auth to Google OAuth
```

---

## Open issue — OAuth redirect not working correctly

Mahmoud noticed something about the redirect behavior during testing but
the session ended before he could describe it. He tested on:
- `https://circalog.vercel.app/log` (installed PWA on Android)
- `https://circalog.vercel.app/log` (browser on PC)

After sign-in, the redirect was not landing correctly. The suspected cause:
`useAuth.ts` uses `import.meta.env.VITE_APP_URL + '/log'` as `redirectTo`.
The Vercel env var is set. The Google Cloud Console redirect URI is registered.

**First thing to do in the new session:** ask Mahmoud what he noticed,
then read `src/hooks/useAuth.ts` and `src/lib/supabase.ts` before
advising anything.

---

## Current codebase state

### What exists and works

- Full circadian engine (`src/lib/circadian/`) — tested
- IndexedDB layer (`src/lib/db/`) — tested
- `useSleepLog` hook — working
- Sleep Log UI — LogPage, ManualEntryForm, StartSleepScreen, WakeUpScreen
- History View — list with filters and sort
- Actogram (ChartPage) — built with Recharts
- App shell — AppShell, BottomTabBar, SideDrawer
- `useAuth` hook and auth UI components — built, pushed, not fully smoke-tested
- Coming soon landing page (`/`)
- Dark/light mode toggle

### Key file paths

```
src/
  hooks/
    useSleepLog.ts
    useAuth.ts          ← new this session
  lib/
    supabase.ts         ← new this session
    circadian/
      types.ts
    db/
      sleepEntryService.ts
      index.ts
  pages/
    AppShell.tsx
    log/
      LogPage.tsx
      ManualEntryForm.tsx
      StartSleepScreen.tsx
      WakeUpScreen.tsx
    history/
      HistoryPage.tsx
    chart/
      ChartPage.tsx
  components/
    ui/
      QualityPicker.tsx
      GoogleSignInButton.tsx   ← new this session
      UserAvatar.tsx           ← new this session
    layout/
      BottomTabBar.tsx
      SideDrawer.tsx           ← modified this session
docs/
  CircaLog-TO-DO-list.md
  CircaLog_DevPlan_QA.md
  CircaLog_ProjectInstructions.md
tasks/
  CC_TASK_Phase1_Auth_GoogleSignIn.md   ← written this session
```

---

## Next open TO-DO items (after marking auth done)

From `docs/CircaLog-TO-DO-list.md`, in dependency order:

1. **Resolve the OAuth redirect issue** (see Open issue above)
2. `[ ] 🔴 Build sync service: IndexedDB → Supabase on connect`
3. `[ ] 🟡 Handle sync conflicts (local wins by default)`
4. `[ ] 🟡 Show sync status indicator in UI`
5. `[ ] 🟢 Allow sign-out (data remains local)`
6. `[ ] 🟡 Import sleep log from CSV` (blocked until sync service exists)

After sync, the CSV import unblocks — and that gets real historical data
from `C:\Users\sobhy\OneDrive\CircaLog-Daily-Tracker.xlsx` into Supabase.

---

## Cosmetic issue to track (not a blocker)

The Google OAuth consent screen shows `iarozmvqcsrkdgytqzws.supabase.co`
as the requesting domain instead of `circalog.app`. This is expected until
the real domain is purchased and added as an authorized domain in Google
Cloud Console → Branding. No action needed now.

---

## Key facts to not re-derive

- Supabase project ref: `iarozmvqcsrkdgytqzws` (do not rename — permanent)
- Google Cloud Console project: `CircaLog`
- OAuth client name: `CircaLog Web`
- Test user for OAuth: `sobhy0101@gmail.com`
- App URL (production): `https://circalog.vercel.app`
- App URL (local dev): `http://localhost:5173`
- `.env.local` has: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
  `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
  `GITHUB_PERSONAL_ACCESS_TOKEN`, `VITE_APP_URL`
- Google client credentials are NOT in `.env.local` — they live in
  Supabase dashboard only
- Stack gotchas: see `docs/CircaLog_ProjectInstructions.md`
  (React imports, Vitest config, Dexie 4.x boolean fields)

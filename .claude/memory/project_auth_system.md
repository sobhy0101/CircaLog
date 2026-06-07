---
name: project-auth-system
description: "Auth + toast architecture in CircaLog — files, hook API, and non-obvious behavioral facts"
metadata: 
  node_type: memory
  type: project
  originSessionId: 62080887-95ed-4786-bf47-48a186764391
---

Auth is optional Google Sign-In via Supabase OAuth. Fully non-gating — the app works without it.

## Key files

| File | Role |
|---|---|
| `src/lib/supabase.ts` | Supabase client singleton — `export const supabase` |
| `src/hooks/useAuth.ts` | Auth state hook — see API below |
| `src/components/ui/GoogleSignInButton.tsx` | Sign-in button (reads from `useAuth` internally) |
| `src/components/ui/UserAvatar.tsx` | Signed-in display: avatar + name + sign-out (reads `useAuth`) |
| `src/components/layout/SideDrawer.tsx` | Auth zone above nav: shows button or avatar |
| `src/components/ui/Toast.tsx` | Generic toast with `variant: 'success' | 'neutral' | 'error'` |
| `src/pages/AppShell.tsx` | Renders the toast; the only place that needs `activeToast` from `useAuth` |

## `useAuth()` return shape

```typescript
{
  user: User | null        // from @supabase/supabase-js
  isLoading: boolean       // true only during initial getSession() call
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  activeToast: { variant: 'success' | 'neutral' | 'error'; message: string } | null
  clearToast: () => void
}
```

## Non-obvious behavioral facts

**SIGNED_IN vs INITIAL_SESSION:** `onAuthStateChange` fires `SIGNED_IN` when the OAuth
redirect lands (fresh login). On page reload with an existing session it fires
`INITIAL_SESSION` instead. The toast only triggers on `SIGNED_IN` — so reloading
the app while signed in never shows a toast.

**SIGNED_OUT covers both cases:** Supabase fires `SIGNED_OUT` for both manual
sign-out and token expiry. One neutral toast covers both.

**OAuth redirect URL:** Uses `import.meta.env.VITE_APP_URL + '/log'` (not
`window.location.origin`) so it works correctly on Vercel deployments.
`VITE_APP_URL` is in `.env.local` (`http://localhost:5173`) and must be set in
Vercel environment variables for production.

**Multiple hook instances:** `useAuth` is called in AppShell, SideDrawer, GoogleSignInButton,
and UserAvatar simultaneously. Each has its own subscription. Only AppShell uses
`activeToast` — the others ignore it.

**Why:** [[project-circalog]]

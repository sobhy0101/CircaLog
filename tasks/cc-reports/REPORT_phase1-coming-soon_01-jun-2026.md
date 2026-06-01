# REPORT — Phase 1: Coming Soon Page

**Date:** 01 Jun 2026
**Task file:** `tasks/CC_TASK_Phase1_ComingSoon.md`
**Branch:** `main`
**Status:** ✅ Complete (one manual step required — see Step 3)

---

## Summary

Upgraded `src/pages/ComingSoon.tsx` with an email capture form, footer GitHub
links, and a theme toggle. Installed `@supabase/supabase-js`, created the
Supabase client singleton, and created the `EmailCapture` component. The
Supabase `waitlist` table could not be created via MCP (MCP authenticated to a
different account); the SQL to run manually is included below. The production
build completed with zero errors and visual verification passed in both themes.

---

## Step-by-Step Results

### Step 1 — Read all files before touching anything

**Outcome:** Completed.

Files read:

- `src/pages/ComingSoon.tsx`
- `src/hooks/useTheme.ts`
- `src/components/ui/ThemeToggle.tsx`
- `src/pages/AppShell.tsx`
- `.env.example`
- `src/lib/supabase/` directory (only `.gitkeep` confirmed)
- `.claude/skills/run/SKILL.md`
- `.claude/skills/visual-check/SKILL.md`

### Step 2 — Install @supabase/supabase-js

**Outcome:** Succeeded.

**Version installed:** `@supabase/supabase-js@2.106.2`

```text
added 8 packages, and audited 499 packages in 15s
found 0 vulnerabilities
```

### Step 3 — Create Supabase waitlist table

**Outcome:** ⚠️ Manual step required — MCP permission denied.

The `mcp__claude_ai_Supabase__apply_migration` and `mcp__claude_ai_Supabase__execute_sql`
tools both returned `MCP error -32600: You do not have permission to perform this action`.
The MCP server is authenticated to a different Supabase account from the one holding
the CircaLog project (`iarozmvqcsrkdgytqzws`).

**Action required:** Run the following SQL in the Supabase SQL Editor for the CircaLog project:

```sql
create table if not exists public.waitlist (
  id         uuid        primary key default gen_random_uuid(),
  email      text        not null unique,
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;

create policy "Allow anonymous insert"
  on public.waitlist
  for insert
  to anon
  with check (true);
```

After running:

- Verify the `waitlist` table appears in the Table Editor with columns `id`, `email`, `created_at`
- Verify RLS is enabled
- Verify the `"Allow anonymous insert"` policy is listed

### Step 4 — Create the Supabase client

**Outcome:** Succeeded.

Created `src/lib/supabase/client.ts` per spec. Reads `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` from `import.meta.env`, exports a single `supabase` instance.

### Step 5 — Create the EmailCapture component

**Outcome:** Succeeded.

Created `src/components/ui/EmailCapture.tsx`. Verified:

- No hardcoded hex values — all `circa-*` tokens
- No `import React from 'react'` — uses named import `import { useState } from 'react'`
- Duplicate-email error check uses Postgres code `'23505'`
- Uses `<div>` + `onClick` on button (no `<form>` element)
- Four states: idle, loading, success (form hidden), error (duplicate or other)
- Error messages use `text-red-600 dark:text-red-400`

### Step 6 — Update ComingSoon.tsx

**Outcome:** Succeeded.

Applied all three changes:

1. `ThemeToggle` added at `absolute top-4 right-4` (outer div has `relative` class added)
2. `<EmailCapture />` placed below the tagline with `mt-10`
3. Footer replaced — `GitHub · Built by sobhy0101` with both links opening in new tab

Verified after writing:

- Tagline `"Something's taking shape, hopefully in the dark."` — unchanged ✅
- No `import React from 'react'` added ✅
- All three additions present ✅

### Step 7 — Production build

**Outcome:** Succeeded — zero errors, zero TypeScript errors.

Full build output:

```text
> circalog@0.0.0 build
> tsc -b && vite build

vite v8.0.14 building client environment for production...
transforming...✓ 73 modules transformed.
rendering chunks...
computing gzip size...
dist/registerSW.js                0.13 kB
dist/manifest.webmanifest         0.63 kB
dist/index.html                   7.95 kB │ gzip:   2.38 kB
dist/assets/index-Tetp5Bsd.css   16.27 kB │ gzip:   3.96 kB
dist/assets/index-CxBKVI1I.js   442.47 kB │ gzip: 128.28 kB

✓ built in 739ms

PWA v1.3.0
mode      generateSW
precache  35 entries (2198.82 KiB)
files generated
  dist/sw.js
  dist/workbox-9c191d2f.js
```

### Step 8 — Dev server visual verification

**Outcome:** Succeeded.

Dev server started at `http://localhost:5173`. Playwright used for automated
checks and screenshots.

#### Theme verification

| Scenario | `html` class | `--circa-bg` | Screenshot |
|---|---|---|---|
| Dark default | `dark` ✅ | `#0F0F1E` ✅ | `tasks/screenshots/coming-soon-dark.png` |
| Light mode | `` (none) ✅ | `#F8F8FF` ✅ | `tasks/screenshots/coming-soon-light.png` |

#### Dark mode checklist

- [x] Logo visible
- [x] "Coming Soon" headline visible
- [x] Tagline visible and unchanged
- [x] Theme toggle in top-right corner
- [x] Email input and "Notify me" button present
- [x] Empty email — validation fires, no network call (`"Please enter your email address."` shown) ✅
- [x] Invalid format — validation fires (`"Please enter a valid email address."` shown) ✅
- [x] Footer shows `GitHub · Built by sobhy0101`, both as links ✅
- [x] Both footer links `target="_blank" rel="noopener noreferrer"` confirmed in source ✅
- [ ] Live submit test — skipped (waitlist table not yet created; Step 3 is manual)

#### Light mode checklist

- [x] All elements correct in light mode
- [x] No broken color tokens — background `#F8F8FF`, text readable, form styled correctly ✅

### Step 9 — Update TO-DO list

**Outcome:** Succeeded.

Marked complete in `docs/CircaLog-TO-DO-list.md`:

- `[x] 🟢 Design and build coming soon page`
- `[x] 🟢 App name + tagline`
- `[x] 🟢 "Get notified at launch" email capture (optional, simple)`

Left as-is (out of scope):

- `[ ] 🟢 Brief description of what CircaLog is and who it's for`
- `[ ] 🟢 Link to /log for early access`

---

## Deviations from Task Instructions

| Step | Deviation | Reason |
|---|---|---|
| Step 3 | Supabase table not created automatically | MCP server is authenticated to a different Supabase account; `apply_migration` and `execute_sql` both returned permission denied for project `iarozmvqcsrkdgytqzws` |

No other deviations.

---

## Files Created or Modified

| Action | File |
|---|---|
| Created | `src/lib/supabase/client.ts` |
| Created | `src/components/ui/EmailCapture.tsx` |
| Modified | `src/pages/ComingSoon.tsx` |
| Modified | `docs/CircaLog-TO-DO-list.md` |
| Modified | `package.json` (npm install added `@supabase/supabase-js@2.106.2`) |
| Modified | `package-lock.json` |

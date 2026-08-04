# Session Report — Waitlist RLS Fix & Enter-Key Submit

**Date:** 04-aug-2026
**Phase:** Phase 1 — Coming Soon page

## Context

Mahmoud received a Supabase inactivity-pause warning email and tried the
usual workaround (adding a test email via the coming-soon waitlist form) to
keep the free-tier project active. The submission failed with a `403
Forbidden` on `POST /rest/v1/waitlist`, console error `Something went wrong.
Please try again.`

## Investigation

- ✅ Checked `public.waitlist` table config via Supabase MCP tools
  (`list_tables`, `get_advisors`, `get_logs`, `execute_sql`).
- ⚠️ Initial hypothesis (transient backend flakiness tied to the inactivity
  scan) was **wrong** — direct `curl` requests with the deployed anon key
  succeeded consistently (`201 Created`), while the browser consistently
  failed. That inconsistency was the signal that something browser-specific
  was going on, not backend flakiness.
- ✅ Root cause found: `public.waitlist` only had an RLS policy and grant for
  the `anon` role. When Mahmoud tested from a browser where he was already
  logged into the CircaLog app, `supabase-js` automatically attaches the
  active session's JWT (role `authenticated`) instead of the anon key to
  every request — including the public waitlist form. The `authenticated`
  role had no policy and no grant on `waitlist`, so every insert from a
  logged-in browser hit `permission denied for table waitlist` /
  `new row violates row-level security policy`.
  - Confirmed independently: `sobhy0101@gmail.com` succeeded from a private/
    incognito window (no session → `anon` role → existing policy applied)
    and failed from the normal logged-in window.

## Fix

Two-step fix applied directly via Supabase MCP (`execute_sql`) against the
live project (no local migration file exists for this table's original
creation, so this was applied as a direct SQL statement to match the existing
pattern):

```sql
CREATE POLICY "Allow authenticated insert" ON public.waitlist
  FOR INSERT TO authenticated
  WITH CHECK (true);

GRANT INSERT ON public.waitlist TO authenticated;
```

- ⚠️ First attempt only added the `CREATE POLICY` and missed the `GRANT`.
  `CREATE POLICY` controls row-level visibility but does not itself grant
  table-level access — the role still needs the base `GRANT`. This was
  caught when Mahmoud retested and still got a 403 from his logged-in
  browser. Added the missing `GRANT INSERT` and re-verified via
  `SET ROLE authenticated; INSERT ...` before confirming.
- ✅ Verified fix: `sobhy0101@gmail.com` submitted successfully from
  Mahmoud's normal (logged-in) browser after the `GRANT` was added.

## Enter-Key Submit

Added keyboard support to the waitlist form per Mahmoud's request — the form
uses a `<div>` + `onClick` pattern (not a native `<form>`), so it did not
submit on `Enter` by default.

`src/components/ui/EmailCapture.tsx`:

```tsx
onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
```

Added to the email `<input>`, calling the existing `handleSubmit` function —
identical behavior to clicking "Notify me".

## Verification

- ✅ Started dev server (`npm run dev`, port 5173) per `.claude/skills/run/SKILL.md`.
- ✅ Playwright script: filled the email input, pressed `Enter`, confirmed
  the `"You're on the list."` success message rendered and no error message
  appeared.
- ✅ Screenshot reviewed visually — success state confirmed.
- ✅ Test row (`enter-key-test@circalog.local`) deleted from `public.waitlist`
  after verification.
- ✅ Test/scratch files (`enter-key-test.cjs`, `enter-key-result.png`) removed
  — never committed, per `tasks/screenshots/` being gitignored.

## Final File List

- Modified: `src/components/ui/EmailCapture.tsx` (added `onKeyDown` handler)
- Database: `public.waitlist` — added RLS policy `Allow authenticated insert`
  and `GRANT INSERT ... TO authenticated` (live Supabase project, not
  tracked in a local migration file — no existing migration file covers this
  table's creation either)

## Note for Future Sessions

`public.waitlist` has no corresponding migration file in the repo — its
schema and policies were presumably created directly via the dashboard or an
earlier untracked session. If a `supabase/migrations/` directory gets
introduced later, this table's current state (columns, RLS policies, grants)
should be captured in a baseline migration to avoid drift between the repo
and the live project.

# Handoff: 20-Oct-2026, 13:39 (Cairo time)

## Supabase Data API grants change (2026-10-30)

From 2026-10-30, new tables in `public` no longer get Data API grants
automatically. Any new table needs explicit `GRANT`s for `anon`,
`authenticated` and `service_role`, or supabase-js returns
"permission denied". This also applies to schema rebuilds from migrations
(new projects, preview branches, local `supabase db reset`).

**The live app is not affected.** Existing tables keep their grants.

This check was done outside the repo (Supabase dashboard/MCP and a
read-only `supabase migration list`). This entry is the record of it.

---

## Live database findings (read-only, 2026-10-20)

- Project: `circalog`, ref `iarozmvqcsrkdgytqzws`, eu-west-1, Postgres 17,
  ACTIVE_HEALTHY. Only project in the account.
- Tables in `public`, all with RLS on: `profiles` (0 rows),
  `sleep_entries` (55 rows), `waitlist` (0 rows).
- The new behavior already applies to this project. Default privileges for
  tables `postgres` creates in `public` give `anon`, `authenticated` and
  `service_role` only `Dxtm` (TRUNCATE, REFERENCES, TRIGGER, MAINTAIN).
  No SELECT, INSERT, UPDATE or DELETE. Likely why
  `grant_authenticated_profiles_table_access` (2026-06-27) was needed.
- Remote migration history (4 entries):
  - `20260601082355` create_waitlist_table
  - `20260607104107` rename_sleep_sessions_to_sleep_entries
  - `20260610194827` create_handle_new_user_trigger
  - `20260627074333` grant_authenticated_profiles_table_access
- No migration creates `sleep_sessions`/`sleep_entries` or `profiles`.
  They were made in the dashboard, so migrations cannot rebuild the schema.
- Table grants (SELECT/INSERT/UPDATE/DELETE level):

  | Table | anon | authenticated | service_role |
  |---|---|---|---|
  | `profiles` | none | S, I, U, D | none |
  | `sleep_entries` | S, I, U, D | S, I, U, D | none |
  | `waitlist` | S, I | I | none |

- RLS policies:
  - `profiles`: "profiles: owner access", ALL, `auth.uid() = id`
  - `sleep_entries`: "sleep_entries: owner access", ALL,
    `auth.uid() = user_id`
  - `waitlist`: "Allow anonymous insert" (anon, INSERT, true) and
    "Allow authenticated insert" (authenticated, INSERT, true)
- Side findings (not caused by the change):
  1. `service_role` cannot read or write any table.
  2. `anon` has full DML on `sleep_entries`. RLS blocks it
     (`auth.uid()` is null for anon), but revoking would add a second layer.

---

## Local folder findings

**Supabase folder:**

- `supabase/` holds only `config.toml`, `.gitignore` and `.temp/`.
  Only `config.toml` and `.gitignore` are tracked in git.
- Linked to the right project: `.temp/project-ref` and
  `.temp/linked-project.json` both say `iarozmvqcsrkdgytqzws` (`circalog`).
  `config.toml` has `project_id = "CircaLog"` (local stack name only).
- **No `supabase/migrations/` folder.** Git history has never had one.
- **No `supabase/seed.sql`**, although `config.toml` lists
  `sql_paths = ["./seed.sql"]`.
- No `.sql` files anywhere in the repo.

**Migration comparison:**

- All 4 remote versions have no local file.
- No local files without a remote version.
- No name mismatches (nothing local to compare).
- `supabase migration list --linked` (CLI v2.107.0) confirms it: the
  Local column is empty for all 4 rows.

**Where the SQL lives instead (task docs and reports, not runnable files):**

- `waitlist`: `CREATE TABLE`, `ENABLE ROW LEVEL SECURITY` and
  "Allow anonymous insert" in `tasks/CC_TASK_Phase1_ComingSoon.md` and
  `tasks/cc-reports/REPORT_phase1-coming-soon_01-jun-2026.md`.
  "Allow authenticated insert" and `GRANT INSERT ... TO authenticated` in
  `tasks/cc-reports/REPORT_phase1-waitlist-rls-and-enter-key_04-aug-2026.md`
  (applied to the live project directly, not as a migration). The
  `anon` SELECT/INSERT grants appear nowhere in the repo.
- `sleep_sessions` / `sleep_entries`: no `CREATE TABLE` anywhere. The
  rename and `ALTER POLICY` are in `tasks/CC_TASK_Phase1_SyncService.md`.
  The `GRANT ... TO anon, authenticated` and the `session_type` CHECK
  constraint fix were run by hand in the SQL Editor (see
  `tasks/HANDOFF_07-jun-2026.md`). That manual grant is where the anon
  DML on `sleep_entries` came from. `tasks/sleep_sessions_verification.md`
  documents the old table's policy, not its `CREATE`.
- `profiles`: no `CREATE TABLE`, policy, grant or `handle_new_user` SQL
  anywhere in the repo.

**Service-role usage:**

- `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local` (git-ignored).
- No code reads it. `src/` only reads `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY`. No `supabase/functions/`, no `api/` folder,
  no scripts folder, and `vercel.json` only has an SPA rewrite.
- So side finding 1 is a note, not a live bug, for now.

**Tables the client uses:**

- `waitlist`: `src/components/ui/EmailCapture.tsx`
- `sleep_entries`: `src/lib/db/sleepEntryService.ts`,
  `src/lib/supabase/syncService.ts` (3 calls)
- No `.rpc()`, storage or realtime calls. No unknown table names.
  `profiles` is not used by the client.

---

## What a full rebuild would need (described only, nothing written)

1. Baseline for `sleep_entries`: `CREATE TABLE` matching the live columns,
   the `session_type` CHECK (`'main'`/`'nap'`), `ENABLE ROW LEVEL SECURITY`,
   the owner-access policy, and explicit `GRANT`s.
2. Baseline for `profiles`: `CREATE TABLE`, RLS, owner-access policy,
   `GRANT`s. The existing `handle_new_user` trigger migration depends on it,
   so it must sort before `20260610194827`.
3. `waitlist` grants: add the missing `anon` SELECT/INSERT grant (only the
   `authenticated` INSERT is documented anywhere).
4. Sequencing: the rename migration (`20260607104107`) expects
   `sleep_sessions` to exist. A rebuild needs either a pre-rename baseline
   for `sleep_sessions`, or a squashed baseline that replaces the history.
   Easiest source of truth: a read-only `supabase db dump --linked
   --schema public` reviewed by hand.
5. Pull the 4 remote migrations into `supabase/migrations/` so local and
   remote history match.

---

## Open items (no decisions made yet)

- a) Baseline migration for `profiles` and `sleep_entries`.
- b) Decide on `service_role` grants (nothing uses it today).
- c) Optionally revoke anon DML on `sleep_entries`.
- d) Any future table's migration must include its `GRANT`s.
- Also noted: `config.toml` points at a `seed.sql` that does not exist,
  and `profiles` still has 0 rows even though the trigger migration ran
  on 2026-06-10.

## Supabase project ref

`iarozmvqcsrkdgytqzws` (permanent)

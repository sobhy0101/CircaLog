# Session Report — Supabase Squashed Baseline Migration

**Date:** 20-oct-2026
**Phase:** Phase 1 — Database hygiene (Supabase Data API grants change)

## Context

From 2026-10-30, Supabase no longer gives new tables in `public` Data API
grants automatically. `tasks/HANDOFF_20-oct-2026.md` found that the repo had
no `supabase/migrations/` folder at all, and that the 4 migrations recorded
on the live project could not rebuild the schema (`profiles` and
`sleep_sessions` were created in the dashboard). Any rebuild (new project,
preview branch, local `supabase db reset`) would have failed, and after
2026-10-30 every table would also have had no API access.

Goal: one squashed baseline migration that rebuilds the whole `public` schema
with explicit grants, and a live migration history that points at it instead
of the 4 broken entries.

Mahmoud approved the plan in stages: steps 1, 2 and 5 first (read-only plus
local files), then step 4 (live history repair) after reviewing the exact
commands.

## Steps

### 1. Read the live schema (read-only) — ✅

- ✅ `supabase db dump --linked --schema public` → scratch file (241 lines).
- ✅ Catalog queries via Supabase MCP (`execute_sql`, `SELECT` only): triggers,
  event triggers, functions, function/table ACLs, default privileges, row
  counts.
- ⚠️ Found two objects a public-schema dump does not capture, both added by
  hand to the baseline:
  - `on_auth_user_created` trigger on `auth.users` → `public.handle_new_user()`.
  - `ensure_rls` event trigger → `public.rls_auto_enable()` (Supabase platform
    feature that turns on RLS for every new table in `public`).
- ✅ Resolved the handoff's open question "profiles has 0 rows": live counts
  are `profiles` 2, `auth.users` 2, `sleep_entries` 55, `waitlist` 5. The
  handoff's zeros were planner estimates, not real counts. The signup trigger
  works.

### 2. Write the baseline — ✅ (⚠️ one adjustment after testing)

`supabase/migrations/20261020140000_baseline.sql` contains:

- Functions `handle_new_user()` and `rls_auto_enable()`.
- Tables `profiles`, `sleep_entries`, `waitlist` with exact live columns,
  generated column, CHECKs (`session_type` in `'main'`/`'nap'`, `quality`
  1–5), keys, FKs to `auth.users` and the `sleep_sessions_user_start` index.
  Old `sleep_sessions_*` constraint names kept on purpose (live names).
- RLS enabled on all 3 tables and the 4 live policies.
- Per-table `REVOKE ALL` from `anon`, `authenticated`, `service_role`, then
  `GRANT` exactly the live privileges. This makes the result independent of
  each environment's default privileges.
- Default privileges for `postgres` in `public` matching live (new tables get
  only `REFERENCES, TRIGGER, TRUNCATE, MAINTAIN` for API roles).
- The two hand-added triggers. The event trigger is wrapped in an
  `IF NOT EXISTS` check, because Supabase may already create it on new
  projects.

The baseline mirrors live **including known weaknesses**, so marking it
"applied" on live is truthful. Fixes are separate follow-up migrations (see
Open Items).

⚠️ Adjustment: the first local comparison showed the local Postgres image
grants API roles default `UPDATE` on future **sequences**, which live does
not. Added `ALTER DEFAULT PRIVILEGES ... REVOKE ALL ON TABLES/SEQUENCES FROM
anon, authenticated, service_role` before the default-privilege grants.

### 3. Test the rebuild locally — ✅ (⚠️ CLI quirks)

- ✅ Fresh local stack (`supabase stop --no-backup` then `supabase start`)
  applied the baseline with no errors.
- ✅ `supabase db dump --local --schema public` compared with the live dump:
  **identical** (137 non-blank lines each).
- ✅ Behavior tests (`verify_baseline.sql` in the session scratchpad, run
  inside `BEGIN … ROLLBACK`):

  | Test | Result |
  |---|---|
  | `on_auth_user_created` and `ensure_rls` exist | ✅ 1 each |
  | Inserting 2 `auth.users` creates 2 `profiles` | ✅ |
  | User A sees only own `sleep_entries` / `profiles` | ✅ 1 / 1 |
  | User A inserts own nap | ✅ |
  | User A inserts row for user B | ✅ blocked by RLS |
  | `session_type = 'siesta'` | ✅ blocked by CHECK |
  | anon inserts into `waitlist` | ✅ |
  | anon reads `waitlist` / `sleep_entries` | ✅ 0 rows / 0 rows |
  | `service_role` reads `sleep_entries` | ✅ permission denied (matches live) |
  | New table gets RLS on | ✅ |
  | New table: anon/authenticated/service_role `SELECT` | ✅ false/false/false |

- ⚠️ Docker Desktop was installed per-user and was not on PATH in the
  already-open shell. Worked around by prepending
  `C:\Users\sobhy\AppData\Local\Programs\DockerDesktop\resources\bin` per
  command. Restarting VS Code fixes it.
- ⚠️ Keeping memory low (Mahmoud's request):
  - Unquoted `-x a,b,c` in PowerShell is split into separate arguments, so
    the first start ran every service (~1.9 GB). The list must be quoted.
  - With `kong` excluded, the CLI health check fails and tears the stack down.
    Needs `--ignore-health-check`.
  - Even with a quoted list, CLI v2.107.0 still started `analytics`,
    `storage`, `rest`, `inbucket` and `pg_meta`. Stopped them with
    `docker stop`. Final test ran on `db` + `auth` only (~110 MB).
  - Working command for next time:

```powershell
supabase start --ignore-health-check --exclude "analytics,edge-runtime,functions,imgproxy,inbucket,kong,meta,realtime,rest,storage,studio,vector"
docker stop supabase_analytics_CircaLog supabase_storage_CircaLog supabase_rest_CircaLog supabase_inbucket_CircaLog supabase_pg_meta_CircaLog
```

- ✅ Local stack stopped at the end (`supabase stop`).

### 4. Repair live migration history — ✅ (approved by Mahmoud)

1. ✅ Backup (read-only):
   `supabase db dump --linked --data-only --schema supabase_migrations` →
   `tasks/db-backups/schema_migrations_before_baseline_20-oct-2026.sql`
   (all 4 rows, with their full SQL). To restore the old history, run that
   file's `INSERT` against the project (after removing the baseline row).
2. ✅ Ran the two repair commands:

   ```powershell
   supabase migration repair --status reverted 20260601082355 20260607104107 20260610194827 20260627074333 --linked
   supabase migration repair --status applied 20261020140000 --linked
   ```

   Output: `Repaired migration history: [...] => reverted` and
   `[20261020140000] => applied`.
3. ✅ Checks:
   - `supabase migration list --linked`: one row, `20261020140000` on both
     Local and Remote.
   - `supabase db push --dry-run --linked`: `Remote database is up to date.`
   - Live data and grants unchanged: `sleep_entries` 55, `profiles` 2,
     `waitlist` 5, table ACLs identical to the pre-change read.

Only `supabase_migrations.schema_migrations` changed on the live project. No
schema, data, policy or grant was changed, and the baseline SQL was never run
against live.

### 5. Tidy-ups — ✅

- ✅ Created empty `supabase/seed.sql` (`config.toml` already pointed at it).
- ✅ The 4 old migrations are not kept as files. The baseline replaces them,
  and their SQL is preserved in the backup file and the task docs.

## Packages Installed

None. Docker Desktop 29.9.1 was installed by Mahmoud before the session.
Supabase CLI stays at v2.107.0 (v2.121.0 available, not needed).

## Dependency Warnings

None.

## Build Output

Not applicable: no app code changed.

## Deviations

- Step 3 local test: `--exclude` did not fully work, so 5 containers were
  stopped manually with `docker stop` (see above).
- Step 4 backup: planned as a saved `SELECT`; used `supabase db dump
  --data-only` instead, because it writes exact, correctly escaped SQL
  straight to a file.

## Open Items

- b) `service_role` has no table access. Nothing uses it today. Decide before
  any server-side code (Edge Function, script) needs it.
- c) Recommended: a follow-up migration revoking anon DML on
  `sleep_entries` (RLS already blocks it; this adds a second layer).
- d) **Rule from now on:** every migration that creates a table must include
  its `GRANT`s. The live project and the baseline's default privileges no
  longer give API roles `SELECT/INSERT/UPDATE/DELETE` on new tables.
- New schema changes must go through `supabase/migrations/` and
  `supabase db push`, not the dashboard or SQL Editor. Otherwise the baseline
  drifts from live again.
- `tasks/db-backups/` is git-ignored (Mahmoud's decision). The backup file
  stays on disk only; it is not in the repo.

## Final File List

Created:

- `supabase/migrations/20261020140000_baseline.sql`
- `supabase/seed.sql`
- `tasks/db-backups/schema_migrations_before_baseline_20-oct-2026.sql`
  (git-ignored, not committed)
- `tasks/cc-reports/REPORT_phase1-db-baseline_20-oct-2026.md`

Modified: `.gitignore` (added `tasks/db-backups/`).

Committed alongside: `tasks/HANDOFF_20-oct-2026.md` (written before this
session).

Live project changed: `supabase_migrations.schema_migrations` only (4 rows
removed, 1 row added).

-- =============================================================================
-- CircaLog baseline schema (squashed)
-- =============================================================================
-- Replaces the old remote migration history (20260601082355,
-- 20260607104107, 20260610194827, 20260627074333). Those migrations could not
-- rebuild the schema on their own: profiles and sleep_sessions/sleep_entries
-- were created in the dashboard.
--
-- Source of truth: `supabase db dump --linked --schema public` plus catalog
-- queries on the live project, 2026-10-20. This file mirrors the live schema
-- exactly, including known weaknesses (anon DML on sleep_entries, no
-- service_role table access). Fix those in their own follow-up migrations,
-- not here.
--
-- Grants: from 2026-10-30 Supabase no longer grants Data API access to new
-- tables automatically. Every table below therefore REVOKEs all privileges
-- first and then GRANTs exactly what the live project has. That makes the
-- result the same whatever the environment's default privileges are.
-- =============================================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;


-- -----------------------------------------------------------------------------
-- Functions
-- -----------------------------------------------------------------------------

-- Creates a profiles row for every new auth user (fired by the trigger on
-- auth.users at the bottom of this file). SECURITY DEFINER runs it with the
-- owner's rights, so it can write to profiles even though the signing-up
-- user has no session yet.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- Supabase platform safety net: turns on RLS automatically for any table
-- created in public. Called by the `ensure_rls` event trigger below.
CREATE OR REPLACE FUNCTION public.rls_auto_enable() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;

ALTER FUNCTION public.rls_auto_enable() OWNER TO postgres;


-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL,
    email text,
    full_name text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.profiles OWNER TO postgres;

-- Constraint and index names still say sleep_sessions: the table was renamed
-- to sleep_entries on 2026-06-07 but its constraints kept their names.
CREATE TABLE IF NOT EXISTS public.sleep_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    sleep_start_utc timestamp with time zone NOT NULL,
    wake_utc timestamp with time zone NOT NULL,
    -- Computed by Postgres on every write; clients never set it.
    duration_minutes integer GENERATED ALWAYS AS (((EXTRACT(epoch FROM (wake_utc - sleep_start_utc)) / (60)::numeric))::integer) STORED,
    quality smallint NOT NULL,
    session_type text DEFAULT 'main'::text NOT NULL,
    cycle_number integer,
    notes text,
    had_dreams boolean,
    dream_notes text,
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    bed_time_utc timestamp with time zone,
    iana_timezone text NOT NULL,
    interruptions jsonb,
    medications jsonb,
    CONSTRAINT sleep_sessions_pkey PRIMARY KEY (id),
    CONSTRAINT sleep_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT sleep_entries_session_type_check CHECK ((session_type = ANY (ARRAY['main'::text, 'nap'::text]))),
    CONSTRAINT sleep_sessions_quality_check CHECK (((quality >= 1) AND (quality <= 5)))
);

ALTER TABLE public.sleep_entries OWNER TO postgres;

CREATE INDEX IF NOT EXISTS sleep_sessions_user_start
    ON public.sleep_entries USING btree (user_id, sleep_start_utc DESC);

CREATE TABLE IF NOT EXISTS public.waitlist (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT waitlist_pkey PRIMARY KEY (id),
    CONSTRAINT waitlist_email_key UNIQUE (email)
);

ALTER TABLE public.waitlist OWNER TO postgres;


-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- No FOR clause means the policy covers SELECT, INSERT, UPDATE and DELETE.
CREATE POLICY "profiles: owner access" ON public.profiles
    USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));

CREATE POLICY "sleep_entries: owner access" ON public.sleep_entries
    USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Allow anonymous insert" ON public.waitlist
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow authenticated insert" ON public.waitlist
    FOR INSERT TO authenticated WITH CHECK (true);


-- -----------------------------------------------------------------------------
-- Grants (explicit; see header)
-- -----------------------------------------------------------------------------

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- profiles: only signed-in users can read/write (RLS limits them to their own row).
REVOKE ALL ON TABLE public.profiles FROM anon, authenticated, service_role;
GRANT REFERENCES, TRIGGER, TRUNCATE, MAINTAIN ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT REFERENCES, TRIGGER, TRUNCATE, MAINTAIN ON TABLE public.profiles TO service_role;

-- sleep_entries: anon has full DML here (from a manual grant on 2026-06-07).
-- RLS blocks it because auth.uid() is null for anon. Revoking it is a
-- separate decision, kept out of this baseline on purpose.
REVOKE ALL ON TABLE public.sleep_entries FROM anon, authenticated, service_role;
GRANT ALL ON TABLE public.sleep_entries TO anon;
GRANT ALL ON TABLE public.sleep_entries TO authenticated;
GRANT REFERENCES, TRIGGER, TRUNCATE, MAINTAIN ON TABLE public.sleep_entries TO service_role;

-- waitlist: anyone can join. anon also has SELECT, but no SELECT policy
-- exists, so RLS returns no rows.
REVOKE ALL ON TABLE public.waitlist FROM anon, authenticated, service_role;
GRANT SELECT, INSERT, REFERENCES, TRIGGER, TRUNCATE, MAINTAIN ON TABLE public.waitlist TO anon;
GRANT INSERT, REFERENCES, TRIGGER, TRUNCATE, MAINTAIN ON TABLE public.waitlist TO authenticated;
GRANT REFERENCES, TRIGGER, TRUNCATE, MAINTAIN ON TABLE public.waitlist TO service_role;

-- Default privileges for objects postgres creates in public later. This
-- matches the live project's post-2026-10-30 behavior: new tables get no
-- SELECT/INSERT/UPDATE/DELETE for API roles until a migration grants them.
-- The REVOKEs clear whatever defaults the environment's image ships with
-- (the local image, for example, grants UPDATE on sequences), so every
-- environment ends up like the live project.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT REFERENCES, TRIGGER, TRUNCATE, MAINTAIN ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT REFERENCES, TRIGGER, TRUNCATE, MAINTAIN ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT REFERENCES, TRIGGER, TRUNCATE, MAINTAIN ON TABLES TO service_role;


-- -----------------------------------------------------------------------------
-- Triggers outside public (not captured by a public-schema dump)
-- -----------------------------------------------------------------------------

-- Signup hook: every new auth.users row gets a matching profiles row.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-enable RLS on new public tables. Event triggers are database-wide,
-- and Supabase may already create this one on new projects, so only create
-- it if it is missing.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_event_trigger WHERE evtname = 'ensure_rls') THEN
    CREATE EVENT TRIGGER ensure_rls ON ddl_command_end
      WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      EXECUTE FUNCTION public.rls_auto_enable();
  END IF;
END;
$$;

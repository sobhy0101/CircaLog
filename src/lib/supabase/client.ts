// client.ts — Supabase client singleton for CircaLog.
//
// VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local (local)
// and as environment variables in Vercel (production).
// The anon key is safe to expose in the browser — RLS policies on every
// table control what anonymous clients can actually do.
//
// Returns null when vars are absent so callers degrade gracefully instead of
// crashing the entire app (avoids the "supabaseUrl is required" throw).

import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string | undefined
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase = supabaseUrl && supabaseAnon
  ? createClient(supabaseUrl, supabaseAnon)
  : null

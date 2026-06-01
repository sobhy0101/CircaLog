// client.ts — Supabase client singleton for CircaLog.
//
// VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local.
// They are never committed to version control.
// The anon key is safe to expose in the browser — RLS policies on every
// table control what anonymous clients can actually do.

import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnon)

// EmailCapture.tsx — waitlist sign-up form for the Coming Soon page.
//
// States: idle → loading → success (form hidden) | error (inline message)
// Uses a <div>+onClick rather than a <form> element per spec.
// Duplicate email detection uses Postgres error code '23505'.

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

type FormState = 'idle' | 'loading' | 'success' | 'error-duplicate' | 'error-other'

// Basic email format check: must contain '@' and a '.' after the '@'.
function isValidEmail(value: string): boolean {
  const atIdx = value.indexOf('@')
  if (atIdx < 1) return false
  return value.indexOf('.', atIdx) > atIdx + 1
}

export default function EmailCapture() {
  const [email, setEmail]       = useState('')
  const [state, setState]       = useState<FormState>('idle')
  const [inputError, setInputError] = useState('')

  async function handleSubmit() {
    // Client-side validation — no network call on bad input.
    if (!email.trim()) {
      setInputError('Please enter your email address.')
      return
    }
    if (!isValidEmail(email.trim())) {
      setInputError('Please enter a valid email address.')
      return
    }
    setInputError('')
    setState('loading')

    // supabase is null when env vars are not configured — treat as server error.
    if (!supabase) {
      setState('error-other')
      return
    }

    const { error } = await supabase
      .from('waitlist')
      .insert({ email: email.trim() })

    if (!error) {
      setState('success')
      return
    }

    // Postgres unique-constraint violation: email already registered.
    if ((error as { code?: string }).code === '23505') {
      setState('error-duplicate')
    } else {
      setState('error-other')
    }
  }

  if (state === 'success') {
    return (
      <p className="text-circa-text-secondary text-sm">
        You're on the list.
      </p>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-sm">
      <div className="flex w-full gap-2">
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setInputError('') }}
          placeholder="your@email.com"
          disabled={state === 'loading'}
          className="
            flex-1 px-4 py-2 rounded-lg text-sm
            bg-circa-surface border border-circa-border
            text-circa-text-primary placeholder:text-circa-text-muted
            focus:outline-none focus:ring-2 focus:ring-circa-accent
            disabled:opacity-50
            transition-colors duration-150
          "
        />
        <button
          onClick={handleSubmit}
          disabled={state === 'loading'}
          className="
            px-4 py-2 rounded-lg text-sm font-medium
            bg-circa-accent text-circa-bg
            hover:bg-circa-accent-light
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-circa-accent
            disabled:opacity-50
            transition-colors duration-150 whitespace-nowrap
          "
        >
          {state === 'loading' ? 'Sending...' : 'Notify me'}
        </button>
      </div>

      {/* Client-side validation error */}
      {inputError && (
        <p className="text-sm text-red-600 dark:text-red-400 self-start">
          {inputError}
        </p>
      )}

      {/* Supabase duplicate-email error */}
      {state === 'error-duplicate' && (
        <p className="text-sm text-red-600 dark:text-red-400 self-start">
          This email is already registered.
        </p>
      )}

      {/* Supabase other error */}
      {state === 'error-other' && (
        <p className="text-sm text-red-600 dark:text-red-400 self-start">
          Something went wrong. Please try again.
        </p>
      )}
    </div>
  )
}

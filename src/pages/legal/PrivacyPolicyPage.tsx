// PrivacyPolicyPage — placeholder until the full policy is drafted.
// Wired to /log/privacy from the side drawer.

import { useNavigate } from 'react-router-dom'

export default function PrivacyPolicyPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-full bg-circa-bg text-circa-text-primary">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-circa-border">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="
            p-2 -ml-2 rounded-md
            text-circa-text-secondary
            hover:text-circa-text-primary
            hover:bg-circa-surface-raised
            transition-colors
          "
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="font-heading text-lg font-semibold text-circa-text-primary tracking-wide">
          Privacy Policy
        </h1>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-5 text-center">
        <div className="p-4 rounded-full bg-circa-accent-subtle">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"
            className="text-circa-accent-light" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div className="space-y-2 max-w-xs">
          <h2 className="text-xl font-semibold text-circa-text-primary">Privacy Policy</h2>
          <p className="text-sm text-circa-text-secondary leading-relaxed">
            The full Privacy Policy will be published before the public launch of CircaLog.
            It will cover how your sleep data is stored, processed, and protected.
          </p>
        </div>
      </div>

    </div>
  )
}

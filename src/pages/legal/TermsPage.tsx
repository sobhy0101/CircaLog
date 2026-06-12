// TermsPage — placeholder until the full Terms & Conditions are drafted.
// Wired to /log/terms from the side drawer.

import { useNavigate } from 'react-router-dom'

export default function TermsPage() {
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
          Terms &amp; Conditions
        </h1>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-5 text-center">
        <div className="p-4 rounded-full bg-circa-accent-subtle">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"
            className="text-circa-accent-light" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="8" y1="13" x2="16" y2="13" />
            <line x1="8" y1="17" x2="12" y2="17" />
          </svg>
        </div>
        <div className="space-y-2 max-w-xs">
          <h2 className="text-xl font-semibold text-circa-text-primary">Terms &amp; Conditions</h2>
          <p className="text-sm text-circa-text-secondary leading-relaxed">
            The full Terms &amp; Conditions will be published before the public launch of CircaLog.
          </p>
        </div>
      </div>

    </div>
  )
}

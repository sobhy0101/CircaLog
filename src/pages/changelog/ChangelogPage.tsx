import { useNavigate } from 'react-router-dom'
// PARSED_ENTRIES is parsed once at module load in useChangelog.ts — importing
// it here avoids re-parsing the changelog on every render of this page.
import { PARSED_ENTRIES } from '@/hooks/useChangelog'

export default function ChangelogPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-full bg-circa-bg text-circa-text-primary">

      {/* Header — same pattern as ExportPage */}
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
        <div>
          <h1 className="font-heading text-lg font-semibold text-circa-text-primary tracking-wide">
            What's New
          </h1>
          <p className="text-xs text-circa-text-muted">Version {__APP_VERSION__}</p>
        </div>
      </div>

      {/* Scrollable entry list — same rendering logic as ChangelogModal,
          without the fixed overlay wrapper or the "Got it" footer button */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 max-w-lg mx-auto w-full">
        {PARSED_ENTRIES.map(entry => (
          <div key={entry.version}>
            {/* Version + date */}
            <div className="flex items-baseline gap-2 mb-3">
              <span className="font-heading font-semibold text-circa-accent">
                {entry.version}
              </span>
              <span className="text-xs text-circa-text-muted">
                {entry.date}
              </span>
            </div>

            {/* New */}
            {entry.new && entry.new.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-circa-text-muted mb-1.5">
                  New
                </p>
                <ul className="space-y-1">
                  {entry.new.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-circa-text-secondary">
                      <span className="text-circa-accent shrink-0">+</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improved */}
            {entry.improved && entry.improved.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-circa-text-muted mb-1.5">
                  Improved
                </p>
                <ul className="space-y-1">
                  {entry.improved.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-circa-text-secondary">
                      <span className="text-circa-text-muted shrink-0">↑</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Fixed */}
            {entry.fixed && entry.fixed.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-circa-text-muted mb-1.5">
                  Fixed
                </p>
                <ul className="space-y-1">
                  {entry.fixed.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-circa-text-secondary">
                      <span className="text-green-400 shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  )
}

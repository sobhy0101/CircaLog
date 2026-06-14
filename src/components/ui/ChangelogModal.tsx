import type { ChangelogEntry } from '@/hooks/useChangelog'

interface ChangelogModalProps {
  isOpen: boolean
  entries: ChangelogEntry[]
  currentVersion: string
  onClose: () => void
}

export default function ChangelogModal({ isOpen, entries, currentVersion, onClose }: ChangelogModalProps) {
  if (!isOpen) return null

  return (
    // Full-screen backdrop — z-60 sits above the drawer (z-50)
    <div className="fixed inset-0 z-60 bg-black/70 flex items-end sm:items-center justify-center">

      {/* Modal panel — full width on mobile (bottom sheet), max-w-lg centred on larger screens */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="changelog-title"
        className="
        w-full sm:max-w-lg
        max-h-[85vh]
        bg-circa-surface border border-circa-border
        rounded-t-2xl sm:rounded-2xl
        flex flex-col
        overflow-hidden
      ">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-circa-border shrink-0">
          <div>
            <h2 id="changelog-title" className="font-heading font-semibold text-circa-text-primary">
              What's New
            </h2>
            <p className="text-xs text-circa-text-muted mt-0.5">
              Version {currentVersion}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close changelog"
            className="p-1.5 rounded-md text-circa-text-secondary hover:text-circa-text-primary hover:bg-circa-surface-raised transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6"  x2="6"  y2="18" />
              <line x1="6"  y1="6"  x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable entry list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {entries.map(entry => (
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

        {/* Footer — dismiss button */}
        <div className="shrink-0 px-5 py-4 border-t border-circa-border">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-medium bg-circa-accent text-white hover:opacity-90 transition-opacity"
          >
            Got it
          </button>
        </div>

      </div>
    </div>
  )
}

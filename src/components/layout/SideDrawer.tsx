// SideDrawer.tsx — left-side slide-in drawer with secondary navigation and theme toggle.
// Backdrop closes the drawer when tapped; rendered before the panel so panel sits on top.
// All nav links are placeholder <button> elements — routes don't exist yet in V1.

import ThemeToggle from '@/components/ui/ThemeToggle';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SideDrawer({ isOpen, onClose }: SideDrawerProps) {
  return (
    <>
      {/* Backdrop — closes drawer on tap, rendered below the panel (z-40 < z-50) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer panel */}
      <div
        className={`
          fixed top-0 left-0 h-full w-72 z-50
          bg-circa-surface border-r border-circa-border
          transform transition-transform duration-300 ease-in-out
          flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-circa-border">
          <span className="text-circa-accent font-display text-lg font-semibold tracking-wide">
            CircaLog
          </span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="
              p-1.5 rounded-md
              text-circa-text-secondary
              hover:text-circa-text-primary
              hover:bg-circa-surface-raised
              transition-colors
            "
          >
            {/* X / close icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto py-2" aria-label="Drawer navigation">
          {/* TODO: each button below will become a <Link> to its route in a future batch */}
          <button className="flex items-center gap-3 w-full text-left px-6 py-3 text-sm text-circa-text-primary hover:bg-circa-accent-subtle transition-colors">
            {/* Gear — Settings */}
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </button>

          <button className="flex items-center gap-3 w-full text-left px-6 py-3 text-sm text-circa-text-primary hover:bg-circa-accent-subtle transition-colors">
            {/* Document — Reports */}
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="8" y1="13" x2="16" y2="13" />
              <line x1="8" y1="17" x2="16" y2="17" />
            </svg>
            Reports
          </button>

          <button className="flex items-center gap-3 w-full text-left px-6 py-3 text-sm text-circa-text-primary hover:bg-circa-accent-subtle transition-colors">
            {/* Export — arrow-up-from-box style */}
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Export
          </button>

          <button className="flex items-center gap-3 w-full text-left px-6 py-3 text-sm text-circa-text-primary hover:bg-circa-accent-subtle transition-colors">
            {/* Info circle — About */}
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="8" strokeWidth="3" strokeLinecap="round" />
              <line x1="12" y1="12" x2="12" y2="16" />
            </svg>
            About
          </button>

          <button className="flex items-center gap-3 w-full text-left px-6 py-3 text-sm text-circa-text-primary hover:bg-circa-accent-subtle transition-colors">
            {/* Shield — Privacy Policy */}
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Privacy Policy
          </button>

          <button className="flex items-center gap-3 w-full text-left px-6 py-3 text-sm text-circa-text-primary hover:bg-circa-accent-subtle transition-colors">
            {/* Scroll — Terms & Conditions */}
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="8" y1="13" x2="16" y2="13" />
              <line x1="8" y1="17" x2="12" y2="17" />
            </svg>
            Terms &amp; Conditions
          </button>
        </nav>

        {/* Dark mode toggle row — separated from nav links */}
        <div className="border-t border-circa-border px-6 py-4 flex items-center justify-between">
          <span className="text-circa-text-secondary text-sm">Dark mode</span>
          <ThemeToggle />
        </div>
      </div>
    </>
  );
}

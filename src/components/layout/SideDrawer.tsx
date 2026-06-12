// SideDrawer.tsx — left-side slide-in drawer with primary and secondary navigation.
//
// Structure:
//   Header       — app name + close button
//   Section 1    — primary nav: Log, Chart, History, Insights (mirrors bottom tab bar)
//   Section 2    — secondary nav: Settings, Reports, Export, About, Privacy, Terms
//   Footer       — Dark mode toggle
//
// Backdrop closes the drawer when tapped; rendered before the panel so panel sits on top.
// Nav links use navigate() + onClose() so the drawer closes when the user taps a destination.

import ThemeToggle        from '@/components/ui/ThemeToggle';
import GoogleSignInButton  from '@/components/ui/GoogleSignInButton';
import UserAvatar          from '@/components/ui/UserAvatar';
import { useAuth }         from '@/hooks/useAuth';
import { useNavigate }     from 'react-router-dom';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChangelog: () => void;
}

export default function SideDrawer({ isOpen, onClose, onOpenChangelog }: SideDrawerProps) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

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

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-circa-border">
          {/* Logo — two <picture> elements toggled via CSS dark: variant so they
              respond to the .dark class on <html> instantly, without React state.
              Fallback chain per element: SVG → WebP → PNG. */}
          <picture className="dark:hidden">
            <source srcSet="/images/brand/logo/circalog-light-logo.svg" type="image/svg+xml" />
            <source srcSet="/images/brand/logo/circalog-light-logo@2x.webp" type="image/webp" />
            <img src="/images/brand/logo/circalog-light-logo@2x.png" alt="CircaLog" className="h-7 w-auto" />
          </picture>
          <picture className="hidden dark:block">
            <source srcSet="/images/brand/logo/circalog-dark-logo.svg" type="image/svg+xml" />
            <source srcSet="/images/brand/logo/circalog-dark-logo@2x.webp" type="image/webp" />
            <img src="/images/brand/logo/circalog-dark-logo@2x.png" alt="CircaLog" className="h-7 w-auto" />
          </picture>
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
              <line x1="18" y1="6"  x2="6"  y2="18" />
              <line x1="6"  y1="6"  x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Auth zone ── */}
        {!isLoading && (
          <div className="border-b border-circa-border">
            {user ? <UserAvatar /> : (
              <div className="px-4 py-3">
                <GoogleSignInButton />
              </div>
            )}
          </div>
        )}

        {/* ── Scrollable nav area ── */}
        <nav className="flex-1 overflow-y-auto" aria-label="Drawer navigation">

          {/* Section 1 — Primary navigation (mirrors bottom tab bar) */}
          <div className="py-2">
            <p className="px-6 pt-3 pb-1 text-xs font-semibold uppercase tracking-widest text-circa-text-secondary select-none">
              Navigate
            </p>

            {/* Log */}
            <button
              onClick={() => { navigate('/log'); onClose(); }}
              className="flex items-center gap-3 w-full text-left px-6 py-3 text-sm text-circa-text-primary hover:bg-circa-accent-subtle transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Log
            </button>

            {/* Chart */}
            <button
              onClick={() => { navigate('/log/chart'); onClose(); }}
              className="flex items-center gap-3 w-full text-left px-6 py-3 text-sm text-circa-text-primary hover:bg-circa-accent-subtle transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3"  y="12" width="4" height="10" rx="1" />
                <rect x="10" y="7"  width="4" height="15" rx="1" />
                <rect x="17" y="3"  width="4" height="19" rx="1" />
              </svg>
              Chart
            </button>

            {/* History */}
            <button
              onClick={() => { navigate('/log/history'); onClose(); }}
              className="flex items-center gap-3 w-full text-left px-6 py-3 text-sm text-circa-text-primary hover:bg-circa-accent-subtle transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 15 15" />
              </svg>
              History
            </button>

            {/* Insights */}
            <button
              onClick={() => { navigate('/log/insights'); onClose(); }}
              className="flex items-center gap-3 w-full text-left px-6 py-3 text-sm text-circa-text-primary hover:bg-circa-accent-subtle transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z" />
              </svg>
              Insights
            </button>
          </div>

          {/* Section 2 — Secondary navigation */}
          <div className="border-t border-circa-border py-2">
            <p className="px-6 pt-3 pb-1 text-xs font-semibold uppercase tracking-widest text-circa-text-secondary select-none">
              More
            </p>

            {/* What's New */}
            <button
              onClick={() => { onOpenChangelog(); onClose(); }}
              className="flex items-center gap-3 w-full text-left px-6 py-3 text-sm text-circa-text-primary hover:bg-circa-accent-subtle transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z" />
              </svg>
              What's New
            </button>

            {/* Settings */}
            <button
              onClick={() => { navigate('/log/settings'); onClose(); }}
              className="flex items-center gap-3 w-full text-left px-6 py-3 text-sm text-circa-text-primary hover:bg-circa-accent-subtle transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Settings
            </button>

            {/* Reports */}
            <button
              onClick={() => { navigate('/log/reports'); onClose(); }}
              className="flex items-center gap-3 w-full text-left px-6 py-3 text-sm text-circa-text-primary hover:bg-circa-accent-subtle transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="8" y1="13" x2="16" y2="13" />
                <line x1="8" y1="17" x2="16" y2="17" />
              </svg>
              Reports
            </button>

            {/* Export */}
            <button
              onClick={() => { navigate('/log/export'); onClose(); }}
              className="flex items-center gap-3 w-full text-left px-6 py-3 text-sm text-circa-text-primary hover:bg-circa-accent-subtle transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Export
            </button>

            {/* Import */}
            <button
              onClick={() => { navigate('/log/import'); onClose(); }}
              className="flex items-center gap-3 w-full text-left px-6 py-3 text-sm text-circa-text-primary hover:bg-circa-accent-subtle transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Import
            </button>

            {/* Restore Backup */}
            <button
              onClick={() => { navigate('/log/restore'); onClose(); }}
              className="flex items-center gap-3 w-full text-left px-6 py-3 text-sm text-circa-text-primary hover:bg-circa-accent-subtle transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 .49-4.5" />
              </svg>
              Restore Backup
            </button>

            {/* About */}
            <button
              onClick={() => { navigate('/log/about'); onClose(); }}
              className="flex items-center gap-3 w-full text-left px-6 py-3 text-sm text-circa-text-primary hover:bg-circa-accent-subtle transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8"  x2="12" y2="8"  strokeWidth="3" strokeLinecap="round" />
                <line x1="12" y1="12" x2="12" y2="16" />
              </svg>
              About
            </button>

            {/* Privacy Policy */}
            <button
              onClick={() => { navigate('/log/privacy'); onClose(); }}
              className="flex items-center gap-3 w-full text-left px-6 py-3 text-sm text-circa-text-primary hover:bg-circa-accent-subtle transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Privacy Policy
            </button>

            {/* Terms & Conditions */}
            <button
              onClick={() => { navigate('/log/terms'); onClose(); }}
              className="flex items-center gap-3 w-full text-left px-6 py-3 text-sm text-circa-text-primary hover:bg-circa-accent-subtle transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="8" y1="13" x2="16" y2="13" />
                <line x1="8" y1="17" x2="12" y2="17" />
              </svg>
              Terms &amp; Conditions
            </button>
          </div>

        </nav>

        {/* ── Footer — Dark mode toggle ── */}
        <div className="border-t border-circa-border px-6 py-4 flex items-center justify-between">
          <span className="text-circa-text-secondary text-sm">Dark mode</span>
          <ThemeToggle />
        </div>

      </div>
    </>
  );
}

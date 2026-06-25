// AppShell.tsx — the main PWA application shell (route: /log).
// Holds drawer open/close state and composes BottomTabBar + SideDrawer.

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import BottomTabBar    from '@/components/layout/BottomTabBar';
import SideDrawer      from '@/components/layout/SideDrawer';
import Toast           from '@/components/ui/Toast';
import ChangelogModal  from '@/components/ui/ChangelogModal';
import { useAuth }     from '@/hooks/useAuth';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { useChangelog } from '@/hooks/useChangelog';

export default function AppShell() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { activeToast, clearToast } = useAuth();
  const { status, erroredEntries } = useSyncStatus();
  const [showSyncErrorDetail, setShowSyncErrorDetail] = useState(false);
  const { isOpen: isChangelogOpen, entries, currentVersion, open: openChangelog, close: closeChangelog } = useChangelog();

  return (
    // Outer wrapper fills the viewport
    <div className="min-h-screen bg-circa-bg text-circa-text-primary flex flex-col">

      {/* Auth toast — success / neutral / error (z-60, above drawer at z-50) */}
      {activeToast && (
        <Toast
          variant={activeToast.variant}
          message={activeToast.message}
          onDismiss={clearToast}
          action={activeToast.action}
        />
      )}

      {/* Sync status tab — shows only when signed in.
          Tab shape: flat top anchored to viewport top, rounded bottom corners.
          Sits above page content without floating over it.
          In the error state, the tab becomes a button that toggles the
          diagnostic detail panel below it. */}
      {status !== 'signed-out' && (() => {
        const pillClassName = [
          'fixed top-0 left-1/2 -translate-x-1/2 z-50',
          'flex items-center gap-1.5',
          'rounded-b-xl px-4 py-1.5 text-xs font-medium',
          'border-x border-b transition-colors duration-300 select-none',
          'shadow-md',
          status === 'synced'
            ? 'bg-circa-surface border-circa-border text-circa-text-muted'
            : status === 'offline'
              ? 'bg-circa-surface border-circa-border text-circa-text-secondary'
              : status === 'syncing'
                ? 'bg-circa-warning-subtle border-circa-warning text-circa-warning'
                : status === 'error'
                  ? 'bg-circa-error-subtle border-circa-error text-circa-error cursor-pointer'
                  : /* pending */
                    'bg-circa-accent-subtle border-circa-accent text-circa-accent',
        ].join(' ');

        const pillLabel =
          status === 'synced'  ? 'Synced' :
          status === 'syncing' ? 'Syncing…' :
          status === 'pending' ? 'Pending sync' :
          status === 'error'   ? 'Sync error' :
                                  'Saved — Offline';

        const pillAriaLabel =
          status === 'syncing' ? 'Syncing data' :
          status === 'error'   ? 'Sync error — some entries could not be saved to the cloud. Tap for details.' :
          status === 'pending' ? 'Sync pending' :
          status === 'offline' ? 'Offline — data saved locally' :
                                  'Data synced';

        const pillIcon = status === 'syncing' ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3 w-3"
            style={{ animation: 'spin-slow 1.5s linear infinite' }}
            aria-hidden="true"
          >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M8 16H3v5" />
          </svg>
        ) : status === 'offline' ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3 w-3"
            aria-hidden="true"
          >
            <path d="M2 2l20 20" />
            <path d="M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-8.814" />
            <path d="M21.532 12.6A4.5 4.5 0 0 0 17.5 6a4.49 4.49 0 0 0-1.785.366" />
          </svg>
        ) : status === 'error' ? (
          <span className="h-1.5 w-1.5 rounded-full bg-circa-error" aria-hidden="true" />
        ) : status === 'pending' ? (
          <span className="h-1.5 w-1.5 rounded-full bg-circa-error animate-pulse" aria-hidden="true" />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-circa-text-muted" aria-hidden="true" />
        );

        return (
          <>
            {status === 'error' ? (
              <button
                type="button"
                onClick={() => setShowSyncErrorDetail(prev => !prev)}
                aria-expanded={showSyncErrorDetail}
                aria-label={pillAriaLabel}
                className={pillClassName}
              >
                {pillIcon}
                {pillLabel}
              </button>
            ) : (
              <div aria-live="polite" aria-label={pillAriaLabel} className={pillClassName}>
                {pillIcon}
                {pillLabel}
              </div>
            )}

            {/* Sync error detail panel — only when the pill is tapped open. */}
            {status === 'error' && showSyncErrorDetail && (
              <div
                role="alert"
                className="
                  fixed top-9 left-1/2 -translate-x-1/2 z-50
                  w-[90%] max-w-sm
                  rounded-lg border border-circa-error bg-circa-surface
                  shadow-lg p-3 text-xs text-circa-text-secondary
                "
              >
                <p className="font-medium text-circa-error mb-1.5">
                  {erroredEntries.length === 1
                    ? '1 entry could not sync to the cloud'
                    : `${erroredEntries.length} entries could not sync to the cloud`}
                </p>
                <ul className="space-y-1.5">
                  {erroredEntries.slice(0, 3).map(e => (
                    <li key={e.id} className="leading-snug">
                      Code <span className="font-mono">{e.lastErrorCode ?? 'unknown'}</span>
                      {' — '}
                      {e.lastErrorMessage ?? 'No details available'}
                    </li>
                  ))}
                </ul>
                {erroredEntries.length > 3 && (
                  <p className="mt-1.5 text-circa-text-muted">
                    +{erroredEntries.length - 3} more
                  </p>
                )}
                <p className="mt-2 text-circa-text-muted">
                  This data is safe on your device. Please report the code above
                  to the developer.
                </p>
              </div>
            )}
          </>
        );
      })()}

      {/* Changelog modal — auto-opens on first load after an update (z-60) */}
      <ChangelogModal
        isOpen={isChangelogOpen}
        entries={entries}
        currentVersion={currentVersion}
        onClose={closeChangelog}
      />

      {/* Side drawer (fixed, sits above everything) */}
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} onOpenChangelog={openChangelog} />

      {/* Main scrollable content area — pb-8 clears the 64px tab bar.
          pt-4 clears the fixed sync-status pill (≈16px tall) when signed in. */}
      <main className={`flex-1 overflow-y-auto pb-8${status !== 'signed-out' ? ' pt-4' : ''}`}>
        <Outlet />
      </main>

      {/* Bottom tab bar (fixed to bottom) */}
      <BottomTabBar onOpenDrawer={() => setIsDrawerOpen(true)} />

    </div>
  );
}
